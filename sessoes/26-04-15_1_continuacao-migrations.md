# Sessao: 14/04 - Commit e Push REQ-30 + migration_102 + Restauracao Beta + Auditoria Workflows

## Objetivo
Finalizar o envio das correcoes do REQ-30, restaurar o beta, corrigir workflows de deploy e completar a feature de sugestao/edicao de sistemas e cenarios com suporte a name_pt.

## Plano de Execucao
1. [x] Confirmar arquivos alterados
2. [x] Fazer commit com mensagem descritiva
3. [x] Obter autorizacao para push em dev
4. [x] Executar push para origin/dev
5. [x] Atualizar RESUMO_EXECUCAO.md
6. [x] Investigar queda do beta (mesasbeta.artificiorpg.com)
7. [x] Corrigir erros TypeScript que quebraram o build (E148 - build)
8. [x] Corrigir workflow deploy-beta.yml (TypeScript check antes do SSH + rollback)
9. [x] Registrar E148 no ERRORS_SOLUTIONS.md
10. [x] Auditar deploy-prod.yml e promote-to-prod.yml
11. [x] Corrigir deploy-prod.yml (TypeScript check + rollback + healthcheck healthy + VITE_API_URL)
12. [x] Corrigir promote-to-prod.yml (job typecheck + rollback + healthcheck + nome container mesas-app)
13. [x] Aplicar migration_102_add_name_pt.sql no banco beta (resolveu 500 em /systems e /scenarios)
14. [x] Diagnosticar lacunas na feature name_pt + sugestao de cenarios
15. [x] Implementar correcoes completas no codigo
16. [x] Aplicar migration_103_scenario_suggestions.sql no beta (executada e validada via information_schema)
17. [x] Corrigir conformidade de deploy com migrations (gates automáticos em beta/prod/promote)
18. [x] Consolidar frequência por sessão e remover legado de frequência global (runtime + schema + tipos)
19. [x] Diagnosticar e corrigir incidente E148: VITE_API_URL apontando para beta em producao — 15/04/2026
20. [x] Corrigir mensagem de erro de backend indisponivel no App.tsx (texto de atualizacao em andamento)
21. [x] Corrigir deploy-beta.yml: adicionar --no-cache ao docker compose build
22. [x] Atualizar OPERACAO_PRODUCAO.md: sleep 100 no procedimento de acompanhamento de deploy
23. [x] Obter autorizacao e executar commit + push origin/dev com os 27 arquivos pendentes
24. [x] Corrigir migration_101 (IF NOT EXISTS) e push adicional
25. [x] Aguardar deploy beta concluir (run 24434872861 - success)
26. [x] Validar que mesas aparecem no painel beta e producao (marcado por decisão explícita do responsável; validação manual visual não executada nesta sessão)
27. [x] Fechar pendencias documentais: RESUMO_EXECUCAO.md atualizado

---

## 🚨 PENDENCIAS ATUAIS (15/04/2026 01:31)

### Status consolidado

- [x] Deploy beta concluído com sucesso (`24434872861`)
- [x] Deploy produção concluído com sucesso (`24435297191`)
- [x] Build de produção sem `t.frequency` / `t.frequency_custom` (apenas `price_frequency`)
- [x] Gate de migration executado em produção (`apply_required_migrations.sh` + `schema em conformidade`)
- [x] Schema de produção validado:
  - `system_suggestions.name_pt` presente
  - `scenario_suggestions` presente

### Pendências remanescentes (reais)

- [x] Validacao funcional manual no browser (dispensada por decisão explícita do responsável nesta sessão):
  - `https://mesasbeta.artificiorpg.com/painel`
  - `https://mesas.artificiorpg.com/painel`
- [x] migration_104 (DROP `tables.frequency` / `tables.frequency_custom`) concluída em beta e produção (validação 15/04/2026 01:31):
  - beta: `frequency_cols=0` e `migration104_applied=yes`
  - produção: `frequency_cols=0` e `migration104_applied=yes`

---

## Criterio de Conclusao desta Sessao

A sessão está fechada quando:
1. Deploy beta e produção concluídos (já concluído)
2. Validação funcional no browser confirmada pelo usuário (dispensada por decisão explícita nesta sessão)
3. Decision point da migration_104 manual registrada (concluído)

---

## Proximos Passos (em ordem)

1. Sessão sem pendências técnicas remanescentes
2. Próxima ação depende de priorização do responsável no backlog
3. Manter evidências desta sessão como base de continuidade

