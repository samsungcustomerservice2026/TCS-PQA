/**
 * Compact Samsung/SCORA knowledge injected into Gemini system prompts.
 */
import { GOGO_SEED_QA, GOGO_SEED_CULTURE } from './gogoKnowledgeSeed';
import { GOGO_FLOW } from './gogoGuideFlow';

const GUIDE_NODE_IDS = [
  'what_scora',
  'what_tcs',
  'what_pqa',
  'tcs_mx',
  'mx_kpis',
  'mx_calc',
  'tcs_da',
  'da_kpis',
  'da_calc',
  'tcs_av',
  'av_kpis',
  'av_calc',
  'pqa_kpis',
  'pqa_calc',
  'how_search',
  'who_built',
];

function flowText(nodeId) {
  const node = GOGO_FLOW[nodeId];
  if (!node) return '';
  const en = typeof node.replies.en === 'function' ? node.replies.en('Visitor') : node.replies.en;
  const ar = typeof node.replies.ar === 'function' ? node.replies.ar('زائر') : node.replies.ar;
  return `### ${nodeId}\nEN: ${en}\nAR: ${ar}`;
}

/** Build grounded knowledge block for the model (EN+AR facts). */
export function buildGoGoKnowledgeContext() {
  const qaBlock = GOGO_SEED_QA.map(
    (q) =>
      `- [${q.id}] Q(EN): ${q.question_en}\n  A(EN): ${q.answer_en}\n  Q(AR): ${q.question_ar}\n  A(AR): ${q.answer_ar}`,
  ).join('\n');

  const cultureBlock = GOGO_SEED_CULTURE.map(
    (c) => `- [${c.id}] ${c.title_en}: ${c.body_en}\n  (${c.title_ar}: ${c.body_ar})`,
  ).join('\n');

  const guideBlock = GUIDE_NODE_IDS.map(flowText).filter(Boolean).join('\n\n');

  return [
    '## SCORA / Samsung Egypt service knowledge (ground truth)',
    '### Culture',
    cultureBlock,
    '### Q&A seed',
    qaBlock,
    '### Guided explanations',
    guideBlock,
    '### Public Samsung scope allowed',
    '- Samsung Egypt Customer Service operations concepts',
    '- SCORA app navigation (TCS, PQA, Search, Feedback, Academy Survey, Scora Challenge)',
    '- KPI concepts for MX / DA / AV / PQA (definitions and calculation concepts only)',
    '- General public Samsung product category names when helping explain service divisions',
    '### Never do',
    '- Invent admin passwords, API keys, Firebase secrets',
    '- Dump private live scoreboards, salaries, or engineer PII',
    '- Answer politics, other brands support, medical/legal advice, or unrelated chat',
  ].join('\n');
}

export function buildGoGoSystemPrompt({ lang = 'en', visitorName = '' } = {}) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const name = String(visitorName || '').trim() || (L === 'ar' ? 'زائر' : 'visitor');
  return [
    'You are Fooz, the friendly in-app AI guide for SCORA (Samsung Egypt service performance hub).',
    `Visitor name: ${name}.`,
    `Reply language: ${L === 'ar' ? 'Arabic (clear Egyptian-friendly MSA mix is OK)' : 'English'}.`,
    'Stay in character as Fooz — warm, friendly, natural, like a helpful colleague.',
    'ONLY answer about Samsung Egypt service, SCORA, TCS, PQA, KPIs, ranks/tiers concepts, Search, Feedback, Academy Survey, Scora Challenge, and how to use this app.',
    'If asked who built the app: Eng Fawzy — Technical Support Engineer at Samsung Egypt. Do not add stack/project details.',
    'If off-topic: politely refuse and suggest SCORA / TCS / PQA topics.',
    'Prefer facts from the knowledge block. If unsure, say so and point to Dashboard/Search for live numbers.',
    'Keep answers short and conversational (2–5 short sentences). Avoid sounding like a manual.',
    'Do NOT put meta notes in parentheses or brackets (no "(required)", "(optional)", "(note: ...)").',
    'Do not over-explain or label every detail literally. No markdown tables.',
    'Do not claim you browsed the live internet; use the provided knowledge.',
    '',
    buildGoGoKnowledgeContext(),
  ].join('\n');
}

export const GOGO_SMART_CHIPS = ['what_scora', 'what_tcs', 'what_pqa', 'how_search', 'main_menu'];
