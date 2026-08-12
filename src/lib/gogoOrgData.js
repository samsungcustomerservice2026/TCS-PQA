/**
 * Official CS Head Office org data + bilingual briefs (source of truth for GoGo).
 * Hierarchy: HOD → KBM → Part Leader → Team Leader → Team Member.
 */

export const GOGO_BUSINESS_MAP = Object.freeze({
  MX: { en: 'Mobile', ar: 'قطاع الأجهزة المحمولة' },
  DA: { en: 'Home Appliances', ar: 'قطاع الأجهزة المنزلية' },
  AV: { en: 'Audio Visual', ar: 'قطاع الشاشات والمنتجات السمعية والبصرية' },
  VD: { en: 'Audio Visual', ar: 'قطاع الشاشات والمنتجات السمعية والبصرية' },
});

export const GOGO_CS_ORG = {
  title_en: 'Samsung Egypt Customer Service — Head Office structure',
  title_ar: 'هيكل مكتب خدمة عملاء سامسونج مصر',
  summary_en:
    'Customer Service Head Office is led by the HOD and KBM, then five parts: Service Operation, Parts Operation, Operation Support, Customer Experience, and Customer Support.',
  summary_ar:
    'مكتب خدمة العملاء يقوده رئيس القسم ومسؤول إدارة الأعمال، ثم خمسة قطاعات: عمليات الخدمة، وعمليات قطع الغيار، ودعم العمليات، وتجربة العملاء، ودعم العملاء.',
  leaders: [
    { name: 'Bishoy Adib', role: 'HOD', level: 'hod' },
    { name: 'Donald Jung', role: 'KBM', level: 'kbm' },
  ],
  pillars: [
    {
      name: 'Service Operation',
      name_ar: 'عمليات الخدمة',
      head: 'Mostafa Rady',
      teams: [
        {
          name: 'Field',
          name_ar: 'الخدمة الميدانية',
          lead: 'Mohamed Mohmdy',
          members: [
            { name: 'Mohamed Gamal', role: 'CE Field' },
            { name: 'Ahmed Elshawaf', role: 'MX Field' },
          ],
        },
        {
          name: 'Technical',
          name_ar: 'الدعم الفني',
          lead: 'Mahmoud Hassan',
          members: [
            { name: 'Mohamed Atef', role: 'SAC B2B Tech' },
            { name: 'Mostafa Amin', role: 'DA Tech' },
            { name: 'Fawzy Maher', role: 'MX Tech' },
            { name: 'George Samir', role: 'MX Tech' },
          ],
        },
      ],
    },
    {
      name: 'Parts Operation',
      name_ar: 'عمليات قطع الغيار',
      head: 'Ahmed Khalifa',
      teams: [
        {
          name: 'Planning',
          name_ar: 'التخطيط',
          lead: 'Salma Zaki',
          members: [{ name: 'Fatma Kotb', role: 'LCC & Planning' }],
        },
        {
          name: 'Order Desk',
          name_ar: 'مكتب الطلبات',
          lead: null,
          members: [
            { name: 'Abdelhalim Mohamed', role: 'MX Order Desk' },
            { name: 'Trez Medhat', role: 'VD Order Desk' },
            { name: 'Karim Safory', role: 'DA Order Desk' },
          ],
        },
        {
          name: 'Supply Chain',
          name_ar: 'سلسلة الإمداد',
          lead: 'Reda Fathy',
          members: [],
        },
        {
          name: 'Warehouse',
          name_ar: 'المخازن',
          lead: null,
          members: [
            { name: 'Emad Salam', role: 'UPC + DOA Warehouse' },
            { name: 'Mohamed Salah', role: 'Main Warehouse' },
            { name: 'Ahmed Gamal', role: 'Main Warehouse' },
          ],
        },
      ],
    },
    {
      name: 'Operation Support',
      name_ar: 'دعم العمليات',
      head: 'Mohamed Farid',
      teams: [
        {
          name: 'Warranty',
          name_ar: 'الضمان',
          lead: 'Mohamed Kamal',
          members: [
            { name: 'Ahmed Abozaid', role: 'Warranty' },
            { name: 'Hajer Ayman', role: 'Warranty' },
          ],
        },
        {
          name: 'PR / VD DOA',
          name_ar: 'إرجاع المنتج وحالات الشاشات',
          lead: 'Reham Samir',
          members: [{ name: 'Ahmed Bolkiny', role: 'PR Operation' }],
        },
      ],
    },
    {
      name: 'Customer Experience',
      name_ar: 'تجربة العملاء',
      head: 'Emad Ibrahim',
      teams: [
        {
          name: 'DA CX',
          name_ar: 'تجربة العملاء للأجهزة المنزلية',
          lead: 'Rehab Mostafa',
          members: [],
        },
        {
          name: 'MX CX + RNPS',
          name_ar: 'تجربة العملاء للأجهزة المحمولة ومؤشر التوصية',
          lead: 'Mina Safwat',
          members: [],
        },
        {
          name: 'VD CX',
          name_ar: 'تجربة العملاء للشاشات',
          lead: 'Caty Gamal',
          members: [],
        },
      ],
    },
    {
      name: 'Customer Support',
      name_ar: 'دعم العملاء',
      head: 'Ahmed Abdelhady',
      teams: [
        {
          name: 'Digital Service',
          name_ar: 'الخدمات الرقمية',
          lead: 'Mai Elbarany',
          members: [],
        },
        {
          name: 'Call Service + SDF',
          name_ar: 'خدمات المكالمات وعمليات SDF',
          lead: 'Ahmed Samir',
          members: [],
        },
        {
          name: 'VOD + eStore NPS',
          name_ar: 'فيديو حسب الطلب ومؤشر رضا المتجر الإلكتروني',
          lead: 'Ahmed Ayad',
          members: [],
        },
      ],
    },
  ],
};

