# FILA_IMPLEMENTACAO.md

## Objetivo

Fila operacional para agrupar mudanças antes do deploy no **Anúncios de Mesas RPG**.

Documento canônico de execução por lote neste repositório.

Status geral do projeto: **Fase 1 concluída** — Fase 2 (Catálogo Público) e Fase 3 (Painel do Mestre) em andamento.

## Quando ler

No modo lote, ao adicionar/executar/fechar itens sem deploy imediato.

## Não ler quando

Não é necessário em tarefas fora do modo lote.

## Pré-requisitos

- `GIT_WORKFLOW.md`
- Branch de trabalho criada a partir de `dev`

## Passos

1. Registrar itens com status `pendente`.
2. Atualizar para `em_execucao` durante implementação.
3. Marcar `concluido` ou `descartado` ao final do item.
4. Fechar lote somente com validação final completa.
5. Push para `dev` → deploy automático em `mesasbeta.artificiorpg.com` via `deploy-beta.yml`.

## Status permitidos

- `pendente`
- `em_execucao`
- `concluido`
- `descartado`

## Fases de referência (para classificar itens)

| Fase | Escopo | Prioridade |
|---|---|---|
| Fase 0 | Infraestrutura base: repositório, Oracle, Docker, CI/CD, `.env` | **Primeiro — nada funciona sem isso** |
| Fase 1 | Fundação: schema, API base, autenticação Google OAuth, onboarding | **Núcleo do produto** |
| Fase 2 | Catálogo público: listagem, filtros, página da mesa, landing page do mestre | **Produto visível** |
| Fase 3 | Painel do mestre: publicação, edição, gestão de vagas, perfil | **Autopublicação** |
| Fase 4 | Moderação e painel administrativo | **Governança** |
| Fase 5 | Engajamento social: perguntas, avaliações, bookmarks | **Comunidade** |
| Fase 6 | Exportação WhatsApp/Discord | **Somente após Fases 1–5 estáveis** |
| Fase 7 | AggregatorBot e CleanupWorker | **Somente após Fases 1–5 estáveis** |

> ⚠️ **Fases 6 e 7 permanecem bloqueadas.** Exportação formatada e ingestão automática só entram em desenvolvimento após as Fases 1 a 5 estarem rodando e validadas em beta.

---

## Itens da fila — Lote: infraestrutura-base (Fase 0)

| ID  | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 001 | 0 | infra | 5/5/5 | Criar repositório GitHub | Criar `mesas_rpg_artificio` na conta `FarenRavirar`, criar branch `dev` como padrão, proteger `main` | — | concluido | Manual pelo responsável |
| 002 | 0 | infra | 5/5/5 | Configurar Secrets no GitHub | Adicionar `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` nos Secrets do repositório | — | concluido | Manual pelo responsável |
| 003 | 0 | infra | 5/5/5 | Criar estrutura de pastas na Oracle | Criar `/opt/mesas-beta/` e `/opt/mesas/` com `.env` preenchido em cada uma | — | concluido | Ver variáveis obrigatórias em checklist |
| 004 | 0 | infra | 5/5/5 | Criar docker-compose.beta.yml | Compose com serviços `mesas-beta-app`, `mesas-beta-api` e `mesas-beta-db`, exposto via Cloudflare para `mesas-beta-app:80`, sem porta pública dedicada no host | `docker-compose.beta.yml` | concluido | Alinhado ao ambiente validado |
| 005 | 0 | infra | 4/5/5 | Criar docker-compose.prod.yml | Compose de produção sem porta pública, roteado via Cloudflare Tunnel existente | `docker-compose.prod.yml` | concluido | Nunca criar novo túnel |
| 006 | 0 | infra | 5/5/5 | Configurar Hostname Cloudflare | Adicionar entradas no túnel existente para `mesasbeta` e `mesas` | — | concluido | Manual no painel Cloudflare |
| 007 | 0 | infra | 5/5/5 | Criar workflows de CI/CD | Criar `deploy-beta.yml` e `deploy-production.yml` com rsync + rebuild Docker | `.github/workflows/deploy-*.yml` | concluido | — |

---

## Itens da fila — Lote: fundacao-schema-auth (Fase 1)

