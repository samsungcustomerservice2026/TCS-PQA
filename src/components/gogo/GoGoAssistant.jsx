'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Minus, Send, X } from 'lucide-react';
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
import { isGoGoDeniedMessage } from '../../lib/gogoKnowledge';
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

/**
 * Click-to-chat guided assistant: greeting bubble → name → fixed menu tree.
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
  const listRef = useRef(null);
  const guideTimersRef = useRef([]);
  const pendingGuideRef = useRef(null);
  const saveTimerRef = useRef(null);
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

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    const id = getOrCreateGoGoVisitorId();
    if (cancelled) return undefined;
    setVisitorId(id);

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

  // Entrance: wave + greeting bubble only — do NOT open chat
  useEffect(() => {
    if (hidden || !ready) return undefined;
    const t1 = setTimeout(() => setEntered(true), 80);
    const t2 = setTimeout(() => setPose('wave'), 700);
    const t3 = setTimeout(() => {
      setPose('idle');
      setShowBubble(true);
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hidden, ready]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => () => {
    clearGuideTimers();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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

  const poseClass = useMemo(() => {
    if (!entered) return 'gogo-pose-offstage';
    if (pose === 'walk') return 'gogo-pose-walk-in';
    if (pose === 'walkto') return 'gogo-pose-walk-to';
    if (pose === 'wave') return 'gogo-pose-wave';
    if (pose === 'point') return 'gogo-pose-point';
    if (pose === 'think') return 'gogo-pose-think';
    return 'gogo-pose-idle';
  }, [entered, pose]);

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
    }, 1600);
  }, [onNavigate, persistChat]);

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
    setChips(result.chips || []);
    setPose('think');
    schedule(() => setPose('idle'), 700);
    if (result.action) runGuidedAction(result.action);
  };

  const startChatSession = () => {
    setShowBubble(false);
    setOpen(true);
    setPose('wave');
    schedule(() => setPose('idle'), 1400);

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
    setPose('wave');
    schedule(() => setPose('idle'), 1200);
  };

  const handleChip = (id) => {
    if (id === 'lang_toggle') {
      const nextLang = lang === 'en' ? 'ar' : 'en';
      persistLang(nextLang);
      if (phase === 'ask_name' || !nameRef.current) {
        const ask = resolveFlowReply('ask_name', nextLang);
        setMessages((prev) => {
          const next = [...prev, stamp('gogo', ask.reply)];
          persistChat(next, nextLang, '');
          return next;
        });
        setChips(ask.chips);
        return;
      }
      const menu = resolveFlowReply('main_menu', nextLang, nameRef.current);
      setMessages((prev) => {
        const next = [
          ...prev,
          stamp('user', lang === 'en' ? 'Arabic please' : 'English please'),
          stamp('gogo', menu.reply),
        ];
        persistChat(next, nextLang, nameRef.current);
        return next;
      });
      setChips(menu.chips);
      return;
    }

    if (phase === 'ask_name' || !nameRef.current) {
      const need = resolveFlowReply('need_name', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', need.reply)];
        persistChat(next, lang, '');
        return next;
      });
      setChips(need.chips);
      return;
    }

    if (id === 'main_menu') {
      appendFlow('main_menu', labels.main_menu);
      return;
    }

    if (getFlowNode(id)) {
      appendFlow(id, labels[id] || id);
      return;
    }
  };

  const handleSend = (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text) return;
    setInput('');

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
      return;
    }

    const matched = matchFreeTextToFlow(text, lang);
    if (!matched) {
      const menu = resolveFlowReply('main_menu', lang, nameRef.current);
      setMessages((prev) => {
        const next = [
          ...prev,
          stamp('user', text),
          stamp(
            'gogo',
            lang === 'ar'
              ? `تمام يا ${nameRef.current}. اختَر من الأزرار عشان نشرح بترتيب واضح 👇`
              : `Got it, ${nameRef.current}. Pick a button below for a clear step-by-step answer 👇`,
          ),
          stamp('gogo', menu.reply),
        ];
        persistChat(next, lang, nameRef.current);
        return next;
      });
      setChips(menu.chips);
      return;
    }
    appendFlow(matched, text);
  };

  if (hidden) return null;

  const placeholder =
    phase === 'ask_name' || !visitorName
      ? rtl
        ? 'اكتب اسمك هنا…'
        : 'Type your name…'
      : rtl
        ? 'أو اكتب سؤالك…'
        : 'Or type a question…';

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
                  {phase === 'ask_name'
                    ? rtl
                      ? 'اكتب اسمك للبدء'
                      : 'Enter your name to start'
                    : visitorName
                      ? rtl
                        ? `مرحباً ${visitorName}`
                        : `Hi, ${visitorName}`
                      : rtl
                        ? 'مرشد SCORA'
                        : 'SCORA guide'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleChip('lang_toggle')}
                  className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                >
                  {lang === 'en' ? 'ع' : 'EN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissGuide();
                    setOpen(false);
                    setShowBubble(true);
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
                    setOpen(false);
                    setShowBubble(true);
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
            </div>

            {chips.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {chips.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleChip(id)}
                    className={`px-2.5 py-1.5 rounded-full text-[9px] font-black tracking-wide border transition-all ${
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

            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-white/5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-blue-500/50 placeholder:text-zinc-600"
                autoFocus={open}
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-200 hover:bg-blue-600/45 transition-all"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
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
                setOpen(false);
                setShowBubble(true);
              } else {
                startChatSession();
              }
            }}
            className="relative group focus:outline-none"
            aria-label="Open GoGo chat"
          >
            <span className="absolute -inset-2 rounded-full bg-blue-500/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
            <img
              src={SPRITE}
              alt="GoGo"
              className={`relative h-28 w-auto sm:h-36 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] select-none pointer-events-none gogo-sprite ${poseClass}`}
              draggable={false}
            />
            {!open && (
              <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 border border-blue-300/40 text-white shadow-lg">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
