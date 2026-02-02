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
            console.warn('[Database] Database not initialized. Message NOT saved to persistence layer, but flow will continue.');
            return; // Return gracefully so the bot can still reply
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
            // Return null silently for local mode fallback
            return null;
        }
        const doc = await db.collection('sessions').doc(phone).get();
        return doc.exists ? doc.data() : null;
    },

    saveSession: async (phone: string, data: any) => {
        if (!db) {
             // Silently ignore for local mode
            return;
        }
        await db.collection('sessions').doc(phone).set(data, { merge: true });
    }
};
