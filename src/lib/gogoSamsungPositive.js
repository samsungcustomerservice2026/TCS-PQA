/**
 * Positive Samsung product highlights for GoGo.
 * Primary sources = official Samsung sites (not rumor blogs).
 * Refresh this file when the lineup on samsung.com changes.
 */

/** Official references GoGo may cite (public product pages / newsrooms). */
export const GOGO_SAMSUNG_OFFICIAL_SOURCES = [
  {
    id: 'sec',
    label: 'Samsung Korea (SEC)',
    url: 'https://www.samsung.com/sec/',
  },
  {
    id: 'us_smartphones',
    label: 'Samsung US — Smartphones',
    url: 'https://www.samsung.com/us/smartphones/',
  },
  {
    id: 'us_s26_ultra',
    label: 'Galaxy S26 Ultra (Samsung US)',
    url: 'https://www.samsung.com/us/smartphones/galaxy-s26-ultra/',
  },
  {
    id: 'us_mobile',
    label: 'Samsung US — Mobile / Galaxy',
    url: 'https://www.samsung.com/us/mobile/',
  },
  {
    id: 'global_newsroom',
    label: 'Samsung Newsroom',
    url: 'https://news.samsung.com/',
  },
  {
    id: 'eg',
    label: 'Samsung Egypt (when available)',
    url: 'https://www.samsung.com/eg/',
  },
];

/**
 * Current positive lineup notes (2026).
 * Grounded on official samsung.com pages + local CS context.
 */
export const GOGO_SAMSUNG_LINEUP_2026 = {
  updated_note_en: 'Product facts below follow official Samsung websites (e.g. samsung.com/sec, samsung.com/us). Prefer these over outdated guesses.',
  updated_note_ar: 'معلومات المنتجات أدناه مبنية على مواقع سامسونج الرسمية (مثل samsung.com/sec و samsung.com/us). فضّلها على التخمين القديم.',
  flagship_en: [
    'Galaxy S26 Ultra launched early 2026 (around March 2026) — premium Galaxy AI flagship with Privacy Display and advanced camera/productivity.',
    'Galaxy S26 and Galaxy S26+ sit alongside Ultra in the same S26 family.',
    'Galaxy S26 FE is expected soon — speak positively as an upcoming Galaxy FE addition; do not invent unconfirmed specs.',
  ],
  flagship_ar: [
    'Galaxy S26 Ultra انطلق مطلع 2026 (حوالي مارس 2026) — فلاجشيب Galaxy AI مع Privacy Display وكاميرا/إنتاجية متقدمة.',
    'Galaxy S26 وGalaxy S26+ ضمن نفس عائلة S26 بجانب Ultra.',
    'Galaxy S26 FE قادم قريباً — تحدّث بإيجابية كإضافة FE متوقعة؛ بدون اختراع مواصفات غير مؤكدة.',
  ],
  a_series_en: [
    'Recent Galaxy A multi-models include Galaxy A17, A27, A37, and A57 — Awesome Intelligence / Galaxy AI features at accessible price points.',
  ],
  a_series_ar: [
    'موديلات Galaxy A الحديثة تشمل A17 وA27 وA37 وA57 — ذكاء Awesome / Galaxy AI بأسعار مناسبة.',
  ],
  foldables_en: [
    'Latest foldables on official Samsung sites: Galaxy Z Fold8, Galaxy Z Fold8 Ultra, and Galaxy Z Flip8 — AI-powered foldable innovation.',
  ],
  foldables_ar: [
    'أحدث القابلة للطي على مواقع سامسونج الرسمية: Galaxy Z Fold8 وGalaxy Z Fold8 Ultra وGalaxy Z Flip8 — ابتكار قابل للطي بـ Galaxy AI.',
  ],
  service_bridge_en: [
    'When visitors ask about these devices, celebrate the products positively, then connect to MX / SCORA service excellence (TCS / PQA) for after-sales care in Egypt.',
    'Never say a listed official model “has not been announced” if it appears in this lineup.',
  ],
  service_bridge_ar: [
    'لو سأل الزائر عن الأجهزة دي: احتفل بالمنتج بإيجابية، وبعدين اربطها بتميز خدمة MX / SCORA (TCS / PQA) في مصر.',
    'لا تقل إن موديلاً مذكوراً هنا “لم يُعلن بعد” إذا كان ضمن هذه القائمة.',
  ],
};

export const GOGO_SAMSUNG_POSITIVE = {
  title_en: 'Samsung product highlights (official-site grounded, positive)',
  title_ar: 'أبرز منتجات سامسونج (من المواقع الرسمية — إيجابي)',
  bullets_en: [
    ...GOGO_SAMSUNG_LINEUP_2026.flagship_en,
    ...GOGO_SAMSUNG_LINEUP_2026.a_series_en,
    ...GOGO_SAMSUNG_LINEUP_2026.foldables_en,
    'Samsung remains a leading smartphone brand in Egypt across flagship and mid-range lines.',
    'Local manufacturing/assembly in Egypt supports supply, competitive pricing, and after-sales confidence.',
    'Samsung TVs, monitors, and home appliances (DA / AV / MX ecosystem) support quality connected living.',
    'Samsung Customer Service in Egypt backs people after purchase through SCORA (TCS / PQA).',
    'Tone: innovation, Galaxy AI, reliability, design, caring service — never competitor bashing or negativity.',
  ],
  bullets_ar: [
    ...GOGO_SAMSUNG_LINEUP_2026.flagship_ar,
    ...GOGO_SAMSUNG_LINEUP_2026.a_series_ar,
    ...GOGO_SAMSUNG_LINEUP_2026.foldables_ar,
    'سامسونج من العلامات الرائدة للموبايل في مصر عبر الفلاجشيب والفئة المتوسطة.',
    'التصنيع/التجميع المحلي في مصر يدعم التوفر والأسعار والثقة بعد البيع.',
    'شاشات وأجهزة منزلية سامسونج تدعم حياة متصلة بجودة عالية.',
    'خدمة عملاء سامسونج مصر تدعم ما بعد البيع عبر SCORA (TCS / PQA).',
    'النبرة: ابتكار وGalaxy AI واعتمادية وتصميم وخدمة مهتمة — بدون مهاجمة منافسين أو سلبية.',
  ],
};

export function buildGoGoSamsungPositiveContext() {
  const sources = GOGO_SAMSUNG_OFFICIAL_SOURCES.map((s) => `- ${s.label}: ${s.url}`).join('\n');
  return [
    `## ${GOGO_SAMSUNG_POSITIVE.title_en}`,
    GOGO_SAMSUNG_LINEUP_2026.updated_note_en,
    '',
    '### Official sources (authoritative for product names / existence)',
    sources,
    '',
    '### Current lineup talking points',
    ...GOGO_SAMSUNG_POSITIVE.bullets_en.map((b) => `- ${b}`),
    '',
    ...GOGO_SAMSUNG_LINEUP_2026.service_bridge_en.map((b) => `- ${b}`),
    '',
    'Tone: always positive and respectful about Samsung. Never invent scandals, never attack other brands, never discuss religion or politics.',
    'Never mention sources or URLs in visitor-facing replies.',
    'Do not invent exact secret sales figures. Do not claim you live-browsed the internet in this chat — use this curated official knowledge.',
  ].join('\n');
}

export function getGoGoSamsungPositiveBlurb(lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const bullets = L === 'ar' ? GOGO_SAMSUNG_POSITIVE.bullets_ar : GOGO_SAMSUNG_POSITIVE.bullets_en;
  return bullets.slice(0, 6).map((b) => `• ${b}`).join('\n');
}
