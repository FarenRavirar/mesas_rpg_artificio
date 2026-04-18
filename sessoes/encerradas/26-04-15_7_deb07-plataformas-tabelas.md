# 26-04-15_7_deb07-plataformas-tabelas.md

## Cabeçalho
- **Data:** 15/04/2026 17:11 BRT
- **Objetivo:** Diagnosticar o estado real do item **DEB-07 ↔ FILA 075** (plataformas como tabelas), mapear lacunas de implementação no backend/frontend/MAPA_DE_API e definir plano de execução para fechamento completo.

## Vínculos
- **Sessão anterior:** `26-04-15_6_auditoria-completa-fila-backlog.md`
- **Próxima sessão:** manter nesta mesma sessão (`26-04-15_7_deb07-plataformas-tabelas.md`) até fechamento do escopo.

## Diagnóstico consolidado

### 1) Escopo canônico (BACKLOG/FILA)
- **DEB-07 (BACKLOG):** falta `CRUD admin` para `vtt_platforms` e falta `communication_platforms` como tabela com endpoints.
- **FILA 075:** confirma o mesmo escopo e aponta que `tables.communication_platform` ainda está texto.

### 2) Estado atual confirmado no código
- [x] Existe `GET /api/v1/vtt-platforms`.
- [x] Existe `POST /api/v1/vtt-platforms/suggest` autenticado.
- [x] Fluxo GM já usa `vtt_platform_id` (slug no payload, convertido para UUID no backend).
- [x] Formulário frontend já consome VTT por hook (`useVttPlatforms`) e renderiza seletor dinâmico.
- [x] Campo `communication_platform` existe no payload e no `tables` (texto livre).

### 3) Lacunas para fechar DEB-07
- [x] **CRUD admin de VTT** (`GET/POST/PUT/DELETE /admin`) com proteção de role.
- [x] **Tabela `communication_platforms`** no schema versionado do repositório.
- [x] **Endpoints de comunicação** (`GET` público + `GET/POST/PUT/DELETE` admin).
- [x] **Migração de contrato** de `tables.communication_platform` (texto) para referência estruturada (FK/objeto) com compatibilidade.
- [x] **MAPA_DE_API atualizado** na seção de VTT e comunicação com consumidores reais do frontend.

### 4) Riscos identificados (com severidade)
- **SEV-MÉDIA — Regressão em dados legados:** create/edit/list/detail ainda exige validação manual ponta a ponta para mesas com `communication_platform` texto antigo.
- **SEV-MÉDIA — Estado de produção não validado nesta sessão:** mudanças foram validadas por type-check; falta validação operacional E2E no ambiente beta.
- **SEV-BAIXA — Divergência documental futura:** se novos endpoints/admin consumers mudarem sem atualizar `MAPA_DE_API.md`, reaparece drift de contrato.

## Plano de execução (ordem de implementação)
1. **Congelar contrato alvo (backend + frontend):** definir `communication_platform_id` como campo principal e manter compat temporária com `communication_platform` legado durante transição.
2. **Schema idempotente:** criar migration para `communication_platforms` + coluna FK em `tables` + índices + backfill a partir do texto legado.
3. **Backend VTT admin:** expandir `routes/vttPlatforms.ts` com `POST /admin`, `PUT /admin/:id`, `DELETE /admin/:id` (auth + role admin).
4. **Backend comunicação:** criar `routes/communicationPlatforms.ts` com `GET /` público e `POST/PUT/DELETE /admin`.
5. **Validação e service layer:** adicionar validação de `communication_platform_id` no `tableValidators.ts` e validação de existência no service.
6. **Fluxo GM (create/edit/list/detail):** persistir referência de comunicação e retornar objeto normalizado para frontend, preservando fallback legado.
7. **Frontend formulário:** substituir input livre de comunicação por seletor dinâmico (com opção personalizada controlada, se necessário).
8. **Frontend admin:** incluir CRUD visual para VTT e comunicação no painel de gestão.
9. **MAPA_DE_API.md:** atualizar status real de VTT + adicionar seção de comunicação + consumidores frontend.
10. **Fechamento de item:** atualizar FILA/BACKLOG de `⏳ Parcial` para concluído apenas após validação ponta a ponta.

