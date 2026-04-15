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

> ⚠️ **Fase 6 permanece bloqueada.** Exportação formatada só entra em desenvolvimento após as Fases 1 a 5 estarem rodando e validadas em beta.

---

## Itens da fila — Lote: fundacao-schema-auth (Fase 1)

| ID  | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 015 | 1 | back  | 3/4/4 | Serviço de Imagens Imgur | Pipeline com Sharp WebP + envio Imgur anon (Client ID restrito) | `backend/src/services/` | pendente | Depende da estabilização do núcleo já validado no beta |

---

## Itens da fila — Lote: catalogo-publico (Fase 2)

| ID | Fase | Tipo | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|
| 017A | Fase 2 | backend | Carga idempotente de sistemas e cenários | Criar script `systems:import` para upsert de taxonomia (`sistema > edição > variante`) a partir de `sistemas.json` e script `scenarios:import` para carga de cenários com subgêneros a partir de `cenarios.json`, sem reset de banco, com chave estável por `path_slug` | `backend/src/scripts/systemsImport.ts`, `backend/src/scripts/scenariosImport.ts`, `backend/package.json` | pendente | **Atualização 05/04/2026:** Migração de `arvores_de_sistemas.md` para `sistemas.json` + novo `cenarios.json` (com campo `subgenero`). Dockerfile será atualizado para copiar ambos os arquivos JSON. Aguardando recebimento dos arquivos para implementação. |


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
| 027 | Fase 5 | banco | Tabelas de engajamento | Criar `questions`, `answers`, `reviews`, `bookmarks`, `table_interests` (campos: `id UUID PK`, `user_id UUID FK`, `table_id UUID FK`, `message TEXT`, `created_at TIMESTAMPTZ`) | `database/migration_03_engagement.sql` | pendente | Critério: npm run build passa + migrations aplicadas sem erro + tabelas criadas no banco |
| 028 | Fase 5 | backend | Endpoints de perguntas, avaliações e interesse | Q&A público por mesa, avaliações autenticadas, `POST /tables/:id/interest` (requer `player`) que registra em `table_interests` e notifica mestre | Ajuste em `tableRoutes.ts` + novos controllers | pendente | Notificação ao mestre pode ser via email ou flag no painel, a definir |
| 029 | Fase 5 | frontend | Q&A e avaliações nas páginas de mesa | Ativar seções que ficaram como placeholder na Fase 2 | Ajuste em `MesaPage.tsx` | pendente | — |
| 030 | Fase 5 | frontend | Bookmarks e interesse | Salvar/remover mesa favorita (bookmark), lista no painel do jogador. Botão "Tenho interesse" na página da mesa (visível para jogadores logados) com campo opcional de mensagem ao mestre | `frontend/src/components/BookmarkButton.tsx`, `frontend/src/components/InterestButton.tsx` | pendente | — |

---

## Itens da fila — Lote: exportacao-formatada (Fase 6) — BLOQUEADO

---

