const fs = require('fs');
const filePath = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add pqaMxGroupBy state
content = content.replace(
  "const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view",
  "const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view\n  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' or 'CENTER'"
);

// 2. Rewrite hofTop10 and ADD pqaAccumulatedRanking
const hofTop10Start = content.indexOf('const hofTop10 = useMemo(() => {');
const hofTop10EndStr = '  }, [engineers, effectiveHofMonth, appMode]);\n';
const hofTop10End = content.indexOf(hofTop10EndStr, hofTop10Start) + hofTop10EndStr.length;

if (hofTop10Start === -1 || hofTop10End === -1) {
    console.log("hofTop10 not found"); process.exit(1);
}

const newRankingHooks = `  // ─── Monthly Ranking ────────────────────────────────────────────────────────
  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const entries = engineers.filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y);

    if (appMode === 'PQA_MX') {
      if (pqaMxGroupBy === 'PARTNER') {
        const byPartner = {};
        entries.forEach(e => {
          const partner = getMxPartner(e.name || e.asc);
          if (!byPartner[partner]) byPartner[partner] = { partner, centers: [], tcsScore: 0, monthlyRank: 0, partnerScore: 0, minRank: Infinity };
          byPartner[partner].centers.push(e);
          byPartner[partner].tcsScore += e.tcsScore;
          if (e.monthlyRank && e.monthlyRank > 0) byPartner[partner].minRank = Math.min(byPartner[partner].minRank, e.monthlyRank);
          if (e.partnerScore > 0) byPartner[partner].partnerScore = e.partnerScore;
        });
        const partnerEntries = Object.values(byPartner).map(p => {
          const avgScore = p.centers.length ? parseFloat((p.tcsScore / p.centers.length).toFixed(1)) : 0;
          return {
            id: p.partner, name: p.partner, tcsScore: p.partnerScore || avgScore, 
            monthlyRank: p.minRank === Infinity ? 0 : p.minRank, centerCount: p.centers.length, isPartnerGroup: true
          };
        });
        const hasRank = partnerEntries.some(p => p.monthlyRank > 0);
        if (hasRank) return partnerEntries.filter(p => p.monthlyRank > 0).sort((a, b) => a.monthlyRank - b.monthlyRank).slice(0, 7);
        return partnerEntries.sort((a, b) => b.tcsScore - a.tcsScore).slice(0, 7);
      } else {
        // MX by Center
        const byCode = {};
        entries.forEach(e => {
           if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e;
        });
        const clean = Object.values(byCode);
        const hasRank = clean.some(e => e.monthlyRank > 0);
        if (hasRank) return clean.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank);
        return clean.sort((a,b) => b.tcsScore - a.tcsScore);
      }
    }

    if (appMode === 'PQA_CE') {
      const byCode = {};
      entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
      const clean = Object.values(byCode);
      const hasRank = clean.some(e => e.monthlyRank > 0);
      if (hasRank) return clean.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank).slice(0, 31);
      return clean.sort((a,b) => b.tcsScore - a.tcsScore).slice(0, 31);
    }

    // TCS format default
    const byCode = {};
    entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
    return Object.values(byCode).sort((a, b) => b.tcsScore - a.tcsScore).slice(0, 10);
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);

  // ─── Accumulated Ranking for PQA ──────────────────────────────────────────
  const pqaAccumulatedRanking = useMemo(() => {
    if (!appMode?.startsWith('PQA')) return [];

    if (appMode === 'PQA_MX') {
      if (pqaMxGroupBy === 'PARTNER') {
        const byPartner = {};
        engineers.forEach(e => {
          const partner = getMxPartner(e.name || e.asc);
          const code = e.code?.toUpperCase();
          if (!code) return;
          if (!byPartner[partner]) byPartner[partner] = { partner, engs: {}, minRank: Infinity };
          
          const ex = byPartner[partner].engs[code];
          if (!ex) { byPartner[partner].engs[code] = e; }
          else {
            const exY = parseInt(ex.year), newY = parseInt(e.year);
            if (newY > exY || (newY === exY && getMonthIndex(e.month) > getMonthIndex(ex.month))) {
              byPartner[partner].engs[code] = e;
            }
          }
        });

        const partnerList = Object.values(byPartner).map(p => {
          const allEngs = Object.values(p.engs);
          const bestYtdRank = allEngs.filter(e => e.ytdRank > 0).sort((a, b) => a.ytdRank - b.ytdRank)[0]?.ytdRank || 0;
          const avgScore = parseFloat((allEngs.reduce((s, e) => s + (e.ytdScore || e.tcsScore), 0) / allEngs.length).toFixed(1));
          return { id: p.partner, name: p.partner, ytdRank: bestYtdRank, ytdScore: avgScore, centerCount: allEngs.length, isPartnerGroup: true };
        });
        
        const hasYtd = partnerList.some(p => p.ytdRank > 0);
        if (hasYtd) return partnerList.filter(p => p.ytdRank > 0).sort((a, b) => a.ytdRank - b.ytdRank).slice(0, 7);
        return partnerList.sort((a, b) => b.ytdScore - a.ytdScore).slice(0, 7);
      } else {
        // MX Accumulated by Center
        const byCode = {};
        engineers.forEach(e => {
          const code = e.code?.toUpperCase();
          if (!code) return;
          if (!byCode[code]) { byCode[code] = e; return; }
          const existY = parseInt(byCode[code].year), newY = parseInt(e.year);
          if (newY > existY || (newY === existY && getMonthIndex(e.month) > getMonthIndex(byCode[code].month))) {
            byCode[code] = e;
          }
        });
        const entries = Object.values(byCode);
        const hasRank = entries.some(e => e.ytdRank > 0);
        if (hasRank) return entries.filter(e => e.ytdRank > 0).sort((a, b) => a.ytdRank - b.ytdRank);
        return entries.sort((a, b) => b.tcsScore - a.tcsScore);
      }
    }

    if (appMode === 'PQA_CE') {
      const byCode = {};
      engineers.forEach(e => {
        const code = e.code?.toUpperCase();
        if (!code) return;
        if (!byCode[code]) { byCode[code] = e; return; }
        const existY = parseInt(byCode[code].year), newY = parseInt(e.year);
        if (newY > existY || (newY === existY && getMonthIndex(e.month) > getMonthIndex(byCode[code].month))) {
          byCode[code] = e;
        }
      });
      const entries = Object.values(byCode);
      const hasRank = entries.some(e => e.ytdRank > 0);
      if (hasRank) return entries.filter(e => e.ytdRank > 0).sort((a,b) => a.ytdRank - b.ytdRank).slice(0, 31);
      return entries.sort((a,b) => b.tcsScore - a.tcsScore).slice(0, 31);
    }
    return [];
  }, [engineers, appMode, pqaMxGroupBy]);
`;
content = content.substring(0, hofTop10Start) + newRankingHooks + content.substring(hofTop10End);