## Execução implantada nesta sessão (frontend + backend)
- [x] Criado hook `frontend/src/hooks/useCommunicationPlatforms.ts` para consumo de `GET /api/v1/communication-platforms`.
- [x] `StepConfig.tsx` migrado para `select` dinâmico de comunicação + opção `custom` + campo obrigatório condicional.
- [x] `StepConfig.tsx` recebeu normalização de `vttPlatformId` (UUID -> slug) para edição de mesas legadas sem quebra de pré-seleção.
- [x] `CreateTableForm.tsx` atualizado para passar `communicationPlatformId` e `communicationPlatformCustom` ao `StepConfig`.
- [x] `mapper.ts` atualizado para enviar `communication_platform_id` e fallback `communication_platform` apenas quando `custom`.
- [x] `mapTableApiToInitialData.ts` atualizado para preencher estado novo (`communicationPlatformId`/`communicationPlatformCustom`) com compatibilidade de dados legados.
- [x] `validation.ts` atualizado com validação condicional para `custom` (VTT e comunicação).
- [x] `backend/src/routes/vttPlatforms.ts` expandido com CRUD administrativo completo (`GET/POST/PUT/DELETE /admin`) com `authMiddleware + requireRole('admin')`.
- [x] `frontend/src/modules/admin/platforms/PlatformsPage.tsx` criado para gestão de plataformas VTT e comunicação (listar, buscar, criar, editar, ativar/desativar, excluir).
- [x] `frontend/src/pages/GestaoPage.tsx` integrado com subaba **Plataformas** para operar o novo módulo administrativo.
- [x] Type-check executado em `backend` e `frontend` com `npx tsc --noEmit` sem erros.
- [x] Atualizada documentação operacional (`MAPA_DE_API.md`, FILA/BACKLOG) para refletir status atual do código.

## Execução complementar — logos VTT em superfícies estratégicas
- [x] Criada `database/migration_106_vtt_logo_filenames.sql` para vincular `logo_filename` em `vtt_platforms` por `slug` de forma idempotente.
- [x] Confirmado diretório `frontend/public/vtt-logos/` com 9 logos utilizáveis + `README.md`.
- [x] `backend/src/routes/gmPanel.ts` atualizado para incluir join com `vtt_platforms` e retornar objeto `vtt_platform` no `GET /api/v1/gm/tables`.
- [x] `frontend/src/components/TableCard.tsx` atualizado para exibir **somente logo** da VTT (online/híbrida) no card público/homepage, com fallback de erro sem badge vazio.
- [x] `frontend/src/components/TableCardDashboard.tsx` atualizado para exibir **somente logo** da VTT no card do painel, com fallback de erro sem badge vazio.
- [x] `frontend/src/features/table/components/TableHero.tsx` atualizado para considerar `hibrida` além de `online` na exibição de VTT (logo + nome).
- [x] `MAPA_DE_API.md` revisado para refletir payload real de `vtt_platform` (incluindo `logo_filename`) em `/api/v1/tables` e `/api/v1/gm/tables`, além de campos de comunicação resolvidos.
- [x] `ARQUITETURA_PROJETO.md` revisado em §§4, 12 e 16 para documentar `vtt_platforms`, `communication_platforms`, campos estruturados em `tables` e regras de renderização de logos por superfície.
- [x] Build de validação executado com sucesso: `backend` (`npm run build`) e `frontend` (`npm run build`).
- [x] `migration_106` aplicada no banco beta e validada com `SELECT slug, logo_filename FROM vtt_platforms ORDER BY slug;`.
- [x] Gate de deploy atualizado: `migration_105_communication_platforms.sql` e `migration_106_vtt_logo_filenames.sql` classificadas em `ONLINE_SAFE_MIGRATIONS`.
- [x] Entrada obrigatória de mudança visível adicionada em `database/changelogs.json` (`2026-04-15-plataformas-online-e-logos`).
- [x] Deploy beta executado pela branch `dev` com sucesso (run `24483615951`) e evidência de gate: `[migrations] schema em conformidade para runtime.`.
- [x] Pós-deploy validado: homepage beta HTTP `200`, health `{"status":"ok","environment":"beta","db":"connected","usersSampled":true}` e `schema_migrations` contendo `migration_105`/`migration_106`.
- [x] Correção CSS aplicada em `frontend/src/components/TableCard.tsx` para evitar clipping do título quando badges superiores ocupam largura excessiva.
- [x] Promoção para produção executada com sucesso via `promote-to-prod.yml` (run `24489704489`, versão `v1.1.1`).
- [x] Pós-deploy de produção validado: `https://mesas.artificiorpg.com/` HTTP `200`, `GET /api/v1/health` com `{"status":"ok","environment":"production","db":"connected","usersSampled":true}` e servidor em `/opt/mesas` no commit `12261cc`.
- [x] Validação manual beta (create/edit/list/detail com dados legados de comunicação) concluída.

