/** Paste into Firebase Console → Storage → Rules → Publish (fixes storage/unauthorized). */
export const FIREBASE_STORAGE_RULES_CONSOLE_URL =
  'https://console.firebase.google.com/project/tcs-for-engineers/storage/tcs-for-engineers.firebasestorage.app/rules';

export const FIREBASE_STORAGE_RULES_SNIPPET = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tcs/all-products-images/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024;
    }
    match /engineers/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /PQA/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /mx/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /da/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /av/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}`;
