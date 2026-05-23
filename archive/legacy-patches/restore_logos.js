const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

const oldStart = "{view === 'APP_SELECTION' && (";
const oldEnd = "          )}";
// We need to find the FIRST occurrence after line 1500
const sIdx = content.indexOf(oldStart, content.indexOf('return (', 1400));
const eIdx = content.indexOf(oldEnd, sIdx + oldStart.length);

if (sIdx !== -1 && eIdx !== -1) {
    const newBlock = "{view === 'APP_SELECTION' && (\\n" +
"            <div className=\"min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 ease-out\">\\n" +
"              <div className=\"text-center space-y-4\">\\n" +
"                <div className=\"inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4\">\\n" +
"                  <span className=\"relative flex h-2 w-2\">\\n" +
"                    <span className=\"animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75\"></span>\\n" +
"                    <span className=\"relative inline-flex rounded-full h-2 w-2 bg-yellow-500\"></span>\\n" +
"                  </span>\\n" +
"                  <p className=\"text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400\">System Gateway</p>\\n" +
"                </div>\\n" +
"                <h2 className=\"text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic\">\\n" +
"                  Select <span className=\"text-blue-600\">Portal</span>\\n" +
"                </h2>\\n" +
"                <p className=\"text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto\">Choose your destination environment to proceed with operations.</p>\\n" +
"              </div>\\n" +
"\\n" +
"              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4\">\\n" +
"                {/* Engineer Portal */}\\n" +
"                <button\\n" +
"                  onClick={() => { setAppMode('TCS'); navigateTo('HOME'); }}\\n" +
"                  className=\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl\"\\n" +
"                >\\n" +
"                  <div className=\"absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\" />\\n" +
"                  <div className=\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-hidden\">\\n" +
"                    <img src=\"./fawzy-logo.png\" alt=\"TCS\" className=\"w-full h-full object-cover scale-150\" />\\n" +
"                  </div>\\n" +
"                  <div className=\"text-center space-y-3 relative z-10\">\\n" +
"                    <h3 className=\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors\">TCS Portal</h3>\\n" +
"                    <p className=\"text-xs font-bold uppercase tracking-widest text-zinc-500\">( Engineers )</p>\\n" +
"                  </div>\\n" +
"                </button>\\n" +
"\\n" +
"                {/* Service Center Portal */}\\n" +
"                <button\\n" +
"                  onClick={() => navigateTo('PQA_DIVISION_SELECTION')}\\n" +
"                  className=\"group relative h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-yellow-500/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl\"\\n" +
"                >\\n" +
"                  <div className=\"absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500\" />\\n" +
"                  <div className=\"w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-yellow-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden\">\\n" +
"                    <img src=\"./pqa_logo.png\" alt=\"PQA\" className=\"w-full h-full object-cover rounded-2xl\" />\\n" +
"                  </div>\\n" +
"                  <div className=\"text-center space-y-3 relative z-10\">\\n" +
"                    <h3 className=\"text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors\">PQA Portal</h3>\\n" +
"                    <p className=\"text-xs font-bold uppercase tracking-widest text-zinc-500\">( Service Center )</p>\\n" +
"                  </div>\\n" +
"                </button>\\n" +
"              </div>\\n" +
"            </div>\\n" +
"          )}";
    content = content.substring(0, sIdx) + newBlock + content.substring(eIdx + oldEnd.length);
    fs.writeFileSync(path, content);
    console.log('Logos restored and enlarged');
} else {
    console.log('APP_SELECTION block not found');
}
