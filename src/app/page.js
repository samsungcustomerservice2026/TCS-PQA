"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { App, ConfigProvider, theme, message as antdMessage, Modal } from 'antd';
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
  Cpu,
  Monitor,
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
  RefreshCw,
  Building2,
  Shield
} from 'lucide-react';

import { INITIAL_ENGINEERS, calculateDRNPS, getTier, getTierColor, calculatePQAScore } from '../constants';
import * as XLSX from 'xlsx';
import { getEngineers, getHiddenEngineers, saveEngineer as saveEngineerToDb, archiveEngineer, deleteEngineerPermanent, getAdmins, saveAdmin as saveAdminToDb, deleteAdmin as deleteAdminFromDb, saveFeedback as saveFeedbackToDb } from '../services/firestoreService';
import { normalizePqaPartnerKey, mapPqaSheetPartnerKeyToOfficial, PQA_OFFICIAL_MX_PARTNERS } from '../lib/pqaPartnerMap.js';

import { uploadPhoto, uploadTcsAllProductImagesFromPublic } from '../services/storageService';
import { recordVisit, recordVisitorModeSegment, recordAdminLogin, recordSessionEnd, getAnalyticsSummary } from '../services/analyticsService';
import { writeLog, fetchLogs } from '../services/auditLogService';

/**
 * When Firestore has no admin users, a single bootstrap account can be enabled via env (never commit real passwords).
 * Set NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64 to the same value you use for login checks (e.g. output of btoa('YourSecret')).
 */
function getBootstrapAdmin() {
  const passwordB64 = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64;
  if (!passwordB64 || typeof passwordB64 !== 'string' || passwordB64.length < 2) return null;
  return {
    id: 'bootstrap-1',
    username: process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_USERNAME || 'admin',
    passwordB64,
    name: process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_NAME || 'Super Admin',
    role: 'SUPER_ADMIN',
    access: 'ALL',
    createdAt: new Date().toISOString(),
  };
}

// ─── Helper: Month name → quarter ────────────────────────────────────────────
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Year as stored in Excel/Firestore → 4-digit string for quarter keys (fixes Q1-undefined dropped by regex) */
const normalizeYearKey = (y) => {
  if (y === undefined || y === null || y === '') return null;
  const s = String(y).trim().replace(/,/g, '');
  if (/^\d{4}$/.test(s)) return s;
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1950 && n <= 2100) return String(n);
  if (/^\d{2}$/.test(s)) {
    const v = parseInt(s, 10);
    return (v >= 0 && v <= 99 ? (v < 50 ? `20${s.padStart(2, '0')}` : `19${s}`) : null);
  }
  return null;
};

/** Excel whole-day serial (~20000–60000) → calendar month/year */
const excelSerialToMonthYear = (raw) => {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(num) || num < 20000 || num > 60000) return null;
  const ms = (num - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return { month: MONTH_ORDER[d.getUTCMonth()], year: String(d.getUTCFullYear()) };
};

const getQuarter = (monthName) => {
  if (monthName === undefined || monthName === null || monthName === '') return null;
  if (typeof monthName === 'number' && monthName >= 1 && monthName <= 12) {
    return `Q${Math.floor((monthName - 1) / 3) + 1}`;
  }
  const mnTrim = String(monthName).trim();
  const asNum = parseInt(mnTrim, 10);
  if (/^\d{1,2}$/.test(mnTrim) && asNum >= 1 && asNum <= 12) {
    return `Q${Math.floor((asNum - 1) / 3) + 1}`;
  }
  const mn = mnTrim.toLowerCase();
  const idx = MONTH_ORDER.findIndex(m =>
    m.toLowerCase() === mn || (mn.length >= 3 && m.toLowerCase().startsWith(mn.slice(0, 3)))
  );
  if (idx < 0) return null;
  return `Q${Math.floor(idx / 3) + 1}`;
};
const getMonthIndex = (monthName) => {
  if (monthName === undefined || monthName === null || monthName === '') return 0;
  if (typeof monthName === 'number' && monthName >= 1 && monthName <= 12) return monthName - 1;
  const mnTrim = String(monthName).trim();
  const asNum = parseInt(mnTrim, 10);
  if (/^\d{1,2}$/.test(mnTrim) && asNum >= 1 && asNum <= 12) return asNum - 1;
  const mn = mnTrim.toLowerCase();
  const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === mn || (mn.length >= 3 && m.toLowerCase().startsWith(mn.slice(0, 3))));
  return idx < 0 ? 0 : idx;
};

/** Split "March-2025" or "SKY - Port Said-2025" (month may contain hyphens) */
const parseMonthYearKey = (key) => {
  if (!key || typeof key !== 'string') return { month: '', year: '' };
  const lastDash = key.lastIndexOf('-');
  if (lastDash <= 0) return { month: '', year: '' };
  return { month: key.slice(0, lastDash).trim(), year: key.slice(lastDash + 1).trim() };
};

/** Firestore may store year as number or string — always compare coerced */
const sameCalendarYear = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

/** Firestore collection for app mode (TCS split by division: MX uses legacy `engineers`) */
const resolveFirestoreCollection = (mode) => {
  if (!mode) return 'engineers';
  if (mode === 'PQA_MX') return 'pqa_mx_centers';
  if (mode === 'PQA_CE') return 'pqa_ce_centers';
  if (mode === 'TCS_DA') return 'tcs_da_engineers';
  if (mode === 'TCS_AV' || mode === 'TCS_VD') return 'tcs_vd_engineers';
  return 'engineers';
};

/** Default maxima for PQA KPI bars (override per sheet via header “SSR (20)”). MX vs CE can diverge here. */
const PQA_KPI_DEFAULTS_MX = {
  ltp: 10, exLtp: 10, redo: 10, ssr: 20, dRnps: 10, ofs: 10, rCxe: 10, sdr: 10, audit: 5, pr: 5, coa: 50,
};
const PQA_KPI_DEFAULTS_CE = {
  ltp: 10, exLtp: 10, redo: 10, ssr: 20, dRnps: 10, ofs: 10, rCxe: 10, sdr: 10, audit: 5, pr: 5, coa: 50,
};

/** Normalize any month label to full MONTH_ORDER name so Firestore keys stay consistent. */
function canonicalPqaMonthName(raw) {
  if (!raw) return MONTH_ORDER[0];
  const s = String(raw).trim();
  const idx = MONTH_ORDER.findIndex(
    (m) =>
      m.toLowerCase() === s.toLowerCase() ||
      (s.length >= 3 && m.toLowerCase().startsWith(s.toLowerCase().slice(0, 3)))
  );
  return idx >= 0 ? MONTH_ORDER[idx] : MONTH_ORDER[0];
}

/** Must match Partner Ranking / Monthly Average map keys: `CODE` + `_jan_` + `2026` (3-letter month, lower). */
function pqaPartnerMapMonthToken(monthLabel) {
  return canonicalPqaMonthName(monthLabel).slice(0, 3).toLowerCase();
}

/** Display month like Partner sheet: Jan, Feb, Mar… */
function pqaShortMonthDisplayName(monthLabel) {
  const full = canonicalPqaMonthName(monthLabel);
  return full.charAt(0).toUpperCase() + full.slice(1, 3).toLowerCase();
}

/**
 * Parse numeric Excel cells (European decimals, thousands, typed numbers).
 * Used by ★Evaluation point and ★Partner Ranking (accumulated D/E).
 */
