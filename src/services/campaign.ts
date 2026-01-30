
import { zapiService } from './zapi';
import { sessionManager } from './sessionManager';

interface Campaign {
    id: string;
    name: string;
    message: string;
    scheduledAt: Date;
    targetTag: string; // e.g., 'inadimplente', 'todos'
    status: 'pending' | 'completed' | 'failed';
}

const campaigns: Campaign[] = [];

export const campaignService = {
    // Criar nova campanha agendada
    create: (name: string, message: string, scheduledAt: Date, targetTag: string) => {
        const campaign: Campaign = {
            id: Date.now().toString(),
            name,
            message,
            scheduledAt,
            targetTag,
            status: 'pending'
        };
        campaigns.push(campaign);
        return campaign;
    },

    list: () => campaigns,

    // Processador de campanhas (deve ser chamado periodicamente)
    process: async () => {
        const now = new Date();
        const pending = campaigns.filter(c => c.status === 'pending' && c.scheduledAt <= now);

        if (pending.length > 0) {
            console.log(`[CampaignEngine] Processando ${pending.length} campanhas pendentes...`);
        }

        for (const campaign of pending) {
            console.log(`[CampaignEngine] Executando campanha: ${campaign.name}`);
            
            // Buscar alvos baseados na tag
            const targets = sessionManager.getAllSessions().filter(s =>
                campaign.targetTag === 'todos' || s.tags.includes(campaign.targetTag)
            );

            console.log(`[CampaignEngine] Encontrados ${targets.length} alvos para tag '${campaign.targetTag}'`);

            for (const session of targets) {
                try {
                    // Simula um delay pequeno para não bloquear
                    await new Promise(r => setTimeout(r, 100));
                    await zapiService.sendText(session.phone, `🔔 [Comunicado Lopes] ${campaign.message}`);
                    console.log(`[CampaignEngine] Enviado para ${session.phone}`);
                } catch (err) {
                    console.error(`[CampaignEngine] Falha ao enviar para ${session.phone}`, err);
                }
            }
            campaign.status = 'completed';
        }
    }
};
