const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

// Fix the literal \n characters that were accidentally injected
c = c.replace(/\\n/g, '\n');

// Also check and fix the state declaration if it's still potentially broken
const stateLine = "  const [homeViewMode, setHomeViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'";
const missingState = "  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' | 'CENTER'";

if (c.indexOf(missingState) === -1) {
    c = c.replace(stateLine, stateLine + "\n" + missingState);
}

fs.writeFileSync(path, c);
console.log('File structure and state repaired');
