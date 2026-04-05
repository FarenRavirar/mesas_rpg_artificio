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
| 009 | 1 | banco | 2/3/3 | Tabela imgur_cleanup_log | Auditar deleções Imgur. Ver seção 16.5 | `database/migration_*.sql` | concluido | Tabela existe no banco beta (verificado via SSH em 05/04/2026) |
| 010 | 1 | back  | 5/5/5 | Setup base da API Node.js | CORS, rate limit, JSON parser, handler global, router map | `backend/src/app.ts` | concluido | Express operando em /api/v1/ |
| 011 | 1 | back  | 5/5/5 | OAuth Google Auth + JWT | Handshake, JWT generation, upsert users/profiles no primeiro login | `backend/src/routes/auth.ts` | concluido | Funcional no beta com callback canônico `/api/v1/auth/google/callback` |
| 012 | 1 | back  | 4/4/4 | Middlewares base | Verificação de token, bloqueio por role (`player`/`gm`/`admin`) | `backend/src/middleware/auth.ts` | concluido | requireRole operante |
| 013 | 1 | front | 5/5/5 | Setup base React+Tailwind | Setup inicial + roteador + paleta oficial Artifício | `frontend/src/` | concluido | Tailwind operante |
| 014 | 1 | front | 5/5/5 | Login + Onboarding | Tela de login Google, callback, onboarding (3 passos) | `frontend/src/pages/Auth/` | concluido | Auth logic e onboarding UI completos e funcionais no beta |
| 015 | 1 | back  | 3/4/4 | Serviço de Imagens Imgur | Pipeline com Sharp WebP + envio Imgur anon (Client ID restrito) | `backend/src/services/` | pendente | Depende da estabilização do núcleo já validado no beta |

---

## Itens da fila — Lote: catalogo-publico (Fase 2)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 016 | Fase 2 | backend | Endpoints públicos de mesas | `GET /tables` com filtros por query params (sistema, dia, tipo, audiência, plataforma, tag, preço, modalidade, nível, estado, cidade, selo) e `GET /tables/:slug`. Filtros de estado/cidade só aplicáveis quando `modality = 'presencial'` ou `'hibrida'` | `backend/src/routes/tableRoutes.ts`, `backend/src/controllers/tableController.ts` | concluido | Deployado e funcional no beta |
| 017 | Fase 2 | backend | Endpoint público de mestres | `GET /gm/:slug` retornando perfil público com estatísticas, selos oficiais e lista de mesas ativas | `backend/src/routes/gmRoutes.ts`, `backend/src/controllers/gmController.ts` | concluido | Deployado e funcional no beta |
| 017A | Fase 2 | backend | Carga idempotente de sistemas e cenários | Criar script `systems:import` para upsert de taxonomia (`sistema > edição > variante`) a partir de `sistemas.json` e script `scenarios:import` para carga de cenários com subgêneros a partir de `cenarios.json`, sem reset de banco, com chave estável por `path_slug` | `backend/src/scripts/systemsImport.ts`, `backend/src/scripts/scenariosImport.ts`, `backend/package.json` | pendente | **Atualização 05/04/2026:** Migração de `arvores_de_sistemas.md` para `sistemas.json` + novo `cenarios.json` (com campo `subgenero`). Dockerfile será atualizado para copiar ambos os arquivos JSON. Aguardando recebimento dos arquivos para implementação. |
| 018 | Fase 2 | frontend | Home e hero com busca | Hero com busca por título/sistema/mestre, CTAs "Buscar Mesas" e "Buscar Mestres", seção de destaques curatoriais, seção "Abertas recentemente" (mesas criadas há menos de 48h, máx. 6 cards) e seção "Últimas vagas" (mesas com 1 vaga restante, máx. 6 cards) | `frontend/src/pages/HomePage.tsx` | concluido | Deployado e funcional no beta |
| 019 | Fase 2 | frontend | Catálogo com filtros e cards | Listagem em grid com card denso, painel lateral de filtros estruturados e filtro de sistema em árvore com busca por alias (nome/abreviação). Incluir filtro por `content_warnings`, `safety_tools` e `selos` (`covil_do_lich`, `ddal`). Quando `slots_total - slots_filled == 1`, exibir badge laranja "Falta 1 jogador!" sobreposto ao cover (canto superior direito) | `frontend/src/pages/CatalogoPage.tsx`, `frontend/src/components/MesaCard.tsx`, `frontend/src/components/FiltrosMesa.tsx` | concluido | Deployado e funcional no beta |
| 020 | Fase 2 | frontend | Página individual da mesa | Banner, bloco lateral de detalhes operacionais (incluir `content_warnings`, `safety_tools` e selos quando preenchidos), corpo editorial com seções, Q&A (placeholder), avaliações (placeholder) | `frontend/src/pages/MesaPage.tsx` | concluido | Deployado e funcional no beta com bloco DDAL, contatos e nota de anunciante |
| 021 | Fase 2 | frontend | Landing page do mestre | Banner, avatar, bio, idiomas, tags, estatísticas, especialidades, selos oficiais e lista de mesas ativas | `frontend/src/pages/MestrePage.tsx` | concluido | Deployado e funcional no beta com metadados DDAL |
| 021A | Fase 2 | fullstack | Selos oficiais de parceria e programa | Implementar selo `covil_do_lich` para mestres/mesas da parceria e selo `ddal` apenas para mesa vinculada ao caminho `D&D > D&D 5e > D&D 2024`. DDAL exige validação de `codigo`, `nome` e `tier` antes de persistir selo | `backend/src/routes/tables.ts`, `backend/src/routes/gm.ts`, `frontend/src/components/TableCard.tsx`, `frontend/src/pages/CatalogoPage.tsx`, `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/MestrePage.tsx` | concluido | Backend + frontend deployados e funcionais no beta. systemsTreeImport executado. |
| 021B | Fase 2 | frontend | Layout global persistente | Criar shell global com `header` sticky e `footer` institucional em todas as rotas/etapas para manter navegação contínua | `frontend/src/components/AppShell.tsx`, `frontend/src/components/SiteHeader.tsx`, `frontend/src/components/SiteFooter.tsx`, `frontend/src/App.tsx` | concluido | AppShell implementado localmente com SiteHeader + SiteFooter; header local redundante removido do PainelMestrePage. Validar smoke visual em beta após deploy. |


---

