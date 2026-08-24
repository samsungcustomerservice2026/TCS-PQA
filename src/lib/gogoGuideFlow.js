/**
 * GoGo guided chat flow (banking-style menu tree).
 * Fixed chips first; free text only after name is captured.
 */

import { buildGoGoOrgPlainText } from './gogoOrgAndKpis';

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
    who_are_you: 'Who are you?',
    how_are_you: 'How are you?',
    what_can_you_do: 'What can you do?',
    nice_to_meet: 'Nice to meet you',
    who_built: 'Who built SCORA?',
    cs_org: 'CS Head Office structure',
    open_consultant: 'Open consultant',
    goto_knowledge: 'My Knowledge',
    new_consultant: 'New technical tip',
    how_tip: 'How to finish a tip',
    knowledge_coach: 'Knowledge tips help',
    goto_feedback: 'Open Feedback',
    goto_survey: 'Open survey',
  },
  ar: {
    lang_toggle: 'English',
    main_menu: 'القائمة الرئيسية',
    what_scora: 'ما هو سكورا؟',
    what_tcs: 'ما هو تي سي اس؟',
    what_pqa: 'ما هو بي كيو اي؟',
    scora_more: 'ماذا يمكنني أن أفعل في سكورا؟',
    tcs_mx: 'الموبايل',
    tcs_da: 'الأجهزة المنزلية',
    tcs_av: 'الشاشات',
    tcs_overview_more: 'كيف أستخدم تي سي اس؟',
    mx_kpis: 'مؤشرات الموبايل',
    mx_calc: 'كيف تُحسب نتيجة الموبايل النهائية؟',
    da_kpis: 'مؤشرات الأجهزة المنزلية',
    da_calc: 'كيف تُحسب نتيجة الأجهزة المنزلية النهائية؟',
    av_kpis: 'مؤشرات الشاشات',
    av_calc: 'كيف تُحسب نتيجة الشاشات النهائية؟',
    pqa_kpis: 'مؤشرات بي كيو اي',
    pqa_calc: 'كيف تُحسب درجة بي كيو اي؟',
    goto_tcs: 'افتح تي سي اس',
    goto_pqa: 'افتح بي كيو اي',
    goto_search: 'افتح البحث',
    how_search: 'طريقة البحث',
    feedback: 'الملاحظات',
    survey: 'استبيان الأكاديمية',
    cs_org: 'هيكل مكتب خدمة العملاء',
    who_are_you: 'من أنت؟',
    how_are_you: 'كيف حالك؟',
    what_can_you_do: 'ماذا تستطيع أن تفعل؟',
    nice_to_meet: 'تشرفنا',
    who_built: 'من بنى سكورا؟',
    open_consultant: 'افتح الاستشارة',
    goto_knowledge: 'لوحة المعرفة',
    new_consultant: 'نصيحة فنية جديدة',
    how_tip: 'إزاي تخلّص النصيحة',
    knowledge_coach: 'مساعدة المعرفة',
    goto_feedback: 'افتح الملاحظات',
    goto_survey: 'افتح الاستبيان',
  },
};

const MAIN_CHIPS = ['what_scora', 'what_tcs', 'what_pqa', 'how_search'];
const EMPLOYEE_ONLY_CHIPS = ['new_consultant'];
const EMPLOYEE_MAIN_CHIPS = ['goto_knowledge', 'how_tip', 'what_scora', 'how_search'];

export function mainMenuChips(employeeLoggedIn = false) {
  return employeeLoggedIn ? [...EMPLOYEE_MAIN_CHIPS] : [...MAIN_CHIPS];
}

export function decorateGoGoChips(chips, { employeeLoggedIn = false } = {}) {
  const list = Array.isArray(chips) ? chips.filter(Boolean) : [];
  if (!list.length) return list;
  if (!employeeLoggedIn) {
    return list.filter((id) => !EMPLOYEE_ONLY_CHIPS.includes(id));
  }
  const looksLikeMain = list.some((id) => (
    id === 'what_scora' || id === 'what_tcs' || id === 'what_pqa' || id === 'how_search'
  ));
  if (!looksLikeMain) return list;
  const rest = list.filter((id) => !EMPLOYEE_ONLY_CHIPS.includes(id) && id !== 'main_menu');
  const next = ['goto_knowledge', 'how_tip', ...rest];
  if (list.includes('main_menu')) next.push('main_menu');
  return [...new Set(next)];
}

