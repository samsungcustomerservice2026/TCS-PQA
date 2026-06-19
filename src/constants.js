// Constants and Helpers

/** Default engineer avatar until they upload their own photo (Samsung logo). */
export const DEFAULT_ENGINEER_PHOTO_URL =
  'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FSAMSUNG.jpg?alt=media&token=90a6b923-e8c1-4f65-96d1-0852386e73c1';

// ─── KPI TARGETS & SCORE WEIGHTS ─────────────────────────────
// All 8 KPIs combined → 50% of TCS score (max 50 pts)
// DRNPS              → 30% of TCS score (max 30 pts)
// Exam               → 20% of TCS score (max 20 pts)
// ─────────────────────────────── Total Max = 100 pts
//
// KPI raw contributions (out of 100 total raw):
// REDO:              target ≤ 0.7%   → 30 pts (lower is better)
// IQC skip ratio:    target ≤ 25%    → 15 pts (lower is better)
// Maintenance Mode:  target ≥ 65%    → 10 pts (higher is better)
// OQC pass rate:     target ≥ 85%    → 15 pts (higher is better)
// Training Attend.:  target = 100%   → 10 pts (higher is better)
// Core Parts PBA:    target ≤ 30%    →  5 pts (lower is better)
// Core Parts Octa:   target ≤ 40%    →  5 pts (lower is better)
// Multi Parts ratio: target ≤ 1%     → 10 pts (lower is better)

/**
 * Calculates the DRNPS score (0–100) from promoter/detractor counts.
 * Formula: (((promoters - detractors) * 10) + 100) / 2
 */
export const calculateDRNPS = (promoters, detractors) => {
    const p = parseFloat(promoters) || 0;
    const d = parseFloat(detractors) || 0;
    const raw = (((p - d) * 10) + 100) / 2;
    return Math.min(100, Math.max(0, raw));
};

const resolveDrnpsScore = (eng) => {
    const direct = parseFloat(eng?.drnpsScore);
    if (Number.isFinite(direct)) {
        return Math.min(100, Math.max(0, direct));
    }
    return calculateDRNPS(eng?.promoters, eng?.detractors);
};

/**
 * Returns a capped proportional score for a "lower is better" KPI.
 * actual <= target → full score; otherwise proportionally reduced.
 */
const lowerIsBetter = (actual, target, maxPts) => {
    if (actual <= 0) return maxPts; // perfect: zero usage
    return Math.min(maxPts, (target / actual) * maxPts);
};

/**
 * Returns a capped proportional score for a "higher is better" KPI.
 * actual >= target → full score; otherwise proportionally reduced.
 */
const higherIsBetter = (actual, target, maxPts) => {
    return Math.min(maxPts, (actual / target) * maxPts);
};

/**
 * Calculates the overall TCS score out of 100.
 *
 * Fields expected on `eng`:
 *   redoRatio          – REDO %
 *   iqcSkipRatio       – IQC skip %
 *   maintenanceModeRatio – Maintenance mode %
 *   oqcPassRate        – OQC pass %
 *   trainingAttendance – Training attendance %
 *   corePartsPBA       – Core parts PBA %
 *   corePartsOcta      – Core parts Octa %
 *   multiPartsRatio    – Multi parts %
 *   examScore          – Exam score (0–100)
 *   promoters          – DRNPS promoter count
 *   detractors         – DRNPS detractor count
 */
