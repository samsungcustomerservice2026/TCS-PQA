/** Inline boot script — runs before React/Firebase so Next never paints "[object Event]". */
export const GOGO_BOOT_ERROR_GUARD = `(function(){
  if (typeof window === 'undefined' || window.__gogoBootErrorGuard) return;
  window.__gogoBootErrorGuard = true;
  function isFirestore(v){
    return /FIRESTORE|INTERNAL ASSERTION FAILED|Unexpected state \\(ID: (b815|ca9)\\)/i.test(String((v && v.message) || v || ''));
  }
  function isEventish(v){
    if (v == null) return false;
    if (typeof Event !== 'undefined' && v instanceof Event) return true;
    return !!(typeof v === 'object' && !(v instanceof Error) && 'isTrusted' in v && !v.message);
  }
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    if (isFirestore(r) || isEventish(r)) {
      try { e.preventDefault(); } catch (_) {}
    }
  }, true);
  window.addEventListener('error', function(e){
    if (!e) return;
    if (isFirestore(e.error) || isFirestore(e.message) || isEventish(e.error)) {
      try { e.preventDefault(); } catch (_) {}
    }
  }, true);
})();`;
