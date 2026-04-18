const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

function replaceBlock(startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) { console.log('Marker not found:', startMarker); return; }
  const endIdx = content.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) { console.log('End marker not found:', endMarker); return; }
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx + endMarker.length);
}

// 1. Ranking Logic (Partner aware, 7 for MX, 31 for CE)
const newRanking = "  const hofTop10 = useMemo(() => {\n" +
"    if (!effectiveHofMonth) return [];\n" +
"    const [m, y] = effectiveHofMonth.split('-');\n" +
"    const entries = engineers.filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y);\n" +
"\n" +
"    if (appMode === 'PQA_MX') {\n" +
"      if (pqaMxGroupBy === 'PARTNER') {\n" +
"        const byPartner = {};\n" +
"        entries.forEach(e => {\n" +
"          let pName = getMxPartner(e.name || e.asc);\n" +
"          if (!byPartner[pName]) byPartner[pName] = { partner: pName, centers: [], tcsScore: 0, minRank: Infinity, partnerScore: 0 };\n" +
"          byPartner[pName].centers.push(e);\n" +
"          byPartner[pName].tcsScore += e.tcsScore;\n" +
"          if (e.monthlyRank > 0) byPartner[pName].minRank = Math.min(byPartner[pName].minRank, e.monthlyRank);\n" +
"          if (e.partnerScore > 0) byPartner[pName].partnerScore = e.partnerScore;\n" +
"        });\n" +
"        const out = Object.values(byPartner).map(p => {\n" +
"           let avg = p.centers.length ? parseFloat((p.tcsScore / p.centers.length).toFixed(1)) : 0;\n" +
"           return { id: p.partner, name: p.partner, tcsScore: p.partnerScore > 0 ? p.partnerScore : avg, monthlyRank: p.minRank === Infinity ? 0 : p.minRank, centerCount: p.centers.length, isPartnerGroup: true };\n" +
"        });\n" +
"        const hasRank = out.some(p => p.monthlyRank > 0);\n" +
"        if (hasRank) return out.filter(p => p.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank).slice(0,7);\n" +
"        return out.sort((a,b) => b.tcsScore - a.tcsScore).slice(0,7);\n" +
"      } else {\n" +
"        const byCode = {};\n" +
"        entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });\n" +
"        const obj = Object.values(byCode);\n" +
"        const hasRank = obj.some(e => e.monthlyRank > 0);\n" +
"        if (hasRank) return obj.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank);\n" +
"        return obj.sort((a,b) => b.tcsScore - a.tcsScore);\n" +
"      }\n" +
"    }\n" +
"    if (appMode === 'PQA_CE') {\n" +
"       const byCode = {};\n" +
"       entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });\n" +
"       const obj = Object.values(byCode);\n" +
"       const hasRank = obj.some(e => e.monthlyRank > 0);\n" +
"       if (hasRank) return obj.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank).slice(0,31);\n" +
"       return obj.sort((a,b) => b.tcsScore - a.tcsScore).slice(0,31);\n" +
"    }\n" +
"    const byCode = {};\n" +
"    entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });\n" +
"    return Object.values(byCode).sort((a,b) => b.tcsScore - a.tcsScore).slice(0,10);\n" +
"  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);\n\n" +
"  const pqaAccumulatedRanking = useMemo(() => {\n" +
"    if (!appMode?.startsWith('PQA')) return [];\n" +
"    if (appMode === 'PQA_MX') {\n" +
"      if (pqaMxGroupBy === 'PARTNER') {\n" +
"        const byPartner = {};\n" +
"        engineers.forEach(e => {\n" +
"          let pName = getMxPartner(e.name || e.asc);\n" +
"          if (!e.code) return;\n" +
"          if (!byPartner[pName]) byPartner[pName] = { partner: pName, engs: {} };\n" +
"          const ex = byPartner[pName].engs[e.code];\n" +
"          if (!ex) { byPartner[pName].engs[e.code] = e; } else {\n" +
"            const y1=parseInt(ex.year), y2=parseInt(e.year);\n" +
"            if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byPartner[pName].engs[e.code] = e;\n" +
"          }\n" +
"        });\n" +
"        const out = Object.values(byPartner).map(p => {\n" +
"          const arr = Object.values(p.engs);\n" +
"          const bestRank = arr.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank)[0]?.ytdRank || 0;\n" +
"          const avgScore = parseFloat((arr.reduce((s,e)=>s+(e.ytdScore||e.tcsScore),0)/arr.length).toFixed(1));\n" +
"          return { ...arr[0], id: p.partner, name: p.partner, ytdRank: bestRank, ytdScore: avgScore, centerCount: arr.length, isPartnerGroup: true };\n" +
"        });\n" +
"        const hasYtd = out.some(p => p.ytdRank > 0);\n" +
"        if (hasYtd) return out.filter(p => p.ytdRank > 0).sort((a,b) => a.ytdRank - b.ytdRank).slice(0,7);\n" +
"        return out.sort((a,b) => b.ytdScore - a.ytdScore).slice(0,7);\n" +
"      } else {\n" +
"        const byCode = {};\n" +
"        engineers.forEach(e=>{\n" +
"           if(!e.code) return;\n" +
"           const ex=byCode[e.code]; if(!ex){byCode[e.code]=e; return;}\n" +
"           const y1=parseInt(ex.year), y2=parseInt(e.year);\n" +
"           if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byCode[e.code] = e;\n" +
"        });\n" +
"        const obj = Object.values(byCode);\n" +
"        const hasRank = obj.some(e=>e.ytdRank>0);\n" +
"        if (hasRank) return obj.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank);\n" +
"        return obj.sort((a,b)=>b.tcsScore-a.tcsScore);\n" +
"      }\n" +
"    }\n" +
"    if (appMode === 'PQA_CE') {\n" +
"       const byCode = {};\n" +
"        engineers.forEach(e=>{\n" +
"           if(!e.code) return;\n" +
"           const ex=byCode[e.code]; if(!ex){byCode[e.code]=e; return;}\n" +
"           const y1=parseInt(ex.year), y2=parseInt(e.year);\n" +
"           if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byCode[e.code] = e;\n" +
"        });\n" +
"       const obj = Object.values(byCode);\n" +
"       const hasRank = obj.some(e=>e.ytdRank>0);\n" +
"       if(hasRank) return obj.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank).slice(0,31);\n" +
"       return obj.sort((a,b)=>b.tcsScore-a.tcsScore).slice(0,31);\n" +
"    }\n" +
"    return [];\n" +
"  }, [engineers, appMode, pqaMxGroupBy]);";

