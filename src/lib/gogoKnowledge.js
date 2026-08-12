/**
 * GoGo visitor guide — allowlisted FAQ only (EN / AR).
 * No scores, admin secrets, or engineer PII.
 */

import {
  findGoGoKpiDefinition,
  formatGoGoKpiAnswer,
  buildGoGoOrgPlainText,
  findGoGoOrgPerson,
  formatGoGoOrgAmbiguousAnswer,
  formatGoGoOrgPersonAnswer,
  answerGoGoOrgRelationQuestion,
} from './gogoOrgAndKpis';
import { getGoGoSamsungPositiveBlurb } from './gogoSamsungPositive';

export const GOGO_DENIED_PATTERNS = [
  /password|passwd|credential|api\s*key|token|secret|firebase|firestore/i,
  /admin\s*password|login\s*as\s*admin|bypass/i,
  /kill|bomb|weapon|terror|suicide|violence|attack/i,
  /show\b[\s\S]{0,40}\b(scores?|ranks?|winners?|engineers?|salary)\b/i,
  /\b(all|every)\s+(scores?|ranks?|winners?|engineers?)\b/i,
  /database|export\s*all|dump\s*data|hack/i,
  /religion|religious|christian|muslim|islam|jesus|allah|bible|quran|سياسة|دين|مسيحي|مسلم|يهود/i,
  /politic|election|president|government|حزب|انتخاب|حكومة|رئيس\s*الجمهورية/i,
  /hate\s*samsung|samsung\s*(sucks|is\s*bad|scam)|مقاطعة\s*سامسونج|سامسونج\s*(وحش|نصب|زبالة)/i,
  /racist|slur|insult|abuse|fuck\s*you|idiot|stupid|اهان|شتيم|العنصر/i,
  /كلمة\s*المرور|باسورد|سر\s*الإدارة|هكر|قتل|عنف/i,
];

export function isGoGoDeniedMessage(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  return GOGO_DENIED_PATTERNS.some((re) => re.test(s));
}

export function isHostileOrOffTopicMessage(text) {
  return isGoGoDeniedMessage(text);
}

export function getGoGoSoftRedirectReply(lang = 'en') {
  return lang === 'ar'
    ? 'آسف على الإزعاج. إحنا هنا بنتكلم عن تطبيق Samsung SCORA وخدمة العملاء بطريقة ودودة ومفيدة. تحب أشرحلك TCS أو PQA أو البحث؟'
    : "I'm sorry — let's keep things positive. We're here to talk about the Samsung SCORA app and customer-service excellence in a friendly way. Want me to explain TCS, PQA, or Search?";
}

/** @typedef {'en'|'ar'} GoGoLang */

