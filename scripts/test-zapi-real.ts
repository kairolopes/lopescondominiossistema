
import dotenv from 'dotenv';
import axios from 'axios';
import { config } from '../src/config/env';
import { zapiService } from '../src/services/zapi';

dotenv.config();

async function testZapiProfile() {
    const phone = '556285635204';
    console.log(`Testing Z-API Profile Fetch for ${phone}...`);
    
    try {
        // 3. Test Phone-Exists Endpoint
                console.log('--- Testing /phone-exists Endpoint ---');
                const existsUrl = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}/phone-exists/${phone}`;
                try {
                    const existsRes = await axios.get(existsUrl, {
                        headers: { 'Client-Token': config.zapi.securityToken }
                    });
                    console.log('RAW Phone-Exists Response:', JSON.stringify(existsRes.data, null, 2));
                } catch (e: any) {
                    console.error('Phone-Exists Endpoint Error:', e.response?.data || e.message);
                }

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
                    
                    // 1. Test Contacts Endpoint RAW
                    console.log('--- Testing /contacts/{phone} Endpoint ---');
                    const contactUrl = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}/contacts/${phone}`;
                    try {
                        const contactRes = await axios.get(contactUrl, {
                            headers: { 'Client-Token': config.zapi.securityToken }
                        });
                        console.log('RAW Contacts Response:', JSON.stringify(contactRes.data, null, 2));
                    } catch (e: any) {
                        console.error('Contacts Endpoint Error:', e.response?.data || e.message);
                    }

                    // 2. Test Chats Endpoint
                    console.log('--- Testing /chats Endpoint ---');
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
