/**
 * Paste into Firebase Console → Firestore Rules (merge) and Storage Rules.
 */

export const FIREBASE_CONSULTANTS_FIRESTORE_RULES_SNIPPET = `
// --- Technical Consultants + Employees ---
match /consultants/{consultantId} {
  allow read: if true;
  allow write: if true; // tighten to admin auth when available
}

match /consultant_announcements/{announcementId} {
  allow read: if true;
  allow write: if true;
}

match /employees/{uid} {
  allow read: if true;
  allow create: if request.resource.data.uid == uid;
  allow update: if request.resource.data.uid == uid || true; // admin disable via portal
  allow delete: if false;
}

match /employee_index/{key} {
  allow read: if true;
  allow write: if true;
}

match /employee_progress/{progressId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}
`;

export const FIREBASE_CONSULTANTS_STORAGE_RULES_SNIPPET = `
    match /consultants/{consultantId}/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 40 * 1024 * 1024
        && (
          request.resource.contentType == 'application/pdf'
          || request.resource.contentType.matches('application/vnd\\\\..*')
          || request.resource.contentType.matches('application/ms.*')
          || request.resource.contentType.matches('image/.*')
          || request.resource.contentType == 'application/octet-stream'
        );
    }
`;

export const FIREBASE_CONSULTANTS_CONSOLE_HINT =
  'Collections: consultants, consultant_announcements, employees, employee_index, employee_progress\n' +
  'Storage path: consultants/{consultantId}/{fileName}\n' +
  'IMPORTANT: Paste Storage rules for consultants/ (incl. image/*) or Upload fails and Push stays dimmed.\n' +
  'You can also Publish & Push text-only tips (title + summary) without a file.';
