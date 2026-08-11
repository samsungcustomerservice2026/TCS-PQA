'use client';

/**
 * Side-effect import: installs the Firestore hardAssert window guard
 * before the rest of the app mounts (stops Next overlay spam for ca9/b815).
 */
import '../firebase';

export default function FirestoreClientGuard() {
  return null;
}
