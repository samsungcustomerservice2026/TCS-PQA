import { NextResponse } from 'next/server';
import { getGoGoSoftRedirectReply, isGoGoDeniedMessage } from '../../../../lib/gogoKnowledge';
import { buildGoGoSystemPrompt, GOGO_SMART_CHIPS } from '../../../../lib/gogoGeminiContext';
import { ensureGoGoCompleteReply, parseGoGoStateTaggedText } from '../../../../lib/gogoStateTags';
import { normalizeGoGoArabicName } from '../../../../lib/gogoEgyptianDialect';
import { rewriteAssistantNameForDisplay } from '../../../../lib/gogoIdentity';
import { prepareGoGoReplyPair } from '../../../../lib/gogoSpeechText';
import {
  GOGO_AGENT_TOOL_DECLARATIONS,
  executeGoGoAgentTool,
} from '../../../../lib/gogoAgentTools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 10;
const MAX_MESSAGE = 800;
const MAX_REPLY = 1200;
const MAX_LEARNING_HINT = 900;
const MAX_TOOL_ROUNDS = 3;

const MODEL_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function needNameReply(lang) {
  return lang === 'ar'
    ? 'أخبرني باسمك الأول ثم نكمل.'
    : 'Tell me your name first, then we continue.';
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m?.role === 'user' ? 'user' : 'model',
      text: String(m?.text || '').slice(0, MAX_MESSAGE),
    }))
    .filter((m) => m.text.trim());
}

function classifyGeminiError(message = '', status = 0) {
  const msg = String(message || '').toLowerCase();
  if (status === 429 || /quota|rate limit|resource_exhausted/.test(msg)) return 'quota';
  if (status === 404 || /not found|no longer available/.test(msg)) return 'model_unavailable';
  if (status === 400 && /api key|invalid/.test(msg)) return 'invalid_key';
  if (status === 403 || /permission|api key/.test(msg)) return 'invalid_key';
  return 'gemini_error';
}

function modelCandidates(preferred) {
  const list = [preferred, ...MODEL_FALLBACKS].filter(Boolean);
  return [...new Set(list)];
}

function extractTextFromParts(parts = []) {
  return parts
    .map((p) => p?.text || '')
    .join('')
    .trim();
}

