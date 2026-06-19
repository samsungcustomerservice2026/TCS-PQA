'use client';

import React from 'react';

export default function QuizOptionShape({ shape = 'square', className = 'w-5 h-5' }) {
  const base = `${className} fill-white shrink-0`;
  switch (shape) {
    case 'triangle':
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><polygon points="12,3 22,21 2,21" /></svg>;
    case 'diamond':
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><polygon points="12,2 22,12 12,22 2,12" /></svg>;
    case 'circle':
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><circle cx="12" cy="12" r="10" /></svg>;
    case 'pentagon':
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><polygon points="12,2 22,9 18,22 6,22 2,9" /></svg>;
    case 'hexagon':
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><polygon points="7,3 17,3 22,12 17,21 7,21 2,12" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" className={base} aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
  }
}
