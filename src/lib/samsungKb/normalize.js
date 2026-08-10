/**
 * Model-number / search token normalization.
 */

export function normalizeModelNumber(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '-');
}

export function productIdFromModelNumber(modelNumber) {
  const n = normalizeModelNumber(modelNumber);
  return n
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

export function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactSearchText(text) {
  return normalizeSearchText(text).replace(/\s+/g, '');
}

/** Build inverted search tokens for a product record (no invented fields). */
export function buildSearchTokens(record) {
  const parts = [
    record.product_id,
    record.marketing_name,
    record.marketing_name_ar,
    record.family,
    record.category,
    record.region,
    record.primary_model_number,
    ...(record.model_numbers || []),
    ...(record.aliases || []),
    ...(record.country_availability || []),
  ];
  const tokens = new Set();
  for (const p of parts) {
    const n = normalizeSearchText(p);
    if (!n) continue;
    tokens.add(n);
    tokens.add(n.replace(/\s+/g, ''));
    n.split(/\s+/).forEach((w) => w.length >= 2 && tokens.add(w));
    const model = normalizeModelNumber(p);
    if (model) {
      tokens.add(model.toLowerCase());
      tokens.add(model.replace(/-/g, '').toLowerCase());
    }
  }
  if (record.release_date) {
    const y = String(record.release_date).slice(0, 4);
    if (/^\d{4}$/.test(y)) tokens.add(y);
  }
  return [...tokens];
}

export function modelNumberMatches(haystackModels = [], needle = '') {
  const n = normalizeModelNumber(needle);
  if (!n) return false;
  const nCompact = n.replace(/-/g, '');
  return (haystackModels || []).some((m) => {
    const h = normalizeModelNumber(m);
    const hCompact = h.replace(/-/g, '');
    return h === n || hCompact === nCompact || h.startsWith(n) || hCompact.startsWith(nCompact) || n.startsWith(h) || nCompact.startsWith(hCompact);
  });
}
