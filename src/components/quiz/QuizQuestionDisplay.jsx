'use client';

import React from 'react';
import { QUIZ_QUESTION_TYPES } from '../../constants/quiz';
import { getOptionStyle } from '../../constants/quizOptionStyles';
import { getCorrectAnswerLabel, getQuestionPrompt, getQuestionOptions } from '../../lib/quizSessionHelpers';
import QuizOptionShape from './QuizOptionShape';

const OPTION_TYPES = [QUIZ_QUESTION_TYPES.CHOICE, QUIZ_QUESTION_TYPES.MULTI_CHOICE, QUIZ_QUESTION_TYPES.POLL];

function filledOptions(options) {
  return (options || []).map((opt, i) => ({ opt, i })).filter(({ opt }) => String(opt || '').trim());
}

export default function QuizQuestionDisplay({
  question, lang = 'en', qIndex = 0, totalQ = 1, reveal = false, large = false,
  onPick, disabled = false, typedValue = '', onTypedChange, onSubmitTyped,
  multiSelected = [], onToggleMulti,
  hidePrompt = false, showCorrectAnswer = true,
}) {
  if (!question) return null;

  // Text can live in either the EN or AR field; always show whichever is filled.
  const prompt = getQuestionPrompt(question, lang);
  const options = getQuestionOptions(question, lang);
  const correctLabel = getCorrectAnswerLabel(question, lang);
  const titleSize = large ? 'text-2xl md:text-5xl' : 'text-xl md:text-3xl';
  const isPoll = question.type === QUIZ_QUESTION_TYPES.POLL;
  const isMulti = question.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE;
  const showOptions = OPTION_TYPES.includes(question.type);

  const renderOption = (opt, i) => {
    const style = getOptionStyle(i);
    const isCorrectSingle = !isPoll && !isMulti && i === (question.correctIndex ?? 0);
    const isCorrectMulti = isMulti && (question.correctIndices || []).includes(i);
    const isSelected = isMulti && multiSelected.includes(i);

    if (reveal && showOptions) {
      const highlight = showCorrectAnswer && !isPoll && (isCorrectSingle || isCorrectMulti);
      return (
        <div key={i} className={`min-h-[3.5rem] md:min-h-[5rem] py-3 px-4 rounded-2xl font-black text-base md:text-lg border-2 flex items-center gap-3 ${highlight ? `border-white ${style.bg} text-white` : `${style.bg} ${style.border} text-white/90`}`}>
          <QuizOptionShape shape={style.shape} className="w-5 h-5 md:w-6 md:h-6" />
          <span className="flex-1" dir="auto">{opt}</span>
        </div>
      );
    }

    return (
      <button key={i} type="button" disabled={disabled} onClick={() => (isMulti ? onToggleMulti?.(i) : onPick?.(String(i)))}
        className={`${style.bg} ${style.border} border-2 min-h-[4.5rem] md:min-h-[6rem] py-4 px-4 rounded-2xl font-black text-left text-base md:text-xl text-white disabled:opacity-40 flex items-center gap-3 ${isSelected ? 'ring-4 ring-white' : ''}`}>
        <QuizOptionShape shape={style.shape} className="w-5 h-5 md:w-7 md:h-7" />
        <span className="flex-1" dir="auto">{opt}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3 shrink-0 px-2">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
          {lang === 'ar' ? `سؤال ${qIndex + 1} / ${totalQ}` : `Question ${qIndex + 1} / ${totalQ}`}
        </p>
        <h2 className={`${titleSize} font-black leading-tight`} dir="auto">{hidePrompt ? (lang === 'ar' ? 'انظر للشاشة الرئيسية' : 'Look at the main screen') : prompt}</h2>
        {reveal && showCorrectAnswer && !isPoll && (
          <p className="text-emerald-400 font-black text-lg md:text-2xl">
            {lang === 'ar' ? 'الإجابة الصحيحة:' : 'Correct answer:'} <span className="text-white">{correctLabel}</span>
          </p>
        )}
        {reveal && isPoll && <p className="text-blue-400 font-black text-lg">{lang === 'ar' ? 'نتائج الاستطلاع' : 'Poll results'}</p>}
      </div>

      {!reveal && question.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER && onSubmitTyped && (
        <form className="mt-auto space-y-4 w-full max-w-md mx-auto px-2" onSubmit={(e) => { e.preventDefault(); onSubmitTyped(); }}>
          <input value={typedValue} onChange={(e) => onTypedChange?.(e.target.value)} disabled={disabled} className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 md:p-6 text-center text-lg md:text-2xl outline-none focus:border-blue-500 disabled:opacity-40" placeholder={lang === 'ar' ? 'اكتب إجابتك' : 'Type your answer'} />
          <button type="submit" disabled={disabled || !typedValue?.trim()} className="w-full bg-blue-600 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-40">{lang === 'ar' ? 'إرسال' : 'Submit'}</button>
        </form>
      )}

      {!reveal && question.type === QUIZ_QUESTION_TYPES.TRUE_FALSE && (
        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto max-w-lg mx-auto w-full px-2">
          {[{ v: 'true', label: lang === 'ar' ? 'صح' : 'True', style: getOptionStyle(2) }, { v: 'false', label: lang === 'ar' ? 'خطأ' : 'False', style: getOptionStyle(0) }].map((opt) => (
            <button key={opt.v} type="button" disabled={disabled} onClick={() => onPick?.(opt.v)} className={`${opt.style.bg} ${opt.style.border} border-2 py-10 md:py-14 rounded-2xl font-black text-xl md:text-3xl uppercase text-white disabled:opacity-40 flex flex-col items-center justify-center gap-2`}>
              <QuizOptionShape shape={opt.style.shape} className="w-8 h-8" />{opt.label}
            </button>
          ))}
        </div>
      )}

      {showOptions && (
        <div className="flex flex-col gap-4 mt-auto w-full px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filledOptions(options).map(({ opt, i }) => renderOption(opt, i))}
          </div>
          {!reveal && isMulti && onSubmitTyped && (
            <button type="button" disabled={disabled || multiSelected.length === 0} onClick={onSubmitTyped} className="w-full max-w-md mx-auto bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-40">
              {lang === 'ar' ? 'إرسال الإجابات' : 'Submit answers'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
