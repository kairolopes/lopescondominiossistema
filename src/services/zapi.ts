import axios from 'axios';
import { config } from '../config/env';
import { databaseService } from './database';

export const zapiService = {
    sendText: async (phone: string, message: string, role: 'assistant' | 'agent' = 'assistant', senderName?: string) => {
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

            // SAVE MESSAGE TO FIREBASE
            await databaseService.saveMessage({
                phone,
                content: message,
                role: role, 
                timestamp: new Date(),
                senderName: senderName
            });

        } catch (error) {
            console.error('Z-API Error:', error);
        }
    },

    getProfilePicture: async (phone: string): Promise<string | undefined> => {
        try {
            const url = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}/profile-picture`;
            const res = await axios.get(url, {
                params: { phone },
                headers: {
                    'Client-Token': config.zapi.securityToken
                }
            });
            // Z-API usually returns { link: "url" }
            return res.data?.link || res.data?.url || undefined;
        } catch (error) {
            console.error('[Z-API] Error fetching profile picture:', error);
            return undefined;
        }
    }
};
