# Spec 013 — Configuração de Credenciais Discord via Painel Admin

**Feature:** `013-discord-settings-config`
**Data:** 2026-05-03
**Status:** Especificado
**Branch:** `feat/013-discord-settings-config` (a criar ao iniciar)
**Base:** `dev`
**Dependência:** Feature 012 mergeada em `dev`

---

## Contexto

A feature 012 implementou o pipeline de importação Discord, mas o `DISCORD_BOT_TOKEN`
é lido exclusivamente de `process.env`. Isso exige acesso SSH à VM para configurar
o token, tornando o onboarding de novos canais dependente de intervenção técnica.

Esta feature cria uma camada de configuração administrativa que permite ao admin
gerenciar o token do bot e outras credenciais Discord diretamente pelo painel web,
sem acesso à infraestrutura.

---

## Decisões Arquiteturais

| Decisão | Valor | Motivo |
|---|---|---|
| Armazenamento | Nova tabela `discord_settings` | Token é credencial do bot, não do canal — separar de `discord_import_sources` |
| Escopo | `guild_id NULL` = global; futuro: por guild | Permite múltiplos bots por guild sem migração quebrada |
| Leitura do token | DB tem prioridade sobre `process.env` | Migração suave: env var continua funcionando enquanto não há registro no banco |
| Retorno da API | Nunca retornar token em claro | Apenas `{ is_set: true, preview: "MTQ5...k8kQ" }` (4 chars + "..." + 4 chars) |
| Armazenamento seguro | Token salvo com AES-256-GCM via `node:crypto` | Chave derivada de `JWT_SECRET` — sem dependência de serviço externo |

---

## Requisitos Funcionais

### RF-001 — Salvar bot token pelo painel admin
O admin deve poder inserir ou substituir o `DISCORD_BOT_TOKEN` via painel web sem
acesso SSH. O token é salvo cifrado no banco de dados.

### RF-002 — Exibir status do token sem expor o valor
A UI deve mostrar se o token está configurado (`Configurado` / `Não configurado`) e
um preview mascarado (ex: `MTQ5...k8kQ`). O valor completo nunca é retornado.

### RF-003 — Validar token antes de salvar
Ao salvar, o backend deve validar que o token não está vazio e tem formato básico
esperado pelo Discord (comprimento mínimo, sem espaços). Opcionalmente, fazer uma
chamada de teste à API `GET /users/@me` do Discord para confirmar autenticidade.

### RF-004 — Leitura com fallback para variável de ambiente
`ingestMessages` deve ler o token na ordem: (1) banco de dados → (2) `process.env.DISCORD_BOT_TOKEN`.
Isso garante compatibilidade com deploys existentes sem banco configurado.

### RF-005 — Remoção do token
O admin deve poder remover o token salvo, revertendo para leitura via `process.env`
(ou desabilitando sync se ambos estiverem ausentes).

---

## Requisitos Não Funcionais

### RNF-001 — Segurança: token nunca em plaintext no banco
O valor armazenado em `discord_settings.value` deve ser cifrado com AES-256-GCM.
A chave de cifra é derivada de `JWT_SECRET` via `scryptSync`. Se `JWT_SECRET` não
estiver configurado, o endpoint retorna 503.

### RNF-002 — Segurança: sem exposição em logs
O token decifrado não deve aparecer em nenhum `console.log`, `console.error` ou
stack trace. A função que decifra o token deve ser isolada e jamais retornar o valor
para rotas HTTP.

### RNF-003 — Auditoria
Toda alteração de configuração deve registrar `updated_at` e, futuramente, o ID do
admin que realizou a mudança.

---

## Modelo de Dados

### Nova tabela: `discord_settings` (migration_116)

```sql
CREATE TABLE discord_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    VARCHAR(50),
  key         VARCHAR(100) NOT NULL,
  value       TEXT NOT NULL,       -- AES-256-GCM ciphertext (base64)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guild_id, key)
);
```

Registro canônico inicial: `guild_id = NULL, key = 'bot_token'`.

---

## Contrato de API

### `GET /api/v1/admin/discord-sync/settings`
Retorna status das configurações sem expor valores sensíveis.

```json
{
  "data": {
    "bot_token": {
      "is_set": true,
      "preview": "MTQ5...k8kQ",
      "updated_at": "2026-05-03T10:00:00-03:00"
    }
  }
}
```

### `PUT /api/v1/admin/discord-sync/settings/bot-token`
Salva ou substitui o token. Body: `{ "token": "<valor>" }`.
Resposta: `{ "data": { "is_set": true, "preview": "MTQ5...k8kQ" } }`

### `DELETE /api/v1/admin/discord-sync/settings/bot-token`
Remove o token do banco. Resposta: `204 No Content`.

---

## UI / Frontend

Novo componente `DiscordSettingsPanel` adicionado como primeira aba do `DiscordSyncPanel`
(antes de "Fontes"). Exibe:

- Badge de status: `✅ Bot configurado` / `⚠️ Token não configurado`
- Preview mascarado do token atual (se configurado)
- Campo de senha para inserir novo token (não pré-preenchido)
- Botão "Salvar token" com feedback de validação
- Botão "Remover token" com confirmação inline
- Aviso: _"Se nenhum token estiver configurado aqui, o sistema usa a variável de ambiente `DISCORD_BOT_TOKEN`."_

---

## Critérios de Aceite

- [ ] Admin salva token via painel → ingestão passa a funcionar sem reiniciar o servidor
- [ ] Token salvo → GET /settings retorna `is_set: true` e preview mascarado
- [ ] Token nunca aparece em plaintext em nenhuma resposta HTTP
- [ ] Token removido → fallback para `process.env.DISCORD_BOT_TOKEN`
- [ ] `npm --prefix backend run build` GREEN
- [ ] Validação de token inválido retorna 400 com mensagem clara
- [ ] Migration 116 aplicada sem erro em banco de teste

---

## Fora do Escopo desta Feature

- Suporte a múltiplos bots por guild (escopo futuro; schema já permite via `guild_id`)
- Rotação automática de tokens
- Histórico de alterações com `admin_id` (requer feature de auditoria separada)
- Cifra de outras credenciais além do `bot_token`
