/**
 * Spec conflict helpers — never silently pick a winner.
 */

import { CONFIDENCE } from './constants';

function unwrap(val) {
  if (valueLooksLikeSpec(val)) return val.value;
  return val;
}

function valueLooksLikeSpec(val) {
  return val && typeof val === 'object' && 'value' in val;
}

function serializeValue(v) {
  try {
    return JSON.stringify(unwrap(v));
  } catch {
    return String(v);
  }
}

/**
 * Register a conflict when two sources disagree on the same field path.
 * @param {import('./types').SamsungProductRecord} record
 * @param {string} field_path
 * @param {{ value: unknown, source?: string, confidence?: string }} a
 * @param {{ value: unknown, source?: string, confidence?: string }} b
 */
export function registerSpecConflict(record, field_path, a, b) {
  if (!record) return record;
  if (serializeValue(a.value) === serializeValue(b.value)) return record;
  const conflicts = Array.isArray(record.conflicts) ? [...record.conflicts] : [];
  const existing = conflicts.find((c) => c.field_path === field_path && c.status === 'OPEN');
  const entry = {
    value: unwrap(a.value),
    source: a.source || '',
    confidence: a.confidence || CONFIDENCE.UNKNOWN,
  };
  const entryB = {
    value: unwrap(b.value),
    source: b.source || '',
    confidence: b.confidence || CONFIDENCE.UNKNOWN,
  };
  if (existing) {
    const vals = existing.values || [];
    const keys = new Set(vals.map((v) => serializeValue(v.value)));
    if (!keys.has(serializeValue(entry.value))) vals.push(entry);
    if (!keys.has(serializeValue(entryB.value))) vals.push(entryB);
    existing.values = vals;
  } else {
    conflicts.push({
      field_path,
      values: [entry, entryB],
      status: 'OPEN',
      note: 'Sources disagree — do not auto-resolve',
    });
  }
  record.conflicts = conflicts;
  return record;
}

export function listOpenConflicts(catalog = []) {
  const out = [];
  (catalog || []).forEach((p) => {
    (p.conflicts || [])
      .filter((c) => c.status === 'OPEN')
      .forEach((c) => out.push({ product_id: p.product_id, marketing_name: p.marketing_name, ...c }));
  });
  return out;
}
