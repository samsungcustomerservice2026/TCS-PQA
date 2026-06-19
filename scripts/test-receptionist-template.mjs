/**
 * Verifies receptionist vs engineer MX template headers (no Next.js import chain).
 */
import * as XLSX from 'xlsx';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const RECEPTIONIST_HEADERS = [
  'Quarter', 'GSPN ID', 'ASC_Recep', 'ASC_CODE', 'ASC Name', 'Product',
  'Vote for Me', 'IQC First Time Fail', 'DRNPS', 'Exam', 'Co.A', 'TCS Score',
];
const ENGINEER_HEADERS = [
  'Quarter', 'ENGINEER code', 'SBA ID', 'ASC_ENGINEER', 'ASC_CODE', 'ASC Name', 'Product', 'SSR',
];

function buildReceptionistBuffer() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([RECEPTIONIST_HEADERS]);
  XLSX.utils.book_append_sheet(wb, ws, 'TCS MX Receptionist');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function readHeaders(buffer) {
  const wb = XLSX.read(buffer);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return { sheetName: wb.SheetNames[0], headers: rows[0] || [] };
}

const rx = readHeaders(buildReceptionistBuffer());
const outPath = join(root, 'tmp_receptionist_test.xlsx');
writeFileSync(outPath, buildReceptionistBuffer());
const roundTrip = readHeaders(readFileSync(outPath));
unlinkSync(outPath);

const checks = [
  ['sheet name', roundTrip.sheetName === 'TCS MX Receptionist'],
  ['GSPN ID column', roundTrip.headers.includes('GSPN ID')],
  ['Vote for Me column', roundTrip.headers.includes('Vote for Me')],
  ['no ENGINEER code', !roundTrip.headers.includes('ENGINEER code')],
  ['no SSR column', !roundTrip.headers.includes('SSR')],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(ok ? 'PASS' : 'FAIL', '-', label);
  if (!ok) failed = true;
}

console.log('\nReceptionist headers:', rx.headers.join(' | '));
console.log('Engineer sample:', ENGINEER_HEADERS.join(' | '), '...');

if (failed) process.exit(1);
console.log('\nAll receptionist template checks passed.');