| ID  | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 008 | 1 | banco | 5/5/5 | Schema inicial do banco | Validar aplicabilidade da migration `migration_01_base_schema.sql` em DB limpo | `database/migration_01_base_schema.sql` | concluido | Schema base rodando em beta |
| 008B| 1 | banco | 5/5/5 | Conexão Type-Safe (Kysely) | Configurar driver `pg` + `Kysely` para introspeção de tipos TypeScript ("TypeScript ao máximo") sem modificar o DDL original. | `backend/src/db/` | concluido | Kysely configurado e operante |
| 009 | 1 | banco | 2/3/3 | Tabela imgur_cleanup_log | Auditar deleções Imgur. Ver seção 16.5 | `database/migration_*.sql` | pendente | — |
| 010 | 1 | back  | 5/5/5 | Setup base da API Node.js | CORS, rate limit, JSON parser, handler global, router map | `backend/src/app.ts` | concluido | Express operando em /api/v1/ |
| 011 | 1 | back  | 5/5/5 | OAuth Google Auth + JWT | Handshake, JWT generation, upsert users/profiles no primeiro login | `backend/src/routes/auth.ts` | concluido | Funcional no beta com callback canônico `/api/v1/auth/google/callback` |
| 012 | 1 | back  | 4/4/4 | Middlewares base | Verificação de token, bloqueio por role (`player`/`gm`/`admin`) | `backend/src/middleware/auth.ts` | concluido | requireRole operante |
| 013 | 1 | front | 5/5/5 | Setup base React+Tailwind | Setup inicial + roteador + paleta oficial Artifício | `frontend/src/` | concluido | Tailwind operante |
| 014 | 1 | front | 5/5/5 | Login + Onboarding | Tela de login Google, callback, onboarding (3 passos) | `frontend/src/pages/Auth/` | em_execucao | Auth logic concluída; falta onboarding UI |
| 015 | 1 | back  | 3/4/4 | Serviço de Imagens Imgur | Pipeline com Sharp WebP + envio Imgur anon (Client ID restrito) | `backend/src/services/` | pendente | Depende da estabilização do núcleo já validado no beta |

---

## Itens da fila — Lote: catalogo-publico (Fase 2)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 016 | Fase 2 | backend | Endpoints públicos de mesas | `GET /tables` com filtros por query params (sistema, dia, tipo, audiência, plataforma, tag, preço, modalidade, nível, estado, cidade, selo) e `GET /tables/:slug`. Filtros de estado/cidade só aplicáveis quando `modality = 'presencial'` ou `'hibrida'` | `backend/src/routes/tableRoutes.ts`, `backend/src/controllers/tableController.ts` | em_execucao | Implementação local concluída; validar em beta pós-deploy |
| 017 | Fase 2 | backend | Endpoint público de mestres | `GET /gm/:slug` retornando perfil público com estatísticas, selos oficiais e lista de mesas ativas | `backend/src/routes/gmRoutes.ts`, `backend/src/controllers/gmController.ts` | em_execucao | Implementação local concluída; validar em beta pós-deploy |
| 017A | Fase 2 | backend | Carga idempotente da árvore de sistemas | Criar script `systems:import-tree` para upsert de taxonomia (`sistema > edição > variante`) e aliases a partir de `arvores_de_sistemas.md`, sem reset de banco, com chave estável por `path_slug` | `backend/src/scripts/systemsTreeImport.ts`, `backend/package.json` | concluido | Script executado no beta (125 nós, `path_slug` `dungeons-dragons/5e/2024` confirmado). Observação operacional: após rebuild do container, ainda requer rotina manual `docker cp` + `docker exec` até fix no Dockerfile. |
| 018 | Fase 2 | frontend | Home e hero com busca | Hero com busca por título/sistema/mestre, CTAs "Buscar Mesas" e "Buscar Mestres", seção de destaques curatoriais, seção "Abertas recentemente" (mesas criadas há menos de 48h, máx. 6 cards) e seção "Últimas vagas" (mesas com 1 vaga restante, máx. 6 cards) | `frontend/src/pages/HomePage.tsx` | em_execucao | Ajustes visuais locais aplicados; validar smoke em beta |
| 019 | Fase 2 | frontend | Catálogo com filtros e cards | Listagem em grid com card denso, painel lateral de filtros estruturados e filtro de sistema em árvore com busca por alias (nome/abreviação). Incluir filtro por `content_warnings`, `safety_tools` e `selos` (`covil_do_lich`, `ddal`). Quando `slots_total - slots_filled == 1`, exibir badge laranja "Falta 1 jogador!" sobreposto ao cover (canto superior direito) | `frontend/src/pages/CatalogoPage.tsx`, `frontend/src/components/MesaCard.tsx`, `frontend/src/components/FiltrosMesa.tsx` | em_execucao | Filtro por selo e ajustes de card implementados localmente; validar em beta |
| 020 | Fase 2 | frontend | Página individual da mesa | Banner, bloco lateral de detalhes operacionais (incluir `content_warnings`, `safety_tools` e selos quando preenchidos), corpo editorial com seções, Q&A (placeholder), avaliações (placeholder) | `frontend/src/pages/MesaPage.tsx` | em_execucao | Bloco DDAL, seção de contatos e nota de anunciante implementados e deployados em beta; validar QA E2E com publicação real. |
| 021 | Fase 2 | frontend | Landing page do mestre | Banner, avatar, bio, idiomas, tags, estatísticas, especialidades, selos oficiais e lista de mesas ativas | `frontend/src/pages/MestrePage.tsx` | em_execucao | API/consumo de metadados DDAL em mesas ativas ajustados localmente |
| 021A | Fase 2 | fullstack | Selos oficiais de parceria e programa | Implementar selo `covil_do_lich` para mestres/mesas da parceria e selo `ddal` apenas para mesa vinculada ao caminho `D&D > D&D 5e > D&D 2024`. DDAL exige validação de `codigo`, `nome` e `tier` antes de persistir selo | `backend/src/routes/tables.ts`, `backend/src/routes/gm.ts`, `frontend/src/components/TableCard.tsx`, `frontend/src/pages/CatalogoPage.tsx`, `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/MestrePage.tsx` | em_execucao | Backend + frontend deployados em beta; `systemsTreeImport` já executado. Próximo passo: QA E2E com dados reais e checklist de publicação completa (REQ-13). |
| 021B | Fase 2 | frontend | Layout global persistente | Criar shell global com `header` sticky e `footer` institucional em todas as rotas/etapas para manter navegação contínua | `frontend/src/components/AppShell.tsx`, `frontend/src/components/SiteHeader.tsx`, `frontend/src/components/SiteFooter.tsx`, `frontend/src/App.tsx` | concluido | AppShell implementado localmente com SiteHeader + SiteFooter; header local redundante removido do PainelMestrePage. Validar smoke visual em beta após deploy. |


