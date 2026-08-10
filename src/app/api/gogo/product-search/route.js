import { NextResponse } from 'next/server';
import {
  GOGO_PRODUCT_SEED,
  detectSpecFocus,
  findGoGoProduct,
  formatGoGoProductAnswer,
  getSamsungDataUnavailableReply,
  normalizeProductQuery,
  toFirebaseProductDoc,
} from '../../../../lib/gogoSamsungProducts';
import { isWeakProductSpec } from '../../../../lib/gogoProductResolve';
import { KNOWN_SAMSUNG_GSM_URLS } from '../../../../lib/gogoGsmArenaUrls';
import {
  getSamsungOnlyRefuseReply,
  isAcceptableSamsungProduct,
  isNonSamsungBrandText,
  pageLooksLikeSamsung,
} from '../../../../lib/gogoSamsungBrandGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/** Hardcoded GSMArena pages for models we ship in seed — avoid search-page flakiness. */
const KNOWN_GSM_URLS = KNOWN_SAMSUNG_GSM_URLS;

function slugifyId(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/galaxy\s+/g, 'galaxy_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickDataSpec(html, spec) {
  const re = new RegExp(
    `<td[^>]*class="nfo"[^>]*data-spec="${spec}"[^>]*>([\\s\\S]*?)<\\/td>`,
    'i',
  );
  const m = html.match(re);
  return m ? decodeHtml(m[1]) : '';
}

