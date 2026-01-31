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
            // Sanitize message object to remove undefined values
            const msgData = JSON.parse(JSON.stringify({
                ...message,
                timestamp: message.timestamp // Preserve date object for now
            }));

            // Save to 'conversations/{phone}/messages'
            await db.collection('conversations')
                .doc(message.phone)
                .collection('messages')
                .add({
                    ...msgData,
                    timestamp: admin.firestore.Timestamp.fromDate(message.timestamp)
                });

            // Update last message in conversation doc
            const conversationUpdate: any = {
                lastMessage: message.content,
                lastActivity: admin.firestore.Timestamp.fromDate(message.timestamp),
                phone: message.phone
            };
            
            // Only update senderName if it's provided (don't overwrite with Unknown if we already have it)
            if (message.senderName) {
                conversationUpdate.senderName = message.senderName;
            } else {
                // If it's a new conversation, we need a name. 
                // We use set with merge, so we can check if it exists? No, set merges.
                // We'll set it to Unknown only if we don't have it, but we can't condition on existence easily in one op.
                // But typically user messages come first and have a name.
            }

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
