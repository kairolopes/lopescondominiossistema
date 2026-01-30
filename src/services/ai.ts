import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

// Configure Gemini only if key is present
const genAI = config.gemini.apiKey ? new GoogleGenerativeAI(config.gemini.apiKey) : null;
// Using gemini-1.5-flash for better availability/speed
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export const aiService = {
  // Agent capable of answering condo questions
  processQuery: async (userQuery: string, context: string = '') => {
    if (!model) {
      return "Desculpe, meu módulo de inteligência artificial (Gemini) não está configurado no momento.";
    }

    try {
      const prompt = `
        Você é um assistente virtual especializado da Lopes Condomínios.
        Sua função é ajudar moradores com dúvidas sobre convivência, regras e funcionamento do condomínio.
        
        Contexto do usuário: ${context}
        
        Diretrizes:
        - Seja educado e profissional.
        - Se a pergunta for sobre boletos ou reservas, instrua o usuário a usar o menu principal.
        - Se não souber a resposta, sugira falar com um atendente humano.
        - Responda de forma concisa, ideal para WhatsApp.
        
        Pergunta do usuário: ${userQuery}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini service:', error);
      return "Estou com dificuldades técnicas para pensar numa resposta agora. Tente novamente mais tarde.";
    }
  }
};
