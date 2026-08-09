/**
 * GoGo guided chat flow (banking-style menu tree).
 * Fixed chips first; free text only after name is captured.
 */

/** @typedef {'en'|'ar'} GoGoLang */

export const GOGO_NAME_KEY = 'gogo_visitor_name';

export const GOGO_CHIP_LABELS = {
  en: {
    lang_toggle: 'العربية',
    main_menu: 'Main menu',
    what_scora: 'What is SCORA?',
    what_tcs: 'What is TCS?',
    what_pqa: 'What is PQA?',
    scora_more: 'What can I do in SCORA?',
    tcs_mx: 'MX (Mobile)',
    tcs_da: 'DA (Appliances)',
    tcs_av: 'AV',
    tcs_overview_more: 'How do I use TCS?',
    mx_kpis: 'MX KPIs',
    mx_calc: 'How is MX Final Result calculated?',
    da_kpis: 'DA KPIs',
    da_calc: 'How is DA Final Result calculated?',
    av_kpis: 'AV KPIs',
    av_calc: 'How is AV Final Result calculated?',
    pqa_kpis: 'PQA KPIs',
    pqa_calc: 'How is the PQA score calculated?',
    goto_tcs: 'Open TCS',
    goto_pqa: 'Open PQA',
    goto_search: 'Open Search',
    how_search: 'How to search',
    feedback: 'Feedback',
    survey: 'Academy survey',
  },
  ar: {
    lang_toggle: 'English',
    main_menu: 'القائمة الرئيسية',
    what_scora: 'ما هو SCORA؟',
    what_tcs: 'ما هو TCS؟',
    what_pqa: 'ما هو PQA؟',
    scora_more: 'ماذا أقدر أعمل في SCORA؟',
    tcs_mx: 'MX (موبايل)',
    tcs_da: 'DA (أجهزة منزلية)',
    tcs_av: 'AV',
    tcs_overview_more: 'كيف أستخدم TCS؟',
    mx_kpis: 'مؤشرات MX',
    mx_calc: 'كيف تُحسب نتيجة MX النهائية؟',
    da_kpis: 'مؤشرات DA',
    da_calc: 'كيف تُحسب نتيجة DA النهائية؟',
    av_kpis: 'مؤشرات AV',
    av_calc: 'كيف تُحسب نتيجة AV النهائية؟',
    pqa_kpis: 'مؤشرات PQA',
    pqa_calc: 'كيف تُحسب درجة PQA؟',
    goto_tcs: 'افتح TCS',
    goto_pqa: 'افتح PQA',
    goto_search: 'افتح البحث',
    how_search: 'طريقة البحث',
    feedback: 'الملاحظات',
    survey: 'استبيان الأكاديمية',
  },
};

const MAIN_CHIPS = ['what_scora', 'what_tcs', 'what_pqa', 'how_search'];