## Itens da fila — Lote: painel-mestre (Fase 3)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 022 | Fase 3 | backend | Endpoints autenticados de mesas (GM) | `POST /tables`, `PUT /tables/:id`, `PATCH /tables/:id/status` — criação, edição e controle de status de mesas próprias, incluindo validação de metadados DDAL quando `is_ddal=true` | Ajuste em `tableRoutes.ts` e `tableController.ts` | concluido | Deployado e funcional no beta com publisher_role, actual_gm_name e table_contacts |
| 023 | Fase 3 | backend | Endpoint de criação de gm_profile | `POST /gm/profile` e `PUT /gm/profile` com upload de avatar e banner via `imgurService`. Incluir campo `badges TEXT[]` no payload e persistência em `gm_profiles` | Ajuste em `gmRoutes.ts` e `gmController.ts` | concluido | Endpoints implementados e funcionais. Upload de imagens via Imgur pendente (REQ-03). Criação eleva role para `gm`. |
| 024 | Fase 3 | frontend | Painel do mestre | Formulário de criação/edição de mesa com seletor hierárquico de sistemas (`sistema > edição > variante`); ao selecionar `D&D > D&D 5e > D&D 2024`, exibir toggle "É DDAL" e bloco de campos (mínimo obrigatório: código, nome, tier) | `frontend/src/pages/PainelMestrePage.tsx` | concluido | Deployado e funcional no beta com publisher_role, contatos, frequência, regras e banner (migration_09) |


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

## Itens da fila — Lote: aggregatorbot (Fase 7)

> ⚠️ **Bloco originalmente bloqueado até fechamento das Fases 1–5. Exceção autorizada explicitamente pelo responsável em 04/04/2026 para implementação do pipeline de importação Discord (ingestão manual de export JSON) sem ativar o worker automático.**

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 033 | Fase 7 | banco | Tabelas do Aggregator Discord | Migration com `aggregator_sources`, `aggregator_imported_raw_messages`, `aggregator_import_candidates`, `aggregator_settings` | `database/migration_05_aggregator_sources_and_queue.sql` | concluido | Schema aplicado. Tipagem Kysely estendida em `backend/src/db/types.ts`. |
| 034 | Fase 7 | backend | Camada de domínio do Aggregator | Parser, normalizador, classificador de sistemas e formatter de publicação | `backend/src/domain/aggregator/*` | concluido | `parseExporterMessage`, `normalizeCandidate`, `classifySystem`, `formatForPublication`, `normalizeExporterPayload` implementados. |
| 035-A | Fase 7 | backend | Serviços do Aggregator | sourceService, candidateService, rawImportService, importFromExporterService, exportService, publishService | `backend/src/services/aggregator/*` | concluido | Todos os serviços operantes. Lógica editorial (paid/custom/ambiguidade) no normalizador. |
| 035-B | Fase 7 | backend | Rotas HTTP do Aggregator | Sources CRUD, import/file, import/source/:id/run, exportação diária JSON/TXT, revisão editorial (candidates) | `backend/src/routes/aggregator.ts`, `backend/src/routes/aggregatorReview.ts` | concluido | Montadas em `/api/v1/aggregator`. Todas requerem `authMiddleware + requireRole('admin')`. `tsc --noEmit` saiu com exit code 0. |
| 035-C | Fase 7 | backend | Script CLI de importação | `importDiscordExport.ts` para ingestão manual de `export_exemple.json`, suporta `--dry-run`, `--source-id=`, `--export-only` | `backend/src/scripts/importDiscordExport.ts`, `backend/package.json` | concluido | Script `aggregator:import` adicionado ao `package.json`. Inclui auto-reparo `repairTruncatedJson()` para export JSON truncado (E088) com aviso operacional no log. |
| 035-D | Fase 7 | backend | CleanupWorker | Job node-cron diário de deleção de imagens do Imgur para mesas encerradas | `backend/src/jobs/cleanupJob.ts` | pendente | Deleção no Imgur é irreversível — ver seção 16.4. Não ativar sem autorização explícita. |
| 036 | Fase 7 | backend | AggregatorBot (worker automático) | Worker node-cron com coleta diária por fonte externa, deduplicação, circuit breaker | `backend/src/services/aggregatorService.ts`, `backend/src/jobs/aggregatorJob.ts` | pendente | Fora do escopo da exceção atual. Não implementar sem liberação das Fases 1–5. |
| 037 | Fase 7 | frontend | Painel admin de fontes e logs | Tela para cadastro de fontes, preview de importação, histórico de ingestões | Ajuste em `PainelAdminPage.tsx` | em_execucao | Suporte de QA já disponível via rota `/admin/devtools` (visível apenas para admin, com badge da flag `VITE_ENABLE_DEVTOOLS`). Painel administrativo completo permanece pendente de Fase 4. |
| 038 | Fase 7 | backend | Importador manual de mesas via JSON | Ingestão em lote por payload versionado com idempotência e relatório por item | `backend/src/routes/admin.ts`, `backend/src/services/jsonTablesImporter.ts` | pendente | Depende de endpoints admin e fases 1–5 estáveis. |

---

