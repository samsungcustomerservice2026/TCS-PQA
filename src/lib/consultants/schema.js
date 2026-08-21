import {
  CONSULTANT_AUDIENCE,
  CONSULTANT_STATUS,
  DEFAULT_MIN_DWELL_SECONDS,
  EMPLOYEE_STATUS,
  EMPLOYEE_PRODUCT_LINE,
  PROGRESS_RESULT,
} from './constants';

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function createEmptyConsultant({
  title_en = '',
  title_ar = '',
  summary_en = '',
  summary_ar = '',
  category = 'general',
  tags = [],
  minDwellSeconds = DEFAULT_MIN_DWELL_SECONDS,
  audience = CONSULTANT_AUDIENCE.ALL,
  mustComplete = true,
  actor = 'admin',
} = {}) {
  const now = new Date().toISOString();
  const base = slugify(title_en) || `consultant-${Date.now()}`;
  return {
    id: `${base}-${Date.now().toString(36)}`,
    title_en: String(title_en || '').trim(),
    title_ar: String(title_ar || title_en || '').trim(),
    summary_en: String(summary_en || '').trim(),
    summary_ar: String(summary_ar || summary_en || '').trim(),
    category: String(category || 'general').trim() || 'general',
    tags: (Array.isArray(tags) ? tags : String(tags || '').split(/[,;]/))
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 20),
    minDwellSeconds: Math.max(30, Number(minDwellSeconds) || DEFAULT_MIN_DWELL_SECONDS),
    audience: Object.values(CONSULTANT_AUDIENCE).includes(audience)
      ? audience
      : CONSULTANT_AUDIENCE.ALL,
    mustComplete: mustComplete !== false,
    status: CONSULTANT_STATUS.DRAFT,
    assets: [],
    searchText: '',
    extractStatus: 'pending',
    publishedAt: null,
    announcementId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    updatedBy: actor,
  };
}

export function validateConsultant(record) {
  const errors = [];
  if (!record?.title_en?.trim()) errors.push('title_en is required');
  if (!record?.minDwellSeconds || Number(record.minDwellSeconds) < 30) {
    errors.push('minDwellSeconds must be at least 30');
  }
  if (!Object.values(CONSULTANT_STATUS).includes(record?.status)) {
    errors.push('invalid status');
  }
  return { ok: errors.length === 0, errors };
}

export function createAnnouncementFromConsultant(consultant, actor = 'admin') {
  const now = new Date().toISOString();
  return {
    id: `ann-${consultant.id}`,
    consultantId: consultant.id,
    title_en: consultant.title_en,
    title_ar: consultant.title_ar || consultant.title_en,
    body_en: consultant.summary_en || `New technical consultant: ${consultant.title_en}`,
    body_ar: consultant.summary_ar || consultant.summary_en || `استشارة فنية جديدة: ${consultant.title_ar || consultant.title_en}`,
    audience: consultant.audience || CONSULTANT_AUDIENCE.ALL,
    active: true,
    mustComplete: consultant.mustComplete !== false,
    createdAt: now,
    createdBy: actor,
  };
}

export function createEmptyEmployeeProfile({
  uid,
  email,
  gspnId,
  phone = '',
  displayName = '',
  productLine = EMPLOYEE_PRODUCT_LINE.MX,
} = {}) {
  const now = new Date().toISOString();
  const line = Object.values(EMPLOYEE_PRODUCT_LINE).includes(productLine)
    ? productLine
    : EMPLOYEE_PRODUCT_LINE.MX;
  return {
    uid,
    email: String(email || '').trim().toLowerCase(),
    gspnId: String(gspnId || '').trim().toUpperCase(),
    phone: String(phone || '').trim(),
    displayName: String(displayName || '').trim(),
    productLine: line,
    status: EMPLOYEE_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

export function createEmptyProgress({ uid, consultantId, consultantTitle = '' } = {}) {
  const now = new Date().toISOString();
  return {
    id: `${uid}_${consultantId}`,
    uid,
    consultantId,
    consultantTitle,
    lastResult: null,
    bestResult: null,
    currentAttempt: null,
    attempts: [],
    totalDwellSeconds: 0,
    totalClicks: 0,
    updatedAt: now,
    createdAt: now,
  };
}

export function startAttempt(progress, { minDwellSeconds } = {}) {
  const now = new Date().toISOString();
  const attempt = {
    attemptNo: (progress.attempts?.length || 0) + 1,
    startedAt: now,
    endedAt: null,
    dwellSeconds: 0,
    clickCount: 0,
    result: PROGRESS_RESULT.IN_PROGRESS,
    minDwellSeconds: Number(minDwellSeconds) || DEFAULT_MIN_DWELL_SECONDS,
  };
  return {
    ...progress,
    currentAttempt: attempt,
    lastResult: PROGRESS_RESULT.IN_PROGRESS,
    updatedAt: now,
  };
}

export function finalizeAttempt(progress, { dwellSeconds, clickCount, result }) {
  const now = new Date().toISOString();
  const current = progress.currentAttempt || {
    attemptNo: (progress.attempts?.length || 0) + 1,
    startedAt: now,
    minDwellSeconds: DEFAULT_MIN_DWELL_SECONDS,
  };
  const finished = {
    ...current,
    endedAt: now,
    dwellSeconds: Math.max(0, Math.floor(Number(dwellSeconds) || 0)),
    clickCount: Math.max(0, Math.floor(Number(clickCount) || 0)),
    result,
  };
  const attempts = [...(progress.attempts || []), finished];
  const bestResult =
    attempts.some((a) => a.result === PROGRESS_RESULT.PASSED)
      ? PROGRESS_RESULT.PASSED
      : result;
  return {
    ...progress,
    attempts,
    currentAttempt: null,
    lastResult: result,
    bestResult,
    totalDwellSeconds: (progress.totalDwellSeconds || 0) + finished.dwellSeconds,
    totalClicks: (progress.totalClicks || 0) + finished.clickCount,
    updatedAt: now,
  };
}

export function progressDocId(uid, consultantId) {
  return `${uid}_${consultantId}`;
}
