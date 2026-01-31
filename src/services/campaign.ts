import { zapiService } from './zapi';

interface Campaign {
    id: string;
    name: string;
    message: string;
    targetGroup: string[]; // List of phones
    scheduleTime: Date;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

const campaigns: Campaign[] = []; // In-memory DB for prototype

export const campaignService = {
    create: async (data: Omit<Campaign, 'id'>) => {
        const id = Date.now().toString();
        const campaign = { ...data, id };
        campaigns.push(campaign);
        return campaign;
    },

    getAll: async () => {
        return campaigns;
    },

    process: async () => {
        const now = new Date();
        const pending = campaigns.filter(c => c.status === 'PENDING' && c.scheduleTime <= now);

        for (const camp of pending) {
            console.log(`Processing campaign ${camp.id}`);
            for (const phone of camp.targetGroup) {
                await zapiService.sendText(phone, camp.message);
            }
            camp.status = 'COMPLETED';
        }
    }
};
