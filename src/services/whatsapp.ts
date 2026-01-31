import axios from 'axios';
import { config } from '../config/env';
import { databaseService } from './database';

export const whatsappService = {
    sendText: async (phone: string, message: string, role: 'assistant' | 'agent' = 'assistant', senderName?: string) => {
        try {
            // Check if credentials are present, otherwise fallback or log warning
            if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
                console.warn('[WhatsApp Service] Missing credentials (ACCESS_TOKEN or PHONE_NUMBER_ID). Message not sent to WhatsApp API, but will be saved to DB.');
                // We still save to DB to maintain conversation flow in UI even if API is not configured
            } else {
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
                console.log(`[WhatsApp Service] Message sent to ${phone}`);
            }

            // SAVE MESSAGE TO FIREBASE
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