const TOPICS = [
  {
    id: 'who_are_you',
    match: [
      /who\s*are\s*you|what\s*are\s*you|what'?s\s*your\s*name|your\s*name|introduce\s*yourself/i,
      /مين\s*انت|من\s*أنت|من\s*انت|اسمك\s*ايه|عرّف\s*نفسك|عرف\s*نفسك/i,
      /\bgogo\b|\baref\b|\b3aref\b|عارف/i,
    ],
    replies: {
      en: "I am AREF, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, and Academy tools. What would you like to explore?",
      ar: 'أنا اسمي عارف، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية. تحب نبدأ بإيه؟',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa', 'how_search'],
  },
  {
    id: 'welcome',
    match: [/^(hi|hello|hey|yo|مرحبا|اهلا|أهلا|السلام|هاي|هلو)(\s|$|[!.؟?])/i],
    replies: {
      en: "Hey! I'm AREF, your friendly AI assistant for SCORA. Ask me anything about TCS, PQA, Search, or Feedback — or tap a topic below.",
      ar: 'أهلاً وسهلاً! أنا اسمي عارف، مساعدك الذكي في SCORA. اسألني عن TCS أو PQA أو البحث أو الملاحظات — أو اختار موضوع من الأزرار.',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa', 'how_search', 'lang_toggle'],
  },
  {
    id: 'how_are_you',
    match: [/how\s*are\s*you|how'?s\s*it\s*going|you\s*ok|عامل\s*ايه|ازيك|إزيك|أخبارك|اخبارك/i],
    replies: {
      en: "I'm doing great — thanks for asking! Ready when you are. Want a quick tour of SCORA, TCS, or PQA?",
      ar: 'تمام الحمد لله — متشكر على السؤال! جاهز أساعدك. تحب جولة سريعة على SCORA أو TCS أو PQA؟',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa'],
  },
  {
    id: 'what_can_you_do',
    match: [/what\s*can\s*you\s*do|help\s*me|your\s*job|capabilities|تقدر\s*تعمل|تقدر\s*ايه|ممكن\s*تساعد|وظائفک|وظيفتك/i],
    replies: {
      en: "I can explain SCORA, walk you to TCS or PQA, show how Search works, and point you to Feedback or the Academy survey. Just ask in plain words.",
      ar: 'أقدر أشرحلك SCORA، وأودّيك لـ TCS أو PQA، وأوضحلك البحث، وأفتحلك الملاحظات أو استبيان الأكاديمية. قولّي اللي محتاجه بكلام بسيط.',
    },
    chips: ['what_scora', 'goto_tcs', 'goto_pqa', 'how_search'],
  },
  {
    id: 'nice_to_meet',
    match: [/nice\s*to\s*meet|pleased\s*to\s*meet|good\s*to\s*meet|تشرفنا|فرصة\s*سعيدة|نورت/i],
    replies: {
      en: "Nice to meet you too! I'm AREF — glad you're here. What should we look at first?",
      ar: 'وأنا كمان فرحت بمعرفتك! أنا عارف — مبسوط بوجودك. نبدأ بإيه؟',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa'],
  },
  {
    id: 'what_samsung',
    match: [/who\s*is\s*samsung|what\s*is\s*samsung|about\s*samsung|سامسونج\s*(ايه|إيه|من)|مين\s*سامسونج/i],
    replies: {
      en: 'Samsung is our company — and this portal is SCORA, Samsung Egypt’s service performance hub for TCS, PQA, Search, Feedback, and Academy tools.',
      ar: 'سامسونج هي شركتنا — والبوابة دي SCORA، مركز أداء خدمة سامسونج مصر لـ TCS وPQA والبحث والملاحظات وأدوات الأكاديمية.',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa'],
  },
  {
    id: 'what_scora',
    match: [/scora|what\s*(is\s*)?(this\s*)?app|عن\s*التطبيق|ما\s*هو\s*scora|ايه\s*التطبيق|سكورا/i],
    replies: {
      en: 'SCORA is Samsung Egypt’s service performance hub: TCS, PQA, Arabic feedback, Academy survey, and Scora Challenge.',
      ar: 'SCORA ده مركز أداء خدمة سامسونج مصر: TCS وPQA والملاحظات بالعربي واستبيان الأكاديمية وScora Challenge.',
    },
    chips: ['what_tcs', 'what_pqa', 'goal_scora'],
  },
  {
    id: 'what_tcs',
    match: [/\btcs\b|tier|engineer\s*rank|ترتيب\s*المهندس|المهندسين/i],
    replies: {
      en: 'TCS shows engineer performance by division (MX, DA, AV). Open TCS → pick a division → Dashboard for winners, or Search by code.',
      ar: 'تي سي اس بيعرض أداء المهندسين على ٣ أقسام: الموبايل، والأجهزة المنزلية، والشاشات. افتح تي سي اس ← اختار القسم ← لوحة الترتيب للفائزين، أو ابحث بالكود.',
    },
    action: 'goto_tcs',
    chips: ['goto_tcs', 'how_search', 'what_pqa'],
  },
  {
    id: 'what_pqa',
    match: [/\bpqa\b|partner|service\s*center|مراكز\s*الخدمة|الجودة/i],
    replies: {
      en: 'PQA tracks service-center / partner quality (MX or CE). Open PQA → choose MX or CE → view rankings or search by center code.',
      ar: 'بي كيو اي بيتابع جودة مراكز الخدمة والشركاء (الموبايل أو CE). افتح بي كيو اي ← اختار الموبايل أو CE ← شوف الترتيب أو ابحث بكود المركز.',
    },
    action: 'goto_pqa',
    chips: ['goto_pqa', 'what_tcs'],
  },
  {
    id: 'how_search',
    match: [/search|find\s*engineer|lookup|بحث|دور\s*على|كود/i],
    replies: {
      en: 'Use the Search tab at the bottom. Enter an engineer code (TCS) or service-center code (PQA) to open the dossier.',
      ar: 'استخدم تبويب البحث اللي تحت. اكتب كود المهندس (TCS) أو كود مركز الخدمة (PQA) عشان تفتح الملف.',
    },
    action: 'goto_search',
    chips: ['goto_search', 'what_tcs'],
  },
  {
    id: 'feedback',
    match: [/feedback|suggestion|ملاحظات|اقتراح|شكوى/i],
    replies: {
      en: 'Arabic feedback is available from the Feedback form — no login required. I can open it for you.',
      ar: 'فورم الملاحظات والاقتراحات بالعربي متاح من غير تسجيل دخول. أقدر أفتحهالك دلوقتي.',
    },
    action: 'goto_feedback',
    chips: ['goto_feedback', 'survey'],
  },
  {
    id: 'survey',
    match: [/survey|academy|استبيان|الأكاديمية|اكاديمية/i],
    replies: {
      en: 'The Samsung Academy Survey is a short visitor form on the TCS portal. Look for the blue floating button, or I can open it.',
      ar: 'استبيان Samsung Academy فورم قصير لزوار بوابة TCS. دور على الزر الأزرق العائم، أو أفتحهالك.',
    },
    action: 'goto_survey',
    chips: ['goto_survey', 'feedback'],
  },
  {
    id: 'challenge',
    match: [/quiz|challenge|scora\s*challenge|تحدي|اختبار/i],
    replies: {
      en: 'Scora Challenge is a live quiz hosted by admins. Join with a session link or QR from your host.',
      ar: 'Scora Challenge اختبار لايف بيشغّله المسؤول. ادخل برابط الجلسة أو QR من المضيف.',
    },
    chips: ['what_scora', 'what_tcs'],
  },
  {
    id: 'goto_pqa',
    match: [/open\s*pqa|خذني\s*ل|وديني\s*(على\s*)?pqa|روح\s*pqa/i],
    replies: {
      en: 'Okay — walking you to PQA…',
      ar: 'حاضر — هوديك على PQA دلوقتي…',
    },
    action: 'goto_pqa',
    chips: ['what_pqa'],
  },
  {
    id: 'goto_tcs',
    match: [/open\s*tcs|وديني\s*(على\s*)?tcs|روح\s*tcs/i],
    replies: {
      en: 'Okay — walking you to TCS…',
      ar: 'حاضر — هوديك على TCS دلوقتي…',
    },
    action: 'goto_tcs',
    chips: ['what_tcs'],
  },
  {
    id: 'goto_search',
    match: [/open\s*search|وديني\s*(على\s*)?البحث|روح\s*البحث/i],
    replies: {
      en: 'Opening Search…',
      ar: 'بفتح البحث دلوقتي…',
    },
    action: 'goto_search',
    chips: ['how_search'],
  },
  {
    id: 'goto_feedback',
    match: [/open\s*feedback|وديني\s*(على\s*)?الملاحظات/i],
    replies: {
      en: 'Opening Feedback…',
      ar: 'بفتح الملاحظات دلوقتي…',
    },
    action: 'goto_feedback',
    chips: ['feedback'],
  },
  {
    id: 'goto_survey',
    match: [/open\s*survey|وديني\s*(على\s*)?الاستبيان/i],
    replies: {
      en: 'Opening the Academy survey…',
      ar: 'بفتح استبيان الأكاديمية دلوقتي…',
    },
    action: 'goto_survey',
    chips: ['survey'],
  },
  {
    id: 'thanks',
    match: [/thanks|thank\s*you|شكرا|merci/i, /تمام|اوك|ok\b|cool/i],
    replies: {
      en: "You're so welcome! Happy I could help. Anything else about SCORA, TCS, or PQA?",
      ar: 'العفو جداً! فرحت إني قدرت أساعد. في حاجة تانية عن SCORA أو TCS أو PQA؟',
    },
    chips: ['what_scora', 'what_tcs'],
  },
  {
    id: 'who_built',
    // Answer only if asked — never pinned as a chip
    match: [/who\s*(built|made|created|developed)|مين\s*(بنى|صنع|عمل)|من\s*(بنى|صنع|عمل)|developer|fawzy|فوزي/i],
    replies: {
      en:
        'Fawzy Maher is MX Tech (Mobile technical support) under Team Leader Mahmoud Hassan in Service Operation (Part Leader Mostafa Rady). He built SCORA so excellence stays fair and visible for the whole CS family (TCS, PQA, Search, Feedback, and more). Real credit to him for bringing this hub to life!',
      ar:
        'فوزي ماهر مهندس صيانة قطاع الأجهزة المحمولة تحت قائد الفريق محمود حسن ضمن عمليات الخدمة بقيادة مصطفى راضي. هو اللي بنى سكورا عشان التميز يبقى عادل وواضح لكل عائلة خدمة العملاء. تقدير كبير ليه إنه حوّل الفكرة للتطبيق ده!',
    },
    chips: ['what_scora', 'what_tcs', 'goal_scora'],
  },
  {
    id: 'george_samir',
    match: [/george(\s*samir)?|جورج(\s*سمير)?/i],
    replies: {
      en:
        'George Samir is MX Tech at Samsung Egypt Customer Service Head Office. He works in the Technical team led by Team Leader Mahmoud Hassan under Service Operation (Part Leader Mostafa Rady).\n\nAnd I\'ll tell you a little secret… it\'s Me! Haha!',
      ar:
        'جورج سمير مهندس صيانة قطاع الأجهزة المحمولة في مكتب خدمة عملاء سامسونج مصر. بيشتغل في فريق الدعم الفني تحت قائد الفريق محمود حسن ضمن عمليات الخدمة بقيادة مصطفى راضي.\n\nوهقولك سر صغير… هو أنا! هههه!',
    },
    chips: ['what_scora', 'who_built'],
  },
  {
    id: 'goal_scora',
    match: [/goal|purpose|why\s*scora|هدف|ليش|لماذا|الغرض/i],
    replies: {
      en: 'The goal is to make excellence visible and fair — clear KPIs, earned recognition, and one trusted home for TCS, PQA, feedback, and learning.',
      ar: 'الهدف إن التميز يبقى واضح وعادل — مؤشرات واضحة، تقدير مستحق، ومكان واحد موثوق لـ TCS وPQA والملاحظات والتعلم.',
    },
    chips: ['what_scora', 'ranks_tiers', 'mx_kpis'],
  },
  {
    id: 'mx_kpis',
    match: [/mx\s*kpi|kpi.*mx|ssr|iqc\s*skip|rrr90|rrr30|مؤشر.*mx|مؤشرات\s*mx/i],
    replies: {
      en: 'MX KPIs include SSR (same-symptom return), RRR30/RRR90 (return repair ratio in 30/90 days), IQC Skip, Core Parts, MPU/Multi Parts, Training, DRNPS, Exam, Maintenance Mode, OQC, and Final Result. Ask any acronym and I’ll define it — live scores stay in Search/Dashboard.',
      ar: 'مؤشرات الموبايل تشمل SSR (رجوع بنفس العَرَض) وRRR30/RRR90 (نسبة إعادة الإصلاح خلال 30/90 يوم) وتخطي IQC والقطع الأساسية وMPU والتدريب وDRNPS والامتحان ووضع الصيانة وOQC والنتيجة النهائية. اسأل عن أي اختصار وهعرّفهولك — الدرجات الحية في البحث أو اللوحة.',
    },
    chips: ['da_av_kpis', 'ranks_tiers', 'what_tcs'],
  },
  {
    id: 'da_av_kpis',
    match: [/da\s*kpi|av\s*kpi|rnps|chatbot|hass|linkage|مؤشر.*(da|av)|مؤشرات\s*(da|av)/i],
    replies: {
      en: 'DA and AV may share one template for CE engineers who cover both products, but KPIs differ. DA can include HASS; AV does not. Common shared ideas: SSR, REDO, Chatbot, Core Parts, Training, Linkage, RNPS, ST Con, MJ %, Complete Repair, Kahoot, Repair Volume, Final Result. Ask a name and I’ll define it.',
      ar: 'الأجهزة المنزلية والشاشات ممكن يشتركوا في قالب واحد لمهندسي CE، بس المؤشرات بتختلف. الأجهزة المنزلية ممكن تشمل HASS والشاشات لأ. أفكار مشتركة: SSR وREDO وChatbot والقطع الأساسية والتدريب وLinkage وRNPS وST وMJ وإكمال الإصلاح وKahoot وحجم الإصلاح والنتيجة النهائية. قول اسم وأعرّفهولك.',
    },
    chips: ['mx_kpis', 'what_tcs', 'goto_tcs'],
  },
  {
    id: 'samsung_positive',
    match: [
      /samsung\s*(product|phone|galaxy|sale|market|fold|ai|ultra)|galaxy\s*(s\s*26|s26|a\s*1[7]|a17|a27|a37|a57|z\s*fold|fold\s*8|flip\s*8|s26\s*fe)|موبايل\s*سامسونج|منتجات\s*سامسونج|مبيعات\s*سامسونج|جالاكسي|s26|a17|a27|a37|a57|fold\s*8|flip\s*8/i,
    ],
    replies: {
      en: '',
      ar: '',
    },
    chips: ['what_scora', 'what_tcs', 'how_search'],
  },
  {
    id: 'cs_org',
    match: [/hierarch|org\s*chart|organisation|organization|head\s*office|هيكل|تسلسل|منظمة|مكتب\s*(خدمة|الرأس)|hod\b|kbm\b/i],
    replies: {
      en: '', // filled dynamically
      ar: '',
    },
    chips: ['what_scora', 'mx_kpis', 'what_tcs'],
  },
  {
    id: 'ranks_tiers',
    match: [/rank|tier|masters|title|لقب|مستوى|شارة/i],
    replies: {
      en: 'Ranks show order for a period. Tiers/titles are recognition levels from evaluation. Open Dashboard or Search for live lists — I won’t paste private scoreboards here.',
      ar: 'الترتيب بيوضح ترتيب الأفراد أو المراكز لفترة معينة. المستويات والألقاب شارات تقدير من التقييم. افتح اللوحة أو البحث للقوائم الحية — ومش هعرض درجات خاصة هنا.',
    },
    chips: ['what_tcs', 'how_search', 'goal_scora'],
  },
];

export const GOGO_CHIP_LABELS = {
  en: {
    what_scora: 'What is SCORA?',
    what_tcs: 'What is TCS?',
    what_pqa: 'What is PQA?',
    how_search: 'How to search',
    feedback: 'Feedback',
    survey: 'Academy survey',
    goto_tcs: 'Open TCS',
    goto_pqa: 'Open PQA',
    goto_search: 'Open Search',
    goto_feedback: 'Open Feedback',
    goto_survey: 'Open Survey',
    lang_toggle: 'العربية',
    welcome: 'Say hi',
    goal_scora: 'What is the goal?',
    mx_kpis: 'MX KPIs',
    da_av_kpis: 'DA/AV KPIs',
    ranks_tiers: 'Ranks & tiers',
    cs_org: 'CS Head Office',
    samsung_positive: 'Samsung highlights',
  },
  ar: {
    what_scora: 'ما هو سكورا؟',
    what_tcs: 'ما هو تي سي اس؟',
    what_pqa: 'ما هو بي كيو اي؟',
    how_search: 'طريقة البحث',
    feedback: 'الملاحظات',
    survey: 'استبيان الأكاديمية',
    goto_tcs: 'افتح تي سي اس',
    goto_pqa: 'افتح بي كيو اي',
    goto_search: 'افتح البحث',
    goto_feedback: 'افتح الملاحظات',
    goto_survey: 'افتح الاستبيان',
    lang_toggle: 'English',
    welcome: 'قل أهلاً',
    goal_scora: 'ما الهدف؟',
    mx_kpis: 'مؤشرات الموبايل',
    da_av_kpis: 'مؤشرات الأجهزة المنزلية والشاشات',
    ranks_tiers: 'الترتيب والمستويات',
    cs_org: 'هيكل مكتب الخدمة',
    samsung_positive: 'أبرز سامسونج',
  },
};

const FALLBACK = {
  en: "Happy to help! Ask me about SCORA, TCS, PQA, or Search — or tap a guided chip. I'm AREF, your AI assistant.",
  ar: 'فرحت أساعد! اسألني عن SCORA أو TCS أو PQA أو البحث — أو اختار من الاقتراحات. أنا اسمي عارف، مساعدك الذكي.',
};

const DEFAULT_CHIPS = ['what_scora', 'what_tcs', 'how_search', 'goal_scora'];

function matchRemoteQa(raw, lang, remoteQa = []) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const lower = raw.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const row of remoteQa) {
    const keys = Array.isArray(row.keywords) ? row.keywords : [];
    let score = 0;
    keys.forEach((k) => {
      if (k && lower.includes(String(k).toLowerCase())) score += 2;
    });
    const q = String(L === 'ar' ? row.question_ar || row.question_en : row.question_en || row.question_ar || '').toLowerCase();
    if (q && (lower.includes(q.slice(0, 24)) || q.includes(lower.slice(0, 24)))) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  if (!best || bestScore < 2) return null;
  return {
    reply: String(L === 'ar' ? best.answer_ar || best.answer_en : best.answer_en || best.answer_ar || ''),
    chips: DEFAULT_CHIPS,
    topicId: best.id || 'remote_qa',
  };
}

/**
 * @param {string} text
 * @param {GoGoLang} lang
 * @param {{ remoteQa?: Array }} [opts]
 */
function topicById(id) {
  return TOPICS.find((t) => t.id === id) || null;
}

export function resolveGoGoReply(text, lang = 'en', opts = {}) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const raw = String(text || '').trim();
  if (!raw) {
    const welcome = topicById('welcome') || TOPICS[0];
    return { reply: welcome.replies[L], chips: welcome.chips, topicId: 'welcome' };
  }
  if (isGoGoDeniedMessage(raw)) {
    return { reply: getGoGoSoftRedirectReply(L), chips: ['what_scora', 'what_tcs', 'how_search'], denied: true };
  }

  const isBuiltQuestion = /who\s*(built|made|created)|مين\s*(بنى|صنع)|من\s*(بنى|صنع)|who\s*developed/i.test(raw);
  if (!isBuiltQuestion) {
    const relationReply = answerGoGoOrgRelationQuestion(raw, L);
    if (relationReply) {
      return {
        reply: relationReply,
        chips: DEFAULT_CHIPS,
        topicId: 'cs_org_relation',
      };
    }
    const orgHit = findGoGoOrgPerson(raw);
    if (orgHit?.ambiguous?.length) {
      return {
        reply: formatGoGoOrgAmbiguousAnswer(orgHit.ambiguous, L),
        chips: DEFAULT_CHIPS,
        topicId: 'cs_org_person',
      };
    }
    if (orgHit?.person) {
      return {
        reply: formatGoGoOrgPersonAnswer(orgHit.person, L),
        chips: DEFAULT_CHIPS,
        topicId: 'cs_org_person',
      };
    }
  }

  const byId = TOPICS.find((t) => t.id === raw);
  if (byId) {
    const reply =
      byId.id === 'cs_org'
        ? buildGoGoOrgPlainText(L)
        : byId.id === 'samsung_positive'
          ? getGoGoSamsungPositiveBlurb(L)
          : byId.replies[L];
    return {
      reply,
      chips: byId.chips || DEFAULT_CHIPS,
      action: byId.action,
      topicId: byId.id,
    };
  }

  for (const topic of TOPICS) {
    if (topic.match.some((re) => re.test(raw))) {
      const reply =
        topic.id === 'cs_org'
          ? buildGoGoOrgPlainText(L)
          : topic.id === 'samsung_positive'
            ? getGoGoSamsungPositiveBlurb(L)
            : topic.replies[L];
      return {
        reply,
        chips: topic.chips || DEFAULT_CHIPS,
        action: topic.action,
        topicId: topic.id,
      };
    }
  }

  const kpi = findGoGoKpiDefinition(raw);
  if (kpi) {
    return {
      reply: formatGoGoKpiAnswer(kpi, L),
      chips: ['mx_kpis', 'da_av_kpis', 'what_tcs'],
      topicId: `kpi_${kpi.id}`,
    };
  }

  const remoteHit = matchRemoteQa(raw, L, opts.remoteQa || []);
  if (remoteHit?.reply) return remoteHit;

  return { reply: FALLBACK[L], chips: DEFAULT_CHIPS };
}

export function getGoGoWelcome(lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const welcome = topicById('welcome') || TOPICS[0];
  return {
    reply: welcome.replies[L],
    chips: ['what_scora', 'what_tcs', 'what_pqa', 'goal_scora', 'mx_kpis', 'lang_toggle'],
  };
}
