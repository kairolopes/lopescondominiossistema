import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const aiService = {
  generateResponse: async (prompt: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const systemContext = `
        Você é um assistente virtual da Lopes Condomínios.
        Seu tom é profissional, educado e direto.
        Responda dúvidas sobre boletos, reservas e regras de condomínio.
        Se não souber, peça para o usuário entrar em contato com a administração.
      `;

      const result = await model.generateContent(`${systemContext}\n\nUsuário: ${prompt}`);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Error:', error);
      return 'Desculpe, não consegui processar sua solicitação no momento.';
    }
  }
};
