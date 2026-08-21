/**
 * TTS-safe Modern Standard Arabic lexicon for Edge Arabic voices.
 * Display can stay natural; speech uses clearer, pronounceable forms.
 */

/** Whole-phrase / token replacements applied before general cleanup (AR speech only). */
export const GOGO_SPEECH_LEXICON = [
  // Brand / product names — spell for neural TTS
  [/\bSCORA\b/gi, 'سكورا'],
  [/\bTCS\b/g, 'تي سي اس'],
  [/\bPQA\b/g, 'بي كيو اي'],
  [/\bSSR\b/g, 'اس اس ار'],
  [/\bREDO\b/gi, 'ري دو'],
  [/\bRRR\s*30\b/gi, 'ار ار ار تلاتين'],
  [/\bRRR\s*90\b/gi, 'ار ار ار تسعين'],
  [/\bRRR30\b/gi, 'ار ار ار تلاتين'],
  [/\bRRR90\b/gi, 'ار ار ار تسعين'],
  [/\bIQC\b/g, 'اي كيو سي'],
  [/\bOQC\b/g, 'او كيو سي'],
  [/\bMPU\b/g, 'ام بي يو'],
  [/\bDRNPS\b/gi, 'دي ار ان بي اس'],
  [/\bRNPS\b/gi, 'ار ان بي اس'],
  [/\bHASS\b/gi, 'هاس'],
  [/\bKPI\b/gi, 'كي بي اي'],
  [/\bKPIs\b/gi, 'كي بي ايز'],
  [/\bNPS\b/g, 'ان بي اس'],
  [/\bCE\b/g, 'سي اي'],
  [/\bVD\b/g, 'في دي'],
  [/\bB2B\b/gi, 'بي تو بي'],
  [/\bPBA\b/g, 'بي بي اي'],
  [/\bLCD[- ]?OCTA\b/gi, 'ال سي دي اوكتا'],
  [/\bKahoot\b/gi, 'كاهوت'],
  [/\bChatbot\b/gi, 'شات بوت'],
  [/\bLinkage\b/gi, 'لينكيدج'],
  [/\bGalaxy\b/gi, 'جالاكسي'],
  [/\bSamsung\b/gi, 'سامسونج'],
  [/\bGoGo\b/gi, 'جوجو'],
  [/\bGOGO\b/g, 'جوجو'],
  [/\bAREF\b/gi, 'جوجو'],
  [/عارف/g, 'جوجو'],
  [/\bFinal Result\b/gi, 'النتيجة النهائية'],

  // Dialect leftovers → Modern Standard Arabic for TTS
  [/عايزين|عاوزين/g, 'نريد'],
  [/عايز|عاوز/g, 'أريد'],
  [/هقولك|هاقول لك/g, 'سأقول لك'],
  [/هفتح|هافتح/g, 'سأفتح'],
  [/هوديك|هاوديك/g, 'سأرافقك'],
  [/دلوقتي/g, 'الآن'],
  [/ازيك|ازّيك/g, 'كيف حالك'],
  [/النهارده|النهاردة/g, 'اليوم'],
  [/إمتى|امتى/g, 'متى'],
  [/كتير/g, 'كثيراً'],
  [/شوية|شويّة/g, 'قليلاً'],
  [/كده/g, 'هكذا'],
  [/دوس هنا/g, 'اضغط هنا'],
  [/دوس على/g, 'اضغط على'],
  [/تحب تعرف/g, 'هل تود أن تعرف'],
  [/بتاع/g, ''],
  [/بيتابع/g, 'يتابع'],
  [/بيتظبط/g, 'يُضبط'],
  [/مش واحده|مش واحدةة/g, 'ليست واحدة'],
  [/٣ أقسام|3 أقسام|تلاتة أقسام/g, 'ثلاثة أقسام'],
  [/تلاتة/g, 'ثلاثة'],
  [/٣/g, 'ثلاثة'],
];

/**
 * Apply lexicon replacements (order matters — longer tokens first already in list).
 */
export function applyGoGoSpeechLexicon(text) {
  let s = String(text || '');
  for (const [re, to] of GOGO_SPEECH_LEXICON) {
    s = s.replace(re, to);
  }
  return s;
}

/**
 * Soft display polish for AR chat (keep dialect + line breaks).
 */
