/**
 * Public KPI glossary + Samsung Egypt CS Head Office hierarchy for GoGo.
 * No Excel/sheet filenames, no compliance/policy dump — definitions & org structure only.
 */

/** @typedef {{ id: string, name_en: string, name_ar: string, def_en: string, def_ar: string, aliases?: string[] }} GoGoKpiDef */

/** @type {GoGoKpiDef[]} */
export const GOGO_KPI_DEFINITIONS = [
  {
    id: 'rrr30',
    name_en: 'RRR30',
    name_ar: 'RRR30',
    aliases: ['rrr 30', 'return repair ratio 30', 'rrr٣٠'],
    def_en: 'Return Repair Ratio within 30 days — share of units that come back for repair again inside 30 days (lower is better).',
    def_ar: 'نسبة إعادة الإصلاح خلال 30 يومًا — نسبة الأجهزة التي تعود للإصلاح مرة أخرى خلال 30 يومًا (الأقل أفضل).',
  },
  {
    id: 'rrr90',
    name_en: 'RRR90',
    name_ar: 'RRR90',
    aliases: ['rrr 90', 'return repair ratio 90'],
    def_en: 'Return Repair Ratio within 90 days — same idea as RRR30, measured over 90 days (lower is better).',
    def_ar: 'نسبة إعادة الإصلاح خلال 90 يومًا — نفس فكرة RRR30 لكن خلال 90 يومًا (الأقل أفضل).',
  },
  {
    id: 'ssr',
    name_en: 'SSR',
    name_ar: 'SSR',
    aliases: ['same symptom', 'same symptom redo'],
    def_en: 'Same Symptom REDO / return — cases that return with the same symptom after repair (quality of first fix).',
    def_ar: 'إعادة بنفس العَرَض — حالات تعود بنفس العطل بعد الإصلاح (جودة الإصلاح من أول مرة).',
  },
  {
    id: 'redo',
    name_en: 'REDO',
    name_ar: 'REDO',
    aliases: ['re-do', 'rework'],
    def_en: 'Redo / rework ratio — jobs that need repair again within the warranty or control window (lower is better).',
    def_ar: 'نسبة إعادة العمل — إصلاحات تحتاج إعادة خلال نافذة الضمان أو القياس (الأقل أفضل).',
  },
  {
    id: 'iqc_skip',
    name_en: 'IQC Skip',
    name_ar: 'تخطّي IQC',
    aliases: ['iqc', 'iqc skip ratio'],
    def_en: 'IQC Skip Ratio — share of jobs that skip Incoming Quality Check steps (lower is better).',
    def_ar: 'نسبة تخطّي فحص الجودة الوارد (IQC) — نسبة الأعمال التي تتجاوز خطوات الفحص (الأقل أفضل).',
  },
  {
    id: 'oqc',
    name_en: 'OQC',
    name_ar: 'OQC',
    aliases: ['oqc pass', 'outgoing quality'],
    def_en: 'Outgoing Quality Control pass rate — share of units that pass final quality check before return to customer (higher is better).',
    def_ar: 'نسبة اجتياز فحص الجودة الصادر — نسبة الأجهزة التي تنجح في الفحص النهائي قبل التسليم (الأعلى أفضل).',
  },
  {
    id: 'drnps',
    name_en: 'DRNPS / D-RNPS',
    name_ar: 'DRNPS',
    aliases: ['d-rnps', 'dr nps', 'direct nps'],
    def_en: 'Direct / repair-related Net Promoter style score from promoter vs detractor feedback on the service experience (higher is better).',
    def_ar: 'مؤشر رضا مرتبط بالإصلاح من تقييمات المروّجين مقابل المنتقدين لتجربة الخدمة (الأعلى أفضل).',
  },
  {
    id: 'rnps',
    name_en: 'RNPS',
    name_ar: 'RNPS',
    aliases: ['repair nps'],
    def_en: 'Repair NPS — customer likelihood to recommend based on the repair experience (higher is better).',
    def_ar: 'مؤشر توصية الإصلاح — مدى استعداد العميل للتوصية بناءً على تجربة الإصلاح (الأعلى أفضل).',
  },
  {
    id: 'ssr_pqa',
    name_en: 'SSR (PQA context)',
    name_ar: 'SSR (في PQA)',
    aliases: [],
    def_en: 'In PQA, SSR is weighted heavily as Same Symptom REDO control for the partner / center.',
    def_ar: 'في PQA، SSR له وزن كبير كضبط لإعادة الإصلاح بنفس العَرَض على مستوى الشريك / المركز.',
  },
  {
    id: 'ltp',
    name_en: 'LTP',
    name_ar: 'LTP',
    aliases: ['life time', 'lifetime performance', 'long term'],
    def_en: 'Life-Time / long-cycle performance control for aging or long-pending repair cases (PQA context).',
    def_ar: 'أداء الدورة الطويلة / التحكم في الحالات طويلة الأمد أو المعلّقة طويلًا (سياق PQA).',
  },
  {
    id: 'ex_ltp',
    name_en: 'Ex-LTP',
    name_ar: 'Ex-LTP',
    aliases: ['excessive ltp'],
    def_en: 'Excessive LTP control — penalty / control when long-pending cases exceed the allowed band.',
    def_ar: 'ضبط LTP الزائد — رقابة أو خصم عندما تتجاوز الحالات طويلة الأمد الحد المسموح.',
  },
  {
    id: 'ofs',
    name_en: 'OFS',
    name_ar: 'OFS',
    aliases: ['order', 'parts order'],
    def_en: 'Parts ordering accuracy / order fulfillment discipline for the center.',
    def_ar: 'دقة طلب القطع / التزام طلب وتوفير القطع للمركز.',
  },
  {
    id: 'rcxe',
    name_en: 'R-CXE',
    name_ar: 'R-CXE',
    aliases: ['cxe', 'r cxe', 'customer experience'],
    def_en: 'Repair Customer Experience score for how the customer felt about the service journey.',
    def_ar: 'درجة تجربة عميل الإصلاح — كيف شعر العميل برحلة الخدمة.',
  },
  {
    id: 'sdr',
    name_en: 'SDR',
    name_ar: 'SDR',
    aliases: ['same day repair'],
    def_en: 'Same Day Repair — share of jobs completed on the same day (higher is better).',
    def_ar: 'إصلاح في نفس اليوم — نسبة الأعمال التي تُنجز في نفس اليوم (الأعلى أفضل).',
  },
  {
    id: 'core_parts',
    name_en: 'Core Parts / Acc Core Parts',
    name_ar: 'القطع الأساسية',
    aliases: ['pba', 'octa', 'lcd', 'core part'],
    def_en: 'Core parts accuracy — correct use of critical parts (e.g. PBA, LCD/OCTA) versus unnecessary or wrong core-part consumption.',
    def_ar: 'دقة القطع الأساسية — الاستخدام الصحيح للقطع الحرجة (مثل PBA وLCD/OCTA) مقابل الاستهلاك الخاطئ أو غير اللازم.',
  },
  {
    id: 'mpu',
    name_en: 'MPU / Multi Parts',
    name_ar: 'MPU / Multi Parts',
    aliases: ['multi parts', 'multipart'],
    def_en: 'Multi-parts usage ratio — how often multiple parts are used on a job; watched for efficiency and correct diagnosis.',
    def_ar: 'نسبة استخدام قطع متعددة — كم مرة تُستخدم أكثر من قطعة في العمل؛ تُتابع لكفاءة التشخيص.',
  },
  {
    id: 'maintenance_mode',
    name_en: 'Maintenance Mode',
    name_ar: 'وضع الصيانة',
    aliases: ['maint mode'],
    def_en: 'Maintenance Mode control — process KPI for correct use of maintenance / service mode during repair.',
    def_ar: 'ضبط وضع الصيانة — مؤشر عملية للاستخدام الصحيح لوضع الصيانة أثناء الإصلاح.',
  },
  {
    id: 'training',
    name_en: 'Training',
    name_ar: 'التدريب',
    aliases: ['attendance', 'kahoot'],
    def_en: 'Training attendance / completion — engineer participation in required technical training (and related quizzes when used).',
    def_ar: 'حضور / إكمال التدريب — مشاركة المهندس في التدريب الفني المطلوب (والاختبارات المرتبطة عند استخدامها).',
  },
  {
    id: 'exam',
    name_en: 'Exam',
    name_ar: 'الامتحان',
    aliases: ['technical exam'],
    def_en: 'Technical exam score — knowledge check that contributes to the overall capability evaluation.',
    def_ar: 'درجة الامتحان الفني — قياس المعرفة الذي يساهم في تقييم القدرة الكلية.',
  },
  {
    id: 'hass',
    name_en: 'HASS',
    name_ar: 'HASS',
    aliases: [],
    def_en: 'HASS — DA-side appliance/service process KPI (not part of the AV KPI set). Follow the live period definition in SCORA.',
    def_ar: 'HASS — مؤشر عملية على جانب DA (ليس ضمن مؤشرات AV). راجع التعريف الحي للفترة داخل SCORA.',
  },
  {
    id: 'chatbot',
    name_en: 'Chatbot',
    name_ar: 'Chatbot',
    aliases: [],
    def_en: 'Chatbot adoption / usage KPI — using the guided support chatbot where required in the process.',
    def_ar: 'مؤشر استخدام الشات بوت — الالتزام باستخدام مساعد الدعم الآلي حيث مطلوب في العملية.',
  },
  {
    id: 'linkage',
    name_en: 'Linkage',
    name_ar: 'Linkage',
    aliases: [],
    def_en: 'Linkage — process linkage / connection completeness between repair steps or systems in DA/AV scoring.',
    def_ar: 'Linkage — اكتمال الربط بين خطوات أو أنظمة الإصلاح في تقييم DA/AV.',
  },
  {
    id: 'complete_repair',
    name_en: 'Complete Repair',
    name_ar: 'إكمال الإصلاح',
    aliases: ['completion'],
    def_en: 'Complete Repair rate — share of jobs closed as fully completed repairs.',
    def_ar: 'نسبة إكمال الإصلاح — نسبة الأعمال التي تُغلق كإصلاح مكتمل.',
  },
  {
    id: 'repair_volume',
    name_en: 'Repair Volume',
    name_ar: 'حجم الإصلاح',
    aliases: ['volume'],
    def_en: 'Repair Volume — productivity / count of repairs handled in the period.',
    def_ar: 'حجم الإصلاح — إنتاجية / عدد الإصلاحات خلال الفترة.',
  },
  {
    id: 'st_con',
    name_en: 'ST Con',
    name_ar: 'ST Con',
    aliases: ['st', 'standard time'],
    def_en: 'ST Con — standard-time / process conformance related to repair timing discipline.',
    def_ar: 'ST Con — الالتزام بالوقت المعياري / انضباط زمن الإصلاح.',
  },
  {
    id: 'mj',
    name_en: 'MJ %',
    name_ar: 'MJ %',
    aliases: ['major'],
    def_en: 'MJ % — major-job mix / major repair share used in DA/AV period scoring.',
    def_ar: 'MJ % — نسبة الأعمال الكبرى ضمن تقييم فترة DA/AV.',
  },
];

