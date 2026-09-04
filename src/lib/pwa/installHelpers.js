/**
 * SCORA PWA install + notification helpers.
 * Install prompt listening must start at app boot (see PwaBoot).
 */

export const INSTALL_STORAGE_KEY = 'scora-home-install';
export const PWA_CAN_INSTALL_EVENT = 'scora-can-install';
export const PWA_INSTALLED_EVENT = 'scora-installed';

const deferredPromptRef = { current: null };

export function isIosPhone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    /* ignore */
  }
  return navigator.standalone === true;
}

export function canUseWebPush() {
  if (typeof window === 'undefined') return false;
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function notifyPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const p = Notification.permission;
  if (p === 'granted' || p === 'denied' || p === 'default') return p;
  return 'unsupported';
}

export function shouldAskInstall() {
  if (typeof window === 'undefined') return false;
  if (isStandaloneApp()) return false;
  try {
    if (localStorage.getItem(INSTALL_STORAGE_KEY)) return false;
  } catch {
    return false;
  }
  return true;
}

export function dismissInstallAsk() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INSTALL_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function canNativeInstall() {
  if (typeof window !== 'undefined' && window.__scoraDeferredPrompt) {
    deferredPromptRef.current = window.__scoraDeferredPrompt;
  }
  return !!deferredPromptRef.current;
}

export function getDeferredInstallPrompt() {
  return deferredPromptRef.current;
}

export function listenInstallPrompt() {
  if (typeof window === 'undefined') return () => {};
  if (window.__scoraInstallListenerBound) {
    if (window.__scoraDeferredPrompt) {
      deferredPromptRef.current = window.__scoraDeferredPrompt;
    }
    return () => {};
  }
  window.__scoraInstallListenerBound = true;

  if (window.__scoraDeferredPrompt) {
    deferredPromptRef.current = window.__scoraDeferredPrompt;
  }

  const onBeforeInstall = (e) => {
    e.preventDefault();
    deferredPromptRef.current = e;
    window.__scoraDeferredPrompt = e;
    try {
      window.dispatchEvent(new CustomEvent(PWA_CAN_INSTALL_EVENT));
    } catch {
      /* ignore */
    }
  };

  const onInstalled = () => {
    deferredPromptRef.current = null;
    window.__scoraDeferredPrompt = null;
    dismissInstallAsk();
    try {
      window.dispatchEvent(new CustomEvent(PWA_INSTALLED_EVENT));
    } catch {
      /* ignore */
    }
  };

  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onInstalled);

  return () => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    window.removeEventListener('appinstalled', onInstalled);
    window.__scoraInstallListenerBound = false;
  };
}

/**
 * Must run from a user gesture.
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function promptInstall() {
  if (typeof window !== 'undefined' && window.__scoraDeferredPrompt && !deferredPromptRef.current) {
    deferredPromptRef.current = window.__scoraDeferredPrompt;
  }
  const deferred = deferredPromptRef.current;
  if (!deferred || typeof deferred.prompt !== 'function') {
    return 'unavailable';
  }
  try {
    deferred.prompt();
    const choice = await deferred.userChoice;
    deferredPromptRef.current = null;
    if (typeof window !== 'undefined') window.__scoraDeferredPrompt = null;
    if (choice?.outcome === 'accepted') {
      dismissInstallAsk();
      return 'accepted';
    }
    return 'dismissed';
  } catch {
    deferredPromptRef.current = null;
    if (typeof window !== 'undefined') window.__scoraDeferredPrompt = null;
    return 'unavailable';
  }
}

export function shouldAskNotify() {
  const perm = notifyPermission();
  return perm === 'default' || perm === 'unsupported';
}

export async function registerNotifyWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('SCORA SW register failed', err);
    return null;
  }
}

/** Unlock audio on first gesture (iOS later sound). Call from pointerdown. */
export function unlockAudioOnce() {
  if (typeof window === 'undefined') return;
  if (window.__scoraAudioUnlocked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      window.__scoraAudioUnlocked = true;
      return;
    }
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.01);
    ctx.resume?.();
    window.__scoraAudioUnlocked = true;
  } catch {
    window.__scoraAudioUnlocked = true;
  }
}

/**
 * Subscribe to push. VAPID backend not wired yet — permission + SW still work.
 * TODO: set NEXT_PUBLIC_VAPID_PUBLIC_KEY and POST subscription to backend keyed by userId.
 */
export async function syncPushSubscription(userId) {
  if (!canUseWebPush()) return { ok: false, reason: 'unsupported' };
  if (notifyPermission() !== 'granted') return { ok: false, reason: 'not_granted' };

  const reg = await registerNotifyWorker();
  if (!reg) return { ok: false, reason: 'no_sw' };

  const vapid =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY) ||
    (typeof window !== 'undefined' && window.__SCORA_VAPID_PUBLIC_KEY) ||
    '';

  if (!vapid) {
    // Permission granted; push subscribe deferred until VAPID is configured.
    return { ok: true, deferred: true, reason: 'no_vapid', userId: userId || null };
  }

  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // TODO: POST existing.toJSON() to backend with userId
      return { ok: true, subscription: existing.toJSON(), userId: userId || null };
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    // TODO: POST sub.toJSON() to backend with userId
    return { ok: true, subscription: sub.toJSON(), userId: userId || null };
  } catch (err) {
    console.warn('SCORA push subscribe failed', err);
    return { ok: false, reason: 'subscribe_failed', error: err };
  }
}

export async function enablePhoneAlerts(userId) {
  unlockAudioOnce();
  await registerNotifyWorker();

  if (isIosPhone() && !isStandaloneApp()) {
    return { status: 'need_homescreen' };
  }

  if (!('Notification' in window)) {
    return { status: 'unsupported' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { status: 'blocked' };
    }
  }

  if (permission === 'granted') {
    await syncPushSubscription(userId);
    return { status: 'granted' };
  }
  if (permission === 'denied') {
    return { status: 'denied' };
  }
  return { status: 'blocked' };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}
