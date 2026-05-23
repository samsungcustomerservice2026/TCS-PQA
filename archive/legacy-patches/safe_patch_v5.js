const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(file, 'utf8');

// The marker for PQA Division Selection starting block
const divStart = "{view === 'PQA_DIVISION_SELECTION' && (";
const startIdx = c.indexOf(divStart);
if (startIdx === -1) { console.log('Could not find PQA_DIVISION_SELECTION start'); process.exit(1); }

// The marker for the NEXT block (HOME view)
const homeStart = "{view === 'HOME' && (";
const endIdx = c.indexOf(homeStart, startIdx);
if (endIdx === -1) { console.log('Could not find HOME view start'); process.exit(1); }

const newDivBlock = \`{view === 'PQA_DIVISION_SELECTION' && (
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
                  className="group relative h-32 rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
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
          )\`;

c = c.substring(0, startIdx) + newDivBlock + '\\n\\n          ' + c.substring(endIdx);

fs.writeFileSync(file, c);
console.log('Safe patch v5 applied successfully');
