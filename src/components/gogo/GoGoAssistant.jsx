'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, Mic, MicOff, Minus, Send, Volume2, VolumeX, X } from 'lucide-react';
import {
  GOGO_BUBBLE,
  GOGO_CHIP_LABELS,
  resolveFlowReply,
  isValidGoGoName,
  normalizeGoGoName,
  loadGoGoVisitorName,
  saveGoGoVisitorName,
  matchFreeTextToFlow,
  getFlowNode,
} from '../../lib/gogoGuideFlow';
import { isGoGoDeniedMessage, resolveGoGoReply } from '../../lib/gogoKnowledge';
import { GOGO_SMART_CHIPS } from '../../lib/gogoGeminiContext';
import {
  createGoGoRecognizer,
  ensureMicrophonePermission,
  getGoGoVoiceMuted,
  isSpeechRecognitionSupported,
  setGoGoVoiceMuted,
  speakGoGoText,
  stopGoGoSpeech,
} from '../../lib/gogoVoice';
import {
  GOGO_POSE_HOLD_MS,
  poseClassFor,
} from '../../lib/gogoGestures';
import {
  getOrCreateGoGoVisitorId,
  loadGoGoChatLocal,
  saveGoGoChat,
} from '../../services/gogoService';

const SPRITE = '/gogo/idle.png?v=5';
const STORAGE_LANG = 'gogo_lang';

const ACTION_TARGET = {
  goto_pqa: 'pqa',
  goto_tcs: 'tcs',
  goto_search: 'search',
  goto_feedback: 'feedback',
  goto_survey: 'survey',
};

const GUIDE_LINES = {
  goto_pqa: {
    en: { think: 'Thinking… walking you to PQA.', point: 'Point here — tap PQA.' },
    ar: { think: 'بلفكّر… هوديك لـ PQA.', point: 'أشر هنا — اضغط PQA.' },
  },
  goto_tcs: {
    en: { think: 'Thinking… guiding you to TCS.', point: 'Point here — tap TCS.' },
    ar: { think: 'بلفكّر… هوديك لـ TCS.', point: 'أشر هنا — اضغط TCS.' },
  },
  goto_search: {
    en: { think: 'Opening Search…', point: 'Point here — Search tab.' },
    ar: { think: 'فتح البحث…', point: 'أشر هنا — تبويب البحث.' },
  },
};

function stamp(role, text, extra = {}) {
  return { role, text, at: new Date().toISOString(), ...extra };
}

async function askGoGoGemini({ message, lang, visitorName, history, visitorId }) {
  const res = await fetch('/api/gogo/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lang,
      visitorName,
      visitorId,
      history: history
        .filter((m) => m.role === 'user' || m.role === 'gogo')
        .slice(-10)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'gogo',
          text: m.text,
        })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Gemini unavailable');
    err.fallback = !!data?.fallback || res.status === 503;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Click-to-chat guided + Gemini smart chat with voice I/O.
 */
