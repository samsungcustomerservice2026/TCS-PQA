/**
 * GoGo Firebase workspace:
 *   gogo_assistant / workspace / qa | culture | chats | learned | feedback | products
 * Visitor chats are isolated by visitorId (never shared across visitors).
 * Learned Q&A + product specs are shared memory for faster, validated answers.
 *
 * Local-first: UI always works from seed + localStorage.
 * Cloud sync is best-effort and skipped when offline / timed out.
 */
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  limit,
} from 'firebase/firestore';
import { GOGO_SEED_QA, GOGO_SEED_CULTURE } from '../lib/gogoKnowledgeSeed';
import {
  normalizeGoGoQuestion,
  questionFingerprint,
  nextExpressionAfterMiss,
} from '../lib/gogoLearning';
import { GOGO_PRODUCT_SEED, findGoGoProduct, formatGoGoProductAnswer, detectSpecFocus, getUnknownProductReply, getSamsungDataUnavailableReply, toFirebaseProductDoc } from '../lib/gogoSamsungProducts';
import {
  isWeakProductSpec,
  needsLiveProductSearch,
  resolveProductQueryWithHistory,
  searchGoGoProductGemini,
  searchGoGoProductLive,
} from '../lib/gogoProductResolve';
import { isVerifiedProductSpecs } from '../lib/gogoGeminiProduct';
import {
  getSamsungOnlyRefuseReply,
  getUnverifiedSamsungModelReply,
  isAcceptableSamsungProduct,
  isNonSamsungBrandText,
} from '../lib/gogoSamsungBrandGuard';
import bulkCatalog from '../data/gogoGsmArenaCatalog.json';

export const GOGO_ROOT = 'gogo_assistant';
export const GOGO_WORKSPACE_DOC = 'workspace';
export const GOGO_QA_SUB = 'qa';
export const GOGO_CULTURE_SUB = 'culture';
export const GOGO_CHATS_SUB = 'chats';
export const GOGO_LEARNED_SUB = 'learned';
export const GOGO_FEEDBACK_SUB = 'feedback';
export const GOGO_PRODUCTS_SUB = 'products';

const VISITOR_KEY = 'gogo_visitor_id';
const LOCAL_CHAT_PREFIX = 'gogo_chat_v1_';
const LOCAL_LEARNED_KEY = 'gogo_learned_cache_v1';
const LOCAL_PRODUCTS_KEY = 'gogo_products_cache_v3';
const CLOUD_TIMEOUT_MS = 1500;
const CHAT_TTL_MS = 24 * 60 * 60 * 1000;

let cloudSyncDisabledUntil = 0;
let seedAttempted = false;
let learnedCache = null;
let learnedCacheAt = 0;
let productsCache = null;
let productsCacheAt = 0;

function localChatKey(visitorId) {
  return `${LOCAL_CHAT_PREFIX}${visitorId}`;
}

function isChatExpired(payload) {
  if (!payload) return true;
  const ts = Date.parse(payload.updatedAt || payload.createdAt || '');
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts > CHAT_TTL_MS;
}

function clearLocalChat(visitorId) {
  if (typeof window === 'undefined' || !visitorId) return;
  try {
    localStorage.removeItem(localChatKey(visitorId));
  } catch { /* ignore */ }
}

