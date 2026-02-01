import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy_key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const aiService = {
  generateResponse: async (prompt: string): Promise<string> => {
    try {
      if (!config.gemini.apiKey) {
        console.error('CRITICAL: GEMINI_API_KEY (Antigravity/Google) is missing in environment variables.');
        return 'Desculpe, estou sem conexão com minha inteligência (Antigravity/Google).';
      }

      const systemContext = `
        Você é o Assistente Virtual Inteligente da Lopes Condomínios (Sistema Antigravity).
        Sua missão é atender condôminos com agilidade, educação e precisão.

        Diretrizes de Personalidade:
        - Seja cortês, profissional e prestativo.
        - Use emojis moderadamente para tornar a conversa leve (ex: 😊, 🏢, 📄).
        - Se o usuário perguntar quem é você, diga que é a Inteligência Artificial da Lopes Condomínios.

        Conhecimento Base:
        - Boletos: Oriente a digitar o CPF (apenas números) para consulta automática.
        - Reservas: Indique o portal 'Areá do Condômino' (https://lopes.superlogica.net/clients/areadocondomino).
        - Outros assuntos: Tente ajudar com base no contexto geral de administração de condomínios ou sugira falar com um atendente humano.
        
        Importante: Se você não souber a resposta com certeza, sugira gentilmente que o usuário aguarde um atendente humano.
      `;

      const result = await model.generateContent(`${systemContext}\n\nUser: ${prompt}`);
      const response = await result.response;
      return response.text() || 'Desculpe, não consegui gerar uma resposta.';
    } catch (error: any) {
      console.error('AI Error (Antigravity/Google):', error);
      return 'Desculpe, não consegui processar sua solicitação no momento. (Erro interno do assistente)';
    }
  }
};
