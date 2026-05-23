/** Build last N days of daily hit counts (fills missing days with 0). */
export function buildDailySeries(dailyMap = {}, days = 14) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Number(dailyMap[key] || 0),
    });
  }
  return out;
}

export function sumSeries(series) {
  return (series || []).reduce((acc, row) => acc + (row.count || 0), 0);
}

export function maxSeriesCount(series) {
  return Math.max(1, ...(series || []).map((row) => row.count || 0));
}

export function topModeHits(modeHits = {}, limit = 5) {
  return Object.entries(modeHits || {})
    .map(([mode, count]) => ({ mode, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