function extractFunctionCalls(parts = []) {
  const calls = [];
  for (const p of parts) {
    const fc = p?.functionCall;
    if (fc?.name) {
      let args = fc.args || {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      calls.push({ name: fc.name, args });
    }
  }
  return calls;
}

async function generateContentOnce({ contents, system, model, apiKey, withTools }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 768,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
  if (withTools) {
    body.tools = [{ functionDeclarations: GOGO_AGENT_TOOL_DECLARATIONS }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data?.error?.message || `Gemini HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.code = classifyGeminiError(errMsg, res.status);
    err.model = model;
    throw err;
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  return { parts, model, raw: data };
}

async function callGeminiWithTools({ system, history, message, model, apiKey, lang }) {
  const models = modelCandidates(model);
  let lastErr = null;

  for (const candidate of models) {
    try {
      const contents = [];
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const clientActions = [];
      const toolsUsed = [];
      let text = '';

      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const { parts } = await generateContentOnce({
          contents,
          system,
          model: candidate,
          apiKey,
          withTools: true,
        });
        const calls = extractFunctionCalls(parts);
        const partText = extractTextFromParts(parts);

        if (!calls.length) {
          text = partText;
          break;
        }

        contents.push({ role: 'model', parts });

        const fnParts = [];
        for (const call of calls) {
          const executed = executeGoGoAgentTool(call.name, call.args, lang);
          toolsUsed.push(call.name);
          if (Array.isArray(executed.clientActions)) {
            clientActions.push(...executed.clientActions);
          }
          fnParts.push({
            functionResponse: {
              name: call.name,
              response: {
                result: String(executed.resultText || '').slice(0, 900),
              },
            },
          });
        }
        contents.push({ role: 'user', parts: fnParts });

        // If open_section already gave a ready reply, still let model polish once more next loop.
        if (!text && partText) text = partText;
      }

      if (!text) {
        // Final pass without forcing more tools if still empty
        const { parts } = await generateContentOnce({
          contents,
          system,
          model: candidate,
          apiKey,
          withTools: false,
        });
        text = extractTextFromParts(parts);
      }

      // If tools returned useful text but model stayed quiet, use last tool result.
      if (!text && toolsUsed.length) {
        const lastTool = toolsUsed[toolsUsed.length - 1];
        const fallback = executeGoGoAgentTool(lastTool, {}, lang);
        text = fallback.resultText;
      }

      if (!text) {
        const err = new Error('Empty Gemini response');
        err.code = 'empty_response';
        err.model = candidate;
        throw err;
      }

      return {
        text: text.slice(0, MAX_REPLY),
        model: candidate,
        clientActions,
        toolsUsed: [...new Set(toolsUsed)],
        source: toolsUsed.length ? 'agentic' : 'gemini',
      };
    } catch (err) {
      lastErr = err;
      const retryable = err?.code === 'quota' || err?.code === 'model_unavailable' || err?.code === 'empty_response';
      if (!retryable) throw err;
      console.warn(`GoGo Gemini model ${candidate} failed (${err.code}):`, err.message);
    }
  }
  throw lastErr || new Error('Gemini unavailable');
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  const visitorName = String(body?.visitorName || '').trim().slice(0, 40);
  const message = String(body?.message || '').trim().slice(0, MAX_MESSAGE);
  const learningHint = String(body?.learningHint || '').trim().slice(0, MAX_LEARNING_HINT);
  const history = sanitizeHistory(body?.history);

  if (!message) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  }

  if (!visitorName || visitorName.length < 2) {
    return NextResponse.json(
      { reply: needNameReply(lang), chips: ['lang_toggle'], denied: false, source: 'guard' },
      { status: 400 },
    );
  }

  if (isGoGoDeniedMessage(message)) {
    const reply = getGoGoSoftRedirectReply(lang);
    const pair = prepareGoGoReplyPair(reply, lang);
    return NextResponse.json({
      reply: pair.display,
      spoken: pair.spoken,
      chips: GOGO_SMART_CHIPS,
      denied: true,
      source: 'guard',
      learnable: false,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GoGo chat unavailable: missing server API configuration');
    return NextResponse.json(
      { error: 'Assistant temporarily unavailable', code: 'unavailable', fallback: true },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const system = buildGoGoSystemPrompt({ lang, visitorName, learningHint });

  try {
    const {
      text: reply,
      model: usedModel,
      clientActions,
      toolsUsed,
      source,
    } = await callGeminiWithTools({
      system,
      history,
      message,
      model,
      apiKey,
      lang,
    });
    const parsed = parseGoGoStateTaggedText(reply);
    const polish = (t) => {
      const done = ensureGoGoCompleteReply(t);
      return lang === 'ar' ? normalizeGoGoArabicName(done) : rewriteAssistantNameForDisplay(done, 'en');
    };
    const clean = polish(parsed.displayText || reply);
    const pair = prepareGoGoReplyPair(clean, lang);
    const segments = Array.isArray(parsed.segments)
      ? parsed.segments
          .map((seg) => {
            const text = polish(seg.text);
            const segPair = prepareGoGoReplyPair(text, lang);
            return {
              ...seg,
              text: segPair.display,
              spoken: segPair.spoken,
            };
          })
          .filter((seg) => seg.text)
      : null;
    return NextResponse.json({
      reply: pair.display,
      spoken: pair.spoken,
      chips: GOGO_SMART_CHIPS,
      denied: false,
      source,
      mode: source === 'agentic' ? 'agentic' : 'generative',
      model: usedModel,
      toolsUsed: toolsUsed || [],
      clientActions: clientActions || [],
      learnable: true,
      animation: {
        initialState: parsed.initialState,
        segments: segments?.length ? segments : parsed.segments,
      },
    });
  } catch (err) {
    console.warn('GoGo Gemini chat failed:', err?.message || err);
    return NextResponse.json(
      {
        error: 'Assistant temporarily unavailable',
        code: err?.code === 'quota' ? 'busy' : 'unavailable',
        fallback: true,
      },
      { status: 503 },
    );
  }
}
