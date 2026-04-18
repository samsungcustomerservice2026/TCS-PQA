const fs = require('fs');
let c = fs.readFileSync('src/app/page.js', 'utf8');

const oldText = `              for (let j=0; j < headerRow.length; j++) {
                const v = String(headerRow[j] || '').toLowerCase().trim();
                if (v === 'region') eRegionIdx = j;
                if (v === 'asc code') eCodeIdx = j;
                if (v === 'asc name') eNameIdx = j;
                if (v.includes('partner')) ePartnerIdx = j;
              }`;

const newText = `              for (let j=0; j < headerRow.length; j++) {
                const v = String(headerRow[j] || '').toLowerCase().trim();
                const nv = v.replace(/[^a-z]/g, '');
                if (v.includes('region')) eRegionIdx = j;
                if (nv === 'asccode' || (nv.includes('code') && (nv.includes('asc') || nv.includes('center') || nv.includes('serv')))) eCodeIdx = j;
                if (nv === 'ascname' || (nv.includes('name') && (nv.includes('asc') || nv.includes('center') || nv.includes('serv')))) eNameIdx = j;
                if (v.includes('partner')) ePartnerIdx = j;
              }`;

if (c.includes(oldText)) {
    fs.writeFileSync('src/app/page.js', c.replace(oldText, newText));
    console.log('Fixed CE column mapper');
} else {
    console.error('Old text not found');
}
