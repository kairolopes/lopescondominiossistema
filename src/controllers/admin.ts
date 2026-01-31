import { Request, Response } from 'express';
import { campaignService } from '../services/campaign';
import { db } from '../config/firebase';

export const adminController = {
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

export default (router: any) => {
    const express = require('express');
    const r = express.Router();
    
    // Chat endpoints
    r.get('/conversations', adminController.getConversations);
    r.get('/conversations/:phone/messages', adminController.getMessages);
    
    // Campaign endpoints
    r.get('/campaigns', adminController.getCampaigns);
    r.post('/campaigns', adminController.createCampaign);
    return r;
};