export const GOGO_CS_ORG = {
  title_en: 'Samsung Egypt Customer Service — Head Office structure',
  title_ar: 'هيكل مكتب خدمة عملاء سامسونج مصر (Head Office)',
  summary_en:
    'Samsung Customer Service Head Office is led by the HOD and KBM, then five pillars: Service Operation, Parts Operation, Operation Support, Customer Experience, and Customer Support.',
  summary_ar:
    'مكتب خدمة العملاء يُقاد بواسطة HOD وKBM، ثم خمسة محاور: Service Operation وParts Operation وOperation Support وCustomer Experience وCustomer Support.',
  leaders: [
    { name: 'Bishoy Adib', role: 'HOD' },
    { name: 'Donald Jung', role: 'KBM' },
  ],
  pillars: [
    {
      name: 'Service Operation',
      head: 'Mostafa Rady',
      teams: [
        {
          name: 'Field',
          lead: 'Mohamed Mohmdy',
          members: [
            { name: 'Mohamed Gamal', role: 'CE Field' },
            { name: 'Ahmed Elsawaf', role: 'MX Field' },
          ],
        },
        {
          name: 'Technical',
          lead: 'Mahmoud Hassan',
          members: [
            { name: 'Mohamed Atef', role: 'VD / B2B Tech · System AC B2B Tech' },
            { name: 'Mostafa Amin', role: 'DA Tech' },
            { name: 'Fawzy Maher', role: 'MX Tech' },
            { name: 'George Samir', role: 'MX Tech' },
          ],
        },
      ],
    },
    {
      name: 'Parts Operation',
      head: 'Ahmed Khalifa',
      teams: [
        {
          name: 'Planning',
          lead: null,
          members: [
            { name: 'Salma Zaki', role: 'LCC & Planning' },
            { name: 'Fatma Kotb', role: 'LCC & Planning' },
          ],
        },
        {
          name: 'Order Desk',
          lead: null,
          members: [
            { name: 'Abdelhalim Mohamed', role: 'MX Order Desk' },
            { name: 'Trez Medhat', role: 'VD Order Desk' },
            { name: 'Karim Safory', role: 'DA Order Desk' },
          ],
        },
        {
          name: 'Supply Chain',
          lead: null,
          members: [{ name: 'Reda Fathy', role: 'Supply Chain' }],
        },
        {
          name: 'Warehouse',
          lead: null,
          members: [
            { name: 'Emad Salam', role: 'UPC + DOA W/H' },
            { name: 'Mohamed Salah', role: 'Main W/H' },
            { name: 'Ahmed Gamal', role: 'Main W/H' },
          ],
        },
      ],
    },
    {
      name: 'Operation Support',
      head: 'Mohamed Farid',
      teams: [
        {
          name: 'Warranty',
          lead: null,
          members: [
            { name: 'Mohamed Kamal', role: 'Warranty' },
            { name: 'Ahmed Abozaid', role: 'Warranty' },
            { name: 'Hajer Ayman', role: 'Warranty' },
          ],
        },
        {
          name: 'PR / DOA',
          lead: null,
          members: [
            { name: 'Reham Samir', role: 'PR + VD DOA' },
            { name: 'Ahmed Bolkiny', role: 'PR Operation' },
          ],
        },
      ],
    },
    {
      name: 'Customer Experience',
      head: 'Emad Ibrahim',
      teams: [
        {
          name: 'CX Team',
          lead: null,
          members: [
            { name: 'Rehab Mostafa', role: 'DA CX' },
            { name: 'Mina Safwat', role: 'MX CX + RNPS' },
            { name: 'Caty Gamal', role: 'VD CX' },
          ],
        },
      ],
    },
    {
      name: 'Customer Support',
      head: 'Ahmed Abdelhady',
      teams: [
        {
          name: 'Support Team',
          lead: null,
          members: [
            { name: 'Mai Elbarany', role: 'Digital SVC' },
            { name: 'Ahmed Samir', role: 'Call SVC + SDF' },
            { name: 'Ahmed Ayad', role: 'VOD + eStore NPS' },
          ],
        },
      ],
    },
  ],
};

