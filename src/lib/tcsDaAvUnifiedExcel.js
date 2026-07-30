/**
 * TCS DA/AV unified engineer workbook.
 * Admin template: single sheet with Q1/Q2 KPI columns (wide format).
 * Parser also accepts the multi-sheet master (Quarterly Results / Engineers).
 */
import * as XLSX from 'xlsx';
import { DEFAULT_ENGINEER_PHOTO_URL } from '../constants.js';

export const TCS_DA_AV_UNIFIED_FORMAT = 'da_av_quarterly_wide';
export const TCS_DA_AV_ENGINEERS_SHEET = 'Engineers';
export const TCS_DA_AV_QUARTERLY_SHEET = 'Quarterly Results';
export const TCS_DA_AV_SUMMARY_SHEET = 'Summary';
/** Single-tab upload/download template sheet name. */
export const TCS_DA_AV_TEMPLATE_SHEET = 'DA AV KPIs';
export const TCS_DA_AV_UNIFIED_TEMPLATE_FILENAME = 'TCS_DA_AV_KPI_Template.xlsx';

export const TCS_DA_AV_ENGINEERS_HEADERS = [
  'Engineer Code',
  'Engineer Name',
  'ASC Name',
  'Partner',
  'Service Type',
  'Status',
  'Product Group',
  'Dedicated / Non Dedicated',
  'Major / Minor',
  'Evaluation Target (Yes/No)',
  'SBA ID',
  'Product',
];

/**
 * Single-sheet template headers (exact layout used for DA/AV upload).
 * Engineer Name first so dossier/search show the person, not only the code.
 */
export const TCS_DA_AV_TEMPLATE_HEADERS = [
  'Engineer Name',
  'Engineer Code',
  'Partner',
  'ASC',
  'Service Type',
  'Q1 Final',
  'Q1 SSR',
  'Q1 REDO',
  'Q1 Chatbot',
  'Q1 HASS',
  'Q1 ACP',
  'Q1 Training',
  'Q1 Linkage',
  'Q2 Final',
  'Q2 RNPS',
  'Q2 REDO',
  'Q2 Training',
  'Q2 ST',
  'Q2 MJ',
  'Q2 CR',
  'Q2 Kahoot',
  'Q2 HASS',
  'Q2 RepairVol',
];

/** Identity + static columns on Quarterly Results (left block) — master workbook. */
export const TCS_DA_AV_QUARTERLY_IDENTITY_HEADERS = [
  'Engineer Code',
  'Engineer Name',
  'Partner',
  'ASC Name',
  'Service Type',
];

export const TCS_DA_AV_Q1_METRIC_HEADERS = [
  'Q1 Final Score',
  'Q1 SSR',
  'Q1 REDO',
  'Q1 Chatbot',
  'Q1 HASS',
  'Q1 Acc Core Parts',
  'Q1 Training Attendance',
  'Q1 Linkage Ratio',
];

export const TCS_DA_AV_Q2_METRIC_HEADERS = [
  'Q2 Final Score',
  'Q2 RNPS',
  'Q2 REDO',
  'Q2 Training Attendance',
  'Q2 ST Con',
  'Q2 MJ %',
  'Q2 Complete Repair',
  'Q2 Kahoot',
  'Q2 HASS',
  'Q2 Repair Volume',
];

/** Placeholder KPI slots for future quarters (same count as richest quarter). */
export const TCS_DA_AV_FUTURE_KPI_SLOTS = 9;

export function buildFutureQuarterMetricHeaders(quarterLabel) {
  const q = String(quarterLabel || '').toUpperCase();
  const headers = [`${q} Final Score`];
  for (let i = 1; i <= TCS_DA_AV_FUTURE_KPI_SLOTS; i += 1) {
    headers.push(`${q} KPI ${i}`);
  }
  return headers;
}

export const TCS_DA_AV_Q3_METRIC_HEADERS = buildFutureQuarterMetricHeaders('Q3');
export const TCS_DA_AV_Q4_METRIC_HEADERS = buildFutureQuarterMetricHeaders('Q4');

export const TCS_DA_AV_QUARTERLY_HEADERS = [
  ...TCS_DA_AV_QUARTERLY_IDENTITY_HEADERS,
  ...TCS_DA_AV_Q1_METRIC_HEADERS,
  ...TCS_DA_AV_Q2_METRIC_HEADERS,
  ...TCS_DA_AV_Q3_METRIC_HEADERS,
  ...TCS_DA_AV_Q4_METRIC_HEADERS,
];