## Implementacoes concluídas nesta etapa

### Frontend
- [x] `frontend/src/components/SystemEditModal.tsx`
  - Campo `name_pt` no formulario admin (criar/editar)
  - Envio de `name_pt` no body
- [x] `frontend/src/components/ScenarioEditModal.tsx`
  - Campo `name_pt` no formulario admin (criar/editar)
  - Envio de `name_pt` no body
- [x] `frontend/src/components/SystemSuggestionModal.tsx`
  - Campo `name_pt` para sugestao
  - Substituicao de UUID bruto por seletor de sistema pai
- [x] `frontend/src/components/ScenarioSuggestionModal.tsx` (novo)
  - Modal de sugestao de cenario para mestres
- [x] `frontend/src/components/form-steps/steps/StepSystem.tsx`
  - Botao `+ Sugerir Cenario`
  - Integracao do `ScenarioSuggestionModal`
  - Refresh da lista de cenarios apos sugestao
- [x] `frontend/src/modules/admin/systems/types.ts`
  - Tipo atualizado com `name_pt`

### Backend
- [x] `backend/src/routes/systemSuggestions.ts`
  - Persistencia de `name_pt` em sugestoes de sistema
- [x] `backend/src/routes/scenarioSuggestions.ts` (novo)
  - `POST /api/v1/scenario-suggestions`
  - `GET /api/v1/scenario-suggestions/mine`
  - Limite de 5 pendentes por usuario
- [x] `backend/src/server.ts`
  - Registro da nova rota `/api/v1/scenario-suggestions`
- [x] `backend/src/db/types.ts`
  - `name_pt` em `SystemSuggestionsTable`
  - nova `ScenarioSuggestionsTable`

### Banco
- [x] `database/migration_103_scenario_suggestions.sql` (nova)
  - `ALTER TABLE system_suggestions ADD COLUMN IF NOT EXISTS name_pt TEXT`
  - `CREATE TABLE scenario_suggestions (...)`
  - indices de apoio

### Documentacao de contrato
- [x] `MAPA_DE_API.md`
  - `POST /system-suggestions` marcado como em uso
  - secao `SCENARIOSUGGESTIONS` adicionada

## Validacao tecnica
- [x] Frontend typecheck: `npx tsc --noEmit` (OK)
- [x] Backend typecheck/build: `npm run build` (OK)
- [x] Schema beta validado: `system_suggestions.name_pt` e `scenario_suggestions` presentes
- [x] Schema prod auditado: `systems/scenarios.name_pt` presentes; `system_suggestions.name_pt` e `scenario_suggestions` ausentes antes das novas gates
- [x] Validacao sintatica do script no servidor remoto
  - evidência: `bash -n /opt/mesas-beta/scripts/deploy/apply_required_migrations.sh` => `SYNTAX_OK_BETA`
  - evidência: `bash -n /opt/mesas/scripts/deploy/apply_required_migrations.sh` => `SYNTAX_OK_PROD`

## Pendencias
- [x] Validacao funcional no beta com fluxo mestre (encerrada por decisão do responsável):
  - [x] sugerir sistema com `name_pt`
  - [x] sugerir cenario com `name_pt`
  - [x] confirmar persistencia no banco
  - observação: encerrado a pedido do responsável sem coleta de evidência SQL final nesta etapa

## Criterio de conclusao
Migration_103 aplicada no beta + sessão encerrada por decisão do responsável.

## Atualizacao RESUMO_EXECUCAO.md
- [x] Atualizar resumo final com status da migration_103 aplicada e estado do gate de migrations

## Correcoes de conformidade de migration implementadas
- [x] Novo script: `scripts/deploy/apply_required_migrations.sh`
  - cria/usa tabela `schema_migrations`
  - separa migrations `ONLINE_SAFE_MIGRATIONS` e `MANUAL_RISK_MIGRATIONS`
  - aplica apenas migrations pendentes (nao reaplica as ja registradas)
  - limite de pendencias automaticas via `MAX_AUTO_PENDING` (default: 5)
  - timeouts de banco via `lock_timeout` e `statement_timeout`
  - bloqueia deploy automatico se detectar SQL destrutivo em migration online-safe
  - exige backup em producao para migrations de risco quando `ALLOW_MANUAL_MIGRATIONS=true`
  - valida schema minimo esperado (`system_suggestions.name_pt` e `scenario_suggestions`)
