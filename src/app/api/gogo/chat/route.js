import { NextResponse } from 'next/server';
import { isGoGoDeniedMessage } from '../../../../lib/gogoKnowledge';
import { buildGoGoSystemPrompt, GOGO_SMART_CHIPS } from '../../../../lib/gogoGeminiContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 10;
const MAX_MESSAGE = 800;
const MAX_REPLY = 1200;

/** Prefer env model, then free-tier-friendly Flash aliases. */
const MODEL_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
];

function deniedReply(lang) {
  return lang === 'ar'
    ? 'أقدر أساعد في SCORA وTCS وPQA بس. تحب نبدأ من هناك؟'
    : 'I can help with SCORA, TCS, and PQA. Want to start there?';
}

function needNameReply(lang) {
  return lang === 'ar'
    ? 'قولّي اسمك الأول وبعدين نكمل.'
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

async function callGeminiOnce({ system, history, message, model, apiKey }) {
  const contents = [];
  for (const turn of history) {
    contents.push({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.text }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
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

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    const err = new Error('Empty Gemini response');
    err.code = 'empty_response';
    err.model = model;
    throw err;
  }
  return { text: text.slice(0, MAX_REPLY), model };
}

async function callGemini({ system, history, message, model, apiKey }) {
  const models = modelCandidates(model);
  let lastErr = null;
  for (const candidate of models) {
    try {
      return await callGeminiOnce({ system, history, message, model: candidate, apiKey });
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
    return NextResponse.json({
      reply: deniedReply(lang),
      chips: GOGO_SMART_CHIPS,
      denied: true,
      source: 'guard',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'GEMINI_API_KEY missing in .env.local — add your key and restart npm run dev',
        code: 'missing_key',
        fallback: true,
      },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const system = buildGoGoSystemPrompt({ lang, visitorName });

  try {
    const { text: reply, model: usedModel } = await callGemini({
      system,
      history,
      message,
      model,
      apiKey,
    });
    return NextResponse.json({
      reply,
      chips: GOGO_SMART_CHIPS,
      denied: false,
      source: 'gemini',
      model: usedModel,
      spoken: reply,
    });
  } catch (err) {
    console.warn('GoGo Gemini chat failed:', err?.message || err);
    return NextResponse.json(
      {
        error: String(err?.message || 'Gemini unavailable'),
        code: err?.code || 'gemini_error',
        fallback: true,
      },
      { status: 503 },
    );
  }
}
