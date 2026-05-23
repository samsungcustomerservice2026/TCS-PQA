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

// 1. Partner Helper Fix
const finalPartnerHelper = "const getMxPartner = (eng) => {\n" +
"  if (!eng) return 'Others';\n" +
"  let p = eng.partner || '';\n" +
"  if (p && p.trim() && !p.toLowerCase().includes('partner')) return p.trim();\n" +
"  const val = String(eng.name || eng.asc || '').toUpperCase();\n" +
"  if (val.includes('SAF') || val.includes('AL SAFY')) return 'Alsafy';\n" +
"  if (val.includes('ATS')) return 'ATS';\n" +
"  if (val.includes('MTI')) return 'MTi';\n" +
"  if (val.includes('SKY')) return 'Sky';\n" +
"  if (val.includes('RAYA')) return 'Raya';\n" +
"  if (val.includes('URC')) return 'URC';\n" +
"  if (val.includes('K-ELECTRONICS') || val.includes('KELECTRONICS') || val.includes('K ELECTRONICS')) return 'K-Electronics';\n" +
"  return 'Others';\n" +
"};";
content = content.replace(/const getMxPartner = \(eng\) => \{[\s\S]*?\};/, finalPartnerHelper);

// 2. Excel Upload: Ensure Partner column is captured
content = content.replace(/partnerRankMap\[key\] = \{[\s\S]*?mName: block\.month, year: block\.year\n                  \};/g, (match) => {
    if (match.includes("partner: String(r[prPartnerCol] || '')")) return match;
    return match.replace("code: pCode,", "code: pCode, partner: String(r[prPartnerCol] || ''),");
});

content = content.replace("partner: mData?.partner || '' // I need to make sure mData has it", "partner: mData?.partner || ''");

// 3. UI Fixes: Slogan Center, Logo Right (Filled/Rounded/Enlarged)
const newHeader = "const Header = ({ onHome, onLogoClick, appMode }) => {\n" +
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
"          <div className=\"h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem] overflow-hidden border-2 border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] bg-black transition-all duration-700 hover:scale-110 hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.15)]\">\n" +
"             <img src={appLogo} alt=\"App Logo\" className=\"w-full h-full object-cover\" />\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"    </header>\n" +
"  );\n" +
"};";
replaceBlock("const Header = ({ onHome, onLogoClick, appMode }) => {", "const MetricBar", newHeader + "\n\nconst MetricBar");

fs.writeFileSync(file, content);
console.log('Final UI and Partner fix complete');