function readLocalChat(visitorId) {
  if (typeof window === 'undefined' || !visitorId) return null;
  try {
    const raw = localStorage.getItem(localChatKey(visitorId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.visitorId !== visitorId) return null;
    if (isChatExpired(parsed)) {
      clearLocalChat(visitorId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Sync local-only chat read (never touches Firestore). Expired chats (>24h) are cleared. */
export function loadGoGoChatLocal(visitorId) {
  return readLocalChat(visitorId);
}

function writeLocalChat(visitorId, payload) {
  if (typeof window === 'undefined' || !visitorId) return;
  try {
    const nowIso = new Date().toISOString();
    localStorage.setItem(
      localChatKey(visitorId),
      JSON.stringify({
        visitorId,
        lang: payload.lang || 'en',
        visitorName: String(payload.visitorName || '').slice(0, 40),
        messages: Array.isArray(payload.messages) ? payload.messages.slice(-80) : [],
        updatedAt: nowIso,
        expiresAt: new Date(Date.now() + CHAT_TTL_MS).toISOString(),
      }),
    );
  } catch { /* ignore quota */ }
}

function isBrowserOnline() {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine !== false;
}

function canAttemptCloud() {
  return isBrowserOnline() && Date.now() >= cloudSyncDisabledUntil;
}

function markCloudUnreachable() {
  // Back off so we don't spam Firestore while offline / unreachable.
  cloudSyncDisabledUntil = Date.now() + 60_000;
}

function isOfflineishError(err) {
  const code = String(err?.code || '');
  const msg = String(err?.message || err || '');
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    /offline|unavailable|timeout|Could not reach Cloud Firestore|Failed to get document/i.test(msg)
  );
}

function withTimeout(promise, ms = CLOUD_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function quietCloud(fn) {
  if (!canAttemptCloud()) return null;
  try {
    const { ensureFirestoreNetwork } = await import('../firebase');
    await ensureFirestoreNetwork();
    return await withTimeout(fn());
  } catch (err) {
    if (isOfflineishError(err)) markCloudUnreachable();
    // Intentional silence: offline/unreachable is expected and must not trip Next error overlay.
    return null;
  }
}

function workspaceRef() {
  return doc(db, GOGO_ROOT, GOGO_WORKSPACE_DOC);
}

function qaCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_QA_SUB);
}

function cultureCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_CULTURE_SUB);
}

function chatsCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_CHATS_SUB);
}

function learnedCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_LEARNED_SUB);
}

function feedbackCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_FEEDBACK_SUB);
}

function productsCol() {
  return collection(db, GOGO_ROOT, GOGO_WORKSPACE_DOC, GOGO_PRODUCTS_SUB);
}

function readLocalLearned() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LEARNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalLearned(rows) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_LEARNED_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(0, 200) : []));
  } catch { /* ignore */ }
}

function readLocalProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalProducts(rows) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(0, 80) : []));
  } catch { /* ignore */ }
}

function mergeProductCatalog(remote = []) {
  const map = new Map();
  const baseRows = [
    ...GOGO_PRODUCT_SEED,
    ...(Array.isArray(bulkCatalog?.products) ? bulkCatalog.products : []),
  ];
  baseRows.forEach((p) => {
    if (!p?.id || !isAcceptableSamsungProduct(p)) return;
    map.set(p.id, { ...p, source: p.source || 'seed' });
  });
  (Array.isArray(remote) ? remote : []).forEach((p) => {
    if (!p?.id) return;
    if (!isAcceptableSamsungProduct(p) || isNonSamsungBrandText(JSON.stringify(p))) return;
    const seed = map.get(p.id);
    if (seed) {
      // Official seed/bulk wins for core specs so Firebase never keeps stale incomplete facts.
      const lastAnswer = String(p.lastAnswer || '');
      const keepLast =
        lastAnswer &&
        !isNonSamsungBrandText(lastAnswer) &&
        !/camera system|galaxy a\d{2} display|see gsmarena/i.test(lastAnswer) &&
        lastAnswer.length >= 40
          ? lastAnswer
          : seed.lastAnswer || '';
      map.set(p.id, {
        ...p,
        ...seed,
        id: p.id,
        hitCount: Number(p.hitCount || seed.hitCount || 0),
        lastQuestion: p.lastQuestion || seed.lastQuestion || '',
        lastAnswer: keepLast,
        lastLang: p.lastLang || seed.lastLang || '',
        specs: { ...(p.specs || {}), ...(seed.specs || {}) },
        specs_ar: { ...(p.specs_ar || {}), ...(seed.specs_ar || {}) },
        summary_en: seed.summary_en || p.summary_en,
        summary_ar: seed.summary_ar || p.summary_ar,
        aliases: Array.from(new Set([...(seed.aliases || []), ...(p.aliases || [])])),
        source: seed.source || p.source || 'seed',
      });
    } else {
      const cam = p?.specs?.camera || '';
      if (isWeakProductSpec(cam) && isWeakProductSpec(p?.specs?.processor || '')) return;
      map.set(p.id, { ...p, id: p.id });
    }
  });
  return Array.from(map.values());
}

