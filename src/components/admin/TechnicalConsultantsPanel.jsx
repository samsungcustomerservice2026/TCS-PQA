'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  Megaphone,
  Archive,
  Users,
  BarChart3,
  Pencil,
  Undo2,
  KeyRound,
} from 'lucide-react';
import {
  CONSULTANT_AUDIENCE,
  CONSULTANT_AUDIENCE_LABELS,
  CONSULTANT_STATUS,
  DEFAULT_MIN_DWELL_SECONDS,
  EMPLOYEE_STATUS,
  EMPLOYEE_PRODUCT_LINE,
  EMPLOYEE_PRODUCT_LINE_LABELS,
} from '../../lib/consultants/constants';
import { FIREBASE_CONSULTANTS_CONSOLE_HINT } from '../../constants/firebaseConsultantsRules';
import AttendanceAnimatedDashboard from './AttendanceAnimatedDashboard';
import {
  archiveConsultant,
  buildAttendanceReport,
  deleteConsultant,
  listConsultants,
  publishConsultant,
  unpublishConsultant,
  uploadConsultantAsset,
  upsertConsultant,
} from '../../services/consultantService';
import {
  adminResetEmployeePassword,
  adminSetEmployeeProductLine,
  listEmployees,
  setEmployeeStatus,
} from '../../services/employeeAuthService';
import { createEmptyConsultant } from '../../lib/consultants/schema';

const EMPTY_FORM = {
  title_en: '',
  title_ar: '',
  summary_en: '',
  summary_ar: '',
  category: 'general',
  tags: '',
  minDwellMinutes: Math.round(DEFAULT_MIN_DWELL_SECONDS / 60),
  audience: CONSULTANT_AUDIENCE.MX,
  mustComplete: true,
};

function fmtSec(s) {
  const n = Math.max(0, Math.floor(Number(s) || 0));
  const m = Math.floor(n / 60);
  const r = n % 60;
  return `${m}m ${r}s`;
}

function formFromConsultant(c) {
  return {
    title_en: c.title_en || '',
    title_ar: c.title_ar || '',
    summary_en: c.summary_en || '',
    summary_ar: c.summary_ar || '',
    category: c.category || 'general',
    tags: (c.tags || []).join(', '),
    minDwellMinutes: Math.max(1, Math.round((Number(c.minDwellSeconds) || DEFAULT_MIN_DWELL_SECONDS) / 60)),
    audience:
      c.audience === 'da' || c.audience === 'av'
        ? CONSULTANT_AUDIENCE.CE
        : c.audience || CONSULTANT_AUDIENCE.ALL,
    mustComplete: c.mustComplete !== false,
  };
}