// 3. Update the JSX for toggles
const pqaLabelStr = "{appMode?.startsWith('PQA') ? 'Evolution' : 'Beyond'}";
// Just find the Dashboard Toggle
const toggleStart = content.indexOf('{/* Dashboard Toggle */}');
const contentSwitcher = content.indexOf('{/* Content Switcher */}');

if (toggleStart !== -1 && contentSwitcher !== -1) {
  const newToggle = `{/* Dashboard Toggle */}
              <div className="flex flex-col items-center gap-4">
                <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl">
                  <button
                    onClick={() => setHomeViewMode('MONTHLY')}
                    className={\`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all \${homeViewMode === 'MONTHLY'
                      ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                      : 'text-zinc-500 hover:text-white'
                      }\`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setHomeViewMode('QUARTERLY')}
                    className={\`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all \${homeViewMode === 'QUARTERLY'
                      ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'text-zinc-500 hover:text-white'
                      }\`}
                  >
                    {appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}
                  </button>
                </div>

                {appMode === 'PQA_MX' && (
                  <div className="bg-zinc-900/60 p-1 rounded-full border border-white/10 flex items-center backdrop-blur-xl">
                    <button
                      onClick={() => setPqaMxGroupBy('PARTNER')}
                      className={\`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${pqaMxGroupBy === 'PARTNER'
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'text-zinc-500 hover:text-white'
                        }\`}
                    >
                      By Partner
                    </button>
                    <button
                      onClick={() => setPqaMxGroupBy('CENTER')}
                      className={\`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${pqaMxGroupBy === 'CENTER'
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'text-zinc-500 hover:text-white'
                        }\`}
                    >
                      By Center
                    </button>
                  </div>
                )}
              </div>

              `;
  content = content.substring(0, toggleStart) + newToggle + content.substring(contentSwitcher);
}

