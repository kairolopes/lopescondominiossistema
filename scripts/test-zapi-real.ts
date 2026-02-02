
import dotenv from 'dotenv';
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
        }

    } catch (error) {
        console.error('ERROR during fetch:', error);
    }
}

testZapiProfile();
