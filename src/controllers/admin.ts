import express, { Request, Response } from 'express';
import { campaignService } from '../services/campaign';
import { db } from '../config/firebase';
import { whatsappService } from '../services/whatsapp';
import { sessionManager } from '../services/sessionManager';

export const adminController = {
    async sendMessage(req: Request, res: Response) {
        try {
            const { phone, message, senderName } = req.body;
            if (!phone || !message) return res.status(400).json({ error: 'Missing phone or message' });

            // 0. Check for Super Admin / Reset Command from Agent
            if (message.trim().toLowerCase() === '#bot' || message.trim().toLowerCase() === '#reset') {
                console.log(`[Admin] Agent forced session reset for ${phone}`);
                sessionManager.updateState(phone, 'IDLE');
                // Sync with DB
                if (db) {
                     await db.collection('conversations').doc(phone).set({ 
                        status: 'active',
                        pausedAt: null
                    }, { merge: true });
                }
                // Send confirmation to agent (optional, or just send the text to user so they know bot is back)
                // We still send the text "#bot" to the user as confirmation, or we could suppress it.
                // Usually better to send it so the user sees something happened, or send a specific "Bot reativado" message.
                // For now, let's send the text as requested, but maybe append a system note? 
                // No, just send what the agent typed, but perform the logic.
            }

            // Send via WhatsApp (Official API/Antigravity)
            await whatsappService.sendText(phone, message, 'agent', senderName);
            
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
                lastActivity: new Date(),
                pausedAt: status === 'paused' ? new Date() : null
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

    async assignSession(req: Request, res: Response) {
        try {
            const { phone } = req.params;
            const { assigneeId } = req.body;
            
            if (!db) return res.status(503).json({ error: 'Database not initialized' });

            await db.collection('conversations').doc(phone).set({ 
                assigneeId: assigneeId
            }, { merge: true });

            res.json({ success: true, assigneeId });
        } catch (error) {
            console.error('Error assigning session:', error);
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
            const firestore = db;

            const snapshot = await firestore.collection('conversations').orderBy('lastActivity', 'desc').limit(20).get();
            
            const sessions = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const phone = doc.id; // Use doc.id as the most reliable phone source

                // Fetch recent messages for history
                const messagesSnapshot = await firestore.collection('conversations')
                    .doc(phone)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(20) // Increased limit for better context
                    .get();

                const history = messagesSnapshot.docs.map(msgDoc => {
                    const msgData = msgDoc.data();
                    let role = 'user';
                    if (msgData.role === 'assistant') role = 'bot';
                    else if (msgData.role === 'agent') role = 'agent';
                    
                    return {
                        role: role,
                        content: msgData.content,
                        timestamp: msgData.timestamp && msgData.timestamp.toDate ? msgData.timestamp.toDate().toISOString() : new Date().toISOString(),
                        senderName: msgData.senderName
                    };
                }).reverse(); // Frontend expects chronological order usually, but let's check. 
                // Actually App.tsx just renders them. If we want chat style (oldest top), we should reverse if fetched desc.
                
                return {
                    phone: phone,
                    step: 'active', 
                    tags: ['whatsapp'], 
                    status: data.status || 'active',
                    assigneeId: data.assigneeId || null,
                    history: history // ordered asc (oldest first) after reverse
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
router.post('/sessions/:phone/assign', adminController.assignSession);

// Campaign endpoints
router.get('/campaigns', adminController.getCampaigns);
router.post('/campaigns', adminController.createCampaign);

export default router;
