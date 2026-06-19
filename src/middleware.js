import { NextResponse } from 'next/server';

const JOIN_PATH = '/scora-challenge/join';

function isScoraChallengePlayerHost(host) {
  return host.includes('scora-quiz') || host.includes('scora-challenge');
}

/** Player domain: always land on join page (works even before a host starts a game). */
export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;

  if (!isScoraChallengePlayerHost(host)) {
    return NextResponse.next();
  }

  if (
    pathname === '/'
    || pathname === '/join'
    || pathname === '/scora-challenge'
    || pathname === '/quiz'
    || pathname === '/quiz/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = JOIN_PATH;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/quiz/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/scora-challenge${pathname.slice('/quiz'.length)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/join', '/scora-challenge', '/quiz', '/quiz/:path*'],
};
