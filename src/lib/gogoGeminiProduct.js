/**
 * Gemini-backed Samsung product spec extraction (Option D).
 * Prefer URL/HTML-constrained extract; fall back to Google Search grounding.
 * Never trust vague placeholders — callers must validate with isVerifiedProductSpecs.
 */

import {
  GOGO_PRODUCT_SEED,
  findGoGoProduct,
  formatGoGoProductAnswer,
  normalizeProductQuery,
  toFirebaseProductDoc,
} from './gogoSamsungProducts';
import { isWeakProductSpec } from './gogoProductResolve';
import { KNOWN_SAMSUNG_GSM_URLS } from './gogoGsmArenaUrls';
import {
  isAcceptableSamsungProduct,
  isNonSamsungBrandText,
  isSamsungProductName,
} from './gogoSamsungBrandGuard';

export const GEMINI_PRODUCT_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

export function resolveGsmArenaUrlHint(query, product) {
  // Prefer seed URL only if slug still looks Samsung (IDs get recycled on GSMArena).
  if (product?.gsmarenaUrl && /gsmarena\.com\/samsung_/i.test(product.gsmarenaUrl)) {
    return product.gsmarenaUrl;
  }
  const compact = normalizeProductQuery(query).replace(/\s+/g, '');
  const a = compact.match(/a(17|27|36|37|56|57)/);
  if (a && KNOWN_SAMSUNG_GSM_URLS[`a${a[1]}`]) return KNOWN_SAMSUNG_GSM_URLS[`a${a[1]}`];
  if (/s25ultra|s25\s*ultra/.test(compact)) return KNOWN_SAMSUNG_GSM_URLS.s25ultra;
  if (/s25\+|s25plus|s25\s*plus/.test(compact)) return KNOWN_SAMSUNG_GSM_URLS.s25plus;
  if (/s25fe|s25\s*fe/.test(compact)) return KNOWN_SAMSUNG_GSM_URLS.s25fe;
  if (/\bs25\b/.test(compact) || compact.includes('galaxys25')) return KNOWN_SAMSUNG_GSM_URLS.s25;

  const seed = findGoGoProduct(query, GOGO_PRODUCT_SEED) || product;
  if (seed?.gsmarenaUrl && /gsmarena\.com\/samsung_/i.test(seed.gsmarenaUrl)) {
    return seed.gsmarenaUrl;
  }
  return null;
}