## Itens da fila — Lote: auditoria-ux-nielsen (REQ-17)

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 039 | Fase 4 | frontend | 4/5/4 | Substituir modal "Revisar Candidato" por formulário editável | Remover modal inútil que mostra JSON bruto. Botão "Revisar" deve abrir formulário de edição de mesa (CreateTableForm) pré-preenchido com dados do candidato, permitindo correção e aprovação direta. Viola H8 (Minimalismo) e H6 (Reconhecimento). | `frontend/src/pages/GestaoPage.tsx`, `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Implementado (05/04/2026):** Modal inútil removido, CreateTableForm exportado e integrado no modal de revisão com mapeamento automático de dados via `mapCandidateToFormData`. Build validado. **Aguardando validação em beta antes de marcar como concluído.** |
| 040 | Fase 4 | frontend | 4/4/4 | Adicionar botão "Rejeitar Todas" em Mesas Importadas | Adicionar botão de rejeição em lote para candidatos pendentes na aba "Mesas Importadas". Visível apenas quando filtro = "Pendentes". Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | Implementado em 05/04/2026: botão com contador dinâmico, visível apenas em filtro "Pendentes". **Aguardando validação em beta.** |
| 041 | Fase 4 | backend | 4/4/4 | Endpoint de rejeição em lote | Criar `PATCH /api/v1/aggregator/candidates/reject-all` que rejeita todos os candidatos com `editorial_status = 'awaiting_review'` de uma vez, com motivo padrão. | `backend/src/routes/aggregator.ts` | em_validacao | Implementado em 05/04/2026: endpoint com autenticação admin, atualiza `rejection_reason` e `updated_at`. **Aguardando validação em beta.** |
| 042 | Fase 4 | frontend | 4/4/3 | Adicionar filtros de preço em Mesas Importadas | Adicionar filtros "Grátis", "Pagas", "Não Identificadas" na aba "Mesas Importadas". Detecção automática baseada em campos do JSON (`isPaid`, `priceText`, etc.). Viola H6 (Reconhecimento). | `frontend/src/pages/GestaoPage.tsx` | pendente | Facilita triagem de candidatos por tipo de mesa. |
| 043 | Fase 4 | backend | 3/3/3 | Helper de detecção de preço e Covil do Lich | Criar funções `detectPriceType(parsed_json)` e `isCovil(parsed_json)` no candidateService para classificar mesas importadas. | `backend/src/services/aggregator/candidateService.ts` | pendente | Suporte ao item 042. Detecção de Covil via análise de texto/links. |
| 044 | Fase 2-4 | frontend | 4/5/5 | Auditoria UX completa (10 Heurísticas de Nielsen) | Criar plano de ação detalhado auditando toda a interface (catálogo, painel do mestre, gestão, onboarding) contra as 10 heurísticas. Identificar gaps por heurística, priorizar correções críticas, implementar melhorias incrementais. | Múltiplos arquivos | pendente | REQ-17. Documentação completa em `OPERACAO_PRODUCAO.md` seção 11. Regra obrigatória adicionada ao `AGENTS.md`. Executar após estabilização das Fases 1-3. |
| 045 | Fase 4 | backend/frontend | 5/5/5 | **[CRÍTICO] Investigar e corrigir erros 401 Unauthorized** | Console mostra múltiplos erros 401 ao acessar `/gestao`: `GET /api/v1/me 401`, `GET /api/v1/aggregator/sources 401`, `GET /api/v1/aggregator/candidates 401`. Possíveis causas: token JWT não sendo enviado, middleware rejeitando token válido, CORS, headers. **Bloqueia carregamento de dados na página de gestão.** | `backend/src/middleware/auth.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 125 (5×5×5).** Implementado em 05/04/2026: `AuthContext.tsx` usava caminhos relativos (`/api/v1/me`) ao invés de `${API_BASE}/api/v1/me`. Solução documentada em E105. **Aguardando validação em beta.** |
| 046 | Fase 4 | frontend | 4/5/4 | Sanitização de dados extraídos no helper de mapeamento | Campos como "Título" aparecem com prefixos técnicos do Discord (ex: `# Título: Arquivo 13`). Criar função `sanitizeText()` que remove prefixos (`# Título:`, `**Título:**`, etc.) antes de mapear para o formulário. Viola H8 (Minimalismo). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: função `sanitizeText()` remove 10 padrões de prefixos técnicos do Discord. **Aguardando validação em beta.** |
| 047 | Fase 4 | frontend | 5/5/4 | Busca inteligente de sistema na árvore | Sistema extraído (ex: "Ashen Stars") não está sendo pré-selecionado no formulário. Criar função `findSystemId()` que recebe árvore de sistemas e faz busca fuzzy/normalizada do nome. Retornar `system_id` se encontrado, `null` caso contrário. Viola H6 (Reconhecimento). **Atualização 05/04/2026:** Função implementada, mas depende do parser Python (E109) para popular `enrichedFields.system`. Parser não estava sendo copiado no Dockerfile — correção aplicada (linha 43). Aguarda rebuild do container beta. | `frontend/src/utils/candidateToFormData.ts` | em_execucao | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026: função `findSystemId()` com 3 estratégias (match exato, aliases, fuzzy). GestaoPage carrega árvore de sistemas e passa para mapeamento. **Aguarda deploy do Dockerfile corrigido para validação completa em beta.** |
| 048 | Fase 4 | frontend | 3/4/3 | Remover modal de motivo de rejeição | Ao clicar em "Rejeitar", aparece modal pedindo motivo. Rejeição deve ser **direta e rápida** (apenas confirmação). Candidatos vêm de JSON (não há usuário para notificar). Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 36 (3×4×3).** Implementado em 05/04/2026: substituído `prompt()` por `confirm()` direto. Motivo padrão "Rejeitado pelo admin". **Aguardando validação em beta.** |
| 049 | Fase 4 | frontend | 4/5/4 | Adicionar seção expansível com dados brutos do candidato | Modal de revisão mostra apenas 3 campos (Título, Sistema, Confiança). Admin precisa ver **todas as informações do anúncio original** (descrição completa, texto de recrutamento, plataformas, horários, requisitos, etc.). Adicionar seção expansível "Ver dados brutos" com JSON formatado. Viola H1 (Visibilidade do status). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: botão "Ver/Ocultar dados brutos" com JSON formatado em `<pre>` com scroll. **Aguardando validação em beta.** |
| 050 | Fase 4 | frontend | 4/4/3 | Forçar publisher_role = 'announcer' para candidatos importados | Campo "Quem está publicando esta mesa?" está com "Sou o mestre" selecionado. Se mesa veio de JSON importado, `publisher_role` deve ser automaticamente `'announcer'`. Admin não é o mestre real da mesa. | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 48 (4×4×3).** Implementado em 05/04/2026: `publisher_role` forçado como 'announcer' em `mapCandidateToFormData()`. **Aguardando validação em beta.** |
| 051 | Fase 4 | frontend | 5/5/4 | Mapear todos os campos do JSON para o formulário | Diversos campos que existem no JSON não estão sendo mapeados: `modality`, `type`, `slots_total`, `language`, `starts_at`, `frequency`, `description`, `rules_notes`. Sistema deve ser **inteligente** e aproveitar ao máximo os dados extraídos. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026: interface `CandidateFormData` expandida com 8 novos campos. Mapeamento completo implementado. **Aguardando validação em beta.** |
| 052 | Fase 4 | frontend | 4/5/4 | Pré-preencher canal Discord com username do autor | Campo "Canais de recrutamento" está vazio. Se mesa veio de JSON do Discord, canal deveria ser `discord` e valor deveria ser o `authorUsername`/`authorHandle` do JSON. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: `contacts[]` pré-preenchido com Discord quando `authorUsername` ou `authorHandle` presentes. **Aguardando validação em beta.** |
| 053 | Fase 4 | frontend | 3/4/3 | Pré-preencher banner_url e adicionar preview de imagem | Campo "URL do Banner" está vazio. Se JSON contém `imageUrl`/`banner`/`thumbnail`, campo deveria estar pré-preenchido. Adicionar preview da imagem abaixo do campo com tratamento de erro. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts`, `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 64 (4×4×4).** Implementado em 05/04/2026: `banner_url` mapeado + preview visual no modal com `onError` handler. **Aguardando validação em beta.** |
| 054 | Fase 4 | frontend | 4/4/3 | Expandir seção "Dados Extraídos" com todos os campos principais | Seção "Dados Extraídos Automaticamente" mostra apenas Título, Sistema e Confiança. Adicionar grid com todos os campos principais: Modalidade, Tipo, Vagas, Idioma, Descrição completa (se houver). Melhora contexto para decisão de aprovação/rejeição. Viola H1 (Visibilidade). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 48 (4×4×3).** Implementado em 05/04/2026: seção expandida com 7 campos + descrição completa quando disponível. **Aguardando validação em beta.** |
| 055 | Fase 4 | frontend | 5/5/5 | Toast notifications modernas | Substituir `alert()` genérico por sistema de toast notifications moderno (ex: react-hot-toast). Exibir feedback visual de sucesso/erro em aprovação/rejeição de candidatos. Viola H1 (Visibilidade do status). | `frontend/src/pages/GestaoPage.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/PainelMestrePage.tsx`, `frontend/package.json` | concluido | **Score GUT: 125 (5×5×5).** REQ-19. Implementado e deployado em 05/04/2026 (commit a4dc87f): react-hot-toast instalado, Toaster configurado no App.tsx, todos os alert() substituídos por toast.success/error. Build validado (411.80 kB). |
| 056 | Fase 4 | frontend | 5/5/5 | Validação antes de aprovar candidato | Validar campos obrigatórios (título, sistema, contatos) antes de permitir aprovação. Exibir mensagem clara se validação falhar. Viola H5 (Prevenção de erros). | `frontend/src/pages/PainelMestrePage.tsx` | concluido | **Score GUT: 125 (5×5×5).** REQ-19. Implementado e deployado em 05/04/2026 (commit a4dc87f): validação de título, sistema, contatos e actual_gm_name no CreateTableForm com toast feedback. |
| 057 | Fase 4 | frontend | 4/5/4 | Spinners em botões durante ações assíncronas | Adicionar estado de loading nos botões "Aprovar", "Rejeitar", "Rejeitar Todas" durante chamadas à API. Desabilitar botão e mostrar spinner. Viola H1 (Visibilidade). | `frontend/src/pages/GestaoPage.tsx` | concluido | **Score GUT: 80 (4×5×4).** REQ-19. Implementado e deployado em 05/04/2026 (commit a4dc87f): estados de loading + spinners CSS animados em todos os botões de ação. |
| 058 | Fase 4 | frontend/backend | 4/5/4 | Botão "Desfazer rejeição" | Permitir que admin reverta rejeição de candidato, mudando status de volta para "awaiting_review". Botão visível apenas em filtro "Rejeitadas". Viola H3 (Controle e liberdade). | `frontend/src/pages/GestaoPage.tsx`, `backend/src/routes/aggregator.ts` | concluido | **Score GUT: 80 (4×5×4).** REQ-19. Implementado e deployado em 05/04/2026 (commit a4dc87f): endpoint PATCH /candidates/:id/undo-rejection criado no backend, botão "Desfazer" (amarelo) adicionado no frontend. |
| 059 | Fase 4 | frontend | 4/4/4 | Atalhos de teclado | Implementar atalhos: `A` para aprovar, `R` para rejeitar, `Esc` para fechar modal. Exibir legenda discreta no rodapé do modal. Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 64 (4×4×4).** REQ-19. Aumenta eficiência para power users. Baixo esforço. |
| 060 | Fase 4 | frontend | 4/4/4 | Busca por texto em candidatos | Adicionar campo de busca que filtra candidatos por título ou sistema. Busca client-side com debounce. Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 64 (4×4×4).** REQ-19. Facilita localização de candidatos específicos. Médio esforço. |
| 061 | Fase 4 | frontend | 3/4/3 | Traduzir status para PT-BR | Substituir "awaiting_review", "accepted", "rejected" por "Aguardando Revisão", "Aceito", "Rejeitado". Adicionar ícones (⏳ ✅ ❌). Viola H2 (Mundo real). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 36 (3×4×3).** REQ-19. Melhora compreensão. Baixo esforço. |
| 062 | Fase 4 | frontend | 3/4/3 | Botão "Cancelar" explícito no modal | Adicionar botão "Cancelar" ao lado de "Aprovar" no modal de revisão (além do "X" no canto). Viola H3 (Controle). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 36 (3×4×3).** REQ-19. Melhora clareza de saída. Baixo esforço. |
| 063 | Fase 4 | frontend | 4/4/3 | Aviso se sistema não detectado | Exibir badge amarelo "⚠️ Sistema não detectado" se `system_id` estiver vazio após mapeamento. Sugerir seleção manual. Viola H5 (Prevenção). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 48 (4×4×3).** REQ-19. Previne aprovação sem sistema. Baixo esforço. |
| 064 | Fase 4 | frontend | 3/3/3 | Ordenação de candidatos | Adicionar dropdown de ordenação: "Mais recentes", "Maior confiança", "Menor confiança". Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 27 (3×3×3).** REQ-19. Melhora navegação. Médio esforço. |
| 065 | Fase 4 | frontend | 3/3/3 | Tabs no modal de revisão | Reorganizar modal com tabs: "Dados Extraídos", "Dados Brutos", "Preview". Reduz sobrecarga visual. Viola H8 (Minimalismo). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 27 (3×3×3).** REQ-19. Melhora organização. Médio esforço. |
| 066 | Fase 4 | frontend | 3/3/3 | Mensagens de erro específicas | Substituir mensagens genéricas por específicas: "Sistema não encontrado. Selecione manualmente.", "Título obrigatório.", etc. Viola H9 (Recuperação). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 27 (3×3×3).** REQ-19. Facilita correção de erros. Baixo esforço. |
| 067 | Fase 4 | frontend | 3/3/3 | Tooltips explicativos | Adicionar ícone "?" com tooltips em campos complexos: "Confiança", "Publisher Role", "Frequência". Viola H10 (Ajuda). | `frontend/src/pages/GestaoPage.tsx` | pendente | **Score GUT: 27 (3×3×3).** REQ-19. Melhora compreensão. Baixo esforço. |

