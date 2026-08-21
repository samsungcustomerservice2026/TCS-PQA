/**
 * Firebase Admin SDK bootstrap (server-only).
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string) or
 * FIREBASE_SERVICE_ACCOUNT_PATH, or GOOGLE_APPLICATION_CREDENTIALS.
 */
import { createRequire } from 'module';

let adminApp = null;
let initError = null;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && String(raw).trim()) {
    const trimmed = String(raw).trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      try {
        return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
      } catch {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64 JSON');
      }
    }
  }
  return null;
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

export function getFirebaseAdmin() {
  if (adminApp) return adminApp;
  if (initError) throw initError;

  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const admin = require('firebase-admin');
    if (admin.apps.length) {
      adminApp = admin.app();
      return adminApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'tcs-for-engineers';
    const sa = loadServiceAccount();
    if (sa) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'tcs-for-engineers.firebasestorage.app',
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      }
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    } else {
      const err = new Error(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (server-only).',
      );
      err.code = 'admin_not_configured';
      initError = err;
      throw err;
    }
    adminApp = admin.app();
    return adminApp;
  } catch (err) {
    initError = err;
    throw err;
  }
}

export function getAdminAuth() {
  const admin = require('firebase-admin');
  getFirebaseAdmin();
  return admin.auth();
}

export function getAdminDb() {
  const admin = require('firebase-admin');
  getFirebaseAdmin();
  return admin.firestore();
}

/** Soft check — does not throw. */
export function tryGetAdminDb() {
  try {
    if (!isFirebaseAdminConfigured()) return null;
    return getAdminDb();
  } catch {
    return null;
  }
}
