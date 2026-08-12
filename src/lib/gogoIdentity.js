/**
 * Public assistant identity.
 * Display: AREF (EN) / عارف (AR)
 * Speech: always Arabic عارف so English TTS keeps the Egyptian pronunciation.
 */
export const ASSISTANT_NAME_EN = 'AREF';
export const ASSISTANT_NAME_AR = 'عارف';
/** Spoken form in every language (Egyptian Arabic pronunciation). */
export const ASSISTANT_NAME_SPOKEN = 'عارف';
/** Browser-English fallback when the engine cannot read Arabic script. */
export const ASSISTANT_NAME_SPOKEN_EN_FALLBACK = 'Aa-ref';

export function assistantDisplayName(lang = 'en') {
  return lang === 'ar' ? ASSISTANT_NAME_AR : ASSISTANT_NAME_EN;
}

function assistantNamePattern() {
  return /\bGoGo\b|\bGogo\b|\bGOGO\b|\bAREF\b|\b3aref\b|\bAa-ref\b|جوجو|عارف/gi;
}

export function rewriteAssistantNameForDisplay(text, lang = 'en') {
  const name = assistantDisplayName(lang);
  return String(text || '').replace(assistantNamePattern(), name);
}

export function rewriteAssistantNameForSpeech(text) {
  return String(text || '').replace(assistantNamePattern(), ASSISTANT_NAME_SPOKEN);
}

export function rewriteAssistantNameForBrowserEnglish(text) {
  return String(text || '')
    .replace(/عارف/g, ASSISTANT_NAME_SPOKEN_EN_FALLBACK)
    .replace(/\bAREF\b/gi, ASSISTANT_NAME_SPOKEN_EN_FALLBACK);
}
