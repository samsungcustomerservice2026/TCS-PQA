/** Kahoot-style answer colors and shapes */

export const QUIZ_MAX_OPTIONS = 6;
export const QUIZ_MIN_OPTIONS = 2;
export const QUIZ_TIME_PRESETS = [5, 10, 20, 30, 45, 60, 90, 120];

export const QUIZ_OPTION_STYLES = [
  { bg: 'bg-[#e21b3c]', border: 'border-[#c41230]', shape: 'triangle' },
  { bg: 'bg-[#1368ce]', border: 'border-[#0d4a94]', shape: 'diamond' },
  { bg: 'bg-[#d89e00]', border: 'border-[#b8860b]', shape: 'circle' },
  { bg: 'bg-[#26890c]', border: 'border-[#1d6a09]', shape: 'square' },
  { bg: 'bg-[#9c27b0]', border: 'border-[#7b1fa2]', shape: 'pentagon' },
  { bg: 'bg-[#ff6f00]', border: 'border-[#e65100]', shape: 'hexagon' },
];

export function getOptionStyle(index) {
  return QUIZ_OPTION_STYLES[index % QUIZ_OPTION_STYLES.length];
}
