/**
 * GoGo agent tools — Gemini functionDeclarations + local executors.
 * Server resolves fact tools; clientActions (navigate) run in the browser.
 */

import {
  findGoGoKpiDefinition,
  formatGoGoKpiAnswer,
  findGoGoOrgPerson,
  formatGoGoOrgPersonAnswer,
  formatGoGoOrgAmbiguousAnswer,
  answerGoGoOrgRelationQuestion,
} from './gogoOrgAndKpis';
import { resolveFlowReply } from './gogoGuideFlow';

/** @typedef {'tcs'|'pqa'|'search'|'feedback'|'survey'} GoGoNavTarget */
/** @typedef {'mx'|'da'|'av'} GoGoDivision */

export const GOGO_AGENT_TOOL_DECLARATIONS = [
  {
    name: 'open_section',
    description:
      'Navigate the visitor inside SCORA to a main section. Use when they ask to open/go to TCS, PQA, Search, Feedback, or Academy survey.',
    parameters: {
      type: 'OBJECT',
      properties: {
        target: {
          type: 'STRING',
          enum: ['tcs', 'pqa', 'search', 'feedback', 'survey'],
          description: 'SCORA section to open',
        },
        division: {
          type: 'STRING',
          enum: ['mx', 'da', 'av'],
          description: 'Optional TCS division: mx=mobile, da=appliances, av=screens',
        },
      },
      required: ['target'],
    },
  },
  {
    name: 'lookup_kpi',
    description:
      'Look up a verified KPI definition (SSR, RRR30, HASS, RNPS, etc.). Use when the visitor asks what a KPI means.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'KPI acronym or name, e.g. RRR30, SSR, HASS',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'lookup_org_person',
    description:
      'Look up a Samsung Egypt CS Head Office person by name (role/team) or answer reporting questions (Team Leader, Part Leader, who is above). Use for who-is and hierarchy questions about staff.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'Person name as mentioned by the visitor',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'explain_tcs_lines',
    description:
      'Explain TCS and its three product lines (mobile / home appliances / screens). Use for “what is TCS” style questions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        detail: {
          type: 'STRING',
          description: 'Optional focus note; usually leave empty',
        },
      },
    },
  },
];

/**
 * Execute one tool on the server. Returns { resultText, clientActions }.
 */
export function executeGoGoAgentTool(name, args = {}, lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const a = args && typeof args === 'object' ? args : {};

  if (name === 'open_section') {
    const target = String(a.target || '').toLowerCase();
    const division = String(a.division || '').toLowerCase();
    const map = {
      tcs: 'goto_tcs',
      pqa: 'goto_pqa',
      search: 'goto_search',
      feedback: 'goto_feedback',
      survey: 'goto_survey',
    };
    const action = map[target];
    if (!action) {
      return {
        resultText: L === 'ar' ? 'القسم ده مش معروف عندي في سكورا.' : 'I do not know that SCORA section.',
        clientActions: [],
      };
    }
    const divLabel =
      division === 'mx'
        ? L === 'ar'
          ? 'الموبايل'
          : 'MX'
        : division === 'da'
          ? L === 'ar'
            ? 'الأجهزة المنزلية'
            : 'DA'
          : division === 'av'
            ? L === 'ar'
              ? 'الشاشات'
              : 'AV'
            : '';
    const reply =
      L === 'ar'
        ? `حاضر — هفتح لك ${target === 'tcs' ? 'تي سي اس' : target === 'pqa' ? 'بي كيو اي' : target === 'search' ? 'البحث' : target === 'feedback' ? 'الملاحظات' : 'الاستبيان'}${divLabel ? ` (${divLabel})` : ''}.`
        : `Sure — opening ${target.toUpperCase()}${divLabel ? ` (${divLabel})` : ''} for you.`;
    return {
      resultText: reply,
      clientActions: [{ type: 'navigate', action, division: division || null }],
    };
  }

  if (name === 'lookup_kpi') {
    const kpi = findGoGoKpiDefinition(String(a.name || ''));
    if (!kpi) {
      return {
        resultText:
          L === 'ar'
            ? 'لم أجد هذا المؤشر في القائمة المعتمدة. أعد الاسم أو اسأله من زر المؤشرات.'
            : 'I could not find that KPI in the verified list. Try another name or use the KPI chips.',
        clientActions: [],
      };
    }
    return { resultText: formatGoGoKpiAnswer(kpi, L), clientActions: [] };
  }

  if (name === 'lookup_org_person') {
    const q = String(a.name || '');
    const relationReply = answerGoGoOrgRelationQuestion(q, L);
    if (relationReply) {
      return { resultText: relationReply, clientActions: [] };
    }
    const hit = findGoGoOrgPerson(q);
    if (hit?.ambiguous?.length) {
      return { resultText: formatGoGoOrgAmbiguousAnswer(hit.ambiguous, L), clientActions: [] };
    }
    if (hit?.person) {
      return { resultText: formatGoGoOrgPersonAnswer(hit.person, L), clientActions: [] };
    }
    return {
      resultText:
        L === 'ar'
          ? 'لم أجد هذا الاسم في هيكل مكتب خدمة العملاء. حاول استخدام الاسم بالكامل.'
          : 'I could not find that name in the CS Head Office directory. Try the full name.',
      clientActions: [],
    };
  }

  if (name === 'explain_tcs_lines') {
    const node = resolveFlowReply('what_tcs', L);
    return { resultText: node.reply, clientActions: [] };
  }

  return {
    resultText: L === 'ar' ? 'الأداة دي مش متاحة.' : 'That tool is not available.',
    clientActions: [],
  };
}

export function buildGoGoAgentToolPromptRules(lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  return [
    'You may call tools when they clearly help: open_section, lookup_kpi, lookup_org_person, explain_tcs_lines.',
    'Prefer tools for navigation requests and verified KPI/org facts instead of guessing.',
    'After tool results arrive, write a short warm final answer (do not dump raw JSON).',
    L === 'ar'
      ? 'Arabic final answers: Modern Standard Arabic (فصحى), TTS-friendly, never Egyptian colloquial. Never leave MX/DA/AV Latin codes.'
      : 'English final answers: clear and friendly.',
    'If no tool is needed (greetings, soft chat), answer directly.',
  ].join('\n');
}
