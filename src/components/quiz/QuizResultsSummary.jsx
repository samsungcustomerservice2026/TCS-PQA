'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import QuizPodium, { PODIUM_REVEAL_PHASE } from './QuizPodium';
import { analyzeQuizQuestions } from '../../lib/quizAnswerAnalysis';
import { getAdminChallengeReportUrl } from '../../constants/scoraDomains';

const RANK_HIGHLIGHT = {
  4: 'border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/20',
  5: 'border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/20',
  6: 'border-cyan-500/40 bg-cyan-500/10 ring-1 ring-cyan-500/20',
};

function RankRow({ player, rank, lang, className = '' }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-950 p-4 transition-all duration-500 ${className}`}>
      <span className={`font-black w-10 text-center ${rank <= 3 ? 'text-zinc-500' : rank <= 6 ? 'text-white' : 'text-zinc-400'}`}>#{rank}</span>
      <span className="flex-1 font-bold text-white truncate px-2">{player.nickname}</span>
      <span className="font-black text-blue-400 tabular-nums">{player.score || 0}</span>
    </div>
  );
}

function AnalysisCard({ title, stat, lang, variant = 'correct' }) {
  if (!stat) return null;
  const q = stat.question;
  const prompt = lang === 'ar' && q?.promptAr ? q.promptAr : q?.prompt;
  const isCorrect = variant === 'correct';

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex items-center gap-2">
        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</p>
      </div>
      <p className="text-sm font-bold text-white leading-snug">{prompt || `Q${stat.index + 1}`}</p>
      <p className="text-[11px] text-zinc-500">
        {lang === 'ar' ? `سؤال ${stat.index + 1}` : `Question ${stat.index + 1}`}
        {' · '}
        {isCorrect
          ? `${stat.correct}/${stat.total} ${lang === 'ar' ? 'صحيح' : 'correct'} (${stat.correctPct}%)`
          : `${stat.wrong}/${stat.total} ${lang === 'ar' ? 'خطأ' : 'wrong'} (${stat.wrongPct}%)`}
      </p>
    </div>
  );
}

export default function QuizResultsSummary({
  session,
  players = [],
  answers = [],
  lang = 'en',
  showPortalLink = true,
  animatePodium = false,
}) {
  const [analysisView, setAnalysisView] = useState(null);
  const [podiumPhase, setPodiumPhase] = useState(animatePodium ? 0 : PODIUM_REVEAL_PHASE.full);
  const { mostCorrect, mostWrong } = useMemo(
    () => analyzeQuizQuestions(session, answers),
    [session, answers],
  );

  const labels = lang === 'ar'
    ? {
        runners: 'المراكز 4 – 6',
        full: 'الترتيب الكامل',
        analysis: 'تحليل الأسئلة',
        mostCorrect: 'الأكثر إجابة صحيحة',
        mostWrong: 'الأكثر إجابة خاطئة',
        portal: 'التقرير الكامل في البوابة',
        portalSub: 'سجل الإجابات والتحليل التفصيلي',
        showCorrect: 'عرض الأكثر صحة',
        showWrong: 'عرض الأكثر خطأ',
      }
    : {
        runners: 'Places 4 – 6',
        full: 'Full ranking',
        analysis: 'Question analysis',
        mostCorrect: 'Most answered correctly',
        mostWrong: 'Most answered wrongly',
        portal: 'Full report in portal',
        portalSub: 'Answer log & detailed breakdown',
        showCorrect: 'Show best question',
        showWrong: 'Show hardest question',
      };

  const runners = players.slice(3, 6);
  const portalUrl = session?.id ? getAdminChallengeReportUrl(session.id) : null;
  const showRunners = !animatePodium || podiumPhase >= PODIUM_REVEAL_PHASE.runners;
  const showFullList = !animatePodium || podiumPhase >= PODIUM_REVEAL_PHASE.full;
  const showAnalysis = !animatePodium || podiumPhase >= PODIUM_REVEAL_PHASE.full;

  return (
    <div className="space-y-10 w-full max-w-3xl mx-auto">
      <QuizPodium
        players={players}
        lang={lang}
        animateReveal={animatePodium}
        onRevealPhaseChange={setPodiumPhase}
      />

      {showRunners && runners.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500 text-center">{labels.runners}</p>
          <div className="space-y-2">
            {runners.map((p, i) => {
              const rank = i + 4;
              return (
                <RankRow
                  key={p.id}
                  player={p}
                  rank={rank}
                  lang={lang}
                  className={RANK_HIGHLIGHT[rank] || ''}
                />
              );
            })}
          </div>
        </div>
      )}

      {showFullList && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500 text-center">{labels.full}</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {players.map((p, i) => {
              const rank = i + 1;
              const dim = rank <= 3 ? 'opacity-60' : '';
              const highlight = RANK_HIGHLIGHT[rank] ? `${RANK_HIGHLIGHT[rank]} ${dim}` : dim;
              return (
                <RankRow key={p.id} player={p} rank={rank} lang={lang} className={highlight} />
              );
            })}
          </div>
        </div>
      )}

      {showAnalysis && (
        <div className="space-y-4 rounded-2xl border border-orange-500/20 bg-zinc-950/80 p-5 animate-in fade-in duration-700">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {labels.analysis}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAnalysisView(analysisView === 'correct' ? null : 'correct')}
              className={`py-4 px-4 rounded-xl border text-left transition-all ${analysisView === 'correct' ? 'border-emerald-500 bg-emerald-500/15' : 'border-white/10 bg-black/40 hover:border-emerald-500/40'}`}
            >
              <p className="text-[10px] font-black uppercase text-emerald-400">{labels.mostCorrect}</p>
              <p className="text-xs text-zinc-500 mt-1">{labels.showCorrect}</p>
            </button>
            <button
              type="button"
              onClick={() => setAnalysisView(analysisView === 'wrong' ? null : 'wrong')}
              className={`py-4 px-4 rounded-xl border text-left transition-all ${analysisView === 'wrong' ? 'border-red-500 bg-red-500/15' : 'border-white/10 bg-black/40 hover:border-red-500/40'}`}
            >
              <p className="text-[10px] font-black uppercase text-red-400">{labels.mostWrong}</p>
              <p className="text-xs text-zinc-500 mt-1">{labels.showWrong}</p>
            </button>
          </div>
          {analysisView === 'correct' && (
            <AnalysisCard title={labels.mostCorrect} stat={mostCorrect} lang={lang} variant="correct" />
          )}
          {analysisView === 'wrong' && (
            <AnalysisCard title={labels.mostWrong} stat={mostWrong} lang={lang} variant="wrong" />
          )}
        </div>
      )}

      {showPortalLink && portalUrl && showAnalysis && (
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 p-5 transition-all group animate-in fade-in duration-700"
        >
          <div className="text-left">
            <p className="text-sm font-black text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              {labels.portal}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">{labels.portalSub}</p>
          </div>
          <span className="text-[10px] font-black uppercase text-blue-400 group-hover:text-blue-300 shrink-0">Open →</span>
        </a>
      )}
    </div>
  );
}