---

## Itens da fila — Lote: midia-covil-retencao (REQ-20)

> Integração completa de mídia Discord (banner/avatar), selo Covil do Lich e política de retenção de mesas importadas.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 068 | Fase 4 | banco | 5/5/5 | Migration: is_covil e imported_expires_at | Criar migration com `ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_covil BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN IF NOT EXISTS imported_expires_at TIMESTAMPTZ;` | `database/migration_10_covil_and_expiration.sql` | pendente | Similar ao `is_ddal`. Aplicar no beta via `docker exec mesas-beta-db psql ...` após push. |
| 069 | Fase 4 | frontend | 4/5/5 | Preview de banner no CreateTableForm | Adicionar pré-visualização de imagem abaixo do campo `bannerUrl` no formulário. Imagem se atualiza ao digitar URL. `onError` oculta preview com fallback de texto. Auto-preenchimento via `initialData.banner_url`. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Campo `bannerUrl` já existe como estado. Só falta o elemento de preview. |
| 070 | Fase 4 | frontend | 4/5/4 | Campo avatar mestre (visual only, mode=review) | Adicionar campo "Avatar do Mestre (importado)" com input de URL e preview circular, visível apenas no modo `review`. Apenas pré-preenche o formulário — NÃO é enviado no payload do backend. Auto-preenchido via `initialData.gm_avatar_url`. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Opção B confirmada: não persiste no banco. URL vem de `enrichedFields.avatar_url` do parser Python. |
| 071 | Fase 4 | frontend | 5/5/5 | Bloco "Covil do Lich" com checkbox e auto-detecção | Adicionar seção similar ao DDAL com checkbox "É Covil do Lich". Estado `isCovil` auto-preenchido por `initialData.is_covil`. Admin pode marcar/desmarcar. Exibir aviso visual quando marcado. Enviar `is_covil: boolean` no payload de submit. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Visual: borda roxa, ícone ☠️, badge "Covil do Lich" pré-visualizado. |
| 072 | Fase 4 | frontend | 4/5/5 | Mapear is_covil em candidateToFormData | Chamar `isCovil()` na função `mapCandidateToFormData()` usando `enrichedFields` + `parsed_json` e popular `is_covil: true/false` no resultado. Expandir `isCovil()` para verificar `guild.name`, `channel.name` e `enrichedFields.source`. | `frontend/src/utils/candidateToFormData.ts` | pendente | Função `isCovil()` já existe mas não é chamada no mapeamento. |
| 073 | Fase 4 | frontend | 4/4/5 | Expandir preview de revisão em GestaoPage | Atualizar o modal de revisão para: (1) ler `banner_url` de `enrichedFields.banner_url` ou `attachments[0].url`; (2) mostrar avatar do mestre com preview circular quando disponível; (3) exibir badge "☠️ Covil do Lich" em roxo nos cards e no modal quando detectado. | `frontend/src/pages/GestaoPage.tsx` | pendente | Importar `isCovil()` do `candidateToFormData.ts`. |
| 074 | Fase 4 | frontend | 3/4/4 | Seção de Retenção no AdminDevTools | Adicionar seção "🗂️ Retenção de Mesas Importadas" no AdminDevTools com: input de dias (padrão 30), botão "Ver mesas afetadas" (dry-run via API), botão "Aplicar e remover" com confirmação explícita. API: `GET /api/v1/admin/imported-retention?days=X` (preview) e `DELETE /api/v1/admin/imported-retention?days=X` (execução). | `frontend/src/pages/AdminDevToolsPage.tsx`, `backend/src/routes/adminRoutes.ts` | pendente | Operação de remoção é irreversível — exigir confirmação double-check. |

