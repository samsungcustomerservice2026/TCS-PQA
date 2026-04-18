const fs = require('fs');

const filePath = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const startMarkerStr = `// ════════════════════════════════════════════════════════════
        // PQA MULTI-SHEET PARSER`;
const endMarkerStr = `              pqaRecord.tier = getTier(pqaRecord.tcsScore);
              uploadedRecords.push(pqaRecord);
            }
          }

          if (uploadedRecords.length === 0 && Object.keys(partnerRankMap).length > 0) {
            // fallback handled
          }`;

// Let's just find the indices and replace the whole block manually
const startIdx = content.indexOf(startMarkerStr);
if (startIdx === -1) {
  console.log("Start marker not found");
  process.exit(1);
}

// Just match the whole handleExcelUpload body from isPqaMode check up to `if (uploadedRecords.length === 0)`
// It's safer to use a regex or string replacement.

const newBlock = `// ════════════════════════════════════════════════════════════
        // PQA MULTI-SHEET PARSER
        // Supports the actual MX Excel format with 3 sheets
        // ════════════════════════════════════════════════════════════

        const findSheet = (keyword) => {
          const name = workbook.SheetNames.find(n => n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')));
          return name ? workbook.Sheets[name] : null;
        };

        const partnerRankMap = {};
        const ytdRankMap = {};

        // ── 1. Parse Partner Ranking (Master records for all months) ──
        const prSheet = findSheet('PartnerRanking') || findSheet('Partner');
        if (prSheet) {
          const prRows = XLSX.utils.sheet_to_json(prSheet, { header: 1, raw: false });
          let prHeaderRowIdx = -1;
          for (let i = 0; i < Math.min(prRows.length, 10); i++) {
            const r = prRows[i] || [];
            if (r.some(v => String(v).toLowerCase().trim() === 'asc code')) {
              prHeaderRowIdx = i; break;
            }
          }
          if (prHeaderRowIdx !== -1) {
            const monthRow = prHeaderRowIdx > 0 ? (prRows[prHeaderRowIdx - 1] || []) : [];
            const headerRow = prRows[prHeaderRowIdx] || [];
            
            let prCodeCol=-1, prNameCol=-1, prYtdScoreCol=-1, prYtdRankCol=-1;
            for (let j=0; j<headerRow.length; j++) {
              const v = String(headerRow[j] || '').toLowerCase().trim();
              if (v === 'asc code') prCodeCol = j;
              if (v === 'asc name') prNameCol = j;
              if ((v.includes('ave') || v.includes('avg')) && v.includes('score')) prYtdScoreCol = j;
              if ((v === 'ranking' || v.includes('rank')) && j < 10 && j > prCodeCol) prYtdRankCol = j;
            }

            const prMonths = []; 
            for (let j=0; j<monthRow.length; j++) {
              const val = String(monthRow[j]||'').trim();
              if (!val) continue;
              const m = val.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\\s_']*(2\\d|\\d{4}))?$/i);
              if (m) {
                prMonths.push({
                  month: m[1].charAt(0).toUpperCase() + m[1].slice(1,3).toLowerCase(),
                  year: m[3] ? (m[3].length===2?'20'+m[3]:m[3]) : '2026',
                  col: j
                });
              }
            }

            for (let i = prHeaderRowIdx + 1; i < prRows.length; i++) {
              const r = prRows[i] || [];
              if (!r[prCodeCol]) continue;
              const pCode = String(r[prCodeCol]).trim().toUpperCase();
              if (!pCode || pCode === 'ASC CODE') continue;
              const pName = String(r[prNameCol] || pCode).trim();
              
              const ytdScore = parseFloat(r[prYtdScoreCol]) || 0;
              const ytdRank = parseInt(r[prYtdRankCol]) || 0;
              if (ytdRank > 0) ytdRankMap[pCode] = { ytdRank, ytdScore };

              for (let m=0; m<prMonths.length; m++) {
                const block = prMonths[m];
                // F3=Branch Score, I3=Partner Score, J3=Partner Rankin
                const monthlyScore = parseFloat(r[block.col]) || 0;
                // Try finding Partner Score and Rank offset (usually +3, +4 or similar within block)
                // Defaulting to columns relative to month header if standard format
                let pScore = 0, pRank = 0;
                if (prMonths[m+1]) {
                   // scan columns between this block and next block
                   for (let c = block.col; c < prMonths[m+1].col; c++) {
                      const cName = String(headerRow[c]||'').toLowerCase();
                      if (cName.includes('partner score')) pScore = parseFloat(r[c]) || 0;
                      if (cName.includes('rank')) pRank = parseInt(r[c]) || 0;
                   }
                } else {
                   // if last month, just check next 5 columns
                   for (let c = block.col; c < block.col + 6; c++) {
                      const cName = String(headerRow[c]||'').toLowerCase();
                      if (cName.includes('partner score')) pScore = parseFloat(r[c]) || 0;
                      if (cName.includes('rank')) pRank = parseInt(r[c]) || 0;
                   }
                }
                // fallback offsets if headers didn't exactly match
                if (pScore === 0) pScore = parseFloat(r[block.col + 3]) || 0;
                if (pRank === 0) pRank = parseInt(r[block.col + 4]) || 0;

                if (monthlyScore > 0 || pScore > 0 || pRank > 0) {
                  const key = \`\${pCode}_\${block.month.toLowerCase()}_\${block.year}\`;
                  partnerRankMap[key] = {
                    code: pCode, name: pName,
                    monthlyScore, monthlyRank: pRank, partnerScore: pScore,
                    mName: block.month, year: block.year
                  };
                }
              }
            }
          }
        }

        // ── 2. Parse Evaluation Point (KPIs, usually for the latest single month) ──
        const evalSheet = findSheet('Evaluation') || findSheet('EvaluationPoint') || workbook.Sheets[workbook.SheetNames[0]];
        if (evalSheet) {
          const evalRows = XLSX.utils.sheet_to_json(evalSheet, { header: 1, raw: false });
          let evalCodeRowIdx = -1;
          for (let i = 0; i < Math.min(evalRows.length, 15); i++) {
            const r = evalRows[i] || [];
            if (r.some(v => String(v).toLowerCase().trim() === 'asc code')) {
              evalCodeRowIdx = i; break;
            }
          }

          if (evalCodeRowIdx !== -1) {
             const headerRow = evalRows[evalCodeRowIdx] || [];
             const subheaderRow = evalRows[evalCodeRowIdx + 1] || [];
             
             let eRegionIdx=-1, eCodeIdx=-1, eNameIdx=-1, eYtdScoreIdx=-1, eYtdRankIdx=-1;
             for (let j=0; j < headerRow.length; j++) {
               const v = String(headerRow[j] || '').toLowerCase().trim();
               if (v === 'region') eRegionIdx = j;
               if (v === 'asc code') eCodeIdx = j;
               if (v === 'asc name') eNameIdx = j;
             }
             // check subheaders for YTD (usually columns D & E before the massive point lists)
             for (let j=0; j < 10; j++) {
                const subV = String(subheaderRow[j] || '').toLowerCase().trim();
                // 2026 Acc Average Score is often D8, Rank is E8
                if (subV === 'score') eYtdScoreIdx = Math.max(j, eYtdScoreIdx);
                if (subV === '(rank)') eYtdRankIdx = Math.max(j, eYtdRankIdx);
             }

             // Detect month by scanning top rows (1 to evalCodeRowIdx)
             let evalMonth = 'Mar', evalYear = '2026'; // default
             for (let r=0; r < evalCodeRowIdx; r++) {
               const rw = evalRows[r] || [];
               for (let c=0; c < rw.length; c++) {
                 const v = String(rw[c]||'').trim();
                 // "26. 03" pattern
                 const mm2 = v.match(/^(2\\d)\\.\\s*(0[1-9]|1[0-2])$/);
                 if (mm2) {
                    const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    evalMonth = mNames[parseInt(mm2[2], 10) - 1];
                    evalYear = '20' + mm2[1];
                 }
                 // "Mar" / "Mar-26" pattern
                 const mm1 = v.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\\s_']*(2\\d|\\d{4}))?$/i);
                 if (!mm2 && mm1 && c > 5) {
                    evalMonth = mm1[1].charAt(0).toUpperCase() + mm1[1].slice(1,3).toLowerCase();
                    evalYear = mm1[3] ? (mm1[3].length===2?'20'+mm1[3]:mm1[3]) : '2026';
                 }
               }
             }

             // Analyze subheader row for KPIs (after eCodeIdx+2 usually)
             const cols = {};
             for (let c=0; c < subheaderRow.length; c++) {
               const v = String(subheaderRow[c] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
               if (!v) continue;
               if (!cols.score && (v.includes('point') || v === 'score') && c > 10) cols.score = c; // Monthly Score is usually total/sigma point
               if (!cols.rank && v.includes('rank') && c > 10) cols.rank = c;
               if (v === 'ltp') cols.ltp = c;
               if (v === 'exltp') cols.exLtp = c;
               if (v === 'redo') cols.redo = c;
               if (v.includes('owrnps')) cols.owRnps = c;
               if (v === 'ssr') cols.ssr = c;
               if (v.includes('drnps')) cols.dRnps = c;
               if (v === 'ofs') cols.ofs = c;
               if (v.includes('surv') || v.includes('cxe')) cols.rCxe = c;
               if (v.includes('coa')) cols.coa = c;
               if (v === 'sdr') cols.sdr = c;
               if (v.includes('switch')) cols.switching = c;
               if (v === 'audit') cols.audit = c;
               if (v === 'tc' && !cols.tc) cols.tc = c;
             }

             for (let i = evalCodeRowIdx + 2; i < evalRows.length; i++) {
               const rw = evalRows[i];
               if (!rw || !rw[eCodeIdx]) continue;
               const pCode = String(rw[eCodeIdx]).trim().toUpperCase();
               if (!pCode || pCode.toLowerCase() === 'asc code') continue;
               
               const region = String(rw[eRegionIdx] || '').trim();
               
               const key = \`\${pCode}_\${evalMonth.toLowerCase()}_\${evalYear}\`;
               if (!partnerRankMap[key]) {
                  partnerRankMap[key] = { code: pCode, name: String(rw[eNameIdx] || pCode).trim(), mName: evalMonth, year: evalYear };
               }
               
               const rData = partnerRankMap[key];
               rData.region = region;
               if (cols.ltp) rData.ltp = parseFloat(rw[cols.ltp]) || 0;
               if (cols.exLtp) rData.exLtp = parseFloat(rw[cols.exLtp]) || 0;
               if (cols.redo) rData.redo = parseFloat(rw[cols.redo]) || 0;
               if (cols.owRnps) rData.owRnps = parseFloat(rw[cols.owRnps]) || 0;
               if (cols.ssr) rData.ssr = parseFloat(rw[cols.ssr]) || 0;
               if (cols.dRnps) rData.dRnps = parseFloat(rw[cols.dRnps]) || 0;
               if (cols.ofs) rData.ofs = parseFloat(rw[cols.ofs]) || 0;
               if (cols.rCxe) rData.rCxe = parseFloat(rw[cols.rCxe]) || 0;
               if (cols.coa) rData.coa = parseFloat(rw[cols.coa]) || 0;
               if (cols.sdr) rData.sdr = parseFloat(rw[cols.sdr]) || 0;
               if (cols.switching) rData.switching = parseFloat(rw[cols.switching]) || 0;
               if (cols.audit) rData.audit = parseFloat(rw[cols.audit]) || 0;
               if (cols.tc) rData.tc = parseFloat(rw[cols.tc]) || 0;
               
               if (eYtdScoreIdx !== -1) ytdRankMap[pCode] = { ytdScore: parseFloat(rw[eYtdScoreIdx]) || 0, ytdRank: parseInt(rw[eYtdRankIdx]) || ytdRankMap[pCode]?.ytdRank || 0 };
               if (cols.score) rData.evalMonthlyScore = parseFloat(rw[cols.score]) || 0;
             }
          }
        }

        // ── 3. Compile final records from map ──
        for (const [key, rd] of Object.entries(partnerRankMap)) {
           // if no scores and no ranking, skip
           if (!rd.monthlyScore && !rd.partnerScore && !rd.monthlyRank && !rd.ltp) continue;
           
           const ytd = ytdRankMap[rd.code] || {};
           const pqaRecord = {
              id: '',
              region: rd.region || '',
              code: rd.code,
              name: rd.name,
              photoUrl: 'https://picsum.photos/200',
              partnerName: 'N/A',
              month: rd.mName,
              year: rd.year,
              ltp: rd.ltp||0, exLtp: rd.exLtp||0, redo: rd.redo||0, owRnps: rd.owRnps||0, 
              ssr: rd.ssr||0, dRnps: rd.dRnps||0, ofs: rd.ofs||0, rCxe: rd.rCxe||0, 
              coa: rd.coa||0, sdr: rd.sdr||0, switching: rd.switching||0, audit: rd.audit||0, tc: rd.tc||0,
              ytdScore: ytd.ytdScore || 0,
              ytdRank: ytd.ytdRank || 0,
              monthlyRank: rd.monthlyRank || 0,
              partnerScore: rd.partnerScore || 0,
              tcsScore: rd.monthlyScore || rd.evalMonthlyScore || calculatePQAScore({ ltp:rd.ltp||0, exLtp:rd.exLtp||0, redo:rd.redo||0, ssr:rd.ssr||0, dRnps:rd.dRnps||0, ofs:rd.ofs||0, rCxe:rd.rCxe||0, sdr:rd.sdr||0, audit:rd.audit||0, pr: 0 }),
           };
           pqaRecord.tier = getTier(pqaRecord.tcsScore);
           uploadedRecords.push(pqaRecord);
        }
`;

// Now replace from line 1357 to 1570 roughly.
const endBlockIdx = content.indexOf('if (uploadedRecords.length === 0', startIdx);
if (endBlockIdx === -1) {
  console.log("End block not found");
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endBlockIdx);

fs.writeFileSync(filePath, before + newBlock + after);
console.log("Replacement successful!");
