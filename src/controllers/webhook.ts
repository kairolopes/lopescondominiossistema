import express, { Request, Response } from 'express';
import { botFlow } from '../bot/flow';
import { zapiService } from '../services/zapi';

const router = express.Router();

// --- Z-API Webhook (Legacy/Current) ---
router.post('/webhook/zapi', async (req: Request, res: Response) => {
    try {
        console.log('[Webhook Z-API] Received payload:', JSON.stringify(req.body, null, 2));
        const { phone, text, senderName, senderPhoto, photo, photoUrl } = req.body; 
        
        if (phone && text) {
             const messageContent = typeof text === 'object' ? text.message : text;
             const safeSenderName = senderName || 'Cliente WhatsApp';
             let safeProfilePicUrl = senderPhoto || photo || photoUrl || undefined;

             // Attempt to fetch profile picture if missing (proactive fix)
             if (!safeProfilePicUrl) {
                 try {
                     console.log(`[Webhook Z-API] Fetching profile picture for ${phone}...`);
                     safeProfilePicUrl = await zapiService.getProfilePicture(phone);
                 } catch (err) {
                     console.warn('[Webhook Z-API] Failed to fetch profile pic:', err);
                 }
             }

             // Async processing
             botFlow.handleMessage(phone, messageContent, safeSenderName, safeProfilePicUrl).catch(console.error);
        } else {
             console.warn('[Webhook Z-API] Invalid payload');
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Z-API Error:', error);
        res.status(500).send('Error');
    }
});

// --- Official WhatsApp Business API (Antigravity/Meta) ---

// 1. Verification Endpoint (Required by Meta)
router.get('/webhook/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify Token should be an env variable
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'lopes_secret_token';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Webhook Meta] Webhook verified!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
});

// 2. Message Reception Endpoint
router.post('/webhook/whatsapp', async (req: Request, res: Response) => {
    try {
        console.log('[Webhook Meta] Received payload');
        const body = req.body;

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; // Phone number
                const msg_body = body.entry[0].changes[0].value.messages[0].text.body; // Message text
                const name = body.entry[0].changes[0].value.contacts[0].profile.name; // User name

                console.log(`[Webhook Meta] Msg from ${from}: ${msg_body}`);

                // Process via existing Bot Logic
                botFlow.handleMessage(from, msg_body, name, undefined).catch(console.error);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('[Webhook Meta] Error:', error);
        res.sendStatus(500);
    }
});

// New Endpoint for Google Antigravity / Meta Cloud API
router.post('/webhook/antigravity', async (req: Request, res: Response) => {
    try {
        console.log('[Antigravity Webhook] Payload:', JSON.stringify(req.body, null, 2));
        
        // Google Antigravity (wrapping Meta API) often uses 'messages' array
        // or a custom agent event format. 
        // We'll log it first to understand the structure during integration.
        
        // Placeholder logic assuming a standard structure (to be refined)
        const { conversationId, message, sender } = req.body;
        
        if (conversationId && message) {
            // Normalize phone number from conversationId (often 'whatsapp:+55...')
            const phone = conversationId.replace('whatsapp:', '').replace('+', '');
            const text = message.text || message;
            
            await botFlow.handleMessage(phone, text, sender || 'User');
        }

        res.status(200).json({ status: 'received' });
    } catch (error) {
        console.error('[Antigravity Webhook] Error:', error);
        res.status(500).json({ error: 'Internal Error' });
    }
});

// Verification for Meta/Antigravity Webhooks (GET)
router.get('/webhook/antigravity', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify token should be configured in env
    if (mode && token) {
        if (mode === 'subscribe' && token === (process.env.WEBHOOK_VERIFY_TOKEN || 'lopes_secret')) {
            console.log('[Antigravity Webhook] Verified!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
});

export default router;
