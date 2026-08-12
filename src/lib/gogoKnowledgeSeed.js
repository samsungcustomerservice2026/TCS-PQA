/**
 * Seed knowledge for GoGo — SCORA culture, goals, KPIs, ranks.
 * Synced into Firestore gogo_assistant/workspace/{qa,culture}.
 * Public explanations only — never live engineer scores or secrets.
 * Arabic answers use Modern Standard Arabic (فصحى).
 */

export const GOGO_SEED_CULTURE = [
  {
    id: 'origin',
    title_en: 'How SCORA started',
    title_ar: 'SCORA بدأ إزاي',
    body_en:
      'SCORA started as a TCS dashboard for Samsung Egypt service engineers, then grew into one visitor hub for TCS, PQA, feedback, Academy survey, and Scora Challenge.',
    body_ar:
      'SCORA بدأ كلوحة TCS لمهندسي خدمة سامسونج مصر، وبعدين كبر بقى بوابة واحدةحدة للزوار فيها TCS وPQA والملاحظات واستبيان الأكاديمية وScora Challenge.',
    tags: ['history', 'scora', 'culture'],
  },
  {
    id: 'goal',
    title_en: 'Goal of SCORA',
    title_ar: 'هدف SCORA',
    body_en:
      'Make service excellence clear and fair: visible KPIs, earned recognition, and one trusted place for performance and learning.',
    body_ar:
      'الهدف إن التميز في الخدمة يبقى واضح وعادل: مؤشرات ظاهرة، تقدير مستحق، ومكان واحد موثوق للأداء والتعلم.',
    tags: ['goal', 'culture'],
  },
  {
    id: 'journey',
    title_en: 'Product journey',
    title_ar: 'رحلة المنتج',
    body_en:
      'Journey: TCS for engineers → PQA for centers → Arabic feedback & Academy survey → Scora Challenge → more roles across MX / DA / AV.',
    body_ar:
      'الرحلة: تي سي اس للمهندسين ← بي كيو اي للمراكز ← الملاحظات واستبيان الأكاديمية ← Scora Challenge ← أدوار أكتر عبر الموبايل والأجهزة المنزلية والشاشات.',
    tags: ['history', 'journey'],
  },
];

