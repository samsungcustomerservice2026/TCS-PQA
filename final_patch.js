const fs = require('fs');
const filePath = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(filePath, 'utf8');

function replaceBlock(startStr, endStr, newContent) {
  const startIdx = content.indexOf(startStr);
  if (startIdx === -1) {
    console.log("Could not find:", startStr.substring(0, 50)); return;
  }
  const endIdx = content.indexOf(endStr, startIdx);
  if (endIdx === -1) {
    console.log("Could not find end:", endStr.substring(0, 50)); return;
  }
  content = content.substring(0, startIdx) + newContent + content.substring(endIdx + endStr.length);
}

// 1. HEADER REPLACEMENT
const headerStart = 'const Header = ({ onHome, onLogoClick, appMode }) => {';
const headerEndStr = '  );\n};\n';
const newHeader = `const Header = ({ onHome, onLogoClick, appMode }) => {
  const centerLogo = useMemo(() => {
    if (appMode?.startsWith('PQA')) return './pqa_logo.png';
    return './fawzy-logo.png'; // Assuming this is TCS logo
  }, [appMode]);

  const slogan = 'Earn Your Tier • Own Your Title';

  return (
    <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4">

        {/* Left — Samsung logo */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={onLogoClick || onHome}
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

        {/* Center — App Logo (PQA or TCS) */}
        <div className="flex justify-center items-center group">
          <img
            src={centerLogo}
            alt="App Logo"
            className="h-12 md:h-16 w-auto object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-xl"
            style={{ borderRadius: '1rem', overflow: 'hidden' }}
          />
        </div>

        {/* Right — Slogan */}
        <div className="flex flex-col items-end text-right justify-center gap-1 group">
          <p className="text-[9px] md:text-[11px] uppercase tracking-[0.35em] md:tracking-[0.4em] text-zinc-400 font-black leading-relaxed">
            {slogan.split(' • ').map((s, i) => (
              <React.Fragment key={i}>
                <span className="block">{s}</span>
              </React.Fragment>
            ))}
          </p>
        </div>

      </div>
    </header>
  );
};
`;
replaceBlock(headerStart, headerEndStr, newHeader);

// 2. GETPHOTOURL REPLACEMENT
const photoStart = '  // Helper to ensure PQA Service Center photo is displayed correctly';
const photoEnd = "return eng.photoUrl || 'https://picsum.photos/200';\n  };\n";
const newPhotoUrl = `  // Helper to ensure PQA Service Center photo is displayed correctly
  const getPhotoUrl = (eng) => {
    if (!eng) return 'https://picsum.photos/200';
    const isPqa = appMode?.startsWith('PQA');
    if (isPqa) {
      if (appMode === 'PQA_MX' && eng.isPartnerGroup) {
        return \`https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%20Service%20centers%2F\${encodeURIComponent(eng.name)}.png?alt=media\`;
      }
      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {
        return pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;
      }
    }
    return eng.photoUrl || 'https://picsum.photos/200';
  };
`;
replaceBlock(photoStart, photoEnd, newPhotoUrl);


// 3. GROUP BY STATE
content = content.replace(
  "const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view",
  "const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view\n  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' or 'CENTER'"
);