export default function GoGoAssistant({ onNavigate, currentView = '', hidden = false }) {
  const [lang, setLang] = useState('en');
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [pose, setPose] = useState('walk');
  const [dock, setDock] = useState('left');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chips, setChips] = useState([]);
  const [visitorName, setVisitorName] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | ask_name | chatting
  const [guideHint, setGuideHint] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  const [visitorId, setVisitorId] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micHint, setMicHint] = useState('');
  const listRef = useRef(null);
  const micFinalSentRef = useRef(false);
  const guideTimersRef = useRef([]);
  const pendingGuideRef = useRef(null);
  const saveTimerRef = useRef(null);
  const recognizerRef = useRef(null);
  const voiceAskRef = useRef(false);
  const messagesRef = useRef(messages);
  const langRef = useRef(lang);
  const nameRef = useRef('');

  messagesRef.current = messages;
  langRef.current = lang;
  nameRef.current = visitorName;

  const clearGuideTimers = () => {
    guideTimersRef.current.forEach((id) => clearTimeout(id));
    guideTimersRef.current = [];
  };

  const schedule = (fn, ms) => {
    const id = setTimeout(fn, ms);
    guideTimersRef.current.push(id);
    return id;
  };

  const persistChat = useCallback((nextMessages, nextLang, nextName) => {
    const id = visitorId;
    if (!id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveGoGoChat(id, {
        messages: nextMessages || messagesRef.current,
        lang: nextLang || langRef.current,
        visitorName: nextName || nameRef.current || '',
      });
    }, 450);
  }, [visitorId]);

  const speakReply = useCallback(async (text, { force = false, lang: langOverride, gesture = 'speak' } = {}) => {
    if (!force && voiceMuted && !voiceAskRef.current) return;
    const muted = force ? false : voiceMuted && !voiceAskRef.current;
    const speakLang = langOverride || langRef.current;
    await speakGoGoText(text, {
      lang: speakLang,
      muted,
      onStart: () => {
        setSpeaking(true);
        setPose(gesture === 'wave' || gesture === 'welcome' ? gesture : 'speak');
      },
      onEnd: () => {
        setSpeaking(false);
        setPose('idle');
        voiceAskRef.current = false;
      },
    });
  }, [voiceMuted]);

  const playGesture = useCallback((nextPose, holdMs) => {
    setPose(nextPose);
    const ms = holdMs ?? GOGO_POSE_HOLD_MS[nextPose];
    if (!ms) return;
    schedule(() => {
      setPose((current) => (current === nextPose ? 'idle' : current));
    }, ms);
  }, []);

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    const id = getOrCreateGoGoVisitorId();
    if (cancelled) return undefined;
    setVisitorId(id);
    setMicSupported(isSpeechRecognitionSupported());
    setVoiceMuted(getGoGoVoiceMuted());

    try {
      const savedLang = sessionStorage.getItem(STORAGE_LANG);
      if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
      else if (typeof navigator !== 'undefined' && /^ar\b/i.test(navigator.language || '')) setLang('ar');
    } catch { /* ignore */ }

    const savedName = loadGoGoVisitorName();
    const localChat = loadGoGoChatLocal(id);
    if (savedName) {
      setVisitorName(savedName);
      nameRef.current = savedName;
    } else if (localChat?.visitorName) {
      setVisitorName(localChat.visitorName);
      nameRef.current = localChat.visitorName;
      saveGoGoVisitorName(localChat.visitorName);
    }

    if (localChat?.messages?.length && (savedName || localChat.visitorName)) {
      setMessages(
        localChat.messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'gogo',
          text: String(m.text || ''),
          denied: !!m.denied,
          at: m.at,
        })),
      );
      if (localChat.lang === 'ar' || localChat.lang === 'en') setLang(localChat.lang);
      setPhase('chatting');
      const menu = resolveFlowReply('main_menu', localChat.lang === 'ar' ? 'ar' : 'en', savedName || localChat.visitorName);
      setChips(menu.chips);
    }

    setReady(true);
    return () => {
      cancelled = true;
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden || !ready) return undefined;
    const t1 = setTimeout(() => setEntered(true), 80);
    const t2 = setTimeout(() => setPose('welcome'), 750);
    const t3 = setTimeout(() => {
      setPose('idle');
      setShowBubble(true);
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hidden, ready]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => () => {
    clearGuideTimers();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    recognizerRef.current?.abort?.();
    stopGoGoSpeech();
  }, []);

  const placeSpotlightOnTarget = useCallback((targetKey, pointText) => {
    const el =
      document.querySelector(`[data-gogo-target="${targetKey}"]`) ||
      document.querySelector(`[data-gogo-target="${targetKey}-pick"]`);
    if (!el) {
      setSpotlight(null);
      setGuideHint({
        text: pointText,
        top: Math.max(80, window.innerHeight * 0.35),
        left: Math.min(window.innerWidth - 180, window.innerWidth * 0.55),
      });
      return false;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    const rect = el.getBoundingClientRect();
    const pad = 10;
    setSpotlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
    setGuideHint({
      text: pointText,
      top: Math.max(16, rect.top - 48),
      left: Math.min(window.innerWidth - 170, Math.max(12, rect.left + rect.width / 2 - 70)),
    });
    return true;
  }, []);

  useEffect(() => {
    const pending = pendingGuideRef.current;
    if (!pending) return undefined;
    const { action, pointText } = pending;
    const targetKey = ACTION_TARGET[action];
    if (!targetKey) return undefined;
    const tryPlace = () => {
      if (placeSpotlightOnTarget(targetKey, pointText)) {
        setPose('point');
        setDock('guide');
      }
    };
    schedule(tryPlace, 350);
    schedule(tryPlace, 900);
    schedule(() => {
      setPose('idle');
      pendingGuideRef.current = null;
    }, 7000);
    schedule(() => {
      setSpotlight(null);
      setGuideHint(null);
      setDock('left');
    }, 9000);
    return undefined;
  }, [currentView, placeSpotlightOnTarget]);

  const rtl = lang === 'ar';
  const labels = GOGO_CHIP_LABELS[lang] || GOGO_CHIP_LABELS.en;

  const poseClass = useMemo(
    () => poseClassFor({ entered, listening, speaking, pose }),
    [entered, listening, speaking, pose],
  );

  const showThinkCue = listening || pose === 'think' || busy;
  const showSpeakCue = speaking && !listening;
  const showPointCue = pose === 'point';

  const persistLang = (next) => {
    setLang(next);
    try {
      sessionStorage.setItem(STORAGE_LANG, next);
    } catch { /* ignore */ }
  };

  const dismissGuide = () => {
    clearGuideTimers();
    pendingGuideRef.current = null;
    setSpotlight(null);
    setGuideHint(null);
    setDock('left');
    setPose('idle');
  };

  const runGuidedAction = useCallback((action) => {
    if (!action || !onNavigate) return;
    clearGuideTimers();
    const L = langRef.current === 'ar' ? 'ar' : 'en';
    const lines = GUIDE_LINES[action]?.[L] || {
      think: L === 'ar' ? 'بلفكّر…' : 'Thinking…',
      point: L === 'ar' ? 'أشر هنا' : 'Point here',
    };
    setPose('think');
    setMessages((prev) => {
      const next = [...prev, stamp('gogo', lines.think, { expression: 'think' })];
      persistChat(next, L);
      return next;
    });
    schedule(() => {
      setPose('walkto');
      setDock('guide');
    }, 800);
    schedule(() => {
      pendingGuideRef.current = { action, pointText: lines.point };
      onNavigate(action);
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', lines.point, { expression: 'point' })];
        persistChat(next, L);
        return next;
      });
      setPose('point');
      void speakReply(lines.point);
    }, 1600);
  }, [onNavigate, persistChat, speakReply]);

  const appendFlow = (nodeId, userLabel) => {
    const L = langRef.current;
    const name = nameRef.current;
    const result = resolveFlowReply(nodeId, L, name);
    setMessages((prev) => {
      const next = [
        ...prev,
        ...(userLabel ? [stamp('user', userLabel)] : []),
        stamp('gogo', result.reply),
      ];
      persistChat(next, L, name);
      return next;
    });
    setChips((result.chips || []).filter((id) => id !== 'lang_toggle'));
    setPose('think');
    schedule(() => {
      // speaking pose takes over when TTS starts; otherwise settle
      setPose((p) => (p === 'think' ? 'nod' : p));
      schedule(() => setPose((p) => (p === 'nod' ? 'idle' : p)), 800);
    }, 650);
    void speakReply(result.reply);
    if (result.action) runGuidedAction(result.action);
  };

  const sendSmartMessage = async (text, { fromVoice = false } = {}) => {
    if (!text || busy) return;
    if (phase === 'ask_name' || !nameRef.current) {
      acceptName(text);
      return;
    }

    if (isGoGoDeniedMessage(text)) {
      const denied = resolveFlowReply('denied', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('user', text), stamp('gogo', denied.reply, { denied: true })];
        persistChat(next, lang, nameRef.current);
        return next;
      });
      setChips(denied.chips);
      void speakReply(denied.reply, { force: fromVoice });
      return;
    }

    // Structured chip keywords still use guided tree first
    const matched = matchFreeTextToFlow(text, lang);
    if (matched && /^(what_|tcs_|mx_|da_|av_|pqa_|how_|goto_|main_|feedback|survey|who_)/.test(matched)) {
      // Prefer guided path for clear menu topics; Gemini for open questions
      const looksOpen =
        text.split(/\s+/).length > 8 ||
        /why|how come|explain|compare|difference|ليه|ازاي|اشرح|فرق/i.test(text);
      if (!looksOpen) {
        appendFlow(matched, text);
        return;
      }
    }

    setBusy(true);
    setPose('think');
    const historySnapshot = messagesRef.current;
    setMessages((prev) => {
      const next = [...prev, stamp('user', text)];
      persistChat(next, lang, nameRef.current);
      return next;
    });

    try {
      const data = await askGoGoGemini({
        message: text,
        lang,
        visitorName: nameRef.current,
        history: historySnapshot,
        visitorId,
      });
      const reply = String(data.reply || '').trim();
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', reply, { denied: !!data.denied, source: data.source })];
        persistChat(next, lang, nameRef.current);
        return next;
      });
      setChips(Array.isArray(data.chips) && data.chips.length ? data.chips : GOGO_SMART_CHIPS);
      setPose('idle');
      if (fromVoice) voiceAskRef.current = true;
      void speakReply(data.spoken || reply, { force: fromVoice });
    } catch {
      // Never surface API keys, env paths, or internal errors in the visitor chat.
      // Use guided/knowledge answers only — friendly copy, no secrets.
      const matchedNode = matchFreeTextToFlow(text, lang);
      if (matchedNode) {
        const result = resolveFlowReply(matchedNode, lang, nameRef.current);
        setMessages((prev) => {
          const next = [...prev, stamp('gogo', result.reply)];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        setChips(result.chips || GOGO_SMART_CHIPS);
        void speakReply(result.reply, { force: fromVoice });
        if (result.action) runGuidedAction(result.action);
      } else {
        const knowledge = resolveGoGoReply(text, lang);
        const reply = String(knowledge?.reply || '').trim();
        const menu = resolveFlowReply('main_menu', lang, nameRef.current);
        if (reply && knowledge?.topicId !== 'welcome') {
          setMessages((prev) => {
            const next = [...prev, stamp('gogo', reply)];
            persistChat(next, lang, nameRef.current);
            return next;
          });
          setChips(knowledge.chips || menu.chips || GOGO_SMART_CHIPS);
          void speakReply(reply, { force: fromVoice });
          if (knowledge.action) runGuidedAction(knowledge.action);
        } else {
          const tip =
            lang === 'ar'
              ? 'خلّينا نكمل بالأزرار دي — اختار موضوع وأنا أرشدك.'
              : 'Let’s use the buttons below — pick a topic and I’ll guide you.';
          setMessages((prev) => {
            const next = [...prev, stamp('gogo', tip), stamp('gogo', menu.reply)];
            persistChat(next, lang, nameRef.current);
            return next;
          });
          setChips(menu.chips);
          void speakReply(tip, { force: fromVoice });
        }
      }
      setPose('idle');
    } finally {
      setBusy(false);
    }
  };

  const startChatSession = () => {
    setShowBubble(false);
    setOpen(true);
    playGesture('welcome', 1800);

    const name = nameRef.current || loadGoGoVisitorName();
    if (name) {
      setVisitorName(name);
      nameRef.current = name;
      setPhase('chatting');
      if (!messagesRef.current.length) {
        const menu = resolveFlowReply('main_menu', langRef.current, name);
        const next = [stamp('gogo', menu.reply)];
        setMessages(next);
        setChips(menu.chips);
        persistChat(next, langRef.current, name);
        void speakReply(menu.reply, { gesture: 'speak' });
      } else {
        const menu = resolveFlowReply('main_menu', langRef.current, name);
        setChips(menu.chips);
      }
      return;
    }

    setPhase('ask_name');
    const ask = resolveFlowReply('ask_name', langRef.current);
    const next = [stamp('gogo', ask.reply)];
    setMessages(next);
    setChips(ask.chips);
    persistChat(next, langRef.current, '');
    void speakReply(ask.reply, { gesture: 'wave' });
  };

  const acceptName = (rawName) => {
    if (!isValidGoGoName(rawName)) {
      const bad = resolveFlowReply('name_invalid', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('user', rawName), stamp('gogo', bad.reply)];
        persistChat(next, lang, '');
        return next;
      });
      setChips(bad.chips);
      void speakReply(bad.reply);
      return;
    }
    const name = normalizeGoGoName(rawName);
    saveGoGoVisitorName(name);
    setVisitorName(name);
    nameRef.current = name;
    setPhase('chatting');
    const menu = resolveFlowReply('main_menu', lang, name);
    setMessages((prev) => {
      const next = [...prev, stamp('user', name), stamp('gogo', menu.reply)];
      persistChat(next, lang, name);
      return next;
    });
    setChips(menu.chips);
    setPose('nod');
    schedule(() => setPose('welcome'), 700);
    schedule(() => setPose('idle'), 2200);
    void speakReply(menu.reply, { gesture: 'welcome' });
  };

  const switchLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    // Stop mic + speech BEFORE switching so EN/AR queues don't overlap
    recognizerRef.current?.abort?.();
    setListening(false);
    setMicHint('');
    stopGoGoSpeech();
    setSpeaking(false);

    // Update lang ref immediately (React setState is async — was causing Arabic with English voice)
    langRef.current = nextLang;
    persistLang(nextLang);

    // Name gate: swap the welcome message — don't stack EN + AR
    if (phase === 'ask_name' || !nameRef.current) {
      const ask = resolveFlowReply('ask_name', nextLang);
      const next = [stamp('gogo', ask.reply)];
      setMessages(next);
      setChips([]);
      persistChat(next, nextLang, '');
      void speakReply(ask.reply, { lang: nextLang });
      return;
    }

    const menu = resolveFlowReply('main_menu', nextLang, nameRef.current);
    setMessages((prev) => {
      const next = [...prev, stamp('gogo', menu.reply)];
      persistChat(next, nextLang, nameRef.current);
      return next;
    });
    setChips((menu.chips || []).filter((id) => id !== 'lang_toggle'));
    void speakReply(menu.reply, { lang: nextLang });
  };

  const handleChip = (id) => {
    if (busy || id === 'lang_toggle') return;

    if (phase === 'ask_name' || !nameRef.current) {
      const need = resolveFlowReply('need_name', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', need.reply)];
        persistChat(next, lang, '');
        return next;
      });
      setChips([]);
      void speakReply(need.reply);
      return;
    }

    if (id === 'main_menu') {
      appendFlow('main_menu', labels.main_menu);
      return;
    }

    if (getFlowNode(id)) {
      appendFlow(id, labels[id] || id);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    void sendSmartMessage(text);
  };

  const toggleMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    setGoGoVoiceMuted(next);
    if (next) stopGoGoSpeech();
  };

  const toggleMic = async () => {
    if (busy) return;

    if (listening) {
      recognizerRef.current?.stop?.();
      setListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicHint(
        lang === 'ar'
          ? 'الميكروفون متاح على Chrome أو Edge.'
          : 'Voice works best in Chrome or Edge.',
      );
      return;
    }

    setMicHint('');
    stopGoGoSpeech();
    setSpeaking(false);
    voiceAskRef.current = true;
    micFinalSentRef.current = false;

    const perm = await ensureMicrophonePermission();
    if (!perm.ok) {
      setMicHint(
        lang === 'ar'
          ? 'اسمح باستخدام الميكروفون من إعدادات المتصفح.'
          : 'Please allow microphone access in your browser.',
      );
      voiceAskRef.current = false;
      return;
    }

    setMicSupported(true);
    recognizerRef.current?.abort?.();

    const rec = createGoGoRecognizer({
      lang: langRef.current,
      onStart: () => {
        setListening(true);
        setPose('think');
        setMicHint(langRef.current === 'ar' ? 'بسمعك… تكلم دلوقتي' : 'Listening… go ahead');
      },
      onResult: ({ interim, final }) => {
        if (interim) setInput(interim);
        if (final && !micFinalSentRef.current) {
          micFinalSentRef.current = true;
          setInput('');
          setListening(false);
          setMicHint('');
          recognizerRef.current?.stop?.();
          void sendSmartMessage(final, { fromVoice: true });
        }
      },
      onError: (code) => {
        setListening(false);
        setPose('idle');
        voiceAskRef.current = false;
        if (code === 'aborted') return;
        if (code === 'no-speech') {
          setMicHint(
            langRef.current === 'ar' ? 'ما سمعتش حاجة — جرّب تاني.' : "Didn't catch that — try again.",
          );
          return;
        }
        const L = langRef.current;
        const permissionIssue = code === 'not-allowed' || code === 'service-not-allowed';
        const msg = permissionIssue
          ? (L === 'ar'
              ? 'محتاج إذن الميكروفون. فعّله من المتصفح وجرّب تاني، أو اكتب سؤالك.'
              : 'I need microphone permission. Allow mic access in your browser and try again, or type your question.')
          : (L === 'ar'
              ? 'مش قادر أوصل لميكروفون. اتأكد إن فيه مايك متوصّل، أو اكتب سؤالك.'
              : "I couldn't reach a microphone. Check that a mic is connected, or type your question instead.");
        setMicHint(msg);
        setMessages((prev) => {
          const next = [...prev, stamp('gogo', msg)];
          persistChat(next, L, nameRef.current);
          return next;
        });
        void speakReply(msg);
      },
      onEnd: () => {
        setListening(false);
        setPose((p) => (p === 'think' ? 'idle' : p));
      },
    });

    if (!rec) {
      setMicHint(
        lang === 'ar'
          ? 'الميكروفون غير مدعوم هنا.'
          : 'Microphone is not supported here.',
      );
      return;
    }

    recognizerRef.current = rec;
    rec.start();
  };

  if (hidden) return null;

  const placeholder =
    phase === 'ask_name' || !visitorName
      ? rtl
        ? 'اسمك…'
        : 'Your name…'
      : listening
        ? rtl
          ? 'بسمعك…'
          : 'Listening…'
        : busy
          ? rtl
            ? 'لحظة…'
            : 'One moment…'
          : rtl
            ? 'اكتب أو كلّم GoGo…'
            : 'Type or talk to GoGo…';

  return (
    <>
      {spotlight && (
        <div className="fixed inset-0 z-[44] pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-black/45 gogo-dim" />
          <div
            className="absolute rounded-[2rem] border-2 border-yellow-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45),0_0_40px_rgba(250,204,21,0.45)] gogo-spotlight-pulse"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </div>
      )}

      {guideHint && (
        <button
          type="button"
          onClick={dismissGuide}
          className="fixed z-[46] pointer-events-auto px-3 py-2 rounded-2xl bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(250,204,21,0.35)] gogo-hint-bounce"
          style={{ top: guideHint.top, left: guideHint.left }}
        >
          {guideHint.text}
        </button>
      )}

      <div
        className={`fixed z-[45] bottom-24 flex flex-col items-start gap-2 max-w-[min(100vw-1.5rem,22rem)] transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          dock === 'guide' ? 'left-[min(42vw,12rem)] sm:left-[min(48vw,18rem)]' : 'left-3 sm:left-5'
        }`}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        {open && (
          <div className="w-[min(100vw-1.5rem,21rem)] rounded-3xl border border-white/10 bg-zinc-950/96 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-blue-600/25 to-transparent">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-widest text-white truncate">GoGo</p>
                <p className="text-[9px] text-zinc-500 font-bold truncate">
                  {listening
                    ? rtl
                      ? 'بسمعك…'
                      : 'Listening…'
                    : speaking
                      ? rtl
                        ? 'بتكلم…'
                        : 'Speaking…'
                      : busy
                        ? rtl
                          ? 'بلحظ…'
                          : 'One moment…'
                        : phase === 'ask_name'
                          ? rtl
                            ? 'قولّي اسمك'
                            : "What's your name?"
                          : visitorName
                            ? rtl
                              ? `أهلاً ${visitorName}`
                              : `Hi, ${visitorName}`
                            : rtl
                              ? 'مرشد SCORA'
                              : 'SCORA guide'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                  aria-label={voiceMuted ? 'Unmute voice' : 'Mute voice'}
                  title={voiceMuted ? 'Unmute' : 'Mute'}
                >
                  {voiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={switchLanguage}
                  className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                  title={lang === 'en' ? 'العربية' : 'English'}
                >
                  {lang === 'en' ? 'ع' : 'EN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissGuide();
                    recognizerRef.current?.abort?.();
                    stopGoGoSpeech();
                    playGesture('bye', 1100);
                    schedule(() => {
                      setOpen(false);
                      setShowBubble(true);
                      setPose('idle');
                    }, 850);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  aria-label="Minimize"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissGuide();
                    recognizerRef.current?.abort?.();
                    stopGoGoSpeech();
                    playGesture('bye', 1100);
                    schedule(() => {
                      setOpen(false);
                      setShowBubble(true);
                      setPose('idle');
                    }, 850);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  aria-label="Close chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div ref={listRef} className="max-h-64 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${m.at || i}-${i}`}
                  className={`text-[12px] leading-relaxed rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600/25 text-blue-100 ml-6'
                      : m.denied
                        ? 'bg-amber-500/10 text-amber-100/90 border border-amber-500/20 mr-4'
                        : m.expression === 'point'
                          ? 'bg-yellow-500/15 text-yellow-100 border border-yellow-500/25 mr-4'
                          : 'bg-white/5 text-zinc-200 mr-4'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mr-4 px-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {rtl ? 'GoGo بيفكر…' : 'GoGo is thinking…'}
                </div>
              )}
            </div>

            {chips.filter((id) => id && id !== 'lang_toggle').length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {chips
                  .filter((id) => id && id !== 'lang_toggle')
                  .map((id) => (
                  <button
                    key={id}
                    type="button"
                    disabled={busy}
                    onClick={() => handleChip(id)}
                    className={`px-2.5 py-1.5 rounded-full text-[9px] font-black tracking-wide border transition-all disabled:opacity-50 ${
                      id === 'main_menu'
                        ? 'border-white/20 bg-zinc-800 text-zinc-200'
                        : 'border-blue-500/25 bg-blue-600/15 text-blue-100 hover:border-blue-400/50 hover:bg-blue-600/25'
                    }`}
                  >
                    {labels[id] || id}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex flex-col gap-1.5 px-3 py-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { void toggleMic(); }}
                  disabled={busy && !listening}
                  className={`p-2 rounded-xl border transition-all ${
                    listening
                      ? 'bg-red-500/25 border-red-400/40 text-red-200 gogo-mic-pulse'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-blue-500/40 hover:text-blue-200'
                  }`}
                  aria-label={listening ? 'Stop listening' : 'Start voice'}
                  title={listening ? 'Stop' : 'Voice'}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  disabled={busy}
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-blue-500/50 placeholder:text-zinc-600 disabled:opacity-60"
                  autoFocus={open}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-200 hover:bg-blue-600/45 transition-all disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {micHint ? (
                <p className="text-[9px] text-amber-200/90 px-1">{micHint}</p>
              ) : null}
            </form>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          {!open && showBubble && entered && (
            <button
              type="button"
              onClick={startChatSession}
              className="mb-16 sm:mb-20 max-w-[10.5rem] rounded-2xl border border-white/10 bg-zinc-950/95 px-3 py-2.5 text-[11px] font-bold text-zinc-100 shadow-lg whitespace-pre-line text-start animate-in fade-in zoom-in-95 duration-500"
            >
              {GOGO_BUBBLE[lang] || GOGO_BUBBLE.en}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (open) {
                recognizerRef.current?.abort?.();
                stopGoGoSpeech();
                playGesture('bye', 1200);
                schedule(() => {
                  setOpen(false);
                  setShowBubble(true);
                  setPose('idle');
                }, 900);
              } else {
                startChatSession();
              }
            }}
            className="relative group focus:outline-none"
            aria-label="Open GoGo chat"
          >
            <span
              className={`absolute -inset-2 rounded-full blur-xl transition-opacity ${
                listening || speaking
                  ? 'bg-blue-400/40 opacity-100 gogo-mic-pulse'
                  : 'bg-blue-500/20 opacity-60 group-hover:opacity-90'
              }`}
            />
            <span className="gogo-stage relative">
              {showThinkCue && (
                <span className="gogo-gesture-cue gogo-cue-think" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              )}
              {showPointCue && <span className="gogo-gesture-cue gogo-cue-point" aria-hidden />}
              {showSpeakCue && (
                <span className="gogo-gesture-cue gogo-cue-speak" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
              <img
                src={SPRITE}
                alt="GoGo"
                className={`relative h-28 w-auto sm:h-36 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] select-none pointer-events-none gogo-sprite ${poseClass}`}
                draggable={false}
              />
            </span>
            {!open && (
              <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 border border-blue-300/40 text-white shadow-lg">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
            )}
            {listening && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500 text-[8px] font-black text-white uppercase tracking-wider">
                Mic
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
