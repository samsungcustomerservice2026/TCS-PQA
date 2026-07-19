'use client';

import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  QUIZ_QUESTION_TYPES,
  QUIZ_DEFAULT_TIME_SEC,
  EMPTY_QUIZ_QUESTION,
} from '../../constants/quiz';
import {
  QUIZ_MAX_OPTIONS,
  QUIZ_MIN_OPTIONS,
  QUIZ_TIME_PRESETS,
  getOptionStyle,
} from '../../constants/quizOptionStyles';
import QuizOptionShape from './QuizOptionShape';

const TYPE_LABELS = {
  [QUIZ_QUESTION_TYPES.CHOICE]: 'Single choice',
  [QUIZ_QUESTION_TYPES.MULTI_CHOICE]: 'Multi-select',
  [QUIZ_QUESTION_TYPES.TRUE_FALSE]: 'True / False',
  [QUIZ_QUESTION_TYPES.TYPE_ANSWER]: 'Type answer',
  [QUIZ_QUESTION_TYPES.POLL]: 'Poll (no scoring)',
};

function ensureOptionArrays(q) {
  const len = Math.max(4, (q.options || []).length);
  const options = [...(q.options || [])];
  const optionsAr = [...(q.optionsAr || [])];
  while (options.length < len) options.push('');
  while (optionsAr.length < len) optionsAr.push('');
  return { options: options.slice(0, QUIZ_MAX_OPTIONS), optionsAr: optionsAr.slice(0, QUIZ_MAX_OPTIONS) };
}

function onTypeChange(current, newType) {
  const base = { ...current, type: newType };
  if (newType === QUIZ_QUESTION_TYPES.TRUE_FALSE) return { ...base, correctIndex: 0, correctIndices: [] };
  if (newType === QUIZ_QUESTION_TYPES.TYPE_ANSWER) return { ...base, acceptedAnswers: base.acceptedAnswers || [], correctIndices: [] };
  const { options, optionsAr } = ensureOptionArrays(base);
  if (newType === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    return { ...base, options, optionsAr, correctIndices: base.correctIndices?.length ? base.correctIndices : [0] };
  }
  if (newType === QUIZ_QUESTION_TYPES.POLL) return { ...base, options, optionsAr, correctIndex: 0, correctIndices: [] };
  return { ...base, options, optionsAr, correctIndex: base.correctIndex ?? 0, correctIndices: [] };
}

