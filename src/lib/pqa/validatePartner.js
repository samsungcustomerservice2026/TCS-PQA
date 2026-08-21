/**
 * PQA partner validation helpers — prefer stable keys over display names.
 */
import { normalizePqaPartnerKey, PQA_OFFICIAL_MX_PARTNERS, mapPqaSheetPartnerKeyToOfficial } from '../pqaPartnerMap.js';

export function validatePqaPartnerRow({ partner, division, center, period } = {}) {
  const errors = [];
  const key = normalizePqaPartnerKey(partner || center || '');
  if (!key) errors.push('missing_partner');

  const official = mapPqaSheetPartnerKeyToOfficial(key) || key;
  const known = (PQA_OFFICIAL_MX_PARTNERS || []).some(
    (p) => normalizePqaPartnerKey(p) === normalizePqaPartnerKey(official),
  );
  if (division === 'MX' || division === 'PQA_MX') {
    if (!known && key) errors.push('unknown_partner_key');
  }
  if (period && !/^\d{4}(-|\/)?(0?[1-9]|1[0-2])$/.test(String(period)) && !/^[A-Za-z]+[\s-]?\d{4}$/.test(String(period))) {
    // soft warning only
  }
  return {
    ok: errors.length === 0,
    errors,
    partnerKey: official || key,
  };
}
