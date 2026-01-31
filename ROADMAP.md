# Roadmap do Produto - Lopes Condomínios CRM

Este documento descreve o plano de desenvolvimento para transformar o sistema atual em uma plataforma de gestão de condomínios de alto nível, com integração robusta via Antigravity e interface estilo Notion.

## 🚀 Fase 1: Fundação & Estabilidade (Atual)
Foco: Garantir que o básico funcione perfeitamente. Mensagens chegam, saem e são registradas.

- [x] **Arquitetura Híbrida**: Backend Node.js com Webhook para Antigravity (Meta Cloud API).
- [x] **Integração Webhook**: Recebimento de mensagens em tempo real (Webhook verificado).
- [x] **Envio de Mensagens**: Migração do Z-API para Antigravity/Meta API (Service Layer).
- [x] **Dashboard Estilo Notion**: Interface limpa, minimalista e funcional.
- [x] **Identificação de Agente**: Saber quem enviou a mensagem (Sender ID).
- [ ] **Validação em Produção**: Teste de envio e recebimento com credenciais reais.

## 🛠️ Fase 2: Gestão & Produtividade (Curto Prazo)
Foco: Melhorar a vida de quem atende.

- [ ] **Transferência Inteligente**:
    - Transferir conversa para outro agente com nota interna.
    - Histórico preservado na transferência.
- [ ] **Kanban Avançado**:
    - Drag & drop de cards (Chamados).
    - Automação: Mover para "Em Atendimento" quando responder.
    - Tags personalizáveis (Urgente, Financeiro, Manutenção).
- [ ] **Respostas Rápidas (Snippets)**:
    - Comandos "/" para inserir textos padrões (ex: "/pix", "/endereco").

## 🤖 Fase 3: Automação & IA (Médio Prazo)
Foco: Reduzir trabalho manual e responder 24/7.

- [ ] **IA Contextual (RAG)**:
    - Alimentar a IA com Regimento Interno e Atas do condomínio.
    - Respostas precisas sobre regras específicas (ex: "pode cachorro na piscina?").
- [ ] **Integração Superlógica Profunda**:
    - 2ª via de boleto automática sem intervenção humana (já iniciado).
    - Consulta de nada consta.
    - Reserva de áreas comuns via Chat.

## 💎 Fase 4: Premium & White Label (Longo Prazo - Visão HelenaCRM)
Foco: Escalar e profissionalizar.

- [ ] **App Mobile Nativo**: Versão iOS/Android para síndicos e porteiros.
- [ ] **Múltiplos Canais**: Centralizar WhatsApp, Instagram e E-mail no mesmo Inbox.
- [ ] **Analytics**: Relatórios de tempo de resposta, satisfação e volume de atendimentos.
- [ ] **Personalização Total**: Logo e cores do condomínio na área do cliente.

---

## 📋 Próximos Passos Imediatos (To-Do)

1. **Deploy**: Enviar código atualizado para o Render.
2. **Configuração**: Adicionar `WHATSAPP_ACCESS_TOKEN` e `PHONE_NUMBER_ID` no Render.
3. **Teste**: Validar fluxo completo de mensagens.
