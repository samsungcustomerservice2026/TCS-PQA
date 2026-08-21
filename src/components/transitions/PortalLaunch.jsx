'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LAUNCH_DURATION_MS, PortalLaunchScene } from '../portal/PortalLaunchScenes';

export const PORTAL_LAUNCH_THEMES = {
  tcs: {
    id: 'tcs',
    mark: 'tcs',
    label: 'TCS Portal',
    tagline: 'Technical Capability System',
    accent: '#2563eb',
    glow: 'rgba(37,99,235,0.4)',
    /** Soft veil that blends with app bg instead of a hard black plate */
    backdrop: 'blend',
  },
  pqa: {
    id: 'pqa',
    mark: 'pqa',
    label: 'PQA Portal',
    tagline: 'Partner Quality Assurance',
    accent: '#eab308',
    glow: 'rgba(234,179,8,0.5)',
    backdrop: 'dim',
  },
  tcs_mx: {
    id: 'tcs_mx',
    mark: 'mobile',
    label: 'MX Division',
    tagline: 'Mobile Experience',
    accent: '#a855f7',
    glow: 'rgba(168,85,247,0.5)',
    backdrop: 'dim',
  },
  tcs_da: {
    id: 'tcs_da',
    mark: 'fridge',
    label: 'DA Division',
    tagline: 'Digital Appliances',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)',
    backdrop: 'dim',
  },
  tcs_av: {
    id: 'tcs_av',
    mark: 'av',
    label: 'AV Division',
    tagline: 'Audio · Visual',
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.45)',
    backdrop: 'dim',
  },
  pqa_mx: {
    id: 'pqa_mx',
    mark: 'mobile',
    label: 'PQA · MX',
    tagline: 'Mobile Experience Centers',
    accent: '#a855f7',
    glow: 'rgba(168,85,247,0.5)',
    backdrop: 'dim',
  },
  pqa_ce: {
    id: 'pqa_ce',
    mark: 'fridge',
    label: 'PQA · CE',
    tagline: 'Consumer Electronics',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.45)',
    backdrop: 'dim',
  },
};

/**
 * Click-only launch: steady card photos stay put; this overlay plays the product pop / robotics / check.
 */
export function PortalLaunchOverlay({ event, onComplete }) {
  const reduce = useReducedMotion();
  const theme = event ? PORTAL_LAUNCH_THEMES[event.theme] || PORTAL_LAUNCH_THEMES.tcs : null;
  const sceneMs = theme ? (LAUNCH_DURATION_MS[theme.mark] || 2000) : 2000;
  const blend = theme?.backdrop === 'blend';

  useEffect(() => {
    if (!event || !theme) return undefined;
    const ms = reduce ? 280 : event.durationMs || sceneMs;
    const t = window.setTimeout(() => onComplete?.(event), ms);
    return () => window.clearTimeout(t);
  }, [event, theme, onComplete, reduce, sceneMs]);

  return (
    <AnimatePresence>
      {event && theme ? (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: blend ? 0.45 : 0.2 } }}
          transition={{ duration: blend ? 0.5 : 0.25 }}
          aria-hidden
        >
          {/* Backdrop: TCS blends with app bg; others use a soft dim */}
          {blend ? (
            <>
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,23,42,0.35), transparent 70%), linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.28))',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: sceneMs / 1000, times: [0, 0.18, 0.72, 1], ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 42%, ${theme.glow}, transparent 62%)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0.7, 0] }}
                transition={{ duration: sceneMs / 1000, times: [0, 0.22, 0.65, 1], ease: 'easeInOut' }}
              />
            </>
          ) : (
            <>
              <motion.div
                className="absolute inset-0 bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: sceneMs / 1000, times: [0, 0.12, 0.78, 1], ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 42%, ${theme.glow}, transparent 58%)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.85, 0] }}
                transition={{ duration: sceneMs / 1000, times: [0, 0.15, 0.75, 1], ease: 'easeInOut' }}
              />
            </>
          )}

          <div className="relative z-[1] flex flex-col items-center gap-6 px-4">
            <PortalLaunchScene mark={theme.mark} reduce={reduce} />

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -6] }}
              transition={{ duration: sceneMs / 1000, times: [0, 0.15, 0.75, 1], ease: 'easeInOut' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: theme.accent }}>
                Launching
              </p>
              <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white italic mt-1">
                {theme.label}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{theme.tagline}</p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Hook: run a logo launch, then execute navigation. */
export function usePortalLaunch() {
  const [event, setEvent] = useState(null);

  const launch = useCallback((theme, thenFn, durationMs) => {
    const id = `${theme}-${Date.now()}`;
    const mark = PORTAL_LAUNCH_THEMES[theme]?.mark;
    const auto = mark ? LAUNCH_DURATION_MS[mark] : 2000;
    setEvent({ id, theme, thenFn, durationMs: durationMs ?? auto });
  }, []);

  const onComplete = useCallback((ev) => {
    try {
      ev?.thenFn?.();
    } finally {
      setEvent(null);
    }
  }, []);

  const overlay = <PortalLaunchOverlay event={event} onComplete={onComplete} />;

  return { launch, overlay, busy: !!event };
}

export function MotionStage({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className = '', index = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 36, scale: 0.94, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.55, delay: 0.12 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -8, transition: { duration: 0.25 } }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}
