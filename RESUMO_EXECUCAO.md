# RESUMO_EXECUCAO.md

> **Primeiro arquivo a ser lido em qualquer sessão.** Reflete o estado real do projeto.
> Atualizar obrigatoriamente ao final de cada sessão (ver §Protocolo de Fechamento).

---

## Identidade do Projeto

| Parâmetro | Valor |
|---|---|
| **Repositório local** | `mesas_rpg_artificio` — `C:\projetos\mesas_rpg_artificio` |
| **Beta** | `mesasbeta.artificiorpg.com` → branch `dev` → `/opt/mesas-beta/` |
| **Produção** | `mesas.artificiorpg.com` → branch `main` → `/opt/mesas/` (não publicada) |
| **Stack** | React 19/TS + Node.js/TS + PostgreSQL + Docker Compose + VM Oracle |
| **SSH** | `ssh -F C:\projetos\config faren` |

---

## Documentos de Gestão

| Documento | Propósito | Quando Consultar |
|---|---|---|
| `AGENTS.md` | Governança de agentes — regras, protocolos, checklists | Início de sessão, dúvidas de governança |
| `ARQUITETURA_PROJETO.md` | Arquitetura, contratos, modelo de dados, decisões técnicas | Antes de modificar código |
| `GUIA_RAPIDO_OPERACIONAL.md` | Índice rápido de roteamento por cenário | Roteamento rápido antes de abrir canônicos |
| `TODO_OPERACIONAL.md` | Backlog de requisitos (REQ-xx) com score GUT | Planejamento de features, priorização |
| `FILA_IMPLEMENTACAO.md` | Fila técnica de execução por lote/fase | Durante execução de lote, antes de deploy |
| `ERRORS_SOLUTIONS.md` | Erros conhecidos e soluções validadas | Ao primeiro sinal de erro |
| `GIT_WORKFLOW.md` | Fluxo de Git, merge, deploy | Qualquer operação Git |
| `OPERACAO_PRODUCAO.md` | Operação de beta e produção | Deploy, troubleshooting de ambiente |
| `ambiente_atual_mesas.md` | Snapshot técnico de infraestrutura | Auditoria técnica, validação de deploy |
| `/sessoes/` | Registro histórico de sessões anteriores | Dúvidas sobre decisões passadas |

---

## Regras de Operação

| Regra | Valor |
|---|---|
| Push para `dev` ou `main` | Somente com autorização explícita no chat |
| Commit sem autorização | Proibido |
| Novo túnel Cloudflare | Proibido |
| Deploy manual na VM | Proibido |
| `cover_deletehash` / `avatar_deletehash` / `banner_deletehash` em rota pública | Proibido |
| Upload ou processamento de imagem no frontend | Proibido |
| `path_slug` canônico para DDAL | `dungeons-dragons/5e/2024` |
| Nome do banco PostgreSQL | `mesas_rpg` (nunca `mesas` — ver E059) |
| Idioma de toda comunicação | Português |

---

## Procedimento de Migrations (Recorrente)

> **Aplicar sempre que houver nova migration em `/database/migration_XX_*.sql`**

### Passo 1 — Validar credenciais do banco

```bash
# Confirmar credenciais em runtime
docker exec mesas-beta-db env | grep POSTGRES
```

**Esperado:**
- `POSTGRES_USER=admin`
- `POSTGRES_DB=mesas_rpg`

### Passo 2 — Aplicar migration no beta

```bash
# Método 1: Via cat + pipe (recomendado para migrations grandes)
cat database/migration_XX_nome.sql | docker exec -i mesas-beta-db psql -U admin -d mesas_rpg

# Método 2: Via docker exec direto (para migrations pequenas)
docker exec -i mesas-beta-db psql -U admin -d mesas_rpg < database/migration_XX_nome.sql
```

### Passo 3 — Validar aplicação

```bash
# Acessar psql interativo
docker exec -it mesas-beta-db psql -U admin -d mesas_rpg

# Verificar tabelas criadas
\dt

# Verificar colunas de uma tabela específica
\d nome_da_tabela

# Sair
\q
```

### Passo 4 — Atualizar RESUMO_EXECUCAO.md

Adicionar entrada na seção "Estado das Migrations (Beta)" com:
- Nome da migration
- Descrição breve
- Status: ✅ aplicada (DD/MM/AAAA)

### Troubleshooting

