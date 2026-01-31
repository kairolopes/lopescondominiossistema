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
        Você é um assistente virtual da Lopes Condomínios (Sistema Antigravity).
        Seu tom é profissional, educado e direto.
        Responda dúvidas sobre boletos, reservas e regras de condomínio.
        Se não souber, peça para o usuário entrar em contato com a administração.
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