export const GOGO_SEED_QA = [
  {
    id: 'who_are_you',
    keywords: ['who are you', 'your name', 'gogo', 'aref', '3aref', 'عارف', 'مين انت', 'اسمك', 'عرّف', 'مساعد'],
    question_en: 'Who are you?',
    question_ar: 'مين انت؟',
    answer_en:
      'I am AREF, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, and Academy tools.',
    answer_ar:
      'أنا اسمي عارف، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية.',
    category: 'identity',
  },
  {
    id: 'what_is_scora',
    keywords: ['scora', 'app', 'application', 'تطبيق', 'سكورا'],
    question_en: 'What is the SCORA app?',
    question_ar: 'إيه هو تطبيق SCORA؟',
    answer_en:
      'SCORA is Samsung Egypt’s service performance hub. Visitors use TCS, PQA, Feedback, Academy Survey, and Scora Challenge. Ask AREF anytime!',
    answer_ar:
      'SCORA ده مركز أداء خدمة سامسونج مصر. الزوار بيستخدموا TCS وPQA والملاحظات واستبيان الأكاديمية وScora Challenge. اسأل عارف في أي وقت!',
    category: 'overview',
  },
  {
    id: 'what_is_tcs',
    keywords: ['tcs', 'technical capability', 'tier', 'مهندس', 'ترتيب'],
    question_en: 'What is TCS?',
    question_ar: 'إيه هو TCS؟',
    answer_en:
      'TCS (Technical Capability Score) tracks engineer performance by division: MX, DA, and AV. Use Dashboard for winners and Search by engineer code.',
    answer_ar:
      'تي سي اس (درجة القدرة التقنية) بيتابع أداء المهندسين على ٣ أقسام: الموبايل، والأجهزة المنزلية، والشاشات. استخدم لوحة الترتيب للفائزين، أو ابحث بكود المهندس.',
    category: 'tcs',
  },
  {
    id: 'what_is_pqa',
    keywords: ['pqa', 'partner', 'center', 'مراكز', 'جودة'],
    question_en: 'What is PQA?',
    question_ar: 'إيه هو PQA؟',
    answer_en:
      'PQA = Partner Quality Award. Every month partners / service centers are ranked on performance. It is different from TCS engineer scores.',
    answer_ar:
      'PQA = جائزة جودة الشريك. كل شهر بيترتب الشركاء / مراكز الخدمة حسب الأداء. وده مختلف عن درجات مهندسي TCS.',
    category: 'pqa',
  },
  {
    id: 'mx_kpis',
    keywords: ['kpi', 'mx', 'ssr', 'iqc', 'rrr', 'rrr30', 'rrr90', 'مؤشر'],
    question_en: 'What KPIs does MX TCS use?',
    question_ar: 'إيه مؤشرات الموبايل في تي سي اس؟',
    answer_en:
      'MX looks at repair-quality and process KPIs such as SSR (same-symptom return), RRR30/RRR90 (return repair ratio in 30/90 days), IQC Skip, Core Parts, MPU/Multi Parts, Training, DRNPS, Exam, Maintenance Mode, OQC, and Final Result. Ask me any acronym and I’ll define it. Live scores stay in Search/Dashboard.',
    answer_ar:
      'الموبايل بيبص على مؤشرات جودة الإصلاح والشغل زي SSR (رجوع بنفس العَرَض) وRRR30/RRR90 (نسبة إعادة الإصلاح خلال 30/90 يوم) وتخطي IQC والقطع الأساسية وMPU والتدريب وDRNPS والامتحان ووضع الصيانة وOQC والنتيجة النهائية. اسألني عن أي اختصار وهشرحهولك. الدرجات الحية في البحث أو اللوحة.',
    category: 'kpi',
  },
  {
    id: 'da_av_kpis',
    keywords: ['da', 'av', 'rnps', 'chatbot', 'hass', 'redo'],
    question_en: 'What KPIs do DA / AV use?',
    question_ar: 'إيه مؤشرات الأجهزة المنزلية والشاشات؟',
    answer_en:
      'DA and AV may share one template when CE engineers cover both products, but KPI sets differ. DA can include HASS; AV does not. Shared ideas often include Final Result, SSR, REDO, Chatbot, Acc Core Parts, Training, Linkage, RNPS, ST Con, MJ %, Complete Repair, Kahoot, and Repair Volume. Ask any name and I’ll define it.',
    answer_ar:
      'الأجهزة المنزلية والشاشات ممكن يشتركوا في قالب واحد لما مهندسي CE يغطوا الخطين، بس المؤشرات بتختلف. الأجهزة المنزلية ممكن تشمل HASS؛ الشاشات لأ. أفكار مشتركة غالباً: النتيجة النهائية وSSR وREDO وChatbot والقطع الأساسية والتدريب وLinkage وRNPS وST وMJ وإكمال الإصلاح وKahoot وحجم الإصلاح. قول أي اسم وأعرّفهولك.',
    category: 'kpi',
  },
  {
    id: 'samsung_highlights',
    keywords: ['samsung', 'galaxy', 'sales', 'foldable', 'galaxy ai', 'مبيعات', 'جالاكسي'],
    question_en: 'Tell me positive Samsung product and sales highlights',
    question_ar: 'قولّي أبرز إيجابية عن منتجات ومبيعات سامسونج',
    answer_en:
      'Happy to share positive Samsung highlights:\n' +
      '• Galaxy S26 Ultra launched early 2026 (around March) with Galaxy AI — plus S26 / S26+; S26 FE is coming soon.\n' +
      '• Galaxy A multi-models include A17, A27, A37, and A57.\n' +
      '• Latest foldables include Galaxy Z Fold8, Z Fold8 Ultra, and Z Flip8.\n' +
      'And in Egypt, SCORA (TCS / PQA) helps keep after-sales excellence strong!',
    answer_ar:
      'مبسوط أشارك أبرز إيجابية عن سامسونج:\n' +
      '• Galaxy S26 Ultra نزل مطلع 2026 (حوالي مارس) مع Galaxy AI — ومعاه S26 وS26+؛ وS26 FE جاي قريب.\n' +
      '• موديلات Galaxy A تشمل A17 وA27 وA37 وA57.\n' +
      '• أحدث القابلة للطي: Galaxy Z Fold8 وZ Fold8 Ultra وZ Flip8.\n' +
      'وفي مصر SCORA (TCS / PQA) بيدعم تميز ما بعد البيع!',
    category: 'culture',
  },
  {
    id: 'kpi_rrr30',
    keywords: ['rrr30', 'rrr 30', 'return repair', 'نسبة إعادة'],
    question_en: 'What is RRR30?',
    question_ar: 'إيه هو RRR30؟',
    answer_en:
      'RRR30 means Return Repair Ratio in 30 days — the share of units that come back for repair again within 30 days. Lower is better.',
    answer_ar:
      'RRR30 يعني نسبة إعادة الإصلاح خلال 30 يوم — يعني نسبة الأجهزة اللي بترجع تتصلح تاني خلال 30 يوم. كل ما قلت يبقى أحسن.',
    category: 'kpi',
  },
  {
    id: 'cs_org',
    keywords: [
      'hierarchy',
      'org chart',
      'organisation',
      'organization',
      'head office',
      'hod',
      'structure',
      'هيكل',
      'تسلسل',
      'منظمة',
      'مكتب',
      'رئيس',
    ],
    question_en: 'What is the Customer Service Head Office structure?',
    question_ar: 'إيه هيكل مكتب خدمة العملاء؟',
    answer_en:
      'Samsung Egypt CS Head Office is led by HOD Bishoy Adib and KBM Donald Jung (senior business management — not a Part Leader). Five parts: Service Operation (Mostafa Rady), Parts Operation (Ahmed Khalifa), Operation Support (Mohamed Farid), Customer Experience (Emad Ibrahim), Customer Support (Ahmed Abdelhady). Ask by name, or ask who someone’s Team Leader / Part Leader is.',
    answer_ar:
      'مكتب خدمة العملاء بقيادة رئيس القسم بيشوي أديب ومسؤول إدارة الأعمال دونالد جونغ (مش قائد قطاع). خمسة قطاعات: عمليات الخدمة (مصطفى راضي)، عمليات قطع الغيار (أحمد خليفة)، دعم العمليات (محمد فريد)، تجربة العملاء (عماد إبراهيم)، دعم العملاء (أحمد عبدالهادي). اسأل بالاسم، أو مين قائد فريق / قائد قطاع فلان.',
    category: 'org',
  },
  {
    id: 'ranks_tiers',
    keywords: ['rank', 'tier', 'masters', 'title', 'لقب', 'مستوى'],
    question_en: 'What are ranks and tiers?',
    question_ar: 'إيه الترتيب والمستويات؟',
    answer_en:
      'Ranks show order for a period. Tiers/titles are recognition levels from evaluation results. Open Dashboard or Search to see live lists — I will not paste private scoreboards here.',
    answer_ar:
      'الترتيب بيوضح ترتيب الأفراد أو المراكز لفترة معينة. المستويات والألقاب شارات تقدير من نتيجة التقييم. افتح اللوحة أو البحث للقوائم الحية — ومش هعرض درجات خاصة هنا.',
    category: 'ranks',
  },
  {
    id: 'who_built',
    keywords: ['who', 'built', 'developer', 'مين', 'صنع', 'بنى', 'fawzy', 'فوزي'],
    question_en: 'Who built this?',
    question_ar: 'مين بنى التطبيق ده؟',
    answer_en:
      'Fawzy Maher is MX Tech (Mobile technical support) under Team Leader Mahmoud Hassan in Service Operation (Part Leader Mostafa Rady). He built SCORA so excellence stays fair and visible for the whole CS family (TCS, PQA, Search, Feedback, and more). Real credit to him for bringing this hub to life!',
    answer_ar:
      'فوزي ماهر مهندس صيانة قطاع الأجهزة المحمولة تحت قائد الفريق محمود حسن ضمن عمليات الخدمة بقيادة مصطفى راضي. هو اللي بنى سكورا عشان التميز يبقى عادل وواضح لكل عائلة خدمة العملاء. تقدير كبير ليه إنه حوّل الفكرة للتطبيق ده!',
    category: 'culture',
  },
  {
    id: 'goal_scora',
    keywords: ['goal', 'why', 'purpose', 'هدف', 'ليش', 'لماذا'],
    question_en: 'What is the goal?',
    question_ar: 'إيه الهدف؟',
    answer_en:
      'Make excellence visible: fair KPIs, clear recognition, faster coaching, and one trusted home for TCS, PQA, feedback, and learning.',
    answer_ar:
      'الهدف إن التميز يبقى ظاهر: مؤشرات عادلة، تقدير واضح، توجيه أسرع، ومكان واحد موثوق لـ TCS وPQA والملاحظات والتعلم.',
    category: 'culture',
  },
  {
    id: 'how_search',
    keywords: ['search', 'code', 'dossier', 'بحث', 'كود'],
    question_en: 'How do I search?',
    question_ar: 'أبحث إزاي؟',
    answer_en: 'Open Search → enter engineer code (TCS) or center code (PQA) → view the dossier.',
    answer_ar: 'افتح البحث ← اكتب كود المهندس (TCS) أو كود المركز (PQA) ← هتشوف الملف.',
    category: 'howto',
  },
  {
    id: 'feedback_survey',
    keywords: ['feedback', 'survey', 'academy', 'ملاحظات', 'استبيان'],
    question_en: 'What about Feedback and Survey?',
    question_ar: 'والملاحظات والاستبيان؟',
    answer_en:
      'Feedback collects Arabic suggestions. Samsung Academy Survey is a short form on the TCS portal (floating button when enabled).',
    answer_ar:
      'الملاحظات بتجمع اقتراحات الزوار بالعربي. استبيان الأكاديمية فورم قصير على بوابة TCS (الزر الأزرق العائم لما يكون شغال).',
    category: 'howto',
  },
];
