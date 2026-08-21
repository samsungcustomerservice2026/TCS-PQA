/**
 * Immutable audit log writer (Admin SDK).
 * Clients must never write to audit_logs (Firestore rules deny).
 */
import { getAdminDb, tryGetAdminDb } from '../auth/firebaseAdmin';

export async function writeAuditLog({
  actorUid,
  actorRole = '',
  action,
  entityType,
  entityId = '',
  oldValue = null,
  newValue = null,
  reason = '',
  meta = {},
}) {
  const db = tryGetAdminDb();
  if (!db) return null;

  const payload = {
    actorUid: actorUid || '',
    actorRole: actorRole || '',
    action: String(action || ''),
    entityType: String(entityType || ''),
    entityId: String(entityId || ''),
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    reason: String(reason || '').slice(0, 500),
    meta: meta || {},
    timestamp: new Date().toISOString(),
    serverTimestamp: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('audit_logs').add(payload);
  return ref.id;
}
