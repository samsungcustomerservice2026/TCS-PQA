const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let c = fs.readFileSync(path, 'utf8');

const marker = "const allMonthPeriods = useMemo";
let firstIdx = c.indexOf(marker);
let secondIdx = c.indexOf(marker, firstIdx + marker.length);

if (firstIdx !== -1 && secondIdx !== -1) {
    // Keep from the start to before the first marker, and from the second marker to the end
    // Wait, if I want to remove the corrupted one (which is the first one as usually they include the corrupted part)
    // Actually, let's look at the content around them.
    
    // In the previous view_file, second occurrence was followed by the GOOD hofTop10 logic.
    // First occurrence was followed by analyticsLoading.
    
    const newContent = c.substring(0, firstIdx) + c.substring(secondIdx);
    fs.writeFileSync(path, newContent);
    console.log('Successfully removed first duplicate block');
} else {
    console.log('Markers not found: first=' + firstIdx + ' second=' + secondIdx);
}
