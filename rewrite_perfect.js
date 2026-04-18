const fs = require('fs');
const filePath = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find start of handleExcelUpload
const uploadStart = content.indexOf('const handleExcelUpload = async (e) => {');
if (uploadStart === -1) {
  console.log("Not found"); process.exit(1);
}

// Find the end of handleExcelUpload
const nextBlockStart = content.indexOf('if (isLoading) {', uploadStart);
if (nextBlockStart === -1) {
  console.log("End not found"); process.exit(1);
}

// The exact structure of handleExcelUpload:
const newUploadBlock = `const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      
      const isPqaMode = appMode === 'PQA_MX' || appMode === 'PQA_CE';
      const colName = appMode === 'PQA_MX' ? 'pqa_mx_centers' : (appMode === 'PQA_CE' ? 'pqa_ce_centers' : 'engineers');

      let uploadedRecords = [];

      const findSheet = (keyword) => {
        const name = workbook.SheetNames.find(n => n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')));
        return name ? workbook.Sheets[name] : null;
      };

      if (isPqaMode) {
        // ════════════════════════════════════════════════════════════
        // PQA MULTI-SHEET PARSER
        // ════════════════════════════════════════════════════════════
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
                const monthlyScore = parseFloat(r[block.col]) || 0;
                let pScore = 0, pRank = 0;
                if (prMonths[m+1]) {
                   for (let c = block.col; c < prMonths[m+1].col; c++) {
                      const cName = String(headerRow[c]||'').toLowerCase();
                      if (cName.includes('partner score')) pScore = parseFloat(r[c]) || 0;
                      if (cName.includes('rank')) pRank = parseInt(r[c]) || 0;
                   }
                } else {
                   for (let c = block.col; c < block.col + 6; c++) {
                      const cName = String(headerRow[c]||'').toLowerCase();
                      if (cName.includes('partner score')) pScore = parseFloat(r[c]) || 0;
                      if (cName.includes('rank')) pRank = parseInt(r[c]) || 0;
                   }
                }
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

        // ── 2. Parse Evaluation Point ──
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
             for (let j=0; j < Math.min(subheaderRow.length, 10); j++) {
                const subV = String(subheaderRow[j] || '').toLowerCase().trim();
                if (subV === 'score') eYtdScoreIdx = Math.max(j, eYtdScoreIdx);
                if (subV === '(rank)') eYtdRankIdx = Math.max(j, eYtdRankIdx);
             }

             let evalMonth = 'Mar', evalYear = '2026';
             for (let r=0; r <= evalCodeRowIdx; r++) {
               const rw = evalRows[r] || [];
               for (let c=0; c < rw.length; c++) {
                 const v = String(rw[c]||'').trim();
                 const mm2 = v.match(/^(2\\d)\\.\\s*(0[1-9]|1[0-2])$/);
                 if (mm2) {
                    const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    evalMonth = mNames[parseInt(mm2[2], 10) - 1];
                    evalYear = '20' + mm2[1];
                 }
                 const mm1 = v.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\\s_']*(2\\d|\\d{4}))?$/i);
                 if (!mm2 && mm1 && c > 5) {
                    evalMonth = mm1[1].charAt(0).toUpperCase() + mm1[1].slice(1,3).toLowerCase();
                    evalYear = mm1[3] ? (mm1[3].length===2?'20'+mm1[3]:mm1[3]) : '2026';
                 }
               }
             }

             const cols = {};
             for (let c=0; c < subheaderRow.length; c++) {
               const v = String(subheaderRow[c] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
               if (!v) continue;
               if (!cols.score && (v.includes('point') || v === 'score') && c > 10) cols.score = c;
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
               
               if (eYtdScoreIdx !== -1) {
                  ytdRankMap[pCode] = { ytdScore: parseFloat(rw[eYtdScoreIdx]) || 0, ytdRank: parseInt(rw[eYtdRankIdx]) || ytdRankMap[pCode]?.ytdRank || 0 };
               }
               if (cols.score) rData.evalMonthlyScore = parseFloat(rw[cols.score]) || 0;
             }
          }
        }

        for (const [key, rd] of Object.entries(partnerRankMap)) {
           if (!rd.monthlyScore && !rd.partnerScore && !rd.monthlyRank && !rd.ltp) continue;
           const ytd = ytdRankMap[rd.code] || {};
           const pqaRecord = {
              id: '', region: rd.region || '', code: rd.code, name: rd.name,
              photoUrl: 'https://picsum.photos/200', partnerName: 'N/A',
              month: rd.mName, year: rd.year,
              ltp: rd.ltp||0, exLtp: rd.exLtp||0, redo: rd.redo||0, owRnps: rd.owRnps||0, 
              ssr: rd.ssr||0, dRnps: rd.dRnps||0, ofs: rd.ofs||0, rCxe: rd.rCxe||0, 
              coa: rd.coa||0, sdr: rd.sdr||0, switching: rd.switching||0, audit: rd.audit||0, tc: rd.tc||0,
              ytdScore: ytd.ytdScore || 0, ytdRank: ytd.ytdRank || 0,
              monthlyRank: rd.monthlyRank || 0, partnerScore: rd.partnerScore || 0,
              tcsScore: rd.monthlyScore || rd.evalMonthlyScore || calculatePQAScore({ ltp:rd.ltp||0, exLtp:rd.exLtp||0, redo:rd.redo||0, ssr:rd.ssr||0, dRnps:rd.dRnps||0, ofs:rd.ofs||0, rCxe:rd.rCxe||0, sdr:rd.sdr||0, audit:rd.audit||0, pr: 0 }),
           };
           pqaRecord.tier = getTier(pqaRecord.tcsScore);
           uploadedRecords.push(pqaRecord);
        }

      } else {
        // TCS Original Parser
        const targetSheet = workbook.Sheets["TCS Scores"] || workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(targetSheet, { header: 1, raw: false });
        let headerRow = -1;
        let cName=0, cCode=1, cPhoto=2, cAsc=3, cPartner=4, cMonth=5, cYear=6, cRedo=7, cSk=8, cMaint=9, cOqc=10, cTrain=11, cPba=12, cOcta=13, cMulti=14, cExam=15, cProm=16, cDet=17;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const r = rows[i] || [];
          for (let j = 0; j < Math.min(r.length, 10); j++) {
            const v = String(r[j] || '').toLowerCase().trim();
            if (v === 'code') cCode = j;
            if (v === 'name') cName = j;
          }
          if (cCode > -1) { headerRow = i; break; }
        }
        for (let i = (headerRow > -1 ? headerRow + 1 : 1); i < rows.length; i++) {
          const r = rows[i] || [];
          if (!r[cCode]) continue;
          let eng = {
            id: '',
            name: String(r[cName] || "Unknown"), code: String(r[cCode]).trim().toUpperCase(), photoUrl: String(r[cPhoto] || "https://picsum.photos/200"),
            asc: String(r[cAsc] || "N/A"), partnerName: String(r[cPartner] || "N/A"), month: String(r[cMonth] || "Active Month"), year: String(r[cYear] || new Date().getFullYear().toString()),
            redoRatio: parseFloat(r[cRedo]) || 0, iqcSkipRatio: parseFloat(r[cSk]) || 0, maintenanceModeRatio: parseFloat(r[cMaint]) || 0, oqcPassRate: parseFloat(r[cOqc]) || 0,
            trainingAttendance: parseFloat(r[cTrain]) || 0, corePartsPBA: parseFloat(r[cPba]) || 0, corePartsOcta: parseFloat(r[cOcta]) || 0, multiPartsRatio: parseFloat(r[cMulti]) || 0,
            examScore: parseFloat(r[cExam]) || 0, promoters: parseFloat(r[cProm]) || 0, detractors: parseFloat(r[cDet]) || 0,
          };
          eng.tcsScore = calculateTCS(eng);
          eng.tier = getTier(eng.tcsScore);
          uploadedRecords.push(eng);
        }
      }

      if (uploadedRecords.length === 0) {
        message.warning("No valid data found in the Excel sheet. Check headers (Region, ASC Code, ASC Name).");
        return;
      }

      const finalUploadSet = [];
      uploadedRecords.forEach(rec => {
        const existing = engineers.find(e => e.code?.toUpperCase() === rec.code?.toUpperCase() && e.month?.toLowerCase() === rec.month?.toLowerCase() && e.year === rec.year);
        if (existing) finalUploadSet.push({ ...rec, id: existing.id });
        else finalUploadSet.push(rec);
      });

      try {
        const promises = finalUploadSet.map(async (rec) => {
          const savedId = await saveEngineerToDb(rec, colName);
          return { ...rec, id: savedId || rec.id };
        });
        const savedRecords = await Promise.all(promises);

        setEngineers(prev => {
          const next = [...prev];
          savedRecords.forEach(rec => {
            const idx = next.findIndex(e => e.id === rec.id);
            if (idx !== -1) next[idx] = rec;
            else next.push(rec);
          });
          return next;
        });

        message.success(\`Success: \${savedRecords.length} records processed and saved to \${appMode}.\`);
        writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: \`Excel Bulk Import (\${appMode})\`, details: { count: savedRecords.length }, severity: 'info' });
      } catch (error) {
        console.error("Error uploading Excel data:", error);
        message.error("Error saving Excel data to database.");
      }
    };
    reader.readAsArrayBuffer(file);
  };
`;

const before = content.substring(0, uploadStart);
const after = content.substring(nextBlockStart);

// Clean insert and also ensure the structure matches what comes after
fs.writeFileSync(filePath, before + newUploadBlock + "\n  " + after);
console.log("Rewrite successful!");
