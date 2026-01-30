# Guia de Integração - Lopes Condomínios

Este documento explica como conectar a plataforma à **Superlógica** e à **Z-API (WhatsApp)**.

## 1. Integração com Superlógica

O sistema está configurado para buscar dados financeiros (boletos) e operacionais (reservas) diretamente na API da Superlógica.

### Como Configurar
Edite o arquivo `.env` na raiz do projeto e preencha as seguintes variáveis:

```ini
SUPERLOGICA_URL=https://api.superlogica.net/v2/condor
SUPERLOGICA_APP_TOKEN=seu_app_token_aqui
SUPERLOGICA_ACCESS_TOKEN=seu_access_token_aqui
```

### Como Funciona o Fluxo de Dados
1.  **Identificação:** O usuário digita o CPF no WhatsApp.
2.  **Busca:** O sistema chama a API (`/clientes/index`) para encontrar a Unidade (Apartamento/Bloco) vinculada àquele CPF.
3.  **Consulta:**
    *   **Boletos:** Chama `/cobranca/index` filtrando por boletos pendentes.
    *   **Reservas:** Chama `/reservas/areas` e `/reservas/reservar`.
4.  **Fallback:** Se as chaves não estiverem configuradas ou a API falhar, o sistema usa dados de demonstração (Mock) para não travar o atendimento.

---

## 2. Integração com WhatsApp (Z-API)

A Z-API funciona como uma "ponte" entre o WhatsApp do seu celular e o nosso servidor.

### Passo 1: Configurar a Instância Z-API
1.  Crie uma conta na [Z-API](https://z-api.io/).
2.  Crie uma instância e escaneie o QR Code com o WhatsApp da empresa.
3.  Pegue o **ID da Instância** e o **Token** e coloque no `.env`:

```ini
ZAPI_INSTANCE_ID=sua_instancia_id
ZAPI_TOKEN=seu_token_zapi
ZAPI_SECURITY_TOKEN=senha_seguranca_webhook
```

### Passo 2: Configurar o Webhook (Recebimento de Mensagens)
Para o robô responder, a Z-API precisa saber para onde enviar as mensagens que chegam.

1.  No painel da Z-API, vá em **Webhooks**.
2.  Configure a URL de "Ao receber mensagem" para o endereço do seu servidor:
    *   Exemplo (Produção): `https://sua-plataforma.com/api/webhook/zapi`
    *   Exemplo (Teste Local): Use o **ngrok** para criar um link público para seu computador.
        *   Comando: `ngrok http 3000`
        *   URL: `https://xxxx-xxxx.ngrok-free.app/api/webhook/zapi`

### Como Funciona o Fluxo
1.  **Cliente envia mensagem:** "Olá" -> WhatsApp -> Z-API.
2.  **Z-API notifica servidor:** Z-API envia um POST para `/api/webhook/zapi`.
3.  **Servidor processa:** O código em `src/controllers/webhook.ts` recebe a mensagem.
4.  **Resposta:** O bot decide a resposta e chama a Z-API (`send-text`) para enviar de volta ao cliente.
