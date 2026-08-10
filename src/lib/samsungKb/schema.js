/**
 * Schema factories + validation.
 * Never invent specs — empty/unknown is the default.
 */

import {
  CONFIDENCE,
  DATA_STATUS,
  SAMSUNG_KB_CATEGORIES,
  SAMSUNG_KB_DATE_WINDOW,
  SAMSUNG_KB_PRODUCTION_READY,
  TRI_STATE,
} from './constants';
import { buildSearchTokens, normalizeModelNumber, productIdFromModelNumber } from './normalize';

export const SAMSUNG_KB_SCHEMA_VERSION = '1.0.0';

export function emptyEgyptInfo() {
  return {
    available: TRI_STATE.UNKNOWN,
    officially_sold: TRI_STATE.UNKNOWN,
    manufactured_in_egypt: TRI_STATE.UNKNOWN,
    assembled_in_egypt: TRI_STATE.UNKNOWN,
    manufacturing_location: '',
    manufacturing_period: '',
    evidence_source: '',
    evidence: [],
  };
}

export function emptySpecificationsForCategory(category) {
  const base = {
    network: {},
    body: {},
    display: {},
    platform: {},
    memory: {},
    camera: {},
    sound: {},
    comms: {},
    features: {},
    battery: {},
    misc: {},
  };
  switch (category) {
    case SAMSUNG_KB_CATEGORIES.WATCH:
      return { ...base, watch: {} };
    case SAMSUNG_KB_CATEGORIES.BUDS:
      return { ...base, buds: {} };
    case SAMSUNG_KB_CATEGORIES.TV:
      return { ...base, tv: {} };
    case SAMSUNG_KB_CATEGORIES.REFRIGERATOR:
      return { ...base, refrigerator: {} };
    case SAMSUNG_KB_CATEGORIES.WASHING_MACHINE:
      return { ...base, washing_machine: {} };
    case SAMSUNG_KB_CATEGORIES.AIR_CONDITIONER:
      return { ...base, air_conditioner: {} };
    case SAMSUNG_KB_CATEGORIES.DRYER:
      return { ...base, dryer: {} };
    case SAMSUNG_KB_CATEGORIES.COOKING:
      return { ...base, cooking: {} };
    case SAMSUNG_KB_CATEGORIES.VACUUM:
      return { ...base, vacuum: {} };
    case SAMSUNG_KB_CATEGORIES.DISHWASHER:
      return { ...base, dishwasher: {} };
    case SAMSUNG_KB_CATEGORIES.ACCESSORY:
      return { ...base, accessory: {} };
    case SAMSUNG_KB_CATEGORIES.OTHER_HOME:
      return { ...base, other: {} };
    default:
      return base;
  }
}

/**
 * Create an empty product shell. Caller must supply model_numbers from verified sources.
 * @param {Partial<import('./types').SamsungProductRecord> & { model_numbers: string[], marketing_name: string, family: string, category: string }} input
 */
export function createEmptyProductRecord(input) {
  const models = (input.model_numbers || [])
    .map((m) => normalizeModelNumber(m))
    .filter(Boolean);
  if (!models.length) {
    throw new Error('model_numbers is required — marketing name alone cannot identify a product');
  }
  const primary = normalizeModelNumber(input.primary_model_number || models[0]);
  const product_id =
    String(input.product_id || '').trim() || productIdFromModelNumber(primary);

  const now = new Date().toISOString();
  /** @type {import('./types').SamsungProductRecord} */
  const record = {
    product_id,
    marketing_name: String(input.marketing_name || '').trim(),
    marketing_name_ar: String(input.marketing_name_ar || '').trim(),
    family: String(input.family || '').trim(),
    category: String(input.category || SAMSUNG_KB_CATEGORIES.MOBILE),
    model_numbers: [...new Set(models)],
    primary_model_number: primary,
    region: String(input.region || '').trim(),
    release_date: input.release_date || '',
    discontinued_date: input.discontinued_date ?? null,
    country_availability: Array.isArray(input.country_availability)
      ? input.country_availability.map(String)
      : [],
    specifications:
      input.specifications && typeof input.specifications === 'object'
        ? input.specifications
        : emptySpecificationsForCategory(input.category || SAMSUNG_KB_CATEGORIES.MOBILE),
    egypt: { ...emptyEgyptInfo(), ...(input.egypt || {}) },
    sources: Array.isArray(input.sources) ? input.sources : [],
    conflicts: Array.isArray(input.conflicts) ? input.conflicts : [],
    DATA_STATUS: input.DATA_STATUS || DATA_STATUS.UNVERIFIED,
    brand: 'Samsung',
    aliases: Array.isArray(input.aliases) ? input.aliases.map(String) : [],
    search_tokens: [],
    created_at: input.created_at || now,
    updated_at: now,
    created_by: input.created_by || '',
    updated_by: input.updated_by || '',
    schema_version: SAMSUNG_KB_SCHEMA_VERSION,
  };
  record.search_tokens = buildSearchTokens(record);
  return record;
}

