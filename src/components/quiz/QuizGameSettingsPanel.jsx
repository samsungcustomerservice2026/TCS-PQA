'use client';

import React from 'react';
import {
  Smartphone,
  Shuffle,
  Play,
  Eye,
  Clock,
  Globe,
  Contrast,
  Smile,
  Shield,
  UserRound,
  Timer,
} from 'lucide-react';
import { QUIZ_TIME_PRESETS } from '../../constants/quizOptionStyles';
import { QUIZ_DEFAULT_TIME_SEC } from '../../constants/quiz';
import { normalizeQuizSettings } from '../../lib/quizSessionHelpers';

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, checked, onChange, children }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 text-orange-400">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-bold text-white">{title}</p>
        {description && <p className="text-[11px] text-zinc-500 leading-relaxed">{description}</p>}
        {children}
      </div>
      {onChange != null && <Toggle checked={!!checked} onChange={onChange} />}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-1 pt-2">{title}</p>
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4">{children}</div>
    </div>
  );
}

export default function QuizGameSettingsPanel({
  settings,
  onChange,
  variant = 'template',
}) {
  const s = normalizeQuizSettings(settings);
  const patch = (key, value) => onChange({ [key]: value });
  const isLive = variant === 'live';

  const subtitle = isLive
    ? 'Configure here before you start — settings hide once the quiz begins'
    : 'Saved with this quiz template';

  const footer = isLive
    ? 'Runtime settings update the current session for all players.'
    : 'Settings are saved with this quiz template.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-black text-white">Settings</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <Section title="Experience">
        <SettingRow
          icon={Smartphone}
          title="Show questions on devices"
          description="Players see the question and answers on their phones. Turn off to show answers only (look at projector)."
          checked={s.showQuestionsOnDevices}
          onChange={(v) => patch('showQuestionsOnDevices', v)}
        />
        <SettingRow
          icon={Smile}
          title="Reactions"
          description="Players can send quick emoji reactions during the game."
          checked={s.reactions}
          onChange={(v) => patch('reactions', v)}
        />
        <SettingRow
          icon={Globe}
          title="Default language"
          description={isLive ? 'Locked during live game — players already joined.' : 'Language shown when players join.'}
          onChange={isLive ? null : null}
        >
          <select
            value={s.defaultLanguage || 'en'}
            onChange={(e) => patch('defaultLanguage', e.target.value)}
            disabled={isLive}
            className="mt-2 w-full max-w-xs bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold disabled:opacity-40"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="both">Let player choose</option>
          </select>
        </SettingRow>
      </Section>

      <Section title="Hosting">
        <SettingRow
          icon={Shuffle}
          title="Randomize order of questions"
          checked={s.randomizeQuestions}
          onChange={(v) => patch('randomizeQuestions', v)}
          description={isLive ? 'Applies in the lobby before you start the first question.' : undefined}
        />
        <SettingRow
          icon={Shuffle}
          title="Randomize order of answers"
          checked={s.randomizeAnswers}
          onChange={(v) => patch('randomizeAnswers', v)}
          description={isLive ? 'Applies in the lobby before you start the first question.' : undefined}
        />
        <SettingRow
          icon={Eye}
          title="Show correct answers"
          description="Reveal the correct answer after each question. Automatically hidden when questions are randomized."
          checked={s.showCorrectAnswers && !s.randomizeQuestions}
          onChange={s.randomizeQuestions ? null : (v) => patch('showCorrectAnswers', v)}
        />
        <SettingRow
          icon={Play}
          title="Autoplay"
          description="Automatically go to the next question after revealing answers."
          checked={s.autoPlay}
          onChange={(v) => patch('autoPlay', v)}
        />
        {isLive && (
          <SettingRow
            icon={Eye}
            title="Skip timer when everyone answered"
            description="Reveal answers and move on as soon as all connected players submit — no need to wait for the countdown."
            checked={s.autoRevealWhenAllAnswered}
            onChange={(v) => patch('autoRevealWhenAllAnswered', v)}
          />
        )}
        <SettingRow
          icon={Timer}
          title="Default question time"
          description="Used when a question has no custom time limit."
          onChange={null}
        >
          <select
            value={s.defaultTimeSec}
            onChange={(e) => patch('defaultTimeSec', parseInt(e.target.value, 10) || QUIZ_DEFAULT_TIME_SEC)}
            className="mt-2 w-full max-w-xs bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold"
          >
            {QUIZ_TIME_PRESETS.map((sec) => (
              <option key={sec} value={sec}>{sec} seconds</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          icon={Clock}
          title="Auto-advance delay"
          description="Seconds to wait on the reveal screen before autoplay continues."
          onChange={null}
        >
          <select
            value={s.revealDelaySec}
            onChange={(e) => patch('revealDelaySec', parseInt(e.target.value, 10) || 5)}
            className="mt-2 w-full max-w-xs bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold"
          >
            {[2, 3, 5, 8, 10, 15, 20, 30].map((sec) => (
              <option key={sec} value={sec}>{sec} seconds</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      <Section title="Accessibility">
        <SettingRow
          icon={Contrast}
          title="Increase contrast"
          description="Higher contrast colors on host and player screens."
          checked={s.highContrast}
          onChange={(v) => patch('highContrast', v)}
        />
        <SettingRow
          icon={Clock}
          title="Unlimited time"
          description="No countdown — host reveals manually when ready."
          checked={s.unlimitedTime}
          onChange={(v) => patch('unlimitedTime', v)}
        />
      </Section>

      <Section title="Security & privacy">
        <SettingRow
          icon={UserRound}
          title="Nickname generator"
          description={isLive ? 'Locked — players already joined.' : 'Suggest fun random nicknames on the join screen.'}
          checked={s.nicknameGenerator}
          onChange={isLive ? null : (v) => patch('nicknameGenerator', v)}
        />
        <SettingRow
          icon={Shield}
          title="2-step join"
          description={isLive ? 'Locked — players already joined.' : 'Players confirm PIN then enter nickname in two steps.'}
          checked={s.twoStepJoin}
          onChange={isLive ? null : (v) => patch('twoStepJoin', v)}
        />
      </Section>

      <p className="text-[10px] text-zinc-600 text-center">{footer}</p>
    </div>
  );
}
