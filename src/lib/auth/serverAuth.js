/**
 * Server-side auth helpers for Next.js Route Handlers.
 * Verify Firebase ID tokens; load role from custom claims and/or admins/{uid}.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured, tryGetAdminDb } from './firebaseAdmin';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  EMPLOYEE: 'employee',
});

const ADMIN_ROLES = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER]);

function extractBearer(request) {
  const h = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : '';
}

function normalizeRole(raw) {
  const r = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (r === 'superadmin' || r === 'super_admin' || r === 'super-admin') return ROLES.SUPER_ADMIN;
  if (ADMIN_ROLES.has(r)) return r;
  if (r === 'employee') return ROLES.EMPLOYEE;
  return '';
}

async function resolveAdminRole(uid, claims = {}) {
  let role = normalizeRole(claims.role);
  if (claims.isSuperAdmin === true) role = ROLES.SUPER_ADMIN;
  else if (claims.isAdmin === true && !role) role = ROLES.ADMIN;

  if (role && ADMIN_ROLES.has(role)) {
    return { role, source: 'claims' };
  }

  const db = tryGetAdminDb();
  if (!db) return { role: '', source: 'none' };

  const snap = await db.collection('admins').doc(uid).get();
  if (!snap.exists) {
    // Legacy docs keyed by username — scan limited (migration aid)
    const q = await db.collection('admins').where('firebaseUid', '==', uid).limit(1).get();
    if (!q.empty) {
      const data = q.docs[0].data() || {};
      const legacy = String(data.role || '').toUpperCase();
      if (legacy === 'SUPER_ADMIN') return { role: ROLES.SUPER_ADMIN, source: 'firestore', adminDoc: { id: q.docs[0].id, ...data } };
      return { role: normalizeRole(data.role) || ROLES.ADMIN, source: 'firestore', adminDoc: { id: q.docs[0].id, ...data } };
    }
    return { role: '', source: 'none' };
  }

  const data = snap.data() || {};
  const legacy = String(data.role || '').toUpperCase();
  if (legacy === 'SUPER_ADMIN') return { role: ROLES.SUPER_ADMIN, source: 'firestore', adminDoc: { id: snap.id, ...data } };
  const mapped = normalizeRole(data.role) || ROLES.ADMIN;
  return { role: mapped, source: 'firestore', adminDoc: { id: snap.id, ...data } };
}

/**
 * @returns {Promise<{ uid: string, email?: string, claims: object, role: string, adminDoc?: object }>}
 */
export async function verifyIdTokenFromRequest(request) {
  if (!isFirebaseAdminConfigured()) {
    const err = new Error('Server auth not configured');
    err.code = 'admin_not_configured';
    err.status = 503;
    throw err;
  }
  const token = extractBearer(request);
  if (!token) {
    const err = new Error('Missing Authorization Bearer token');
    err.code = 'unauthenticated';
    err.status = 401;
    throw err;
  }
  const decoded = await getAdminAuth().verifyIdToken(token, true);
  const { role, adminDoc, source } = await resolveAdminRole(decoded.uid, decoded);
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    claims: decoded,
    role,
    adminDoc,
    roleSource: source,
  };
}

export async function requireAuth(request) {
  return verifyIdTokenFromRequest(request);
}

export async function requireAdmin(request, { minRole = ROLES.VIEWER } = {}) {
  const ctx = await requireAuth(request);
  if (!ADMIN_ROLES.has(ctx.role)) {
    const err = new Error('Admin access required');
    err.code = 'forbidden';
    err.status = 403;
    throw err;
  }
  const order = [ROLES.VIEWER, ROLES.EDITOR, ROLES.ADMIN, ROLES.SUPER_ADMIN];
  if (order.indexOf(ctx.role) < order.indexOf(minRole)) {
    const err = new Error(`Requires role ${minRole} or higher`);
    err.code = 'forbidden';
    err.status = 403;
    throw err;
  }
  return ctx;
}

export async function requireSuperAdmin(request) {
  return requireAdmin(request, { minRole: ROLES.SUPER_ADMIN });
}

export async function requireEmployee(request) {
  const ctx = await requireAuth(request);
  const db = getAdminDb();
  const snap = await db.collection('employees').doc(ctx.uid).get();
  if (!snap.exists) {
    const err = new Error('Employee profile required');
    err.code = 'forbidden';
    err.status = 403;
    throw err;
  }
  return { ...ctx, employee: { uid: snap.id, ...snap.data() }, role: ctx.role || ROLES.EMPLOYEE };
}

export function authErrorResponse(err) {
  const status = err?.status || (err?.code === 'admin_not_configured' ? 503 : 401);
  return NextResponse.json(
    {
      error: err?.message || 'Unauthorized',
      code: err?.code || 'unauthorized',
    },
    { status },
  );
}

/** Simple in-memory rate limit (per server instance). */
const buckets = new Map();

export function rateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    b = { start: now, count: 0 };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) {
    const err = new Error('Rate limit exceeded');
    err.code = 'rate_limited';
    err.status = 429;
    throw err;
  }
}