export function findGoGoKpiDefinition(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const kpi of GOGO_KPI_DEFINITIONS) {
    const hay = [kpi.id, kpi.name_en, kpi.name_ar, ...(kpi.aliases || [])]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (q === kpi.id || q === kpi.name_en.toLowerCase()) score = 100;
    else if (hay.includes(q) || q.includes(kpi.id)) score = 80;
    else {
      const tokens = q.split(/[^a-z0-9\u0600-\u06ff]+/i).filter(Boolean);
      tokens.forEach((t) => {
        if (t.length >= 3 && hay.includes(t)) score += 10;
      });
    }
    if (score > bestScore) {
      bestScore = score;
      best = kpi;
    }
  }
  return bestScore >= 10 ? best : null;
}

export function formatGoGoKpiAnswer(kpi, lang = 'en') {
  if (!kpi) return '';
  if (lang === 'ar') {
    return `${kpi.name_ar}: ${kpi.def_ar}`;
  }
  return `${kpi.name_en}: ${kpi.def_en}`;
}

/** Flatten CS Head Office into searchable people records. */
export function listGoGoOrgPeople() {
  const people = [];
  for (const leader of GOGO_CS_ORG.leaders) {
    people.push({
      name: leader.name,
      role: leader.role,
      pillar: null,
      team: null,
      teamLead: null,
      kind: 'leader',
    });
  }
  for (const pillar of GOGO_CS_ORG.pillars) {
    people.push({
      name: pillar.head,
      role: `Head of ${pillar.name}`,
      pillar: pillar.name,
      team: null,
      teamLead: null,
      kind: 'pillar_head',
    });
    for (const team of pillar.teams) {
      if (team.lead) {
        people.push({
          name: team.lead,
          role: `${team.name} Lead`,
          pillar: pillar.name,
          team: team.name,
          teamLead: null,
          kind: 'team_lead',
        });
      }
      for (const member of team.members) {
        people.push({
          name: member.name,
          role: member.role,
          pillar: pillar.name,
          team: team.name,
          teamLead: team.lead || null,
          kind: 'member',
        });
      }
    }
  }
  return people;
}