/** @type {Record<string, { replies: Record<GoGoLang, string>, chips: string[], action?: string }>} */
export const GOGO_FLOW = {
  ask_name: {
    replies: {
      en: "Hi! I'm GoGo, your SCORA guide.\n\nWhat's your name?",
      ar: 'أهلاً! أنا GoGo مرشدك في SCORA.\n\nاسمك إيه؟',
    },
    chips: [],
  },
  main_menu: {
    replies: {
      en: (name) => `Nice to meet you, ${name}!\n\nWhat would you like to know?`,
      ar: (name) => `تشرفنا يا ${name}!\n\nتحب تعرف عن إيه؟`,
    },
    chips: MAIN_CHIPS,
  },
  what_scora: {
    replies: {
      en:
        'SCORA is Samsung Egypt’s home for service performance.\n\n' +
        'You’ll find TCS for engineers, PQA for partners and centers, Search, Feedback, the Academy survey, and Scora Challenge quizzes.',
      ar:
        'SCORA هو بيت أداء خدمة سامسونج مصر.\n\n' +
        'فيه TCS للمهندسين، وPQA للشركاء والمراكز، والبحث، والملاحظات، واستبيان الأكاديمية، واختبارات Scora Challenge.',
    },
    chips: ['what_tcs', 'what_pqa', 'scora_more', 'main_menu'],
  },
  scora_more: {
    replies: {
      en:
        'Quick paths:\n' +
        '1) Open TCS or PQA from the home cards\n' +
        '2) Use Search (bottom tab) with an engineer or center code\n' +
        '3) Feedback for suggestions · Academy Survey when enabled\n\n' +
        'Want me to open something for you?',
      ar:
        'طرق سريعة:\n' +
        '1) افتح TCS أو PQA من كروت الصفحة الرئيسية\n' +
        '2) استخدم البحث (التبويب الأسفل) بكود مهندس أو مركز\n' +
        '3) الملاحظات للاقتراحات · استبيان الأكاديمية عند تفعيله\n\n' +
        'تحب أفتح لك حاجة؟',
    },
    chips: ['goto_tcs', 'goto_pqa', 'goto_search', 'main_menu'],
  },
  what_tcs: {
    replies: {
      en:
        'TCS = Technical Capability Score.\n\n' +
        'It tracks engineer performance by division:\n' +
        '• MX — Mobile\n' +
        '• DA — Home appliances\n' +
        '• AV — Audio/Visual\n\n' +
        'Dashboard shows winners for the period. Search opens an engineer dossier by code.\n\n' +
        'Which division do you want to explore?',
      ar:
        'TCS = درجة القدرة التقنية.\n\n' +
        'يتابع أداء المهندسين حسب القسم:\n' +
        '• MX — موبايل\n' +
        '• DA — أجهزة منزلية\n' +
        '• AV — صوت وصورة\n\n' +
        'لوحة الترتيب تعرض الفائزين. البحث يفتح ملف المهندس بالكود.\n\n' +
        'أي قسم تحب نستعرضه؟',
    },
    chips: ['tcs_mx', 'tcs_da', 'tcs_av', 'goto_tcs', 'main_menu'],
  },
  tcs_mx: {
    replies: {
      en:
        'MX (Mobile) TCS evaluates field engineers on repair quality, process KPIs, training, and customer feedback.\n\n' +
        'KPIs change by quarter (Q1 vs Q2 sheets). The Final Result comes from the uploaded Excel, and ranking often uses the average of available quarter finals.',
      ar:
        'TCS لقسم MX (موبايل) يقيّم مهندسي الميدان على جودة الإصلاح ومؤشرات العملية والتدريب ورأي العميل.\n\n' +
        'المؤشرات تتغير حسب الربع (Q1 وQ2). النتيجة النهائية تأتي من ملف Excel المرفوع، والترتيب غالباً يعتمد متوسط نتائج الأرباع المتاحة.',
    },
    chips: ['mx_kpis', 'mx_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  mx_kpis: {
    replies: {
      en:
        'Common MX KPIs (examples — follow the live quarter sheet):\n\n' +
        'Q1 focus:\n' +
        '• SSR % / score · RRR90 % / score\n' +
        '• IQC Skip % · Core Parts % · MPU %\n' +
        '• Training · DRNPS % · Exam · Final Result\n\n' +
        'Q2 focus:\n' +
        '• LCD/OCTA · PBA · Multi Parts\n' +
        '• IQC Skip · RRR30 · Training · DRNPS\n' +
        '• Maintenance Mode · OQC · Final Result\n\n' +
        'I explain concepts only — live scores stay in Dashboard/Search.',
      ar:
        'مؤشرات MX الشائعة (أمثلة — اتبع ورقة الربع الحالية):\n\n' +
        'تركيز Q1:\n' +
        '• SSR وRRR90 · تخطي IQC · القطع الأساسية · MPU\n' +
        '• التدريب · DRNPS · الامتحان · النتيجة النهائية\n\n' +
        'تركيز Q2:\n' +
        '• LCD/OCTA · PBA · Multi Parts\n' +
        '• تخطي IQC · RRR30 · التدريب · DRNPS\n' +
        '• وضع الصيانة · OQC · النتيجة النهائية\n\n' +
        'أشرح المفاهيم فقط — الدرجات الحية في اللوحة أو البحث.',
    },
    chips: ['mx_calc', 'tcs_mx', 'tcs_da', 'main_menu'],
  },
  mx_calc: {
    replies: {
      en:
        'How MX Final Result / targeted score works:\n\n' +
        '1) Admins upload the quarter Excel (Engineer_Wide).\n' +
        '2) Each KPI has a % and/or points column on that sheet.\n' +
        '3) Final Result is taken from Excel (not reinvented in chat).\n' +
        '4) For ranking display, SCORA often averages Final Results across present quarters.\n\n' +
        'Legacy formula (when used): ~50% KPI block + 30% DRNPS + 20% Exam.\n' +
        'Always trust the uploaded sheet for the current period.',
      ar:
        'كيف تُحسب نتيجة MX النهائية / المستهدفة:\n\n' +
        '1) الإدارة ترفع ملف Excel للربع.\n' +
        '2) كل مؤشر له نسبة و/أو نقاط في الورقة.\n' +
        '3) النتيجة النهائية تُؤخذ من Excel (مش من الشات).\n' +
        '4) للترتيب، SCORA غالباً يحسب متوسط نتائج الأرباع المتاحة.\n\n' +
        'صيغة قديمة (عند استخدامها): حوالي 50% مؤشرات + 30% DRNPS + 20% امتحان.\n' +
        'دائماً اعتبر ورقة الربع المرفوعة هي المرجع.',
    },
    chips: ['mx_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_da: {
    replies: {
      en:
        'DA (Domestic Appliances) TCS tracks appliance engineers with a wide Q1/Q2 KPI sheet.\n\n' +
        'Final Result per quarter comes from Excel; overall TCS often averages available quarter finals.',
      ar:
        'TCS لقسم DA (أجهزة منزلية) يتابع مهندسي الأجهزة بورقة مؤشرات Q1/Q2.\n\n' +
        'النتيجة النهائية لكل ربع من Excel، والترتيب غالباً متوسط نتائج الأرباع المتاحة.',
    },
    chips: ['da_kpis', 'da_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  da_kpis: {
    replies: {
      en:
        'DA KPIs (typical sheet columns):\n\n' +
        'Q1: Final · SSR · REDO · Chatbot · HASS · Acc Core Parts · Training · Linkage\n\n' +
        'Q2: Final · RNPS · REDO · Training · ST Con · MJ % · Complete Repair · Kahoot · HASS · Repair Volume\n\n' +
        'Product group HA maps to DA in uploads.',
      ar:
        'مؤشرات DA (أعمدة الورقة الشائعة):\n\n' +
        'Q1: النتيجة · SSR · REDO · Chatbot · HASS · القطع الأساسية · التدريب · Linkage\n\n' +
        'Q2: النتيجة · RNPS · REDO · التدريب · ST · MJ % · إكمال الإصلاح · Kahoot · HASS · حجم الإصلاح\n\n' +
        'مجموعة HA تُربط بقسم DA عند الرفع.',
    },
    chips: ['da_calc', 'tcs_da', 'tcs_av', 'main_menu'],
  },
  da_calc: {
    replies: {
      en:
        'How DA Final Result is calculated:\n\n' +
        '• Sub-KPIs are scored on the Excel sheet for each quarter.\n' +
        '• Q1 Final / Q2 Final are imported as-is.\n' +
        '• Displayed TCS score is typically the average of available quarter Finals.\n\n' +
        'Open Search with an engineer code to see the live dossier.',
      ar:
        'كيف تُحسب نتيجة DA النهائية:\n\n' +
        '• المؤشرات الفرعية تُحسب في ورقة Excel لكل ربع.\n' +
        '• نتيجة Q1 وQ2 تُستورد كما هي.\n' +
        '• درجة TCS المعروضة غالباً متوسط نتائج الأرباع المتاحة.\n\n' +
        'افتح البحث بكود المهندس لرؤية الملف الحي.',
    },
    chips: ['da_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_av: {
    replies: {
      en:
        'AV TCS uses the same wide DA/AV Excel structure (Q1/Q2), mapped to the AV division.\n\n' +
        'Explore KPIs and how Final Result is calculated next.',
      ar:
        'TCS لقسم AV يستخدم نفس هيكل ورقة DA/AV (Q1/Q2) ويرتبط بقسم AV.\n\n' +
        'بعدها تقدر تشوف المؤشرات وطريقة حساب النتيجة النهائية.',
    },
    chips: ['av_kpis', 'av_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  av_kpis: {
    replies: {
      en:
        'AV KPIs match the DA/AV sheet:\n\n' +
        'Q1: Final · SSR · REDO · Chatbot · HASS · Acc Core Parts · Training · Linkage\n\n' +
        'Q2: Final · RNPS · REDO · Training · ST Con · MJ % · Complete Repair · Kahoot · HASS · Repair Volume',
      ar:
        'مؤشرات AV من ورقة DA/AV:\n\n' +
        'Q1: النتيجة · SSR · REDO · Chatbot · HASS · القطع الأساسية · التدريب · Linkage\n\n' +
        'Q2: النتيجة · RNPS · REDO · التدريب · ST · MJ % · إكمال الإصلاح · Kahoot · HASS · حجم الإصلاح',
    },
    chips: ['av_calc', 'tcs_av', 'tcs_mx', 'main_menu'],
  },
  av_calc: {
    replies: {
      en:
        'How AV Final Result is calculated:\n\n' +
        'Same rule as DA — quarter Finals come from Excel; overall score averages available quarters.\n' +
        'Use Dashboard/Search for live numbers.',
      ar:
        'كيف تُحسب نتيجة AV النهائية:\n\n' +
        'نفس قاعدة DA — نتائج الأرباع من Excel، والدرجة الكلية متوسط الأرباع المتاحة.\n' +
        'استخدم اللوحة أو البحث للأرقام الحية.',
    },
    chips: ['av_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  what_pqa: {
    replies: {
      en:
        'PQA = Partner Quality Award.\n\n' +
        'Every month, partners / service centers are ranked based on their performance — operational quality, repair metrics, and customer experience.\n\n' +
        'Unlike TCS (individual engineers), PQA focuses on center / partner-wide results (MX or CE).\n\n' +
        'What would you like next?',
      ar:
        'PQA = جائزة جودة الشريك (Partner Quality Award).\n\n' +
        'كل شهر يتم ترتيب الشركاء / مراكز الخدمة حسب الأداء — جودة التشغيل ومؤشرات الإصلاح وتجربة العميل.\n\n' +
        'بخلاف TCS (للمهندسين فردياً)، PQA يركز على أداء المركز / الشريك (MX أو CE).\n\n' +
        'تحب نكمل بإيه؟',
    },
    chips: ['pqa_kpis', 'pqa_calc', 'goto_pqa', 'main_menu'],
  },
  pqa_kpis: {
    replies: {
      en:
        'PQA KPIs (typical point caps):\n\n' +
        '• LTP — Life-Time Performance (10)\n' +
        '• Ex-LTP — Excessive LTP control (10)\n' +
        '• REDO — returns within warranty (10)\n' +
        '• SSR — Same Symptom REDO (20)\n' +
        '• D-RNPS — customer satisfaction (10–20)\n' +
        '• OFS — parts ordering accuracy (10)\n' +
        '• R-CXE — customer experience (10)\n' +
        '• SDR — Same Day Repair (10)\n\n' +
        'Deductions:\n' +
        '• Audit (up to −5)\n' +
        '• PR — Policy Review (up to −5)',
      ar:
        'مؤشرات PQA (حدود النقاط الشائعة):\n\n' +
        '• LTP — الأداء طويل الأمد (10)\n' +
        '• Ex-LTP — ضبط الوقت الزائد (10)\n' +
        '• REDO — إعادة الإصلاح خلال الضمان (10)\n' +
        '• SSR — إعادة بنفس العَرَض (20)\n' +
        '• D-RNPS — رضا العميل (10–20)\n' +
        '• OFS — دقة طلب القطع (10)\n' +
        '• R-CXE — تجربة العميل (10)\n' +
        '• SDR — إصلاح في نفس اليوم (10)\n\n' +
        'خصومات:\n' +
        '• Audit (حتى −5)\n' +
        '• PR — مراجعة السياسة (حتى −5)',
    },
    chips: ['pqa_calc', 'what_pqa', 'goto_pqa', 'main_menu'],
  },
  pqa_calc: {
    replies: {
      en:
        'How the PQA target / score is calculated:\n\n' +
        '1) Each KPI contributes points (up to its cap).\n' +
        '2) Add: LTP + Ex-LTP + REDO + SSR + D-RNPS + OFS + R-CXE + SDR\n' +
        '3) Subtract Audit and PR (treated as deductions)\n' +
        '4) Clamp the result between 0 and 100\n\n' +
        'If Excel already provides a TCS/PQA score (0–100), the app may display that directly.\n' +
        'Partners are ranked monthly from these results.',
      ar:
        'كيف تُحسب درجة / هدف PQA:\n\n' +
        '1) كل مؤشر يضيف نقاطاً حتى حده الأقصى.\n' +
        '2) اجمع: LTP + Ex-LTP + REDO + SSR + D-RNPS + OFS + R-CXE + SDR\n' +
        '3) اطرح Audit وPR (خصومات)\n' +
        '4) النتيجة بين 0 و100\n\n' +
        'لو الملف فيه درجة جاهزة (0–100) قد يعرضها التطبيق مباشرة.\n' +
        'يتم ترتيب الشركاء شهرياً بناءً على هذه النتائج.',
    },
    chips: ['pqa_kpis', 'goto_pqa', 'what_pqa', 'main_menu'],
  },
  how_search: {
    replies: {
      en: 'Open the Search tab → enter engineer code (TCS) or center code (PQA) → view the dossier KPI snapshot.',
      ar: 'افتح تبويب البحث ← أدخل كود المهندس (TCS) أو كود المركز (PQA) ← شاهد ملخص الملف.',
    },
    chips: ['goto_search', 'what_tcs', 'what_pqa', 'main_menu'],
  },
  feedback: {
    replies: {
      en: 'Arabic Feedback collects visitor suggestions — no login required.',
      ar: 'الملاحظات بالعربية تجمع اقتراحات الزوار — بدون تسجيل دخول.',
    },
    chips: ['main_menu', 'survey'],
    action: undefined,
  },
  survey: {
    replies: {
      en: 'Samsung Academy Survey is a short form on the TCS portal (floating button when enabled).',
      ar: 'استبيان الأكاديمية نموذج قصير في بوابة TCS (الزر الأزرق العائم عند تفعيله).',
    },
    chips: ['main_menu', 'feedback'],
  },
  goto_tcs: {
    replies: {
      en: 'Okay — I’ll walk you to TCS…',
      ar: 'حاضر — هوديك على TCS…',
    },
    chips: ['what_tcs', 'main_menu'],
    action: 'goto_tcs',
  },
  goto_pqa: {
    replies: {
      en: 'Okay — I’ll walk you to PQA…',
      ar: 'حاضر — هوديك على PQA…',
    },
    chips: ['what_pqa', 'main_menu'],
    action: 'goto_pqa',
  },
  goto_search: {
    replies: {
      en: 'Opening Search…',
      ar: 'فتح البحث…',
    },
    chips: ['how_search', 'main_menu'],
    action: 'goto_search',
  },
  who_built: {
    replies: {
      en: 'Eng Fawzy — Technical Support Engineer at Samsung Egypt.',
      ar: 'المهندس فوزي — مهندس دعم فني في سامسونج مصر.',
    },
    chips: MAIN_CHIPS,
  },
  denied: {
    replies: {
      en: "I can only help with SCORA, TCS, and PQA. Try one of the topics below.",
      ar: 'أقدر أساعد في SCORA وTCS وPQA بس. جرّب موضوع من اللي تحت.',
    },
    chips: MAIN_CHIPS,
  },
  need_name: {
    replies: {
      en: 'Tell me your name first, then we can start.',
      ar: 'قولّي اسمك الأول وبعدين نبدأ.',
    },
    chips: [],
  },
  name_invalid: {
    replies: {
      en: 'Hmm, that doesn’t look like a name. Try again?',
      ar: 'مش باين إنه اسم. تحب تجربه تاني؟',
    },
    chips: [],
  },
};

export const GOGO_BUBBLE = {
  en: "Hi! I'm GoGo 👋\nTap me to chat",
  ar: 'أهلاً! أنا GoGo 👋\nاضغط عليّ للدردشة',
};

export function getFlowNode(id) {
  return GOGO_FLOW[id] || null;
}

export function resolveFlowReply(nodeId, lang = 'en', name = '') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const node = getFlowNode(nodeId);
  if (!node) return { reply: '', chips: MAIN_CHIPS };
  const raw = node.replies[L];
  const reply = typeof raw === 'function' ? raw(name || (L === 'ar' ? 'صديقنا' : 'friend')) : raw;
  return { reply, chips: node.chips || MAIN_CHIPS, action: node.action, nodeId };
}

export function isValidGoGoName(text) {
  const s = String(text || '').trim();
  if (s.length < 2 || s.length > 40) return false;
  if (/https?:|www\.|@|<|>/i.test(s)) return false;
  if (/password|admin|select\s|drop\s/i.test(s)) return false;
  return /[\p{L}\p{M}]/u.test(s);
}

export function normalizeGoGoName(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

export function loadGoGoVisitorName() {
  if (typeof window === 'undefined') return '';
  try {
    return String(localStorage.getItem(GOGO_NAME_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function saveGoGoVisitorName(name) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOGO_NAME_KEY, normalizeGoGoName(name));
  } catch { /* ignore */ }
}

/** Free-text → flow node (after name is known). */
export function matchFreeTextToFlow(text, lang = 'en') {
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();
  if (/who\s*(built|made|created)|مين\s*(بنى|صنع)|من\s*(بنى|صنع)|fawzy|فوزي/i.test(raw)) return 'who_built';
  if (/scora|سكورا|التطبيق/i.test(raw)) return 'what_scora';
  if (/\bpqa\b|partner\s*quality|جائزة|شريك|مراكز/i.test(raw)) {
    if (/kpi|مؤشر|calc|حسب|تحسب|درجة|score/i.test(raw)) return /calc|حسب|تحسب|score|درجة/i.test(raw) ? 'pqa_calc' : 'pqa_kpis';
    return 'what_pqa';
  }
  if (/\btcs\b|قدرة\s*تقنية/i.test(raw) || /مهندس/i.test(raw)) {
    if (/\bmx\b|موبايل|mobile/i.test(raw)) return /kpi|مؤشر/i.test(raw) ? 'mx_kpis' : /calc|حسب|نتيجة|final/i.test(raw) ? 'mx_calc' : 'tcs_mx';
    if (/\bda\b|appliances|منزل/i.test(raw)) return /kpi|مؤشر/i.test(raw) ? 'da_kpis' : /calc|حسب|نتيجة|final/i.test(raw) ? 'da_calc' : 'tcs_da';
    if (/\bav\b/i.test(raw)) return /kpi|مؤشر/i.test(raw) ? 'av_kpis' : /calc|حسب|نتيجة|final/i.test(raw) ? 'av_calc' : 'tcs_av';
    return 'what_tcs';
  }
  if (/\bmx\b/i.test(lower)) return /calc|final|حسب|نتيجة/i.test(raw) ? 'mx_calc' : 'mx_kpis';
  if (/\bda\b/i.test(lower)) return /calc|final|حسب|نتيجة/i.test(raw) ? 'da_calc' : 'da_kpis';
  if (/\bav\b/i.test(lower)) return /calc|final|حسب|نتيجة/i.test(raw) ? 'av_calc' : 'av_kpis';
  if (/search|بحث|كود/i.test(raw)) return 'how_search';
  if (/feedback|ملاحظات/i.test(raw)) return 'feedback';
  if (/survey|استبيان|أكاديم/i.test(raw)) return 'survey';
  if (/menu|قائمة|رجوع|back/i.test(raw)) return 'main_menu';
  return null;
}
