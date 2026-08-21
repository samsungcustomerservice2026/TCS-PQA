'use client';

import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

function GearSvg({ className }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={`plGear-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="55%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#plGear-${gid})`}
        d="M50 8l6 8 10-2 2 10 10 4-4 10 8 6-8 6 4 10-10 4-2 10-10-2-6 8-6-8-10 2-2-10-10-4 4-10-8-6 8-6-4-10 10-4 2-10 10 2 6-8z"
      />
      <circle cx="50" cy="50" r="14" fill="#18181b" stroke="#fdba74" strokeWidth="3" />
      <circle cx="50" cy="50" r="5" fill="#fb923c" />
    </svg>
  );
}

function ArmSvg({ side }) {
  const aid = useId().replace(/:/g, '');
  const flip = side === 'right';
  return (
    <svg viewBox="0 0 60 120" className="w-full h-full" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <linearGradient id={`plArm-${aid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="55%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
      </defs>
      <circle cx="30" cy="14" r="10" fill={`url(#plArm-${aid})`} stroke="#fdba74" strokeWidth="1.5" />
      <rect x="22" y="18" width="16" height="38" rx="6" fill={`url(#plArm-${aid})`} />
      <circle cx="30" cy="58" r="9" fill="#292524" stroke="#f97316" strokeWidth="2" />
      <circle cx="30" cy="58" r="3" fill="#fb923c" />
      <rect x="24" y="62" width="12" height="34" rx="5" fill={`url(#plArm-${aid})`} />
      <path d="M18 96h10l4 16H22z" fill="#fdba74" />
      <path d="M32 96h10l-4 16H28z" fill="#fdba74" />
      <circle cx="30" cy="96" r="5" fill="#ea580c" />
    </svg>
  );
}

/** Steady photo → phone rises, smooth flip, screen eases on (no hard cut) */
export function LaunchMobileScene({ reduce }) {
  if (reduce) {
    return <img src="/mx_logo.png" alt="" className="w-48 h-64 object-contain" draggable={false} />;
  }
  const dur = 2.85;
  return (
    <div className="relative w-[15rem] h-[19rem] sm:w-[17rem] sm:h-[21rem]" style={{ perspective: 1400 }}>
      <motion.img
        src="/mx_logo.png"
        alt=""
        draggable={false}
        className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
        initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        animate={{
          opacity: [1, 0.55, 0.2, 0],
          scale: [1, 0.98, 0.94, 0.9],
          filter: ['blur(0px)', 'blur(0px)', 'blur(2px)', 'blur(6px)'],
        }}
        transition={{ duration: dur, times: [0, 0.28, 0.55, 1], ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 w-[40%] h-[70%]"
        style={{ transformStyle: 'preserve-3d', marginLeft: '-20%', marginTop: '-35%' }}
        initial={{ y: 90, scale: 0.55, opacity: 0, rotateY: 0, rotateX: 8 }}
        animate={{
          y: [90, 8, -6, -10, -10, -6],
          scale: [0.55, 1, 1.06, 1.1, 1.12, 1.18],
          opacity: [0, 1, 1, 1, 1, 0],
          rotateY: [0, 0, 90, 180, 180, 180],
          rotateX: [8, 3, 0, 0, 0, 0],
        }}
        transition={{
          duration: dur,
          times: [0, 0.22, 0.45, 0.62, 0.82, 1],
          ease: [0.33, 0.1, 0.2, 1],
        }}
      >
        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-zinc-500/40 shadow-2xl bg-zinc-900"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <img src="/mx_logo.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </div>

        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-purple-400/40 bg-zinc-950 flex flex-col"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow: '0 0 0 rgba(168,85,247,0)',
          }}
        >
          <motion.div
            className="absolute -inset-3 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.45), transparent 68%)', zIndex: -1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.15, 0.55, 0.7, 0] }}
            transition={{ duration: dur, times: [0, 0.5, 0.62, 0.75, 0.88, 1], ease: 'easeInOut' }}
          />
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-[8%] aspect-square rounded-full bg-zinc-900 z-[2]" />
          <div className="flex-1 m-[5%] rounded-xl overflow-hidden relative bg-black">
            {/* Screen wake — soft brightness ramp, no snap */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 18%, rgba(196,181,253,0.5), transparent 42%), linear-gradient(165deg,#312e81 0%,#1e1b4b 40%,#0f172a 100%)',
              }}
              initial={{ opacity: 0, filter: 'brightness(0.15)' }}
              animate={{
                opacity: [0, 0, 0.25, 0.7, 1, 1, 0],
                filter: [
                  'brightness(0.15)',
                  'brightness(0.15)',
                  'brightness(0.55)',
                  'brightness(1.05)',
                  'brightness(1.2)',
                  'brightness(1.1)',
                  'brightness(0.6)',
                ],
              }}
              transition={{ duration: dur, times: [0, 0.52, 0.6, 0.7, 0.8, 0.9, 1], ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white"
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: [0, 0, 0, 0.45, 1, 1, 0],
                y: [6, 6, 6, 2, 0, 0, -4],
              }}
              transition={{ duration: dur, times: [0, 0.55, 0.62, 0.7, 0.8, 0.9, 1], ease: 'easeOut' }}
            >
              <span className="text-2xl font-black tracking-wide">10:09</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/70">MX Experience</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * French-door fridge: left door hinges on LEFT (opens outward),
 * right door hinges on RIGHT (opens outward).
 */
export function LaunchFridgeScene({ reduce }) {
  if (reduce) {
    return <img src="/ce_logo.png" alt="" className="w-56 h-64 object-contain" draggable={false} />;
  }
  return (
    <div className="relative w-[16rem] h-[20rem] sm:w-[18rem] sm:h-[22rem]" style={{ perspective: 1400 }}>
      <motion.img
        src="/ce_logo.png"
        alt=""
        draggable={false}
        className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: [1, 0.4, 0], scale: [1, 0.95, 0.88] }}
        transition={{ duration: 2.6, times: [0, 0.3, 1] }}
      />

      <motion.div
        className="absolute left-1/2 top-[52%] w-[9.5rem] h-[14rem] -ml-[4.75rem] -mt-[7rem]"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ y: 80, scale: 0.4, opacity: 0 }}
        animate={{ y: [80, -4, -6], scale: [0.4, 1.05, 1.1], opacity: [0, 1, 1] }}
        transition={{ duration: 2.6, times: [0, 0.32, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Cabinet body */}
        <div
          className="absolute inset-0 rounded-2xl border border-zinc-500/40 shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #5a5a5f 0%, #2a2a2e 45%, #1a1a1d 100%)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Lit interior */}
          <motion.div
            className="absolute inset-[7%] rounded-md"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(186,230,253,0.25) 30%, #0c4a6e 100%)',
              boxShadow: 'inset 0 0 30px rgba(125,211,252,0.45)',
            }}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.2, 1] }}
            transition={{ duration: 2.6, times: [0, 0.4, 1] }}
          >
            <div className="absolute left-[8%] right-[8%] top-[18%] h-[2px] bg-white/25" />
            <div className="absolute left-[8%] right-[8%] top-[42%] h-[2px] bg-white/20" />
            <div className="absolute left-[8%] right-[8%] top-[66%] h-[2px] bg-white/15" />
          </motion.div>

          {/* LEFT door — hinge on LEFT outer edge */}
          <motion.div
            className="absolute top-[5%] bottom-[5%] left-[5%] w-[44.5%] rounded-l-md border border-white/10"
            style={{
              background: 'linear-gradient(95deg, #6b6b72 0%, #3f3f46 40%, #27272a 100%)',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.35)',
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: [0, 0, -105] }}
            transition={{ duration: 2.6, times: [0, 0.42, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            {/* handle near center seam */}
            <div className="absolute right-[10%] top-1/2 -mt-6 h-12 w-1.5 rounded-full bg-zinc-300/80" />
          </motion.div>

          {/* RIGHT door — hinge on RIGHT outer edge */}
          <motion.div
            className="absolute top-[5%] bottom-[5%] right-[5%] w-[44.5%] rounded-r-md border border-white/10 overflow-hidden"
            style={{
              background: 'linear-gradient(265deg, #6b6b72 0%, #3f3f46 40%, #27272a 100%)',
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
              boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.35)',
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: [0, 0, 105] }}
            transition={{ duration: 2.6, times: [0, 0.45, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute left-[10%] top-1/2 -mt-6 h-12 w-1.5 rounded-full bg-zinc-300/80" />
            {/* Family Hub screen on right door */}
            <motion.div
              className="absolute left-[18%] right-[18%] top-[22%] bottom-[28%] rounded-sm"
              style={{ background: 'linear-gradient(160deg, #38bdf8, #0284c7)' }}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.2, 1], boxShadow: ['none', 'none', '0 0 18px rgba(56,189,248,0.8)'] }}
              transition={{ duration: 2.6, times: [0, 0.5, 1] }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/** Steady TV photo → set pops forward → powers on */
export function LaunchAvScene({ reduce }) {
  if (reduce) {
    return <img src="/av_division.png" alt="" className="w-64 h-40 object-contain" draggable={false} />;
  }
  return (
    <div className="relative w-[18rem] h-[13rem] sm:w-[22rem] sm:h-[15rem]" style={{ perspective: 1100 }}>
      <motion.img
        src="/av_division.png"
        alt=""
        draggable={false}
        className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: [1, 0.35, 0], scale: [1, 0.95, 0.88] }}
        transition={{ duration: 2.3, times: [0, 0.3, 1] }}
      />

      <motion.div
        className="absolute left-1/2 top-[48%] w-[80%] -translate-x-1/2 -translate-y-1/2"
        initial={{ y: 50, scale: 0.55, opacity: 0, rotateY: -18 }}
        animate={{ y: [50, -4, -6], scale: [0.55, 1.06, 1.12], opacity: [0, 1, 1], rotateY: [-18, 0, 0] }}
        transition={{ duration: 2.3, times: [0, 0.38, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative aspect-video rounded-lg border-2 border-zinc-600 bg-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, rgba(6,182,212,0.55), transparent 55%), linear-gradient(160deg,#083344,#0f172a 40%,#164e63)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1] }}
            transition={{ duration: 2.3, times: [0, 0.42, 0.55, 1] }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 0, 1], scale: [0.92, 0.92, 1] }}
            transition={{ duration: 2.3, times: [0, 0.55, 1] }}
          >
            <strong className="text-cyan-300 text-sm sm:text-base font-black tracking-[0.35em]">SAMSUNG</strong>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">AV · Power On</span>
          </motion.div>
        </div>
        <div className="mx-auto mt-1 h-2.5 w-[12%] bg-zinc-600 rounded-b" />
        <div className="mx-auto h-1 w-[34%] rounded-full bg-zinc-500" />
      </motion.div>
    </div>
  );
}

/** TCS logo pops → robotic arms + gears; fades out with blended backdrop */
export function LaunchTcsScene({ reduce }) {
  const dur = 2.1;
  return (
    <div className="relative w-56 h-56 sm:w-72 sm:h-72">
      <motion.div
        className="absolute inset-[6%]"
        initial={reduce ? false : { scale: 0.4, y: 36, opacity: 0 }}
        animate={{
          scale: [0.4, 1.08, 1, 1, 0.96],
          y: [36, -4, 0, 0, -8],
          opacity: [0, 1, 1, 1, 0],
        }}
        transition={{ duration: reduce ? 0.2 : dur, times: [0, 0.28, 0.4, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src="/fawzy-logo.png"
          alt=""
          className="w-full h-full object-contain drop-shadow-[0_0_32px_rgba(249,115,22,0.55)]"
          draggable={false}
        />
      </motion.div>

      {!reduce && (
        <>
          <motion.div
            className="absolute left-1/2 top-[2%] w-[30%] h-[30%] -translate-x-1/2"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 1, 0], rotate: [0, 220, 320, 360] }}
            transition={{ duration: dur, times: [0, 0.2, 0.7, 1], ease: 'linear' }}
          >
            <GearSvg className="w-full h-full drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
          </motion.div>
          <motion.div
            className="absolute left-[2%] top-[32%] w-[24%] h-[40%]"
            style={{ transformOrigin: 'top center' }}
            initial={{ opacity: 0, rotate: 24, x: -16 }}
            animate={{ opacity: [0, 1, 1, 0], rotate: [24, -12, 6, -2], x: 0 }}
            transition={{ duration: dur, times: [0, 0.22, 0.7, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <ArmSvg side="left" />
          </motion.div>
          <motion.div
            className="absolute right-[2%] top-[32%] w-[24%] h-[40%]"
            style={{ transformOrigin: 'top center' }}
            initial={{ opacity: 0, rotate: -24, x: 16 }}
            animate={{ opacity: [0, 1, 1, 0], rotate: [-24, 12, -6, 2], x: 0 }}
            transition={{ duration: dur, times: [0, 0.22, 0.7, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <ArmSvg side="right" />
          </motion.div>
        </>
      )}
    </div>
  );
}

/** Gold trophy SVG — sits over the seal’s trophy and celebrates */
function PqaTrophySvg({ className }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 80 90" aria-hidden>
      <defs>
        <linearGradient id={`trophyBody-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`trophyShine-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* cup */}
      <path
        fill={`url(#trophyBody-${gid})`}
        d="M22 14h36c1.5 0 2.5 1.4 2.2 2.8L56 46c-1.2 8-8.5 14-16 14s-14.8-6-16-14L20.8 16.8C20.5 15.4 21.5 14 23 14z"
      />
      <path fill={`url(#trophyShine-${gid})`} d="M28 16h8l-2 36h-6z" opacity="0.55" />
      {/* handles */}
      <path
        fill="none"
        stroke={`url(#trophyBody-${gid})`}
        strokeWidth="5"
        strokeLinecap="round"
        d="M22 20c-10 2-14 12-8 20"
      />
      <path
        fill="none"
        stroke={`url(#trophyBody-${gid})`}
        strokeWidth="5"
        strokeLinecap="round"
        d="M58 20c10 2 14 12 8 20"
      />
      {/* stem + base */}
      <rect x="36" y="58" width="8" height="12" rx="2" fill={`url(#trophyBody-${gid})`} />
      <path fill={`url(#trophyBody-${gid})`} d="M28 70h24l4 8H24z" />
      <ellipse cx="40" cy="80" rx="18" ry="4" fill="#92400e" opacity="0.55" />
      {/* star sparkle */}
      <circle cx="40" cy="32" r="3" fill="#fffbeb" opacity="0.9" />
    </svg>
  );
}

/** PQA seal stays steady; trophy itself celebrates (shake/lift), then vanishes */
export function LaunchPqaScene({ reduce }) {
  if (reduce) {
    return (
      <img
        src="/pqa_logo.png"
        alt=""
        className="w-56 h-56 sm:w-72 sm:h-72 object-contain drop-shadow-[0_0_28px_rgba(234,179,8,0.5)]"
        draggable={false}
      />
    );
  }

  return (
    <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
      {/* Steady medal / seal */}
      <motion.img
        src="/pqa_logo.png"
        alt=""
        draggable={false}
        className="absolute inset-0 m-auto w-full h-full object-contain drop-shadow-[0_0_28px_rgba(234,179,8,0.45)]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          scale: [0.92, 1.05, 1.08, 1.08, 0.95],
        }}
        transition={{ duration: 2.2, times: [0, 0.15, 0.35, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Cover the printed trophy so only the animated cup reads */}
      <motion.div
        className="absolute left-1/2 top-[28%] w-[34%] h-[32%] -translate-x-1/2 rounded-[40%] bg-[#c9a227]"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, #e8c547 0%, #c9a227 55%, #b45309 100%)',
          filter: 'blur(0.5px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 2.2, times: [0, 0.12, 0.35, 0.72, 1] }}
        aria-hidden
      />

      {/* Celebrating trophy — lift, rattle, cheer */}
      <motion.div
        className="absolute left-1/2 top-[22%] w-[38%] h-[40%] -translate-x-1/2 will-change-transform drop-shadow-[0_8px_16px_rgba(180,83,9,0.55)]"
        style={{ transformOrigin: '50% 85%' }}
        initial={{ opacity: 0, y: 10, scale: 0.7, rotate: 0 }}
        animate={{
          opacity: [0, 1, 1, 1, 1, 1, 0],
          y: [10, -2, -14, -10, -18, -8, -40],
          scale: [0.7, 1.05, 1.15, 1.1, 1.2, 1.05, 0.4],
          rotate: [0, -6, 8, -10, 9, -4, 0],
          x: [0, -3, 4, -5, 4, -2, 0],
        }}
        transition={{
          duration: 2.2,
          times: [0, 0.12, 0.28, 0.42, 0.58, 0.75, 1],
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <PqaTrophySvg className="w-full h-full" />
      </motion.div>

      {/* Confetti-ish spark bursts while celebrating */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
          style={{ left: `${42 + i * 4}%`, top: '30%' }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
          animate={{
            opacity: [0, 0, 1, 0],
            y: [0, 0, -28 - i * 6, -50 - i * 8],
            x: [0, 0, (i - 2) * 14, (i - 2) * 22],
            scale: [0, 0, 1.2, 0],
          }}
          transition={{ duration: 2.2, times: [0, 0.25, 0.55, 1], delay: i * 0.03 }}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function PortalLaunchScene({ mark, reduce }) {
  const reduced = useReducedMotion() || reduce;
  switch (mark) {
    case 'mobile':
      return <LaunchMobileScene reduce={reduced} />;
    case 'fridge':
      return <LaunchFridgeScene reduce={reduced} />;
    case 'av':
      return <LaunchAvScene reduce={reduced} />;
    case 'tcs':
      return <LaunchTcsScene reduce={reduced} />;
    case 'pqa':
      return <LaunchPqaScene reduce={reduced} />;
    default:
      return null;
  }
}

export const LAUNCH_DURATION_MS = {
  tcs: 2100,
  pqa: 2300,
  mobile: 2900,
  fridge: 2800,
  av: 2400,
};
