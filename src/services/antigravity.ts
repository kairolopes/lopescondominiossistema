import axios from 'axios';
import { config } from '../config/env';
import { databaseService } from './database';

// Service to handle interactions with Google Antigravity (WhatsApp MCP)
export const antigravityService = {
    /**
     * Sends a text message via Antigravity API
     * @param phone Destination phone number (e.g., '5511999999999')
     * @param message Text content
     * @param role 'assistant' (bot) or 'agent' (human)
     * @param senderName Name of the human agent (if role is agent)
     */
    sendText: async (phone: string, message: string, role: 'assistant' | 'agent' = 'assistant', senderName?: string) => {
        try {
            // TODO: Replace with actual Antigravity API Endpoint
            // Usually: POST https://antigravity-gateway.google.com/v1/projects/{id}/messages
            const url = config.antigravity?.apiUrl || 'https://mock-antigravity-api.com/send'; 
            
            console.log(`[Antigravity] Sending to ${phone} via Google Infrastructure...`);

            // Example payload for an Agentic Gateway
            // await axios.post(url, {
            //    recipient: { type: 'whatsapp', id: phone },
            //    content: { text: message },
            //    metadata: { sender_id: senderName }
            // }, {
            //    headers: { 'Authorization': `Bearer ${config.antigravity?.apiKey}` }
            // });

            // For now, we simulate success to keep the flow working until credentials are added
            console.log(`[Antigravity] Mock Send Success: "${message}" by ${senderName || 'Bot'}`);

            // SAVE MESSAGE TO FIREBASE (Crucial for CRM History)
            await databaseService.saveMessage({
                phone,
                content: message,
                role: role, 
                timestamp: new Date(),
                senderName: senderName
            });

        } catch (error) {
            console.error('[Antigravity] Send Error:', error);
            // Fallback logic could go here
        }
    }
};
