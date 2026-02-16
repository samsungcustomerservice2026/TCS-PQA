// Constants and Helpers

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
        examScore: 95,
        monthlyRNPS: 98,
        trainingAttendance: 100,
        repeatedRepairRatio: 1.2,
        sameSymptomRedoRatio: 0.8,
        iqcSkipRatio: 0,
        oqcFirstTimeFailRatio: 0.5,
        corePartsUsed: 2,
        multiPartsUsed: 1,
        lastQEvaluation: 98,
        tcsScore: 97.5,
        tier: 'Masters'
    }
];

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

export const calculateTCS = (eng) => {
    const n = (v) => parseFloat(v) || 0;
    const trainingScore = n(eng.trainingAttendance);

    const rrrPerf = Math.max(0, 100 - n(eng.repeatedRepairRatio));
    const ssrPerf = Math.max(0, 100 - n(eng.sameSymptomRedoRatio));
    const iqcPerf = Math.max(0, 100 - n(eng.iqcSkipRatio));
    const oqcPerf = Math.max(0, 100 - n(eng.oqcFirstTimeFailRatio));
    const corePartsPerf = Math.max(0, 100 - n(eng.corePartsUsed));
    const multiPartsPerf = Math.max(0, 100 - n(eng.multiPartsUsed));

    const engEvalSubtotal = (trainingScore + rrrPerf + ssrPerf + iqcPerf + oqcPerf + corePartsPerf + multiPartsPerf) / 7;

    const examSubtotal = n(eng.examScore);
    const rnpsSubtotal = n(eng.monthlyRNPS);

    const finalScore = (engEvalSubtotal * 0.5) + (examSubtotal * 0.3) + (rnpsSubtotal * 0.2);

    return Number(finalScore.toFixed(1));
};