export const calculateTCS = (eng) => {
    const n = (v) => parseFloat(v) || 0;

    // ── KPI Scores (raw, out of 100 total) ──────────────────────
    const redoScore = lowerIsBetter(n(eng.redoRatio), 0.7, 30);
    const iqcScore = lowerIsBetter(n(eng.iqcSkipRatio), 25, 15);
    const maintScore = higherIsBetter(n(eng.maintenanceModeRatio), 65, 10);
    const oqcScore = higherIsBetter(n(eng.oqcPassRate), 85, 15);
    const trainingScore = higherIsBetter(n(eng.trainingAttendance), 100, 10);
    const corePBAScore = lowerIsBetter(n(eng.corePartsPBA), 30, 5);
    const coreOctaScore = lowerIsBetter(n(eng.corePartsOcta), 40, 5);
    const multiScore = lowerIsBetter(n(eng.multiPartsRatio), 1, 10);

    const rawKPI = redoScore + iqcScore + maintScore + oqcScore +
        trainingScore + corePBAScore + coreOctaScore + multiScore;
    // Scale raw KPI (max 100) → 50 pts  [50% weight]
    const kpiContribution = (rawKPI / 100) * 50;

    // ── Exam Score → 20 pts  [20% weight] ───────────────────────
    const examContribution = Math.min(20, (n(eng.examScore) / 100) * 20);

    // ── DRNPS Score → 30 pts  [30% weight] ──────────────────────
    const drNPS = resolveDrnpsScore(eng);
    const drnpsContribution = Math.min(30, (drNPS / 100) * 30);

    const finalScore = kpiContribution + examContribution + drnpsContribution;
    return Number(finalScore.toFixed(1));
};

const Q1_MONTHS = new Set(['jan', 'feb', 'mar', 'january', 'february', 'march']);

const isQ1Month = (monthValue) => {
    const key = String(monthValue || '').trim().toLowerCase();
    return Q1_MONTHS.has(key);
};

/**
 * Q1 weighted formula using direct Engineer Evaluation score:
 *   Engineer Evaluation (0-100) -> 50%
 *   DRNPS (0-100)               -> 30%
 *   Exam (0-100)                -> 20%
 */
export const calculateTCSQ1Weighted = (eng) => {
    const n = (v) => parseFloat(v) || 0;
    const evalContribution = Math.min(50, (n(eng.engineerEvaluation) / 100) * 50);
    const drNPS = resolveDrnpsScore(eng);
    const drnpsContribution = Math.min(30, (drNPS / 100) * 30);
    const examContribution = Math.min(20, (n(eng.examScore) / 100) * 20);
    return Number((evalContribution + drnpsContribution + examContribution).toFixed(1));
};

/**
 * Hybrid scorer:
 * - Jan/Feb/Mar with engineerEvaluation provided -> Q1 weighted formula
 * - Otherwise -> existing KPI-based TCS formula (used by Apr+ criteria)
 */
export const calculateTCSFinalScore = (eng) => {
    const hasQ1Eval = eng?.engineerEvaluation !== undefined && eng?.engineerEvaluation !== null && eng?.engineerEvaluation !== '';
    if (hasQ1Eval && isQ1Month(eng?.month)) {
        return calculateTCSQ1Weighted(eng);
    }
    return calculateTCS(eng);
};

export const calculatePQAScore = (pqa) => {
    const n = (v) => parseFloat(v) || 0;
    
    const baseScore = n(pqa.ltp) + n(pqa.exLtp) + n(pqa.redo) + n(pqa.ssr) + 
                      n(pqa.dRnps) + n(pqa.ofs) + n(pqa.rCxe) + n(pqa.sdr);
    
    // Deductions: ensure they are subtracted
    let auditScore = n(pqa.audit);
    if (auditScore > 0) auditScore = -auditScore;
    let prScore = n(pqa.pr);
    if (prScore > 0) prScore = -prScore;
    
    const finalScore = baseScore + auditScore + prScore;
    return Number(Math.max(0, Math.min(100, finalScore)).toFixed(1));
};

export const getTier = (score) => {
    if (score >= 95) return 'Masters';
    if (score >= 90) return 'Diamond';
    if (score >= 80) return 'Platinum';
    if (score >= 70) return 'Gold';
    if (score >= 60) return 'Silver';
    return 'Bronze';
};

export const getTierColor = (tier) => {
    switch (tier) {
        case 'Masters': return 'text-purple-400 border-purple-400 shadow-purple-500/50';
        case 'Diamond': return 'text-blue-300 border-blue-300 shadow-blue-500/50';
        case 'Platinum': return 'text-zinc-200 border-zinc-200 shadow-zinc-200/50';
        case 'Gold': return 'text-yellow-500 border-yellow-500 shadow-yellow-500/50';
        case 'Silver': return 'text-zinc-400 border-zinc-400 shadow-zinc-400/50';
        default: return 'text-orange-700 border-orange-700 shadow-orange-700/50';
    }
};

