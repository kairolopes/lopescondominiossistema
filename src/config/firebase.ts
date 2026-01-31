import * as admin from 'firebase-admin';
import path from 'path';

// Check if running locally or in cloud
// For Render, we might use environment variables instead of file
// For local, we look for serviceAccountKey.json

let serviceAccount: any;

try {
    // Priority 1: Environment Variable (Base64 or JSON string) - Best for Render
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log('[FirebaseConfig] Successfully parsed FIREBASE_SERVICE_ACCOUNT from env.');
        } catch (parseError) {
            console.error('[FirebaseConfig] Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Is it a valid JSON string?', parseError);
        }
    } 
    // Priority 2: Local File
    else {
        serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
    }
} catch (error) {
    console.warn('Firebase Service Account not found. Firestore will not work until credentials are provided.');
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized successfully.');
}

export const db = serviceAccount ? admin.firestore() : null;
