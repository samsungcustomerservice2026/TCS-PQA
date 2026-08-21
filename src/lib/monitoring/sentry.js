/**
 * Optional Sentry / error monitoring bootstrap.
 * Set NEXT_PUBLIC_SENTRY_DSN to enable client reporting.
 * Never log passwords, tokens, or API keys.
 */
export function initClientMonitoring() {
  if (typeof window === 'undefined') return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  // Lazy: avoid hard dependency until DSN is configured
  import('@sentry/nextjs')
    .then((Sentry) => {
      if (window.__scoraSentryInit) return;
      window.__scoraSentryInit = true;
      Sentry.init({
        dsn,
        tracesSampleRate: 0.05,
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          return event;
        },
      });
    })
    .catch(() => {
      /* @sentry/nextjs not installed — monitoring optional */
    });
}

export function captureAppError(error, context = {}) {
  if (typeof window !== 'undefined' && window.Sentry?.captureException) {
    window.Sentry.captureException(error, { extra: context });
    return;
  }
  console.error('[scora]', error?.message || error, context);
}