/** Stable anonymous visitor id (local only — prevents chat leak across browsers). */
export function getOrCreateGoGoVisitorId() {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (id && /^[a-zA-Z0-9_-]{8,80}$/.test(id)) return id;
    id =
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      ).replace(/[^a-zA-Z0-9_-]/g, '');
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `session_${Date.now()}`;
  }
}

async function ensureWorkspaceRoot() {
  await setDoc(
    workspaceRef(),
    {
      type: 'GOGO_ASSISTANT_WORKSPACE',
      title: 'GoGo AI Assistant',
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** Seed Q&A + culture once when cloud is reachable (never blocks UI). */
export async function ensureGoGoKnowledgeSeeded() {
  if (seedAttempted || !canAttemptCloud()) return false;
  seedAttempted = true;
  const ok = await quietCloud(async () => {
    await ensureWorkspaceRoot();
    const qaSnap = await getDocs(query(qaCol(), limit(1)));
    if (qaSnap.empty) {
      await Promise.all(
        GOGO_SEED_QA.map((item) =>
          setDoc(doc(qaCol(), item.id), {
            ...item,
            createdAt: new Date().toISOString(),
            source: 'seed',
          }),
        ),
      );
    } else {
      // Keep critical answers current without wiping custom Q&A.
      // cs_org must upsert so live Firestore matches local hierarchy knowledge.
      const critical = GOGO_SEED_QA.filter(
        (item) =>
          item.id === 'who_built' ||
          item.id === 'what_is_scora' ||
          item.id === 'da_av_kpis' ||
          item.id === 'samsung_highlights' ||
          item.id === 'cs_org',
      );
      await Promise.all(
        critical.map((item) =>
          setDoc(
            doc(qaCol(), item.id),
            { ...item, updatedAt: new Date().toISOString(), source: 'seed' },
            { merge: true },
          ),
        ),
      );
    }
    const cultureSnap = await getDocs(query(cultureCol(), limit(1)));
    if (cultureSnap.empty) {
      await Promise.all(
        GOGO_SEED_CULTURE.map((item) =>
          setDoc(doc(cultureCol(), item.id), {
            ...item,
            createdAt: new Date().toISOString(),
            source: 'seed',
          }),
        ),
      );
    }
    const productsSnap = await getDocs(query(productsCol(), limit(1)));
    if (productsSnap.empty) {
      await Promise.all(
        GOGO_PRODUCT_SEED.map((item) =>
          setDoc(doc(productsCol(), item.id), {
            ...toFirebaseProductDoc(item),
            hitCount: 0,
            createdAt: new Date().toISOString(),
          }),
        ),
      );
    } else {
      await Promise.all(
        GOGO_PRODUCT_SEED.map((item) =>
          setDoc(
            doc(productsCol(), item.id),
            {
              ...toFirebaseProductDoc(item),
            },
            { merge: true },
          ),
        ),
      );
    }
    return true;
  });
  if (!ok) seedAttempted = false;
  return !!ok;
}

function mergeQaWithSeed(remote) {
  const map = new Map();
  if (Array.isArray(remote)) {
    remote.forEach((row) => {
      if (row?.id) map.set(row.id, row);
    });
  }
  // Local seed wins so language fixes + who_built stay correct even if Firestore is stale.
  GOGO_SEED_QA.forEach((row) => map.set(row.id, row));
  return Array.from(map.values());
}

/** Always returns usable Q&A (local seed). Cloud merge is optional and non-blocking. */
export async function getGoGoQaEntries() {
  void ensureGoGoKnowledgeSeeded();
  if (!canAttemptCloud()) return GOGO_SEED_QA;

  const remote = await quietCloud(async () => {
    const snap = await getDocs(qaCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  return mergeQaWithSeed(remote);
}

export async function getGoGoCultureEntries() {
  void ensureGoGoKnowledgeSeeded();
  if (!canAttemptCloud()) return GOGO_SEED_CULTURE;

  const remote = await quietCloud(async () => {
    const snap = await getDocs(cultureCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  if (Array.isArray(remote) && remote.length) return remote;
  return GOGO_SEED_CULTURE;
}

/**
 * Load this visitor's chat only (doc id === visitorId).
 * Prefers localStorage so offline never errors the UI.
 */
export async function loadGoGoChat(visitorId) {
  if (!visitorId) return null;
  const local = readLocalChat(visitorId);
  if (!canAttemptCloud()) return local;

  const remote = await quietCloud(async () => {
    const snap = await getDoc(doc(chatsCol(), visitorId));
    if (!snap.exists()) return null;
    const data = snap.data() || {};
    if (data.visitorId && data.visitorId !== visitorId) return null;
    return { id: snap.id, ...data };
  });

  if (remote && isChatExpired(remote)) {
    clearLocalChat(visitorId);
    await quietCloud(async () => {
      await setDoc(
        doc(chatsCol(), visitorId),
        {
          visitorId,
          messages: [],
          lang: remote.lang || 'en',
          visitorName: remote.visitorName || '',
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + CHAT_TTL_MS).toISOString(),
          messageCount: 0,
          type: 'GOGO_VISITOR_CHAT',
          clearedReason: 'ttl_24h',
        },
        { merge: true },
      );
      return true;
    });
    return null;
  }

  if (remote?.messages?.length) {
    writeLocalChat(visitorId, {
      messages: remote.messages,
      lang: remote.lang || 'en',
      visitorName: remote.visitorName || '',
    });
    return remote;
  }
  return local;
}

/**
 * Persist visitor chat. Local write is authoritative for UX;
 * cloud sync is best-effort when online.
 */
export async function saveGoGoChat(visitorId, payload) {
  if (!visitorId) return;
  const messages = Array.isArray(payload?.messages) ? payload.messages.slice(-80) : [];
  const safeMessages = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'gogo',
    text: String(m.text || '').slice(0, 2000),
    at: m.at || new Date().toISOString(),
    denied: !!m.denied,
    learnable: !!m.learnable,
    feedback: m.feedback === 'up' || m.feedback === 'down' ? m.feedback : null,
    question: m.question ? String(m.question).slice(0, 500) : null,
    expression: m.expression ? String(m.expression).slice(0, 40) : null,
    source: m.source ? String(m.source).slice(0, 40) : null,
    productName: m.productName ? String(m.productName).slice(0, 80) : null,
  }));
  const lang = payload.lang || 'en';
  const visitorName = String(payload.visitorName || '').slice(0, 40);
  writeLocalChat(visitorId, { messages: safeMessages, lang, visitorName });

  await quietCloud(async () => {
    await ensureWorkspaceRoot();
    const ref = doc(chatsCol(), visitorId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const prev = existing.data() || {};
      if (prev.visitorId && prev.visitorId !== visitorId) {
        throw new Error('Visitor chat isolation violation');
      }
      await updateDoc(ref, {
        visitorId,
        lang: lang || prev.lang || 'en',
        visitorName: visitorName || prev.visitorName || '',
        messages: safeMessages,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CHAT_TTL_MS).toISOString(),
        messageCount: safeMessages.length,
      });
    } else {
      await setDoc(ref, {
        visitorId,
        lang,
        visitorName,
        messages: safeMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CHAT_TTL_MS).toISOString(),
        messageCount: safeMessages.length,
        type: 'GOGO_VISITOR_CHAT',
      });
    }
    return true;
  });
}

/** Admin/helper: append a curated Q&A entry */
export async function addGoGoQaEntry(entry) {
  if (!canAttemptCloud()) {
    throw new Error('GoGo cloud is unreachable right now.');
  }
  await ensureWorkspaceRoot();
  const docRef = await addDoc(qaCol(), {
    ...entry,
    createdAt: new Date().toISOString(),
    source: entry?.source || 'manual',
  });
  return docRef.id;
}

/**
 * Load GoGo learned memory (validated Q&A). Local cache first, cloud merge best-effort.
 */
export async function getGoGoLearnedEntries({ force = false } = {}) {
  const now = Date.now();
  if (!force && learnedCache && now - learnedCacheAt < 60_000) return learnedCache;

  const local = readLocalLearned();
  if (!canAttemptCloud()) {
    learnedCache = local;
    learnedCacheAt = now;
    return local;
  }

  const remote = await quietCloud(async () => {
    const snap = await getDocs(query(learnedCol(), limit(120)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  const map = new Map();
  local.forEach((row) => {
    if (row?.id) map.set(row.id, row);
  });
  if (Array.isArray(remote)) {
    remote.forEach((row) => {
      if (row?.id) map.set(row.id, row);
    });
  }
  const merged = Array.from(map.values());
  writeLocalLearned(merged);
  learnedCache = merged;
  learnedCacheAt = now;
  return merged;
}

/**
 * Visitor thumbs-up: store / strengthen a learned answer.
 * qualityScore reaches 100 after enough positive validation → instant recall.
 */
export async function upsertGoGoLearnedAnswer({
  question,
  answer,
  lang = 'en',
  preferredStates = [],
  visitorId = '',
} = {}) {
  const q = String(question || '').trim();
  const a = String(answer || '').trim();
  if (q.length < 3 || a.length < 8) return null;

  const id = questionFingerprint(q);
  const L = lang === 'ar' ? 'ar' : 'en';
  const now = new Date().toISOString();
  const norm = normalizeGoGoQuestion(q);

  const localRows = readLocalLearned();
  const prevLocal = localRows.find((r) => r.id === id) || null;
  const upvotes = Number(prevLocal?.upvotes || 0) + 1;
  const qualityScore = Math.min(100, Math.max(Number(prevLocal?.qualityScore || 0), upvotes >= 2 ? 100 : 85));
  const next = {
    id,
    question: q,
    questionNorm: norm,
    question_en: L === 'en' ? q : prevLocal?.question_en || q,
    question_ar: L === 'ar' ? q : prevLocal?.question_ar || '',
    answer: a,
    answer_en: L === 'en' ? a : prevLocal?.answer_en || a,
    answer_ar: L === 'ar' ? a : prevLocal?.answer_ar || '',
    keywords: norm.split(' ').filter((t) => t.length >= 3).slice(0, 12),
    upvotes,
    downvotes: Number(prevLocal?.downvotes || 0),
    qualityScore,
    preferredStates: preferredStates.length
      ? preferredStates
      : prevLocal?.preferredStates || ['explaining', 'success'],
    expressionHint: preferredStates[0] || prevLocal?.expressionHint || 'explaining',
    status: 'active',
    source: 'visitor_validated',
    lastValidator: String(visitorId || '').slice(0, 80),
    updatedAt: now,
    createdAt: prevLocal?.createdAt || now,
    type: 'GOGO_LEARNED_QA',
  };

  const merged = [next, ...localRows.filter((r) => r.id !== id)].slice(0, 200);
  writeLocalLearned(merged);
  learnedCache = merged;
  learnedCacheAt = Date.now();

  await quietCloud(async () => {
    await ensureWorkspaceRoot();
    const ref = doc(learnedCol(), id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prev = snap.data() || {};
      const cloudUp = Number(prev.upvotes || 0) + 1;
      const cloudQuality = Math.min(100, Math.max(Number(prev.qualityScore || 0), cloudUp >= 2 ? 100 : 85));
      await updateDoc(ref, {
        ...next,
        upvotes: cloudUp,
        downvotes: Number(prev.downvotes || 0),
        qualityScore: cloudQuality,
        createdAt: prev.createdAt || next.createdAt,
      });
    } else {
      await setDoc(ref, next);
    }
    return true;
  });

  return next;
}

/**
 * Visitor thumbs-down: keep memory but mark needs_improve and rotate expression for next time.
 */
export async function markGoGoLearnedWeak({
  question,
  answer,
  lang = 'en',
  expressionUsed = '',
  visitorId = '',
} = {}) {
  const q = String(question || '').trim();
  const a = String(answer || '').trim();
  if (q.length < 3) return null;
  const id = questionFingerprint(q);
  const now = new Date().toISOString();
  const nextExpr = nextExpressionAfterMiss([expressionUsed]);

  const localRows = readLocalLearned();
  const prevLocal = localRows.find((r) => r.id === id) || null;
  const next = {
    id,
    question: q,
    questionNorm: normalizeGoGoQuestion(q),
    question_en: lang === 'en' ? q : prevLocal?.question_en || q,
    question_ar: lang === 'ar' ? q : prevLocal?.question_ar || '',
    answer: prevLocal?.answer || a,
    answer_en: prevLocal?.answer_en || (lang === 'en' ? a : ''),
    answer_ar: prevLocal?.answer_ar || (lang === 'ar' ? a : ''),
    keywords: normalizeGoGoQuestion(q).split(' ').filter((t) => t.length >= 3).slice(0, 12),
    upvotes: Number(prevLocal?.upvotes || 0),
    downvotes: Number(prevLocal?.downvotes || 0) + 1,
    qualityScore: Math.max(0, Math.min(Number(prevLocal?.qualityScore || 0), 70) - 25),
    preferredStates: [nextExpr, 'explaining', 'thinking'],
    expressionHint: nextExpr,
    lastWeakAnswer: a.slice(0, 500),
    lastFailedStates: [expressionUsed].filter(Boolean),
    status: 'needs_improve',
    source: 'visitor_feedback',
    lastValidator: String(visitorId || '').slice(0, 80),
    updatedAt: now,
    createdAt: prevLocal?.createdAt || now,
    type: 'GOGO_LEARNED_QA',
  };

  const merged = [next, ...localRows.filter((r) => r.id !== id)].slice(0, 200);
  writeLocalLearned(merged);
  learnedCache = merged;
  learnedCacheAt = Date.now();

  await quietCloud(async () => {
    await ensureWorkspaceRoot();
    await setDoc(doc(learnedCol(), id), next, { merge: true });
    await addDoc(feedbackCol(), {
      type: 'GOGO_ANSWER_FEEDBACK',
      rating: 'down',
      question: q.slice(0, 500),
      answer: a.slice(0, 1200),
      expressionUsed: String(expressionUsed || ''),
      preferredExpression: nextExpr,
      visitorId: String(visitorId || '').slice(0, 80),
      lang: lang === 'ar' ? 'ar' : 'en',
      createdAt: now,
    });
    return true;
  });

  return next;
}

export async function recordGoGoPositiveFeedback({
  question,
  answer,
  lang = 'en',
  expressionUsed = '',
  visitorId = '',
} = {}) {
  const learned = await upsertGoGoLearnedAnswer({
    question,
    answer,
    lang,
    preferredStates: expressionUsed ? [expressionUsed, 'success'] : ['explaining', 'success'],
    visitorId,
  });
  await quietCloud(async () => {
    await ensureWorkspaceRoot();
    await addDoc(feedbackCol(), {
      type: 'GOGO_ANSWER_FEEDBACK',
      rating: 'up',
      question: String(question || '').slice(0, 500),
      answer: String(answer || '').slice(0, 1200),
      expressionUsed: String(expressionUsed || ''),
      visitorId: String(visitorId || '').slice(0, 80),
      lang: lang === 'ar' ? 'ar' : 'en',
      createdAt: new Date().toISOString(),
    });
    return true;
  });
  return learned;
}

/**
 * Load Samsung product specs memory (official seed + Firebase products folder).
 */
export async function getGoGoProductCatalog({ force = false } = {}) {
  const now = Date.now();
  if (!force && productsCache && now - productsCacheAt < 60_000) return productsCache;

  void ensureGoGoKnowledgeSeeded();
  const local = readLocalProducts();
  const localMerged = mergeProductCatalog(local);

  if (!canAttemptCloud()) {
    productsCache = localMerged;
    productsCacheAt = now;
    writeLocalProducts(localMerged);
    return localMerged;
  }

  const remote = await quietCloud(async () => {
    const snap = await getDocs(query(productsCol(), limit(80)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  const merged = mergeProductCatalog([...(Array.isArray(remote) ? remote : []), ...local]);
  writeLocalProducts(merged);
  productsCache = merged;
  productsCacheAt = now;
  return merged;
}

/**
 * Upsert a product fact into Firebase products (fast recall next time).
 */
export async function upsertGoGoProductFact(product, { bumpHit = true } = {}) {
  if (!product?.id) return null;
  if (!isAcceptableSamsungProduct(product) || isNonSamsungBrandText(JSON.stringify(product))) {
    console.warn('GoGo refuse upsert non-Samsung product', product?.name_en || product?.id);
    return null;
  }
  const now = new Date().toISOString();
  const catalog = await getGoGoProductCatalog();
  const prev = catalog.find((p) => p.id === product.id) || {};
  const next = {
    ...toFirebaseProductDoc({ ...prev, ...product, id: product.id }),
    hitCount: Number(prev.hitCount || 0) + (bumpHit ? 1 : 0),
    createdAt: prev.createdAt || now,
    lastQuestion: product.lastQuestion || prev.lastQuestion || '',
    lastAnswer: product.lastAnswer || prev.lastAnswer || '',
    lastLang: product.lastLang || prev.lastLang || '',
  };

  const merged = mergeProductCatalog([next, ...catalog.filter((p) => p.id !== next.id)]);
  writeLocalProducts(merged);
  productsCache = merged;
  productsCacheAt = Date.now();

  await quietCloud(async () => {
    await ensureWorkspaceRoot();
    await setDoc(doc(productsCol(), next.id), next, { merge: true });
    return true;
  });

  return next;
}

/**
 * Firebase-first product answer.
 * If missing/weak → Gemini grounded (Option D) → optional GSMArena scrape → store → reply.
 * Uses chat history so "camera specs?" keeps the last model.
 * Never returns placeholder text like "A37 camera system".
 */
export async function lookupGoGoProductAnswer(question, lang = 'en', { history = [] } = {}) {
  const catalog = await getGoGoProductCatalog();
  const resolved = resolveProductQueryWithHistory(question, history, catalog);
  const focus = resolved.focus || detectSpecFocus(resolved.query);
  let product = resolved.product || findGoGoProduct(resolved.query, catalog);

  if (isNonSamsungBrandText(question)) {
    return {
      product: null,
      focus,
      answer: getSamsungOnlyRefuseReply(lang),
      source: 'samsung_only',
      unknown: true,
    };
  }

  // Drop poisoned memory (e.g. Xiaomi page recycled into an old Samsung URL).
  if (product && !isAcceptableSamsungProduct(product, resolved.query || question)) {
    product = null;
  }

  const looksLikeProductAsk =
    /galaxy|samsung|ultra|fold|flip|\bs2[3-9]\b|\ba\d{2}\b|معالج|processor|chipset|battery|بطارية|شاشة|display|camera|كاميرا|normal|base|not\s+ultra|specs?|مواصفات|tab|watch|buds|washer|washing|vacuum|tv|تكييف|غسالة|ساعة/i.test(
      String(question || ''),
    ) || resolved.fromHistory;

  const softFail = (reply) => {
    const raw = String(reply || '').trim();
    const safe =
      !raw || /gsm\s*arena|gsmarena/i.test(raw)
        ? getSamsungDataUnavailableReply(lang)
        : raw;
    return {
      product: product || null,
      focus,
      answer: safe || getUnverifiedSamsungModelReply(lang, question),
      source: 'products_retry',
      unknown: true,
      fromHistory: !!resolved.fromHistory,
    };
  };

  const acceptEnriched = async (hit, source) => {
    if (!hit?.product) return null;
    if (!isAcceptableSamsungProduct(hit.product, resolved.query || question)) return null;
    if (isNonSamsungBrandText(hit.answer || '')) return null;
    product = { ...(product || {}), ...hit.product, id: product?.id || hit.product.id };
    if (!isAcceptableSamsungProduct(product, resolved.query || question)) return null;
    const answer = hit.answer || formatGoGoProductAnswer(product, lang, focus) || '';
    if (!answer || isNonSamsungBrandText(answer) || !isVerifiedProductSpecs(product, focus)) return null;
    await upsertGoGoProductFact(
      { ...product, source: source || hit.source || 'gemini_grounded' },
      { bumpHit: true },
    );
    return {
      product,
      focus,
      answer,
      source: source || hit.source || 'gemini_grounded',
      fromHistory: !!resolved.fromHistory,
    };
  };

  // Enrich when unknown or weak specs — Gemini first (Option D), then scrape.
  if (looksLikeProductAsk && needsLiveProductSearch(product, focus)) {
    const query = product?.name_en || resolved.query;
    let geminiReply = '';

    try {
      const gemini = await searchGoGoProductGemini({
        query,
        focus,
        lang,
        gsmarenaUrl: product?.gsmarenaUrl || '',
      });
      const accepted = await acceptEnriched(gemini, gemini.source || 'gemini_grounded');
      if (accepted) return accepted;
    } catch (err) {
      geminiReply = err?.data?.reply || '';
    }

    try {
      const live = await searchGoGoProductLive({ query, focus, lang });
      const accepted = await acceptEnriched(live, live.source || 'gsmarena_live');
      if (accepted) return accepted;
      return softFail(live?.reply || geminiReply);
    } catch (err) {
      if (product && isVerifiedProductSpecs(product, focus)) {
        const answer = formatGoGoProductAnswer(product, lang, focus);
        if (answer) {
          void upsertGoGoProductFact(product, { bumpHit: true });
          return {
            product,
            focus,
            answer,
            source: 'products_memory',
            fromHistory: !!resolved.fromHistory,
          };
        }
      }
      return softFail(err?.data?.reply || geminiReply);
    }
  }

  if (!product) {
    if (!looksLikeProductAsk) return null;
    return {
      product: null,
      focus,
      answer: getUnknownProductReply(lang, question),
      source: 'products_unknown',
      unknown: true,
    };
  }

  const answer = formatGoGoProductAnswer(product, lang, focus);
  if (!answer) return null;
  if (focus && focus !== 'all' && !isVerifiedProductSpecs(product, focus)) {
    // Strong memory path should not serve weak focused fields
    try {
      const gemini = await searchGoGoProductGemini({
        query: product.name_en || resolved.query,
        focus,
        lang,
        gsmarenaUrl: product.gsmarenaUrl || '',
      });
      const accepted = await acceptEnriched(gemini, 'gemini_grounded');
      if (accepted) return accepted;
    } catch {
      /* soft fail below */
    }
    return softFail();
  }
  void upsertGoGoProductFact(product, { bumpHit: true });
  return {
    product,
    focus,
    answer,
    source: 'products_memory',
    fromHistory: !!resolved.fromHistory,
  };
}

/** When browser comes back online, clear backoff so sync can retry. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    cloudSyncDisabledUntil = 0;
    seedAttempted = false;
  });
}
