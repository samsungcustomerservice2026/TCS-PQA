/**
 * GoGo visitor guide — allowlisted FAQ only (EN / AR).
 * No scores, admin secrets, or engineer PII.
 */

export const GOGO_DENIED_PATTERNS = [
  /password|passwd|credential|api\s*key|token|secret|firebase|firestore/i,
  /admin\s*password|login\s*as\s*admin|bypass/i,
  /kill|bomb|weapon|terror|suicide|violence|attack/i,
  /show\b[\s\S]{0,40}\b(scores?|ranks?|winners?|engineers?|salary)\b/i,
  /\b(all|every)\s+(scores?|ranks?|winners?|engineers?)\b/i,
  /database|export\s*all|dump\s*data|hack/i,
  /كلمة\s*المرور|باسورد|سر\s*الإدارة|هكر|قتل|عنف/i,
];

export function isGoGoDeniedMessage(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  return GOGO_DENIED_PATTERNS.some((re) => re.test(s));
}

/** @typedef {'en'|'ar'} GoGoLang */

const TOPICS = [
  {
    id: 'who_are_you',
    match: [
      /who\s*are\s*you|what\s*are\s*you|what'?s\s*your\s*name|your\s*name|introduce\s*yourself/i,
      /مين\s*انت|من\s*أنت|من\s*انت|اسمك\s*ايه|عرّف\s*نفسك|عرف\s*نفسك/i,
      /\bgogo\b/i,
    ],
    replies: {
      en: "I am GoGo, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, and Academy tools. What would you like to explore?",
      ar: 'أنا GoGo، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية. تحب نبدأ بإيه؟',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa', 'how_search'],
  },
  {
    id: 'welcome',
    match: [/^(hi|hello|hey|yo|مرحبا|اهلا|أهلا|السلام|هاي|هلو)(\s|$|[!.؟?])/i],
    replies: {
      en: "Hey! I'm GoGo, your friendly AI assistant for SCORA. Ask me anything about TCS, PQA, Search, or Feedback — or tap a topic below.",
      ar: 'أهلاً! أنا GoGo مساعدك الودود في SCORA. اسألني عن TCS أو PQA أو البحث أو الملاحظات — أو اختار موضوع من الأزرار.',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa', 'how_search', 'lang_toggle'],
  },
  {
    id: 'how_are_you',
    match: [/how\s*are\s*you|how'?s\s*it\s*going|you\s*ok|عامل\s*ايه|ازيك|إزيك|أخبارك|اخبارك/i],
    replies: {
      en: "I'm doing great — thanks for asking! Ready when you are. Want a quick tour of SCORA, TCS, or PQA?",
      ar: 'تمام الحمد لله — شكراً لسؤالك! جاهز أساعدك. تحب جولة سريعة على SCORA أو TCS أو PQA؟',
    },
    chips: ['what_scora', 'what_tcs', 'what_pqa'],
  },
  {
    id: 'what_can_you_do',
    match: [/what\s*can\s*you\s*do|help\s*me|your\s*job|capabilities|تقدر\s*تعمل|تقدر\s*ايه|ممكن\s*تساعد|وظائفک|وظيفتك/i],
    replies: {
      en: "I can explain SCORA, walk you to TCS or PQA, show how Search works, and point you to Feedback or the Academy survey. Just ask in plain words.",
      ar: 'أقدر أشرح SCORA، وأودّيك لـ TCS أو PQA، وأوضح البحث، وأفتح لك الملاحظات أو استبيان الأكاديمية. قولّي اللي محتاجه بكلام بسيط.',
    },
    chips: ['what_scora', 'goto_tcs', 'goto_pqa', 'how_search'],
  },
  {
    id: 'nice_to_meet',
    match: [/nice\s*to\s*meet|pleased\s*to\s*meet|good\s*to\s*meet|تشرفنا|فرصة\s*سعيدة|نورت/i],
    replies: {
      en: "Nice to meet you too! I'm GoGo — glad you're here. What should we look at first?",
      ar: 'وأنا كمان فرحت بمعرفتك! أنا GoGo — سعيد بوجودك. نبدأ بإيه؟',
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
      ar: 'SCORA هو مركز أداء خدمة سامسونج مصر: TCS وPQA والملاحظات بالعربية واستبيان الأكاديمية وScora Challenge.',
    },
    chips: ['what_tcs', 'what_pqa', 'goal_scora'],
  },
  {
    id: 'what_tcs',
    match: [/\btcs\b|tier|engineer\s*rank|ترتيب\s*المهندس|المهندسين/i],
    replies: {
      en: 'TCS shows engineer performance by division (MX, DA, AV). Open TCS → pick a division → Dashboard for winners, or Search by code.',
      ar: 'TCS يعرض أداء المهندسين حسب القسم (MX وDA وAV). افتح TCS ← اختر القسم ← لوحة الترتيب للفائزين، أو ابحث بالكود.',
    },
    action: 'goto_tcs',
    chips: ['goto_tcs', 'how_search', 'what_pqa'],
  },
  {
    id: 'what_pqa',
    match: [/\bpqa\b|partner|service\s*center|مراكز\s*الخدمة|الجودة/i],
    replies: {
      en: 'PQA tracks service-center / partner quality (MX or CE). Open PQA → choose MX or CE → view rankings or search by center code.',
      ar: 'PQA يتابع جودة مراكز الخدمة والشركاء (MX أو CE). افتح PQA ← اختر MX أو CE ← شاهد الترتيب أو ابحث بكود المركز.',
    },
    action: 'goto_pqa',
    chips: ['goto_pqa', 'what_tcs'],
  },
  {
    id: 'how_search',
    match: [/search|find\s*engineer|lookup|بحث|دور\s*على|كود/i],
    replies: {
      en: 'Use the Search tab at the bottom. Enter an engineer code (TCS) or service-center code (PQA) to open the dossier.',
      ar: 'استخدم تبويب البحث أسفل الشاشة. أدخل كود المهندس (TCS) أو كود مركز الخدمة (PQA) لفتح الملف.',
    },
    action: 'goto_search',
    chips: ['goto_search', 'what_tcs'],
  },
  {
    id: 'feedback',
    match: [/feedback|suggestion|ملاحظات|اقتراح|شكوى/i],
    replies: {
      en: 'Arabic feedback is available from the Feedback form — no login required. I can open it for you.',
      ar: 'نموذج الملاحظات والاقتراحات بالعربية متاح بدون تسجيل دخول. أقدر أفتحه لك الآن.',
    },
    action: 'goto_feedback',
    chips: ['goto_feedback', 'survey'],
  },
  {
    id: 'survey',
    match: [/survey|academy|استبيان|الأكاديمية|اكاديمية/i],
    replies: {
      en: 'The Samsung Academy Survey is a short visitor form on the TCS portal. Look for the blue floating button, or I can open it.',
      ar: 'استبيان Samsung Academy نموذج قصير لزوار بوابة TCS. دور على الزر الأزرق العائم، أو أفتحه لك.',
    },
    action: 'goto_survey',
    chips: ['goto_survey', 'feedback'],
  },
  {
    id: 'challenge',
    match: [/quiz|challenge|scora\s*challenge|تحدي|اختبار/i],
    replies: {
      en: 'Scora Challenge is a live quiz hosted by admins. Join with a session link or QR from your host.',
      ar: 'Scora Challenge اختبار مباشر يشغّله المسؤول. انضم برابط الجلسة أو رمز QR من المضيف.',
    },
    chips: ['what_scora', 'what_tcs'],
  },
  {
    id: 'goto_pqa',
    match: [/open\s*pqa|خذني\s*ل|وديني\s*(على\s*)?pqa|روح\s*pqa/i],
    replies: {
      en: 'Okay — walking you to PQA…',
      ar: 'حاضر — هوديك على PQA…',
    },
    action: 'goto_pqa',
    chips: ['what_pqa'],
  },
  {
    id: 'goto_tcs',
    match: [/open\s*tcs|وديني\s*(على\s*)?tcs|روح\s*tcs/i],
    replies: {
      en: 'Okay — walking you to TCS…',
      ar: 'حاضر — هوديك على TCS…',
    },
    action: 'goto_tcs',
    chips: ['what_tcs'],
  },
  {
    id: 'goto_search',
    match: [/open\s*search|وديني\s*(على\s*)?البحث|روح\s*البحث/i],
    replies: {
      en: 'Opening Search…',
      ar: 'فتح البحث…',
    },
    action: 'goto_search',
    chips: ['how_search'],
  },
  {
    id: 'goto_feedback',
    match: [/open\s*feedback|وديني\s*(على\s*)?الملاحظات/i],
    replies: {
      en: 'Opening Feedback…',
      ar: 'فتح الملاحظات…',
    },
    action: 'goto_feedback',
    chips: ['feedback'],
  },
  {
    id: 'goto_survey',
    match: [/open\s*survey|وديني\s*(على\s*)?الاستبيان/i],
    replies: {
      en: 'Opening the Academy survey…',
      ar: 'فتح استبيان الأكاديمية…',
    },
    action: 'goto_survey',
    chips: ['survey'],
  },
  {
    id: 'thanks',
    match: [/thanks|thank\s*you|شكرا|merci/i, /تمام|اوك|ok\b|cool/i],
    replies: {
      en: "You're so welcome! Happy I could help. Anything else about SCORA, TCS, or PQA?",
      ar: 'العفو جدًا! فرحت إني قدرت أساعد. في حاجة تانية عن SCORA أو TCS أو PQA؟',
    },
    chips: ['what_scora', 'what_tcs'],
  },
  {
    id: 'who_built',
    // Answer only if asked — never pinned as a chip
    match: [/who\s*(built|made|created|developed)|مين\s*(بنى|صنع|عمل)|من\s*(بنى|صنع|عمل)|developer|fawzy|فوزي/i],
    replies: {
      en: 'Eng Fawzy — Technical Support Engineer at Samsung Egypt.',
      ar: 'المهندس فوزي — مهندس دعم فني في سامسونج مصر.',
    },
    chips: ['what_scora', 'what_tcs', 'goal_scora'],
  },
  {
    id: 'goal_scora',
    match: [/goal|purpose|why\s*scora|هدف|ليش|لماذا|الغرض/i],
    replies: {
      en: 'The goal is to make excellence visible and fair — clear KPIs, earned recognition, and one trusted home for TCS, PQA, feedback, and learning.',
      ar: 'الهدف إن التميز يكون واضح وعادل — مؤشرات واضحة، تقدير مستحق، ومكان واحد موثوق لـ TCS وPQA والملاحظات والتعلم.',
    },
    chips: ['what_scora', 'ranks_tiers', 'mx_kpis'],
  },
  {
    id: 'mx_kpis',
    match: [/mx\s*kpi|kpi.*mx|ssr|iqc\s*skip|rrr90|مؤشر.*mx|مؤشرات\s*mx/i],
    replies: {
      en: 'MX KPIs change by quarter. Common ones: SSR, RRR90, IQC Skip, Core Parts, MPU, Training, DRNPS, Exam, Final Result. I explain concepts — live scores stay in Search/Dashboard.',
      ar: 'مؤشرات MX تتغير حسب الربع. الشائع منها: SSR وRRR90 وتخطي IQC والقطع الأساسية وMPU والتدريب وDRNPS والامتحان والنتيجة النهائية. أشرح الفكرة — الدرجات الحية في البحث أو اللوحة.',
    },
    chips: ['da_av_kpis', 'ranks_tiers', 'what_tcs'],
  },
  {
    id: 'da_av_kpis',
    match: [/da\s*kpi|av\s*kpi|rnps|chatbot|hass|linkage|مؤشر.*(da|av)|مؤشرات\s*(da|av)/i],
    replies: {
      en: 'DA/AV Q1 often: Final, SSR, REDO, Chatbot, HASS, Acc Core Parts, Training, Linkage. Q2 often: Final, RNPS, REDO, Training, ST Con, MJ %, Complete Repair, Kahoot, HASS, Repair Volume.',
      ar: 'في DA وAV غالباً Q1: النتيجة وSSR وREDO وChatbot وHASS والقطع الأساسية والتدريب وLinkage. وQ2: النتيجة وRNPS وإعادة العمل والتدريب وST وMJ وإكمال الإصلاح وKahoot وHASS وحجم الإصلاح.',
    },
    chips: ['mx_kpis', 'what_tcs', 'goto_tcs'],
  },
  {
    id: 'ranks_tiers',
    match: [/rank|tier|masters|title|لقب|مستوى|شارة/i],
    replies: {
      en: 'Ranks show order for a period. Tiers/titles are recognition levels from evaluation. Open Dashboard or Search for live lists — I won’t paste private scoreboards here.',
      ar: 'الترتيب لفترة معينة. المستويات والألقاب شارات تقدير من التقييم. افتح اللوحة أو البحث للقوائم الحية — ولن أعرض درجات خاصة هنا.',
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
  },
  ar: {
    what_scora: 'ما هو SCORA؟',
    what_tcs: 'ما هو TCS؟',
    what_pqa: 'ما هو PQA؟',
    how_search: 'طريقة البحث',
    feedback: 'الملاحظات',
    survey: 'استبيان الأكاديمية',
    goto_tcs: 'افتح TCS',
    goto_pqa: 'افتح PQA',
    goto_search: 'افتح البحث',
    goto_feedback: 'افتح الملاحظات',
    goto_survey: 'افتح الاستبيان',
    lang_toggle: 'English',
    welcome: 'مرحبا',
    goal_scora: 'ما الهدف؟',
    mx_kpis: 'مؤشرات MX',
    da_av_kpis: 'مؤشرات DA/AV',
    ranks_tiers: 'الترتيب والمستويات',
  },
};

const DENIED_REPLY = {
  en: "I'd love to help with everything, but I'm GoGo for SCORA only — TCS, PQA, Search, Feedback, and KPIs. Pick a topic below!",
  ar: 'نفسي أساعد في كل حاجة، بس أنا GoGo لـ SCORA بس — TCS وPQA والبحث والملاحظات والمؤشرات. اختار موضوع من تحت!',
};

const FALLBACK = {
  en: "Happy to help! Ask me about SCORA, TCS, PQA, or Search — or tap a guided chip. I'm GoGo, your AI assistant.",
  ar: 'فرحان أساعد! اسألني عن SCORA أو TCS أو PQA أو البحث — أو اختار من الاقتراحات. أنا GoGo، مساعدك الذكي.',
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
    return { reply: DENIED_REPLY[L], chips: ['what_scora', 'what_tcs', 'how_search'], denied: true };
  }

  const byId = TOPICS.find((t) => t.id === raw);
  if (byId) {
    return {
      reply: byId.replies[L],
      chips: byId.chips || DEFAULT_CHIPS,
      action: byId.action,
      topicId: byId.id,
    };
  }

  for (const topic of TOPICS) {
    if (topic.match.some((re) => re.test(raw))) {
      return {
        reply: topic.replies[L],
        chips: topic.chips || DEFAULT_CHIPS,
        action: topic.action,
        topicId: topic.id,
      };
    }
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
