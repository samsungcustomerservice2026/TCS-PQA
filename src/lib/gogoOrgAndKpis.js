/**
 * Public KPI glossary + Samsung Egypt CS Head Office hierarchy for GoGo.
 * No Excel/sheet filenames, no compliance/policy dump — definitions & org structure only.
 */

import {
  arabicDisplayNameFor,
  arabizeOrgRoleLabel,
  arabizeOrgPillarLabel,
  GOGO_ORG_NAME_ALIASES,
} from './gogoOrgNames';
import { GOGO_CS_ORG, GOGO_ORG_PERSON_BRIEFS, GOGO_BUSINESS_MAP } from './gogoOrgData';

export { GOGO_CS_ORG, GOGO_ORG_PERSON_BRIEFS, GOGO_BUSINESS_MAP };

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
    def_ar: 'HASS — مؤشر عملية على جانب الأجهزة المنزلية (مش ضمن مؤشرات الشاشات). راجع التعريف الحي للفترة داخل SCORA.',
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
    def_ar: 'Linkage — اكتمال الربط بين خطوات أو أنظمة الإصلاح في تقييم الأجهزة المنزلية والشاشات.',
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
    def_ar: 'MJ % — نسبة الأعمال الكبرى ضمن تقييم فترة الأجهزة المنزلية والشاشات.',
  },
];

