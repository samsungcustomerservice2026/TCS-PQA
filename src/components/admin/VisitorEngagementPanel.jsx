'use client';

import React from 'react';
import { MousePointer2, WifiOff, Timer, ClipboardList, MessageSquare } from 'lucide-react';
import { DEFAULT_SURVEY_FUNNEL, DEFAULT_FEEDBACK_FUNNEL } from '../../services/visitorEngagementService';
import {
  StudioShell,
  StudioStatGrid,
  StudioFunnel,
  StudioDonut,
  StudioPanel,
} from './reportStudio/ReportStudio';

const FUNNEL_STEPS = [
  { key: 'promoShown', label: 'Promo shown' },
  { key: 'promoDismissed', label: 'Neglected' },
  { key: 'opened', label: 'Opened' },
  { key: 'started', label: 'Started' },
  { key: 'abandoned', label: 'Abandoned' },
  { key: 'completed', label: 'Completed' },
];

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

  const avgMs = analyticsSummary.avgVisitorSessionMs || 0;
  const avgText = `${Math.floor(avgMs / 60000)}m ${Math.floor((avgMs % 60000) / 1000)}s`;

  return (
    <StudioShell
      title="Visitor engagement studio"
      subtitle="Clicks, session quality, and survey / feedback funnels."
    >
      <StudioStatGrid
        cols={compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}
        items={[
          { label: 'Clicks', value: eng.visitorClicks ?? eng.totalClicks ?? 0 },
          { label: 'Avg visit', text: avgText },
          { label: 'Offline', value: eng.offlineEvents ?? 0 },
          { label: 'Lag events', value: eng.lagEvents ?? 0 },
        ]}
      />

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <StudioPanel title="Survey funnel mix">
          <StudioDonut
            centerValue={survey.opened || 0}
            centerLabel="Opened"
            segments={[
              { label: 'Completed', value: survey.completed || 0, color: '#d4d4d8' },
              { label: 'Abandoned', value: survey.abandoned || 0, color: '#71717a' },
              { label: 'Started', value: survey.started || 0, color: '#52525b' },
            ]}
          />
        </StudioPanel>
        <StudioPanel title="Feedback funnel mix">
          <StudioDonut
            centerValue={feedback.opened || 0}
            centerLabel="Opened"
            segments={[
              { label: 'Completed', value: feedback.completed || 0, color: '#d4d4d8' },
              { label: 'Abandoned', value: feedback.abandoned || 0, color: '#71717a' },
              { label: 'Started', value: feedback.started || 0, color: '#52525b' },
            ]}
          />
        </StudioPanel>
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <StudioFunnel
          label="Samsung Academy survey"
          icon={ClipboardList}
          steps={FUNNEL_STEPS.map((s) => ({ ...s, value: survey[s.key] || 0 }))}
        />
        <StudioFunnel
          label="Arabic feedback"
          icon={MessageSquare}
          steps={FUNNEL_STEPS.map((s) => ({ ...s, value: feedback[s.key] || 0 }))}
        />
      </div>

      <p className="text-[7px] text-zinc-600 leading-relaxed flex items-center gap-2">
        <MousePointer2 className="w-3 h-3" />
        <Timer className="w-3 h-3" />
        <WifiOff className="w-3 h-3" />
        Funnel steps also appear in the event list (SURVEY / FEEDBACK). Export Analytics for Excel.
      </p>
    </StudioShell>
  );
}
