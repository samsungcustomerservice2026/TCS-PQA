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

// 1. Refined Partner Helper (handles object and provides exact requested names)
const newPartnerHelper = "const getMxPartner = (eng) => {\n" +
"  if (!eng) return 'Others';\n" +
"  if (eng.partner && eng.partner.trim() && !eng.partner.toLowerCase().includes('partner')) return eng.partner.trim();\n" +
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
content = content.replace(/const getMxPartner = \(nameOrAsc\) => \{[\s\S]*?\};/, newPartnerHelper);

// 2. Update calls to getMxPartner(e.name || e.asc) to getMxPartner(e)
content = content.replace(/getMxPartner\(e\.name \|\| e\.asc\)/g, "getMxPartner(e)");

// 3. Ensure "Top 7 Partners" is shown for MX partner view
content = content.replace("? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers'", "? (pqaMxGroupBy === 'PARTNER' ? 'Partners' : 'Service Centers') : appMode?.startsWith('PQA') ? 'Service Centers'");

fs.writeFileSync(file, content);
console.log('Ultimate patch v3 complete');
