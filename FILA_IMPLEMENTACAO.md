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
| 017A | Fase 2 | backend | Carga idempotente da árvore de sistemas | Criar script `systems:import-tree` para upsert de taxonomia (`sistema > edição > variante`) e aliases a partir de `arvores_de_sistemas.md`, sem reset de banco, com chave estável por `path_slug` | `backend/src/scripts/systemsTreeImport.ts`, `backend/package.json` | concluido | Script executado no beta (125 nós, `path_slug` `dungeons-dragons/5e/2024` confirmado). Observação operacional: após rebuild do container, ainda requer rotina manual `docker cp` + `docker exec` até fix no Dockerfile. |
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
| 047 | Fase 4 | frontend | 5/5/4 | Busca inteligente de sistema na árvore | Sistema extraído (ex: "Ashen Stars") não está sendo pré-selecionado no formulário. Criar função `findSystemId()` que recebe árvore de sistemas e faz busca fuzzy/normalizada do nome. Retornar `system_id` se encontrado, `null` caso contrário. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026: função `findSystemId()` com 3 estratégias (match exato, aliases, fuzzy). GestaoPage carrega árvore de sistemas e passa para mapeamento. **Aguardando validação em beta.** |
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
