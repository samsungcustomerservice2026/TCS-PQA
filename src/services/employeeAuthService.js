/**
 * Employee signup/login — Firebase Authentication ONLY.
 * No SHA-256 Firestore password fallback. No localStorage as auth proof.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { CONSULTANT_FIRESTORE, EMPLOYEE_STATUS, EMPLOYEE_PRODUCT_LINE } from '../lib/consultants/constants';
import { createEmptyEmployeeProfile } from '../lib/consultants/schema';

const { employees: EMPLOYEES, employeeIndex: INDEX } = CONSULTANT_FIRESTORE;

let persistenceReady = false;

async function ensurePersistence() {
  if (persistenceReady || typeof window === 'undefined') return;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    /* ignore */
  }
  persistenceReady = true;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeGspn(gspnId) {
  return String(gspnId || '').trim().toUpperCase().replace(/\s+/g, '');
}

function indexKeyForEmail(email) {
  return `email_${normalizeEmail(email)}`;
}

function indexKeyForGspn(gspnId) {
  return `gspn_${normalizeGspn(gspnId)}`;
}

function mapAuthError(err) {
  const code = String(err?.code || '');
  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return new Error(
      'Firebase Authentication is not enabled. Enable Email/Password in Firebase Console → Authentication.',
    );
  }
  if (code === 'auth/email-already-in-use') return new Error('This email is already registered. Please log in.');
  if (code === 'auth/invalid-email') return new Error('Enter a valid email address.');
  if (code === 'auth/weak-password') return new Error('Password must be at least 6 characters.');
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return new Error('Incorrect GSPN/email or password.');
  }
  return new Error(err?.message || 'Authentication failed');
}

export async function getEmployeeProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, EMPLOYEES, uid));
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  const { passwordHash, passwordSalt, ...safe } = data;
  return { uid: snap.id, ...safe };
}

export async function resolveEmailFromLoginId(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return normalizeEmail(raw);

  const gspn = normalizeGspn(raw);
  const snap = await getDoc(doc(db, INDEX, indexKeyForGspn(gspn)));
  if (snap.exists() && snap.data()?.email) return normalizeEmail(snap.data().email);
  throw new Error('GSPN account not found. Use your email or sign up first.');
}

async function writeProfileIndexes(profile) {
  const { passwordHash, passwordSalt, ...safe } = profile;
  await setDoc(doc(db, EMPLOYEES, profile.uid), safe, { merge: true });
  await setDoc(doc(db, INDEX, indexKeyForGspn(profile.gspnId)), {
    uid: profile.uid,
    email: profile.email,
    gspnId: profile.gspnId,
  });
  await setDoc(doc(db, INDEX, indexKeyForEmail(profile.email)), {
    uid: profile.uid,
    email: profile.email,
    gspnId: profile.gspnId,
  });
}

export async function signUpEmployee({ email, gspnId, phone, password, confirmPassword, displayName, productLine }) {
  await ensurePersistence();
  const em = normalizeEmail(email);
  const gspn = normalizeGspn(gspnId);
  if (!em || !gspn || !password) throw new Error('Email, GSPN, and password are required.');
  if (confirmPassword != null && String(confirmPassword) !== String(password)) {
    throw new Error('Passwords do not match.');
  }

  try {
    const existingGspn = await getDoc(doc(db, INDEX, indexKeyForGspn(gspn)));
    if (existingGspn.exists()) throw new Error('This GSPN account is already registered. Please log in.');
  } catch (err) {
    if (err?.message?.includes('already registered')) throw err;
    // permission-denied on old live rules — continue; Auth create + index write still enforce uniqueness by email
    if (!/permission|insufficient/i.test(String(err?.message || err?.code || ''))) throw mapAuthError(err);
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, em, password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch {
        /* ignore */
      }
    }
    const profile = {
      ...createEmptyEmployeeProfile(),
      uid: cred.user.uid,
      email: em,
      gspnId: gspn,
      phone: String(phone || '').trim(),
      displayName: String(displayName || '').trim(),
      productLine: productLine || EMPLOYEE_PRODUCT_LINE.MX,
      status: EMPLOYEE_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      authProvider: 'firebase',
    };
    // Never persist password material in Firestore
    delete profile.passwordHash;
    delete profile.passwordSalt;
    await writeProfileIndexes(profile);
    return { user: cred.user, profile };
  } catch (err) {
    if (/permission|insufficient/i.test(String(err?.message || err?.code || ''))) {
      throw new Error(
        'Missing or insufficient permissions. Publish updated firestore.rules (employee_index public get + self create).',
      );
    }
    throw mapAuthError(err);
  }
}

export async function signInEmployee({ loginId, password }) {
  await ensurePersistence();
  const email = await resolveEmailFromLoginId(loginId);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getEmployeeProfile(cred.user.uid);
    if (!profile) {
      await signOut(auth);
      throw new Error('Employee profile missing. Contact an administrator.');
    }
    // Purge any legacy localStorage auth session
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('employeeSession_v1');
      } catch {
        /* ignore */
      }
    }
    return { user: cred.user, profile };
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signOutEmployee() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('employeeSession_v1');
    } catch {
      /* ignore */
    }
  }
  await signOut(auth);
}

export function subscribeEmployeeAuth(callback) {
  ensurePersistence();
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, profile: null });
      return;
    }
    try {
      const profile = await getEmployeeProfile(user.uid);
      callback({ user, profile });
    } catch (err) {
      callback({ user, profile: null, error: err });
    }
  });
}

/** Admin password reset must go through Firebase Auth Admin SDK API — client cannot set hashes. */
export async function adminResetEmployeePassword(uid, newPassword) {
  if (!uid || !newPassword) throw new Error('uid and newPassword required');
  const { authJson } = await import('../lib/auth/clientAuth');
  return authJson('/api/admin/employees/reset-password', { uid, newPassword });
}

export async function listEmployees({ max = 200 } = {}) {
  const snap = await getDocs(query(collection(db, EMPLOYEES), limit(Math.min(500, max))));
  return snap.docs.map((d) => {
    const data = d.data() || {};
    const { passwordHash, passwordSalt, ...safe } = data;
    return { uid: d.id, ...safe };
  });
}

export async function setEmployeeStatus(uid, status) {
  if (!uid) throw new Error('uid required');
  await updateDoc(doc(db, EMPLOYEES, uid), {
    status,
    updatedAt: new Date().toISOString(),
  });
  return getEmployeeProfile(uid);
}

export async function adminSetEmployeeProductLine(uid, productLine) {
  if (!uid) throw new Error('uid required');
  await updateDoc(doc(db, EMPLOYEES, uid), {
    productLine,
    updatedAt: new Date().toISOString(),
  });
  return getEmployeeProfile(uid);
}

export async function updateEmployeeProfileFields(uid, patch) {
  if (!uid || auth.currentUser?.uid !== uid) {
    throw new Error('You can only update your own profile.');
  }
  const allowed = ['displayName', 'phone', 'productLine'];
  const clean = {};
  for (const k of allowed) {
    if (patch[k] != null) clean[k] = patch[k];
  }
  await updateDoc(doc(db, EMPLOYEES, uid), { ...clean, updatedAt: new Date().toISOString() });
  return getEmployeeProfile(uid);
}
