/**
 * Safe URL fetch helpers — block SSRF to localhost / private / metadata IPs.
 */

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
]);

function ipv4ToInt(ip) {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isPrivateIpv4(ip) {
  const n = ipv4ToInt(ip);
  if (n == null) return false;
  const ranges = [
    [ipv4ToInt('0.0.0.0'), ipv4ToInt('0.255.255.255')],
    [ipv4ToInt('10.0.0.0'), ipv4ToInt('10.255.255.255')],
    [ipv4ToInt('127.0.0.0'), ipv4ToInt('127.255.255.255')],
    [ipv4ToInt('169.254.0.0'), ipv4ToInt('169.254.255.255')],
    [ipv4ToInt('172.16.0.0'), ipv4ToInt('172.31.255.255')],
    [ipv4ToInt('192.168.0.0'), ipv4ToInt('192.168.255.255')],
  ];
  return ranges.some(([a, b]) => n >= a && n <= b);
}

/**
 * @param {string} rawUrl
 * @param {{ allowHosts?: string[] }} [opts]
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
export function assertSafePublicHttpsUrl(rawUrl, opts = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only HTTPS URLs are allowed' };
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    return { ok: false, error: 'Host is not allowed' };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && isPrivateIpv4(host)) {
    return { ok: false, error: 'Private IP addresses are not allowed' };
  }

  if (host.includes(':')) {
    // Block IPv6 localhost / link-local shorthand
    if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
      return { ok: false, error: 'Private IPv6 addresses are not allowed' };
    }
  }

  const allow = opts.allowHosts;
  if (Array.isArray(allow) && allow.length > 0) {
    const okHost = allow.some((h) => host === h.toLowerCase() || host.endsWith(`.${h.toLowerCase()}`));
    if (!okHost) return { ok: false, error: 'Host is not on the allowlist' };
  }

  return { ok: true, url: parsed };
}

export async function fetchSafeHttpsBuffer(rawUrl, { maxBytes = 8 * 1024 * 1024, timeoutMs = 15000, allowHosts } = {}) {
  const check = assertSafePublicHttpsUrl(rawUrl, { allowHosts });
  if (!check.ok) {
    const err = new Error(check.error);
    err.code = 'ssrf_blocked';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(check.url.toString(), {
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: '*/*' },
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len > maxBytes) throw new Error('Response too large');
    const ab = await res.arrayBuffer();
    if (ab.byteLength > maxBytes) throw new Error('Response too large');
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}
