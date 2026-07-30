export const TCS_MX_WINNER_ROLES = [
  { key: 'engineers', label: 'Engineers' },
  { key: 'receptionists', label: 'Receptionists' },
  { key: 'galaxy_consultants', label: 'Galaxy Consultants' },
];

/** Default dashboard winner slots (engineers, galaxy, DA, AV). */
export const TCS_WINNERS_DEFAULT_SLOTS = 6;

/** Receptionist dashboard winner slots — partial fill allowed (1–5). */
export const TCS_RECEPTIONIST_WINNERS_SLOTS = 5;

/** Galaxy consultant dashboard winner slots — partial fill allowed (1–2). */
export const TCS_GALAXY_CONSULTANT_WINNERS_SLOTS = 2;

export function getTcsWinnersSlotCount(mxRole = 'engineers') {
  if (mxRole === 'receptionists') return TCS_RECEPTIONIST_WINNERS_SLOTS;
  if (mxRole === 'galaxy_consultants') return TCS_GALAXY_CONSULTANT_WINNERS_SLOTS;
  return TCS_WINNERS_DEFAULT_SLOTS;
}

export function allowsPartialTcsWinners(mxRole = 'engineers') {
  return mxRole === 'receptionists' || mxRole === 'galaxy_consultants';
}

export function validateTcsWinnersCodes(winners, mxRole = 'engineers') {
  const slotCount = getTcsWinnersSlotCount(mxRole);
  const cleaned = (Array.isArray(winners) ? winners : [])
    .map((code) => String(code || '').trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return { ok: true, winners: [], slotCount };
  }

  if (new Set(cleaned).size !== cleaned.length) {
    return { ok: false, error: 'Winner codes must be unique.', winners: cleaned, slotCount };
  }

  if (allowsPartialTcsWinners(mxRole)) {
    if (cleaned.length > slotCount) {
      const roleLabel = mxRole === 'receptionists' ? 'receptionist' : 'galaxy consultant';
      return { ok: false, error: `Maximum ${slotCount} ${roleLabel} codes.`, winners: cleaned, slotCount };
    }
    return { ok: true, winners: cleaned, slotCount };
  }

  if (cleaned.length !== slotCount) {
    return {
      ok: false,
      error: `Provide exactly ${slotCount} codes, or clear all fields to disable winners.`,
      winners: cleaned,
      slotCount,
    };
  }

  return { ok: true, winners: cleaned, slotCount };
}

export function resolveTcsWinnersDocId(quarterKey, product, mxRole = 'engineers') {
  const q = String(quarterKey || '').toUpperCase().trim();
  const p = String(product || '').toUpperCase().trim();
  const role = String(mxRole || 'engineers').trim();
  if (p === 'MX' && role && role !== 'engineers') {
    return `${q}-${p}-${role}`;
  }
  return `${q}-${p}`;
}

export function buildTcsWinnersConfigMap(configs = []) {
  const map = new Map();
  configs.forEach((cfg) => {
    const docId = String(cfg?.id || '').toUpperCase().trim();
    let quarterKey = String(cfg?.quarterKey || '').toUpperCase().trim();
    let product = String(cfg?.product || '').toUpperCase().trim();

    if ((!quarterKey || !product) && docId) {
      const legacy = docId.match(/^(Q[1-4]-\d{4})-(MX|DA|AV)(?:-(ENGINEERS|RECEPTIONISTS|GALAXY_CONSULTANTS))?$/i);
      if (legacy) {
        quarterKey = quarterKey || legacy[1].toUpperCase();
        product = product || legacy[2].toUpperCase();
      }
    }

    if (!quarterKey || !product) return;

    const mxRole = product === 'MX'
      ? String(cfg?.mxRole || (docId.includes('-RECEPTIONISTS') ? 'receptionists' : docId.includes('-GALAXY_CONSULTANTS') ? 'galaxy_consultants' : 'engineers'))
      : 'engineers';

    const normalizedCfg = {
      ...cfg,
      quarterKey,
      product,
      mxRole: product === 'MX' ? mxRole : 'engineers',
      winners: Array.isArray(cfg?.winners) ? cfg.winners : [],
    };

    const primaryKey = resolveTcsWinnersDocId(quarterKey, product, mxRole);
    map.set(primaryKey, normalizedCfg);
    if (docId) map.set(docId, normalizedCfg);
    if (product === 'MX' && mxRole === 'engineers') {
      map.set(`${quarterKey}-${product}`, normalizedCfg);
    }
  });
  return map;
}

export function lookupTcsWinnersConfig(map, quarterKey, product, mxRole = 'engineers') {
  if (!map || !quarterKey || !product) return null;
  const q = String(quarterKey).toUpperCase();
  const p = String(product).toUpperCase();
  const role = p === 'MX' ? String(mxRole || 'engineers') : 'engineers';
  const docId = resolveTcsWinnersDocId(q, p, role);
  const hit = map.get(docId);
  if (hit) return hit;
  // Legacy engineer docs are stored as Qn-YYYY-MX (no role suffix). Never fall back to
  // that key for receptionists / galaxy consultants — that leaked engineer winners into those tabs.
  if (p === 'MX' && role !== 'engineers') return null;
  return map.get(`${q}-${p}`) || null;
}

/** Resolve winners config from map + raw rows (engineer MX legacy docs included). */
export function resolveTcsWinnersConfig(configs, map, quarterKey, product, mxRole = 'engineers') {
  const q = String(quarterKey || '').toUpperCase().trim();
  const p = String(product || '').toUpperCase().trim();
  const role = p === 'MX' ? String(mxRole || 'engineers') : 'engineers';
  if (!q || !p) return null;

  const fromMap = lookupTcsWinnersConfig(map, q, p, role);
  if (fromMap?.winners?.length) return fromMap;

  const docId = resolveTcsWinnersDocId(q, p, role);
  const rows = Array.isArray(configs) ? configs : [];
  const fromDocId = rows.find((cfg) => String(cfg?.id || '').toUpperCase() === docId);
  if (fromDocId?.winners?.length) return fromDocId;

  const fromFields = rows.find((cfg) => {
    const cfgQ = String(cfg?.quarterKey || '').toUpperCase();
    const cfgP = String(cfg?.product || '').toUpperCase();
    if (cfgQ !== q || cfgP !== p) return false;
    if (p === 'MX') {
      const cfgRole = String(cfg?.mxRole || 'engineers');
      return cfgRole === role;
    }
    return true;
  });
  if (fromFields?.winners?.length) return fromFields;

  return null;
}

/** True when a winners-config map key belongs to the given product + MX role (excludes cross-role keys). */
export function isWinnersMapKeyForRole(mapKey, product, mxRole = 'engineers') {
  const key = String(mapKey || '').toUpperCase().trim();
  const p = String(product || '').toUpperCase().trim();
  const role = String(mxRole || 'engineers').trim();
  if (!key || !p) return false;
  if (p === 'MX' && role !== 'engineers') {
    return key.endsWith(`-${p}-${role}`.toUpperCase());
  }
  return new RegExp(`^Q[1-4]-\\d{4}-${p}$`, 'i').test(key);
}
