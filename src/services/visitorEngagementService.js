import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { isBrowserOnline, softFirestore, withFirestoreRetry } from '../lib/firestoreSafe';

const SUMMARY_REF = doc(db, 'analytics', 'summary');
const EVENTS_COL = collection(db, 'analytics', 'engagement', 'events');

const DEFAULT_ENGAGEMENT = {
  totalClicks: 0,
  visitorClicks: 0,
  offlineEvents: 0,
  lagEvents: 0,
  sessionsTracked: 0,
};

export const DEFAULT_SURVEY_FUNNEL = {
  promoShown: 0,
  promoDismissed: 0,
  opened: 0,
  started: 0,
  abandoned: 0,
  completed: 0,
};

export const DEFAULT_FEEDBACK_FUNNEL = { ...DEFAULT_SURVEY_FUNNEL };

export function normalizeAnalyticsSummary(data) {
  if (!data) return null;
  return {
    ...data,
    surveyFunnel: { ...DEFAULT_SURVEY_FUNNEL, ...(data.surveyFunnel || {}) },
    feedbackFunnel: { ...DEFAULT_FEEDBACK_FUNNEL, ...(data.feedbackFunnel || {}) },
    visitorEngagement: { ...DEFAULT_ENGAGEMENT, ...(data.visitorEngagement || {}) },
    dailyEngagement: data.dailyEngagement || {},
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function funnelField(funnel, step) {
  const map = {
    promo_shown: 'promoShown',
    promo_dismissed: 'promoDismissed',
    opened: 'opened',
    started: 'started',
    abandoned: 'abandoned',
    completed: 'completed',
  };
  const key = map[step];
  if (!key || !['survey', 'feedback'].includes(funnel)) return null;
  return `${funnel}Funnel.${key}`;
}

async function ensureSummaryExists() {
  if (!isBrowserOnline()) return;
  const snap = await softFirestore(() => withFirestoreRetry(() => getDoc(SUMMARY_REF)), null);
  if (!snap) return;
  if (snap.exists()) return;
  await setDoc(SUMMARY_REF, {
    totalHits: 0,
    visitorHits: 0,
    adminLogins: 0,
    totalSessions: 0,
    visitorSessions: 0,
    adminSessions: 0,
    totalTimeSpentMs: 0,
    visitorTimeSpentMs: 0,
    adminTimeSpentMs: 0,
    avgVisitorSessionMs: 0,
    avgAdminSessionMs: 0,
    dailyVisitorHits: {},
    dailyAdminLogins: {},
    visitorHitsTCS: 0,
    visitorHitsPQA: 0,
    modeHits: {},
    surveyFunnel: { ...DEFAULT_SURVEY_FUNNEL },
    feedbackFunnel: { ...DEFAULT_FEEDBACK_FUNNEL },
    visitorEngagement: { ...DEFAULT_ENGAGEMENT },
    dailyEngagement: {},
  });
}

/** Ensure nested engagement/funnel fields exist on older summary documents. */
export async function ensureEngagementSchema() {
  if (!isBrowserOnline()) return;
  const snap = await softFirestore(() => withFirestoreRetry(() => getDoc(SUMMARY_REF)), null);
  if (!snap) return;
  if (!snap.exists()) {
    await ensureSummaryExists();
    return;
  }
  const data = snap.data();
  const patch = {};
  const mergedSurvey = { ...DEFAULT_SURVEY_FUNNEL, ...(data.surveyFunnel || {}) };
  const mergedFeedback = { ...DEFAULT_FEEDBACK_FUNNEL, ...(data.feedbackFunnel || {}) };
  const mergedEngagement = { ...DEFAULT_ENGAGEMENT, ...(data.visitorEngagement || {}) };
  if (!data.surveyFunnel || JSON.stringify(data.surveyFunnel) !== JSON.stringify(mergedSurvey)) {
    patch.surveyFunnel = mergedSurvey;
  }
  if (!data.feedbackFunnel || JSON.stringify(data.feedbackFunnel) !== JSON.stringify(mergedFeedback)) {
    patch.feedbackFunnel = mergedFeedback;
  }
  if (!data.visitorEngagement || JSON.stringify(data.visitorEngagement) !== JSON.stringify(mergedEngagement)) {
    patch.visitorEngagement = mergedEngagement;
  }
  if (!data.dailyEngagement || typeof data.dailyEngagement !== 'object') {
    patch.dailyEngagement = data.dailyEngagement && typeof data.dailyEngagement === 'object' ? data.dailyEngagement : {};
  }
  if (Object.keys(patch).length > 0) {
    await updateDoc(SUMMARY_REF, patch);
  }
}

/**
 * Flush click batch while session is still open (mobile-friendly).
 */
export async function recordClickBatch(clicks, meta = {}) {
  if (!clicks || clicks < 1) return;
  if (!isBrowserOnline()) return;
  const day = todayKey();
  try {
    await ensureEngagementSchema();
    await updateDoc(SUMMARY_REF, {
      'visitorEngagement.totalClicks': increment(clicks),
      'visitorEngagement.visitorClicks': increment(clicks),
      [`dailyEngagement.${day}.clicks`]: increment(clicks),
    });
  } catch (e) {
    /* offline — ignore */
  }
}

/**
 * Increment survey/feedback funnel step on analytics summary (no PII).
 */
export async function recordFunnelStep(funnel, step, meta = {}) {
  const field = funnelField(funnel, step);
  if (!field) return;
  if (!isBrowserOnline()) return;
  const day = todayKey();
  try {
    await ensureEngagementSchema();
    const updates = {
      [field]: increment(1),
      [`dailyEngagement.${day}.${funnel}_${step}`]: increment(1),
    };
    await updateDoc(SUMMARY_REF, updates);
    await addDoc(EVENTS_COL, {
      kind: 'funnel',
      funnel,
      step,
      appMode: meta.appMode || null,
      sessionId: meta.sessionId || null,
      source: meta.source || null,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    /* offline — ignore */
  }
}

/**
 * Offline / online / lag signal (aggregated + optional event row).
 */
export async function recordConnectivitySignal(type, meta = {}) {
  const day = todayKey();
  // Never call Firestore while the browser/SDK is already offline — that is what
  // produces "Failed to get document because the client is offline" overlays.
  if (!isBrowserOnline()) return;
  if (type === 'offline') return;
  try {
    await ensureEngagementSchema();
    const updates = {};
    if (type === 'lag') {
      updates['visitorEngagement.lagEvents'] = increment(1);
      updates[`dailyEngagement.${day}.lag`] = increment(1);
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(SUMMARY_REF, updates);
    }
    if (type === 'lag') {
      await addDoc(EVENTS_COL, {
        kind: 'connectivity',
        type,
        durationMs: meta.durationMs || null,
        appMode: meta.appMode || null,
        sessionId: meta.sessionId || null,
        timestamp: serverTimestamp(),
      });
    }
  } catch (e) {
    /* offline — ignore */
  }
}
