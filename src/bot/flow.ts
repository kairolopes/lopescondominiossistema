import { zapiService } from '../services/zapi';
import { superlogicaService } from '../services/superlogica';
import { aiService } from '../services/ai';
import { sessionManager } from '../services/sessionManager';

export const botFlow = {
  handleMessage: async (phone: string, message: string, senderName: string) => {
    let session = sessionManager.getSession(phone);
    
    if (!session) {
        session = sessionManager.createSession(phone);
    }

    // Log user message to history (CRM Conversacional)
    session.history.push({ role: 'user', content: message, timestamp: new Date() });

    const cleanMessage = message.trim().toLowerCase();

    try {
      // --- FLUXO INICIAL ---
      if (session.step === 'START') {
        await zapiService.sendText(phone, `Olá ${senderName}, bem-vindo à Lopes Condomínios! \nSou seu assistente virtual.`);
        await zapiService.sendText(phone, 'Por favor, digite seu CPF (apenas números) para que eu possa localizar seu cadastro.');
        session.step = 'WAITING_CPF';
        
      } 
      // --- VALIDAÇÃO DE CPF ---
      else if (session.step === 'WAITING_CPF') {
          const cpf = cleanMessage.replace(/\D/g, '');
          if (cpf.length !== 11) {
              await zapiService.sendText(phone, 'CPF inválido. Por favor, digite novamente (11 dígitos).');
              return;
          }

          // Simulação de busca de unidade
          const unitId = '1001'; // ID fixo para teste
          
          await zapiService.sendText(phone, 'Localizei sua unidade: Bloco A - Apto 101.');
          
          // CRM: Adicionar tag de morador identificado
          sessionManager.addTag(phone, 'morador_validado');
          
          await sendMainMenu(phone);
          session.step = 'MAIN_MENU';
          session.data = { cpf, unitId };

      } 
      // --- MENU PRINCIPAL ---
      else if (session.step === 'MAIN_MENU') {
          // 1. Segunda Via de Boleto
          if (['1', 'boleto', 'fatura', 'pagamento'].some(w => cleanMessage.includes(w))) {
              await zapiService.sendText(phone, 'Consultando seus boletos em aberto...');
              
              const boletos: any[] = await superlogicaService.getPendingSlips(session.data.unitId);
              
              if (boletos && boletos.length > 0) {
                  const boleto = boletos[0]; // Pega o primeiro
                  await zapiService.sendText(phone, `Encontrei um boleto com vencimento em ${boleto.vencimento} no valor de R$ ${boleto.valor}.`);
                  await zapiService.sendText(phone, 'Segue o PDF para pagamento:');
                  await zapiService.sendPDF(phone, boleto.link, 'Seu Boleto Lopes Condomínios');
              } else {
                  await zapiService.sendText(phone, 'Parabéns! Não encontrei débitos pendentes para sua unidade.');
              }
              
              await sendMainMenu(phone);
          } 
          // 2. Reservas
          else if (['2', 'reserva', 'agendar'].some(w => cleanMessage.includes(w))) {
              const areas: any[] = await superlogicaService.getCommonAreas();
              let msg = 'Áreas disponíveis para reserva:\n\n';
              areas.forEach((area, index) => {
                  msg += `${index + 1}. ${area.nome} (Capacidade: ${area.capacidade})\n`;
              });
              msg += '\nDigite o número da área que deseja reservar:';
              
              await zapiService.sendText(phone, msg);
              session.step = 'RESERVA_SELECT_AREA';
              session.data.areas = areas;
          } 
          // 3. Ocorrências / Chamados
          else if (['3', 'ocorrencia', 'reclamacao', 'chamado'].some(w => cleanMessage.includes(w))) {
              await zapiService.sendText(phone, 'Descreva brevemente o problema ou ocorrência que deseja relatar:');
              session.step = 'OCORRENCIA_DESC';
          }
          // 4. Falar com Atendente
          else if (['4', 'atendente', 'humano'].some(w => cleanMessage.includes(w))) {
              await zapiService.sendText(phone, 'Estou transferindo seu atendimento para a equipe da Lopes Condomínios. Em instantes alguém falará com você.');
              // CRM: Tag de transbordo
              sessionManager.addTag(phone, 'aguardando_humano');
              sessionManager.deleteSession(phone); // Encerra sessão do bot
          } 
          // Outros (IA)
          else {
              await zapiService.sendText(phone, 'Processando...');
              const aiResponse = await aiService.processQuery(message, `Usuário da unidade Bloco A - Apto 101. Histórico recente: ${session.history.length} mensagens.`);
              await zapiService.sendText(phone, aiResponse);
              setTimeout(() => sendMainMenu(phone), 2000);
          }

      } 
      // --- FLUXO DE RESERVA ---
      else if (session.step === 'RESERVA_SELECT_AREA') {
          const index = parseInt(cleanMessage) - 1;
          const areas = session.data.areas;
          
          if (index >= 0 && index < areas.length) {
              session.data.selectedArea = areas[index];
              await zapiService.sendText(phone, `Você selecionou: ${areas[index].nome}. \nPara qual data deseja reservar? (formato DD/MM/AAAA)`);
              session.step = 'RESERVA_DATE';
          } else {
              await zapiService.sendText(phone, 'Opção inválida. Digite o número da área.');
          }
      } 
      else if (session.step === 'RESERVA_DATE') {
          const date = cleanMessage; // Simplificado, ideal validar regex de data
          const area = session.data.selectedArea;
          
          await zapiService.sendText(phone, `Confirmando reserva do(a) ${area.nome} para o dia ${date}...`);
          
          const success = await superlogicaService.createReservation(session.data.unitId, area.id, date);
          
          if (success) {
              await zapiService.sendText(phone, `✅ Reserva confirmada com sucesso para ${date}!`);
          } else {
              await zapiService.sendText(phone, `❌ Não foi possível realizar a reserva. A data pode estar indisponível.`);
          }
          await sendMainMenu(phone);
          session.step = 'MAIN_MENU';
      }
      // --- FLUXO DE OCORRÊNCIA ---
      else if (session.step === 'OCORRENCIA_DESC') {
          const description = message;
          await zapiService.sendText(phone, 'Registrando sua ocorrência...');
          
          const result = await superlogicaService.createTicket(session.data.unitId, 'Ocorrência via WhatsApp', description);
          
          await zapiService.sendText(phone, `📝 Ocorrência registrada sob protocolo #${result.ticketId}. Nossa equipe analisará e entrará em contato.`);
          await sendMainMenu(phone);
          session.step = 'MAIN_MENU';
      }

    } catch (error) {
      console.error('Error in bot flow:', error);
      await zapiService.sendText(phone, 'Desculpe, ocorreu um erro técnico. Tente novamente mais tarde.');
    }
  }
};


async function sendMainMenu(phone: string) {
    const options = [
        { id: '1', label: '2ª Via de Boleto' },
        { id: '2', label: 'Reservar Espaço' },
        { id: '3', label: 'Abrir Ocorrência' },
        { id: '4', label: 'Falar com Atendente' }
    ];
    
    // Tenta enviar lista interativa, fallback para texto
    await zapiService.sendOptionList(phone, 'Como posso ajudar hoje?', 'Menu Lopes Condomínios', options);
}
