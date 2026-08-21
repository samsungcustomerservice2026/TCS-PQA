/** Technical Consultants library + employee learning progress. */

export const CONSULTANT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const CONSULTANT_AUDIENCE = Object.freeze({
  ALL: 'all',
  MX: 'mx',
  CE: 'ce', // CE covers DA & AV
});

export const CONSULTANT_AUDIENCE_LABELS = Object.freeze({
  all: 'All (MX + CE)',
  mx: 'MX only',
  ce: 'CE only (DA & AV)',
});

export const EMPLOYEE_PRODUCT_LINE = Object.freeze({
  MX: 'mx',
  CE: 'ce',
});

export const EMPLOYEE_PRODUCT_LINE_LABELS = Object.freeze({
  mx: 'MX',
  ce: 'CE (DA & AV)',
});

/** Whether a published consultant should appear for this employee product line. */
export function consultantMatchesProductLine(consultant, productLine) {
  const aud = String(consultant?.audience || 'all').toLowerCase();
  const line = String(productLine || '').toLowerCase();
  if (!line) return aud === 'all';
  if (aud === 'all') return true;
  if (aud === 'mx') return line === 'mx';
  if (aud === 'ce' || aud === 'da' || aud === 'av') return line === 'ce';
  return false;
}

export const PROGRESS_RESULT = Object.freeze({
  IN_PROGRESS: 'in_progress',
  PASSED: 'passed',
  FAILED: 'failed',
});

export const EMPLOYEE_STATUS = Object.freeze({
  ACTIVE: 'active',
  DISABLED: 'disabled',
});

export const CONSULTANT_FIRESTORE = Object.freeze({
  consultants: 'consultants',
  announcements: 'consultant_announcements',
  employees: 'employees',
  employeeIndex: 'employee_index',
  progress: 'employee_progress',
});

export const CONSULTANT_STORAGE_PREFIX = 'consultants';

export const CONSULTANT_ALLOWED_MIME = Object.freeze([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export const CONSULTANT_ALLOWED_EXT = Object.freeze([
  '.pdf',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
]);

export const CONSULTANT_IMAGE_EXT = Object.freeze(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

export const DEFAULT_MIN_DWELL_SECONDS = 300;

export const PROGRESS_HEARTBEAT_MS = 12_000;

export const GOGO_CONSULTANT_UNAVAILABLE = Object.freeze({
  en: 'These product data are currently unavailable. Stay tuned for new updates.',
  ar: 'بيانات المنتج دي غير متاحة حالياً. خليك متابع للتحديثات الجديدة.',
});

/** Prefer consultant-specific wording for knowledge misses. */
export const GOGO_CONSULTANT_MISS = Object.freeze({
  en: 'This technical consultant detail is currently unavailable. Stay tuned for new updates.',
  ar: 'تفاصيل الاستشارة الفنية دي غير متاحة حالياً. خليك متابع للتحديثات الجديدة.',
});
