import { FEEDBACK_PRODUCT_OPTIONS } from './arabicFeedbackValidation';

/** @typedef {{ dateFrom?: string, dateTo?: string, product?: string, company?: string }} FeedbackFilters */

function feedbackDayKey(createdAt) {
  const day = String(createdAt || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';
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

function submissionsByDay(rows) {
  const map = new Map();
  for (const r of rows) {
    const day = feedbackDayKey(r.createdAt);
    if (!day) continue;
    map.set(day, (map.get(day) || 0) + 1);
  }
  return [...map.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function normalizeFeedbackRow(row) {
  const r = row || {};
  return {
    ...r,
    fullName: String(r.fullName || r.name || '').trim(),
    phoneNumber: String(r.phoneNumber || '').trim(),
    company: String(r.company || '').trim(),
    product: String(r.product || '').trim(),
    position: String(r.position || '').trim(),
    message: String(r.message || '').trim(),
  };
}

export function getFeedbackFilterOptions(feedbacks) {
  const rows = (Array.isArray(feedbacks) ? feedbacks : []).map(normalizeFeedbackRow);
  const prodSet = new Set(FEEDBACK_PRODUCT_OPTIONS);
  const companySet = new Set();
  for (const r of rows) {
    if (r.product) prodSet.add(r.product);
    if (r.company) companySet.add(r.company);
  }
  return {
    products: [...prodSet],
    companies: [...companySet].sort((a, b) => a.localeCompare(b, 'ar')),
  };
}

export function filterArabicFeedbacks(feedbacks, filters = {}) {
  const rows = (Array.isArray(feedbacks) ? feedbacks : []).map(normalizeFeedbackRow);
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  const product = String(filters.product || 'ALL').trim();
  const company = String(filters.company || 'ALL').trim();

  return rows.filter((r) => {
    const day = feedbackDayKey(r.createdAt);
    if (dateFrom || dateTo) {
      if (!day) return false;
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
    }
    if (product && product !== 'ALL' && r.product !== product) return false;
    if (company && company !== 'ALL' && r.company !== company) return false;
    return true;
  });
}

export function formatFeedbackDateLabel(isoDay) {
  if (!isoDay || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay || '';
  const [y, m, d] = isoDay.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDay;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function describeFeedbackFilters(filters = {}) {
  const parts = [];
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  if (dateFrom || dateTo) {
    parts.push(
      `Date: ${dateFrom ? formatFeedbackDateLabel(dateFrom) : '…'} → ${dateTo ? formatFeedbackDateLabel(dateTo) : '…'}`
    );
  }
  if (filters.product && filters.product !== 'ALL') parts.push(`Product: ${filters.product}`);
  if (filters.company && filters.company !== 'ALL') parts.push(`Company: ${filters.company}`);
  return parts.length ? parts.join(' | ') : 'All responses (no filters)';
}

export function buildArabicFeedbackAnalytics(feedbacks) {
  const rows = (Array.isArray(feedbacks) ? feedbacks : []).map(normalizeFeedbackRow);
  return {
    total: rows.length,
    byProduct: countBy(rows, (r) => r.product || 'Unknown'),
    byCompany: countBy(rows, (r) => r.company || 'Unknown').slice(0, 15),
    byDay: submissionsByDay(rows),
    recent: rows
      .slice()
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 15),
  };
}
