# PLANO_REVISAO_DEPLOY.md

**Escopo:** CRUD de Sistemas + Notificações — revisão, validação e deploy  
**Data:** 2026-04-04  
**Regra:** Toda validação local e na VM vem ANTES de qualquer confirmação ao responsável.  
**Proibido:** push, merge, commit sem autorização explícita no chat.

---

## CONTEXTO DO QUE FOI IMPLEMENTADO

Sessão anterior implementou (não confirmado em produção):

| Arquivo | Tipo | Status declarado |
|---|---|---|
| `database/migration_06_system_suggestions.sql` | SQL | Aplicada no banco beta via SSH |
| `database/migration_07_notifications.sql` | SQL | Aplicada no banco beta via SSH |
| `backend/src/db/types.ts` | TS | Modificado |
| `backend/src/routes/system-suggestions.ts` | TS | Criado |
| `backend/src/routes/admin-system-suggestions.ts` | TS | Criado |
| `backend/src/routes/notifications.ts` | TS | Criado |
| `frontend/src/components/SystemSuggestionModal.tsx` | TSX | Criado |
| `frontend/src/pages/GestaoPage.tsx` | TSX | Criado |
| `frontend/src/components/NotificationBell.tsx` | TSX | Criado |
| `frontend/src/styles/suggestions.css` | CSS | Criado |
| `frontend/src/styles/notifications.css` | CSS | Criado |
| `frontend/src/App.tsx` | TSX | Modificado (rota /gestao) |
| `frontend/src/pages/PainelMestrePage.tsx` | TSX | Modificado (botão + modal) |
| `frontend/src/components/SiteHeader.tsx` | TSX | Modificado (NotificationBell) |

**Branches abertas sem merge (confirmar antes de tudo):**
- `feature/fix-json-import-token`
- `feature/fix-aggregator-auth`
- `feature/crud-sistemas-notificacoes`
- `feature/fix-systems-tree-regex`

---

## FASE 1 — LIMPEZA GIT (local, antes de qualquer código)

### 1.1 Corrigir email do Git
```powershell
git config --global user.email "54728622+FarenRavirar@users.noreply.github.com"
git config --global user.email  # confirmar
```

### 1.2 Remover lock file se existir
```powershell
Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
git status  # confirmar estado limpo
```

### 1.3 Mapear branches abertas
```powershell
git branch -a
git log dev..origin/feature/fix-json-import-token --oneline
git log dev..origin/feature/fix-aggregator-auth --oneline
git log dev..origin/feature/crud-sistemas-notificacoes --oneline
git log dev..origin/feature/fix-systems-tree-regex --oneline
```

**Para cada branch vazia ou irrelevante** — aguardar instrução do responsável antes de deletar.  
**Para `feature/crud-sistemas-notificacoes`** — é a branch de trabalho, verificar se os arquivos listados acima estão nela.

### 1.4 Confirmar branch atual
```powershell
git rev-parse --abbrev-ref HEAD  # deve estar em dev ou feature/crud-sistemas-notificacoes
git status                        # deve estar limpo ou só com os arquivos da implementação
```

---

## FASE 2 — REVISÃO LOCAL DOS ARQUIVOS

**Regra:** ler cada arquivo antes de validar. Não assumir que está correto porque foi "declarado como OK".

### 2.1 Backend — verificar existência e conteúdo mínimo

```powershell
# Verificar se os arquivos existem
Test-Path backend\src\routes\system-suggestions.ts
Test-Path backend\src\routes\admin-system-suggestions.ts
Test-Path backend\src\routes\notifications.ts
Test-Path database\migration_06_system_suggestions.sql
Test-Path database\migration_07_notifications.sql
```

**Para cada arquivo que existir, verificar:**

`backend/src/routes/system-suggestions.ts`:
- Rota `POST /` com validação de limite 5 pendentes
- Rota `GET /mine`
- Middleware `authMiddleware` aplicado

`backend/src/routes/admin-system-suggestions.ts`:
- Rota `GET /` com filtro por status
- Rota `PATCH /:id/approve` — cria sistema + cria notificação
- Rota `PATCH /:id/reject` — motivo obrigatório + cria notificação
- Rota `PATCH /systems/:id` — edita sistema publicado
- Middleware `requireRole('admin')` aplicado

`backend/src/routes/notifications.ts`:
- Rota `GET /`
- Rota `GET /unread-count`
- Rota `PATCH /:id/read`
- Rota `PATCH /read-all`
- Middleware `authMiddleware` aplicado

