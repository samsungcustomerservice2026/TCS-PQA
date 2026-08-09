/**
 * Paste into Firebase Console → Firestore → Rules (merge with existing rules).
 * Path layout for GoGo:
 *   gogo_assistant / workspace
 *   gogo_assistant / workspace / qa / {qaId}
 *   gogo_assistant / workspace / culture / {cultureId}
 *   gogo_assistant / workspace / chats / {visitorId}
 *
 * Chat docs MUST use document id === visitorId. Clients only read/write their own chat.
 */
export const FIREBASE_GOGO_FIRESTORE_RULES_SNIPPET = `
// --- GoGo AI assistant ---
match /gogo_assistant/{docId} {
  allow read, write: if true; // workspace root marker
}

match /gogo_assistant/workspace/qa/{qaId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}

match /gogo_assistant/workspace/culture/{cultureId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}

match /gogo_assistant/workspace/chats/{visitorId} {
  allow create: if request.resource.data.visitorId == visitorId
    && request.resource.data.visitorId is string
    && request.resource.data.visitorId.size() >= 8
    && request.resource.data.visitorId.size() <= 80
    && request.resource.data.keys().hasAll(['visitorId', 'messages', 'updatedAt']);
  allow read, update: if resource.data.visitorId == visitorId
    && request.resource.data.visitorId == visitorId;
  allow delete: if false;
}
`;

export const FIREBASE_GOGO_CONSOLE_HINT =
  'Firebase Console → Firestore → Data → gogo_assistant / workspace / {qa, culture, chats}';
