/**
 * Arabic name aliases for CS Head Office people (match + AR display).
 * First alias is the preferred Arabic display name.
 */
export const GOGO_ORG_NAME_ALIASES = Object.freeze({
  'Bishoy Adib': ['بيشوي أديب', 'بيشوي اديب', 'bishoy adib', 'bishoy'],
  'Donald Jung': ['دونالد جونغ', 'دونالد جونج', 'donald jung', 'donald'],
  'Mostafa Rady': ['مصطفى راضي', 'مصطفي راضي', 'mostafa rady'],
  'Mohamed Mohmdy': ['محمد محمدي', 'محمد محمدي', 'mohamed mohmdy', 'mohmdy'],
  'Mohamed Gamal': ['محمد جمال', 'mohamed gamal'],
  'Ahmed Elshawaf': [
    'أحمد الصواف',
    'احمد الصواف',
    'ahmed elshawaf',
    'ahmed elsawaf',
    'elshawaf',
    'elsawaf',
  ],
  'Mahmoud Hassan': ['محمود حسن', 'محمود علي حسن', 'mahmoud hassan', 'mahmoud ali hassan'],
  'Mohamed Atef': ['محمد عاطف', 'mohamed atef'],
  'Mostafa Amin': ['مصطفى أمين', 'مصطفي امين', 'mostafa amin'],
  'Fawzy Maher': ['فوزي ماهر', 'fawzy maher', 'fawzy'],
  'George Samir': ['جورج سمير', 'george samir', 'george'],
  'Ahmed Khalifa': ['أحمد خليفة', 'احمد خليفه', 'ahmed khalifa'],
  'Salma Zaki': ['سلمى زكي', 'سلمي زكي', 'salma zaki'],
  'Fatma Kotb': ['فاطمة قطب', 'فاطمه قطب', 'fatma kotb'],
  'Abdelhalim Mohamed': ['عبدالحليم محمد', 'عبد الحليم محمد', 'abdelhalim mohamed'],
  'Trez Medhat': ['تريز مدحت', 'trez medhat'],
  'Karim Safory': ['كريم صفوري', 'karim safory'],
  'Reda Fathy': ['رضا فتحي', 'reda fathy'],
  'Emad Salam': ['عماد سلام', 'emad salam'],
  'Mohamed Salah': ['محمد صلاح', 'mohamed salah'],
  'Ahmed Gamal': ['أحمد جمال', 'احمد جمال', 'ahmed gamal'],
  'Mohamed Farid': ['محمد فريد', 'mohamed farid'],
  'Mohamed Kamal': ['محمد كمال', 'mohamed kamal'],
  'Ahmed Abozaid': ['أحمد أبو زيد', 'احمد ابو زيد', 'ahmed abozaid'],
  'Hajer Ayman': ['هاجر أيمن', 'هاجر ايمن', 'hajer ayman'],
  'Reham Samir': ['ريهام سمير', 'reham samir'],
  'Ahmed Bolkiny': ['أحمد بولكيني', 'احمد بولكيني', 'ahmed bolkiny'],
  'Emad Ibrahim': ['عماد إبراهيم', 'عماد ابراهيم', 'emad ibrahim'],
  'Rehab Mostafa': ['رحاب مصطفى', 'رحاب مصطفي', 'rehab mostafa'],
  'Mina Safwat': ['مينا صفوت', 'mina safwat'],
  'Caty Gamal': ['كاتي جمال', 'caty gamal'],
  'Ahmed Abdelhady': ['أحمد عبدالهادي', 'احمد عبد الهادي', 'ahmed abdelhady'],
  'Mai Elbarany': ['مي البراني', 'mai elbarany'],
  'Ahmed Samir': ['أحمد سمير', 'احمد سمير', 'ahmed samir'],
  'Ahmed Ayad': ['أحمد عياد', 'احمد عياد', 'ahmed ayad'],
});

export function arabicDisplayNameFor(enName) {
  const aliases = GOGO_ORG_NAME_ALIASES[enName];
  if (aliases?.length) return aliases[0];
  return enName;
}

