/**
 * TCS MX unified engineer workbook (Engineer_Performance_Unified_Format.xlsx).
 * Primary sheet: Engineer_Wide — one row per engineer, Qn - * column blocks.
 */
import * as XLSX from 'xlsx';
import { DEFAULT_ENGINEER_PHOTO_URL } from '../constants.js';

export const TCS_MX_UNIFIED_FORMAT = 'unified_wide';
export const TCS_MX_UNIFIED_WIDE_SHEET = 'Engineer_Wide';
export const TCS_MX_UNIFIED_SUMMARY_SHEET = 'Engineer_Summary';
export const TCS_MX_UNIFIED_KPI_DETAIL_SHEET = 'Engineer_KPI_Detail';
export const TCS_MX_UNIFIED_TEMPLATE_FILENAME = 'Engineer_Performance_Unified_Format.xlsx';

export const QUARTER_END_MONTH = {
  Q1: 'March',
  Q2: 'June',
  Q3: 'September',
  Q4: 'December',
};

export const TCS_MX_UNIFIED_WIDE_GENERAL_HEADERS = [
  'Engineer Code',
  'Engineer Username',
  'ASC Code',
  'ASC Name',
  'Product',
];

/** Canonical Q1 metric headers (exact labels from the redesigned workbook). */
export const TCS_MX_UNIFIED_Q1_METRIC_HEADERS = [
  'SSR %',
  'SSR Score',
  'RRR90 %',
  'RRR90 Score',
  'Repair Cases',
  'IQC Skip %',
  'IQC Score',
  'Core Parts %',
  'Core Parts Score',
  'MPU %',
  'Training (of 300)',
  'Training Score',
  'Bonus',
  'DRNPS %',
  'Exam',
  'TCS Score',
  'Engineer Evaluation (pre-bonus)',
  'Final Result',
];

/** Canonical Q2 metric headers. */
export const TCS_MX_UNIFIED_Q2_METRIC_HEADERS = [
  'LCD/OCTA %',
  'OCTA Points',
  'PBA %',
  'PBA Points',
  'OCTA or PBA % (combined)',
  'Multi Parts (P+L) %',
  'Multi Parts Points',
  'IQC Skip %',
  'IQC Skip Points',
  'RRR30 %',
  'RRR30 Points',
  'Training (of 300)',
  'Training Points',
  'DRNPS %',
  'DRNPS Points',
  'Maintenance Mode %',
  'Maintenance Mode Points',
  'OQC Fail %',
  'OQC Points',
  'Total Points (pre-blend)',
  'Final Result',
];

const MONTH_ORDER = Object.values(QUARTER_END_MONTH);

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cell(rows, rowIdx, colIdx) {
  if (colIdx < 0) return '';
  const r = rows[rowIdx] || [];
  const v = r[colIdx];
  return v === undefined || v === null ? '' : v;
}

function isBlankCell(value) {
  if (value === undefined || value === null) return true;
  const s = String(value).trim();
  return !s || /^n\/?a$/i.test(s) || /^-$/.test(s);
}

function isAbsentQuarterMarker(value) {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s) return false;
  return /no\s*q[1-4]\s*record/.test(s) || /not\s*computable/.test(s) || /no\s*q[1-4]\s*baseline/.test(s);
}