function pickTableValue(html, labelRe) {
  const re = new RegExp(
    `<td[^>]*>\\s*(?:<[^>]+>\\s*)*${labelRe.source}\\s*(?:<\\/[^>]+>\\s*)*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
    'i',
  );
  const m = html.match(re);
  if (!m) return '';
  return decodeHtml(m[1]);
}

function parseGsmArenaProductPage(html, url, query = '') {
  if (!pageLooksLikeSamsung(html, query || '')) return null;

  const title =
    decodeHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '') ||
    decodeHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(
      /\s*-?\s*full phone specifications.*/i,
      '',
    );

  if (isNonSamsungBrandText(title) || !/samsung|galaxy/i.test(title)) return null;

  const chipset = pickDataSpec(html, 'chipset') || pickTableValue(html, /Chipset/);
  const cpu = pickDataSpec(html, 'cpu') || pickTableValue(html, /CPU/);
  const gpu = pickDataSpec(html, 'gpu') || pickTableValue(html, /GPU/);
  const batteryType =
    pickDataSpec(html, 'batdescription1') ||
    pickDataSpec(html, 'batsize') ||
    pickTableValue(html, /Type/);
  const charging = pickTableValue(html, /Charging/);
  const displayType = pickDataSpec(html, 'displaytype') || pickTableValue(html, /Type/);
  const displaySize = pickDataSpec(html, 'displaysize') || '';
  const displayRes = pickDataSpec(html, 'displayresolution') || '';
  const mainCam =
    pickDataSpec(html, 'cam1modules') ||
    pickTableValue(html, /Triple|Dual|Quad|Single/);
  const selfie = pickDataSpec(html, 'cam2modules') || '';
  const videoMain = pickDataSpec(html, 'cam1video') || '';
  const videoSelfie = pickDataSpec(html, 'cam2video') || '';

  const processor = [chipset, cpu && `CPU: ${cpu}`, gpu && `GPU: ${gpu}`].filter(Boolean).join(' — ');
  const battery = [batteryType, charging && `Charging: ${charging}`].filter(Boolean).join(' — ');
  const display = [displayType, displaySize, displayRes].filter(Boolean).join(' · ');
  const cameraParts = [
    mainCam,
    selfie && `Selfie: ${selfie}`,
    videoMain && `Video: ${videoMain}`,
    videoSelfie && !videoMain && `Selfie video: ${videoSelfie}`,
  ].filter(Boolean);
  const camera = cameraParts.join(' · ');

  if (!title || (!processor && !battery && !camera && !display)) return null;

  const name_en = title.replace(/\s+/g, ' ').trim();
  const id = slugifyId(name_en) || `gsm_${Date.now().toString(36)}`;
  const compact = name_en.toLowerCase().replace(/\s+/g, '');
  const seriesKeys = [];
  const a = compact.match(/a(\d{2})/);
  const s = compact.match(/s(2[3-9]|30)(ultra|plus|fe)?/);
  if (a) seriesKeys.push(`a${a[1]}`);
  if (s) seriesKeys.push(`s${s[1]}${s[2] || ''}`);
  if (/fold8ultra/i.test(compact)) seriesKeys.push('fold8ultra');
  else if (/fold8/i.test(compact)) seriesKeys.push('fold8');
  if (/flip8/i.test(compact)) seriesKeys.push('flip8');

  let variant = 'base';
  if (/ultra/i.test(name_en)) variant = 'ultra';
  else if (/\+|plus/i.test(name_en)) variant = 'plus';
  else if (/\bfe\b/i.test(name_en)) variant = 'fe';
  else if (/fold/i.test(name_en)) variant = 'fold';
  else if (/flip/i.test(name_en)) variant = 'flip';
  else if (/\ba\d{2}\b/i.test(name_en)) variant = 'a-series';

  // Prefer stable seed ids when we already curate this model
  const seedHit = findGoGoProduct(name_en, GOGO_PRODUCT_SEED);
  const stableId = seedHit?.id || id;

  const product = {
    id: stableId,
    name_en: seedHit?.name_en || name_en,
    name_ar: seedHit?.name_ar || name_en,
    brand: 'Samsung',
    series: seedHit?.series || name_en.replace(/^Samsung\s+/i, '').split(' ').slice(0, 2).join(' '),
    variant: seedHit?.variant || variant,
    aliases: Array.from(
      new Set([
        ...(seedHit?.aliases || []),
        name_en.toLowerCase().replace(/^samsung\s+/i, ''),
        ...seriesKeys,
      ]),
    ),
    seriesKeys: [...new Set([...(seedHit?.seriesKeys || []), ...seriesKeys])],
    category:
      seedHit?.category ||
      (variant === 'a-series' ? 'a-series' : /fold|flip/i.test(name_en) ? 'foldable' : 'flagship'),
    gsmarenaUrl: url,
    specs: {
      processor: processor || seedHit?.specs?.processor || '',
      battery: battery || seedHit?.specs?.battery || '',
      display: display || seedHit?.specs?.display || '',
      camera: camera || seedHit?.specs?.camera || '',
    },
    specs_ar: {
      processor: processor || seedHit?.specs_ar?.processor || '',
      battery: battery || seedHit?.specs_ar?.battery || '',
      display: display || seedHit?.specs_ar?.display || '',
      camera: camera || seedHit?.specs_ar?.camera || '',
    },
    summary_en:
      seedHit?.summary_en ||
      `${name_en}: ${[processor && `chipset ${chipset || processor}`, battery, camera].filter(Boolean).join(' · ')}.`,
    summary_ar:
      seedHit?.summary_ar ||
      `${name_en}: ${[processor, battery, camera].filter(Boolean).join(' · ')}.`,
    source: 'gsmarena_live',
    type: 'GOGO_PRODUCT_SPEC',
  };

  return product;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

function resolveKnownUrl(query) {
  const compact = normalizeProductQuery(query).replace(/\s+/g, '');
  const a = compact.match(/a(17|27|36|37|56|57)/);
  if (a && KNOWN_GSM_URLS[`a${a[1]}`]) return KNOWN_GSM_URLS[`a${a[1]}`];
  if (/s25ultra|s25\s*ultra/.test(compact) || /s25ultra/.test(compact)) return KNOWN_GSM_URLS.s25ultra;
  if (/s25\+|s25plus|s25\s*plus/.test(compact)) return KNOWN_GSM_URLS.s25plus;
  if (/s25fe|s25\s*fe/.test(compact)) return KNOWN_GSM_URLS.s25fe;
  if (/\bs25\b/.test(compact) || compact.includes('galaxys25')) return KNOWN_GSM_URLS.s25;
  return null;
}

async function findGsmArenaUrl(query) {
  const q = normalizeProductQuery(query).replace(/\s+/g, ' ');
  const knownMap = resolveKnownUrl(q);
  if (knownMap) return knownMap;

  const known = findGoGoProduct(q, GOGO_PRODUCT_SEED);
  if (known?.gsmarenaUrl && /gsmarena\.com\/samsung_/i.test(known.gsmarenaUrl)) {
    return known.gsmarenaUrl;
  }

  const searchUrl = `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(`samsung ${q}`)}`;
  const html = await fetchText(searchUrl);
  const links = [...html.matchAll(/href="((?:https:\/\/www\.gsmarena\.com\/)?samsung_[a-z0-9_]+-\d+\.php)"/gi)].map(
    (m) => m[1],
  );
  if (!links.length) return null;
  const first = links[0];
  return first.startsWith('http') ? first : `https://www.gsmarena.com/${first}`;
}

