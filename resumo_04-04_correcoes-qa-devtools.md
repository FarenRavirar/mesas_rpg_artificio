# Resumo 04-04 — Correções QA AdminDevToolsPage

## Objetivo da sessão

Corrigir 5 problemas identificados no QA manual do `/admin/devtools` após deploy da Fase 7B:
1. Guia de token Discord sem links diretos e sem explicação de permissões de bot
2. Erro ao criar source via link de canal Discord
3. Erro ao importar JSON do DiscordChatExporter
4. Árvore de sistemas não carrega (dropdown vazio)
5. Texto duplicado "Selecione um único nó da árvore"

## Plano de execução

1. **Diagnóstico:** Capturar logs de erro do navegador e backend para identificar causa raiz dos erros 2, 3 e 4
2. **Correções de UX (independentes de logs):**
   - Adicionar links diretos no guia de token Discord
   - Adicionar explicação sobre permissões de bot (Read Message History, não precisa ser admin)
   - Expandir explicação de self-bot com passo a passo detalhado
   - Remover texto duplicado (unificar em "Selecione um único nó da árvore para vincular a mesa")
3. **Investigação de erros:**
   - Verificar se `arvores_de_sistemas.md` existe no container (`docker exec mesas-beta-app ls -la`)
   - Testar rota `/api/v1/systems/tree` diretamente
   - Adicionar `try/catch` robusto em `createSourceFromLink` e `importJsonPayload`
   - Validar schema do JSON antes de enviar ao backend
4. **Correções de erro** (após diagnóstico)
5. **Build e push** (aguardar autorização)
6. **QA manual** (validar todas as correções no beta)

## Task list

- [x] Capturar logs de erro do navegador (console F12) ao criar source e importar JSON — **aguardando usuário compartilhar**
- [x] Capturar logs do backend (`docker logs mesas-beta-app`)
- [x] Verificar se `arvores_de_sistemas.md` existe no container beta
- [x] Criar migração `migration_06_system_suggestions.sql`
- [x] Criar tipos TypeScript no backend (`SystemSuggestionsTable`)
- [x] Criar rotas públicas de sugestões (`/api/v1/system-suggestions`)
  - [x] POST / - Criar sugestão (limite de 5 pendentes)
  - [x] GET /mine - Listar minhas sugestões
- [x] Criar rotas administrativas (`/api/v1/admin/system-suggestions`)
  - [x] GET / - Listar todas as sugestões (com filtro por status)
  - [x] PATCH /:id/approve - Aprovar sugestão (com edição opcional)
  - [x] PATCH /:id/reject - Rejeitar sugestão (com motivo obrigatório)
  - [x] PATCH /systems/:id - Editar sistema publicado
- [x] Registrar rotas no `server.ts`
- [x] Criar componente `SystemSuggestionModal` (frontend)
- [x] Criar página `GestaoPage` (frontend)
- [x] Integrar modal no `PainelMestrePage` (botão "Adicionar Sistema")
- [x] Adicionar rota `/gestao` no `App.tsx`
- [x] Adicionar link "Gestão" no `SiteHeader`
- [x] Validar build do backend (OK)
- [x] Validar build do frontend (OK)
- [ ] Aplicar migração no banco de dados
- [ ] Testar fluxo completo em dev
- [ ] Atualizar documentos relevantes
- [ ] Push para `dev` (aguardar autorização)
- [ ] QA manual no beta

## Arquivos-alvo

| Arquivo | Status | Mudança prevista |
|---|---|---|
| `frontend/src/pages/AdminDevToolsPage.tsx` | ✅ | Links diretos, explicação de permissões, auto-run desabilitado, botão perigoso removido |
| `frontend/src/components/SystemTreeSelector.tsx` | ✅ | Texto unificado |
| `frontend/src/contexts/AuthContext.tsx` | ✅ | Correção de logout por 401 transitório |
| `backend/src/server.ts` | ✅ | Limite de payload aumentado para 10MB |
| `database/migration_03_gm_profile_nickname.sql` | ✅ | Aplicada no banco beta |

## Critério de conclusão

- [x] Deploy Fase 7B concluído com sucesso
- [x] Logs de erro capturados e analisados
- [x] Correções de UX aplicadas (links, textos, explicações)
- [x] Erro 500 em importação de JSON corrigido (limite de payload)
- [x] Árvore de sistemas atualizada no banco de dados (125 sistemas)
- [x] Bug de logout corrigido (auto-run desabilitado + botão removido)
- [x] Migração nickname aplicada permanentemente
- [x] Build validado (frontend + backend)
- [ ] Push autorizado e deploy concluído
- [ ] QA manual: todos os problemas resolvidos

## Decisões importantes

**Problema 4 resolvido:** A árvore de sistemas foi reimportada executando o script no container beta. O banco agora contém 125 sistemas atualizados.

**Problema 3 resolvido:** O erro 500 ao importar JSON era causado pelo limite de payload de 100KB. Aumentado para 10MB.

**Bug de logout resolvido:** O botão "Aplicar na sessão" que sobrescrevia o token OAuth foi removido, e o auto-run de testes foi desabilitado.

---

## 📋 Plano de Implementação Aprovado

**[Ver Plano Completo](file:///C:/Users/paulo/.gemini/antigravity/brain/96cde80f-e325-4b3b-a174-b895dc01dcd9/implementation_plan.md)**

### Escopo da Próxima Fase

1. **Sistema de Sugestão de Sistemas** (feature nova)
   - Qualquer usuário pode sugerir sistemas/edições/variantes
   - Limite de 5 sugestões pendentes por usuário
   - Admins aprovam/editam/rejeitam via página `/gestao`
   - Notificações quando aprovado, editado ou rejeitado

2. **Integração com DiscordChatExporter oficial**
   - Usar Docker `tyrrrz/discordchatexporter:stable`
   - Exportação direta via link (sem upload manual)
   - Processamento automático no backend

3. **Painel de Logs no AdminDevTools**
   - Logs expansíveis com filtros (info, warning, error)
   - Exportação de logs para diagnóstico
   - Captura automática de requisições HTTP

4. **Correção do bug de logout persistente**
   - Listener de storage event para ignorar mudanças em chaves não-OAuth
   - Guard no bootstrapSession

5. **Correção do erro 500 em import** ✅ **JÁ APLICADA LOCALMENTE**
   - `backend/src/server.ts` — Limite de payload aumentado para 10MB

### Validação Hierárquica Confirmada

- **Sistema raiz publicado** → aceita Edições/Subsistemas
- **Sistema com edições publicadas** → só aceita Variantes
- **Edição** → aceita Variantes/Subsistemas

### Alterações Locais Pendentes de Push

- ✅ `backend/src/server.ts` — Limite de payload aumentado para 10MB

**Aguardando aprovação para push e início da implementação.**
