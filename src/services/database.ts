import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface Message {
    id?: string;
    phone: string;
    content: string;
    role: 'user' | 'assistant' | 'agent';
    timestamp: Date;
    senderName?: string;
}

export const databaseService = {
    saveMessage: async (message: Message) => {
        if (!db) {
            console.error('[Database] Failed to save message: Database not initialized (Missing credentials?)');
            return;
        }

        try {
            // Determine a safe sender name
            const safeSenderName = message.senderName || (message.role === 'assistant' ? 'Bot Lopes' : 'Cliente');

            // Explicitly construct the object to ensure no undefined values are passed
            const msgData = {
                phone: message.phone,
                content: message.content,
                role: message.role,
                timestamp: admin.firestore.Timestamp.fromDate(message.timestamp),
                senderName: safeSenderName
            };

            console.log('[Database] Saving message to Firestore:', JSON.stringify(msgData));

            // Save to 'conversations/{phone}/messages'
            await db.collection('conversations')
                .doc(message.phone)
                .collection('messages')
                .add(msgData);

            // Update last message in conversation doc
            const conversationUpdate = {
                lastMessage: message.content,
                lastActivity: admin.firestore.Timestamp.fromDate(message.timestamp),
                phone: message.phone,
                senderName: safeSenderName
            };

            await db.collection('conversations').doc(message.phone).set(conversationUpdate, { merge: true });

        } catch (error) {
            console.error('Error saving message to Firebase:', error);
        }
    },

    getSession: async (phone: string) => {
        if (!db) {
            console.error('[Database] Failed to get session: Database not initialized');
            return null;
        }
        const doc = await db.collection('sessions').doc(phone).get();
        return doc.exists ? doc.data() : null;
    },

    saveSession: async (phone: string, data: any) => {
        if (!db) {
            console.error('[Database] Failed to save session: Database not initialized');
            return;
        }
        await db.collection('sessions').doc(phone).set(data, { merge: true });
    }
};