export default function QuizQuestionEditor({ question, qIndex, onChange, onRemove, onApplyTimeToAll }) {
  const q = question;
  const { options, optionsAr } = ensureOptionArrays(q);
  const optionCount = options.length;
  const hasOptions = [QUIZ_QUESTION_TYPES.CHOICE, QUIZ_QUESTION_TYPES.MULTI_CHOICE, QUIZ_QUESTION_TYPES.POLL].includes(q.type);

  const update = (patch) => onChange({ ...q, ...patch });

  // Single input per option: text may be Arabic or English. Writing goes to
  // `options` and clears the legacy `optionsAr` slot so there is one source of truth.
  const updateOption = (oi, value) => {
    const nextOpts = [...options];
    const nextOptsAr = [...optionsAr];
    nextOpts[oi] = value;
    nextOptsAr[oi] = '';
    update({ options: nextOpts, optionsAr: nextOptsAr });
  };

  const addOption = () => {
    if (optionCount >= QUIZ_MAX_OPTIONS) return;
    update({ options: [...options, ''], optionsAr: [...optionsAr, ''] });
  };

  const removeOption = (oi) => {
    if (optionCount <= QUIZ_MIN_OPTIONS) return;
    const nextOpts = options.filter((_, i) => i !== oi);
    const nextOptsAr = optionsAr.filter((_, i) => i !== oi);
    let correctIndex = q.correctIndex ?? 0;
    if (correctIndex >= nextOpts.length) correctIndex = 0;
    const correctIndices = (q.correctIndices || []).filter((i) => i !== oi).map((i) => (i > oi ? i - 1 : i));
    update({ options: nextOpts, optionsAr: nextOptsAr, correctIndex, correctIndices });
  };

  const toggleMultiCorrect = (oi) => {
    const set = new Set(q.correctIndices || []);
    if (set.has(oi)) set.delete(oi);
    else set.add(oi);
    update({ correctIndices: [...set].sort((a, b) => a - b) });
  };

  const timeSec = q.timeLimitSec || QUIZ_DEFAULT_TIME_SEC;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500">Q{qIndex + 1}</span>
            <select
              value={q.type}
              onChange={(e) => onChange(onTypeChange(q, e.target.value))}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white min-w-[140px]"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="button" onClick={onRemove} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>

          <input
            placeholder="Question / السؤال"
            value={q.prompt || q.promptAr || ''}
            onChange={(e) => update({ prompt: e.target.value, promptAr: '' })}
            className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
            dir="auto"
          />

          {hasOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt, oi) => {
                const style = getOptionStyle(oi);
                const isSingleCorrect = q.type === QUIZ_QUESTION_TYPES.CHOICE && (q.correctIndex ?? 0) === oi;
                const isMultiCorrect = q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE && (q.correctIndices || []).includes(oi);
                return (
                  <div key={oi} className={`rounded-xl border-2 overflow-hidden ${style.border} ${style.bg}`}>
                    <div className="flex items-center gap-2 p-2 border-b border-black/20">
                      <QuizOptionShape shape={style.shape} className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase text-white/80 flex-1">Answer {oi + 1}</span>
                      {q.type === QUIZ_QUESTION_TYPES.CHOICE && (
                        <button type="button" onClick={() => update({ correctIndex: oi })} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isSingleCorrect ? 'bg-white text-black' : 'bg-black/30 text-white'}`}>Correct</button>
                      )}
                      {q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE && (
                        <button type="button" onClick={() => toggleMultiCorrect(oi)} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isMultiCorrect ? 'bg-white text-black' : 'bg-black/30 text-white'}`}>{isMultiCorrect ? '✓' : 'Mark'}</button>
                      )}
                      {optionCount > QUIZ_MIN_OPTIONS && (
                        <button type="button" onClick={() => removeOption(oi)} className="text-white/70 hover:text-white p-0.5"><X className="w-3 h-3" /></button>
                      )}
                    </div>
                    <input
                      placeholder={`Option ${oi + 1} / خيار ${oi + 1}`}
                      value={opt || optionsAr[oi] || ''}
                      onChange={(e) => updateOption(oi, e.target.value)}
                      className="w-full bg-black/25 p-2 text-xs text-white placeholder:text-white/50 outline-none"
                      dir="auto"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {hasOptions && optionCount < QUIZ_MAX_OPTIONS && (
            <button type="button" onClick={addOption} className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300">
              <Plus className="w-4 h-4" /> Add answer
            </button>
          )}

          {q.type === QUIZ_QUESTION_TYPES.TRUE_FALSE && (
            <div className="grid grid-cols-2 gap-2">
              {[{ idx: 0, label: 'True', style: getOptionStyle(2) }, { idx: 1, label: 'False', style: getOptionStyle(0) }].map(({ idx, label, style }) => (
                <button key={idx} type="button" onClick={() => update({ correctIndex: idx })} className={`py-4 rounded-xl font-black uppercase border-2 ${style.bg} ${style.border} ${(q.correctIndex ?? 0) === idx ? 'ring-2 ring-white' : 'opacity-70'}`}>
                  Correct: {label}
                </button>
              ))}
            </div>
          )}

          {q.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER && (
            <div className="space-y-2">
              <input
                placeholder="Accepted answers, comma-separated / إجابات مقبولة"
                value={[...(q.acceptedAnswers || []), ...(q.acceptedAnswersAr || [])].join(', ')}
                onChange={(e) => update({
                  acceptedAnswers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  acceptedAnswersAr: [],
                })}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
                dir="auto"
              />
            </div>
          )}
        </div>

        <div className="lg:w-52 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-950/80 p-4 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Question properties</p>
          <label className="block space-y-1">
            <span className="text-[9px] font-black uppercase text-zinc-500">Time limit</span>
            <select value={timeSec} onChange={(e) => update({ timeLimitSec: parseInt(e.target.value, 10) || QUIZ_DEFAULT_TIME_SEC })} className="w-full bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold">
              {QUIZ_TIME_PRESETS.map((sec) => <option key={sec} value={sec}>{sec} seconds</option>)}
            </select>
          </label>
          {onApplyTimeToAll && (
            <button type="button" onClick={() => onApplyTimeToAll(timeSec)} className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 underline">
              Apply to all questions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function createEmptyQuestion() {
  return { ...EMPTY_QUIZ_QUESTION, id: `q-${Date.now()}` };
}