**Erro: `FATAL: database "mesas" does not exist`**
- Causa: Nome do banco incorreto
- Solução: Usar `-d mesas_rpg` (não `-d mesas`)
- Ver também: `ERRORS_SOLUTIONS.md` E059

**Erro: `permission denied`**
- Causa: Usuário sem permissão
- Solução: Usar `-U admin` (não `-U postgres`)

**Erro: `relation already exists`**
- Causa: Migration já foi aplicada
- Solução: Verificar se a tabela/coluna já existe antes de aplicar

---

## Estado das Migrations (Beta)

| Migration | Descrição | Status |
|---|---|---|
| migration_02 | Taxonomia + DDAL no banco | ✅ aplicada |
| migration_04 | Publisher role + contatos (REQ-11/REQ-12) | ✅ aplicada |
| migration_05 | Aggregator Discord — fontes, fila bruta, candidatos | ✅ aplicada (04/04/2026) |
| migration_06 | `system_suggestions` | ✅ aplicada (04/04/2026) |
| migration_07 | `notifications` + Parser Fase B — 15 colunas + 9 índices em `aggregator_import_candidates` | ✅ aplicada (05/04/2026) |
| migration_09 | Campos `frequency`, `frequency_custom`, `rules_notes`, `banner_url` em `tables` | ✅ aplicada (04/04/2026) |
| migration_10 | `is_covil`, `imported_expires_at` em `tables` + CleanupWorker | ❌ pendente |
| migration_14 | Sistema completo de perfil — `auth_providers`, `player_profiles`, `user_systems`, campos Discord em `gm_profiles` | ✅ aplicada (06/04/2026) |

---

## Estado de Execução — Itens Técnicos

| Item | Descrição | Status | Próxima ação |
|---|---|---|---|
| 017A | `systemsTreeImport` via `sistemas.json` | ✅ executado (132 nós, 280 aliases) | Dockerfile atualizado — cópia automática no build (fix permanente aplicado) |
| 021A | Selos DDAL/Covil — backend + frontend | ✅ deployado e funcional no beta | — |
| 021B | AppShell global | ✅ concluído | Validar smoke visual no beta |
| 022 | Endpoints GM autenticados | ✅ deployado e funcional no beta | — |
| 023 | `npm run build` backend | ✅ exit code 0, sem erros de tipo | — |
| 024 | `npm run build` frontend | ✅ 1746 módulos, dist/ ok | — |
| 026 | REQ-11 + REQ-12 fullstack (publisher role + contatos) | ✅ deployado em `dev`/beta | QA E2E de anunciante + contatos obrigatórios |
| Fase 7 | Aggregator Discord — pipeline completo | ✅ backend + migration aplicada | QA manual: criar source, importar JSON, revisar candidatos, validar `/admin/devtools` |
| Fase 7B | `TableOrigin` + expiração + AdminDevToolsPage | ✅ deployado em `dev`/beta | QA manual no beta: semáforo de testes, dry-run, split automático de JSON |
| Fase 8 | CRUD sistemas colaborativo + notificações in-app | ✅ deployado em `dev`/beta (04/04/2026) | QA manual: sugestão de sistemas no `/painel-mestre`, revisão em `/gestao`, sino do header |
| REQ-16 | Correção de logout inesperado | ✅ corrigido e validado (05/04/2026) | Teste manual de sessão de 30 minutos |
| REQ-22 | 3 bugs críticos — E109, E111, E103 | ✅ resolvido e deployado | — |
| REQ-23 | CRUD Admin completo | ✅ deployado e funcional no beta | — |
| REQ-24 | Parser Python Fase B | ✅ deployado e funcional no beta (05/04/2026) | QA com anúncios reais do Discord |
| REQ-25 | Filtros avançados + deleção em lote de candidatos | ✅ implementado com 10 heurísticas de Nielsen | — |
| REQ-29 | Sistema completo de perfil (player + gm + Discord + admin) | ⏳ backend completo, aguardando migration + frontend | Aplicar migration_14, implementar ProfileEditPage |

**Legenda:** ✅ concluído · ⏳ pronto local, aguardando validação beta · ⏸ bloqueado

---

