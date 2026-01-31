import express, { Request, Response } from 'express';
import { botFlow } from '../bot/flow';

const router = express.Router();

router.post('/webhook/zapi', async (req: Request, res: Response) => {
    try {
        console.log('[Webhook] Received payload:', JSON.stringify(req.body, null, 2));
        const { phone, text, senderName } = req.body; // Adjust based on Z-API payload structure
        
        // Z-API usually sends: { phone: '55...', text: { message: '...' }, senderName: '...' }
        // Verify payload format in Z-API docs
        
        if (phone && text) {
             const messageContent = typeof text === 'object' ? text.message : text;
             const safeSenderName = senderName || 'Cliente WhatsApp';

             // Async processing to avoid timeout
             botFlow.handleMessage(phone, messageContent, safeSenderName).catch(console.error);
        } else {
             console.warn('[Webhook] Invalid payload: Missing phone or text');
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error');
    }
});

export default router;
