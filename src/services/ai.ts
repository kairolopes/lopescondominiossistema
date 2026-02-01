import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/env';

// Initialize Gemini client (Lazy or safe init handled in function check, but object created here)
const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy_key');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey || 'dummy_key', // Avoid crash if key missing, check later
});

export const aiService = {
  generateResponse: async (prompt: string): Promise<string> => {
    const provider = config.aiProvider;
    
    const systemContext = `
        Você é o Assistente Virtual Inteligente da Lopes Condomínios.
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

    try {
      // 1. OpenAI Strategy
      if (provider === 'openai') {
        if (!config.openai.apiKey) {
            console.warn('⚠️ OpenAI Key missing. Falling back to Gemini.');
            // Fallback to Gemini if configured
        } else {
            console.log('[AI Service] Using OpenAI (gpt-4o-mini)');
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemContext },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
            });
            return completion.choices[0].message.content || 'Desculpe, não consegui gerar uma resposta.';
        }
      }

      // 2. Gemini Strategy (Default or Fallback)
      if (!config.gemini.apiKey) {
        console.error('CRITICAL: GEMINI_API_KEY (Antigravity/Google) is missing.');
        return 'Desculpe, estou sem conexão com minha inteligência.';
      }

      console.log('[AI Service] Using Gemini (gemini-1.5-flash)');
      const result = await geminiModel.generateContent(`${systemContext}\n\nUser: ${prompt}`);
      const response = await result.response;
      return response.text() || 'Desculpe, não consegui gerar uma resposta.';

    } catch (error: any) {
      console.error(`AI Error (${provider}):`, error);
      return 'Desculpe, não consegui processar sua solicitação no momento. (Erro interno do assistente)';
    }
  }
};
