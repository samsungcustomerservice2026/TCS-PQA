/**
 * Seed knowledge for GoGo — SCORA culture, goals, KPIs, ranks.
 * Synced into Firestore gogo_assistant/workspace/{qa,culture}.
 * Public explanations only — never live engineer scores or secrets.
 */

export const GOGO_SEED_CULTURE = [
  {
    id: 'origin',
    title_en: 'How SCORA started',
    title_ar: 'كيف بدأ SCORA',
    body_en:
      'SCORA started as a TCS dashboard for Samsung Egypt service engineers, then grew into one visitor hub for TCS, PQA, feedback, Academy survey, and Scora Challenge.',
    body_ar:
      'بدأ SCORA كلوحة TCS لمهندسي خدمة سامسونج مصر، ثم أصبح بوابة واحدةحدة للزوار تشمل TCS وPQA والملاحظات واستبيان الأكاديمية وScora Challenge.',
    tags: ['history', 'scora', 'culture'],
  },
  {
    id: 'goal',
    title_en: 'Goal of SCORA',
    title_ar: 'هدف SCORA',
    body_en:
      'Make service excellence clear and fair: visible KPIs, earned recognition, and one trusted place for performance and learning.',
    body_ar:
      'الهدف إن التميز في الخدمة يكون واضح وعادل: مؤشرات ظاهرة، تقدير مستحق، ومكان واحد موثوق للأداء والتعلم.',
    tags: ['goal', 'culture'],
  },
  {
    id: 'journey',
    title_en: 'Product journey',
    title_ar: 'رحلة المنتج',
    body_en:
      'Journey: TCS for engineers → PQA for centers → Arabic feedback & Academy survey → Scora Challenge → more roles and unified MX/DA/AV Excel formats.',
    body_ar:
      'الرحلة: TCS للمهندسين ← PQA للمراكز ← الملاحظات واستبيان الأكاديمية ← Scora Challenge ← أدوار إضافية وصيغ Excel موحدة لـ MX وDA وAV.',
    tags: ['history', 'journey'],
  },
];

