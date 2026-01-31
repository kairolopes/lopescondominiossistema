import express, { Request, Response } from 'express';
import { campaignService } from '../services/campaign';
import { db } from '../config/firebase';
import { zapiService } from '../services/zapi';
import { sessionManager } from '../services/sessionManager';

export const adminController = {
    async sendMessage(req: Request, res: Response) {
        try {
            const { phone, message } = req.body;
            if (!phone || !message) return res.status(400).json({ error: 'Missing phone or message' });

            // Send via Z-API
            await zapiService.sendText(phone, message);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async updateSessionStatus(req: Request, res: Response) {
        try {
            const { phone } = req.params;
            const { status } = req.body; // 'active' | 'paused'
            
            if (!db) return res.status(503).json({ error: 'Database not initialized' });

            // Update Firestore
            await db.collection('conversations').doc(phone).set({ 
                status: status,
                lastActivity: new Date()
            }, { merge: true });

            // Update In-Memory Session Manager
            if (status === 'paused') {
                sessionManager.updateState(phone, 'PAUSED');
            } else {
                sessionManager.updateState(phone, 'IDLE');
            }

            res.json({ success: true, status });
        } catch (error) {
            console.error('Error updating session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getConversations(req: Request, res: Response) {
        try {
            if (!db) return res.status(503).json({ error: 'Database not initialized' });
            
            const snapshot = await db.collection('conversations').orderBy('lastActivity', 'desc').get();
            const conversations = snapshot.docs.map(doc => doc.data());
            res.json(conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getSessions(req: Request, res: Response) {
        try {
            if (!db) return res.status(503).json({ error: 'Database not initialized' });

            const snapshot = await db.collection('conversations').orderBy('lastActivity', 'desc').limit(20).get();
            
            const sessions = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const phone = data.phone;

                // Fetch recent messages for history
                const messagesSnapshot = await db!.collection('conversations')
                    .doc(phone)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(10)
                    .get();

                const history = messagesSnapshot.docs.map(msgDoc => {
                    const msgData = msgDoc.data();
                    return {
                        role: msgData.role === 'assistant' ? 'bot' : 'user',
                        content: msgData.content,
                        timestamp: msgData.timestamp && msgData.timestamp.toDate ? msgData.timestamp.toDate().toISOString() : new Date().toISOString()
                    };
                }); 
                
                return {
                    phone: data.phone,
                    step: 'active', // Default or fetch from session
                    tags: ['whatsapp'], // Default
                    status: data.status || 'active',
                    history: history // ordered desc
                };
            }));

            res.json(sessions);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getMessages(req: Request, res: Response) {
        try {
            if (!db) return res.status(503).json({ error: 'Database not initialized' });
            
            const { phone } = req.params;
            const snapshot = await db.collection('conversations')
                .doc(phone)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .get();
                
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    // Convert Firestore Timestamp to Date string if needed
                    timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp
                };
            });
            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getCampaigns(req: Request, res: Response) {
        try {
            const campaigns = await campaignService.getAll();
            res.json(campaigns);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async createCampaign(req: Request, res: Response) {
        try {
            const { name, message, targetGroup, scheduleTime } = req.body;
            const campaign = await campaignService.create({
                name,
                message,
                targetGroup,
                scheduleTime: new Date(scheduleTime),
                status: 'PENDING'
            });
            res.status(201).json(campaign);
        } catch (error) {
             res.status(500).json({ error: 'Error creating campaign' });
        }
    }
};

const router = express.Router();

// Chat endpoints
router.get('/conversations', adminController.getConversations);
router.get('/sessions', adminController.getSessions);
router.get('/conversations/:phone/messages', adminController.getMessages);
router.post('/messages/send', adminController.sendMessage);
router.post('/sessions/:phone/status', adminController.updateSessionStatus);

// Campaign endpoints
router.get('/campaigns', adminController.getCampaigns);
router.post('/campaigns', adminController.createCampaign);

export default router;
