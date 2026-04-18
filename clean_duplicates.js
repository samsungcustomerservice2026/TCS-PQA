const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');
let lines = c.split('\\n');

// The goal is to remove the corrupted first occurrences of these blocks
// We search for the first "const allMonthPeriods" and the second one
let firstIdx = -1;
let secondIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const allMonthPeriods = useMemo")) {
        if (firstIdx === -1) firstIdx = i;
        else {
            secondIdx = i;
            break;
        }
    }
}

if (firstIdx !== -1 && secondIdx !== -1) {
    // Remove from firstIdx to secondIdx - 1
    lines.splice(firstIdx, secondIdx - firstIdx);
    fs.writeFileSync(path, lines.join('\\n'));
    console.log('Duplicated corrupted blocks removed');
} else {
    console.log('Could not find enough allMonthPeriods markers');
}
