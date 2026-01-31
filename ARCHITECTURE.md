# Arquitetura Híbrida: Google Antigravity + CRM Personalizado

Este documento descreve a integração técnica do **Google Antigravity** (Plataforma de Agentes da Google) com o nosso **CRM Personalizado** para resolver problemas de estabilidade e potenciar a gestão.

## 1. Visão Geral
- **Google Antigravity**: Atua como o "Motor de Comunicação" e "Cérebro IA". Ele gerencia a conexão com o WhatsApp (via MCP/Meta Cloud) e garante que as mensagens nunca se percam.
- **CRM Personalizado (Este Sistema)**: Atua como o "Painel de Controle". É onde os humanos trabalham (Kanban, Transferências, Relatórios).

## 2. Por que Google Antigravity?
- **Estabilidade Google**: Infraestrutura de nuvem robusta, eliminando a dependência de celulares físicos (QR Code).
- **Segurança**: Dados processados em ambiente seguro.
- **Integração Nativa**: Conexão direta com APIs oficiais (WhatsApp Business).

## 3. Fluxo de Integração

### 3.1. Recebimento (Cliente -> CRM)
1. Cliente envia mensagem no WhatsApp.
2. **Google Antigravity** captura a mensagem (via WhatsApp Business MCP).
3. Antigravity dispara um **Webhook** para o nosso CRM:
   - **URL**: `https://seu-crm.onrender.com/api/webhook/antigravity`
   - **Payload**: Contém a mensagem, número do cliente e metadados.
4. **CRM Personalizado**:
   - Salva a mensagem no histórico do cliente.
   - Atualiza o cartão no Kanban.

### 3.2. Envio (Funcionário -> Cliente)
1. Funcionário digita a resposta no **CRM Personalizado**.
2. O CRM identifica o funcionário (`senderName: "João"`).
3. O CRM chama a API do **Google Antigravity**:
   - **Função**: `antigravityService.sendText(phone, msg, agentName)`
4. **Google Antigravity** processa e entrega ao cliente via WhatsApp.

## 4. Configuração Necessária (Passo a Passo)

### No Google Antigravity / Console:
1. **Ativar WhatsApp Business MCP**: Conecte sua conta do Facebook Business.
2. **Configurar Webhook**:
   - Aponte para a URL do nosso CRM (ex: `/api/webhook/antigravity`).
   - Token de Verificação: `lopes_secret` (configurável).

### No Nosso CRM (Environment):
Precisaremos adicionar as seguintes variáveis no arquivo `.env` (ou no painel do Render):
```env
# Configurações Google Antigravity
ANTIGRAVITY_API_URL=https://...
ANTIGRAVITY_API_KEY=sua_chave_aqui
WEBHOOK_VERIFY_TOKEN=lopes_secret
```

## 5. Transferência de Atendimento
Como o **CRM Personalizado** detém o "Estado da Sessão" (quem é o dono do ticket), a transferência continua funcionando perfeitamente:
- O Antigravity é apenas o mensageiro.
- O CRM decide para qual coluna do Kanban o ticket vai e quem é o responsável.
