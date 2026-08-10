/**
 * Firestore rules snippet for Samsung Product Knowledge Base.
 * Paste/merge into Firebase Console → Firestore → Rules.
 *
 * Paths:
 *   samsung_kb / catalog_meta
 *   samsung_kb / workspace / products / {productId}
 *   samsung_kb / workspace / imports / {importId}
 *
 * Reads are open for GoGo retrieval; writes should be tightened to admin auth when available.
 * Current SCORA admin uses custom localStorage session (not Firebase Auth) — keep write open
 * only if your security model already trusts client rules like other SCORA collections.
 */
export const FIREBASE_SAMSUNG_KB_RULES_SNIPPET = `
// --- Samsung Product Knowledge Base ---
match /samsung_kb/catalog_meta {
  allow read: if true;
  allow write: if true; // tighten when Firebase Auth admins exist
}

match /samsung_kb/workspace/products/{productId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if true; // admin-only recommended
}

match /samsung_kb/workspace/imports/{importId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;
}
`;

export const FIREBASE_SAMSUNG_KB_CONSOLE_HINT =
  'Firebase Console → Firestore → samsung_kb / workspace / products\n' +
  'Meta: samsung_kb / catalog_meta\n' +
  'product_id = primary model number slug (e.g. sm-s928b), NOT marketing name.\n' +
  'DATA_STATUS: VERIFIED | PARTIAL | UNVERIFIED. Catalog starts empty.';