function parseExcelNumericCell(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  let s = String(v ?? '').trim();
  if (!s) return 0;
  if (s.startsWith('=')) s = s.replace(/^=/, '').trim();
  s = s.replace(/[^0-9,.-]/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && !hasDot) {
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma && hasDot) {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** PQA display score (0–100): KPI-derived, Excel cap, partner/monthly fallbacks — shared by registry + dossier. */
function resolvePqaTcsScorePure(e) {
  if (!e) return 0;
  const k = calculatePQAScore({
    ltp: e.ltp || 0,
    exLtp: e.exLtp || 0,
    redo: e.redo || 0,
    ssr: e.ssr || 0,
    dRnps: e.dRnps || 0,
    ofs: e.ofs || 0,
    rCxe: e.rCxe || 0,
    sdr: e.sdr || 0,
    audit: e.audit || 0,
    pr: e.pr || 0,
  });
  const raw = parseFloat(e.tcsScore);
  if (Number.isFinite(raw) && raw > 0 && raw <= 100) return Number(raw.toFixed(1));
  if (Number.isFinite(raw) && raw > 100) return k;
  if (k > 0) return k;
  const fallback = parseFloat(e.partnerScore ?? e.monthlyScore ?? e.centerMonthlyScore ?? '');
  if (Number.isFinite(fallback) && fallback > 0 && fallback <= 100) return Number(fallback.toFixed(1));
  return k;
}

/** Merge Evaluation-point fields from all Firestore rows for the same service center (same upload/division). */
function mergePqaKpiFromRecordsPure(primary, sameCodeRecords) {
  const keys = ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'coa', 'switching', 'tc', 'sdr', 'audit', 'pr', 'owRnps'];
  const kpiMagSum = (e) => keys.reduce((s, x) => s + Math.abs(parseFloat(e[x] || 0)), 0);
  const siblings = sameCodeRecords.filter((r) => !primary.id || !r.id || String(primary.id) !== String(r.id));
  const pool = [primary, ...siblings].sort((a, b) => kpiMagSum(b) - kpiMagSum(a));
  const out = { ...primary };
  for (const x of keys) {
    const cur = parseFloat(out[x] || 0);
    if (cur !== 0) continue;
    for (const r of pool) {
      const nv = parseFloat(r[x] || 0);
      if (nv !== 0) {
        out[x] = r[x];
        break;
      }
    }
  }
  if (!out.pqaKpiCaps) {
    for (const r of pool) {
      if (r.pqaKpiCaps) {
        out.pqaKpiCaps = r.pqaKpiCaps;
        break;
      }
    }
  }
  if (!(parseFloat(out.evalMonthlyScore) > 0)) {
    const src = pool.find((r) => parseFloat(r.evalMonthlyScore) > 0);
    if (src) out.evalMonthlyScore = src.evalMonthlyScore;
  }
  if (!(parseInt(String(out.monthlyEvalRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.monthlyEvalRank ?? 0), 10) > 0);
    if (src) out.monthlyEvalRank = src.monthlyEvalRank;
  }
  if (!(parseInt(String(out.monthlyRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.monthlyRank ?? 0), 10) > 0);
    if (src) out.monthlyRank = src.monthlyRank;
  }
  if (!(parseInt(String(out.ytdRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.ytdRank ?? 0), 10) > 0 || parseInt(String(r.centerYtdRank ?? 0), 10) > 0);
    if (src) {
      out.ytdRank = src.ytdRank || out.ytdRank;
      out.centerYtdRank = src.centerYtdRank || out.centerYtdRank;
    }
  }
  // Preserve partner identity from any sibling month row (needed for partner accumulated dashboard grouping).
  const outPartnerNorm = normalizePqaPartnerKey(out.partnerName || '');
  const outPartnerMapped = mapPqaSheetPartnerKeyToOfficial(outPartnerNorm);
  if (!outPartnerMapped) {
    const src = pool.find((r) => mapPqaSheetPartnerKeyToOfficial(r.partnerName || ''));
    if (src?.partnerName) out.partnerName = src.partnerName;
  }
  const yn = (v) => parseFloat(v ?? 0) || 0;
  let bestScore = Math.max(yn(out.ytdScore), yn(out.accumulatedScore), yn(out.centerYtdScore));
  let bestRec = null;
  for (const r of pool) {
    const s = Math.max(yn(r.ytdScore), yn(r.accumulatedScore), yn(r.centerYtdScore));
    if (s > bestScore) {
      bestScore = s;
      bestRec = r;
    }
  }
  if (bestRec && bestScore > 0) {
    if (yn(bestRec.accumulatedScore) > 0) out.accumulatedScore = bestRec.accumulatedScore;
    if (parseInt(String(bestRec.accumulatedRank ?? 0), 10) > 0) out.accumulatedRank = bestRec.accumulatedRank;
    if (yn(bestRec.ytdScore) > 0) out.ytdScore = bestRec.ytdScore;
    else if (yn(bestRec.accumulatedScore) > 0) out.ytdScore = bestRec.accumulatedScore;
    if (parseInt(String(bestRec.ytdRank ?? 0), 10) > 0) out.ytdRank = bestRec.ytdRank;
    if (yn(bestRec.centerYtdScore) > 0) out.centerYtdScore = bestRec.centerYtdScore;
    if (parseInt(String(bestRec.centerYtdRank ?? 0), 10) > 0) out.centerYtdRank = bestRec.centerYtdRank;
  }
  out.tcsScore = resolvePqaTcsScorePure(out);
  return out;
}

/**
 * Parse ★Evaluation point / Evaluation point sheet (PQA MX & CE).
 * — Column B (typical): ASC Code; row pairs: month bands (Jan-20…) + KPI sub-row (LTP, SSR…).
 * — Emits map keys `CODE_monthlower_YEAR` compatible with existing merge.
 */
function parsePqaEvaluationPointRows(evalRows, appMode) {
  const partnerPatches = {};
  const ytdPatches = {};
  const baseCaps = appMode === 'PQA_CE' ? { ...PQA_KPI_DEFAULTS_CE } : { ...PQA_KPI_DEFAULTS_MX };

  const normHeader = (x) => String(x ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const capFromCell = (cell) => {
    const m = String(cell ?? '').match(/\((-?\d+)\)/);
    return m ? Math.abs(parseInt(m[1], 10)) : null;
  };
  /** Headers often include point caps, e.g. "SSR (20.0)" → norm "ssr200" — match by prefix / substring. */
  const kpiKeyFromCell = (cell) => {
    const raw = String(cell ?? '').trim();
    const v = normHeader(raw);
    if (!v) return null;
    if (v.includes('total') && v.includes('point')) return null;
    if (v === 'rank' || v === 'ranking' || v === 'rank' || v.endsWith('rank')) return null;
    if (v.includes('partner') && (v.includes('score') || v.includes('rank'))) return null;
    if (appMode === 'PQA_CE') {
      if (v.includes('ltp') && v.includes('vd')) return 'ltpVd';
      if (v.includes('ltp') && v.includes('da')) return 'ltpDa';
      if (v.includes('redo') && v.includes('vd')) return 'redoVd';
      if (v.includes('redo') && v.includes('da')) return 'redoDa';
      if (v.includes('appoint')) return 'appointments';
      if (v.includes('nps') && (v.includes('dr') || v.includes('dn'))) return 'npsDr';
      if (v === 'nps' || (v.includes('nps') && !v.includes('dr') && !v.includes('dn'))) return 'nps';
    }
    if (v.startsWith('ex') && v.includes('ltp')) return 'exLtp';
    if (v.startsWith('ltp')) return 'ltp';
    if (v.startsWith('redo')) return 'redo';
    if (v.startsWith('ssr') || v.includes('ssr')) return 'ssr';
    if (v.includes('drnps')) return 'dRnps';
    if (appMode === 'PQA_CE' && v.includes('nps')) return 'dRnps';
    if (v.includes('ow') && v.includes('rnps')) return 'owRnps';
    if (v.startsWith('ofs')) return 'ofs';
    if (v.includes('cxe') || v.startsWith('rcxe')) return 'rCxe';
    if (v.includes('coa')) return 'coa';
    if (v.includes('switch')) return 'switching';
    if (v === 'tc' || v.startsWith('tc')) return 'tc';
    if (v.startsWith('sdr')) return 'sdr';
    if (v.startsWith('audit')) return 'audit';
    if (v === 'pr' || (v.startsWith('pr') && v.length <= 6 && !v.includes('partner'))) return 'pr';
    return null;
  };

  const monthHdr =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s._'\/]*((?:20)?\d{2,4})?/i;
  const monthNumericHdr = /^'?\s*((?:20)?\d{2,4})[.\-/](\d{1,2})\s*$/i; // e.g. '26.03, 2026-03

  let codeRowIdx = -1;
  let codeCol = -1;
  for (let i = 0; i < Math.min(evalRows.length, 120); i++) {
    const r = evalRows[i] || [];
    for (let j = 0; j < r.length; j++) {
      if (String(r[j] ?? '').trim().toUpperCase() === 'ASC CODE') {
        codeRowIdx = i;
        codeCol = j;
        break;
      }
    }
    if (codeRowIdx !== -1) break;
  }
  if (codeRowIdx === -1) {
    for (let i = 0; i < Math.min(evalRows.length, 120); i++) {
      const r = evalRows[i] || [];
      for (let j = 0; j < r.length; j++) {
        const nv = normHeader(r[j]);
        if (nv === 'asccode' || (nv.includes('code') && (nv.includes('asc') || nv.includes('center')))) {
          codeRowIdx = i;
          codeCol = j;
          break;
        }
      }
      if (codeRowIdx !== -1) break;
    }
  }
  if (codeRowIdx === -1 || codeCol < 0) return { partnerPatches, ytdPatches };

  const hdr = evalRows[codeRowIdx] || [];
  let regionCol = -1;
  let nameCol = -1;
  let partnerCol = -1;
  let ytdScoreCol = -1;
  let ytdRankCol = -1;
  for (let j = 0; j < hdr.length; j++) {
    const nv = normHeader(hdr[j]);
    const low = String(hdr[j] ?? '').toLowerCase();
    if (j === codeCol) continue;
    if (low.includes('region')) regionCol = j;
    if (nv === 'ascname' || (nv.includes('name') && (nv.includes('asc') || nv.includes('center')))) nameCol = j;
    if (nv.includes('partner') && !nv.includes('rank')) partnerCol = j;
    const accLike = (low.includes('acc') || low.includes('accum')) && (low.includes('ave') || low.includes('avg') || low.includes('average'));
    if (accLike && low.includes('score')) ytdScoreCol = j;
    if (accLike && (low.includes('rank') || nv.includes('ranking'))) ytdRankCol = j;
  }
  if (nameCol < 0) nameCol = codeCol + 1;
  // Samsung template: "Score (100)" under Acc Average may omit "Acc" in the same cell (row 7).
  if (ytdScoreCol < 0) {
    for (let j = 0; j < hdr.length; j++) {
      const low = String(hdr[j] ?? '').toLowerCase();
      if (j === codeCol) continue;
      if (low.includes('score') && (low.includes('100') || /\bacc\b/i.test(String(hdr[j] ?? '')))) {
        ytdScoreCol = j;
        break;
      }
    }
  }
  // In MX template, accumulated rank is usually the next column after accumulated score (e.g. column E).
  if (ytdRankCol < 0 && ytdScoreCol > -1) {
    const cand = ytdScoreCol + 1;
    if (cand < hdr.length) ytdRankCol = cand;
  }

  /** KPI labels are often on the SAME row as "ASC Code" (row 7); previously we only scanned below and missed them. */
  let kpiRowIdx = codeRowIdx;
  let bestKpiScore = -1;
  for (let di = 0; di <= 8; di++) {
    const row = evalRows[codeRowIdx + di] || [];
    let score = 0;
    for (let c = 0; c < row.length; c++) {
      const k = kpiKeyFromCell(row[c]);
      if (k && k !== 'pr') score += 1;
    }
    if (score > bestKpiScore) {
      bestKpiScore = score;
      kpiRowIdx = codeRowIdx + di;
    }
  }
  if (bestKpiScore <= 0) kpiRowIdx = codeRowIdx;
  const kpiRow = evalRows[kpiRowIdx] || [];

  const monthBlocks = [];
  for (let r = 0; r <= codeRowIdx; r++) {
    const row = evalRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const raw = String(row[c] ?? '').trim();
      const m = raw.match(monthHdr);
      if (m) {
        const mon = canonicalPqaMonthName(m[1]);
        let yr = '2026';
        if (m[2]) {
          const d = String(m[2]).replace(/\D/g, '');
          if (d.length === 2) yr = `20${d}`;
          else if (d.length >= 4) yr = d.slice(0, 4);
        }
        monthBlocks.push({ startCol: c, month: mon, year: yr, label: raw });
        continue;
      }
      const mn = raw.match(monthNumericHdr);
      if (mn) {
        let yy = String(mn[1]).replace(/\D/g, '');
        const mm = parseInt(String(mn[2]).replace(/\D/g, ''), 10);
        if (!Number.isFinite(mm) || mm < 1 || mm > 12) continue;
        if (yy.length === 2) yy = `20${yy}`;
        if (yy.length > 4) yy = yy.slice(0, 4);
        const mon = MONTH_ORDER[mm - 1];
        monthBlocks.push({ startCol: c, month: mon, year: yy || '2026', label: raw });
      }
    }
  }
  monthBlocks.sort((a, b) => a.startCol - b.startCol);

  const inferBlocksFromLtp = () => {
    const out = [];
    let mi = 0;
    for (let c = 0; c < kpiRow.length; c++) {
      if (kpiKeyFromCell(kpiRow[c]) === 'ltp') {
        out.push({
          startCol: c,
          month: canonicalPqaMonthName(MONTH_ORDER[mi % 12]),
          year: '2026',
          label: 'inferred-ltp',
        });
        mi += 1;
      }
    }
    return out;
  };

  let blocks = monthBlocks;
  if (blocks.length === 0) {
    const inf = inferBlocksFromLtp();
    if (inf.length > 0) blocks = inf;
  }
  if (blocks.length === 0) {
    let fallbackMonth = MONTH_ORDER[0];
    let fallbackYear = '2026';
    for (let r = 0; r <= Math.min(codeRowIdx + 1, 12); r++) {
      const row = evalRows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const raw = String(row[c] ?? '').trim();
        const m = raw.match(monthHdr);
        if (m) {
          fallbackMonth = canonicalPqaMonthName(m[1]);
          if (m[2]) {
            const d = String(m[2]).replace(/\D/g, '');
            if (d.length === 2) fallbackYear = `20${d}`;
            else if (d.length >= 4) fallbackYear = d.slice(0, 4);
          }
          break;
        }
      }
    }
    let startK = -1;
    for (let c = codeCol + 1; c < kpiRow.length; c++) {
      if (kpiKeyFromCell(kpiRow[c])) {
        startK = c;
        break;
      }
    }
    if (startK < 0) startK = codeCol + 3;
    blocks = [{ startCol: startK, month: fallbackMonth, year: fallbackYear, label: 'fallback' }];
  }

  /** "Total" band under each month (before LTP…): Σ(point)(100) = official MX PQA monthly total score. */
  const isMonthTotalPointCol = (cell) => {
    const raw = String(cell ?? '').trim();
    if (!raw || kpiKeyFromCell(cell)) return false;
    const low = raw.toLowerCase();
    const nv = normHeader(raw);
    if (nv.includes('point') && (nv.includes('100') || raw.includes('Σ') || raw.includes('σ'))) return true;
    if ((low.includes('σ') || low.includes('∑') || low.includes('sigma')) && low.includes('point')) return true;
    if (nv === 'point100' || /^point\(/.test(low)) return true;
    return false;
  };

  const colMaps = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const endCol = bi + 1 < blocks.length ? blocks[bi + 1].startCol - 1 : Math.max(kpiRow.length, hdr.length) + 5;
    const caps = { ...baseCaps };
    const colToKey = {};
    for (let c = Math.max(0, b.startCol); c <= endCol && c < kpiRow.length; c++) {
      const key = kpiKeyFromCell(kpiRow[c]);
      if (!key) continue;
      const cap = capFromCell(kpiRow[c]);
      if (cap != null && key in caps) caps[key] = cap;
      colToKey[c] = key;
    }
    const kpiCols = Object.keys(colToKey).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n));
    const firstKpiCol = kpiCols.length ? Math.min(...kpiCols) : b.startCol + 24;
    let evalMonthlyScoreCol = -1;
    let monthlyTotalRankCol = -1;
    for (let c = b.startCol; c < firstKpiCol && c <= endCol && c < kpiRow.length; c++) {
      const cell = kpiRow[c];
      if (isMonthTotalPointCol(cell)) evalMonthlyScoreCol = c;
      else {
        const low = String(cell ?? '').toLowerCase();
        const nv = normHeader(cell);
        if ((low.includes('rank') || nv === 'rank') && !kpiKeyFromCell(cell)) monthlyTotalRankCol = c;
      }
    }
    // In some sheets (incl. MX PQA), inferred month block starts at LTP while Total(Σpoint)/(Rank) sit a few columns to the left.
    // Look back up to 8 columns from first KPI to capture Score/Rank reliably (e.g. F/S/AF).
    if (firstKpiCol > 0) {
      const backStart = Math.max(0, firstKpiCol - 8);
      let nearestScoreCol = -1;
      let nearestRankCol = -1;
      // Scan right-to-left so we pick the score/rank closest to this month's KPI block (not accumulated score further left).
      for (let c = Math.min(firstKpiCol - 1, kpiRow.length - 1); c >= backStart; c--) {
        const low = String(kpiRow[c] ?? '').toLowerCase();
        const nv = normHeader(kpiRow[c]);
        if (nearestScoreCol < 0 && (isMonthTotalPointCol(kpiRow[c]) || nv === 'score' || low.includes('point'))) {
          nearestScoreCol = c;
        }
        if (nearestRankCol < 0 && (nv === 'rank' || low.includes('rank'))) {
          nearestRankCol = c;
        }
      }
      if (nearestScoreCol >= 0) evalMonthlyScoreCol = nearestScoreCol;
      if (nearestRankCol >= 0) monthlyTotalRankCol = nearestRankCol;
    }
    if (evalMonthlyScoreCol < 0 && firstKpiCol > b.startCol) {
      // Fallback: assume monthly total sits two columns before first KPI (Total score + rank + then LTP).
      evalMonthlyScoreCol = Math.max(0, firstKpiCol - 2);
      if (monthlyTotalRankCol < 0) monthlyTotalRankCol = Math.max(0, firstKpiCol - 1);
    }
    if (appMode === 'PQA_CE') {
      // CE templates keep monthly total/rank immediately before KPI sequence.
      if (evalMonthlyScoreCol < 0) evalMonthlyScoreCol = Math.max(0, firstKpiCol - 2);
      if (monthlyTotalRankCol < 0) monthlyTotalRankCol = Math.max(0, firstKpiCol - 1);
      // CE fallback: month title can be merged/shifted; locate nearest LTP VD header around this band.
      const ceOrder = ['ltpVd', 'ltpDa', 'exLtp', 'redoDa', 'redoVd', 'ssr', 'nps', 'npsDr', 'ofs', 'appointments', 'rCxe', 'audit'];
      const winStart = Math.max(0, b.startCol - 12);
      const winEnd = Math.min(kpiRow.length - 1, endCol + 12);
      let ceLtpVdCol = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let c = winStart; c <= winEnd; c++) {
        if (kpiKeyFromCell(kpiRow[c]) === 'ltpVd') {
          const d = Math.abs(c - b.startCol);
          if (d < bestDist) {
            bestDist = d;
            ceLtpVdCol = c;
          }
        }
      }
      const ceStart = ceLtpVdCol > -1 ? ceLtpVdCol : (evalMonthlyScoreCol + 2);
      if (ceLtpVdCol > -1) {
        evalMonthlyScoreCol = Math.max(0, ceLtpVdCol - 2);
        monthlyTotalRankCol = Math.max(0, ceLtpVdCol - 1);
      }
      ceOrder.forEach((k, idx) => {
        const col = ceStart + idx;
        if (col <= endCol && col < kpiRow.length) colToKey[col] = k;
      });
    }
    colMaps.push({ ...b, endCol, colToKey, caps, evalMonthlyScoreCol, monthlyTotalRankCol });
  }

  const sub1 = evalRows[codeRowIdx + 1] || [];
  if (sub1.length && ytdScoreCol < 0) {
    for (let j = 0; j < Math.min(sub1.length, 12); j++) {
      const sv = String(sub1[j] ?? '').toLowerCase().trim();
      if (sv === 'score' || sv.includes('point')) ytdScoreCol = j;
      if (sv === '(rank)' || sv === 'rank') ytdRankCol = j;
    }
  }
  if (ytdRankCol < 0 && ytdScoreCol > -1) {
    const cand = ytdScoreCol + 1;
    if (cand < Math.max(hdr.length, sub1.length)) ytdRankCol = cand;
  }

  /** Data starts after KPI header row; merged ASC Code cells repeat visually as blank — carry forward. */
  const dataStart = kpiRowIdx + 1;
  let lastAscCode = '';
  let lastAscName = '';

  for (let i = dataStart; i < evalRows.length; i++) {
    const rw = evalRows[i] || [];
    const rawCode = rw[codeCol];
    const rawStr = rawCode === undefined || rawCode === null ? '' : String(rawCode).trim();
    let pCode;
    if (!rawStr) {
      if (!lastAscCode) continue;
      pCode = lastAscCode;
    } else {
      const up = rawStr.toUpperCase();
      if (up === 'ASC CODE' || up === 'TOTAL') continue;
      pCode = (typeof rawCode === 'number' && Number.isFinite(rawCode)
        ? String(Math.round(rawCode))
        : String(rawCode)
      ).replace(/[\s,]/g, '').trim().toUpperCase();
      if (!pCode) continue;
      lastAscCode = pCode;
    }

    const region = regionCol > -1 ? String(rw[regionCol] ?? '').trim() : '';
    let pName;
    if (nameCol > -1) {
      const rawNm = rw[nameCol];
      const ns = rawNm === undefined || rawNm === null ? '' : String(rawNm).trim();
      if (ns) {
        pName = ns;
        lastAscName = ns;
      } else {
        pName = lastAscName || pCode;
      }
    } else {
      pName = lastAscName || String(pCode);
    }
    const partnerN = partnerCol > -1 ? String(rw[partnerCol] ?? '').trim() : '';

    if (ytdScoreCol > -1) {
      const ys = parseExcelNumericCell(rw[ytdScoreCol]);
      const yr = ytdRankCol > -1 ? parseInt(String(rw[ytdRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0 : 0;
      if (ys > 0 || yr > 0) {
        ytdPatches[pCode] = { ...(ytdPatches[pCode] || {}), ytdScore: ys, ytdRank: yr };
      }
    }

    // CE fixed extraction path (★Evaluation point): Jan F..T, Feb W..AK, Mar AM..BB.
    // This bypasses dynamic month-block detection that can drift with merged headers.
    if (appMode === 'PQA_CE') {
      const ceMonths = [
        { month: 'January', scoreCol: 5, rankCol: 6, kpiStart: 7 },   // F,G,H...
        { month: 'February', scoreCol: 22, rankCol: 23, kpiStart: 24 }, // W,X,Y...
        { month: 'March', scoreCol: 38, rankCol: 39, kpiStart: 40 },   // AM,AN,AO...
      ];
      for (const cm of ceMonths) {
        const hdrAt = (idx) => String(kpiRow[idx] ?? '').toLowerCase().replace(/\s/g, '');
        const hasL3 = hdrAt(cm.kpiStart + 9).includes('l3');
        const ltpVd = parseExcelNumericCell(rw[cm.kpiStart + 0]);
        const ltpDa = parseExcelNumericCell(rw[cm.kpiStart + 1]);
        const exLtp = parseExcelNumericCell(rw[cm.kpiStart + 2]);
        const redoDa = parseExcelNumericCell(rw[cm.kpiStart + 3]);
        const redoVd = parseExcelNumericCell(rw[cm.kpiStart + 4]);
        const ssr = parseExcelNumericCell(rw[cm.kpiStart + 5]);
        const nps = parseExcelNumericCell(rw[cm.kpiStart + 6]);
        const npsDr = parseExcelNumericCell(rw[cm.kpiStart + 7]);
        const ofs = parseExcelNumericCell(rw[cm.kpiStart + 8]);
        const appointments = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 10 : 9)]);
        const rCxe = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 11 : 10)]);
        const audit = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 12 : 11)]);
        const evalMonthlyScore = parseExcelNumericCell(rw[cm.scoreCol]);
        const monthlyEvalRank = parseInt(String(rw[cm.rankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
        const hasKpi =
          ltpVd || ltpDa || exLtp || redoDa || redoVd || ssr || nps || npsDr || ofs || appointments || rCxe || audit;
        if (!(hasKpi || evalMonthlyScore > 0 || monthlyEvalRank > 0)) continue;
        const mKey = `${pCode}_${pqaPartnerMapMonthToken(cm.month)}_2026`;
        const payload = {
          code: pCode,
          name: pName,
          partnerName: partnerN,
          region,
          mName: pqaShortMonthDisplayName(cm.month),
          year: '2026',
          pqaKpiCaps: { ...baseCaps },
          ltpVd,
          ltpDa,
          ltp: ltpVd + ltpDa,
          exLtp,
          redoDa,
          redoVd,
          redo: redoDa + redoVd,
          ssr,
          nps,
          npsDr,
          dRnps: nps + npsDr,
          ofs,
          appointments,
          rCxe,
          audit,
          evalMonthlyScore,
          monthlyEvalRank,
        };
        partnerPatches[mKey] = { ...(partnerPatches[mKey] || {}), ...payload };
      }
      continue;
    }

    for (const bm of colMaps) {
      const mKey = `${pCode}_${pqaPartnerMapMonthToken(bm.month)}_${bm.year}`;
      const payload = {
        code: pCode,
        name: pName,
        partnerName: partnerN,
        region,
        mName: pqaShortMonthDisplayName(bm.month),
        year: bm.year,
        pqaKpiCaps: bm.caps,
      };
      for (const [colStr, kpi] of Object.entries(bm.colToKey)) {
        const c = parseInt(colStr, 10);
        const val = parseExcelNumericCell(rw[c]);
        if (kpi === 'ltp') payload.ltp = val;
        else if (kpi === 'ltpVd') {
          payload.ltpVd = val;
          payload.ltp = parseFloat(payload.ltp || 0) + val;
        }
        else if (kpi === 'ltpDa') {
          payload.ltpDa = val;
          payload.ltp = parseFloat(payload.ltp || 0) + val;
        }
        else if (kpi === 'exLtp') payload.exLtp = val;
        else if (kpi === 'redo') payload.redo = val;
        else if (kpi === 'redoVd') {
          payload.redoVd = val;
          payload.redo = parseFloat(payload.redo || 0) + val;
        }
        else if (kpi === 'redoDa') {
          payload.redoDa = val;
          payload.redo = parseFloat(payload.redo || 0) + val;
        }
        else if (kpi === 'ssr') payload.ssr = val;
        else if (kpi === 'dRnps') payload.dRnps = val;
        else if (kpi === 'nps') {
          payload.nps = val;
          payload.dRnps = parseFloat(payload.dRnps || 0) + val;
        }
        else if (kpi === 'npsDr') {
          payload.npsDr = val;
          payload.dRnps = parseFloat(payload.dRnps || 0) + val;
        }
        else if (kpi === 'owRnps') payload.owRnps = val;
        else if (kpi === 'ofs') payload.ofs = val;
        else if (kpi === 'rCxe') payload.rCxe = val;
        else if (kpi === 'appointments') payload.appointments = val;
        else if (kpi === 'coa') payload.coa = val;
        else if (kpi === 'switching') payload.switching = val;
        else if (kpi === 'tc') payload.tc = val;
        else if (kpi === 'sdr') payload.sdr = val;
        else if (kpi === 'audit') payload.audit = val;
        else if (kpi === 'pr') payload.pr = val;
      }
      if (appMode === 'PQA_CE' && bm.evalMonthlyScoreCol > -1) {
        // CE fixed monthly layout by month block in ★Evaluation point:
        // Jan: F..T, Feb: W..AK, Mar: AM..BB (score/rank then KPIs).
        const ceFixedByMonth = {
          jan: { scoreCol: 5, rankCol: 6, kpiStart: 7 },
          feb: { scoreCol: 22, rankCol: 23, kpiStart: 24 },
          mar: { scoreCol: 38, rankCol: 39, kpiStart: 40 },
        };
        const mm = ceFixedByMonth[pqaPartnerMapMonthToken(bm.month)];
        const scoreCol = mm ? mm.scoreCol : bm.evalMonthlyScoreCol;
        const rankCol = mm ? mm.rankCol : bm.monthlyTotalRankCol;
        const ceStart = mm ? mm.kpiStart : (bm.evalMonthlyScoreCol + 2);
        const hdrAt = (idx) => String(kpiRow[idx] ?? '').toLowerCase().replace(/\s/g, '');
        const hasL3 = hdrAt(ceStart + 9).includes('l3');
        const ltpVd = parseExcelNumericCell(rw[ceStart + 0]);
        const ltpDa = parseExcelNumericCell(rw[ceStart + 1]);
        const exLtp = parseExcelNumericCell(rw[ceStart + 2]);
        const redoDa = parseExcelNumericCell(rw[ceStart + 3]);
        const redoVd = parseExcelNumericCell(rw[ceStart + 4]);
        const ssr = parseExcelNumericCell(rw[ceStart + 5]);
        const nps = parseExcelNumericCell(rw[ceStart + 6]);
        const npsDr = parseExcelNumericCell(rw[ceStart + 7]);
        const ofs = parseExcelNumericCell(rw[ceStart + 8]);
        const appointments = parseExcelNumericCell(rw[ceStart + (hasL3 ? 10 : 9)]);
        const rCxe = parseExcelNumericCell(rw[ceStart + (hasL3 ? 11 : 10)]);
        const audit = parseExcelNumericCell(rw[ceStart + (hasL3 ? 12 : 11)]);
        payload.ltpVd = ltpVd;
        payload.ltpDa = ltpDa;
        payload.ltp = ltpVd + ltpDa;
        payload.exLtp = exLtp;
        payload.redoDa = redoDa;
        payload.redoVd = redoVd;
        payload.redo = redoDa + redoVd;
        payload.ssr = ssr;
        payload.nps = nps;
        payload.npsDr = npsDr;
        payload.dRnps = nps + npsDr;
        payload.ofs = ofs;
        payload.appointments = appointments;
        payload.rCxe = rCxe;
        payload.audit = audit;
        payload.evalMonthlyScore = parseExcelNumericCell(rw[scoreCol]);
        payload.monthlyEvalRank = parseInt(String(rw[rankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
      }
      if (payload.owRnps && !payload.dRnps) payload.dRnps = payload.owRnps;
      if (bm.evalMonthlyScoreCol > -1) {
        payload.evalMonthlyScore = parseExcelNumericCell(rw[bm.evalMonthlyScoreCol]);
      }
      if (bm.monthlyTotalRankCol > -1) {
        payload.monthlyEvalRank = parseInt(String(rw[bm.monthlyTotalRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
      }
      partnerPatches[mKey] = { ...(partnerPatches[mKey] || {}), ...payload };
    }
  }

  return { partnerPatches, ytdPatches };
}

// ─── Tier Badge Component ─────────────────────────────────────────────────────
const TIER_META = {
  Masters: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FMaster%201.png?alt=media&token=a8eb8d46-5351-4b02-9f4e-e16def338ce6', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/40' },
  Diamond: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FDiamond%202.png?alt=media&token=2310388b-3281-4357-b202-677788b29c25', border: 'border-blue-400', text: 'text-blue-200', glow: 'shadow-blue-400/40' },
  Platinum: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FPlat%202.png?alt=media&token=8bbcfe60-0c97-4cc9-8d59-dec38f04eaba', border: 'border-zinc-300', text: 'text-zinc-100', glow: 'shadow-zinc-300/30' },
  Gold: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FGold%202.png?alt=media&token=f153076b-6c3a-4a1a-8b46-b65c94c593bf', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/40' },
  Silver: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FSilver%202.png?alt=media&token=05ebda06-4011-4920-ac19-dd0b9fa9e3fb', border: 'border-zinc-400', text: 'text-zinc-300', glow: 'shadow-zinc-400/30' },
  Bronze: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FBronze%202.png?alt=media&token=ec56f9b5-f567-4778-b0b2-4df15fe0a840', border: 'border-orange-600', text: 'text-orange-400', glow: 'shadow-orange-600/30' },
};

const PQA_SERVICE_CENTER_PHOTO = 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers.png?alt=media';
/** Local fallbacks if a file is missing under `PQA/Service centers/` in Firebase Storage. */
const PARTNER_LOGOS = {
  RAYA: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FRAYA%20LOGO.jpg?alt=media&token=04676d80-fda6-45b7-a733-e231f4097d54',
  SKY: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FSKY%20LOGO.jpg?alt=media&token=88e1d9dd-f889-4ad6-bf50-11749be8ab3f',
  HITECH: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FHI%20Tech.png?alt=media&token=ed6c0456-26ae-4ddc-98ec-fa6b0b892ec4',
  URC: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FURC.png?alt=media&token=f4993708-edf0-4503-8729-2d00f16ba5ab',
  KELECTRONICS: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FK%20Electronics%20Logo-1766305188934.jpg?alt=media&token=ada4fc3a-75af-46c8-a5b3-64a1491593b6',
  ATS: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FATS%20LOGO.jpg?alt=media&token=07f7845d-c90b-4edb-8aff-aa9af5b5b580',
  ELECTRA: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FElectra%20Logo.jpg?alt=media&token=7325e6ac-2371-4741-91ee-50b44ce09845',
  MTI: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FMTI.png?alt=media&token=7ec69134-31bb-4ceb-a124-0409a824255c',
  ALSAFY: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FALSAFY.png?alt=media&token=fcb8577b-0994-4d1a-9a29-92489c872b04',
  SAMSUNG_FALLBACK: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FSAMSUNG.jpg?alt=media&token=90a6b923-e8c1-4f65-96d1-0852386e73c1'
};

/** Default Samsung mark used for engineers — match by path so token/query variants still fill the frame. */
function isSamsungEngineerPhotoUrl(url) {
  if (!url) return false;
  const u = String(url);
  if (u === PARTNER_LOGOS.SAMSUNG_FALLBACK) return true;
  return /SAMSUNG\.jpg/i.test(u);
}

/** Home dashboard (TCS): monthly Hall of Fame + quarterly ladder list length (podium + rows below). */
const TCS_HOME_LEADERBOARD_LIMIT = 20;

/** After swapping to the Samsung fallback in the DOM, apply cover styling (React className does not update). */
function handleEngineerPhotoError(e) {
  const el = e.target;
  el.onerror = null;
  el.src = PARTNER_LOGOS.SAMSUNG_FALLBACK;
  el.classList.remove('object-contain', 'bg-white', 'p-0.5');
  el.classList.add('object-cover', 'object-center');
}

/**
 * Brand logos under gs://tcs-for-engineers.firebasestorage.app/PQA/Service centers/
 * Upload as <STEM>.png | .jpg | .jpeg | .webp (first match wins per brand).
 * Service centers are matched by partnerName / name containing the brand (e.g. "RAYA" → RAYA logo).
 */
const PQA_SERVICE_CENTERS_FOLDER = 'PQA/Service centers';
const PQA_BRAND_LOGO_STEM = {
  RAYA: 'RAYA',
  SKY: 'SKY',
  HITECH: 'HITECH',
  URC: 'URC',
  KELECTRONICS: 'K-ELECTRONICS',
  ATS: 'ATS',
  ELECTRA: 'ELECTRA',
  MTI: 'MTI',
  ALSAFY: 'ALSAFY',
};
const PQA_LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

/** Map Storage file stem → brand key (handles K-ELECTRONICS ↔ KELECTRONICS). */
const STEM_TO_BRAND_KEY = (() => {
  const m = {};
  for (const [key, stem] of Object.entries(PQA_BRAND_LOGO_STEM)) {
    const u = stem.toUpperCase();
    m[u] = key;
    m[u.replace(/-/g, '')] = key;
  }
  return m;
})();

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
      <img src={meta.img} alt={tier} className={`${imgSize} object-contain tier-emblem-blend`} />
      {tier}
    </span>
  );
};

// ─── 3D Rank Reveal Component ─────────────────────────────────────────────────
const TIER_GLOW_COLORS = {
  Masters: { from: 'rgba(168, 85, 247, 0.6)', to: 'rgba(192, 132, 252, 0.3)', ring: 'border-purple-500', particle: 'bg-purple-400', text: 'text-purple-300', gradient: 'from-purple-600 via-purple-400 to-fuchsia-300' },
  Diamond: { from: 'rgba(96, 165, 250, 0.6)', to: 'rgba(147, 197, 253, 0.3)', ring: 'border-blue-400', particle: 'bg-blue-400', text: 'text-blue-200', gradient: 'from-blue-500 via-cyan-400 to-sky-200' },
  Platinum: { from: 'rgba(212, 212, 216, 0.6)', to: 'rgba(228, 228, 231, 0.3)', ring: 'border-zinc-300', particle: 'bg-zinc-300', text: 'text-zinc-100', gradient: 'from-zinc-300 via-zinc-100 to-white' },
  Gold: { from: 'rgba(234, 179, 8, 0.6)', to: 'rgba(250, 204, 21, 0.3)', ring: 'border-yellow-500', particle: 'bg-yellow-400', text: 'text-yellow-300', gradient: 'from-yellow-500 via-amber-400 to-orange-300' },
  Silver: { from: 'rgba(161, 161, 170, 0.5)', to: 'rgba(212, 212, 216, 0.2)', ring: 'border-zinc-400', particle: 'bg-zinc-400', text: 'text-zinc-300', gradient: 'from-zinc-400 via-zinc-300 to-zinc-200' },
  Bronze: { from: 'rgba(194, 65, 12, 0.5)', to: 'rgba(251, 146, 60, 0.3)', ring: 'border-orange-600', particle: 'bg-orange-400', text: 'text-orange-400', gradient: 'from-orange-600 via-amber-500 to-yellow-400' },
};

const RankReveal3D = ({ tier, score, name, onDismiss, isPqaMode, rank }) => {
  const glowColors = isPqaMode ? TIER_GLOW_COLORS.Diamond : (TIER_GLOW_COLORS[tier] || TIER_GLOW_COLORS.Bronze);
  const meta = isPqaMode ? null : (TIER_META[tier] || TIER_META.Bronze);
  const [phase, setPhase] = React.useState('reveal'); // 'reveal' | 'idle'
  const [visible, setVisible] = React.useState(true);
  const scoreNum = Number(score);
  const scoreText = Number.isFinite(scoreNum) && scoreNum > 0 ? score : '';

  React.useEffect(() => {
    // After the spin completes, switch to idle float
    const spinTimer = setTimeout(() => setPhase('idle'), 1500);
    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 500);
    }, 5000);
    return () => { clearTimeout(spinTimer); clearTimeout(dismissTimer); };
  }, []);

  const handleTap = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 500);
  };

  // Generate 8 orbiting particles
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: `${i * 0.35}s`,
    radius: `${65 + (i % 3) * 25}px`,
    duration: `${2.5 + (i % 3) * 0.8}s`,
    size: i % 2 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
  }));

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center cursor-pointer transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleTap}
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.98) 100%)' }}
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Central reveal stage */}
      <div className="relative flex flex-col items-center gap-10 perspective-1200">

        {/* Expanding rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`absolute w-40 h-40 rounded-full border-2 ${glowColors.ring} animate-ring-expand`} />
          <div className={`absolute w-40 h-40 rounded-full border-2 ${glowColors.ring} animate-ring-expand-delay`} />
        </div>

        {/* Radial burst */}
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div
            className="w-32 h-32 rounded-full animate-radial-burst"
            style={{ background: `radial-gradient(circle, ${glowColors.from} 0%, transparent 70%)` }}
          />
        </div>

        {/* Glow aura */}
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
          <div
            className="w-56 h-56 rounded-full animate-glow-pulse blur-3xl"
            style={{ background: `radial-gradient(circle, ${glowColors.from} 0%, ${glowColors.to} 50%, transparent 80%)` }}
          />
        </div>

        {/* Orbiting particles */}
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
          {particles.map(p => (
            <div
              key={p.id}
              className={`absolute ${p.size} ${glowColors.particle} rounded-full shadow-lg animate-particle-orbit`}
              style={{
                '--orbit-radius': p.radius,
                '--orbit-duration': p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        {/* The tier emblem / PQA rank — 3D spin then float */}
        <div className={phase === 'reveal' ? 'animate-rank-spin-3d' : 'animate-rank-float'}>
          {isPqaMode ? (
            <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full border-[6px] border-blue-400 bg-black/50 shadow-[0_0_40px_rgba(96,165,250,0.5)] flex items-center justify-center relative z-10`}>
                <span className="text-7xl font-black italic text-blue-400">#{rank || '-'}</span>
            </div>
          ) : (
            <img
              src={meta?.img}
              alt={tier}
              className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] relative z-10 tier-emblem-blend"
            />
          )}
        </div>

        {/* Tier / Rank name */}
        <div className="animate-tier-title text-center space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600">
            {isPqaMode ? 'System Ranking' : 'You have earned'}
          </p>
          <h2 className={`text-4xl md:text-6xl font-black uppercase italic tracking-tighter bg-gradient-to-r ${glowColors.gradient} bg-clip-text text-transparent animate-shimmer`}
            style={{ backgroundImage: `linear-gradient(110deg, ${glowColors.from}, white 30%, ${glowColors.from} 50%, white 70%, ${glowColors.from})` }}
          >
            {isPqaMode ? `Rank #${rank || '-'}` : tier}
          </h2>
          <p className={`text-xs font-black uppercase tracking-[0.4em] ${glowColors.text}`}>{name}</p>
        </div>

        {/* Score counter (hidden for PQA animation by request) */}
        {!isPqaMode && (
          <div className="animate-score-bounce text-center">
            <span className="text-7xl md:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              {scoreText}
            </span>
            {scoreText ? (
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600 mt-2">
                TCS Score
              </p>
            ) : null}
          </div>
        )}

        {/* Tap to continue hint */}
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-800 animate-pulse mt-8">Tap anywhere to continue</p>
      </div>
    </div>
  );
};

// --- Sub-components ---

const Header = ({ onHome, onLogoClick, appMode }) => {
  const showLogo = appMode !== null;
  const isTcs = appMode?.startsWith('TCS');
  const appLogo = useMemo(() => {
    if (appMode?.startsWith('PQA')) return './pqa_logo.png';
    return './fawzy-logo.png';
  }, [appMode]);
  const slogan = 'Earn Your Tier • Own Your Title';
  return (
    <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-3 md:gap-4 min-h-0">
        <div className="flex items-center min-w-0">
          <div className="cursor-pointer group" onClick={onLogoClick || onHome}>
            <img src="./sam_logo.png" alt="Samsung" className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
        <div className="flex justify-center text-center min-w-0 px-1">
           <p className="text-[9px] sm:text-[10px] md:text-[13px] uppercase tracking-[0.25em] sm:tracking-[0.35em] md:tracking-[0.5em] text-zinc-300 font-extrabold leading-snug break-words">
            {slogan}
          </p>
        </div>
        <div className="flex justify-end items-center group min-w-0">
          {showLogo && (
            <div
              className={`rounded-2xl overflow-hidden border-2 border-white/10 shadow-3xl bg-black transition-all duration-700 hover:scale-105 hover:border-white/40 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.08)] shrink-0 ${
                isTcs
                  ? 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14'
                  : 'h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem]'
              }`}
            >
              <img src={appLogo} alt="App Logo" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

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
  const [view, setView] = useState('APP_SELECTION');
  const [appMode, setAppMode] = useState(null); // 'TCS_MX' | 'TCS_DA' | 'TCS_AV' | 'TCS_VD' (legacy) | 'PQA_MX' | 'PQA_CE'
  /** Set when user picks TCS vs PQA at gateway — keeps search screen aligned (engineer code vs service center code). */
  const [portalRealm, setPortalRealm] = useState(null);

  // ─── View history stack for swipe-back / browser-back support ────────────
  const viewStackRef = React.useRef(['APP_SELECTION']);
  const navigateTo = React.useCallback((nextView) => {
    viewStackRef.current = [...viewStackRef.current, nextView];
    window.history.pushState({ view: nextView }, '');
    setView(nextView);
  }, []);
  const navigateBack = React.useCallback(() => {
    const stack = viewStackRef.current;
    if (stack.length > 1) {
      viewStackRef.current = stack.slice(0, -1);
      setView(stack[stack.length - 2]);
    } else {
      setView('APP_SELECTION');
    }
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      navigateBack();
    };
    window.addEventListener('popstate', handlePopState);

    // ── Direct Portal Links based on Domain ────────────────────────────────
    const host = window.location.hostname.toLowerCase();
    if (host.includes('scora-pqa')) {
      setPortalRealm('PQA');
      setView('PQA_DIVISION_SELECTION');
      viewStackRef.current = ['APP_SELECTION', 'PQA_DIVISION_SELECTION'];
    } else if (host.includes('scora-tcs')) {
      setPortalRealm('TCS');
      setView('TCS_DIVISION_SELECTION');
      viewStackRef.current = ['APP_SELECTION', 'TCS_DIVISION_SELECTION'];
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateBack]);
  const isPqaMode = appMode?.startsWith('PQA');
  /** Search / lookup copy: PQA portal → service center code; TCS portal → engineer code. Falls back to appMode when portalRealm unset. */
  const searchIsPqaContext = portalRealm === 'PQA' || (portalRealm === null && isPqaMode);
  const portalVsAppMismatch =
    (portalRealm === 'TCS' && isPqaMode) || (portalRealm === 'PQA' && appMode?.startsWith('TCS'));
  // Derived Firestore collection name — available everywhere in the component
  const colName = resolveFirestoreCollection(appMode);
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
  const [fetchError, setFetchError] = useState(null); // New error state

  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [pqaDefaultUrl, setPqaDefaultUrl] = useState(PQA_SERVICE_CENTER_PHOTO);
  const [partnerLogoUrls, setPartnerLogoUrls] = useState({});

  useEffect(() => {
    // Dynamically fetch the real download URL (with token) for the PQA Service Center photo
    const getPqaPhoto = async () => {
      try {
        const { ref, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const pqaRef = ref(storage, 'PQA/Service centers.png');
        const url = await getDownloadURL(pqaRef);
        if (url) setPqaDefaultUrl(url);
      } catch (e) { console.warn("PQA photo fetch failed, using fallback path.", e); }
    };
    getPqaPhoto();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ref, listAll, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const next = {};

        const tryStemExtensions = async (key, stem) => {
          for (const ext of PQA_LOGO_EXTENSIONS) {
            try {
              return await getDownloadURL(ref(storage, `${PQA_SERVICE_CENTERS_FOLDER}/${stem}.${ext}`));
            } catch { /* next */ }
          }
          return null;
        };

        // 1) List folder — picks up whatever filenames you uploaded (RAYA.png, Raya.jpg, …)
        try {
          const { items } = await listAll(ref(storage, PQA_SERVICE_CENTERS_FOLDER));
          await Promise.all(
            items.map(async (itemRef) => {
              const name = itemRef.name; // "RAYA.png"
              if (!name || name.startsWith('.')) return;
              const stem = name.replace(/\.[^.]+$/i, '');
              const stemU = stem.toUpperCase().trim();
              const brandKey = STEM_TO_BRAND_KEY[stemU] || STEM_TO_BRAND_KEY[stemU.replace(/\s+/g, '')];
              if (!brandKey) return;
              try {
                const url = await getDownloadURL(itemRef);
                if (url) next[brandKey] = url;
              } catch { /* skip */ }
            })
          );
        } catch (listErr) {
          console.warn('PQA Service centers folder list failed (check Storage list rules). Falling back to fixed paths.', listErr);
        }

        // 2) Fill any missing brand with known stems + extensions
        for (const [key, stem] of Object.entries(PQA_BRAND_LOGO_STEM)) {
          if (next[key]) continue;
          const url = await tryStemExtensions(key, stem);
          if (url) next[key] = url;
        }

        if (!cancelled) setPartnerLogoUrls(next);
      } catch (e) {
        console.warn('PQA brand logos init failed.', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [noEngineers, setNoEngineers] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ username: '', password: '', name: '', role: 'ADMIN', access: 'TCS_ONLY' });
  const [fetchedHiddenEngineers, setFetchedHiddenEngineers] = useState([]);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkSelectedArchivedIds, setBulkSelectedArchivedIds] = useState([]);
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
  const [homeViewMode, setHomeViewMode] = useState('QUARTERLY'); // Default to ACCUMULATED for PQA
  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' | 'CENTER'

  const [selectedHofMonth, setSelectedHofMonth] = useState(null); // Used for Monthly view
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view

  // Engineer profile period selector
  const [profileViewMode, setProfileViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'
  const [selectedProfileMonth, setSelectedProfileMonth] = useState(null); // key: "Month-Year"
  const [selectedProfileQuarter, setSelectedProfileQuarter] = useState(null); // key: "Q1-2026"

  // Engineer History month selector
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);

  /** True when user opened profile via exact engineer code from SEARCH (hide detailed metrics). */
  const [profileOpenedByExactCode, setProfileOpenedByExactCode] = useState(false);

  // Feedback form state
  const [feedbackCode, setFeedbackCode] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Activity log panel toggle
  /** Admin dashboard: modal shortcuts (accounts / TCS guide / action log) */
  const [adminModal, setAdminModal] = useState(null);

  // Engineer self-service photo auth
  const [showPhotoAuth, setShowPhotoAuth] = useState(false);
  const [photoAuthCode, setPhotoAuthCode] = useState('');
  const [photoAuthStep, setPhotoAuthStep] = useState('idle'); // 'idle' | 'auth' | 'upload' | 'done'
  const [selfPhotoFile, setSelfPhotoFile] = useState(null);
  const [selfPhotoUploading, setSelfPhotoUploading] = useState(false);
  const [tcsProductImagesSyncing, setTcsProductImagesSyncing] = useState(false);
  const selfPhotoInputRef = useRef(null);

  // Rank reveal state
  const [showRankReveal, setShowRankReveal] = useState(false);

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

  // Helper to ensure PQA Service Center photo is displayed correctly
  const getPhotoUrl = (eng) => {
    if (!eng) return 'https://picsum.photos/200';

    // ── Prioritize Custom Manual Uploads ──────────────────────────────
    if (eng.photoUrl && 
        !eng.photoUrl.includes('Service%20centers.png') && 
        !eng.photoUrl.includes('picsum.photos') && 
        !eng.photoUrl.startsWith('/logos/')) {
      return eng.photoUrl;
    }

    const isPqa = appMode?.startsWith('PQA');
    const pqaPlaceholder = () => pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;
    /** Resolved Storage URL, else PQA generic placeholder (not missing /logos files), else local path for TCS */
    const brandUrl = (key) => PARTNER_LOGOS[key] || (isPqa ? pqaPlaceholder() : `/logos/${key.toLowerCase()}.png`);

    // Match brand on any common field
    const hay = [
      eng.partnerName,
      eng.partner,
      eng.name,
      eng.asc,
      eng.code,
      eng.centerName,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    if (hay.includes('RAYA')) return brandUrl('RAYA');
    if (hay.includes('SKY')) return brandUrl('SKY');
    if (hay.includes('HI TECH') || hay.includes('HITECH')) return brandUrl('HITECH');
    if (hay.includes('URC')) return brandUrl('URC');
    if (hay.includes('K-ELECTRONICS') || hay.includes('K ELECTRONICS') || hay.includes('KELECTRONICS')) return brandUrl('KELECTRONICS');
    if (hay.includes('ATS')) return brandUrl('ATS');
    if (hay.includes('ELECTRA')) return brandUrl('ELECTRA');
    if (hay.includes('MTI')) return brandUrl('MTI');
    if (hay.includes('ALSAFY') || hay.includes('AL SAFY')) return brandUrl('ALSAFY');

    if (isPqa) {
      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {
        return PARTNER_LOGOS.SAMSUNG_FALLBACK;
      }
    }
    return eng.photoUrl || PARTNER_LOGOS.SAMSUNG_FALLBACK;
  };
  
  // Helper for conditional logo styling (Samsung default fills frame; partner /local logos stay letterboxed)
  const getLogoStyle = (url) =>
    isSamsungEngineerPhotoUrl(url) ? 'object-cover object-center' : 'object-contain bg-white p-0.5';

  /** TCS: leaderboard shows SBA ID; search uses Engineer Code (`code`). PQA: service center name. */
  const tcsDisplayPrimary = (eng) => {
    if (appMode?.startsWith('PQA')) return eng?.name || eng?.code || '—';
    const sba = String(eng?.sbaId || '').trim();
    if (sba) return sba;
    const code = String(eng?.code || '').trim();
    if (code) return code;
    return eng?.name || '—';
  };
  const tcsDisplaySecondary = (eng) => {
    if (appMode?.startsWith('PQA')) return '';
    const asc = String(eng?.asc || '').trim();
    if (asc && asc !== 'N/A') return asc;
    return String(eng?.name || '').trim();
  };

  const isTcsMode = appMode?.startsWith('TCS');

  const PHOTO_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
  const photoUpdatedAtMs = (eng) => {
    const v = eng?.photoUpdatedAt;
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    return 0;
  };
  /** Firebase Storage folder for TCS engineer photos: mx | da | av */
  const getTcsStorageFolder = () => {
    if (appMode === 'TCS_MX') return 'mx';
    if (appMode === 'TCS_DA') return 'da';
    if (appMode === 'TCS_AV' || appMode === 'TCS_VD') return 'av';
    return 'engineers';
  };

  /** TCS: tier emblem only (no duplicate Rank label). PQA: # only. */
  const renderRankBadgePodium = (displayRank, eng, compact = false) => {
    if (isTcsMode && eng) {
      const meta = TIER_META[eng.tier] || TIER_META.Bronze;
      return (
        <div className="mb-1 flex flex-col items-center sm:mb-2">
          <img
            src={meta.img}
            alt={eng.tier || 'Tier'}
            className={`object-contain drop-shadow-[0_8px_28px_rgba(0,0,0,0.5)] tier-emblem-blend ${
              compact
                ? 'h-9 w-9 sm:h-14 sm:w-14 md:h-[4.25rem] md:w-[4.25rem]'
                : 'h-[4.25rem] w-[4.25rem] sm:h-16 sm:w-16 md:h-[5.25rem] md:w-[5.25rem]'
            }`}
          />
        </div>
      );
    }
    return (
      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">#{displayRank}</div>
    );
  };

  /** TCS list: tier emblem + rank block. PQA: # in box. */
  const renderRankBadgeList = (displayRank, isFirst, isSecond, isThird, eng) => {
    const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-400 bg-zinc-800/60 border-white/10';
    if (isTcsMode && eng) {
      const meta = TIER_META[eng.tier] || TIER_META.Bronze;
      return (
        <div className="flex flex-shrink-0 items-center">
          <img
            src={meta.img}
            alt={eng.tier || ''}
            className="h-12 w-12 sm:h-14 sm:w-14 md:h-[4.25rem] md:w-[4.25rem] object-contain tier-emblem-blend"
          />
        </div>
      );
    }
    return (
      <div className={`flex h-8 w-8 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-lg md:rounded-2xl border font-black italic md:text-lg ${rankColor}`}>
        #{displayRank}
      </div>
    );
  };

  /** Top 3 rows only (same order & #displayRank as the ladder). Full list continues below from rank 4. */
  const renderHomeRankingPodium = (entries, scoreField, scoreLabelStr) => {
    const top = entries.slice(0, 3);
    if (top.length === 0) return null;
    const scoreOf = (eng) => (scoreField === 'avgScore' ? eng?.avgScore : eng?.tcsScore);
    const PodiumCol = ({ eng, stepClass, champion }) => {
      const displayRank = eng.displayRank ?? 0;
      const url = getPhotoUrl(eng);
      const sc = scoreOf(eng);
      const scoreTone = champion
        ? 'text-yellow-400'
        : displayRank === 2
          ? 'text-zinc-300'
          : displayRank === 3
            ? 'text-orange-500'
            : 'text-white';
      return (
        <div className="flex min-w-0 w-full max-w-full flex-col items-center">
          <div className={`flex w-full flex-col items-center gap-1 mb-2 px-0.5 sm:px-1 ${champion ? 'sm:scale-[1.03] md:scale-105' : ''}`}>
            {renderRankBadgePodium(displayRank, eng, true)}
            <img
              src={url}
              alt=""
              onError={handleEngineerPhotoError}
              className={`h-11 w-11 shrink-0 rounded-xl border shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl md:h-[4.5rem] md:w-[4.5rem] ${getLogoStyle(url)} ${
                champion ? 'border-yellow-500/80 ring-1 ring-yellow-500/25 sm:ring-2' : 'border-white/15'
              }`}
            />
            <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-0.5 text-center leading-tight">
              <span className="line-clamp-2 break-words text-[8px] font-black uppercase text-white sm:text-[10px] md:text-xs">{tcsDisplayPrimary(eng)}</span>
              {tcsDisplaySecondary(eng) ? (
                <span className="line-clamp-2 w-full break-words text-[7px] font-bold normal-case tracking-normal text-zinc-500 sm:text-[8px] md:text-[9px]">
                  {tcsDisplaySecondary(eng)}
                </span>
              ) : null}
            </div>
            {!appMode?.startsWith('PQA') && eng.tier && !isTcsMode && <TierBadge tier={eng.tier} size="sm" />}
            <div className={`text-base font-black italic tracking-tighter sm:text-xl md:text-3xl ${scoreTone}`}>
              {sc != null ? parseFloat(sc).toFixed(1) : '—'}
            </div>
            <div className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[7px]">{scoreLabelStr}</div>
          </div>
          <div
            className={`w-full rounded-t-xl border-x border-t border-white/10 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 shadow-inner sm:rounded-t-2xl ${stepClass}`}
          />
        </div>
      );
    };
    return (
      <div className="mb-6 w-full min-w-0 max-w-full md:mb-10" aria-label="Top three podium">
        <p className="mb-3 text-center text-[9px] font-black uppercase tracking-[0.35em] text-zinc-600">Podium — Top 3</p>
        <div className="mx-auto grid w-full min-w-0 max-w-4xl grid-cols-3 items-end gap-1 px-1 sm:gap-3 sm:px-3 md:gap-5">
          {top.length >= 2 && <PodiumCol eng={top[1]} stepClass="h-12 sm:h-[5.5rem] md:h-[7rem]" />}
          {top.length >= 1 && <PodiumCol eng={top[0]} stepClass="h-16 sm:h-[7.5rem] md:h-[9.5rem]" champion />}
          {top.length >= 3 && <PodiumCol eng={top[2]} stepClass="h-10 sm:h-[4.5rem] md:h-[5.5rem]" />}
        </div>
      </div>
    );
  };

  // Record visit on mount & session end on tab close
  const isLoggedRef = React.useRef(isLogged);
  const appModeRef = React.useRef(appMode);
  useEffect(() => { isLoggedRef.current = isLogged; }, [isLogged]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);

  useEffect(() => {
    if (!appMode) return;
    try {
      const k = `analytics_seg_${appMode}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      recordVisitorModeSegment(appMode);
    } catch (_) { /* sessionStorage unavailable */ }
  }, [appMode]);

  useEffect(() => {
    let start;
    recordVisit().then(t => {
      start = t;
      setSessionStart(t);
    });
    const handleUnload = () => {
      if (start) recordSessionEnd(start, visitedPagesRef.current, isLoggedRef.current, appModeRef.current);
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

  // Initial/Mode Load
  useEffect(() => {
    if (!appMode && (view === 'APP_SELECTION' || view === 'TCS_DIVISION_SELECTION' || view === 'PQA_DIVISION_SELECTION')) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      const bootstrapAdmin = getBootstrapAdmin();

      try {
        const fetchedEngineers = await getEngineers(colName);
        const fetchedHiddenEngineers = await getHiddenEngineers(colName);
        const fetchedAdmins = await getAdmins();

        // Data Handling
        if (fetchedEngineers && fetchedEngineers.length > 0) {
          setEngineers(fetchedEngineers);
          setNoEngineers(false);
        } else {
          console.warn("No engineers found in database. Using initial demo data.");
          setEngineers(INITIAL_ENGINEERS);
          setNoEngineers(false); // We have demo data now
        }

        if (fetchedHiddenEngineers && fetchedHiddenEngineers.length > 0) {
          setFetchedHiddenEngineers(fetchedHiddenEngineers);
        } else {
          setFetchedHiddenEngineers([]);
        }

        // Admin Handling
        if (fetchedAdmins && fetchedAdmins.length > 0) {
          setAdmins(fetchedAdmins);
        } else {
          if (!bootstrapAdmin) {
            console.warn(
              'No admins in Firestore and NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64 is unset — configure .env.local or create admins in Firebase.'
            );
          }
          setAdmins(bootstrapAdmin ? [bootstrapAdmin] : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError(`Database connection issue: ${error.message || 'Unknown error'}. Using offline fallback data and admin.`);
        
        // Use fallbacks on error
        setEngineers(INITIAL_ENGINEERS);
        setAdmins(bootstrapAdmin ? [bootstrapAdmin] : []);
        setNoEngineers(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appMode, view]);

  const sortedEngineers = useMemo(() => {
    return [...engineers].sort((a, b) => b.tcsScore - a.tcsScore);
  }, [engineers]);

  // Deduplicated: TCS = latest month per code. PQA = merge ALL month rows per center (KPIs often split across months) then sort by resolved PQA score.
  const deduplicatedEngineers = useMemo(() => {
    if (isPqaMode) {
      const byCode = {};
      engineers.forEach((e) => {
        const code = String(e.code ?? '').replace(/[\s,]/g, '').trim().toUpperCase();
        if (!code) return;
        if (appMode && e.pqaBranch && e.pqaBranch !== appMode) return;
        if (!byCode[code]) byCode[code] = [];
        byCode[code].push(e);
      });
      return Object.values(byCode)
        .map((recs) => {
          const sortByRecency = (a, b) => {
            const ya = parseInt(a.year) || 0;
            const yb = parseInt(b.year) || 0;
            if (yb !== ya) return yb - ya;
            return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
          };
          const sorted = [...recs].sort(sortByRecency);
          return mergePqaKpiFromRecordsPure(sorted[0], recs);
        })
        .sort((a, b) => resolvePqaTcsScorePure(b) - resolvePqaTcsScorePure(a));
    }
    const byCode = {};
    engineers.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      const existing = byCode[code];
      if (!existing) { byCode[code] = e; return; }
      const existY = parseInt(existing.year), newY = parseInt(e.year);
      if (newY > existY || (newY === existY && getMonthIndex(e.month) > getMonthIndex(existing.month))) {
        byCode[code] = e;
      }
    });
    return Object.values(byCode).sort((a, b) => b.tcsScore - a.tcsScore);
  }, [engineers, isPqaMode, appMode]);

  const visibleRegistryIds = useMemo(
    () => deduplicatedEngineers.map((e) => e.id).filter(Boolean),
    [deduplicatedEngineers]
  );

  const allVisibleSelected = visibleRegistryIds.length > 0 && visibleRegistryIds.every((id) => bulkSelectedIds.includes(id));
  const archivedRegistryIds = useMemo(
    () => fetchedHiddenEngineers.map((e) => e.id).filter(Boolean),
    [fetchedHiddenEngineers]
  );
  const allArchivedSelected = archivedRegistryIds.length > 0 && archivedRegistryIds.every((id) => bulkSelectedArchivedIds.includes(id));

  useEffect(() => {
    // Keep selection valid when list/app mode changes.
    setBulkSelectedIds((prev) => prev.filter((id) => visibleRegistryIds.includes(id)));
  }, [visibleRegistryIds]);
  useEffect(() => {
    setBulkSelectedArchivedIds((prev) => prev.filter((id) => archivedRegistryIds.includes(id)));
  }, [archivedRegistryIds]);


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

  // ─── Hall of Fame: top N for selected month (deduplicated by code); TCS uses TCS_HOME_LEADERBOARD_LIMIT ─────────
  // Default to the LAST element = latest month (ascending sort → last = newest)
  const effectiveHofMonth = selectedHofMonth || allMonthPeriods[allMonthPeriods.length - 1]?.key || null;
  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const targetMonthIdx = getMonthIndex(m);
    const filtered = engineers.filter((e) => {
      if (!sameCalendarYear(e.year, y)) return false;
      const eMonthIdx = getMonthIndex(e.month);
      if (targetMonthIdx >= 0 && eMonthIdx >= 0) return eMonthIdx === targetMonthIdx;
      return e.month?.toLowerCase() === m?.toLowerCase();
    });
    const asNum = (v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
      if (!s) return 0;
      const hasComma = s.includes(',');
      const hasDot = s.includes('.');
      let norm = s;
      if (hasComma && !hasDot) norm = (/^-?\d+,\d+$/.test(s)) ? s.replace(',', '.') : s.replace(/,/g, '');
      else if (hasComma && hasDot) norm = s.replace(/,/g, '');
      const n = parseFloat(norm);
      return Number.isFinite(n) ? n : 0;
    };

    if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
      // ── By Partner: aggregate partnerScore per official partner ──────────────
      const partners = {};

      // Seed ALL 7 partners so they always appear even if score is 0
      PQA_OFFICIAL_MX_PARTNERS.forEach((op) => {
        partners[op] = {
          id: `partner-${op}`,
          name: op,
          code: op,
          tcsScore: 0,
          bestPartnerScore: 0,
          bestPartnerRank: 0,
          totalCenterScore: 0,
          count: 0,
          photoUrl: `/logos/${op.toLowerCase()}.png`
        };
      });

      filtered.forEach(e => {
        const candidates = [
          String(e.partnerName || '').trim(),
          String(e.asc || '').trim(),
          String(e.name || '').trim(),
        ].filter(Boolean);
        let matched = null;
        for (const c of candidates) {
          matched = mapPqaSheetPartnerKeyToOfficial(c);
          if (matched) break;
        }
        if (matched) {
          const ps = asNum(e.partnerScore || 0);
          const pr = parseInt(String(e.monthlyRank ?? e.monthlyEvalRank ?? 0).replace(/[^0-9-]/g, ''), 10) || 0;
          // For MX monthly by-partner fallback, prefer month sheet scores (★Partner Ranking / ★Monthly Average),
          // then Evaluation-point total, then generic tcsScore.
          const cs = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
          // Track best partnerScore (Excel pre-computed) and also accumulate center scores as fallback
          if (ps > partners[matched].bestPartnerScore) partners[matched].bestPartnerScore = ps;
          if (pr > 0 && (!partners[matched].bestPartnerRank || pr < partners[matched].bestPartnerRank)) {
            partners[matched].bestPartnerRank = pr;
          }
          partners[matched].totalCenterScore += cs;
          partners[matched].count += 1;
        }
      });

      const monthlyPartners = Object.values(partners)
        .map(p => ({
          ...p,
          // Prefer Excel partnerScore; fall back to average of center scores
          tcsScore: p.bestPartnerScore > 0 ? p.bestPartnerScore : (p.count > 0 ? parseFloat((p.totalCenterScore / p.count).toFixed(1)) : 0)
        }))
        .sort((a, b) => {
          const ra = a.bestPartnerRank > 0 ? a.bestPartnerRank : 999;
          const rb = b.bestPartnerRank > 0 ? b.bestPartnerRank : 999;
          if (ra !== rb) return ra - rb;
          return b.tcsScore - a.tcsScore;
        })
        .slice(0, 7);
      let currentRank = 1;
      return monthlyPartners.map((p, i) => {
        if (i > 0 && p.tcsScore < monthlyPartners[i - 1].tcsScore) currentRank = i + 1;
        return { ...p, displayRank: p.bestPartnerRank || currentRank };
      });
    }

    // ── By Center: deduplicate + dense/excel ranking ─────────────────────────
    const byCode = {};
    filtered.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      if (appMode === 'PQA_MX') {
        // Monthly service-center ranking must use month-level sheet values first.
        const score = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
        const prevScore = byCode[code] ? asNum(byCode[code].monthlyScore ?? byCode[code].centerMonthlyScore ?? byCode[code].evalMonthlyScore ?? byCode[code].tcsScore ?? 0) : -1;
        if (!byCode[code] || score > prevScore) byCode[code] = e;
      } else if (appMode === 'PQA_CE') {
        const score = asNum((asNum(e.tcsScore) > 0 ? e.tcsScore : (e.centerMonthlyScore ?? e.monthlyScore ?? e.evalMonthlyScore ?? 0)));
        const prevScore = byCode[code]
          ? asNum((asNum(byCode[code].tcsScore) > 0 ? byCode[code].tcsScore : (byCode[code].centerMonthlyScore ?? byCode[code].monthlyScore ?? byCode[code].evalMonthlyScore ?? 0)))
          : -1;
        if (!byCode[code] || score > prevScore) byCode[code] = e;
      } else if (!byCode[code] || e.tcsScore > byCode[code].tcsScore) {
        byCode[code] = e;
      }
    });
    const limit =
      appMode === 'PQA_MX' || appMode === 'PQA_CE'
        ? 999
        : appMode?.startsWith('PQA')
          ? 10
          : TCS_HOME_LEADERBOARD_LIMIT;
    const sorted = Object.values(byCode)
      .map((e) => {
        if (appMode === 'PQA_MX') {
          const mxScore = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
          return { ...e, tcsScore: mxScore };
        }
        if (appMode === 'PQA_CE') {
          const ceScore = asNum((asNum(e.tcsScore) > 0 ? e.tcsScore : (e.centerMonthlyScore ?? e.monthlyScore ?? e.evalMonthlyScore ?? 0)));
          return { ...e, tcsScore: ceScore };
        }
        return e;
      })
      .sort((a, b) => {
        if (appMode?.startsWith('PQA')) {
           const rankA = a.centerMonthlyRank > 0 ? a.centerMonthlyRank : 999;
           const rankB = b.centerMonthlyRank > 0 ? b.centerMonthlyRank : 999;
           if (rankA !== rankB) return rankA - rankB;
        }
        return b.tcsScore - a.tcsScore;
      })
      .slice(0, limit);

    // Assign dense ranks (same score → same rank) or use Excel rank
    let currentRank = 1;
    return sorted.map((e, i) => {
      if (i > 0 && e.tcsScore < sorted[i - 1].tcsScore) currentRank++;
      if (appMode?.startsWith('PQA')) {
         return { ...e, displayRank: e.centerMonthlyRank || currentRank };
      }
      return { ...e, displayRank: currentRank };
    });
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);

  // ─── Quarterly: all unique quarter keys, sorted latest-first ─────────────────
  const allQuarterKeys = useMemo(() => {
    const seen = new Set();
    engineers.forEach(e => {
      const yk = normalizeYearKey(e.year);
      if (!yk) return;
      if (e.month) {
        const q = getQuarter(e.month);
        if (q && /^Q[1-4]$/.test(q)) seen.add(`${q}-${yk}`);
      }
      let qf = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
      if (/^[1-4]$/.test(qf)) qf = `Q${qf}`;
      if (/^Q[1-4]$/.test(qf)) seen.add(`${qf}-${yk}`);
    });
    return [...seen]
      .filter((k) => /^Q[1-4]-\d{4}$/.test(k))
      .sort((a, b) => {
        const [qa, ya] = a.split('-');
        const [qb, yb] = b.split('-');
        if (parseInt(yb, 10) !== parseInt(ya, 10)) return parseInt(yb, 10) - parseInt(ya, 10);
        return parseInt(qb.replace('Q', ''), 10) - parseInt(qa.replace('Q', ''), 10);
      });
  }, [engineers]);

  const effectiveQuarterKey = selectedQuarterKey || allQuarterKeys[0] || null;

  /** TCS quarterly pill: Q1 · MX when product is uniform; otherwise Q1 · 2025 */
  const tcsQuarterPeriodLabel = useMemo(() => {
    if (!effectiveQuarterKey || !/^Q[1-4]-\d{4}$/.test(effectiveQuarterKey)) return 'No Data';
    const [q, y] = effectiveQuarterKey.split('-');
    const prods = new Set();
    engineers.forEach((e) => {
      const yNorm = normalizeYearKey(e.year);
      if (!yNorm || yNorm !== y) return;
      const monthQ = e.month ? getQuarter(e.month) : '';
      let qField = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
      if (/^[1-4]$/.test(qField)) qField = `Q${qField}`;
      if (monthQ !== q && qField !== q) return;
      const p = String(e.product || '').trim().toUpperCase();
      if (p) prods.add(p);
    });
    if (prods.size === 1) return `${q} · ${[...prods][0]}`;
    return `${q} · ${y}`;
  }, [effectiveQuarterKey, engineers]);

  useEffect(() => {
    if (!allQuarterKeys.length) return;
    if (selectedQuarterKey && !allQuarterKeys.includes(selectedQuarterKey)) {
      setSelectedQuarterKey(null);
    }
  }, [allQuarterKeys, selectedQuarterKey]);

  useEffect(() => {
    if (appMode && !appMode.startsWith('PQA') && allMonthPeriods.length === 0 && homeViewMode === 'MONTHLY') {
      setHomeViewMode('QUARTERLY');
    }
  }, [appMode, allMonthPeriods.length, homeViewMode]);

  const quarterlyRanking = useMemo(() => {

    // ── PQA ACCUMULATED mode ─────────────────────────────────────────────────
    if (appMode?.startsWith('PQA')) {
      if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
        // Collect best accumulatedScore & accumulatedRank per partner across all records
        const pGroup = {};
        const asNum = (v) => {
          if (typeof v === 'number' && Number.isFinite(v)) return v;
          const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
          if (!s) return 0;
          const hasComma = s.includes(',');
          const hasDot = s.includes('.');
          let norm = s;
          if (hasComma && !hasDot) {
            norm = (/^-?\d+,\d+$/.test(s)) ? s.replace(',', '.') : s.replace(/,/g, '');
          } else if (hasComma && hasDot) {
            norm = s.replace(/,/g, '');
          }
          const n = parseFloat(norm);
          return Number.isFinite(n) ? n : 0;
        };
        PQA_OFFICIAL_MX_PARTNERS.forEach((op) => {
          pGroup[op] = { id: `acc-${op}`, name: op, code: op, avgScore: 0, ytdRank: 0, monthCount: 0 };
        });

        // One merged row per center (YTD/accumulated propagated in mergePqaKpiFromRecordsPure)
        deduplicatedEngineers.forEach((e) => {
          const cands = [
            String(e.partnerName || '').trim(),
            String(e.asc || '').trim(),
            String(e.name || '').trim(),
          ].filter(Boolean);
          let matched = null;
          for (const c of cands) {
            matched = mapPqaSheetPartnerKeyToOfficial(c);
            if (matched) break;
          }
          if (matched) {
            // Strict source for MX partner accumulated dashboard: ★Partner Ranking D/E only.
            const accScore = asNum((Number(e.accumulatedScore) > 0 ? e.accumulatedScore : e.ytdScore) ?? 0);
            const accRank = parseInt(String((parseInt(String(e.accumulatedRank || 0), 10) > 0 ? e.accumulatedRank : e.ytdRank) ?? 0).replace(/[^0-9-]/g, ''), 10) || 0;
            if (accScore > pGroup[matched].avgScore) {
              pGroup[matched].avgScore = accScore;
              pGroup[matched].ytdRank = accRank;
            } else if (accScore === pGroup[matched].avgScore && accRank > 0) {
              if (!pGroup[matched].ytdRank || accRank < pGroup[matched].ytdRank) {
                pGroup[matched].ytdRank = accRank;
              }
            }
          }
        });

        const sorted = Object.values(pGroup).sort((a, b) => b.avgScore - a.avgScore);
        let currentRank = 1;
        return sorted.map((p, i) => {
          if (i > 0 && p.avgScore < sorted[i - 1].avgScore) currentRank = i + 1;
          const excelRank = p.ytdRank > 0 ? p.ytdRank : currentRank;
          return { ...p, displayRank: excelRank };
        });

      } else {
        // By Center – accumulated: use ytdScore (Excel avg score column) per center
        const byCode = {};
        engineers.forEach(e => {
          const code = e.code?.toUpperCase();
          if (!code) return;
          // Keep record with the highest ytdScore (it's the same per center per year, just take it)
          const existing = byCode[code];
          if (!existing || (e.ytdScore || 0) > (existing.ytdScore || 0) || (e.ytdScore === existing.ytdScore && (e.tcsScore || 0) > (existing.tcsScore || 0))) {
            byCode[code] = e;
          }
        });
        const sorted = Object.values(byCode)
          .map(e => {
            // Priority: Excel Monthly Average > single month score
            const score = (e.centerYtdScore || 0) > 0 ? e.centerYtdScore : (e.tcsScore || 0);
            return { ...e, _accScore: score };
          })
          .filter(e => e._accScore > 0)
          .sort((a, b) => {
              if (appMode?.startsWith('PQA')) {
                 const rankA = a.centerYtdRank > 0 ? a.centerYtdRank : 999;
                 const rankB = b.centerYtdRank > 0 ? b.centerYtdRank : 999;
                 if (rankA !== rankB) return rankA - rankB;
              }
              return b._accScore - a._accScore;
          });

        let currentRank = 1;
        return sorted.map((e, i) => {
          if (i > 0 && e._accScore < sorted[i - 1]._accScore) currentRank++;
          if (appMode?.startsWith('PQA')) {
              return { ...e, avgScore: e._accScore, displayRank: e.centerYtdRank || currentRank, monthCount: 1 };
          }
          return { ...e, avgScore: e._accScore, displayRank: currentRank, monthCount: 1 };
        });
      }
    }

    // ── TCS / non-PQA quarterly mode ─────────────────────────────────────────
    if (!effectiveQuarterKey) return [];
    const [q, y] = effectiveQuarterKey.split('-');
    const bucket = {};
    engineers.forEach(e => {
      const yNorm = normalizeYearKey(e.year);
      if (!yNorm || yNorm !== y) return;
      const monthQ = e.month ? getQuarter(e.month) : '';
      let qField = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
      if (/^[1-4]$/.test(qField)) qField = `Q${qField}`;
      const inQuarter = monthQ === q || qField === q;
      if (!inQuarter) return;
      const codeKey = String(e.code || '').trim().toUpperCase() || e.id;
      if (!codeKey) return;
      if (!bucket[codeKey]) bucket[codeKey] = [];
      bucket[codeKey].push(e);
    });
    return Object.values(bucket)
      .map((rows) => {
        const sorted = [...rows].sort((a, b) => {
          const ya = parseInt(String(a.year), 10);
          const yb = parseInt(String(b.year), 10);
          if (yb !== ya) return yb - ya;
          return getMonthIndex(b.month) - getMonthIndex(a.month);
        });
        const pick = sorted[0];
        const ts = parseFloat(pick.tcsScore);
        return {
          ...pick,
          avgScore: Number.isFinite(ts) ? Number(ts.toFixed(1)) : 0,
          monthCount: rows.length,
          displayRank: 0,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((e, i, arr) => {
        if (i === 0 || e.avgScore < arr[i - 1].avgScore) e.displayRank = i + 1;
        else e.displayRank = arr[i - 1].displayRank;
        return e;
      });
  }, [engineers, deduplicatedEngineers, effectiveQuarterKey, appMode, pqaMxGroupBy]);

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
          .filter(e => e.month?.toLowerCase() === record.month?.toLowerCase() && sameCalendarYear(e.year, record.year))
          .sort((a, b) => b.tcsScore - a.tcsScore);
        const rank = cohort.findIndex(e => e.id === record.id) + 1;
        const qKey = `${getQuarter(record.month)}-${record.year}`;
        const qCohort = (() => {
          const [q, yr] = qKey.split('-');
          const bucket = {};
          engineers.forEach(e => {
            if (!e.month || !e.year) return;
            if (getQuarter(e.month) === q && sameCalendarYear(e.year, yr)) {
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
      .filter(e => e.month?.toLowerCase() === selectedEngineer.month?.toLowerCase() && sameCalendarYear(e.year, selectedEngineer.year))
      .sort((a, b) => b.tcsScore - a.tcsScore);
    const monthRank = monthCohort.findIndex(e => e.id === selectedEngineer.id) + 1;
    const q = getQuarter(selectedEngineer.month);
    const y = selectedEngineer.year;
    const qBucket = {};
    engineers.forEach(e => {
      if (!e.month || !e.year) return;
      if (getQuarter(e.month) === q && sameCalendarYear(e.year, y)) {
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


  /** Digits-only comparison for long numeric service center / engineer IDs (handles spaced display). */
  const serviceCenterDigitsMatch = (storedCode, queryRaw) => {
    const qd = String(queryRaw ?? '').replace(/\D/g, '');
    const sd = String(storedCode ?? '').replace(/\D/g, '');
    if (qd.length < 4 || sd.length < 4) return false;
    return qd === sd;
  };

  /** Match Excel/Firestore engineer codes: ignore spaces/commas; case-insensitive text; numeric equality (Excel number cells). */
  const engineerCodeMatchesQuery = (storedCode, queryRaw) => {
    const q = String(queryRaw ?? '').replace(/[\s\u00a0\u2000-\u200b\u202f\u2060]/g, '').replace(/,/g, '').trim();
    const s = String(storedCode ?? '').replace(/[\s\u00a0\u2000-\u200b\u202f\u2060]/g, '').replace(/,/g, '').trim();
    if (!q || !s) return false;
    if (s.toUpperCase() === q.toUpperCase()) return true;
    if (serviceCenterDigitsMatch(storedCode, queryRaw)) return true;
    const qf = parseFloat(q);
    const sf = parseFloat(s);
    if (Number.isFinite(qf) && Number.isFinite(sf) && qf === sf) return true;
    if (/^\d+$/.test(q) && /^\d+$/.test(s)) {
      try {
        return BigInt(q) === BigInt(s);
      } catch { /* ignore */ }
    }
    return false;
  };

  const resolvePqaTcsScore = resolvePqaTcsScorePure;
  const mergePqaKpiFromRecords = mergePqaKpiFromRecordsPure;

  /** PQA dossier: merge all Firestore rows for this service center + division so KPI snapshot is never sparse. */
  const pqaDossierEngineer = useMemo(() => {
    if (!selectedEngineer || !isPqaMode) return null;
    const selBranch = selectedEngineer.pqaBranch || appMode;
    const sameCode = engineers.filter((e) => {
      if (selBranch && e.pqaBranch && e.pqaBranch !== selBranch) return false;
      return engineerCodeMatchesQuery(e.code, selectedEngineer.code);
    });
    return mergePqaKpiFromRecords(selectedEngineer, sameCode);
  }, [selectedEngineer, engineers, appMode, isPqaMode]);

  const pqaProfileSubject =
    !selectedEngineer ? null : isPqaMode ? (pqaDossierEngineer || selectedEngineer) : selectedEngineer;
  const pqaAccumulatedScore = !pqaProfileSubject
    ? 0
    : parseFloat(pqaProfileSubject.centerYtdScore || pqaProfileSubject.ytdScore || 0);

  const handleSearch = () => {
    const trimmed = searchCode.trim();
    if (!trimmed) {
      message.warning("Please enter a code or name to verify.");
      return;
    }

    if (portalRealm === 'TCS' && !appMode?.startsWith('TCS')) {
      message.error('You are in the TCS portal — open the Dashboard and select TCS MX, DA, or AV (top strip), then search by engineer code.');
      return;
    }
    if (portalRealm === 'PQA' && !appMode?.startsWith('PQA')) {
      message.error('You are in the PQA portal — open the Dashboard and select PQA MX or CE, then search by service center code.');
      return;
    }

    if (engineers.length === 0) {
      message.error(`No data loaded for ${appMode}. Please check admin portal.`);
      return;
    }

    const cleanSearch = trimmed.replace(/\s+/g, '').toUpperCase();

    const pqaBranchMatches = (e) => !e.pqaBranch || e.pqaBranch === appMode;

    // 1. Try code match (engineer code for TCS; service center code for PQA — same `code` field)
    let matchingRecords = engineers.filter((e) => engineerCodeMatchesQuery(e.code, trimmed));
    let openedByExactCode = matchingRecords.length > 0;

    if (appMode?.startsWith('PQA')) {
      const before = matchingRecords.length;
      matchingRecords = matchingRecords.filter(pqaBranchMatches);
      if (before > 0 && matchingRecords.length === 0) {
        message.error(
          `Service center "${trimmed}" may exist in the other PQA division (MX vs CE). Use the top strip to select ${appMode === 'PQA_CE' ? 'PQA MX' : 'PQA CE'} if the data was uploaded there, or re-import the correct workbook.`
        );
        return;
      }
    }

    // 2. If no code match, try name match
    if (matchingRecords.length === 0) {
      matchingRecords = engineers.filter(
        e => String(e.name || '').replace(/\s+/g, '').toUpperCase().includes(cleanSearch)
      );
      openedByExactCode = false;
      if (appMode?.startsWith('PQA')) {
        matchingRecords = matchingRecords.filter(pqaBranchMatches);
      }
    }

    if (matchingRecords.length === 0) {
      message.error(`${searchIsPqaContext ? 'Service center' : 'Engineer'} "${trimmed}" not found in current records for ${appMode || 'this division'}.`);
      return;
    }

    const sortByRecency = (a, b) => {
      const ya = parseInt(a.year) || 0, yb = parseInt(b.year) || 0;
      if (yb !== ya) return yb - ya;
      return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
    };

    const pqaHasEvalKpi = (e) =>
      ['ltp', 'exLtp', 'redo', 'ssr', 'dRnps', 'ofs', 'rCxe', 'sdr'].some((k) => parseFloat(e[k] || 0) !== 0) ||
      parseFloat(e.audit || 0) !== 0 ||
      parseFloat(e.pr || 0) !== 0;

    let newestRecord;
    if (searchIsPqaContext) {
      const withKpi = matchingRecords.filter(pqaHasEvalKpi);
      const pool = withKpi.length ? withKpi : matchingRecords;
      const sorted = [...pool].sort(sortByRecency);
      newestRecord = mergePqaKpiFromRecords(sorted[0], matchingRecords);
    } else {
      const sorted = [...matchingRecords].sort(sortByRecency);
      newestRecord = sorted[0];
    }

    setSelectedEngineer(newestRecord);
    setProfileOpenedByExactCode(openedByExactCode);

    // Setup period defaults for profile view
    setSelectedProfileMonth(`${newestRecord.month}-${newestRecord.year}`);
    const q = getQuarter(newestRecord.month);
    const qKey = q ? `${q}-${newestRecord.year}` : null;
    if (openedByExactCode) {
      setProfileViewMode('QUARTERLY');
      if (qKey) setSelectedProfileQuarter(qKey);
    } else {
      setProfileViewMode('MONTHLY');
      if (qKey) setSelectedProfileQuarter(qKey);
    }
    
    // Execute transition
    navigateTo('ENGINEER_PROFILE');
    setShowRankReveal(appMode !== 'PQA_MX');
    message.success(`Dossier found: ${String(newestRecord.code || newestRecord.name || '').trim()}`);
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
      if (foundAdmin.username === 'fawzy.m' || foundAdmin.username === 'g.samir') {
        foundAdmin.role = 'SUPER_ADMIN';
        foundAdmin.access = 'ALL';
      }
      
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

  const seedDatabase = async () => {
    setIsSaving(true);
    const hide = message.loading("Seeding database with initial data...", 0);
    try {
      const promises = INITIAL_ENGINEERS.map(async (eng) => {
        // Ensure ID is generated for Firestore
        const engToSave = { ...eng, id: Date.now().toString() + Math.random().toString(36).substring(7) };
        return saveEngineerToDb(engToSave);
      });
      await Promise.all(promises);
      
      const updatedEngineers = await getEngineers();
      setEngineers(updatedEngineers);
      message.success("Database seeded successfully!");
      writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Seeded database', severity: 'info' });
    } catch (error) {
      console.error("Error seeding database:", error);
      message.error("Failed to seed database.");
    } finally {
      setIsSaving(false);
      hide();
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userName');
    setIsLogged(false);
    setCurrentUser(null);
    message.success("Session cleared. Please try logging in again.");
    window.location.reload();
  };

  const handleLogout = () => {
    writeLog({ type: 'ADMIN_LOGOUT', actor: currentUser?.username || 'admin', action: 'Admin logged out', severity: 'info' });
    setCurrentUser(null);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userName');
    setIsLogged(false);
    setView('HOME');
  };

  const handleClearTcsDivisionData = async (mode) => {
    const col = resolveFirestoreCollection(mode);
    const short = mode === 'TCS_MX' ? 'MX' : mode === 'TCS_DA' ? 'DA' : 'AV';
    try {
      const list = await getEngineers(col);
      if (list.length === 0) {
        message.info(`No records in TCS ${short}.`);
        return;
      }
      if (!window.confirm(`⚠️ Archive ALL ${list.length} records in TCS ${short} (${col})?`)) return;
      await Promise.all(list.map((e) => archiveEngineer(e.id, col)));
      if (resolveFirestoreCollection(appMode) === col) setEngineers([]);
      message.success(`TCS ${short} data cleared.`);
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        action: `Clear TCS ${short}`,
        details: { count: list.length, collection: col },
        severity: 'warning',
      });
    } catch (err) {
      console.error(err);
      message.error('Failed to clear division data.');
    }
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
      const isPqa = appMode?.startsWith('PQA');
      const newScore = isPqa
        ? calculatePQAScore(updated)
        : (() => {
            const manual = parseFloat(updated.tcsScore);
            if (!Number.isFinite(manual)) return 0;
            return Math.min(100, Math.max(0, Number(manual.toFixed(1))));
          })();
      const newTier = getTier(newScore);

      let finalPhotoUrl = updated.photoUrl;

      // If a new file is pending upload
      if (updated.pendingFile) {
        try {
          const folder = isPqa ? 'PQA' : getTcsStorageFolder();
          const url = await uploadPhoto(updated.pendingFile, folder, updated.code.toUpperCase() || 'unknown', { stableFileName: true });
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
          `⚠️ A record for ${finalEng.month} ${finalEng.year} already exists for ${finalEng.name}.

Do you want to UPDATE the existing record? Click OK to update, or Cancel to abort.`
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

      const savedId = await saveEngineerToDb(finalEng, colName);
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
      role: newAdminData.role || 'ADMIN',
      access: newAdminData.access || 'TCS_ONLY',
      createdAt: new Date().toISOString()
    };

    try {
      await saveAdminToDb(newAdmin);
      setAdmins(prev => [...prev, newAdmin]);
      setNewAdminData({ username: '', password: '', name: '', role: 'ADMIN', access: 'TCS_ONLY' });
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
          await archiveEngineer(id, colName);
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

  const bulkArchiveEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can use bulk delete.');
      return;
    }
    if (bulkSelectedIds.length === 0) {
      message.warning('Select records first.');
      return;
    }

    modal.confirm({
      title: `Bulk Delete (${bulkSelectedIds.length})`,
      content: `Archive ${bulkSelectedIds.length} selected records from ${appMode}? This can be restored from Archives.`,
      okText: 'Archive Selected',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(bulkSelectedIds.map((id) => archiveEngineer(id, colName)));

          const idSet = new Set(bulkSelectedIds);
          const archived = engineers.filter((e) => idSet.has(e.id));
          setEngineers((prev) => prev.filter((e) => !idSet.has(e.id)));
          setFetchedHiddenEngineers((prev) => [...prev, ...archived.map((e) => ({ ...e, hidden: true }))]);
          if (selectedEngineer && idSet.has(selectedEngineer.id)) setSelectedEngineer(null);
          setBulkSelectedIds([]);

          message.success(`${archived.length} records archived.`);
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk archived ${appMode} records`,
            details: { count: archived.length, ids: bulkSelectedIds.slice(0, 30) },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Bulk archive failed:', error);
          message.error('Failed to bulk archive selected records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk archiving ${appMode}`,
            details: { count: bulkSelectedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
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
          await saveEngineerToDb({ id, hidden: false }, colName);
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

  const bulkRestoreEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can use bulk restore.');
      return;
    }
    if (bulkSelectedArchivedIds.length === 0) {
      message.warning('Select archived records first.');
      return;
    }

    modal.confirm({
      title: `Bulk Restore (${bulkSelectedArchivedIds.length})`,
      content: `Restore ${bulkSelectedArchivedIds.length} archived records to ${appMode}?`,
      okText: 'Restore Selected',
      onOk: async () => {
        try {
          await Promise.all(bulkSelectedArchivedIds.map((id) => saveEngineerToDb({ id, hidden: false }, colName)));
          const idSet = new Set(bulkSelectedArchivedIds);
          const restored = fetchedHiddenEngineers.filter((e) => idSet.has(e.id));
          setFetchedHiddenEngineers((prev) => prev.filter((e) => !idSet.has(e.id)));
          setEngineers((prev) => [...prev, ...restored.map((e) => ({ ...e, hidden: false }))]);
          setBulkSelectedArchivedIds([]);
          message.success(`${restored.length} archived records restored.`);
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk restored ${appMode} records`,
            details: { count: restored.length, ids: bulkSelectedArchivedIds.slice(0, 30) },
            severity: 'info'
          });
        } catch (error) {
          console.error('Bulk restore failed:', error);
          message.error('Failed to bulk restore selected archived records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk restoring ${appMode}`,
            details: { count: bulkSelectedArchivedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const deleteArchivedEngineerHandler = async (id) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can permanently delete.');
      return;
    }
    modal.confirm({
      title: 'Permanent Delete',
      content: 'This will permanently remove the archived record from database. This action cannot be undone.',
      okText: 'Delete Permanently',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEngineerPermanent(id, colName);
          setFetchedHiddenEngineers((prev) => prev.filter((e) => e.id !== id));
          setBulkSelectedArchivedIds((prev) => prev.filter((x) => x !== id));
          message.success('Archived record permanently deleted.');
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Permanently deleted archived ${appMode} record`,
            details: { id },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Permanent delete failed:', error);
          message.error('Failed to permanently delete archived record.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error permanently deleting archived ${appMode}`,
            details: { id, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const bulkDeleteArchivedEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can permanently delete.');
      return;
    }
    if (bulkSelectedArchivedIds.length === 0) {
      message.warning('Select archived records first.');
      return;
    }
    modal.confirm({
      title: `Permanent Delete (${bulkSelectedArchivedIds.length})`,
      content: `Permanently delete ${bulkSelectedArchivedIds.length} archived records from ${appMode}? This cannot be undone.`,
      okText: 'Delete Permanently',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(bulkSelectedArchivedIds.map((id) => deleteEngineerPermanent(id, colName)));
          const idSet = new Set(bulkSelectedArchivedIds);
          setFetchedHiddenEngineers((prev) => prev.filter((e) => !idSet.has(e.id)));
          setBulkSelectedArchivedIds([]);
          message.success('Selected archived records permanently deleted.');
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk permanently deleted archived ${appMode} records`,
            details: { count: bulkSelectedArchivedIds.length, ids: bulkSelectedArchivedIds.slice(0, 30) },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Bulk permanent delete failed:', error);
          message.error('Failed to permanently delete selected archived records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk permanently deleting archived ${appMode}`,
            details: { count: bulkSelectedArchivedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const downloadTcsDivisionTemplate = (division) => {
    const short =
      division === 'TCS_MX' ? 'MX' : division === 'TCS_DA' ? 'DA' : division === 'TCS_AV' || division === 'TCS_VD' ? 'AV' : 'MX';
    const wb = XLSX.utils.book_new();
    const tcsHeaders = [
      ["Quarter", "Engineer Code", "SBA ID", "ASC Engineer", "PhotoURL", "ASC", "PartnerName", "Product", "Month", "Year", "EngineerEvaluation", "SSR", "RRR", "IQCSkipRatio", "CoreParts", "Q1Training", "DRNPS", "ExamScore", "Promoters", "Detractors", "TCS Score"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(tcsHeaders);
    XLSX.utils.book_append_sheet(wb, ws, "TCS Scores");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TCS_Score_Template_${short}_2026.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const isPqaMode = appMode === 'PQA_MX' || appMode === 'PQA_CE';

    if (!isPqaMode) {
      const div =
        appMode === 'TCS_DA' ? 'TCS_DA' : appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'TCS_AV' : 'TCS_MX';
      downloadTcsDivisionTemplate(div);
      return;
    }

    const wb = XLSX.utils.book_new();
    const pqaHeaders = [
      ["Region", "ASCCode", "ASCName", "PhotoURL", "PartnerName", "Month", "Year", "LTP", "EX-LTP", "REDO", "SSR", "D-RNPS", "OFS", "R-CXE", "SDR", "Audit", "PR"]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(pqaHeaders);
    XLSX.utils.book_append_sheet(wb, ws1, "★Evaluation point");

    const avgHeaders = [
      ["ASC Code", "ASC name", "Average Score by month", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(avgHeaders);
    XLSX.utils.book_append_sheet(wb, ws2, "★Monthly Average");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PQA_Score_Template_${appMode}_2026.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExcelUpload = async (e, options = {}) => {
    const { targetTcsMode } = options;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });

      const isPqaMode = appMode?.startsWith('PQA');
      const uploadCol = resolveFirestoreCollection(isPqaMode ? appMode : (targetTcsMode || appMode));
      let mergeList = engineers;
      try {
        mergeList = await getEngineers(uploadCol);
      } catch (err) {
        console.error('merge list fetch', err);
      }

      let uploadedRecords = [];

      const findSheet = (keyword) => {
        const name = workbook.SheetNames.find(n => n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')));
        return name ? workbook.Sheets[name] : null;
      };

      if (isPqaMode) {
        // ════════════════════════════════════════════════════════════
        // PQA MULTI-SHEET PARSER
        // ════════════════════════════════════════════════════════════
        const partnerRankMap = {};
        const ytdRankMap = {};
        /** ASC code -> canonical partner id from ★Partner Ranking column A. */
        const codeToOfficialPartner = {};

        // ── 1. Parse Partner Ranking (Master records for all months) ──
        const prSheet = findSheet('PartnerRanking') || findSheet('Partner');
        if (prSheet) {
          const prRows = XLSX.utils.sheet_to_json(prSheet, { header: 1, raw: false });

          // ── Detect header rows ──────────────────────────────────────────────
          // The sheet has 2 header rows:
          //   Row A (group row): "Partner" | blank | blank | "2026 Acc" | "Jan" | "Feb" ...
          //   Row B (col  row):  blank | "ASC Code" | "ASC Name" | "Ave Score" | "Ranking" | "Branch Score" | ...
          let prGroupRowIdx = -1;  // row with "Partner" label and month group names
          let prColRowIdx   = -1;  // row with "ASC Code"

          for (let i = 0; i < Math.min(prRows.length, 40); i++) {
            const r = prRows[i] || [];
            const rowText = r.map(v => String(v || '').toLowerCase().trim());
            if (rowText.includes('asc code')) { prColRowIdx = i; break; }
            // group row is the one containing "partner" in col 0 or col 1
            if ((rowText[0] === 'partner' || rowText[1] === 'partner') && prGroupRowIdx === -1) {
              prGroupRowIdx = i;
            }
          }
          if (prColRowIdx === -1) { prGroupRowIdx = -1; } // need both

          const groupRow  = prGroupRowIdx >= 0 ? (prRows[prGroupRowIdx] || []) : [];
          const colRow    = prColRowIdx   >= 0 ? (prRows[prColRowIdx]   || []) : [];

          // ── Map column indices from colRow ──────────────────────────────────
          let prPartnerCol = 0;       // Column A always holds partner name
          let prCodeCol    = -1;
          let prNameCol    = -1;
          let prAccScoreCol = -1;     // "2026 Acc" → Ave Score
          let prAccRankCol  = -1;     // "2026 Acc" → Ranking

          // Find "partner" in groupRow to confirm column 0
          for (let j = 0; j < groupRow.length; j++) {
            if (String(groupRow[j] || '').toLowerCase().trim() === 'partner') { prPartnerCol = j; break; }
          }

          // Scan colRow for ASC Code, ASC Name, and Partner
          for (let j = 0; j < colRow.length; j++) {
            const v = String(colRow[j] || '').toLowerCase().trim();
            const nv = v.replace(/[^a-z]/g, '');
            if (v === 'asc code' || nv === 'asccode' || (v.includes('code') && (v.includes('asc') || v.includes('center')))) prCodeCol = j;
            if (v === 'asc name' || nv === 'ascname' || (v.includes('name') && (v.includes('asc') || v.includes('center')))) prNameCol = j;
            if (v === 'partner' || nv === 'partnername') prPartnerCol = j;
          }

          // Scan groupRow for "2026 Acc" block, then read colRow for Ave Score + Ranking within that block
          let accBlockStart = -1, accBlockEnd = -1;
          for (let j = 0; j < groupRow.length; j++) {
            const g = String(groupRow[j] || '').toLowerCase().replace(/\s/g, '');
            if (g.includes('acc') || g.includes('2026acc')) {
              if (accBlockStart === -1) accBlockStart = j;
              accBlockEnd = j;
            }
          }
          // Find the next non-acc group column to bound the acc block
          if (accBlockStart !== -1) {
            for (let j = accBlockStart; j <= Math.min(accBlockEnd + 4, colRow.length - 1); j++) {
              const v = String(colRow[j] || '').toLowerCase().trim();
              if ((v.includes('ave') || v.includes('avg')) && v.includes('score')) prAccScoreCol = j;
              if (v === 'ranking' || (v.includes('rank') && !v.includes('partner'))) prAccRankCol = j;
            }
          }
          // Samsung MX requirement: accumulated partner dashboard values come strictly from D/E.
          // With ASC Code in B, D=Ave. Score and E=Ranking.
          if (prCodeCol > -1) {
            prAccScoreCol = prCodeCol + 2;
            prAccRankCol = prCodeCol + 3;
          }

          // ── Detect monthly blocks from groupRow ─────────────────────────────
          // Each month group: "Jan" / "Feb" etc. appears in groupRow with merged span
          // Within that span, colRow has: Branch Score | Ratio | Score(Weigh) | Partner Score | Partner Rank
          const prMonths = [];
          for (let j = 0; j < groupRow.length; j++) {
            const val = String(groupRow[j] || '').trim();
            if (!val) continue;
            const m = val.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\s_']*(2\d|\d{4}))?$/i);
            if (m) {
              prMonths.push({
                month: m[1].charAt(0).toUpperCase() + m[1].slice(1, 3).toLowerCase(),
                year: m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : '2026',
                startCol: j
              });
            }
          }

          // For each month block, locate exact sub-columns using colRow
          prMonths.forEach((mb, mi) => {
            const blockEnd = mi + 1 < prMonths.length ? prMonths[mi + 1].startCol : mb.startCol + 8;
            mb.branchScoreCol  = -1;
            mb.partnerScoreCol = -1;
            mb.partnerRankCol  = -1;
            for (let c = mb.startCol; c < Math.min(blockEnd, colRow.length); c++) {
              const h = String(colRow[c] || '').toLowerCase().trim();
              if ((h.includes('branch') || h === 'score' || h.includes('score')) && mb.branchScoreCol === -1) mb.branchScoreCol = c;
              if (h.includes('partner') && h.includes('score')) mb.partnerScoreCol = c;
              if (h.includes('partner') && h.includes('rank')) mb.partnerRankCol  = c;
            }
            // Fallbacks by offset if header names didn't match
            if (mb.branchScoreCol  === -1) mb.branchScoreCol  = mb.startCol;
            if (mb.partnerScoreCol === -1) mb.partnerScoreCol = mb.startCol + 3;
            if (mb.partnerRankCol  === -1) mb.partnerRankCol  = mb.startCol + 4;
          });

          // ── Iterate data rows ───────────────────────────────────────────────
          let lastPartnerName = '';  // carry-forward for merged cells in col A
          let lastPartnerAscCode = '';
          /** Samsung sheets merge D/E vertically — only first row has values; carry within partner block. */
          let lastPartnerKeyForAcc = '';
          let lastPrAccScore = 0;
          let lastPrAccRank = 0;
          /** Best accumulated score/rank seen for each partner (all ASC rows get this for dashboard). */
          const partnerAccumFromRanking = {};
          /** Last seen partner label (column A) per ASC — used to apply canonical partner D/E. */
          const ascToPartnerName = {};

          if (prCodeCol < 0 && prPartnerCol === 0) {
            prCodeCol = 1;
            if (prAccScoreCol < 0) prAccScoreCol = prCodeCol + 2;
            if (prAccRankCol < 0) prAccRankCol = prCodeCol + 3;
          }

          const applyPartnerAccumCarry = (cellPartnerRaw, parsedAcc, parsedRank) => {
            const cellPartner = String(cellPartnerRaw || '').trim();
            if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
              const nk = normalizePqaPartnerKey(cellPartner);
              if (lastPartnerKeyForAcc && nk !== lastPartnerKeyForAcc) {
                lastPrAccScore = 0;
                lastPrAccRank = 0;
              }
              lastPartnerKeyForAcc = nk;
            }
            if (parsedAcc > 0) lastPrAccScore = parsedAcc;
            if (parsedRank > 0) lastPrAccRank = parsedRank;
            const accScore = parsedAcc > 0 ? parsedAcc : lastPrAccScore;
            const accRank = parsedRank > 0 ? parsedRank : lastPrAccRank;
            return { accScore, accRank };
          };

          if (prColRowIdx < 0) {
            console.warn('PQA: ★Partner Ranking — no "ASC Code" header row found in first 40 rows; skipped.');
          }

          for (let i = prColRowIdx >= 0 ? prColRowIdx + 1 : prRows.length; i < prRows.length; i++) {
            const r = prRows[i] || [];
            const rawPc = r[prCodeCol];
            const rawPcStr = rawPc === undefined || rawPc === null ? '' : String(rawPc).trim();
            let pCode;
            if (!rawPcStr) {
              if (!lastPartnerAscCode) continue;
              pCode = lastPartnerAscCode;
            } else {
              pCode = String(rawPc).replace(/[\s,]/g, '').trim().toUpperCase();
              if (!pCode || pCode === 'ASC CODE') continue;
              lastPartnerAscCode = pCode;
            }
            const pName = String(r[prNameCol] || pCode).trim();

            // Carry-forward partner name from merged Column A
            const cellPartner = String(r[prPartnerCol] || '').trim();
            if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
              lastPartnerName = cellPartner;
            }
            const partnerName = lastPartnerName;
            const pKeyPartner = normalizePqaPartnerKey(partnerName);
            if (partnerName) ascToPartnerName[pCode] = partnerName;

            // 2026 Accumulated data (D/E — use robust parse + vertical merge carry)
            const parsedAcc = prAccScoreCol > -1 ? parseExcelNumericCell(r[prAccScoreCol]) : 0;
            const parsedRank = prAccRankCol > -1 ? (parseInt(String(r[prAccRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0) : 0;
            const { accScore, accRank } = applyPartnerAccumCarry(cellPartner, parsedAcc, parsedRank);

            if (pKeyPartner && (accScore > 0 || accRank > 0)) {
              const prev = partnerAccumFromRanking[pKeyPartner] || { ytdScore: 0, ytdRank: 0 };
              if (accScore >= prev.ytdScore) {
                partnerAccumFromRanking[pKeyPartner] = {
                  ytdScore: accScore,
                  ytdRank: accRank > 0 ? accRank : prev.ytdRank,
                };
              } else if (accRank > 0 && !prev.ytdRank) {
                partnerAccumFromRanking[pKeyPartner] = { ...prev, ytdRank: accRank };
              }
            }

            if (accScore > 0 || accRank > 0) {
              ytdRankMap[pCode] = { ytdRank: accRank, ytdScore: accScore };
            }

            // Monthly data
            for (const mb of prMonths) {
              const branchScore   = parseExcelNumericCell(r[mb.branchScoreCol]);
              const pScore        = parseExcelNumericCell(r[mb.partnerScoreCol]);
              const pRank         = parseInt(String(r[mb.partnerRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;

              if (branchScore > 0 || pScore > 0 || pRank > 0 || accScore > 0) {
                const key = `${pCode}_${mb.month.toLowerCase()}_${mb.year}`;
                partnerRankMap[key] = {
                  code: pCode, name: pName, partnerName,
                  monthlyScore: branchScore,
                  monthlyRank: pRank, partnerScore: pScore,
                  accumulatedScore: accScore, accumulatedRank: accRank,
                  mName: mb.month, year: mb.year
                };
              }
            }
          }

          // Backfill: every ASC under a partner inherits ★Partner Ranking D/E block totals (merged cells).
          if (prColRowIdx >= 0 && Object.keys(partnerAccumFromRanking).length > 0) {
            lastPartnerName = '';
            lastPartnerAscCode = '';
            for (let i = prColRowIdx + 1; i < prRows.length; i++) {
              const r = prRows[i] || [];
              const rawPc = r[prCodeCol];
              const rawPcStr = rawPc === undefined || rawPc === null ? '' : String(rawPc).trim();
              let pCode;
              if (!rawPcStr) {
                if (!lastPartnerAscCode) continue;
                pCode = lastPartnerAscCode;
              } else {
                pCode = String(rawPc).replace(/[\s,]/g, '').trim().toUpperCase();
                if (!pCode || pCode === 'ASC CODE') continue;
                lastPartnerAscCode = pCode;
              }
              const cellPartner = String(r[prPartnerCol] || '').trim();
              if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
                lastPartnerName = cellPartner;
              }
              const partnerName = lastPartnerName;
              const pk = normalizePqaPartnerKey(partnerName);
              const agg = pk ? partnerAccumFromRanking[pk] : null;
              if (agg && (agg.ytdScore > 0 || agg.ytdRank > 0)) {
                ytdRankMap[pCode] = { ytdScore: agg.ytdScore, ytdRank: agg.ytdRank };
              }
            }
          }

          // Map sheet partner labels → canonical MX partners, then push D/E onto every ASC for that block.
          const officialPartnerFromSheet = {};
          for (const [pk, agg] of Object.entries(partnerAccumFromRanking)) {
            const off = mapPqaSheetPartnerKeyToOfficial(pk);
            if (!off || !agg) continue;
            const prev = officialPartnerFromSheet[off] || { ytdScore: 0, ytdRank: 0 };
            if ((agg.ytdScore || 0) > (prev.ytdScore || 0)) {
              officialPartnerFromSheet[off] = {
                ytdScore: agg.ytdScore,
                ytdRank: agg.ytdRank > 0 ? agg.ytdRank : prev.ytdRank,
              };
            } else if ((agg.ytdScore || 0) === (prev.ytdScore || 0) && agg.ytdRank > 0) {
              if (!prev.ytdRank || agg.ytdRank < prev.ytdRank) {
                officialPartnerFromSheet[off] = { ...prev, ytdRank: agg.ytdRank };
              }
            }
          }
          for (const [code, pn] of Object.entries(ascToPartnerName)) {
            const off = mapPqaSheetPartnerKeyToOfficial(normalizePqaPartnerKey(pn));
            const agg = off ? officialPartnerFromSheet[off] : null;
            if (!agg || (!(agg.ytdScore > 0) && !(agg.ytdRank > 0))) continue;
            if (off) codeToOfficialPartner[code] = off;
            const cur = ytdRankMap[code] || {};
            ytdRankMap[code] = {
              ...cur,
              ytdScore: agg.ytdScore > 0 ? agg.ytdScore : (parseFloat(cur.ytdScore) || 0),
              ytdRank: agg.ytdRank > 0 ? agg.ytdRank : (parseInt(String(cur.ytdRank || 0), 10) || 0),
            };
          }
        }

        // ── 2. Parse Evaluation point (PQA MX / CE only — ASC Code + monthly KPI bands; independent of TCS) ──
        const normEvName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const evalSheetNamePick =
          workbook.SheetNames.find((n) => normEvName(n).includes('evaluationpoint')) ||
          workbook.SheetNames.find((n) => {
            const x = normEvName(n);
            return x.includes('evaluation') && !x.includes('monthlyaverage') && !x.includes('monthaverage');
          }) ||
          null;
        const evalSheet =
          (evalSheetNamePick ? workbook.Sheets[evalSheetNamePick] : null) ||
          findSheet('Evaluation') ||
          findSheet('EvaluationPoint');
        if (evalSheet) {
          const evalRows = XLSX.utils.sheet_to_json(evalSheet, { header: 1, raw: false, defval: '' });
          const { partnerPatches, ytdPatches } = parsePqaEvaluationPointRows(evalRows, appMode);
          Object.entries(partnerPatches).forEach(([k, patch]) => {
            partnerRankMap[k] = { ...(partnerRankMap[k] || {}), ...patch };
          });
          Object.entries(ytdPatches).forEach(([code, ytd]) => {
            // Keep Partner Ranking (★Partner Ranking D/E accumulated) as source of truth when present.
            const prev = ytdRankMap[code] || {};
            ytdRankMap[code] = {
              ...prev,
              ytdScore: (parseFloat(prev.ytdScore || 0) > 0) ? prev.ytdScore : (ytd.ytdScore || prev.ytdScore || 0),
              ytdRank: (parseInt(String(prev.ytdRank || 0), 10) > 0) ? prev.ytdRank : (ytd.ytdRank || prev.ytdRank || 0),
              centerYtdScore: prev.centerYtdScore || ytd.centerYtdScore || 0,
              centerYtdRank: prev.centerYtdRank || ytd.centerYtdRank || 0,
            };
          });
        }
        // ── 3. Parse Monthly Average for Center Accumulated Score ──
        const avgSheet = findSheet('MonthlyAverage') || findSheet('Monthly Average') || findSheet('Average');
        if (avgSheet) {
          const avgRows = XLSX.utils.sheet_to_json(avgSheet, { header: 1, raw: false });
          let aCodeCol = -1, aNameCol = -1, aScoreCol = -1, aYtdRankCol = -1, aPartnerCol = -1;
          let aMonthCols = [];
          let headerRowIdx = 1;

          for (let i = 0; i < Math.min(avgRows.length, 10); i++) {
             const r = avgRows[i] || [];
             if (r.some(v => String(v).toLowerCase().replace(/\s/g, '') === 'asccode')) {
                headerRowIdx = i;
                break;
             }
          }
          
          const colRow = avgRows[headerRowIdx] || [];
          const monthRow = avgRows[headerRowIdx + 1] || [];

          for (let j = 0; j < Math.max(colRow.length, monthRow.length); j++) {
             const cName = String(colRow[j] || '').toLowerCase().trim();
             const cn = cName.replace(/[^a-z]/g, '');
             if (cn === 'asccode' || (cName.includes('code') && (cName.includes('asc') || cName.includes('center')))) aCodeCol = j;
             if (cn === 'ascname' || (cName.includes('name') && (cName.includes('asc') || cName.includes('center')))) aNameCol = j;
             if (cName.includes('partner')) aPartnerCol = j;

             if (cName.includes('score') && String(monthRow[j] || '').toLowerCase().replace(/\s/g, '') === 'bymonth') {
                 aScoreCol = j;
                 if (String(colRow[j+1] || '').toLowerCase().includes('rank')) aYtdRankCol = j + 1;
             }
             
             const mStr = String(monthRow[j] || '').trim();
             if (mStr) {
                const mMatch = mStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\s_']*(2\d|\d{4}))?$/i);
                if (mMatch && cName === 'score') {
                   const mName = mMatch[1].charAt(0).toUpperCase() + mMatch[1].slice(1, 3).toLowerCase();
                   const mYear = mMatch[3] ? (mMatch[3].length === 2 ? '20' + mMatch[3] : mMatch[3]) : '2026';
                   let rankCol = j + 1;
                   if (String(colRow[j+1] || '').toLowerCase().includes('rank')) rankCol = j + 1;
                   aMonthCols.push({ month: mName, year: mYear, scoreCol: j, rankCol: rankCol });
                }
             }
          }

          // CE/MX Samsung fallback: ASC Code in B, Acc score in D, Acc rank in E.
          if (aCodeCol > -1 && aScoreCol < 0) aScoreCol = aCodeCol + 2;
          if (aCodeCol > -1 && aYtdRankCol < 0) aYtdRankCol = aCodeCol + 3;

          // If month headers weren't detected (common in CE templates), use fixed month pairs after Acc block:
          // Jan(F/G), Feb(H/I), Mar(J/K), ...
          if (aCodeCol > -1 && aMonthCols.length === 0) {
            let defaultYear = '2026';
            for (let rr = 0; rr < Math.min(avgRows.length, 6); rr++) {
              const rowTxt = (avgRows[rr] || []).join(' ');
              const ym = String(rowTxt).match(/(20\d{2})/);
              if (ym) { defaultYear = ym[1]; break; }
            }
            for (let mi = 0; mi < MONTH_ORDER.length; mi++) {
              const scoreCol = aCodeCol + 4 + mi * 2;
              const rankCol = scoreCol + 1;
              if (scoreCol >= Math.max(colRow.length, monthRow.length) + 20) break;
              aMonthCols.push({
                month: pqaShortMonthDisplayName(MONTH_ORDER[mi]),
                year: defaultYear,
                scoreCol,
                rankCol,
              });
            }
          }

          if (aCodeCol > -1) {
             for (let i = headerRowIdx + 2; i < avgRows.length; i++) {
                const r = avgRows[i] || [];
                const pCode = String(r[aCodeCol]).replace(/[\s,]/g, '').trim().toUpperCase();
                if (!pCode || pCode === 'ASC CODE') continue;
                
                const centerYtdScore = aScoreCol > -1 ? parseExcelNumericCell(r[aScoreCol]) : 0;
                const centerYtdRank = parseInt(String(r[aYtdRankCol]).replace(/[^0-9]/g, '')) || 0;
                
                if (centerYtdScore > 0 || centerYtdRank > 0) {
                   if (!ytdRankMap[pCode]) ytdRankMap[pCode] = { ytdScore: 0, ytdRank: 0 };
                   if (centerYtdScore > 0) ytdRankMap[pCode].centerYtdScore = centerYtdScore;
                   if (centerYtdRank > 0) ytdRankMap[pCode].centerYtdRank = centerYtdRank;
                }
                
                for (const mc of aMonthCols) {
                   const mScore = parseExcelNumericCell(r[mc.scoreCol]);
                   const mRank = parseInt(String(r[mc.rankCol]).replace(/[^0-9]/g, '')) || 0;
                    if (mScore > 0 || mRank > 0) {
                      const key = `${pCode}_${mc.month.toLowerCase()}_${mc.year}`;
                      if (!partnerRankMap[key]) {
                         partnerRankMap[key] = { 
                           code: pCode, 
                           name: aNameCol > -1 ? String(r[aNameCol] || pCode).trim() : pCode,
                           partnerName: aPartnerCol > -1 ? String(r[aPartnerCol] || '').trim() : '',
                           mName: mc.month, 
                           year: mc.year 
                         };
                      } else {
                        if (aNameCol > -1 && (!partnerRankMap[key].name || partnerRankMap[key].name === pCode)) {
                          partnerRankMap[key].name = String(r[aNameCol] || pCode).trim();
                        }
                        if (aPartnerCol > -1 && !partnerRankMap[key].partnerName) {
                          partnerRankMap[key].partnerName = String(r[aPartnerCol] || '').trim();
                        }
                      }
                      if (mScore > 0) partnerRankMap[key].centerMonthlyScore = mScore;
                      if (mRank > 0) partnerRankMap[key].centerMonthlyRank = mRank;
                   }
                }
             }
          }
        }

        for (const [key, rd] of Object.entries(partnerRankMap)) {
           const hasAnyData = rd.monthlyScore || rd.partnerScore || rd.monthlyRank || rd.monthlyEvalRank || rd.ltp || rd.ltpVd || rd.ltpDa || rd.evalMonthlyScore || rd.centerMonthlyScore || rd.tc || rd.sdr || rd.audit || rd.ofs || rd.ssr || rd.rCxe || rd.coa || rd.switching || rd.owRnps || rd.dRnps || rd.nps || rd.npsDr || rd.appointments || rd.pr || rd.exLtp || rd.redo || rd.redoVd || rd.redoDa;
           if (!hasAnyData) continue;
           const ytd = ytdRankMap[rd.code] || {};
           const prVal = rd.pr || 0;
           const capDefaults = appMode === 'PQA_CE' ? PQA_KPI_DEFAULTS_CE : PQA_KPI_DEFAULTS_MX;
           const kpiDerived = calculatePQAScore({
             ltp: rd.ltp || 0, exLtp: rd.exLtp || 0, redo: rd.redo || 0, ssr: rd.ssr || 0, dRnps: rd.dRnps || 0,
             ofs: rd.ofs || 0, rCxe: rd.rCxe || 0, sdr: rd.sdr || 0, audit: rd.audit || 0, pr: prVal,
           });
          // CE: monthly score/rank source is ★Monthly Average.
          // MX: monthly total source is ★Evaluation point (Σpoint), then other monthly sources.
          const rawExcel = appMode === 'PQA_CE'
            ? (rd.centerMonthlyScore ?? rd.monthlyScore ?? rd.evalMonthlyScore)
            : (rd.evalMonthlyScore ?? rd.monthlyScore ?? rd.centerMonthlyScore);
           let tcsVal = kpiDerived;
           if (rawExcel != null && rawExcel !== '' && Number.isFinite(Number(rawExcel))) {
             const n = Number(rawExcel);
            if (appMode === 'PQA_CE') {
              if (n > 0) tcsVal = Number(n.toFixed(1));
            } else {
              if (n > 0 && n <= 100) tcsVal = Number(n.toFixed(1));
              else if (n > 100) tcsVal = kpiDerived;
            }
           }
          const canonicalPartner = codeToOfficialPartner[rd.code] || mapPqaSheetPartnerKeyToOfficial(rd.partnerName || '');
          const pqaRecord = {
              id: '', region: rd.region || '', code: rd.code || 'Unknown', name: rd.name || rd.code || 'Unknown',
             photoUrl: 'https://picsum.photos/200', partnerName: canonicalPartner || rd.partnerName || 'N/A',
              month: rd.mName || 'Unknown', year: rd.year || '2026',
              pqaBranch: appMode,
              ltp: rd.ltp||0, ltpVd: rd.ltpVd||0, ltpDa: rd.ltpDa||0, exLtp: rd.exLtp||0, redo: rd.redo||0, redoVd: rd.redoVd||0, redoDa: rd.redoDa||0, owRnps: rd.owRnps||0, 
              ssr: rd.ssr||0, dRnps: rd.dRnps||0, ofs: rd.ofs||0, rCxe: rd.rCxe||0, 
              nps: rd.nps||0, npsDr: rd.npsDr||0, appointments: rd.appointments||0, coa: rd.coa||0, sdr: rd.sdr||0, switching: rd.switching||0, audit: rd.audit||0, tc: rd.tc||0, pr: prVal,
              pqaKpiCaps: rd.pqaKpiCaps ? { ...capDefaults, ...rd.pqaKpiCaps } : { ...capDefaults },
              accumulatedScore: rd.accumulatedScore || ytd.ytdScore || 0,
              accumulatedRank: rd.accumulatedRank || ytd.ytdRank || 0,
              ytdScore: rd.accumulatedScore || ytd.ytdScore || 0,
              centerYtdScore: ytd.centerYtdScore || 0,
              ytdRank: rd.accumulatedRank || ytd.ytdRank || 0,
              centerYtdRank: ytd.centerYtdRank || 0,
              monthlyRank: rd.monthlyRank || 0, 
              monthlyEvalRank: rd.monthlyEvalRank || 0,
              monthlyScore: rd.monthlyScore || 0,
              centerMonthlyScore: rd.centerMonthlyScore || 0,
              centerMonthlyRank: rd.centerMonthlyRank || 0,
              partnerScore: rd.partnerScore || 0,
              evalMonthlyScore: rd.evalMonthlyScore ?? 0,
              tcsScore: tcsVal,
           };
           pqaRecord.tier = getTier(pqaRecord.tcsScore);
           uploadedRecords.push(pqaRecord);
        }

      } else {
        // TCS parser (supports legacy monthly format + new quarterly SBA format)
        const tcsModeForProduct = targetTcsMode || appMode;
        const expectedProduct =
          tcsModeForProduct === 'TCS_DA' ? 'DA' : tcsModeForProduct === 'TCS_AV' || tcsModeForProduct === 'TCS_VD' ? 'AV' : 'MX';
        const targetSheet = workbook.Sheets["TCS Scores"] || workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(targetSheet, { header: 1, raw: false });
        let headerRow = -1;
        let cName=-1, cCode=-1, cPhoto=2, cAsc=3, cPartner=4, cMonth=5, cYear=6, cQuarter=-1, cSbaId=-1, cEval=7, cRedo=8, cSsr=-1, cRrr=-1, cSk=9, cMaint=10, cOqc=11, cTrain=12, cPba=13, cOcta=14, cCoreParts=-1, cMulti=15, cExam=16, cProm=17, cDet=18, cDrnps=-1;
        let cAscEngineer=-1, cProduct=-1, cTcsScore=-1;
        const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const parseNum = (value) => {
          const n = parseFloat(String(value ?? '').replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
          return Number.isFinite(n) ? n : 0;
        };
        /** Parses Excel cell for final TCS; ignores #VALUE!, #N/A, and supports "80%" */
        const parseExcelTcsScore = (value) => {
          const s = String(value ?? '').trim();
          if (!s || /^#/i.test(s)) return null;
          const cleaned = s.replace(/%/g, '').replace(/,/g, '').trim();
          const n = parseFloat(String(cleaned).replace(/[^0-9.\-]/g, ''));
          if (!Number.isFinite(n)) return null;
          return Number(Math.min(100, Math.max(0, n)).toFixed(1));
        };
        const quarterToMonth = (q) => {
          const k = String(q || '').toUpperCase().replace(/\s/g, '');
          if (k === 'Q1' || k === '1') return 'March';
          if (k === 'Q2' || k === '2') return 'June';
          if (k === 'Q3' || k === '3') return 'September';
          if (k === 'Q4' || k === '4') return 'December';
          return '';
        };

        for (let i = 0; i < Math.min(rows.length, 8); i++) {
          const r = rows[i] || [];
          for (let j = 0; j < r.length; j++) {
            const v = normalizeHeader(r[j]);
            if (v === 'engineercode' || (v.includes('engineer') && v.includes('code') && v.length <= 24)) cCode = j;
            else if ((v === 'code' || v === 'asccode') && cCode < 0) cCode = j;
            if (v === 'name' || v === 'engineername') cName = j;
            if (v === 'photourl') cPhoto = j;
            if (v === 'asc' || v === 'ascname') cAsc = j;
            if (v === 'ascengineer') cAscEngineer = j;
            if (v === 'partnername' || v === 'partner') cPartner = j;
            if (v === 'month') cMonth = j;
            if (v === 'year') cYear = j;
            if (v === 'quarter' || v === 'q') cQuarter = j;
            if (v === 'sbaid' || v === 'sba') cSbaId = j;
            if (v === 'product') cProduct = j;
            if (v === 'tcsscore' || v === 'tcsscorepercent' || v === 'finaltcs' || v === 'totalscore') cTcsScore = j;
            if (v === 'engineerevaluation' || v === 'evaluation') cEval = j;
            if (v === 'redoratio' || v === 'redo') cRedo = j;
            if (v === 'ssr' || v === 'ssrpercent') cSsr = j;
            if (cSsr < 0 && (v === 'ssrscore' || v === 'ssrutilization')) cSsr = j;
            if (v === 'rrr' || v === 'rrr90') cRrr = j;
            if (v === 'iqcskipratio' || v === 'iqcskip' || v === 'iqcskippercent') cSk = j;
            if (v === 'maintenancemoderatio') cMaint = j;
            if (v === 'oqcpassrate') cOqc = j;
            if (v === 'trainingattendance' || v === 'q1training' || v === 'q1trainingscore' || v === 'q1trainin' || v === 'training') cTrain = j;
            if (v === 'corepartspba') cPba = j;
            if (v === 'corepartsocta') cOcta = j;
            if (v === 'coreparts' || v === 'corepartspercent') cCoreParts = j;
            if (v === 'multipartsratio') cMulti = j;
            if (v === 'examscore' || v === 'exam') cExam = j;
            if (v === 'promoters') cProm = j;
            if (v === 'detractors') cDet = j;
            if (v === 'drnps') cDrnps = j;
          }
          if (cCode > -1) { headerRow = i; break; }
        }
        for (let i = (headerRow > -1 ? headerRow + 1 : 1); i < rows.length; i++) {
          const r = rows[i] || [];
          if (cCode < 0 || !String(r[cCode] ?? '').trim()) continue;
          const rawQuarter = cQuarter > -1 ? r[cQuarter] : '';
          const rawMonth = cMonth > -1 ? r[cMonth] : '';
          const rawYear = cYear > -1 ? r[cYear] : '';
          let quarterRaw = String(rawQuarter ?? '').trim().toUpperCase();
          let monthRaw = String(rawMonth ?? '').trim();
          let yearRaw = String(rawYear ?? '').trim();

          const serialCandidate = typeof rawMonth === 'number' ? rawMonth : parseFloat(String(monthRaw).replace(/,/g, ''));
          if (Number.isFinite(serialCandidate) && serialCandidate >= 20000 && serialCandidate <= 60000) {
            const conv = excelSerialToMonthYear(serialCandidate);
            if (conv) {
              monthRaw = conv.month;
              if (!yearRaw) yearRaw = conv.year;
            }
          }
          if (!yearRaw && typeof rawYear === 'number' && rawYear >= 20000 && rawYear <= 60000) {
            const conv = excelSerialToMonthYear(rawYear);
            if (conv) yearRaw = conv.year;
          }
          if (monthRaw && /^\d{1,2}$/.test(monthRaw)) {
            const mi = parseInt(monthRaw, 10);
            if (mi >= 1 && mi <= 12) monthRaw = MONTH_ORDER[mi - 1];
          }
          if (monthRaw && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(monthRaw)) {
            const p = monthRaw.split('/');
            let yr = parseInt(p[2], 10);
            if (yr < 100) yr += 2000;
            const d = new Date(yr, parseInt(p[0], 10) - 1, parseInt(p[1], 10));
            if (!Number.isNaN(d.getTime())) {
              monthRaw = MONTH_ORDER[d.getMonth()];
              if (!yearRaw) yearRaw = String(d.getFullYear());
            }
          }
          const effectiveMonth = monthRaw || quarterToMonth(quarterRaw) || 'March';
          let effectiveYear = normalizeYearKey(yearRaw);
          if (!effectiveYear) effectiveYear = String(new Date().getFullYear());
          let qNorm = quarterRaw.replace(/\s/g, '');
          if (/^[1-4]$/.test(qNorm)) qNorm = `Q${qNorm}`;
          const corePartsValue = cCoreParts > -1 ? parseNum(r[cCoreParts]) : 0;
          const q1TrainingValue = cTrain > -1 ? parseNum(r[cTrain]) : 0;
          const drnpsDirect = cDrnps > -1 ? parseNum(r[cDrnps]) : 0;
          const examValue = cExam > -1 ? parseNum(r[cExam]) : 0;
          const evalValue = cEval > -1 ? parseNum(r[cEval]) : 0;
          const redoValue = cRedo > -1 ? parseNum(r[cRedo]) : 0;
          /** SSR % is always read from Excel column H (1-based column 8 → 0-based index 7). */
          const EXCEL_COL_H_INDEX = 7;
          const ssrValue = parseNum(r[EXCEL_COL_H_INDEX]);
          const rrrValue = cRrr > -1 ? parseNum(r[cRrr]) : 0;
          const iqcCol = cSk >= 1 ? cSk - 1 : cSk;
          const iqcValue = iqcCol > -1 ? parseNum(r[iqcCol]) : 0;

          if (cProduct > -1) {
            const prod = String(r[cProduct] || '').trim().toUpperCase();
            if (prod && prod !== expectedProduct && !(expectedProduct === 'AV' && prod === 'VD')) continue;
          }

          const nameFromSheet = cAscEngineer > -1 ? r[cAscEngineer] : (cName > -1 ? r[cName] : '');
          const ascNameFromSheet = cAsc > -1 ? r[cAsc] : '';
          const sheetTcs = cTcsScore > -1 ? parseExcelTcsScore(r[cTcsScore]) : null;

          const rawCode = cCode > -1 ? r[cCode] : '';
          const codeNormalized = String(rawCode ?? '').trim();
          let eng = {
            id: '',
            name: String(nameFromSheet || "Unknown").trim(),
            code: /^\d+$/.test(codeNormalized) ? codeNormalized : codeNormalized.toUpperCase(),
            photoUrl: cPhoto > -1 ? String(r[cPhoto] || "https://picsum.photos/200") : "https://picsum.photos/200",
            sbaId: cSbaId > -1 ? String(r[cSbaId] || '').trim() : '',
            asc: (ascNameFromSheet ? String(ascNameFromSheet).trim() : 'N/A'),
            product: cProduct > -1 ? String(r[cProduct] || '').trim().toUpperCase() : expectedProduct,
            partnerName: String(r[cPartner] || "N/A"),
            quarter: qNorm || getQuarter(effectiveMonth) || '',
            month: effectiveMonth, year: effectiveYear,
            engineerEvaluation: evalValue,
            ssrScore: ssrValue,
            rrrScore: rrrValue,
            iqcSkipRatio: iqcValue,
            corePartsScore: corePartsValue,
            q1TrainingScore: q1TrainingValue,
            drnpsScore: drnpsDirect,
            redoRatio: redoValue,
            maintenanceModeRatio: parseNum(r[cMaint]),
            oqcPassRate: parseNum(r[cOqc]),
            trainingAttendance: q1TrainingValue,
            corePartsPBA: cPba > -1 ? parseNum(r[cPba]) : corePartsValue,
            corePartsOcta: cOcta > -1 ? parseNum(r[cOcta]) : 0,
            multiPartsRatio: parseNum(r[cMulti]),
            examScore: examValue,
            promoters: parseNum(r[cProm]),
            detractors: parseNum(r[cDet]),
          };
          eng.tcsScore = sheetTcs != null ? sheetTcs : 0;
          eng.tier = getTier(eng.tcsScore);
          uploadedRecords.push(eng);
        }
      }

      if (uploadedRecords.length === 0) {
        message.warning("No valid data found in the Excel sheet. Check headers (Region, ASC Code, ASC Name).");
        return;
      }

      const finalUploadSet = [];
      uploadedRecords.forEach(rec => {
        const existing = mergeList.find(e => e.code?.toUpperCase() === rec.code?.toUpperCase() && e.month?.toLowerCase() === rec.month?.toLowerCase() && e.year === rec.year);
        if (existing) finalUploadSet.push({ ...rec, id: existing.id });
        else finalUploadSet.push(rec);
      });

      try {
        const promises = finalUploadSet.map(async (rec) => {
          const savedId = await saveEngineerToDb(rec, uploadCol);
          return { ...rec, id: savedId || rec.id };
        });
        const savedRecords = await Promise.all(promises);

        const sameViewCollection = resolveFirestoreCollection(appMode) === uploadCol;
        if (sameViewCollection) {
          setEngineers(prev => {
            const next = [...prev];
            savedRecords.forEach(rec => {
              const idx = next.findIndex(e => e.id === rec.id);
              if (idx !== -1) next[idx] = rec;
              else next.push(rec);
            });
            return next;
          });
        }

        const label = targetTcsMode || appMode;
        message.success(
          sameViewCollection
            ? `Success: ${savedRecords.length} records processed and saved (${label}).`
            : `Success: ${savedRecords.length} records saved to ${targetTcsMode || label}. Switch the division selector above to view or edit that list.`
        );
        writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: `Excel Bulk Import (${targetTcsMode || appMode})`, details: { count: savedRecords.length, collection: uploadCol }, severity: 'info' });
      } catch (error) {
        console.error("Error uploading Excel data:", error);
        message.error("Error saving Excel data to database.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black animate-pulse uppercase tracking-widest">Initializing TCS Protocol...</div>;
  }

  if (fetchError && view === 'ADMIN_LOGIN' && admins.length === 0) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Info className="w-12 h-12" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Database Connection Critical Error</h2>
        <p className="max-w-md text-xs font-medium uppercase tracking-widest leading-loose opacity-70">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24 selection:bg-blue-600 selection:text-white">
      <Header
        onHome={() => setView('HOME')}
        onLogoClick={() => { viewStackRef.current = ['APP_SELECTION']; setAppMode(null); setPortalRealm(null); setView('APP_SELECTION'); }}
        appMode={appMode}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Error Notification */}
        {fetchError && (
          <div className="mb-8 p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-4 duration-500">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">{fetchError}</p>
          </div>
        )}

        {/* Animated page content wrapper — key changes on view to trigger re-animation */}
        <div key={view} className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out">

          {view === 'APP_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">System Gateway</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-blue-600">Portal</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your destination environment to proceed with operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
                {/* TCS Portal (Engineers) */}
                <button
                  onClick={() => { setPortalRealm('TCS'); navigateTo('TCS_DIVISION_SELECTION'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-8 md:p-12 flex flex-col items-center justify-center gap-6 md:gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-950 border border-blue-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-hidden">
                    <img src="/fawzy-logo.png" alt="TCS" className="w-full h-full object-contain rounded-[2.5rem] sm:rounded-[3.5rem]" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">TCS Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">( Engineers )</p>
                  </div>
                </button>

                {/* PQA Portal (Service Center) */}
                <button
                  onClick={() => { setPortalRealm('PQA'); navigateTo('PQA_DIVISION_SELECTION'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-8 md:p-12 flex flex-col items-center justify-center gap-6 md:gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-yellow-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-yellow-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden">
                    <img src="/pqa_logo.png" alt="PQA" className="w-full h-full object-contain rounded-[2.5rem] sm:rounded-[3.5rem]" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">PQA Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">( Service Center )</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {view === 'TCS_DIVISION_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out relative">
              <button
                onClick={() => navigateTo('APP_SELECTION')}
                className="lg:absolute lg:top-28 lg:left-8 xl:left-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10 mb-8 lg:mb-0"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Gateway
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">TCS Environment</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-blue-500">Division</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your TCS division (Mobile Experience, Digital Appliances, AV).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
                <button
                  onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_MX'); navigateTo('HOME'); }}
                  className="group relative min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden">
                    <img src="/mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_DA'); navigateTo('HOME'); }}
                  className="group relative min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-zinc-950 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden">
                    <img src="/ce_logo.png" alt="DA" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">DA Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Digital Appliances</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_AV'); navigateTo('HOME'); }}
                  className="group relative min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-[#3d3d3d] flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden">
                    <img src="/av_division.png" alt="AV division" className="h-full w-full object-contain object-center bg-[#3d3d3d]" style={{ transform: 'none' }} />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-cyan-400 transition-colors">AV Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Audio · Visual</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {view === 'PQA_DIVISION_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out relative">
              <button
                onClick={() => navigateTo('APP_SELECTION')}
                className="lg:absolute lg:top-28 lg:left-8 xl:left-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10 mb-8 lg:mb-0"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Gateway
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">PQA Environment</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-yellow-500">Division</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your division cluster.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
                <button
                  onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_MX'); navigateTo('HOME'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden">
                    <img src="/mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_CE'); navigateTo('HOME'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden">
                    <img src="/ce_logo.png" alt="CE" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">CE Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Consumer Electronics</p>
                  </div>
                </button>
              </div>
            </div>
          )}

                    {view === 'HOME' && (
            <div className="space-y-10 sm:space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out max-w-[100vw] overflow-x-hidden px-2 sm:px-4 box-border">
              {/* Hero Section */}
              <section className="relative px-4 text-center space-y-4 pt-8">
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase">
                  {appMode?.startsWith('PQA') ? 'Evolution' : 'Beyond'}<span className="text-blue-600"> {appMode?.startsWith('PQA') ? 'in Quality' : 'Standards'}</span><br />
                  {appMode?.startsWith('PQA') ? 'Defined' : 'Above'}<span className="text-blue-600"> {appMode?.startsWith('PQA') ? 'by Rank' : 'Average'}</span>
                </h2>
              </section>

              {/* Dashboard Toggle */}
              <div className="flex flex-col items-center gap-6">
                <div className="bg-zinc-900/60 p-2 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-2xl">
                  {appMode?.startsWith('PQA') && (
                    <button
                      onClick={() => setHomeViewMode('MONTHLY')}
                      className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY'
                        ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      Monthly
                    </button>
                  )}
                  <button
                    onClick={() => setHomeViewMode('QUARTERLY')}
                    className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY'
                      ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                      : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    {appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}
                  </button>
                </div>

                {appMode === 'PQA_MX' && (
                  <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-700">
                    <button
                      onClick={() => setPqaMxGroupBy('PARTNER')}
                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'PARTNER'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      By Partner
                    </button>
                    <button
                      onClick={() => setPqaMxGroupBy('CENTER')}
                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'CENTER'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      By Service Center
                    </button>
                  </div>
                )}
              </div>

              {/* ── Content Switcher: MONTHLY | ACCUMULATED ────────────────────────── */}
              {homeViewMode === 'MONTHLY' ? (
                <div className="mx-auto w-full min-w-0 max-w-5xl space-y-12 px-1 animate-in fade-in zoom-in-95 duration-500 sm:px-4">
                  {/* Month Selector */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <button
                      onClick={() => {
                        const idx = allMonthPeriods.findIndex(p => p.key === effectiveHofMonth);
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
                        if (idx < allMonthPeriods.length - 1) setSelectedHofMonth(allMonthPeriods[idx + 1].key);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Ranking List Monthly */}
                  <div className="space-y-4">
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                      {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER'
                        ? 'All 7 Partners — Monthly Ranking'
                        : appMode?.startsWith('PQA')
                          ? 'All Service Centers — Monthly Ranking'
                          : `Top ${TCS_HOME_LEADERBOARD_LIMIT} Engineers`}
                    </h3>
                    {hofTop10.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this period.</div>
                    ) : (
                      <>
                        {renderHomeRankingPodium(hofTop10, 'tcsScore', appMode?.startsWith('PQA') ? 'PQA Score' : 'TCS Score')}
                        {hofTop10.slice(3).map((eng, idx) => {
                          const displayRank = eng.displayRank ?? idx + 4;
                          const isFirst = displayRank === 1;
                          const isSecond = displayRank === 2;
                          const isThird = displayRank === 3;
                          const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                          const scoreLabel = appMode?.startsWith('PQA') ? 'PQA Score' : 'TCS Score';
                          return (
                            <div key={eng.id || eng.code} className={`glass-card rounded-[2.5rem] p-4 md:p-8 flex items-center gap-4 md:gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                              {renderRankBadgeList(displayRank, isFirst, isSecond, isThird, eng)}
                              <img
                                src={getPhotoUrl(eng)}
                                onError={handleEngineerPhotoError}
                                className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl ${getLogoStyle(getPhotoUrl(eng))} flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`}
                                alt={tcsDisplayPrimary(eng)}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-[11px] xs:text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight line-clamp-2 sm:truncate break-words ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{tcsDisplayPrimary(eng)}</h4>
                                {tcsDisplaySecondary(eng) ? (
                                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 line-clamp-2 break-words normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                                ) : null}
                                {!appMode?.startsWith('PQA') && !isTcsMode && (
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <TierBadge tier={eng.tier} size="sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`text-xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                                  {eng.tcsScore != null ? parseFloat(eng.tcsScore).toFixed(1) : '—'}
                                </span>
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{scoreLabel}</p>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* ── ACCUMULATED view ─────────────────────────────────────────────── */
                <div className="mx-auto w-full min-w-0 max-w-5xl space-y-12 px-1 animate-in fade-in zoom-in-95 duration-500 sm:px-4">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <div className="flex min-w-0 max-w-[min(100%,20rem)] items-center gap-2 rounded-2xl border border-blue-500/20 bg-zinc-900 px-4 py-3 sm:gap-3 sm:px-8 sm:py-4">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="truncate text-center text-xs font-black uppercase tracking-widest text-white sm:text-base">
                        {appMode?.startsWith('PQA') ? '2026 — Year to Date' : tcsQuarterPeriodLabel}
                      </span>
                    </div>
                    {!appMode?.startsWith('PQA') && (
                      <>
                        <button onClick={() => { const idx = allQuarterKeys.indexOf(effectiveQuarterKey); if (idx < allQuarterKeys.length - 1) setSelectedQuarterKey(allQuarterKeys[idx + 1]); }} className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => { const idx = allQuarterKeys.indexOf(effectiveQuarterKey); if (idx > 0) setSelectedQuarterKey(allQuarterKeys[idx - 1]); }} className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"><ChevronRight className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    {appMode !== 'PQA_CE' && (
                      <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                        {appMode?.startsWith('PQA')
                          ? (pqaMxGroupBy === 'PARTNER' ? 'All 7 Partners — Accumulated Average' : 'All Service Centers — Accumulated Average')
                          : `Top ${TCS_HOME_LEADERBOARD_LIMIT} Engineers (Quarterly)`}
                      </h3>
                    )}
                    {quarterlyRanking.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">
                        {appMode?.startsWith('PQA')
                          ? 'No accumulated data — upload Excel with ★Partner Ranking sheet.'
                          : 'No quarterly data for this period — upload TCS Excel (Quarter, Year, Product=MX, SBA ID, ASC Name, TCS Score) or pick a quarter that exists in your data.'}
                      </div>
                    ) : (() => {
                      const accLimit = appMode?.startsWith('PQA') ? 500 : TCS_HOME_LEADERBOARD_LIMIT;
                      const accList = quarterlyRanking.slice(0, accLimit);
                      const avgLabel = appMode?.startsWith('PQA') ? 'Acc. Avg PQA' : 'TCS Score';
                      return (
                        <>
                          {renderHomeRankingPodium(accList, 'avgScore', avgLabel)}
                          {accList.slice(3).map((eng, idx) => {
                            const displayRank = eng.displayRank ?? idx + 4;
                            const isFirst = displayRank === 1;
                            const isSecond = displayRank === 2;
                            const isThird = displayRank === 3;
                            const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                            return (
                              <div key={`${eng.id || eng.code}-acc`} className={`glass-card rounded-[2.5rem] p-4 md:p-8 flex items-center gap-4 md:gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                                {renderRankBadgeList(displayRank, isFirst, isSecond, isThird, eng)}
                                <img
                                  src={getPhotoUrl(eng)}
                                  onError={handleEngineerPhotoError}
                                  className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl ${getLogoStyle(getPhotoUrl(eng))} flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`}
                                  alt={tcsDisplayPrimary(eng)}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-[11px] xs:text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight line-clamp-2 sm:truncate break-words ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{tcsDisplayPrimary(eng)}</h4>
                                  {tcsDisplaySecondary(eng) ? (
                                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 line-clamp-2 break-words normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                                  ) : null}
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {!appMode?.startsWith('PQA') && !isTcsMode && <TierBadge tier={eng.tier} size="sm" />}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <span className={`text-xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                                    {eng.avgScore != null ? parseFloat(eng.avgScore).toFixed(1) : '—'}
                                  </span>
                                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{avgLabel}</p>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

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
              <div className="max-w-2xl mx-auto space-y-6">
                {portalVsAppMismatch ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Portal / division mismatch</p>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      {portalRealm === 'TCS'
                        ? 'You opened the TCS portal, but the active division is PQA. Use the top strip to switch to TCS MX, DA, or AV before searching — TCS uses engineer code.'
                        : 'You opened the PQA portal, but the active division is TCS. Use the top strip to switch to PQA MX or CE before searching — PQA uses service center code.'}
                    </p>
                  </div>
                ) : null}
                <div className="glass-card rounded-[4rem] p-12 md:p-16 space-y-12 border-blue-500/10 shadow-3xl text-center relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Search className="w-64 h-64 -rotate-12" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Credential Verification</h3>
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">
                      {searchIsPqaContext
                        ? 'Enter your service center code below'
                        : 'Enter your engineer code below (Excel column “Engineer Code”) — not SBA ID'}
                    </p>
                  </div>

                  <div className="space-y-8 relative z-10">
                    <div className="relative group">
                      <input
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={searchIsPqaContext ? 'SERVICE_CENTER_CODE' : 'ENGINEER_CODE'}
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
                      <span className="text-sm font-black text-zinc-400 uppercase">{searchIsPqaContext ? 'PQA-V7.2' : 'TCS-V7.2'}</span>
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

                {/* Fallback Hint */}
                {admins.some(a => a.username === 'fawzy.m') && (
                  <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <p className="text-[9px] text-blue-500/70 font-medium uppercase tracking-widest text-center">
                      Hint: Use default credentials if database is empty.
                    </p>
                  </div>
                )}

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
                <div className="flex justify-center">
                  <button
                    onClick={handleClearSession}
                    className="text-[8px] font-black text-zinc-800 uppercase tracking-widest hover:text-red-500 transition-all"
                  >
                    Clear Session Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'ADMIN_DASHBOARD' && currentUser && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* Admin Environment Controller */}
              <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 bg-zinc-900 border border-white/10 rounded-3xl p-3 mb-8 max-w-5xl mx-auto shadow-2xl">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_MX'); }}
                    disabled={currentUser.role !== 'SUPER_ADMIN' && currentUser.access !== 'TCS_ONLY' && currentUser.access !== 'ALL'}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_MX' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Users className="w-4 h-4" />
                    TCS MX
                  </button>
                  <button
                    onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_DA'); }}
                    disabled={currentUser.role !== 'SUPER_ADMIN' && currentUser.access !== 'TCS_ONLY' && currentUser.access !== 'ALL'}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_DA' ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.35)]' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Cpu className="w-4 h-4" />
                    TCS DA
                  </button>
                  <button
                    onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_AV'); }}
                    disabled={currentUser.role !== 'SUPER_ADMIN' && currentUser.access !== 'TCS_ONLY' && currentUser.access !== 'ALL'}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.35)]' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Monitor className="w-4 h-4" />
                    TCS AV
                  </button>
                </div>
                <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
                 <button 
                  onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_MX'); }}
                  disabled={currentUser.role !== 'SUPER_ADMIN' && currentUser.access !== 'PQA_ONLY' && currentUser.access !== 'ALL'}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 ${appMode === 'PQA_MX' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Building2 className="w-4 h-4" />
                  PQA MX Division
                </button>
                <button 
                  onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_CE'); }}
                  disabled={currentUser.role !== 'SUPER_ADMIN' && currentUser.access !== 'PQA_ONLY' && currentUser.access !== 'ALL'}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 ${appMode === 'PQA_CE' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Activity className="w-4 h-4" />
                  PQA CE Division
                </button>
              </div>
              {/* Dashboard Header — compact */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500">Command Center</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">Admin Portal</h2>
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

              {/* TCS — active profile workspace (division chosen in strip above; no duplicate tabs — full list is Live Registry below) */}
              {(currentUser.role === 'SUPER_ADMIN' || currentUser.access === 'TCS_ONLY' || currentUser.access === 'ALL') && appMode?.startsWith('TCS') && (() => {
                const activeTcs =
                  appMode === 'TCS_DA' ? 'TCS_DA' : appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'TCS_AV' : 'TCS_MX';
                const tabDef = {
                  TCS_MX: { label: 'TCS MX', short: 'MX', collection: 'engineers', border: 'border-purple-500/25', img: '/mx_logo.png', imgClass: 'object-cover' },
                  TCS_DA: { label: 'TCS DA', short: 'DA', collection: 'tcs_da_engineers', border: 'border-amber-500/25', img: '/ce_logo.png', imgClass: 'object-cover' },
                  TCS_AV: { label: 'TCS AV', short: 'AV', collection: 'tcs_vd_engineers', border: 'border-cyan-500/25', img: '/av_division.png', imgClass: 'object-contain object-center bg-[#3d3d3d]' },
                };
                const cur = tabDef[activeTcs];
                return (
                  <div className={`rounded-[2rem] border bg-zinc-900/40 p-6 md:p-8 space-y-5 ${cur.border}`}>
                    <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-400 mb-1">TCS bulk data — {cur.short}</p>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">{cur.label}</h3>
                      <p className="text-[10px] text-zinc-500 font-medium max-w-2xl">
                        Template <strong className="text-zinc-300">Engineer Code</strong> is what engineers use in search. <strong className="text-zinc-300">Product</strong> = {cur.short} (legacy VD is accepted for AV). Collection: <span className="text-zinc-400 font-mono text-[9px]">{cur.collection}</span>. Full roster and edits: <strong className="text-zinc-400">Live Engineer Registry</strong> below.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 ${activeTcs === 'TCS_AV' ? 'bg-[#3d3d3d]' : 'bg-black'}`}>
                          <img src={cur.img} alt="" className={`h-full w-full ${cur.imgClass}`} style={activeTcs === 'TCS_AV' || activeTcs === 'TCS_VD' ? { transform: 'none' } : undefined} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">{cur.label}</p>
                          <p className="text-[9px] text-zinc-500">{engineers.length} record{engineers.length === 1 ? '' : 's'} in this division</p>
                        </div>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => downloadTcsDivisionTemplate(activeTcs)}
                          className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/80 border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                        >
                          <Download className="w-4 h-4" /> Template
                        </button>
                        <label className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-wider hover:bg-blue-600/30 cursor-pointer transition-all">
                          <Upload className="w-4 h-4" /> Upload
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleExcelUpload(e, { targetTcsMode: activeTcs })} />
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={tcsProductImagesSyncing}
                      onClick={async () => {
                        setTcsProductImagesSyncing(true);
                        try {
                          const urls = await uploadTcsAllProductImagesFromPublic();
                          message.success(`Saved to Firebase: tcs/all-products-images/ — mx, da, vd (${Object.keys(urls).length} files).`);
                        } catch (e) {
                          console.error(e);
                          message.error(e?.message || 'Upload failed. Check Storage rules for tcs/all-products-images/*');
                        } finally {
                          setTcsProductImagesSyncing(false);
                        }
                      }}
                      className="flex w-full flex-row items-center justify-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-600/10 px-5 py-4 font-black text-[10px] uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-600/20 disabled:opacity-40"
                    >
                      {tcsProductImagesSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      {tcsProductImagesSyncing ? 'Uploading…' : 'Save division images to Firebase (tcs/all-products-images)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearTcsDivisionData(activeTcs === 'TCS_AV' ? 'TCS_AV' : activeTcs)}
                      className="flex w-full flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-600/10 px-5 py-4 font-black text-[10px] uppercase tracking-wider text-red-300 transition-all hover:bg-red-600/20"
                    >
                      <Trash2 className="w-5 h-5" />
                      Clear {cur.short} ({cur.collection})
                    </button>
                  </div>
                );
              })()}

              {/* PQA — active profile workspace (division chosen in strip above; roster below) */}
              {(currentUser.role === 'SUPER_ADMIN' || currentUser.access === 'PQA_ONLY' || currentUser.access === 'ALL') && isPqaMode && (
                <div className="rounded-[2rem] border border-yellow-500/15 bg-zinc-900/40 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-yellow-500/90 mb-1">PQA bulk data — {appMode === 'PQA_CE' ? 'CE' : 'MX'}</p>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">PQA Excel (multi-sheet)</h3>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Template includes ★Evaluation point and ★Monthly Average. Upload applies to <strong className="text-zinc-400">{appMode}</strong>. Full service-center list: <strong className="text-zinc-400">Live Engineer Registry</strong> below.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/80 border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                    >
                      <Download className="w-4 h-4" /> PQA template
                    </button>
                    <label className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-200 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/25 cursor-pointer transition-all">
                      <Upload className="w-4 h-4" /> PQA upload
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                    </label>
                  </div>
                </div>
              )}

              {/* Operations — tools first; TCS clear split by division below */}
              <div className="rounded-[2rem] border border-white/10 bg-zinc-900/35 p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-white/5 pb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 mb-1">Operations</p>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Tools & registry</h3>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1 max-w-lg">Add records, guides, and logs. Clear archived division data only when you intend to reset that Firestore collection.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => setEditingEng({
                      id: '', name: '', code: '',
                      photoUrl: appMode?.startsWith('PQA') ? PQA_SERVICE_CENTER_PHOTO : 'https://picsum.photos/200',
                      asc: '', partnerName: '', month: 'March', year: '2026',
                      redoRatio: '', iqcSkipRatio: '', maintenanceModeRatio: '', oqcPassRate: '',
                      trainingAttendance: '', corePartsPBA: '', corePartsOcta: '', multiPartsRatio: '',
                      examScore: '', promoters: '', detractors: '', tcsScore: 0, tier: 'Bronze'
                    })}
                    className="flex flex-col items-center gap-2 bg-white text-black p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    {appMode?.startsWith('PQA') ? 'Add Service Center' : 'Add Engineer'}
                  </button>

                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={seedDatabase}
                      disabled={isSaving}
                      className="flex flex-col items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-purple-600/20 transition-all disabled:opacity-50"
                      title="Seed database with initial demo data"
                    >
                      <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                      Seed Database
                    </button>
                  )}

                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => setAdminModal('accounts')}
                      className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                    >
                      <Settings className="w-5 h-5" />
                      Manage Accounts
                    </button>
                  )}

                  <button
                    onClick={() => (isPqaMode ? setView('PQA_INFO') : setAdminModal('guide'))}
                    className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    <BookOpen className="w-5 h-5" />
                    {isPqaMode ? 'PQA Guide' : 'TCS Guide'}
                  </button>

                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => { setAdminModal('logs'); loadLogs(); }}
                      className="flex flex-col items-center gap-2 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      <Activity className="w-5 h-5" />
                      Actions Log
                    </button>
                  )}
                </div>

                {currentUser?.role === 'SUPER_ADMIN' && isPqaMode && (
                  <div className="border-t border-white/5 pt-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-500/90 mb-3">PQA — clear current division</p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`⚠️ Archive ALL records for ${appMode}?`)) return;
                        try {
                          await Promise.all(engineers.map((e) => archiveEngineer(e.id, colName)));
                          setEngineers([]);
                          message.success(`${appMode} data cleared.`);
                        } catch (err) {
                          message.error('Failed to clear database.');
                        }
                      }}
                      className="flex w-full max-w-md flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-600/10 px-5 py-4 font-black text-[10px] uppercase tracking-wider text-red-400 transition-all hover:bg-red-600/20 sm:w-auto"
                    >
                      <Trash2 className="w-5 h-5" />
                      Clear {appMode} data
                    </button>
                  </div>
                )}

              </div>

              {/* Analytics Panel (Super Admin Only) */}
              {currentUser?.role === 'SUPER_ADMIN' && analyticsSummary && (() => {
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
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Global App Analytics</h3>
                      <button
                        onClick={refreshAnalytics}
                        disabled={analyticsLoading}
                        className="ml-auto flex items-center gap-1 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${analyticsLoading ? 'animate-spin' : ''}`} />
                         Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Visitor Stats */}
                       <div className="space-y-4">
                        <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                          <UserCircle className="w-3 h-3" /> Visitor Traffic
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Hits</p>
                            <p className="text-2xl font-black text-emerald-400 italic">{analyticsSummary.visitorHits ?? '—'}</p>
                          </div>
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Today</p>
                            <p className="text-2xl font-black text-emerald-400 italic">{todayVisitors}</p>
                          </div>
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Avg Time</p>
                            <p className="text-sm font-black text-emerald-400 italic">{avgVMin}m {avgVSec}s</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">TCS mode picks</p>
                            <p className="text-lg font-black text-emerald-300 italic">{analyticsSummary.visitorHitsTCS ?? '—'}</p>
                          </div>
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">PQA mode picks</p>
                            <p className="text-lg font-black text-emerald-300 italic">{analyticsSummary.visitorHitsPQA ?? '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Admin Stats */}
                      <div className="space-y-4">
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> Admin Activity
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Logins</p>
                            <p className="text-2xl font-black text-blue-400 italic">{analyticsSummary.adminLogins ?? '—'}</p>
                          </div>
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Today</p>
                            <p className="text-2xl font-black text-blue-400 italic">{todayAdmins}</p>
                          </div>
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Avg Time</p>
                            <p className="text-sm font-black text-blue-400 italic">{avgAMin}m {avgASec}s</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">Manage accounts</span>}
                open={adminModal === 'accounts'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(1100px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto', paddingTop: 12 } }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-2">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card rounded-[2rem] p-8 space-y-6 border border-green-500/20">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-green-500" /> Provision node
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Full identity</label>
                          <input
                            type="text"
                            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold text-white"
                            value={newAdminData.name}
                            onChange={e => setNewAdminData({ ...newAdminData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Username</label>
                          <input
                            type="text"
                            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold text-white"
                            value={newAdminData.username}
                            onChange={e => setNewAdminData({ ...newAdminData, username: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Password</label>
                          <input
                            type="password"
                            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold text-white"
                            value={newAdminData.password}
                            onChange={e => setNewAdminData({ ...newAdminData, password: e.target.value })}
                          />
                        </div>
                        {currentUser?.role === 'SUPER_ADMIN' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Role</label>
                              <select
                                value={newAdminData.role}
                                onChange={e => setNewAdminData({ ...newAdminData, role: e.target.value })}
                                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white"
                              >
                                <option value="ADMIN">Standard operator</option>
                                <option value="SUPER_ADMIN">Super admin</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Access</label>
                              <select
                                value={newAdminData.access}
                                onChange={e => setNewAdminData({ ...newAdminData, access: e.target.value })}
                                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white"
                              >
                                <option value="TCS_ONLY">TCS only</option>
                                <option value="PQA_ONLY">PQA only</option>
                                <option value="ALL">Global</option>
                              </select>
                            </div>
                          </>
                        )}
                        <button
                          onClick={handleAddAdmin}
                          className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-green-500 transition-all"
                        >
                          Add admin
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.35em]">Active accounts</p>
                    <div className="grid grid-cols-1 gap-3 max-h-[min(60vh,560px)] overflow-y-auto pr-1">
                      {admins.map(admin => (
                        <div key={admin.id} className="bg-zinc-900/80 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <span className="text-lg font-black text-white uppercase">{admin.name}</span>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">@{admin.username}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {currentUser?.role === 'SUPER_ADMIN' && (
                              <select
                                value={admin.access || 'TCS_ONLY'}
                                onChange={(e) => {
                                  const newAccess = e.target.value;
                                  const updated = { ...admin, access: newAccess };
                                  saveAdminToDb(updated).then(() => {
                                    setAdmins(prev => prev.map(a => a.id === admin.id ? updated : a));
                                    message.success(`Access updated for ${admin.username}`);
                                  });
                                }}
                                className="bg-zinc-950 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-white/10"
                              >
                                <option value="TCS_ONLY">TCS only</option>
                                <option value="PQA_ONLY">PQA only</option>
                                <option value="ALL">Full</option>
                              </select>
                            )}
                            {admin.id !== '1' && (
                              <button type="button" onClick={() => deleteAdminHandler(admin.id)} className="p-2 bg-black text-zinc-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAdminModal(null); setView('PROFILE_MGMT'); }}
                      className="w-full py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Open full directory view
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">TCS reference guide</span>}
                open={adminModal === 'guide'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(900px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto' } }}
              >
                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Technical Capability System (TCS)</strong> scores engineers on KPIs, DRNPS, and exam performance. Tiers (Bronze → Masters) follow your composite TCS score.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>Use the Excel template column <strong className="text-zinc-200">Engineer Code</strong> as the unique ID engineers type in search.</li>
                    <li>Quarterly views aggregate months within the same calendar quarter; set Quarter / Year / Product (MX, DA, or AV) in the sheet.</li>
                    <li>Leaderboard order uses your uploaded TCS Score (or calculated fallbacks from column data).</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => { setAdminModal(null); setView('TCS_INFO'); }}
                    className="w-full py-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:bg-blue-600/30 transition-all"
                  >
                    Open full TCS guide page
                  </button>
                </div>
              </Modal>

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">Actions log</span>}
                open={adminModal === 'logs'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(900px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto', paddingTop: 8 } }}
              >
                {(() => {
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap border-b border-white/5 pb-3">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Last 100 events</span>
                        <button
                          type="button"
                          onClick={loadLogs}
                          disabled={logsLoading}
                          className="ml-auto flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-white/10 rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                          {logsLoading ? 'Loading…' : 'Refresh'}
                        </button>
                      </div>
                      {activityLogs.length === 0 ? (
                        <p className="text-center text-zinc-700 text-[10px] uppercase tracking-widest py-8">{logsLoading ? 'Loading logs…' : 'No activity recorded yet.'}</p>
                      ) : (
                        <div className="space-y-2 max-h-[min(65vh,620px)] overflow-y-auto pr-2">
                          {activityLogs.map(log => (
                            <div key={log.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                              <div className="flex-shrink-0 mt-0.5">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${TYPE_COLORS[log.type] || 'text-zinc-400'}`}>{log.type?.replace('_', ' ')}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white">{log.action}</p>
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <p className="text-[9px] text-zinc-500 mt-0.5 break-words">
                                    {Object.entries(log.details).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
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
              </Modal>

              {/* Live Registry Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                      Live {appMode?.startsWith('PQA') ? 'Service Center' : 'Engineer'} Registry
                    </h3>
                  </div>
                  <button
                    onClick={() => setNoEngineers(!noEngineers)}
                    className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all shadow-xl"
                  >
                    <Eye className="w-4 h-4" />
                    {noEngineers ? "Minimize Archives" : "Inspect Archives"}
                  </button>
                </div>

                {currentUser?.role === 'SUPER_ADMIN' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setBulkSelectedIds(allVisibleSelected ? [] : visibleRegistryIds)}
                      className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all"
                    >
                      {allVisibleSelected ? 'Clear Selection' : 'Select All'}
                    </button>
                    <button
                      onClick={bulkArchiveEngineersHandler}
                      disabled={bulkSelectedIds.length === 0}
                      className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-600/20 transition-all disabled:opacity-40"
                    >
                      Bulk Delete ({bulkSelectedIds.length})
                    </button>
                  </div>
                )}

                {/* Archive Stack */}
                {noEngineers && fetchedHiddenEngineers.length > 0 && (
                  <>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setBulkSelectedArchivedIds(allArchivedSelected ? [] : archivedRegistryIds)}
                        className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all"
                      >
                        {allArchivedSelected ? 'Clear Selection' : 'Select All'}
                      </button>
                      <button
                        onClick={bulkRestoreEngineersHandler}
                        disabled={bulkSelectedArchivedIds.length === 0}
                        className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-600/20 transition-all disabled:opacity-40"
                      >
                        Restore Selected ({bulkSelectedArchivedIds.length})
                      </button>
                      <button
                        onClick={bulkDeleteArchivedEngineersHandler}
                        disabled={bulkSelectedArchivedIds.length === 0}
                        className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-600/20 transition-all disabled:opacity-40"
                      >
                        Delete From Archive ({bulkSelectedArchivedIds.length})
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                    {fetchedHiddenEngineers.map(eng => (
                      <div key={eng.id} className="bg-red-950/10 border border-red-900/20 p-6 rounded-3xl flex items-center justify-between group hover:bg-red-900/20 transition-all">
                        <div className="flex items-center gap-5">
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setBulkSelectedArchivedIds((prev) => prev.includes(eng.id) ? prev.filter((id) => id !== eng.id) : [...prev, eng.id])}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                bulkSelectedArchivedIds.includes(eng.id)
                                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                  : 'bg-zinc-900 border-white/15 text-transparent hover:border-white/35'
                              }`}
                              title={bulkSelectedArchivedIds.includes(eng.id) ? 'Deselect' : 'Select'}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          <img
                            src={getPhotoUrl(eng)}
                            onError={handleEngineerPhotoError}
                            className={`w-12 h-12 rounded-xl grayscale opacity-40 shadow-2xl ${getLogoStyle(getPhotoUrl(eng))}`}
                            alt={tcsDisplayPrimary(eng)}
                          />
                          <div>
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-tight line-through opacity-50">{tcsDisplayPrimary(eng)}</p>
                            {tcsDisplaySecondary(eng) ? (
                              <p className="text-[10px] font-bold text-zinc-600 line-through opacity-50 mt-0.5 normal-case">{tcsDisplaySecondary(eng)}</p>
                            ) : null}
                            <span className="text-[9px] font-black text-red-500 tracking-widest uppercase mt-1 block">ARCHIVED : {eng.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreEngineerHandler(eng.id)}
                            className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                            title="Restore archived record"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => deleteArchivedEngineerHandler(eng.id)}
                              className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                              title="Delete permanently from archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}

                {/* Active Registry Stack — deduplicated: one row per engineer (newest record) */}
                <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                  {deduplicatedEngineers.length === 0 ? (
                    <div className="p-24 text-center text-zinc-700 italic font-black uppercase tracking-[0.3em]">No registry entries detected.</div>
                  ) : deduplicatedEngineers.map((eng, idx) => (

                    <div key={eng.id} className="bg-black hover:bg-zinc-900/50 transition-all p-3 md:p-6 flex items-center justify-between gap-2 group">
                      <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => setBulkSelectedIds((prev) => prev.includes(eng.id) ? prev.filter((id) => id !== eng.id) : [...prev, eng.id])}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            bulkSelectedIds.includes(eng.id)
                              ? 'bg-red-600/20 border-red-500 text-red-400'
                              : 'bg-zinc-900 border-white/15 text-transparent hover:border-white/35'
                          }`}
                          title={bulkSelectedIds.includes(eng.id) ? 'Deselect' : 'Select'}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                      )}
                      <div className="w-10 h-10 md:w-14 md:h-14 relative flex-shrink-0">
                          <img
                            src={getPhotoUrl(eng)}
                            onError={handleEngineerPhotoError}
                            className={`w-full h-full rounded-xl md:rounded-2xl grayscale-50 group-hover:grayscale-0 transition-all shadow-2xl shadow-black/80 ${getLogoStyle(getPhotoUrl(eng))}`}
                            alt={tcsDisplayPrimary(eng)}
                          />
                          {isPqaMode ? (
                            // PQA: show numeric rank in corner
                            (() => {
                              const pqaRank = deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === eng.code?.toUpperCase()) + 1;
                              const isTopThree = pqaRank <= 3;
                              return (
                                <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black italic ${
                                  pqaRank === 1 ? 'bg-yellow-500 text-black' :
                                  pqaRank === 2 ? 'bg-zinc-300 text-black' :
                                  pqaRank === 3 ? 'bg-orange-500 text-black' :
                                  'bg-zinc-800 text-zinc-400'
                                }`}>{pqaRank}</div>
                              );
                            })()
                          ) : (
                            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border-2 border-black bg-black flex items-center justify-center">
                              <img src={TIER_META[eng.tier]?.img || TIER_META.Bronze.img} alt={eng.tier} className="w-4 h-4 object-contain tier-emblem-blend" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs md:text-base font-black text-white uppercase tracking-tighter group-hover:text-blue-500 transition-colors truncate">{tcsDisplayPrimary(eng)}</h4>
                          {tcsDisplaySecondary(eng) ? (
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 truncate normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                          ) : null}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {isPqaMode && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{eng.code}</span>
                            )}
                            {isPqaMode ? (
                              // PQA: show numeric rank pill
                              (() => {
                                const pqaRank = deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === eng.code?.toUpperCase()) + 1;
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                    pqaRank === 1 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                    pqaRank === 2 ? 'bg-zinc-300/10 border-zinc-300/30 text-zinc-300' :
                                    pqaRank === 3 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                    'bg-zinc-800/60 border-white/5 text-zinc-500'
                                  }`}>#{pqaRank}</span>
                                );
                              })()
                            ) : (
                              <TierBadge tier={eng.tier} size="sm" />
                            )}
                            {eng.sbaId && isPqaMode && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">SBA: {eng.sbaId}</span>
                            )}
                            {(eng.quarter || getQuarter(eng.month)) && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                {(eng.quarter || getQuarter(eng.month))} · {eng.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-sm md:text-xl font-black text-white tracking-widest italic">
                            {appMode?.startsWith('PQA') ? resolvePqaTcsScorePure(eng) : eng.tcsScore}
                          </span>
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{appMode?.startsWith('PQA') ? 'PQA' : 'TCS'}</p>
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
                      
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">System Role</label>
                            <select
                              value={newAdminData.role}
                              onChange={e => setNewAdminData({ ...newAdminData, role: e.target.value })}
                              className="w-full bg-black border border-white/5 rounded-2xl p-5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white appearance-none"
                            >
                              <option value="ADMIN">Standard Operator</option>
                              <option value="SUPER_ADMIN">Super Admin Root</option>
                            </select>
                          </div>
  
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access Clearance</label>
                            <select
                              value={newAdminData.access}
                              onChange={e => setNewAdminData({ ...newAdminData, access: e.target.value })}
                              className="w-full bg-black border border-white/5 rounded-2xl p-5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white appearance-none"
                            >
                              <option value="TCS_ONLY">TCS Environment Only</option>
                              <option value="PQA_ONLY">PQA Environments Only</option>
                              <option value="ALL">Global Access (All)</option>
                            </select>
                          </div>
                        </>
                      )}
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
                              {admin.role === 'SUPER_ADMIN' && <span className="text-[8px] bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full border border-blue-600/20 font-black tracking-widest uppercase">Root</span>}
                              <span className="text-[8px] bg-emerald-600/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-600/20 font-black tracking-widest uppercase">
                                {admin.access === 'ALL' ? 'GLOBAL ACCESS' : (admin.access?.replace('_', ' ') || 'TCS ONLY')}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">@ACCESS_ID: {admin.username}</span>
                            <span className="text-[7px] font-black text-zinc-800 uppercase tracking-[0.2em] mt-1 italic">Policy: {admin.role} System</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <div className="relative group/auth">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center pointer-events-none border border-blue-500/20">
                                 <Shield className="w-4 h-4 text-blue-500" />
                               </div>
                               <select
                                 value={admin.access || 'TCS_ONLY'}
                                 onChange={(e) => {
                                   const newAccess = e.target.value;
                                   const updated = { ...admin, access: newAccess };
                                   saveAdminToDb(updated).then(() => {
                                      setAdmins(prev => prev.map(a => a.id === admin.id ? updated : a));
                                      message.success(`Access updated for ${admin.username}`);
                                   });
                                 }}
                                 className="bg-zinc-900 text-zinc-300 text-[10px] font-black uppercase tracking-widest pl-14 pr-10 py-4 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-zinc-800 focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer shadow-lg min-w-[160px]"
                               >
                                 <option value="TCS_ONLY">TCS Only</option>
                                 <option value="PQA_ONLY">PQA Only</option>
                                 <option value="ALL">Full Authority</option>
                               </select>
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                 <ChevronRight className="w-3 h-3 text-zinc-600 rotate-90" />
                               </div>
                            </div>
                          )}
                          {admin.id !== '1' && (
                            <button
                              onClick={() => deleteAdminHandler(admin.id)}
                              className="p-5 bg-black text-zinc-700 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'ENGINEER_PROFILE' && selectedEngineer && (
            <>
              {/* 3D Rank Reveal Overlay */}
              {showRankReveal && appMode !== 'PQA_MX' && (
                <RankReveal3D
                  tier={selectedEngineer.tier}
                  score={isPqaMode ? resolvePqaTcsScore(pqaProfileSubject) : selectedEngineer.tcsScore}
                  name={isPqaMode ? selectedEngineer.name : tcsDisplayPrimary(selectedEngineer)}
                  onDismiss={() => setShowRankReveal(false)}
                  isPqaMode={isPqaMode}
                  rank={profileOpenedByExactCode
                    ? (isPqaMode
                      ? (parseInt(String(pqaProfileSubject?.centerYtdRank || pqaProfileSubject?.ytdRank || 0), 10) || '-')
                      : '(-)')
                    : (isPqaMode
                      ? (deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()) + 1 || '-')
                      : (engineerSummaryRanks?.monthRank || selectedEngineer.ytdRank || '-'))}
                />
              )}
              <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
                {/* Dossier Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-12 border-b border-white/5 pb-16">
                  <div className="flex flex-col items-center md:items-start gap-8">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <img
                        src={getPhotoUrl(selectedEngineer)}
                        onError={handleEngineerPhotoError}
                        className={`relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3.5rem] ${getLogoStyle(getPhotoUrl(selectedEngineer))} border-4 border-zinc-800 shadow-3xl grayscale-50 group-hover:grayscale-0 transition-all duration-500`}
                        alt={selectedEngineer.name}
                      />
                      {/* Only show tier emblem for TCS mode */}
                      {!isPqaMode && (
                        <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border-4 border-black z-20 bg-black">
                          <img src={TIER_META[selectedEngineer.tier]?.img || TIER_META.Bronze.img} alt={selectedEngineer.tier} className="w-7 h-7 md:w-9 md:h-9 object-contain tier-emblem-blend" />
                        </div>
                      )}
                    </div>
                    {/* Self-service photo update */}
                    <button
                      onClick={() => { setShowPhotoAuth(true); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                    >
                      <Camera className="w-3 h-3" />
                      {isPqaMode ? 'Update Center Photo' : 'Update My Photo'}
                    </button>
                    <div className="text-center md:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <div className="h-[1px] w-8 bg-blue-500 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Personnel Dossier</span>
                        {isPqaMode && (
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                            (selectedEngineer.pqaBranch || appMode) === 'PQA_CE'
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                              : 'border-purple-500/40 text-purple-200 bg-purple-500/10'
                          }`}>
                            {(selectedEngineer.pqaBranch || appMode) === 'PQA_CE' ? 'PQA CE data' : 'PQA MX data'}
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
                        {isPqaMode ? selectedEngineer.name : tcsDisplayPrimary(selectedEngineer)}
                      </h2>
                      {!isPqaMode && tcsDisplaySecondary(selectedEngineer) ? (
                        <p className="text-sm font-bold text-zinc-400 normal-case mt-1">{tcsDisplaySecondary(selectedEngineer)}</p>
                      ) : null}
                      {isPqaMode ? null : (
                        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.5em] mt-1">
                          Engineer code · {String(selectedEngineer.code || '—')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {isPqaMode && (
                          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.6em]">{selectedEngineer.code}</p>
                        )}
                        {selectedEngineer.ytdRank > 0 && !profileOpenedByExactCode && (
                          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">YTD Rank: #{selectedEngineer.ytdRank}</span>
                          </div>
                        )}
                        {selectedEngineer.region && !profileOpenedByExactCode && (
                           <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Region: {selectedEngineer.region}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="glass-card px-10 py-6 rounded-3xl flex flex-col items-end border-blue-500/20 shadow-2xl">
                      <span className="text-6xl font-black text-white italic tracking-tighter">
                        {isPqaMode
                          ? ((profileOpenedByExactCode && pqaAccumulatedScore > 0)
                            ? Number(pqaAccumulatedScore.toFixed(1))
                            : resolvePqaTcsScore(pqaProfileSubject))
                          : selectedEngineer.tcsScore}
                      </span>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        {isPqaMode
                          ? (profileOpenedByExactCode && pqaAccumulatedScore > 0 ? 'Accumulated PQA Score' : 'Aggregate PQA Score')
                          : 'Aggregate Capability Index'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setProfileOpenedByExactCode(false); setView('ENGINEER_LOOKUP'); }}
                      className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" /> Back to Registry
                    </button>
                  </div>
                </div>

                {/* ── Period Selector ─────────────────────────────────── */}
                {(() => {
                  if (profileOpenedByExactCode) {
                    let eng = isPqaMode ? pqaProfileSubject : selectedEngineer;
                    let pqaExactMonthPeriods = [];
                    if (isPqaMode && selectedEngineer) {
                      const selectedBranch = selectedEngineer.pqaBranch || appMode;
                      const pqaRows = engineers
                        .filter((e) => {
                          if (selectedBranch && e.pqaBranch && e.pqaBranch !== selectedBranch) return false;
                          return engineerCodeMatchesQuery(e.code, selectedEngineer.code);
                        })
                        .sort((a, b) => {
                          const ya = parseInt(a.year) || 0;
                          const yb = parseInt(b.year) || 0;
                          if (yb !== ya) return yb - ya;
                          return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
                        });
                      const monthKeyed = {};
                      const pqaRowRichness = (r) =>
                        ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'sdr', 'audit', 'pr'].reduce(
                          (s, f) => s + Math.abs(parseFloat(r[f] || 0)),
                          0
                        );
                      pqaRows.forEach((r) => {
                        const mk = `${r.month}-${r.year}`;
                        const prev = monthKeyed[mk];
                        if (!prev) {
                          monthKeyed[mk] = r;
                          return;
                        }
                        const nr = pqaRowRichness(r);
                        const np = pqaRowRichness(prev);
                        if (nr > np) monthKeyed[mk] = r;
                      });
                      pqaExactMonthPeriods = Object.values(monthKeyed).map((r, idx) => ({
                        key: `${r.month}-${r.year}`,
                        reactKey: r.id ? `pqa-exact-${String(r.id)}` : `pqa-exact-${idx}-${r.month}-${r.year}`,
                        label: `${r.month} ${r.year}`,
                        record: r,
                      }));
                      const exactKey = selectedProfileMonth && pqaExactMonthPeriods.some((p) => p.key === selectedProfileMonth)
                        ? selectedProfileMonth
                        : (pqaExactMonthPeriods[0]?.key || null);
                      const exactRec = pqaExactMonthPeriods.find((p) => p.key === exactKey)?.record || pqaExactMonthPeriods[0]?.record;
                      if (exactRec) {
                        const siblings = pqaRows.filter((r) => r.month?.toLowerCase() === exactRec.month?.toLowerCase() && String(r.year) === String(exactRec.year));
                        eng = mergePqaKpiFromRecords(exactRec, siblings);
                      }
                    }
                    const pqaSnapCaps = eng.pqaKpiCaps || (appMode === 'PQA_CE' ? PQA_KPI_DEFAULTS_CE : PQA_KPI_DEFAULTS_MX);
                    const dispSsr = parseFloat(eng.ssrScore ?? 0);
                    const dispRrr = parseFloat(eng.rrrScore || 0);
                    const dispIqc = parseFloat(eng.iqcSkipRatio || 0);
                    const dispCore = parseFloat(eng.corePartsScore ?? eng.corePartsPBA ?? 0);
                    const dispEval = parseFloat(eng.engineerEvaluation || 0);
                    const dispTrain = parseFloat(eng.q1TrainingScore ?? eng.trainingAttendance ?? 0);
                    const dispExam = parseFloat(eng.examScore || 0);
                    const dispDrnpsSheet = parseFloat(eng.drnpsScore ?? calculateDRNPS(eng.promoters, eng.detractors));
                    return (
                      <div className="rounded-[2rem] border border-blue-500/20 bg-zinc-900/50 p-8 md:p-10 max-w-4xl mx-auto space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.35em] mb-2">Verification by code — KPI snapshot</p>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {isPqaMode
                              ? `KPIs from the ★Evaluation point sheet — ${(eng.pqaBranch || appMode) === 'PQA_CE' ? 'CE' : 'MX'} registry only (MX vs CE are stored separately). Targets follow headers such as SSR (20), D-RNPS (10).`
                              : 'SSR % is imported from Excel column H. Engineer evaluation groups SSR, RRR, IQC skip, Core parts, and Q1 training (0–20 points). DRNPS and Exam are separate top-level scores. IQC % uses the cell before the IQC header when present.'}
                          </p>
                        </div>
                        {isPqaMode && pqaExactMonthPeriods.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {pqaExactMonthPeriods.map((p) => (
                              <button
                                key={p.reactKey}
                                onClick={() => setSelectedProfileMonth(p.key)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                  (selectedProfileMonth || pqaExactMonthPeriods[0]?.key) === p.key
                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                    : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {!isPqaMode ? (
                          <div className="space-y-8">
                            <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                <div>
                                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">Engineer evaluation</p>
                                  <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">Sub-metrics: SSR · RRR · IQC skip · Core parts · Q1 training</p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="text-3xl md:text-4xl font-black text-white italic tabular-nums">{dispEval.toFixed(1)}</span>
                                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Target ≥ 90</p>
                                </div>
                              </div>
                              <div className="space-y-5 pl-2 md:pl-4 border-l-2 border-emerald-500/35">
                                <MetricBar label="SSR %" value={dispSsr} max={100} suffix="%" target={0} inverse />
                                <MetricBar label="RRR (RRR90)" value={dispRrr} max={100} suffix="%" target={0} inverse />
                                <MetricBar label="IQC skip %" value={dispIqc} max={100} suffix="%" target={25} inverse />
                                <MetricBar label="Core parts %" value={dispCore} max={100} suffix="%" target={30} inverse />
                                <MetricBar label="Q1 training (max 20 pts)" value={Math.min(20, dispTrain)} max={20} suffix=" pts" target={20} />
                              </div>
                            </div>
                            <div className="rounded-2xl border border-purple-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-4">
                              <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.35em]">DRNPS</p>
                              <MetricBar label="DRNPS" value={dispDrnpsSheet} max={100} suffix="" target={80} />
                            </div>
                            <div className="rounded-2xl border border-blue-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-4">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.35em]">Exam</p>
                              <MetricBar label="Exam" value={dispExam} max={100} suffix="%" target={90} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="rounded-xl border border-blue-500/20 bg-zinc-950/60 p-4">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.25em]">Monthly total (Σpoint)</p>
                                <p className="text-2xl font-black text-white italic tabular-nums mt-1">{parseFloat(((eng.pqaBranch || appMode) === 'PQA_CE' ? (eng.centerMonthlyScore ?? eng.monthlyScore ?? eng.evalMonthlyScore) : (eng.evalMonthlyScore ?? eng.monthlyScore ?? eng.centerMonthlyScore)) || resolvePqaTcsScore(eng) || 0).toFixed(1)}</p>
                              </div>
                              <div className="rounded-xl border border-zinc-700/40 bg-zinc-950/60 p-4">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">Monthly rank</p>
                                <p className="text-2xl font-black text-zinc-200 italic tabular-nums mt-1">#{parseInt(((eng.pqaBranch || appMode) === 'PQA_CE' ? (eng.centerMonthlyRank || eng.monthlyRank || eng.monthlyEvalRank) : (eng.monthlyEvalRank || eng.monthlyRank || eng.centerMonthlyRank)) || 0, 10) || '-'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              <MetricBar label="LTP" value={parseFloat(eng.ltp || 0)} max={pqaSnapCaps.ltp} suffix=" pts" target={pqaSnapCaps.ltp} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="LTP VD" value={parseFloat(eng.ltpVd || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="LTP DA" value={parseFloat(eng.ltpDa || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="EX-LTP" value={parseFloat(eng.exLtp || 0)} max={pqaSnapCaps.exLtp} suffix=" pts" target={pqaSnapCaps.exLtp} />
                              <MetricBar label="REDO" value={parseFloat(eng.redo || 0)} max={pqaSnapCaps.redo} suffix=" pts" target={pqaSnapCaps.redo} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="DA Re-do" value={parseFloat(eng.redoDa || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="VD Re-do" value={parseFloat(eng.redoVd || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="SSR" value={parseFloat(eng.ssr || 0)} max={pqaSnapCaps.ssr} suffix=" pts" target={pqaSnapCaps.ssr} />
                              <MetricBar label="D-RNPS" value={parseFloat(eng.dRnps || 0)} max={pqaSnapCaps.dRnps} suffix=" pts" target={pqaSnapCaps.dRnps} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="NPS" value={parseFloat(eng.nps || 0)} max={20} suffix=" pts" target={20} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="NPS-DR" value={parseFloat(eng.npsDr || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="OFS" value={parseFloat(eng.ofs || 0)} max={pqaSnapCaps.ofs} suffix=" pts" target={pqaSnapCaps.ofs} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="Appointments" value={parseFloat(eng.appointments || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="R-CXE" value={parseFloat(eng.rCxe || 0)} max={pqaSnapCaps.rCxe} suffix=" pts" target={pqaSnapCaps.rCxe} />
                              <MetricBar label="CO.A" value={parseFloat(eng.coa || 0)} max={pqaSnapCaps.coa || 50} suffix="" target={pqaSnapCaps.coa || 50} />
                              <MetricBar label="SDR" value={parseFloat(eng.sdr || 0)} max={pqaSnapCaps.sdr} suffix=" pts" target={pqaSnapCaps.sdr} />
                              <MetricBar label="Audit" value={Math.abs(parseFloat(eng.audit || 0))} max={pqaSnapCaps.audit} suffix=" ded" target={0} inverse />
                              <MetricBar label="PR" value={Math.abs(parseFloat(eng.pr || 0))} max={pqaSnapCaps.pr} suffix=" ded" target={0} inverse />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // Build list of all monthly & quarterly periods for this engineer
                  // Deduplicate by month+year — keep highest score record per period
                  const allEngRecords = engineers
                    .filter((e) =>
                      isPqaMode
                        ? engineerCodeMatchesQuery(e.code, selectedEngineer.code)
                        : e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()
                    )
                    .sort((a, b) => {
                      const ya = parseInt(a.year), yb = parseInt(b.year);
                      if (ya !== yb) return ya - yb; // oldest year first
                      return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                    });
                  const pqaRowRichness = (r) =>
                    ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'sdr', 'audit', 'pr'].reduce(
                      (s, f) => s + Math.abs(parseFloat(r[f] || 0)),
                      0
                    );
                  // One record per month-year: TCS keeps highest tcsScore; PQA prefers rows with Evaluation-point KPIs
                  const dedupByMonth = {};
                  allEngRecords.forEach((r) => {
                    const k = `${r.month?.toLowerCase()}-${r.year}`;
                    const prev = dedupByMonth[k];
                    if (!prev) {
                      dedupByMonth[k] = r;
                      return;
                    }
                    if (isPqaMode) {
                      const nr = pqaRowRichness(r);
                      const np = pqaRowRichness(prev);
                      if (nr > np) dedupByMonth[k] = r;
                      else if (nr === np && parseFloat(r.tcsScore || 0) <= 100 && parseFloat(prev.tcsScore || 0) > 100) {
                        dedupByMonth[k] = r;
                      }
                    } else if (r.tcsScore > prev.tcsScore) {
                      dedupByMonth[k] = r;
                    }
                  });
                  const engRecords = Object.values(dedupByMonth).sort((a, b) => {
                    const ya = parseInt(a.year), yb = parseInt(b.year);
                    if (ya !== yb) return ya - yb; // oldest year first
                    return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                  });
                  const monthPeriods = engRecords.map((r, idx) => ({
                    key: `${r.month}-${r.year}`,
                    reactKey: r.id ? String(r.id) : `mp-${idx}-${r.month}-${r.year}`,
                    label: `${r.month} ${r.year}`,
                  }));
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
                  const { month: effM, year: effY } = parseMonthYearKey(effMonthKey || '');
                  const effRecord = engRecords.find(
                    r => r.month?.toLowerCase() === effM?.toLowerCase() && String(r.year) === String(effY)
                  ) || selectedEngineer;

                  const mergePqaForProfile = (rec) => {
                    if (!rec || !isPqaMode) return rec;
                    const br = rec.pqaBranch || appMode;
                    const sibs = engineers.filter((e) => {
                      if (br && e.pqaBranch && e.pqaBranch !== br) return false;
                      return engineerCodeMatchesQuery(e.code, rec.code);
                    });
                    return mergePqaKpiFromRecords(rec, sibs);
                  };
                  const pqaEffMerged = isPqaMode && effRecord ? mergePqaForProfile(effRecord) : null;

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
                  const qAvgSsr = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.ssrScore ?? r.redoRatio ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgRrr = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.rrrScore || 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgIqc = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.iqcSkipRatio || 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgCoreParts = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.corePartsScore ?? r.corePartsPBA ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgQ1Training = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.q1TrainingScore ?? r.trainingAttendance ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgEval = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + (parseFloat(r.engineerEvaluation || 0)), 0) / qRecords.length).toFixed(1))
                    : 0;

                  // The record whose data drives the performance bars (PQA: merge Evaluation-point KPIs from all uploads for this center)
                  const dispRecord = (() => {
                    if (!isPqaMode) {
                      return profileViewMode === 'QUARTERLY' ? (qRecords[0] || selectedEngineer) : effRecord;
                    }
                    if (profileViewMode === 'QUARTERLY') {
                      return mergePqaForProfile(qRecords[0] || effRecord || selectedEngineer);
                    }
                    return pqaEffMerged || effRecord;
                  })();
                  const dispScore = (() => {
                    if (!isPqaMode) {
                      return profileViewMode === 'QUARTERLY' ? qAvgScore : effRecord.tcsScore;
                    }
                    if (profileViewMode === 'QUARTERLY' && qRecords.length > 0) {
                      return parseFloat(
                        (
                          qRecords.reduce((s, r) => s + resolvePqaTcsScore(mergePqaForProfile(r)), 0) /
                          qRecords.length
                        ).toFixed(1)
                      );
                    }
                    return resolvePqaTcsScore(pqaEffMerged || effRecord);
                  })();
                  
                  // Weighted component pts - handle PQA vs TCS
                  const dispExam = isPqaMode ? 0 : (profileViewMode === 'QUARTERLY' ? qAvgExam : parseFloat(effRecord.examScore || 0));
                  const dispDrnps = isPqaMode ? parseFloat(dispRecord.dRnps || 0) : (profileViewMode === 'QUARTERLY' ? qAvgDrnps : calculateDRNPS(effRecord.promoters, effRecord.detractors));
                  const dispSsr = profileViewMode === 'QUARTERLY' ? qAvgSsr : parseFloat(effRecord.ssrScore ?? effRecord.redoRatio ?? 0);
                  const dispRrr = profileViewMode === 'QUARTERLY' ? qAvgRrr : parseFloat(effRecord.rrrScore || 0);
                  const dispIqc = profileViewMode === 'QUARTERLY' ? qAvgIqc : parseFloat(effRecord.iqcSkipRatio || 0);
                  const dispCoreParts = profileViewMode === 'QUARTERLY' ? qAvgCoreParts : parseFloat(effRecord.corePartsScore ?? effRecord.corePartsPBA ?? 0);
                  const dispQ1Training = profileViewMode === 'QUARTERLY' ? qAvgQ1Training : parseFloat(effRecord.q1TrainingScore ?? effRecord.trainingAttendance ?? 0);
                  const dispDrnpsRaw = profileViewMode === 'QUARTERLY'
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.drnpsScore ?? calculateDRNPS(r.promoters, r.detractors)), 0) / (qRecords.length || 1)).toFixed(1))
                    : parseFloat(effRecord.drnpsScore ?? calculateDRNPS(effRecord.promoters, effRecord.detractors));

                  const examPts = isPqaMode ? 0 : parseFloat(Math.min(20, (dispExam / 100) * 20).toFixed(1));
                  const drnpsPts = isPqaMode ? 0 : parseFloat(Math.min(30, (dispDrnps / 100) * 30).toFixed(1));
                  const isQ1Record = ['jan', 'january', 'feb', 'february', 'mar', 'march'].includes(String(effRecord.month || '').toLowerCase());
                  const isQ1Quarter = String(effQ || '').toUpperCase() === 'Q1';
                  const hasQ1Eval = profileViewMode === 'QUARTERLY'
                    ? qRecords.some(r => r.engineerEvaluation !== undefined && r.engineerEvaluation !== null && r.engineerEvaluation !== '')
                    : (effRecord.engineerEvaluation !== undefined && effRecord.engineerEvaluation !== null && effRecord.engineerEvaluation !== '');
                  const useQ1EvalBreakdown = !isPqaMode && hasQ1Eval && ((profileViewMode === 'QUARTERLY' && isQ1Quarter) || (profileViewMode === 'MONTHLY' && isQ1Record));
                  const dispEval = profileViewMode === 'QUARTERLY' ? qAvgEval : parseFloat(effRecord.engineerEvaluation || 0);
                  const evalPts = isPqaMode ? 0 : parseFloat(Math.min(50, (dispEval / 100) * 50).toFixed(1));
                  const kpiPts = isPqaMode
                    ? dispScore
                    : (useQ1EvalBreakdown
                      ? evalPts
                      : parseFloat(((dispScore - (examPts || 0) - (drnpsPts || 0))).toFixed(1)));

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
                                key={p.reactKey}
                                onClick={() => {
                                  setSelectedProfileMonth(p.key);
                                  const { month: m, year: y } = parseMonthYearKey(p.key);
                                  const rec = engRecords.find(r => r.month?.toLowerCase() === m?.toLowerCase() && String(r.year) === String(y));
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
                            {profileViewMode === 'QUARTERLY' ? `Avg ${isPqaMode ? 'Points' : 'TCS'} — ${effQKey?.replace('-', ' ')}` : `${isPqaMode ? 'Monthly Sum' : 'TCS Score'} — ${effM ? `${effM} ${effY}` : '—'}`}
                          </span>
                          <span className="text-6xl font-black text-white italic tracking-tighter">{dispScore}</span>
                          {dispRecord.monthlyRank > 0 && profileViewMode === 'MONTHLY' && (
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2">Monthly Rank: #{dispRecord.monthlyRank}</span>
                          )}
                          {/* TCS: show tier badge | PQA: show numeric rank */}
                          {isPqaMode ? (
                            <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">PQA Score</span>
                            </div>
                          ) : (
                            <TierBadge tier={getTier(dispScore)} size="lg" />
                          )}
                        </div>

                        {/* Three weighted components / PQA Components */}
                        <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                          {!isPqaMode ? (
                            <>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">{useQ1EvalBreakdown ? 'Evaluation' : 'KPIs'}</span>
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
                            </>
                          ) : (
                            <>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Base Pts</span>
                                <span className="text-3xl font-black text-emerald-300 italic">
                                  {(parseFloat(dispRecord.ltp || 0) + parseFloat(dispRecord.exLtp || 0) + parseFloat(dispRecord.redo || 0) + 
                                    parseFloat(dispRecord.ssr || 0) + parseFloat(dispRecord.dRnps || 0) + parseFloat(dispRecord.ofs || 0) + 
                                    parseFloat(dispRecord.rCxe || 0) + parseFloat(dispRecord.sdr || 0)).toFixed(1)}
                                </span>
                              </div>
                              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Audit</span>
                                <span className="text-3xl font-black text-rose-300 italic">{Math.abs(dispRecord.audit || 0).toFixed(1)}</span>
                              </div>
                              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">PR/Penalty</span>
                                <span className="text-3xl font-black text-orange-300 italic">{Math.abs(dispRecord.pr || 0).toFixed(1)}</span>
                              </div>
                            </>
                          )}
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
                            {isPqaMode ? (
                              <div className="space-y-8">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em]">Operations Scoring Components</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                  <MetricBar label="LTP" value={parseFloat(dispRecord.ltp || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="Ex-LTP" value={parseFloat(dispRecord.exLtp || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="REDO Rate" value={parseFloat(dispRecord.redo || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="SSR Utilization" value={parseFloat(dispRecord.ssr || 0)} max={20} suffix=" pts" target={20} />
                                  <MetricBar label="D-RNPS" value={parseFloat(dispRecord.dRnps || 0)} max={20} suffix=" pts" target={20} />
                                  <MetricBar label="OFS Accuracy" value={parseFloat(dispRecord.ofs || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="R-CXE Quality" value={parseFloat(dispRecord.rCxe || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="SDR Score" value={parseFloat(dispRecord.sdr || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="Process Audit" value={parseFloat(dispRecord.audit || 0)} max={5} suffix=" ded" target={0} inverse />
                                  <MetricBar label="Policy Review (PR)" value={parseFloat(dispRecord.pr || 0)} max={5} suffix=" ded" target={0} inverse />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-5">
                                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Score Components</p>
                                  <MetricBar label="Exam Score" value={dispExam} max={100} suffix=" pts" target={90} />
                                  <MetricBar label="DRNPS" value={parseFloat(dispDrnps.toFixed(1))} max={100} suffix=" pts" target={80} />
                                </div>
                                <div className="border-t border-white/5 pt-8 space-y-6">
                                  <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Uploaded Excel Metrics</p>
                                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest -mt-1 mb-1">SSR column H · Q1 training = points out of 20 (not %) · Engineer evaluation (mother) → SSR, RRR, IQC skip, Core parts, Q1 training · DRNPS and Exam are separate mother categories.</p>
                                  <div className="rounded-2xl border border-emerald-500/20 bg-zinc-950/50 p-6 space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-white/5 pb-4">
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Engineer evaluation</p>
                                      <span className="text-2xl font-black text-white italic tabular-nums">{dispEval.toFixed(1)}</span>
                                    </div>
                                    <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-emerald-500/30">
                                      <MetricBar label="SSR %" value={dispSsr} max={100} suffix="%" target={0} inverse />
                                      <MetricBar label="RRR (RRR90)" value={dispRrr} max={100} suffix="%" target={0} inverse />
                                      <MetricBar label="IQC skip %" value={dispIqc} max={100} suffix="%" target={25} inverse />
                                      <MetricBar label="Core parts %" value={dispCoreParts} max={100} suffix="%" target={30} inverse />
                                      <MetricBar label="Q1 training (max 20 pts)" value={Math.min(20, dispQ1Training)} max={20} suffix=" pts" target={20} />
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-purple-500/20 bg-zinc-950/50 p-6 space-y-3">
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">DRNPS</p>
                                    <MetricBar label="DRNPS (sheet)" value={dispDrnpsRaw} max={100} suffix="" target={80} />
                                  </div>
                                  <div className="rounded-2xl border border-blue-500/20 bg-zinc-950/50 p-6 space-y-3">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Exam</p>
                                    <MetricBar label="Exam" value={dispExam} max={100} suffix="%" target={90} />
                                  </div>
                                </div>
                                <div className="border-t border-white/5 pt-8 space-y-5">
                                  <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">KPI Breakdown (50% of Total)</p>
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
                              </>
                            )}
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
                                <span className="text-xs font-black text-yellow-400 uppercase">{selectedEngineer.quarter || getQuarter(selectedEngineer.month)} · {selectedEngineer.year}</span>
                              </div>
                              {selectedEngineer.sbaId && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-zinc-600 uppercase">SBA ID</span>
                                  <span className="text-xs font-black text-white uppercase">{selectedEngineer.sbaId}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">{isPqaMode ? 'Ranking' : 'Tier Status'}</span>
                                {isPqaMode ? (
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Numeric Only</span>
                                ) : (
                                  <TierBadge tier={selectedEngineer.tier} size="sm" />
                                )}
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



                {/* Compliance Watermark */}
                <div className="pt-12 text-center opacity-20 select-none pointer-events-none">
                  <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">Official TCS Certification Document • Unauthorized reproduction prohibited</p>
                </div>
              </div>
            </>
          )}

          {/* ─── ENGINEER HISTORY VIEW ──────────────────────────────────────────────── */}
          {view === 'ENGINEER_HISTORY' && selectedEngineer && (() => {
            // All records for this engineer — engineerHistory is newest-first
            const allRecords = engineerHistory;
            const dedupByPeriod = {};
            allRecords.forEach(r => {
              const k = `${String(r.month || '').toLowerCase()}-${r.year}`;
              if (!dedupByPeriod[k] || (r.tcsScore ?? 0) > (dedupByPeriod[k].tcsScore ?? 0)) dedupByPeriod[k] = r;
            });
            const calendarRecords = Object.values(dedupByPeriod).sort((a, b) => {
              const ya = parseInt(a.year), yb = parseInt(b.year);
              if (ya !== yb) return ya - yb;
              return getMonthIndex(a.month) - getMonthIndex(b.month);
            });
            const newestKey = allRecords[0] ? `${allRecords[0].month}-${allRecords[0].year}` : null;
            const effKey = selectedHistoryMonth || newestKey;
            const { month: ekM, year: ekY } = parseMonthYearKey(effKey || '');
            const activeRecord = calendarRecords.find(
              r => r.month?.toLowerCase() === ekM?.toLowerCase() && String(r.year) === String(ekY)
            ) || allRecords[0];

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
                              key={r.id ? `${r.id}-${key}` : `hist-${idx}-${key}`}
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
                            {/* TCS: tier badge | PQA: no badge */}
                            {!isPqaMode && <TierBadge tier={activeRecord.tier} size="lg" />}
                            <div className="text-right">
                              <span className="text-5xl font-black text-white italic tracking-tighter">{activeRecord.tcsScore}</span>
                              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{appMode?.startsWith('PQA') ? 'PQA Score' : 'TCS Score'}</p>
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


          {/* ─── PQA INFO / REFERENCE VIEW ─────────────────────────────────────────── */}
          {view === 'PQA_INFO' && (
            <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <div className="text-center space-y-4 border-b border-white/5 pb-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Service Center Guide</span>
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic">PQA<br />Reference Guide</h2>
                <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto">Performance & Quality Assurance — The standard for Samsung Service Center excellence.</p>
              </div>

              {/* What is PQA */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">What is PQA Ranking?</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  The <strong className="text-white">PQA Ranking</strong> evaluates Samsung Service Centers based on operational efficiency, repair quality, and customer experience. Unlike individual engineer TCS scores, PQA aggregated data focuses on center-wide performance (LTP, REDO, SDR) and adherence to official field audit protocols.
                </p>
              </div>

              {/* PQA Metrics Breakdown */}
              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Core Operational Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'LTP (Life-Time Perf)', pts: '10 pts', desc: 'Accumulated performance score focusing on long-term repair stability.' },
                    { label: 'Ex-LTP (Excessive LTP)', pts: '10 pts', desc: 'Tracking and reducing excessive repair times to maintain productivity.' },
                    { label: 'REDO Rate', pts: '10 pts', desc: 'Service quality indicator measuring devices that returned within the warranty period.' },
                    { label: 'SSR (Same Symptom REDO)', pts: '20 pts', desc: 'Specific tracking for devices returning with identical symptoms within 90 days.' },
                    { label: 'D-RNPS', pts: '20 pts', desc: 'Retail Net Promoter Score for the service center, evaluating customer satisfaction.' },
                    { label: 'OFS Ordering Accuracy', pts: '10 pts', desc: 'Ordering Field Score: Warehouse accuracy and precision in ordering spare parts.' },
                    { label: 'R-CXE Experience', pts: '10 pts', desc: 'Customer Experience quality measured through environment and staff interaction.' },
                    { label: 'SDR (Same Day Repair)', pts: '10 pts', desc: 'Speed efficiency measuring the percentage of repairs completed on the same day.' },
                  ].map(({ label, pts, desc }) => (
                    <div key={label} className="bg-zinc-900 shadow-xl border border-white/5 rounded-3xl p-8 space-y-3 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400">{label}</span>
                        <span className="text-[10px] font-black text-yellow-500 uppercase">{pts}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-950/20 border border-red-500/20 rounded-[3rem] p-10 md:p-16 space-y-8">
                 <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">System Deductions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-sm font-black text-red-400 uppercase tracking-tight">Audit Shortfalls (Max -5 pts)</p>
                    <p className="text-zinc-500 text-xs text-pretty">Specific point deductions triggered by monthly field process audits and inventory checks.</p>
                  </div>
                   <div className="space-y-3">
                    <p className="text-sm font-black text-red-400 uppercase tracking-tight">Policy Review - PR (Max -5 pts)</p>
                    <p className="text-zinc-500 text-xs text-pretty">Non-compliance with the latest Samsung Global Service Policies or environmental standards.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('ADMIN_DASHBOARD')}
                className="w-full py-6 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all"
              >
                Return to Dashboard
              </button>
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
                        <img src={getPhotoUrl(editingEng)} className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" alt="Profile" />
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

                      {!appMode?.startsWith('PQA') ? (
                        <>
                          {/* ── TCS Mode: Exam & DRNPS ── */}
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

                          {/* ── TCS Mode: KPI Inputs ── */}
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
                        </>
                      ) : (
                        <>
                          {/* ── PQA Mode: Operations Metrics ── */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">LTP Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.ltp} onChange={e => setEditingEng({ ...editingEng, ltp: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">EX-LTP Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.exLtp} onChange={e => setEditingEng({ ...editingEng, exLtp: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">SDR (Same Day Repair) <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-emerald-500 transition-all outline-none" value={editingEng.sdr} onChange={e => setEditingEng({ ...editingEng, sdr: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">D-RNPS <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.dRnps} onChange={e => setEditingEng({ ...editingEng, dRnps: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">REDO Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.redo} onChange={e => setEditingEng({ ...editingEng, redo: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">SSR (90 Day Redo) <span className="text-zinc-600 normal-case">max 20 pts</span></label>
                              <input type="number" step="0.1" min="0" max="20" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-600 transition-all outline-none" value={editingEng.ssr} onChange={e => setEditingEng({ ...editingEng, ssr: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest ml-1">OFS (Parts Accuracy) <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-teal-500 transition-all outline-none" value={editingEng.ofs} onChange={e => setEditingEng({ ...editingEng, ofs: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">R-CXE Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-zinc-500 transition-all outline-none" value={editingEng.rCxe} onChange={e => setEditingEng({ ...editingEng, rCxe: e.target.value })} />
                            </div>

                            {/* ── PQA Mode: Deductions ── */}
                            <div className="border-t border-white/5 pt-8 md:col-span-2 space-y-6">
                               <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.4em]">Negative Deductions</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Audit Penalty <span className="text-zinc-600 normal-case">subtracted</span></label>
                                    <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/20 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-600 transition-all outline-none" value={Math.abs(editingEng.audit || 0)} onChange={e => setEditingEng({ ...editingEng, audit: e.target.value })} />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">PR Penalty <span className="text-zinc-600 normal-case">subtracted</span></label>
                                    <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/20 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-600 transition-all outline-none" value={Math.abs(editingEng.pr || 0)} onChange={e => setEditingEng({ ...editingEng, pr: e.target.value })} />
                                  </div>
                               </div>
                            </div>
                          </div>
                        </>
                      )}
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
      {view !== 'APP_SELECTION' && view !== 'PQA_DIVISION_SELECTION' && view !== 'TCS_DIVISION_SELECTION' && (
      <button
        onClick={() => { setShowFeedbackModal(true); setFeedbackSent(false); setFeedbackText(''); setFeedbackCode(''); setFeedbackRating(0); }}
        className="fixed bottom-28 right-5 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-2xl shadow-2xl shadow-purple-900/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Send Feedback"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>
      )}

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

      {/* Engineer / Service Center Photo Auth Modal */}
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
                <p className="text-zinc-500 text-xs">{isPqaMode ? 'All records for this service center have been updated.' : 'Your profile photo has been updated.'}</p>
                <button onClick={() => { setShowPhotoAuth(false); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                  className="px-8 py-3 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all">Done</button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2 pt-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mx-auto ${isPqaMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-600/10 border-blue-500/20'}`}>
                    <Camera className={`w-7 h-7 ${isPqaMode ? 'text-yellow-400' : 'text-blue-400'}`} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {isPqaMode ? 'Update Center Photo' : 'Update Photo'}
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    {photoAuthStep === 'upload'
                      ? (isPqaMode ? 'Choose the new service center photo' : 'Choose your new profile photo')
                      : (isPqaMode ? 'Enter service center code to verify' : 'Confirm your engineer code to continue')}
                  </p>
                </div>
                {photoAuthStep !== 'upload' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">
                      {isPqaMode ? 'Service Center Code' : 'Your Engineer Code'}
                    </label>
                    <input type="text" value={photoAuthCode} onChange={e => setPhotoAuthCode(e.target.value.toUpperCase())}
                      placeholder={isPqaMode ? 'Enter service center code' : 'Enter your engineer code'}
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
                    {!isPqaMode && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-2">Photo Requirements</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Wearing official Samsung uniform</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Face centered and looking at the camera</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> No sunglasses or face coverings</p>
                        <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed border-t border-white/5 pt-3">
                          Self-service: one photo change every 90 days. Signed-in admins can replace photos anytime from the admin portal.
                        </p>
                      </div>
                    )}
                    {isPqaMode && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">📸 Photo Tips</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> Use the official service center building photo</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> Clear, well-lit exterior or interior shot</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> This photo will show across all records for this center</p>
                        <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed border-t border-white/5 pt-3">
                          Self-service: one photo change every 90 days. Signed-in admins can replace photos anytime from the admin portal.
                        </p>
                      </div>
                    )}
                    <button disabled={!selfPhotoFile || selfPhotoUploading}
                      onClick={async () => {
                        if (!selfPhotoFile) return;
                        setSelfPhotoUploading(true);
                        try {
                          let url = null;
                          if (isPqaMode) {
                            try {
                              url = await uploadPhoto(selfPhotoFile, 'PQA', selectedEngineer.code.toUpperCase(), { stableFileName: true });
                            } catch (e) {
                              url = await uploadPhoto(selfPhotoFile, 'engineers', selectedEngineer.code.toUpperCase(), { stableFileName: true });
                            }
                          } else {
                            url = await uploadPhoto(selfPhotoFile, getTcsStorageFolder(), selectedEngineer.code.toUpperCase(), { stableFileName: true });
                          }
                          if (url) {
                            const now = Date.now();
                            const updatedEngineers = engineers.map(e =>
                              e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()
                                ? { ...e, photoUrl: url, photoUpdatedAt: now }
                                : e
                            );
                            const seen = new Set();
                            for (const e of updatedEngineers) {
                              if (e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase() && !seen.has(e.id)) {
                                seen.add(e.id);
                                await saveEngineerToDb({ ...e, photoUrl: url, photoUpdatedAt: now }, colName);
                              }
                            }
                            setEngineers(updatedEngineers);
                            setSelectedEngineer(prev => {
                              const row = updatedEngineers.find(x => x.id === prev.id);
                              return row ? { ...row } : { ...prev, photoUrl: url, photoUpdatedAt: now };
                            });
                          }
                          setPhotoAuthStep('done');
                        } catch (err) {
                          console.error('Upload error:', err);
                          const code = err?.code || '';
                          if (code.includes('unauthorized') || code.includes('permission')) {
                            message.error('Permission denied. Check Firebase Storage rules.');
                          } else if (code.includes('canceled') || code.includes('network')) {
                            message.error('Network error. Check your connection and try again.');
                          } else {
                            message.error(`Upload failed: ${err?.message || err?.code || 'Unknown error'}`);
                          }
                        } finally { setSelfPhotoUploading(false); }
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
                      if (photoAuthCode.trim().toUpperCase() !== selectedEngineer.code.trim().toUpperCase()) {
                        message.error(isPqaMode ? 'Service center code does not match. Access denied.' : 'Engineer code does not match. Access denied.');
                        return;
                      }
                      const adminBypass = !!(isLogged && currentUser);
                      if (!adminBypass) {
                        const last = photoUpdatedAtMs(selectedEngineer);
                        if (last > 0 && Date.now() - last < PHOTO_COOLDOWN_MS) {
                          const daysLeft = Math.max(1, Math.ceil((PHOTO_COOLDOWN_MS - (Date.now() - last)) / (24 * 60 * 60 * 1000)));
                          message.error(`Photo updates are limited to once every 90 days. Try again in about ${daysLeft} day(s), or ask an admin.`);
                          return;
                        }
                      }
                      setPhotoAuthStep('upload');
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

      {view !== 'APP_SELECTION' && view !== 'PQA_DIVISION_SELECTION' && view !== 'TCS_DIVISION_SELECTION' && (
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[98%] max-w-lg bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-4 px-6 flex justify-around items-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50">
        {/* Dashboard */}
        <button onClick={() => navigateTo('HOME')} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 ${view === 'HOME' ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <BarChart3 className={`w-5 h-5 ${view === 'HOME' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tight">Dashboard</span>
        </button>
        {/* Search — center, elevated */}
        <button onClick={() => { setProfileOpenedByExactCode(false); navigateTo('ENGINEER_LOOKUP'); }} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 relative ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <div className={`-mt-6 w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-xl transition-all duration-200 ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'bg-blue-600 shadow-blue-500/40 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Search className="w-6 h-6" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight mt-0.5">Search</span>
        </button>
        {/* Secure */}
        <button onClick={() => navigateTo(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')} className={`cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 ${['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'PROFILE_MGMT'].includes(view) ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <ShieldCheck className={`w-5 h-5 ${['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'PROFILE_MGMT'].includes(view) ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tight">Secure</span>
        </button>
      </nav>
      )}

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
