/** Deep-clone a plain JSON-serializable value. */
export function cloneSnapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

const MAX_UNDO_STACK = 20;

/**
 * @typedef {object} AdminUndoEntry
 * @property {string} type - SAVE_RECORD | ARCHIVE | BULK_ARCHIVE | RESTORE | BULK_RESTORE | SNAPSHOT
 * @property {string} label - Human-readable description for confirmations
 * @property {string} colName - Firestore collection
 * @property {object} [before] - Previous engineer record (SAVE_RECORD)
 * @property {object} [savedRecord] - Record after save (SAVE_RECORD)
 * @property {boolean} [wasNew] - Created new doc (SAVE_RECORD)
 * @property {object} [record] - Single record (ARCHIVE / RESTORE)
 * @property {object[]} [records] - Multiple records (bulk ops)
 * @property {object[]} [engineers] - Full active list (SNAPSHOT)
 * @property {object[]} [hiddenEngineers] - Full archive list (SNAPSHOT)
 */

export function pushUndoEntry(stackRef, setCount, entry) {
  const next = [...(stackRef.current || []), entry].slice(-MAX_UNDO_STACK);
  stackRef.current = next;
  setCount(next.length);
}

export function popUndoEntry(stackRef, setCount) {
  const stack = stackRef.current || [];
  if (!stack.length) return null;
  const entry = stack[stack.length - 1];
  stackRef.current = stack.slice(0, -1);
  setCount(stackRef.current.length);
  return entry;
}