export function isVerifiedField(focus, value) {
  const s = String(value || '').trim();
  if (isWeakProductSpec(s)) return false;
  if (focus === 'camera') {
    const mpHits = s.match(/\d+\s*MP/gi) || [];
    return mpHits.length >= 2 && s.length >= 18;
  }
  if (focus === 'battery') return /\d{3,5}\s*mAh/i.test(s);
  if (focus === 'processor') return s.length >= 18 && !/see gsmarena/i.test(s);
  if (focus === 'display') {
    return (/\d+(\.\d+)?\s*(inch|")/i.test(s) || /AMOLED|LCD|Dynamic/i.test(s)) && s.length >= 18;
  }
  return s.length >= 20;
}

export function isVerifiedProductSpecs(product, focus = 'all') {
  if (!product?.specs) return false;
  if (!isAcceptableSamsungProduct(product)) return false;
  const specs = product.specs;
  if (focus && focus !== 'all') {
    return isVerifiedField(focus, specs[focus]);
  }
  const keys = ['processor', 'battery', 'display', 'camera'];
  const ok = keys.filter((k) => isVerifiedField(k, specs[k]));
  return ok.length >= 3;
}

export function htmlToPlainSpecText(html, maxLen = 28000) {
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, maxLen);
}

export function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fence ? fence[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function slugifyId(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/galaxy\s+/g, 'galaxy_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

export function buildProductFromGeminiJson(parsed, { query, urlHint, existing } = {}) {
  if (!parsed || parsed.found === false) return null;

  let name_en = String(parsed.name_en || existing?.name_en || '')
    .replace(/\s+/g, ' ')
    .trim();
  // Normalize "Samsung Galaxy X" → "Galaxy X"
  name_en = name_en.replace(/^Samsung\s+/i, '').trim();
  if (name_en && !/^galaxy\b/i.test(name_en) && /^[sa]\d/i.test(name_en)) {
    name_en = `Galaxy ${name_en}`;
  }
  if (!/^galaxy\b/i.test(name_en) && existing?.name_en) name_en = existing.name_en;
  if (!name_en.startsWith('Galaxy') && name_en) name_en = name_en.replace(/^Galaxy\s+/i, 'Galaxy ');

  // Force Galaxy prefix for Samsung mobiles when query is Galaxy-like
  if (name_en && !/^galaxy\b/i.test(name_en) && /galaxy|samsung|\bs\d|\ba\d/i.test(query || '')) {
    name_en = `Galaxy ${name_en}`.replace(/^Galaxy\s+Galaxy/i, 'Galaxy');
  }

  if (!isSamsungProductName(name_en) || isNonSamsungBrandText(name_en)) return null;
  if (isNonSamsungBrandText(JSON.stringify(parsed))) return null;

  const specsIn = parsed.specs || {};
  const specs = {
    processor: String(specsIn.processor || '').trim(),
    battery: String(specsIn.battery || '').trim(),
    display: String(specsIn.display || '').trim(),
    camera: String(specsIn.camera || '').trim(),
  };
  if (
    isNonSamsungBrandText(specs.processor) ||
    isNonSamsungBrandText(specs.camera) ||
    isNonSamsungBrandText(specs.display)
  ) {
    return null;
  }

  const specs_ar_in = parsed.specs_ar || {};
  const specs_ar = {
    processor: String(specs_ar_in.processor || specs.processor).trim(),
    battery: String(specs_ar_in.battery || specs.battery).trim(),
    display: String(specs_ar_in.display || specs.display).trim(),
    camera: String(specs_ar_in.camera || specs.camera).trim(),
  };

  let gsmarenaUrl = String(parsed.gsmarenaUrl || urlHint || existing?.gsmarenaUrl || '').trim();
  if (gsmarenaUrl && !/gsmarena\.com\/samsung_/i.test(gsmarenaUrl)) {
    gsmarenaUrl = urlHint && /gsmarena\.com\/samsung_/i.test(urlHint) ? urlHint : '';
  }

  const seedHit = findGoGoProduct(query || name_en, GOGO_PRODUCT_SEED) || existing || null;
  const compact = name_en.toLowerCase().replace(/\s+/g, '');
  const seriesKeys = [...(seedHit?.seriesKeys || [])];
  const a = compact.match(/a(\d{2})/);
  const s = compact.match(/s(2[3-9]|30)(ultra|plus|fe)?/);
  if (a && !seriesKeys.includes(`a${a[1]}`)) seriesKeys.push(`a${a[1]}`);
  if (s) {
    const key = `s${s[1]}${s[2] || ''}`;
    if (!seriesKeys.includes(key)) seriesKeys.push(key);
  }

  let variant = seedHit?.variant || 'base';
  if (/ultra/i.test(name_en)) variant = 'ultra';
  else if (/\+|plus/i.test(name_en)) variant = 'plus';
  else if (/\bfe\b/i.test(name_en)) variant = 'fe';
  else if (/fold/i.test(name_en)) variant = 'fold';
  else if (/flip/i.test(name_en)) variant = 'flip';
  else if (/\ba\d{2}\b/i.test(name_en)) variant = 'a-series';

  const id = seedHit?.id || slugifyId(name_en.replace(/^Galaxy\s+/i, 'galaxy_'));

  const product = {
    id,
    name_en: seedHit?.name_en || name_en.replace(/^Galaxy\s+Galaxy/i, 'Galaxy'),
    name_ar: seedHit?.name_ar || name_en,
    brand: 'Samsung',
    series: seedHit?.series || name_en.replace(/^Galaxy\s+/i, '').split(' ')[0],
    variant,
    aliases: Array.from(
      new Set([
        ...(seedHit?.aliases || []),
        name_en.toLowerCase().replace(/^galaxy\s+/i, ''),
        ...seriesKeys,
      ]),
    ),
    seriesKeys: [...new Set(seriesKeys)],
    category:
      seedHit?.category ||
      (variant === 'a-series' ? 'a-series' : /fold|flip/i.test(name_en) ? 'foldable' : 'flagship'),
    gsmarenaUrl: gsmarenaUrl || seedHit?.gsmarenaUrl || '',
    specs,
    specs_ar,
    summary_en:
      String(parsed.summary_en || '').trim() ||
      `${name_en}: ${[specs.processor, specs.battery, specs.camera].filter(Boolean).join(' · ')}.`,
    summary_ar:
      String(parsed.summary_ar || '').trim() ||
      `${name_en}: ${[specs_ar.processor, specs_ar.battery, specs_ar.camera].filter(Boolean).join(' · ')}.`,
    source: 'gemini_grounded',
    type: 'GOGO_PRODUCT_SPEC',
    confidence: String(parsed.confidence || 'medium').toLowerCase(),
  };

  if (!isAcceptableSamsungProduct(product, query)) return null;
  return product;
}

export function buildGeminiProductExtractPrompt({ query, focus, urlHint, pageText }) {
  const focusNote =
    focus && focus !== 'all'
      ? `Visitor focus: ${focus}. Still return ALL four specs if available.`
      : 'Return all four specs.';

  if (pageText) {
    return [
      'You extract Samsung Galaxy product specs ONLY from the PAGE TEXT below (GSMArena-style).',
      'HARD RULES: Samsung / Galaxy only. If the page is Xiaomi, Apple, or any other brand, return {"found":false}.',
      'name_en MUST start with "Galaxy" or "Samsung Galaxy" and MUST match the Query model (e.g. S25 FE ≠ S25, A36 ≠ A37).',
      'If a field is not clearly present, use an empty string — never invent.',
      'Do not use marketing fluff. Prefer concrete numbers (MP, mAh, Hz, chipset name).',
      'For camera, list each module with role when available (e.g. 50 MP wide OIS + 12 MP ultrawide + 10 MP tele + selfie).',
      focusNote,
      `Query: ${query}`,
      urlHint ? `Canonical URL: ${urlHint}` : '',
      'Return ONLY valid JSON (no markdown) with this shape:',
      JSON.stringify({
        found: true,
        confidence: 'high',
        name_en: 'Galaxy …',
        gsmarenaUrl: urlHint || 'https://www.gsmarena.com/samsung_…',
        specs: {
          processor: 'chipset + CPU/GPU if listed',
          battery: 'mAh + charging W',
          display: 'size, type, refresh, resolution',
          camera: 'main modules with MP + selfie + video',
        },
        specs_ar: {
          processor: 'Arabic paraphrase of processor',
          battery: 'Arabic paraphrase',
          display: 'Arabic paraphrase',
          camera: 'Arabic paraphrase',
        },
        summary_en: 'one short sentence',
        summary_ar: 'جملة قصيرة',
      }),
      'PAGE TEXT:',
      pageText,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'You look up Samsung Galaxy product specifications using Google Search.',
    'HARD RULES: Answer ONLY Samsung products (Galaxy phones/tablets/watches/buds). Never return Xiaomi, Apple, or any other brand.',
    'Prefer GSMArena.com pages whose URL starts with samsung_. If you cannot verify the exact model, set found=false.',
    'name_en MUST match the asked model (S25 FE is not S25 Ultra; A36 is not A37).',
    'Never invent megapixels, battery mAh, or chipset names.',
    'Camera must list concrete MP modules when known — never "camera system".',
    focusNote,
    `Find Samsung specs for: ${query}`,
    urlHint ? `Start from this URL if it is still a Samsung page: ${urlHint}` : '',
    'Return ONLY valid JSON (no markdown) with this shape:',
    JSON.stringify({
      found: true,
      confidence: 'high',
      name_en: 'Galaxy …',
      gsmarenaUrl: 'https://www.gsmarena.com/samsung_…',
      specs: {
        processor: '',
        battery: '',
        display: '',
        camera: '',
      },
      specs_ar: {
        processor: '',
        battery: '',
        display: '',
        camera: '',
      },
      summary_en: '',
      summary_ar: '',
    }),
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatGeminiProductResponse(product, lang, focus, query = '') {
  if (!product || !isAcceptableSamsungProduct(product, query)) return null;
  if (!isVerifiedProductSpecs(product, focus)) return null;
  const answer = formatGoGoProductAnswer(product, lang, focus);
  if (!answer || isNonSamsungBrandText(answer)) return null;
  return {
    product: toFirebaseProductDoc(product),
    answer,
    focus,
    source: 'gemini_grounded',
    url: product.gsmarenaUrl || null,
    confidence: product.confidence || 'medium',
  };
}
