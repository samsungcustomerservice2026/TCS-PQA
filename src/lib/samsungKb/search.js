/**
 * In-memory / catalog search for Samsung KB.
 * Scales to thousands of products loaded into memory; Firestore filters optional upstream.
 */

import { DATA_STATUS, TRI_STATE } from './constants';
import { compactSearchText, modelNumberMatches, normalizeModelNumber, normalizeSearchText } from './normalize';

function scoreRecord(record, query) {
  const q = normalizeSearchText(query);
  if (!q) return 0;
  const qCompact = compactSearchText(q);
  const qModel = normalizeModelNumber(q);
  let score = 0;

  if (modelNumberMatches(record.model_numbers, q) || modelNumberMatches([record.primary_model_number], q)) {
    score += 100;
  }
  if (qModel && (record.model_numbers || []).some((m) => normalizeModelNumber(m).includes(qModel))) {
    score += 40;
  }

  const name = normalizeSearchText(record.marketing_name);
  const nameCompact = compactSearchText(record.marketing_name);
  if (name === q) score += 80;
  else if (name.includes(q) || nameCompact.includes(qCompact)) score += 50;

  const family = normalizeSearchText(record.family);
  if (family && (family === q || family.includes(q))) score += 25;

  const tokens = record.search_tokens || [];
  if (tokens.includes(q) || tokens.includes(qCompact)) score += 20;
  q.split(/\s+/).forEach((w) => {
    if (w.length >= 2 && tokens.some((t) => t.includes(w))) score += 5;
  });

  if (record.DATA_STATUS === DATA_STATUS.VERIFIED) score += 8;
  else if (record.DATA_STATUS === DATA_STATUS.PARTIAL) score += 3;

  return score;
}

/**
 * @param {import('./types').SamsungProductRecord[]} catalog
 * @param {import('./types').SamsungKbSearchQuery} query
 */
export function searchSamsungKb(catalog, query = {}) {
  const list = Array.isArray(catalog) ? catalog : [];
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 200);
  let rows = list;

  if (query.category) {
    rows = rows.filter((r) => r.category === query.category);
  }
  if (query.family) {
    const f = normalizeSearchText(query.family);
    rows = rows.filter((r) => normalizeSearchText(r.family).includes(f));
  }
  if (query.region) {
    const region = normalizeSearchText(query.region);
    rows = rows.filter(
      (r) =>
        normalizeSearchText(r.region).includes(region) ||
        (r.country_availability || []).some((c) => normalizeSearchText(c).includes(region)),
    );
  }
  if (query.year) {
    const y = String(query.year);
    rows = rows.filter((r) => String(r.release_date || '').startsWith(y));
  }
  if (query.DATA_STATUS) {
    rows = rows.filter((r) => r.DATA_STATUS === query.DATA_STATUS);
  }
  if (query.egypt_available && Object.values(TRI_STATE).includes(query.egypt_available)) {
    rows = rows.filter((r) => r.egypt?.available === query.egypt_available);
  }
  if (query.egypt_manufactured && Object.values(TRI_STATE).includes(query.egypt_manufactured)) {
    rows = rows.filter((r) => r.egypt?.manufactured_in_egypt === query.egypt_manufactured);
  }
  if (query.model_number) {
    rows = rows.filter(
      (r) =>
        modelNumberMatches(r.model_numbers, query.model_number) ||
        modelNumberMatches([r.primary_model_number], query.model_number),
    );
  }
  if (query.marketing_name) {
    const n = normalizeSearchText(query.marketing_name);
    rows = rows.filter((r) => normalizeSearchText(r.marketing_name).includes(n));
  }

  const free = String(query.q || '').trim();
  if (free) {
    const scored = rows
      .map((r) => ({ r, s: scoreRecord(r, free) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, limit).map((x) => ({ ...x.r, _score: x.s }));
  }

  return rows.slice(0, limit);
}

export function findByExactModelNumber(catalog, modelNumber) {
  const n = normalizeModelNumber(modelNumber);
  if (!n) return null;
  return (
    (catalog || []).find(
      (r) =>
        normalizeModelNumber(r.primary_model_number) === n ||
        (r.model_numbers || []).some((m) => normalizeModelNumber(m) === n),
    ) || null
  );
}

export function findByProductId(catalog, productId) {
  const id = String(productId || '').trim();
  if (!id) return null;
  return (catalog || []).find((r) => r.product_id === id) || null;
}

/** Detect likely model number tokens in free text (SM-XXXX / SMXXXX). */
export function extractModelNumberCandidates(text) {
  const raw = String(text || '').toUpperCase();
  const hits = new Set();
  const re = /\b(SM-[A-Z0-9]{4,})\b|\b(SM[A-Z0-9]{4,})\b/g;
  let m;
  while ((m = re.exec(raw))) {
    hits.add(normalizeModelNumber(m[1] || m[2]));
  }
  return [...hits];
}