---

## Itens da fila — Lote: melhorias-formulario-mesa (REQ-21)

> Melhorias críticas identificadas durante validação em beta para paridade de campos, modalidade online expandida, faixa etária estruturada, edição administrativa e editor rico.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 075 | Fase 3 | banco | 5/5/5 | Migration: plataformas de jogo e comunicação | Criar tabelas `game_platforms` e `communication_platforms` com campos `id UUID PK`, `name TEXT UNIQUE NOT NULL`, `slug TEXT UNIQUE NOT NULL`, `category TEXT`, `is_active BOOLEAN DEFAULT TRUE`. Popular com dados iniciais via seed. Adicionar tabelas de junção `table_game_platforms` e `table_communication_platforms` (many-to-many com `tables`). | `database/migration_11_platforms.sql` | pendente | Plataformas de jogo: Roll20, Foundry VTT, Fantasy Grounds, Owlbear Rodeo, Tabletop Simulator, Astral, Shard, Miro, etc. Comunicação: Discord, Google Meet, Zoom, Skype, TeamSpeak, Jitsi, etc. |
| 076 | Fase 3 | banco | 4/5/5 | Migration: faixa etária estruturada | Alterar coluna `age_rating` de TEXT para ENUM com valores `livre`, `+10`, `+12`, `+14`, `+16`, `+18`. Migrar dados existentes (mapear texto livre para enum mais próximo, padrão `livre`). | `database/migration_12_age_rating_enum.sql` | pendente | Usar `ALTER TYPE` ou recriar coluna. Backup obrigatório antes de aplicar. |
| 077 | Fase 3 | banco | 4/5/4 | Migration: nível da mesa | Adicionar coluna `table_level` ENUM com valores `iniciante`, `intermediario`, `avancado`, `misto` na tabela `tables`. Nullable inicialmente para não quebrar mesas existentes. | `database/migration_13_table_level.sql` | pendente | Campo opcional — mesas antigas podem não ter. |
| 078 | Fase 3 | banco | 4/4/4 | Migration: frequência detalhada | Expandir modelo de frequência: adicionar colunas `frequency_day_of_week TEXT` (segunda/terça/.../domingo), `frequency_times_per_month SMALLINT`, `frequency_custom_notes TEXT`. Aplicável quando `frequency IN ('semanal', 'quinzenal', 'mensal')`. | `database/migration_14_frequency_details.sql` | pendente | `frequency_day_of_week` obrigatório se `frequency = 'semanal'`. `frequency_times_per_month` obrigatório se `frequency = 'quinzenal'`. |
| 079 | Fase 3 | backend | 5/5/5 | Endpoints CRUD de plataformas | Criar rotas admin `GET/POST/PUT/DELETE /api/v1/admin/platforms/game` e `/api/v1/admin/platforms/communication` para gerenciar catálogo de plataformas. Rotas públicas `GET /api/v1/platforms/game` e `GET /api/v1/platforms/communication` para listagem. | `backend/src/routes/platformRoutes.ts`, `backend/src/controllers/platformController.ts` | pendente | Admin pode adicionar novas plataformas conforme surgem. |
| 080 | Fase 3 | backend | 5/5/5 | Atualizar tipos e validações de mesa | Atualizar `backend/src/db/types.ts` com novos campos: `age_rating` (enum), `table_level` (enum), `frequency_day_of_week`, `frequency_times_per_month`, `frequency_custom_notes`. Atualizar validações em `gmPanel.ts` e `tableController.ts`. | `backend/src/db/types.ts`, `backend/src/routes/gmPanel.ts`, `backend/src/controllers/tableController.ts` | pendente | Validar obrigatoriedade condicional de `frequency_day_of_week` e `frequency_times_per_month`. |
| 081 | Fase 3 | backend | 4/5/5 | Endpoint de edição/exclusão administrativa | Criar rotas `PUT /api/v1/admin/tables/:id` e `DELETE /api/v1/admin/tables/:id` que permitem admin editar/excluir qualquer mesa (bypass de ownership). Registrar ação em log de auditoria. | `backend/src/routes/adminRoutes.ts`, `backend/src/controllers/adminController.ts` | pendente | Apenas para role `admin`. Exclusão deve ser soft delete (marcar `deleted_at`) ou hard delete? Definir com responsável. |
| 082 | Fase 3 | backend | 4/4/4 | Suporte a markdown em descrição/regras | Adicionar sanitização de markdown no backend usando biblioteca `marked` + `DOMPurify` (ou equivalente server-side). Aceitar markdown no payload, sanitizar e retornar HTML seguro. | `backend/src/utils/markdownSanitizer.ts`, `backend/src/routes/gmPanel.ts` | pendente | Permitir apenas tags seguras: `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<br>`. Bloquear `<script>`, `<iframe>`, etc. |
| 083 | Fase 3 | frontend | 5/5/5 | Seletor de plataformas de jogo e comunicação | Adicionar ao `CreateTableForm` dois campos multi-select: "Plataformas de Jogo" e "Plataformas de Comunicação". Visíveis apenas quando `modality = 'online'` ou `'hibrida'`. Carregar opções via `GET /api/v1/platforms/*`. Permitir seleção múltipla com chips. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Usar componente de multi-select com busca (ex: react-select). |
| 084 | Fase 3 | frontend | 4/5/5 | Seletor de faixa etária estruturado | Substituir input de texto livre por dropdown com opções: `Livre`, `+10`, `+12`, `+14`, `+16`, `+18`. Valor padrão: `Livre`. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Exibir ícone visual ao lado de cada opção (ex: 🟢 Livre, 🟡 +10, 🟠 +14, 🔴 +18). |
| 085 | Fase 3 | frontend | 4/5/4 | Seletor de nível da mesa | Adicionar campo "Nível da Mesa" com dropdown: `Iniciante`, `Intermediário`, `Avançado`, `Misto`. Campo opcional. Exibir tooltip explicativo. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Tooltip: "Iniciante: para quem nunca jogou. Intermediário: conhece as regras básicas. Avançado: domina o sistema. Misto: aceita todos os níveis." |
| 086 | Fase 3 | frontend | 5/5/5 | Campos de frequência detalhada | Expandir bloco de frequência: se `frequency = 'semanal'`, exibir dropdown "Dia da Semana" (segunda/terça/.../domingo). Se `frequency = 'quinzenal'`, exibir input numérico "Quantas vezes por mês?" (1-4). Se `frequency = 'mensal'`, exibir textarea "Observações" (ex: "Toda primeira sexta-feira do mês"). | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Validação: dia da semana obrigatório se semanal; vezes/mês obrigatório se quinzenal. |
| 087 | Fase 3 | frontend | 3/4/3 | Renomear "Resumo Operacional" → "Informações da Mesa" | Buscar todas as ocorrências de "Resumo Operacional" no frontend e substituir por "Informações da Mesa". Arquivos prováveis: `MesaPage.tsx`, `PainelMestrePage.tsx`. | `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/PainelMestrePage.tsx` | pendente | Busca global com grep para garantir cobertura completa. |
| 088 | Fase 3 | frontend | 5/5/5 | Editor rico para descrição e regras | Integrar biblioteca de editor markdown (avaliar: TipTap, React-Quill, SimpleMDE). Substituir `<textarea>` de `description` e `rules_notes` por editor com toolbar básico (negrito, itálico, listas, links). Preview em tempo real. | `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/components/MarkdownEditor.tsx`, `frontend/package.json` | pendente | **Decisão de biblioteca:** TipTap (moderno, extensível) vs React-Quill (maduro, pesado) vs SimpleMDE (leve, markdown puro). Consultar responsável antes de escolher. |
| 089 | Fase 3 | frontend | 4/5/4 | Renderização de markdown em MesaPage | Atualizar `MesaPage.tsx` para renderizar `description` e `rules_notes` como HTML (já sanitizado pelo backend). Usar `dangerouslySetInnerHTML` ou componente de markdown seguro. | `frontend/src/pages/MesaPage.tsx` | pendente | Depende do item 082 (sanitização no backend). |
| 090 | Fase 3 | frontend | 5/5/5 | Ocultar "Ver perfil do mestre" em mesas de anunciantes | Na `MesaPage.tsx`, verificar `publisher_role`. Se `publisher_role = 'announcer'`, NÃO exibir link "Ver perfil do mestre". Exibir apenas nome do mestre real (`actual_gm_name`) como texto estático. | `frontend/src/pages/MesaPage.tsx` | pendente | Lógica condicional simples: `{publisherRole === 'gm' && <Link to={...}>Ver perfil</Link>}`. |
| 091 | Fase 3 | frontend | 5/5/5 | Botão "Editar Mesa" para admin | Na `MesaPage.tsx`, se usuário logado for admin, exibir botão "✏️ Editar Mesa" (visível apenas para admin). Ao clicar, redirecionar para `/painel-mestre` com formulário pré-preenchido (modo edição). | `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/PainelMestrePage.tsx` | pendente | Requer endpoint `GET /api/v1/admin/tables/:id/edit` que retorna dados completos da mesa para edição. |
| 092 | Fase 3 | frontend | 4/4/4 | Investigar placeholder não funcional | Usuário reportou "placeholder ainda não tá funcionando". Identificar qual campo está com problema (provavelmente `description` ou `rules_notes`). Corrigir atributo `placeholder` no JSX. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Contexto insuficiente — validar com responsável qual campo específico. |
| 094 | Fase 3 | frontend | 5/5/5 | Investigar logout em 5 minutos (REQ-16 não resolveu) | Usuário reportou "Ainda estou desconectando em 5 minutos de sessão" mesmo após REQ-16. Verificar: (1) `.env` do servidor beta tem `JWT_EXPIRES_IN=7d`? (2) Container foi reiniciado após mudança? (3) `AuthContext.tsx` está usando validação inteligente? (4) Há algum timeout adicional no backend (ex: session middleware)? **Atualização 05/04/2026:** Causa raiz identificada — `.env` do servidor beta estava com valor antigo `JWT_EXPIRES_IN=15m`. Solução aplicada: atualizado para `7d` e container reiniciado. Ver E103 em `ERRORS_SOLUTIONS.md`. | `backend/.env`, `frontend/src/contexts/AuthContext.tsx`, `backend/src/middleware/auth.ts` | concluido | **Resolvido em 05/04/2026.** REQ-16 estava correto, mas `.env` do servidor não havia sido atualizado. Container reiniciado com sucesso. |
| 095 | Fase 3 | frontend | 5/5/4 | Caixa de sistema selecionado com refinamento hierárquico (E111) | Sistema selecionado não ficava visível no topo do `SystemTreeSelector`, usuário precisava navegar pela árvore para encontrá-lo. Implementar caixa destacada no topo (após linha 201) que exibe: (1) Sistema base selecionado com ícone de check; (2) Dropdown de edições (se houver); (3) Dropdown de variantes (se edição selecionada e houver variantes); (4) Caminho completo da seleção atual. Viola H1 (Visibilidade do status). **Atualização 05/04/2026:** Implementado com IIFE que calcula hierarquia (baseNode/editionNode/variantNode) a partir do `selectedIds[0]` e renderiza dropdowns condicionais. Build validado (Frontend compilou sem erros). | `frontend/src/components/SystemTreeSelector.tsx` | concluido | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026. Solução documentada em E111. Melhora significativa de UX ao permitir refinamento hierárquico direto na caixa de seleção. |
| 096 | Fase 3 | frontend | 4/4/3 | Expandir "Ver dados brutos" com todos os campos | Usuário reportou "O ver dados brutos ainda não tá mostrando tudo". Verificar implementação do item 049. Garantir que `JSON.stringify(candidate.parsed_json, null, 2)` está exibindo o objeto completo, não apenas subset. | `frontend/src/pages/GestaoPage.tsx` | pendente | Pode ser problema de truncamento visual (altura do `<pre>`) ou dados realmente incompletos no `parsed_json`. |
| 097 | Fase 3 | banco | 4/5/4 | Migration: cenário e estilos | Adicionar colunas `setting_name TEXT` (nome do cenário, ex: "Forgotten Realms") e `setting_styles TEXT[]` (array de estilos, ex: ["Alta Fantasia", "Aventura Épica"]) na tabela `tables`. Criar tabela auxiliar `setting_style_suggestions` com colunas `id UUID PK`, `setting_name TEXT`, `suggested_styles TEXT[]` para mapeamento cenário→estilos sugeridos. | `database/migration_15_setting_and_styles.sql` | pendente | Campo `setting_name` é texto livre. `setting_styles` permite múltiplos estilos. Tabela de sugestões é apenas para auto-complete, não constraint. |
| 098 | Fase 3 | backend | 4/5/4 | Endpoint de sugestões de estilo por cenário | Criar rota `GET /api/v1/settings/suggest-styles?setting=<nome>` que retorna array de estilos sugeridos baseado em match fuzzy do nome do cenário na tabela `setting_style_suggestions`. Se não encontrar match, retornar array vazio. | `backend/src/routes/settingRoutes.ts`, `backend/src/controllers/settingController.ts` | pendente | Usar busca fuzzy (similar ao `findSystemId`). Exemplos: "Forgotten Realms" → ["Alta Fantasia", "Aventura Épica"], "Eberron" → ["Steampunk", "Magitech", "Noir"]. |
| 099 | Fase 3 | backend | 3/4/3 | Endpoint CRUD de mapeamento cenário→estilos (admin) | Criar rotas admin `GET/POST/PUT/DELETE /api/v1/admin/setting-suggestions` para gerenciar tabela `setting_style_suggestions`. Permite admin adicionar novos mapeamentos conforme cenários populares surgem. | `backend/src/routes/adminRoutes.ts` | pendente | Apenas para role `admin`. Facilita manutenção da tabela de sugestões sem precisar de migration. |
| 100 | Fase 3 | frontend | 5/5/5 | Campos de Cenário e Estilo no formulário | Adicionar ao `CreateTableForm`: (1) Campo "Cenário" (input texto livre, ex: "Forgotten Realms"); (2) Campo "Estilos" (multi-select com chips). Ao digitar no campo Cenário (debounce 500ms), chamar `GET /api/v1/settings/suggest-styles?setting=<valor>` e pré-popular campo Estilos com sugestões (usuário pode aceitar, remover ou adicionar outros). Exibir na `MesaPage.tsx` como "Cenário: Forgotten Realms | Estilos: Alta Fantasia, Aventura Épica". | `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/pages/MesaPage.tsx` | pendente | UX: sugestões aparecem como chips pré-selecionados (fundo claro), usuário pode clicar no X para remover ou adicionar manualmente outros estilos. |

