import { db } from '../config/firebase';

export interface Message {
    id?: string;
    phone: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    senderName?: string;
}

export const databaseService = {
    saveMessage: async (message: Message) => {
        if (!db) return; // Fail silently or throw error depending on needs

        try {
            // Save to 'conversations/{phone}/messages'
            await db.collection('conversations')
                .doc(message.phone)
                .collection('messages')
                .add({
                    ...message,
                    timestamp: admin.firestore.Timestamp.fromDate(message.timestamp)
                });

            // Update last message in conversation doc
            await db.collection('conversations').doc(message.phone).set({
                lastMessage: message.content,
                lastActivity: admin.firestore.Timestamp.fromDate(message.timestamp),
                phone: message.phone,
                senderName: message.senderName || 'Unknown'
            }, { merge: true });

        } catch (error) {
            console.error('Error saving message to Firebase:', error);
        }
    },

    getSession: async (phone: string) => {
        if (!db) return null;
        const doc = await db.collection('sessions').doc(phone).get();
        return doc.exists ? doc.data() : null;
    },

    saveSession: async (phone: string, data: any) => {
        if (!db) return;
        await db.collection('sessions').doc(phone).set(data, { merge: true });
    }
};

// Helper for timestamp import if needed in other files
import * as admin from 'firebase-admin';
