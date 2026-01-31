import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  zapi: {
    instanceId: process.env.ZAPI_INSTANCE_ID || '',
    token: process.env.ZAPI_TOKEN || '',
    securityToken: process.env.ZAPI_SECURITY_TOKEN || '',
  },
  superlogica: {
    appToken: process.env.SUPERLOGICA_APP_TOKEN || '',
    accessToken: process.env.SUPERLOGICA_ACCESS_TOKEN || '',
    url: process.env.SUPERLOGICA_URL || 'https://api.superlogica.net/v2/condor',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  gemini: {
    // Deprecated in favor of OpenAI
    apiKey: process.env.GEMINI_API_KEY || '',
  }
};
