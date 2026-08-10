/**
 * Import parsers: JSON / CSV / Excel → validated product records.
 * Does not invent specifications; empty cells stay empty.
 */

import { DATA_STATUS, TRI_STATE } from './constants';
import { createEmptyProductRecord, validateProductRecord } from './schema';
import { normalizeModelNumber } from './normalize';

function splitModels(raw) {
  return String(raw || '')
    .split(/[|;,]/)
    .map((s) => normalizeModelNumber(s))
    .filter(Boolean);
}

function parseTri(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'YES' || s === 'Y' || s === 'TRUE' || s === '1') return TRI_STATE.YES;
  if (s === 'NO' || s === 'N' || s === 'FALSE' || s === '0') return TRI_STATE.NO;
  return TRI_STATE.UNKNOWN;
}

function parseStatus(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (Object.values(DATA_STATUS).includes(s)) return s;
  return DATA_STATUS.UNVERIFIED;
}

function parseSources(raw) {
  if (Array.isArray(raw)) return raw.filter((s) => s && typeof s === 'object');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const url = String(raw).trim();
    if (!url) return [];
    return [{ source: 'import', url, accessed_date: '' }];
  }
}

/**
 * Normalize one import row (object) into a product record draft.
 */
export function rowToProductDraft(row) {
  const models = splitModels(row.model_numbers || row.model_number || row.primary_model_number);
  if (!models.length) {
    throw new Error('Row missing model_numbers / model_number');
  }
  const draft = createEmptyProductRecord({
    product_id: row.product_id,
    marketing_name: row.marketing_name || row.name || '',
    marketing_name_ar: row.marketing_name_ar || '',
    family: row.family || '',
    category: row.category || '',
    model_numbers: models,
    primary_model_number: row.primary_model_number || models[0],
    region: row.region || '',
    release_date: row.release_date || '',
    discontinued_date: row.discontinued_date || null,
    country_availability: String(row.country_availability || '')
      .split(/[|;,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    specifications:
      typeof row.specifications === 'object' && row.specifications
        ? row.specifications
        : undefined,
    egypt: {
      available: parseTri(row.egypt_available ?? row['egypt.available']),
      officially_sold: parseTri(row.egypt_officially_sold ?? row['egypt.officially_sold']),
      manufactured_in_egypt: parseTri(
        row.egypt_manufactured_in_egypt ?? row['egypt.manufactured_in_egypt'],
      ),
      assembled_in_egypt: parseTri(row.egypt_assembled_in_egypt ?? row['egypt.assembled_in_egypt']),
      manufacturing_location: row.manufacturing_location || '',
      manufacturing_period: row.manufacturing_period || '',
      evidence_source: row.evidence_source || '',
      evidence: Array.isArray(row.evidence) ? row.evidence : [],
    },
    sources: parseSources(row.sources),
    DATA_STATUS: parseStatus(row.DATA_STATUS || row.data_status),
    aliases: String(row.aliases || '')
      .split(/[|;,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  });
  return draft;
}

/**
 * @returns {{ products: object[], errors: Array<{ index: number, error: string }>, warnings: string[] }}
 */
export function importProductsFromJson(payload) {
  const errors = [];
  const warnings = [];
  let rows = [];
  if (Array.isArray(payload)) rows = payload;
  else if (payload && Array.isArray(payload.products)) rows = payload.products;
  else {
    return { products: [], errors: [{ index: -1, error: 'JSON must be an array or { products: [] }' }], warnings };
  }

  const products = [];
  rows.forEach((row, index) => {
    try {
      const draft = rowToProductDraft(row);
      const v = validateProductRecord(draft);
      if (!v.ok) {
        errors.push({ index, error: v.errors.join('; ') });
        return;
      }
      warnings.push(...v.warnings.map((w) => `[${index}] ${w}`));
      products.push(draft);
    } catch (err) {
      errors.push({ index, error: err.message || String(err) });
    }
  });
  return { products, errors, warnings };
}

function parseCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function importProductsFromCsv(text) {
  const rows = parseCsv(text);
  return importProductsFromJson(rows);
}

/**
 * Parse Excel ArrayBuffer using the project's xlsx dependency.
 */
export async function importProductsFromExcel(arrayBuffer) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { products: [], errors: [{ index: -1, error: 'Workbook has no sheets' }], warnings: [] };
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return importProductsFromJson(rows);
}
