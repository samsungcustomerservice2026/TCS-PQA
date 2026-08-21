import { GOGO_CONSULTANT_MISS } from './constants';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Keyword search over published consultants with extracted text.
 * @param {Array<object>} catalog
 * @param {string} question
 * @param {{ limit?: number }} [opts]
 */
export function searchConsultantsForQuestion(catalog, question, { limit = 5 } = {}) {
  const qTokens = tokenize(question);
  if (!qTokens.length) return [];

  const scored = (catalog || [])
    .filter((c) => c?.status === 'published')
    .map((c) => {
      const blob = [
        c.title_en,
        c.title_ar,
        c.summary_en,
        c.summary_ar,
        c.category,
        ...(c.tags || []),
        c.searchText,
      ]
        .join(' ')
        .toLowerCase();
      let score = 0;
      for (const t of qTokens) {
        if (blob.includes(t)) score += t.length >= 4 ? 3 : 1;
      }
      if (String(c.title_en || '').toLowerCase().includes(String(question || '').toLowerCase().slice(0, 40))) {
        score += 8;
      }
      return { consultant: c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function formatConsultantAnswer(consultant, lang = 'en', { snippetChars = 480 } = {}) {
  if (!consultant) return '';
  const L = lang === 'ar' ? 'ar' : 'en';
  const title = L === 'ar' ? consultant.title_ar || consultant.title_en : consultant.title_en;
  const summary =
    L === 'ar'
      ? consultant.summary_ar || consultant.summary_en
      : consultant.summary_en || consultant.summary_ar;
  const extract = String(consultant.searchText || '').replace(/\s+/g, ' ').trim();
  if (!extract && !summary) return '';

  const body = extract
    ? extract.slice(0, snippetChars) + (extract.length > snippetChars ? '…' : '')
    : summary;

  if (L === 'ar') {
    return `من مكتبة الاستشارات الفنية — ${title}:\n${body}\n\nتقدر تفتح الدورة وتكملها من لوحة المعرفة.`;
  }
  return `From the Technical Consultants library — ${title}:\n${body}\n\nOpen the course from My Knowledge to complete it.`;
}

export function retrieveConsultantForGoGo(catalog, question, lang = 'en') {
  const hits = searchConsultantsForQuestion(catalog, question, { limit: 3 });
  if (!hits.length) {
    return {
      found: false,
      reply: GOGO_CONSULTANT_MISS[lang === 'ar' ? 'ar' : 'en'],
      consultant: null,
      action: null,
    };
  }
  const top = hits[0].consultant;
  const hasText = !!(top.searchText || top.summary_en || top.summary_ar);
  if (!hasText) {
    return {
      found: false,
      reply: GOGO_CONSULTANT_MISS[lang === 'ar' ? 'ar' : 'en'],
      consultant: top,
      action: null,
    };
  }
  return {
    found: true,
    reply: formatConsultantAnswer(top, lang),
    consultant: top,
    action: `goto_consultant:${top.id}`,
    chips: ['open_consultant', 'main_menu'],
  };
}

export function listActiveAnnouncements(announcements = []) {
  return (announcements || [])
    .filter((a) => a?.active)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export function formatGoGoAnnouncement(announcement, lang = 'en') {
  if (!announcement) return '';
  if (lang === 'ar') {
    return `استشارة فنية جديدة: ${announcement.title_ar || announcement.title_en}.\n${announcement.body_ar || announcement.body_en || ''}\nافتحها من لوحة المعرفة لإكمالها.`;
  }
  return `New technical consultant: ${announcement.title_en}.\n${announcement.body_en || ''}\nOpen it from My Knowledge to complete the course.`;
}
