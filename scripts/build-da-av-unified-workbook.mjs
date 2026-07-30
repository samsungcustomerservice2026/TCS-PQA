/**
 * Build DA-AV master performance workbook from Q1 + Q2 source sheets.
 * Keeps original sheets untouched (copied in), adds Engineers / Quarterly Results / Summary.
 *
 * Run: node scripts/build-da-av-unified-workbook.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  TCS_DA_AV_ENGINEERS_HEADERS,
  TCS_DA_AV_QUARTERLY_HEADERS,
  TCS_DA_AV_SUMMARY_HEADERS,
  TCS_DA_AV_Q1_METRIC_HEADERS,
  TCS_DA_AV_Q2_METRIC_HEADERS,
  normalizeEngineerCode,
  mapDaAvProductGroup,
  parseDaAvMetricNumber,
} from '../src/lib/tcsDaAvUnifiedExcel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EVAL_ROOT = path.resolve('F:/Samsung Tools/TCS/Engineer evaluation');

const Q1_PATH = path.join(EVAL_ROOT, 'Q1', 'DA-AV Q1 2026 winners.xlsx');
const Q2_PATH = path.join(EVAL_ROOT, 'Q2', 'DA-AV Q2 Engineer Evaluation all data.xlsx');
const Q2_BIG_PATH = path.join(EVAL_ROOT, 'Q2', 'DA AV Q2~2026.xlsx');

const OUT_EVAL = path.join(EVAL_ROOT, 'DA-AV_Engineer_Performance_Master_2026.xlsx');
const OUT_PROJECT = path.join(ROOT, 'DA-AV_Engineer_Performance_Master_2026.xlsx');

const HEADER_FILL = '1F4E79';
const HEADER_FONT = 'FFFFFF';
const ALT_ROW = 'F2F2F2';
const YELLOW_FINAL = 'FFF2CC';

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, '');
}

function sheetToRows(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
}

function mapColumns(headerRow) {
  const map = {};
  (headerRow || []).forEach((h, idx) => {
    const n = normalizeHeader(h);
    if (n && !(n in map)) map[n] = idx;
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

function cell(rows, r, c) {
  if (c < 0) return '';
  const v = (rows[r] || [])[c];
  return v === undefined || v === null ? '' : v;
}

function cleanNameFromSba(sba) {
  const s = String(sba || '').trim();
  if (!s || /^no\s*sba/i.test(s)) return '';
  return s.replace(/^GSPN\./i, '').replace(/[._]/g, ' ').trim();
}

function pickName(...candidates) {
  for (const c of candidates) {
    const s = String(c || '').trim();
    if (!s) continue;
    if (/^gspn\./i.test(s)) continue;
    if (/^\d+$/.test(s)) continue;
    if (/^,/.test(s) || /gvkvtm/i.test(s)) continue;
    // "Last, First" → "First Last" when both sides look like names
    if (s.includes(',')) {
      const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) return parts[0];
      if (parts.length === 2) return `${parts[1]} ${parts[0]}`.trim();
    }
    return s;
  }
  return '';
}

function loadNameMaps() {
  const byCode = new Map();
  const bySba = new Map();
  if (!fs.existsSync(Q2_BIG_PATH)) return { byCode, bySba };

  const wb = XLSX.read(fs.readFileSync(Q2_BIG_PATH), { type: 'buffer', cellDates: true });

  // Final Winners (two blocks)
  const fw = sheetToRows(wb, 'Final Winners');
  for (let r = 0; r < fw.length; r += 1) {
    const row = fw[r] || [];
    const norms = row.map((c) => normalizeHeader(c));
    if (!norms.includes('engineer') || !norms.includes('engineername')) continue;
    const cmap = mapColumns(row);
    const codeIdx = col(cmap, 'Engineer');
    const nameIdx = col(cmap, 'Engineer Name');
    const sbaIdx = col(cmap, 'SBA ID');
    for (let i = r + 1; i < fw.length; i += 1) {
      const code = normalizeEngineerCode(cell(fw, i, codeIdx));
      const name = pickName(cell(fw, i, nameIdx));
      const sba = String(cell(fw, i, sbaIdx) || '').trim().toUpperCase();
      if (code && name) byCode.set(code, name);
      if (sba && name) bySba.set(sba, name);
      // stop at next section header
      if (normalizeHeader(cell(fw, i, 0)).includes('winner')) break;
    }
  }

  // Kahoot Exam
  const kahoot = sheetToRows(wb, 'Kahoot Exam');
  if (kahoot.length) {
    const h = kahoot.findIndex((row) => {
      const n = (row || []).map((c) => normalizeHeader(c));
      return n.includes('engineer') && (n.includes('engineername') || n.includes('name'));
    });
    if (h >= 0) {
      const cmap = mapColumns(kahoot[h]);
      const codeIdx = col(cmap, 'Engineer', 'Engineer Code');
      const nameIdx = col(cmap, 'Engineer Name', 'Name');
      for (let i = h + 1; i < kahoot.length; i += 1) {
        const code = normalizeEngineerCode(cell(kahoot, i, codeIdx));
        const name = pickName(cell(kahoot, i, nameIdx));
        if (code && name && !byCode.has(code)) byCode.set(code, name);
      }
    }
  }

  // User Status via SBA / User ID
  const us = sheetToRows(wb, 'User Status');
  if (us.length) {
    const h = us.findIndex((row) => {
      const n = (row || []).map((c) => normalizeHeader(c));
      return n.includes('userid') && (n.includes('useruserfullname') || n.includes('userfullname'));
    });
    if (h >= 0) {
      const cmap = mapColumns(us[h]);
      const idIdx = col(cmap, 'User ID');
      const nameIdx = col(cmap, 'User - User Full Name', 'User Full Name');
      for (let i = h + 1; i < us.length; i += 1) {
        const id = String(cell(us, i, idIdx) || '').trim().toUpperCase();
        const name = pickName(cell(us, i, nameIdx));
        if (id && name && !bySba.has(id)) bySba.set(id, name);
      }
    }
  }

  return { byCode, bySba };
}

function parseQ1() {
  const wb = XLSX.read(fs.readFileSync(Q1_PATH), { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = sheetToRows(wb, sheetName);
  const headerRow = 0;
  const cmap = mapColumns(rows[headerRow]);
  const out = new Map();
  for (let i = headerRow + 1; i < rows.length; i += 1) {
    const code = normalizeEngineerCode(cell(rows, i, col(cmap, 'Engineer', 'Engineer Code')));
    if (!code) continue;
    out.set(code, {
      code,
      sbaId: String(cell(rows, i, col(cmap, 'SBA ID')) || '').trim(),
      ascCode: String(cell(rows, i, col(cmap, 'ASC Code')) || '').trim(),
      ascName: String(cell(rows, i, col(cmap, 'ASC Name')) || '').trim(),
      serviceType: String(cell(rows, i, col(cmap, 'SVC Type', 'Service Type')) || '').trim(),
      partner: String(cell(rows, i, col(cmap, 'Country key')) || '').trim() || 'EG',
      q1: {
        final: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Final Score'))),
        ssr: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'SSR'))),
        redo: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'REDO'))),
        chatbot: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Chatbot'))),
        hass: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'HASS'))),
        acp: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Acc Core Parts (VD)', 'Acc Core Parts'))),
        training: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Training Attendance'))),
        linkage: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Linkage ratio', 'Linkage Ratio'))),
      },
    });
  }
  return { map: out, workbook: wb, sheetName, rows };
}

function parseQ2() {
  const wb = XLSX.read(fs.readFileSync(Q2_PATH), { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = sheetToRows(wb, sheetName);
  const headerRow = 0;
  const cmap = mapColumns(rows[headerRow]);

  // Duplicate KPI headers: raw block then scored block — take first occurrence for raw metrics,
  // and locate Q2 Final / Repair Volume by exact scan of header row.
  const header = rows[headerRow] || [];
  const findNth = (aliases, nth = 1) => {
    let seen = 0;
    for (let i = 0; i < header.length; i += 1) {
      const n = normalizeHeader(header[i]);
      if (!n) continue;
      if (aliases.some((a) => normalizeHeader(a) === n)) {
        seen += 1;
        if (seen === nth) return i;
      }
    }
    return -1;
  };

  const out = new Map();
  for (let i = headerRow + 1; i < rows.length; i += 1) {
    const code = normalizeEngineerCode(cell(rows, i, col(cmap, 'Engineer', 'Engineer Code')));
    if (!code) continue;
    out.set(code, {
      code,
      sbaId: String(cell(rows, i, col(cmap, 'SBA ID')) || '').trim(),
      partner: String(cell(rows, i, col(cmap, 'W/B Partner', 'Partner')) || '').trim(),
      ascName: String(cell(rows, i, col(cmap, 'ASC Name')) || '').trim(),
      serviceType: String(cell(rows, i, col(cmap, 'SVC Type', 'Service Type')) || '').trim(),
      status: String(cell(rows, i, col(cmap, 'Status')) || '').trim(),
      productGroup: String(cell(rows, i, col(cmap, 'Product Group')) || '').trim(),
      dedicated: String(cell(rows, i, col(cmap, 'Dedicated/Non Dedicated', 'Dedicated / Non Dedicated')) || '').trim(),
      majorMinor: String(cell(rows, i, col(cmap, 'Major/Minor', 'Major / Minor')) || '').trim(),
      evaluationTarget: String(cell(rows, i, col(cmap, 'Target For Evaluation Yes No', 'Evaluation Target (Yes/No)')) || '').trim(),
      country: String(cell(rows, i, col(cmap, 'Country key')) || '').trim(),
      q2: {
        // Use first (raw) KPI block for display KPIs
        rnps: parseDaAvMetricNumber(cell(rows, i, findNth(['RNPS'], 1))),
        redo: parseDaAvMetricNumber(cell(rows, i, findNth(['Redo'], 1))),
        training: parseDaAvMetricNumber(cell(rows, i, findNth(['Training Att', 'Training Attendance'], 1))),
        st: parseDaAvMetricNumber(cell(rows, i, findNth(['S.T con', 'ST Con', 'S.T Con'], 1))),
        mj: parseDaAvMetricNumber(cell(rows, i, findNth(['MJ %'], 1))),
        cr: parseDaAvMetricNumber(cell(rows, i, findNth(['Comp. Repair', 'Complete Repair'], 1))),
        kahoot: parseDaAvMetricNumber(cell(rows, i, findNth(['Kahoot'], 1))),
        hass: parseDaAvMetricNumber(cell(rows, i, findNth(['Hass', 'HASS'], 1))),
        repairVol: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Repair Volume'))),
        final: parseDaAvMetricNumber(cell(rows, i, col(cmap, 'Q2 Final Result', 'Final Score'))),
      },
    });
  }
  return { map: out, workbook: wb, sheetName, rows };
}

function mergeEngineers(q1Map, q2Map, nameMaps) {
  const codes = new Set([...q1Map.keys(), ...q2Map.keys()]);
  const list = [];
  for (const code of codes) {
    const q1 = q1Map.get(code);
    const q2 = q2Map.get(code);
    const sbaId = (q2?.sbaId || q1?.sbaId || '').trim();
    const sbaKey = sbaId.toUpperCase();
    const name =
      pickName(
        nameMaps.byCode.get(code),
        nameMaps.bySba.get(sbaKey),
        cleanNameFromSba(sbaId),
      ) || code;

    const productGroup = q2?.productGroup || '';
    const product = mapDaAvProductGroup(productGroup);

    list.push({
      code,
      name,
      sbaId,
      ascName: q2?.ascName || q1?.ascName || '',
      partner: q2?.partner || q1?.partner || q2?.country || 'EG',
      serviceType: q2?.serviceType || q1?.serviceType || '',
      status: q2?.status || '',
      productGroup,
      product,
      dedicated: q2?.dedicated || '',
      majorMinor: q2?.majorMinor || '',
      evaluationTarget: q2?.evaluationTarget || '',
      q1: q1?.q1 || null,
      q2: q2?.q2 || null,
    });
  }
  list.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
  return list;
}

function styleHeaderRow(row, { yellowFinalIndexes = [] } = {}) {
  row.eachCell((cell, colNumber) => {
    const isFinal = yellowFinalIndexes.includes(colNumber - 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isFinal ? YELLOW_FINAL : HEADER_FILL },
    };
    cell.font = {
      bold: true,
      color: { argb: isFinal ? '000000' : HEADER_FONT },
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'B0B0B0' } },
      left: { style: 'thin', color: { argb: 'B0B0B0' } },
      bottom: { style: 'thin', color: { argb: 'B0B0B0' } },
      right: { style: 'thin', color: { argb: 'B0B0B0' } },
    };
  });
  row.height = 28;
}

function applyAltRows(sheet, startRow, endRow, colCount) {
  for (let r = startRow; r <= endRow; r += 1) {
    if ((r - startRow) % 2 === 1) {
      for (let c = 1; c <= colCount; c += 1) {
        const cell = sheet.getCell(r, c);
        if (!cell.fill || cell.fill?.fgColor?.argb === '00000000') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW } };
        }
      }
    }
  }
}

function addScoreConditionalFormatting(sheet, colLetters, fromRow, toRow) {
  colLetters.forEach((col) => {
    const range = `${col}${fromRow}:${col}${toRow}`;
    sheet.addConditionalFormatting({
      ref: range,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThanOrEqual',
          formulae: ['90'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: '63BE7B' } } },
        },
        {
          type: 'cellIs',
          operator: 'between',
          formulae: ['80', '89.999'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'C6EFCE' } } },
        },
        {
          type: 'cellIs',
          operator: 'between',
          formulae: ['70', '79.999'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEB9C' } } },
        },
        {
          type: 'cellIs',
          operator: 'between',
          formulae: ['60', '69.999'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FCE4D6' } } },
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: ['60'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF6B6B' } } },
        },
      ],
    });
  });
}

function colLetter(index0) {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function autofit(sheet, colCount, sampleRows = 40) {
  for (let c = 1; c <= colCount; c += 1) {
    let max = 10;
    const header = String(sheet.getRow(1).getCell(c).value || '');
    max = Math.max(max, header.length);
    for (let r = 2; r <= Math.min(sampleRows + 1, sheet.rowCount); r += 1) {
      const v = sheet.getRow(r).getCell(c).value;
      const s = v == null ? '' : typeof v === 'object' && v.formula ? String(v.result ?? '') : String(v);
      max = Math.max(max, Math.min(42, s.length));
    }
    sheet.getColumn(c).width = Math.min(36, max + 2);
  }
}

function copySourceSheet(targetWb, sourceWb, sourceSheetName, destName) {
  const rows = sheetToRows(sourceWb, sourceSheetName);
  const ws = targetWb.addWorksheet(destName.slice(0, 31));
  rows.forEach((row, rIdx) => {
    const excelRow = ws.getRow(rIdx + 1);
    (row || []).forEach((val, cIdx) => {
      excelRow.getCell(cIdx + 1).value = val === '' ? null : val;
    });
    excelRow.commit();
  });
  if (rows[0]) styleHeaderRow(ws.getRow(1));
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  autofit(ws, (rows[0] || []).length || 10);
  return ws;
}

async function build() {
  if (!fs.existsSync(Q1_PATH)) throw new Error(`Missing Q1 source: ${Q1_PATH}`);
  if (!fs.existsSync(Q2_PATH)) throw new Error(`Missing Q2 source: ${Q2_PATH}`);

  console.log('Loading name maps…');
  const nameMaps = loadNameMaps();
  console.log(`  names by code: ${nameMaps.byCode.size}, by SBA: ${nameMaps.bySba.size}`);

  console.log('Parsing Q1…');
  const q1 = parseQ1();
  console.log(`  Q1 engineers: ${q1.map.size}`);

  console.log('Parsing Q2…');
  const q2 = parseQ2();
  console.log(`  Q2 engineers: ${q2.map.size}`);

  const engineers = mergeEngineers(q1.map, q2.map, nameMaps);
  console.log(`  Merged unique engineers: ${engineers.length}`);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SCORA TCS';
  wb.created = new Date();
  wb.properties = { title: 'DA-AV Engineer Performance Master 2026' };

  // ── Preserve originals ────────────────────────────────────────────────────
  copySourceSheet(wb, q1.workbook, q1.sheetName, 'SRC Q1 2026 winners');
  copySourceSheet(wb, q2.workbook, q2.sheetName, 'SRC Q2 Engineer Eval');

  // ── Engineers ─────────────────────────────────────────────────────────────
  const engSheet = wb.addWorksheet(TCS_DA_AV_ENGINEERS_HEADERS.length ? 'Engineers' : 'Engineers');
  engSheet.addRow(TCS_DA_AV_ENGINEERS_HEADERS);
  styleHeaderRow(engSheet.getRow(1));
  engineers.forEach((e) => {
    engSheet.addRow([
      e.code,
      e.name,
      e.ascName,
      e.partner,
      e.serviceType,
      e.status,
      e.productGroup,
      e.dedicated,
      e.majorMinor,
      e.evaluationTarget,
      e.sbaId,
      e.product,
    ]);
  });
  const engLast = engineers.length + 1;
  engSheet.views = [{ state: 'frozen', ySplit: 1 }];
  engSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: engLast, column: TCS_DA_AV_ENGINEERS_HEADERS.length },
  };
  applyAltRows(engSheet, 2, engLast, TCS_DA_AV_ENGINEERS_HEADERS.length);
  engSheet.addTable({
    name: 'tblEngineers',
    ref: `A1:${colLetter(TCS_DA_AV_ENGINEERS_HEADERS.length - 1)}${engLast}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: TCS_DA_AV_ENGINEERS_HEADERS.map((name) => ({ name, filterButton: true })),
    rows: Array.from({ length: engineers.length }, () => []),
  });
  // Duplicate Engineer Code prevention (custom formula on data range)
  engSheet.dataValidations.add(`A2:A${Math.max(engLast, 5000)}`, {
    type: 'custom',
    allowBlank: false,
    formulae: ['AND(A2<>"",COUNTIF($A$2:$A$5000,A2)=1)'],
    showErrorMessage: true,
    errorTitle: 'Invalid Engineer Code',
    error: 'Engineer Code is required and must be unique.',
  });
  autofit(engSheet, TCS_DA_AV_ENGINEERS_HEADERS.length);

  // ── Quarterly Results ─────────────────────────────────────────────────────
  const qSheet = wb.addWorksheet('Quarterly Results');
  qSheet.addRow(TCS_DA_AV_QUARTERLY_HEADERS);
  const finalIdx = TCS_DA_AV_QUARTERLY_HEADERS.map((h, i) =>
    /final score$/i.test(h) ? i : -1,
  ).filter((i) => i >= 0);
  styleHeaderRow(qSheet.getRow(1), { yellowFinalIndexes: finalIdx });

  engineers.forEach((e) => {
    const row = [
      e.code,
      e.name,
      e.partner,
      e.ascName,
      e.serviceType,
      // Q1
      e.q1?.final ?? null,
      e.q1?.ssr ?? null,
      e.q1?.redo ?? null,
      e.q1?.chatbot ?? null,
      e.q1?.hass ?? null,
      e.q1?.acp ?? null,
      e.q1?.training ?? null,
      e.q1?.linkage ?? null,
      // Q2
      e.q2?.final ?? null,
      e.q2?.rnps ?? null,
      e.q2?.redo ?? null,
      e.q2?.training ?? null,
      e.q2?.st ?? null,
      e.q2?.mj ?? null,
      e.q2?.cr ?? null,
      e.q2?.kahoot ?? null,
      e.q2?.hass ?? null,
      e.q2?.repairVol ?? null,
    ];
    // Q3 + Q4 placeholders (Final + 9 KPIs each) → empty
    while (row.length < TCS_DA_AV_QUARTERLY_HEADERS.length) row.push(null);
    qSheet.addRow(row);
  });

  const qLast = engineers.length + 1;
  qSheet.views = [{ state: 'frozen', ySplit: 1 }];
  qSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: qLast, column: TCS_DA_AV_QUARTERLY_HEADERS.length },
  };
  applyAltRows(qSheet, 2, qLast, TCS_DA_AV_QUARTERLY_HEADERS.length);
  qSheet.addTable({
    name: 'tblQuarterlyResults',
    ref: `A1:${colLetter(TCS_DA_AV_QUARTERLY_HEADERS.length - 1)}${qLast}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium9', showRowStripes: true },
    columns: TCS_DA_AV_QUARTERLY_HEADERS.map((name) => ({ name, filterButton: true })),
    rows: Array.from({ length: engineers.length }, () => []),
  });
  qSheet.dataValidations.add(`A2:A${Math.max(qLast, 5000)}`, {
    type: 'custom',
    allowBlank: false,
    formulae: ['AND(A2<>"",COUNTIF($A$2:$A$5000,A2)=1)'],
    showErrorMessage: true,
    errorTitle: 'Invalid Engineer Code',
    error: 'Engineer Code is required and must be unique.',
  });

  // Score validation: allow up to 200 so bonus finals (>100) are not blocked
  const scoreCols = finalIdx.map((i) => colLetter(i));
  scoreCols.forEach((letter) => {
    qSheet.dataValidations.add(`${letter}2:${letter}${Math.max(qLast, 5000)}`, {
      type: 'decimal',
      operator: 'between',
      formulae: [0, 200],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid score',
      error: 'Quarter scores must be between 0 and 200 (bonus finals may exceed 100).',
    });
  });

  addScoreConditionalFormatting(qSheet, scoreCols, 2, qLast);
  autofit(qSheet, TCS_DA_AV_QUARTERLY_HEADERS.length);

  // ── Summary ───────────────────────────────────────────────────────────────
  const sSheet = wb.addWorksheet('Summary');
  sSheet.addRow(TCS_DA_AV_SUMMARY_HEADERS);
  styleHeaderRow(sSheet.getRow(1), { yellowFinalIndexes: [3, 4, 5, 6, 7] });

  const q1FinalCol = colLetter(TCS_DA_AV_QUARTERLY_HEADERS.indexOf('Q1 Final Score'));
  const q2FinalCol = colLetter(TCS_DA_AV_QUARTERLY_HEADERS.indexOf('Q2 Final Score'));
  const q3FinalCol = colLetter(TCS_DA_AV_QUARTERLY_HEADERS.indexOf('Q3 Final Score'));
  const q4FinalCol = colLetter(TCS_DA_AV_QUARTERLY_HEADERS.indexOf('Q4 Final Score'));

  engineers.forEach((e, idx) => {
    const r = idx + 2;
    const qr = r; // same row order as Quarterly Results
    sSheet.addRow([
      e.code,
      e.name,
      e.product,
      { formula: `IF('Quarterly Results'!${q1FinalCol}${qr}="","",'Quarterly Results'!${q1FinalCol}${qr})` },
      { formula: `IF('Quarterly Results'!${q2FinalCol}${qr}="","",'Quarterly Results'!${q2FinalCol}${qr})` },
      { formula: `IF('Quarterly Results'!${q3FinalCol}${qr}="","",'Quarterly Results'!${q3FinalCol}${qr})` },
      { formula: `IF('Quarterly Results'!${q4FinalCol}${qr}="","",'Quarterly Results'!${q4FinalCol}${qr})` },
      // Annual Average — average of available quarters only
      {
        formula: `IFERROR(AVERAGEIF(D${r}:G${r},">=0"),"")`,
      },
      // Best Quarter label
      {
        formula: `IF(H${r}="","",IFERROR(INDEX({"Q1","Q2","Q3","Q4"},MATCH(MAX(D${r}:G${r}),D${r}:G${r},0)),""))`,
      },
      // Worst Quarter label
      {
        formula: `IF(H${r}="","",IFERROR(INDEX({"Q1","Q2","Q3","Q4"},MATCH(MIN(IF(D${r}:G${r}<>"",D${r}:G${r})),D${r}:G${r},0)),""))`,
      },
      // Quarter Improvement Q2 - Q1
      {
        formula: `IF(OR(D${r}="",E${r}=""),"",E${r}-D${r})`,
      },
      // Annual Rank
      {
        formula: `IF(H${r}="","",RANK(H${r},$H$2:$H$${engineers.length + 1},0))`,
      },
    ]);
  });

  // Worst Quarter uses array-style MIN/IF — ExcelJS stores formula; for compatibility use MIN of non-blanks via AGGREGATE
  for (let r = 2; r <= engineers.length + 1; r += 1) {
    sSheet.getCell(`J${r}`).value = {
      formula: `IF(H${r}="","",IFERROR(INDEX({"Q1","Q2","Q3","Q4"},MATCH(AGGREGATE(5,6,D${r}:G${r}),D${r}:G${r},0)),""))`,
    };
  }

  const sLast = engineers.length + 1;
  sSheet.views = [{ state: 'frozen', ySplit: 1 }];
  sSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sLast, column: TCS_DA_AV_SUMMARY_HEADERS.length },
  };
  applyAltRows(sSheet, 2, sLast, TCS_DA_AV_SUMMARY_HEADERS.length);
  sSheet.addTable({
    name: 'tblSummary',
    ref: `A1:${colLetter(TCS_DA_AV_SUMMARY_HEADERS.length - 1)}${sLast}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium4', showRowStripes: true },
    columns: TCS_DA_AV_SUMMARY_HEADERS.map((name) => ({ name, filterButton: true })),
    rows: Array.from({ length: engineers.length }, () => []),
  });
  addScoreConditionalFormatting(sSheet, ['D', 'E', 'F', 'G', 'H'], 2, sLast);
  autofit(sSheet, TCS_DA_AV_SUMMARY_HEADERS.length);

  // ── ReadMe ────────────────────────────────────────────────────────────────
  const readme = wb.addWorksheet('ReadMe');
  const notes = [
    ['DA-AV Engineer Performance Master 2026'],
    [''],
    ['Primary key', 'Engineer Code (numeric SBA engineer id)'],
    ['Source preserved', 'SRC Q1 2026 winners / SRC Q2 Engineer Eval (untouched copies)'],
    ['App sheets', 'Engineers · Quarterly Results · Summary'],
    ['Q1 KPIs', TCS_DA_AV_Q1_METRIC_HEADERS.join(' | ')],
    ['Q2 KPIs', TCS_DA_AV_Q2_METRIC_HEADERS.join(' | ')],
    ['Future', 'Fill Q3 / Q4 Final Score + KPI columns — no structural redesign needed'],
    ['Product', 'HA → DA, AV → AV, AV + HA → AV+DA (Product column on Engineers)'],
    ['Scores', 'Existing finals may exceed 100 due to bonuses; validation allows 0–200'],
    ['Generated', new Date().toISOString()],
  ];
  notes.forEach((row) => readme.addRow(row));
  readme.getColumn(1).width = 18;
  readme.getColumn(2).width = 100;
  readme.getRow(1).font = { bold: true, size: 14, color: { argb: HEADER_FILL } };

  // Move app sheets to front (ReadMe, Engineers, Quarterly, Summary, then SRC*)
  wb.views = [{ activeTab: 1 }];

  console.log('Writing workbooks…');
  await wb.xlsx.writeFile(OUT_EVAL);
  await wb.xlsx.writeFile(OUT_PROJECT);
  console.log(`Wrote:\n  ${OUT_EVAL}\n  ${OUT_PROJECT}`);
  console.log(`Rows: ${engineers.length} | Q1 only: ${engineers.filter((e) => e.q1 && !e.q2).length} | Q2 only: ${engineers.filter((e) => e.q2 && !e.q1).length} | both: ${engineers.filter((e) => e.q1 && e.q2).length}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
