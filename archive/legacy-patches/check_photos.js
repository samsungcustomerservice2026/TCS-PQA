import { db } from './src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkData() {
    const cols = ['engineers', 'pqa_mx_centers', 'pqa_ce_centers'];
    for (const colName of cols) {
        console.log(`--- ${colName} ---`);
        const snapshot = await getDocs(collection(db, colName));
        snapshot.docs.slice(0, 5).forEach(doc => {
            const data = doc.data();
            console.log(`Name: ${data.name}, Partner: ${data.partnerName}, Photo: ${data.photoUrl}`);
        });
    }
}

checkData();
