/** Known academy locations / products (survey form options). */
export const SAMSUNG_ACADEMY_LOCATIONS = ['الإسكندرية', 'أسيوط', 'طنطا'];
export const ACADEMY_PRODUCTS = ['موبايل', 'تلفزيون', 'أجهزة منزلية'];

/** @typedef {{ dateFrom?: string, dateTo?: string, location?: string, product?: string }} SurveyFilters */

/** Rating fields on Samsung Academy survey (1–10 scale). */
export const SURVEY_RATING_FIELDS = [
  { key: 'contentValue', label: 'Content valuable' },
  { key: 'trainerClarity', label: 'Trainer clear & effective' },
  { key: 'needMoreSessions', label: 'Need more sessions' },
  { key: 'periodSuitable', label: 'Training period suitable' },
  { key: 'placeAccommodation', label: 'Place & accommodation' },
];

export function surveyRateBandEn(value) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n <= 6) return 'Dissatisfied';
  if (n <= 8) return 'Neutral';
  return 'Satisfied';
}

function parseRating(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
}

function countBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const k = keyFn(item);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function avgRatingsForField(rows, fieldKey) {
  const vals = rows.map((r) => parseRating(r[fieldKey])).filter((n) => n != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function bandCountsForField(rows, fieldKey) {
  const bands = { Dissatisfied: 0, Neutral: 0, Satisfied: 0 };
  for (const r of rows) {
    const band = surveyRateBandEn(r[fieldKey]);
    if (band) bands[band] += 1;
  }
  return bands;
}

/** Group submissions by calendar day (YYYY-MM-DD). */
function submissionsByDay(rows) {
  const map = new Map();
  for (const r of rows) {
    const raw = r.createdAt || '';
    const day = String(raw).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    map.set(day, (map.get(day) || 0) + 1);
  }
  return [...map.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function surveyDayKey(createdAt) {
  const day = String(createdAt || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';
}

/** Unique non-empty values from loaded surveys (plus known form options). */
export function getSurveyFilterOptions(surveys) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const locSet = new Set(SAMSUNG_ACADEMY_LOCATIONS);
  const prodSet = new Set(ACADEMY_PRODUCTS);
  for (const r of rows) {
    const loc = String(r.academyLocation || '').trim();
    const prod = String(r.product || '').trim();
    if (loc) locSet.add(loc);
    if (prod) prodSet.add(prod);
  }
  const dates = [];
  for (const r of rows) {
    const day = surveyDayKey(r.createdAt);
    if (day) dates.push(day);
  }
  const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));

  return {
    locations: [...locSet],
    products: [...prodSet],
    dates: uniqueDates,
  };
}

/** Format YYYY-MM-DD for dropdown labels (English). */
export function formatSurveyDateLabel(isoDay) {
  if (!isoDay || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay || '';
  const [y, m, d] = isoDay.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDay;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function filterSamsungAcademySurveys(surveys, filters = {}) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  const location = String(filters.location || 'ALL').trim();
  const product = String(filters.product || 'ALL').trim();

  return rows.filter((r) => {
    const day = surveyDayKey(r.createdAt);
    if (dateFrom || dateTo) {
      if (!day) return false;
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
    }
    if (location && location !== 'ALL') {
      if (String(r.academyLocation || '').trim() !== location) return false;
    }
    if (product && product !== 'ALL') {
      if (String(r.product || '').trim() !== product) return false;
    }
    return true;
  });
}

export function describeSurveyFilters(filters = {}) {
  const parts = [];
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  if (dateFrom || dateTo) {
    parts.push(
      `Date: ${dateFrom ? formatSurveyDateLabel(dateFrom) : '…'} → ${dateTo ? formatSurveyDateLabel(dateTo) : '…'}`
    );
  }
  if (filters.location && filters.location !== 'ALL') {
    parts.push(`Location: ${filters.location}`);
  }
  if (filters.product && filters.product !== 'ALL') {
    parts.push(`Product: ${filters.product}`);
  }
  return parts.length ? parts.join(' | ') : 'All responses (no filters)';
}

export function buildSamsungAcademySurveyAnalytics(surveys) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const total = rows.length;

  const questionStats = SURVEY_RATING_FIELDS.map((f) => {
    const average = avgRatingsForField(rows, f.key);
    const bands = bandCountsForField(rows, f.key);
    const answered = bands.Dissatisfied + bands.Neutral + bands.Satisfied;
    return {
      ...f,
      average: average != null ? Number(average.toFixed(2)) : null,
      bands,
      answered,
    };
  });

  const overallScores = rows
    .map((r) => {
      const vals = SURVEY_RATING_FIELDS.map((f) => parseRating(r[f.key])).filter((n) => n != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })
    .filter((n) => n != null);

  const overallAverage =
    overallScores.length > 0
      ? Number((overallScores.reduce((a, b) => a + b, 0) / overallScores.length).toFixed(2))
      : null;

  const satisfiedCount = rows.filter((r) => {
    const bands = SURVEY_RATING_FIELDS.map((f) => surveyRateBandEn(r[f.key])).filter(Boolean);
    if (!bands.length) return false;
    return bands.every((b) => b === 'Satisfied');
  }).length;

  return {
    total,
    overallAverage,
    satisfiedRate: total > 0 ? Number(((satisfiedCount / total) * 100).toFixed(1)) : 0,
    questionStats,
    byLocation: countBy(rows, (r) => String(r.academyLocation || '').trim() || 'Unknown'),
    byProduct: countBy(rows, (r) => String(r.product || '').trim() || 'Unknown'),
    byCompany: countBy(rows, (r) => String(r.company || '').trim() || 'Unknown').slice(0, 12),
    byDay: submissionsByDay(rows),
    recent: rows
      .slice()
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 15),
  };
}
