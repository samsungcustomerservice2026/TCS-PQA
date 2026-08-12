import { NextResponse } from 'next/server';
import { detectSpecFocus, findGoGoProduct, GOGO_PRODUCT_SEED } from '../../../../lib/gogoSamsungProducts';
import {
  GEMINI_PRODUCT_MODELS,
  buildGeminiProductExtractPrompt,
  buildProductFromGeminiJson,
  extractJsonObject,
  formatGeminiProductResponse,
  htmlToPlainSpecText,
  isVerifiedProductSpecs,
  resolveGsmArenaUrlHint,
} from '../../../../lib/gogoGeminiProduct';
import {
  getSamsungOnlyRefuseReply,
  getUnverifiedSamsungModelReply,
  isNonSamsungBrandText,
  pageLooksLikeSamsung,
} from '../../../../lib/gogoSamsungBrandGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function modelCandidates(preferred) {
  return [...new Set([preferred, ...GEMINI_PRODUCT_MODELS].filter(Boolean))];
}

function classifyGeminiError(message = '', status = 0) {
  const msg = String(message || '').toLowerCase();
  if (status === 429 || /quota|rate limit|resource_exhausted/.test(msg)) return 'quota';
  if (status === 404 || /not found|no longer available/.test(msg)) return 'model_unavailable';
  if (status === 400 && /api key|invalid/.test(msg)) return 'invalid_key';
  if (status === 403 || /permission|api key/.test(msg)) return 'invalid_key';
  return 'gemini_error';
}

async function fetchGsmArenaPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GSMArena fetch ${res.status}`);
  return res.text();
}

async function callGeminiOnce({ apiKey, model, prompt, useSearch }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
  if (useSearch) {
    body.tools = [{ google_search: {} }];
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

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    const err = new Error('Empty Gemini product response');
    err.code = 'empty_response';
    err.model = model;
    throw err;
  }
  return { text, model, grounding: data?.candidates?.[0]?.groundingMetadata || null };
}

async function callGemini({ apiKey, preferredModel, prompt, useSearch }) {
  const models = modelCandidates(preferredModel);
  let lastErr = null;
  for (const candidate of models) {
    try {
      return await callGeminiOnce({ apiKey, model: candidate, prompt, useSearch });
    } catch (err) {
      lastErr = err;
      const retryable =
        err?.code === 'quota' || err?.code === 'model_unavailable' || err?.code === 'empty_response';
      if (!retryable) throw err;
      console.warn(`GoGo product Gemini model ${candidate} failed (${err.code}):`, err.message);
    }
  }
  throw lastErr || new Error('Gemini unavailable');
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  const query = String(body?.query || '').trim().slice(0, 160);
  const focus = body?.focus || detectSpecFocus(query);
  const existing = findGoGoProduct(query, GOGO_PRODUCT_SEED);

  if (!query) {
    return NextResponse.json({ error: 'Empty query' }, { status: 400 });
  }

  if (isNonSamsungBrandText(query)) {
    return NextResponse.json({
      error: 'Samsung only',
      reply: getSamsungOnlyRefuseReply(lang),
    }, { status: 422 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Gemini unavailable',
        code: 'unavailable',
        reply:
          lang === 'ar'
            ? 'بحث المواصفات الذكي غير متاح حالياً (مفتاح Gemini).'
            : 'Smart product lookup is unavailable (missing Gemini key).',
      },
      { status: 503 },
    );
  }

  const preferredModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const urlHint =
    String(body?.gsmarenaUrl || '').trim() || resolveGsmArenaUrlHint(query, existing);

  try {
    let pageText = '';
    let usedUrl = urlHint;
    if (urlHint && /gsmarena\.com\/samsung_/i.test(urlHint)) {
      try {
        const html = await fetchGsmArenaPage(urlHint);
        // GSMArena reuses numeric IDs — refuse HTML if title is not the asked Samsung model.
        if (pageLooksLikeSamsung(html, query)) {
          pageText = htmlToPlainSpecText(html);
        } else {
          console.warn('GoGo Gemini: rejecting recycled/non-matching GSMArena page', urlHint);
          pageText = '';
          usedUrl = null;
        }
      } catch (err) {
        console.warn('GoGo Gemini: GSMArena page fetch failed:', err?.message || err);
        pageText = '';
      }
    }

    // Pass 1: HTML-constrained extract (lowest hallucination)
    if (pageText && pageText.length > 400) {
      const prompt = buildGeminiProductExtractPrompt({
        query,
        focus,
        urlHint: usedUrl || urlHint,
        pageText,
      });
      const { text, model } = await callGemini({
        apiKey,
        preferredModel,
        prompt,
        useSearch: false,
      });
      const parsed = extractJsonObject(text);
      const product = buildProductFromGeminiJson(parsed, {
        query,
        urlHint: usedUrl || urlHint,
        existing,
      });
      const packed = formatGeminiProductResponse(product, lang, focus, query);
      if (packed) {
        return NextResponse.json({
          ...packed,
          model,
          mode: 'html_extract',
          url: usedUrl || urlHint,
        });
      }
    }

    // Pass 2: Google Search grounding (Samsung-only prompt)
    const searchPrompt = buildGeminiProductExtractPrompt({
      query: `Samsung Galaxy ${query}`,
      focus,
      urlHint: usedUrl || urlHint,
      pageText: '',
    });
    const grounded = await callGemini({
      apiKey,
      preferredModel,
      prompt: searchPrompt,
      useSearch: true,
    });
    const parsed = extractJsonObject(grounded.text);
    const product = buildProductFromGeminiJson(parsed, {
      query,
      urlHint: usedUrl || urlHint,
      existing,
    });
    const packed = formatGeminiProductResponse(product, lang, focus, query);
    if (packed) {
      return NextResponse.json({
        ...packed,
        model: grounded.model,
        mode: 'google_search',
        url: product.gsmarenaUrl || usedUrl,
      });
    }

    return NextResponse.json(
      {
        error: 'Unverified specs',
        reply: getUnverifiedSamsungModelReply(lang, query),
        rawFound: !!parsed?.found,
        verified: product ? isVerifiedProductSpecs(product, focus) : false,
      },
      { status: 422 },
    );
  } catch (err) {
    console.warn('GoGo product Gemini failed:', err?.message || err);
    return NextResponse.json(
      {
        error: 'Gemini product search failed',
        code: err?.code || 'gemini_error',
        reply: getUnverifiedSamsungModelReply(lang, query),
      },
      { status: err?.code === 'quota' ? 429 : 503 },
    );
  }
}
