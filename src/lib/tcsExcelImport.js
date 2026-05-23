import * as XLSX from 'xlsx';
import { DEFAULT_ENGINEER_PHOTO_URL } from '../constants';

const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getQuarter(monthName) {
  const m = String(monthName || '').toLowerCase();
  if (['january', 'february', 'march'].includes(m)) return 'Q1';
  if (['april', 'may', 'june'].includes(m)) return 'Q2';
  if (['july', 'august', 'september'].includes(m)) return 'Q3';
  if (['october', 'november', 'december'].includes(m)) return 'Q4';
  return '';
}

/** Official Samsung MX TCS column layout (matches field evaluation workbook). */
export const TCS_MX_TEMPLATE_HEADERS = [
  'Quarter',
  'ENGINEER code',
  'SBA ID',
  'ASC_ENGINEER',
  'ASC_CODE',
  'ASC Name',
  'Product',
  'SSR',
  'SSR Score',
  'RRR90',
  'RRR90 Score',
  'Repair cases',
  'IQC Skip %',
  'IQC score',
  'Core Parts %',
  'Core parts score',
  'MPU %',
  'Jan Training',
  'Feb Training',
  'Mar Training',
  'Q1 Training',
  'Q1 training score',
  'Bonus',
  'Engineer evaluation',
  'Q1 Result',
  'DRNPS',
  'Exam',
  'TCS Score',
];

