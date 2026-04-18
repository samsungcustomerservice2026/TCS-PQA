const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

// Replacement for Header
const hStart = c.indexOf('const Header =');
const hMid = c.indexOf('const MetricBar =');
if (hStart !== -1 && hMid !== -1) {
    const newHeader = "const Header = ({ onHome, onLogoClick, appMode }) => {\n" +
"  const showLogo = appMode !== null; \n" +
"  const appLogo = useMemo(() => {\n" +
"    if (appMode?.startsWith('PQA')) return './pqa_logo.png';\n" +
"    return './fawzy-logo.png';\n" +
"  }, [appMode]);\n" +
"  const slogan = 'Earn Your Tier • Own Your Title';\n" +
"  return (\n" +
"    <header className=\"sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700\">\n" +
"      <div className=\"max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4\">\n" +
"        <div className=\"flex items-center\">\n" +
"          <div className=\"cursor-pointer group\" onClick={onLogoClick || onHome}>\n" +
"            <img src=\"./sam_logo.png\" alt=\"Samsung\" className=\"h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500\" />\n" +
"          </div>\n" +
"        </div>\n" +
"        <div className=\"flex justify-center text-center\">\n" +
"           <p className=\"text-[10px] md:text-[15px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-zinc-300 font-extrabold leading-relaxed\">\n" +
"            {slogan}\n" +
"          </p>\n" +
"        </div>\n" +
"        <div className=\"flex justify-end items-center group\">\n" +
"          {showLogo && (\n" +
"            <div className=\"h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem] overflow-hidden border-2 border-white/10 shadow-3xl bg-black transition-all duration-700 hover:scale-110 hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]\">\n" +
"               <img src={appLogo} alt=\"App Logo\" className=\"w-full h-full object-cover\" />\n" +
"            </div>\n" +
"          )}\n" +
"        </div>\n" +
"      </div>\n" +
"    </header>\n" +
"  );\n" +
"};";
    c = c.substring(0, hStart) + newHeader + "\n\n" + c.substring(hMid);
}

// Replacement for Toggles
const tStart = c.indexOf('/* Dashboard Toggle */');
const tEnd = c.indexOf('/* Content Switcher */', tStart);
if (tStart !== -1 && tEnd !== -1) {
    const newToggles = "/* Dashboard Toggle */\n" +
"              <div className=\"flex flex-col items-center gap-6\">\n" +
"                <div className=\"bg-zinc-900/60 p-2 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-2xl\">\n" +
"                  <button\n" +
"                    onClick={() => setHomeViewMode('MONTHLY')}\n" +
"                    className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY'\n" +
"                      ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]'\n" +
"                      : 'text-zinc-500 hover:text-white'\n" +
"                      }`}\n" +
"                  >\n" +
"                    Monthly\n" +
"                  </button>\n" +
"                  <button\n" +
"                    onClick={() => setHomeViewMode('QUARTERLY')}\n" +
"                    className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY'\n" +
"                      ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'\n" +
"                      : 'text-zinc-500 hover:text-white'\n" +
"                      }`}\n" +
"                  >\n" +
"                    {appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}\n" +
"                  </button>\n" +
"                </div>\n" +
"\n" +
"                {appMode === 'PQA_MX' && (\n" +
"                  <div className=\"bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-700\">\n" +
"                    <button\n" +
"                      onClick={() => setPqaMxGroupBy('PARTNER')}\n" +
"                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'PARTNER'\n" +
"                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'\n" +
"                        : 'text-zinc-500 hover:text-white'\n" +
"                        }`}\n" +
"                    >\n" +
"                      By Partner\n" +
"                    </button>\n" +
"                    <button\n" +
"                      onClick={() => setPqaMxGroupBy('CENTER')}\n" +
"                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'CENTER'\n" +
"                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'\n" +
"                        : 'text-zinc-500 hover:text-white'\n" +
"                        }`}\n" +
"                    >\n" +
"                      By Center\n" +
"                    </button>\n" +
"                  </div>\n" +
"                )}\n" +
"              </div>";
    c = c.substring(0, tStart) + newToggles + "\n\n              " + c.substring(tEnd);
}

fs.writeFileSync(path, c);
console.log('Final branding applied successfully');