const buildMxDemoRecord = ({ id, name, code, engineerEvaluation, examScore = 85, promoters = 28, detractors = 2 }) => ({
    id,
    name,
    code,
    photoUrl: DEFAULT_ENGINEER_PHOTO_URL,
    asc: 'Samsung ASC',
    partnerName: 'MX Division',
    month: 'March',
    year: '2026',
    product: 'MX',
    redoRatio: 0.5,
    iqcSkipRatio: 18,
    maintenanceModeRatio: 70,
    oqcPassRate: 88,
    trainingAttendance: 100,
    corePartsPBA: 22,
    corePartsOcta: 35,
    multiPartsRatio: 0.8,
    engineerEvaluation,
    examScore,
    promoters,
    detractors,
    tcsScore: 0,
    tier: 'Bronze',
});

export const INITIAL_ENGINEERS = [
    {
        id: '1',
        name: 'Admin Demo',
        code: 'SAM-001',
        photoUrl: 'https://picsum.photos/seed/samsung/200/200',
        asc: 'Service HQ',
        partnerName: 'TCS Global',
        month: 'March',
        year: '2025',
        redoRatio: 0.5,
        iqcSkipRatio: 18,
        maintenanceModeRatio: 70,
        oqcPassRate: 88,
        trainingAttendance: 100,
        corePartsPBA: 22,
        corePartsOcta: 35,
        multiPartsRatio: 0.8,
        examScore: 93,
        promoters: 45,
        detractors: 3,
        tcsScore: 0,
        tier: 'Bronze'
    }
];

/** Demo seed for TCS MX Receptionists (separate Firestore collection). */
export const INITIAL_MX_RECEPTIONISTS = [
    { id: 'rx-demo-1', name: 'Sara Hassan', code: 'RX-001', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 42, iqcFirstTimeFail: 3.2, drnpsPercent: 88, examScore: 94, coa: 8, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
    { id: 'rx-demo-2', name: 'Nour Ali', code: 'RX-002', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 38, iqcFirstTimeFail: 4.1, drnpsPercent: 85, examScore: 91, coa: 7, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
    { id: 'rx-demo-3', name: 'Mona Farid', code: 'RX-003', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 35, iqcFirstTimeFail: 4.8, drnpsPercent: 82, examScore: 88, coa: 6, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
    { id: 'rx-demo-4', name: 'Hana Youssef', code: 'RX-004', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 31, iqcFirstTimeFail: 5.5, drnpsPercent: 80, examScore: 85, coa: 5, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
    { id: 'rx-demo-5', name: 'Laila Kamal', code: 'RX-005', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 28, iqcFirstTimeFail: 6.2, drnpsPercent: 78, examScore: 82, coa: 4, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
    { id: 'rx-demo-6', name: 'Dina Mahmoud', code: 'RX-006', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', voteForMe: 24, iqcFirstTimeFail: 7.0, drnpsPercent: 75, examScore: 79, coa: 3, roleType: 'receptionist', tcsScore: 0, tier: 'Bronze' },
];

/** Demo seed for TCS MX Galaxy Consultants (separate Firestore collection). */
export const INITIAL_MX_GALAXY_CONSULTANTS = [
    { id: 'gc-demo-1', name: 'Omar Galaxy', code: 'GC-001', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 48, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
    { id: 'gc-demo-2', name: 'Youssef Galaxy', code: 'GC-002', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 44, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
    { id: 'gc-demo-3', name: 'Karim Galaxy', code: 'GC-003', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 40, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
    { id: 'gc-demo-4', name: 'Tarek Galaxy', code: 'GC-004', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 36, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
    { id: 'gc-demo-5', name: 'Amr Galaxy', code: 'GC-005', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 32, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
    { id: 'gc-demo-6', name: 'Hadi Galaxy', code: 'GC-006', photoUrl: DEFAULT_ENGINEER_PHOTO_URL, asc: 'Samsung ASC', partnerName: 'MX Division', month: 'March', year: '2026', product: 'MX', galaxyConsultantTickets: 28, roleType: 'galaxy_consultant', tcsScore: 0, tier: 'Bronze' },
];
