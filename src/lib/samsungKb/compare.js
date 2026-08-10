/**
 * Comparison engine — only surfaces fields present on records (no invention).
 */

function unwrap(val) {
  if (val && typeof val === 'object' && 'value' in val) return val.value;
  return val;
}

function flattenSpecs(specifications = {}, prefix = 'specifications') {
  /** @type {Record<string, unknown>} */
  const out = {};
  const walk = (obj, path) => {
    if (!obj || typeof obj !== 'object') return;
    Object.entries(obj).forEach(([k, v]) => {
      const p = `${path}.${k}`;
      if (v && typeof v === 'object' && 'value' in v) {
        out[p] = unwrap(v);
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, p);
      } else if (v !== undefined && v !== null && v !== '') {
        out[p] = v;
      }
    });
  };
  walk(specifications, prefix);
  return out;
}

const DEFAULT_COMPARE_FIELDS = [
  'marketing_name',
  'primary_model_number',
  'family',
  'category',
  'region',
  'release_date',
  'DATA_STATUS',
  'specifications.display',
  'specifications.platform',
  'specifications.memory',
  'specifications.camera',
  'specifications.battery',
  'specifications.comms',
  'specifications.body',
  'egypt.available',
  'egypt.manufactured_in_egypt',
];

function getPath(record, path) {
  if (!path.includes('.')) return record?.[path];
  if (path.startsWith('specifications.')) {
    const flat = flattenSpecs(record.specifications || {});
    // Prefer exact; else group blob
    if (flat[path] !== undefined) return flat[path];
    const group = path.split('.')[1];
    return record.specifications?.[group] || null;
  }
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), record);
}

/**
 * @param {import('./types').SamsungProductRecord[]} products
 * @param {{ fields?: string[] }} [opts]
 * @returns {import('./types').SamsungKbCompareResult}
 */
export function compareSamsungProducts(products, opts = {}) {
  const list = (Array.isArray(products) ? products : []).filter(Boolean);
  const fields = opts.fields?.length ? opts.fields : DEFAULT_COMPARE_FIELDS;
  /** @type {Record<string, Record<string, unknown>>} */
  const matrix = {};
  const missing_fields = [];

  fields.forEach((field) => {
    matrix[field] = {};
    let any = false;
    list.forEach((p) => {
      const v = getPath(p, field);
      matrix[field][p.product_id] = v ?? null;
      if (v !== undefined && v !== null && v !== '') any = true;
    });
    if (!any) missing_fields.push(field);
  });

  const key_differences = [];
  fields.forEach((field) => {
    const values = list.map((p) => JSON.stringify(matrix[field][p.product_id] ?? null));
    const unique = new Set(values);
    if (unique.size > 1) {
      key_differences.push(field);
    }
  });

  // Regional variant differences on model_numbers
  if (list.length >= 2) {
    const modelSets = list.map((p) => (p.model_numbers || []).slice().sort().join('|'));
    if (new Set(modelSets).size > 1) key_differences.push('model_numbers');
  }

  return {
    product_ids: list.map((p) => p.product_id),
    fields,
    matrix,
    key_differences: [...new Set(key_differences)],
    missing_fields,
  };
}
