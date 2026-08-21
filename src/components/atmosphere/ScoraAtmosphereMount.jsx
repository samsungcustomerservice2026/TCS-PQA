'use client';

import React, { useEffect, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function isLowEndDevice() {
  if (typeof navigator === 'undefined') return false;
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if (typeof mem === 'number' && mem > 0 && mem <= 4) return true;
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return true;
  try {
    if (localStorage.getItem('scoraDisable3d') === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Lazy WebGL atmosphere with graceful degradation.
 * Fully usable without 3D (CSS gradient fallback).
 */
export default function ScoraAtmosphereMount({ intensity = 'subtle' }) {
  const [ready, setReady] = useState(false);
  const [Scene, setScene] = useState(null);
  const [use3d, setUse3d] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(true);

    if (prefersReducedMotion() || isLowEndDevice()) {
      setUse3d(false);
      return undefined;
    }

    setUse3d(true);
    const t = window.setTimeout(() => {
      import('./ScoraAtmosphere3D')
        .then((mod) => {
          if (!cancelled) setScene(() => mod.default);
        })
        .catch(() => {
          /* optional */
        });
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready || !use3d || !Scene) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
        style={{
          background:
            intensity === 'command'
              ? 'radial-gradient(ellipse 70% 50% at 85% 18%, rgba(37,99,235,0.16), transparent 60%)'
              : 'radial-gradient(ellipse 55% 40% at 90% 10%, rgba(37,99,235,0.1), transparent 55%)',
        }}
      />
    );
  }

  return <Scene intensity={intensity} />;
}