/** Parse numeric cells; returns null for blank / text markers (does not coerce to 0). */
export function parseNullableNumber(value) {
  if (isBlankCell(value) || isAbsentQuarterMarker(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(/%/g, '').replace(/,/g, '');
  if (!s || /^#/i.test(s)) return null;
  const n = parseFloat(s.replace(/[^0-9.\-eE]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Display percent convention: 21.875 (not 0.21875).
 * Only scale when the header is a % column and raw value is in (0, 1].
 */
export function toDisplayPercent(raw, headerLabel = '') {
  const n = parseNullableNumber(raw);
  if (n == null) return null;
  const isPctHeader = String(headerLabel).includes('%');
  if (isPctHeader && n > 0 && n <= 1) {
    return Number((n * 100).toFixed(6));
  }
  return n;
}

function slugMetric(label) {
  return normalizeHeader(label);
}

function parseQuarterPrefix(header) {
  const m = String(header || '').trim().match(/^Q([1-4])\s*[-–—:]\s*(.+)$/i);
  if (!m) return null;
  return { quarter: `Q${m[1]}`, metric: String(m[2]).trim() };
}

export function isUnifiedEngineerRecord(eng) {
  return eng?.format === TCS_MX_UNIFIED_FORMAT || (eng?.quarters && typeof eng.quarters === 'object');
}

export function listPresentQuarters(eng) {
  if (!eng?.quarters) return [];
  return Object.keys(eng.quarters)
    .filter((q) => eng.quarters[q]?.present)
    .sort();
}

/** Average of non-null Final Results across present quarters. */
export function getUnifiedAverageFinalResult(eng) {
  const vals = listPresentQuarters(eng)
    .map((q) => eng.quarters[q]?.finalResult)
    .filter((v) => v != null && Number.isFinite(Number(v)))
    .map(Number);
  if (!vals.length) return null;
  return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3));
}

export function getUnifiedQuarterFinalResult(eng, quarterKey) {
  const q = String(quarterKey || '').toUpperCase();
  const block = eng?.quarters?.[q];
  if (!block?.present) return null;
  const v = block.finalResult;
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
}

export function engineerHasQuarter(eng, quarterKey) {
  const q = String(quarterKey || '').toUpperCase();
  return Boolean(eng?.quarters?.[q]?.present);
}

/** Map a calendar month name to Q1–Q4. */
export function monthNameToQuarter(monthName) {
  const m = String(monthName || '').toLowerCase();
  if (['january', 'february', 'march'].includes(m)) return 'Q1';
  if (['april', 'may', 'june'].includes(m)) return 'Q2';
  if (['july', 'august', 'september'].includes(m)) return 'Q3';
  if (['october', 'november', 'december'].includes(m)) return 'Q4';
  return '';
}

/**
 * Flatten a quarter block onto legacy field names used by existing MX KPI cards.
 * Missing values stay null (callers must not treat as 0).
 */
export function flattenQuarterForDisplay(quarterBlock) {
  if (!quarterBlock?.present) return null;
  const m = quarterBlock.metrics || {};
  const pick = (...keys) => {
    for (const k of keys) {
      if (m[k] != null && Number.isFinite(Number(m[k]))) return Number(m[k]);
    }
    return null;
  };
  return {
    finalResult: quarterBlock.finalResult,
    engineerEvaluation: quarterBlock.finalResult,
    tcsScore: pick('tcsscore') ?? quarterBlock.finalResult,
    ssrScore: pick('ssr', 'ssrpercent'),
    ssrPoints: pick('ssrscore'),
    rrrScore: pick('rrr90', 'rrr90percent', 'rrr30', 'rrr30percent'),
    rrrPoints: pick('rrr90score', 'rrr30points', 'rrr30score'),
    repairCasesCount: pick('repaircases'),
    iqcSkipRatio: pick('iqcskip', 'iqcskippercent'),
    iqcPoints: pick('iqcscore', 'iqcskippoints'),
    corePartsScore: pick('coreparts', 'corepartspercent', 'pba', 'pbapercent', 'lcdocta', 'lcdoctapercent', 'octaorpba', 'octaorpbapercentcombined'),
    corePartsPoints: pick('corepartsscore', 'pbapoints', 'octapoints'),
    multiPartsRatio: pick('mpu', 'mpupercent', 'multipartsp', 'multipartspl', 'multipartsplpercent'),
    multiPartsPoints: pick('multipartspoints'),
    q1TrainingScore: pick('trainingof300', 'training'),
    trainingPoints: pick('trainingscore', 'trainingpoints'),
    bonus: pick('bonus'),
    drnpsScore: pick('drnps', 'drnpspercent'),
    drnpsPoints: pick('drnpspoints'),
    examScore: pick('exam'),
    maintenanceModeRatio: pick('maintenancemode', 'maintenancemodepercent'),
    maintenancePoints: pick('maintenancemodepoints'),
    oqcPassRate: pick('oqcfail', 'oqcfailpercent'),
    oqcPoints: pick('oqcpoints'),
    totalPointsPreBlend: pick('totalpointspreblend'),
    engineerEvalPreBonus: pick('engineerevaluationprebonus'),
    notes: quarterBlock.notes || '',
    rawMetrics: m,
  };
}

/**
 * KPI cards for search/dossier — percentage-focused Engineer_Wide criteria.
 * Score/points tiles and duplicate Final Result are omitted (shown in the header instead).
 */
export function getUnifiedQuarterKpiCards(quarterKey, flat) {
  const q = String(quarterKey || '').toUpperCase();
  const m = flat?.rawMetrics || {};
  const pct = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  const num = pct;

  if (q === 'Q1') {
    return [
      { label: 'SSR %', value: pct(flat?.ssrScore), type: 'pct' },
      { label: 'RRR90 %', value: pct(flat?.rrrScore), type: 'pct' },
      { label: 'IQC Skip %', value: pct(flat?.iqcSkipRatio), type: 'pct' },
      { label: 'Core Parts %', value: pct(flat?.corePartsScore), type: 'pct' },
      { label: 'Core Parts Score', value: num(flat?.corePartsPoints), type: 'num' },
      { label: 'MPU %', value: pct(flat?.multiPartsRatio), type: 'pct' },
      { label: 'DRNPS %', value: pct(flat?.drnpsScore), type: 'pct' },
      { label: 'Exam', value: num(flat?.examScore), type: 'num' },
    ];
  }

  // Q2+ — % / raw criteria only (hide points + pre-blend + Final Result tile)
  return [
    { label: 'LCD/OCTA %', value: pct(m.lcdocta ?? m.lcdoctapercent), type: 'pct' },
    { label: 'PBA %', value: pct(m.pba ?? m.pbapercent), type: 'pct' },
    { label: 'OCTA or PBA % (combined)', value: pct(m.octaorpba ?? m.octaorpbapercentcombined), type: 'pct' },
    { label: 'Multi Parts (P+L) %', value: pct(flat?.multiPartsRatio), type: 'pct' },
    { label: 'IQC Skip %', value: pct(flat?.iqcSkipRatio), type: 'pct' },
    { label: 'RRR30 %', value: pct(flat?.rrrScore), type: 'pct' },
    { label: 'Training (of 300)', value: num(flat?.q1TrainingScore), type: 'num' },
    { label: 'DRNPS %', value: pct(flat?.drnpsScore), type: 'pct' },
    { label: 'Maintenance Mode %', value: pct(flat?.maintenanceModeRatio), type: 'pct' },
    { label: 'OQC Fail %', value: pct(flat?.oqcPassRate), type: 'pct' },
  ];
}

export function formatUnifiedKpiValue(card) {
  if (!card || card.value == null || !Number.isFinite(Number(card.value))) return 'N/A';
  const n = Number(card.value);
  if (card.type === 'pct') return `${n.toFixed(1)}%`;
  return n.toFixed(1);
}

function detectWideHeaderRow(rows, maxScan = 30) {
  let best = { row: -1, score: 0, cols: null };
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const r = rows[i] || [];
    let hasCode = false;
    let quarterCols = 0;
    const colMap = { general: {}, quarters: {} };
    for (let j = 0; j < r.length; j++) {
      const raw = String(r[j] || '').trim();
      if (!raw) continue;
      const n = normalizeHeader(raw);
      if (n === 'engineercode' || (n.includes('engineer') && n.includes('code'))) {
        colMap.general.code = j;
        hasCode = true;
      } else if (n === 'engineerusername' || n === 'username') colMap.general.username = j;
      else if (n === 'asccode') colMap.general.ascCode = j;
      else if (n === 'ascname') colMap.general.ascName = j;
      else if (n === 'product') colMap.general.product = j;
      else if (n === 'notes') colMap.general.notes = j;
      else {
        const pq = parseQuarterPrefix(raw);
        if (pq) {
          quarterCols++;
          if (!colMap.quarters[pq.quarter]) colMap.quarters[pq.quarter] = {};
          colMap.quarters[pq.quarter][slugMetric(pq.metric)] = { index: j, label: pq.metric };
          if (slugMetric(pq.metric) === 'finalresult') {
            colMap.quarters[pq.quarter].__finalResult = { index: j, label: pq.metric };
          }
        }
      }
    }
    const score = (hasCode ? 10 : 0) + quarterCols;
    if (score > best.score && hasCode && quarterCols >= 2) {
      best = { row: i, score, cols: colMap };
    }
  }
  return best;
}

function buildQuarterBlock(rows, rowIdx, quarterKey, metricCols, rowNotes) {
  const entries = Object.entries(metricCols || {}).filter(([k]) => !k.startsWith('__'));
  const metrics = {};
  let nonEmpty = 0;
  let sawAbsentMarker = false;

  for (const [slug, meta] of entries) {
    const raw = cell(rows, rowIdx, meta.index);
    if (isAbsentQuarterMarker(raw)) {
      sawAbsentMarker = true;
      continue;
    }
    if (isBlankCell(raw)) {
      metrics[slug] = null;
      continue;
    }
    const num = toDisplayPercent(raw, meta.label);
    if (num != null) {
      metrics[slug] = num;
      nonEmpty++;
    } else {
      metrics[slug] = String(raw).trim();
      nonEmpty++;
    }
  }

  const finalMeta = metricCols.__finalResult || metricCols.finalresult;
  let finalResult = null;
  if (finalMeta) {
    const rawFinal = cell(rows, rowIdx, finalMeta.index);
    if (isAbsentQuarterMarker(rawFinal)) sawAbsentMarker = true;
    else finalResult = parseNullableNumber(rawFinal);
  } else if (metrics.finalresult != null && typeof metrics.finalresult === 'number') {
    finalResult = metrics.finalresult;
  }

  const notesHint = String(rowNotes || '');
  const notesSayMissing = new RegExp(`no\\s*${quarterKey}\\s*record`, 'i').test(notesHint);

  const present = !notesSayMissing && !sawAbsentMarker && (nonEmpty > 0 || finalResult != null);
  if (!present) {
    return {
      present: false,
      finalResult: null,
      metrics: {},
      notes: notesSayMissing || sawAbsentMarker ? `No ${quarterKey} record.` : '',
    };
  }

  return {
    present: true,
    finalResult: finalResult != null ? Number(Number(finalResult).toFixed(6)) : null,
    metrics,
    notes: '',
  };
}

/**
 * Parse Engineer_Wide rows into one record per engineer with quarters{}.
 */
export function parseEngineerWideSheetRows(rows, { year = String(new Date().getFullYear()) } = {}) {
  const detected = detectWideHeaderRow(rows);
  if (detected.row < 0 || detected.cols?.general?.code == null || detected.cols.general.code < 0) {
    return { records: [], headerRow: -1, quartersFound: [] };
  }

  const { general, quarters: quarterCols } = detected.cols;
  const quartersFound = Object.keys(quarterCols).sort();
  const records = [];

  for (let i = detected.row + 1; i < rows.length; i++) {
    const rawCode = cell(rows, i, general.code);
    if (isBlankCell(rawCode)) continue;
    const codeStr = String(rawCode).trim();
    const codeKey = codeStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!codeKey || codeKey === 'ENGINEERCODE') continue;

    const username = general.username != null ? String(cell(rows, i, general.username) || '').trim() : '';
    const ascCode = general.ascCode != null ? String(cell(rows, i, general.ascCode) || '').trim() : '';
    const ascName = general.ascName != null ? String(cell(rows, i, general.ascName) || '').trim() : '';
    const product = general.product != null
      ? String(cell(rows, i, general.product) || 'MX').trim().toUpperCase() || 'MX'
      : 'MX';
    const notes = general.notes != null ? String(cell(rows, i, general.notes) || '').trim() : '';

    const quarters = {};
    for (const q of quartersFound) {
      quarters[q] = buildQuarterBlock(rows, i, q, quarterCols[q], notes);
    }

    const presentQs = Object.keys(quarters).filter((q) => quarters[q].present).sort();
    if (!presentQs.length && !notes) continue;

    const avg = (() => {
      const vals = presentQs
        .map((q) => quarters[q].finalResult)
        .filter((v) => v != null && Number.isFinite(v));
      if (!vals.length) return null;
      return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3));
    })();

    const latestQ = presentQs[presentQs.length - 1] || 'Q1';
    const eng = {
      id: '',
      format: TCS_MX_UNIFIED_FORMAT,
      name: username || codeStr,
      username,
      code: /^\d+$/.test(codeStr) ? codeStr : codeStr.toUpperCase(),
      engineerCode: /^\d+$/.test(codeStr) ? codeStr : codeStr.toUpperCase(),
      ascCode,
      asc: ascName || 'N/A',
      partnerName: 'MX Division',
      product,
      photoUrl: DEFAULT_ENGINEER_PHOTO_URL,
      notes,
      year: String(year),
      quarter: latestQ,
      month: QUARTER_END_MONTH[latestQ] || 'March',
      quarters,
      engineerEvaluation: avg,
      tcsScore: avg != null ? avg : 0,
      finalResultAvg: avg,
    };

    // Seed legacy flat fields from latest present quarter for older UI bits.
    const flat = flattenQuarterForDisplay(quarters[latestQ]);
    if (flat) {
      eng.ssrScore = flat.ssrScore ?? 0;
      eng.rrrScore = flat.rrrScore ?? 0;
      eng.iqcSkipRatio = flat.iqcSkipRatio ?? 0;
      eng.corePartsScore = flat.corePartsScore ?? 0;
      eng.q1TrainingScore = flat.q1TrainingScore ?? 0;
      eng.drnpsScore = flat.drnpsScore ?? 0;
      eng.examScore = flat.examScore ?? 0;
      eng.bonus = flat.bonus ?? 0;
      eng.repairCasesCount = flat.repairCasesCount ?? 0;
      eng.multiPartsRatio = flat.multiPartsRatio ?? 0;
      eng.maintenanceModeRatio = flat.maintenanceModeRatio ?? 0;
      eng.oqcPassRate = flat.oqcPassRate ?? 0;
    }

    records.push(eng);
  }

  return { records, headerRow: detected.row, quartersFound };
}

