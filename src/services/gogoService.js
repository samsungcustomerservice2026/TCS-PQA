/**
 * GoGo Firebase workspace:
 *   gogo_assistant / workspace / qa|{culture}|chats
 * Visitor chats are isolated by visitorId (never shared across visitors).
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

export const GOGO_ROOT = 'gogo_assistant';
export const GOGO_WORKSPACE_DOC = 'workspace';
export const GOGO_QA_SUB = 'qa';
export const GOGO_CULTURE_SUB = 'culture';
export const GOGO_CHATS_SUB = 'chats';

const VISITOR_KEY = 'gogo_visitor_id';
const LOCAL_CHAT_PREFIX = 'gogo_chat_v1_';
const CLOUD_TIMEOUT_MS = 1500;

let cloudSyncDisabledUntil = 0;
let seedAttempted = false;

function localChatKey(visitorId) {
  return `${LOCAL_CHAT_PREFIX}${visitorId}`;
}

function readLocalChat(visitorId) {
  if (typeof window === 'undefined' || !visitorId) return null;
  try {
    const raw = localStorage.getItem(localChatKey(visitorId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.visitorId !== visitorId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Sync local-only chat read (never touches Firestore). */
export function loadGoGoChatLocal(visitorId) {
  return readLocalChat(visitorId);
}

function writeLocalChat(visitorId, payload) {
  if (typeof window === 'undefined' || !visitorId) return;
  try {
    localStorage.setItem(
      localChatKey(visitorId),
      JSON.stringify({
        visitorId,
        lang: payload.lang || 'en',
        visitorName: String(payload.visitorName || '').slice(0, 40),
        messages: Array.isArray(payload.messages) ? payload.messages.slice(-80) : [],
        updatedAt: new Date().toISOString(),
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
      // Keep critical answers current (e.g. who_built) without wiping custom Q&A.
      const critical = GOGO_SEED_QA.filter((item) => item.id === 'who_built' || item.id === 'what_is_scora');
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

  if (remote?.messages?.length) {
    writeLocalChat(visitorId, {
      messages: remote.messages,
      lang: remote.lang || 'en',
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

/** When browser comes back online, clear backoff so sync can retry. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    cloudSyncDisabledUntil = 0;
    seedAttempted = false;
  });
}
