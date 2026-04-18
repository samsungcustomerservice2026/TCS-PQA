const fs = require('fs');
const file = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

// The corrupted block has multiple copies of similar patterns
// I will target the specific sequence of corrupted lines
const corruptedStart = '</div>\n            </div>\n                  <div className="w-24 h-24';
const corruptedEnd = '                  </div>\n                </button>\n              </div>\n            </div>\n          )}';

const startIdx = content.indexOf(corruptedStart);
if (startIdx !== -1) {
    const endIdx = content.indexOf(corruptedEnd, startIdx);
    if (endIdx !== -1) {
        const toRemove = content.substring(startIdx + 7, endIdx + corruptedEnd.length - 1); // Keep the closing )} logic
        content = content.substring(0, startIdx + 20) + '          )}\n\n          ' + content.substring(endIdx + corruptedEnd.length);
    }
}

// Actually, let's just use a more direct replacement of the exact junk
const junk = '                  <div className="w-24 h-24 rounded-[2rem] bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]">\n' +
'                    <Building2 className="w-10 h-10 text-yellow-400" />\n' +
'                  </div>\n' +
'                  <div className="text-center space-y-2 relative z-10">\n' +
'                    <h3 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">PQA Portal</h3>\n' +
'                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">( Service Center )</p>\n' +
'                  </div>\n' +
'                </button>\n' +
'              </div>\n' +
'            </div>\n' +
'          )}';

content = content.replace(junk, '');

fs.writeFileSync(file, content);
console.log('Cleanup complete');
