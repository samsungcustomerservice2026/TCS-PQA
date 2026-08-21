'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';

/** Shared animated reporting primitives (studio / bklit-style). */

export function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export function StudioShell({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`space-y-5 report-studio ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {title ? (
              <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{title}</h4>
            ) : null}
            {subtitle ? <p className="text-xs text-zinc-400 mt-1">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

export function StudioPanel({ title, children, className = '' }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-5 relative overflow-hidden report-studio-panel ${className}`}>
      <div className="report-studio-grid" aria-hidden />
      {title ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 relative z-[1] mb-3">
          {title}
        </p>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function StudioStat({ label, value, text, suffix = '', tone = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 report-studio-card-in">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`text-xl font-black mt-1 tabular-nums ${tone}`}>
        {text ?? (
          <>
            <AnimatedNumber value={value} />
            {suffix}
          </>
        )}
      </p>
    </div>
  );
}

export function StudioStatGrid({ items = [], cols = 'grid-cols-2 md:grid-cols-4' }) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {items.map((item) => (
        <StudioStat key={item.label} {...item} />
      ))}
    </div>
  );
}

function buildWavePath(values, width, height, pad = 12) {
  const n = values.length;
  if (!n) return '';
  const max = Math.max(1, ...values);
  const step = (width - pad * 2) / Math.max(1, n - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = height - pad - ((Number(v) || 0) / max) * (height - pad * 2);
    return [x, y];
  });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function StudioWave({
  primary = [],
  secondary = [],
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  heightClass = 'h-40',
}) {
  const uid = useId().replace(/:/g, '');
  const a = primary.length ? primary : [0, 0, 0, 0, 0, 0];
  const b = secondary.length ? secondary : [];
  const pathA = buildWavePath(a, 320, 140);
  const pathB = b.length ? buildWavePath(b, 320, 140) : '';

  return (
    <div>
      <svg viewBox="0 0 320 140" className={`w-full ${heightClass}`}>
        <defs>
          <linearGradient id={`rs-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${pathA} L 308 128 L 12 128 Z`} fill={`url(#rs-grad-${uid})`} className="report-studio-wave-fill" />
        <path
          d={pathA}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth="2"
          strokeLinecap="round"
          className="report-studio-wave-line"
        />
        {pathB ? (
          <path
            d={pathB}
            fill="none"
            stroke="#71717a"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            className="report-studio-wave-line report-studio-wave-delay"
          />
        ) : null}
      </svg>
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 mt-1">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-0.5 bg-zinc-200 inline-block" /> {primaryLabel}
        </span>
        {b.length ? (
          <span className="inline-flex items-center gap-1.5">
            <i className="w-3 h-0.5 border-t border-dashed border-zinc-500 inline-block" /> {secondaryLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function StudioDonut({
  segments = [],
  centerValue,
  centerLabel = 'Total',
}) {
  const total = Math.max(
    1,
    segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0),
  );
  const colors = ['#d4d4d8', '#71717a', '#52525b', '#3f3f46', '#a1a1aa'];
  const drawn = [];
  let running = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const pct = ((Number(seg.value) || 0) / total) * 100;
    drawn.push({
      label: seg.label || String(i),
      color: seg.color || colors[i % colors.length],
      value: seg.value,
      pct,
      offset: running,
      delay: `${i * 0.1}s`,
    });
    running += pct;
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
          <circle cx="21" cy="21" r="15.5" fill="none" stroke="#27272a" strokeWidth="5" />
          {drawn.map((seg) => (
            <circle
              key={seg.label}
              cx="21"
              cy="21"
              r="15.5"
              fill="none"
              stroke={seg.color}
              strokeWidth="5"
              strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
              strokeDashoffset={-seg.offset}
              className="report-studio-donut"
              style={{ animationDelay: seg.delay }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-black text-white tabular-nums leading-none">
            <AnimatedNumber value={centerValue ?? total} />
          </p>
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1">{centerLabel}</p>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {drawn.map((seg) => (
          <p key={seg.label} className="text-zinc-300">
            <span
              className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
              style={{ background: seg.color }}
            />
            {seg.label} · {seg.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export function StudioRadial({
  rings = [],
  centerValue,
  centerLabel = 'Total',
}) {
  const radii = [48, 38, 28];
  const circ = radii.map((r) => 2 * Math.PI * r);
  const strokes = ['#e4e4e7', '#a1a1aa', '#71717a'];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="w-48 h-48">
        {radii.map((r) => (
          <circle key={`bg-${r}`} cx="60" cy="60" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        ))}
        {rings.slice(0, 3).map((ring, i) => {
          const pct = Math.min(100, Math.max(0, Number(ring.pct) || 0));
          const c = circ[i];
          return (
            <circle
              key={ring.label || i}
              cx="60"
              cy="60"
              r={radii[i]}
              fill="none"
              stroke={ring.color || strokes[i]}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * c} ${c}`}
              transform="rotate(-90 60 60)"
              className="report-studio-radial"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-white text-[16px] font-black">
          {Number(centerValue || 0).toLocaleString()}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-zinc-500 text-[8px] uppercase tracking-widest">
          {centerLabel}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-3 text-[9px] text-zinc-500 mt-1">
        {rings.slice(0, 3).map((r) => (
          <span key={r.label}>{r.label}</span>
        ))}
      </div>
    </div>
  );
}

export function StudioGroupedBars({
  months = [],
  series = [
    { key: 'a', color: 'bg-zinc-200' },
    { key: 'b', color: 'bg-zinc-500' },
    { key: 'c', color: 'bg-zinc-700' },
  ],
  labels = [],
}) {
  const maxBar = Math.max(
    1,
    ...months.flatMap((m) => series.map((s) => Number(m[s.key]) || 0)),
  );

  return (
    <div>
      <div className="mt-1 flex items-end justify-between gap-2 h-40">
        {(months.length ? months : [{ label: '—' }]).map((m, mi) => (
          <div key={m.key || m.label || mi} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-full flex items-end justify-center gap-0.5 h-28">
              {series.map((s, si) => {
                const v = Number(m[s.key]) || 0;
                return (
                  <div
                    key={s.key}
                    className={`w-[28%] rounded-t-sm ${s.color} report-studio-bar`}
                    style={{
                      height: `${(v / maxBar) * 100}%`,
                      minHeight: v ? 4 : 0,
                      animationDelay: `${si * 0.08}s`,
                    }}
                    title={`${s.key}: ${v}`}
                  />
                );
              })}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 truncate w-full text-center">
              {m.label}
            </span>
          </div>
        ))}
      </div>
      {labels.length ? (
        <div className="flex flex-wrap gap-3 text-[9px] text-zinc-500 mt-2">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Horizontal ranking bars (survey / feedback / modes). */
export function StudioHBars({ items = [], maxBars = 8, tone = 'zinc' }) {
  const shown = (items || []).slice(0, maxBars);
  const max = Math.max(1, ...shown.map((i) => Number(i.count) || 0));
  const fill =
    tone === 'emerald'
      ? 'bg-zinc-200'
      : tone === 'blue'
        ? 'bg-zinc-300'
        : tone === 'purple'
          ? 'bg-zinc-400'
          : 'bg-zinc-200';

  if (!shown.length) {
    return <p className="text-[10px] text-zinc-600 uppercase tracking-widest py-4 text-center">No data</p>;
  }

  return (
    <div className="space-y-2.5">
      {shown.map((item, idx) => (
        <div key={item.name || idx} className="grid grid-cols-[minmax(0,7rem)_1fr_2rem] gap-2 items-center">
          <span className="text-[9px] font-bold text-zinc-400 truncate" title={item.name} dir="auto">
            {item.name}
          </span>
          <div className="h-7 rounded-lg bg-zinc-900/80 border border-white/5 overflow-hidden">
            <div
              className={`h-full ${fill} report-studio-hbar`}
              style={{
                width: `${Math.max(4, ((Number(item.count) || 0) / max) * 100)}%`,
                animationDelay: `${idx * 0.05}s`,
              }}
            />
          </div>
          <span className="text-[10px] font-black text-white text-right tabular-nums">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/** Vertical daily series bars. */
export function StudioVBars({ series = [], emptyLabel = 'No data' }) {
  const max = Math.max(1, ...series.map((r) => Number(r.count) || 0));
  if (!series?.length) {
    return <p className="text-[10px] text-zinc-600 uppercase tracking-widest py-4 text-center">{emptyLabel}</p>;
  }
  return (
    <div className="flex items-end gap-1 h-28">
      {series.map((row, i) => (
        <div key={row.date || row.label || i} className="flex-1 min-w-0 flex flex-col items-center h-full">
          <span className="text-[8px] font-black text-zinc-500 tabular-nums leading-none mb-1">
            {row.count || ''}
          </span>
          <div className="flex-1 w-full flex items-end min-h-0">
            <div
              className="w-full rounded-t-md bg-zinc-300 report-studio-bar"
              style={{
                height: `${Math.max(row.count ? 8 : 2, ((Number(row.count) || 0) / max) * 100)}%`,
                animationDelay: `${i * 0.04}s`,
              }}
              title={`${row.date || row.label}: ${row.count}`}
            />
          </div>
          <span className="text-[7px] font-bold text-zinc-600 truncate w-full text-center mt-1">
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StudioFunnel({ label, steps = [], icon: Icon }) {
  const hasData = steps.some((s) => (Number(s.value) || 0) > 0);
  const max = Math.max(1, ...steps.map((s) => Number(s.value) || 0));
  return (
    <StudioPanel title={label}>
      {Icon ? (
        <div className="flex items-center gap-2 mb-3 text-zinc-500">
          <Icon className="w-3.5 h-3.5" />
          {!hasData ? <span className="text-[9px]">No events yet</span> : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {steps.map((s, i) => (
          <div key={s.key || s.label} className="rounded-xl border border-white/5 bg-black/40 px-2 py-2 text-center report-studio-card-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-wider leading-tight">{s.label}</p>
            <p className="text-lg font-black text-white tabular-nums mt-0.5">
              <AnimatedNumber value={s.value || 0} />
            </p>
            <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-400 report-studio-hbar"
                style={{ width: `${((Number(s.value) || 0) / max) * 100}%`, animationDelay: `${i * 0.05}s` }}
              />
            </div>
          </div>
        ))}
      </div>
    </StudioPanel>
  );
}

/** Egypt academy choropleth — uses the Egypt activity map asset + live pins. */

/** Percent positions calibrated to /maps/egypt-choropleth.jpg */
const PIN_PCT = {
  alexandria: { left: 48, top: 11 },
  tanta: { left: 51, top: 20 },
  cairo: { left: 53, top: 27 },
  assiut: { left: 51, top: 48 },
};

function pinStyle(id) {
  return PIN_PCT[id] || { left: 50, top: 40 };
}

function activityShade(count, max) {
  if (!count) return 'bg-zinc-700 border-zinc-600';
  const t = count / Math.max(1, max);
  if (t >= 0.75) return 'bg-white border-white shadow-[0_0_16px_rgba(255,255,255,0.35)]';
  if (t >= 0.45) return 'bg-zinc-200 border-zinc-100';
  if (t >= 0.2) return 'bg-zinc-400 border-zinc-300';
  return 'bg-zinc-500 border-zinc-400';
}

export function StudioEgyptGeoMap({ pins = [], other = 0, countryLabel = 'Egypt' }) {
  const max = Math.max(1, ...pins.map((p) => Number(p.count) || 0), other);
  const total = pins.reduce((s, p) => s + (Number(p.count) || 0), 0) + (Number(other) || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1.35fr_1fr] gap-4 items-center">
      <div
        className="relative mx-auto w-full max-w-[340px] report-studio-egypt-stage"
        style={{ perspective: '900px' }}
      >
        <div className="report-studio-egypt-tilt relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_24px_50px_rgba(0,0,0,0.55)]">
          <img
            src="/maps/egypt-choropleth.jpg"
            alt={`${countryLabel} governorate activity map`}
            className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20 pointer-events-none" />

          {pins.map((p) => {
            const pos = pinStyle(p.id);
            const c = Number(p.count) || 0;
            const active = c > 0;
            const size = active ? 10 + Math.round((c / max) * 10) : 8;
            return (
              <div
                key={p.id}
                className="absolute z-[2] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center report-studio-egypt-pin"
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                title={`${p.en}: ${c}`}
              >
                {active ? (
                  <span
                    className="absolute rounded-full border border-white/40 report-studio-egypt-ring"
                    style={{ width: size + 14, height: size + 14 }}
                  />
                ) : null}
                <span
                  className={`relative rounded-full border-2 ${activityShade(c, max)}`}
                  style={{ width: size, height: size }}
                />
                <span className="mt-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-black uppercase tracking-wider text-zinc-100 whitespace-nowrap">
                  {p.en}
                  {active ? ` · ${c}` : ''}
                </span>
              </div>
            );
          })}

          <div className="absolute top-2 right-2 z-[3] rounded-lg border border-white/10 bg-black/75 px-2 py-1.5 backdrop-blur-sm">
            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400 mb-1">Value / Activity</p>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-zinc-500">Less</span>
              <span className="h-2 w-3 rounded-sm bg-zinc-800 border border-zinc-700" />
              <span className="h-2 w-3 rounded-sm bg-zinc-600 border border-zinc-500" />
              <span className="h-2 w-3 rounded-sm bg-zinc-400 border border-zinc-300" />
              <span className="h-2 w-3 rounded-sm bg-zinc-200 border border-zinc-100" />
              <span className="h-2 w-3 rounded-sm bg-white border border-white" />
              <span className="text-[7px] font-bold text-zinc-300">More</span>
            </div>
          </div>

          <p className="absolute bottom-2 left-2 z-[3] text-[8px] font-black uppercase tracking-widest text-zinc-400">
            {countryLabel} · EG choropleth
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
          Responses · <span className="text-zinc-300 tabular-nums">{total}</span>
        </p>
        {pins.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 text-[11px]">
            <div className="min-w-0">
              <p className="font-bold text-zinc-200 truncate">
                {p.en}
                <span className="text-zinc-500 font-medium"> · {p.ar}</span>
              </p>
              <p className="text-[9px] text-zinc-600 truncate">{p.regionEn}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-white tabular-nums">{p.count || 0}</p>
              {p.average != null ? (
                <p className="text-[9px] text-emerald-400/90 tabular-nums">avg {p.average}</p>
              ) : null}
            </div>
          </div>
        ))}
        {other > 0 ? (
          <p className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">Other / unknown · {other}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Pentagonal radar for survey question averages (0–10). */
export function StudioRadar({ axes = [], maxValue = 10 }) {
  const n = axes.length;
  if (!n) return <p className="text-[10px] text-zinc-600">No scores yet</p>;
  const cx = 100;
  const cy = 100;
  const R = 72;
  const levels = [0.25, 0.5, 0.75, 1];

  const pointAt = (i, t) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(angle) * R * t, cy + Math.sin(angle) * R * t];
  };

  const gridPolys = levels.map((t) =>
    Array.from({ length: n }, (_, i) => pointAt(i, t).join(',')).join(' '),
  );

  const dataPts = axes.map((a, i) => {
    const v = Math.max(0, Math.min(1, (Number(a.value) || 0) / maxValue));
    return pointAt(i, v);
  });
  const dataPoly = dataPts.map((p) => p.join(',')).join(' ');

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto report-studio-radar">
        {gridPolys.map((pts, i) => (
          <polygon key={`g-${i}`} points={pts} fill="none" stroke="#3f3f46" strokeWidth="0.8" />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = pointAt(i, 1);
          return <line key={`a-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#3f3f46" strokeWidth="0.7" />;
        })}
        <polygon
          points={dataPoly}
          fill="rgba(52,211,153,0.22)"
          stroke="#34d399"
          strokeWidth="1.6"
          className="report-studio-radar-fill"
        />
        {dataPts.map(([x, y], i) => (
          <circle key={`d-${i}`} cx={x} cy={y} r="2.4" fill="#a7f3d0" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pointAt(i, 1.18);
          const short = String(a.label || '').split(' ').slice(0, 2).join(' ');
          return (
            <text
              key={`t-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-zinc-400"
              style={{ fontSize: '7px', fontWeight: 700 }}
            >
              {short}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-zinc-500">
        {axes.map((a) => (
          <span key={a.key || a.label}>
            {a.label}: <span className="text-zinc-300 font-bold tabular-nums">{a.value ?? '—'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Build last-N day spark values from a date→count map. */
export function seriesToWaveValues(series = []) {
  return series.map((r) => Number(r.count) || 0);
}

export function useMonthlyBuckets(rows, { dateKey = 'createdAt', getPass, getFail } = {}) {
  return useMemo(() => {
    const monthKeys = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return monthKeys.map((m) => {
      const inMonth = (rows || []).filter((row) => {
        const raw = row?.[dateKey];
        if (!raw) return false;
        const dt = raw?.toDate ? raw.toDate() : new Date(raw);
        if (Number.isNaN(dt.getTime())) return false;
        return dt.getFullYear() === m.year && dt.getMonth() === m.month;
      });
      return {
        key: m.key,
        label: m.label,
        started: inMonth.length,
        a: inMonth.length,
        b: getPass ? inMonth.filter(getPass).length : 0,
        c: getFail ? inMonth.filter(getFail).length : 0,
        passed: getPass ? inMonth.filter(getPass).length : 0,
        failed: getFail ? inMonth.filter(getFail).length : 0,
      };
    });
  }, [rows, dateKey, getPass, getFail]);
}
