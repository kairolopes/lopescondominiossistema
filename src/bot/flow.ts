import { zapiService } from '../services/zapi';
import { superlogicaService } from '../services/superlogica';
import { aiService } from '../services/ai';
import { userService } from '../services/userService';
import { sessionManager } from '../services/sessionManager';
import { databaseService } from '../services/database';

export const botFlow = {
  handleMessage: async (phone: string, message: string, senderName: string) => {
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

      // 1. Check Session State
      let session = await sessionManager.ensureSession(phone, senderName);

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
            await zapiService.sendText(phone, `Olá ${senderName}, sou o assistente virtual da Lopes Condomínios. Como posso ajudar hoje?`, 'assistant', 'Bot Lopes');
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
             await zapiService.sendText(phone, 'Por favor, digite o CPF do titular (apenas números) para eu localizar seus boletos.', 'assistant', 'Bot Lopes');
             sessionManager.updateState(phone, 'WAITING_CPF');
          } else if (message.toLowerCase().includes('reserva') || message.includes('2')) {
             await zapiService.sendText(phone, 'Para reservas, acesse nosso portal: https://lopes.superlogica.net/clients/areadocondomino', 'assistant', 'Bot Lopes');
             sessionManager.updateState(phone, 'IDLE'); // Reset
          } else {
             // Default to AI for general questions
             const aiResponse = await aiService.generateResponse(message);
             await zapiService.sendText(phone, aiResponse, 'assistant', 'Bot Lopes');
          }
          break;

        case 'WAITING_CPF':
          const cpf = message.replace(/\D/g, '');
          if (cpf.length !== 11) {
             await zapiService.sendText(phone, 'CPF inválido. Por favor, digite novamente (11 números).', 'assistant', 'Bot Lopes');
             return;
          }

          await zapiService.sendText(phone, 'Buscando boletos... aguarde um momento.', 'assistant', 'Bot Lopes');
          
          try {
            const slips = await superlogicaService.getPendingSlips(cpf);
            if (slips.length > 0) {
                let responseText = 'Encontrei os seguintes boletos em aberto:\n\n';
                slips.forEach((slip: any) => {
                    responseText += `📅 Vencimento: ${slip.dt_vencimento_recb}\n💰 Valor: R$ ${slip.vl_emitido_recb}\n🔢 Linha Digitável: ${slip.linhadigitavel_recb}\n👉 Link: ${slip.link_segunda_via}\n\n`;
                });
                await zapiService.sendText(phone, responseText, 'assistant', 'Bot Lopes');
            } else {
                await zapiService.sendText(phone, 'Não encontrei boletos pendentes para este CPF.', 'assistant', 'Bot Lopes');
            }
          } catch (err) {
             console.error('Error fetching slips:', err);
             await zapiService.sendText(phone, 'Houve um erro ao consultar os boletos. Tente novamente mais tarde.', 'assistant', 'Bot Lopes');
          }
          sessionManager.updateState(phone, 'IDLE');
          break;
          
        default:
          sessionManager.updateState(phone, 'IDLE');
          break;
      }

    } catch (error) {
      console.error('[Flow] Error handling message:', error);
      await zapiService.sendText(phone, 'Desculpe, tive um erro interno. Tente novamente.', 'assistant', 'Bot Lopes');
    }
  }
};
