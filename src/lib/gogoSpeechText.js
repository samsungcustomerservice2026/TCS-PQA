/**
 * Clean reply text for spoken delivery (safe on server + client).
 * Arabic: جوجو + Modern Standard Arabic (فصحى) + lexicon so Edge TTS reads words correctly.
 */
import { toFushaArabic } from './gogoEgyptianDialect';
import {
  applyGoGoSpeechLexicon,
  polishEgyptianDisplay,
  arabizeGoGoLatinTerms,
} from './gogoSpeechLexicon';
import { rewriteAssistantNameForDisplay, rewriteAssistantNameForSpeech } from './gogoIdentity';

export function textForSpeech(text, lang = 'en') {
  let s = String(text || '');
  const isAr = lang === 'ar';

  if (isAr) {
    s = toFushaArabic(s);
    s = applyGoGoSpeechLexicon(s);
  }

  s = rewriteAssistantNameForSpeech(s, lang);

  s = s
    .replace(/[👋👇💭👉✨🎯📌✅❌•·]/gu, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/`+/g, '')
    .replace(/\([^)]{0,40}\)/g, ' ')
    .replace(/\[[^\]]{0,40}\]/g, ' ')
    .replace(/[←→➡︎⟶]/g, ', ')
    .replace(/\bTCS\b/g, isAr ? 'تي سي اس' : 'T C S')
    .replace(/\bPQA\b/g, isAr ? 'بي كيو اي' : 'P Q A')
    .replace(/\bSCORA\b/gi, isAr ? 'سكورا' : 'Scora')
    .replace(/\bMX\b/g, isAr ? 'الموبايل' : 'M X')
    .replace(/\bDA\b/g, isAr ? 'الأجهزة المنزلية' : 'D A')
    .replace(/\bAV\b/g, isAr ? 'الشاشات' : 'A V')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?؟])/g, '$1')
    .replace(/([.!?؟])\1+/g, '$1')
    .trim();

  if (s.length > 420) {
    const cut = s.slice(0, 420);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('؟'));
    s = (lastStop > 100 ? cut.slice(0, lastStop + 1) : cut).trim();
  }

  if (!s && isAr) s = 'تمام';
  if (!s) s = 'Okay';
  return s;
}

/**
 * Display + speech pair for hybrid GoGo replies.
 * Arabic display keeps newlines and converts Latin product/org terms.
 */
export function prepareGoGoReplyPair(text, lang = 'en') {
  const raw = String(text || '');
  const isAr = lang === 'ar';
  let display = rewriteAssistantNameForDisplay(raw, isAr ? 'ar' : 'en');
  if (isAr) {
    display = polishEgyptianDisplay(arabizeGoGoLatinTerms(toFushaArabic(display)));
    display = rewriteAssistantNameForDisplay(display, 'ar');
  }
  return {
    display,
    spoken: textForSpeech(display, lang),
  };
}