export default function TechnicalConsultantsPanel({ actor = 'admin' }) {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState({ courses: [], attendees: [], stats: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [subTab, setSubTab] = useState('library');
  const [libraryFilter, setLibraryFilter] = useState('all'); // all | draft | published
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [list, emps, att] = await Promise.all([
        listConsultants({ max: 300 }),
        listEmployees({ max: 1000 }),
        buildAttendanceReport(),
      ]);
      setRows(list);
      setEmployees(emps);
      setReport(att || { courses: [], attendees: [], stats: null });
      setMessage(`Loaded ${list.length} tip(s), ${emps.length} employee(s).`);
    } catch (err) {
      setMessage(err?.message || 'Failed to load');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publishedCount = useMemo(
    () => rows.filter((r) => r.status === CONSULTANT_STATUS.PUBLISHED).length,
    [rows],
  );
  const draftCount = useMemo(
    () => rows.filter((r) => r.status !== CONSULTANT_STATUS.PUBLISHED).length,
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (libraryFilter === 'published') {
      return rows.filter((r) => r.status === CONSULTANT_STATUS.PUBLISHED);
    }
    if (libraryFilter === 'draft') {
      return rows.filter((r) => r.status !== CONSULTANT_STATUS.PUBLISHED);
    }
    return rows;
  }, [rows, libraryFilter]);

  async function onCreateOrSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title_en: form.title_en,
        title_ar: form.title_ar,
        summary_en: form.summary_en,
        summary_ar: form.summary_ar,
        category: form.category,
        tags: form.tags,
        minDwellSeconds: Math.max(30, Math.round(Number(form.minDwellMinutes) || 5) * 60),
        audience: form.audience,
        mustComplete: !!form.mustComplete,
      };

      if (editingId) {
        const existing = rows.find((r) => r.id === editingId);
        if (!existing) throw new Error('Item not found');
        await upsertConsultant({ ...existing, ...payload }, { actor });
        setMessage(`Saved changes to “${payload.title_en}”.`);
        setEditingId(null);
        setForm(EMPTY_FORM);
      } else {
        const draft = createEmptyConsultant({ ...payload, actor });
        await upsertConsultant(draft, { actor });
        setForm(EMPTY_FORM);
        setMessage(`Created draft “${draft.title_en}”. Upload a file, then Publish & Push.`);
      }
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm(formFromConsultant(c));
    setSubTab('library');
    setMessage(`Editing “${c.title_en}” (${c.status}).`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage('');
  }

  async function onUpload(consultantId, fileList) {
    const file = fileList?.[0];
    if (!file || !consultantId) return;
    setBusy(true);
    setMessage(`Uploading ${file.name}…`);
    try {
      await uploadConsultantAsset(consultantId, file, { actor });
      setMessage(`Uploaded ${file.name} — you can Publish & Push now.`);
      await refresh();
    } catch (err) {
      const msg = err?.message || 'Upload failed — check Storage rules for consultants/ path';
      setMessage(msg);
      window.alert(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onPublish(id) {
    setBusy(true);
    setMessage('Publishing…');
    try {
      const { consultant } = await publishConsultant(id, { actor, reindex: true });
      setMessage(
        `Pushed & announced: “${consultant.title_en}” → audience ${CONSULTANT_AUDIENCE_LABELS[consultant.audience] || consultant.audience}.`,
      );
      await refresh();
    } catch (err) {
      console.error('publish failed', err);
      setMessage(err?.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  }

  async function onUnpublish(id) {
    setBusy(true);
    try {
      await unpublishConsultant(id, { actor });
      setMessage('Moved back to draft (not pushed).');
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Unpublish failed');
    } finally {
      setBusy(false);
    }
  }

  async function onArchive(id) {
    setBusy(true);
    try {
      await archiveConsultant(id, { actor });
      setMessage('Archived');
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Archive failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this consultant and its files?')) return;
    setBusy(true);
    try {
      await deleteConsultant(id);
      if (editingId === id) cancelEdit();
      setMessage('Deleted');
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleEmployee(uid, status) {
    setBusy(true);
    try {
      await setEmployeeStatus(uid, status);
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(uid) {
    const pwd = String(passwordDrafts[uid] || '').trim();
    if (pwd.length < 6) {
      setMessage('Enter a new password (min 6 characters) for that employee first.');
      return;
    }
    setBusy(true);
    try {
      await adminResetEmployeePassword(uid, pwd);
      setPasswordDrafts((prev) => ({ ...prev, [uid]: '' }));
      setMessage('Password updated in Firebase for that employee.');
    } catch (err) {
      setMessage(err?.message || 'Password reset failed');
    } finally {
      setBusy(false);
    }
  }

  async function changeProductLine(uid, productLine) {
    setBusy(true);
    try {
      await adminSetEmployeeProductLine(uid, productLine);
      setMessage(`Product line set to ${EMPLOYEE_PRODUCT_LINE_LABELS[productLine] || productLine}`);
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Could not update product line');
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const courses = report.courses || [];
    const attendees = report.attendees || [];
    const courseLines = [
      ['consultantId', 'title', 'started', 'passed', 'failed', 'inProgress', 'avgDwellSec', 'avgClicks'].join(','),
      ...courses.map((r) =>
        [r.consultantId, JSON.stringify(r.title || ''), r.started, r.passed, r.failed, r.inProgress, r.avgDwell, r.avgClicks].join(','),
      ),
    ];
    const whoLines = [
      ['gspnId', 'email', 'productLine', 'course', 'result', 'attempts', 'dwellSec', 'clicks', 'updatedAt'].join(','),
      ...attendees.map((a) =>
        [
          JSON.stringify(a.gspnId || ''),
          JSON.stringify(a.email || ''),
          a.productLine || '',
          JSON.stringify(a.courseTitle || ''),
          a.result || '',
          a.attempts || 0,
          a.totalDwellSeconds || 0,
          a.totalClicks || 0,
          a.updatedAt || '',
        ].join(','),
      ),
    ];
    const blob = new Blob(
      [`# Course summary\n${courseLines.join('\n')}\n\n# Who attended\n${whoLines.join('\n')}`],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultant-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <BookOpen className="w-5 h-5 text-cyan-400" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Technical Consultants and Tips
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            {publishedCount} pushed · {draftCount} not pushed · GOGO library + employee tracking
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'library', label: 'Library', icon: BookOpen },
          { key: 'users', label: 'Employees', icon: Users },
          { key: 'report', label: 'Attendance', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              subTab === t.key
                ? 'bg-cyan-600 text-white'
                : 'bg-zinc-900 text-zinc-500 border border-white/5 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-xs text-zinc-300 bg-zinc-900/60 border border-cyan-500/20 rounded-2xl px-4 py-3">{message}</p>
      )}

      {subTab === 'library' && (
        <div className="space-y-6">
          <form onSubmit={onCreateOrSave} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-[1.5rem] border border-white/10 bg-zinc-950/50 p-5">
            <h4 className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              {editingId ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? 'Edit tip / consultant' : 'New tip / consultant'}
            </h4>
            <input
              required
              value={form.title_en}
              onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
              placeholder="Title (EN)"
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <input
              value={form.title_ar}
              onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
              placeholder="Title (AR)"
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              dir="rtl"
            />
            <textarea
              value={form.summary_en}
              onChange={(e) => setForm((f) => ({ ...f, summary_en: e.target.value }))}
              placeholder="Summary (EN)"
              rows={2}
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white md:col-span-2"
            />
            <textarea
              value={form.summary_ar}
              onChange={(e) => setForm((f) => ({ ...f, summary_ar: e.target.value }))}
              placeholder="Summary (AR)"
              rows={2}
              dir="rtl"
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white md:col-span-2"
            />
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Category"
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="Tags (comma separated)"
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <label className="text-xs text-zinc-400 flex flex-col gap-1">
              Min dwell (minutes)
              <input
                type="number"
                min={1}
                value={form.minDwellMinutes}
                onChange={(e) => setForm((f) => ({ ...f, minDwellMinutes: e.target.value }))}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </label>
            <label className="text-xs text-zinc-400 flex flex-col gap-1">
              Target product
              <select
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {Object.values(CONSULTANT_AUDIENCE).map((a) => (
                  <option key={a} value={a}>
                    {CONSULTANT_AUDIENCE_LABELS[a] || a}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400 md:col-span-2">
              <input
                type="checkbox"
                checked={form.mustComplete}
                onChange={(e) => setForm((f) => ({ ...f, mustComplete: e.target.checked }))}
              />
              Must complete (mandatory for target employees)
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                {editingId ? (
                  <>
                    <Pencil className="w-4 h-4" /> Save changes
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create draft
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-[11px] font-black uppercase tracking-widest"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: `All (${rows.length})` },
              { key: 'draft', label: `Not pushed (${draftCount})` },
              { key: 'published', label: `Pushed (${publishedCount})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setLibraryFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  libraryFilter === f.key
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-500 border border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visibleRows.length === 0 && (
              <p className="text-sm text-zinc-500">
                No items in this filter. Create a draft, upload a file, then Publish &amp; Push.
              </p>
            )}
            {visibleRows.map((c) => (
              <div
                key={c.id}
                className="rounded-[1.5rem] border border-white/10 bg-zinc-950/40 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-black text-white truncate">{c.title_en}</h5>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          c.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : c.status === 'archived'
                              ? 'bg-zinc-700 text-zinc-400'
                              : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {c.status === 'published' ? 'pushed' : c.status === 'archived' ? 'archived' : 'not pushed'}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                        {CONSULTANT_AUDIENCE_LABELS[c.audience] || c.audience || 'all'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{c.summary_en}</p>
                    <p className="text-[10px] text-zinc-600 mt-2">
                      Min dwell {fmtSec(c.minDwellSeconds)} · {(c.assets || []).length} file(s) · extract{' '}
                      {c.extractStatus || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer hover:text-white">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif"
                      onChange={(e) => {
                        void onUpload(c.id, e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {c.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onPublish(c.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-600/90 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                      title="Publish to target employees (file optional if title/summary exist)"
                    >
                      <Megaphone className="w-3.5 h-3.5" /> Publish &amp; Push
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onPublish(c.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-widest"
                      >
                        Re-push / Re-index
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onUnpublish(c.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Unpublish
                      </button>
                    </>
                  )}
                  {c.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => void onArchive(c.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void onDelete(c.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {(c.assets || []).length > 0 && (
                  <ul className="text-[11px] text-zinc-500 space-y-1">
                    {c.assets.map((a) => (
                      <li key={a.id}>
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-cyan-400/80 hover:underline">
                          {a.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-zinc-600 whitespace-pre-wrap">{FIREBASE_CONSULTANTS_CONSOLE_HINT}</p>
        </div>
      )}

      {subTab === 'users' && (
        <div className="space-y-3">
          {employees.length === 0 && <p className="text-sm text-zinc-500">No employees signed up yet.</p>}
          {employees.map((emp) => (
            <div
              key={emp.uid}
              className="rounded-2xl border border-white/10 bg-zinc-950/40 px-4 py-3 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{emp.gspnId || emp.email}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {emp.email} · {emp.phone} · {emp.status} ·{' '}
                    {EMPLOYEE_PRODUCT_LINE_LABELS[emp.productLine] || emp.productLine || 'no product'}
                  </p>
                </div>
                <select
                  value={emp.productLine === 'da' || emp.productLine === 'av' ? 'ce' : emp.productLine || 'mx'}
                  onChange={(e) => void changeProductLine(emp.uid, e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white uppercase tracking-widest"
                >
                  {Object.values(EMPLOYEE_PRODUCT_LINE).map((p) => (
                    <option key={p} value={p}>
                      {EMPLOYEE_PRODUCT_LINE_LABELS[p]}
                    </option>
                  ))}
                </select>
                {emp.status === EMPLOYEE_STATUS.ACTIVE ? (
                  <button
                    type="button"
                    onClick={() => void toggleEmployee(emp.uid, EMPLOYEE_STATUS.DISABLED)}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void toggleEmployee(emp.uid, EMPLOYEE_STATUS.ACTIVE)}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    Enable
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  value={passwordDrafts[emp.uid] || ''}
                  onChange={(e) =>
                    setPasswordDrafts((prev) => ({ ...prev, [emp.uid]: e.target.value }))
                  }
                  placeholder="New password (min 6)"
                  className="flex-1 min-w-[10rem] bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resetPassword(emp.uid)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-600/90 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Set password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'report' && (
        <AttendanceAnimatedDashboard
          report={report}
          employees={employees}
          busy={busy}
          onRefresh={() => void refresh()}
          onExport={exportCsv}
          expandedCourse={expandedCourse}
          setExpandedCourse={setExpandedCourse}
        />
      )}
    </div>
  );
}
