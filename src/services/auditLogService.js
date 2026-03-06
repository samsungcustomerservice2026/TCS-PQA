import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

const LOGS_COL = collection(db, 'logs', 'activity', 'records');

/**
 * Write a single log entry to Firestore.
 * @param {object} entry
 *   type     - 'ADMIN_ACTION' | 'ADMIN_LOGIN' | 'ADMIN_LOGOUT' | 'ERROR' | 'FAILED_LOGIN' | 'VISITOR_EVENT'
 *   actor    - username / 'visitor'
 *   action   - short human-readable string
 *   details  - optional key-value object
 *   severity - 'info' | 'warning' | 'error'  (default: 'info')
 */
export const writeLog = async ({ type, actor = 'system', action, details = {}, severity = 'info', ip = null, location = null }) => {
    try {
        const entry = {
            type,
            actor,
            action,
            details,
            severity,
            timestamp: serverTimestamp(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : '',
        };
        if (ip) entry.ip = ip;
        if (location) entry.location = location;
        await addDoc(LOGS_COL, entry);
    } catch (e) {
        // Silently fail — never break the app for a log write
        console.warn('AuditLog write failed:', e);
    }
};

/**
 * Fetch the latest N log entries for the admin dashboard.
 */
export const fetchLogs = async (n = 100) => {
    try {
        const q = query(LOGS_COL, orderBy('timestamp', 'desc'), limit(n));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate?.() ?? null }));
    } catch (e) {
        console.warn('AuditLog fetch failed:', e);
        return [];
    }
};
