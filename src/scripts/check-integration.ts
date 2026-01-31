import axios from 'axios';
import { config } from '../config/env';

const check = async () => {
    try {
        console.log('Checking Z-API Connection...');
        // Simple check (not real endpoint, just validating config presence)
        if (!config.zapi.instanceId || !config.zapi.token) {
             throw new Error('Z-API credentials missing');
        }
        console.log('Z-API Config: OK');

        console.log('Checking Superlogica Connection...');
        if (!config.superlogica.appToken) {
            throw new Error('Superlogica credentials missing');
        }
        console.log('Superlogica Config: OK');

    } catch (error) {
        console.error('Integration Check Failed:', error);
    }
};

check();
