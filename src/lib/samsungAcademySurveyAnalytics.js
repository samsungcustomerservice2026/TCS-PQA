/** Known academy locations / products (survey form options). */
export const SAMSUNG_ACADEMY_LOCATIONS = ['القاهرة', 'الإسكندرية', 'أسيوط', 'طنطا'];
export const ACADEMY_PRODUCTS = ['موبايل', 'تلفزيون', 'أجهزة منزلية'];

/**
 * Egypt geo pins for Samsung Academy survey reports.
 * Pins are projected from lat/lng onto the full Egypt map frame.
 */
export const SAMSUNG_ACADEMY_GEO = Object.freeze([
  {
    id: 'cairo',
    ar: 'القاهرة',
    en: 'Cairo',
    regionEn: 'Greater Cairo · Egypt',
    lat: 30.0444,
    lng: 31.2357,
  },
  {
    id: 'alexandria',
    ar: 'الإسكندرية',
    en: 'Alexandria',
    regionEn: 'North Coast · Egypt',
    lat: 31.2001,
    lng: 29.9187,
  },
  {
    id: 'tanta',
    ar: 'طنطا',
    en: 'Tanta',
    regionEn: 'Nile Delta · Egypt',
    lat: 30.7865,
    lng: 31.0004,
  },
  {
    id: 'assiut',
    ar: 'أسيوط',
    en: 'Assiut',
    regionEn: 'Upper Egypt',
    lat: 27.1809,
    lng: 31.1837,
  },
]);

const GEO_ALIASES = {
  القاهرة: 'cairo',
  القاهره: 'cairo',
  cairo: 'cairo',
  'greater cairo': 'cairo',
  الإسكندرية: 'alexandria',
  الاسكندرية: 'alexandria',
  alexandria: 'alexandria',
  alex: 'alexandria',
  أسيوط: 'assiut',
  اسيوط: 'assiut',
  assiut: 'assiut',
  asyut: 'assiut',
  طنطا: 'tanta',
  tanta: 'tanta',
};

export function resolveAcademyGeo(locationName) {
  const raw = String(locationName || '').trim();
  if (!raw) return null;
  const key = GEO_ALIASES[raw] || GEO_ALIASES[raw.toLowerCase()];
  if (key) return SAMSUNG_ACADEMY_GEO.find((g) => g.id === key) || null;
  return (
    SAMSUNG_ACADEMY_GEO.find(
      (g) => g.ar === raw || g.en.toLowerCase() === raw.toLowerCase() || g.id === raw.toLowerCase(),
    ) || null
  );
}

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

  // Prefer canonical order: Cairo first, then known list, then extras
  const ordered = [];
  for (const loc of SAMSUNG_ACADEMY_LOCATIONS) {
    if (locSet.has(loc)) {
      ordered.push(loc);
      locSet.delete(loc);
    }
  }
  ordered.push(...[...locSet].sort((a, b) => a.localeCompare(b, 'ar')));

  return {
    locations: ordered,
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
      `Date: ${dateFrom ? formatSurveyDateLabel(dateFrom) : '…'} → ${dateTo ? formatSurveyDateLabel(dateTo) : '…'}`,
    );
  }
  if (filters.location && filters.location !== 'ALL') {
    const geo = resolveAcademyGeo(filters.location);
    parts.push(`Location: ${geo ? `${geo.en} (${filters.location})` : filters.location}`);
  }
  if (filters.product && filters.product !== 'ALL') {
    parts.push(`Product: ${filters.product}`);
  }
  return parts.length ? parts.join(' | ') : 'All responses (no filters)';
}

/** Build geo pins + counts for Egypt map (always includes known cities). */
export function buildAcademyGeoBreakdown(surveys) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const counts = new Map();
  for (const r of rows) {
    const geo = resolveAcademyGeo(r.academyLocation);
    const id = geo?.id || 'other';
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const pins = SAMSUNG_ACADEMY_GEO.map((g) => {
    const cityRows = rows.filter((r) => resolveAcademyGeo(r.academyLocation)?.id === g.id);
    const avg =
      cityRows.length > 0
        ? (() => {
            const scores = cityRows
              .map((r) => {
                const vals = SURVEY_RATING_FIELDS.map((f) => parseRating(r[f.key])).filter((n) => n != null);
                if (!vals.length) return null;
                return vals.reduce((a, b) => a + b, 0) / vals.length;
              })
              .filter((n) => n != null);
            if (!scores.length) return null;
            return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
          })()
        : null;
    return {
      ...g,
      count: counts.get(g.id) || 0,
      average: avg,
    };
  });

  const other = counts.get('other') || 0;
  const totalMapped = pins.reduce((s, p) => s + p.count, 0);

  return {
    country: 'Egypt',
    countryCode: 'EG',
    pins,
    other,
    totalMapped,
    total: rows.length,
  };
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

  const geo = buildAcademyGeoBreakdown(rows);

  return {
    total,
    overallAverage,
    satisfiedRate: total > 0 ? Number(((satisfiedCount / total) * 100).toFixed(1)) : 0,
    questionStats,
    byLocation: countBy(rows, (r) => String(r.academyLocation || '').trim() || 'Unknown'),
    byLocationEn: geo.pins
      .map((p) => ({ name: p.en, count: p.count, ar: p.ar, regionEn: p.regionEn }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count),
    geo,
    byProduct: countBy(rows, (r) => String(r.product || '').trim() || 'Unknown'),
    byCompany: countBy(rows, (r) => String(r.company || '').trim() || 'Unknown').slice(0, 12),
    byDay: submissionsByDay(rows),
    recent: rows
      .slice()
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 15),
  };
}
