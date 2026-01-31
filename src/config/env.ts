import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  zapi: {
    instanceId: process.env.ZAPI_INSTANCE_ID || '3EDDC00C4442415A1099DEFCC216B74C',
    token: process.env.ZAPI_TOKEN || '6909F71A3D29D570F0A8C65C',
    securityToken: process.env.ZAPI_SECURITY_TOKEN || 'Ff94d05bcd8b546afb957fc52d8e33ebaS',
  },
  superlogica: {
    appToken: process.env.SUPERLOGICA_APP_TOKEN || '47f3393f-0d2c-4928-9ee8-ccda82de50b8',
    accessToken: process.env.SUPERLOGICA_ACCESS_TOKEN || '0bae402b-1e2b-4145-ab04-a726f37a2870',
    url: process.env.SUPERLOGICA_URL || 'https://api.superlogica.net/v2/condor',
  },
  openai: {
    // Deprecated
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyA9ZA-a_Tas3t-v3RTMX_9FdkTGRcIlTbM',
  }
};