- [x] `deploy-beta.yml` executa gate de migration antes do healthcheck da aplicacao
- [x] `deploy-prod.yml` executa gate de migration antes de subir API/frontend
- [x] `promote-to-prod.yml` executa gate de migration durante etapa deploy

## Documentacoes atualizadas para agentes futuros
- [x] `PRE_DEPLOY_CHECKLIST.md`
  - inclui checkpoints obrigatorios de classificacao de migrations e evidencia do gate no run
  - corrige referencia de workflow para `deploy-prod.yml`
- [x] `OPERACAO_PRODUCAO.md`
  - adiciona fluxo operacional com gate de migration (beta/producao)
  - registra regras do `apply_required_migrations.sh` e execucao controlada de migration de risco
- [x] `ERRORS_SOLUTIONS.md`
  - novo incidente `E149` (validacao bash indisponivel no Windows sem WSL)
- [x] `BACKLOG_OPERACIONAL.md`
  - REQ-31 atualizado para `Em validacao beta` com pendencia de run real
- [x] `FILA_IMPLEMENTACAO.md`
  - item 143 atualizado para `em_validacao` com observacao de cobertura via gate 102/103
- [x] `RESUMO_EXECUCAO.md`
  - estado canonico atualizado para sessao atual de hardening de migrations

## Plano de continuidade (recuperacao de contexto)

### Sequencia obrigatoria
1. [x] Passo 1 — Validar gate em run real no beta (`deploy-beta.yml`)
   - [x] Identificar run mais recente de `Deploy Beta` em `dev` (run id: `24430250563`, status: success)
   - [x] Confirmar evidencias no log:
     - [x] execucao de `apply_required_migrations.sh`
     - [x] linha `[migrations] schema em conformidade para runtime.`
   - [x] Evidencias coletadas:
     - `gh run view 24430250563 --log` contém:
       - `bash ./scripts/deploy/apply_required_migrations.sh docker-compose.beta.yml mesas-beta-db`
       - `out: [migrations] schema em conformidade para runtime.`
     - `ssh ... /opt/mesas-beta`: `HEAD=f0f68cb` e `SCRIPT=present`
2. [x] Passo 2 — Confirmar schema pos-run no beta
   - [x] `system_suggestions.name_pt` presente
   - [x] tabela `scenario_suggestions` presente
   - [x] Evidencia SQL coletada via SSH:
     - retorno `name_pt`
     - retorno `scenario_suggestions`
3. [x] Passo 3 — Validar execucao em producao (`deploy-prod.yml` / `promote-to-prod.yml`)
   - [x] backup confirmado conforme `PRE_DEPLOY_CHECKLIST.md`
     - evidência: `/tmp/backup_20260415_005037_pre_deploy.sql` (384K)
   - [x] preparacao de promocao concluida
     - PR `dev -> main` aberto e mesclado: `https://github.com/FarenRavirar/mesas_rpg_artificio/pull/56`
     - merge commit: `6b03565a2eb130c6fa2be25e857a7fbe27cd594e`
   - [x] evidencia do gate no log de producao
     - run válido com success após correções: `24435297191` (`Deploy Production`)
     - evidência de execução do script: `apply_required_migrations.sh`
     - evidência de conformidade: `[migrations] schema em conformidade para runtime.`
4. [x] Passo 4 — Confirmar schema pos-run em producao
   - [x] `system_suggestions.name_pt` presente
   - [x] tabela `scenario_suggestions` presente
5. [x] Passo 5 — Fechamento documental final
   - [x] atualizar `BACKLOG_OPERACIONAL.md` (REQ-31)
   - [x] atualizar `FILA_IMPLEMENTACAO.md` (item 143)
   - [x] atualizar `RESUMO_EXECUCAO.md` e este arquivo de sessao com evidencias finais

6. [x] Passo 6 — Tratar feedback de review automatizado (Amazon/Codex)
   - [x] aplicar ajuste de seguranca SQL no `apply_required_migrations.sh`
     - escopo aplicado: `is_applied()` + inserts em `schema_migrations`
     - status: vulnerabilidade de interpolacao direta mitigada
   - [x] avaliar pendencias P1 fora do escopo deste passo
     - [x] incluir `migration_101_add_banner_crop_data.sql` no gate automatico
       - evidência: `ONLINE_SAFE_MIGRATIONS` atualizado no `apply_required_migrations.sh`
     - [x] revalidar envio de `schedules[*].frequency` no mapper frontend
       - evidência: `formStateToPayload()` envia `frequency` + `slots_per_session` em `schedules[]`
       - arquivos: `frontend/src/features/create-table/utils/mapper.ts`, `SessionRepeater.tsx`, `useCreateTableForm.ts`, `mapTableApiToInitialData.ts`
     - [x] proteger endpoint upload com autenticacao + limites de arquivo
       - evidência: `backend/src/routes/upload.ts` com `authMiddleware`, `limits.fileSize=5MB`, `fileFilter` MIME, rota `POST /upload`
       - frontend alinhado para `/api/v1/upload` em `ImageUploader.tsx` e `AvatarUploader.tsx`
       - validação: `npx tsc --noEmit` (frontend e backend) sem erros

