const fs = require('fs');
const path = require('path');

const srcDir = 'f:/Samsung Tools/TCS/TCS full project/fawzy-project/src';
const appDir = path.join(srcDir, 'app');
const tcsDir = path.join(appDir, 'tcs');
const pqaDir = path.join(appDir, 'pqa');
const apiDir = path.join(appDir, 'api');
const serviceCentersApiDir = path.join(apiDir, 'serviceCenters', '[id]');

if (!fs.existsSync(tcsDir)) fs.mkdirSync(tcsDir, { recursive: true });
if (!fs.existsSync(pqaDir)) fs.mkdirSync(pqaDir, { recursive: true });
if (!fs.existsSync(serviceCentersApiDir)) fs.mkdirSync(serviceCentersApiDir, { recursive: true });

let originalPage = fs.readFileSync(path.join(appDir, 'page.js'), 'utf8');

// Replace relative imports ../ with ../../
let newPageContent = originalPage.replace(/'\.\.\//g, "'../../");
newPageContent = newPageContent.replace(/\"\.\.\//g, "\"../../");

// Fix image roots
newPageContent = newPageContent.replace(/'\.\/sam_logo\.png'/g, "'/sam_logo.png'");
newPageContent = newPageContent.replace(/\"\.\/sam_logo\.png\"/g, "\"/sam_logo.png\"");
newPageContent = newPageContent.replace(/'\.\/fawzy-logo\.png'/g, "'/fawzy-logo.png'");
newPageContent = newPageContent.replace(/\"\.\/fawzy-logo\.png\"/g, "\"/fawzy-logo.png\"");

// Write TCS version
fs.writeFileSync(path.join(tcsDir, 'page.js'), newPageContent);

// PQA version text replacement
let pqaPageContent = newPageContent;
pqaPageContent = pqaPageContent.replace(/TCS Score/g, 'PQA Score');
pqaPageContent = pqaPageContent.replace(/TCS Hub Control/g, 'PQA Hub Control');
pqaPageContent = pqaPageContent.replace(/TCS Score_Template/g, 'PQA Score_Template');
pqaPageContent = pqaPageContent.replace(/TCS-V7\.2/g, 'PQA-V7.2');
pqaPageContent = pqaPageContent.replace(/TCS Guide/g, 'PQA Guide');
pqaPageContent = pqaPageContent.replace(/Next-Gen TCS/g, 'Next-Gen PQA');
pqaPageContent = pqaPageContent.replace(/calculateTCS/g, 'calculatePQA');
pqaPageContent = pqaPageContent.replace(/\.tcsScore/g, '.pqaScore');

// "Engineer" / "engineer" mapped to "Service Center" / "serviceCenter"
pqaPageContent = pqaPageContent.replace(/Engineer Code/gi, 'Service Center Code');
pqaPageContent = pqaPageContent.replace(/Engineer record/gi, 'Service Center record');
pqaPageContent = pqaPageContent.replace(/Add Engineer/gi, 'Add Service Center');
pqaPageContent = pqaPageContent.replace(/engineer History/gi, 'Service Center History');
pqaPageContent = pqaPageContent.replace(/Engineer History/gi, 'Service Center History');
pqaPageContent = pqaPageContent.replace(/Engineer profile/gi, 'Service Center profile');
pqaPageContent = pqaPageContent.replace(/Engineer Code not found/g, 'Service Center Code not found');

// Some code variable renames to make it match firestoreService changes
pqaPageContent = pqaPageContent.replace(/getEngineers/g, 'getServiceCenters');
pqaPageContent = pqaPageContent.replace(/getHiddenEngineers/g, 'getHiddenServiceCenters');
pqaPageContent = pqaPageContent.replace(/saveEngineer as saveEngineerToDb/g, 'saveServiceCenter as saveServiceCenterToDb');
pqaPageContent = pqaPageContent.replace(/archiveEngineer/g, 'archiveServiceCenter');
pqaPageContent = pqaPageContent.replace(/deleteEngineer/gi, 'deleteServiceCenter');
pqaPageContent = pqaPageContent.replace(/restoreEngineer/gi, 'restoreServiceCenter');
pqaPageContent = pqaPageContent.replace(/editingEng/g, 'editingCenter');
pqaPageContent = pqaPageContent.replace(/setEditingEng/g, 'setEditingCenter');
pqaPageContent = pqaPageContent.replace(/engineers/g, 'serviceCenters');
pqaPageContent = pqaPageContent.replace(/setEngineers/g, 'setServiceCenters');
pqaPageContent = pqaPageContent.replace(/INITIAL_ENGINEERS/g, 'INITIAL_SERVICE_CENTERS');
pqaPageContent = pqaPageContent.replace(/selectedEngineer/g, 'selectedCenter');
pqaPageContent = pqaPageContent.replace(/setSelectedEngineer/g, 'setSelectedCenter');

pqaPageContent = pqaPageContent.replace(/ENGINEER_PROFILE/g, 'CENTER_PROFILE');
pqaPageContent = pqaPageContent.replace(/ENGINEER_LOOKUP/g, 'CENTER_LOOKUP');
pqaPageContent = pqaPageContent.replace(/ENGINEER_HISTORY/g, 'CENTER_HISTORY');

fs.writeFileSync(path.join(pqaDir, 'page.js'), pqaPageContent);

// Create Service Centers API route
const apiSource = fs.readFileSync(path.join(apiDir, 'engineers', '[id]', 'route.js'), 'utf8');
let newApiSource = apiSource.replace(/engineer/g, 'serviceCenter').replace(/Engineer/g, 'Service Center');
// the doc(db, 'engineers', id) will become doc(db, 'serviceCenters', id) by the replace above
fs.writeFileSync(path.join(serviceCentersApiDir, 'route.js'), newApiSource);

console.log('Migration complete');
