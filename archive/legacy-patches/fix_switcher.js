const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

// The fragment we need to replace – everything from right after </div>{/* toggle buttons */} 
// to just before {view === 'ENGINEER_LOOKUP'
// Marker start: the broken fragment starts right after the closing of the partner toggle
const OLD_FRAGMENT = `                        </div>
\r\n                        <div className="text-center">\r\n                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>\r\n                          <p className="text-3xl font-black text-yellow-400">{quarterlyRanking[0]?.avgScore}</p>\r\n                        </div>\r\n                        <div className="text-center">\r\n                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Champion</p>\r\n                          <TierBadge tier={quarterlyRanking[0]?.tier || 'Bronze'} size="md" />\r\n                        </div>\r\n                      </div>\r\n                    </div>\r\n                  )}\r\n                </div>\r\n              )}\r\n            </div>\r\n          )}`;

// Find the exact span
const startMarker = `                        </div>\r\n                        <div className="text-center">\r\n                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>`;
const endMarker = `            </div>\r\n          )}`;

const startIdx = c.indexOf(startMarker);
if (startIdx === -1) {
  console.log('Start marker not found, trying without \\r');
  const startMarker2 = `                        </div>\n                        <div className="text-center">\n                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>`;
  const idx2 = c.indexOf(startMarker2);
  if (idx2 === -1) {
    console.log('STILL not found. Dumping chars around line 1810...');
    // Search for TopScore
    const ts = c.indexOf('Top Score');
    console.log('Top Score at char index:', ts);
    console.log('Surrounding:', JSON.stringify(c.substring(ts - 200, ts + 200)));
    process.exit(1);
  }
}

// Simple approach: find the range by searching for known unique text blocks
const fragStart = c.indexOf('                        </div>\r\n                        <div className="text-center">\r\n                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>\r\n');
if (fragStart === -1) {
  console.log('Fragment start not found, checking for non-CRLF...');
  process.exit(1);
}

// End marker: find the first occurrence of ENGINEER_LOOKUP after fragStart
const engineerLookupMarker = "          {view === 'ENGINEER_LOOKUP' &&";
const fragEnd = c.indexOf(engineerLookupMarker, fragStart);
if (fragEnd === -1) {
  console.log('Fragment end not found');
  process.exit(1);
}

const newContent = `
              {/* ── Content Switcher: MONTHLY | ACCUMULATED ────────────────────────── */}
              {homeViewMode === 'MONTHLY' ? (
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
                  {/* Month Selector */}
                  <div className="flex items-center justify-center gap-4">
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
                        : appMode?.startsWith('PQA') ? 'All Service Centers — Monthly Ranking' : 'Top 10 Engineers'}
                    </h3>
                    {hofTop10.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">No data for this period.</div>
                    ) : hofTop10.map((eng, idx) => {
                      const displayRank = eng.displayRank || idx + 1;
                      const isFirst = displayRank === 1;
                      const isSecond = displayRank === 2;
                      const isThird = displayRank === 3;
                      const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';
                      const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                      const scoreLabel = appMode?.startsWith('PQA') ? 'PQA Score' : 'TCS Score';
                      return (
                        <div key={eng.id || eng.code} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 \${cardBorder}\`}>
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{displayRank}
                          </div>
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>
                            {!appMode?.startsWith('PQA') && (
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <TierBadge tier={eng.tier} size="sm" />
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={\`text-3xl md:text-4xl font-black italic tracking-tighter \${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}\`}>
                              {eng.tcsScore != null ? parseFloat(eng.tcsScore).toFixed(1) : '—'}
                            </span>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{scoreLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── ACCUMULATED view ─────────────────────────────────────────────── */
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-3 bg-zinc-900 border border-blue-500/20 rounded-2xl px-8 py-4">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-base font-black text-white uppercase tracking-widest">
                        {appMode?.startsWith('PQA') ? '2026 — Year to Date' : (effectiveQuarterKey ? effectiveQuarterKey.replace('-', ' · ') : 'No Data')}
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
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                      {appMode?.startsWith('PQA')
                        ? (pqaMxGroupBy === 'PARTNER' ? 'All 7 Partners — Accumulated Average' : 'All Centers — Accumulated Average')
                        : \`Top 10 Engineers (Quarterly Avg)\`}
                    </h3>
                    {quarterlyRanking.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">
                        No accumulated data — upload Excel with ★Partner Ranking sheet.
                      </div>
                    ) : quarterlyRanking.slice(0, appMode?.startsWith('PQA') ? 100 : 10).map((eng, idx) => {
                      const displayRank = eng.displayRank || idx + 1;
                      const isFirst = displayRank === 1;
                      const isSecond = displayRank === 2;
                      const isThird = displayRank === 3;
                      const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-500 bg-zinc-800/60 border-white/5';
                      const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                      const avgLabel = appMode?.startsWith('PQA') ? 'Acc. Avg PQA' : 'Avg TCS';
                      return (
                        <div key={\`\${eng.id || eng.code}-acc\`} className={\`glass-card rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 border transition-all hover:border-white/20 \${cardBorder}\`}>
                          <div className={\`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg italic \${rankColor}\`}>
                            #{displayRank}
                          </div>
                          <img src={getPhotoUrl(eng)} className={\`w-14 h-14 rounded-2xl object-cover flex-shrink-0 \${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}\`} alt={eng.name} />
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-base md:text-lg font-black uppercase tracking-tight truncate \${isFirst ? 'text-yellow-400' : 'text-white'}\`}>{eng.name}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {!appMode?.startsWith('PQA') && <TierBadge tier={eng.tier} size="sm" />}
                              {appMode?.startsWith('PQA') && eng.monthCount > 1 && (
                                <span className="text-[8px] font-black text-zinc-700 uppercase">{eng.monthCount} months tracked</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={\`text-3xl md:text-4xl font-black italic tracking-tighter \${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}\`}>
                              {eng.avgScore != null ? parseFloat(eng.avgScore).toFixed(1) : '—'}
                            </span>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{avgLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {quarterlyRanking.length > 0 && (
                    <div className="glass-card rounded-[3rem] p-10 mt-8">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8">
                        {appMode?.startsWith('PQA') ? 'Accumulated Summary — 2026 YTD' : \`Quarter Summary — \${effectiveQuarterKey?.replace('-', ' · ')}\`}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">{appMode?.startsWith('PQA') ? (pqaMxGroupBy === 'PARTNER' ? 'Partners' : 'Centers') : 'Engineers'}</p>
                          <p className="text-3xl font-black text-white">{quarterlyRanking.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Avg Score</p>
                          <p className="text-3xl font-black text-blue-400">{(quarterlyRanking.reduce((s, e) => s + (e.avgScore || 0), 0) / quarterlyRanking.length).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Score</p>
                          <p className="text-3xl font-black text-yellow-400">{parseFloat(quarterlyRanking[0]?.avgScore || 0).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Champion</p>
                          <p className="text-xl font-black text-white uppercase">{quarterlyRanking[0]?.name || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          `;

c = c.substring(0, fragStart) + newContent + c.substring(fragEnd);
fs.writeFileSync(path, c);
console.log('✅ Content switcher fully restored');
console.log('Fragment start at char:', fragStart);
console.log('ENGINEER_LOOKUP at char:', fragEnd);
