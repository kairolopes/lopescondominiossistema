
import dotenv from 'dotenv';
import axios from 'axios';
import { config } from '../src/config/env';
import { zapiService } from '../src/services/zapi';

dotenv.config();

async function testZapiProfile() {
    const phone = '556285635204';
    console.log(`Testing Z-API Profile Fetch for ${phone}...`);
    
    try {
        const photoUrl = await zapiService.getProfilePicture(phone);
        if (photoUrl) {
            console.log('SUCCESS! Found photo URL:', photoUrl);
        } else {
            console.log('FAILED: No photo URL returned (undefined).');
        }

        const name = await zapiService.getContactName(phone);
                if (name) {
                    console.log('SUCCESS! Found name:', name);
                } else {
                    console.log('FAILED: No name returned (undefined).');
                    
                    // Try alternative: Fetch Chats
                    console.log('Attempting to find name in active chats...');
                    try {
                        const chatsUrl = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}/chats`;
                        const chatsRes = await axios.get(chatsUrl, {
                            headers: { 'Client-Token': config.zapi.securityToken }
                        });
                        
                        const chat = chatsRes.data.find((c: any) => c.phone === phone || c.id === phone + '@c.us');
                        if (chat) {
                             console.log('Found chat object:', JSON.stringify(chat, null, 2));
                             console.log('Name from chat:', chat.name || chat.pushName || 'Still undefined');
                        } else {
                            console.log('Chat not found in recent list.');
                        }
                    } catch (chatErr) {
                        console.error('Error fetching chats:', chatErr);
                    }
                }

    } catch (error) {
        console.error('ERROR during fetch:', error);
    }
}

testZapiProfile();