export const TCS_DA_AV_SUMMARY_HEADERS = [
  'Engineer Code',
  'Engineer Name',
  'Product',
  'Q1 Final Score',
  'Q2 Final Score',
  'Q3 Final Score',
  'Q4 Final Score',
  'Annual Average',
  'Best Quarter',
  'Worst Quarter',
  'Quarter Improvement',
  'Annual Rank',
];

const MONTH_BY_QUARTER = {
  Q1: 'March',
  Q2: 'June',
  Q3: 'September',
  Q4: 'December',
};

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, '');
}

function cell(rows, rowIdx, colIdx) {
  if (colIdx < 0) return '';
  const r = rows[rowIdx] || [];
  const v = r[colIdx];
  return v === undefined || v === null ? '' : v;
}

function isBlank(value) {
  if (value === undefined || value === null) return true;
  const s = String(value).trim();
  return !s || /^n\/?a$/i.test(s) || /^-$/.test(s);
}

/** Parse percent / number cells. Fractions in (0,1] → ×100. Keep values >100 (bonus finals). */
export function parseDaAvMetricNumber(value) {
  if (isBlank(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 0 && value <= 1) return Number((value * 100).toFixed(4));
    return value;
  }
  const s = String(value).trim();
  if (/no\s*history/i.test(s)) return null;
  const hasPct = s.includes('%');
  const cleaned = s.replace(/,/g, '').replace(/%/g, '').trim();
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  if (hasPct) return n;
  if (n > 0 && n <= 1) return Number((n * 100).toFixed(4));
  return n;
}

export function normalizeEngineerCode(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (/^\d+(\.0+)?$/.test(s)) return String(parseInt(s, 10));
  return s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || s;
}

/** Map Product Group from source sheets → app Product (DA / AV). */
export function mapDaAvProductGroup(productGroup) {
  const g = String(productGroup || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!g) return '';
  if (g === 'DA' || g === 'HA' || g === 'HOME APPLIANCES') return 'DA';
  if (g === 'AV' || g === 'VD' || g === 'AUDIO VIDEO') return 'AV';
  if (g.includes('AV') && (g.includes('HA') || g.includes('DA'))) return 'AV+DA';
  if (g.includes('AV')) return 'AV';
  if (g.includes('HA') || g.includes('DA')) return 'DA';
  return g;
}

function findHeaderRow(rows, requiredHints = []) {
  const maxScan = Math.min(rows.length, 30);
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < maxScan; i += 1) {
    const row = rows[i] || [];
    const norms = row.map((c) => normalizeHeader(c));
    const nonEmpty = norms.filter(Boolean).length;
    if (nonEmpty < 3) continue;
    let score = nonEmpty;
    requiredHints.forEach((hint) => {
      if (norms.some((n) => n.includes(hint))) score += 8;
    });
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function mapColumns(headerRow) {
  const map = {};
  (headerRow || []).forEach((h, idx) => {
    const n = normalizeHeader(h);
    if (!n) return;
    if (!(n in map)) map[n] = idx;
  });
  return map;
}

function col(map, ...aliases) {
  for (const a of aliases) {
    const n = normalizeHeader(a);
    if (n in map) return map[n];
  }
  return -1;
}

export function workbookHasDaAvQuarterlyResults(workbook) {
  if (!workbook?.SheetNames?.length) return false;
  if (
    workbook.SheetNames.some((name) => {
      const n = normalizeHeader(name);
      return (
        n === normalizeHeader(TCS_DA_AV_QUARTERLY_SHEET) ||
        n === normalizeHeader(TCS_DA_AV_TEMPLATE_SHEET) ||
        n === normalizeHeader('DA AV') ||
        n.includes('daav')
      );
    })
  ) {
    return true;
  }
  // Detect single-tab template by header shape (Engineer Code + Q1 Final + Q2 Final).
  for (const name of workbook.SheetNames) {
    const rows = sheetToRows(workbook, name);
    const headerRow = findHeaderRow(rows, ['engineercode', 'q1final', 'q2final']);
    if (headerRow < 0) continue;
    const cmap = mapColumns(rows[headerRow]);
    const hasCode = col(cmap, 'Engineer Code', 'Engineer') >= 0;
    const hasQ1 = col(cmap, 'Q1 Final', 'Q1 Final Score') >= 0;
    const hasQ2 = col(cmap, 'Q2 Final', 'Q2 Final Score') >= 0;
    if (hasCode && (hasQ1 || hasQ2)) return true;
  }
  return false;
}

function sheetToRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
}