---

## Itens da fila — Lote: painel-crud-admin (REQ-23)

> Painel administrativo CRUD completo para gerenciar sistemas, cenários e mesas diretamente do banco de dados via interface web.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 101 | Fase 4 | backend | 5/5/5 | Rotas CRUD de sistemas (POST/PUT/DELETE) | Criar rotas `POST /api/v1/admin/systems`, `PUT /api/v1/admin/systems/:id`, `DELETE /api/v1/admin/systems/:id`. Validações: slug único, parent_id válido, cálculo automático de depth e path_slug, verificar dependências antes de deletar (sistemas com mesas ou filhos vinculados). Todas protegidas por `requireRole('admin')`. | `backend/src/routes/systems.ts` | concluido | Implementado em 05/04/2026. Commit `fe8dfbf`. Hierarquia recalculada automaticamente ao mudar parent_id. |
| 102 | Fase 4 | backend | 5/5/5 | Rotas CRUD de cenários (POST/PUT/DELETE) | Criar rotas `POST /api/v1/admin/scenarios`, `PUT /api/v1/admin/scenarios/:id`, `DELETE /api/v1/admin/scenarios/:id`. Validações: slug único, subgenres como array, verificar dependências antes de deletar (cenários com mesas vinculadas). Todas protegidas por `requireRole('admin')`. | `backend/src/routes/scenarios.ts` | concluido | Implementado em 05/04/2026. Commit `be1ca16`. Suporte completo a subgêneros como array. |
| 103 | Fase 4 | backend | 5/5/5 | Rotas CRUD de mesas (PUT/DELETE) | Criar rotas `PUT /api/v1/admin/tables/:id`, `DELETE /api/v1/admin/tables/:id`. Validações: system_id e scenario_id existem, deleção em transação (cascade de contatos). Todas protegidas por `requireRole('admin')`. | `backend/src/routes/gmPanel.ts` | concluido | Implementado em 05/04/2026. Commit `fe8dfbf`. Deleção com cascade de table_contacts. Edição completa de todos os campos. |
| 104 | Fase 4 | frontend | 5/5/5 | SystemEditModal com hierarquia e aliases | Criar modal `SystemEditModal.tsx` para criar/editar sistemas. Campos: nome, slug (auto-gerado), tipo (system/edition/variant), pai (dropdown hierárquico), aliases (tags). Validação inline. Modo create/edit unificado. | `frontend/src/components/SystemEditModal.tsx` | concluido | Implementado em 05/04/2026. Commit `0b07d1e`. Auto-geração de slug, dropdown hierárquico de sistemas pai, suporte a aliases. |
| 105 | Fase 4 | frontend | 5/5/5 | ScenarioEditModal com subgêneros | Criar modal `ScenarioEditModal.tsx` para criar/editar cenários. Campos: nome, slug (auto-gerado), subgêneros (tags). Validação inline. Modo create/edit unificado. | `frontend/src/components/ScenarioEditModal.tsx` | concluido | Implementado em 05/04/2026. Commit `0b07d1e`. Auto-geração de slug, input de tags para subgêneros. |
| 106 | Fase 4 | frontend | 5/5/5 | Aba "Gerenciar Conteúdo" em /gestao | Adicionar nova aba "Gerenciar Conteúdo" na `GestaoPage.tsx` com 3 sub-abas: Sistemas, Cenários, Mesas. Cada sub-aba com listagem, busca em tempo real por nome/slug, botão "Adicionar", botões de editar/deletar por item. Integração com modais de edição. | `frontend/src/pages/GestaoPage.tsx` | concluido | Implementado em 05/04/2026. Commit `3071300`. Busca em tempo real, confirmação antes de deletar, feedback visual com toasts. |

