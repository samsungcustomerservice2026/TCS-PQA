'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  BookOpen,
  Search,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Megaphone,
  Hourglass,
} from 'lucide-react';
import {
  listAnnouncements,
  listProgressForUser,
  listPublishedConsultants,
} from '../../services/consultantService';
import { consultantMatchesProductLine } from '../../lib/consultants/constants';

function statusOf(progress) {
  // A prior pass always wins — stale currentAttempt must not keep it in Pending.
  if (progress?.bestResult === 'passed') return 'passed';
  if (progress?.currentAttempt) return 'in_progress';
  if (progress?.lastResult === 'failed') return 'failed';
  if (progress?.lastResult === 'in_progress') return 'in_progress';
  return 'pending';
}

function statusBadge(result) {
  if (result === 'passed') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
        <CheckCircle2 className="w-3 h-3" /> Passed
      </span>
    );
  }
  if (result === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400">
        <XCircle className="w-3 h-3" /> Failed — retry
      </span>
    );
  }
  if (result === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400">
        <Clock className="w-3 h-3" /> In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
      <Hourglass className="w-3 h-3" /> Pending
    </span>
  );
}

function CourseCard({ consultant, result, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(consultant.id)}
      className="w-full text-left rounded-[1.5rem] border border-white/10 bg-zinc-950/50 p-4 hover:border-cyan-500/30 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-black text-white">{consultant.title_en}</h3>
        {statusBadge(result)}
      </div>
      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{consultant.summary_en}</p>
      <p className="text-[10px] text-zinc-600 mt-2">
        Required time {Math.ceil((consultant.minDwellSeconds || 300) / 60)} min
        {consultant.mustComplete ? ' · Mandatory' : ''}
      </p>
    </button>
  );
}

export default function EmployeeDashboard({
  profile,
  onSignOut,
  onOpenConsultant,
  onSearchEngineer,
  onBack,
  initialTab = 'pending',
}) {
  const [tab, setTab] = useState(initialTab);
  const [consultants, setConsultants] = useState([]);
  const [progress, setProgress] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [engineerCode, setEngineerCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!profile?.uid) return;
    setBusy(true);
    try {
      const [pubs, prog, anns] = await Promise.all([
        listPublishedConsultants({ productLine: profile.productLine || null }),
        listProgressForUser(profile.uid),
        listAnnouncements({ activeOnly: true }),
      ]);
      setConsultants(pubs);
      setProgress(prog);
      setAnnouncements(
        (anns || []).filter((a) =>
          consultantMatchesProductLine({ audience: a.audience || 'all' }, profile.productLine),
        ),
      );
    } catch (err) {
      setMessage(err?.message || 'Failed to load knowledge');
    } finally {
      setBusy(false);
    }
  }, [profile?.uid, profile?.productLine]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const progressById = useMemo(() => {
    const map = {};
    for (const p of progress) map[p.consultantId] = p;
    return map;
  }, [progress]);

  const passedCourses = useMemo(
    () => consultants.filter((c) => statusOf(progressById[c.id]) === 'passed'),
    [consultants, progressById],
  );

  const pendingCourses = useMemo(
    () =>
      consultants.filter((c) => {
        const s = statusOf(progressById[c.id]);
        return s !== 'passed';
      }),
    [consultants, progressById],
  );

  const incompleteMandatory = useMemo(() => {
    return announcements.filter((a) => {
      if (!a.mustComplete) return false;
      return statusOf(progressById[a.consultantId]) !== 'passed';
    });
  }, [announcements, progressById]);

  function submitSearch(e) {
    e.preventDefault();
    const code = String(engineerCode || '').trim();
    if (!code) {
      setMessage('Enter your engineer code');
      return;
    }
    onSearchEngineer?.(code);
  }

  const tabs = [
    { key: 'pending', label: 'Pending', icon: Hourglass, count: pendingCourses.length },
    { key: 'passed', label: 'Passed', icon: CheckCircle2, count: passedCourses.length },
    { key: 'search', label: 'Search KPIs', icon: Search },
    { key: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">My Profile</h2>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-zinc-900/50 p-5 flex flex-wrap gap-4 items-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center">
          <User className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white truncate">{profile?.gspnId || 'Employee'}</p>
          <p className="text-[11px] text-zinc-500 truncate">
            {profile?.email} · {profile?.phone}
            {profile?.productLine ? ` · ${String(profile.productLine).toUpperCase()}` : ''}
          </p>
        </div>
      </div>

      {incompleteMandatory.length > 0 && tab !== 'passed' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5" /> Required technical consultants
          </p>
          {incompleteMandatory.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpenConsultant?.(a.consultantId)}
              className="block w-full text-left text-sm text-white hover:text-amber-200"
            >
              {a.title_en}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 relative z-20">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ${
              tab === t.key ? 'bg-cyan-600 text-white' : 'bg-zinc-900 text-zinc-500 border border-white/5 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {typeof t.count === 'number' && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${tab === t.key ? 'bg-white/20' : 'bg-zinc-800'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && <p className="text-xs text-zinc-400">{message}</p>}
      {busy && <p className="text-xs text-zinc-500">Loading…</p>}

      {tab === 'pending' && (
        <div className="space-y-3">
          <p className="text-[11px] text-zinc-500 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge not completed yet (pending, in progress, or failed — rejoin to pass).
          </p>
          {pendingCourses.length === 0 && !busy && (
            <p className="text-sm text-emerald-400/90 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> No pending knowledge — you are up to date.
            </p>
          )}
          {pendingCourses.map((c) => (
            <CourseCard
              key={c.id}
              consultant={c}
              result={statusOf(progressById[c.id])}
              onOpen={onOpenConsultant}
            />
          ))}
        </div>
      )}

      {tab === 'passed' && (
        <div className="space-y-3">
          <p className="text-[11px] text-zinc-500 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Knowledge you have completed successfully.
          </p>
          {passedCourses.length === 0 && !busy && (
            <p className="text-sm text-zinc-500">No passed courses yet. Open Pending to start.</p>
          )}
          {passedCourses.map((c) => (
            <CourseCard
              key={c.id}
              consultant={c}
              result="passed"
              onOpen={onOpenConsultant}
            />
          ))}
        </div>
      )}

      {tab === 'search' && (
        <form onSubmit={submitSearch} className="rounded-[1.5rem] border border-white/10 bg-zinc-950/50 p-5 space-y-3">
          <p className="text-xs text-zinc-400">
            Enter your engineer code to open Search and view your KPIs (same as the public Search tab).
          </p>
          <input
            value={engineerCode}
            onChange={(e) => setEngineerCode(e.target.value)}
            placeholder="Engineer code"
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest"
          >
            Open KPIs
          </button>
        </form>
      )}

      {tab === 'account' && (
        <div className="relative z-20 rounded-[1.5rem] border border-white/10 bg-zinc-950/50 p-5 space-y-4">
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">GSPN:</span> {profile?.gspnId}
            </p>
            <p>
              <span className="text-zinc-500">Email:</span> {profile?.email}
            </p>
            <p>
              <span className="text-zinc-500">Phone:</span> {profile?.phone}
            </p>
            <p>
              <span className="text-zinc-500">Status:</span> {profile?.status}
            </p>
            {!incompleteMandatory.length ? (
              <p className="text-emerald-400 text-xs pt-2 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> No pending mandatory consultants
              </p>
            ) : (
              <p className="text-amber-400 text-xs pt-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {incompleteMandatory.length} mandatory item(s) remaining
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void onSignOut?.()}
            className="relative z-20 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
