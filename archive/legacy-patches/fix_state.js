const fs = require('fs');
const path = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

const target = "  const [homeViewMode, setHomeViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'";
const replacement = "  const [homeViewMode, setHomeViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'\\n" +
"  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' | 'CENTER'";

if (content.indexOf(target) !== -1) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('State fixed');
} else {
    console.log('Target not found');
}
