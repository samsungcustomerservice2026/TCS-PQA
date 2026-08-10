/**
 * AI retrieval layer for SCORA GoGo.
 * Prefer verified KB records. Never invent specs when KB misses.
 */

import { DATA_STATUS, SAMSUNG_KB_UNAVAILABLE_REPLY } from './constants';
import { extractModelNumberCandidates, findByExactModelNumber, searchSamsungKb } from './search';

function unwrapSpec(val) {
  if (val && typeof val === 'object' && 'value' in val) return val.value;
  return val;
}

function pickSpecGroups(record, focus = 'all') {
  const specs = record.specifications || {};
  const groups =
    focus && focus !== 'all'
      ? { [focus]: specs[focus] || specs.platform || specs[focus] }
      : specs;
  /** @type {Record<string, unknown>} */
  const flat = {};
  Object.entries(groups || {}).forEach(([group, bag]) => {
    if (!bag || typeof bag !== 'object') return;
    Object.entries(bag).forEach(([k, v]) => {
      const value = unwrapSpec(v);
      if (value === undefined || value === null || value === '') return;
      flat[`${group}.${k}`] = value;
    });
  });
  return flat;
}

/**
 * @param {string} question
 * @param {import('./types').SamsungProductRecord[]} catalog
 * @param {{ lang?: 'en'|'ar', focus?: string }} [opts]
 */
export function retrieveSamsungKbForQuestion(question, catalog, opts = {}) {
  const lang = opts.lang === 'ar' ? 'ar' : 'en';
  const catalogSize = Array.isArray(catalog) ? catalog.length : 0;

  if (!catalogSize) {
    return {
      hit: false,
      reason: 'catalog_empty',
      production_ready: false,
      answer: null,
      unavailable_message: SAMSUNG_KB_UNAVAILABLE_REPLY[lang],
      product: null,
      sources: [],
      context_for_llm: null,
    };
  }

  const modelCandidates = extractModelNumberCandidates(question);
  let product = null;
  for (const m of modelCandidates) {
    product = findByExactModelNumber(catalog, m);
    if (product) break;
  }
  if (!product) {
    const hits = searchSamsungKb(catalog, { q: question, limit: 5 });
    product = hits[0] || null;
  }

  if (!product) {
    return {
      hit: false,
      reason: 'no_match',
      production_ready: false,
      answer: null,
      unavailable_message: SAMSUNG_KB_UNAVAILABLE_REPLY[lang],
      product: null,
      sources: [],
      context_for_llm: null,
    };
  }

  if (product.DATA_STATUS === DATA_STATUS.UNVERIFIED) {
    return {
      hit: true,
      reason: 'unverified_record',
      production_ready: false,
      answer: null,
      unavailable_message: SAMSUNG_KB_UNAVAILABLE_REPLY[lang],
      product,
      sources: product.sources || [],
      context_for_llm: null,
    };
  }

  const focus = opts.focus || 'all';
  const flat = pickSpecGroups(product, focus);
  const hasSpecs = Object.keys(flat).length > 0;

  if (!hasSpecs) {
    return {
      hit: true,
      reason: 'record_without_specs',
      production_ready: false,
      answer: null,
      unavailable_message: SAMSUNG_KB_UNAVAILABLE_REPLY[lang],
      product,
      sources: product.sources || [],
      context_for_llm: null,
    };
  }

  const lines = Object.entries(flat).map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  const answer =
    lang === 'ar'
      ? `${product.marketing_name} (${product.primary_model_number || (product.model_numbers || [])[0] || product.product_id}):\n${lines.join('\n')}`
      : `${product.marketing_name} (${product.primary_model_number || (product.model_numbers || [])[0] || product.product_id}):\n${lines.join('\n')}`;

  const sourceNote =
    (product.sources || [])
      .map((s) => s.source + (s.url ? ` <${s.url}>` : ''))
      .filter(Boolean)
      .slice(0, 3)
      .join('; ') || '';

  return {
    hit: true,
    reason: 'verified_or_partial',
    production_ready: product.DATA_STATUS === DATA_STATUS.VERIFIED,
    answer: sourceNote ? `${answer}\n\nSources: ${sourceNote}` : answer,
    unavailable_message: null,
    product,
    sources: product.sources || [],
    open_conflicts: (product.conflicts || []).filter((c) => c.status === 'OPEN'),
    context_for_llm: [
      '## Samsung KB retrieval (verified structured data — do not invent beyond this)',
      `product_id: ${product.product_id}`,
      `marketing_name: ${product.marketing_name}`,
      `model_numbers: ${(product.model_numbers || []).join(', ')}`,
      `DATA_STATUS: ${product.DATA_STATUS}`,
      `egypt.available: ${product.egypt?.available}`,
      `egypt.manufactured_in_egypt: ${product.egypt?.manufactured_in_egypt}`,
      'specifications:',
      ...lines,
      sourceNote ? `sources: ${sourceNote}` : 'sources: (none listed)',
      'If the visitor asks for a field not listed above, say it is unavailable in the knowledge base.',
    ].join('\n'),
  };
}