/** @type {Record<string, { replies: Record<GoGoLang, string>, chips: string[], action?: string }>} */
export const GOGO_FLOW = {
  ask_name: {
    replies: {
      en: "Hi! I am GOGO, your AI assistant for SCORA.\n\nWhat's your name?",
      ar: 'أهلاً وسهلاً! أنا اسمي جوجو، مساعدك الذكي في سكورا.\n\nاسمك إيه؟',
    },
    chips: [],
  },
  main_menu: {
    replies: {
      en: (name) => `Nice to meet you, ${name}! I'm happy you're here.\n\nWhat would you like to know?`,
      ar: (name) => `تشرفنا يا ${name}! فرحت بوجودك.\n\nتحب تعرف عن إيه؟`,
    },
    chips: MAIN_CHIPS,
  },
  what_scora: {
    replies: {
      en:
        'SCORA is Samsung Egypt’s home for service performance.\n\n' +
        'You’ll find TCS for engineers, PQA for partners and centers, Search, Feedback, the Academy survey, and Scora Challenge quizzes.',
      ar:
        'SCORA ده بيت أداء خدمة سامسونج مصر.\n\n' +
        'هتلاقي فيه TCS للمهندسين، وPQA للشركاء والمراكز، والبحث، والملاحظات، واستبيان الأكاديمية، واختبارات Scora Challenge.',
    },
    spoken: {
      en: 'SCORA is Samsung Egypt’s home for service performance: TCS, PQA, Search, Feedback, the Academy survey, and Scora Challenge.',
      ar: 'سكورا بيت أداء خدمة سامسونج مصر: تي سي اس، وبي كيو اي، والبحث، والملاحظات، واستبيان الأكاديمية، واختبارات سكورا تشالنج.',
    },
    chips: ['what_tcs', 'what_pqa', 'scora_more', 'main_menu'],
  },
  scora_more: {
    replies: {
      en:
        'Quick paths:\n' +
        '1) Open TCS or PQA from the home cards\n' +
        '2) Use Search (bottom tab) with an engineer or center code\n' +
        '3) Feedback or Academy Survey when you want to share your voice\n' +
        '4) My Knowledge for technical tips after you sign in\n\n' +
        'Want me to open something for you?',
      ar:
        'طرق سريعة كده:\n' +
        '1) افتح TCS أو PQA من كروت الصفحة الرئيسية\n' +
        '2) استخدم البحث (التبويب اللي تحت) بكود مهندس أو مركز\n' +
        '3) الملاحظات أو استبيان الأكاديمية لما تحب تقول رأيك\n' +
        '4) لوحة المعرفة للنصائح الفنية بعد ما تسجّل\n\n' +
        'تحب أفتح لك حاجة؟',
    },
    spoken: {
      en: 'You can open TCS or PQA from home, Search with a code, Feedback or the Academy survey, and My Knowledge for technical tips after you sign in. Want me to open something?',
      ar: 'تقدر تفتح تي سي اس أو بي كيو اي من الرئيسية، والبحث بالكود، والملاحظات أو الاستبيان، ولوحة المعرفة للنصائح بعد التسجيل. تحب أفتح لك حاجة؟',
    },
    chips: ['goto_tcs', 'goto_pqa', 'goto_search', 'goto_knowledge', 'main_menu'],
  },
  what_tcs: {
    replies: {
      en:
        'TCS = Technical Capability Score.\n\n' +
        'It tracks engineer performance by division:\n' +
        '• MX — Mobile\n' +
        '• DA — Home appliances\n' +
        '• AV — Audio/Visual (screens)\n\n' +
        'Dashboard shows winners for the period. Search opens an engineer dossier by code.\n\n' +
        'Which division do you want to explore?',
      ar:
        'تي سي اس يعني درجة القدرة التقنية.\n\n' +
        'بيتتابع أداء المهندسين على ٣ أقسام:\n' +
        '• الموبايل\n' +
        '• الأجهزة المنزلية\n' +
        '• الشاشات\n\n' +
        'لوحة الترتيب بتظهر الفائزين. والبحث بيفتح ملف المهندس بالكود.\n\n' +
        'تحب نشوف أنهي قسم؟',
    },
    spoken: {
      en: 'TCS is Technical Capability Score for engineers in MX mobile, DA appliances, and AV screens. Dashboard shows winners. Search opens a dossier by code. Which division do you want?',
      ar: 'تي سي اس درجة القدرة التقنية للمهندسين في الموبايل والأجهزة المنزلية والشاشات. اللوحة بتظهر الفائزين، والبحث بيفتح الملف بالكود. تحب نشوف أنهي قسم؟',
    },
    chips: ['tcs_mx', 'tcs_da', 'tcs_av', 'goto_tcs', 'main_menu'],
  },
  tcs_mx: {
    replies: {
      en:
        'MX (Mobile) TCS evaluates field engineers on repair quality, process KPIs, training, and customer feedback.\n\n' +
        'KPIs can differ by quarter. Final Result drives ranking, and SCORA often averages available quarter finals. Ask me any KPI name (like RRR30) and I’ll define it.',
      ar:
        'تي سي اس بتاع الموبايل بيقيّم مهندسي الميدان على جودة الإصلاح ومؤشرات الشغل والتدريب ورأي العميل.\n\n' +
        'المؤشرات ممكن تختلف حسب الربع. النتيجة النهائية هي اللي بتحرك الترتيب، وسكورا غالباً بيحسب متوسط نتائج الأرباع المتاحة. اسألني عن أي مؤشر (زي RRR30) وهشرحهولك.',
    },
    chips: ['mx_kpis', 'mx_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  mx_kpis: {
    replies: {
      en:
        'Common MX KPIs and what they mean:\n\n' +
        '• SSR — Same Symptom return/REDO\n' +
        '• RRR90 / RRR30 — Return Repair Ratio in 90 / 30 days\n' +
        '• IQC Skip — skipped incoming quality checks\n' +
        '• Core Parts / PBA / LCD-OCTA — correct critical-part usage\n' +
        '• MPU / Multi Parts — multi-part usage ratio\n' +
        '• Training · DRNPS · Exam · Maintenance Mode · OQC · Final Result\n\n' +
        'Ask any acronym for a fuller definition. Live scores stay in Dashboard/Search.',
      ar:
        'أشهر مؤشرات الموبايل ومعناها:\n\n' +
        '• SSR — رجوع / إعادة بنفس العَرَض\n' +
        '• RRR90 / RRR30 — نسبة إعادة الإصلاح خلال 90 / 30 يوم\n' +
        '• تخطي IQC — تخطّي فحص الجودة الوارد\n' +
        '• القطع الأساسية / PBA / LCD-OCTA — استخدام صحيح للقطع الحرجة\n' +
        '• MPU / Multi Parts — نسبة استخدام أكتر من قطعة\n' +
        '• التدريب · DRNPS · الامتحان · وضع الصيانة · OQC · النتيجة النهائية\n\n' +
        'اسأل عن أي اختصار وهوضحهولك أحسن. الدرجات الحية في اللوحة أو البحث.',
    },
    spoken: {
      en: 'Common MX KPIs include SSR, RRR 90, RRR 30, IQC skip, core parts, training, DRNPS, exam, and Final Result. Ask any acronym and I will define it. Live scores are in Search.',
      ar: 'أشهر مؤشرات الموبايل: إس إس آر، آر آر آر، تخطي آي كيو سي، القطع الأساسية، التدريب، دي آر إن بي إس، الامتحان، والنتيجة النهائية. اسأل عن أي اختصار. الدرجات الحية في البحث.',
    },
    chips: ['mx_calc', 'tcs_mx', 'tcs_da', 'main_menu'],
  },
  mx_calc: {
    replies: {
      en:
        'How MX Final Result works:\n\n' +
        '1) Each period has KPI % and/or points that feed the Final Result.\n' +
        '2) Ranking often uses the average of available quarter Final Results.\n' +
        '3) A common legacy mix is about 50% operational KPIs + 30% DRNPS + 20% Exam.\n\n' +
        'Open Search with an engineer code for the live dossier.',
      ar:
        'نتيجة الموبايل النهائية بتشتغل كده:\n\n' +
        '1) كل فترة فيها نسب و/أو نقاط مؤشرات بتدخل في النتيجة النهائية.\n' +
        '2) الترتيب غالباً بيبقى متوسط نتائج الأرباع المتاحة.\n' +
        '3) مزيج قديم شائع: حوالي 50% مؤشرات تشغيل + 30% DRNPS + 20% امتحان.\n\n' +
        'افتح البحث بكود المهندس عشان تشوف الملف الحي.',
    },
    spoken: {
      en: 'MX Final Result comes from period KPIs. Ranking often averages available quarter finals. Open Search with an engineer code for live numbers.',
      ar: 'نتيجة الموبايل النهائية من مؤشرات الفترة. الترتيب غالباً متوسط نتائج الأرباع. افتح البحث بكود المهندس للأرقام الحية.',
    },
    chips: ['mx_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_da: {
    replies: {
      en:
        'DA (Domestic Appliances) TCS tracks appliance engineers on period KPIs and Final Result.\n\n' +
        'Overall TCS often averages available quarter finals. Ask me to define any KPI.',
      ar:
        'تي سي اس بتاع الأجهزة المنزلية بيتابع مهندسي الأجهزة بمؤشرات الفترة والنتيجة النهائية.\n\n' +
        'الترتيب غالباً متوسط نتائج الأرباع المتاحة. اسألني أعرّف لك أي مؤشر.',
    },
    chips: ['da_kpis', 'da_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  da_kpis: {
    replies: {
      en:
        'DA KPIs (typical):\n\n' +
        '• SSR — same-symptom return\n' +
        '• REDO — rework / return repair\n' +
        '• Chatbot · HASS · Acc Core Parts · Training · Linkage\n' +
        '• RNPS — repair NPS\n' +
        '• ST Con · MJ % · Complete Repair · Kahoot · Repair Volume · Final Result\n\n' +
        'Note: DA and AV can share one template for CE engineers who cover both, but DA includes HASS while AV does not.\n' +
        'Say a KPI name and I’ll define it.',
      ar:
        'مؤشرات الأجهزة المنزلية الشائعة:\n\n' +
        '• SSR — رجوع بنفس العَرَض\n' +
        '• REDO — إعادة الشغل / الإصلاح\n' +
        '• Chatbot · HASS · القطع الأساسية · التدريب · Linkage\n' +
        '• RNPS — مؤشر توصية الإصلاح\n' +
        '• ST · MJ % · إكمال الإصلاح · Kahoot · حجم الإصلاح · النتيجة النهائية\n\n' +
        'ملاحظة: الأجهزة المنزلية والشاشات ممكن يشتركوا في قالب واحد لمهندسي CE، بس HASS موجود في الأجهزة المنزلية ومش في الشاشات.\n' +
        'قول اسم المؤشر وهشرحهولك.',
    },
    spoken: {
      en: 'DA KPIs include SSR, REDO, chatbot, HASS, core parts, training, RNPS, and Final Result. HASS is DA only, not AV. Ask a KPI name and I will define it.',
      ar: 'مؤشرات الأجهزة المنزلية تشمل إس إس آر، ري دو، الشات بوت، هاس، القطع الأساسية، التدريب، آر إن بي إس، والنتيجة النهائية. هاس للأجهزة المنزلية مش الشاشات. قول اسم المؤشر.',
    },
    chips: ['da_calc', 'tcs_da', 'av_kpis', 'main_menu'],
  },
  da_calc: {
    replies: {
      en:
        'How DA Final Result is calculated:\n\n' +
        '• Period sub-KPIs feed each quarter’s Final Result.\n' +
        '• Displayed TCS score is typically the average of available quarter Finals.\n\n' +
        'Open Search with an engineer code to see the live dossier.',
      ar:
        'نتيجة الأجهزة المنزلية النهائية بتتحسب كده:\n\n' +
        '• مؤشرات الفترة بتغذي نتيجة كل ربع.\n' +
        '• درجة تي سي اس اللي بتظهر غالباً متوسط نتائج الأرباع المتاحة.\n\n' +
        'افتح البحث بكود المهندس عشان تشوف الملف الحي.',
    },
    chips: ['da_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_av: {
    replies: {
      en:
        'AV TCS uses the same style of period KPIs as DA/AV evaluations, mapped to the AV division.\n\n' +
        'Explore KPI meanings or how Final Result is calculated next.',
      ar:
        'تي سي اس بتاع الشاشات بيستخدم نفس أسلوب مؤشرات الفترة، بس مربوط بقسم الشاشات.\n\n' +
        'بعد كده تقدر تشوف معاني المؤشرات أو طريقة حساب النتيجة النهائية.',
    },
    chips: ['av_kpis', 'av_calc', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  av_kpis: {
    replies: {
      en:
        'AV and DA may share one upload template because some CE engineers support both product lines — but the KPI sets are NOT the same.\n\n' +
        'AV KPIs (typical):\n' +
        '• SSR · REDO · Chatbot · Acc Core Parts · Training · Linkage\n' +
        '• RNPS · ST Con · MJ % · Complete Repair · Kahoot · Repair Volume · Final Result\n\n' +
        'Important: AV does NOT use HASS in its KPI set (HASS is a DA-side measure).\n' +
        'Ask any name and I’ll define it.',
      ar:
        'الشاشات والأجهزة المنزلية ممكن يشتركوا في قالب رفع واحد لأن بعض مهندسي CE بيخدموا الخطين — بس مجموعة المؤشرات مش واحدة واحدة.\n\n' +
        'مؤشرات الشاشات الشائعة:\n' +
        '• SSR · REDO · Chatbot · القطع الأساسية · التدريب · Linkage\n' +
        '• RNPS · ST · MJ · إكمال الإصلاح · Kahoot · حجم الإصلاح · النتيجة النهائية\n\n' +
        'مهم: الشاشات مش بتستخدم HASS في مؤشراتها (HASS بتاع الأجهزة المنزلية).\n' +
        'اسأل عن أي اسم وهعرّفهولك.',
    },
    spoken: {
      en: 'AV KPIs include SSR, REDO, chatbot, core parts, training, RNPS, and Final Result. AV does not use HASS. Ask any name and I will define it.',
      ar: 'مؤشرات الشاشات تشمل إس إس آر، ري دو، الشات بوت، القطع الأساسية، التدريب، آر إن بي إس، والنتيجة النهائية. الشاشات مش بتستخدم هاس. اسأل عن أي اسم.',
    },
    chips: ['av_calc', 'tcs_av', 'da_kpis', 'main_menu'],
  },
  av_calc: {
    replies: {
      en:
        'How AV Final Result is calculated:\n\n' +
        'Same idea as DA — quarter Finals from period KPIs; overall score averages available quarters.\n' +
        'Use Dashboard/Search for live numbers.',
      ar:
        'نتيجة الشاشات النهائية بتتحسب زي فكرة الأجهزة المنزلية تقريباً — نتائج الأرباع من مؤشرات الفترة، والدرجة الكلية متوسط الأرباع المتاحة.\n' +
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
        'PQA يعني جائزة جودة الشريك (Partner Quality Award).\n\n' +
        'كل شهر بيتم ترتيب الشركاء / مراكز الخدمة حسب الأداء — جودة التشغيل ومؤشرات الإصلاح وتجربة العميل.\n\n' +
        'بخلاف تي سي اس (للمهندسين فردي)، بي كيو اي بيركز على أداء المركز / الشريك (الموبايل أو CE).\n\n' +
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
        '• Audit (لحد −5)\n' +
        '• PR — مراجعة السياسة (لحد −5)',
    },
    spoken: {
      en: 'PQA KPIs include LTP, Ex-LTP, REDO, SSR, customer satisfaction, parts accuracy, customer experience, and same-day repair, with Audit and policy review as deductions. I can explain how the score is calculated.',
      ar: 'مؤشرات بي كيو اي تشمل الأداء طويل الأمد، وإعادة الإصلاح، وإس إس آر، ورضا العميل، ودقة القطع، وتجربة العميل، وإصلاح نفس اليوم، مع خصومات التدقيق ومراجعة السياسة.',
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
        'If a ready 0–100 score already exists for the period, SCORA may display that directly.\n' +
        'Partners are ranked monthly from these results.',
      ar:
        'درجة / هدف PQA بتتحسب كده:\n\n' +
        '1) كل مؤشر بيضيف نقاط لحد سقفه.\n' +
        '2) جمّع: LTP + Ex-LTP + REDO + SSR + D-RNPS + OFS + R-CXE + SDR\n' +
        '3) اطرح Audit وPR (خصومات)\n' +
        '4) النتيجة بين 0 و100\n\n' +
        'لو فيه درجة جاهزة (0–100) للفترة، SCORA ممكن يعرضها مباشرة.\n' +
        'الشركاء بيترتبوا شهرياً حسب النتائج دي.',
    },
    spoken: {
      en: 'PQA adds KPI points then subtracts Audit and PR, clamped from 0 to 100. Partners are ranked monthly. Open PQA for live results.',
      ar: 'بي كيو اي بيجمع نقاط المؤشرات ويطرح التدقيق ومراجعة السياسة، والنتيجة من صفر لـ مية. الشركاء بيترتبوا شهرياً. افتح بي كيو اي للنتائج.',
    },
    chips: ['pqa_kpis', 'goto_pqa', 'what_pqa', 'main_menu'],
  },
  cs_org: {
    replies: {
      en:
        'Samsung Egypt Customer Service Head Office structure:\n\n' +
        'Level 1 — HOD: Bishoy Adib\n' +
        'Level 2 — KBM: Donald Jung (senior business management; not a Part Leader or Team Leader)\n\n' +
        'Level 3 — Part Leaders:\n' +
        '1) Service Operation — Mostafa Rady\n' +
        '   Team Leader Field (Mohamed Mohmdy): Mohamed Gamal (CE Field), Ahmed Elshawaf (MX Field)\n' +
        '   Team Leader Technical (Mahmoud Hassan): Mohamed Atef (SAC B2B Tech), Mostafa Amin (DA Tech), Fawzy Maher (MX Tech), George Samir (MX Tech)\n\n' +
        '2) Parts Operation — Ahmed Khalifa\n' +
        '   Planning (Salma Zaki): Fatma Kotb (LCC & Planning)\n' +
        '   Order Desk: Abdelhalim Mohamed (MX), Trez Medhat (VD), Karim Safory (DA)\n' +
        '   Supply Chain (Reda Fathy)\n' +
        '   Warehouse: Emad Salam (UPC+DOA), Mohamed Salah, Ahmed Gamal\n\n' +
        '3) Operation Support — Mohamed Farid\n' +
        '   Warranty (Mohamed Kamal): Ahmed Abozaid, Hajer Ayman\n' +
        '   PR / VD DOA (Reham Samir): Ahmed Bolkiny\n\n' +
        '4) Customer Experience — Emad Ibrahim\n' +
        '   Rehab Mostafa (DA CX), Mina Safwat (MX CX + RNPS), Caty Gamal (VD CX)\n\n' +
        '5) Customer Support — Ahmed Abdelhady\n' +
        '   Mai Elbarany (Digital Service), Ahmed Samir (Call Service + SDF), Ahmed Ayad (VOD + eStore NPS)\n\n' +
        'Ask by name for role details, or ask “who is X’s Team Leader / Part Leader?”',
      ar:
        'هيكل مكتب خدمة عملاء سامسونج مصر:\n\n' +
        'المستوى ١ — رئيس القسم: بيشوي أديب\n' +
        'المستوى ٢ — مسؤول إدارة الأعمال: دونالد جونغ (مش قائد قطاع ولا قائد فريق)\n\n' +
        'المستوى ٣ — قادة القطاعات:\n' +
        '١) عمليات الخدمة — مصطفى راضي\n' +
        '٢) عمليات قطع الغيار — أحمد خليفة\n' +
        '٣) دعم العمليات — محمد فريد\n' +
        '٤) تجربة العملاء — عماد إبراهيم\n' +
        '٥) دعم العملاء — أحمد عبدالهادي\n\n' +
        'اسأل عن أي حد بالاسم، أو اسأل: مين قائد فريق فلان؟ مين قائد قطاع فلان؟',
    },
    spoken: {
      en: 'Samsung Egypt Customer Service is led by Bishoy Adib, with Donald Jung in senior business management, then five parts: Service Operation, Parts Operation, Operation Support, Customer Experience, and Customer Support. Ask a name and I will tell you their role.',
      ar: 'مكتب خدمة العملاء بقيادة بيشوي أديب، ومعاه دونالد جونغ في إدارة الأعمال، وبعدين خمسة قطاعات: عمليات الخدمة، وقطع الغيار، ودعم العمليات، وتجربة العملاء، ودعم العملاء. اسأل بالاسم وأقولك دوره.',
    },
    chips: ['what_scora', 'who_are_you', 'main_menu'],
  },
  how_search: {
    replies: {
      en: 'Open the Search tab → enter engineer code (TCS) or center code (PQA) → view the dossier KPI snapshot.',
      ar: 'افتح تبويب البحث ← اكتب كود المهندس (تي سي اس) أو كود المركز (بي كيو اي) ← هتشوف ملخص الملف.',
    },
    chips: ['goto_search', 'what_tcs', 'what_pqa', 'main_menu'],
  },
  how_tip: {
    replies: {
      en:
        'To finish a technical tip:\n' +
        '1) Open My Knowledge\n' +
        '2) Pick the tip and stay until the timer ends\n' +
        '3) Answer the questions if they appear\n' +
        '4) Tap Complete\n\n' +
        'Want me to open My Knowledge now?',
      ar:
        'عشان تخلّص النصيحة الفنية:\n' +
        '1) افتح لوحة المعرفة\n' +
        '2) اختار النصيحة واستنى لحد ما التايمر يخلّص\n' +
        '3) جاوب الأسئلة لو ظهرت\n' +
        '4) اضغط إكمال\n\n' +
        'تحب أفتح لوحة المعرفة دلوقتي؟',
    },
    spoken: {
      en: 'Open My Knowledge, pick a tip, stay until the timer ends, answer the questions, then tap Complete. Want me to open My Knowledge now?',
      ar: 'افتح لوحة المعرفة، اختار النصيحة، استنى التايمر، جاوب الأسئلة، وبعدين اضغط إكمال. تحب أفتحها دلوقتي؟',
    },
    chips: ['goto_knowledge', 'new_consultant', 'main_menu'],
  },
  knowledge_coach: {
    replies: {
      en:
        'Technical tips live in My Knowledge.\n\n' +
        'I only answer from the tip library (or what I already learned). I can open My Knowledge, or show you how to finish a tip.\n\n' +
        'What do you need?',
      ar:
        'النصائح الفنية موجودة في لوحة المعرفة.\n\n' +
        'بجاوب من مكتبة النصائح فقط (أو اللي اتعلّمته قبل كده). أقدر أفتح لوحة المعرفة، أو أشرحلك إزاي تخلّص النصيحة.\n\n' +
        'تحب أساعدك بإيه؟',
    },
    spoken: {
      en: 'Technical tips live in My Knowledge. I can open it, or show you how to finish a tip. What do you need?',
      ar: 'النصائح في لوحة المعرفة. أقدر أفتحها، أو أشرحلك إزاي تخلّص النصيحة. تحب أساعدك بإيه؟',
    },
    chips: ['goto_knowledge', 'how_tip', 'open_consultant', 'main_menu'],
  },
  goto_knowledge: {
    replies: {
      en: 'Opening My Knowledge…',
      ar: 'بفتح لوحة المعرفة دلوقتي…',
    },
    chips: ['how_tip', 'main_menu'],
    action: 'goto_employee_dashboard',
  },
  new_consultant: {
    replies: {
      en: 'Opening My Knowledge for the new technical tip…',
      ar: 'بفتح لوحة المعرفة للنصيحة الفنية الجديدة…',
    },
    chips: ['how_tip', 'main_menu'],
    action: 'goto_employee_dashboard',
  },
  feedback: {
    replies: {
      en: 'Arabic Feedback collects visitor suggestions — no login required. I can open it for you.',
      ar: 'الملاحظات بتجمع اقتراحات الزوار بالعربي — من غير تسجيل دخول. أقدر أفتحهالك.',
    },
    chips: ['goto_feedback', 'survey', 'main_menu'],
  },
  goto_feedback: {
    replies: {
      en: 'Opening Feedback…',
      ar: 'بفتح الملاحظات دلوقتي…',
    },
    chips: ['survey', 'main_menu'],
    action: 'goto_feedback',
  },
  survey: {
    replies: {
      en: 'The Samsung Academy Survey is a short form in SCORA. I can open it for you.',
      ar: 'استبيان الأكاديمية فورم قصير في سكورا. أقدر أفتحهالك.',
    },
    chips: ['goto_survey', 'feedback', 'main_menu'],
  },
  goto_survey: {
    replies: {
      en: 'Opening the Academy survey…',
      ar: 'بفتح استبيان الأكاديمية دلوقتي…',
    },
    chips: ['feedback', 'main_menu'],
    action: 'goto_survey',
  },
  goto_tcs: {
    replies: {
      en: 'Okay — I’ll walk you to TCS…',
      ar: 'حاضر — هاوديك على تي سي اس دلوقتي…',
    },
    chips: ['what_tcs', 'main_menu'],
    action: 'goto_tcs',
  },
  goto_pqa: {
    replies: {
      en: 'Okay — I’ll walk you to PQA…',
      ar: 'حاضر — هاوديك على بي كيو اي دلوقتي…',
    },
    chips: ['what_pqa', 'main_menu'],
    action: 'goto_pqa',
  },
  goto_search: {
    replies: {
      en: 'Opening Search…',
      ar: 'بفتح البحث دلوقتي…',
    },
    chips: ['how_search', 'main_menu'],
    action: 'goto_search',
  },
  who_are_you: {
    replies: {
      en: "I am GOGO, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, Academy tools, and My Knowledge. What would you like to know?",
      ar: 'أنا اسمي جوجو، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية ولوحة المعرفة. تحب تعرف إيه؟',
    },
    chips: MAIN_CHIPS,
  },
  how_are_you: {
    replies: {
      en: "I'm doing great — thanks for asking! Ready when you are. Want a quick tour of SCORA, TCS, or PQA?",
      ar: 'تمام الحمد لله — متشكر على السؤال! جاهز أساعدك. تحب جولة سريعة على SCORA أو TCS أو PQA؟',
    },
    chips: MAIN_CHIPS,
  },
  what_can_you_do: {
    replies: {
      en: "I can explain SCORA, walk you to TCS or PQA, show how Search works, open Feedback or the Academy survey, and take you to My Knowledge for technical tips.",
      ar: 'أقدر أشرحلك SCORA، وأودّيك لـ TCS أو PQA، وأوضحلك البحث، وأفتحلك الملاحظات أو استبيان الأكاديمية، وأودّيك للوحة المعرفة للنصائح الفنية.',
    },
    chips: ['what_scora', 'goto_tcs', 'goto_pqa', 'how_search', 'goto_knowledge', 'main_menu'],
  },
  nice_to_meet: {
    replies: {
      en: "Nice to meet you too! I am GOGO — glad you're here. What should we look at first?",
      ar: 'وأنا كمان فرحت بمعرفتك! أنا جوجو — مبسوط بوجودك. نبدأ بإيه؟',
    },
    chips: MAIN_CHIPS,
  },
  who_built: {
    replies: {
      en:
        'Fawzy Maher is a Technical Support Engineer at Samsung Egypt — MX Tech under Mahmoud Hassan in Service Operation.\n\n' +
        'He built SCORA so excellence stays fair and visible for the whole CS family: TCS, PQA, Search, Feedback, and more.\n' +
        'Real credit to him for turning that idea into this app — thank you, Fawzy!',
      ar:
        'فوزي ماهر مهندس دعم فني في سامسونج مصر — دعم فني الموبايل تحت محمود حسن ضمن Service Operation.\n\n' +
        'هو اللي بنى SCORA عشان التميز يبقى عادل وواضح لكل عائلة خدمة العملاء: TCS وPQA والبحث والملاحظات وأكتر.\n' +
        'تقدير كبير ليه إنه حوّل الفكرة للتطبيق ده — شكراً يا فوزي!',
    },
    chips: MAIN_CHIPS,
  },
  george_samir: {
    replies: {
      en:
        'George Samir is an MX Technical Engineer at Samsung Egypt Customer Service Head Office. ' +
        'He works in the Technical team led by Mahmoud Hassan under Service Operation.\n\n' +
        "And I'll tell you a little secret… it's Me! Haha!",
      ar:
        'جورج سمير مهندس فني موبايل في مكتب خدمة عملاء سامسونج مصر. ' +
        'بيشتغل في فريق Technical تحت محمود حسن ضمن Service Operation.\n\n' +
        'وهقولك سر صغير… هو أنا! هههه!',
    },
    chips: MAIN_CHIPS,
    expression: 'celebrate',
  },
  denied: {
    replies: {
      en: "I'm sorry — let's keep things positive and friendly. We're here to talk about the Samsung SCORA app (TCS, PQA, Search, Feedback). What would you like to explore?",
      ar: 'آسف — خلّينا نخلي الكلام إيجابي وودي. إحنا هنا بنتكلم عن تطبيق Samsung SCORA (TCS وPQA والبحث والملاحظات). تحب نبدأ بإيه؟',
    },
    chips: MAIN_CHIPS,
  },
  need_name: {
    replies: {
      en: "I'd love to help — tell me your first name first, then we continue.",
      ar: 'حابب أساعدك — قولّي اسمك الأول الأول وبعدين نكمل.',
    },
    chips: [],
  },
  name_invalid: {
    replies: {
      en: 'Hmm, that doesn’t look like a name. Try your first name again?',
      ar: 'مش باين إنه اسم. جرّب اسمك الأول تاني؟',
    },
    chips: [],
  },
};

export const GOGO_BUBBLE = {
  en: "Hi! I'm GOGO 👋\nTap me to chat",
  ar: 'أهلاً! أنا جوجو 👋\nاضغط عليّ لنتحدث',
};

export function getFlowNode(id) {
  return GOGO_FLOW[id] || null;
}

export function resolveFlowReply(nodeId, lang = 'en', name = '', opts = {}) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const employeeLoggedIn = !!opts.employeeLoggedIn;
  const node = getFlowNode(nodeId);
  if (!node) return { reply: '', chips: mainMenuChips(employeeLoggedIn) };
  const friend = name || (L === 'ar' ? 'صاحبنا' : 'friend');
  const spokenRaw = node.spoken?.[L];
  const spoken = typeof spokenRaw === 'function' ? spokenRaw(friend) : (spokenRaw || null);

  if (nodeId === 'cs_org') {
    return {
      reply: buildGoGoOrgPlainText(L),
      spoken,
      chips: decorateGoGoChips(node.chips || MAIN_CHIPS, { employeeLoggedIn }),
      action: node.action,
      nodeId,
      expression: node.expression || null,
    };
  }
  const raw = node.replies[L];
  const reply = typeof raw === 'function' ? raw(friend) : raw;
  const chips = nodeId === 'main_menu'
    ? mainMenuChips(employeeLoggedIn)
    : decorateGoGoChips(node.chips || MAIN_CHIPS, { employeeLoggedIn });
  return {
    reply,
    spoken,
    chips,
    action: node.action,
    nodeId,
    expression: node.expression || null,
  };
}

export function isValidGoGoName(text) {
  const s = String(text || '').trim();
  if (s.length < 2 || s.length > 24) return false;
  if (s.split(/\s+/).length > 3) return false;
  if (/[?؟!0-9@<>/\\]|https?:|www\./i.test(s)) return false;
  if (/password|admin|select\s|drop\s|api\s*key|\.env/i.test(s)) return false;
  // Reject questions / junk words that speech-to-text sometimes captures as a "name"
  if (/^(who|what|where|when|why|how|is|are|the|a|an|samsung|scora|tcs|pqa)\b/i.test(s)) return false;
  if (/trousers|pants|asdf|xxx|test123|qwerty/i.test(s)) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{0,23}$/u.test(s);
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
  if (/who\s*are\s*you|what\s*are\s*you|what'?s\s*your\s*name|مين\s*انت|من\s*أنت|من\s*انت|اسمك\s*ايه|\bgogo\b|\baref\b|\b3aref\b|عارف|جوجو/i.test(raw)) {
    return 'who_are_you';
  }
  if (/how\s*are\s*you|how'?s\s*it\s*going|عامل\s*ايه|ازيك|إزيك|أخبارك|اخبارك/i.test(raw)) {
    return 'how_are_you';
  }
  if (/what\s*can\s*you\s*do|help\s*me|your\s*job|capabilities|تقدر\s*تعمل|تقدر\s*ايه|ممكن\s*تساعد/i.test(raw)) {
    return 'what_can_you_do';
  }
  if (/nice\s*to\s*meet|pleased\s*to\s*meet|تشرفنا|فرصة\s*سعيدة|نورت/i.test(raw)) {
    return 'nice_to_meet';
  }
  if (/who\s*(built|made|created)|مين\s*(بنى|صنع)|من\s*(بنى|صنع)|who\s*developed|مين\s*عمل\s*(التطبيق|سكورا)/i.test(raw)) {
    return 'who_built';
  }
  // Person names (Fawzy, George, Bishoy, …) are answered from the org directory — never dump full structure for “who is X”.
  if (
    /hierarch|org\s*chart|organisation|organization|head\s*office|org\s*structure|structure\s*of\s*(cs|customer)|cs\s*(org|structure|hierarchy)|customer\s*service\s*(org|structure|hierarchy)|هيكل|تسلسل\s*هرمي|منظمة|تنظيمي|مكتب\s*(الرأس|الخدمة|خدمة)|هيكل\s*مكتب/i.test(
      raw,
    )
    && !/^(who\s*is|who's|مين\s*هو|من\s*هو|مين\s+|من\s+)/i.test(raw)
  ) {
    return 'cs_org';
  }
  if (/who\s*is\s*samsung|what\s*is\s*samsung|samsung\s*egypt|سامسونج/i.test(raw)) return 'what_scora';
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
  if (/how\s*(to\s*)?(finish|complete|do)\s*(a\s*)?(tip|consultant)|إزاي\s*(أخلّص|اخلص|أكمل)|طريقة\s*(النصيحة|الاستشارة)/i.test(raw)) {
    return 'how_tip';
  }
  if (/^(consultants?|tips?|technical\s+consultants?|technical\s+tips?|knowledge|my\s+knowledge|استشارة|استشارات|نصيحة|نصائح|معرفة)[.!؟?]*$/i.test(raw.trim())) {
    return 'knowledge_coach';
  }
  if (/my\s*knowledge|technical\s*tip|new\s*consultant|لوحة\s*المعرفة|نصيحة\s*فنية|استشار/i.test(raw)) {
    return 'knowledge_coach';
  }
  if (/open\s*feedback|وديني\s*(على\s*)?الملاحظات/i.test(raw)) return 'goto_feedback';
  if (/feedback|ملاحظات/i.test(raw)) return 'feedback';
  if (/open\s*survey|وديني\s*(على\s*)?الاستبيان/i.test(raw)) return 'goto_survey';
  if (/survey|استبيان|أكاديم/i.test(raw)) return 'survey';
  if (/menu|قائمة|رجوع|back/i.test(raw)) return 'main_menu';
  return null;
}