## Itens da fila — Lote: auditoria-ux-nielsen (REQ-17)

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 039 | Fase 2-4 | frontend | 4/5/5 | Auditoria UX completa (10 Heurísticas de Nielsen) | Criar plano de ação detalhado auditando toda a interface (catálogo, painel do mestre, gestão, onboarding) contra as 10 heurísticas. Identificar gaps por heurística, priorizar correções críticas, implementar melhorias incrementais. | Múltiplos arquivos | pendente | REQ-17. Documentação completa em `OPERACAO_PRODUCAO.md` seção 11. Regra obrigatória adicionada ao `AGENTS.md`. Executar após estabilização das Fases 1-3. |
| 045 | Fase 4 | backend/frontend | 5/5/5 | **[CRÍTICO] Investigar e corrigir erros 401 Unauthorized** | Console mostra múltiplos erros 401 ao acessar `/gestao`: `GET /api/v1/me 401`. Possíveis causas: token JWT não sendo enviado, middleware rejeitando token válido, CORS, headers. **Bloqueia carregamento de dados na página de gestão.** | `backend/src/middleware/auth.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 125 (5×5×5).** Implementado em 05/04/2026: `AuthContext.tsx` usava caminhos relativos (`/api/v1/me`) ao invés de `${API_BASE}/api/v1/me`. Solução documentada em E105. **Aguardando validação em beta.** |
| 046 | Fase 4 | frontend | 4/5/4 | Sanitização de dados extraídos no helper de mapeamento | Campos como "Título" aparecem com prefixos técnicos do Discord (ex: `# Título: Arquivo 13`). Criar função `sanitizeText()` que remove prefixos (`# Título:`, `**Título:**`, etc.) antes de mapear para o formulário. Viola H8 (Minimalismo). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: função `sanitizeText()` remove 10 padrões de prefixos técnicos do Discord. **Aguardando validação em beta.** |
| 047 | Fase 4 | frontend | 5/5/4 | Busca inteligente de sistema na árvore | Sistema extraído (ex: "Ashen Stars") não está sendo pré-selecionado no formulário. Criar função `findSystemId()` que recebe árvore de sistemas e faz busca fuzzy/normalizada do nome. Retornar `system_id` se encontrado, `null` caso contrário. Viola H6 (Reconhecimento). **Atualização 05/04/2026:** Função implementada, mas depende do parser Python (E109) para popular `enrichedFields.system`. Parser não estava sendo copiado no Dockerfile — correção aplicada (linha 43). Aguarda rebuild do container beta. | `frontend/src/utils/candidateToFormData.ts` | em_execucao | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026: função `findSystemId()` com 3 estratégias (match exato, aliases, fuzzy). GestaoPage carrega árvore de sistemas e passa para mapeamento. **Aguarda deploy do Dockerfile corrigido para validação completa em beta.** |
| 048 | Fase 4 | frontend | 3/4/3 | Remover modal de motivo de rejeição | Ao clicar em "Rejeitar", aparece modal pedindo motivo. Rejeição deve ser **direta e rápida** (apenas confirmação). Candidatos vêm de JSON (não há usuário para notificar). Viola H7 (Eficiência). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 36 (3×4×3).** Implementado em 05/04/2026: substituído `prompt()` por `confirm()` direto. Motivo padrão "Rejeitado pelo admin". **Aguardando validação em beta.** |
| 049 | Fase 4 | frontend | 4/5/4 | Adicionar seção expansível com dados brutos do candidato | Modal de revisão mostra apenas 3 campos (Título, Sistema, Confiança). Admin precisa ver **todas as informações do anúncio original** (descrição completa, texto de recrutamento, plataformas, horários, requisitos, etc.). Adicionar seção expansível "Ver dados brutos" com JSON formatado. Viola H1 (Visibilidade do status). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: botão "Ver/Ocultar dados brutos" com JSON formatado em `<pre>` com scroll. **Aguardando validação em beta.** |
| 050 | Fase 4 | frontend | 4/4/3 | Forçar publisher_role = 'announcer' para candidatos importados | Campo "Quem está publicando esta mesa?" está com "Sou o mestre" selecionado. Se mesa veio de JSON importado, `publisher_role` deve ser automaticamente `'announcer'`. Admin não é o mestre real da mesa. | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 48 (4×4×3).** Implementado em 05/04/2026: `publisher_role` forçado como 'announcer' em `mapCandidateToFormData()`. **Aguardando validação em beta.** |
| 051 | Fase 4 | frontend | 5/5/4 | Mapear todos os campos do JSON para o formulário | Diversos campos que existem no JSON não estão sendo mapeados: `modality`, `type`, `slots_total`, `language`, `starts_at`, `frequency`, `description`, `rules_notes`. Sistema deve ser **inteligente** e aproveitar ao máximo os dados extraídos. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 100 (5×5×4).** Implementado em 05/04/2026: interface `CandidateFormData` expandida com 8 novos campos. Mapeamento completo implementado. **Aguardando validação em beta.** |
| 052 | Fase 4 | frontend | 4/5/4 | Pré-preencher canal Discord com username do autor | Campo "Canais de recrutamento" está vazio. Se mesa veio de JSON do Discord, canal deveria ser `discord` e valor deveria ser o `authorUsername`/`authorHandle` do JSON. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts` | em_validacao | **Score GUT: 80 (4×5×4).** Implementado em 05/04/2026: `contacts[]` pré-preenchido com Discord quando `authorUsername` ou `authorHandle` presentes. **Aguardando validação em beta.** |
| 053 | Fase 4 | frontend | 3/4/3 | Pré-preencher banner_url e adicionar preview de imagem | Campo "URL do Banner" está vazio. Se JSON contém `imageUrl`/`banner`/`thumbnail`, campo deveria estar pré-preenchido. Adicionar preview da imagem abaixo do campo com tratamento de erro. Viola H6 (Reconhecimento). | `frontend/src/utils/candidateToFormData.ts`, `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 64 (4×4×4).** Implementado em 05/04/2026: `banner_url` mapeado + preview visual no modal com `onError` handler. **Aguardando validação em beta.** |
| 054 | Fase 4 | frontend | 4/4/3 | Expandir seção "Dados Extraídos" com todos os campos principais | Seção "Dados Extraídos Automaticamente" mostra apenas Título, Sistema e Confiança. Adicionar grid com todos os campos principais: Modalidade, Tipo, Vagas, Idioma, Descrição completa (se houver). Melhora contexto para decisão de aprovação/rejeição. Viola H1 (Visibilidade). | `frontend/src/pages/GestaoPage.tsx` | em_validacao | **Score GUT: 48 (4×4×3).** Implementado em 05/04/2026: seção expandida com 7 campos + descrição completa quando disponível. **Aguardando validação em beta.** |
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
| 081 | Fase 3 | backend | 4/5/5 | Endpoint de edição/exclusão administrativa | Criar rotas `PUT /api/v1/admin/tables/:id` e `DELETE /api/v1/admin/tables/:id` que permitem admin editar/excluir qualquer mesa (bypass de ownership). Registrar ação em log de auditoria. | `backend/src/routes/adminRoutes.ts`, `backend/src/controllers/adminController.ts` | parcialmente_concluido | **Atualização 13/04/2026:** Endpoints GM já existem (`PUT/DELETE /api/v1/gm/tables/:id`). Falta criar versão admin que bypassa ownership. Exclusão deve ser soft delete (marcar `deleted_at`) ou hard delete? Definir com responsável. |
| 082 | Fase 3 | backend | 4/4/4 | Suporte a markdown em descrição/regras | Adicionar sanitização de markdown no backend usando biblioteca `marked` + `DOMPurify` (ou equivalente server-side). Aceitar markdown no payload, sanitizar e retornar HTML seguro. | `backend/src/utils/markdownSanitizer.ts`, `backend/src/routes/gmPanel.ts` | pendente | Permitir apenas tags seguras: `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<br>`. Bloquear `<script>`, `<iframe>`, etc. |
| 083 | Fase 3 | frontend | 5/5/5 | Seletor de plataformas de jogo e comunicação | Adicionar ao `CreateTableForm` dois campos multi-select: "Plataformas de Jogo" e "Plataformas de Comunicação". Visíveis apenas quando `modality = 'online'` ou `'hibrida'`. Carregar opções via `GET /api/v1/platforms/*`. Permitir seleção múltipla com chips. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Usar componente de multi-select com busca (ex: react-select). |
| 084 | Fase 3 | frontend | 4/5/5 | Seletor de faixa etária estruturado | Substituir input de texto livre por dropdown com opções: `Livre`, `+10`, `+12`, `+14`, `+16`, `+18`. Valor padrão: `Livre`. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Exibir ícone visual ao lado de cada opção (ex: 🟢 Livre, 🟡 +10, 🟠 +14, 🔴 +18). |
| 085 | Fase 3 | frontend | 4/5/4 | Seletor de nível da mesa | Adicionar campo "Nível da Mesa" com dropdown: `Iniciante`, `Intermediário`, `Avançado`, `Misto`. Campo opcional. Exibir tooltip explicativo. | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Tooltip: "Iniciante: para quem nunca jogou. Intermediário: conhece as regras básicas. Avançado: domina o sistema. Misto: aceita todos os níveis." |
| 086 | Fase 3 | frontend | 5/5/5 | Campos de frequência detalhada | Expandir bloco de frequência: se `frequency = 'semanal'`, exibir dropdown "Dia da Semana" (segunda/terça/.../domingo). Se `frequency = 'quinzenal'`, exibir input numérico "Quantas vezes por mês?" (1-4). Se `frequency = 'mensal'`, exibir textarea "Observações" (ex: "Toda primeira sexta-feira do mês"). | `frontend/src/pages/PainelMestrePage.tsx` | pendente | Validação: dia da semana obrigatório se semanal; vezes/mês obrigatório se quinzenal. |
| 087 | Fase 3 | frontend | 3/4/3 | Renomear "Resumo Operacional" → "Informações da Mesa" | Buscar todas as ocorrências de "Resumo Operacional" no frontend e substituir por "Informações da Mesa". Arquivos prováveis: `MesaPage.tsx`, `PainelMestrePage.tsx`. | `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/PainelMestrePage.tsx` | pendente | Busca global com grep para garantir cobertura completa. |
| 088 | Fase 3 | frontend | 5/5/5 | Editor rico para descrição e regras | Integrar biblioteca de editor markdown (avaliar: TipTap, React-Quill, SimpleMDE). Substituir `<textarea>` de `description` e `rules_notes` por editor com toolbar básico (negrito, itálico, listas, links). Preview em tempo real. | `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/components/MarkdownEditor.tsx`, `frontend/package.json` | pendente | **Decisão de biblioteca:** TipTap (moderno, extensível) vs React-Quill (maduro, pesado) vs SimpleMDE (leve, markdown puro). Consultar responsável antes de escolher. |
| 089 | Fase 3 | frontend | 4/5/4 | Renderização de markdown em MesaPage | Atualizar `MesaPage.tsx` para renderizar `description` e `rules_notes` como HTML (já sanitizado pelo backend). Usar `dangerouslySetInnerHTML` ou componente de markdown seguro. | `frontend/src/pages/MesaPage.tsx` | pendente | Depende do item 082 (sanitização no backend). |
| 090 | Fase 3 | frontend | 5/5/5 | Ocultar "Ver perfil do mestre" em mesas de anunciantes | Na `MesaPage.tsx`, verificar `publisher_role`. Se `publisher_role = 'announcer'`, NÃO exibir link "Ver perfil do mestre". Exibir apenas nome do mestre real (`actual_gm_name`) como texto estático. | `frontend/src/pages/MesaPage.tsx` | pendente | Lógica condicional simples: `{publisherRole === 'gm' && <Link to={...}>Ver perfil</Link>}`. |
| 091 | Fase 3 | frontend | 5/5/5 | Botão "Editar Mesa" para admin | Na `MesaPage.tsx`, se usuário logado for admin, exibir botão "✏️ Editar Mesa" (visível apenas para admin). Ao clicar, redirecionar para `/painel` com formulário pré-preenchido (modo edição). | `frontend/src/pages/MesaPage.tsx`, `frontend/src/pages/PainelMestrePage.tsx` | parcialmente_concluido | **Atualização 13/04/2026:** Botão "Editar mesa" já existe para owner (item 141/152 concluído). Falta: (1) Exibir botão também para admin; (2) Verificar se `GET /api/v1/gm/tables/:id` funciona para admin ou criar endpoint admin específico. Fluxo de edição via URL já funciona corretamente. |
| 096 | Fase 3 | frontend | 4/4/3 | Expandir "Ver dados brutos" com todos os campos | Usuário reportou "O ver dados brutos ainda não tá mostrando tudo". Verificar implementação do item 049. Garantir que `JSON.stringify(candidate.parsed_json, null, 2)` está exibindo o objeto completo, não apenas subset. | `frontend/src/pages/GestaoPage.tsx` | pendente | Pode ser problema de truncamento visual (altura do `<pre>`) ou dados realmente incompletos no `parsed_json`. |
| 097 | Fase 3 | banco | 4/5/4 | Migration: cenário e estilos | Adicionar colunas `setting_name TEXT` (nome do cenário, ex: "Forgotten Realms") e `setting_styles TEXT[]` (array de estilos, ex: ["Alta Fantasia", "Aventura Épica"]) na tabela `tables`. Criar tabela auxiliar `setting_style_suggestions` com colunas `id UUID PK`, `setting_name TEXT`, `suggested_styles TEXT[]` para mapeamento cenário→estilos sugeridos. | `database/migration_15_setting_and_styles.sql` | pendente | Campo `setting_name` é texto livre. `setting_styles` permite múltiplos estilos. Tabela de sugestões é apenas para auto-complete, não constraint. |
| 098 | Fase 3 | backend | 4/5/4 | Endpoint de sugestões de estilo por cenário | Criar rota `GET /api/v1/settings/suggest-styles?setting=<nome>` que retorna array de estilos sugeridos baseado em match fuzzy do nome do cenário na tabela `setting_style_suggestions`. Se não encontrar match, retornar array vazio. | `backend/src/routes/settingRoutes.ts`, `backend/src/controllers/settingController.ts` | pendente | Usar busca fuzzy (similar ao `findSystemId`). Exemplos: "Forgotten Realms" → ["Alta Fantasia", "Aventura Épica"], "Eberron" → ["Steampunk", "Magitech", "Noir"]. |
| 099 | Fase 3 | backend | 3/4/3 | Endpoint CRUD de mapeamento cenário→estilos (admin) | Criar rotas admin `GET/POST/PUT/DELETE /api/v1/admin/setting-suggestions` para gerenciar tabela `setting_style_suggestions`. Permite admin adicionar novos mapeamentos conforme cenários populares surgem. | `backend/src/routes/adminRoutes.ts` | pendente | Apenas para role `admin`. Facilita manutenção da tabela de sugestões sem precisar de migration. |
| 100 | Fase 3 | frontend | 5/5/5 | Campos de Cenário e Estilo no formulário | Adicionar ao `CreateTableForm`: (1) Campo "Cenário" (input texto livre, ex: "Forgotten Realms"); (2) Campo "Estilos" (multi-select com chips). Ao digitar no campo Cenário (debounce 500ms), chamar `GET /api/v1/settings/suggest-styles?setting=<valor>` e pré-popular campo Estilos com sugestões (usuário pode aceitar, remover ou adicionar outros). Exibir na `MesaPage.tsx` como "Cenário: Forgotten Realms | Estilos: Alta Fantasia, Aventura Épica". | `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/pages/MesaPage.tsx` | pendente | UX: sugestões aparecem como chips pré-selecionados (fundo claro), usuário pode clicar no X para remover ou adicionar manualmente outros estilos. |

