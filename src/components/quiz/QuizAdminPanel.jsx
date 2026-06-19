'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import {
  Plus,
  Play,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  ClipboardList,
  Users,
  Award,
} from 'lucide-react';
import {
  QUIZ_DIVISIONS,
  QUIZ_QUESTION_TYPES,
  EMPTY_QUIZ_QUESTION,
  EMPTY_QUIZ_TEMPLATE,
} from '../../constants/quiz';
import { SCORA_QUIZ_JOIN_URL } from '../../constants/scoraDomains';
import {
  listQuizTemplates,
  saveQuizTemplate,
  archiveQuizTemplate,
  startQuizLiveSession,
  listActiveQuizSessions,
  listFinishedQuizSessions,
  getQuizSessionAnswers,
  getQuizSessionPlayers,
  fetchQuizLogs,
} from '../../services/quizService';
import QuizPodium from './QuizPodium';

const TYPE_LABELS = {
  choice: 'Single choice',
  true_false: 'True / False',
  type_answer: 'Type answer',
};

export default function QuizAdminPanel({
  currentUser,
  canRead,
  canWrite,
}) {
  const { message } = App.useApp();
  const actor = currentUser?.username || currentUser?.name || 'admin';

  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [templates, setTemplates] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [finishedSessions, setFinishedSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('templates');
  const [editing, setEditing] = useState(null);
  const [reportSession, setReportSession] = useState(null);
  const [reportPlayers, setReportPlayers] = useState([]);
  const [reportAnswers, setReportAnswers] = useState([]);

  const div = divisionFilter === 'ALL' ? null : divisionFilter;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, a, f, l] = await Promise.all([
        listQuizTemplates(div),
        listActiveQuizSessions(div),
        listFinishedQuizSessions(30, div),
        fetchQuizLogs(80),
      ]);
      setTemplates(t);
      setActiveSessions(a);
      setFinishedSessions(f);
      setLogs(l);
    } catch (e) {
      message.error(e.message || 'Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  }, [div, message]);

  useEffect(() => { reload(); }, [reload]);

  const openReport = async (session) => {
    setReportSession(session);
    const [players, answers] = await Promise.all([
      getQuizSessionPlayers(session.id),
      getQuizSessionAnswers(session.id),
    ]);
    setReportPlayers(players);
    setReportAnswers(answers);
    setSubTab('reports');
  };

  const saveTemplate = async () => {
    if (!editing?.title?.trim()) {
      message.warning('Title required');
      return;
    }
    if (!editing.questions?.length) {
      message.warning('Add at least one question');
      return;
    }
    try {
      await saveQuizTemplate(editing, actor);
      message.success('Quiz saved');
      setEditing(null);
      reload();
    } catch (e) {
      message.error(e.message);
    }
  };

  const startLive = async (templateId) => {
    try {
      const { sessionId, pin, division } = await startQuizLiveSession({ templateId, hostUsername: actor });
      message.success(`Live game started — PIN ${pin} (${division})`);
      window.open(`/quiz/host/${sessionId}`, '_blank', 'noopener,noreferrer');
      reload();
    } catch (e) {
      message.error(e.message);
    }
  };

  const copyJoinLink = async (pin) => {
    const url = `${SCORA_QUIZ_JOIN_URL}${pin ? `?pin=${pin}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success('Join link copied');
    } catch {
      message.error('Copy failed');
    }
  };

  const addQuestion = () => {
    setEditing((prev) => ({
      ...prev,
      questions: [...(prev?.questions || []), { ...EMPTY_QUIZ_QUESTION, id: `q-${Date.now()}` }],
    }));
  };

  const updateQuestion = (idx, patch) => {
    setEditing((prev) => {
      const questions = [...(prev.questions || [])];
      questions[idx] = { ...questions[idx], ...patch };
      return { ...prev, questions };
    });
  };

  const removeQuestion = (idx) => {
    setEditing((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  if (!canRead) {
    return (
      <p className="text-zinc-500 text-sm p-8 text-center">You do not have access to Live Quiz.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-400">Live Quiz</p>
          <h3 className="text-lg font-black text-white uppercase">Kahoot-style games (MX · DA · AV)</h3>
          <p className="text-[10px] text-zinc-500 mt-1 max-w-2xl">
            Multiple live games can run at once — each gets a unique PIN per division. Max 200 players per game.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white"
          >
            <option value="ALL">All divisions</option>
            {QUIZ_DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button type="button" onClick={reload} disabled={loading} className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-500/20 bg-zinc-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-orange-300">Player join link</p>
          <p className="text-[10px] font-mono text-zinc-400 break-all">{SCORA_QUIZ_JOIN_URL}</p>
        </div>
        <button type="button" onClick={() => copyJoinLink()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-200 text-[10px] font-black uppercase">
          <Copy className="w-4 h-4" /> Copy
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['templates', 'live', 'reports', 'logs'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              subTab === key ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-500 border border-white/5'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {subTab === 'templates' && (
        <div className="space-y-6">
          {canWrite && (
            <button
              type="button"
              onClick={() => setEditing({ ...EMPTY_QUIZ_TEMPLATE, questions: [{ ...EMPTY_QUIZ_QUESTION }] })}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase"
            >
              <Plus className="w-4 h-4" /> New quiz
            </button>
          )}

          {editing && canWrite && (
            <div className="rounded-[2rem] border border-orange-500/25 bg-zinc-900/40 p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Title (EN)"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <input
                  placeholder="العنوان (AR)"
                  value={editing.titleAr}
                  onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                  className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white"
                  dir="rtl"
                />
                <select
                  value={editing.division}
                  onChange={(e) => setEditing({ ...editing, division: e.target.value })}
                  className="bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase text-white"
                >
                  {QUIZ_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {(editing.questions || []).map((q, qi) => (
                <div key={qi} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500">Q{qi + 1}</span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(qi, { type: e.target.value })}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white"
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <input
                    placeholder="Question EN"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
                  />
                  <input
                    placeholder="السؤال AR"
                    value={q.promptAr}
                    onChange={(e) => updateQuestion(qi, { promptAr: e.target.value })}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
                    dir="rtl"
                  />
                  {q.type === QUIZ_QUESTION_TYPES.CHOICE && (
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((oi) => (
                        <input
                          key={oi}
                          placeholder={`Option ${oi + 1}`}
                          value={q.options?.[oi] || ''}
                          onChange={(e) => {
                            const options = [...(q.options || ['', '', '', ''])];
                            options[oi] = e.target.value;
                            updateQuestion(qi, { options });
                          }}
                          className="bg-zinc-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      ))}
                      <select
                        value={q.correctIndex ?? 0}
                        onChange={(e) => updateQuestion(qi, { correctIndex: parseInt(e.target.value, 10) })}
                        className="col-span-2 bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] text-white"
                      >
                        {[0, 1, 2, 3].map((i) => (
                          <option key={i} value={i}>Correct: option {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {q.type === QUIZ_QUESTION_TYPES.TRUE_FALSE && (
                    <select
                      value={q.correctIndex ?? 0}
                      onChange={(e) => updateQuestion(qi, { correctIndex: parseInt(e.target.value, 10) })}
                      className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] text-white"
                    >
                      <option value={0}>Correct: True</option>
                      <option value={1}>Correct: False</option>
                    </select>
                  )}
                  {q.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER && (
                    <input
                      placeholder="Accepted answers (comma-separated)"
                      value={(q.acceptedAnswers || []).join(', ')}
                      onChange={(e) => updateQuestion(qi, {
                        acceptedAnswers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addQuestion} className="px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase text-zinc-400">+ Question</button>
                <button type="button" onClick={saveTemplate} className="px-6 py-2 rounded-xl bg-orange-600 text-white text-[10px] font-black uppercase">Save quiz</button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-zinc-500 text-[10px] font-black uppercase">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">{t.title}</p>
                  <p className="text-[10px] text-zinc-500">{t.division} · {t.questions?.length || 0} questions</p>
                </div>
                <div className="flex gap-2">
                  {canWrite && (
                    <>
                      <button type="button" onClick={() => setEditing({ ...t, questions: t.questions || [] })} className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"><ClipboardList className="w-4 h-4" /></button>
                      <button type="button" onClick={() => startLive(t.id)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 text-[10px] font-black uppercase"><Play className="w-3 h-3" /> Start</button>
                      <button type="button" onClick={() => archiveQuizTemplate(t.id, actor).then(reload)} className="p-2 rounded-lg bg-zinc-900 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'live' && (
        <div className="space-y-3">
          {activeSessions.length === 0 ? (
            <p className="text-zinc-600 text-center py-12 text-[10px] font-black uppercase">No active games</p>
          ) : activeSessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-emerald-500/20 bg-zinc-950 p-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="text-2xl font-black text-emerald-400 tracking-widest">{s.pin}</p>
                <p className="text-[10px] text-zinc-500">{s.division} · {s.templateTitle} · {s.playerCount || 0} players · {s.status}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copyJoinLink(s.pin)} className="p-2 rounded-lg bg-zinc-900 text-zinc-400"><Copy className="w-4 h-4" /></button>
                <button type="button" onClick={() => window.open(`/quiz/host/${s.id}`, '_blank')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase"><ExternalLink className="w-3 h-3" /> Host</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'reports' && (
        <div className="space-y-6">
          {!reportSession ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">Finished sessions</p>
              {finishedSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openReport(s)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-zinc-950 p-4 hover:border-orange-500/30 transition-all"
                >
                  <p className="font-black text-white">{s.templateTitle}</p>
                  <p className="text-[10px] text-zinc-500">PIN {s.pin} · {s.division} · {s.playerCount || 0} players</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <button type="button" onClick={() => setReportSession(null)} className="text-[10px] font-black uppercase text-zinc-500">← Back</button>
              <div className="text-center">
                <h4 className="text-xl font-black">{reportSession.templateTitle}</h4>
                <p className="text-zinc-500 text-sm">{reportSession.division} · PIN {reportSession.pin}</p>
                <p className="text-[10px] text-zinc-600 mt-2 flex items-center justify-center gap-2"><Users className="w-3 h-3" /> {reportPlayers.length} joined · <Award className="w-3 h-3" /> {reportAnswers.length} answers</p>
              </div>
              <QuizPodium players={reportPlayers} lang="en" />
              <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                {reportAnswers.map((a) => (
                  <div key={a.id} className="flex gap-2 text-zinc-500 border-b border-white/5 py-1">
                    <span className="text-white">{a.nickname}</span>
                    <span>Q{(a.questionIndex ?? 0) + 1}</span>
                    <span className={a.correct ? 'text-emerald-400' : 'text-red-400'}>{a.answer}</span>
                    <span>+{a.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'logs' && (
        <div className="max-h-96 overflow-y-auto space-y-2 text-xs font-mono">
          {logs.map((log) => (
            <div key={log.id} className="border-b border-white/5 py-2 text-zinc-500">
              <span className="text-orange-400">{log.type}</span> · {log.action} · {log.actor}
              {log.pin && <span> · PIN {log.pin}</span>}
              {log.division && <span> · {log.division}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
