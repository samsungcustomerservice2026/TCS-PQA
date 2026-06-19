import { calculateDRNPS } from '../constants';

export const TCS_MX_ROLE_KEYS = {
  engineers: 'engineers',
  receptionists: 'receptionists',
  galaxy_consultants: 'galaxy_consultants',
};

const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

function lowerIsBetter(value, target, maxPts) {
  const v = n(value);
  if (v <= target) return maxPts;
  const span = Math.max(target, 1);
  return Math.max(0, maxPts - ((v - target) / span) * maxPts);
}

function higherIsBetter(value, target, maxPts) {
  const v = n(value);
  if (v >= target) return maxPts;
  return Math.max(0, (v / Math.max(target, 1)) * maxPts);
}

export function resolveReceptionistDrnps(eng) {
  const direct = n(eng?.drnpsPercent ?? eng?.drnpsScore);
  if (direct > 0) return direct;
  return calculateDRNPS(eng?.promoters, eng?.detractors);
}

/** Composite 0–100 for receptionist tier / ranking. */
export function calculateReceptionistScore(eng) {
  const vote = n(eng?.voteForMe);
  const iqcFail = n(eng?.iqcFirstTimeFail);
  const drnps = resolveReceptionistDrnps(eng);
  const exam = n(eng?.examScore);
  const coa = n(eng?.coa);

  const pts =
    higherIsBetter(vote, 30, 25) +
    lowerIsBetter(iqcFail, 5, 20) +
    higherIsBetter(drnps, 80, 25) +
    higherIsBetter(exam, 90, 20) +
    Math.min(10, coa);

  return Number(Math.min(100, Math.max(0, pts)).toFixed(1));
}

/** Raw ticket count for galaxy consultants. */
export function calculateGalaxyConsultantScore(eng) {
  return n(eng?.galaxyConsultantTickets);
}

/** Map ticket count to 0–100 for tier emblems (50 tickets ≈ max tier band). */
export function normalizeGalaxyTierScore(eng) {
  const tickets = calculateGalaxyConsultantScore(eng);
  return Number(Math.min(100, Math.max(0, tickets * 2)).toFixed(1));
}

export function resolveMxRoleDashboardScore(eng, mxRoleTab) {
  if (mxRoleTab === TCS_MX_ROLE_KEYS.receptionists) {
    return calculateReceptionistScore(eng);
  }
  if (mxRoleTab === TCS_MX_ROLE_KEYS.galaxy_consultants) {
    return calculateGalaxyConsultantScore(eng);
  }
  const evalScore = n(eng?.engineerEvaluation);
  if (evalScore > 0) return evalScore;
  return n(eng?.tcsScore);
}

export function resolveMxRoleTierScore(eng, mxRoleTab) {
  if (mxRoleTab === TCS_MX_ROLE_KEYS.galaxy_consultants) {
    return normalizeGalaxyTierScore(eng);
  }
  if (mxRoleTab === TCS_MX_ROLE_KEYS.receptionists) {
    return calculateReceptionistScore(eng);
  }
  return n(eng?.engineerEvaluation);
}

export function getMxRoleLeaderboardScoreField(mxRoleTab) {
  if (mxRoleTab === TCS_MX_ROLE_KEYS.receptionists) return 'roleScore';
  if (mxRoleTab === TCS_MX_ROLE_KEYS.galaxy_consultants) return 'galaxyConsultantTickets';
  return 'engineerEvaluation';
}

export function getMxRoleLeaderboardScoreLabel(mxRoleTab) {
  if (mxRoleTab === TCS_MX_ROLE_KEYS.receptionists) return 'Receptionist Score';
  if (mxRoleTab === TCS_MX_ROLE_KEYS.galaxy_consultants) return 'Galaxy Tickets';
  return 'Engineer Evaluation';
}

export function buildMxRoleEditingDefaults(mxRoleTab) {
  const base = {
    id: '',
    name: '',
    code: '',
    photoUrl: '',
    asc: '',
    partnerName: '',
    month: 'March',
    year: '2026',
    product: 'MX',
    tcsScore: 0,
    tier: 'Bronze',
  };
  if (mxRoleTab === TCS_MX_ROLE_KEYS.receptionists) {
    return {
      ...base,
      roleType: 'receptionist',
      gspnId: '',
      ascCode: '',
      voteForMe: '',
      iqcFirstTimeFail: '',
      drnpsPercent: '',
      examScore: '',
      coa: '',
    };
  }
  if (mxRoleTab === TCS_MX_ROLE_KEYS.galaxy_consultants) {
    return {
      ...base,
      roleType: 'galaxy_consultant',
      galaxyConsultantTickets: '',
    };
  }
  return {
    ...base,
    redoRatio: '',
    iqcSkipRatio: '',
    maintenanceModeRatio: '',
    oqcPassRate: '',
    trainingAttendance: '',
    corePartsPBA: '',
    corePartsOcta: '',
    multiPartsRatio: '',
    examScore: '',
    promoters: '',
    detractors: '',
  };
}
