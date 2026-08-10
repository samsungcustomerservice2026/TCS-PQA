/**
 * Option A — Bulk GSMArena Samsung catalog ingest.
 *
 * Fetches verified Samsung pages only (URL slug samsung_ + title check),
 * parses core specs, writes src/data/gogoGsmArenaCatalog.json for Firebase/seed merge.
 *
 * Usage:
 *   node scripts/ingest-gsmarena-samsung.mjs
 *
 * Rate-limited; safe to re-run. Never stores non-Samsung pages (GSMArena reuses IDs).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'gogoGsmArenaCatalog.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const URLS = [
  'https://www.gsmarena.com/samsung_galaxy_s25-13610.php',
  'https://www.gsmarena.com/samsung_galaxy_s25+-13609.php',
  'https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php',
  'https://www.gsmarena.com/samsung_galaxy_s25_fe_5g-14042.php',
  'https://www.gsmarena.com/samsung_galaxy_a17-14041.php',
  'https://www.gsmarena.com/samsung_galaxy_a36-13497.php',
  'https://www.gsmarena.com/samsung_galaxy_a37_5g-14378.php',
  'https://www.gsmarena.com/samsung_galaxy_a56_5g-13496.php',
  'https://www.gsmarena.com/samsung_galaxy_a57_5g-14379.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold6-13147.php',
  'https://www.gsmarena.com/samsung_galaxy_z_flip6-13118.php',
];

const NON_SAMSUNG =
  /\b(xiaomi|redmi|poco|apple|iphone|huawei|honor|oppo|vivo|realme|oneplus|google\s*pixel|motorola|nokia|sony|asus|lenovo|tecno|infinix|itel|trump\s*mobile|htc)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function slugifyId(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/^samsung\s+/i, '')
    .replace(/galaxy\s+/g, 'galaxy_')
    .replace(/\+/g, '_plus')
    .replace(/\bplus\b/g, 'plus')
    .replace(/\bultra\b/g, 'ultra')
    .replace(/\bfe\b/g, 'fe')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function urlSlugMatchesTitle(url, title) {
  const slug = ((url.match(/\/samsung_([a-z0-9_+-]+)-\d+\.php/i) || [])[1] || '').toLowerCase();
  const titleCompact = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  if (!slug || !titleCompact) return false;
  const tokens = slug
    .replace(/\+/g, 'plus')
    .split(/_+/)
    .filter((t) => t && !['galaxy', 'samsung', '5g', '4g', 'lte'].includes(t));
  if (!tokens.length) return /samsung|galaxy/.test(title);
  // Require majority of distinctive slug tokens to appear in the title
  const hits = tokens.filter((t) => titleCompact.includes(t.replace(/plus/g, '')) || titleCompact.includes(t));
  return hits.length >= Math.min(2, tokens.length) || (tokens.length === 1 && hits.length === 1);
}

function parsePage(html, url) {
  const title =
    decodeHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '') ||
    decodeHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(
      /\s*-?\s*full phone specifications.*/i,
      '',
    );
  if (!title || NON_SAMSUNG.test(title) || !/samsung|galaxy/i.test(title)) {
    return null;
  }
  if (!urlSlugMatchesTitle(url, title)) {
    console.warn(`slug/title mismatch for ${url} → "${title}"`);
    return null;
  }

  const chipset = pickDataSpec(html, 'chipset');
  const cpu = pickDataSpec(html, 'cpu');
  const gpu = pickDataSpec(html, 'gpu');
  const batteryType = pickDataSpec(html, 'batdescription1') || pickDataSpec(html, 'batsize');
  const displayType = pickDataSpec(html, 'displaytype');
  const displaySize = pickDataSpec(html, 'displaysize');
  const displayRes = pickDataSpec(html, 'displayresolution');
  const mainCam = pickDataSpec(html, 'cam1modules');
  const selfie = pickDataSpec(html, 'cam2modules');
  const videoMain = pickDataSpec(html, 'cam1video');

  const processor = [chipset, cpu && `CPU: ${cpu}`, gpu && `GPU: ${gpu}`].filter(Boolean).join(' — ');
  const battery = batteryType || '';
  const display = [displayType, displaySize, displayRes].filter(Boolean).join(' · ');
  const camera = [mainCam, selfie && `Selfie: ${selfie}`, videoMain && `Video: ${videoMain}`]
    .filter(Boolean)
    .join(' · ');

  if (!processor && !battery && !camera && !display) return null;

  const name_en = title.replace(/^Samsung\s+/i, '').replace(/\s+/g, ' ').trim();
  const nice = /^Galaxy\b/i.test(name_en) ? name_en : `Galaxy ${name_en}`.replace(/^Galaxy\s+Galaxy/i, 'Galaxy');
  const compact = nice.toLowerCase().replace(/\s+/g, '');
  const seriesKeys = [];
  const a = compact.match(/a(\d{2})/);
  const s = compact.match(/s(2[3-9]|30)(ultra|plus|fe)?/);
  if (a) seriesKeys.push(`a${a[1]}`);
  if (s) seriesKeys.push(`s${s[1]}${s[2] || ''}`);

  let variant = 'base';
  if (/ultra/i.test(nice)) variant = 'ultra';
  else if (/\+|plus/i.test(nice)) variant = 'plus';
  else if (/\bfe\b/i.test(nice)) variant = 'fe';
  else if (/fold/i.test(nice)) variant = 'fold';
  else if (/flip/i.test(nice)) variant = 'flip';
  else if (/tab/i.test(nice)) variant = 'tablet';
  else if (/watch/i.test(nice)) variant = 'watch';
  else if (/buds/i.test(nice)) variant = 'buds';
  else if (/\ba\d{2}\b/i.test(nice)) variant = 'a-series';

  return {
    id: slugifyId(nice) || `gsm_${Date.now().toString(36)}`,
    name_en: nice,
    name_ar: nice,
    brand: 'Samsung',
    series: nice.replace(/^Galaxy\s+/i, '').split(' ')[0],
    variant,
    aliases: [nice.toLowerCase().replace(/^galaxy\s+/i, ''), ...seriesKeys],
    seriesKeys: [...new Set(seriesKeys)],
    category:
      variant === 'tablet'
        ? 'tablet'
        : variant === 'watch'
          ? 'watch'
          : variant === 'buds'
            ? 'buds'
            : variant === 'a-series'
              ? 'a-series'
              : /fold|flip/i.test(nice)
                ? 'foldable'
                : 'flagship',
    gsmarenaUrl: url,
    specs: { processor, battery, display, camera },
    specs_ar: { processor, battery, display, camera },
    summary_en: `${nice}: ${[processor, battery, camera].filter(Boolean).join(' · ')}.`,
    summary_ar: `${nice}: ${[processor, battery, camera].filter(Boolean).join(' · ')}.`,
    source: 'gsmarena_bulk',
    type: 'GOGO_PRODUCT_SPEC',
  };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const products = [];
for (const url of URLS) {
  try {
    process.stdout.write(`Fetch ${url} … `);
    const html = await fetchHtml(url);
    const product = parsePage(html, url);
    if (!product) {
      console.log('SKIP (not Samsung / empty)');
    } else {
      products.push(product);
      console.log('OK', product.name_en);
    }
  } catch (err) {
    console.log('FAIL', err.message);
  }
  await sleep(900);
}

if (!products.length) {
  console.error('\nNo products written (likely rate-limited). Keeping previous catalog file untouched.');
  process.exit(2);
}

mkdirSync(dirname(OUT), { recursive: true });
const payload = {
  source: 'gsmarena_bulk',
  updatedAt: new Date().toISOString(),
  note: 'Samsung-only GSMArena ingest. Title-verified. Re-run: node scripts/ingest-gsmarena-samsung.mjs',
  products,
};
writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`\nWrote ${products.length} products → ${OUT}`);