// 4. RANKING LOGIC (hofTop10 & pqaAccumulatedRanking)
const hofTop10Start = '  // ─── Hall of Fame: top 10 for selected month (deduplicated by code)';
const hofTop10RE = content.substring(content.indexOf(hofTop10Start)); 
const hofTop10REEnd = hofTop10RE.indexOf('  }, [engineers, effectiveHofMonth, appMode]);\n') + '  }, [engineers, effectiveHofMonth, appMode]);\n'.length;
content = content.substring(0, content.indexOf(hofTop10Start)) + `  // ─── Monthly Ranking ────────────────────────────────────────────────────────
  const effectiveHofMonth = selectedHofMonth || allMonthPeriods[allMonthPeriods.length - 1]?.key || null;
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
          if (e.partnerScore && e.partnerScore > 0) byPartner[partner].partnerScore = e.partnerScore;
        });
        const partnerEntries = Object.values(byPartner).map(p => {
          const avgScore = p.centers.length ? parseFloat((p.tcsScore / p.centers.length).toFixed(1)) : 0;
          return {
            id: p.partner, name: p.partner, tcsScore: p.partnerScore > 0 ? p.partnerScore : avgScore, 
            monthlyRank: p.minRank === Infinity ? 0 : p.minRank, centerCount: p.centers.length, isPartnerGroup: true
          };
        });
        const hasRank = partnerEntries.some(p => p.monthlyRank > 0);
        if (hasRank) return partnerEntries.filter(p => p.monthlyRank > 0).sort((a, b) => a.monthlyRank - b.monthlyRank).slice(0, 7);
        return partnerEntries.sort((a, b) => b.tcsScore - a.tcsScore).slice(0, 7);
      } else {
        const byCode = {};
        entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
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
          const represent = allEngs[0];
          const bestYtdRank = allEngs.filter(e => e.ytdRank > 0).sort((a, b) => a.ytdRank - b.ytdRank)[0]?.ytdRank || 0;
          const avgScore = parseFloat((allEngs.reduce((s, e) => s + (e.ytdScore || e.tcsScore), 0) / allEngs.length).toFixed(1));
          return { ...represent, id: p.partner, name: p.partner, ytdRank: bestYtdRank, ytdScore: avgScore, centerCount: allEngs.length, isPartnerGroup: true };
        });
        
        const hasYtd = partnerList.some(p => p.ytdRank > 0);
        if (hasYtd) return partnerList.filter(p => p.ytdRank > 0).sort((a, b) => a.ytdRank - b.ytdRank).slice(0, 7);
        return partnerList.sort((a, b) => b.ytdScore - a.ytdScore).slice(0, 7);
      } else {
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
` + hofTop10RE.substring(hofTop10REEnd);

// 5. FIX THE JSX TOGGLES
const dashToggleStart = '{/* Dashboard Toggle */}';
const contentSwitcher = '{/* Content Switcher */}';
const dashToggleBlock = `{/* Dashboard Toggle */}
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
replaceBlock(dashToggleStart, contentSwitcher, dashToggleBlock);


// 6. FIX THE JSX RANKING HEADERS
// Monthly title
content = content.replace(
  "Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}",
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}"
);

// 7. FIX QUARTERLY ACCUMULATED VIEW
const quartJSXStart = "{/* Quarterly Ranking - Default view */}";
const quartJSXEndStr = "{/* Personal Profile View */}";
const pqaJSX = `{/* Quarterly / Accumulated Ranking */}
                  <div className="space-y-4">
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                      Top {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? '7' : appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10')} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}
                    </h3>
                    {appMode?.startsWith('PQA') ? (
                      pqaAccumulatedRanking.length === 0 ? (
                        <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data accumulated.</div>
                      ) : pqaAccumulatedRanking.map((eng, idx) => {
                        const isFirst = idx === 0;
                        const isSecond = idx === 1;
                        const isThird = idx === 2;
                        const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';
                        const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                        return (
                          <div key={eng.id || \`rank-\${idx}\`} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 \${cardBorder}\`}>
                            <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                              #{idx + 1}
                            </div>
                            <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-zinc-900">
                              <img src={getPhotoUrl(eng)} alt={eng.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight truncate group-hover:text-blue-400 transition-colors">{eng.name}</h3>
                              {eng.centerCount && <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{eng.centerCount} Centers</p>}
                              {!eng.centerCount && eng.asc && <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{eng.asc}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black italic tracking-tighter text-white">{eng.ytdScore || eng.tcsScore || 0}</p>
                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">YTD Score</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      top10Quarterly.length === 0 ? (
                        <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this quarter.</div>
                      ) : top10Quarterly.map((eng, idx) => {
                        const isFirst = idx === 0;
                        const isSecond = idx === 1;
                        const isThird = idx === 2;
                        const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';
                        const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                        return (
                          <div key={eng.id} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 hover:scale-[1.01] cursor-pointer \${cardBorder}\`} onClick={() => handleEngineerSelect(eng)}>
                            <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                              #{idx + 1}
                            </div>
                            <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-zinc-900">
                              <img src={getPhotoUrl(eng)} alt={eng.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight truncate group-hover:text-blue-400 transition-colors">{eng.name}</h3>
                                {isFirst && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20 text-[9px] uppercase tracking-widest">{eng.code}</Badge>
                                <Badge className="bg-white/5 text-zinc-400 hover:bg-white/10 border-white/10 text-[9px] uppercase tracking-widest truncate max-w-[120px]">{eng.asc}</Badge>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-3xl md:text-4xl font-black italic tracking-tighter text-white drop-shadow-md">{eng.tcsScore}</p>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Avg Score ({eng.monthCount} mo)</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  `;
replaceBlock(quartJSXStart, quartJSXEndStr, pqaJSX);

fs.writeFileSync(filePath, content);
console.log("Final patch applied!");
