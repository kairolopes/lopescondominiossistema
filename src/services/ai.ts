import OpenAI from 'openai';
import { config } from '../config/env';

// Initialize OpenAI client
// Note: It will throw an error if apiKey is missing unless we handle it, 
// but we want to allow app startup even if key is missing, so we might need a lazy init or try/catch blocks in usage.
// However, standard pattern is to init at top level. If key is empty string, OpenAI might not throw immediately until request.
const openai = new OpenAI({
  apiKey: config.openai.apiKey || 'dummy_key_to_prevent_init_error', // Prevent crash on startup if key is missing locally
});

export const aiService = {
  generateResponse: async (prompt: string): Promise<string> => {
    try {
      if (!config.openai.apiKey) {
        console.error('CRITICAL: OPENAI_API_KEY is missing in environment variables.');
        throw new Error('Missing OpenAI API Key');
      }

      const systemContext = `
        Você é um assistente virtual da Lopes Condomínios.
        Seu tom é profissional, educado e direto.
        Responda dúvidas sobre boletos, reservas e regras de condomínio.
        Se não souber, peça para o usuário entrar em contato com a administração.
      `;

      const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemContext },
            { role: "user", content: prompt }
        ],
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || 'Desculpe, não consegui gerar uma resposta.';
    } catch (error: any) {
      console.error('AI Error (OpenAI):', error);
      
      // Handle specific OpenAI errors
      if (error.status === 401) {
          console.error('CRITICAL: Invalid OpenAI API Key. Please check OPENAI_API_KEY in .env or Render Environment Variables.');
      } else if (error.status === 429) {
          console.error('CRITICAL: OpenAI Rate Limit Exceeded or Quota Exceeded.');
      }

      return 'Desculpe, não consegui processar sua solicitação no momento. (Erro interno do assistente)';
    }
  }
};