`backend/src/db/types.ts`:
- Interface `SystemSuggestionsTable` presente
- Interface `NotificationsTable` presente
- Ambas registradas na interface `Database`

### 2.2 Backend — verificar registro das rotas no server.ts

```powershell
Select-String -Pattern "system-suggestions|notifications|admin-system" backend\src\server.ts
```

Esperado:
- `/api/v1/system-suggestions` montado
- `/api/v1/admin/system-suggestions` montado
- `/api/v1/notifications` montado

### 2.3 Frontend — verificar existência e conteúdo mínimo

```powershell
Test-Path frontend\src\components\SystemSuggestionModal.tsx
Test-Path frontend\src\pages\GestaoPage.tsx
Test-Path frontend\src\components\NotificationBell.tsx
Test-Path frontend\src\styles\suggestions.css
Test-Path frontend\src\styles\notifications.css
```

`frontend/src/App.tsx`:
```powershell
Select-String -Pattern "gestao|GestaoPage" frontend\src\App.tsx
```

`frontend/src/components/SiteHeader.tsx`:
```powershell
Select-String -Pattern "NotificationBell" frontend\src\components\SiteHeader.tsx
```

`frontend/src/pages/PainelMestrePage.tsx`:
```powershell
Select-String -Pattern "SystemSuggestionModal|Adicionar Sistema" frontend\src\pages\PainelMestrePage.tsx
```

### 2.4 CSS — verificar imports

```powershell
Select-String -Pattern "suggestions.css" frontend\src\components\SystemSuggestionModal.tsx
Select-String -Pattern "suggestions.css" frontend\src\pages\GestaoPage.tsx
Select-String -Pattern "notifications.css" frontend\src\components\NotificationBell.tsx
```

### 2.5 Build local — o único critério objetivo

```powershell
# Backend
cd backend
npm run build
cd ..

# Frontend
cd frontend
npm run build
cd ..
```

**Se qualquer build falhar: parar. Ler o erro. Consultar ERRORS_SOLUTIONS.md. Corrigir. Não tentar em loop.**

---

## FASE 3 — VALIDAÇÃO NA VM

### 3.1 Confirmar que as tabelas existem no banco beta

> **E102/E103:** Não usar `\dt` via SSH no PowerShell — o backslash é consumido pelo PS antes de chegar ao bash remoto. Usar SQL puro. Adicionar `-o ControlMaster=no` se aparecer `getsockname failed`.

```powershell
ssh -F C:\projetos\config -o ControlMaster=no faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c `"SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('system_suggestions','notifications');`""
```

Esperado: duas linhas com `system_suggestions` e `notifications`.

> **Nota:** Segundo o `RESUMO_EXECUCAO.md`, as migrations 06 e 07 já foram aplicadas via SSH em 04/04/2026. Se as tabelas aparecerem, seguir para 3.2. Só aplicar abaixo se as tabelas **não** existirem.

Se não existirem — aplicar agora:

```powershell
# Copiar migrations para a VM
scp -F C:\projetos\config database\migration_06_system_suggestions.sql faren:/tmp/
scp -F C:\projetos\config database\migration_07_notifications.sql faren:/tmp/

# Aplicar via bash remoto (o < é interpretado pelo bash da VM, não pelo PowerShell)
ssh -F C:\projetos\config -o ControlMaster=no faren "docker exec -i mesas-beta-db psql -U admin -d mesas_rpg < /tmp/migration_06_system_suggestions.sql"
ssh -F C:\projetos\config -o ControlMaster=no faren "docker exec -i mesas-beta-db psql -U admin -d mesas_rpg < /tmp/migration_07_notifications.sql"
```

### 3.2 Confirmar estrutura das tabelas

```powershell
# SQL puro — não usar \d via SSH no PowerShell (E103)
ssh -F C:\projetos\config -o ControlMaster=no faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c `"SELECT column_name FROM information_schema.columns WHERE table_name='system_suggestions' ORDER BY ordinal_position;`""

