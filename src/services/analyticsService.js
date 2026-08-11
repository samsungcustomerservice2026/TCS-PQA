import { db } from '../firebase';
import {
    doc, getDoc, setDoc, updateDoc, increment,
    collection, addDoc, serverTimestamp
} from 'firebase/firestore';
import { ensureEngagementSchema, normalizeAnalyticsSummary } from './visitorEngagementService';
import { isBrowserOnline, softFirestore, withFirestoreRetry } from '../lib/firestoreSafe';

const SUMMARY_REF = doc(db, 'analytics', 'summary');

/** Allowed app mode keys for aggregated counters (no PII). */
function sanitizeAppMode(mode) {
    if (!mode || typeof mode !== 'string') return null;
    const m = mode.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,32}$/.test(m)) return null;
    if (!m.startsWith('TCS_') && !m.startsWith('PQA_')) return null;
    return m;
}

async function readSummarySnap() {
    return softFirestore(() => withFirestoreRetry(() => getDoc(SUMMARY_REF)), null);
}

/**
 * Called on every app load.
 * Tracks visitor hits (public / engineer users only — NOT admin logins).
 * Returns the session start timestamp (ms).
 */
export const recordVisit = async () => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (!isBrowserOnline()) return Date.now();
    try {
        const snap = await readSummarySnap();
        if (!snap) return Date.now();
        if (snap.exists()) {
            const data = snap.data();
            const dailyVisitorHits = data.dailyVisitorHits || {};
            dailyVisitorHits[today] = (dailyVisitorHits[today] || 0) + 1;
            await updateDoc(SUMMARY_REF, {
                totalHits: increment(1),
                visitorHits: increment(1),
                dailyVisitorHits,
            });
        } else {
            await setDoc(SUMMARY_REF, {
                totalHits: 1,
                visitorHits: 1,
                adminLogins: 0,
                totalSessions: 0,
                visitorSessions: 0,
                adminSessions: 0,
                totalTimeSpentMs: 0,
                visitorTimeSpentMs: 0,
                adminTimeSpentMs: 0,
                avgVisitorSessionMs: 0,
                avgAdminSessionMs: 0,
                dailyVisitorHits: { [today]: 1 },
                dailyAdminLogins: {},
                visitorHitsTCS: 0,
                visitorHitsPQA: 0,
                modeHits: {},
            });
        }
    } catch (e) {
        // Offline / unreachable — skip quietly (do not trip Next overlay).
    }
    return Date.now();
};

/**
 * Once per browser session when the user picks TCS vs PQA division (after appMode is set).
 */
export const recordVisitorModeSegment = async (appMode) => {
    const mode = sanitizeAppMode(appMode);
    if (!mode) return;
    if (!isBrowserOnline()) return;
    const familyField = mode.startsWith('PQA') ? 'visitorHitsPQA' : 'visitorHitsTCS';
    const modeKey = `modeHits.${mode}`;
    try {
        const snap = await readSummarySnap();
        if (!snap) return;
        if (snap.exists()) {
            await updateDoc(SUMMARY_REF, {
                [familyField]: increment(1),
                [modeKey]: increment(1),
            });
        } else {
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
                visitorHitsTCS: mode.startsWith('TCS') ? 1 : 0,
                visitorHitsPQA: mode.startsWith('PQA') ? 1 : 0,
                modeHits: { [mode]: 1 },
            });
        }
    } catch (e) {
        /* offline — ignore */
    }
};

/**
 * Called when an admin logs in.
 * Tracks admin login separately from visitor hits.
 */
export const recordAdminLogin = async () => {
    const today = new Date().toISOString().slice(0, 10);
    if (!isBrowserOnline()) return;
    try {
        const snap = await readSummarySnap();
        if (!snap || !snap.exists()) return;
        const data = snap.data();
        const dailyAdminLogins = data.dailyAdminLogins || {};
        dailyAdminLogins[today] = (dailyAdminLogins[today] || 0) + 1;
        await updateDoc(SUMMARY_REF, {
            adminLogins: increment(1),
            dailyAdminLogins,
        });
    } catch (e) {
        /* offline — ignore */
    }
};

/**
 * Called on tab close / session end.
 * isAdmin=true → tracked separately under admin session stats.
 */
export const recordSessionEnd = async (
    startMs,
    pagesVisited = [],
    isAdmin = false,
    appMode = null,
    engagement = {}
) => {
    if (!startMs) return;
    const durationMs = Date.now() - startMs;
    const clicks = Number(engagement.clicks) || 0;
    const pendingClicks = Number(engagement.pendingClicks ?? engagement.clicks) || 0;
    if (durationMs < 3000 && !pendingClicks && !clicks) return;
    if (!isBrowserOnline()) return;

    const mode = sanitizeAppMode(appMode);
    const activeMs = Number(engagement.activeMs) || 0;
    const offlineEvents = Number(engagement.offlineEvents) || 0;
    const lagEvents = Number(engagement.lagEvents) || 0;

    try {
        await addDoc(collection(db, 'analytics', 'sessions', 'records'), {
            startedAt: serverTimestamp(),
            durationMs,
            activeMs: activeMs || undefined,
            clicks: clicks || undefined,
            offlineEvents: offlineEvents || undefined,
            lagEvents: lagEvents || undefined,
            pagesVisited,
            isAdmin,
            appMode: mode || undefined,
            sessionId: engagement.sessionId || undefined,
        });

        const snap = await readSummarySnap();
        if (snap && snap.exists()) {
            const data = snap.data();
            const updates = {
                totalSessions: increment(1),
                totalTimeSpentMs: increment(durationMs),
            };
            if (isAdmin) {
                const newAdminTotal = (data.adminSessions || 0) + 1;
                const newAdminTime = (data.adminTimeSpentMs || 0) + durationMs;
                updates.adminSessions = increment(1);
                updates.adminTimeSpentMs = increment(durationMs);
                updates.avgAdminSessionMs = Math.round(newAdminTime / newAdminTotal);
            } else {
                const newVisitorTotal = (data.visitorSessions || 0) + 1;
                const newVisitorTime = (data.visitorTimeSpentMs || 0) + durationMs;
                updates.visitorSessions = increment(1);
                updates.visitorTimeSpentMs = increment(durationMs);
                updates.avgVisitorSessionMs = Math.round(newVisitorTime / newVisitorTotal);
            }
            await updateDoc(SUMMARY_REF, updates);
        }

        if (!isAdmin && pendingClicks > 0) {
            const day = new Date().toISOString().slice(0, 10);
            await ensureEngagementSchema();
            await updateDoc(SUMMARY_REF, {
                'visitorEngagement.totalClicks': increment(pendingClicks),
                'visitorEngagement.visitorClicks': increment(pendingClicks),
                [`dailyEngagement.${day}.clicks`]: increment(pendingClicks),
                'visitorEngagement.sessionsTracked': increment(1),
            });
        }
    } catch (e) {
        /* offline — ignore */
    }
};

/**
 * Fetch the analytics summary for the admin dashboard.
 */
export const getAnalyticsSummary = async () => {
    try {
        if (!isBrowserOnline()) return null;
        await ensureEngagementSchema();
        const snap = await readSummarySnap();
        if (snap && snap.exists()) return normalizeAnalyticsSummary(snap.data());
    } catch (e) {
        /* offline — ignore */
    }
    return null;
};
