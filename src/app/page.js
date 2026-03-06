"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { App, ConfigProvider, theme, message as antdMessage } from 'antd';
import {
  Users,
  ShieldCheck,
  Search,
  BarChart3,
  Plus,
  LogOut,
  ChevronRight,
  Settings,
  Activity,
  Award,
  X,
  Save,
  Edit2,
  Eye,
  Download,
  Upload,
  Calendar,
  Layers,
  UserPlus,
  UserCircle,
  Trash2,
  Camera,
  Trophy,
  TrendingUp,
  Clock,
  ChevronLeft,
  Star,
  Flame,
  Crown,
  Gem,
  BookOpen,
  MessageSquare,
  Send,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';

import { INITIAL_ENGINEERS, calculateTCS, calculateDRNPS, getTier, getTierColor } from '../constants';
import { getEngineers, getHiddenEngineers, saveEngineer as saveEngineerToDb, archiveEngineer, getAdmins, saveAdmin as saveAdminToDb, deleteAdmin as deleteAdminFromDb, saveFeedback as saveFeedbackToDb } from '../services/firestoreService';

import { uploadPhoto } from '../services/storageService';
import { recordVisit, recordAdminLogin, recordSessionEnd, getAnalyticsSummary } from '../services/analyticsService';
import { writeLog, fetchLogs } from '../services/auditLogService';

// ─── Helper: Month name → quarter ────────────────────────────────────────────
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const getQuarter = (monthName) => {
  if (!monthName) return null;
  const mn = monthName.toLowerCase().trim();
  // Match full name (e.g. "April") OR 3-letter abbreviation (e.g. "Apr")
  const idx = MONTH_ORDER.findIndex(m =>
    m.toLowerCase() === mn || m.toLowerCase().startsWith(mn.slice(0, 3))
  );
  if (idx < 0) return null;
  return `Q${Math.floor(idx / 3) + 1}`;
};
const getMonthIndex = (monthName) => {
  const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === (monthName || '').toLowerCase());
  return idx < 0 ? 0 : idx;
};

// ─── Tier Badge Component ─────────────────────────────────────────────────────
const TIER_META = {
  Masters: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FMaster%201.png?alt=media&token=a8eb8d46-5351-4b02-9f4e-e16def338ce6', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/40' },
  Diamond: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FDiamond%201.png?alt=media&token=44d5e392-494d-4e70-b9f5-04ed64e44064', border: 'border-blue-400', text: 'text-blue-200', glow: 'shadow-blue-400/40' },
  Platinum: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FPlatinum.png?alt=media&token=75777ff3-d35f-449b-9e64-570bca53ab98', border: 'border-zinc-300', text: 'text-zinc-100', glow: 'shadow-zinc-300/30' },
  Gold: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FGold.png?alt=media&token=59724365-6acd-44ce-8fac-27a09611910e', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/40' },
  Silver: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FSilver.png?alt=media&token=f5336391-30a0-4b06-af0d-54ff2b842313', border: 'border-zinc-400', text: 'text-zinc-300', glow: 'shadow-zinc-400/30' },
  Bronze: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FBronze.png?alt=media&token=8184a12b-3c86-49a1-a19f-19967832b297', border: 'border-orange-600', text: 'text-orange-400', glow: 'shadow-orange-600/30' },
};
const TierBadge = ({ tier, size = 'md' }) => {
  const meta = TIER_META[tier] || TIER_META.Bronze;
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[8px] gap-1'
    : size === 'lg'
      ? 'px-5 py-2 text-[13px] gap-2'
      : 'px-3 py-1 text-[10px] gap-1.5';
  const imgSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className={`inline-flex items-center ${sizeClass} rounded-full border ${meta.border} ${meta.text} bg-black/40 font-black uppercase tracking-wider shadow-lg ${meta.glow}`}>
      <img src={meta.img} alt={tier} className={`${imgSize} object-contain`} />
      {tier}
    </span>
  );
};

// --- Sub-components ---

const Header = ({ onHome }) => (
  <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4">

      {/* Left — Samsung logo */}
      <div
        className="flex items-center cursor-pointer group"
        onClick={onHome}
      >
        <div className="relative">
          <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <img
            src="./sam_logo.png"
            alt="Samsung Logo"
            className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500 relative z-10"
          />
        </div>
      </div>

      {/* Center — Slogan */}
      <div className="flex flex-col items-center text-center gap-1">
        <p className="text-[8px] md:text-[11px] uppercase tracking-[0.35em] md:tracking-[0.5em] text-zinc-400 font-black leading-relaxed">
          Earn Your Tier<br className="md:hidden" /><span className="hidden md:inline"> • </span>Own Your Title
        </p>
      </div>

      {/* Right — TCS / Fawzy logo */}
      <div className="flex items-center justify-end group">
        <img
          src="./fawzy-logo.png"
          alt="TCS Logo"
          className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500"
        />
      </div>

    </div>
  </header>
);

const MetricBar = ({ label, value, max = 100, suffix = "", target = null, color = "bg-blue-600", inverse = false }) => {
  const pct = Math.min(100, Math.max(0, (Number(value) / max) * 100));
  const targetPct = target !== null ? Math.min(100, Math.max(0, (target / max) * 100)) : null;

  // Color logic: inverse = lower is better
  let barGradient;
  if (inverse) {
    const v = Number(value);
    if (v <= target) barGradient = 'from-emerald-500 to-green-400';
    else if (v <= target * 2) barGradient = 'from-yellow-500 to-amber-400';
    else barGradient = 'from-red-600 to-rose-500';
  } else {
    const v = Number(value);
    const cmp = target !== null ? target : max;
    if (v >= cmp) barGradient = 'from-emerald-500 to-green-400';
    else if (v >= cmp * 0.75) barGradient = 'from-yellow-400 to-amber-300';
    else barGradient = 'from-red-600 to-rose-500';
  }

  const valueColor = inverse
    ? (Number(value) <= (target || 0) ? 'text-emerald-400' : Number(value) <= (target || 0) * 2 ? 'text-yellow-400' : 'text-red-400')
    : (Number(value) >= (target || max) ? 'text-emerald-400' : Number(value) >= (target || max) * 0.75 ? 'text-yellow-400' : 'text-red-400');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-black italic tracking-tighter ${valueColor}`}>{typeof value === 'number' ? value.toFixed ? Number(value).toFixed(1) : value : value}</span>
          <span className="text-[8px] font-black text-zinc-600 uppercase">{suffix}</span>
        </div>
      </div>
      <div className="relative h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-out relative`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-y-0 right-0 w-4 bg-white/20 blur-sm rounded-full" />
        </div>
        {targetPct !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 rounded-full"
            style={{ left: `${targetPct}%` }}
          />
        )}
      </div>
      {target !== null && (
        <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">
          Target: {inverse ? '≤' : '≥'}{target}{suffix}
        </p>
      )}
    </div>
  );
};


