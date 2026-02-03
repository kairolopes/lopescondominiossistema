
import { db } from '../src/config/firebase';

async function checkSessionData() {
    const phone = '556285635204';
    console.log(`Checking Firestore Session for ${phone}...`);

    try {
        if (!db) {
            console.error('Firebase DB not initialized!');
            return;
        }

        const sessionRef = db.collection('sessions').doc(phone);
        const doc = await sessionRef.get();

        if (doc.exists) {
            console.log('Session Found!');
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        } else {
            console.log('Session NOT found in Firestore.');
        }
    } catch (error) {
        console.error('Error reading Firestore:', error);
    }
}

checkSessionData();
