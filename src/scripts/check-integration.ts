
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function checkIntegration() {
  console.log('--- Health Check Lopes Condomínios ---');
  
  // 1. Check Env Vars
  console.log('\n[1] Verificando Variáveis de Ambiente...');
  const keys = ['ZAPI_INSTANCE_ID', 'ZAPI_TOKEN', 'GEMINI_API_KEY'];
  const missing = keys.filter(k => !process.env[k]);
  
  if (missing.length > 0) {
    console.error('❌ Faltando chaves:', missing.join(', '));
  } else {
    console.log('✅ Variáveis essenciais presentes.');
  }

  // 2. Check Gemini
  console.log('\n[2] Testando Conexão com Gemini AI...');
  if (process.env.GEMINI_API_KEY) {
    try {
      // Simple mock check or real call if lib allows (using direct REST for simple check)
      // Using gemini-1.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: "Ping" }] }]
      });
      if (response.status === 200) {
        console.log('✅ Gemini API respondendo corretamente.');
      }
    } catch (error: any) {
      console.error('❌ Erro ao conectar com Gemini:', error.response?.data?.error?.message || error.message);
    }
  }

  // 3. Check Z-API (Mock check if no real instance)
  console.log('\n[3] Verificando Configuração Z-API...');
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) {
      console.log(`ℹ️ Configurado para Instância: ${process.env.ZAPI_INSTANCE_ID}`);
      // Nota: Não faremos chamada real para não gastar cota ou enviar msg indesejada, mas poderíamos verificar status da instância
      // const statusUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/status`;
  } else {
      console.warn('⚠️ Z-API não configurada totalmente.');
  }

  console.log('\n--- Fim do Health Check ---');
}

checkIntegration().catch(console.error);
