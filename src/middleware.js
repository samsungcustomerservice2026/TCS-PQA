import { NextResponse } from 'next/server';

const MAIN_ORIGIN = 'https://samsungeg-scora.vercel.app';
const JOIN_PATH = '/scora-challenge/join';

function isLegacyQuizHost(host) {
  return host.includes('scora-quiz');
}

function isScoraChallengePlayerHost(host) {
  return host.includes('scora-quiz') || host.includes('scora-challenge');
}

/** Legacy quiz subdomain → main SCORA domain; player hosts → join page. */
export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname, search } = request.nextUrl;

  if (isLegacyQuizHost(host)) {
    if (pathname.startsWith('/quiz/')) {
      const dest = `${MAIN_ORIGIN}/scora-challenge${pathname.slice('/quiz'.length)}${search}`;
      return NextResponse.redirect(dest);
    }
    if (
      pathname === '/'
      || pathname === '/join'
      || pathname === '/scora-challenge'
      || pathname === '/scora-challenge/join'
      || pathname === '/quiz'
      || pathname === '/quiz/'
    ) {
      return NextResponse.redirect(`${MAIN_ORIGIN}${JOIN_PATH}${search}`);
    }
    if (pathname.startsWith('/scora-challenge/')) {
      return NextResponse.redirect(`${MAIN_ORIGIN}${pathname}${search}`);
    }
  }

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
  matcher: ['/', '/join', '/scora-challenge', '/scora-challenge/:path*', '/quiz', '/quiz/:path*'],
};
