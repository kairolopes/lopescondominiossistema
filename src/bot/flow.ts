import { whatsappService } from '../services/whatsapp';
import { superlogicaService } from '../services/superlogica';
import { aiService } from '../services/ai';
import { userService } from '../services/userService';
import { sessionManager } from '../services/sessionManager';
import { databaseService } from '../services/database';
import { zapiService } from '../services/zapi';

const AI_SIGNATURE = '*Penélope - Secretária Virtual*\n';
const AI_NAME = 'Penélope';

export const botFlow = {
  handleMessage: async (phone: string, message: string, senderName: string, profilePicUrl?: string) => {
    try {
      console.log(`[Flow] Processing message from ${phone}: ${message}`);
      
      // SAVE MESSAGE TO FIREBASE (USER)
      await databaseService.saveMessage({
          phone,
          content: message,
          role: 'user',
          timestamp: new Date(),
          senderName
      });

      // 0. Super Admin / Reset Command (Always allowed)
      const cleanMsg = message.trim().toLowerCase();

      if (cleanMsg === '#bot' || cleanMsg === '#reset') {
          console.log(`[Flow] Force resetting session for ${phone}`);
          sessionManager.updateState(phone, 'IDLE');
          // Sync with DB to ensure it persists
          await databaseService.saveSession(phone, { status: 'active' });
          await whatsappService.sendText(phone, `${AI_SIGNATURE}🤖 Bot reativado! Estou de volta.`, 'assistant', AI_NAME);
          return;
      }

      // Hidden Command: Force Sync Profile Pictures
      if (cleanMsg === '#sync_profiles') {
          await whatsappService.sendText(phone, `${AI_SIGNATURE}🔄 Iniciando atualização de perfis (fotos/nomes)...`, 'assistant', AI_NAME);
          
          const allDocs = await databaseService.getAllConversations();
          let count = 0;
          for (const doc of allDocs) {
              // Only update if missing photo
              if (!doc.profilePicUrl && doc.phone) {
                  try {
                      const pic = await zapiService.getProfilePicture(doc.phone);
                      if (pic) {
                          await databaseService.saveSession(doc.phone, { profilePicUrl: pic });
                          count++;
                      }
                  } catch (e) {
                      console.error(`Failed to sync profile for ${doc.phone}`, e);
                  }
              }
          }
          await whatsappService.sendText(phone, `${AI_SIGNATURE}✅ Atualização concluída! ${count} perfis atualizados.`, 'assistant', AI_NAME);
          return;
      }

      // 1. Check Session State
      let session = await sessionManager.ensureSession(phone, senderName, profilePicUrl);

      // If session is PAUSED (Human Intervention), do not process
      if (session.state === 'PAUSED') {
          console.log(`[Flow] Session PAUSED for ${phone}. Human intervention active.`);
          return;
      }

      // 2. State Machine
      switch (session.state) {
        case 'IDLE':
          // Start conversation / Identify user
          if (message.toLowerCase().match(/^(oi|ola|olá|bom dia|boa tarde|boa noite|iniciar|start|menu)$/)) {
            await whatsappService.sendText(phone, `${AI_SIGNATURE}Olá ${senderName}, sou a assistente virtual da Lopes Condomínios. Como posso ajudar hoje?`, 'assistant', AI_NAME);
            sessionManager.updateState(phone, 'WAITING_MENU');
          } else {
             // If user sends a specific query immediately, skip greeting and process
             sessionManager.updateState(phone, 'WAITING_MENU');
             // Re-process the message in the new state
             await botFlow.handleMessage(phone, message, senderName); 
          }
          break;

        case 'WAITING_MENU':
          if (message.toLowerCase().includes('boleto') || message.includes('1')) {
             await whatsappService.sendText(phone, `${AI_SIGNATURE}Por favor, digite o CPF do titular (apenas números) para eu localizar seus boletos.`, 'assistant', AI_NAME);
             sessionManager.updateState(phone, 'WAITING_CPF');
          } else if (message.toLowerCase().includes('reserva') || message.includes('2')) {
             await whatsappService.sendText(phone, `${AI_SIGNATURE}Para reservas, acesse nosso portal: https://lopes.superlogica.net/clients/areadocondomino`, 'assistant', AI_NAME);
             sessionManager.updateState(phone, 'IDLE'); // Reset
          } else {
             // Default to AI for general questions
             const aiResponse = await aiService.generateResponse(message);
             await whatsappService.sendText(phone, `${AI_SIGNATURE}${aiResponse}`, 'assistant', AI_NAME);
          }
          break;

        case 'WAITING_CPF':
          const cpf = message.replace(/\D/g, '');
          if (cpf.length !== 11) {
             await whatsappService.sendText(phone, `${AI_SIGNATURE}CPF inválido. Por favor, digite novamente (11 números).`, 'assistant', AI_NAME);
             return;
          }

          await whatsappService.sendText(phone, `${AI_SIGNATURE}Buscando boletos... aguarde um momento.`, 'assistant', AI_NAME);
          
          try {
            const slips = await superlogicaService.getPendingSlips(cpf);
            if (slips.length > 0) {
                let responseText = `${AI_SIGNATURE}Encontrei os seguintes boletos em aberto:\n\n`;
                slips.forEach((slip: any) => {
                    responseText += `📅 Vencimento: ${slip.dt_vencimento_recb}\n💰 Valor: R$ ${slip.vl_emitido_recb}\n🔢 Linha Digitável: ${slip.linhadigitavel_recb}\n👉 Link: ${slip.link_segunda_via}\n\n`;
                });
                await whatsappService.sendText(phone, responseText, 'assistant', AI_NAME);
            } else {
                await whatsappService.sendText(phone, `${AI_SIGNATURE}Não encontrei boletos pendentes para este CPF.`, 'assistant', AI_NAME);
            }
          } catch (err) {
             console.error('Error fetching slips:', err);
             await whatsappService.sendText(phone, `${AI_SIGNATURE}Houve um erro ao consultar os boletos. Tente novamente mais tarde.`, 'assistant', AI_NAME);
          }
          sessionManager.updateState(phone, 'IDLE');
          break;
          
        default:
          sessionManager.updateState(phone, 'IDLE');
          break;
      }

    } catch (error) {
      console.error('[Flow] Error handling message:', error);
      await whatsappService.sendText(phone, `${AI_SIGNATURE}Desculpe, tive um erro interno. Tente novamente.`, 'assistant', AI_NAME);
    }
  }
};