function pickDaAvDataSheetName(workbook) {
  const preferred = [
    TCS_DA_AV_TEMPLATE_SHEET,
    TCS_DA_AV_QUARTERLY_SHEET,
    'DA AV',
    'Sheet1',
    'Sheet',
  ];
  for (const want of preferred) {
    const hit = workbook.SheetNames.find((n) => normalizeHeader(n) === normalizeHeader(want));
    if (hit) return hit;
  }
  for (const name of workbook.SheetNames) {
    const rows = sheetToRows(workbook, name);
    const headerRow = findHeaderRow(rows, ['engineercode', 'q1final', 'q2final']);
    if (headerRow < 0) continue;
    const cmap = mapColumns(rows[headerRow]);
    if (col(cmap, 'Engineer Code', 'Engineer') >= 0 && col(cmap, 'Q1 Final', 'Q1 Final Score', 'Q2 Final', 'Q2 Final Score') >= 0) {
      return name;
    }
  }
  return workbook.SheetNames[0];
}

/**
 * Parse Quarterly Results / single-tab DA AV KPIs into one Firestore-ready record per engineer.
 * @param {import('xlsx').WorkBook} workbook
 * @param {{ expectedProduct?: string, year?: string }} [options]
 */
export function parseDaAvUnifiedWorkbook(workbook, options = {}) {
  const year = String(options.year || new Date().getFullYear());
  const expectedProduct = String(options.expectedProduct || '').toUpperCase();

  const qSheetName = pickDaAvDataSheetName(workbook);
  const engSheetName = workbook.SheetNames.find(
    (n) => normalizeHeader(n) === normalizeHeader(TCS_DA_AV_ENGINEERS_SHEET),
  );

  const qRows = sheetToRows(workbook, qSheetName);
  const headerRow = findHeaderRow(qRows, ['engineercode', 'q1final', 'q2final']);
  if (headerRow < 0) {
    return { records: [], headerRow: -1, sheetName: qSheetName, quartersFound: [] };
  }

  const cmap = mapColumns(qRows[headerRow]);
  const codeIdx = col(cmap, 'Engineer Code', 'EngineerCode', 'SBA ID', 'Engineer');
  if (codeIdx < 0) {
    return { records: [], headerRow, sheetName: qSheetName, quartersFound: [] };
  }

  const staticByCode = new Map();
  if (engSheetName) {
    const eRows = sheetToRows(workbook, engSheetName);
    const eHeader = findHeaderRow(eRows, ['engineercode']);
    if (eHeader >= 0) {
      const emap = mapColumns(eRows[eHeader]);
      const eCode = col(emap, 'Engineer Code');
      for (let i = eHeader + 1; i < eRows.length; i += 1) {
        const code = normalizeEngineerCode(cell(eRows, i, eCode));
        if (!code) continue;
        staticByCode.set(code, {
          name: String(cell(eRows, i, col(emap, 'Engineer Name')) || '').trim(),
          asc: String(cell(eRows, i, col(emap, 'ASC Name', 'ASC')) || '').trim(),
          partnerName: String(cell(eRows, i, col(emap, 'Partner')) || '').trim(),
          serviceType: String(cell(eRows, i, col(emap, 'Service Type')) || '').trim(),
          status: String(cell(eRows, i, col(emap, 'Status')) || '').trim(),
          productGroup: String(cell(eRows, i, col(emap, 'Product Group')) || '').trim(),
          dedicated: String(cell(eRows, i, col(emap, 'Dedicated / Non Dedicated')) || '').trim(),
          majorMinor: String(cell(eRows, i, col(emap, 'Major / Minor')) || '').trim(),
          evaluationTarget: String(cell(eRows, i, col(emap, 'Evaluation Target (Yes/No)')) || '').trim(),
          sbaId: String(cell(eRows, i, col(emap, 'SBA ID')) || '').trim(),
          product: mapDaAvProductGroup(cell(eRows, i, col(emap, 'Product', 'Product Group'))),
        });
      }
    }
  }

  const q1Cols = {
    final: col(cmap, 'Q1 Final', 'Q1 Final Score'),
    ssr: col(cmap, 'Q1 SSR'),
    redo: col(cmap, 'Q1 REDO'),
    chatbot: col(cmap, 'Q1 Chatbot'),
    hass: col(cmap, 'Q1 HASS'),
    acp: col(cmap, 'Q1 ACP', 'Q1 Acc Core Parts'),
    training: col(cmap, 'Q1 Training', 'Q1 Training Attendance'),
    linkage: col(cmap, 'Q1 Linkage', 'Q1 Linkage Ratio'),
  };
  const q2Cols = {
    final: col(cmap, 'Q2 Final', 'Q2 Final Score'),
    rnps: col(cmap, 'Q2 RNPS'),
    redo: col(cmap, 'Q2 REDO'),
    training: col(cmap, 'Q2 Training', 'Q2 Training Attendance'),
    st: col(cmap, 'Q2 ST', 'Q2 ST Con'),
    mj: col(cmap, 'Q2 MJ', 'Q2 MJ %'),
    cr: col(cmap, 'Q2 CR', 'Q2 Complete Repair'),
    kahoot: col(cmap, 'Q2 Kahoot'),
    hass: col(cmap, 'Q2 HASS'),
    repairVol: col(cmap, 'Q2 RepairVol', 'Q2 Repair Volume'),
  };
  const q3Final = col(cmap, 'Q3 Final', 'Q3 Final Score');
  const q4Final = col(cmap, 'Q4 Final', 'Q4 Final Score');

  const quartersFound = new Set();
  const records = [];

  for (let i = headerRow + 1; i < qRows.length; i += 1) {
    const code = normalizeEngineerCode(cell(qRows, i, codeIdx));
    if (!code || code === 'ENGINEERCODE') continue;

    const staticRow = staticByCode.get(code) || {};
    const rawNameCell = String(cell(qRows, i, col(cmap, 'Engineer Name')) || '').trim();
    const rawSbaCell = String(cell(qRows, i, col(cmap, 'SBA ID')) || '').trim() || staticRow.sbaId || '';
    let sbaId = rawSbaCell;
    let name = rawNameCell || staticRow.name || '';
    if (/^gspn\./i.test(name)) {
      if (!sbaId) sbaId = name;
      name = name.replace(/^GSPN\./i, '').replace(/[._]/g, ' ').trim();
    }
    if (!name || name === code || /^\d+$/.test(name)) {
      name = resolveDaAvDisplayName({ name, code, sbaId }) || code;
    }
    const partner =
      String(cell(qRows, i, col(cmap, 'Partner')) || '').trim() || staticRow.partnerName || '';
    const asc =
      String(cell(qRows, i, col(cmap, 'ASC Name', 'ASC')) || '').trim() || staticRow.asc || '';
    const serviceType =
      String(cell(qRows, i, col(cmap, 'Service Type')) || '').trim() || staticRow.serviceType || '';
    const rowProductRaw = String(cell(qRows, i, col(cmap, 'Product', 'Product Group')) || '').trim();
    const rowProduct = mapDaAvProductGroup(rowProductRaw);
    const hasSheetProduct = Boolean(
      staticRow.product ||
      staticRow.productGroup ||
      rowProductRaw,
    );
    const product =
      staticRow.product ||
      mapDaAvProductGroup(staticRow.productGroup) ||
      rowProduct ||
      expectedProduct ||
      '';

    // Only filter by Product when the workbook actually carries product info.
    // Single-sheet KPI templates usually have no Product column — import all rows into the active division.
    if (expectedProduct && hasSheetProduct && product) {
      if (expectedProduct === 'DA') {
        if (!(product === 'DA' || product === 'AV+DA')) continue;
      } else if (expectedProduct === 'AV' || expectedProduct === 'VD') {
        if (!(product === 'AV' || product === 'AV+DA' || product === 'VD')) continue;
      }
    }

    const quarters = {};
    const q1Final = parseDaAvMetricNumber(cell(qRows, i, q1Cols.final));
    const q1Present = q1Final != null || TCS_DA_AV_Q1_METRIC_HEADERS.some((_, idx) => {
      const keys = Object.keys(q1Cols);
      return parseDaAvMetricNumber(cell(qRows, i, q1Cols[keys[idx]])) != null;
    });
    if (q1Present) {
      quartersFound.add('Q1');
      quarters.Q1 = {
        present: true,
        year,
        finalResult: q1Final,
        metrics: {
          ssr: parseDaAvMetricNumber(cell(qRows, i, q1Cols.ssr)),
          redo: parseDaAvMetricNumber(cell(qRows, i, q1Cols.redo)),
          chatbot: parseDaAvMetricNumber(cell(qRows, i, q1Cols.chatbot)),
          hass: parseDaAvMetricNumber(cell(qRows, i, q1Cols.hass)),
          accCoreParts: parseDaAvMetricNumber(cell(qRows, i, q1Cols.acp)),
          trainingAttendance: parseDaAvMetricNumber(cell(qRows, i, q1Cols.training)),
          linkageRatio: parseDaAvMetricNumber(cell(qRows, i, q1Cols.linkage)),
        },
      };
    }

    const q2Final = parseDaAvMetricNumber(cell(qRows, i, q2Cols.final));
    const q2Present =
      q2Final != null ||
      Object.values(q2Cols).some((c) => c >= 0 && parseDaAvMetricNumber(cell(qRows, i, c)) != null);
    if (q2Present) {
      quartersFound.add('Q2');
      quarters.Q2 = {
        present: true,
        year,
        finalResult: q2Final,
        metrics: {
          rnps: parseDaAvMetricNumber(cell(qRows, i, q2Cols.rnps)),
          redo: parseDaAvMetricNumber(cell(qRows, i, q2Cols.redo)),
          trainingAttendance: parseDaAvMetricNumber(cell(qRows, i, q2Cols.training)),
          stCon: parseDaAvMetricNumber(cell(qRows, i, q2Cols.st)),
          mjPct: parseDaAvMetricNumber(cell(qRows, i, q2Cols.mj)),
          completeRepair: parseDaAvMetricNumber(cell(qRows, i, q2Cols.cr)),
          kahoot: parseDaAvMetricNumber(cell(qRows, i, q2Cols.kahoot)),
          hass: parseDaAvMetricNumber(cell(qRows, i, q2Cols.hass)),
          repairVolume: parseDaAvMetricNumber(cell(qRows, i, q2Cols.repairVol)),
        },
      };
    }

    const q3 = parseDaAvMetricNumber(cell(qRows, i, q3Final));
    if (q3 != null) {
      quartersFound.add('Q3');
      quarters.Q3 = { present: true, year, finalResult: q3, metrics: {} };
    }
    const q4 = parseDaAvMetricNumber(cell(qRows, i, q4Final));
    if (q4 != null) {
      quartersFound.add('Q4');
      quarters.Q4 = { present: true, year, finalResult: q4, metrics: {} };
    }

    const finals = Object.values(quarters)
      .map((q) => q.finalResult)
      .filter((v) => v != null && Number.isFinite(v));
    const avg = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : null;

    records.push({
      id: '',
      format: TCS_DA_AV_UNIFIED_FORMAT,
      name,
      code,
      engineerCode: code,
      sbaId: sbaId || staticRow.sbaId || '',
      photoUrl: DEFAULT_ENGINEER_PHOTO_URL,
      asc: asc || 'N/A',
      partnerName: partner || 'N/A',
      product: product || expectedProduct || 'DA',
      serviceType,
      status: staticRow.status || '',
      productGroup: staticRow.productGroup || '',
      dedicated: staticRow.dedicated || '',
      majorMinor: staticRow.majorMinor || '',
      evaluationTarget: staticRow.evaluationTarget || '',
      year,
      month: MONTH_BY_QUARTER.Q2,
      quarter: finals.length ? (quarters.Q2 ? 'Q2' : Object.keys(quarters)[0]) : '',
      quarters,
      engineerEvaluation: avg != null ? Number(avg.toFixed(2)) : 0,
      tcsScore: avg != null ? Number(avg.toFixed(2)) : 0,
      finalResultAvg: avg != null ? Number(avg.toFixed(2)) : null,
    });
  }

  return {
    records,
    headerRow,
    sheetName: qSheetName,
    quartersFound: [...quartersFound].sort(),
  };
}

