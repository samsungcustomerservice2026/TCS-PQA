const fs = require('fs');

const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split(/\\r?\\n/);

let newLines = [];
let i = 0;

while (i < lines.length) {
  let line = lines[i];

  // 1. HEADER
  if (line.includes('const Header = ({ onHome, onLogoClick, appMode }) => {')) {
    newLines.push(\`const Header = ({ onHome, onLogoClick, appMode }) => {
  const centerLogo = useMemo(() => {
    if (appMode?.startsWith('PQA')) return './pqa_logo.png';
    return './fawzy-logo.png'; // Assuming this is TCS logo
  }, [appMode]);

  const slogan = 'Earn Your Tier • Own Your Title';

  return (
    <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4">
        {/* Left */}
        <div className="flex items-center cursor-pointer group" onClick={onLogoClick || onHome}>
          <div className="relative">
            <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <img src="./sam_logo.png" alt="Samsung Logo" className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500 relative z-10" />
          </div>
        </div>
        {/* Center */}
        <div className="flex justify-center items-center group">
          <img src={centerLogo} alt="App Logo" className="h-12 md:h-16 w-auto object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-xl" style={{ borderRadius: '1rem', overflow: 'hidden' }} />
        </div>
        {/* Right */}
        <div className="flex flex-col items-end text-right justify-center gap-1 group">
          <p className="text-[9px] md:text-[11px] uppercase tracking-[0.35em] md:tracking-[0.4em] text-zinc-400 font-black leading-relaxed">
            {slogan.split(' • ').map((s, i) => ( <React.Fragment key={i}><span className="block">{s}</span></React.Fragment> ))}
          </p>
        </div>
      </div>
    </header>
  );
};\`);
    // skip until old header ends
    while (i < lines.length && !lines[i].includes('};') && !lines[i+1]?.includes('const MetricBar')) {
      i++;
    }
    i++;
    continue;
  }

  // 2. GETPHOTOURL
  if (line.includes('const getPhotoUrl = (eng) => {')) {
    newLines.push(\`  const getPhotoUrl = (eng) => {
    if (!eng) return 'https://picsum.photos/200';
    const isPqa = appMode?.startsWith('PQA');
    if (isPqa) {
      if (appMode === 'PQA_MX' && eng.isPartnerGroup) {
        return \\\`https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%20Service%20centers%2F\${encodeURIComponent(eng.name)}.png?alt=media\\\`;
      }
      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {
        return pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;
      }
    }
    return eng.photoUrl || 'https://picsum.photos/200';
  };\`);
    while (i < lines.length && !lines[i].includes('return eng.photoUrl')) {
      i++;
    }
    i++; // skip 'return eng...' and '};'
    i++;
    continue;
  }

  // 3. GROUP BY STATE
  if (line.includes('const [selectedQuarterKey, setSelectedQuarterKey] = useState(null);')) {
    newLines.push(line);
    newLines.push(\`  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' or 'CENTER'\`);
    i++;
    continue;
  }

  // 4. RANKING LOGIC (hofTop10)
  if (line.includes('const hofTop10 = useMemo(() => {')) {
    newLines.push(\`  // ─── Monthly Ranking ────────────────────────────────────────────────────────
  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const entries = engineers.filter(e => e.month?.toLowerCase() === m?.toLowerCase() && e.year === y);

    if (appMode === 'PQA_MX') {
      if (pqaMxGroupBy === 'PARTNER') {
        const byPartner = {};
        entries.forEach(e => {
          let pName = getMxPartner(e.name || e.asc);
          if (!byPartner[pName]) byPartner[pName] = { partner: pName, centers: [], tcsScore: 0, minRank: Infinity, partnerScore: 0 };
          byPartner[pName].centers.push(e);
          byPartner[pName].tcsScore += e.tcsScore;
          if (e.monthlyRank > 0) byPartner[pName].minRank = Math.min(byPartner[pName].minRank, e.monthlyRank);
          if (e.partnerScore > 0) byPartner[pName].partnerScore = e.partnerScore;
        });
        const out = Object.values(byPartner).map(p => {
           let avg = p.centers.length ? parseFloat((p.tcsScore / p.centers.length).toFixed(1)) : 0;
           return { id: p.partner, name: p.partner, tcsScore: p.partnerScore > 0 ? p.partnerScore : avg, monthlyRank: p.minRank === Infinity ? 0 : p.minRank, centerCount: p.centers.length, isPartnerGroup: true };
        });
        if (out.some(p => p.monthlyRank > 0)) return out.filter(p => p.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank).slice(0,7);
        return out.sort((a,b) => b.tcsScore - a.tcsScore).slice(0,7);
      } else {
        const byCode = {};
        entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
        const obj = Object.values(byCode);
        if (obj.some(e => e.monthlyRank > 0)) return obj.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank);
        return obj.sort((a,b) => b.tcsScore - a.tcsScore);
      }
    }
    if (appMode === 'PQA_CE') {
       const byCode = {};
       entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
       const obj = Object.values(byCode);
       if (obj.some(e => e.monthlyRank > 0)) return obj.filter(e => e.monthlyRank > 0).sort((a,b) => a.monthlyRank - b.monthlyRank).slice(0,31);
       return obj.sort((a,b) => b.tcsScore - a.tcsScore).slice(0,31);
    }
    // TCS
    const byCode = {};
    entries.forEach(e => { if (!byCode[e.code] || e.tcsScore > byCode[e.code].tcsScore) byCode[e.code] = e; });
    return Object.values(byCode).sort((a,b) => b.tcsScore - a.tcsScore).slice(0,10);
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy]);

  const pqaAccumulatedRanking = useMemo(() => {
    if (!appMode?.startsWith('PQA')) return [];
    if (appMode === 'PQA_MX') {
      if (pqaMxGroupBy === 'PARTNER') {
        const byPartner = {};
        engineers.forEach(e => {
          let pName = getMxPartner(e.name || e.asc);
          if (!e.code) return;
          if (!byPartner[pName]) byPartner[pName] = { partner: pName, engs: {} };
          const ex = byPartner[pName].engs[e.code];
          if (!ex) { byPartner[pName].engs[e.code] = e; } else {
            const y1=parseInt(ex.year), y2=parseInt(e.year);
            if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byPartner[pName].engs[e.code] = e;
          }
        });
        const out = Object.values(byPartner).map(p => {
          const arr = Object.values(p.engs);
          const bestRank = arr.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank)[0]?.ytdRank || 0;
          const avgScore = parseFloat((arr.reduce((s,e)=>s+(e.ytdScore||e.tcsScore),0)/arr.length).toFixed(1));
          return { ...arr[0], id: p.partner, name: p.partner, ytdRank: bestRank, ytdScore: avgScore, centerCount: arr.length, isPartnerGroup: true };
        });
        if (out.some(p => p.ytdRank > 0)) return out.filter(p => p.ytdRank > 0).sort((a,b) => a.ytdRank - b.ytdRank).slice(0,7);
        return out.sort((a,b) => b.ytdScore - a.ytdScore).slice(0,7);
      } else {
        const byCode = {};
        engineers.forEach(e=>{
           if(!e.code) return;
           const ex=byCode[e.code]; if(!ex){byCode[e.code]=e; return;}
           const y1=parseInt(ex.year), y2=parseInt(e.year);
           if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byCode[e.code] = e;
        });
        const obj = Object.values(byCode);
        if (obj.some(e=>e.ytdRank>0)) return obj.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank);
        return obj.sort((a,b)=>b.tcsScore-a.tcsScore);
      }
    }
    if (appMode === 'PQA_CE') {
       const byCode = {};
        engineers.forEach(e=>{
           if(!e.code) return;
           const ex=byCode[e.code]; if(!ex){byCode[e.code]=e; return;}
           const y1=parseInt(ex.year), y2=parseInt(e.year);
           if(y2>y1 || (y2===y1 && getMonthIndex(e.month)>getMonthIndex(ex.month))) byCode[e.code] = e;
        });
       const obj = Object.values(byCode);
       if(obj.some(e=>e.ytdRank>0)) return obj.filter(e=>e.ytdRank>0).sort((a,b)=>a.ytdRank-b.ytdRank).slice(0,31);
       return obj.sort((a,b)=>b.tcsScore-a.tcsScore).slice(0,31);
    }
    return [];
  }, [engineers, appMode, pqaMxGroupBy]);\`);
    while (i < lines.length && !lines[i].includes('}, [engineers, effectiveHofMonth, appMode]);')) {
      i++;
    }
    // ensure we don't output the old dependency line
    i++;
    continue;
  }

  // 5. DASHBOARD TOGGLE JSX
  if (line.includes('{/* Dashboard Toggle */}')) {
    newLines.push(\`              {/* Dashboard Toggle */}
              <div className="flex flex-col items-center gap-4">
                <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl">
                  <button onClick={() => setHomeViewMode('MONTHLY')} className={\\\`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all \${homeViewMode === 'MONTHLY' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-zinc-500 hover:text-white'}\\\`}>Monthly</button>
                  <button onClick={() => setHomeViewMode('QUARTERLY')} className={\\\`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all \${homeViewMode === 'QUARTERLY' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-zinc-500 hover:text-white'}\\\`}>{appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}</button>
                </div>
                {appMode === 'PQA_MX' && (
                  <div className="bg-zinc-900/60 p-1 rounded-full border border-white/10 flex items-center backdrop-blur-xl">
                    <button onClick={() => setPqaMxGroupBy('PARTNER')} className={\\\`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${pqaMxGroupBy === 'PARTNER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}\\\`}>By Partner</button>
                    <button onClick={() => setPqaMxGroupBy('CENTER')} className={\\\`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${pqaMxGroupBy === 'CENTER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}\\\`}>By Center</button>
                  </div>
                )}
              </div>\`);
    while (i < lines.length && !lines[i].includes('{/* Content Switcher */}')) {
      i++;
    }
    // 'Content Switcher' will be processed by next iteration!
    continue;
  }

  // 6. RANKING TITLE
  if (line.includes('Top {(appMode === \\'PQA_MX\\' || appMode === \\'PQA_CE\\') ? \\'20\\' : \\'10\\'} {appMode?.startsWith(\\'PQA\\') ? \\'Service Centers\\' : \\'Engineers\\'}')) {
    line = line.replace(\`{(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}\`, \`{(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}\`);
  }

  // 7. QUARTERLY TITLE
  if (line.includes(\`Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Centers' : 'Engineers'} (Quarterly Avg)\`)) {
    line = line.replace(\`{(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Centers' : 'Engineers'} (Quarterly Avg)\`, \`{(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'} (Accumulated / Quarterly)\`);
  }

  // 8. QUARTERLY MAP ARRAY 
  if (line.includes('quarterlyRanking.slice(0, (appMode?.startsWith(\\'PQA\\') ? 20 : 10))')) {
    line = line.replace(/quarterlyRanking\.slice\(0, \(appMode\?\.startsWith\('PQA'\) \? 20 : 10\)\)/g, "(appMode?.startsWith('PQA') ? pqaAccumulatedRanking : quarterlyRanking.slice(0, 10))");
  }
  
  if (line.includes('{eng.tcsScore}') && lines[i+1]?.includes('Avg Score')) {
     line = line.replace('{eng.tcsScore}', '{eng.ytdScore || eng.tcsScore}');
  }

  newLines.push(line);
  i++;
}

fs.writeFileSync(file, newLines.join('\\n'));
console.log('Patch complete.');
