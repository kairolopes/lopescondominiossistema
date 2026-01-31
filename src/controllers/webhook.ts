import express, { Request, Response } from 'express';
import { botFlow } from '../bot/flow';

const router = express.Router();

router.post('/webhook/zapi', async (req: Request, res: Response) => {
    try {
        const { phone, text, senderName } = req.body; // Adjust based on Z-API payload structure
        
        // Z-API usually sends: { phone: '55...', text: { message: '...' }, senderName: '...' }
        // Verify payload format in Z-API docs
        
        if (phone && text) {
             // Async processing to avoid timeout
             botFlow.handleMessage(phone, text.message || text, senderName).catch(console.error);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error');
    }
});

export default router;
