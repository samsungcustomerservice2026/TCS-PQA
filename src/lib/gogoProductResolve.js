/**
 * Product resolve helpers: history context, weak-answer detection, live search client.
 */

import {
  detectSpecFocus,
  findGoGoProduct,
  formatGoGoProductAnswer,
  normalizeProductQuery,
} from './gogoSamsungProducts';

const WEAK_SPEC_RE =
  /camera system|a-series camera|see gsmarena|ask processor|mid-range galaxy|confirm region|exact sku|typical fe|galaxy a\d{2} display|around 4,700|class battery|^fe camera|^a\d{2} camera|كاميرا a\d{2}/i;

export function isWeakProductSpec(value) {
  const s = String(value || '').trim();
  if (!s) return true;
  if (/^[a-z0-9+.\s-]{0,12}\s*camera\s*system\.?$/i.test(s)) return true;
  if (/^كاميرا\s*a?\d{0,2}\.?$/i.test(s)) return true;
  if (s.length < 24) return true;
  return WEAK_SPEC_RE.test(s);
}

export function isSpecFollowUpQuestion(text) {
  const q = normalizeProductQuery(text);
  if (!q) return false;
  if (findGoGoProduct(q)) return false;
  return (
    detectSpecFocus(q) !== 'all' ||
    /^(specs?|مواصفات|كاميرا|camera|battery|بطارية|processor|معالج|display|شاشة)\b/i.test(q) ||
    /specs?\s+of|مواصفات/i.test(q)
  );
}

/** Pull the last mentioned Galaxy model from recent chat turns. */
export function findLastProductFromHistory(messages = [], catalog) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const m = list[i];
    const blob = [m?.text, m?.question, m?.productName].filter(Boolean).join(' ');
    const hit = findGoGoProduct(blob, catalog);
    if (hit) return hit;
  }
  return null;
}

/**
 * Build an effective search query using current text + chat history.
 */
export function resolveProductQueryWithHistory(text, messages = [], catalog) {
  const raw = String(text || '').trim();
  const direct = findGoGoProduct(raw, catalog);
  if (direct) {
    return {
      query: raw,
      product: direct,
      focus: detectSpecFocus(raw),
      fromHistory: false,
    };
  }

  if (isSpecFollowUpQuestion(raw)) {
    const last = findLastProductFromHistory(messages, catalog);
    if (last) {
      const focus = detectSpecFocus(raw);
      const focusWord =
        focus === 'all' ? 'specs' : focus === 'cover_display' ? 'display' : focus;
      return {
        query: `${last.name_en} ${focusWord}`,
        product: last,
        focus,
        fromHistory: true,
      };
    }
  }

  return {
    query: raw,
    product: null,
    focus: detectSpecFocus(raw),
    fromHistory: false,
  };
}

export function needsLiveProductSearch(product, focus = 'all') {
  if (!product) return true;
  const specs = product.specs || {};
  if (focus && focus !== 'all') {
    return isWeakProductSpec(specs[focus] || (focus === 'display' ? specs.display : ''));
  }
  return (
    isWeakProductSpec(specs.camera) ||
    isWeakProductSpec(specs.processor) ||
    isWeakProductSpec(specs.battery) ||
    isWeakProductSpec(specs.display)
  );
}

/** Call server search (GSMArena scrape) and return a product-shaped object. */
export async function searchGoGoProductLive({ query, focus = 'all', lang = 'en' } = {}) {
  const res = await fetch('/api/gogo/product-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, focus, lang }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.product) {
    const err = new Error(data?.error || 'Product search failed');
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Option D: Gemini grounded product specs (HTML extract and/or Google Search).
 * Validates on the server — only returns when specs pass quality checks.
 */
export async function searchGoGoProductGemini({
  query,
  focus = 'all',
  lang = 'en',
  gsmarenaUrl = '',
} = {}) {
  const res = await fetch('/api/gogo/product-gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, focus, lang, gsmarenaUrl: gsmarenaUrl || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.product) {
    const err = new Error(data?.error || 'Gemini product search failed');
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function answerFromProduct(product, lang, focus) {
  return formatGoGoProductAnswer(product, lang, focus);
}
