/**
 * GoGo Arabic: Egyptian colloquial + natural division names.
 * MX / DA / AV must never be spoken or written as Latin letters in Arabic.
 */

export const GOGO_AR_VOICE_RULES = [
  'DEFAULT Arabic = Egyptian colloquial (عامية مصرية). Never answer Arabic in formal MSA.',
  'Your Arabic name is جوجو only — never write GoGo / كوكو in Arabic text.',
  'When introducing yourself in Arabic say: أنا اسمي جوجو، مساعدك الذكي.',
  'Prefer clear spoken Egyptian the TTS can read: أهلاً، ازّيك، تمام، تحب، عاوز، هاقول لك، دلوقتي، كده، يعني، شوف، اختار، حاضر.',
  'TTS-SAFE wording (mandatory for Arabic replies): avoid heavy slang elisions the voice misreads.',
  '  Prefer: عاوز / هافتح / هاقول لك / اضغط هنا — instead of عايز / هفتح / هقولك / دوس هنا when possible.',
  '  Prefer short clear sentences (max ~20 words). Spell brand codes in Arabic letters when helpful (تي سي اس، بي كيو اي، سكورا).',
  'Stay polite and professional for a workplace assistant.',
  'Keep SCORA / TCS / PQA as product names (prefer تي سي اس / بي كيو اي / سكورا in Arabic).',
  'CRITICAL — TCS divisions in Arabic (never Latin MX/DA/AV, never spell M-X / D-A / A-V):',
  '  • MX = الموبايل',
  '  • DA = الأجهزة المنزلية',
  '  • AV = الشاشات',
  'When explaining TCS in Arabic, name the three lines clearly in one natural sentence, e.g.:',
  '  "تي سي اس بيتابع أداء المهندسين على تلاتة أقسام: الموبايل، والأجهزة المنزلية، والشاشات."',
  'Do NOT write "MX — موبايل" or "DA أجهزة منزلية" side by side — pick the Arabic name only.',
  'Avoid Gulf/Levantine dialect and stiff classical phrasing (ما هو / يتم / يجب).',
  'Prefer: إيه هو / بيتظبط إزاي / هافتح لك / اضغط هنا.',
].join('\n');

/**
 * Expand division codes to natural Arabic product-line names.
 * Order matters: compound codes before bare MX/DA/AV.
 */
export function expandArabicDivisionNames(text) {
  return String(text || '')
    .replace(/\bTCS[_ -]?MX\b/gi, 'تي سي اس الموبايل')
    .replace(/\bTCS[_ -]?DA\b/gi, 'تي سي اس الأجهزة المنزلية')
    .replace(/\bTCS[_ -]?AV\b/gi, 'تي سي اس الشاشات')
    .replace(/\bPQA[_ -]?MX\b/gi, 'بي كيو اي الموبايل')
    .replace(/\bPQA[_ -]?DA\b/gi, 'بي كيو اي الأجهزة المنزلية')
    .replace(/\bPQA[_ -]?AV\b/gi, 'بي كيو اي الشاشات')
    // Strip awkward "CODE — Arabic" / "CODE (Arabic)" leftovers from mixed replies
    .replace(/\bMX\s*[—\-–:]\s*موبايل(?:ات)?/gi, 'الموبايل')
    .replace(/\bDA\s*[—\-–:]\s*أجهزة\s*منزلية/gi, 'الأجهزة المنزلية')
    .replace(/\bAV\s*[—\-–:]\s*(?:صوت\s*وصورة|الشاشات|شاشات)/gi, 'الشاشات')
    .replace(/\bMX\s+موبايل(?:ات)?/gi, 'الموبايل')
    .replace(/\bDA\s+أجهزة\s*منزلية/gi, 'الأجهزة المنزلية')
    .replace(/\bAV\s+(?:صوت\s*وصورة|الشاشات|شاشات)/gi, 'الشاشات')
    .replace(/\bMX\s*\(\s*موبايل(?:ات)?\s*\)/gi, 'الموبايل')
    .replace(/\bDA\s*\(\s*أجهزة\s*منزلية\s*\)/gi, 'الأجهزة المنزلية')
    .replace(/\bAV\s*\(\s*(?:صوت\s*وصورة|شاشات|الشاشات)\s*\)/gi, 'الشاشات')
    .replace(/\bDA\s*[/\\]\s*AV\b/gi, 'الأجهزة المنزلية والشاشات')
    .replace(/\bAV\s*[/\\]\s*DA\b/gi, 'الشاشات والأجهزة المنزلية')
    .replace(/\bMX\s*[/\\]\s*DA\s*[/\\]\s*AV\b/gi, 'الموبايل والأجهزة المنزلية والشاشات')
    .replace(/\bMX\b/g, 'الموبايل')
    .replace(/\bDA\b/g, 'الأجهزة المنزلية')
    .replace(/\bAV\b/g, 'الشاشات')
    .replace(/صوت\s*وصورة/g, 'الشاشات')
    .replace(/(الأجهزة المنزلية)(?:\s+\1)+/g, '$1')
    .replace(/(الشاشات)(?:\s+\1)+/g, '$1')
    .replace(/(الموبايل)(?:\s+\1)+/g, '$1');
}