export const TCS_MX_TEMPLATE_SHEET_NAME = 'TCS MX';

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNum(value) {
  const n = parseFloat(String(value ?? '').replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Parses Excel cell for final TCS; ignores #VALUE!, #N/A, and supports "80%" */
export function parseExcelTcsScore(value) {
  const s = String(value ?? '').trim();
  if (!s || /^#/i.test(s)) return null;
  const cleaned = s.replace(/%/g, '').replace(/,/g, '').trim();
  const n = parseFloat(String(cleaned).replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(n)) return null;
  return Number(Math.min(100, Math.max(0, n)).toFixed(1));
}

function excelSerialToMonthYear(serial) {
  const n = typeof serial === 'number' ? serial : parseFloat(String(serial).replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 20000 || n > 60000) return null;
  const utc = new Date(Date.UTC(1899, 11, 30 + Math.floor(n)));
  if (Number.isNaN(utc.getTime())) return null;
  return { month: MONTH_ORDER[utc.getUTCMonth()], year: String(utc.getUTCFullYear()) };
}

function quarterToMonth(q) {
  const k = String(q || '').toUpperCase().replace(/\s/g, '');
  if (k === 'Q1' || k === '1') return 'March';
  if (k === 'Q2' || k === '2') return 'June';
  if (k === 'Q3' || k === '3') return 'September';
  if (k === 'Q4' || k === '4') return 'December';
  return '';
}

function normalizeYearKey(y) {
  if (y === undefined || y === null || y === '') return null;
  const s = String(y).trim().replace(/,/g, '');
  if (/^\d{4}$/.test(s)) return s;
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1950 && n <= 2100) return String(n);
  if (/^\d{2}$/.test(s)) {
    const v = parseInt(s, 10);
    return v < 50 ? `20${s.padStart(2, '0')}` : `19${s}`;
  }
  return null;
}

function emptyColumnMap() {
  return {
    quarter: -1,
    code: -1,
    engineerCode: -1,
    ascCode: -1,
    name: -1,
    ascEngineer: -1,
    photoUrl: -1,
    asc: -1,
    partner: -1,
    product: -1,
    month: -1,
    year: -1,
    sbaId: -1,
    engineerEvaluation: -1,
    ssr: -1,
    ssrScoreCol: -1,
    rrr: -1,
    rrrScoreCol: -1,
    iqcSkip: -1,
    repairCases: -1,
    coreParts: -1,
    corePartsScoreCol: -1,
    q1Training: -1,
    q1TrainingScoreCol: -1,
    janTraining: -1,
    febTraining: -1,
    marTraining: -1,
    q1Result: -1,
    bonus: -1,
    drnps: -1,
    exam: -1,
    promoters: -1,
    detractors: -1,
    tcsScore: -1,
    redo: -1,
    chatbot: -1,
    hass: -1,
    linkage: -1,
    training: -1,
    corePartsPba: -1,
    corePartsOcta: -1,
    multiParts: -1,
    maintenance: -1,
    oqc: -1,
  };
}

function mapHeaderRow(r) {
  const cols = emptyColumnMap();
  let score = 0;

  for (let j = 0; j < r.length; j++) {
    const raw = String(r[j] || '').trim();
    const v = normalizeHeader(r[j]);
    if (!v) continue;

    const set = (key) => {
      cols[key] = j;
      score++;
    };

    if (v === 'quarter' || v === 'q') set('quarter');
    else if (v === 'engineercode' || v === 'engineerid' || (v.includes('engineer') && v.includes('code'))) {
      cols.engineerCode = j;
      if (cols.code < 0) cols.code = j;
      score++;
    } else if (v === 'asccode' || (v.includes('asc') && v.includes('code') && !v.includes('engineer'))) {
      cols.ascCode = j;
      if (cols.code < 0) cols.code = j;
      score++;
    } else if (v === 'code' && cols.code < 0) set('code');
    else if (v === 'name' || v === 'engineername' || v === 'ascname') set('name');
    else if (v === 'ascengineer') set('ascEngineer');
    else if (v === 'photourl') set('photoUrl');
    else if ((v === 'asc' || v === 'ascname') && !v.includes('engineer')) set('asc');
    else if (v === 'partnername' || v === 'partner') set('partner');
    else if (v === 'product') set('product');
    else if (v === 'month') set('month');
    else if (v === 'year') set('year');
    else if (v === 'sbaid' || v === 'sba') set('sbaId');
    else if (v === 'engineerevaluation' || v === 'evaluation') set('engineerEvaluation');
    else if (v === 'ssrscore' || v === 's1rscore' || ((v.includes('ssr') || v === 's1r') && v.includes('score'))) cols.ssrScoreCol = j;
    else if (v === 'ssr' || v === 'ssrpercent' || v === 'ssrutilization' || v === 's1r') cols.ssr = j;
    else if (v === 'rrr90score' || v === 'rrr30score' || (v.includes('rrr') && v.includes('score'))) cols.rrrScoreCol = j;
    else if (v === 'rrr' || v === 'rrr90' || v === 'rrr30') cols.rrr = j;
  // IQC Skip % (column M) — never Repair cases (L) or IQC score (N)
    else if (
      !v.includes('repair') &&
      !v.includes('case') &&
      ((v.includes('iqc') && v.includes('skip')) ||
        v === 'iqcskip' ||
        v === 'iqcskipratio' ||
        v === 'iqcskippercent')
    ) {
      cols.iqcSkip = j;
      score += 2;
    } else if (v.includes('repair') && v.includes('case')) {
      cols.repairCases = j;
      score++;
    } else if (v === 'linkageratio') set('linkage');
    else if (v === 'corepartsscore' || (v.includes('coreparts') && v.includes('score') && !v.includes('pba') && !v.includes('octa'))) {
      cols.corePartsScoreCol = j;
    } else if (
      v === 'corepartspercent' ||
      v === 'coreparts' ||
      (v.includes('coreparts') && raw.includes('%'))
    ) {
      cols.coreParts = j;
      score++;
    } else if (v === 'corepartspba') set('corePartsPba');
    else if (v === 'corepartsocta') set('corePartsOcta');
    else if (v === 'q1trainingscore' || (v.includes('q1') && v.includes('training') && v.includes('score'))) {
      cols.q1TrainingScoreCol = j;
    }     else if (v === 'jantraining') cols.janTraining = j;
    else if (v === 'febtraining') cols.febTraining = j;
    else if (v === 'martraining') cols.marTraining = j;
    else if (
      v === 'q1training' ||
      v === 'q1trainin' ||
      (v.includes('q1') && v.includes('training') && !v.includes('score'))
    ) {
      cols.q1Training = j;
      score++;
    } else if (v === 'q1result') cols.q1Result = j;
    else if (v === 'bonus') cols.bonus = j;
    else if (v === 'drnps') set('drnps');
    else if (v === 'examscore' || v === 'exam') set('exam');
    else if (v === 'promoters') set('promoters');
    else if (v === 'detractors') set('detractors');
    else if (v === 'tcsscore' || v === 'tcsscorepercent' || v === 'finaltcs' || v === 'totalscore' || v === 'finalscore') {
      set('tcsScore');
    } else if (v === 'redoratio' || v === 'redo') set('redo');
    else if (v === 'chatbot') set('chatbot');
    else if (v === 'hass') set('hass');
    else if (v === 'maintenancemoderatio') set('maintenance');
    else if (v === 'oqcpassrate') set('oqc');
    else if (v === 'multipartsratio' || v === 'mpu') set('multiParts');
  }

  if (cols.engineerCode > -1) score += 2;
  if (cols.iqcSkip > -1) score += 2;
  if (cols.ssr > -1 || cols.ssrScoreCol > -1) score += 1;

  return { cols, score };
}

function finalizeColumns(cols) {
  if (cols.ascEngineer > -1 && cols.name < 0) cols.name = cols.ascEngineer;
  if (cols.engineerCode > -1 && cols.code < 0) cols.code = cols.engineerCode;
  // Prefer percent columns (SSR, RRR90) over adjacent score/points columns when both exist
  if (cols.ssr < 0 && cols.ssrScoreCol > -1) cols.ssr = cols.ssrScoreCol;
  if (cols.rrr < 0 && cols.rrrScoreCol > -1) cols.rrr = cols.rrrScoreCol;
  if (cols.coreParts < 0 && cols.corePartsScoreCol > -1) cols.coreParts = cols.corePartsScoreCol;
  if (cols.q1Training < 0 && cols.q1TrainingScoreCol > -1) cols.q1Training = cols.q1TrainingScoreCol;
  return cols;
}

/** Samsung MX sheets: Repair cases (L) then IQC Skip % (M) — enforce column M for skip %. */
function applySamsungMxColumnFallback(cols, headerRow, rows) {
  const hdr = rows[headerRow] || [];
  let repairIdx = -1;
  let iqcIdx = -1;
  for (let j = 0; j < hdr.length; j++) {
    const v = normalizeHeader(hdr[j]);
    if (v.includes('repair') && v.includes('case')) repairIdx = j;
    if (
      (v.includes('iqc') && v.includes('skip')) ||
      v === 'iqcskip' ||
      v === 'iqcskipratio' ||
      v === 'iqcskippercent'
    ) {
      iqcIdx = j;
    }
  }
  if (repairIdx >= 0 && iqcIdx === repairIdx + 1) {
    cols.repairCases = repairIdx;
    cols.iqcSkip = iqcIdx;
  }
}

/**
 * IQC skip must be a % (typically ≤25). Repair case counts (e.g. 236) must never be used.
 * If the mapped column looks like a count, check the next column (Samsung column M).
 */
export function resolveIqcSkipPercent(rows, rowIdx, cols) {
  const read = (colIdx) => (colIdx >= 0 ? parseNum(cell(rows, rowIdx, colIdx)) : NaN);

  const tryCol = (colIdx) => {
    const v = read(colIdx);
    if (!Number.isFinite(v)) return null;
    if (v >= 0 && v <= 25) return v;
    return null;
  };

  if (cols.iqcSkip >= 0) {
    const direct = tryCol(cols.iqcSkip);
    if (direct != null) return direct;

    const mapped = read(cols.iqcSkip);
    if (mapped > 25) {
      for (const delta of [1, -1, 2, -2]) {
        const fixed = tryCol(cols.iqcSkip + delta);
        if (fixed != null) return fixed;
      }
    }
  }

  if (cols.repairCases >= 0) {
    const afterRepair = tryCol(cols.repairCases + 1);
    if (afterRepair != null) return afterRepair;
  }

  const fallback = cols.iqcSkip >= 0 ? read(cols.iqcSkip) : 0;
  return Number.isFinite(fallback) && fallback <= 25 ? fallback : 0;
}

/** Display helper — corrects legacy rows where repair volume was stored as IQC %. */
export function resolveMxIqcSkipForDisplay(eng) {
  const v = parseFloat(eng?.iqcSkipRatio ?? 0);
  if (!Number.isFinite(v)) return 0;
  if (v <= 25) return v;
  const alt = parseFloat(eng?.iqcSkipPercent ?? eng?.iqcSkipPercentStored ?? '');
  if (Number.isFinite(alt) && alt <= 25) return alt;
  // Values like 236 are repair-case counts mis-saved as IQC % — hide until re-import fixes Firestore
  if (v > 25) return 0;
  return v;
}

/** Pick the worksheet that actually contains engineer rows (not an empty template tab). */
export function pickBestTcsWorksheetRows(workbook) {
  let best = { rows: [], sheetName: '', headerRow: -1, weight: 0 };

  for (const sheetName of workbook.SheetNames || []) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const { cols, headerRow } = detectTcsSheetColumns(rows);
    if (headerRow < 0 || cols.code < 0) continue;

    let dataRows = 0;
    for (let i = headerRow + 1; i < rows.length; i++) {
      const code = cell(rows, i, cols.engineerCode >= 0 ? cols.engineerCode : cols.code);
      if (String(code).trim()) dataRows++;
    }

    let weight = dataRows * 10;
    if (cols.iqcSkip > -1) weight += 5;
    if (cols.repairCases > -1 && cols.iqcSkip === cols.repairCases + 1) weight += 8;
    if (sheetName.toLowerCase().includes('tcs') || sheetName.toLowerCase().includes('mx')) weight += 2;
    if (cols.repairCases > -1 && cols.iqcSkip > -1) weight += 5;

    if (weight > best.weight) {
      best = { rows, sheetName, headerRow, weight, cols };
    }
  }

  return best;
}

/**
 * Detect column indices from header row(s). Scans deep into the sheet (Samsung files often header ~row 60).
 */
export function detectTcsSheetColumns(rows, maxScanRows = 250) {
  let bestCols = emptyColumnMap();
  let headerRow = -1;
  let bestScore = 0;

  for (let i = 0; i < Math.min(rows.length, maxScanRows); i++) {
    const { cols, score } = mapHeaderRow(rows[i] || []);
    if (score > bestScore && (cols.engineerCode > -1 || cols.code > -1)) {
      bestScore = score;
      bestCols = cols;
      headerRow = i;
    }
  }

  bestCols = finalizeColumns(bestCols);
  if (headerRow >= 0) applySamsungMxColumnFallback(bestCols, headerRow, rows);
  return { cols: bestCols, headerRow };
}

function cell(rows, rowIdx, colIdx) {
  if (colIdx < 0) return '';
  const r = rows[rowIdx] || [];
  const v = r[colIdx];
  return v === undefined || v === null ? '' : v;
}

/**
 * Parse TCS Scores sheet rows into engineer records for Firestore.
 */
export function parseTcsScoreSheetRows(rows, { expectedProduct = 'MX', tcsMode = 'TCS_MX' } = {}) {
  const { cols, headerRow } = detectTcsSheetColumns(rows);
  if (headerRow < 0 || cols.code < 0) {
    return { records: [], columnMap: cols, headerRow };
  }

  const isDaAv = tcsMode === 'TCS_DA' || tcsMode === 'TCS_AV' || tcsMode === 'TCS_VD';
  const uploadedRecords = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const rawCode = cell(rows, i, cols.engineerCode >= 0 ? cols.engineerCode : cols.code);
    if (!String(rawCode).trim()) continue;

    const rawQuarter = cell(rows, i, cols.quarter);
    let monthRaw = String(cell(rows, i, cols.month)).trim();
    let yearRaw = String(cell(rows, i, cols.year)).trim();
    const serialCandidate = parseFloat(String(monthRaw).replace(/,/g, ''));
    if (Number.isFinite(serialCandidate) && serialCandidate >= 20000 && serialCandidate <= 60000) {
      const conv = excelSerialToMonthYear(serialCandidate);
      if (conv) {
        monthRaw = conv.month;
        if (!yearRaw) yearRaw = conv.year;
      }
    }
    if (!yearRaw) {
      const ySerial = parseFloat(String(cell(rows, i, cols.year)).replace(/,/g, ''));
      if (Number.isFinite(ySerial) && ySerial >= 20000 && ySerial <= 60000) {
        const conv = excelSerialToMonthYear(ySerial);
        if (conv) yearRaw = conv.year;
      }
    }
    if (monthRaw && /^\d{1,2}$/.test(monthRaw)) {
      const mi = parseInt(monthRaw, 10);
      if (mi >= 1 && mi <= 12) monthRaw = MONTH_ORDER[mi - 1];
    }
    if (monthRaw && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(monthRaw)) {
      const p = monthRaw.split('/');
      let yr = parseInt(p[2], 10);
      if (yr < 100) yr += 2000;
      const d = new Date(yr, parseInt(p[0], 10) - 1, parseInt(p[1], 10));
      if (!Number.isNaN(d.getTime())) {
        monthRaw = MONTH_ORDER[d.getMonth()];
        if (!yearRaw) yearRaw = String(d.getFullYear());
      }
    }

    const quarterRaw = String(rawQuarter ?? '').trim().toUpperCase();
    const effectiveMonth = monthRaw || quarterToMonth(quarterRaw) || 'March';
    let effectiveYear = normalizeYearKey(yearRaw) || String(new Date().getFullYear());
    let qNorm = quarterRaw.replace(/\s/g, '');
    if (/^[1-4]$/.test(qNorm)) qNorm = `Q${qNorm}`;

    const prod = String(cell(rows, i, cols.product)).trim().toUpperCase();
    if (cols.product > -1 && prod) {
      if (isDaAv) {
        if (!['DA', 'AV', 'VD'].includes(prod)) continue;
      } else if (prod !== expectedProduct && !(expectedProduct === 'AV' && prod === 'VD')) {
        continue;
      }
    }

    const engineerCodeRaw = String(cell(rows, i, cols.engineerCode >= 0 ? cols.engineerCode : cols.code)).trim();
    const ascCodeRaw = cols.ascCode > -1 ? String(cell(rows, i, cols.ascCode)).trim() : '';
    const finalCodeRaw = engineerCodeRaw || ascCodeRaw;
    const codeKey = finalCodeRaw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!codeKey || ['ENGINEERCODE', 'ASCCODE', 'CODE'].includes(codeKey)) continue;

    const nameVal = cols.ascEngineer > -1 ? cell(rows, i, cols.ascEngineer) : cols.name > -1 ? cell(rows, i, cols.name) : '';
    const ssrCol = cols.ssr >= 0 ? cols.ssr : -1;
    const rrrCol = cols.rrr >= 0 ? cols.rrr : -1;
    const coreCol = cols.coreParts >= 0 ? cols.coreParts : cols.corePartsPba >= 0 ? cols.corePartsPba : -1;
    const trainCol =
      cols.q1TrainingScoreCol >= 0
        ? cols.q1TrainingScoreCol
        : cols.q1Training >= 0
          ? cols.q1Training
          : cols.training >= 0
            ? cols.training
            : -1;
    const sheetTcs = cols.tcsScore > -1 ? parseExcelTcsScore(cell(rows, i, cols.tcsScore)) : null;
    const iqcSkipPct = resolveIqcSkipPercent(rows, i, cols);

    const eng = {
      id: '',
      name: String(nameVal || 'Unknown').trim(),
      code: /^\d+$/.test(finalCodeRaw) ? finalCodeRaw : finalCodeRaw.toUpperCase(),
      engineerCode: engineerCodeRaw ? (/^\d+$/.test(engineerCodeRaw) ? engineerCodeRaw : engineerCodeRaw.toUpperCase()) : '',
      ascCode: ascCodeRaw ? (/^\d+$/.test(ascCodeRaw) ? ascCodeRaw : ascCodeRaw.toUpperCase()) : '',
      photoUrl:
        cols.photoUrl > -1 &&
        String(cell(rows, i, cols.photoUrl) || '').trim() &&
        !String(cell(rows, i, cols.photoUrl)).includes('picsum.photos')
          ? String(cell(rows, i, cols.photoUrl)).trim()
          : DEFAULT_ENGINEER_PHOTO_URL,
      sbaId: cols.sbaId > -1 ? String(cell(rows, i, cols.sbaId)).trim() : '',
      asc:
        cols.asc > -1
          ? String(cell(rows, i, cols.asc)).trim() || 'N/A'
          : cols.name > -1
            ? String(cell(rows, i, cols.name)).trim() || 'N/A'
            : 'N/A',
      product: cols.product > -1 ? String(cell(rows, i, cols.product)).trim().toUpperCase() : expectedProduct,
      partnerName: cols.partner > -1 ? String(cell(rows, i, cols.partner)).trim() || 'N/A' : 'N/A',
      quarter: qNorm || getQuarter(effectiveMonth) || '',
      month: effectiveMonth,
      year: effectiveYear,
      engineerEvaluation: cols.engineerEvaluation > -1 ? parseNum(cell(rows, i, cols.engineerEvaluation)) : 0,
      ssrScore: ssrCol > -1 ? parseNum(cell(rows, i, ssrCol)) : 0,
      rrrScore: rrrCol > -1 ? parseNum(cell(rows, i, rrrCol)) : 0,
      iqcSkipRatio: iqcSkipPct,
      iqcSkipPercent: iqcSkipPct,
      repairCasesCount: cols.repairCases > -1 ? parseNum(cell(rows, i, cols.repairCases)) : 0,
      corePartsScore: coreCol > -1 ? parseNum(cell(rows, i, coreCol)) : 0,
      q1TrainingScore: trainCol > -1 ? parseNum(cell(rows, i, trainCol)) : 0,
      janTraining: cols.janTraining > -1 ? parseNum(cell(rows, i, cols.janTraining)) : 0,
      febTraining: cols.febTraining > -1 ? parseNum(cell(rows, i, cols.febTraining)) : 0,
      marTraining: cols.marTraining > -1 ? parseNum(cell(rows, i, cols.marTraining)) : 0,
      q1Result: cols.q1Result > -1 ? String(cell(rows, i, cols.q1Result)).trim() : '',
      bonus: cols.bonus > -1 ? parseNum(cell(rows, i, cols.bonus)) : 0,
      drnpsScore: cols.drnps > -1 ? parseNum(cell(rows, i, cols.drnps)) : 0,
      redoRatio: cols.redo > -1 ? parseNum(cell(rows, i, cols.redo)) : 0,
      maintenanceModeRatio: cols.chatbot > -1 ? parseNum(cell(rows, i, cols.chatbot)) : cols.maintenance > -1 ? parseNum(cell(rows, i, cols.maintenance)) : 0,
      oqcPassRate: cols.hass > -1 ? parseNum(cell(rows, i, cols.hass)) : cols.oqc > -1 ? parseNum(cell(rows, i, cols.oqc)) : 0,
      trainingAttendance: trainCol > -1 ? parseNum(cell(rows, i, trainCol)) : 0,
      corePartsPBA: cols.corePartsPba > -1 ? parseNum(cell(rows, i, cols.corePartsPba)) : coreCol > -1 ? parseNum(cell(rows, i, coreCol)) : 0,
      corePartsOcta: cols.corePartsOcta > -1 ? parseNum(cell(rows, i, cols.corePartsOcta)) : 0,
      multiPartsRatio: cols.multiParts > -1 ? parseNum(cell(rows, i, cols.multiParts)) : 0,
      examScore: cols.exam > -1 ? parseNum(cell(rows, i, cols.exam)) : 0,
      promoters: cols.promoters > -1 ? parseNum(cell(rows, i, cols.promoters)) : 0,
      detractors: cols.detractors > -1 ? parseNum(cell(rows, i, cols.detractors)) : 0,
    };

    eng.tcsScore = sheetTcs != null ? sheetTcs : 0;
    uploadedRecords.push(eng);
  }

  return { records: uploadedRecords, columnMap: cols, headerRow };
}

/** Find one engineer by code in parsed rows (for verification). */
export function findTcsRecordByCode(rows, code, options) {
  const { records } = parseTcsScoreSheetRows(rows, options);
  const key = String(code || '').replace(/\D/g, '');
  return records.find((r) => String(r.code || r.engineerCode || '').replace(/\D/g, '') === key) || null;
}
