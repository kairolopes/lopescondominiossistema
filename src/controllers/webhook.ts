import { Router, Request, Response } from 'express';
import { botFlow } from '../bot/flow';
import { config } from '../config/env';

const router = Router();

// Webhook for Z-API
router.post('/webhook/zapi', async (req: Request, res: Response) => {
  try {
    console.log('📥 Webhook received:', JSON.stringify(req.body, null, 2));

    // Z-API payload parsing (supports multiple formats)
    const phone = req.body.phone || req.body.sender?.phone || req.body.chatId?.replace('@c.us', '');
    const textMessage = req.body.text?.message || req.body.message || req.body.content;
    const senderName = req.body.senderName || req.body.sender?.name || 'Cliente';
    const securityToken = req.body.securityToken || req.body.token;

    // Security check
    if (config.zapi.securityToken && securityToken !== config.zapi.securityToken) {
       res.status(403).send('Unauthorized');
       return;
    }

    if (phone && textMessage) {
        // Process message asynchronously
        botFlow.handleMessage(phone, textMessage, senderName);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;