function briefForName(name) {
  return GOGO_ORG_PERSON_BRIEFS[name] || null;
}

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
  const withBrief = (person) => {
    const brief = briefForName(person.name);
    return {
      ...person,
      brief_en: brief?.en || '',
      brief_ar: brief?.ar || '',
    };
  };
  const people = [];
  for (const leader of GOGO_CS_ORG.leaders) {
    people.push(withBrief({
      name: leader.name,
      role: leader.role,
      level: leader.level || (leader.role === 'HOD' ? 'hod' : 'kbm'),
      pillar: null,
      pillar_ar: null,
      team: null,
      team_ar: null,
      teamLead: null,
      partLeader: null,
      kind: 'leader',
    }));
  }
  for (const pillar of GOGO_CS_ORG.pillars) {
    people.push(withBrief({
      name: pillar.head,
      role: `Part Leader — ${pillar.name}`,
      level: 'part_leader',
      pillar: pillar.name,
      pillar_ar: pillar.name_ar || pillar.name,
      team: null,
      team_ar: null,
      teamLead: null,
      partLeader: null,
      kind: 'part_leader',
    }));
    for (const team of pillar.teams) {
      if (team.lead) {
        people.push(withBrief({
          name: team.lead,
          role: `Team Leader — ${team.name}`,
          level: 'team_leader',
          pillar: pillar.name,
          pillar_ar: pillar.name_ar || pillar.name,
          team: team.name,
          team_ar: team.name_ar || team.name,
          teamLead: null,
          partLeader: pillar.head,
          kind: 'team_lead',
        }));
      }
      for (const member of team.members || []) {
        people.push(withBrief({
          name: member.name,
          role: member.role,
          level: 'member',
          pillar: pillar.name,
          pillar_ar: pillar.name_ar || pillar.name,
          team: team.name,
          team_ar: team.name_ar || team.name,
          teamLead: team.lead || null,
          partLeader: pillar.head,
          kind: 'member',
        }));
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
    .replace(/^(who\s+is|who's|who\s+are|مين\s+هو|من\s+هو|مين\s+|من\s+|who's)\s+/i, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function personNameTokens(name) {
  return normalizePersonQuery(name).split(' ').filter((t) => t.length >= 2);
}

function aliasHaystackFor(enName) {
  const aliases = GOGO_ORG_NAME_ALIASES[enName] || [];
  return [enName, ...aliases].map((a) => normalizePersonQuery(a)).filter(Boolean);
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
    { re: /\bhod\b|head\s*of\s*department|رئيس\s*القسم/i, role: 'HOD' },
    { re: /\bkbm\b|مدير\s*الأعمال\s*الكوري/i, role: 'KBM' },
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
    const aliases = aliasHaystackFor(person.name);
    if (!tokens.length && !aliases.length) continue;

    let score = 0;
    if (q === nameNorm || aliases.includes(q)) {
      score = 100;
    } else if (aliases.some((a) => a.length >= 4 && (q.includes(a) || a.includes(q)))) {
      score = 99;
    } else if (nameNorm.length >= 5 && q.includes(nameNorm)) {
      score = 98;
    } else {
      const matched = tokens.filter((t) => qTokens.includes(t) || q.split(' ').includes(t));
      // Also match Arabic alias tokens
      const aliasTokens = aliases.flatMap((a) => a.split(' ').filter((t) => t.length >= 2));
      const aliasMatched = aliasTokens.filter((t) => qTokens.includes(t));
      if (aliasMatched.length >= 2) score = 96;
      else if (matched.length === tokens.length && tokens.length >= 2) score = 95;
      else if (matched.length >= 2) score = 85;
      else if (aliasMatched.length === 1 && aliasMatched[0].length >= 4) {
        const token = aliasMatched[0];
        const sameAlias = people.filter((p) =>
          aliasHaystackFor(p.name).some((a) => a.split(' ').includes(token)),
        );
        score = sameAlias.length === 1 ? 88 : 66;
      } else if (matched.length === 1) {
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
          score = 66;
        } else score = 35;
      }
    }

    if (score >= 65) scored.push({ person, score });
  }

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
  const top = scored[0];
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

const GOGO_ORG_FEMALE_NAMES = new Set([
  'Salma Zaki',
  'Fatma Kotb',
  'Hajer Ayman',
  'Reham Samir',
  'Rehab Mostafa',
  'Trez Medhat',
  'Mai Elbarany',
  'Caty Gamal',
]);

/** Strip title echo from brief so the “what they do” paragraph stays short. */
function softenOrgBrief(brief, role, displayName) {
  let b = String(brief || '').trim();
  if (!b) return '';
  for (const c of [role, displayName].filter(Boolean)) {
    if (b.startsWith(c)) b = b.slice(c.length).replace(/^[.\s،,:—–-]+/, '').trim();
  }
  b = b
    .replace(/^(LCC\s*و?التخطيط|مركز التحكم اللوجستي والتخطيط|سلاسل الإمداد|الضمان)\s*[.،]?\s*/i, '')
    .replace(/^(MX|VD|DA)\s*Order Desk\.\s*/i, '')
    .replace(/^Part Leader for [^.]+\.\s*/i, '')
    .replace(/^Team Leader for [^.]+\.\s*/i, '')
    .replace(/^Team Leader responsible for [^.]+\.\s*/i, '')
    .replace(/^قائد قطاع[^،.]*[،.]\s*/i, '')
    .replace(/^قائدة? فريق[^،.]*[،.]\s*/i, '')
    .replace(/^مسؤول إدارة الأعمال وعضو ضمن الهيكل القيادي الأعلى،\s*/i, '')
    .replace(/^رئيس القسم،\s*وهو\s*/i, '')
    .trim();
  return b;
}

function buildOrgPositionPhrase(person, { role, pillar, team, teamLead, female, lang }) {
  const pillarLabel = lang === 'ar' ? (person.pillar_ar || pillar) : pillar;
  const teamLabel = lang === 'ar' ? (person.team_ar || team) : team;

  if (lang === 'ar') {
    if (person.level === 'hod' || person.role === 'HOD') {
      return 'رئيس القسم في مكتب خدمة عملاء سامسونج مصر';
    }
    if (person.level === 'kbm' || person.role === 'KBM') {
      return 'مسؤول إدارة الأعمال ضمن الهيكل القيادي الأعلى لمكتب خدمة العملاء';
    }
    if (person.kind === 'part_leader' || person.level === 'part_leader') {
      return `قائد قطاع ${pillarLabel || role}`;
    }
    if (person.kind === 'team_lead' || person.level === 'team_leader') {
      return `قائد${female ? 'ة' : ''} فريق ${teamLabel || role}${pillarLabel ? ` ضمن ${pillarLabel}` : ''}`;
    }
    return [
      role,
      teamLabel ? `في فريق ${teamLabel}` : '',
      pillarLabel ? `تحت ${pillarLabel}` : '',
      teamLead ? `مع قائد الفريق ${teamLead}` : '',
    ].filter(Boolean).join('، ');
  }

  if (person.level === 'hod' || person.role === 'HOD') {
    return 'Head of Department (HOD) — CS Head Office leadership';
  }
  if (person.level === 'kbm' || person.role === 'KBM') {
    return 'KBM — senior business-management leadership (not a Part Leader or Team Leader)';
  }
  if (person.kind === 'part_leader' || person.level === 'part_leader') {
    return `Part Leader for ${pillar || role}`;
  }
  if (person.kind === 'team_lead' || person.level === 'team_leader') {
    return `Team Leader for ${team || role}${pillar ? ` within ${pillar}` : ''}`;
  }
  return [
    role,
    team ? `on the ${team} team` : '',
    pillar ? `under ${pillar}` : '',
    teamLead ? `reporting to Team Leader ${teamLead}` : '',
  ].filter(Boolean).join(', ');
}

function buildOrgWhatTheyDo(person, { brief, role, pillar, team, female, lang }) {
  if (brief) return brief;

  if (lang === 'ar') {
    const works = female ? 'تعمل' : 'يعمل';
    const leads = female ? 'تقود' : 'يقود';
    const heads = female ? 'تدير' : 'يدير';
    if (person.kind === 'leader') {
      return `${female ? 'توجّه' : 'يوجّه'} استراتيجية الخدمة على مستوى المكتب الرئيسي.`;
    }
    if (person.kind === 'part_leader') {
      return `${heads} أعمال ${pillar || 'القطاع'} وتضمن أن الفرق تعمل بانسجام.`
        .replace('وتضمن', female ? 'وتضمن' : 'ويضمن');
    }
    if (person.kind === 'team_lead') {
      return `${leads} فريق ${team || 'العمل'} و${female ? 'تتابع' : 'يتابع'} التنفيذ اليومي.`;
    }
    return `${works} يومياً على مهام ${role}${pillar ? ` ضمن ${pillar}` : ''} لضمان استقرار خدمة العملاء.`;
  }

  if (person.kind === 'leader') return 'They steer Customer Service strategy at Head Office.';
  if (person.kind === 'part_leader') return `They lead ${pillar || 'the part'} and keep its teams aligned.`;
  if (person.kind === 'team_lead') return `They lead the ${team || 'team'} and guide daily execution.`;
  return `They handle day-to-day ${role} work${pillar ? ` within ${pillar}` : ''}.`;
}

/**
 * Hybrid who-is answer:
 * 1) Traditional — clear translated hierarchy position
 * 2) Generative — short paragraph on what they do
 */
export function formatGoGoOrgPersonAnswer(person, lang = 'en') {
  if (!person) return '';
  const L = lang === 'ar' ? 'ar' : 'en';
  const displayName = L === 'ar' ? arabicDisplayNameFor(person.name) : person.name;
  const role = L === 'ar' ? arabizeOrgRoleLabel(person.role, 'ar') : person.role;
  const pillar = L === 'ar' ? arabizeOrgPillarLabel(person.pillar || '', 'ar') : person.pillar;
  const team = L === 'ar' ? arabizeOrgRoleLabel(person.team || '', 'ar') : person.team;
  const teamLead = person.teamLead
    ? (L === 'ar' ? arabicDisplayNameFor(person.teamLead) : person.teamLead)
    : '';
  const female = GOGO_ORG_FEMALE_NAMES.has(person.name);

  const briefRaw = L === 'ar'
    ? (person.brief_ar || briefForName(person.name)?.ar || '')
    : (person.brief_en || briefForName(person.name)?.en || '');
  const brief = softenOrgBrief(
    L === 'ar' ? arabizeOrgRoleLabel(briefRaw, 'ar') : briefRaw,
    role,
    displayName,
  );

  const ctx = { role, pillar, team, teamLead, female, lang: L, brief };
  const position = buildOrgPositionPhrase(person, ctx);
  const whatTheyDo = buildOrgWhatTheyDo(person, ctx);

  if (L === 'ar') {
    return `${displayName} — ${position}.\n${whatTheyDo}`;
  }
  return `${displayName} — ${position}.\n${whatTheyDo}`;
}

export function formatGoGoOrgAmbiguousAnswer(people, lang = 'en') {
  if (lang === 'ar') {
    const list = (people || [])
      .map((p) => {
        const name = arabicDisplayNameFor(p.name);
        const role = arabizeOrgRoleLabel(p.role, 'ar');
        const pillar = p.pillar ? arabizeOrgPillarLabel(p.pillar, 'ar') : '';
        return `• ${name} — ${role}${pillar ? ` (${pillar})` : ''}`;
      })
      .join('\n');
    return `وجدت أكثر من شخص بهذا الاسم في هيكل مكتب الخدمة:\n${list}\n\nيرجى ذكر الاسم كاملاً لأحدد المعلومة المحفوظة.`;
  }
  const list = (people || []).map((p) => `• ${p.name} — ${p.role}${p.pillar ? ` (${p.pillar})` : ''}`).join('\n');
  return `I found more than one person with that name in the CS Head Office structure:\n${list}\n\nPlease use the full name so I can share their saved details.`;
}

export function buildGoGoOrgPlainText(lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const lines = [];
  lines.push(L === 'ar' ? GOGO_CS_ORG.title_ar : GOGO_CS_ORG.title_en);
  lines.push(L === 'ar' ? GOGO_CS_ORG.summary_ar : GOGO_CS_ORG.summary_en);
  lines.push(
    L === 'ar'
      ? `القيادة: ${GOGO_CS_ORG.leaders.map((x) => `${arabicDisplayNameFor(x.name)} (${arabizeOrgRoleLabel(x.role, 'ar')})`).join(' · ')}`
      : `Leadership: ${GOGO_CS_ORG.leaders.map((x) => `${x.name} (${x.role})`).join(' · ')}`,
  );
  for (const pillar of GOGO_CS_ORG.pillars) {
    const pillarName = L === 'ar' ? (pillar.name_ar || arabizeOrgPillarLabel(pillar.name, 'ar')) : pillar.name;
    const headName = L === 'ar' ? arabicDisplayNameFor(pillar.head) : pillar.head;
    lines.push(
      L === 'ar'
        ? `\n${pillarName} — قائد القطاع: ${headName}`
        : `\n${pillar.name} — Part Leader: ${pillar.head}`,
    );
    for (const team of pillar.teams) {
      const teamName = L === 'ar' ? (team.name_ar || arabizeOrgRoleLabel(team.name, 'ar')) : team.name;
      const lead = team.lead
        ? (L === 'ar'
          ? ` (قائد الفريق: ${arabicDisplayNameFor(team.lead)})`
          : ` (Team Leader: ${team.lead})`)
        : '';
      const people = (team.members || [])
        .map((m) => {
          const n = L === 'ar' ? arabicDisplayNameFor(m.name) : m.name;
          const r = L === 'ar' ? arabizeOrgRoleLabel(m.role, 'ar') : m.role;
          return `${n} — ${r}`;
        })
        .join('; ');
      lines.push(`• ${teamName}${lead}${people ? `: ${people}` : ''}`);
    }
  }
  return lines.join('\n');
}

/**
 * Detect reporting-relationship questions (team leader / part leader / who is above).
 * @returns {'team_leader'|'part_leader'|'above'|null}
 */
export function detectGoGoOrgRelationIntent(query) {
  const q = String(query || '');
  if (/part\s*leader|قائد\s*ال?قطاع|قائد\s*قطاع/i.test(q)) return 'part_leader';
  if (/team\s*leader|قائد\s*ال?فريق|قائد\s*فريق/i.test(q)) return 'team_leader';
  if (
    /who\s+is\s+above|who('?s| is)\s+above|reports?\s+to|reporting\s+line|مين\s+فوق|فوق\s+|تحت\s+مين|بيتبع\s*مين|يتبع\s*مين/i.test(q)
  ) {
    return 'above';
  }
  return null;
}

function stripOrgRelationNoise(query) {
  return String(query || '')
    .replace(/who\s+is|who's|who\s+are|مين\s+هو|من\s+هو|مين|من/gi, ' ')
    .replace(/('s|’s)\s*/g, ' ')
    .replace(/part\s*leader|team\s*leader|قائد\s*ال?قطاع|قائد\s*قطاع|قائد\s*ال?فريق|قائد\s*فريق/gi, ' ')
    .replace(/above|reports?\s+to|reporting\s+line|فوق|تحت|بيتبع|يتبع/gi, ' ')
    .replace(/\bof\b|\bfor\b|\bبتاع\b|\bبتاعة\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPersonByNameKey(name) {
  return listGoGoOrgPeople().find((p) => p.name === name) || null;
}

/**
 * Answer team-leader / part-leader / reporting-line questions from the official hierarchy.
 * @returns {string|null}
 */
export function answerGoGoOrgRelationQuestion(query, lang = 'en') {
  const intent = detectGoGoOrgRelationIntent(query);
  if (!intent) return null;

  const nameQuery = stripOrgRelationNoise(query);
  const hit = findGoGoOrgPerson(nameQuery || query);
  if (!hit?.person) {
    if (hit?.ambiguous) return formatGoGoOrgAmbiguousAnswer(hit.ambiguous, lang);
    return null;
  }

  const person = hit.person;
  const L = lang === 'ar' ? 'ar' : 'en';
  const displayName = L === 'ar' ? arabicDisplayNameFor(person.name) : person.name;
  const teamLabel = L === 'ar'
    ? (person.team_ar || arabizeOrgRoleLabel(person.team || '', 'ar'))
    : person.team;
  const pillarLabel = L === 'ar'
    ? (person.pillar_ar || arabizeOrgPillarLabel(person.pillar || '', 'ar'))
    : person.pillar;

  if (intent === 'team_leader') {
    if (!person.teamLead) {
      if (person.kind === 'team_lead') {
        return L === 'ar'
          ? `${displayName} هو/هي قائد${GOGO_ORG_FEMALE_NAMES.has(person.name) ? 'ة' : ''} الفريق (${teamLabel || 'الفريق'}).`
          : `${displayName} is the Team Leader for ${teamLabel || 'this team'}.`;
      }
      if (person.partLeader) {
        const pl = L === 'ar' ? arabicDisplayNameFor(person.partLeader) : person.partLeader;
        return L === 'ar'
          ? `${displayName} لا يوجد قائد فريق مخصص مسجّل له/لها؛ ويتبع قائد القطاع ${pl}${pillarLabel ? ` (${pillarLabel})` : ''}.`
          : `${displayName} has no dedicated Team Leader recorded; they fall under Part Leader ${pl}${pillarLabel ? ` (${pillarLabel})` : ''}.`;
      }
      return L === 'ar'
        ? `${displayName} غير مسجّل تحت قائد فريق في الهيكل المحفوظ.`
        : `${displayName} is not listed under a Team Leader in the saved hierarchy.`;
    }
    const tl = findPersonByNameKey(person.teamLead);
    const tlName = L === 'ar' ? arabicDisplayNameFor(person.teamLead) : person.teamLead;
    const tlTeam = L === 'ar'
      ? (tl?.team_ar || arabizeOrgRoleLabel(tl?.team || person.team || '', 'ar') || 'الدعم الفني')
      : (tl?.team || person.team || 'Technical');
    if (L === 'ar') {
      return `${tlName}، قائد فريق ${tlTeam}.`;
    }
    const tlTeamEn = /service/i.test(tlTeam) ? tlTeam : `${tlTeam} Service`;
    return `${tlName}, Team Leader for ${tlTeamEn}.`;
  }

  if (intent === 'part_leader') {
    if (!person.partLeader) {
      if (person.kind === 'part_leader') {
        return L === 'ar'
          ? `${displayName}، قائد قطاع ${pillarLabel || 'القطاع'}.`
          : `${displayName}, Part Leader for ${pillarLabel || 'this part'}.`;
      }
      return L === 'ar'
        ? `${displayName} غير مسجّل تحت قائد قطاع في الهيكل المحفوظ.`
        : `${displayName} is not listed under a Part Leader in the saved hierarchy.`;
    }
    const plName = L === 'ar' ? arabicDisplayNameFor(person.partLeader) : person.partLeader;
    return L === 'ar'
      ? `${plName}، قائد قطاع ${pillarLabel || 'القطاع'}.`
      : `${plName}, Part Leader for ${pillarLabel || 'the part'}.`;
  }

  // above / reporting line
  if (person.kind === 'leader') {
    return L === 'ar'
      ? `${displayName} ضمن القيادة العليا لمكتب خدمة العملاء (${arabizeOrgRoleLabel(person.role, 'ar')}).`
      : `${displayName} is part of CS Head Office senior leadership (${person.role}).`;
  }
  if (person.kind === 'part_leader') {
    return L === 'ar'
      ? `${displayName} قائد قطاع ${pillarLabel}، ويتبع القيادة العليا: مسؤول إدارة الأعمال دونالد جونغ ورئيس القسم بيشوي أديب.`
      : `${displayName} is Part Leader for ${pillarLabel}, reporting within senior leadership under KBM Donald Jung and HOD Bishoy Adib.`;
  }
  if (person.kind === 'team_lead') {
    const plName = person.partLeader
      ? (L === 'ar' ? arabicDisplayNameFor(person.partLeader) : person.partLeader)
      : '';
    return L === 'ar'
      ? `${displayName} قائد فريق ${teamLabel} ضمن ${pillarLabel}${plName ? ` بقيادة ${plName}` : ''}.`
      : `${displayName} is Team Leader for ${teamLabel} within ${pillarLabel}${plName ? ` led by ${plName}` : ''}.`;
  }

  const tlName = person.teamLead
    ? (L === 'ar' ? arabicDisplayNameFor(person.teamLead) : person.teamLead)
    : '';
  const plName = person.partLeader
    ? (L === 'ar' ? arabicDisplayNameFor(person.partLeader) : person.partLeader)
    : '';
  if (L === 'ar') {
    if (tlName && plName) {
      return `يعمل ${displayName} ضمن فريق ${teamLabel} تحت قيادة ${tlName}، ويتبع قطاع ${pillarLabel} بقيادة ${plName}.`;
    }
    if (plName) {
      return `يعمل ${displayName} ضمن ${teamLabel || 'الفريق'} ويتبع قطاع ${pillarLabel} بقيادة ${plName}.`;
    }
    return `${displayName} ضمن هيكل مكتب خدمة العملاء المحفوظ.`;
  }
  if (tlName && plName) {
    return `${displayName} reports within the ${teamLabel} team under ${tlName}, which falls under ${pillarLabel} led by ${plName}.`;
  }
  if (plName) {
    return `${displayName} works in ${teamLabel || 'the team'} under ${pillarLabel} led by ${plName}.`;
  }
  return `${displayName} is listed in the saved CS Head Office hierarchy.`;
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
    '## Person briefs (use when asked about a named employee)',
    listGoGoOrgPeople()
      .map((p) => `- ${p.name} (${p.role}): ${p.brief_en || 'See role/pillar/team only.'}`)
      .join('\n'),
    '',
    'Hard rules for wording:',
    '- NEVER mention Excel, spreadsheets, workbook/sheet file names, upload templates, or “compliance” documents.',
    '- NEVER invent org people who are not listed above.',
    '- Hierarchy levels (never confuse them): HOD > KBM > Part Leader > Team Leader > Team Member.',
    '- KBM (Donald Jung) is senior business-management — NEVER call KBM a Part Leader or Team Leader.',
    '- NEVER call a Team Leader a Part Leader, a Part Leader a Team Leader, or a Team Member a Team Leader.',
    '- Business map: MX=Mobile / قطاع الأجهزة المحمولة; DA=Home Appliances / قطاع الأجهزة المنزلية; AV/VD=Audio Visual / قطاع الشاشات والمنتجات السمعية والبصرية.',
    '- When asked who someone’s Team Leader / Part Leader is, or who is above them, use the reporting line from the hierarchy.',
    '- When the user asks about a named person from the hierarchy, answer with their saved brief, role, part, and team only.',
    '- DA vs AV: same template possible for CE multi-product engineers, but different KPIs — AV does NOT include HASS.',
    '- When asked what a KPI means, give the plain-language definition first (example: RRR30 = Return Repair Ratio in 30 days).',
    '- Live numeric scores stay in Dashboard/Search — you explain meaning and structure only.',
  ].join('\n');
}
