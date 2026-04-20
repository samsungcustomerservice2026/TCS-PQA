/**
 * MX PQA partner dashboard + Excel ★Partner Ranking — canonical partner ids and name mapping.
 * Used by src/app/page.js (upload + quarterly partner ranking).
 */

export function normalizePqaPartnerKey(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const PQA_OFFICIAL_MX_PARTNERS = [
  'ALSAFY',
  'ATS',
  'RAYA',
  'URC',
  'SKY',
  'K-ELECTRONICS',
  'MTI',
];

/**
 * Map column A / Firestore partner text to canonical id.
 * Samsung MENA sheets often use "ATS Egypt", "ATSEGYPT", "URC MENA", etc. — not exact "ATS".
 */
export function mapPqaSheetPartnerKeyToOfficial(normKey) {
  const n = normalizePqaPartnerKey(normKey);
  if (!n) return null;
  for (const op of PQA_OFFICIAL_MX_PARTNERS) {
    const on = normalizePqaPartnerKey(op);
    if (n === on) return op;
  }
  if (n.includes('ALSAFY') || n.includes('ALSAFI')) return 'ALSAFY';
  if (n.includes('KELECTRONICS') || (n.includes('ELECTRONICS') && n.includes('K'))) return 'K-ELECTRONICS';
  if (n.includes('RAYA') && n.length <= 14) return 'RAYA';
  if (n.includes('ADVANCE') || n.includes('TECHNICAL')) return 'ATS';
  // MENA / regional labels: "ATS Egypt", "ATS–MENA", merged "ATSEGYPT"
  if (n.startsWith('ATS')) return 'ATS';
  if (n === 'SKY' || (n.startsWith('SKY') && n.length <= 10)) return 'SKY';
  if (n.startsWith('URC')) return 'URC';
  if (n.startsWith('MTI')) return 'MTI';
  return null;
}
