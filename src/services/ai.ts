import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const aiService = {
  generateResponse: async (prompt: string): Promise<string> => {
    try {
      // Using gemini-1.5-flash-001 which is the specific stable version (and cheapest)
      // If this fails, consider gemini-2.5-flash-lite if available in your region
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
      
      const systemContext = `
        Você é um assistente virtual da Lopes Condomínios.
        Seu tom é profissional, educado e direto.
        Responda dúvidas sobre boletos, reservas e regras de condomínio.
        Se não souber, peça para o usuário entrar em contato com a administração.
      `;

      const result = await model.generateContent(`${systemContext}\n\nUsuário: ${prompt}`);
              const response = await result.response;
              return response.text();
            } catch (error: any) {
              console.error('AI Error:', error);
              // Log specific error details for debugging
              if (error.message?.includes('API key')) {
                  console.error('CRITICAL: Invalid or missing Gemini API Key. Please check GEMINI_API_KEY in .env or Render Environment Variables.');
              }
              return 'Desculpe, não consegui processar sua solicitação no momento. (Erro interno do assistente)';
            }
          }
        };