## Estado Atual (07/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Última sessão concluída (07/04/2026 - 05:34):**
- **Documentação completa do modelo de mesa + Sistema de ingestão automática**
  - **Objetivo:** Preparar para desacoplamento do pipeline de ingestão automática (AggregatorBot)
  
  **Fase 1 — Modelo de Mesa:**
  - **Documento criado:** `docs/MODELO_MESA_COMPLETO.md` (11 seções, 500+ linhas)
  - **Conteúdo mapeado:**
    - Schema completo da tabela `tables` (70+ campos em 9 migrations)
    - 3 tabelas relacionadas: `table_contacts`, `table_schedules`, `table_metrics`
    - Validações e constraints (slots, preço, DDAL, publisher role, frequência)
    - Fluxo completo de criação/edição/deleção via API
    - Endpoints públicos e autenticados
    - Regras de negócio (elevação de role, upload de imagens, expiração)
    - Campos internos sensíveis (deletehashes)
    - Diferenças entre mesas manuais vs importadas
  
  **Fase 2 — Sistema de Ingestão Automática:**
  - **Documento criado:** `docs/SISTEMA_INGESTAO_ATUAL.md` (11 seções, 600+ linhas)
  - **Componentes mapeados:**
    - 5 tabelas do banco: `aggregator_sources`, `aggregator_imported_raw_messages`, `aggregator_import_candidates`, `aggregator_candidate_audit`, `aggregator_settings`
    - 4 grupos de rotas: `/aggregator/sources`, `/aggregator/import`, `/aggregator/candidates`, `/aggregator/exports`
    - 9 serviços backend: `sourceService`, `importFromExporterService`, `pythonParserService`, `candidateService`, `exportService`, etc.
    - 10 arquivos domain: `/backend/src/domain/aggregator/*`
    - Parser Python: `discord_message_parser.py` + dependências (spaCy, pt_core_news_lg)
    - Frontend: `AdminDevToolsPage.tsx` (1200+ linhas)
    - Fluxo completo: coleta → parsing → fila editorial → aprovação → publicação
  - **Plano de desacoplamento criado:**
    - Identificados componentes a remover (5 tabelas, 3 migrations, 20+ arquivos)
    - Identificados componentes a preservar (modelo de mesa, rotas, formulário)
    - Proposto novo fluxo: upload manual de JSON → validação → criação direta
  - **Próxima ação:** Criar interface de upload manual de JSON e executar desacoplamento
  
  **Fase 3 — Desacoplamento Executado:**
  - **Rotas desabilitadas:** `/api/v1/aggregator/*` (comentadas em `server.ts`)
  - **Arquivos movidos para backup:** `backend/src/_archived_aggregator/`
    - `aggregator.ts`, `aggregatorReview.ts` (rotas)
    - `services/aggregator/` (9 arquivos)
    - `domain/aggregator/` (10 arquivos)
    - `scripts/importDiscordExport.ts`
    - `scripts/setup_python_env.*`
    - `AdminDevToolsPage.tsx`
  - **Frontend atualizado:** Rota `/admin/devtools` removida de `App.tsx`
  - **Build validado:** Backend e Frontend compilam sem erros (exit code 0)
  - **Próxima ação:** Criar migration para DROP das tabelas aggregator_* no beta

**Sessão anterior (06/04/2026 - 02:15):**
- **REQ-29: Sistema completo de perfil — Backend implementado**
  - **Decisões de arquitetura confirmadas:**
    - Perfil híbrido: `player_profiles` + `gm_profiles` separados
    - Discord como conexão opcional (não login principal)
    - Selo "Mestre do Covil" controlado por admin (curadoria manual)
    - Username obrigatório e único
    - Tabela `user_systems` para relacionamentos (favorite/gm)
    - Autosave por seção (PATCH granular com debounce 500ms)
  - **Migration 14 criada:**
    - Tabela `auth_providers` (multi-provider: Google + Discord)
    - Tabela `player_profiles` (experiência, estilo, disponibilidade, preferências)
    - Tabela `user_systems` (relacionamento usuário ↔ sistemas)
    - Campos novos em `users`: `username`, `location`
    - Campo novo em `profiles`: `avatar_url`
    - Campos novos em `gm_profiles`: Discord (connected, username, id), Covil (verified, verified_at, verified_by), experiência (years, average_price), estilo (gm_style, tools, game_format)
  - **Backend TypeScript completo:**
    - `types.ts` atualizado com 6 novos tipos
    - `profileService.ts` criado (15 funções: CRUD player/gm, sistemas, Discord, admin)
    - `routes/profile.ts` criado (9 endpoints autenticados)
    - `routes/adminProfile.ts` criado (3 endpoints admin)
    - Rotas registradas em `server.ts`
  - **Documentação atualizada:**
    - `RESUMO_EXECUCAO.md`: Procedimento de migrations adicionado (recorrente)
    - `implementation_plan.md`: Plano completo com decisões fechadas
    - `sessoes/resumo_06-04_perfil-usuario-completo.md`: Progresso detalhado
  - **Próxima ação:** Aplicar migration_14 no beta, implementar frontend (ProfileEditPage)