export const GOGO_SEED_QA = [
  {
    id: 'who_are_you',
    keywords: ['who are you', 'your name', 'gogo', 'مين انت', 'اسمك', 'عرّف', 'مساعد'],
    question_en: 'Who are you?',
    question_ar: 'مين انت؟',
    answer_en:
      'I am GoGo, your AI assistant. I help you around SCORA — TCS, PQA, Search, Feedback, and Academy tools.',
    answer_ar:
      'أنا GoGo، مساعدك الذكي. بساعدك في SCORA — TCS وPQA والبحث والملاحظات وأدوات الأكاديمية.',
    category: 'identity',
  },
  {
    id: 'what_is_scora',
    keywords: ['scora', 'app', 'application', 'تطبيق', 'سكورا'],
    question_en: 'What is the SCORA app?',
    question_ar: 'ما هو تطبيق SCORA؟',
    answer_en:
      'SCORA is Samsung Egypt’s service performance hub. Visitors use TCS, PQA, Feedback, Academy Survey, and Scora Challenge. Ask GoGo anytime!',
    answer_ar:
      'SCORA هو مركز أداء خدمة سامسونج مصر. الزوار يستخدمون TCS وPQA والملاحظات واستبيان الأكاديمية وScora Challenge. اسأل GoGo في أي وقت!',
    category: 'overview',
  },
  {
    id: 'what_is_tcs',
    keywords: ['tcs', 'technical capability', 'tier', 'مهندس', 'ترتيب'],
    question_en: 'What is TCS?',
    question_ar: 'ما هو TCS؟',
    answer_en:
      'TCS (Technical Capability Score) tracks engineer performance by division: MX, DA, and AV. Use Dashboard for winners and Search by engineer code.',
    answer_ar:
      'TCS (درجة القدرة التقنية) يتابع أداء المهندسين حسب القسم: MX وDA وAV. استخدم لوحة الترتيب للفائزين، أو ابحث بكود المهندس.',
    category: 'tcs',
  },
  {
    id: 'what_is_pqa',
    keywords: ['pqa', 'partner', 'center', 'مراكز', 'جودة'],
    question_en: 'What is PQA?',
    question_ar: 'ما هو PQA؟',
    answer_en:
      'PQA = Partner Quality Award. Every month partners / service centers are ranked on performance. It is different from TCS engineer scores.',
    answer_ar:
      'PQA = جائزة جودة الشريك. كل شهر يتم ترتيب الشركاء / مراكز الخدمة حسب الأداء. وهو مختلف عن درجات مهندسي TCS.',
    category: 'pqa',
  },
  {
    id: 'mx_kpis',
    keywords: ['kpi', 'mx', 'ssr', 'iqc', 'rrr', 'مؤشر'],
    question_en: 'What KPIs does MX TCS use?',
    question_ar: 'ما مؤشرات MX في TCS؟',
    answer_en:
      'MX KPIs change by quarter. Common examples: SSR, RRR90, IQC Skip, Core Parts, MPU, Training, DRNPS, Exam, and Final Result. Live scores are in Search/Dashboard — I explain concepts only.',
    answer_ar:
      'مؤشرات MX تتغير حسب الربع. أمثلة شائعة: SSR وRRR90 وتخطي IQC والقطع الأساسية وMPU والتدريب وDRNPS والامتحان والنتيجة النهائية. الدرجات الحية موجودة في البحث أو اللوحة — أنا أشرح الفكرة فقط.',
    category: 'kpi',
  },
  {
    id: 'da_av_kpis',
    keywords: ['da', 'av', 'rnps', 'chatbot', 'hass', 'redo'],
    question_en: 'What KPIs do DA / AV use?',
    question_ar: 'ما مؤشرات DA و AV؟',
    answer_en:
      'DA/AV use Q1/Q2 sheets. Q1 often includes Final, SSR, REDO, Chatbot, HASS, Acc Core Parts, Training, Linkage. Q2 often includes Final, RNPS, REDO, Training, ST Con, MJ %, Complete Repair, Kahoot, HASS, Repair Volume.',
    answer_ar:
      'DA وAV يستخدمان ورقة Q1 وQ2. غالباً في Q1: النتيجة وSSR وREDO وChatbot وHASS والقطع الأساسية والتدريب وLinkage. وفي Q2: النتيجة وRNPS وإعادة العمل والتدريب وST وMJ وإكمال الإصلاح وKahoot وHASS وحجم الإصلاح.',
    category: 'kpi',
  },
  {
    id: 'ranks_tiers',
    keywords: ['rank', 'tier', 'masters', 'title', 'لقب', 'مستوى'],
    question_en: 'What are ranks and tiers?',
    question_ar: 'ما الترتيب والمستويات؟',
    answer_en:
      'Ranks show order for a period. Tiers/titles are recognition levels from evaluation results. Open Dashboard or Search to see live lists — I will not paste private scoreboards here.',
    answer_ar:
      'الترتيب يوضح ترتيب الأفراد أو المراكز لفترة معينة. المستويات والألقاب شارات تقدير من نتيجة التقييم. افتح اللوحة أو البحث لرؤية القوائم الحية — ولن أعرض لوحات درجات خاصة هنا.',
    category: 'ranks',
  },
  {
    id: 'who_built',
    keywords: ['who', 'built', 'developer', 'مين', 'صنع', 'بنى', 'fawzy', 'فوزي'],
    question_en: 'Who built this?',
    question_ar: 'من بنى هذا التطبيق؟',
    answer_en: 'Eng Fawzy — Technical Support Engineer at Samsung Egypt.',
    answer_ar: 'المهندس فوزي — مهندس دعم فني في سامسونج مصر.',
    category: 'culture',
  },
  {
    id: 'goal_scora',
    keywords: ['goal', 'why', 'purpose', 'هدف', 'ليش', 'لماذا'],
    question_en: 'What is the goal?',
    question_ar: 'ما هو الهدف؟',
    answer_en:
      'Make excellence visible: fair KPIs, clear recognition, faster coaching, and one trusted home for TCS, PQA, feedback, and learning.',
    answer_ar:
      'الهدف إن التميز يكون ظاهر: مؤشرات عادلة، تقدير واضح، توجيه أسرع، ومكان واحد موثوق لـ TCS وPQA والملاحظات والتعلم.',
    category: 'culture',
  },
  {
    id: 'how_search',
    keywords: ['search', 'code', 'dossier', 'بحث', 'كود'],
    question_en: 'How do I search?',
    question_ar: 'كيف أبحث؟',
    answer_en: 'Open Search → enter engineer code (TCS) or center code (PQA) → view the dossier.',
    answer_ar: 'افتح البحث ← أدخل كود المهندس (TCS) أو كود المركز (PQA) ← شاهد الملف.',
    category: 'howto',
  },
  {
    id: 'feedback_survey',
    keywords: ['feedback', 'survey', 'academy', 'ملاحظات', 'استبيان'],
    question_en: 'What about Feedback and Survey?',
    question_ar: 'ماذا عن الملاحظات والاستبيان؟',
    answer_en:
      'Feedback collects Arabic suggestions. Samsung Academy Survey is a short form on the TCS portal (floating button when enabled).',
    answer_ar:
      'الملاحظات تجمع اقتراحات الزوار بالعربية. استبيان الأكاديمية نموذج قصير في بوابة TCS (الزر الأزرق العائم عند تفعيله).',
    category: 'howto',
  },
];
