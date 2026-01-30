import { Router, Request, Response } from 'express';
import { zapiService } from '../services/zapi';
import { superlogicaService } from '../services/superlogica';
import { campaignService } from '../services/campaign';

import { sessionManager } from '../services/sessionManager';

const router = Router();

// --- SESSIONS (CRM) ---
router.get('/sessions', (req: Request, res: Response) => {
    const sessions = sessionManager.getAllSessions();
    res.json(sessions);
});

// Endpoint to send broadcast message to a list of phones (or all units)
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { message, phones } = req.body;

    if (!message || !phones || !Array.isArray(phones)) {
        res.status(400).send('Invalid request. Provide "message" and "phones" array.');
        return;
    }

    // In a real scenario, we might fetch phones from Superlogica if "all" is specified
    // const allUnits = await superlogicaService.getAllUnits();
    // const targetPhones = allUnits.map(u => u.phone);

    for (const phone of phones) {
        await zapiService.sendText(phone, `[Comunicado Lopes Condomínios]\n\n${message}`);
    }

    res.status(200).send({ success: true, count: phones.length });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).send('Error sending broadcast');
  }
});

// --- CAMPAIGNS ---

// Create Campaign
router.post('/campaigns', (req: Request, res: Response) => {
    try {
        const { name, message, scheduledAt, targetTag } = req.body;
        
        if (!name || !message || !scheduledAt || !targetTag) {
            res.status(400).send('Missing required fields: name, message, scheduledAt, targetTag');
            return;
        }

        const date = new Date(scheduledAt);
        if (isNaN(date.getTime())) {
            res.status(400).send('Invalid date format.');
            return;
        }

        const campaign = campaignService.create(name, message, date, targetTag);
        res.status(201).json(campaign);
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// List Campaigns
router.get('/campaigns', (req: Request, res: Response) => {
    const list = campaignService.list();
    res.json(list);
});

export default router;
