'use client';

import React from 'react';
import { MousePointer2, WifiOff, Timer, ClipboardList, MessageSquare } from 'lucide-react';
import { DEFAULT_SURVEY_FUNNEL, DEFAULT_FEEDBACK_FUNNEL } from '../../services/visitorEngagementService';

function FunnelRow({ label, funnel, compact = false, icon: Icon }) {
  const f = { ...DEFAULT_SURVEY_FUNNEL, ...funnel };
  const steps = [
    { key: 'promoShown', label: 'Promo shown' },
    { key: 'promoDismissed', label: 'Neglected' },
    { key: 'opened', label: 'Opened' },
    { key: 'started', label: 'Started' },
    { key: 'abandoned', label: 'Abandoned' },
    { key: 'completed', label: 'Completed' },
  ];
  const hasData = steps.some(({ key }) => (f[key] || 0) > 0);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:p-4 space-y-2">
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 flex-wrap">
        {Icon ? <Icon className="w-3 h-3" /> : null}
        {label}
        {!hasData && <span className="text-zinc-600 font-bold normal-case tracking-normal">· no events yet</span>}
      </p>
      <div className={`grid gap-1.5 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {steps.map(({ key, label: stepLabel }) => (
          <div key={key} className="rounded-lg border border-white/5 bg-zinc-950/80 px-2 py-1.5 text-center">
            <p className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase tracking-wider leading-tight">{stepLabel}</p>
            <p className={`font-black text-white tabular-nums mt-0.5 ${compact ? 'text-sm' : 'text-lg'}`}>{f[key] ?? 0}</p>
          </div>
        ))}
      </div>
      {f.opened > 0 && (
        <p className="text-[7px] sm:text-[8px] text-zinc-500">
          {Math.round(((f.completed || 0) / f.opened) * 100)}% completed · {Math.round(((f.abandoned || 0) / Math.max(1, f.started)) * 100)}% abandoned
        </p>
      )}
    </div>
  );
}

export default function VisitorEngagementPanel({ analyticsSummary, compact = false }) {
  const eng = analyticsSummary?.visitorEngagement || {};
  const survey = { ...DEFAULT_SURVEY_FUNNEL, ...analyticsSummary?.surveyFunnel };
  const feedback = { ...DEFAULT_FEEDBACK_FUNNEL, ...analyticsSummary?.feedbackFunnel };

  if (!analyticsSummary) {
    return (
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest text-center py-4">
        Engagement data unavailable — tap Refresh
      </p>
    );
  }

  return (
    <div className={`rounded-2xl border border-purple-500/15 bg-zinc-950/40 space-y-4 ${compact ? 'p-4' : 'p-5 md:p-6'}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300 flex items-center gap-2">
        <MousePointer2 className="w-4 h-4 text-purple-400" />
        Visitor engagement
      </p>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <MousePointer2 className="w-3 h-3" /> Clicks
          </p>
          <p className="text-xl font-black text-white tabular-nums">{eng.visitorClicks ?? eng.totalClicks ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <Timer className="w-3 h-3" /> Avg visit
          </p>
          <p className="text-sm font-black text-emerald-400 tabular-nums">
            {(() => {
              const ms = analyticsSummary.avgVisitorSessionMs || 0;
              return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
            })()}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <WifiOff className="w-3 h-3" /> Offline
          </p>
          <p className="text-xl font-black text-amber-400 tabular-nums">{eng.offlineEvents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Lag events</p>
          <p className="text-xl font-black text-red-400 tabular-nums">{eng.lagEvents ?? 0}</p>
        </div>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <FunnelRow label="Samsung Academy survey" funnel={survey} compact={compact} icon={ClipboardList} />
        <FunnelRow label="Arabic feedback" funnel={feedback} compact={compact} icon={MessageSquare} />
      </div>

      <p className="text-[7px] text-zinc-600 leading-relaxed">
        Survey &amp; feedback steps also appear in the event list below (filter category SURVEY or FEEDBACK). Use Export Analytics for Excel.
      </p>
    </div>
  );
}
