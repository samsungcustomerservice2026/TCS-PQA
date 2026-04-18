const fs = require('fs');
let c = fs.readFileSync('src/app/page.js', 'utf8');

const regex = /for\s*\(let\s*j=0;\s*j\s*<\s*headerRow\.length;\s*j\+\+\)\s*\{\s*const\s*v\s*=\s*String\(headerRow\[j\]\s*\|\|\s*''\)\.toLowerCase\(\)\.trim\(\);\s*if\s*\(v\s*===\s*'region'\)\s*eRegionIdx\s*=\s*j;\s*if\s*\(v\s*===\s*'asc\s*code'\)\s*eCodeIdx\s*=\s*j;\s*if\s*\(v\s*===\s*'asc\s*name'\)\s*eNameIdx\s*=\s*j;\s*if\s*\(v\.includes\('partner'\)\)\s*ePartnerIdx\s*=\s*j;\s*\}/

const newText = `for (let j=0; j < headerRow.length; j++) {
                const v = String(headerRow[j] || '').toLowerCase().trim();
                const nv = v.replace(/[^a-z]/g, '');
                if (v.includes('region')) eRegionIdx = j;
                if (nv === 'asccode' || (nv.includes('code') && (nv.includes('asc') || nv.includes('center') || nv.includes('serv')))) eCodeIdx = j;
                if (nv === 'ascname' || (nv.includes('name') && (nv.includes('asc') || nv.includes('center') || nv.includes('serv')))) eNameIdx = j;
                if (v.includes('partner')) ePartnerIdx = j;
              }`;

if (regex.test(c)) {
    fs.writeFileSync('src/app/page.js', c.replace(regex, newText));
    console.log('Fixed CE column mapper with regex');
} else {
    console.error('Regex did not match');
}
