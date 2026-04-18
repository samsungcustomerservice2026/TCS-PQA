const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const newHeader = "const Header = ({ onHome, onLogoClick, appMode }) => {\n  const centerLogo = useMemo(() => {\n    if (appMode?.startsWith('PQA')) return './pqa_logo.png';\n    return './fawzy-logo.png';\n  }, [appMode]);\n  const slogan = 'Earn Your Tier • Own Your Title';\n  return (\n    <header className=\"sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700\">\n      <div className=\"max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4\">\n        <div className=\"flex items-center cursor-pointer group\" onClick={onLogoClick || onHome}>\n          <div className=\"relative\">\n            <div className=\"absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700\" />\n            <img src=\"./sam_logo.png\" alt=\"Samsung Logo\" className=\"h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500 relative z-10\" />\n          </div>\n        </div>\n        <div className=\"flex justify-center items-center group\">\n          <img src={centerLogo} alt=\"App Logo\" className=\"h-12 md:h-16 w-auto object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-xl\" style={{ borderRadius: '1rem', overflow: 'hidden' }} />\n        </div>\n        <div className=\"flex flex-col items-end text-right justify-center gap-1 group\">\n          <p className=\"text-[9px] md:text-[11px] uppercase tracking-[0.35em] md:tracking-[0.4em] text-zinc-400 font-black leading-relaxed\">\n            {slogan.split(' • ').map((s, i) => ( <React.Fragment key={i}><span className=\"block\">{s}</span></React.Fragment> ))}\n          </p>\n        </div>\n      </div>\n    </header>\n  );\n};";

content = content.replace(/const Header = \(\{ onHome, onLogoClick, appMode \}\) => \{[\s\S]*?\};\n\nconst MetricBar/, newHeader + "\n\nconst MetricBar");

const newPhotoUrl = "  const getPhotoUrl = (eng) => {\n    if (!eng) return 'https://picsum.photos/200';\n    const isPqa = appMode?.startsWith('PQA');\n    if (isPqa) {\n      if (appMode === 'PQA_MX' && eng.isPartnerGroup) {\n        return `https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%20Service%20centers%2F${encodeURIComponent(eng.name)}.png?alt=media`;\n      }\n      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {\n        return pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;\n      }\n    }\n    return eng.photoUrl || 'https://picsum.photos/200';\n  };";

content = content.replace(/const getPhotoUrl = \(eng\) => \{[\s\S]*?return eng\.photoUrl\|\|'https:\/\/picsum\.photos\/200';\n  \};/i, newPhotoUrl);
// Try without regex if failed
if (!content.includes('getPhotoUrl = (eng) => {')) {
  // if regex failed to match
}

fs.writeFileSync(file, content);
console.log('Patch step 2 complete');
