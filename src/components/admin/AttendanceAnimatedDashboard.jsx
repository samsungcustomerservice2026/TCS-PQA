'use client';

import React, { useMemo } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  StudioShell,
  StudioStatGrid,
  StudioPanel,
  StudioWave,
  StudioDonut,
  StudioRadial,
  StudioGroupedBars,
} from './reportStudio/ReportStudio';

function fmtSec(s) {
  const n = Math.max(0, Math.floor(Number(s) || 0));
  const m = Math.floor(n / 60);
  const r = n % 60;
  return `${m}m ${r}s`;
}

export default function AttendanceAnimatedDashboard({
  report,
  employees = [],
  busy = false,
  onRefresh,
  onExport,
  expandedCourse,
  setExpandedCourse,
}) {
  const courses = report.courses || [];
  const attendees = report.attendees || [];
  const monthly = report.monthly || [];
  const stats = report.stats || {
    totalStarted: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalInProgress: 0,
    uniqueEmployees: 0,
    employeeCount: employees.length,
    passRate: 0,
    failRate: 0,
    avgDwell: 0,
    avgClicks: 0,
  };

  const waveStarted = useMemo(() => monthly.map((m) => m.started), [monthly]);
  const wavePassed = useMemo(() => monthly.map((m) => m.passed), [monthly]);
  const dwellRing = Math.min(100, Math.round((stats.avgDwell / Math.max(stats.avgDwell, 300)) * 100)) || 0;
  const clickRing = Math.min(100, Math.round((stats.avgClicks / Math.max(stats.avgClicks, 10)) * 100)) || 0;

  return (
    <StudioShell
      title="Attendance studio"
      subtitle="Animated live view of tip sessions, outcomes, and who attended."
      actions={
        <>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </>
      }
    >
      <StudioStatGrid
        items={[
          { label: 'Unique attendees', value: stats.uniqueEmployees },
          { label: 'Sessions', value: stats.totalStarted },
          { label: 'Pass rate', value: stats.passRate, suffix: '%' },
          { label: 'Avg dwell', text: fmtSec(stats.avgDwell) },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudioPanel title="Engagement waves · 6 months">
          <StudioWave
            primary={waveStarted}
            secondary={wavePassed}
            primaryLabel="Sessions"
            secondaryLabel="Passed"
          />
        </StudioPanel>
        <StudioPanel title="Outcome mix">
          <StudioDonut
            centerValue={stats.totalStarted}
            centerLabel="Total"
            segments={[
              { label: 'Passed', value: stats.totalPassed, color: '#d4d4d8' },
              { label: 'Failed', value: stats.totalFailed, color: '#71717a' },
              { label: 'In progress', value: stats.totalInProgress, color: '#52525b' },
            ]}
          />
        </StudioPanel>
        <StudioPanel title="Session health" className="flex flex-col items-center justify-center min-h-[240px]">
          <StudioRadial
            centerValue={stats.totalStarted}
            centerLabel="Sessions"
            rings={[
              { label: `Pass ${stats.passRate}%`, pct: stats.passRate },
              { label: 'Dwell', pct: dwellRing },
              { label: 'Clicks', pct: clickRing },
            ]}
          />
        </StudioPanel>
        <StudioPanel title="Monthly outcomes">
          <StudioGroupedBars
            months={monthly.map((m) => ({
              key: m.key,
              label: m.label,
              a: m.passed,
              b: m.failed,
              c: m.inProgress,
            }))}
            series={[
              { key: 'a', color: 'bg-zinc-200' },
              { key: 'b', color: 'bg-zinc-500' },
              { key: 'c', color: 'bg-zinc-700' },
            ]}
            labels={['Pass', 'Fail', 'In progress']}
          />
        </StudioPanel>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-900 text-[10px] uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-3 py-3">Course</th>
              <th className="px-3 py-3">Started</th>
              <th className="px-3 py-3">Passed</th>
              <th className="px-3 py-3">Failed</th>
              <th className="px-3 py-3">In progress</th>
              <th className="px-3 py-3">Avg dwell</th>
              <th className="px-3 py-3">Avg clicks</th>
              <th className="px-3 py-3">Who</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((r) => (
              <tr key={r.consultantId} className="border-t border-white/5 text-zinc-300">
                <td className="px-3 py-3 font-semibold text-white">{r.title}</td>
                <td className="px-3 py-3">{r.started}</td>
                <td className="px-3 py-3 text-emerald-400">{r.passed}</td>
                <td className="px-3 py-3 text-red-400">{r.failed}</td>
                <td className="px-3 py-3 text-amber-400">{r.inProgress}</td>
                <td className="px-3 py-3">{fmtSec(r.avgDwell)}</td>
                <td className="px-3 py-3">{r.avgClicks}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCourse((id) => (id === r.consultantId ? null : r.consultantId))
                    }
                    className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
                  >
                    {expandedCourse === r.consultantId ? 'Hide' : `View ${r.attendees?.length || 0}`}
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-zinc-500">
                  No attendance data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {expandedCourse && (
        <div className="rounded-2xl border border-cyan-500/20 bg-zinc-950/50 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
            Attendees · {courses.find((c) => c.consultantId === expandedCourse)?.title || expandedCourse}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-2 py-2">GSPN</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Line</th>
                  <th className="px-2 py-2">Result</th>
                  <th className="px-2 py-2">Attempts</th>
                  <th className="px-2 py-2">Dwell</th>
                  <th className="px-2 py-2">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {(courses.find((c) => c.consultantId === expandedCourse)?.attendees || []).map((a) => (
                  <tr key={`${a.uid}_${a.consultantId}`} className="border-t border-white/5 text-zinc-300">
                    <td className="px-2 py-2 font-semibold text-white">{a.gspnId || a.displayName}</td>
                    <td className="px-2 py-2">{a.email || '—'}</td>
                    <td className="px-2 py-2 uppercase">{a.productLine || '—'}</td>
                    <td
                      className={`px-2 py-2 font-bold uppercase ${
                        a.result === 'passed'
                          ? 'text-emerald-400'
                          : a.result === 'failed'
                            ? 'text-red-400'
                            : 'text-amber-300'
                      }`}
                    >
                      {a.result}
                    </td>
                    <td className="px-2 py-2">{a.attempts}</td>
                    <td className="px-2 py-2">{fmtSec(a.totalDwellSeconds)}</td>
                    <td className="px-2 py-2">{a.totalClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Who attended (all tips)
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-900 text-[10px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3">Result</th>
                <th className="px-3 py-3">Attempts</th>
                <th className="px-3 py-3">Dwell</th>
                <th className="px-3 py-3">Clicks</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={`${a.uid}_${a.consultantId}`} className="border-t border-white/5 text-zinc-300">
                  <td className="px-3 py-3 font-semibold text-white">{a.gspnId || a.displayName}</td>
                  <td className="px-3 py-3">{a.email || '—'}</td>
                  <td className="px-3 py-3 uppercase">{a.productLine || '—'}</td>
                  <td className="px-3 py-3">{a.courseTitle}</td>
                  <td
                    className={`px-3 py-3 font-bold uppercase ${
                      a.result === 'passed'
                        ? 'text-emerald-400'
                        : a.result === 'failed'
                          ? 'text-red-400'
                          : 'text-amber-300'
                    }`}
                  >
                    {a.result}
                  </td>
                  <td className="px-3 py-3">{a.attempts}</td>
                  <td className="px-3 py-3">{fmtSec(a.totalDwellSeconds)}</td>
                  <td className="px-3 py-3">{a.totalClicks}</td>
                  <td className="px-3 py-3 text-zinc-500">
                    {a.updatedAt ? String(a.updatedAt).slice(0, 19).replace('T', ' ') : '—'}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-zinc-500">
                    No employees have opened a tip yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StudioShell>
  );
}
