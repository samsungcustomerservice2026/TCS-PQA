/** Clean reply text for spoken delivery (safe on server + client). */
export function textForSpeech(text, lang = 'en') {
  let s = String(text || '');
  s = s
    .replace(/[👋👇💭👉✨🎯📌✅❌•·]/gu, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/`+/g, '')
    .replace(/\([^)]{0,40}\)/g, ' ')
    .replace(/\[[^\]]{0,40}\]/g, ' ')
    .replace(/[←→➡︎⟶]/g, ', ')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])\1+/g, '$1')
    .trim();

  if (s.length > 320) {
    const cut = s.slice(0, 320);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('؟'));
    s = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
  }

  if (!s && lang === 'ar') s = 'تمام';
  if (!s) s = 'Okay';
  return s;
}
