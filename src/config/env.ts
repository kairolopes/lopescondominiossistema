import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  zapi: {
    instanceId: process.env.ZAPI_INSTANCE_ID || '',
    token: process.env.ZAPI_TOKEN || '',
    securityToken: process.env.ZAPI_SECURITY_TOKEN || '',
  },
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'lopes_secret_token',
  },
  superlogica: {
    appToken: process.env.SUPERLOGICA_APP_TOKEN || '',
    accessToken: process.env.SUPERLOGICA_ACCESS_TOKEN || '',
    url: process.env.SUPERLOGICA_URL || 'https://api.superlogica.net/v2/condor',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  aiProvider: process.env.AI_PROVIDER || 'openai', // 'openai' or 'gemini'
  gemini: {
    // Primary AI (Antigravity/Google)
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  }
};