**Sessão anterior (06/04/2026 - 01:40):**
- **Refatoração completa do CreateTableForm:** Fluxo multi-step otimizado
  - Nova ordem: 1=Básico, 2=Sistema, 3=Sessões, 4=Configuração, 5=Finalização, 6=Revisão
  - Contatos migrados de StepSessions para StepFinal (separação de modelos mentais)
  - StepHeader evoluído: navegação clicável com trava de progresso (`maxStepUnlocked`)
  - Autosave com feedback visual não intrusivo (`Salvando...` / `✔ Rascunho salvo`)
  - Modal de restore de rascunho com confirmação explícita
  - Validações ajustadas para nova ordem de steps
- **Build validado:** Frontend compila sem erros (exit code 0)
- **Documentação atualizada:**
  - `sessoes/resumo_05-04_refatoracao-steps-form.md` criado

**Sessão anterior (06/04/2026 - 00:41):**
- **Auditoria completa REQ-28:** 30 problemas identificados em 3 passagens
- **21 correções aplicadas:** 10 críticos + 10 altos + 1 médio (70% de resolução)
  - Overrides aplicados corretamente (deep copy + Object.assign)
  - Fluxo de aprovação unificado (243 linhas removidas)
  - Validação de day_of_week previne erros 500
  - Whitelist de campos (segurança contra injeção)
  - Type-safety restaurada
  - Loading states adicionados
  - **UX melhorada:** Indicadores visuais ✏️, banner de resumo, botão "Salvar Rascunho"
  - **Tratamento de erro específico** por status HTTP
  - **Validação de tipos** (slots_total, booleans, arrays)
  - **Audit log completo** implementado (migration_11)

**Próxima ação prioritária:**
1. **Testar fluxo completo do formulário refatorado** em ambiente local
2. **Validar UX:** navegação entre steps, autosave, restore de rascunho
3. **Aplicar migration_11** em beta (`aggregator_candidate_audit`) — pendente da sessão anterior
4. **Deploy em beta** para validação manual completa

**Após validação em beta:**
1. Adicionar testes E2E (DT-REQ28-30) - opcional
2. Criar endpoint GET /audit/:candidateId - opcional
3. Preparar para produção

**Status REQ-28:**
- ✅ Fase 1-6: Implementadas e funcionais
- ✅ Fase 7: Débito técnico corrigido (21/30 problemas, 100% dos críticos e altos)
- ✅ Audit log: Implementado e funcional
- ⏳ Pendente: 9 problemas de baixa prioridade (não bloqueadores)

---

## Último Commit Validado

| Campo | Valor |
|---|---|
| Branch | `dev` (local, não commitado) |
| Hash | `ec238f2` (último commit remoto) |
| Mensagem | `fix(REQ-28): Garante que types.ts está sincronizado com schema do banco` |
| Deploy beta | ✅ success |
| Build | ✅ Backend e Frontend compilam sem erros |

**Commits pendentes desta sessão:**
- Correções de débito técnico REQ-28 (14 problemas corrigidos)
- Aguardando autorização para commit e push

**Commit anterior:** `3071300` — `feat: Adicionar aba CRUD completa na página de gestão` — ✅ success

---

## Bloqueios Ativos

Nenhum bloqueio no momento (06/04/2026).

**Bloqueadores resolvidos nesta sessão:**
- ✅ Overrides não aplicados (DT-REQ28-02)
- ✅ Dois fluxos de aprovação conflitantes (DT-REQ28-09, 10, 20, 21, 24)
- ✅ editedCandidate não enviado (DT-REQ28-14)
- ✅ Erro 500 por day_of_week inválido (DT-REQ28-05)
- ✅ Vulnerabilidade de injeção de campos (DT-REQ28-25, 26)

> Ao identificar novo bloqueio, registrar aqui com data e descrição da dependência.

---

## Protocolo de Fechamento (Obrigatório)

Antes de encerrar qualquer sessão, atualizar as três seções abaixo. **Sessão não está encerrada sem isso.**

- [x] **Estado de execução** — marcar o que foi concluído, atualizar próximas ações
- [x] **Bloqueios ativos** — remover resolvidos, adicionar novos
- [x] **Último commit validado** — atualizar hash, mensagem e status do deploy

