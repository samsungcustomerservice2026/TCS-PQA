import { NextResponse } from 'next/server';
import { SAMSUNG_KB_PRODUCTION_READY } from './constants';

/** Block unfinished KB APIs in production until flag is true. */
export function assertSamsungKbApiAllowed() {
  if (SAMSUNG_KB_PRODUCTION_READY) return null;
  return NextResponse.json(
    {
      error: 'Samsung Knowledge Base is not production-ready',
      code: 'kb_disabled',
      production_ready: false,
    },
    { status: 503 },
  );
}
