
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testWebhook() {
  const url = 'http://localhost:3001/api/webhook/zapi';
  
  // Simulate incoming message from Z-API
  const payload = {
    phone: '5511999999999',
    message: {
      text: 'Olá, gostaria de um boleto'
    },
    senderName: 'Teste Testerson',
    securityToken: process.env.ZAPI_SECURITY_TOKEN // Optional if configured
  };

  console.log(`📡 Enviando mensagem para ${url}...`);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload);
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log('👉 Se você viu logs no servidor principal, o teste funcionou!');
  } catch (error: any) {
    console.error('❌ Erro no teste:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Verifique se o servidor está rodando na porta correta (3001).');
    }
  }
}

testWebhook();
