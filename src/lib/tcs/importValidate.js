/**
 * TCS Excel import — dry-run validation (server-safe pure functions).
 */
import { pickBestTcsWorksheetRows, parseTcsScoreSheetRows } from '../tcsExcelImport';

export function validateExcelMeta({ fileName = '', mime = '', size = 0, maxBytes = 8 * 1024 * 1024 }) {
  const errors = [];
  const name = String(fileName).toLowerCase();
  if (!/\.(xlsx|xls|csv)$/.test(name)) errors.push('Invalid extension — use .xlsx, .xls, or .csv');
  if (size > maxBytes) errors.push(`File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
  if (mime && !/spreadsheet|excel|csv|octet-stream/i.test(mime)) {
    errors.push('Unexpected MIME type');
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Dry-run: compare parsed rows against existing engineers list.
 * @returns {{ toAdd, toUpdate, rejected, summary }}
 */
export function dryRunTcsImport({ workbookRows, existing = [], collectionHint = 'engineers' }) {
  const { rows, meta } = pickBestTcsWorksheetRows
    ? { rows: workbookRows, meta: {} }
    : { rows: workbookRows, meta: {} };

  const parsed = Array.isArray(workbookRows) ? workbookRows : [];
  const byCode = new Map();
  for (const e of existing) {
    const code = String(e.code || '').trim().toUpperCase();
    if (code) byCode.set(code, e);
  }

  const toAdd = [];
  const toUpdate = [];
  const rejected = [];
  const seen = new Set();

  for (const row of parsed) {
    const code = String(row.code || row.Code || '').trim().toUpperCase();
    if (!code) {
      rejected.push({ row, reason: 'missing_code' });
      continue;
    }
    if (seen.has(code)) {
      rejected.push({ row, reason: 'duplicate_in_file', code });
      continue;
    }
    seen.add(code);

    const score = Number(row.tcsScore ?? row.score ?? row.TCS);
    if (row.tcsScore != null || row.score != null) {
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        rejected.push({ row, reason: 'invalid_score', code, score });
        continue;
      }
    }

    if (byCode.has(code)) {
      toUpdate.push({ code, before: byCode.get(code), after: row });
    } else {
      toAdd.push({ code, after: row });
    }
  }

  return {
    collectionHint,
    toAdd,
    toUpdate,
    rejected,
    summary: {
      add: toAdd.length,
      update: toUpdate.length,
      rejected: rejected.columns || rejected.length,
      totalParsed: parsed.length,
    },
    meta,
  };
}

export { parseTcsScoreSheetRows };
