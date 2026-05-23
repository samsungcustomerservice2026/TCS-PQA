const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

function fixSection(startMarker, endMarker, newContent) {
  const sIdx = c.indexOf(startMarker);
  const eIdx = c.indexOf(endMarker, sIdx + startMarker.length);
  if (sIdx !== -1 && eIdx !== -1) {
    c = c.substring(0, sIdx) + newContent + c.substring(eIdx + endMarker.length);
    return true;
  }
  return false;
}

// Fixed Header
fixSection('const Header = ({ onHome, onLogoClick, appMode }) => {', 'const MetricBar', \`const Header = ({ onHome, onLogoClick, appMode }) => {
  const showLogo = appMode !== null; 
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
          {showLogo && (
            <div className="h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem] overflow-hidden border-2 border-white/10 shadow-3xl bg-black transition-all duration-700 hover:scale-110 hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
               <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};\n\n\`);

// Fixed Division Selection
fixSection("{view === 'PQA_DIVISION_SELECTION' && (", "{view === 'HOME' && (", \`{view === 'PQA_DIVISION_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out">
              <button
                onClick={() => navigateTo('APP_SELECTION')}
                className="absolute top-28 left-8 md:left-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Gateway
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">PQA Environment</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-yellow-500">Division</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your division cluster.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
                {/* MX Division */}
                <button
                  onClick={() => { setAppMode('PQA_MX'); navigateTo('HOME'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden">
                    <img src="./mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>

                {/* CE Division */}
                <button
                  onClick={() => { setAppMode('PQA_CE'); navigateTo('HOME'); }}
                  className="group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden">
                    <img src="./ce_logo.png" alt="CE" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">CE Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Consumer Electronics</p>
                  </div>
                </button>
              </div>
            </div>
          )\`);

// Fixed Dashboard Toggle
fixSection('/* Dashboard Toggle */', '/* Content Switcher */', \`/* Dashboard Toggle */
              <div className="flex flex-col items-center gap-6">
                <div className="bg-zinc-900/60 p-2 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-2xl">
                  <button
                    onClick={() => setHomeViewMode('MONTHLY')}
                    className="px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all MonthlyBtn"
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setHomeViewMode('QUARTERLY')}
                    className="px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all QuarterlyBtn"
                  >
                    Accumulated
                  </button>
                </div>

                {appMode === 'PQA_MX' && (
                  <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-700">
                    <button
                      onClick={() => setPqaMxGroupBy('PARTNER')}
                      className="px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all PartnerBtn"
                    >
                      By Partner
                    </button>
                    <button
                      onClick={() => setPqaMxGroupBy('CENTER')}
                      className="px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all CenterBtn"
                    >
                      By Center
                    </button>
                  </div>
                )}
              </div>\`);

c = c.replace('MonthlyBtn', '\${homeViewMode === "MONTHLY" ? "bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]" : "text-zinc-500 hover:text-white"}');
c = c.replace('QuarterlyBtn', '\${homeViewMode === "QUARTERLY" ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]" : "text-zinc-500 hover:text-white"}');
c = c.replace('PartnerBtn', '\${pqaMxGroupBy === "PARTNER" ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "text-zinc-500 hover:text-white"}');
c = c.replace('CenterBtn', '\${pqaMxGroupBy === "CENTER" ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "text-zinc-500 hover:text-white"}');

fs.writeFileSync(path, c);
console.log('Final fix applied successfully');
