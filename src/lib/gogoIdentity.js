/**
 * Public assistant identity.
 * Display: GOGO (EN) / جوجو (AR)
 * Speech: GOGO in English, جوجو in Arabic.
 */
export const ASSISTANT_NAME_EN = 'GOGO';
export const ASSISTANT_NAME_AR = 'جوجو';
/** Spoken form for Arabic TTS. */
export const ASSISTANT_NAME_SPOKEN = 'جوجو';
/** Browser-English fallback when the engine cannot read Arabic script. */
export const ASSISTANT_NAME_SPOKEN_EN_FALLBACK = 'GOGO';

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

export function rewriteAssistantNameForSpeech(text, lang = 'en') {
  const name = lang === 'ar' ? ASSISTANT_NAME_SPOKEN : ASSISTANT_NAME_EN;
  return String(text || '').replace(assistantNamePattern(), name);
}

export function rewriteAssistantNameForBrowserEnglish(text) {
  return String(text || '')
    .replace(/جوجو/g, ASSISTANT_NAME_SPOKEN_EN_FALLBACK)
    .replace(/عارف/g, ASSISTANT_NAME_SPOKEN_EN_FALLBACK)
    .replace(/\bAREF\b/gi, ASSISTANT_NAME_SPOKEN_EN_FALLBACK)
    .replace(/\bGOGO\b/gi, ASSISTANT_NAME_SPOKEN_EN_FALLBACK)
    .replace(/\bGoGo\b/gi, ASSISTANT_NAME_SPOKEN_EN_FALLBACK);
}
