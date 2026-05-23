const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: hofTop10 – partner ranking (score was 0 because only first ASC per
//         partner was taken but partnerScore wasn't being properly accumulated)
//         AND center ranking needs dense (tied) ranking.
// ─────────────────────────────────────────────────────────────────────────────

const OLD_HOF = `  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const filtered = engineers.filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y);

    if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
      const OFFICIAL_PARTNERS = ['ALSAFY', 'ATS', 'RAYA', 'URC', 'SKY', 'K-ELECTRONICS', 'MTI'];
      const partners = {};

      filtered.forEach(e => {
        let pName = String(e.partnerName || '').trim().toUpperCase();
        if (!pName || pName === 'N/A') {
          const parts = e.name.split(' - ');
          if (parts.length > 1) pName = parts[0].trim().toUpperCase();
        }

        const matched = OFFICIAL_PARTNERS.find(op => pName.includes(op));
        if (matched) {
          if (!partners[matched]) {
            partners[matched] = {
              id: \`partner-\${matched}\`,
              name: matched,
              code: matched,
              tcsScore: e.partnerScore || 0, // Direct use of Excel Partner Score
              count: 1,
              photoUrl: \`./logos/\${matched.toLowerCase()}.png\`
            };
          }
        }
      });

      return Object.values(partners)
        .sort((a, b) => b.tcsScore - a.tcsScore)
        .slice(0, 7);
    }

    // Default ranking (By Center or TCS)
    const byCode = {};
    filtered.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      if (!byCode[code] || e.tcsScore > byCode[code].tcsScore) byCode[code] = e;
    });
    const limit = (appMode === 'PQA_MX' || appMode === 'PQA_CE') ? 20 : 10;
    return Object.values(byCode)
      .sort((a, b) => b.tcsScore - a.tcsScore)
      .slice(0, limit);
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);`;

const NEW_HOF = `  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const filtered = engineers.filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y);

    if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
      // ── By Partner: aggregate partnerScore per official partner ──────────────
      const OFFICIAL_PARTNERS = ['ALSAFY', 'ATS', 'RAYA', 'URC', 'SKY', 'K-ELECTRONICS', 'MTI'];
      const partners = {};

      // Seed ALL 7 partners so they always appear even if score is 0
      OFFICIAL_PARTNERS.forEach(op => {
        partners[op] = {
          id: \`partner-\${op}\`,
          name: op,
          code: op,
          tcsScore: 0,
          bestPartnerScore: 0,
          count: 0,
          photoUrl: \`./logos/\${op.toLowerCase()}.png\`
        };
      });

      filtered.forEach(e => {
        let pName = String(e.partnerName || '').trim().toUpperCase();
        if (!pName || pName === 'N/A') {
          // Fallback: derive partner from "PARTNER - CENTER" naming convention
          const parts = e.name.split(' - ');
          if (parts.length > 1) pName = parts[0].trim().toUpperCase();
        }
        const matched = OFFICIAL_PARTNERS.find(op => pName === op || pName.startsWith(op) || pName.includes(op));
        if (matched) {
          const ps = e.partnerScore || 0;
          // Use the highest partnerScore found (Excel pre-computes this per partner per month)
          if (ps > partners[matched].bestPartnerScore) {
            partners[matched].bestPartnerScore = ps;
          }
          partners[matched].tcsScore = partners[matched].bestPartnerScore;
          partners[matched].count += 1;
        }
      });

      return Object.values(partners)
        .sort((a, b) => b.tcsScore - a.tcsScore)
        .slice(0, 7);
    }

    // ── By Center: deduplicate + dense (tied) ranking ─────────────────────────
    const byCode = {};
    filtered.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      if (!byCode[code] || e.tcsScore > byCode[code].tcsScore) byCode[code] = e;
    });
    const limit = (appMode === 'PQA_MX' || appMode === 'PQA_CE') ? 26 : 10;
    const sorted = Object.values(byCode)
      .sort((a, b) => b.tcsScore - a.tcsScore)
      .slice(0, limit);

    // Assign dense ranks (same score → same rank)
    let currentRank = 1;
    return sorted.map((e, i) => {
      if (i > 0 && e.tcsScore < sorted[i - 1].tcsScore) currentRank = i + 1;
      return { ...e, displayRank: currentRank };
    });
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);`;

if (c.includes(OLD_HOF)) {
  c = c.replace(OLD_HOF, NEW_HOF);
  console.log('✅ FIX 1 applied: hofTop10 partner scoring + dense center ranking');
} else {
  console.log('❌ FIX 1: Old pattern not found (may have CRLF issue), trying normalize...');
  // Try with \\r\\n normalization
  const normalized = OLD_HOF.replace(/\n/g, '\\r\\n');
  if (c.includes(normalized)) {
    c = c.replace(normalized, NEW_HOF);
    console.log('✅ FIX 1 applied (CRLF normalized)');
  } else {
    console.log('⚠️  FIX 1 skipped, pattern not matched');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: quarterlyRanking – ACCUMULATED mode for PQA
//         Use ytdScore/ytdRank from Excel (propagated via ytdRankMap) for
//         centers. For partners use accumulatedScore.
//         Also ensure all 7 partners show even if 0.
// ─────────────────────────────────────────────────────────────────────────────

const OLD_QUARTERLY = `  // Aggregate per-engineer per-quarter (avg TCS score across months in that quarter)
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

    if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
      const OFFICIAL_PARTNERS = ['ALSAFY', 'ATS', 'RAYA', 'URC', 'SKY', 'K-ELECTRONICS', 'MTI'];
      const pGroup = {};
      Object.values(bucket).forEach(({ eng }) => {
        let pName = String(eng.partnerName || '').trim().toUpperCase();
        const matched = OFFICIAL_PARTNERS.find(op => pName.includes(op) || pName === op);
        if (matched && !pGroup[matched]) {
          pGroup[matched] = {
            ...eng,
            name: matched,
            avgScore: eng.ytdScore || (eng.tcsScore || 0), // Use Accumulated Score
            monthCount: 12
          };
        }
      });
      return Object.values(pGroup).sort((a, b) => b.avgScore - a.avgScore);
    }

    return Object.values(bucket)
      .map(({ eng, scores }) => ({
        ...eng,
        avgScore: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
        monthCount: scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [engineers, effectiveQuarterKey]);`;

const NEW_QUARTERLY = `  // Accumulated / Quarterly ranking for PQA_MX
  const quarterlyRanking = useMemo(() => {
    const OFFICIAL_PARTNERS = ['ALSAFY', 'ATS', 'RAYA', 'URC', 'SKY', 'K-ELECTRONICS', 'MTI'];

    // ── PQA ACCUMULATED mode ─────────────────────────────────────────────────
    if (appMode === 'PQA_MX') {
      if (pqaMxGroupBy === 'PARTNER') {
        // Collect best accumulatedScore & accumulatedRank per partner across all records
        const pGroup = {};
        OFFICIAL_PARTNERS.forEach(op => {
          pGroup[op] = { id: \`acc-\${op}\`, name: op, code: op, avgScore: 0, ytdRank: 0, monthCount: 0 };
        });

        engineers.forEach(e => {
          let pName = String(e.partnerName || '').trim().toUpperCase();
          if (!pName || pName === 'N/A') {
            const parts = e.name.split(' - ');
            if (parts.length > 1) pName = parts[0].trim().toUpperCase();
          }
          const matched = OFFICIAL_PARTNERS.find(op => pName === op || pName.startsWith(op) || pName.includes(op));
          if (matched) {
            // Use ytdScore which is populated from Excel's Acc Score column
            const accScore = e.ytdScore || 0;
            if (accScore > pGroup[matched].avgScore) {
              pGroup[matched].avgScore = accScore;
              pGroup[matched].ytdRank = e.ytdRank || 0;
            }
            pGroup[matched].monthCount += 1;
          }
        });

        const sorted = Object.values(pGroup).sort((a, b) => b.avgScore - a.avgScore);
        let currentRank = 1;
        return sorted.map((p, i) => {
          if (i > 0 && p.avgScore < sorted[i - 1].avgScore) currentRank = i + 1;
          return { ...p, displayRank: currentRank };
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
          .filter(e => (e.ytdScore || 0) > 0)
          .sort((a, b) => (b.ytdScore || 0) - (a.ytdScore || 0));

        // Dense ranking
        let currentRank = 1;
        return sorted.map((e, i) => {
          if (i > 0 && e.ytdScore < sorted[i - 1].ytdScore) currentRank = i + 1;
          return { ...e, avgScore: e.ytdScore || 0, displayRank: currentRank, monthCount: 1 };
        });
      }
    }

    // ── TCS / non-PQA quarterly mode ─────────────────────────────────────────
    if (!effectiveQuarterKey) return [];
    const [q, y] = effectiveQuarterKey.split('-');
    const bucket = {};
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
        displayRank: 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((e, i, arr) => {
        if (i === 0 || e.avgScore < arr[i - 1].avgScore) e.displayRank = i + 1;
        else e.displayRank = arr[i - 1].displayRank;
        return e;
      });
  }, [engineers, effectiveQuarterKey, appMode, pqaMxGroupBy]);`;

if (c.includes(OLD_QUARTERLY)) {
  c = c.replace(OLD_QUARTERLY, NEW_QUARTERLY);
  console.log('✅ FIX 2 applied: accumulated ranking for partners + centers');
} else {
  console.log('❌ FIX 2: Old pattern not found');
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: pqaRecord – carry partnerName from rd (currently hardcoded 'N/A')
// ─────────────────────────────────────────────────────────────────────────────

const OLD_PQA_RECORD = `            const pqaRecord = {
               id: '', region: rd.region || '', code: rd.code, name: rd.name,
               photoUrl: 'https://picsum.photos/200', partnerName: 'N/A',
               month: rd.mName, year: rd.year,`;

const NEW_PQA_RECORD = `            const pqaRecord = {
               id: '', region: rd.region || '', code: rd.code, name: rd.name,
               photoUrl: 'https://picsum.photos/200', partnerName: rd.partnerName || 'N/A',
               month: rd.mName, year: rd.year,`;

if (c.includes(OLD_PQA_RECORD)) {
  c = c.replace(OLD_PQA_RECORD, NEW_PQA_RECORD);
  console.log('✅ FIX 3 applied: partnerName propagated to pqaRecord');
} else {
  console.log('⚠️  FIX 3: pqaRecord partnerName pattern not found');
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: pqaRecord – also carry accumulatedScore & accumulatedRank from rd
// ─────────────────────────────────────────────────────────────────────────────

const OLD_YTD = `               ytdScore: ytd.ytdScore || 0, ytdRank: ytd.ytdRank || 0,
               monthlyRank: rd.monthlyRank || 0, partnerScore: rd.partnerScore || 0,`;

const NEW_YTD = `               ytdScore: rd.accumulatedScore || ytd.ytdScore || 0,
               ytdRank: rd.accumulatedRank || ytd.ytdRank || 0,
               monthlyRank: rd.monthlyRank || 0, partnerScore: rd.partnerScore || 0,`;

if (c.includes(OLD_YTD)) {
  c = c.replace(OLD_YTD, NEW_YTD);
  console.log('✅ FIX 4 applied: ytdScore uses accumulatedScore from Partner Ranking sheet');
} else {
  console.log('⚠️  FIX 4: ytdScore pattern not found — may already be updated');
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5: Monthly UI ranking card – use displayRank instead of idx+1
// ─────────────────────────────────────────────────────────────────────────────

// Replace the rank badge in Monthly section
const OLD_RANK_BADGE = `                          {/* Numeric rank badge */}
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{idx + 1}
                          </div>
                          {/* Only show photo for TCS mode; for PQA show photo too */}
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>`;

const NEW_RANK_BADGE = `                          {/* Numeric rank badge – uses dense displayRank for tied scores */}
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{eng.displayRank || idx + 1}
                          </div>
                          {/* Only show photo for TCS mode; for PQA show photo too */}
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>`;

if (c.includes(OLD_RANK_BADGE)) {
  c = c.replace(OLD_RANK_BADGE, NEW_RANK_BADGE);
  console.log('✅ FIX 5 applied: monthly card uses displayRank');
} else {
  console.log('⚠️  FIX 5: monthly rank badge pattern not found');
}

// Accumulated card rank badge too
const OLD_ACC_BADGE = `                          {/* Numeric rank badge */}
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{idx + 1}
                          </div>
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>`;

const NEW_ACC_BADGE = `                          {/* Numeric rank badge – uses dense displayRank for tied scores */}
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{eng.displayRank || idx + 1}
                          </div>
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>`;

if (c.includes(OLD_ACC_BADGE)) {
  c = c.replace(OLD_ACC_BADGE, NEW_ACC_BADGE);
  console.log('✅ FIX 5b applied: accumulated card uses displayRank');
} else {
  console.log('⚠️  FIX 5b: accumulated rank badge not found (may already be updated or cards share markup)');
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6: Accumulated header – change "Quarterly Avg" to "Accumulated Average"
//         and remove the quarter navigator for PQA mode
// ─────────────────────────────────────────────────────────────────────────────

const OLD_ACC_HEADER = `                     <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                       Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Centers' : 'Engineers'} (Quarterly Avg)
                     </h3>`;

const NEW_ACC_HEADER = `                     <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                       {appMode?.startsWith('PQA') ? (pqaMxGroupBy === 'PARTNER' ? 'All 7 Partners — Accumulated Average' : 'All Centers — Accumulated Average') : \`Top 10 Engineers (Quarterly Avg)\`}
                     </h3>`;

if (c.includes(OLD_ACC_HEADER)) {
  c = c.replace(OLD_ACC_HEADER, NEW_ACC_HEADER);
  console.log('✅ FIX 6 applied: accumulated header text updated');
} else {
  console.log('⚠️  FIX 6: accumulated header not found');
}

// Also update the "No data" message for accumulated
const OLD_NO_DATA = `                       <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this quarter.</div>`;

const NEW_NO_DATA = `                       <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No accumulated data. Upload an Excel file with the ★Partner Ranking sheet.</div>`;

if (c.includes(OLD_NO_DATA)) {
  c = c.replace(OLD_NO_DATA, NEW_NO_DATA);
  console.log('✅ FIX 6b applied: no-data message updated');
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7: Monthly "By Partner" title
// ─────────────────────────────────────────────────────────────────────────────

const OLD_TITLE = `                     <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                       Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}
                     </h3>`;

const NEW_TITLE = `                     <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                       {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'All 7 Partners — Monthly Ranking' : appMode?.startsWith('PQA') ? 'All Service Centers — Monthly Ranking' : 'Top 10 Engineers'}
                     </h3>`;

if (c.includes(OLD_TITLE)) {
  c = c.replace(OLD_TITLE, NEW_TITLE);
  console.log('✅ FIX 7 applied: monthly partner title updated');
} else {
  console.log('⚠️  FIX 7: monthly title not found');
}

fs.writeFileSync(path, c);
console.log('\n🎉 All fixes written to page.js');
