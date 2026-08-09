import { NextResponse } from 'next/server';
import { isGoGoDeniedMessage } from '../../../../lib/gogoKnowledge';
import { buildGoGoSystemPrompt, GOGO_SMART_CHIPS } from '../../../../lib/gogoGeminiContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 10;
const MAX_MESSAGE = 800;
const MAX_REPLY = 1200;

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

async function callGemini({ system, history, message, model, apiKey }) {
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
    throw err;
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    throw new Error('Empty Gemini response');
  }
  return text.slice(0, MAX_REPLY);
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
      { error: 'GEMINI_API_KEY missing', fallback: true },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const system = buildGoGoSystemPrompt({ lang, visitorName });

  try {
    const reply = await callGemini({
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
      spoken: reply,
    });
  } catch (err) {
    console.warn('GoGo Gemini chat failed:', err?.message || err);
    return NextResponse.json(
      {
        error: String(err?.message || 'Gemini unavailable'),
        fallback: true,
      },
      { status: 503 },
    );
  }
}
