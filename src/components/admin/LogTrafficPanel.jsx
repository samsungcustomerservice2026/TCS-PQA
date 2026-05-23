'use client';

import React, { useMemo } from 'react';
import { BarChart3, RefreshCw, Users, ShieldCheck } from 'lucide-react';
import { buildDailySeries, maxSeriesCount, topModeHits } from '../../lib/logAnalyticsHelpers';

function DailyBarChart({ series, colorClass = 'bg-emerald-500', emptyLabel = 'No data' }) {
  const max = maxSeriesCount(series);
  if (!series?.length) {
    return <p className="text-[10px] text-zinc-600 uppercase tracking-widest py-4 text-center">{emptyLabel}</p>;
  }
  return (
    <div className="flex items-end gap-1 h-28">
      {series.map((row) => (
        <div key={row.date} className="flex-1 min-w-0 flex flex-col items-center h-full">
          <span className="text-[8px] font-black text-zinc-500 tabular-nums leading-none mb-1">{row.count || ''}</span>
          <div className="flex-1 w-full flex items-end min-h-0">
            <div
              className={`w-full rounded-t-md ${colorClass} transition-all`}
              style={{ height: `${Math.max(row.count ? 8 : 2, (row.count / max) * 100)}%` }}
              title={`${row.date}: ${row.count}`}
            />
          </div>
          <span className="text-[7px] font-bold text-zinc-600 truncate w-full text-center mt-1">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LogTrafficPanel({ analyticsSummary, loading, onRefresh, compact = false }) {
  const today = new Date().toISOString().slice(0, 10);
  const visitorSeries = useMemo(
    () => buildDailySeries(analyticsSummary?.dailyVisitorHits, compact ? 7 : 14),
    [analyticsSummary?.dailyVisitorHits, compact]
  );
  const adminSeries = useMemo(
    () => buildDailySeries(analyticsSummary?.dailyAdminLogins, compact ? 7 : 14),
    [analyticsSummary?.dailyAdminLogins, compact]
  );
  const topModes = useMemo(() => topModeHits(analyticsSummary?.modeHits, 4), [analyticsSummary?.modeHits]);

  if (!analyticsSummary && !loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Traffic data unavailable</p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
          >
            Load analytics
          </button>
        )}
      </div>
    );
  }

  const todayVisitors = analyticsSummary?.dailyVisitorHits?.[today] || 0;
  const todayAdmins = analyticsSummary?.dailyAdminLogins?.[today] || 0;

  return (
    <div className={`rounded-2xl border border-blue-500/15 bg-zinc-950/40 space-y-4 ${compact ? 'p-4' : 'p-5 md:p-6'}`}>
      <div className="flex items-center gap-2 flex-wrap border-b border-white/5 pb-3">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Daily traffic</h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full border border-white/10 bg-zinc-900 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Visitors today</p>
          <p className="text-xl font-black text-emerald-400 italic tabular-nums">{todayVisitors}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Total visitors</p>
          <p className="text-xl font-black text-emerald-400 italic tabular-nums">{analyticsSummary?.visitorHits ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Admin logins today</p>
          <p className="text-xl font-black text-blue-400 italic tabular-nums">{todayAdmins}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Total admin logins</p>
          <p className="text-xl font-black text-blue-400 italic tabular-nums">{analyticsSummary?.adminLogins ?? '—'}</p>
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-2">
            <Users className="w-3 h-3" /> Visitor hits — last {visitorSeries.length} days
          </p>
          <DailyBarChart series={visitorSeries} colorClass="bg-emerald-500/80" />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[8px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3 h-3" /> Admin logins — last {adminSeries.length} days
          </p>
          <DailyBarChart series={adminSeries} colorClass="bg-blue-500/80" />
        </div>
      </div>

      {!compact && topModes.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 w-full">Top divisions (visitor sessions)</span>
          {topModes.map(({ mode, count }) => (
            <span
              key={mode}
              className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10 bg-zinc-900 text-zinc-400"
            >
              {mode} · {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