/** Official EN/AR descriptions (position line comes from hierarchy; these are the “what they do” paragraphs). */
export const GOGO_ORG_PERSON_BRIEFS = Object.freeze({
  'Bishoy Adib': {
    en: 'Head of Department responsible for the overall leadership, management, performance, and strategic direction of the Customer Service organization. The HOD oversees the different business functions and ensures alignment between operational activities, people, performance, and organizational objectives.',
    ar: 'رئيس القسم، وهو المسؤول عن القيادة والإدارة الشاملة لمنظمة خدمة العملاء، ومتابعة الأداء والتوجهات الاستراتيجية. ويشرف على مختلف قطاعات العمل، ويضمن التكامل بين العمليات والموظفين ومؤشرات الأداء والأهداف التنظيمية.',
  },
  'Donald Jung': {
    en: 'KBM and a member of the senior leadership structure. Responsible for business-level coordination, organizational alignment, and supporting the effective management of the different Customer Service functions.',
    ar: 'مسؤول إدارة الأعمال وعضو ضمن الهيكل القيادي الأعلى، ويتولى تنسيق الأعمال على مستوى المنظمة، وتحقيق التكامل بين قطاعات العمل المختلفة، ودعم الإدارة الفعالة لوظائف خدمة العملاء المختلفة.',
  },
  'Mostafa Rady': {
    en: 'Part Leader for Service Operation. Responsible for leading service-operation activities and overseeing both field-service and technical-service functions.',
    ar: 'قائد قطاع عمليات الخدمة، ويتولى قيادة أنشطة عمليات الخدمة والإشراف على وظائف الخدمة الميدانية والدعم الفني، وضمان كفاءة تنفيذ العمليات وتحقيق أهداف الخدمة.',
  },
  'Mohamed Mohmdy': {
    en: 'Team Leader for Field Service activities within Service Operation. Responsible for coordinating field-service activities and supporting the teams working in the field.',
    ar: 'قائد فريق الخدمة الميدانية ضمن عمليات الخدمة، ويتولى تنسيق أنشطة الخدمة الميدانية ودعم الفرق العاملة خارج مراكز الخدمة.',
  },
  'Mohamed Gamal': {
    en: 'Works in Customer Experience Field activities, supporting customer-experience operations and service quality in the field.',
    ar: 'يعمل في مجال تجربة العملاء ميدانيًا، ويساهم في متابعة تجربة العملاء وجودة الخدمة وتحسينها في الميدان.',
  },
  'Ahmed Elshawaf': {
    en: 'Works in field-service activities for the Mobile business, supporting mobile-device service operations in the field.',
    ar: 'يعمل في أنشطة الخدمة الميدانية الخاصة بقطاع الأجهزة المحمولة، ويساهم في دعم ومتابعة عمليات خدمة الأجهزة المحمولة ميدانيًا.',
  },
  'Mahmoud Hassan': {
    en: 'Team Leader for Technical Service within Service Operation. Responsible for coordinating technical activities and supporting the technical specialists covering different business categories.',
    ar: 'قائد فريق الدعم الفني ضمن عمليات الخدمة، ويتولى تنسيق الأنشطة الفنية والإشراف على المتخصصين الفنيين الذين يدعمون قطاعات العمل المختلفة.',
  },
  'Mohamed Atef': {
    en: 'Provides technical support for SAC B2B activities and related technical operations.',
    ar: 'يعمل في مجال الدعم الفني لأنشطة التكييف المؤسسي بين الشركات، ويتولى تقديم الدعم الفني ومتابعة العمليات الفنية المرتبطة بقطاع الأعمال بين الشركات.',
  },
  'Mostafa Amin': {
    en: 'Provides technical support for the Home Appliances business and supports technical service activities related to home-appliance products.',
    ar: 'مسؤول عن الدعم الفني لقطاع الأجهزة المنزلية، ويتولى دعم الأنشطة الفنية والخدمية المتعلقة بمنتجات الأجهزة المنزلية.',
  },
  'Fawzy Maher': {
    en: 'Provides technical support for the Mobile business and supports technical service activities related to mobile devices.',
    ar: 'مسؤول عن الدعم الفني لقطاع الأجهزة المحمولة، ويتولى دعم الأنشطة الفنية والخدمية المتعلقة بالأجهزة المحمولة.',
  },
  'George Samir': {
    en: 'Provides technical support for the Mobile business and supports technical service activities related to mobile devices.',
    ar: 'مسؤول عن الدعم الفني لقطاع الأجهزة المحمولة، ويتولى دعم الأنشطة الفنية والخدمية المتعلقة بالأجهزة المحمولة.',
  },
  'Ahmed Khalifa': {
    en: 'Part Leader for Parts Operation. Responsible for overseeing parts planning, order-desk activities, supply-chain operations, and warehouse activities.',
    ar: 'قائد قطاع عمليات قطع الغيار، ويتولى الإشراف على التخطيط وعمليات مكاتب الطلبات وسلسلة الإمداد وأنشطة المخازن الخاصة بقطع الغيار.',
  },
  'Salma Zaki': {
    en: 'Leads Planning activities within Parts Operation and coordinates planning-related activities.',
    ar: 'تقود أنشطة التخطيط ضمن عمليات قطع الغيار، وتتولى تنسيق ومتابعة الأعمال المتعلقة بالتخطيط.',
  },
  'Fatma Kotb': {
    en: 'Supports LCC and Planning activities within Parts Operation.',
    ar: 'تعمل في مجال مركز التحكم اللوجستي والتخطيط ضمن عمليات قطع الغيار، وتدعم الأنشطة المتعلقة بالتخطيط ومركز التحكم اللوجستي.',
  },
  'Abdelhalim Mohamed': {
    en: 'Handles order-desk activities for the Mobile business, including order processing and follow-up.',
    ar: 'يعمل في مكتب طلبات قطاع الأجهزة المحمولة، ويتولى معالجة الطلبات ومتابعتها والتنسيق بشأنها.',
  },
  'Trez Medhat': {
    en: 'Handles order-desk activities related to VD, including order processing and follow-up.',
    ar: 'تعمل في مكتب طلبات قطاع الشاشات، وتتولى معالجة الطلبات ومتابعتها والتنسيق بشأنها.',
  },
  'Karim Safory': {
    en: 'Handles order-desk activities for the Home Appliances business, including order processing and follow-up.',
    ar: 'يعمل في مكتب طلبات قطاع الأجهزة المنزلية، ويتولى معالجة الطلبات ومتابعتها والتنسيق بشأنها.',
  },
  'Reda Fathy': {
    en: 'Leads Supply Chain activities within Parts Operation and coordinates supply-chain operations related to parts.',
    ar: 'يقود أنشطة سلسلة الإمداد ضمن عمليات قطع الغيار، ويتولى تنسيق ومتابعة العمليات المتعلقة بتوفير وتدفق قطع الغيار.',
  },
  'Emad Salam': {
    en: 'Handles warehouse activities related to UPC and DOA processes.',
    ar: 'يتولى أنشطة المخزن المتعلقة بإجراءات القطع الخاضعة للرقابة والقطع التالفة عند الوصول ومتابعة العمليات المخزنية المرتبطة بها.',
  },
  'Mohamed Salah': {
    en: 'Handles activities and operations within the Main Warehouse.',
    ar: 'يتولى أنشطة وعمليات المخزن الرئيسي، ويدعم حركة وإدارة العمليات المخزنية.',
  },
  'Ahmed Gamal': {
    en: 'Supports activities and operations within the Main Warehouse.',
    ar: 'يعمل ضمن فريق المخزن الرئيسي، ويساهم في دعم ومتابعة العمليات والأنشطة المخزنية.',
  },
  'Mohamed Farid': {
    en: 'Part Leader for Operation Support. Responsible for leading operational-support activities and coordinating service-support functions.',
    ar: 'قائد قطاع دعم العمليات، ويتولى قيادة أنشطة دعم العمليات والتنسيق بين وظائف الدعم المختلفة لضمان كفاءة وسلاسة عمليات الخدمة.',
  },
  'Mohamed Kamal': {
    en: 'Team Leader for Warranty activities, responsible for coordinating warranty operations and related service cases.',
    ar: 'قائد فريق الضمان، ويتولى تنسيق عمليات الضمان ومتابعة الحالات والخدمات المرتبطة بالضمان.',
  },
  'Ahmed Abozaid': {
    en: 'Supports Warranty activities and follows up on warranty-related service cases.',
    ar: 'يعمل ضمن فريق الضمان، ويساهم في دعم عمليات الضمان ومتابعة الحالات المتعلقة بخدمات الضمان.',
  },
  'Hajer Ayman': {
    en: 'Supports Warranty activities and follows up on warranty-related service cases.',
    ar: 'تعمل ضمن فريق الضمان، وتساهم في دعم عمليات الضمان ومتابعة الحالات المتعلقة بخدمات الضمان.',
  },
  'Reham Samir': {
    en: 'Team Leader responsible for PR activities and VD DOA-related operations and coordination.',
    ar: 'قائدة فريق مسؤولة عن أنشطة إرجاع المنتج والعمليات والتنسيق المتعلقة بحالات الشاشات التالفة عند الوصول.',
  },
  'Ahmed Bolkiny': {
    en: 'Supports PR operational activities and related coordination.',
    ar: 'يعمل في عمليات إرجاع المنتج، ويساهم في تنفيذ الأنشطة التشغيلية والتنسيق المرتبط بها.',
  },
  'Emad Ibrahim': {
    en: 'Part Leader for Customer Experience. Responsible for leading Customer Experience activities and supporting initiatives that improve customer satisfaction and service quality.',
    ar: 'قائد قطاع تجربة العملاء، ويتولى قيادة أنشطة تجربة العملاء ودعم المبادرات التي تهدف إلى تحسين رضا العملاء وجودة الخدمة.',
  },
  'Rehab Mostafa': {
    en: 'Team Leader for Customer Experience within the Home Appliances business, responsible for coordinating customer-experience activities and service-quality initiatives.',
    ar: 'قائدة فريق تجربة العملاء لقطاع الأجهزة المنزلية، وتتولى تنسيق أنشطة تجربة العملاء والمبادرات المتعلقة بتحسين جودة الخدمة.',
  },
  'Mina Safwat': {
    en: 'Team Leader for Customer Experience within the Mobile business, with responsibility for RNPS-related activities and customer-experience improvement.',
    ar: 'قائد فريق تجربة العملاء لقطاع الأجهزة المحمولة، ويتولى كذلك متابعة أنشطة مؤشر توصية الإصلاح والمساهمة في تحسين تجربة العملاء ورضاهم.',
  },
  'Caty Gamal': {
    en: 'Team Leader for Customer Experience activities related to Audio Visual.',
    ar: 'قائدة فريق تجربة العملاء الخاصة بقطاع الشاشات، وتتولى تنسيق ومتابعة أنشطة تجربة العملاء المتعلقة بهذا القطاع.',
  },
  'Ahmed Abdelhady': {
    en: 'Part Leader for Customer Support. Responsible for leading customer-support activities and coordinating the different customer-service channels.',
    ar: 'قائد قطاع دعم العملاء، ويتولى قيادة أنشطة دعم العملاء والتنسيق بين قنوات خدمة العملاء المختلفة.',
  },
  'Mai Elbarany': {
    en: 'Team Leader for Digital Service activities, responsible for coordinating customer service through digital channels.',
    ar: 'قائدة فريق الخدمات الرقمية، وتتولى تنسيق خدمات العملاء المقدمة من خلال القنوات الرقمية.',
  },
  'Ahmed Samir': {
    en: 'Team Leader for Call Service and SDF activities, responsible for coordinating customer support through the relevant service channels.',
    ar: 'قائد فريق خدمات العملاء عبر المكالمات وعمليات SDF، ويتولى تنسيق أنشطة دعم العملاء من خلال قنوات الخدمة المعنية.',
  },
  'Ahmed Ayad': {
    en: 'Team Leader responsible for VOD and eStore NPS activities, focusing on customer experience, satisfaction, and NPS performance.',
    ar: 'قائد فريق مسؤول عن أنشطة الفيديو حسب الطلب ومؤشر رضا المتجر الإلكتروني، مع التركيز على تجربة العملاء ورضاهم ومتابعة أداء مؤشر التوصية.',
  },
});
