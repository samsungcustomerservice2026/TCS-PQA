import { NextResponse } from 'next/server';

/** SCORA Challenge player domain: always land on join page (works even before a host starts). */
export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;

  if (
    (host.includes('scora-quiz') || host.includes('scora-challenge'))
    && (pathname === '/' || pathname === '/quiz' || pathname === '/quiz/')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/scora-challenge/join';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/quiz', '/quiz/'],
};