const PageContent = () => {
  const { message, modal, notification } = App.useApp();
  const [view, setView] = useState('HOME');
  const [engineers, setEngineers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('adminSession');
      if (!raw) return null;
      const { user, loginAt } = JSON.parse(raw);
      return Date.now() - loginAt < 2 * 60 * 60 * 1000 ? user : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [noEngineers, setNoEngineers] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ username: '', password: '', name: '' });
  const [fetchedHiddenEngineers, setFetchedHiddenEngineers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [isLogged, setIsLogged] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('adminSession');
      if (!raw) return false;
      const { loginAt } = JSON.parse(raw);
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      return Date.now() - loginAt < TWO_HOURS;
    } catch { return false; }
  });

  // New feature states
  const [homeViewMode, setHomeViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'
  const [selectedHofMonth, setSelectedHofMonth] = useState(null); // Used for Monthly view
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view

  // Engineer profile period selector
  const [profileViewMode, setProfileViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'
  const [selectedProfileMonth, setSelectedProfileMonth] = useState(null); // key: "Month-Year"
  const [selectedProfileQuarter, setSelectedProfileQuarter] = useState(null); // key: "Q1-2026"

  // Engineer History month selector
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);

  // Feedback form state
  const [feedbackCode, setFeedbackCode] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Activity log panel toggle
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Engineer self-service photo auth
  const [showPhotoAuth, setShowPhotoAuth] = useState(false);
  const [photoAuthCode, setPhotoAuthCode] = useState('');
  const [photoAuthStep, setPhotoAuthStep] = useState('idle'); // 'idle' | 'auth' | 'upload' | 'done'
  const [selfPhotoFile, setSelfPhotoFile] = useState(null);
  const [selfPhotoUploading, setSelfPhotoUploading] = useState(false);
  const selfPhotoInputRef = useRef(null);

  // Analytics
  const [sessionStart, setSessionStart] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const visitedPagesRef = React.useRef([]);

  const refreshAnalytics = React.useCallback(() => {
    setAnalyticsLoading(true);
    getAnalyticsSummary().then(data => {
      setAnalyticsSummary(data);
      setAnalyticsLoading(false);
    });
  }, []);

  // Cookie consent

  // Activity log
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const loadLogs = React.useCallback(() => {
    setLogsLoading(true);
    fetchLogs(100).then(data => { setActivityLogs(data); setLogsLoading(false); });
  }, []);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!visitedPagesRef.current.includes(view)) {
      visitedPagesRef.current = [...visitedPagesRef.current, view];
    }
    if (view === 'ADMIN_DASHBOARD' && isLogged) {
      const t = setTimeout(() => { refreshAnalytics(); loadLogs(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [view]);

  // Record visit on mount & session end on tab close
  const isLoggedRef = React.useRef(isLogged);
  useEffect(() => { isLoggedRef.current = isLogged; }, [isLogged]);

  useEffect(() => {
    let start;
    recordVisit().then(t => {
      start = t;
      setSessionStart(t);
    });
    const handleUnload = () => {
      if (start) recordSessionEnd(start, visitedPagesRef.current, isLoggedRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);

    // Global error capture — log JS errors and unhandled promise rejections
    const onError = (event) => {
      writeLog({
        type: 'ERROR',
        actor: isLoggedRef.current ? (localStorage.getItem('userName') || 'admin') : 'visitor',
        action: 'Uncaught JS error',
        details: { message: event.message?.slice(0, 200), filename: event.filename, lineno: event.lineno },
        severity: 'error',
      });
    };
    const onRejection = (event) => {
      writeLog({
        type: 'ERROR',
        actor: isLoggedRef.current ? (localStorage.getItem('userName') || 'admin') : 'visitor',
        action: 'Unhandled promise rejection',
        details: { reason: String(event.reason)?.slice(0, 200) },
        severity: 'error',
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedEngineers = await getEngineers();
        const fetchedHiddenEngineers = await getHiddenEngineers();
        const fetchedAdmins = await getAdmins();

        if (fetchedEngineers.length > 0) {
          setEngineers(fetchedEngineers);
        } else {
          setNoEngineers(true);
        }
        if (fetchedHiddenEngineers.length > 0) {
          setFetchedHiddenEngineers(fetchedHiddenEngineers);
        } else {
          setFetchedHiddenEngineers([]);
        }

        if (fetchedAdmins.length > 0) {
          setAdmins(fetchedAdmins);
        } else {
          const initialAdmin = {
            id: '1',
            username: 'fawzy.m',
            passwordB64: 'QWhsYXd5QDE5MDc=', // Ahlawy@1907
            name: 'Fawzy M.',
            role: 'SUPER_ADMIN',
            createdAt: new Date().toISOString()
          };
          setAdmins([initialAdmin]);
          // Auto-seed admin if empty? Maybe mostly managed via console for safety first time
          // or just let it exist in state until saved.
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedEngineers = useMemo(() => {
    return [...engineers].sort((a, b) => b.tcsScore - a.tcsScore);
  }, [engineers]);

  // Deduplicated: only latest record per engineer code (for admin list/ranking)
  const deduplicatedEngineers = useMemo(() => {
    const byCode = {};
    engineers.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      const existing = byCode[code];
      if (!existing) { byCode[code] = e; return; }
      // keep whichever record is newer (compare year then month)
      const existY = parseInt(existing.year), newY = parseInt(e.year);
      if (newY > existY || (newY === existY && getMonthIndex(e.month) > getMonthIndex(existing.month))) {
        byCode[code] = e;
      }
    });
    return Object.values(byCode).sort((a, b) => b.tcsScore - a.tcsScore);
  }, [engineers]);


  const topThree = useMemo(() => {
    return sortedEngineers.slice(0, 3);
  }, [sortedEngineers]);


  const allMonthPeriods = useMemo(() => {
    const seen = new Set();
    const periods = [];
    engineers.forEach(e => {
      const key = `${e.month}-${e.year}`;
      if (!seen.has(key) && e.month && e.year) {
        seen.add(key);
        periods.push({ key, month: e.month, year: e.year });
      }
    });
    // Sort ascending: oldest year first; within same year Jan→Feb→…→Dec
    return periods.sort((a, b) => {
      const ya = parseInt(a.year), yb = parseInt(b.year);
      if (ya !== yb) return ya - yb;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    });
  }, [engineers]);

  // ─── Hall of Fame: top 10 for selected month (deduplicated by code) ─────────
  // Default to the LAST element = latest month (ascending sort → last = newest)
  const effectiveHofMonth = selectedHofMonth || allMonthPeriods[allMonthPeriods.length - 1]?.key || null;
  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    // Deduplicate by code — keep highest TCS score per engineer
    const byCode = {};
    engineers
      .filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y)
      .forEach(e => {
        const code = e.code?.toUpperCase();
        if (!code) return;
        if (!byCode[code] || e.tcsScore > byCode[code].tcsScore) byCode[code] = e;
      });
    return Object.values(byCode)
      .sort((a, b) => b.tcsScore - a.tcsScore)
      .slice(0, 10);
  }, [engineers, effectiveHofMonth]);

  // ─── Quarterly: all unique quarter keys, sorted latest-first ─────────────────
  const allQuarterKeys = useMemo(() => {
    const seen = new Set();
    engineers.forEach(e => {
      if (e.month && e.year) {
        const q = getQuarter(e.month);
        // Only add valid quarters (skip Q? which means unrecognised month name)
        if (q !== 'Q?') seen.add(`${q}-${e.year}`);
      }
    });
    return [...seen].sort((a, b) => {
      const [qa, ya] = a.split('-');
      const [qb, yb] = b.split('-');
      if (parseInt(yb) !== parseInt(ya)) return parseInt(yb) - parseInt(ya);
      return parseInt(qb.replace('Q', '')) - parseInt(qa.replace('Q', ''));
    });
  }, [engineers]);

  const effectiveQuarterKey = selectedQuarterKey || allQuarterKeys[0] || null;

  // Aggregate per-engineer per-quarter (avg TCS score across months in that quarter)
  const quarterlyRanking = useMemo(() => {
    if (!effectiveQuarterKey) return [];
    const [q, y] = effectiveQuarterKey.split('-');
    const bucket = {}; // code -> { eng, scores[] }
    engineers.forEach(e => {
      if (!e.month || !e.year) return;
      if (getQuarter(e.month) === q && e.year === y) {
        if (!bucket[e.code]) bucket[e.code] = { eng: e, scores: [] };
        bucket[e.code].scores.push(e.tcsScore);
      }
    });
    return Object.values(bucket)
      .map(({ eng, scores }) => ({
        ...eng,
        avgScore: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
        monthCount: scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [engineers, effectiveQuarterKey]);

  // ─── Engineer history: all records for the selected engineer's code, latest 3 months ───
  const engineerHistory = useMemo(() => {
    if (!selectedEngineer) return [];
    return engineers
      .filter(e => e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase())
      .sort((a, b) => {
        const ya = parseInt(a.year), yb = parseInt(b.year);
        if (yb !== ya) return yb - ya;
        return getMonthIndex(b.month) - getMonthIndex(a.month);
      })
      .slice(0, 3)
      .map(record => {
        // compute rank within that month
        const cohort = engineers
          .filter(e => e.month?.toLowerCase() === record.month?.toLowerCase() && e.year === record.year)
          .sort((a, b) => b.tcsScore - a.tcsScore);
        const rank = cohort.findIndex(e => e.id === record.id) + 1;
        const qKey = `${getQuarter(record.month)}-${record.year}`;
        const qCohort = (() => {
          const [q, yr] = qKey.split('-');
          const bucket = {};
          engineers.forEach(e => {
            if (!e.month || !e.year) return;
            if (getQuarter(e.month) === q && e.year === yr) {
              if (!bucket[e.code]) bucket[e.code] = { code: e.code, scores: [] };
              bucket[e.code].scores.push(e.tcsScore);
            }
          });
          return Object.values(bucket)
            .map(({ code, scores }) => ({ code, avg: scores.reduce((s, v) => s + v, 0) / scores.length }))
            .sort((a, b) => b.avg - a.avg);
        })();
        const qRank = qCohort.findIndex(e => e.code === record.code) + 1;
        return { ...record, monthRank: rank, monthTotal: cohort.length, qRank, qTotal: qCohort.length, qKey };
      });
  }, [engineers, selectedEngineer]);

  // ─── Summary ranks for the currently selected engineer ──────────────────────────
  const engineerSummaryRanks = useMemo(() => {
    if (!selectedEngineer) return null;
    const monthCohort = engineers
      .filter(e => e.month?.toLowerCase() === selectedEngineer.month?.toLowerCase() && e.year === selectedEngineer.year)
      .sort((a, b) => b.tcsScore - a.tcsScore);
    const monthRank = monthCohort.findIndex(e => e.id === selectedEngineer.id) + 1;
    const q = getQuarter(selectedEngineer.month);
    const y = selectedEngineer.year;
    const qBucket = {};
    engineers.forEach(e => {
      if (!e.month || !e.year) return;
      if (getQuarter(e.month) === q && e.year === y) {
        if (!qBucket[e.code]) qBucket[e.code] = { code: e.code, scores: [] };
        qBucket[e.code].scores.push(e.tcsScore);
      }
    });
    const qList = Object.values(qBucket)
      .map(({ code, scores }) => ({ code, avg: scores.reduce((s, v) => s + v, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg);
    const qRank = qList.findIndex(e => e.code === selectedEngineer.code) + 1;
    return {
      monthRank, monthTotal: monthCohort.length,
      qRank, qTotal: qList.length,
      quarter: q, year: y,
      month: selectedEngineer.month,
    };
  }, [engineers, selectedEngineer]);


  const handleSearch = () => {
    // Find all records matching this code
    const matchingRecords = engineers.filter(
      e => e.code.trim().toUpperCase() === searchCode.trim().toUpperCase()
    );
    if (matchingRecords.length === 0) {
      message.error("Engineer Code not found.");
      return;
    }
    // Sort records newest first
    const sorted = [...matchingRecords].sort((a, b) => {
      const ya = parseInt(a.year), yb = parseInt(b.year);
      if (yb !== ya) return yb - ya;
      return getMonthIndex(b.month) - getMonthIndex(a.month);
    });
    const newestRecord = sorted[0];
    setSelectedEngineer(newestRecord);
    // Initialize the profile period selectors to the newest month
    setSelectedProfileMonth(`${newestRecord.month}-${newestRecord.year}`);
    setProfileViewMode('MONTHLY');
    // Compute the newest quarter for this engineer as default
    const newestQKey = `${getQuarter(newestRecord.month)}-${newestRecord.year}`;
    setSelectedProfileQuarter(newestQKey);
    setView('ENGINEER_PROFILE');
  };

  const handleAdminLogin = async () => {
    // Fetch IP + location before processing login
    let ipInfo = { ip: null, location: null };
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        ipInfo.ip = data.ip || null;
        ipInfo.location = [data.city, data.country_name].filter(Boolean).join(', ') || null;
      }
    } catch { /* silently ignore — don't block login */ }

    const foundAdmin = admins.find(a =>
      a.username === loginUser && a.passwordB64 === window.btoa(loginPass)
    );

    if (foundAdmin) {
      setCurrentUser(foundAdmin);
      setLoginUser('');
      setLoginPass('');
      localStorage.setItem('adminSession', JSON.stringify({ user: foundAdmin, loginAt: Date.now() }));
      localStorage.setItem('userName', foundAdmin.name);
      setIsLogged(true);
      setView('ADMIN_DASHBOARD');
      recordAdminLogin();
      writeLog({ type: 'ADMIN_LOGIN', actor: foundAdmin.username, action: 'Admin logged in', details: { name: foundAdmin.name }, severity: 'info', ip: ipInfo.ip, location: ipInfo.location });
      getAnalyticsSummary().then(data => setAnalyticsSummary(data));
    } else {
      message.error("User or Password are wrong");
      writeLog({ type: 'FAILED_LOGIN', actor: loginUser || 'unknown', action: 'Failed admin login attempt', severity: 'warning', ip: ipInfo.ip, location: ipInfo.location });
    }
  };

  const handleLogout = () => {
    writeLog({ type: 'ADMIN_LOGOUT', actor: currentUser?.username || 'admin', action: 'Admin logged out', severity: 'info' });
    setCurrentUser(null);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userName');
    setIsLogged(false);
    setView('HOME');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && editingEng) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      // Store the file and the preview URL
      setEditingEng({
        ...editingEng,
        photoUrl: previewUrl,
        pendingFile: file,
        hidden: false
      });
    }
  };

  const saveEngineer = async (updated) => {
    setIsSaving(true);
    const hide = message.loading("Saving engineer data...", 0);

    try {
      const newScore = calculateTCS(updated);
      const newTier = getTier(newScore);

      let finalPhotoUrl = updated.photoUrl;

      // If a new file is pending upload
      if (updated.pendingFile) {
        try {
          const url = await uploadPhoto(updated.pendingFile, 'engineers', updated.code.toUpperCase() || 'unknown');
          if (url) finalPhotoUrl = url;
        } catch (error) {
          console.error("Failed to upload photo:", error);
          message.warning("Failed to upload photo. Changes will be saved without new photo.");
        }
      }

      let finalEng = {
        ...updated,
        tcsScore: newScore,
        tier: newTier,
        photoUrl: finalPhotoUrl
      };
      delete finalEng.pendingFile;

      // ── Smart Month-History Logic ───────────────────────────────
      // Find ALL existing records with same engineer code
      const sameCodeRecords = engineers.filter(
        e => e.code?.toUpperCase() === finalEng.code?.toUpperCase()
      );

      // Check if a record for the same (month, year) already exists
      const duplicateRecord = sameCodeRecords.find(
        e => e.month?.toLowerCase() === finalEng.month?.toLowerCase()
          && e.year === finalEng.year
          && e.id !== finalEng.id
      );

      if (duplicateRecord) {
        // A different record for this exact month/year exists → ask to overwrite or cancel
        hide();
        const confirmed = window.confirm(
          `⚠️ A record for ${finalEng.month} ${finalEng.year} already exists for ${finalEng.name}.\n\nDo you want to UPDATE the existing record? Click OK to update, or Cancel to abort.`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
        // Overwrite the duplicate record's id
        finalEng.id = duplicateRecord.id;
      } else if (finalEng.id && sameCodeRecords.some(e => e.id === finalEng.id)) {
        // The user opened an existing record but changed the month → treat as NEW entry
        const originalRecord = sameCodeRecords.find(e => e.id === finalEng.id);
        const monthChanged = originalRecord &&
          (originalRecord.month?.toLowerCase() !== finalEng.month?.toLowerCase() ||
            originalRecord.year !== finalEng.year);
        if (monthChanged) {
          // Strip id so Firestore creates a new document
          delete finalEng.id;
        }
      }

      // Generate a temporary ID if still missing
      if (!finalEng.id) finalEng.id = Date.now().toString();

      const savedId = await saveEngineerToDb(finalEng);
      const savedFinalId = savedId || finalEng.id;

      setEngineers(prev => {
        // If we are overwriting a specific id, replace that entry
        const idx = prev.findIndex(e => e.id === finalEng.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...finalEng, id: savedFinalId };
          return next;
        }
        // Otherwise it is a brand new entry
        return [...prev, { ...finalEng, id: savedFinalId }];
      });

      setEditingEng(null);
      message.success("Engineer record committed successfully");
      writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Saved engineer record', details: { name: finalEng.name, code: finalEng.code, month: finalEng.month, year: finalEng.year }, severity: 'info' });
    } catch (error) {
      console.error("Error saving engineer:", error);
      message.error("Error saving engineer. Check console.");
      writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error saving engineer', details: { error: String(error)?.slice(0, 200) }, severity: 'error' });
    } finally {
      setIsSaving(false);
      hide();
    }
  };


  const handleAddAdmin = async () => {
    if (!newAdminData.username || !newAdminData.password || !newAdminData.name) {
      message.warning("Please fill all fields");
      return;
    }
    const newAdmin = {
      id: Date.now().toString(),
      username: newAdminData.username,
      passwordB64: window.btoa(newAdminData.password),
      name: newAdminData.name,
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    };

    try {
      await saveAdminToDb(newAdmin);
      setAdmins(prev => [...prev, newAdmin]);
      setNewAdminData({ username: '', password: '', name: '' });
      setShowAddAdmin(false);
      message.success("New admin added successfully");
      writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Added new admin', details: { username: newAdmin.username, name: newAdmin.name }, severity: 'info' });
    } catch (error) {
      console.error("Error adding admin:", error);
      message.error("Failed to add admin");
      writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error adding admin', details: { error: String(error)?.slice(0, 200) }, severity: 'error' });
    }
  };

  const deleteAdminHandler = async (id) => {
    if (id === currentUser?.id) {
      message.error("You cannot delete yourself");
      return;
    }
    modal.confirm({
      title: 'Remove Admin',
      content: 'Are you sure you want to remove this admin?',
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteAdminFromDb(id);
          setAdmins(prev => prev.filter(a => a.id !== id));
          message.success("Admin removed");
          writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Deleted admin account', details: { id }, severity: 'warning' });
        } catch (error) {
          console.error("Error deleting admin:", error);
          message.error("Failed to delete admin");
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error deleting admin', details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      },
    });
  };

  const deleteEngineerHandler = async (id) => {
    modal.confirm({
      title: 'Archive Record',
      content: 'Are you sure you want to archive this engineer record? The data will be hidden but preserved.',
      okText: 'Archive',
      okType: 'danger',
      onOk: async () => {
        try {
          await archiveEngineer(id);
          const archivedEng = engineers.find(e => e.id === id);
          setEngineers(prev => prev.filter(e => e.id !== id));
          if (archivedEng) {
            setFetchedHiddenEngineers(prev => [...prev, { ...archivedEng, hidden: true }]);
          }
          message.success("Engineer archived");
          writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Archived engineer', details: { id, name: archivedEng?.name, code: archivedEng?.code }, severity: 'warning' });
        } catch (error) {
          console.error("Error deleting engineer:", error);
          message.error("Failed to archive engineer record.");
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error archiving engineer', details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      }
    });
  };

  const restoreEngineerHandler = async (id) => {
    modal.confirm({
      title: 'Restore Engineer',
      content: 'Are you sure you want to restore this engineer?',
      onOk: async () => {
        try {
          await saveEngineerToDb({ id, hidden: false });
          const restoredEng = fetchedHiddenEngineers.find(e => e.id === id);
          setFetchedHiddenEngineers(prev => prev.filter(e => e.id !== id));
          if (restoredEng) {
            setEngineers(prev => [...prev, { ...restoredEng, hidden: false }]);
          }
          message.success("Engineer restored");
          writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Restored engineer', details: { id, name: restoredEng?.name }, severity: 'info' });
        } catch (error) {
          console.error("Error restoring engineer:", error);
          message.error("Failed to restore engineer.");
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error restoring engineer', details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      }
    });
  };

  const downloadCSVTemplate = () => {
    const headers = [
      "Name", "Code", "PhotoURL", "ASC", "PartnerName", "Month", "Year",
      "RedoRatio", "IQCSkipRatio", "MaintenanceModeRatio", "OQCPassRate",
      "TrainingAttendance", "CorePartsPBA", "CorePartsOcta", "MultiPartsRatio",
      "ExamScore", "Promoters", "Detractors"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "TCS_Score_Template_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so re-uploading the same file retriggers onChange
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      const rows = text.split("\n").filter(row => row.trim() !== "");
      const uploadedRecords = rows.slice(1).map((row, index) => {
        const cols = row.split(",").map(c => c.trim());
        const eng = {
          id: '',
          name: cols[0] || "Unknown",
          code: cols[1]?.toUpperCase() || `TEMP-${index}`,
          photoUrl: cols[2] || "https://picsum.photos/200",
          asc: cols[3] || "N/A",
          partnerName: cols[4] || "N/A",
          month: cols[5] || "Active Month",
          year: cols[6] || new Date().getFullYear().toString(),
          redoRatio: parseFloat(cols[7]) || 0,
          iqcSkipRatio: parseFloat(cols[8]) || 0,
          maintenanceModeRatio: parseFloat(cols[9]) || 0,
          oqcPassRate: parseFloat(cols[10]) || 0,
          trainingAttendance: parseFloat(cols[11]) || 0,
          corePartsPBA: parseFloat(cols[12]) || 0,
          corePartsOcta: parseFloat(cols[13]) || 0,
          multiPartsRatio: parseFloat(cols[14]) || 0,
          examScore: parseFloat(cols[15]) || 0,
          promoters: parseFloat(cols[16]) || 0,
          detractors: parseFloat(cols[17]) || 0,
        };
        eng.tcsScore = calculateTCS(eng);
        eng.tier = getTier(eng.tcsScore);
        return eng;
      });

      if (uploadedRecords.length === 0) return;

      // ── Duplicate month check ──────────────────────────────────────────────
      const duplicates = uploadedRecords.filter(rec =>
        engineers.some(e =>
          e.code?.toUpperCase() === rec.code?.toUpperCase() &&
          e.month?.toLowerCase() === rec.month?.toLowerCase() &&
          e.year === rec.year
        )
      );

      if (duplicates.length > 0) {
        const names = duplicates.map(d => `${d.name} (${d.month} ${d.year})`).join('\n');
        const proceed = window.confirm(
          `⚠️ The following records already exist for that month:\n\n${names}\n\nClick OK to UPDATE existing records, or Cancel to abort the upload.`
        );
        if (!proceed) return;

        // For each duplicate, carry over the existing id so we overwrite it
        duplicates.forEach(rec => {
          const existing = engineers.find(e =>
            e.code?.toUpperCase() === rec.code?.toUpperCase() &&
            e.month?.toLowerCase() === rec.month?.toLowerCase() &&
            e.year === rec.year
          );
          if (existing) rec.id = existing.id;
        });
      }

      // ── Bulk Save ────────────────────────────────────────────────────────
      try {
        const promises = uploadedRecords.map(async (rec) => {
          const savedId = await saveEngineerToDb(rec);
          return { ...rec, id: savedId || rec.id };
        });
        const savedRecords = await Promise.all(promises);

        // Merge into local state: replace by id if exists, else push new
        setEngineers(prev => {
          const next = [...prev];
          savedRecords.forEach(rec => {
            const idx = next.findIndex(e => e.id === rec.id);
            if (idx !== -1) next[idx] = rec;
            else next.push(rec);
          });
          return next;
        });

        message.success(`Success: ${uploadedRecords.length} records processed and saved.`);
      } catch (error) {
        console.error("Error uploading CSV data:", error);
        message.error("Error saving CSV data to database.");
      }
    };
    reader.readAsText(file);
  };


  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black animate-pulse">LOADING TCS SYSTEM...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24 selection:bg-blue-600 selection:text-white">
      <Header onHome={() => setView('HOME')} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Animated page content wrapper — key changes on view to trigger re-animation */}
        <div key={view} className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out">

          {view === 'HOME' && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
              {/* Hero Section */}
              <section className="relative px-4 text-center space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Next-Gen TCS</p>
                </div>
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white">
                  Beyond<span className="text-blue-600"> Standards</span><br />Above<span className="text-blue-600"> Average</span>
                </h2>
              </section>

              {/* Dashboard Toggle */}
              <div className="flex justify-center">
                <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl">
                  <button
                    onClick={() => setHomeViewMode('MONTHLY')}
                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY'
                      ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                      : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setHomeViewMode('QUARTERLY')}
                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY'
                      ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>

              {/* Content Switcher */}
              {homeViewMode === 'MONTHLY' ? (
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
                  {/* Month Selector */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        const idx = allMonthPeriods.findIndex(p => p.key === effectiveHofMonth);
                        // Left arrow → go to earlier month (lower index in ascending array)
                        if (idx > 0) setSelectedHofMonth(allMonthPeriods[idx - 1].key);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-yellow-500/20 rounded-2xl px-8 py-4">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      <span className="text-base font-black text-white uppercase tracking-widest">
                        {effectiveHofMonth ? effectiveHofMonth.replace('-', ' ') : 'No Data'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const idx = allMonthPeriods.findIndex(p => p.key === effectiveHofMonth);
                        // Right arrow → go to later month (higher index in ascending array)
                        if (idx < allMonthPeriods.length - 1) setSelectedHofMonth(allMonthPeriods[idx + 1].key);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Top 10 List Monthly */}
                  <div className="space-y-4">
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Top 10 Engineers</h3>
                    {hofTop10.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this period.</div>
                    ) : hofTop10.map((eng, idx) => {
                      const isFirst = idx === 0;
                      const isSecond = idx === 1;
                      const isThird = idx === 2;
                      const rankBg = isFirst ? 'bg-yellow-500 text-black' : isSecond ? 'bg-zinc-300 text-black' : isThird ? 'bg-orange-700 text-white' : 'bg-zinc-800 text-zinc-400';
                      const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                      return (
                        <div key={eng.id} className={`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                          <div className="relative flex-shrink-0 w-14 h-14">
                            <img src={TIER_META[eng.tier]?.img || TIER_META.Bronze.img} alt={eng.tier} className="w-14 h-14 object-contain" />
                          </div>
                          <img src={eng.photoUrl} className={`w-14 h-14 rounded-2xl object-cover flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-base md:text-lg font-black uppercase tracking-tight truncate ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{eng.name}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <TierBadge tier={eng.tier} size="sm" />
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-3xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                              {eng.tcsScore}
                            </span>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">TCS Score</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
                  {/* Quarter Selector */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        const idx = allQuarterKeys.indexOf(effectiveQuarterKey);
                        if (idx < allQuarterKeys.length - 1) setSelectedQuarterKey(allQuarterKeys[idx + 1]);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-blue-500/20 rounded-2xl px-8 py-4">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-base font-black text-white uppercase tracking-widest">
                        {effectiveQuarterKey ? effectiveQuarterKey.replace('-', ' · ') : 'No Data'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const idx = allQuarterKeys.indexOf(effectiveQuarterKey);
                        if (idx > 0) setSelectedQuarterKey(allQuarterKeys[idx - 1]);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Top 10 List Quarterly */}
                  <div className="space-y-4">
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Top 10 Engineers (Quarterly Avg)</h3>
                    {quarterlyRanking.slice(0, 10).length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this quarter.</div>
                    ) : quarterlyRanking.slice(0, 10).map((eng, idx) => {
                      const isFirst = idx === 0;
                      const isSecond = idx === 1;
                      const isThird = idx === 2;
                      const rankBg = isFirst ? 'bg-yellow-500 text-black' : isSecond ? 'bg-zinc-300 text-black' : isThird ? 'bg-orange-700 text-white' : 'bg-zinc-800 text-zinc-400';
                      const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                      return (
                        <div key={eng.id + effectiveQuarterKey} className={`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                          <div className="relative flex-shrink-0 w-14 h-14">
                            <img src={TIER_META[eng.tier]?.img || TIER_META.Bronze.img} alt={eng.tier} className="w-14 h-14 object-contain" />
                          </div>
                          <img src={eng.photoUrl} className={`w-14 h-14 rounded-2xl object-cover flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-base md:text-lg font-black uppercase tracking-tight truncate ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{eng.name}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <TierBadge tier={eng.tier} size="sm" />
                              <span className="text-[8px] font-black text-zinc-700 uppercase">{eng.monthCount} month{eng.monthCount > 1 ? 's' : ''} tracked</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-3xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                              {eng.avgScore}
                            </span>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Avg TCS</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quarter Summary Stats */}
                  {quarterlyRanking.length > 0 && (
                    <div className="glass-card rounded-[3rem] p-10 mt-8">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8">Quarter Summary — {effectiveQuarterKey?.replace('-', ' · ')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Engineers</p>
                          <p className="text-3xl font-black text-white">{quarterlyRanking.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Avg Score</p>
                          <p className="text-3xl font-black text-blue-400">{(quarterlyRanking.reduce((s, e) => s + e.avgScore, 0) / quarterlyRanking.length).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>
                          <p className="text-3xl font-black text-yellow-400">{quarterlyRanking[0]?.avgScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Champion</p>
                          <TierBadge tier={quarterlyRanking[0]?.tier || 'Bronze'} size="md" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === 'ENGINEER_LOOKUP' && (
            <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
              {/* Header section */}
              <div className=" gap-12 border-b border-white/5 pb-6">



                <button
                  onClick={() => setView('HOME')}
                  className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Return to Hub
                </button>

                <h2 className="text-6xl text-center font-black tracking-tighter text-white uppercase italic leading-none py-12">"Precision Defines Rank."</h2>
              </div>


              {/* Central Verification Unit */}
              <div className="max-w-2xl mx-auto">
                <div className="glass-card rounded-[4rem] p-12 md:p-16 space-y-12 border-blue-500/10 shadow-3xl text-center relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Search className="w-64 h-64 -rotate-12" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Credential Verification</h3>
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Enter unique engineer identification code below</p>
                  </div>

                  <div className="space-y-8 relative z-10">
                    <div className="relative group">
                      <input
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                        placeholder="PROTO_XYZ_000"
                        className="w-full bg-black border border-white/5 rounded-3xl p-6 md:p-8 text-center text-2xl md:text-4xl font-black tracking-[0.2em] md:tracking-[0.4em] focus:border-blue-500 transition-all outline-none placeholder:text-zinc-900 text-white shadow-inner"
                      />
                      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-500 group-focus-within:w-1/2 transition-all duration-700" />
                    </div>

                    <button
                      onClick={handleSearch}
                      className="w-full bg-white text-black py-6 md:py-8 rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl"
                    >
                      Search
                    </button>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-6 relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Nodes Scanned</span>
                      <span className="text-sm font-black text-zinc-400 uppercase">Global_Registry</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Protocol</span>
                      <span className="text-sm font-black text-zinc-400 uppercase">TCS-V7.2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'ADMIN_LOGIN' && (
            <div className="max-w-md mx-auto pt-24 space-y-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-white" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Secure Gateway</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">TERMINAL<br />LOGIN</h2>
                <p className="text-zinc-600 text-sm font-medium">Authentication required for management node access.</p>
              </div>

              <div className="space-y-6 bg-zinc-900 shadow-3xl p-10 rounded-[3rem] border border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access ID</label>
                  <input
                    type="text"
                    placeholder="USERNAME_ALPHA"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Security Token</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                  />
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-[0.3em] mt-6"
                >
                  Execute Initialization
                </button>
                <button
                  onClick={() => setView('HOME')}
                  className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors py-4"
                >
                  Abort Connection
                </button>
              </div>
            </div>
          )}

          {view === 'ADMIN_DASHBOARD' && currentUser && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* Dashboard Header — compact */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500">Command Center</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">TCS Hub Control</h2>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/50 px-5 py-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
                    <UserCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">Operator</span>
                    <span className="text-xs font-black text-white uppercase">{currentUser.name}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-zinc-800 mx-1" />
                  <button
                    onClick={handleLogout}
                    className="p-2 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all group"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Action Bar — 6 actions in 3x2 grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Add Engineer */}
                <button
                  onClick={() => setEditingEng({
                    id: '', name: '', code: '', photoUrl: 'https://picsum.photos/200', asc: '', partnerName: '', month: 'March', year: '2026',
                    redoRatio: '', iqcSkipRatio: '', maintenanceModeRatio: '', oqcPassRate: '',
                    trainingAttendance: '', corePartsPBA: '', corePartsOcta: '', multiPartsRatio: '',
                    examScore: '', promoters: '', detractors: '', tcsScore: 0, tier: 'Bronze'
                  })}
                  className="flex flex-col items-center gap-2 bg-white text-black p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Add Engineer
                </button>

                {/* Bulk Upload */}
                <label className="flex flex-col items-center gap-2 cursor-pointer bg-blue-600/10 border border-blue-500/20 text-blue-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-blue-600/20 transition-all">
                  <Upload className="w-5 h-5" />
                  Bulk Upload
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                </label>

                {/* Download Template */}
                <button
                  onClick={downloadCSVTemplate}
                  className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <Download className="w-5 h-5" />
                  CSV Template
                </button>

                {/* Manage Accounts */}
                <button
                  onClick={() => setView('PROFILE_MGMT')}
                  className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <Settings className="w-5 h-5" />
                  Manage Accounts
                </button>

                {/* TCS Guide */}
                <button
                  onClick={() => setView('TCS_INFO')}
                  className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  TCS Guide
                </button>

                {/* Actions Log toggle */}
                <button
                  onClick={() => { setShowActivityLog(v => !v); if (!showActivityLog) loadLogs(); }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border ${showActivityLog
                    ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                >
                  <Activity className="w-5 h-5" />
                  Actions Log
                </button>
              </div>

              {/* Analytics Panel */}
              {analyticsSummary && (() => {
                const today = new Date().toISOString().slice(0, 10);
                const todayVisitors = analyticsSummary.dailyVisitorHits?.[today] || 0;
                const todayAdmins = analyticsSummary.dailyAdminLogins?.[today] || 0;
                const avgVMs = analyticsSummary.avgVisitorSessionMs || 0;
                const avgVMin = Math.floor(avgVMs / 60000);
                const avgVSec = Math.floor((avgVMs % 60000) / 1000);
                const avgAMs = analyticsSummary.avgAdminSessionMs || 0;
                const avgAMin = Math.floor(avgAMs / 60000);
                const avgASec = Math.floor((avgAMs % 60000) / 1000);
                return (
                  <div className="glass-card rounded-[2.5rem] p-8 space-y-6 border border-blue-500/10">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">App Analytics</h3>
                      <span className="ml-auto text-[8px] font-black text-zinc-700 uppercase tracking-widest">Live · Firestore</span>
                      <button
                        onClick={refreshAnalytics}
                        disabled={analyticsLoading}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${analyticsLoading ? 'animate-spin' : ''}`} />
                        {analyticsLoading ? 'Loading…' : 'Refresh'}
                      </button>
                    </div>

                    {/* Visitor Stats */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">👤 Visitor Traffic</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">All-Time Visits</p>
                          <p className="text-2xl font-black text-emerald-400 italic">{analyticsSummary.visitorHits ?? '—'}</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Today</p>
                          <p className="text-2xl font-black text-emerald-400 italic">{todayVisitors}</p>
                          <p className="text-[7px] text-zinc-700 mt-1">{today}</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sessions</p>
                          <p className="text-2xl font-black text-emerald-400 italic">{analyticsSummary.visitorSessions ?? '—'}</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Avg Time</p>
                          <p className="text-2xl font-black text-emerald-400 italic">{avgVMin}m {avgVSec}s</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Admin Stats */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">🛡️ Admin Activity</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">All-Time Logins</p>
                          <p className="text-2xl font-black text-blue-400 italic">{analyticsSummary.adminLogins ?? '—'}</p>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Today</p>
                          <p className="text-2xl font-black text-blue-400 italic">{todayAdmins}</p>
                          <p className="text-[7px] text-zinc-700 mt-1">{today}</p>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sessions</p>
                          <p className="text-2xl font-black text-blue-400 italic">{analyticsSummary.adminSessions ?? '—'}</p>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Avg Time</p>
                          <p className="text-2xl font-black text-blue-400 italic">{avgAMin}m {avgASec}s</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Collapsible Activity Log Panel */}
              {showActivityLog && (() => {
                const SEVERITY_STYLES = {
                  info: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                  warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                  error: 'bg-red-500/10 text-red-400 border-red-500/30',
                };
                const TYPE_COLORS = {
                  ADMIN_LOGIN: 'text-emerald-400',
                  ADMIN_LOGOUT: 'text-zinc-400',
                  ADMIN_ACTION: 'text-blue-400',
                  FAILED_LOGIN: 'text-yellow-400',
                  ERROR: 'text-red-400',
                  VISITOR_EVENT: 'text-purple-400',
                };
                return (
                  <div className="glass-card rounded-[2.5rem] p-8 space-y-5 border border-emerald-500/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Actions Log</h3>
                      <span className="ml-auto text-[8px] font-black text-zinc-700 uppercase tracking-widest">Last 100 events</span>
                      <button
                        onClick={loadLogs}
                        disabled={logsLoading}
                        className="flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-white/10 rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                        {logsLoading ? 'Loading…' : 'Refresh'}
                      </button>
                      <button
                        onClick={() => setShowActivityLog(false)}
                        className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {activityLogs.length === 0 ? (
                      <p className="text-center text-zinc-700 text-[10px] uppercase tracking-widest py-8">{logsLoading ? 'Loading logs…' : 'No activity recorded yet.'}</p>
                    ) : (
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                        {activityLogs.map(log => (
                          <div key={log.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                            <div className="flex-shrink-0 mt-0.5">
                              <span className={`text-[8px] font-black uppercase tracking-widest ${TYPE_COLORS[log.type] || 'text-zinc-400'}`}>{log.type?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white truncate">{log.action}</p>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <p className="text-[9px] text-zinc-500 mt-0.5 truncate">
                                  {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                </p>
                              )}
                              {(log.ip || log.location) && (
                                <p className="text-[8px] text-blue-400/70 mt-0.5">
                                  IP: {log.ip || 'unknown'}{log.location ? ` · ${log.location}` : ''}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[8px] font-black text-zinc-500 uppercase">{log.actor}</p>
                              <p className="text-[7px] text-zinc-700 mt-0.5">
                                {log.timestamp ? log.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Live Registry Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Live Engineer Registry</h3>
                  </div>
                  <button
                    onClick={() => setNoEngineers(!noEngineers)}
                    className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all shadow-xl"
                  >
                    <Eye className="w-4 h-4" />
                    {noEngineers ? "Minimize Archives" : "Inspect Archives"}
                  </button>
                </div>

                {/* Archive Stack */}
                {noEngineers && fetchedHiddenEngineers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                    {fetchedHiddenEngineers.map(eng => (
                      <div key={eng.id} className="bg-red-950/10 border border-red-900/20 p-6 rounded-3xl flex items-center justify-between group hover:bg-red-900/20 transition-all">
                        <div className="flex items-center gap-5">
                          <img src={eng.photoUrl} className="w-12 h-12 rounded-xl object-cover grayscale opacity-40 shadow-2xl" alt={eng.name} />
                          <div>
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-tight line-through opacity-50">{eng.name}</p>
                            <span className="text-[9px] font-black text-red-500 tracking-widest uppercase mt-1 block">ARCHIVED : {eng.code}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => restoreEngineerHandler(eng.id)}
                          className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Registry Stack — deduplicated: one row per engineer (newest record) */}
                <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                  {deduplicatedEngineers.length === 0 ? (
                    <div className="p-24 text-center text-zinc-700 italic font-black uppercase tracking-[0.3em]">No registry entries detected.</div>
                  ) : deduplicatedEngineers.map(eng => (

                    <div key={eng.id} className="bg-black hover:bg-zinc-900/50 transition-all p-3 md:p-6 flex items-center justify-between gap-2 group">
                      <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                        <div className="w-10 h-10 md:w-14 md:h-14 relative flex-shrink-0">
                          <img src={eng.photoUrl} className="w-full h-full rounded-xl md:rounded-2xl object-cover grayscale-50 group-hover:grayscale-0 transition-all shadow-2xl shadow-black/80" alt={eng.name} />
                          <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border-2 border-black bg-black flex items-center justify-center">
                            <img src={TIER_META[eng.tier]?.img || TIER_META.Bronze.img} alt={eng.tier} className="w-4 h-4 object-contain" />
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs md:text-base font-black text-white uppercase tracking-tighter group-hover:text-blue-500 transition-colors truncate">{eng.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{eng.code}</span>
                            <TierBadge tier={eng.tier} size="sm" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-sm md:text-xl font-black text-white tracking-widest italic">{eng.tcsScore}</span>
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">TCS</p>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => setEditingEng(eng)}
                            className="p-2 md:p-3 bg-zinc-900 text-zinc-500 rounded-lg md:rounded-2xl hover:bg-white hover:text-black transition-all"
                          >
                            <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEngineerHandler(eng.id)}
                            className="p-2 md:p-3 bg-zinc-900 text-zinc-500 rounded-lg md:rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                          >
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'PROFILE_MGMT' && (
            <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
              <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-white" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Security Infrastructure</span>
                  </div>
                  <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">ADMIN<br />DIRECTORY</h2>
                </div>
                <button
                  onClick={() => setView('ADMIN_DASHBOARD')}
                  className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Return to Command
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-8">
                  <div className="glass-card rounded-[3rem] p-10 space-y-10 border-green-500/20 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-green-500" /> Provision Node
                      </h3>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Identity</label>
                        <input
                          type="text"
                          placeholder="NAME_ALPHA"
                          className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                          value={newAdminData.name}
                          onChange={e => setNewAdminData({ ...newAdminData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access Identifier</label>
                        <input
                          type="text"
                          placeholder="USERNAME_SIGMA"
                          className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                          value={newAdminData.username}
                          onChange={e => setNewAdminData({ ...newAdminData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Secure Key</label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                          value={newAdminData.password}
                          onChange={e => setNewAdminData({ ...newAdminData, password: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={handleAddAdmin}
                        className="w-full bg-green-600 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-green-500 transition-all shadow-2xl shadow-green-900/40 mt-6"
                      >
                        Initialize Provisioning
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Active Operations Nodes</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {admins.map(admin => (
                      <div key={admin.id} className="bg-zinc-900/50 hover:bg-zinc-900 transition-all p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-zinc-700 border border-white/5 group-hover:text-blue-500 transition-colors shadow-inner">
                            <UserCircle className="w-8 h-8" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black text-white uppercase tracking-tighter">{admin.name}</span>
                              {admin.role === 'SUPER_ADMIN' && <span className="text-[8px] bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full border border-blue-600/20 font-black tracking-widest uppercase">System Root</span>}
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">@ACCESS_ID: {admin.username}</span>
                          </div>
                        </div>
                        {admin.id !== '1' && (
                          <button
                            onClick={() => deleteAdminHandler(admin.id)}
                            className="p-5 bg-black text-zinc-700 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'ENGINEER_PROFILE' && selectedEngineer && (
            <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
              {/* Dossier Header */}
              <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-12 border-b border-white/5 pb-16">
                <div className="flex flex-col items-center md:items-start gap-8">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    <img src={selectedEngineer.photoUrl} className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3.5rem] object-cover border-4 border-zinc-800 shadow-3xl grayscale-50 group-hover:grayscale-0 transition-all duration-500" alt={selectedEngineer.name} />
                    <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border-4 border-black z-20 bg-black">
                      <img src={TIER_META[selectedEngineer.tier]?.img || TIER_META.Bronze.img} alt={selectedEngineer.tier} className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                    </div>
                  </div>
                  {/* Self-service photo update */}
                  <button
                    onClick={() => { setShowPhotoAuth(true); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                  >
                    <Camera className="w-3 h-3" />
                    Update My Photo
                  </button>
                  <div className="text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="h-[1px] w-8 bg-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Personnel Dossier</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">{selectedEngineer.name}</h2>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.6em]">{selectedEngineer.code}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="glass-card px-10 py-6 rounded-3xl flex flex-col items-end border-blue-500/20 shadow-2xl">
                    <span className="text-6xl font-black text-white italic tracking-tighter">{selectedEngineer.tcsScore}</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Aggregate Capability Index</span>
                  </div>
                  <button
                    onClick={() => setView('ENGINEER_LOOKUP')}
                    className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Registry
                  </button>
                </div>
              </div>

              {/* ── Period Selector ─────────────────────────────────── */}
              {(() => {
                // Build list of all monthly & quarterly periods for this engineer
                // Deduplicate by month+year — keep highest score record per period
                const allEngRecords = engineers
                  .filter(e => e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase())
                  .sort((a, b) => {
                    const ya = parseInt(a.year), yb = parseInt(b.year);
                    if (ya !== yb) return ya - yb; // oldest year first
                    return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                  });
                // One record per month-year combo (keep highest TCS score)
                const dedupByMonth = {};
                allEngRecords.forEach(r => {
                  const k = `${r.month?.toLowerCase()}-${r.year}`;
                  if (!dedupByMonth[k] || r.tcsScore > dedupByMonth[k].tcsScore) dedupByMonth[k] = r;
                });
                const engRecords = Object.values(dedupByMonth).sort((a, b) => {
                  const ya = parseInt(a.year), yb = parseInt(b.year);
                  if (ya !== yb) return ya - yb; // oldest year first
                  return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                });
                const monthPeriods = engRecords.map(r => ({ key: `${r.month}-${r.year}`, label: `${r.month} ${r.year}` }));
                const quarterPeriods = [...new Map(
                  engRecords
                    .filter(r => getQuarter(r.month) !== null)
                    .map(r => {
                      const q = getQuarter(r.month);
                      const qk = `${q}-${r.year}`;
                      return [qk, { key: qk, label: `${q} · ${r.year}` }];
                    })
                ).values()];


                // Effective display record
                const effMonthKey = selectedProfileMonth || monthPeriods[0]?.key;
                const [effM, effY] = (effMonthKey || '').split('-');
                const effRecord = engRecords.find(
                  r => r.month?.toLowerCase() === effM?.toLowerCase() && r.year === effY
                ) || selectedEngineer;

                const effQKey = selectedProfileQuarter || quarterPeriods[0]?.key;

                // Quarterly average for this engineer in the selected quarter
                const [effQ, effQY] = (effQKey || '').split('-');
                const qRecords = engRecords.filter(
                  r => getQuarter(r.month) === effQ && r.year === effQY
                );
                const qAvgScore = qRecords.length > 0
                  ? parseFloat((qRecords.reduce((s, r) => s + r.tcsScore, 0) / qRecords.length).toFixed(1))
                  : 0;
                const qAvgDrnps = qRecords.length > 0
                  ? parseFloat((qRecords.reduce((s, r) => s + calculateDRNPS(r.promoters, r.detractors), 0) / qRecords.length).toFixed(1))
                  : 0;
                const qAvgExam = qRecords.length > 0
                  ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.examScore || 0), 0) / qRecords.length).toFixed(1))
                  : 0;

                // The record whose data drives the performance bars
                const dispRecord = profileViewMode === 'QUARTERLY' ? (qRecords[0] || selectedEngineer) : effRecord;
                const dispScore = profileViewMode === 'QUARTERLY' ? qAvgScore : effRecord.tcsScore;
                const dispDrnps = profileViewMode === 'QUARTERLY' ? qAvgDrnps : calculateDRNPS(effRecord.promoters, effRecord.detractors);
                const dispExam = profileViewMode === 'QUARTERLY' ? qAvgExam : parseFloat(effRecord.examScore || 0);

                // Weighted component pts
                const kpiPts = parseFloat(((dispScore - Math.min(20, (dispExam / 100) * 20) - Math.min(30, (dispDrnps / 100) * 30))).toFixed(1));
                const examPts = parseFloat(Math.min(20, (dispExam / 100) * 20).toFixed(1));
                const drnpsPts = parseFloat(Math.min(30, (dispDrnps / 100) * 30).toFixed(1));

                return (
                  <div className="space-y-8">
                    {/* Period toggle */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="inline-flex bg-zinc-900 border border-white/10 rounded-2xl p-1 gap-1">
                        {['MONTHLY', 'QUARTERLY'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setProfileViewMode(mode)}
                            className={`px-6 py-2(5) rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileViewMode === mode
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'text-zinc-500 hover:text-white'
                              }`}
                          >
                            {mode === 'MONTHLY' ? '📅 Monthly' : '📊 Quarterly'}
                          </button>
                        ))}
                      </div>

                      {/* Month or Quarter picker */}
                      {profileViewMode === 'MONTHLY' ? (
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                          {monthPeriods.map(p => (
                            <button
                              key={p.key}
                              onClick={() => {
                                setSelectedProfileMonth(p.key);
                                const [m, y] = p.key.split('-');
                                const rec = engRecords.find(r => r.month?.toLowerCase() === m?.toLowerCase() && r.year === y);
                                if (rec) setSelectedEngineer(rec);
                              }}
                              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.key === effMonthKey
                                ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                                : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                          {quarterPeriods.map(p => (
                            <button
                              key={p.key}
                              onClick={() => setSelectedProfileQuarter(p.key)}
                              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.key === effQKey
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score breakdown + TCS total */}
                    <div className="glass-card rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 border-blue-500/10">
                      {/* Big TCS total */}
                      <div className="flex flex-col items-center md:border-r border-white/5 md:pr-8 flex-shrink-0">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                          {profileViewMode === 'QUARTERLY' ? `Avg TCS — ${effQKey?.replace('-', ' ')}` : `TCS Score — ${effMonthKey?.replace('-', ' ')}`}
                        </span>
                        <span className="text-6xl font-black text-white italic tracking-tighter">{dispScore}</span>
                        <TierBadge tier={getTier(dispScore)} size="lg" />
                      </div>

                      {/* Three weighted components */}
                      <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">KPIs</span>
                          <span className="text-3xl font-black text-emerald-300 italic">{kpiPts > 0 ? kpiPts.toFixed(1) : '—'}</span>
                        </div>
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                          <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">DRNPS</span>
                          <span className="text-3xl font-black text-purple-300 italic">{drnpsPts.toFixed(1)}</span>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Exam</span>
                          <span className="text-3xl font-black text-blue-300 italic">{examPts.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Capability Metrics Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="glass-card rounded-[3rem] p-10 space-y-8 md:col-span-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                            <Activity className="w-4 h-4 text-blue-500" /> Performance Analysis
                          </h3>
                          <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                            Ref: CY-{dispRecord.year}/{dispRecord.month?.slice(0, 3).toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-10 py-4">
                          {/* Primary metrics */}
                          <div className="space-y-5">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em]">Score Components</p>
                            <MetricBar label="Exam Score" value={dispExam} max={100} suffix=" pts" target={90} />
                            <MetricBar label="DRNPS" value={parseFloat(dispDrnps.toFixed(1))} max={100} suffix=" pts" target={80} />
                          </div>

                          {/* KPI metrics */}
                          <div className="border-t border-white/5 pt-8 space-y-5">
                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.4em]">KPI Breakdown (50% of Total)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                              <MetricBar label="Training Attendance" value={parseFloat(dispRecord.trainingAttendance || 0)} max={100} suffix="%" target={100} />
                              <MetricBar label="OQC Pass Rate" value={parseFloat(dispRecord.oqcPassRate || 0)} max={100} suffix="%" target={85} />
                              <MetricBar label="Maintenance Mode" value={parseFloat(dispRecord.maintenanceModeRatio || 0)} max={100} suffix="%" target={65} />
                              <MetricBar label="REDO Ratio" value={parseFloat(dispRecord.redoRatio || 0)} max={3} suffix="%" target={0.7} inverse />
                              <MetricBar label="IQC Skip Ratio" value={parseFloat(dispRecord.iqcSkipRatio || 0)} max={50} suffix="%" target={25} inverse />
                              <MetricBar label="Core Parts PBA" value={parseFloat(dispRecord.corePartsPBA || 0)} max={80} suffix="%" target={30} inverse />
                              <MetricBar label="Core Parts Octa" value={parseFloat(dispRecord.corePartsOcta || 0)} max={80} suffix="%" target={40} inverse />
                              <MetricBar label="Multi Parts Ratio" value={parseFloat(dispRecord.multiPartsRatio || 0)} max={5} suffix="%" target={1} inverse />
                            </div>
                          </div>
                        </div>
                      </div>


                      <div className="space-y-8">
                        {/* Global Rank Card */}
                        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20">
                            <Layers className="w-8 h-8" />
                          </div>
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Global Network Rank</h4>
                          <span className="text-5xl font-black text-white italic tracking-tighter mb-2">#{sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1}</span>
                          <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest">Top {Math.round(((sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1) / engineers.length) * 100)}% of global talent</p>
                        </div>

                        {/* Audit Metadata + Tier */}
                        <div className="glass-card rounded-[3rem] p-10">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Audit Metadata</h4>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase">Cycle</span>
                              <span className="text-xs font-black text-white uppercase">{selectedEngineer.month} {selectedEngineer.year}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase">Quarter</span>
                              <span className="text-xs font-black text-yellow-400 uppercase">{getQuarter(selectedEngineer.month)} · {selectedEngineer.year}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase">Tier Status</span>
                              <TierBadge tier={selectedEngineer.tier} size="sm" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase">Auth Code</span>
                              <span className="text-[10px] font-mono text-zinc-400">TCS-{selectedEngineer.code}</span>
                            </div>
                          </div>
                        </div>

                        {/* History Button */}
                        {engineerHistory.length > 0 && (
                          <button
                            onClick={() => setView('ENGINEER_HISTORY')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-zinc-900 border border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                          >
                            <Clock className="w-4 h-4" /> View History ({engineerHistory.length} months)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                );
              })()}



              {/* Rankings Summary */}
              {engineerSummaryRanks && (
                <div className="glass-card rounded-[3rem] p-10 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Rankings Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Rank */}
                    <div className="bg-zinc-900/60 rounded-[2rem] p-8 flex items-center gap-6 border border-white/5">
                      <div className="flex-shrink-0 w-16 h-16 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-7 h-7 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Monthly Rank — {engineerSummaryRanks.month} {engineerSummaryRanks.year}</p>
                        <p className="text-3xl font-black text-white italic">
                          #{engineerSummaryRanks.monthRank}
                          <span className="text-sm text-zinc-600 ml-2 font-bold not-italic">of {engineerSummaryRanks.monthTotal}</span>
                        </p>
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">
                          Top {engineerSummaryRanks.monthTotal > 0 ? Math.round((engineerSummaryRanks.monthRank / engineerSummaryRanks.monthTotal) * 100) : 0}% this month
                        </p>
                      </div>
                    </div>
                    {/* Quarterly Rank */}
                    <div className="bg-zinc-900/60 rounded-[2rem] p-8 flex items-center gap-6 border border-white/5">
                      <div className="flex-shrink-0 w-16 h-16 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Quarterly Rank — {engineerSummaryRanks.quarter} {engineerSummaryRanks.year}</p>
                        <p className="text-3xl font-black text-white italic">
                          #{engineerSummaryRanks.qRank}
                          <span className="text-sm text-zinc-600 ml-2 font-bold not-italic">of {engineerSummaryRanks.qTotal}</span>
                        </p>
                        <p className="text-[9px] text-yellow-400 font-black uppercase tracking-widest mt-1">
                          Top {engineerSummaryRanks.qTotal > 0 ? Math.round((engineerSummaryRanks.qRank / engineerSummaryRanks.qTotal) * 100) : 0}% this quarter
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance Watermark */}
              <div className="pt-12 text-center opacity-20 select-none pointer-events-none">
                <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">Official TCS Certification Document • Unauthorized reproduction prohibited</p>
              </div>
            </div>
          )}

          {/* ─── ENGINEER HISTORY VIEW ──────────────────────────────────────────────── */}
          {view === 'ENGINEER_HISTORY' && selectedEngineer && (() => {
            // All records for this engineer — engineerHistory is newest-first
            const allRecords = engineerHistory;
            // Pills shown in calendar order (Jan → Dec), default selection = newest
            const calendarRecords = [...allRecords].sort((a, b) => {
              const ya = parseInt(a.year), yb = parseInt(b.year);
              if (ya !== yb) return ya - yb;
              return getMonthIndex(a.month) - getMonthIndex(b.month);
            });
            const effKey = selectedHistoryMonth || (allRecords[0] ? `${allRecords[0].month}-${allRecords[0].year}` : null);
            const activeRecord = allRecords.find(r => `${r.month}-${r.year}` === effKey) || allRecords[0];

            return (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-[2px] w-12 bg-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Performance Timeline</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">{selectedEngineer.name}</h2>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{selectedEngineer.code}</p>
                  </div>
                  <button
                    onClick={() => setView('ENGINEER_PROFILE')}
                    className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
                  </button>
                </div>

                {/* Month Selector pills */}
                {allRecords.length > 0 ? (
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em]">Select Period to View</p>
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        {calendarRecords.map((r, idx) => {
                          const key = `${r.month}-${r.year}`;
                          const isActive = key === effKey;
                          const isNewest = idx === calendarRecords.length - 1;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedHistoryMonth(key)}
                              className={`flex flex-col items-center px-6 py-3 rounded-2xl border font-black transition-all ${isActive
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-zinc-600 hover:text-white'
                                }`}
                            >
                              <span className="text-[11px] uppercase tracking-widest">{r.month}</span>
                              <span className="text-[8px] text-zinc-500 mt-0.5">{r.year}</span>
                              {isNewest && <span className="text-[6px] text-blue-300 uppercase tracking-widest mt-1">Latest</span>}
                            </button>
                          );
                        })}

                      </div>
                    </div>

                    {/* Selected Record Card */}
                    {activeRecord && (
                      <div className="glass-card rounded-[3rem] p-8 md:p-12 space-y-8 border border-blue-500/20 shadow-blue-500/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        {/* Month Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                              <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-black text-white uppercase tracking-tight">{activeRecord.month} {activeRecord.year}</p>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{activeRecord.qKey} · Monthly Performance Report</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <TierBadge tier={activeRecord.tier} size="lg" />
                            <div className="text-right">
                              <span className="text-5xl font-black text-white italic tracking-tighter">{activeRecord.tcsScore}</span>
                              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">TCS Score</p>
                            </div>
                          </div>
                        </div>

                        {/* Rank Summary Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Monthly Rank</p>
                            <p className="text-2xl font-black text-blue-400">#{activeRecord.monthRank}</p>
                            <p className="text-[8px] text-zinc-600">of {activeRecord.monthTotal}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Quarterly Rank</p>
                            <p className="text-2xl font-black text-yellow-400">#{activeRecord.qRank}</p>
                            <p className="text-[8px] text-zinc-600">of {activeRecord.qTotal}</p>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Exam Score</p>
                            <p className="text-2xl font-black text-white">{activeRecord.examScore}</p>
                            <p className="text-[8px] text-zinc-600">/ 100 pts</p>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">DRNPS</p>
                            <p className="text-2xl font-black text-emerald-400">{calculateDRNPS(activeRecord.promoters, activeRecord.detractors).toFixed(0)}</p>
                            <p className="text-[8px] text-zinc-600">/ 100</p>
                          </div>
                        </div>

                        {/* KPI Numbers Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                          {[
                            { label: 'REDO Ratio', value: `${activeRecord.redoRatio}%`, target: '≤0.7', bad: parseFloat(activeRecord.redoRatio) > 0.7 },
                            { label: 'IQC Skip', value: `${activeRecord.iqcSkipRatio}%`, target: '≤25', bad: parseFloat(activeRecord.iqcSkipRatio) > 25 },
                            { label: 'Maint. Mode', value: `${activeRecord.maintenanceModeRatio}%`, target: '≥65', bad: parseFloat(activeRecord.maintenanceModeRatio) < 65 },
                            { label: 'OQC Pass', value: `${activeRecord.oqcPassRate}%`, target: '≥85', bad: parseFloat(activeRecord.oqcPassRate) < 85 },
                            { label: 'Training', value: `${activeRecord.trainingAttendance}%`, target: '=100', bad: parseFloat(activeRecord.trainingAttendance) < 100 },
                            { label: 'Core PBA', value: `${activeRecord.corePartsPBA}%`, target: '≤30', bad: parseFloat(activeRecord.corePartsPBA) > 30 },
                            { label: 'Core Octa', value: `${activeRecord.corePartsOcta}%`, target: '≤40', bad: parseFloat(activeRecord.corePartsOcta) > 40 },
                            { label: 'Multi Parts', value: `${activeRecord.multiPartsRatio}%`, target: '≤1', bad: parseFloat(activeRecord.multiPartsRatio) > 1 },
                          ].map(kpi => (
                            <div key={kpi.label} className={`rounded-xl p-3 border transition-all ${kpi.bad ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
                              }`}>
                              <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{kpi.label}</p>
                              <p className={`text-base font-black ${kpi.bad ? 'text-red-400' : 'text-emerald-400'}`}>{kpi.value}</p>
                              <p className="text-[7px] text-zinc-700">target {kpi.target}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest">No history records found.</div>
                )}

                {/* Feedback button */}
                <button
                  onClick={() => {
                    setFeedbackName(selectedEngineer.name);
                    setFeedbackSent(false);
                    setFeedbackText('');
                    setFeedbackRating(0);
                    setView('FEEDBACK');
                  }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-purple-600/10 hover:border-purple-500/30 hover:text-purple-400 transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> Share Feedback & Suggestions
                </button>
              </div>
            );
          })()}

          {/* ─── TCS INFO / REFERENCE VIEW ─────────────────────────────────────────── */}
          {view === 'TCS_INFO' && (
            <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <div className="text-center space-y-4 border-b border-white/5 pb-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Official Guide</span>
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic">TCS<br />Reference Guide</h2>
                <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto">Technical Capability System — A transparent framework for measuring and rewarding engineering excellence.</p>
              </div>

              {/* What is TCS */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <Info className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">What is TCS?</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  The <strong className="text-white">Technical Capability System (TCS)</strong> is Samsung's internal engineering performance framework. Each month, every engineer receives a composite score (0–100) based on three dimensions: their KPI performance, customer satisfaction (DRNPS), and technical knowledge (Exam score). This score determines their tier ranking and standing in the team leaderboard.
                </p>
              </div>

              {/* Scoring Breakdown */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">How Your Score is Calculated</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'KPIs', pct: '50%', pts: 'Max 50 pts', color: 'emerald', desc: '8 operational KPIs: REDO ratio, IQC skip, maintenance mode, OQC pass rate, training attendance, core parts PBA/Octa, and multi-parts ratio.', icon: Activity },
                    { label: 'DRNPS', pct: '30%', pts: 'Max 30 pts', color: 'purple', desc: 'Customer satisfaction score derived from promoters and detractors. Formula: (((Promoters − Detractors) × 10) + 100) ÷ 2', icon: TrendingUp },
                    { label: 'Exam', pct: '20%', pts: 'Max 20 pts', color: 'blue', desc: 'Monthly technical knowledge exam score (0–100). Reflects mastery of repair procedures and product knowledge.', icon: BookOpen },
                  ].map(({ label, pct, pts, color, desc, icon: Icon }) => (
                    <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-[2.5rem] p-8 space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 bg-${color}-500/10 rounded-2xl flex items-center justify-center border border-${color}-500/20`}>
                          <Icon className={`w-6 h-6 text-${color}-400`} />
                        </div>
                        <span className={`text-4xl font-black italic tracking-tighter text-${color}-300`}>{pct}</span>
                      </div>
                      <div>
                        <p className={`text-lg font-black text-${color}-300 uppercase tracking-tight`}>{label}</p>
                        <p className={`text-[9px] font-black text-${color}-500 uppercase tracking-widest`}>{pts}</p>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Targets */}
              <div className="glass-card rounded-[3rem] p-10 space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">KPI Targets & Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { kpi: 'REDO Ratio', target: '≤ 0.7%', points: 30, dir: 'lower is better' },
                    { kpi: 'IQC Skip Ratio', target: '≤ 25%', points: 15, dir: 'lower is better' },
                    { kpi: 'OQC Pass Rate', target: '≥ 85%', points: 15, dir: 'higher is better' },
                    { kpi: 'Training Attendance', target: '100%', points: 10, dir: 'higher is better' },
                    { kpi: 'Maintenance Mode', target: '≥ 65%', points: 10, dir: 'higher is better' },
                    { kpi: 'Multi Parts Ratio', target: '≤ 1%', points: 10, dir: 'lower is better' },
                    { kpi: 'Core Parts PBA', target: '≤ 30%', points: 5, dir: 'lower is better' },
                    { kpi: 'Core Parts Octa', target: '≤ 40%', points: 5, dir: 'lower is better' },
                  ].map(row => (
                    <div key={row.kpi} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{row.kpi}</p>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">{row.dir}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-yellow-400">{row.points} pts</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase">{row.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier System */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Tier System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { tier: 'Masters', range: '90 – 100', desc: 'Elite engineers operating at peak performance across all metrics. Top 5% of the team.', meta: TIER_META.Masters },
                    { tier: 'Diamond', range: '80 – 89', desc: 'High performers with consistently strong KPIs, DRNPS and exam results.', meta: TIER_META.Diamond },
                    { tier: 'Platinum', range: '70 – 79', desc: 'Solid performers showing great reliability and customer satisfaction scores.', meta: TIER_META.Platinum },
                    { tier: 'Gold', range: '60 – 69', desc: 'Good overall performance with room to push into higher tier rankings.', meta: TIER_META.Gold },
                    { tier: 'Silver', range: '50 – 59', desc: 'Meeting baseline standards but with clear opportunities for improvement.', meta: TIER_META.Silver },
                    { tier: 'Bronze', range: '0 – 49', desc: 'Entry level or below-target performance. Focus on KPI improvement and exam preparation.', meta: TIER_META.Bronze },
                  ].map(({ tier, range, desc, meta }) => {
                    return (
                      <div key={tier} className={`border ${meta.border} rounded-[2rem] shadow-xl ${meta.glow} bg-zinc-950`}>
                        <div className="rounded-[2rem] p-8 space-y-4 h-full">
                          <div className="flex items-center justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center shadow-lg border border-white/10">
                              <img src={meta.img} alt={tier} className="w-10 h-10 object-contain" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 border ${meta.border} ${meta.text}`}>{range} pts</span>
                          </div>
                          <div>
                            <p className={`text-2xl font-black uppercase tracking-tighter ${meta.text}`}>{tier}</p>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Specialist</p>
                          </div>
                          <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How Ranking Works */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">How Rankings Work</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: '01', title: 'Monthly Ranking', desc: 'Engineers are ranked by their TCS score within the same month and year. The leaderboard resets monthly.' },
                    { num: '02', title: 'Quarterly Ranking', desc: 'Engineers are ranked by their average TCS score across all months in a quarter (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec).' },
                    { num: '03', title: 'Tier Assignment', desc: 'Your tier (Bronze → Masters) is automatically assigned based on your final TCS score when data is saved.' },
                  ].map(({ num, title, desc }) => (
                    <div key={num} className="space-y-3">
                      <span className="text-5xl font-black italic text-zinc-800">{num}</span>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{title}</p>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ─── FEEDBACK VIEW ────────────────────────────────────────────── */}
          {view === 'FEEDBACK' && (
            <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-purple-500/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400">Engineer Voice</span>
                  <div className="h-[1px] w-16 bg-purple-500/50" />
                </div>
                <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Feedback &<br />Suggestions</h2>
                <p className="text-zinc-500 text-sm">Your voice shapes the next version of TCS. Share what works, what doesn't, and your ideas.</p>
              </div>

              {feedbackSent ? (
                // Success State
                <div className="glass-card rounded-[3rem] p-16 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 animate-pulse">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Thank You!</h3>
                  <p className="text-zinc-400 text-sm">Your feedback has been received. We appreciate your contribution to improving TCS.</p>
                  <button
                    onClick={() => setView('HOME')}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                // Form
                <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Your Name</label>
                    <input
                      type="text"
                      value={feedbackName}
                      onChange={e => setFeedbackName(e.target.value)}
                      placeholder="Engineer Name"
                      className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-purple-500 transition-all outline-none font-bold text-white shadow-inner"
                    />
                  </div>

                  {/* Star Rating */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Rate TCS Overall</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${star <= feedbackRating
                            ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400 scale-110'
                            : 'bg-zinc-900 border border-white/5 text-zinc-600 hover:text-yellow-400'
                            }`}
                        >
                          <Star className="w-6 h-6" fill={star <= feedbackRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="ml-2 flex items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {feedbackRating === 0 ? 'Select rating' : ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackRating - 1]}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Your Message</label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={6}
                      placeholder="Share your thoughts, suggestions, or concerns about TCS..."
                      className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-purple-500 transition-all outline-none font-medium text-white shadow-inner resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={async () => {
                      if (!feedbackText.trim()) { window.alert('Please write your feedback before submitting.'); return; }
                      setIsSendingFeedback(true);
                      try {
                        await saveFeedbackToDb({ name: feedbackName, message: feedbackText, rating: feedbackRating });
                        setFeedbackSent(true);
                      } catch (e) { console.error(e); window.alert('Failed to submit feedback. Please try again.'); }
                      finally { setIsSendingFeedback(false); }
                    }}
                    disabled={isSendingFeedback}
                    className="w-full bg-purple-600 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-2xl shadow-purple-900/40 flex items-center justify-center gap-3"
                  >
                    {isSendingFeedback
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send className="w-5 h-5" />}
                    {isSendingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>

                  <button
                    onClick={() => setView(selectedEngineer ? 'ENGINEER_HISTORY' : 'HOME')}
                    className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors py-3"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}


          {/* Upsert Modal (Manual Entry) */}

          {editingEng && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-start justify-center p-4 sm:p-12 overflow-y-auto custom-scrollbar pt-12">
              <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative my-auto overflow-hidden">
                {/* Decorative scanline effect */}
                <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                <button
                  onClick={() => setEditingEng(null)}
                  className="absolute top-8 right-8 p-4 bg-zinc-900 text-white rounded-2xl hover:bg-white hover:text-black transition-all shadow-3xl z-[110] group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-20 pt-8 md:pt-0">
                  <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-8 md:space-y-12 relative z-10">
                    <div className="relative group">
                      <div className="absolute -inset-8 bg-blue-600/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <div
                        className="relative w-32 h-32 md:w-64 md:h-64 rounded-[2.5rem] md:rounded-[4rem] border-4 border-zinc-800 overflow-hidden cursor-pointer shadow-3xl transition-all hover:border-blue-500 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <img src={editingEng.photoUrl} className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" alt="Profile" />
                        <div className="absolute inset-0 bg-blue-600/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                          <Camera className="w-10 h-10 text-white mb-2" />
                          <span className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Update Capture</span>
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>

                    <div className="space-y-4 md:space-y-6 w-full text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="h-[2px] w-8 md:w-12 bg-blue-500" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Node Provision</span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none tracking-tighter">
                          {editingEng.id ? 'UPDATE' : 'GENERATE'}<br />
                          <span className="text-blue-500">PROTOCOL</span>
                        </h2>
                        <p className="text-zinc-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{editingEng.id ? 'Editing existing registry entry' : 'Initializing new personnel node'}</p>
                      </div>

                      <div className="pt-4 md:pt-8 space-y-3 md:space-y-4 max-w-[200px] mx-auto lg:mx-0">
                        <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                          <span>Status</span>
                          <span className="text-green-500 font-black">ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                          <span>Encryption</span>
                          <span className="text-white font-black">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Operational Name</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.name} onChange={e => setEditingEng({ ...editingEng, name: e.target.value })} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Engineer Protocol Code</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none uppercase placeholder:text-zinc-800" placeholder="SAM-2026-X" value={editingEng.code} onChange={e => setEditingEng({ ...editingEng, code: e.target.value.toUpperCase() })} />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Active Audit Period</label>
                        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center">
                          <select className="w-full md:flex-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.month} onChange={e => setEditingEng({ ...editingEng, month: e.target.value })}>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input className="w-full md:w-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.year} onChange={e => setEditingEng({ ...editingEng, year: e.target.value })} placeholder="Year" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 space-y-10 glass-card">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] border-b border-white/5 pb-6">Performance Matrix Allocation</h3>

                      {/* ── Exam & DRNPS ── */}
                      <div>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">Exam &amp; DRNPS</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Exam Score (%) <span className="text-zinc-600 normal-case">target ≥ 90</span></label>
                            <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.examScore} onChange={e => setEditingEng({ ...editingEng, examScore: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Promoters <span className="text-zinc-600 normal-case">count</span></label>
                            <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.promoters} onChange={e => setEditingEng({ ...editingEng, promoters: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Detractors <span className="text-zinc-600 normal-case">count</span></label>
                            <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.detractors} onChange={e => setEditingEng({ ...editingEng, detractors: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      {/* ── KPI Inputs ── */}
                      <div className="border-t border-white/5 pt-8">
                        <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em] mb-6">KPI Metrics</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">REDO Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 0.7 · 30 pts</span></label>
                            <input type="number" step="0.01" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.redoRatio} onChange={e => setEditingEng({ ...editingEng, redoRatio: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">IQC Skip Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 25 · 15 pts</span></label>
                            <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-orange-500 transition-all outline-none" value={editingEng.iqcSkipRatio} onChange={e => setEditingEng({ ...editingEng, iqcSkipRatio: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Maintenance Mode (%) <span className="text-zinc-600 normal-case">target ≥ 65 · 10 pts</span></label>
                            <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-yellow-500 transition-all outline-none" value={editingEng.maintenanceModeRatio} onChange={e => setEditingEng({ ...editingEng, maintenanceModeRatio: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest ml-1">OQC Pass Rate (%) <span className="text-zinc-600 normal-case">target ≥ 85 · 15 pts</span></label>
                            <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-teal-500 transition-all outline-none" value={editingEng.oqcPassRate} onChange={e => setEditingEng({ ...editingEng, oqcPassRate: e.target.value })} />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-green-400 uppercase tracking-widest ml-1">Training Attendance (%) <span className="text-zinc-600 normal-case">target = 100 · 10 pts</span></label>
                            <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-green-500 transition-all outline-none" value={editingEng.trainingAttendance} onChange={e => setEditingEng({ ...editingEng, trainingAttendance: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Core Parts PBA (%) <span className="text-zinc-600 normal-case">target ≤ 30 · 5 pts</span></label>
                            <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.corePartsPBA} onChange={e => setEditingEng({ ...editingEng, corePartsPBA: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Core Parts Octa (%) <span className="text-zinc-600 normal-case">target ≤ 40 · 5 pts</span></label>
                            <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.corePartsOcta} onChange={e => setEditingEng({ ...editingEng, corePartsOcta: e.target.value })} />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Multi Parts Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 1 · 10 pts</span></label>
                            <input type="number" step="0.01" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-orange-500 transition-all outline-none" value={editingEng.multiPartsRatio} onChange={e => setEditingEng({ ...editingEng, multiPartsRatio: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => saveEngineer(editingEng)}
                      disabled={isSaving}
                      className="w-full bg-white text-black py-8 rounded-[2rem] font-black text-[11px] md:text-sm uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group"
                    >
                      {isSaving ? <div className="w-6 h-6 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                      {isSaving ? 'Synchronizing Node...' : 'Commit Protocol Entry'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div> {/* close animated wrapper key={view} */}
      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => { setShowFeedbackModal(true); setFeedbackSent(false); setFeedbackText(''); setFeedbackCode(''); setFeedbackRating(0); }}
        className="fixed bottom-28 right-5 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-2xl shadow-2xl shadow-purple-900/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Send Feedback"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-white/10 rounded-[3rem] w-full max-w-lg p-8 space-y-6 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-6 right-6 p-2 bg-zinc-800 text-white rounded-xl hover:bg-white hover:text-black transition-all">
              <X className="w-4 h-4" />
            </button>
            {feedbackSent ? (
              <div className="flex flex-col items-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Thank You!</h3>
                <p className="text-zinc-400 text-sm">Your feedback has been received.</p>
                <button onClick={() => setShowFeedbackModal(false)} className="px-8 py-3 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-black text-white uppercase tracking-widest">Send Feedback</h2>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Engineer Code</label>
                  <input type="text" value={feedbackCode} onChange={e => setFeedbackCode(e.target.value.toUpperCase())} placeholder="e.g. SAM-2026-001"
                    className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm focus:border-purple-500 transition-all outline-none font-bold text-white shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Rate TCS Overall</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setFeedbackRating(star)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${star <= feedbackRating ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400' : 'bg-zinc-900 border border-white/5 text-zinc-600 hover:text-yellow-400'}`}>
                        <Star className="w-5 h-5" fill={star <= feedbackRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Your Message</label>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4}
                    placeholder="Share your thoughts or suggestions..."
                    className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm focus:border-purple-500 transition-all outline-none font-medium text-white shadow-inner resize-none" />
                </div>
                <button
                  onClick={async () => {
                    if (!feedbackText.trim()) { message.warning('Please write your feedback.'); return; }
                    const trimmedCode = feedbackCode.trim().toUpperCase();
                    if (!trimmedCode) { message.warning('Please enter an engineer code.'); return; }

                    const codeExists = engineers.some(eng => eng.code?.trim().toUpperCase() === trimmedCode);
                    if (!codeExists) {
                      message.error('Unrecognized engineer code. Access denied.');
                      return;
                    }

                    setIsSendingFeedback(true);
                    try {
                      await saveFeedbackToDb({ engineerCode: trimmedCode, message: feedbackText, rating: feedbackRating });
                      setFeedbackSent(true);
                    } catch (e) { console.error(e); message.error('Failed to submit feedback.'); }
                    finally { setIsSendingFeedback(false); }
                  }}
                  disabled={isSendingFeedback}
                  className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-purple-500 transition-all flex items-center justify-center gap-3"
                >
                  {isSendingFeedback ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSendingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Engineer Photo Auth Modal */}
      {showPhotoAuth && selectedEngineer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-white/10 rounded-[3rem] w-full max-w-sm p-8 space-y-6 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => { setShowPhotoAuth(false); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
              className="absolute top-6 right-6 p-2 bg-zinc-800 text-white rounded-xl hover:bg-white hover:text-black transition-all">
              <X className="w-4 h-4" />
            </button>
            {photoAuthStep === 'done' ? (
              <div className="flex flex-col items-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase">Photo Updated!</h3>
                <button onClick={() => { setShowPhotoAuth(false); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                  className="px-8 py-3 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all">Done</button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2 pt-2">
                  <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mx-auto">
                    <Camera className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Update Photo</h3>
                  <p className="text-zinc-500 text-xs">{photoAuthStep === 'upload' ? 'Choose your new profile photo' : 'Confirm your engineer code to continue'}</p>
                </div>
                {photoAuthStep !== 'upload' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Your Engineer Code</label>
                    <input type="text" value={photoAuthCode} onChange={e => setPhotoAuthCode(e.target.value.toUpperCase())}
                      placeholder="Enter your engineer code"
                      className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm focus:border-blue-500 transition-all outline-none font-bold text-white shadow-inner uppercase tracking-widest text-center" />
                  </div>
                )}
                {photoAuthStep === 'upload' ? (
                  <div className="space-y-4">
                    <label className="flex flex-col items-center gap-3 cursor-pointer border-2 border-dashed border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all">
                      <Camera className="w-8 h-8 text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{selfPhotoFile ? selfPhotoFile.name : 'Choose Photo'}</span>
                      <input ref={selfPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setSelfPhotoFile(f); }} />
                    </label>
                    {/* Photo guidelines */}
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-2">Photo Requirements</p>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Wearing official Samsung uniform</p>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Face centered and looking at the camera</p>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> No sunglasses or face coverings</p>
                    </div>
                    <button disabled={!selfPhotoFile || selfPhotoUploading}
                      onClick={async () => {
                        if (!selfPhotoFile) return;
                        setSelfPhotoUploading(true);
                        try {
                          const url = await uploadPhoto(selfPhotoFile, 'engineers', selectedEngineer.code.toUpperCase());
                          if (url) {
                            const updated = { ...selectedEngineer, photoUrl: url };
                            await saveEngineerToDb(updated);
                            setSelectedEngineer(updated);
                            setEngineers(prev => prev.map(e => e.id === updated.id ? updated : e));
                          }
                          setPhotoAuthStep('done');
                        } catch (err) { console.error(err); message.error('Photo upload failed.'); }
                        finally { setSelfPhotoUploading(false); }
                      }}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {selfPhotoUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {selfPhotoUploading ? 'Uploading...' : 'Save Photo'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (photoAuthCode.trim().toUpperCase() === selectedEngineer.code.trim().toUpperCase()) {
                        setPhotoAuthStep('upload');
                      } else {
                        message.error('Engineer code does not match. Access denied.');
                      }
                    }}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >Verify Code</button>
                )}
              </>
            )}
          </div>
        </div>
      )
      }

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[98%] max-w-lg bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-4 px-6 flex justify-around items-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50">
        {/* Dashboard */}
        <button onClick={() => setView('HOME')} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 ${view === 'HOME' ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <BarChart3 className={`w-5 h-5 ${view === 'HOME' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tight">Dashboard</span>
        </button>
        {/* Search — center, elevated */}
        <button onClick={() => setView('ENGINEER_LOOKUP')} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 relative ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <div className={`-mt-6 w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-xl transition-all duration-200 ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'bg-blue-600 shadow-blue-500/40 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Search className="w-6 h-6" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight mt-0.5">Search</span>
        </button>
        {/* Secure */}
        <button onClick={() => setView(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 ${['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'PROFILE_MGMT'].includes(view) ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <ShieldCheck className={`w-5 h-5 ${['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'PROFILE_MGMT'].includes(view) ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tight">Secure</span>
        </button>
      </nav>

    </div >
  );
};
const Page = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 16,
        },
      }}
    >
      <App>
        <PageContent />
      </App>
    </ConfigProvider>
  );
};

export default Page;
