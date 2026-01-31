import axios from 'axios';
import { config } from '../config/env';
import { databaseService } from './database';
import { zapiService } from './zapi';

export const whatsappService = {
    sendText: async (phone: string, message: string, role: 'assistant' | 'agent' = 'assistant', senderName?: string) => {
        try {
            // HYBRID MODE: Check if Official API (Antigravity) is configured
            const isOfficialApiConfigured = config.whatsapp.accessToken && config.whatsapp.phoneNumberId;

            if (!isOfficialApiConfigured) {
                console.log('[WhatsApp Service] Official API credentials missing. Falling back to Z-API.');
                // Fallback to Z-API (Legacy)
                // zapiService already handles DB saving, so we just return the result
                return await zapiService.sendText(phone, message, role, senderName);
            }

            // --- Official WhatsApp Business API (Antigravity/Meta) ---
            const url = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;
            
            await axios.post(url, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'text',
                text: { body: message }
            }, {
                headers: {
                    'Authorization': `Bearer ${config.whatsapp.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`[WhatsApp Service] Message sent via Official API to ${phone}`);

            // SAVE MESSAGE TO FIREBASE (Only if sent via Official API, as Z-API service handles its own saving)
            await databaseService.saveMessage({
                phone,
                content: message,
                role: role, 
                timestamp: new Date(),
                senderName: senderName
            });

        } catch (error: any) {
            console.error('[WhatsApp Service] Error sending message:', error.response?.data || error.message);
        }
    }
};