// 4. Update the "Top X Engineers" text
content = content.replace(
  "{appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}",
  "{appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}"
);
content = content.replace(
  "Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'}",
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : '10')}"
);

// 5. Quarterly rendering replacement for PQA Accumulated
// The quarterly JSX needs to use pqaAccumulatedRanking when in PQA mode.
const quartJSXStart = content.indexOf("{/* Quarterly Ranking - Default view */}");
if (quartJSXStart !== -1) {
  const quartJSXEndStr = "{/* Personal Profile View */}";
  const quartJSXEnd = content.indexOf(quartJSXEndStr);

  const pqaJSX = `{/* Quarterly / Accumulated Ranking */}\n                  <div className="space-y-4">\n                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">\n                      Top {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? '7' : appMode === 'PQA_CE' ? '31' : '10'} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}\n                    </h3>\n                    {appMode?.startsWith('PQA') ? (\n                      pqaAccumulatedRanking.length === 0 ? (\n                        <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data accumulated.</div>\n                      ) : pqaAccumulatedRanking.map((eng, idx) => {\n                        const isFirst = idx === 0;\n                        const isSecond = idx === 1;\n                        const isThird = idx === 2;\n                        const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';\n                        const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';\n                        return (\n                          <div key={eng.id || idx} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 \${cardBorder}\`}>\n                            <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>\n                              #{idx + 1}\n                            </div>\n                            <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-zinc-900">\n                              <img src={getPhotoUrl(eng)} alt={eng.name} className="w-full h-full object-cover" />\n                            </div>\n                            <div className="flex-1 min-w-0">\n                              <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight truncate group-hover:text-blue-400 transition-colors">{eng.name}</h3>\n                              {eng.centerCount && <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{eng.centerCount} Centers</p>}\n                            </div>\n                            <div className="text-right">\n                              <p className="text-3xl font-black italic tracking-tighter text-white">{eng.ytdScore || eng.tcsScore || 0}</p>\n                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">YTD Score</p>\n                            </div>\n                          </div>\n                        );\n                      })\n                    ) : (\n                      // Original TCS Quarterly Code:\n                      top10Quarterly.length === 0 ? (\n                        <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this quarter.</div>\n                      ) : top10Quarterly.map((eng, idx) => {\n                        const isFirst = idx === 0;\n                        const isSecond = idx === 1;\n                        const isThird = idx === 2;\n                        const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';\n                        const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';\n                        return (\n                          <div key={eng.id} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 hover:scale-[1.01] cursor-pointer \${cardBorder}\`} onClick={() => handleEngineerSelect(eng)}>\n                            <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>\n                              #{idx + 1}\n                            </div>\n                            <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-zinc-900">\n                              <img src={getPhotoUrl(eng)} alt={eng.name} className="w-full h-full object-cover" />\n                            </div>\n                            <div className="flex-1 min-w-0">\n                              <div className="flex items-center gap-2 mb-1">\n                                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight truncate group-hover:text-blue-400 transition-colors">{eng.name}</h3>\n                                {isFirst && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}\n                              </div>\n                              <div className="flex flex-wrap items-center gap-2">\n                                <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20 text-[9px] uppercase tracking-widest">{eng.code}</Badge>\n                                <Badge className="bg-white/5 text-zinc-400 hover:bg-white/10 border-white/10 text-[9px] uppercase tracking-widest truncate max-w-[120px]">{eng.asc}</Badge>\n                              </div>\n                            </div>\n                            <div className="text-right flex-shrink-0">\n                              <p className="text-3xl md:text-4xl font-black italic tracking-tighter text-white drop-shadow-md">{eng.tcsScore}</p>\n                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Avg Score ({eng.monthCount} mo)</p>\n                            </div>\n                          </div>\n                        );\n                      })\n                    )}\n                  </div>\n                  `;

  content = content.substring(0, quartJSXStart) + pqaJSX + "\n\n                  " + content.substring(quartJSXEnd);
}

fs.writeFileSync(filePath, content);
console.log("Patch complete!");