export function wrapSpecValue(value, { source = '', confidence = CONFIDENCE.UNKNOWN, unit = '', note = '' } = {}) {
  if (value && typeof value === 'object' && 'value' in value) {
    return {
      value: value.value,
      unit: value.unit || unit,
      source: value.source || source,
      confidence: value.confidence || confidence,
      note: value.note || note,
    };
  }
  return { value, unit, source, confidence, note };
}

/**
 * Validate a product record without inventing missing specs.
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateProductRecord(record) {
  const errors = [];
  const warnings = [];
  if (!record || typeof record !== 'object') {
    return { ok: false, errors: ['Record must be an object'], warnings };
  }
  if (!record.product_id) errors.push('product_id is required');
  if (!record.marketing_name) errors.push('marketing_name is required');
  if (!record.family) errors.push('family is required');
  if (!record.category) errors.push('category is required');
  if (!Array.isArray(record.model_numbers) || !record.model_numbers.length) {
    errors.push('model_numbers[] is required (do not use marketing name as unique id)');
  }
  if (!Object.values(DATA_STATUS).includes(record.DATA_STATUS)) {
    errors.push('DATA_STATUS must be VERIFIED | PARTIAL | UNVERIFIED');
  }
  if (!record.egypt) errors.push('egypt block is required');
  else {
    for (const key of ['available', 'officially_sold', 'manufactured_in_egypt', 'assembled_in_egypt']) {
      if (!Object.values(TRI_STATE).includes(record.egypt[key])) {
        errors.push(`egypt.${key} must be YES | NO | UNKNOWN`);
      }
    }
    if (
      record.egypt.manufactured_in_egypt === TRI_STATE.YES &&
      !(record.egypt.evidence && record.egypt.evidence.length)
    ) {
      warnings.push('manufactured_in_egypt=YES without evidence[] — add manufacturing evidence before production use');
    }
  }
  if (!Array.isArray(record.sources)) errors.push('sources[] is required (may be empty before import)');
  if (record.DATA_STATUS === DATA_STATUS.VERIFIED && (!record.sources || !record.sources.length)) {
    warnings.push('VERIFIED status without sources — attach GSMArena/Samsung source entries');
  }
  if (record.release_date) {
    const t = Date.parse(record.release_date);
    const from = Date.parse(SAMSUNG_KB_DATE_WINDOW.from);
    const to = Date.parse(SAMSUNG_KB_DATE_WINDOW.to);
    if (!Number.isNaN(t) && (t < from || t > to)) {
      warnings.push(`release_date outside declared window ${SAMSUNG_KB_DATE_WINDOW.from}…${SAMSUNG_KB_DATE_WINDOW.to}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function emptyCatalogMeta() {
  return {
    product_count: 0,
    last_import_at: null,
    production_ready: SAMSUNG_KB_PRODUCTION_READY,
    window_from: SAMSUNG_KB_DATE_WINDOW.from,
    window_to: SAMSUNG_KB_DATE_WINDOW.to,
    note: 'Catalog empty until verified Samsung product import. Do not treat as production data.',
    schema_version: SAMSUNG_KB_SCHEMA_VERSION,
  };
}

/** JSON Schema-ish contract for importers / docs (not enforced by AJV). */
export const SAMSUNG_PRODUCT_JSON_SCHEMA = {
  $id: 'scora.samsung_kb.product',
  type: 'object',
  required: [
    'product_id',
    'marketing_name',
    'family',
    'category',
    'model_numbers',
    'egypt',
    'sources',
    'DATA_STATUS',
  ],
  properties: {
    product_id: { type: 'string', description: 'Stable id from primary model number, not marketing name' },
    marketing_name: { type: 'string' },
    family: { type: 'string' },
    category: { type: 'string', enum: Object.values(SAMSUNG_KB_CATEGORIES) },
    model_numbers: { type: 'array', items: { type: 'string' }, minItems: 1 },
    primary_model_number: { type: 'string' },
    region: { type: 'string' },
    release_date: { type: 'string' },
    discontinued_date: { type: ['string', 'null'] },
    country_availability: { type: 'array', items: { type: 'string' } },
    specifications: { type: 'object' },
    egypt: {
      type: 'object',
      required: ['available', 'officially_sold', 'manufactured_in_egypt', 'assembled_in_egypt'],
      properties: {
        available: { enum: Object.values(TRI_STATE) },
        officially_sold: { enum: Object.values(TRI_STATE) },
        manufactured_in_egypt: { enum: Object.values(TRI_STATE) },
        assembled_in_egypt: { enum: Object.values(TRI_STATE) },
        manufacturing_location: { type: 'string' },
        manufacturing_period: { type: 'string' },
        evidence_source: { type: 'string' },
        evidence: { type: 'array' },
      },
    },
    sources: { type: 'array' },
    conflicts: { type: 'array' },
    DATA_STATUS: { enum: Object.values(DATA_STATUS) },
  },
};
