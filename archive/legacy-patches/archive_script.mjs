import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCeD7Xrt6kwPWVgjNIrpwy0jnI8yQso1iM",
    authDomain: "tcs-for-engineers.firebaseapp.com",
    projectId: "tcs-for-engineers",
    storageBucket: "tcs-for-engineers.firebasestorage.app",
    messagingSenderId: "283193216884",
    appId: "1:283193216884:web:75df672769338634722621"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const collections = ['engineers', 'pqa_mx_centers', 'pqa_ce_centers'];
  const monthsToArchive = ['Jan', 'Feb', 'January', 'February'];
  let count = 0;

  for (const colName of collections) {
    console.log(`Checking ${colName}...`);
    const colRef = collection(db, colName);
    const q1 = query(colRef, where("hidden", "==", false));
    const snapshot = await getDocs(q1);
    
    // Fallback if missing "hidden" completely
    const allSnapshot = await getDocs(colRef);
    const docsToProcess = snapshot.empty ? allSnapshot.docs : snapshot.docs;

    for (const d of docsToProcess) {
      const data = d.data();
      if (data.hidden) continue;
      
      const mon = String(data.month || '').trim();
      const yr = String(data.year || '').trim();
      
      if (monthsToArchive.some(m => mon.toLowerCase().startsWith(m.toLowerCase()))) {
        console.log(`Archiving ${data.name} for ${mon} ${yr} (ID: ${d.id})...`);
        await updateDoc(doc(db, colName, d.id), { hidden: true });
        count++;
        await delay(50);
      }
    }
  }
  
  console.log(`Finished archiving ${count} records!`);
  process.exit(0);
}

run().catch(console.error);