/** True if workbook looks like the unified MX engineer file. */
export function workbookHasEngineerWide(workbook) {
  const names = workbook?.SheetNames || [];
  return names.some((n) => normalizeHeader(n) === 'engineerwide');
}

export function parseUnifiedEngineerWorkbook(workbook, options = {}) {
  const sheetName =
    (workbook.SheetNames || []).find((n) => normalizeHeader(n) === 'engineerwide') ||
    workbook.SheetNames?.[0];
  if (!sheetName) return { records: [], sheetName: '', headerRow: -1, quartersFound: [] };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
  const parsed = parseEngineerWideSheetRows(rows, options);
  return { ...parsed, sheetName };
}

/** Build downloadable unified template (3 sheets). */
export function buildUnifiedEngineerTemplateWorkbook() {
  const wb = XLSX.utils.book_new();

  const wideHeaders = [
    ...TCS_MX_UNIFIED_WIDE_GENERAL_HEADERS,
    ...TCS_MX_UNIFIED_Q1_METRIC_HEADERS.map((h) => `Q1 - ${h}`),
    ...TCS_MX_UNIFIED_Q2_METRIC_HEADERS.map((h) => `Q2 - ${h}`),
    'Notes',
  ];
  const wideWs = XLSX.utils.aoa_to_sheet([wideHeaders]);
  XLSX.utils.book_append_sheet(wb, wideWs, TCS_MX_UNIFIED_WIDE_SHEET);

  const summaryHeaders = [
    'Engineer Code',
    'Engineer Username',
    'ASC Code',
    'ASC Name',
    'Product',
    'Q1 Final Result',
    'Q2 Final Result',
    'Notes',
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([summaryHeaders]), TCS_MX_UNIFIED_SUMMARY_SHEET);

  const detailHeaders = [
    'Engineer Code',
    'Quarter',
    'KPI Category',
    'KPI Name',
    'Value (%)',
    'Points',
    'Notes',
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([detailHeaders]), TCS_MX_UNIFIED_KPI_DETAIL_SHEET);

  return wb;
}

export function downloadUnifiedEngineerTemplate() {
  const wb = buildUnifiedEngineerTemplateWorkbook();
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