export function arabizeOrgRoleLabel(role = '', lang = 'en') {
  if (lang !== 'ar') return role;
  const r = String(role || '');
  return r
    .replace(/^HOD$/i, 'رئيس القسم')
    .replace(/^KBM$/i, 'مسؤول إدارة الأعمال')
    .replace(/Part Leader\s*[—–-]\s*/gi, 'قائد قطاع ')
    .replace(/Team Leader\s*[—–-]\s*/gi, 'قائد فريق ')
    .replace(/\bPart Leader\b/gi, 'قائد القطاع')
    .replace(/\bTeam Leader\b/gi, 'قائد الفريق')
    .replace(/^Head of Service Operation$/i, 'قائد قطاع عمليات الخدمة')
    .replace(/^Head of Parts Operation$/i, 'قائد قطاع عمليات قطع الغيار')
    .replace(/^Head of Operation Support$/i, 'قائد قطاع دعم العمليات')
    .replace(/^Head of Customer Experience$/i, 'قائد قطاع تجربة العملاء')
    .replace(/^Head of Customer Support$/i, 'قائد قطاع دعم العملاء')
    .replace(/^Head of /i, 'قائد قطاع ')
    .replace(/LCC\s*&\s*Planning/gi, 'مركز التحكم اللوجستي والتخطيط')
    .replace(/\bLCC\b/gi, 'مركز التحكم اللوجستي')
    .replace(/Service Operation/gi, 'عمليات الخدمة')
    .replace(/Parts Operation/gi, 'عمليات قطع الغيار')
    .replace(/Operation Support/gi, 'دعم العمليات')
    .replace(/Customer Experience/gi, 'تجربة العملاء')
    .replace(/Customer Support/gi, 'دعم العملاء')
    .replace(/Technical Lead/gi, 'قائد فريق الدعم الفني')
    .replace(/Field Lead/gi, 'قائد فريق الخدمة الميدانية')
    .replace(/SAC\s*B2B\s*Tech/gi, 'مهندس صيانة تكييف الأعمال بين الشركات')
    .replace(/VD\s*\/\s*B2B\s*Tech/gi, 'مهندس صيانة الشاشات وقطاع الأعمال')
    .replace(/System\s*AC\s*B2B\s*Tech/gi, 'مهندس صيانة تكييف مركزي لقطاع الأعمال')
    .replace(/MX\s*Tech/gi, 'مهندس صيانة قطاع الأجهزة المحمولة')
    .replace(/DA\s*Tech/gi, 'مهندس صيانة قطاع الأجهزة المنزلية')
    .replace(/AV\s*Tech/gi, 'مهندس صيانة قطاع الشاشات')
    .replace(/CE\s*Tech/gi, 'مهندس صيانة الإلكترونيات')
    .replace(/VD\s*Tech/gi, 'مهندس صيانة قطاع الشاشات')
    .replace(/MX\s*Field/gi, 'الخدمة الميدانية لقطاع الأجهزة المحمولة')
    .replace(/CE\s*Field/gi, 'تجربة العملاء ميدانيًا')
    .replace(/MX\s*Order Desk/gi, 'مكتب طلبات قطاع الأجهزة المحمولة')
    .replace(/DA\s*Order Desk/gi, 'مكتب طلبات قطاع الأجهزة المنزلية')
    .replace(/VD\s*Order Desk/gi, 'مكتب طلبات قطاع الشاشات')
    .replace(/MX\s*CX/gi, 'تجربة العملاء لقطاع الأجهزة المحمولة')
    .replace(/DA\s*CX/gi, 'تجربة العملاء لقطاع الأجهزة المنزلية')
    .replace(/VD\s*CX/gi, 'تجربة العملاء لقطاع الشاشات')
    .replace(/\bTech\b/gi, 'مهندس صيانة')
    .replace(/\bTechnical\b/gi, 'الدعم الفني')
    .replace(/\bLead\b/gi, 'قائد')
    .replace(/\bField\b/gi, 'الخدمة الميدانية')
    .replace(/\bOrder Desk\b/gi, 'مكتب الطلبات')
    .replace(/\bSupply Chain\b/gi, 'سلسلة الإمداد')
    .replace(/\bWarehouse\b/gi, 'المخزن')
    .replace(/\bWarranty\b/gi, 'الضمان')
    .replace(/\bPlanning\b/gi, 'التخطيط')
    .replace(/\bMX\b/g, 'قطاع الأجهزة المحمولة')
    .replace(/\bDA\b/g, 'قطاع الأجهزة المنزلية')
    .replace(/\bAV\b/g, 'قطاع الشاشات والمنتجات السمعية والبصرية')
    .replace(/\bCE\b/g, 'تجربة العملاء')
    .replace(/\bVD\b/g, 'قطاع الشاشات')
    .replace(/\bCX\b/g, 'تجربة العملاء')
    .replace(/\bB2B\b/gi, 'قطاع الأعمال')
    .replace(/\bSystem\s*AC\b/gi, 'تكييف مركزي')
    .replace(/\bRNPS\b/gi, 'مؤشر توصية الإصلاح')
    .replace(/\bDOA\b/gi, 'التالف عند الوصول')
    .replace(/\bUPC\b/gi, 'القطع الخاضعة للرقابة')
    .replace(/\bPR\b/g, 'إرجاع المنتج')
    .replace(/\s*[·•|/]\s*/g, '، ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^،\s*|،\s*$/g, '')
    .trim();
}

export function arabizeOrgPillarLabel(pillar = '', lang = 'en') {
  if (lang !== 'ar') return pillar;
  return arabizeOrgRoleLabel(pillar, 'ar');
}
