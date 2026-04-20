/**
 * Run: node scripts/verify-pqa-partner-map.mjs
 * Fails non-zero if partner name → official id mapping regresses (MENA labels, etc.).
 */
import { mapPqaSheetPartnerKeyToOfficial } from '../src/lib/pqaPartnerMap.js';

const cases = [
  ['ATS', 'ATS'],
  ['ATS Egypt', 'ATS'],
  ['ATSEGYPT', 'ATS'],
  ['Advance Technical', 'ATS'],
  ['K ELECTRONICS', 'K-ELECTRONICS'],
  ['K-ELECTRONICS', 'K-ELECTRONICS'],
  ['KELECTRONICS LLC', 'K-ELECTRONICS'],
  ['SKY', 'SKY'],
  ['URC', 'URC'],
  ['URCMENA', 'URC'],
  ['RAYA SYRIA', 'RAYA'],
  ['MTI', 'MTI'],
  ['BOATS', null],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = mapPqaSheetPartnerKeyToOfficial(input);
  if (got !== expected) {
    console.error(`FAIL: map(${JSON.stringify(input)}) => ${JSON.stringify(got)} (expected ${JSON.stringify(expected)})`);
    failed += 1;
  }
}
if (failed === 0) {
  console.log(`OK: ${cases.length} partner map cases passed.`);
}
process.exit(failed);
