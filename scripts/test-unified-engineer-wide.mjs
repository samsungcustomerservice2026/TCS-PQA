/**
 * Smoke-test unified Engineer_Wide parser (no Firebase).
 * Run: node scripts/test-unified-engineer-wide.mjs
 */
import {
  parseEngineerWideSheetRows,
  getUnifiedAverageFinalResult,
  engineerHasQuarter,
  toDisplayPercent,
  buildUnifiedEngineerTemplateWorkbook,
} from '../src/lib/tcsMxUnifiedExcel.js';
import * as XLSX from 'xlsx';

const headers = [
  'Engineer Code',
  'Engineer Username',
  'ASC Code',
  'ASC Name',
  'Product',
  'Q1 - SSR %',
  'Q1 - SSR Score',
  'Q1 - Final Result',
  'Q1 - DRNPS %',
  'Q2 - Maintenance Mode %',
  'Q2 - DRNPS %',
  'Q2 - Final Result',
  'Notes',
];

const rows = [
  headers,
  // both quarters
  ['7886000001', 'both.q', '111', 'ASC A', 'MX', 0.21875, 35, 85.296, 96.45, 0.32, 94.2, 62.37, ''],
  // Q1 only
  ['7886000002', 'q1.only', '222', 'ASC B', 'MX', 0.5, 30, 87.5, 80, '', '', '', 'No Q2 record.'],
  // Q2 only — metrics present, Final Result blank (no Q1 baseline)
  ['7886000003', 'q2.newhire', '333', 'ASC C', 'MX', '', '', '', '', 0.25, 90, '', 'No Q1 baseline for 75/25 blend — Final Q2 Result not computable.'],
];

const { records, quartersFound } = parseEngineerWideSheetRows(rows, { year: '2026' });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(quartersFound.includes('Q1') && quartersFound.includes('Q2'), 'detect Q1/Q2 blocks');
assert(records.length === 3, `expected 3 engineers, got ${records.length}`);

const both = records.find((r) => r.code === '7886000001');
assert(both?.quarters?.Q1?.present && both?.quarters?.Q2?.present, 'both present');
assert(Math.abs(both.quarters.Q1.metrics.ssr - 21.875) < 0.001, `SSR% scaled, got ${both.quarters.Q1.metrics.ssr}`);
assert(Math.abs(both.quarters.Q2.metrics.maintenancemode - 32) < 0.001, `Maint% scaled, got ${both.quarters.Q2.metrics.maintenancemode}`);
assert(Math.abs(both.quarters.Q2.metrics.drnps - 94.2) < 0.01, 'DRNPS already 0-100 kept');
const avg = getUnifiedAverageFinalResult(both);
assert(Math.abs(avg - (85.296 + 62.37) / 2) < 0.01, `avg final, got ${avg}`);

const q1only = records.find((r) => r.code === '7886000002');
assert(engineerHasQuarter(q1only, 'Q1') && !engineerHasQuarter(q1only, 'Q2'), 'Q1 only');
assert(getUnifiedAverageFinalResult(q1only) === 87.5, 'Q1-only avg = Q1 final');

const q2only = records.find((r) => r.code === '7886000003');
assert(!engineerHasQuarter(q2only, 'Q1') && engineerHasQuarter(q2only, 'Q2'), 'Q2 only present');
assert(q2only.quarters.Q2.finalResult == null, 'Q2 final null when blank');
assert(getUnifiedAverageFinalResult(q2only) == null, 'avg null when no finals');

assert(toDisplayPercent(0.21875, 'SSR %') === 21.875, 'toDisplayPercent');
assert(toDisplayPercent(94.2, 'DRNPS %') === 94.2, 'no double scale');

const wb = buildUnifiedEngineerTemplateWorkbook();
assert(wb.SheetNames.includes('Engineer_Wide'), 'template wide');
assert(wb.SheetNames.includes('Engineer_Summary'), 'template summary');
assert(wb.SheetNames.includes('Engineer_KPI_Detail'), 'template detail');

console.log('OK — unified Engineer_Wide parser checks passed');
console.log(JSON.stringify({
  bothAvg: avg,
  q1only: { Q1: q1only.quarters.Q1.finalResult, Q2: q1only.quarters.Q2.present },
  q2only: { present: q2only.quarters.Q2.present, final: q2only.quarters.Q2.finalResult },
}, null, 2));