ssh -F C:\projetos\config -o ControlMaster=no faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c `"SELECT column_name FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position;`""
```

Verificar em `system_suggestions`: `id`, `user_id`, `name`, `node_type`, `parent_id`, `description`, `aliases`, `status`, `reviewed_by`, `reviewed_at`, `rejection_reason`

Verificar em `notifications`: `id`, `user_id`, `type`, `title`, `message`, `link`, `read`, `created_at`

### 3.3 Stack beta respondendo

```powershell
curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
# Esperado: {"status":"ok","db":"connected"}
```

---

## FASE 4 — COMMIT E PUSH (aguarda autorização)

Só executar após:
- [ ] Fase 1 concluída (git limpo, email correto, branches mapeadas)
- [ ] Fase 2 concluída (todos os arquivos existem, builds OK)
- [ ] Fase 3 concluída (tabelas no banco, stack respondendo)
- [ ] Responsável autorizou explicitamente no chat

```powershell
# Verificar se há deleção de diretório ANTES do merge (E101 — trava no Windows)
git diff --name-status dev...feature/crud-sistemas-notificacoes | Select-String "^D"
# Se houver resultado com diretório: usar o caminho via PR abaixo, não o merge local

# Se NÃO houver deleção de diretório — merge local seguro
git checkout dev
git merge --squash feature/crud-sistemas-notificacoes
git commit -m "feat: CRUD de sistemas colaborativo + notificações in-app

- Sugestões de sistemas por mestres com validação hierárquica
- Aprovação/rejeição pelo admin com notificação automática
- Sino de notificações no header com polling de 30s
- Página de gestão administrativa em /gestao
- Migrações 06 (system_suggestions) e 07 (notifications)"

# Se houver deleção — usar PR (ver GIT_WORKFLOW.md seção 3b)
git push origin feature/crud-sistemas-notificacoes
gh pr create --base dev --head feature/crud-sistemas-notificacoes --title "feat: CRUD de sistemas + notificações" --body ""
gh pr merge <número> --squash --delete-branch
```

**Push para dev (dispara deploy automático):**
```powershell
# Somente após autorização explícita
git push origin HEAD:dev
```

---

## FASE 5 — VALIDAÇÃO PÓS-DEPLOY (na VM)

### 5.1 Confirmar deploy concluído

```powershell
gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
```

### 5.2 Verificar rotas na VM

```powershell
curl.exe https://mesasbeta.artificiorpg.com/api/v1/notifications/unread-count
# Esperado: 401 (não autenticado) — confirma que a rota existe

curl.exe -I https://mesasbeta.artificiorpg.com/api/v1/system-suggestions
# Esperado: 401
```

Se retornar 404: rota não foi registrada no server.ts — voltar para Fase 2.2.

### 5.3 Verificar logs da API

```powershell
ssh -F C:\projetos\config faren "docker logs --tail 50 mesas-beta-api"
```

Não deve haver erros de startup, TypeScript ou conexão com banco.

---

## FASE 6 — CONFIRMAÇÃO AO RESPONSÁVEL

Só comunicar ao responsável após Fases 1–5 concluídas com sucesso.

Relatório mínimo:
- Status de cada build (backend/frontend)
- Tabelas confirmadas no banco
- Rotas respondendo (401, não 404)
- Hash do commit mergeado em dev
- Status do run no GitHub Actions

---

## BLOQUEADORES CONHECIDOS

| Bloqueador | Impacto | Resolução |
|---|---|---|
| Lock file no git | Impede operações git | Fase 1.2 |
| Email errado no git | Commits misatribuídos | Fase 1.1 |
| Branches sem merge abertas | Confusão de estado | Fase 1.3 — aguardar instrução |
| Tabelas não existem no banco | Rotas 500 em produção | Fase 3.1 |
| Rotas não registradas no server.ts | 404 nas rotas novas | Fase 2.2 |
| Build falha | Não deployar com erro | Fase 2.5 — corrigir primeiro |

---

## ARQUIVOS DE DOCUMENTAÇÃO GERADOS PELA SESSÃO ANTERIOR (descartar)

Os arquivos abaixo foram criados pelo agente como "documentação" mas não pertencem ao projeto. Verificar se estão no repositório e remover antes do commit:

```
GUIA_TESTES_CRUD_SISTEMAS.md
COMO_APLICAR_MIGRACOES.md
revisao_crud_sistemas.md
revisao_final_crud_sistemas.md
REVISAO_FINAL_CHECKLIST.md
RESUMO_EXECUTIVO_FINAL.md
resumo_04-04_ag...or-json-split.md
```

```powershell
# Verificar se estão sendo rastreados
git status | Select-String "GUIA_TESTES|COMO_APLICAR|revisao_crud|REVISAO_FINAL|RESUMO_EXECUTIVO|resumo_04"

# Remover do tracking se necessário
git rm --cached GUIA_TESTES_CRUD_SISTEMAS.md
git rm --cached COMO_APLICAR_MIGRACOES.md
# etc.
```