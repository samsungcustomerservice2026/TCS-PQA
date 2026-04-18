const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const pqaState = "  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view\n  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' or 'CENTER'";
content = content.replace("  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view", pqaState);

const partnerHelper = "const getMonthIndex = (monthName) => {\n  if (!monthName) return 0;\n  const mn = monthName.toLowerCase().trim();\n  const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === mn || m.toLowerCase().startsWith(mn.slice(0, 3)));\n  return idx < 0 ? 0 : idx;\n};\n\n// --- MX Partner Grouping Helper ---\nconst getMxPartner = (nameOrAsc) => {\n  if (!nameOrAsc) return 'OTHERS';\n  const val = String(nameOrAsc).toUpperCase();\n  if (val.includes('SKY')) return 'SKY';\n  if (val.includes('KMT')) return 'KMT';\n  if (val.includes('MM')) return 'MM';\n  if (val.includes('QAST')) return 'QAST';\n  if (val.includes('RAYA')) return 'RAYA';\n  if (val.includes('I2A')) return 'I2A';\n  if (val.indexOf('B-TECH') !== -1 || val.indexOf('BTECH') !== -1) return 'B-TECH';\n  return 'OTHERS';\n};";
content = content.replace(/const getMonthIndex = \(monthName\) => \{[\s\S]*?return idx < 0 \? 0 : idx;\n\};/, partnerHelper);

fs.writeFileSync(file, content);
console.log('Patch step 1 complete');