/** Empty single-tab template workbook for Admin download (Q1 + Q2 KPIs). */
export function buildDaAvUnifiedTemplateWorkbook() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([TCS_DA_AV_TEMPLATE_HEADERS]),
    TCS_DA_AV_TEMPLATE_SHEET,
  );
  return wb;
}

export function downloadDaAvUnifiedTemplate() {
  const wb = buildDaAvUnifiedTemplateWorkbook();
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function isDaAvUnifiedRecord(eng) {
  if (!eng) return false;
  if (eng.format === TCS_DA_AV_UNIFIED_FORMAT) return true;
  if (eng.format === 'unified_wide') return false;
  const q1 = eng?.quarters?.Q1?.metrics;
  if (q1 && ('chatbot' in q1 || 'linkageRatio' in q1 || 'accCoreParts' in q1)) return true;
  const q2 = eng?.quarters?.Q2?.metrics;
  if (q2 && ('rnps' in q2 || 'stCon' in q2 || 'repairVolume' in q2)) return true;
  return false;
}

/** Prefer a human name over numeric codes / GSPN usernames. */
export function resolveDaAvDisplayName(eng) {
  const code = String(eng?.code || eng?.engineerCode || '').trim();
  const rawName = String(eng?.name || '').trim();
  if (
    rawName &&
    rawName !== code &&
    !/^\d+$/.test(rawName) &&
    !/^gspn\./i.test(rawName) &&
    normalizeHeader(rawName) !== 'engineername'
  ) {
    return rawName;
  }
  const sba = String(eng?.sbaId || '').trim();
  if (sba) {
    const cleaned = sba.replace(/^GSPN\./i, '').replace(/[._]/g, ' ').trim();
    if (cleaned) return cleaned;
  }
  if (rawName && !/^\d+$/.test(rawName)) return rawName;
  return code || '—';
}

function metricCard(label, value, kind = 'number') {
  return { label, value: value == null || !Number.isFinite(Number(value)) ? null : Number(value), kind };
}

/**
 * KPI cards for DA/AV search/dossier — quarter-specific criteria from quarters{}.
 */
export function getDaAvQuarterKpiCards(quarterKey, metrics = {}) {
  const q = String(quarterKey || '').toUpperCase();
  const m = metrics || {};
  if (q === 'Q1') {
    return [
      metricCard('SSR', m.ssr, 'pct'),
      metricCard('REDO', m.redo, 'pct'),
      metricCard('Chatbot', m.chatbot, 'pct'),
      metricCard('HASS', m.hass, 'pct'),
      metricCard('Acc Core Parts', m.accCoreParts, 'pct'),
      metricCard('Training Attendance', m.trainingAttendance, 'pct'),
      metricCard('Linkage Ratio', m.linkageRatio, 'pct'),
    ];
  }
  if (q === 'Q2') {
    return [
      metricCard('RNPS', m.rnps, 'pct'),
      metricCard('REDO', m.redo, 'pct'),
      metricCard('Training Attendance', m.trainingAttendance, 'pct'),
      metricCard('ST Con', m.stCon, 'pct'),
      metricCard('MJ %', m.mjPct, 'pct'),
      metricCard('Complete Repair', m.completeRepair, 'pct'),
      metricCard('Kahoot', m.kahoot, 'number'),
      metricCard('HASS', m.hass, 'pct'),
      metricCard('Repair Volume', m.repairVolume, 'number'),
    ];
  }
  return Object.entries(m)
    .filter(([, v]) => v != null && Number.isFinite(Number(v)))
    .map(([k, v]) => metricCard(k, v, 'number'));
}

export function formatDaAvKpiValue(card) {
  if (!card || card.value == null || !Number.isFinite(Number(card.value))) return 'N/A';
  const n = Number(card.value);
  if (card.kind === 'pct') return `${n.toFixed(1)}%`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function getDaAvQuarterFinal(eng, quarterKey) {
  const q = String(quarterKey || '').toUpperCase();
  const block = eng?.quarters?.[q];
  if (!block?.present) return null;
  const v = block.finalResult;
  return v == null || !Number.isFinite(Number(v)) ? null : Number(v);
}

export function getDaAvAverageFinal(eng) {
  const quarters = eng?.quarters || {};
  const vals = Object.values(quarters)
    .filter((q) => q?.present)
    .map((q) => q.finalResult)
    .filter((v) => v != null && Number.isFinite(Number(v)));
  if (!vals.length) {
    const t = parseFloat(eng?.engineerEvaluation ?? eng?.tcsScore);
    return Number.isFinite(t) ? t : null;
  }
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
