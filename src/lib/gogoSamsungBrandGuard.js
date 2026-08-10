/**
 * Hard rules: GoGo product answers are Samsung-only.
 * GSMArena page IDs get reused — always verify page title/name matches Samsung + asked model.
 */

import { extractModelHints, normalizeProductQuery } from './gogoSamsungProducts';

/** Categories GoGo is allowed to discuss (Samsung brand only). */
export const GOGO_SAMSUNG_CATEGORIES = [
  'mobile',
  'tablet',
  'watch',
  'buds',
  'washing_machine',
  'vacuum',
  'air_conditioning',
  'tv',
  'accessory',
];

export const NON_SAMSUNG_BRAND_RE =
  /\b(xiaomi|redmi|poco|apple|iphone|ipad|huawei|honor|oppo|vivo|realme|oneplus|google\s*pixel|pixel\s*\d|motorola|nokia|sony|asus|lenovo|tecno|infinix|itel|nothing\s*phone|trump\s*mobile|htc|meizu|sharp|tcl|blackberry)\b/i;

export function isNonSamsungBrandText(text) {
  return NON_SAMSUNG_BRAND_RE.test(String(text || ''));
}

export function isSamsungProductName(name) {
  const s = String(name || '').trim();
  if (!s) return false;
  if (isNonSamsungBrandText(s)) return false;
  return /^(samsung\s+)?galaxy\b/i.test(s) || /^samsung\b/i.test(s);
}

/** HTML/title must be a Samsung product page, not a recycled GSMArena ID for another brand. */
export function pageLooksLikeSamsung(htmlOrTitle, query = '') {
  const raw = String(htmlOrTitle || '');
  const title =
    (raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, ' ') ||
    (raw.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] ||
    raw.slice(0, 200);
  const clean = String(title).replace(/\s+/g, ' ').trim();
  if (!clean) return false;
  if (isNonSamsungBrandText(clean)) return false;
  if (!/samsung|galaxy/i.test(clean)) return false;
  if (query && !productNameMatchesQuery(clean, query)) return false;
  return true;
}

export function productNameMatchesQuery(name, query) {
  const hints = extractModelHints(query);
  if (!hints.length) {
    // Soft: if query has no model hint, require Samsung/Galaxy in name only
    return isSamsungProductName(name);
  }
  const compact = normalizeProductQuery(name).replace(/\s+/g, '');
  const nameHints = extractModelHints(name);
  // Prefer exact seriesKey overlap (s25fe vs s25, a36 vs a37)
  if (nameHints.some((h) => hints.includes(h))) return true;

  // Fallback token checks for FE / Ultra / Plus
  for (const h of hints) {
    if (compact.includes(h)) return true;
    if (h.endsWith('fe') && compact.includes(h.replace(/fe$/, '')) && /\bfe\b|fan/.test(normalizeProductQuery(name))) {
      return true;
    }
  }
  return false;
}

export function isAcceptableSamsungProduct(product, query = '') {
  if (!product) return false;
  const name = product.name_en || product.name_ar || '';
  const blob = [name, product.summary_en, product.summary_ar, product.gsmarenaUrl]
    .filter(Boolean)
    .join(' ');
  if (isNonSamsungBrandText(blob)) return false;
  if (!isSamsungProductName(name)) return false;
  if (product.brand && !/^samsung$/i.test(String(product.brand))) return false;
  if (product.gsmarenaUrl && /gsmarena\.com\//i.test(product.gsmarenaUrl)) {
    if (!/gsmarena\.com\/samsung_/i.test(product.gsmarenaUrl)) return false;
  }
  if (query) {
    const hints = extractModelHints(query);
    if (hints.length) {
      const keys = product.seriesKeys || [];
      const nameOk = productNameMatchesQuery(name, query);
      const keyOk = hints.some((h) => keys.includes(h));
      if (!nameOk && !keyOk) return false;
    }
  }
  return true;
}

export function getSamsungOnlyRefuseReply(lang = 'en') {
  return lang === 'ar'
    ? 'GoGo بيرد على منتجات Samsung فقط: موبايلات، تابلت، ساعات، سماعات Buds، غسالات، مكانس، تكييف، تلفزيونات والإكسسوارات. لو حابب، اسأل عن موديل Galaxy معيّن.'
    : 'GoGo only answers about Samsung products: mobiles, tablets, watches, Buds, washing machines, vacuums, air conditioning, TVs, and accessories. Ask about a specific Galaxy model if you want specs.';
}

export function getUnverifiedSamsungModelReply(lang = 'en', query = '') {
  return lang === 'ar'
    ? 'بيانات المنتج دي غير متاحة حالياً. خليك متابع للتحديثات الجديدة.'
    : 'These product data are currently unavailable. Stay tuned for new updates.';
}