/** Force spoken/written Arabic name spelling (Latin GoGo → جوجو) + division names. */
export function normalizeGoGoArabicName(text) {
  return expandArabicDivisionNames(
    String(text || '')
      .replace(/\bGoGo\b/gi, 'جوجو')
      .replace(/\bGogo\b/g, 'جوجو')
      .replace(/\bGOGO\b/g, 'جوجو'),
  );
}

/**
 * Light MSA → Egyptian colloquial rewrites for TTS (spoken path only).
 */
export function toEgyptianSpeechText(text) {
  let s = normalizeGoGoArabicName(text);
  const swaps = [
    [/ما هو\s+/g, 'إيه هو '],
    [/ما هي\s+/g, 'إيه هي '],
    [/ماذا\s+/g, 'إيه '],
    [/كيف يمكنني\s+/g, 'أقدر إزاي '],
    [/كيف يمكن\s+/g, 'ممكن إزاي '],
    [/هل تريد\s+/g, 'تحب '],
    [/هل تود\s+/g, 'تحب '],
    [/هل تريدون\s+/g, 'تحبوا '],
    [/أريد\s+/g, 'عاوز '],
    [/نريد\s+/g, 'عاوزين '],
    [/عايزين/g, 'عاوزين'],
    [/عايز/g, 'عاوز'],
    [/هقولك/g, 'هاقول لك'],
    [/هفتح/g, 'هافتح'],
    [/دوس هنا/g, 'اضغط هنا'],
    [/دوس على/g, 'اضغط على'],
    [/الآن/g, 'دلوقتي'],
    [/حالياً|حاليا/g, 'دلوقتي'],
    [/حسناً|حسنا/g, 'تمام'],
    [/جيداً|جيدا/g, 'كويس'],
    [/من فضلك/g, 'لو سمحت'],
    [/فضلاً|فضلا/g, 'لو سمحت'],
    [/يمكنك\s+/g, 'تقدر '],
    [/تستطيع\s+/g, 'تقدر '],
    [/يجب\s+(?:أن\s+)?/g, 'لازم '],
    [/ينبغي\s+(?:أن\s+)?/g, 'المفروض '],
    [/يتم\s+/g, 'بيتعمل '],
    [/الرجاء\s+/g, 'لو سمحت '],
    [/مرحباً بك|مرحبا بك|أهلا بك/g, 'أهلاً بيك'],
    [/مرحباً|مرحبا/g, 'أهلاً'],
    [/كيف حالك\؟?/g, 'ازيك؟'],
    [/كيف الأحوال\؟?/g, 'إيه الأخبار؟'],
    [/شكراً جزيلاً|شكرا جزيلا/g, 'شكراً أوي'],
    [/على الرحب والسعة/g, 'العفو'],
    [/عفواً|عفوا/g, 'العفو'],
    [/انقر هنا/g, 'اضغط هنا'],
    [/اختر\s+/g, 'اختار '],
    [/يرجى\s+/g, 'لو سمحت '],
    [/بالتأكيد/g, 'طبعاً'],
    [/بالطبع/g, 'طبعاً'],
    [/أيضاً|أيضا/g, 'كمان'],
    [/فقط/g, 'بس'],
    [/كثير(?:اً|ا)?/g, 'كتير'],
    [/قليل(?:اً|ا)?/g, 'شوية'],
    [/اليوم/g, 'النهارده'],
    [/غداً|غدا/g, 'بكرة'],
    [/لماذا/g, 'ليه'],
    [/أين/g, 'فين'],
    [/متى/g, 'إمتى'],
  ];
  for (const [re, to] of swaps) {
    s = s.replace(re, to);
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}
