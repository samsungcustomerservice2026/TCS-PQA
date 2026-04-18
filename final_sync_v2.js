const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');
let lines = c.split('\\n');

let searchStart = 1490;
let appIdx = -1;
for (let i = searchStart; i < lines.length; i++) {
    if (lines[i].includes("view === 'APP_SELECTION'")) {
        appIdx = i;
        break;
    }
}

let homeIdx = -1;
for (let i = appIdx; i < lines.length; i++) {
    if (lines[i].includes("view === 'HOME'")) {
        homeIdx = i;
        break;
    }
}

if (appIdx !== -1 && homeIdx !== -1) {
    const newViewsContent = [
"          {view === 'APP_SELECTION' && (",
"            <div className=\\"min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out\\">",
"              <div className=\\"text-center space-y-4\\">",
"                <div className=\\"inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4\\">",
"                  <span className=\\"relative flex h-2 w-2\\">",
"                    <span className=\\"animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75\\"></span>",
"                    <span className=\\"relative inline-flex rounded-full h-2 w-2 bg-yellow-500\\"></span>",
"                  </span>",
"                  <p className=\\"text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400\\">System Gateway</p>",
"                </div>",
"                <h2 className=\\"text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic\\">",
"                  Select <span className=\\"text-blue-600\\">Portal</span>",
"                </h2>",
"                <p className=\\"text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto\\">Choose your destination environment to proceed with operations.</p>",
"              </div>",
"",
"              <div className=\\"grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4\\">",
"                <button",
"                  onClick={() => { setAppMode('TCS'); navigateTo('HOME'); }}",
"                  className=\\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl\\"",
"                >",
"                  <div className=\\"absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\\" />",
"                  <div className=\\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-hidden\\">",
"                    <img src=\\"./fawzy-logo.png\\" alt=\\"TCS\\" className=\\"w-full h-full object-cover scale-150\\" />",
"                  </div>",
"                  <div className=\\"text-center space-y-3 relative z-10\\">",
"                    <h3 className=\\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors\\">TCS Portal</h3>",
"                    <p className=\\"text-xs font-bold uppercase tracking-widest text-zinc-500\\">( Engineers )</p>",
"                  </div>",
"                </button>",
"",
"                <button",
"                  onClick={() => navigateTo('PQA_DIVISION_SELECTION')}",
"                  className=\\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-yellow-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl\\"",
"                >",
"                  <div className=\\"absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\\" />",
"                  <div className=\\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-yellow-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden\\">",
"                    <img src=\\"./pqa_logo.png\\" alt=\\"PQA\\" className=\\"w-full h-full object-cover rounded-2xl\\" />",
"                  </div>",
"                  <div className=\\"text-center space-y-3 relative z-10\\">",
"                    <h3 className=\\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors\\">PQA Portal</h3>",
"                    <p className=\\"text-xs font-bold uppercase tracking-widest text-zinc-500\\">( Service Center )</p>",
"                  </div>",
"                </button>",
"              </div>",
"            </div>",
"          )}",
"",
"          {view === 'PQA_DIVISION_SELECTION' && (",
"            <div className=\\"min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out\\">",
"              <button",
"                onClick={() => navigateTo('APP_SELECTION')}",
"                className=\\"absolute top-28 left-8 md:left-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10\\"",
"              >",
"                <ChevronLeft className=\\"w-4 h-4\\" /> Back to Gateway",
"              </button>",
"              <div className=\\"text-center space-y-4\\">",
"                <div className=\\"inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4\\">",
"                  <span className=\\"relative flex h-2 w-2\\">",
"                    <span className=\\"animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75\\"></span>",
"                    <span className=\\"relative inline-flex rounded-full h-2 w-2 bg-yellow-500\\"></span>",
"                  </span>",
"                  <p className=\\"text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400\\">PQA Environment</p>",
"                </div>",
"                <h2 className=\\"text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic\\">",
"                  Select <span className=\\"text-yellow-500\\">Division</span>",
"                </h2>",
"                <p className=\\"text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto\\">Choose your division cluster.</p>",
"              </div>",
"",
"              <div className=\\"grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4\\">",
"                <button",
"                  onClick={() => { setAppMode('PQA_MX'); navigateTo('HOME'); }}",
"                  className=\\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl\\"",
"                >",
"                  <div className=\\"absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\\" />",
"                  <div className=\\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden\\">",
"                    <img src=\\"./mx_logo.png\\" alt=\\"MX\\" className=\\"w-full h-full object-cover\\" />",
"                  </div>",
"                  <div className=\\"text-center space-y-3 relative z-10\\">",
"                    <h3 className=\\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors\\">MX Division</h3>",
"                    <p className=\\"text-xs font-bold uppercase tracking-widest text-zinc-500\\">Mobile Experience</p>",
"                  </div>",
"                </button>",
"",
"                <button",
"                  onClick={() => { setAppMode('PQA_CE'); navigateTo('HOME'); }}",
"                  className=\\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl\\"",
"                >",
"                  <div className=\\"absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\\" />",
"                  <div className=\\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden\\">",
"                    <img src=\\"./ce_logo.png\\" alt=\\"CE\\" className=\\"w-full h-full object-cover\\" />",
"                  </div>",
"                  <div className=\\"text-center space-y-3 relative z-10\\">",
"                    <h3 className=\\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors\\">CE Division</h3>",
"                    <p className=\\"text-xs font-bold uppercase tracking-widest text-zinc-500\\">Consumer Electronics</p>",
"                  </div>",
"                </button>",
"              </div>",
"            </div>",
"          )}",
""
    ].join('\\n');
    lines.splice(appIdx, homeIdx - appIdx, newViewsContent);
    fs.writeFileSync(path, lines.join('\\n'));
    console.log('Final sync complete');
} else {
    console.log('Indices not found');
}
