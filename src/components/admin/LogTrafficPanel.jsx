'use client';

import React, { useMemo } from 'react';
import { BarChart3, RefreshCw, Users, ShieldCheck } from 'lucide-react';
import { buildDailySeries, topModeHits } from '../../lib/logAnalyticsHelpers';
import {
  StudioShell,
  StudioStatGrid,
  StudioPanel,
  StudioWave,
  StudioVBars,
  StudioHBars,
  seriesToWaveValues,
} from './reportStudio/ReportStudio';

export default function LogTrafficPanel({ analyticsSummary, loading, onRefresh, compact = false }) {
  const today = new Date().toISOString().slice(0, 10);
  const visitorSeries = useMemo(
    () => buildDailySeries(analyticsSummary?.dailyVisitorHits, compact ? 7 : 14),
    [analyticsSummary?.dailyVisitorHits, compact],
  );
  const adminSeries = useMemo(
    () => buildDailySeries(analyticsSummary?.dailyAdminLogins, compact ? 7 : 14),
    [analyticsSummary?.dailyAdminLogins, compact],
  );
  const topModes = useMemo(
    () => topModeHits(analyticsSummary?.modeHits, 6).map((m) => ({ name: m.mode, count: m.count })),
    [analyticsSummary?.modeHits],
  );

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
    <StudioShell
      title="Daily traffic studio"
      subtitle="Visitor hits and admin logins with animated trends."
      className={compact ? '' : ''}
      actions={
        onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        ) : null
      }
    >
      <StudioStatGrid
        cols={compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}
        items={[
          { label: 'Visitors today', value: todayVisitors },
          { label: 'Total visitors', value: analyticsSummary?.visitorHits || 0 },
          { label: 'Admin logins today', value: todayAdmins },
          { label: 'Total admin logins', value: analyticsSummary?.adminLogins || 0 },
        ]}
      />

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <StudioPanel title={`Visitor hits · last ${visitorSeries.length} days`}>
          <StudioWave
            primary={seriesToWaveValues(visitorSeries)}
            primaryLabel="Visitors"
            heightClass="h-32"
          />
          <div className="mt-3">
            <StudioVBars series={visitorSeries} />
          </div>
        </StudioPanel>
        <StudioPanel title={`Admin logins · last ${adminSeries.length} days`}>
          <StudioWave
            primary={seriesToWaveValues(adminSeries)}
            primaryLabel="Admins"
            heightClass="h-32"
          />
          <div className="mt-3">
            <StudioVBars series={adminSeries} />
          </div>
        </StudioPanel>
      </div>

      {!compact && topModes.length > 0 && (
        <StudioPanel title="Top divisions (visitor sessions)">
          <StudioHBars items={topModes} tone="zinc" />
        </StudioPanel>
      )}

      <p className="text-[9px] text-zinc-600 flex items-center gap-2">
        <BarChart3 className="w-3 h-3" />
        <Users className="w-3 h-3" />
        <ShieldCheck className="w-3 h-3" />
        Studio charts refresh with analytics summary.
      </p>
    </StudioShell>
  );
}
