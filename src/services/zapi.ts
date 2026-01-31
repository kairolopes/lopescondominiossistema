import axios from 'axios';
import { config } from '../config/env';
import { databaseService } from './database';

export const zapiService = {
    sendText: async (phone: string, message: string) => {
        try {
            const url = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}/send-text`;
            await axios.post(url, {
                phone,
                message
            }, {
                headers: {
                    'Client-Token': config.zapi.securityToken
                }
            });
            console.log(`Message sent to ${phone}`);

            // SAVE MESSAGE TO FIREBASE (ASSISTANT)
            await databaseService.saveMessage({
                phone,
                content: message,
                role: 'assistant',
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Z-API Error:', error);
        }
    }
};
