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

// 1. Update Partner Helper with exact requested partners
const newPartnerHelper = "const getMxPartner = (nameOrAsc) => {\n" +
"  if (!nameOrAsc) return 'OTHERS';\n" +
"  const val = String(nameOrAsc).toUpperCase();\n" +
"  if (val.includes('SAF') || val.includes('AL SAFY')) return 'ALSAFY';\n" +
"  if (val.includes('ATS')) return 'ATS';\n" +
"  if (val.includes('MTI')) return 'MTI';\n" +
"  if (val.includes('SKY')) return 'SKY';\n" +
"  if (val.includes('RAYA')) return 'RAYA';\n" +
"  if (val.includes('URC')) return 'URC';\n" +
"  if (val.includes('K-ELECTRONICS') || val.includes('KELECTRONICS') || val.includes('K ELECTRONICS')) return 'K-ELECTRONICS';\n" +
"  return 'OTHERS';\n" +
"};";
content = content.replace(/const getMxPartner = \(nameOrAsc\) => \{[\s\S]*?\};/, newPartnerHelper);

// 2. Updated Header: Slogan Center, Logo Right (Enlarged)
const newHeader = "const Header = ({ onHome, onLogoClick, appMode }) => {\n" +
"  const appLogo = useMemo(() => {\n" +
"    if (appMode?.startsWith('PQA')) return './pqa_logo.png';\n" +
"    return './fawzy-logo.png';\n" +
"  }, [appMode]);\n" +
"  const slogan = 'Earn Your Tier • Own Your Title';\n" +
"  return (\n" +
"    <header className=\"sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700\">\n" +
"      <div className=\"max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4\">\n" +
"        {/* Left — Samsung Logo */}\n" +
"        <div className=\"flex items-center\">\n" +
"          <div className=\"cursor-pointer group\" onClick={onLogoClick || onHome}>\n" +
"            <img src=\"./sam_logo.png\" alt=\"Samsung\" className=\"h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500\" />\n" +
"          </div>\n" +
"        </div>\n" +
"        {/* Center — Slogan (Centered & Enlarged) */}\n" +
"        <div className=\"flex justify-center text-center\">\n" +
"           <p className=\"text-[10px] md:text-[14px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-zinc-300 font-extrabold leading-relaxed\">\n" +
"            {slogan}\n" +
"          </p>\n" +
"        </div>\n" +
"        {/* Right — App Logo (rounded & enlarged matching frame) */}\n" +
"        <div className=\"flex justify-end items-center\">\n" +
"          <div className=\"h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-3xl bg-black/40 hover:scale-110 transition-all duration-500 hover:border-white/40 ring-1 ring-white/5 shadow-white/5\">\n" +
"             <img src={appLogo} alt=\"App Logo\" className=\"w-full h-full object-cover\" />\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"    </header>\n" +
"  );\n" +
"};";
replaceBlock("const Header = ({ onHome, onLogoClick, appMode }) => {", "const MetricBar", newHeader + "\n\nconst MetricBar");

// 3. Portal Selection (APP_SELECTION): Filled logos, rounded edges, enlarged
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
                {/* TCS Portal */}
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

                {/* PQA Portal */}
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
replaceBlock("{view === 'APP_SELECTION' && (", ")}", newAppSelection);

// 4. Division Selection (PQA_DIVISION_SELECTION): Enlarged logos
const newDivisionSelection = `{view === 'PQA_DIVISION_SELECTION' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out">
              <button onClick={() => navigateBack()} className="absolute top-28 left-8 md:left-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10">
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
                  className="group relative h-[26rem] rounded-[3.5rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden">
                    <img src="./mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>

                {/* CE Division */}
                <button
                  onClick={() => { setAppMode('PQA_CE'); navigateTo('HOME'); }}
                  className="group relative h-[26rem] rounded-[3.5rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-950 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] overflow-hidden">
                    <img src="./ce_logo.png" alt="CE" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">CE Division</h3>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Consumer Electronics</p>
                  </div>
                </button>
              </div>
            </div>
          )}`;
replaceBlock("{view === 'PQA_DIVISION_SELECTION' && (", ")}", newDivisionSelection);

// 5. Update Excel Parsing to include 'Partner' column
content = content.replace("let prCodeCol=-1, prNameCol=-1, prYtdScoreCol=-1, prYtdRankCol=-1;", 
                        "let prCodeCol=-1, prNameCol=-1, prPartnerCol=-1, prYtdScoreCol=-1, prYtdRankCol=-1;");

const findPartnerLine = "if (v === 'asc name') prNameCol = j;";
content = content.replace(findPartnerLine, findPartnerLine + "\n              if (v === 'partner') prPartnerCol = j;");

const recordMapping = "name: String(r[prNameCol]||''),";
content = content.replace(recordMapping, recordMapping + "\n                  partner: String(r[prPartnerCol]||''),");

fs.writeFileSync(file, content);
console.log('Ultimate patch v2 complete');
