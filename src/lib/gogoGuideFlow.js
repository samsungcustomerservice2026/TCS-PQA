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
    cs_org: 'CS Head Office structure',
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
    cs_org: 'هيكل مكتب خدمة العملاء',
  },
};

const MAIN_CHIPS = ['what_scora', 'what_tcs', 'what_pqa', 'how_search'];

/** @type {Record<string, { replies: Record<GoGoLang, string>, chips: string[], action?: string }>} */
export const GOGO_FLOW = {
  ask_name: {
    replies: {
      en: "Hi! I am GoGo, your AI assistant for SCORA.\n\nWhat's your name?",
      ar: 'أهلاً! أنا GoGo، مساعدك الذكي في SCORA.\n\nاسمك إيه؟',
    },
    chips: [],
  },
  main_menu: {
    replies: {
      en: (name) => `Nice to meet you, ${name}! I'm happy you're here.\n\nWhat would you like to know?`,
      ar: (name) => `تشرفنا يا ${name}! سعيد بوجودك.\n\nتحب تعرف عن إيه؟`,
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
        'KPIs can differ by quarter. Final Result drives ranking, and SCORA often averages available quarter finals. Ask me any KPI name (like RRR30) and I’ll define it.',
      ar:
        'TCS لقسم MX (موبايل) يقيّم مهندسي الميدان على جودة الإصلاح ومؤشرات العملية والتدريب ورأي العميل.\n\n' +
        'المؤشرات قد تختلف حسب الربع. النتيجة النهائية تقود الترتيب، وSCORA غالباً يحسب متوسط نتائج الأرباع المتاحة. اسألني عن أي مؤشر (مثل RRR30) أعرّفه لك.',
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
        'مؤشرات MX الشائعة ومعناها:\n\n' +
        '• SSR — عودة / إعادة بنفس العَرَض\n' +
        '• RRR90 / RRR30 — نسبة إعادة الإصلاح خلال 90 / 30 يوم\n' +
        '• تخطي IQC — تجاوز فحص الجودة الوارد\n' +
        '• القطع الأساسية / PBA / LCD-OCTA — استخدام صحيح للقطع الحرجة\n' +
        '• MPU / Multi Parts — نسبة استخدام قطع متعددة\n' +
        '• التدريب · DRNPS · الامتحان · وضع الصيانة · OQC · النتيجة النهائية\n\n' +
        'اسأل عن أي اختصار لتعريف أوضح. الدرجات الحية في اللوحة أو البحث.',
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
        'كيف تعمل نتيجة MX النهائية:\n\n' +
        '1) لكل فترة نسب و/أو نقاط مؤشرات تغذي النتيجة النهائية.\n' +
        '2) الترتيب غالباً يعتمد متوسط نتائج الأرباع المتاحة.\n' +
        '3) مزيج شائع قديم: حوالي 50% مؤشرات تشغيل + 30% DRNPS + 20% امتحان.\n\n' +
        'افتح البحث بكود المهندس لرؤية الملف الحي.',
    },
    chips: ['mx_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_da: {
    replies: {
      en:
        'DA (Domestic Appliances) TCS tracks appliance engineers on period KPIs and Final Result.\n\n' +
        'Overall TCS often averages available quarter finals. Ask me to define any KPI.',
      ar:
        'TCS لقسم DA (أجهزة منزلية) يتابع مهندسي الأجهزة بمؤشرات الفترة والنتيجة النهائية.\n\n' +
        'الترتيب غالباً متوسط نتائج الأرباع المتاحة. اسألني أعرّف أي مؤشر.',
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
        'مؤشرات DA (شائعة):\n\n' +
        '• SSR — عودة بنفس العَرَض\n' +
        '• REDO — إعادة العمل / الإصلاح\n' +
        '• Chatbot · HASS · القطع الأساسية · التدريب · Linkage\n' +
        '• RNPS — مؤشر توصية الإصلاح\n' +
        '• ST · MJ % · إكمال الإصلاح · Kahoot · حجم الإصلاح · النتيجة النهائية\n\n' +
        'ملاحظة: DA وAV قد يشتركان في قالب واحد لمهندسي CE، لكن HASS ضمن DA وليس ضمن AV.\n' +
        'قول اسم المؤشر وأعرّفه لك.',
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
        'كيف تُحسب نتيجة DA النهائية:\n\n' +
        '• مؤشرات الفترة تغذي نتيجة كل ربع.\n' +
        '• درجة TCS المعروضة غالباً متوسط نتائج الأرباع المتاحة.\n\n' +
        'افتح البحث بكود المهندس لرؤية الملف الحي.',
    },
    chips: ['da_kpis', 'goto_tcs', 'what_tcs', 'main_menu'],
  },
  tcs_av: {
    replies: {
      en:
        'AV TCS uses the same style of period KPIs as DA/AV evaluations, mapped to the AV division.\n\n' +
        'Explore KPI meanings or how Final Result is calculated next.',
      ar:
        'TCS لقسم AV يستخدم نفس أسلوب مؤشرات الفترة مثل تقييمات DA/AV ويرتبط بقسم AV.\n\n' +
        'بعدها تقدر تشوف معاني المؤشرات أو طريقة حساب النتيجة النهائية.',
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
        'AV وDA قد يشتركان في قالب رفع واحد لأن بعض مهندسي CE يخدمون المنتجين — لكن مجموعة المؤشرات ليست واحدة واحدة.\n\n' +
        'مؤشرات AV (شائعة):\n' +
        '• SSR · REDO · Chatbot · القطع الأساسية · التدريب · Linkage\n' +
        '• RNPS · ST · MJ · إكمال الإصلاح · Kahoot · حجم الإصلاح · النتيجة النهائية\n\n' +
        'مهم: AV لا يستخدم HASS ضمن مؤشراته (HASS مؤشر جانب DA).\n' +
        'اسأل عن أي اسم وأعرّفه.',
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
        'كيف تُحسب نتيجة AV النهائية:\n\n' +
        'نفس فكرة DA — نتائج الأرباع من مؤشرات الفترة، والدرجة الكلية متوسط الأرباع المتاحة.\n' +
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
        'If a ready 0–100 score already exists for the period, SCORA may display that directly.\n' +
        'Partners are ranked monthly from these results.',
      ar:
        'كيف تُحسب درجة / هدف PQA:\n\n' +
        '1) كل مؤشر يضيف نقاطاً حتى حده الأقصى.\n' +
        '2) اجمع: LTP + Ex-LTP + REDO + SSR + D-RNPS + OFS + R-CXE + SDR\n' +
        '3) اطرح Audit وPR (خصومات)\n' +
        '4) النتيجة بين 0 و100\n\n' +
        'لو فيه درجة جاهزة (0–100) للفترة قد يعرضها SCORA مباشرة.\n' +
        'يتم ترتيب الشركاء شهرياً بناءً على هذه النتائج.',
    },
    chips: ['pqa_kpis', 'goto_pqa', 'what_pqa', 'main_menu'],
  },
  cs_org: {
    replies: {
      en:
        'Samsung Egypt Customer Service Head Office structure:\n\n' +
        'Leadership: Bishoy Adib (HOD) · Donald Jung (KBM)\n\n' +
        '1) Service Operation — Mostafa Rady\n' +
        '   Field (Mohamed Mohmdy): Mohamed Gamal (CE Field), Ahmed Elsawaf (MX Field)\n' +
        '   Technical (Mahmoud Hassan): Mohamed Atef (VD/B2B Tech · System AC B2B Tech), Mostafa Amin (DA Tech), Fawzy Maher (MX Tech), George Samir (MX Tech)\n\n' +
        '2) Parts Operation — Ahmed Khalifa\n' +
        '   Planning: Salma Zaki, Fatma Kotb\n' +
        '   Order Desk: Abdelhalim Mohamed (MX), Trez Medhat (VD), Karim Safory (DA)\n' +
        '   Supply Chain: Reda Fathy\n' +
        '   Warehouse: Emad Salam (UPC+DOA), Mohamed Salah, Ahmed Gamal\n\n' +
        '3) Operation Support — Mohamed Farid\n' +
        '   Warranty: Mohamed Kamal, Ahmed Abozaid, Hajer Ayman\n' +
        '   PR/DOA: Reham Samir, Ahmed Bolkiny\n\n' +
        '4) Customer Experience — Emad Ibrahim\n' +
        '   Rehab Mostafa (DA CX), Mina Safwat (MX CX + RNPS), Caty Gamal (VD CX)\n\n' +
        '5) Customer Support — Ahmed Abdelhady\n' +
        '   Mai Elbarany (Digital SVC), Ahmed Samir (Call SVC + SDF), Ahmed Ayad (VOD + eStore NPS)',
      ar:
        'هيكل مكتب خدمة عملاء سامسونج مصر:\n\n' +
        'القيادة: بيشوي أديب (HOD) · دونالد جونغ (KBM)\n\n' +
        '1) Service Operation — مصطفى راضي\n' +
        '2) Parts Operation — أحمد خليفة\n' +
        '3) Operation Support — محمد فريد\n' +
        '4) Customer Experience — عماد إبراهيم\n' +
        '5) Customer Support — أحمد عبدالهادي\n\n' +
        'اسأل عن أي محور بالإنجليزي وأفصّل لك أسماء الفرق.',
    },
    chips: ['what_scora', 'who_are_you', 'main_menu'],
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
  who_are_you: {
    replies: {
      en: "I am GoGo, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, and Academy tools. What would you like to know?",
      ar: 'أنا GoGo، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية. تحب تعرف إيه؟',
    },
    chips: MAIN_CHIPS,
  },
  how_are_you: {
    replies: {
      en: "I'm doing great — thanks for asking! Ready when you are. Want a quick tour of SCORA, TCS, or PQA?",
      ar: 'تمام الحمد لله — شكراً لسؤالك! جاهز أساعدك. تحب جولة سريعة على SCORA أو TCS أو PQA؟',
    },
    chips: MAIN_CHIPS,
  },
  what_can_you_do: {
    replies: {
      en: "I can explain SCORA, walk you to TCS or PQA, show how Search works, and point you to Feedback or the Academy survey. Just ask in plain words!",
      ar: 'أقدر أشرح SCORA، وأودّيك لـ TCS أو PQA، وأوضح البحث، وأفتح لك الملاحظات أو استبيان الأكاديمية. قولّي اللي محتاجه بكلام بسيط!',
    },
    chips: ['what_scora', 'goto_tcs', 'goto_pqa', 'how_search', 'main_menu'],
  },
  nice_to_meet: {
    replies: {
      en: "Nice to meet you too! I am GoGo — glad you're here. What should we look at first?",
      ar: 'وأنا كمان فرحت بمعرفتك! أنا GoGo — سعيد بوجودك. نبدأ بإيه؟',
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
        'فوزي ماهر مهندس دعم فني في سامسونج مصر — MX Tech تحت محمود حسن ضمن Service Operation.\n\n' +
        'هو اللي بنى SCORA عشان التميز يكون عادل وواضح لكل عائلة خدمة العملاء: TCS وPQA والبحث والملاحظات وأكتر.\n' +
        'تقدير كبير ليه إنه حوّل الفكرة للتطبيق ده — شكراً فوزي!',
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
        'جورج سمير مهندس MX فني في مكتب خدمة عملاء سامسونج مصر. ' +
        'بيشتغل في فريق Technical تحت محمود حسن ضمن Service Operation.\n\n' +
        'وهقولك سر صغير… هو أنا! هههه!',
    },
    chips: MAIN_CHIPS,
    expression: 'celebrate',
  },
  denied: {
    replies: {
      en: "I'm sorry — let's keep things positive and friendly. We're here to talk about the Samsung SCORA app (TCS, PQA, Search, Feedback). What would you like to explore?",
      ar: 'آسف — خلّينا نخلي الحوار إيجابي وودي. إحنا هنا نتكلم عن تطبيق Samsung SCORA (TCS وPQA والبحث والملاحظات). تحب نبدأ بإيه؟',
    },
    chips: MAIN_CHIPS,
  },
  need_name: {
    replies: {
      en: "I'd love to help — tell me your first name first, then we continue.",
      ar: 'حابب أساعدك — قولّي اسمك الأول وبعدين نكمل.',
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
  // Always serve the canonical org tree (same on local + live once code is deployed).
  if (nodeId === 'cs_org') {
    return {
      reply: buildGoGoOrgPlainText(L),
      chips: node.chips || MAIN_CHIPS,
      action: node.action,
      nodeId,
      expression: node.expression || null,
    };
  }
  const raw = node.replies[L];
  const reply = typeof raw === 'function' ? raw(name || (L === 'ar' ? 'صديقنا' : 'friend')) : raw;
  return {
    reply,
    chips: node.chips || MAIN_CHIPS,
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
  if (/who\s*are\s*you|what\s*are\s*you|what'?s\s*your\s*name|مين\s*انت|من\s*أنت|من\s*انت|اسمك\s*ايه|\bgogo\b/i.test(raw)) {
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
  // Person names (Fawzy, George, …) are answered from the org directory in GoGoAssistant — not here.
  if (
    /hierarch|org\s*chart|organisation|organization|head\s*office|org\s*structure|structure\s*of\s*(cs|customer)|cs\s*(org|structure|hierarchy)|customer\s*service\s*(org|structure|hierarchy)|هيكل|تسلسل|منظمة|تنظيمي|مكتب\s*(الرأس|الخدمة|خدمة)|رئيس\s*القسم|hod\b|kbm\b|service\s*operation|parts\s*operation|bishoy|بيشوي/i.test(
      raw,
    )
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
  if (/feedback|ملاحظات/i.test(raw)) return 'feedback';
  if (/survey|استبيان|أكاديم/i.test(raw)) return 'survey';
  if (/menu|قائمة|رجوع|back/i.test(raw)) return 'main_menu';
  return null;
}