## Checklist da sessão
- [x] Ler `RESUMO_EXECUCAO.md`
- [x] Ler `AGENTS.md`
- [x] Confirmar escopo no `BACKLOG_OPERACIONAL.md` (DEB-07)
- [x] Confirmar escopo técnico na `FILA_IMPLEMENTACAO.md` (075)
- [x] Auditar `MAPA_DE_API.md`
- [x] Auditar backend (`routes`, `services`, `validators`, `db/types`)
- [x] Auditar frontend (hook e formulário de criação)
- [x] Revisar `ARQUITETURA_PROJETO.md` (modelo de dados, contratos de API e seção de imagens estáticas/logos VTT)
- [x] Implementar integração frontend do seletor de comunicação (hook + StepConfig + mapper + validação)
- [x] Implementar migration de comunicação + compatibilidade
- [x] Implementar CRUD admin VTT
- [x] Implementar CRUD comunicação
- [x] Integrar frontend admin
- [x] Atualizar `MAPA_DE_API.md`
- [x] Atualizar status FILA/BACKLOG
- [x] Criar migration de vínculo de logos VTT (`migration_106`)
- [x] Atualizar backend listagem GM com payload `vtt_platform`
- [x] Exibir logo VTT no catálogo/homepage (`TableCard`)
- [x] Exibir logo VTT no painel (`TableCardDashboard`)
- [x] Ajustar `TableHero` para online/híbrida com VTT
- [x] Validar build backend/frontend
- [x] Classificar `migration_105` e `migration_106` no gate de deploy
- [x] Adicionar changelog obrigatório para mudança visível
- [x] Aplicar `migration_106` no banco
- [x] Executar deploy beta via `dev`
- [x] Validar health do beta (`/` e `/api/v1/health`)
- [x] Validar registro de `migration_105`/`migration_106` em `schema_migrations`
- [x] Corrigir CSS de clipping do título no card público (`TableCard`)
- [x] Executar promoção para produção (`promote-to-prod.yml`, `v1.1.1`)
- [x] Validar produção pós-deploy (`/`, `/api/v1/health`, commit em `/opt/mesas`)
- [x] Validar fluxo create/edit/list/detail com dados legados
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `index.md`

## Arquivos que serão modificados (planejado)
- `database/migration_105_communication_platforms.sql` (novo)
- `database/migration_106_vtt_logo_filenames.sql` (novo)
- `backend/src/routes/vttPlatforms.ts`
- `backend/src/routes/communicationPlatforms.ts` (novo)
- `backend/src/server.ts`
- `backend/src/services/tableService.ts`
- `backend/src/validators/tableValidators.ts`
- `backend/src/routes/gmPanel.ts`
- `backend/src/routes/tables.ts`
- `backend/src/db/types.ts`
- `frontend/src/components/form-steps/steps/StepConfig.tsx`
- `frontend/src/features/create-table/components/CreateTableForm.tsx`
- `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
- `frontend/src/features/create-table/utils/mapper.ts`
- `frontend/src/features/create-table/utils/mapTableApiToInitialData.ts`
- `frontend/src/features/create-table/utils/validation.ts`
- `frontend/src/hooks/useCommunicationPlatforms.ts` (novo)
- `frontend/src/modules/admin/platforms/PlatformsPage.tsx` (novo)
- `frontend/src/pages/GestaoPage.tsx`
- `frontend/src/components/TableCard.tsx`
- `frontend/src/components/TableCardDashboard.tsx`
- `frontend/src/features/table/components/TableHero.tsx`
- `MAPA_DE_API.md`
- `ARQUITETURA_PROJETO.md`
- `FILA_IMPLEMENTACAO.md`
- `BACKLOG_OPERACIONAL.md`
- `scripts/deploy/apply_required_migrations.sh`
- `database/changelogs.json`

## Critério de conclusão explícito
1. CRUD admin de VTT funcional e protegido por role.
2. `communication_platforms` criado por migration versionada e idempotente.
3. API de comunicação com `GET` público + `POST/PUT/DELETE` admin.
4. Fluxo de criação/edição de mesa usando referência estruturada sem quebrar dados legados.
5. `MAPA_DE_API.md` refletindo endpoints e status reais.
6. Item `075/DEB-07` sem status parcial em FILA/BACKLOG.
7. `migration_106_vtt_logo_filenames.sql` aplicada e validada com `SELECT slug, logo_filename FROM vtt_platforms ORDER BY slug;`.
8. Exibição de logo VTT confirmada no catálogo/homepage, painel e página da mesa.
9. `MAPA_DE_API.md` e `ARQUITETURA_PROJETO.md` refletindo o contrato real de payload/rotas da feature de logos VTT.
10. Deploy beta concluído com sucesso para `dev` e evidência do gate de migrations registrada.
11. Promoção para produção concluída com sucesso para `main`, com verificação de health e commit do servidor de produção.