---

## Itens da fila — Lote: painel-mestre (Fase 3)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 022 | Fase 3 | backend | Endpoints autenticados de mesas (GM) | `POST /tables`, `PUT /tables/:id`, `PATCH /tables/:id/status` — criação, edição e controle de status de mesas próprias, incluindo validação de metadados DDAL quando `is_ddal=true` | Ajuste em `tableRoutes.ts` e `tableController.ts` | em_execucao | Fluxo com `publisher_role`/`actual_gm_name` e contatos (`table_contacts`) já deployado em beta; pendente validação E2E de criação/edição/publicação ativa com contatos obrigatórios. |
| 023 | Fase 3 | backend | Endpoint de criação de gm_profile | `POST /gm/profile` e `PUT /gm/profile` com upload de avatar e banner via `imgurService`. Incluir campo `badges TEXT[]` no payload e persistência em `gm_profiles` | Ajuste em `gmRoutes.ts` e `gmController.ts` | pendente | Criação eleva role para `gm`. Badges são validados no backend; selos oficiais (`covil_do_lich`, `ddal`) não são autodeclaráveis pelo GM |
| 024 | Fase 3 | frontend | Painel do mestre | Formulário de criação/edição de mesa com seletor hierárquico de sistemas (`sistema > edição > variante`); ao selecionar `D&D > D&D 5e > D&D 2024`, exibir toggle "É DDAL" e bloco de campos (mínimo obrigatório: código, nome, tier) | `frontend/src/pages/PainelMestrePage.tsx` | em_execucao | Formulário já atualizado com papel do publicador e bloco de contatos; deployado em beta. Pendente QA E2E com usuário real (REQ-13). |


---

## Itens da fila — Lote: moderacao-admin (Fase 4)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 025 | Fase 4 | backend | Endpoints do painel admin | Moderação de mesas pendentes, gestão de taxonomias (sistemas, tags, plataformas), curadoria de destaques | `backend/src/routes/adminRoutes.ts`, `backend/src/controllers/adminController.ts` | pendente | Requer JWT com role `admin` |
| 026 | Fase 4 | frontend | Painel administrativo | Tela de moderação com fila de mesas pendentes, CRUD de taxonomias, curadoria de destaques | `frontend/src/pages/PainelAdminPage.tsx` | pendente | Ver `ARQUITETURA_PROJETO.md` seção 7.7 |

---

## Itens da fila — Lote: engajamento-social (Fase 5)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 027 | Fase 5 | banco | Tabelas de engajamento | Criar `questions`, `answers`, `reviews`, `bookmarks`, `table_interests` (campos: `id UUID PK`, `user_id UUID FK`, `table_id UUID FK`, `message TEXT`, `created_at TIMESTAMPTZ`) | `database/migration_03_engagement.sql` | pendente | Depende de Fase 1 concluída |
| 028 | Fase 5 | backend | Endpoints de perguntas, avaliações e interesse | Q&A público por mesa, avaliações autenticadas, `POST /tables/:id/interest` (requer `player`) que registra em `table_interests` e notifica mestre | Ajuste em `tableRoutes.ts` + novos controllers | pendente | Notificação ao mestre pode ser via email ou flag no painel, a definir |
| 029 | Fase 5 | frontend | Q&A e avaliações nas páginas de mesa | Ativar seções que ficaram como placeholder na Fase 2 | Ajuste em `MesaPage.tsx` | pendente | — |
| 030 | Fase 5 | frontend | Bookmarks e interesse | Salvar/remover mesa favorita (bookmark), lista no painel do jogador. Botão "Tenho interesse" na página da mesa (visível para jogadores logados) com campo opcional de mensagem ao mestre | `frontend/src/components/BookmarkButton.tsx`, `frontend/src/components/InterestButton.tsx` | pendente | — |