function seedFallback(query, lang, focus) {
  const seed = findGoGoProduct(query, GOGO_PRODUCT_SEED);
  if (!seed || !isAcceptableSamsungProduct(seed, query)) return null;
  const specs = seed.specs || {};
  const weak =
    focus && focus !== 'all'
      ? isWeakProductSpec(specs[focus])
      : isWeakProductSpec(specs.camera) ||
        isWeakProductSpec(specs.processor) ||
        isWeakProductSpec(specs.battery) ||
        isWeakProductSpec(specs.display);
  if (weak) return null;
  const answer = formatGoGoProductAnswer(seed, lang, focus);
  if (!answer || isNonSamsungBrandText(answer)) return null;
  if (focus && focus !== 'all' && isWeakProductSpec(specs[focus])) return null;
  return {
    product: toFirebaseProductDoc(seed),
    answer,
    focus,
    source: 'seed_fallback',
    url: seed.gsmarenaUrl || null,
  };
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

  if (!query) {
    return NextResponse.json({ error: 'Empty query' }, { status: 400 });
  }

  if (isNonSamsungBrandText(query)) {
    return NextResponse.json({ error: 'Samsung only', reply: getSamsungOnlyRefuseReply(lang) }, { status: 422 });
  }

  try {
    const url = await findGsmArenaUrl(query);
    if (!url) {
      const fallback = seedFallback(query, lang, focus);
      if (fallback) return NextResponse.json(fallback);
      return NextResponse.json(
        {
          error: 'No product match',
          reply: getSamsungDataUnavailableReply(lang),
        },
        { status: 404 },
      );
    }

    const html = await fetchText(url);
    if (!pageLooksLikeSamsung(html, query)) {
      const fallback = seedFallback(query, lang, focus);
      if (fallback) return NextResponse.json(fallback);
      return NextResponse.json(
        {
          error: 'Non-Samsung or mismatched page',
          reply: getSamsungOnlyRefuseReply(lang),
          url,
        },
        { status: 422 },
      );
    }

    const product = parseGsmArenaProductPage(html, url, query);
    if (!product || !isAcceptableSamsungProduct(product, query)) {
      const fallback = seedFallback(query, lang, focus);
      if (fallback) return NextResponse.json(fallback);
      return NextResponse.json(
        {
          error: 'Parse failed',
          reply: getSamsungDataUnavailableReply(lang),
          url,
        },
        { status: 502 },
      );
    }

    const answer = formatGoGoProductAnswer(product, lang, focus);
    if (!answer || isNonSamsungBrandText(answer)) {
      return NextResponse.json({ error: 'Bad answer', reply: getSamsungOnlyRefuseReply(lang) }, { status: 422 });
    }
    return NextResponse.json({
      product: toFirebaseProductDoc(product),
      answer,
      focus,
      source: 'gsmarena_live',
      url,
    });
  } catch (err) {
    console.warn('GoGo product search failed:', err?.message || err);
    const fallback = seedFallback(query, lang, focus);
    if (fallback) return NextResponse.json(fallback);
    return NextResponse.json(
      {
        error: 'Search unavailable',
        reply: getSamsungDataUnavailableReply(lang),
      },
      { status: 503 },
    );
  }
}
