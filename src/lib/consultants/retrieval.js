import { GOGO_CONSULTANT_MISS } from './constants';

const CONSULTANT_GUIDE_CHIPS = ['open_consultant', 'goto_knowledge', 'how_tip', 'main_menu'];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Broad “consultant / tip / knowledge” asks — coach, don’t dump a weak library hit. */
export function isGenericKnowledgeQuery(text) {
  const t = String(text || '').trim();
  if (!t || t.length > 48) return false;
  return /^(consultants?|tips?|technical\s+consultants?|technical\s+tips?|my\s+knowledge|knowledge|course|courses|bulletin|استشارة|استشارات|نصيحة|نصائح|معرفة|لوحة\s*المعرفة|دورة|دورات)[.!؟?]*$/i.test(
    t,
  );
}

function isStubExtract(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  return /^image\s*attachment\s*:/i.test(s) || /^photo\b/i.test(s);
}

function pickTitle(consultant, lang) {
  const L = lang === 'ar' ? 'ar' : 'en';
  return L === 'ar'
    ? (consultant.title_ar || consultant.title_en || 'Technical tip')
    : (consultant.title_en || consultant.title_ar || 'Technical tip');
}

function pickSummary(consultant, lang) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const summary =
    L === 'ar'
      ? consultant.summary_ar || consultant.summary_en
      : consultant.summary_en || consultant.summary_ar;
  return String(summary || '').trim();
}

function pickConsultantBody(consultant, lang, { snippetChars = 360 } = {}) {
  const summary = pickSummary(consultant, lang);
  if (summary.length >= 8) return summary;

  const extract = String(consultant.searchText || '').replace(/\s+/g, ' ').trim();
  if (extract && !isStubExtract(extract)) {
    return extract.slice(0, snippetChars) + (extract.length > snippetChars ? '…' : '');
  }
  return '';
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

  const genericTokens = new Set([
    'consultant', 'consultants', 'technical', 'tip', 'tips', 'knowledge', 'course', 'courses',
    'bulletin', 'library', 'استشارة', 'استشارات', 'نصيحة', 'نصائح', 'معرفة', 'دورة', 'دورات',
  ]);
  const specificTokens = qTokens.filter((t) => !genericTokens.has(t));

  const scored = (catalog || [])
    .filter((c) => c?.status === 'published')
    .map((c) => {
      const titleBlob = `${c.title_en || ''} ${c.title_ar || ''}`.toLowerCase();
      const summaryBlob = `${c.summary_en || ''} ${c.summary_ar || ''}`.toLowerCase();
      const tagBlob = [...(c.tags || []), c.category || ''].join(' ').toLowerCase();
      const extractBlob = String(c.searchText || '').toLowerCase();
      let score = 0;
      for (const t of qTokens) {
        if (titleBlob.includes(t)) score += t.length >= 4 ? 6 : 3;
        else if (summaryBlob.includes(t)) score += t.length >= 4 ? 4 : 2;
        else if (tagBlob.includes(t)) score += 3;
        else if (extractBlob.includes(t) && !isStubExtract(extractBlob)) score += t.length >= 4 ? 2 : 1;
      }
      const qLower = String(question || '').toLowerCase().slice(0, 40);
      if (qLower.length >= 3 && titleBlob.includes(qLower)) score += 10;
      // Weak generic-only matches should not win.
      if (!specificTokens.length && score > 0) score = Math.min(score, 2);
      return { consultant: c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function formatKnowledgeCoachReply(lang = 'en') {
  if (lang === 'ar') {
    return (
      'النصائح الفنية موجودة في لوحة المعرفة.\n\n' +
      'أقدر أفتحلك لوحة المعرفة، أو أشرحلك إزاي تخلّص النصيحة: افتح النصيحة، استنى التايمر، جاوب الأسئلة، وبعدين اضغط إكمال.\n\n' +
      'تحب أساعدك بإيه؟'
    );
  }
  return (
    'Technical tips live in My Knowledge.\n\n' +
    'I can open My Knowledge for you, or walk you through how to finish a tip: open it, stay for the timer, answer the questions, then tap Complete.\n\n' +
    'What do you need?'
  );
}

export function formatConsultantAnswer(consultant, lang = 'en', { snippetChars = 360 } = {}) {
  if (!consultant) return '';
  const L = lang === 'ar' ? 'ar' : 'en';
  const title = pickTitle(consultant, L);
  const body = pickConsultantBody(consultant, L, { snippetChars });

  if (L === 'ar') {
    if (body) {
      return (
        `لقيت دي في مكتبة المعرفة — ${title}:\n${body}\n\n` +
        'افتح لوحة المعرفة عشان تراجعها وتخلّصها. محتاج مساعدة إزاي تخلّص النصيحة؟ اضغط «إزاي تخلّص النصيحة».'
      );
    }
    return (
      `لقيت «${title}» في لوحة المعرفة — نصيحة بصرية.\n\n` +
      'افتح لوحة المعرفة عشان تشوف الصور وتخلّصها. محتاج مساعدة؟ اضغط «إزاي تخلّص النصيحة».'
    );
  }

  if (body) {
    return (
      `I found this in the My Knowledge library — ${title}:\n${body}\n\n` +
      'Open My Knowledge to review and finish it. Need help finishing a tip? Tap “How to finish a tip”.'
    );
  }
  return (
    `I found “${title}” in My Knowledge — it is a visual tip.\n\n` +
    'Open My Knowledge to review the images and complete it. Need help finishing? Tap “How to finish a tip”.'
  );
}

export function retrieveConsultantForGoGo(catalog, question, lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';

  if (isGenericKnowledgeQuery(question)) {
    return {
      found: true,
      guideOnly: true,
      reply: formatKnowledgeCoachReply(L),
      consultant: null,
      action: null,
      chips: CONSULTANT_GUIDE_CHIPS,
    };
  }

  const hits = searchConsultantsForQuestion(catalog, question, { limit: 3 });
  const topHit = hits[0];
  // Require a real topical match — never invent beyond library text.
  if (!topHit || topHit.score < 4) {
    return {
      found: false,
      reply: GOGO_CONSULTANT_MISS[L],
      consultant: null,
      action: null,
      chips: CONSULTANT_GUIDE_CHIPS,
    };
  }

  const top = topHit.consultant;
  if (!top?.id) {
    return {
      found: false,
      reply: GOGO_CONSULTANT_MISS[L],
      consultant: null,
      action: null,
      chips: CONSULTANT_GUIDE_CHIPS,
    };
  }

  return {
    found: true,
    reply: formatConsultantAnswer(top, L),
    consultant: top,
    action: `goto_consultant:${top.id}`,
    chips: CONSULTANT_GUIDE_CHIPS,
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
    return (
      `استشارة فنية جديدة: ${announcement.title_ar || announcement.title_en}.\n` +
      `${announcement.body_ar || announcement.body_en || ''}\n` +
      'افتحها من لوحة المعرفة لإكمالها. محتاج مساعدة؟ اسألني إزاي تخلّص النصيحة.'
    );
  }
  return (
    `New technical tip: ${announcement.title_en}.\n` +
    `${announcement.body_en || ''}\n` +
    'Open it from My Knowledge to complete it. Need help? Ask me how to finish a tip.'
  );
}