function normalizePersonQuery(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function personNameTokens(name) {
  return normalizePersonQuery(name).split(' ').filter((t) => t.length >= 2);
}

/**
 * Match a free-text question to someone in GOGO_CS_ORG.
 * @returns {{ person: object } | { ambiguous: object[] } | null}
 */
export function findGoGoOrgPerson(query) {
  const q = normalizePersonQuery(query);
  if (!q || q.length < 3) return null;

  // Skip pure hierarchy questions — those belong to the full org reply.
  if (
    /^(what|show|tell).*(hierarch|org chart|organisation|organization|structure|head office)/i.test(q)
    || /^(ايه|ما|عرض).*(هيكل|تسلسل|منظمة)/i.test(query)
  ) {
    return null;
  }

  const people = listGoGoOrgPeople();

  // Unique role shortcuts (e.g. "who is the HOD?")
  const roleHints = [
    { re: /\bhod\b|head\s*of\s*department/i, role: 'HOD' },
    { re: /\bkbm\b/i, role: 'KBM' },
  ];
  for (const hint of roleHints) {
    if (hint.re.test(query) && !/hierarch|org\s*chart|structure|هيكل|تسلسل/i.test(query)) {
      const hit = people.find((p) => String(p.role).toUpperCase() === hint.role);
      if (hit) return { person: hit };
    }
  }

  const qTokens = q.split(' ').filter((t) => t.length >= 2);
  const scored = [];

  for (const person of people) {
    const nameNorm = normalizePersonQuery(person.name);
    const tokens = personNameTokens(person.name);
    if (!tokens.length) continue;

    let score = 0;
    if (q === nameNorm) {
      score = 100;
    } else if (nameNorm.length >= 5 && q.includes(nameNorm)) {
      // Query contains the full saved name (e.g. "Who is Fawzy Maher?")
      score = 98;
    } else {
      const matched = tokens.filter((t) => qTokens.includes(t) || q.split(' ').includes(t));
      if (matched.length === tokens.length && tokens.length >= 2) score = 95;
      else if (matched.length >= 2) score = 85;
      else if (matched.length === 1) {
        const token = matched[0];
        const sameFirst = people.filter((p) => personNameTokens(p.name)[0] === token);
        const sameLast = people.filter((p) => {
          const pt = personNameTokens(p.name);
          return pt[pt.length - 1] === token;
        });
        if (token === tokens[tokens.length - 1] && sameLast.length === 1) score = 80;
        else if (token === tokens[0] && sameFirst.length === 1) score = 70;
        else if (token.length >= 5 && sameLast.length === 1) score = 65;
        else if (token === tokens[0] && sameFirst.length > 1) {
          // Ambiguous first name — collect later via low shared score band
          score = 66;
        } else score = 35;
      }
    }

    if (score >= 65) scored.push({ person, score });
  }

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
  const top = scored[0];
  // Ambiguous first-name hits (several Ahmed / Mohamed) or near ties
  if (top.score <= 66) {
    const firstToken = personNameTokens(top.person.name)[0];
    const sameFirst = scored
      .map((s) => s.person)
      .filter((p) => personNameTokens(p.name)[0] === firstToken);
    if (sameFirst.length > 1) return { ambiguous: sameFirst.slice(0, 8) };
  }
  const near = scored.filter((s) => s.score >= top.score - 10 && s.person.name !== top.person.name);
  if (top.score < 85 && near.length) {
    return { ambiguous: [top.person, ...near.map((s) => s.person)].slice(0, 6) };
  }
  return { person: top.person };
}

export function formatGoGoOrgPersonAnswer(person, lang = 'en') {
  if (!person) return '';
  const L = lang === 'ar' ? 'ar' : 'en';
  if (L === 'ar') {
    const lines = [`${person.name} — ${person.role}`];
    if (person.kind === 'leader') {
      lines.push('القيادة: مكتب خدمة عملاء سامسونج مصر (Head Office).');
    } else {
      if (person.pillar) lines.push(`المحور: ${person.pillar}`);
      if (person.team) lines.push(`الفريق: ${person.team}`);
      if (person.teamLead) lines.push(`قائد الفريق: ${person.teamLead}`);
      if (person.kind === 'pillar_head') lines.push('المنصب: رئيس المحور.');
      if (person.kind === 'team_lead') lines.push('المنصب: قائد فريق.');
    }
    return lines.join('\n');
  }

  const lines = [`${person.name} — ${person.role}`];
  if (person.kind === 'leader') {
    lines.push('Leadership — Samsung Egypt Customer Service Head Office.');
  } else {
    if (person.pillar) lines.push(`Pillar: ${person.pillar}`);
    if (person.team) lines.push(`Team: ${person.team}`);
    if (person.teamLead) lines.push(`Team lead: ${person.teamLead}`);
    if (person.kind === 'pillar_head') lines.push('Position: Pillar head.');
    if (person.kind === 'team_lead') lines.push('Position: Team lead.');
  }
  return lines.join('\n');
}

export function formatGoGoOrgAmbiguousAnswer(people, lang = 'en') {
  const list = (people || []).map((p) => `• ${p.name} — ${p.role}${p.pillar ? ` (${p.pillar})` : ''}`).join('\n');
  if (lang === 'ar') {
    return `لقيت أكتر من شخص بنفس الاسم في هيكل مكتب الخدمة:\n${list}\n\nقولّي الاسم كامل عشان أحددلك المعلومة المحفوظة.`;
  }
  return `I found more than one person with that name in the CS Head Office structure:\n${list}\n\nPlease use the full name so I can share their saved details.`;
}

export function buildGoGoOrgPlainText(lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const lines = [];
  lines.push(L === 'ar' ? GOGO_CS_ORG.title_ar : GOGO_CS_ORG.title_en);
  lines.push(L === 'ar' ? GOGO_CS_ORG.summary_ar : GOGO_CS_ORG.summary_en);
  lines.push(
    L === 'ar'
      ? `القيادة: ${GOGO_CS_ORG.leaders.map((x) => `${x.name} (${x.role})`).join(' · ')}`
      : `Leadership: ${GOGO_CS_ORG.leaders.map((x) => `${x.name} (${x.role})`).join(' · ')}`,
  );
  for (const pillar of GOGO_CS_ORG.pillars) {
    lines.push(`\n${pillar.name} — Head: ${pillar.head}`);
    for (const team of pillar.teams) {
      const lead = team.lead ? ` (lead: ${team.lead})` : '';
      const people = team.members.map((m) => `${m.name} — ${m.role}`).join('; ');
      lines.push(`• ${team.name}${lead}: ${people}`);
    }
  }
  return lines.join('\n');
}

/** Compact block for Gemini system prompt. */
export function buildGoGoKpiAndOrgContext() {
  const kpiLines = GOGO_KPI_DEFINITIONS.map(
    (k) => `- ${k.name_en}: ${k.def_en}`,
  ).join('\n');
  return [
    '## KPI glossary (define clearly when asked)',
    kpiLines,
    '',
    '## Samsung Egypt Customer Service Head Office hierarchy',
    buildGoGoOrgPlainText('en'),
    '',
    'Hard rules for wording:',
    '- NEVER mention Excel, spreadsheets, workbook/sheet file names, upload templates, or “compliance” documents.',
    '- NEVER invent org people who are not listed above.',
    '- When the user asks about a named person from the hierarchy, answer ONLY with that person’s saved role, pillar, and team from the list above.',
    '- DA vs AV: same template possible for CE multi-product engineers, but different KPIs — AV does NOT include HASS.',
    '- When asked what a KPI means, give the plain-language definition first (example: RRR30 = Return Repair Ratio in 30 days).',
    '- Live numeric scores stay in Dashboard/Search — you explain meaning and structure only.',
  ].join('\n');
}
