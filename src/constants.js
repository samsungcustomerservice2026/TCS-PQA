// Constants and Helpers

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
    const drNPS = calculateDRNPS(eng.promoters, eng.detractors);
    const drnpsContribution = Math.min(30, (drNPS / 100) * 30);

    const finalScore = kpiContribution + examContribution + drnpsContribution;
    return Number(finalScore.toFixed(1));
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
        // KPI fields
        redoRatio: 0.5,
        iqcSkipRatio: 18,
        maintenanceModeRatio: 70,
        oqcPassRate: 88,
        trainingAttendance: 100,
        corePartsPBA: 22,
        corePartsOcta: 35,
        multiPartsRatio: 0.8,
        // Exam & DRNPS
        examScore: 93,
        promoters: 45,
        detractors: 3,
        // Computed
        tcsScore: 0,
        tier: 'Bronze'
    }
];
