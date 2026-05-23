const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

function replaceBlock(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) { console.log('Marker not found:', startMarker); return content; }
  const endIdx = content.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) { console.log('End marker not found:', endMarker); return content; }
  return content.substring(0, startIdx) + replacement + content.substring(endIdx + endMarker.length);
}

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

content = replaceBlock(content, "  const hofTop10 = useMemo(() => {", "  }, [engineers, effectiveHofMonth, appMode]);", newRanking);

fs.writeFileSync(file, content);
console.log('Patch step 3 complete');