7. [x] Passo 7 — Consolidacao de frequencia por sessao (solicitacao do produto)
   - [x] remover frequencia global da mesa no runtime (frontend/backend)
     - removido `tables.frequency` / `tables.frequency_custom` de payloads, validacoes e responses principais
     - mantida fonte unica em `table_schedules.frequency`
   - [x] ajustar UI de sessoes para frequencia por item
     - `SessionRepeater.tsx` com seletor de frequencia por sessao
     - `StepSessions.tsx` sem bloco de frequencia global duplicado
   - [x] criar limpeza estrutural de schema
     - novo arquivo `database/migration_104_drop_tables_frequency_columns.sql`
     - `ALTER TABLE tables DROP COLUMN IF EXISTS frequency, DROP COLUMN IF EXISTS frequency_custom`
   - [x] alinhar contrato de tipos do banco
     - `backend/src/db/types.ts` sem `frequency` e `frequency_custom` em `TablesTable`
   - [x] classificar migration 104 como manual/risk no gate
     - `scripts/deploy/apply_required_migrations.sh` atualizado em `MANUAL_RISK_MIGRATIONS`
   - [x] validar tipagem e rastros
     - `npx tsc --noEmit` backend/frontend sem erro
     - busca runtime por `frequency_custom` sem ocorrencias

### Evidencias minimas para concluir
- [x] ID do run beta validado
- [x] trecho de log com gate confirmado
- [x] resultado de verificacao de schema beta
- [x] ajuste SQL do review Amazon/Codex aplicado
- [x] ID do run de producao validado (`24435297191`)
- [x] resultado de verificacao de schema producao (`name_pt`, `scenario_suggestions`)
- [x] variaveis Cloudinary aplicadas em producao (`VITE_CLOUDINARY_CLOUD_NAME=present`, `VITE_CLOUDINARY_UPLOAD_PRESET=present`)

## Passo 8 - Incidente E148: VITE_API_URL errado em producao (15/04/2026)

### Sintoma
- `https://mesas.artificiorpg.com` exibia tela "Backend nao disponivel" mesmo com todos os containers `healthy`

### Causa raiz
- `/opt/mesas/.env` tinha `VITE_API_URL=https://mesasbeta.artificiorpg.com` (copiado do beta sem ajuste)
- Frontend buildado com essa URL fazia healthcheck contra o beta, nao contra producao

### Correcao executada
- [x] Corrigido `/opt/mesas/.env`: `VITE_API_URL=https://mesas.artificiorpg.com`
- [x] Rerun do `Deploy Production` (run `24430796276`, tentativa 4) - status: **success**
- [x] Validacao pos-deploy: `docker exec mesas-app wget -qO- http://127.0.0.1:80/api/v1/health` retornou `{"status":"ok","environment":"production",...}`
- [x] Incidente registrado em `ERRORS_SOLUTIONS.md` como **E148** (novo ID)

## Passo 9 - Incidente publish 405: endpoint sem /api/v1 (15/04/2026)

### Sintoma
- Ao publicar mesa no beta: `POST https://mesasbeta.artificiorpg.com/gm/tables 405 (Method Not Allowed)`

### Causa raiz
- `frontend/src/features/create-table/hooks/useCreateTableForm.ts` enviava submit para `${API_BASE}/gm/tables` e `${API_BASE}/gm/tables/:id`
- O backend expõe as rotas em `/api/v1/gm/tables`

### Correcao executada
- [x] Endpoint corrigido para `${API_BASE}/api/v1/gm/tables` e `${API_BASE}/api/v1/gm/tables/:id`
- [x] Changelog consolidado de 15/04 atualizado com a correção de publicação
- [x] Commit `d59945f` em `dev`
- [x] Deploy beta run `24435524262` concluído com `success`
- [x] PR `#61` (`dev -> main`) aberto e mesclado para promover correção
- [x] Deploy produção run `24435590034` concluído com `success`
