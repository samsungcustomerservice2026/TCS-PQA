const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

function replaceBlock(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) { console.log('Marker not found:', startMarker); return content; }
  const endIdx = content.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) { console.log('End marker not found:', endMarker); return content; }
  return content.substring(0, startIdx) + replacement + content.substring(endIdx + endMarker.length);
}

const newToggle = "{/* Dashboard Toggle */}\n" +
"              <div className=\"flex flex-col items-center gap-4\">\n" +
"                <div className=\"bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl\">\n" +
"                  <button onClick={() => setHomeViewMode('MONTHLY')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-zinc-500 hover:text-white'}`}>Monthly</button>\n" +
"                  <button onClick={() => setHomeViewMode('QUARTERLY')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-zinc-500 hover:text-white'}`}>{appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}</button>\n" +
"                </div>\n" +
"                {appMode === 'PQA_MX' && (\n" +
"                  <div className=\"bg-zinc-900/60 p-1 rounded-full border border-white/10 flex items-center backdrop-blur-xl\">\n" +
"                    <button onClick={() => setPqaMxGroupBy('PARTNER')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'PARTNER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}`}>By Partner</button>\n" +
"                    <button onClick={() => setPqaMxGroupBy('CENTER')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'CENTER' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white'}`}>By Center</button>\n" +
"                  </div>\n" +
"                )}\n" +
"              </div>";

content = replaceBlock(content, "{/* Dashboard Toggle */}", "{/* Content Switcher */}", newToggle + "\n\n              {/* Content Switcher */}");

content = content.replace(/Top \{\(appMode === 'PQA_MX' \|\| appMode === 'PQA_CE'\) \? '20' : '10'\} \{appMode\?\.startsWith\('PQA'\) \? 'Service Centers' : 'Engineers'\}/g, 
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'}");

const quarterlyLabel = "Top {(appMode === 'PQA_MX' || appMode === 'PQA_CE') ? '20' : '10'} {appMode?.startsWith('PQA') ? 'Centers' : 'Engineers'} (Quarterly Avg)";
content = content.replace(quarterlyLabel, 
  "Top {(appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') ? '7' : (appMode === 'PQA_CE' ? '31' : (appMode === 'PQA_MX' ? '20' : '10'))} {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER' ? 'Partners' : appMode?.startsWith('PQA') ? 'Service Centers' : 'Engineers'} (Accumulated / Quarterly)");

content = content.replace(/quarterlyRanking\.slice\(0, \(appMode\?\.startsWith\('PQA\'\) \? 20 : 10\)\)/g, "(appMode?.startsWith('PQA') ? pqaAccumulatedRanking : quarterlyRanking.slice(0, 10))");

content = content.replace("{eng.tcsScore}", "{eng.ytdScore || eng.tcsScore}");
content = content.replace("Avg Score ({eng.monthCount} mo)", "{appMode?.startsWith('PQA') ? 'Accumulated Score' : `Avg Score (${eng.monthCount} mo)`}");

fs.writeFileSync(file, content);
console.log('Patch step 4 complete');
