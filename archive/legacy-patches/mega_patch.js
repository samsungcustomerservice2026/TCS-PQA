const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// --- 1. Helper Functions ---
const getMxPartnerDef = `const getMxPartner = (eng) => {
  if (!eng) return 'Others';
  let p = eng.partner || '';
  if (p && p.trim() && !p.toLowerCase().includes('partner')) return p.trim();
  const val = String(eng.name || eng.asc || '').toUpperCase();
  if (val.includes('SAF') || val.includes('AL SAFY')) return 'Alsafy';
  if (val.includes('ATS')) return 'ATS';
  if (val.includes('MTI')) return 'MTi';
  if (val.includes('SKY')) return 'Sky';
  if (val.includes('RAYA')) return 'Raya';
  if (val.includes('URC')) return 'URC';
  if (val.includes('K-ELECTRONICS') || val.includes('KELECTRONICS') || val.includes('K ELECTRONICS')) return 'K-Electronics';
  return 'Others';
};`;

if (!content.includes('const getMxPartner')) {
    content = content.replace('const getMonthIndex', getMxPartnerDef + '\n\nconst getMonthIndex');
}

// --- 2. State & Hooks ---
if (!content.includes('const [pqaMxGroupBy, setPqaMxGroupBy]')) {
    content = content.replace('[selectedQuarterKey, setSelectedQuarterKey] = useState(null);', 
        '[selectedQuarterKey, setSelectedQuarterKey] = useState(null);\n  const [pqaMxGroupBy, setPqaMxGroupBy] = useState(\'PARTNER\');');
}

// --- 3. Header ---
const newHeader = `const Header = ({ onHome, onLogoClick, appMode }) => {
  const appLogo = useMemo(() => {
    if (appMode?.startsWith('PQA')) return './pqa_logo.png';
    return './fawzy-logo.png';
  }, [appMode]);
  const slogan = 'Earn Your Tier • Own Your Title';
  return (
    <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4">
        <div className="flex items-center">
          <div className="cursor-pointer group" onClick={onLogoClick || onHome}>
            <img src="./sam_logo.png" alt="Samsung" className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
        <div className="flex justify-center text-center">
           <p className="text-[10px] md:text-[15px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-zinc-300 font-extrabold leading-relaxed">
            {slogan}
          </p>
        </div>
        <div className="flex justify-end items-center group">
          <div className="h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem] overflow-hidden border-2 border-white/10 shadow-3xl bg-black transition-all duration-700 hover:scale-110 hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
             <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};`;

const headerStart = "const Header = ({ onHome, onLogoClick, appMode }) => {";
const headerEnd = "const MetricBar";
const hStartIdx = content.indexOf(headerStart);
const hEndIdx = content.indexOf(headerEnd);
if (hStartIdx !== -1 && hEndIdx !== -1) {
    content = content.substring(0, hStartIdx) + newHeader + '\n\n' + content.substring(hEndIdx);
}

// --- 4. APP_SELECTION ---
const newAppSelection = `{view === 'APP_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">System Gateway</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-blue-600">Portal</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your destination environment to proceed with operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl px-4">
                <button
                  onClick={() => { setAppMode('TCS'); navigateTo('HOME'); }}
                  className="group relative h-[28rem] rounded-[4rem] p-12 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-blue-500/30 transition-all duration-700 shadow-3xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black group-hover:scale-105 transition-transform duration-700 group-hover:shadow-blue-500/20">
                    <img src="./fawzy-logo.png" className="w-full h-full object-cover" alt="TCS" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">TCS Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500/80">( ENGINEERS )</p>
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('PQA_DIVISION_SELECTION')}
                  className="group relative h-[28rem] rounded-[4rem] p-12 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-yellow-500/30 transition-all duration-700 shadow-3xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black group-hover:scale-105 transition-transform duration-700 group-hover:shadow-yellow-500/20">
                    <img src="./pqa_logo.png" className="w-full h-full object-cover" alt="PQA" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">PQA Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500/80">( SERVICE CENTER )</p>
                  </div>
                </button>
              </div>
            </div>
          )}`;

const appSelStart = "{view === 'APP_SELECTION' && (";
const appSelPlaceholder = "// --- DIVISION SELECTION ---"; // This is a trick to find a stable marker
// Actually, let's find the closing )} by counting braces or finding the NEXT view.
const nextViewStart = "{view === 'PQA_DIVISION_SELECTION' && (";
const asIdx = content.indexOf(appSelStart);
const nvIdx = content.indexOf(nextViewStart);
if (asIdx !== -1 && nvIdx !== -1) {
    content = content.substring(0, asIdx) + newAppSelection + '\n\n          ' + content.substring(nvIdx);
}

// --- 5. Ranking & Logic Cleanup ---
// (Skip for brevity or re-apply carefully if needed)

fs.writeFileSync(path, content);
console.log('Mega patch successful');
