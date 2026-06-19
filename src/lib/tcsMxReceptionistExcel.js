import * as XLSX from 'xlsx';
import { DEFAULT_ENGINEER_PHOTO_URL } from '../constants';
import { calculateReceptionistScore } from './tcsMxRoleScoring';

/** Samsung MX receptionist workbook layout (MX receptionists only). */
export const TCS_MX_RECEPTIONIST_TEMPLATE_HEADERS = [
  'Quarter',
  'GSPN ID',
  'ASC_Recep',
  'ASC_CODE',
  'ASC Name',
  'Product',
  'Vote for Me',
  'IQC First Time Fail',
  'DRNPS',
  'Exam',
  'Co.A',
  'TCS Score',
];

export const TCS_MX_RECEPTIONIST_SHEET_NAME = 'TCS MX Receptionist';

export const TCS_MX_RECEPTIONIST_TEMPLATE_FILENAME = 'TCS_MX_Receptionist_Score_Template_2026.xlsx';

/** Build receptionist template workbook bytes (MX receptionists tab). */
export function buildReceptionistTemplateArrayBuffer() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TCS_MX_RECEPTIONIST_TEMPLATE_HEADERS]);
  XLSX.utils.book_append_sheet(wb, ws, TCS_MX_RECEPTIONIST_SHEET_NAME);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNum(value) {
  if (value === undefined || value === null || value === '') return 0;
  const s = String(value).trim().replace(/,/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function quarterToMonth(q) {
  const k = String(q || '').toUpperCase().replace(/\s/g, '');
  if (k === 'Q1' || k === '1') return 'March';
  if (k === 'Q2' || k === '2') return 'June';
  if (k === 'Q3' || k === '3') return 'September';
  if (k === 'Q4' || k === '4') return 'December';
  return '';
}

function parseQuarterCell(raw) {
  const s = String(raw ?? '').trim().toUpperCase().replace(/\s/g, '');
  const match = s.match(/^Q?([1-4])(?:[-/](\d{2,4}))?$/);
  if (!match) {
    return {
      quarter: '',
      year: String(new Date().getFullYear()),
      month: 'March',
    };
  }
  const quarter = `Q${match[1]}`;
  let year = match[2] || String(new Date().getFullYear());
  if (year.length === 2) year = `20${year}`;
  return {
    quarter,
    year,
    month: quarterToMonth(quarter) || 'March',
  };
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] || [];
    const norms = row.map((cell) => normalizeHeader(cell));
    const hasGspn = norms.some((v) => v === 'gspnid' || v === 'gspn');
    const hasRecep = norms.some((v) => v === 'ascrecep' || v === 'receptionistname' || v === 'name');
    const hasVote = norms.some((v) => v === 'voteforme');
    if (hasGspn && (hasRecep || hasVote)) return i;
  }
  return -1;
}

function mapColumns(headerRow) {
  const cols = {
    quarter: -1,
    gspnId: -1,
    name: -1,
    ascCode: -1,
    ascName: -1,
    product: -1,
    voteForMe: -1,
    iqcFirstTimeFail: -1,
    drnps: -1,
    exam: -1,
    coa: -1,
    tcsScore: -1,
  };
  headerRow.forEach((cell, idx) => {
    const v = normalizeHeader(cell);
    if (v === 'quarter' || v === 'q') cols.quarter = idx;
    else if (v === 'gspnid' || v === 'gspn') cols.gspnId = idx;
    else if (v === 'ascrecep' || v === 'receptionistname') cols.name = idx;
    else if (v === 'asccode' || v === 'asccode') cols.ascCode = idx;
    else if (v === 'ascname') cols.ascName = idx;
    else if (v === 'product') cols.product = idx;
    else if (v === 'voteforme') cols.voteForMe = idx;
    else if (v === 'iqcfirsttimefail' || v === 'iqcfirsttin' || v === 'iqcfirstfail') cols.iqcFirstTimeFail = idx;
    else if (v === 'drnps') cols.drnps = idx;
    else if (v === 'exam' || v === 'examscore') cols.exam = idx;
    else if (v === 'coa') cols.coa = idx;
    else if (v === 'tcsscore') cols.tcsScore = idx;
  });
  return cols;
}

function cell(rows, rowIdx, colIdx) {
  if (colIdx < 0) return '';
  return rows[rowIdx]?.[colIdx] ?? '';
}

export function parseReceptionistWorkbook(workbook) {
  const sheetName =
    workbook.SheetNames.find((n) => normalizeHeader(n).includes('receptionist')) ||
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { records: [], headerRow: -1, sheetName: null };

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const headerRow = findHeaderRow(rows);
  if (headerRow < 0) return { records: [], headerRow: -1, sheetName };

  const cols = mapColumns(rows[headerRow] || []);
  const records = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const name = String(cell(rows, i, cols.name)).trim();
    const gspn = String(cell(rows, i, cols.gspnId)).trim().toUpperCase();
    if (!name && !gspn) continue;
    if (normalizeHeader(name) === 'ascrecep' || normalizeHeader(name) === 'receptionistname') continue;

    const { quarter, year, month } = parseQuarterCell(cell(rows, i, cols.quarter));
    const ascCode = String(cell(rows, i, cols.ascCode)).trim();
    const ascName = String(cell(rows, i, cols.ascName)).trim();
    const product = String(cell(rows, i, cols.product) || 'MX').trim().toUpperCase() || 'MX';

    const record = {
      id: '',
      name: name || gspn,
      code: gspn,
      gspnId: gspn,
      photoUrl: DEFAULT_ENGINEER_PHOTO_URL,
      asc: ascName || ascCode || '',
      partnerName: ascName || 'MX Division',
      ascCode,
      month,
      year,
      quarter,
      product,
      roleType: 'receptionist',
      voteForMe: parseNum(cell(rows, i, cols.voteForMe)),
      iqcFirstTimeFail: parseNum(cell(rows, i, cols.iqcFirstTimeFail)),
      drnpsPercent: parseNum(cell(rows, i, cols.drnps)),
      examScore: parseNum(cell(rows, i, cols.exam)),
      coa: parseNum(cell(rows, i, cols.coa)),
    };

    const sheetScore = parseNum(cell(rows, i, cols.tcsScore));
    const computed = calculateReceptionistScore(record);
    const score = sheetScore > 0 ? sheetScore : computed;
    record.roleScore = score;
    record.tcsScore = score;
    records.push(record);
  }

  return { records, headerRow, sheetName };
}

/** Firestore document IDs are ~20 chars; demo/seed rows use short local ids. */
export function isEphemeralRegistryId(id) {
  const s = String(id || '').trim();
  if (!s) return true;
  return s.length < 16;
}
