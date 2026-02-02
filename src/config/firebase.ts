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
        // Attempt to require from multiple locations
        try {
            serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
        } catch (e) {
            try {
                 serviceAccount = require(path.join(__dirname, '../../../serviceAccountKey.json'));
            } catch (e2) {
                // Ignore
            }
        }
    }
} catch (error) {
    console.warn('Firebase Service Account not found. Firestore will not work until credentials are provided.');
}

// MOCK FIREBASE FOR RENDER IF MISSING (To prevent crashes, but data won't persist)
// If the user hasn't provided credentials yet, we mock it so the app doesn't crash on boot.
if (!serviceAccount && process.env.RENDER) {
    console.warn('[FirebaseConfig] RUNNING IN MOCK MODE. Data will NOT be saved.');
    // We don't initialize admin, so db will be null.
    // The services check "if (db)" so they should handle null safely.
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase initialized successfully.');
    } catch (e) {
        console.error('Firebase Initialization Error:', e);
    }
}

export const db = serviceAccount && admin.apps.length > 0 ? admin.firestore() : null;
