const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

function replaceBlock(startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return;
  const endIdx = content.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) return;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx + endMarker.length);
}

// 1. Fix getMxPartner Error (already done by patch_step1, but ensuring it's here)
const partnerHelper = "const getMxPartner = (nameOrAsc) => {\n" +
"  if (!nameOrAsc) return 'OTHERS';\n" +
"  const val = String(nameOrAsc).toUpperCase();\n" +
"  if (val.includes('SKY')) return 'SKY';\n" +
"  if (val.includes('KMT')) return 'KMT';\n" +
"  if (val.includes('MM')) return 'MM';\n" +
"  if (val.includes('QAST')) return 'QAST';\n" +
"  if (val.includes('RAYA')) return 'RAYA';\n" +
"  if (val.includes('I2A')) return 'I2A';\n" +
"  if (val.indexOf('B-TECH') !== -1 || val.indexOf('BTECH') !== -1) return 'B-TECH';\n" +
"  return 'OTHERS';\n" +
"};\n\nconst getMonthIndex";

if (content.indexOf('const getMxPartner') === -1) {
  content = content.replace("const getMonthIndex", partnerHelper);
}

// 2. Fix Header Branding
// The user said: "change the tcs logo and pqa logo as made before and remoce the tcs logo from the top center"
// "slogan to the top right instead"
// We'll put Logo on the LEFT next to Samsung, Slogan on the RIGHT.
const newHeader = "const Header = ({ onHome, onLogoClick, appMode }) => {\n" +
"  const appLogo = useMemo(() => {\n" +
"    if (appMode?.startsWith('PQA')) return './pqa_logo.png';\n" +
"    return './fawzy-logo.png';\n" +
"  }, [appMode]);\n" +
"  const slogan = 'Earn Your Tier • Own Your Title';\n" +
"  return (\n" +
"    <header className=\"sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700\">\n" +
"      <div className=\"max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4\">\n" +
"        {/* Left — Samsung + App Logo */}\n" +
"        <div className=\"flex items-center gap-6\">\n" +
"          <div className=\"cursor-pointer group\" onClick={onLogoClick || onHome}>\n" +
"            <img src=\"./sam_logo.png\" alt=\"Samsung\" className=\"h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500\" />\n" +
"          </div>\n" +
"          <div className=\"h-12 w-12 md:h-16 md:w-16 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/50\">\n" +
"             <img src={appLogo} alt=\"App Logo\" className=\"w-full h-full object-contain p-1\" />\n" +
"          </div>\n" +
"        </div>\n" +
"        {/* Center — Empty or flexible space */}\n" +
"        <div />\n" +
"        {/* Right — Slogan */}\n" +
"        <div className=\"flex flex-col items-end text-right justify-center group\">\n" +
"          <p className=\"text-[9px] md:text-[11px] uppercase tracking-[0.35em] md:tracking-[0.4em] text-zinc-400 font-black leading-relaxed\">\n" +
"            {slogan.split(' • ').map((s, i) => ( <React.Fragment key={i}><span className=\"block\">{s}</span></React.Fragment> ))}\n" +
"          </p>\n" +
"        </div>\n" +
"      </div>\n" +
"    </header>\n" +
"  );\n" +
"};";

replaceBlock("const Header = ({ onHome, onLogoClick, appMode }) => {", "const MetricBar", newHeader + "\n\nconst MetricBar");

// 3. Fix Photo URLs (ensuring Partner logos load from firebase)
const newPhotoUrl = "  const getPhotoUrl = (eng) => {\n" +
"    if (!eng) return 'https://picsum.photos/200';\n" +
"    const isPqa = appMode?.startsWith('PQA');\n" +
"    if (isPqa) {\n" +
"      if (appMode === 'PQA_MX' && eng.isPartnerGroup) {\n" +
"        return `https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%20Service%20centers%2F${encodeURIComponent(eng.name)}.png?alt=media`;\n" +
"      }\n" +
"      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {\n" +
"        return pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;\n" +
"      }\n" +
"    }\n" +
"    return eng.photoUrl || 'https://picsum.photos/200';\n" +
"  };";

// First check if the regex match exists in standard form
const photoSearch = "  const getPhotoUrl = (eng) => {\n    if (!eng) return 'https://picsum.photos/200';\n    const isPqa = appMode?.startsWith('PQA');\n    if (isPqa) {\n      // If it's a placeholder or a default picsum, use the Service Center photo";
if (content.indexOf(photoSearch) !== -1) {
  replaceBlock("  const getPhotoUrl = (eng) => {", "return eng.photoUrl || 'https://picsum.photos/200';\n  };", newPhotoUrl);
}

// 4. Ensure pqaMxGroupBy and pqaAccumulatedRanking are correctly hooked up
// to prevent ReferenceErrors if the user clicks toggles
if (content.indexOf("const [pqaMxGroupBy, setPqaMxGroupBy]") === -1) {
  content = content.replace("[selectedQuarterKey, setSelectedQuarterKey] = useState(null);", "[selectedQuarterKey, setSelectedQuarterKey] = useState(null);\n  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER');");
}

fs.writeFileSync(file, content);
console.log('Ultimate patch complete');