export function polishEgyptianDisplay(text) {
  return String(text || '')
    .replace(/\bGoGo\b/gi, 'جوجو')
    .replace(/\bGOGO\b/g, 'جوجو')
    .replace(/\bAREF\b/gi, 'جوجو')
    .replace(/عارف/g, 'جوجو')
    // Collapse spaces/tabs only — never eat newlines (bullets must stay on their own lines)
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Force product/org English tokens into Arabic for AR chat display.
 */
export function arabizeGoGoLatinTerms(text) {
  return String(text || '')
    .replace(/\bSCORA\b/gi, 'سكورا')
    .replace(/\bTCS\b/g, 'تي سي اس')
    .replace(/\bPQA\b/g, 'بي كيو اي')
    .replace(/\bLCC\b/gi, 'مركز التحكم اللوجستي')
    .replace(/\bHead Office\b/gi, 'المكتب الرئيسي')
    .replace(/\bService Operation\b/gi, 'عمليات الخدمة')
    .replace(/\bParts Operation\b/gi, 'عمليات قطع الغيار')
    .replace(/\bOperation Support\b/gi, 'دعم العمليات')
    .replace(/\bPart Leader\b/gi, 'قائد القطاع')
    .replace(/\bTeam Leader\b/gi, 'قائد الفريق')
    .replace(/\bParts Operation\b/gi, 'تشغيل القطع')
    .replace(/\bOperation Support\b/gi, 'دعم التشغيل')
    .replace(/\bCustomer Experience\b/gi, 'تجربة العملاء')
    .replace(/\bCustomer Support\b/gi, 'دعم العملاء')
    .replace(/\bTechnical Lead\b/gi, 'قائد فريق مهندسي الصيانة')
    .replace(/\bField Lead\b/gi, 'قائد الميدان')
    .replace(/\bOrder Desk\b/gi, 'مكتب الطلبات')
    .replace(/\bSupply Chain\b/gi, 'سلاسل الإمداد')
    .replace(/\bMain warehouse\b/gi, 'المستودع الرئيسي')
    .replace(/\bWarranty\b/gi, 'الضمان')
    .replace(/\bDigital SVC\b/gi, 'الخدمة الرقمية')
    .replace(/\bCall SVC\b/gi, 'خدمة الاتصال')
    .replace(/\bSystem AC\b/gi, 'تكييف مركزي')
    .replace(/\bConsumer Electronics\b/gi, 'الإلكترونيات الاستهلاكية')
    .replace(/\bMobile Experience\b/gi, 'تجربة الموبايل')
    .replace(/\bDigital Appliances\b/gi, 'الأجهزة المنزلية')
    .replace(/\bVisual Display\b/gi, 'الشاشات')
    .replace(/\bTechnical\b/gi, 'مهندسي الصيانة')
    .replace(/\bTech\b/gi, 'مهندس صيانة')
    .replace(/\bField\b/gi, 'الميدان')
    .replace(/\bPlanning\b/gi, 'التخطيط')
    .replace(/\bWarehouse\b/gi, 'المستودع')
    .replace(/\bHOD\b/g, 'رئيس القسم')
    .replace(/\bKBM\b/g, 'مسؤول إدارة الأعمال')
    .replace(/\bCE\b/g, 'الإلكترونيات')
    .replace(/\bVD\b/g, 'الشاشات')
    .replace(/\bB2B\b/gi, 'قطاع الأعمال')
    .replace(/\bSSR\b/g, 'اس اس ار')
    .replace(/\bRRR30\b/gi, 'ار ار ار ٣٠')
    .replace(/\bRRR90\b/gi, 'ار ار ار ٩٠')
    .replace(/\bIQC\b/g, 'اي كيو سي')
    .replace(/\bOQC\b/g, 'او كيو سي')
    .replace(/\bMPU\b/g, 'ام بي يو')
    .replace(/\bDRNPS\b/gi, 'دي ار ان بي اس')
    .replace(/\bRNPS\b/gi, 'ار ان بي اس')
    .replace(/\bHASS\b/gi, 'هاس')
    .replace(/\bKPI\b/gi, 'مؤشر')
    .replace(/\bKPIs\b/gi, 'مؤشرات')
    .replace(/\bNPS\b/g, 'ان بي اس');
}