---

## Itens da fila — Lote: parser-fase-b (Fase 4 - REQ-24)

> Parser Python Fase B — Funcionalidades Avançadas: Expandir capacidades do parser para extrair metadados avançados (múltiplos horários, vagas detalhadas, classificação de sistema/pagamento/tipo, separação mestre vs anunciante).

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 107 | Fase 4 | backend | 5/5/5 | Parser Python - 7 funções avançadas | Implementar 7 novas funções no parser Python: `extract_multiple_schedules()`, `extract_slots_detailed()`, `classify_system()`, `classify_payment()`, `classify_candidate_kind()`, `resolve_master_vs_recruiter()`. Retornar 15 novos campos em `ParsedMessage`. | `backend/src/services/aggregator/parser/discord_message_parser.py`, `backend/src/services/aggregator/parser/schemas.py` | concluido | Implementado em 05/04/2026. 7 funções (312 linhas). Interface `SessionSchedule` criada. Teste validado com sucesso. |
| 108 | Fase 4 | backend | 5/5/5 | Migration 07 - 15 colunas avançadas | Criar `migration_07_advanced_parser.sql` com 15 novas colunas na tabela `import_candidates`: `sessions JSONB`, `slots_total INT`, `slots_available INT`, `slots_filled INT`, `system_raw TEXT`, `system_normalized TEXT`, `system_classification TEXT`, `is_homebrew BOOLEAN`, `is_custom BOOLEAN`, `payment_classification TEXT`, `candidate_kind TEXT`, `master_display_name TEXT`, `publisher_role TEXT`, `is_same_person BOOLEAN`, `parser_version TEXT`. Adicionar 9 índices para performance. | `backend/src/migrations/migration_07_advanced_parser.sql` | concluido | Implementado em 05/04/2026. 15 colunas + 9 índices (GIN para JSONB, B-tree para classificações). |
| 109 | Fase 4 | backend | 5/5/5 | Backend TypeScript - Integração 15 campos | Atualizar `types.ts` e `parseExporterMessage.ts` para extrair e mapear os 15 novos campos do parser Python. Adicionar interface `SessionSchedule` ao TypeScript. | `backend/src/domain/aggregator/types.ts`, `backend/src/domain/aggregator/parseExporterMessage.ts` | concluido | Implementado em 05/04/2026. Interface `SessionSchedule` criada. Mapeamento completo dos 15 campos. |
| 110 | Fase 4 | frontend | 4/5/4 | Bug fix - GestaoPage filtro approved→accepted | Corrigir bug onde abas "aprovadas" e "rejeitadas" mostravam dados idênticos. Causa: mapeamento incorreto `approved` → `accepted` na query do backend. | `frontend/src/pages/GestaoPage.tsx` | concluido | Implementado em 05/04/2026. Linha 329 corrigida. |
| 111 | Fase 4 | fullstack | 5/5/5 | Feature DELETE permanente de candidatos | Implementar deleção permanente de candidatos em qualquer status (awaiting_review, accepted, rejected). Backend: rota `DELETE /api/v1/aggregator/candidates/:id` + método `deleteById` no `candidateService`. Frontend: botão de lixeira com modal de confirmação em todos os status. | `backend/src/routes/aggregatorReview.ts`, `backend/src/services/aggregator/candidateService.ts`, `frontend/src/pages/GestaoPage.tsx` | concluido | Implementado em 05/04/2026. Botão Trash2 adicionado em 3 seções (pending, accepted, rejected). Modal com aviso de ação irreversível. |
| 112 | Fase 4 | backend | 4/5/4 | Bug fix - PUT systems/:id não atualizava aliases | Corrigir bug onde edição de sistema não persistia aliases. Causa: rota PUT não processava campo `aliases` do body. Solução: adicionar lógica de delete + insert de aliases na rota PUT. | `backend/src/routes/systems.ts` | concluido | Implementado em 05/04/2026. Linhas 324-350 adicionadas. Delete de aliases existentes + insert de novos aliases. |


---

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