---

## Itens da fila — Lote: exportacao-formatada (Fase 6) — BLOQUEADO

> ⚠️ **Este lote só pode ser iniciado após fechamento confirmado das Fases 1 a 5.**

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 031 | Fase 6 | backend | Endpoint de exportação | `POST /tables/:id/export` com parâmetro `channel` (whatsapp, discord, card). Para `channel=card`: gerar PNG 1080×1080 via `canvas` ou `puppeteer` com dados da mesa e logo Artifício, retornar como `image/png` | `backend/src/controllers/exportController.ts` | pendente | Ver templates em `ARQUITETURA_PROJETO.md` seção 8. Avaliar `canvas` como dependência leve vs `puppeteer` |
| 032 | Fase 6 | frontend | Botão de exportação na página da mesa | UI com três botões (WhatsApp / Discord / Card Visual). Texto copiado para área de transferência nos dois primeiros; terceiro exibe preview do PNG e botão de download | Ajuste em `MesaPage.tsx` | pendente | — |

---

## Itens da fila — Lote: aggregatorbot (Fase 7) — BLOQUEADO

> ⚠️ **Este lote só pode ser iniciado após fechamento confirmado das Fases 1 a 5.**

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 033 | Fase 7 | banco | Tabelas do AggregatorBot | Criar `sources` e `imported_tables` | `database/migration_04_aggregator.sql` | pendente | — |
| 034 | Fase 7 | backend | Serviço AggregatorBot | Worker node-cron com coleta diária configurável por fonte, parse para schema `imported_tables`, deduplicação automática (ver regras em `ARQUITETURA_PROJETO.md` seção 4.5) | `backend/src/services/aggregatorService.ts`, `backend/src/jobs/aggregatorJob.ts` | pendente | Circuit breaker obrigatório |
| 035 | Fase 7 | backend | CleanupWorker | Job node-cron diário que deleta imagens do Imgur para mesas com status `ended`/`cancelled` usando `deletehash` do banco, registra resultado em `imgur_cleanup_log` | `backend/src/jobs/cleanupJob.ts` | pendente | Deleção no Imgur é irreversível — ver `ARQUITETURA_PROJETO.md` seção 16.4 |
| 036 | Fase 7 | backend | Endpoints admin de fontes e importação | `GET/POST /admin/sources`, `POST /admin/import/dry-run`, `POST /admin/import/commit`, `GET /admin/import/logs` | Ajuste em `adminRoutes.ts` | pendente | Dry run obrigatório antes de commit |
| 037 | Fase 7 | frontend | Painel de fontes e logs no admin | Tela para cadastro de fontes externas, preview de importação com detecção de duplicatas, histórico de ingestões | Ajuste em `PainelAdminPage.tsx` | pendente | — |
| 038 | Fase 7 | backend | Importador manual de mesas via JSON | Implementar ingestão em lote por payload versionado (`schema_version`) com idempotência (`source` + `external_id`), resolução de `gm_slug`/`system_path_slug`, validação de contatos (incluindo nick Discord em `contacts[channel=discord].value`) e relatório por item (`created`, `updated`, `failed`) | `backend/src/routes/admin.ts`, `backend/src/services/jsonTablesImporter.ts`, `backend/src/validators/jsonTablesImportSchema.ts` | pendente | Executar somente quando o responsável chamar explicitamente; depende de endpoints admin e fases 1–5 estáveis. |

---

## Validação

- Itens da fila com status consistente.
- Fases 6 e 7 com status `pendente` até liberação explícita do responsável.
- Sem push em `dev` antes de "Fechar lote".
- Verificar deploy no beta após push:
  ```bash
  gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
  ```
- Confirmar que nenhuma alteração tocou o ambiente de produção (`mesas.artificiorpg.com`).

## Rollback

Se um item do lote falhar:
1. Marcar item como `descartado` ou retornar para `pendente`
2. Reverter commit local do item (se aplicável)
3. Manter o lote sem deploy até nova validação
4. Se o deploy beta quebrar, verificar logs:
   ```bash
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
   ```

## Referências

- `GIT_WORKFLOW.md`
- `ARQUITETURA_PROJETO.md`

## Limite de escopo

Este arquivo controla fila de execução; não define arquitetura de produto.
