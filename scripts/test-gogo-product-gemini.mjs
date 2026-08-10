/**
 * Smoke-test Option D Gemini product extract (standalone).
 * Usage: node --env-file=.env.local scripts/test-gogo-product-gemini.mjs [query]
 */
const apiKey = process.env.GEMINI_API_KEY;
const models = [
  process.env.GEMINI_MODEL,
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
].filter(Boolean);
const query = process.argv[2] || 'Galaxy S25';
const urlHint = 'https://www.gsmarena.com/samsung_galaxy_s25-13610.php';

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

console.log('query:', query);
console.log('urlHint:', urlHint);

const pageRes = await fetch(urlHint, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html',
  },
});
console.log('GSMArena fetch:', pageRes.status);
let pageText = '';
if (pageRes.ok) {
  let html = await pageRes.text();
  html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  pageText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28000);
}
console.log('pageText chars:', pageText.length);

const prompt = [
  'Extract Samsung Galaxy phone specs ONLY from the PAGE TEXT.',
  'Return ONLY JSON: {"found":true,"confidence":"high","name_en":"","gsmarenaUrl":"","specs":{"processor":"","battery":"","display":"","camera":""},"summary_en":""}',
  'Camera must list MP modules. Never invent. Never write "camera system".',
  `Query: ${query}`,
  `URL: ${urlHint}`,
  'PAGE TEXT:',
  pageText || '(empty — use nothing; set found false)',
].join('\n');

let gemData = null;
let usedModel = null;
for (const model of [...new Set(models)]) {
  const gemRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    },
  );
  const data = await gemRes.json().catch(() => ({}));
  if (gemRes.ok) {
    gemData = data;
    usedModel = model;
    break;
  }
  console.warn('model failed', model, gemRes.status, String(data?.error?.message || '').slice(0, 140));
}

if (!gemData) {
  console.error('All Gemini models failed');
  process.exit(1);
}

const text = gemData?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') || '';
console.log('model:', usedModel);
console.log('raw preview:', text.slice(0, 500));
const start = text.indexOf('{');
const end = text.lastIndexOf('}');
let parsed = null;
try {
  parsed = JSON.parse(text.slice(start, end + 1));
} catch (e) {
  console.error('JSON parse failed', e.message);
  process.exit(1);
}
const camera = parsed?.specs?.camera || '';
const ok = (camera.match(/\d+\s*MP/gi) || []).length >= 2 && camera.length >= 18 && !/camera system$/i.test(camera);
console.log('camera:', camera);
console.log('processor:', parsed?.specs?.processor);
console.log('verified:', ok);
if (!ok) process.exit(2);
console.log('OK');
