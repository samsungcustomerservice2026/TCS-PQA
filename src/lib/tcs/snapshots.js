/**
 * TCS monthly locked snapshots (client helpers + shape).
 * Writes should go through Admin SDK when available; client path requires isEditorPlus.
 */
export function snapshotIdForPeriod(year, month) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  return `TCS_${y}-${m}_FINAL`;
}

export function buildTcsSnapshot({
  year,
  month,
  division = 'MX',
  engineers = [],
  lockedBy = '',
}) {
  return {
    id: snapshotIdForPeriod(year, month),
    label: `TCS ${year}-${String(month).padStart(2, '0')} FINAL`,
    year: Number(year),
    month: Number(month),
    division,
    locked: true,
    lockedAt: new Date().toISOString(),
    lockedBy,
    engineerCount: engineers.length,
    engineers: engineers.map((e) => ({
      code: e.code,
      name: e.name,
      tcsScore: e.tcsScore,
      tier: e.tier,
      partner: e.partner,
    })),
  };
}