---

---

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
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-frontend
   ```

## Referências

- `GIT_WORKFLOW.md`
- `ARQUITETURA_PROJETO.md`

## Limite de escopo

Este arquivo controla fila de execução; não define arquitetura de produto.

---

---

## Itens da fila — Lote: revisao-onboarding-mesas (Fase 3) — ⚡ PRIORIDADE IMEDIATA

> Correção de bugs críticos identificados em 12/04/2026 no fluxo de criação/edição de mesas, melhorias de UX no onboarding, e novas features de taxonomia bilíngue e sugestão de sistemas/cenários pelo mestre.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 143 | Fase 3 | banco+backend | 4/5/4 | Adicionar campo `name_pt` em sistemas e cenários | Criar campo `name_pt TEXT` (nullable) nas tabelas `systems` e `scenarios` para armazenar o nome em português do sistema/cenário. Exemplos: sistema `Dungeons & Dragons` → `name_pt = "Masmorras e Dragões"` (nome oficial PT-BR quando existe); cenário `Forgotten Realms` → `name_pt = "Reinos Esquecidos"`. Migration: `ALTER TABLE systems ADD COLUMN IF NOT EXISTS name_pt TEXT; ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS name_pt TEXT;`. Backend: atualizar endpoints `GET /api/v1/systems`, `GET /api/v1/scenarios` para retornar `name_pt`. CRUD admin de sistemas/cenários deve incluir campo `name_pt` no payload de criação/edição. | `database/migration_17_name_pt.sql`, `backend/src/routes/systems.ts`, `backend/src/routes/scenarios.ts` | concluido | **Atualização 15/04/2026:** no fluxo atual do repositório, a cobertura está em `migration_102_add_name_pt.sql` + `migration_103_scenario_suggestions.sql` com gate automático `apply_required_migrations.sh` nos workflows de deploy. Evidência operacional em run real beta/prod com schema mínimo confirmado (`system_suggestions.name_pt` e `scenario_suggestions`). |
| 144 | Fase 3 | frontend | 4/5/4 | Exibir nome PT/EN no onboarding e catálogo (toggle bilíngue) | No `SystemTreeSelector` e no seletor de cenário do onboarding de mesa: se o sistema/cenário tiver `name_pt`, exibir ambos os nomes com opção de escolher qual usar como rótulo da mesa (ex: radio "Usar nome em inglês / Usar nome em português"). O nome escolhido pelo mestre é salvo num campo `display_name_override TEXT` ou simplesmente guiado pelo `language` da mesa. No catálogo público, exibir nome PT quando disponível e o usuário tiver preferência PT-BR. | `frontend/src/components/SystemTreeSelector.tsx`, `frontend/src/features/create-table/`, `frontend/src/pages/CatalogPage.tsx` | pendente | **Score GUT: 80 (4×5×4).** Depende do item 143. UX: não forçar nome PT — deixar mestre escolher. |
| 145 | Fase 3 | frontend | 4/5/4 | Sugestão de novo sistema ou cenário pelo mestre no onboarding | No formulário de criação de mesa (Etapa de sistema/cenário), adicionar botão "Não encontrei meu sistema" e "Não encontrei meu cenário". Ao clicar, abre modal simples com: nome do sistema/cenário sugerido (texto livre), tipo (sistema / edição / variante, para sistemas), observação opcional. Chama `POST /api/v1/system-suggestions` (já existe no backend) com `status = 'pending'` e notifica admin. Para cenários, criar endpoint equivalente `POST /api/v1/scenario-suggestions` se não existir. Admin revisa via painel de gestão. | `frontend/src/features/create-table/steps/`, `frontend/src/components/SystemSuggestionModal.tsx`, `backend/src/routes/scenarios.ts` | pendente | **Score GUT: 80 (4×5×4).** Endpoint `POST /api/v1/system-suggestions` já implementado no backend (migration_06). Para cenários, verificar se endpoint existe ou criar. Fluxo de notificação ao admin via sino já implementado (REQ-15). |
| 146 | Fase 3 | frontend | 4/5/4 | Corrigir duplicata de frequência de sessões na Etapa 3 do onboarding | Foi identificado que o campo de frequência de sessões aparece duplicado na Etapa 3 do formulário de criação de mesa. Investigar: (1) Verificar os steps do formulário multi-etapas em `frontend/src/features/create-table/steps/`; (2) Identificar em quais arquivos o campo de frequência (`frequency`, `SessionRepeater` ou equivalente) é renderizado; (3) Remover a duplicata mantendo apenas a versão mais completa e funcional; (4) Verificar se o estado do form não é perdido após a remoção. Documentar qual versão foi mantida e por quê. | `frontend/src/features/create-table/steps/Step3*.tsx` ou equivalente, `frontend/src/components/SessionRepeater.tsx` | pendente | **Score GUT: 80 (4×5×4).** Bug UX — confunde o mestre. Prioridade alta pois está no fluxo principal de publicação. |
| 147 | Fase 3 | frontend+backend | 5/5/5 | Redesenho do bloco de vagas — simplificar e corrigir confusão | Os campos `slots_per_session` (vagas por sessão), `slots_total` (vagas totais) e `slots_open` (vagas abertas para recrutamento) estão confusos e sobrepostos no formulário. Decisão arquitetural: (1) **Remover `slots_per_session`** — não existe no schema do banco como campo principal, é redundante com `slots_total` para maioria dos casos; (2) Manter apenas **dois campos claros**: `slots_total` = "Quantas vagas tem a mesa no total?" e `slots_open` = "Quantas vagas estão abertas para recrutamento agora?"; (3) Validação: `slots_open <= slots_total`; (4) No catálogo, exibir como "X/Y vagas disponíveis". Frontend: reorganizar a UX do bloco de vagas com labels claros e tooltip explicativo. Backend: verificar se `slots_per_session` existe no schema — se não existir, remover do payload enviado. | `frontend/src/features/create-table/steps/`, `frontend/src/pages/PainelMestrePage.tsx`, `backend/src/routes/gmPanel.ts`, `backend/src/db/types.ts` | pendente | **Score GUT: 125 (5×5×5).** Confusão crítica que impede publicação correta. Revisar schema do banco antes de implementar — verificar quais colunas realmente existem em `tables`. Verificar migration_100 (`slots_open`). |
| 148 | Fase 3 | frontend | 5/5/4 | Conectar editor rico (TipTap) a todos os campos de texto longo | Os campos "Sinopse Narrativa (opcional)", "Estilo de Jogo (opcional)" e "Observações (opcional)" na Etapa 2 do onboarding, bem como a "Descrição da Mesa" na Etapa 1, exibem uma barra de ferramentas de editor rico mas a formatação não funciona (texto não é formatado). Ação: (1) Instalar TipTap (`@tiptap/react`, `@tiptap/starter-kit`) se ainda não instalado; (2) Substituir `<textarea>` por `<EditorContent>` do TipTap em todos os campos afetados: `description`, `synopsis`, `style_text`, `rules_notes`/observações; (3) Serializar saída como HTML sanitizado antes de enviar ao backend; (4) Renderizar HTML na `MesaPage.tsx` com `dangerouslySetInnerHTML` (já planejado no item 089). Testar que o editor não quebra o formulário multi-etapas. | `frontend/src/features/create-table/steps/`, `frontend/src/components/RichTextEditor.tsx` (criar), `frontend/package.json` | pendente | **Score GUT: 100 (5×5×4).** Campos com editor quebrado geram frustração imediata no mestre. Depende do item 082 (sanitização no backend) — implementar juntos ou garantir que sanitização já existe. |
| 149 | Fase 3 | frontend | 3/4/3 | Preview da imagem ao digitar URL do banner (onboarding e edição) | Na etapa de revisão/imagem do onboarding e no formulário de edição de mesa, ao usuário digitar ou colar uma URL no campo de banner, mostrar preview da imagem em tempo real (com debounce de 800ms). Adicionar `onError` para ocultar preview se a URL for inválida ou a imagem não carregar. Exibir mensagem de fallback: "Imagem não encontrada — verifique a URL". | `frontend/src/features/create-table/steps/StepReview.tsx` ou equivalente, `frontend/src/pages/PainelMestrePage.tsx` | pendente | **Score GUT: 36 (3×4×3).** Melhoria de UX que reduz erros de URL inválida. Baixo esforço — similar ao item 069 já planejado para o modo review. |

---

## Itens da fila — Lote: auditoria-cobertura-apis (REQ-29) — ⚡ PRIORIDADE IMEDIATA

> Mapear quais endpoints do backend estão sem cobertura no frontend, priorizar os mais críticos e implementar as telas/ações faltantes.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 150 | Fase 2-4 | documentação | 2/5/3 | Auditoria de cobertura frontend→backend via MAPA_DE_API.md | Percorrer todos os endpoints listados em `MAPA_DE_API.md` com status `Pendente/Front` ou sem status. Para cada um: (1) confirmar se há chamada no frontend (busca por URL parcial nos arquivos `.tsx`/`.ts`); (2) atualizar status no MAPA_DE_API.md para `Em Uso`, `Pendente/Front` ou `Sem Frontend`; (3) listar os 5 endpoints mais críticos sem cobertura. Resultado: MAPA_DE_API.md 100% atualizado + lista de prioridades para o item 151. | `MAPA_DE_API.md` | pendente | **Score GUT: 30 (2×5×3).** Pré-requisito do item 151. Executar antes de qualquer nova implementação de frontend. Evita retrabalho — confirma o que já existe antes de criar do zero. |
| 151 | Fase 2-4 | frontend | 4/5/4 | Implementar UI para os 5 endpoints sem cobertura mais críticos | Com base no resultado do item 150, implementar telas/componentes/ações para os 5 endpoints mais críticos sem cobertura frontend. Candidatos prováveis (baseado no MAPA_DE_API.md atual): (1) `GET /api/v1/users/:id/links` — exibir e editar links sociais no perfil do mestre; (2) `GET /api/v1/tables/:tableId/schedules` — visualizar horários detalhados na página da mesa; (3) `GET /api/v1/vtt-platforms` — usar lista de plataformas VTT no formulário; (4) Sistema de aprovação de sugestões de cenário (equivalente ao de sistema já implementado); (5) Métricas de mesa em `table_metrics`. A lista exata será definida após item 150. | `frontend/src/pages/`, `frontend/src/components/` | pendente | **Score GUT: 80 (4×5×4).** Depende do item 150. Endereça DEB-06 do TODO_OPERACIONAL. Cada endpoint implementado agrega valor real ao produto sem esforço de backend. |

---

## Itens da fila — Lote: habilitacao-dev-local-oauth-cloudinary (Fase 0/3) — ⚡ PRIORIDADE MÁXIMA IMEDIATA

> Viabilização de frontend local (`localhost`) consumindo backend beta remoto com OAuth/cookies e validação funcional da integração Cloudinary.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 152 | Fase 0 | infra+backend | 5/5/5 | Habilitar OAuth local com backend beta remoto | Garantir fluxo Google OAuth de `localhost` para `mesasbeta` com retorno de callback para origem local permitida e sessão via cookie cross-origin. Exige allowlist de origens locais, `SameSite=None` e validação de `frontend_redirect` por allowlist. | `/opt/mesas-beta/.env`, `docker-compose.beta.yml`, `backend/src/server.ts`, `backend/src/routes/auth.ts`, `frontend/src/utils/auth.ts` | em_execucao | Ajustes estruturais já aplicados em ambiente beta e código local. Falta validação final ponta-a-ponta com inspeção de cookie + `GET /api/v1/me` sem regressão de fetch. |
| 153 | Fase 3 | frontend+qa | 4/5/5 | Validar cenários A/B/C/D da integração Cloudinary em ambiente beta | Executar matriz manual do `CLOUDINARY_INTEGRATION_GUIDE.md` (A criação com upload, B edição sem alteração, C remoção, D falha de upload) exclusivamente em `mesasbeta.artificiorpg.com`, registrando resultados objetivos por cenário. | `CLOUDINARY_INTEGRATION_GUIDE.md`, `frontend/src/components/ImageUploader.tsx`, `frontend/src/components/form-steps/steps/StepFinal.tsx` | em_execucao | **PRIORIDADE MÁXIMA IMEDIATA.** Localhost congelado por decisão operacional; sem validação beta A/B/C/D não há garantia de estabilidade funcional do fluxo de banner no deploy. |

---

## Itens da fila — Lote: otimizacao-build (Fase 3)

> Otimizações de build e bundle do frontend identificadas durante deploy.

| ID | Fase | Tipo | GUT | Titulo | Descrição objetiva | Arquivos esperados | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| 140 | Fase 3 | frontend | 2/3/3 | Corrigir importação dinâmica ineficaz de validation.ts | Warning do Vite: `validation.ts` é importado dinamicamente por `useCreateTableForm.ts` mas também estaticamente por `useStepNavigation.ts`, impedindo code splitting. Solução: remover importação estática de `useStepNavigation.ts` ou converter importação dinâmica de `useCreateTableForm.ts` para estática. Avaliar impacto no bundle size antes de decidir. | `frontend/src/features/create-table/hooks/useCreateTableForm.ts`, `frontend/src/features/create-table/hooks/useStepNavigation.ts` | pendente | Score GUT: 18 (2×3×3). Não afeta funcionalidade, apenas otimização de bundle. Prioridade baixa. |

---

## Histórico — Lotes Concluídos

### Lote: infraestrutura-base (Fase 0) — Concluído em 31/03/2026
Itens 001-007: Repositório, secrets, Oracle, docker-compose, Cloudflare, workflows CI/CD.

### Lote: fundacao-schema-auth (Fase 1) — Concluído em 04/04/2026
Itens 008-014: Schema inicial, Kysely, imgur_cleanup_log, API base, OAuth Google, middlewares, React+Tailwind, Login+Onboarding.

### Lote: catalogo-publico (Fase 2) — Concluído em 04/04/2026
Itens 016-021B: Endpoints públicos, landing pages, catálogo com filtros, selos oficiais, layout global.

### Lote: painel-mestre (Fase 3) — Concluído em 04/04/2026
Itens 022-025: Endpoints autenticados GM, criação de gm_profile, formulário de mesa com DDAL, GET para edição de mesa.

### Lote: auditoria-ux-nielsen (REQ-17 - Parcial) — Concluído em 05/04/2026
Itens concluídos: 055 (Toast notifications modernas, commit a4dc87f), 056 (Validação antes de aprovar candidato, commit a4dc87f), 057 (Spinners em botões durante ações assíncronas, commit a4dc87f), 058 (Botão "Desfazer rejeição", commit a4dc87f), 094 (Logout em 5 minutos corrigido, E103), 095 (Caixa de sistema selecionado com refinamento hierárquico, E111). Pendentes: 10 itens em validação (045-054) + 13 itens de UX (059-067).

### Lote: painel-crud-admin (REQ-23) — Concluído em 05/04/2026
Itens 101-106: CRUD completo de sistemas, cenários e mesas via interface web.

### Lote: parser-fase-b (REQ-24) — Concluído em 05/04/2026
Itens 107-112: Parser Python com 7 funções avançadas, migration 07, integração TypeScript, bug fixes.

### Lote: importacao-inteligente (REQ-28 - Bugs Críticos) — Concluído em 05/04/2026
Itens 137-138: Erro 500 em POST /tables corrigido, banner não preenchido corrigido.

### Lote: revisao-onboarding-mesas (REQ-30 - Parcial) — Iniciado em 12/04/2026
Itens concluídos: 141 (Formulário vazio ao editar mesa corrigido - race condition, commit 8bb716b, 13/04/2026), 142 (Erro "token inválido" ao desativar mesa corrigido - endpoint PUT→PATCH, commit 6b7f049, E142, 13/04/2026). Pendentes: 7 itens (143-149) incluindo BUG 3 (campo frequência duplicado), BUG 4 (editor rico não formata), melhorias de UX e features de sistema PT/EN.

---