replaceBlock("  const hofTop10 = useMemo(() => {", "}, [engineers, effectiveHofMonth, appMode]);", newRanking);

// 2. JSX Toggles and Labels
const newToggle = "{/* Dashboard Toggle */}\n" +
"              <div className=\"flex flex-col items-center gap-4\">\n" +
"                <div className=\"bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl\">\n" +
"                  <button onClick={() => setHomeViewMode('MONTHLY')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-zinc-500 hover:text-white'}`}>Monthly</button>\n" +
"                  <button onClick={() => setHomeViewMode('QUARTERLY')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-zinc-500 hover:text-white'}`}>{appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}</button>\n" +
"                </div>\n" +
"                {appMode === 'PQA_MX' && (\n" +
"                  <div className=\"bg-zinc-900/60 p-1 rounded-full border border-white/10 flex items-center backdrop-blur-xl\">\n" +
"                    <button onClick={() => setPqaMxGroupBy('PARTNER')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'PARTNER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}`}>By Partner</button>\n" +
"                    <button onClick={() => setPqaMxGroupBy('CENTER')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'CENTER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}`}>By Center</button>\n" +
"                  </div>\n" +
"                )}\n" +
"              </div>";

replaceBlock("{/* Dashboard Toggle */}", "{/* Content Switcher */}", newToggle + "\n\n              {/* Content Switcher */}");

// Labels
content = content.replace(/Top \{(appMode === 'PQA_MX' || appMode === 'PQA_CE') \? '20' : '10'\} \{appMode\?\.startsWith\('PQA'\) \? 'Service Centers' : 'Engineers'\}/g, 
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}");

const quarterlyLabel = "Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Centers' : 'Engineers'} (Quarterly Avg)";
content = content.replace(quarterlyLabel, 
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'} (Accumulated / Quarterly)");

// Quarterly mapping in JSX
content = content.replace(/quarterlyRanking\.slice\(0, \(appMode\?\.startsWith\('PQA\'\) \? 20 : 10\)\)/g, "(appMode?.startsWith('PQA') ? pqaAccumulatedRanking : quarterlyRanking.slice(0, 10))");

// 3. Fix Score display
content = content.replace(/{eng\.tcsScore}/g, "{eng.ytdScore || eng.tcsScore}");
content = content.replace("Avg Score ({eng.monthCount} mo)", "{appMode?.startsWith('PQA') ? 'Accumulated Score' : `Avg Score (${eng.monthCount} mo)`}");

fs.writeFileSync(file, content);
console.log('Ranking patch complete');
