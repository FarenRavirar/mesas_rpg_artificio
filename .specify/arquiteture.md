# Constituição — Arquitetura do Projeto

> **Documento vivo de arquitetura.** Versão migrada para Spec-Kit — Abril/2026.
> 
> **Fonte canônica de arquitetura.** Em conflito com qualquer outro arquivo, este prevalece.
> Este documento é a versão adaptada para o ecossistema Spec-Kit do `ARQUITETURA_PROJETO.md` original.

---

## 1. Natureza do Projeto

O **Anúncios de Mesas RPG** é uma plataforma colaborativa full-stack para descoberta, publicação e filtragem de mesas de RPG de mesa.

- **Projeto nativo:** Não é um fork de plugin WordPress. É um webapp próprio, construído do zero.
- **Ecossistema Artifício:** Compartilha identidade visual, infraestrutura on-premise e filosofia comunitária com o Glossário. Os dois projetos são independentes mas coirmãos.
- **Missao declarada:** Facilitar que qualquer membro da comunidade brasileira de RPG encontre ou divulgue mesas com autonomia, consistência e sem barreiras de acesso.

---

## 2. Stack Tecnológica (Contratos de Dados)

### 2.1 Componentes

| Componente | Escolha |
|---|---|
| **Framework UI** | React 18 + TypeScript + Vite |
| **Estilização** | Tailwind CSS (Fidelidade ao design system Artificio) |
| **Motor de Busca Client-side** | Fuse.js |
| **Backend (API)** | Node.js + Express |
| **Query Builder** | Kysely |
| **Banco de Dados** | PostgreSQL (Container isolado via Docker on-premise) |
| **Autenticacao** | Google OAuth 2.0 (primario) + JWT customizado para sessao |
| **Servidor Web** | Nginx (Docker) servindo build Vite |
| **Cloudinary** | Upload de imagens via backend (signed preset) |

### 2.2 Ambientes

| Ambiente | URL | Branch | Container |
|---|---|---|---|
| **Beta (Deploy Continuo)** | `mesasbeta.artificiorpg.com` | `dev` | `mesas-beta-frontend` |
| **Producao** | `mesas.artificiorpg.com` | `main` | `mesas-app` |

### 2.3 Credenciais PostgreSQL

> **Fonte de verdade para qualquer comando `psql`, dump, migration ou diagnostico remoto.**

| Parametro | Beta | Producao |
|---|---|---|
| Container DB | `mesas-beta-db` | `mesas-db` |
| `POSTGRES_USER` | `admin` | `admin` |
| `POSTGRES_DB` | `mesas_rpg` | `mesas_rpg` |

Comando padrao de acesso no beta:
```bash
docker exec mesas-beta-db psql -U admin -d mesas_rpg
```

> [!CAUTION]
> O banco **nao se chama `mesas`** — o nome correto e `mesas_rpg`. Usar `-d mesas` resulta em `FATAL: database "mesas" does not exist`.

---

## 3. Modelo de Dados (Contratos de Entidades)

### 3.1 Tabelas Principais

- `users` — Credenciais, OAuth tokens, role (`visitor`, `player`, `gm`, `admin`), preferencias de privacidade.
- `profiles` — Dados publicos do jogador: nome de exibicao, bio curta, idiomas, tags.
- `gm_profiles` — Extensao publica do perfil para mestres: banner, bio longa, especialidades, estatisticas acumuladas.
- `systems` — Catalogo de sistemas de RPG (D&D, Pathfinder, Tormenta etc.) com slug.
- `tags` — Taxonomia livre de temas/estilos (Fantasia, Horror, Misterio etc.).
- `vtt_platforms` — Catalogo estruturado de plataformas VTT.
- `communication_platforms` — Catalogo estruturado de plataformas de comunicacao.
- `vtt_platform_suggestions` — Sugestoes de novas VTTs enviadas por usuarios autenticados.
- `tables` — Entidade central do anuncio de mesa.
- `table_schedules` — Horarios recorrentes ou pontuais vinculados a uma mesa.
- `table_tags` — Relacao N:N entre mesas e tags.
- `questions` — Perguntas publicas de jogadores sobre uma mesa.
- `answers` — Respostas do mestre a perguntas.
- `reviews` — Avaliacoes de jogadores apos participacao.
- `bookmarks` — Mesas salvas por usuarios.
- `sources` — Registro de fontes externas monitoradas pelo aggregator.
- `imported_tables` — Anuncios coletados automaticamente antes de deduplicacao.
- `aggregator_import_candidates` — Candidatos de importacao aguardando revisao editorial, com campos enriquecidos pelo parser Python.
- `system_suggestions` — Sugestoes colaborativas de novos sistemas.
- `scenario_suggestions` — Sugestoes colaborativas de novos cenarios.
- `notifications` — Notificacoes in-app para usuarios.
- `imgur_cleanup_log` — Registro de tentativas de limpeza de imagens hospedadas externamente.
- `user_preferences` — Preferencias estruturadas (sistemas, temas, idiomas, plataformas, dias).
- `user_links` — Links externos do perfil do mestre com cache de metadados Open Graph.
- `table_history` — Auditoria de alteracoes em mesas (changed_by, field, old_value, new_value, changed_at).

### 3.2 Campos Chave em `tables`

| Campo | Tipo | Descricao |
|---|---|---|
| `origin` | `manual` / `imported` | Origem do anuncio |
| `status` | `draft` / `active` / `full` / `cancelled` / `ended` / `pending_review` | Estado da mesa |
| `type` | `campanha`, `one-shot`, `oneshot-serie`, `aberta` | Tipo de mesa |
| `audience` | `livre`, `adultos` | Publico-alvo |
| `price_type` | `gratuita`, `paga` | Tipo de preco |
| `price_value` | DECIMAL | Valor em BRL (null se gratuita) |
| `modality` | `online`, `presencial`, `hibrida` | Modalidade |
| `vtt_platform_id` | FK | Plataforma VTT estruturada |
| `gm_id` | FK | Perfil do mestre |
| `system_id` | FK | Sistema de RPG |
| `cover_url`, `cover_source_type`, `cover_origin_url`, `cover_deletehash`, `cover_imgur_id` | TEXT | Conteudo editorial da capa e metadados de origem/limpeza de imagem |
| `banner_url` | TEXT | URL canonica da imagem da mesa |
| `banner_crop_data` | JSONB | Coordenadas de crop visual |
| `gm_avatar_url` | TEXT | URL da foto do mestre |
| `source_url` | TEXT | URL de origem (importados) |
| `slug` | TEXT | Identificador unico para URL |
| `is_ddal` | BOOLEAN | Vinculado ao programa D&D Adventurers League |
| `publisher_role` | `gm` / `announcer` | Quem esta publicando |
| `actual_gm_name` | TEXT | Nome do mestre real quando announcer |

### 3.3 Agenda Estruturada (table_schedules)

| Campo | Tipo | Descricao |
|---|---|---|
| `table_id` | FK | Referencia a mesa |
| `day_of_week` | TEXT | Dia da semana |
| `start_time` | TIME | Hora de inicio |
| `end_time` | TIME | Hora de fim |
| `frequency` | TEXT | `semanal`, `quinzenal`, `mensal`, `avulsa` |
| `slots_per_session` | INT | Vagas por sessao (null = herda da mesa) |
| `is_ongoing` | BOOLEAN | Sessao ja em andamento |

### 3.4 Links Externos do Mestre (user_links)

| Campo | Tipo | Descricao |
|---|---|---|
| `user_id` | FK | Dono do perfil |
| `url` | TEXT | URL completa |
| `type` | TEXT | `youtube`, `spotify`, `twitch`, `whatsapp`, etc |
| `title` | TEXT | Titulo extraido via Open Graph |
| `description` | TEXT | Descricao extraida via Open Graph |
| `thumbnail_url` | TEXT | Thumbnail (filtrada para redes protegidas) |
| `embed_url` | TEXT | URL de embed (YouTube, Spotify, Twitch) |
| `metadata_status` | TEXT | `pending`, `success`, `failed`, `stale` |

---

## 4. Autenticacao e Autorizacao

### 4.1 Metodo de Login

**Google OAuth 2.0** e o unico metodo de login. Sem senhas locais.

- **Sessao:** JWT gerado pelo Backend apos handshake OAuth, duracao padrao de 7 dias.
- **Refresh token:** Arquitetura prevista (ainda nao implementado).
- **Criacao de conta:** Automatica no primeiro login Google.
- **Separacao de identidade:** Conta Google alimenta apenas o login. O perfil publico (`profiles`, `gm_profiles`) e entidade propria.

### 4.2 Roles e Permissoes

| Role | Permissoes |
|---|---|
| **Visitante** | Busca publica, visualizacao de mesas ativas, perfil publico de mestres |
| **Jogador (player)** | Salvar mesas, enviar perguntas, avaliar mesas, gerenciar preferencias |
| **Mestre (gm)** | Tudo do jogador + publicar/editar/encerrar mesas propias, responder perguntas, gerenciar gm_profile |
| **Administrador** | Acesso total ao Painel Administrativo, moderacao, gestao de taxonomias |

### 4.3 Regras de Seguranca

- **Elevacao de role:** Um `player` se torna `gm` ao criar seu primeiro `gm_profile`. A elevacao e irreversivel via interface.
- **Admin master:** O e-mail `paulohenriquercc@gmail.com` deve ser sempre promovido como role `admin` no Backend durante o login OAuth.
- **Seguranca orientada ao Backend:** O Frontend jamais enviara dados diretamente ao banco. Toda mutacao e leitura sensivel passa por Middlewares de Autenticacao na API Node.js.

### 4.4 Integracao Discord

- Vinculo **opcional** de perfil Discord.
- **Nao substitui** Google OAuth como login principal.
- Uso previsto: validacao comunitaria, selos publicos, leitura de cargos publicos em servidores autorizados.

---

## 5. Contratos de API

Fonte canonica unica para contratos HTTP: esta secao.

Legenda de Auth usada nas tabelas:
- `—`: publico
- `optionalAuth`: aceita anonimo e usuario autenticado
- `jwt`: exige `Authorization: Bearer <token>`
- `admin`: exige `authMiddleware` + role `admin`
- `owner/admin`: exige JWT e validacao de ownership ou role admin no handler

### 5.1 Infra e observabilidade

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | `backend/src/server.ts` |
| `GET` | `/og/:type/:slug` | — | `backend/src/routes/og.ts` |
| `GET` | `/og/*` | — | `backend/src/routes/og.ts` |

### 5.2 Autenticacao (Google OAuth + Discord)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/auth/google` | — | `backend/src/routes/auth.ts` |
| `GET` | `/api/v1/auth/google/callback` | — | `backend/src/routes/auth.ts` |
| `POST` | `/api/v1/auth/logout` | `jwt` | `backend/src/routes/auth.ts` |
| `GET` | `/auth/google` | — | Alias em `backend/src/server.ts` |
| `GET` | `/auth/google/callback` | — | Alias em `backend/src/server.ts` |
| `GET` | `/auth/discord/connect` | `jwt` | `backend/src/routes/discord.ts` |
| `GET` | `/auth/discord/callback` | — | `backend/src/routes/discord.ts` |
| `DELETE` | `/auth/discord/disconnect` | `jwt` | `backend/src/routes/discord.ts` |
| `POST` | `/auth/discord/verify-covil` | `jwt` | `backend/src/routes/discord.ts` |

### 5.3 Identidade do usuario (`/me`)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/me` | `optionalAuth` | `backend/src/routes/me.ts` |
| `GET` | `/api/v1/me/options` | `jwt` | `backend/src/routes/me.ts` |
| `PUT` | `/api/v1/me/preferences` | `jwt` | `backend/src/routes/me.ts` |

### 5.4 Perfil e links (`/profile`)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/profile/me` | `jwt` | `backend/src/routes/profile.ts` |
| `PATCH` | `/api/v1/profile/me` | `jwt` | `backend/src/routes/profile.ts` |
| `PATCH` | `/api/v1/profile/me/profile` | `jwt` | `backend/src/routes/profile.ts` |
| `PATCH` | `/api/v1/profile/me/player` | `jwt` | `backend/src/routes/profile.ts` |
| `PATCH` | `/api/v1/profile/player` | `jwt` | Alias legado em `profile.ts` |
| `PATCH` | `/api/v1/profile/me/gm` | `jwt` | `backend/src/routes/profile.ts` |
| `PATCH` | `/api/v1/profile/gm` | `jwt` | Alias legado em `profile.ts` |
| `POST` | `/api/v1/profile/me/systems` | `jwt` | `backend/src/routes/profile.ts` |
| `POST` | `/api/v1/profile/systems` | `jwt` | Alias legado em `profile.ts` |
| `DELETE` | `/api/v1/profile/me/systems/:id` | `jwt` | `backend/src/routes/profile.ts` |
| `DELETE` | `/api/v1/profile/systems/:id` | `jwt` | Alias legado em `profile.ts` |
| `GET` | `/api/v1/profile/me/discord` | `jwt` | `backend/src/routes/profile.ts` |
| `POST` | `/api/v1/profile/me/connect/discord` | `jwt` | `backend/src/routes/profile.ts` |
| `DELETE` | `/api/v1/profile/me/connect/discord` | `jwt` | `backend/src/routes/profile.ts` |
| `POST` | `/api/v1/profile/me/google-picture` | `jwt` | `backend/src/routes/profile.ts` |
| `GET` | `/api/v1/profile/links` | `jwt` | `backend/src/routes/links.ts` |
| `POST` | `/api/v1/profile/links` | `jwt` | `backend/src/routes/links.ts` |
| `DELETE` | `/api/v1/profile/links/:id` | `jwt` | `backend/src/routes/links.ts` |
| `PATCH` | `/api/v1/profile/links/reorder` | `jwt` | `backend/src/routes/links.ts` |

### 5.5 Catalogo de mesas publicas (`/tables`)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/tables` | — | `backend/src/routes/tables.ts` |
| `GET` | `/api/v1/tables/:slug` | — | `backend/src/routes/tables.ts` |
| `POST` | `/api/v1/tables/:slug/view` | — | `backend/src/routes/tables.ts` |
| `POST` | `/api/v1/tables/:slug/click` | — | `backend/src/routes/tables.ts` |

### 5.6 Area do mestre (`/gm`)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/gm/:slug` | `optionalAuth` | `backend/src/routes/gm.ts` |
| `POST` | `/api/v1/gm/:slug/view` | — | `backend/src/routes/gm.ts` |
| `GET` | `/api/v1/gm/:slug/insights` | `owner/admin` | `backend/src/routes/gm.ts` |
| `POST` | `/api/v1/gm/:slug/contact` | — | `backend/src/routes/gm.ts` |
| `POST` | `/api/v1/gm/:slug/contact-click` | — | `backend/src/routes/gm.ts` |
| `POST` | `/api/v1/gm/profile` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `PUT` | `/api/v1/gm/profile` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `GET` | `/api/v1/gm/me` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `GET` | `/api/v1/gm/tables` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `GET` | `/api/v1/gm/tables/:id` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `POST` | `/api/v1/gm/tables` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `PUT` | `/api/v1/gm/tables/:id` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `PATCH` | `/api/v1/gm/tables/:id/status` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `DELETE` | `/api/v1/gm/tables/:id` | `jwt` | `backend/src/routes/gmPanel.ts` |
| `POST` | `/api/v1/gm/tables/:slug/view` | — | `backend/src/routes/gmPanel.ts` |
| `POST` | `/api/v1/gm/tables/:id/click` | — | `backend/src/routes/gmPanel.ts` |
| `POST` | `/api/v1/gm/tables/:id/contact` | — | `backend/src/routes/gmPanel.ts` |
| `POST` | `/api/v1/gm/tables/:id/favorite` | — | `backend/src/routes/gmPanel.ts` |
| `GET` | `/api/v1/gm/insights` | `jwt` | `backend/src/routes/gmPanel.ts` |

### 5.7 Sistemas e cenarios

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/systems` | — | `backend/src/routes/systems.ts` |
| `POST` | `/api/v1/systems/admin` | `admin` | `backend/src/routes/systems.ts` |
| `PUT` | `/api/v1/systems/admin/:id` | `admin` | `backend/src/routes/systems.ts` |
| `DELETE` | `/api/v1/systems/admin/:id` | `admin` | `backend/src/routes/systems.ts` |
| `GET` | `/api/v1/scenarios` | — | `backend/src/routes/scenarios.ts` |
| `GET` | `/api/v1/scenarios/:id` | — | `backend/src/routes/scenarios.ts` |
| `POST` | `/api/v1/scenarios/admin` | `admin` | `backend/src/routes/scenarios.ts` |
| `PUT` | `/api/v1/scenarios/admin/:id` | `admin` | `backend/src/routes/scenarios.ts` |
| `DELETE` | `/api/v1/scenarios/admin/:id` | `admin` | `backend/src/routes/scenarios.ts` |

Nota canonica: arvore de sistemas e entregue por `GET /api/v1/systems?view=tree`.

### 5.8 Sugestoes de sistema/cenario

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `POST` | `/api/v1/system-suggestions` | `jwt` | `backend/src/routes/systemSuggestions.ts` |
| `GET` | `/api/v1/system-suggestions/mine` | `jwt` | `backend/src/routes/systemSuggestions.ts` |
| `POST` | `/api/v1/scenario-suggestions` | `jwt` | `backend/src/routes/scenarioSuggestions.ts` |
| `GET` | `/api/v1/scenario-suggestions/mine` | `jwt` | `backend/src/routes/scenarioSuggestions.ts` |
| `GET` | `/api/v1/admin/system-suggestions` | `admin` | `backend/src/routes/systemSuggestionsAdmin.ts` |
| `PATCH` | `/api/v1/admin/system-suggestions/:id/approve` | `admin` | `backend/src/routes/systemSuggestionsAdmin.ts` |
| `PATCH` | `/api/v1/admin/system-suggestions/:id/reject` | `admin` | `backend/src/routes/systemSuggestionsAdmin.ts` |
| `GET` | `/api/v1/admin/scenario-suggestions` | `admin` | `backend/src/routes/scenarioSuggestionsAdmin.ts` |
| `PATCH` | `/api/v1/admin/scenario-suggestions/:id/approve` | `admin` | `backend/src/routes/scenarioSuggestionsAdmin.ts` |
| `PATCH` | `/api/v1/admin/scenario-suggestions/:id/reject` | `admin` | `backend/src/routes/scenarioSuggestionsAdmin.ts` |
| `GET` | `/api/v1/admin/setting-suggestions` | `admin` | `backend/src/routes/adminSettingSuggestions.ts` |
| `POST` | `/api/v1/admin/setting-suggestions` | `admin` | `backend/src/routes/adminSettingSuggestions.ts` |
| `PUT` | `/api/v1/admin/setting-suggestions/:id` | `admin` | `backend/src/routes/adminSettingSuggestions.ts` |
| `DELETE` | `/api/v1/admin/setting-suggestions/:id` | `admin` | `backend/src/routes/adminSettingSuggestions.ts` |

### 5.9 Plataformas (VTT e comunicacao)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/vtt-platforms` | — | `backend/src/routes/vttPlatforms.ts` |
| `POST` | `/api/v1/vtt-platforms/suggest` | `jwt` | `backend/src/routes/vttPlatforms.ts` |
| `GET` | `/api/v1/vtt-platforms/admin` | `admin` | `backend/src/routes/vttPlatforms.ts` |
| `POST` | `/api/v1/vtt-platforms/admin` | `admin` | `backend/src/routes/vttPlatforms.ts` |
| `PUT` | `/api/v1/vtt-platforms/admin/:id` | `admin` | `backend/src/routes/vttPlatforms.ts` |
| `DELETE` | `/api/v1/vtt-platforms/admin/:id` | `admin` | `backend/src/routes/vttPlatforms.ts` |
| `GET` | `/api/v1/communication-platforms` | — | `backend/src/routes/communicationPlatforms.ts` |
| `GET` | `/api/v1/communication-platforms/admin` | `admin` | `backend/src/routes/communicationPlatforms.ts` |
| `POST` | `/api/v1/communication-platforms/admin` | `admin` | `backend/src/routes/communicationPlatforms.ts` |
| `PUT` | `/api/v1/communication-platforms/admin/:id` | `admin` | `backend/src/routes/communicationPlatforms.ts` |
| `DELETE` | `/api/v1/communication-platforms/admin/:id` | `admin` | `backend/src/routes/communicationPlatforms.ts` |

### 5.10 Notificacoes

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | `jwt` | `backend/src/routes/notifications.ts` |
| `PATCH` | `/api/v1/notifications/:id/read` | `jwt` | `backend/src/routes/notifications.ts` |

### 5.11 Admin (`/api/v1/admin`)

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `PATCH` | `/api/v1/admin/users/:id/covil` | `admin` | `backend/src/routes/adminProfile.ts` |
| `GET` | `/api/v1/admin/users` | `admin` | `backend/src/routes/adminProfile.ts` |
| `GET` | `/api/v1/admin/users/:id` | `admin` | `backend/src/routes/adminProfile.ts` |
| `PUT` | `/api/v1/admin/tables/:id` | `jwt` | `backend/src/routes/adminTables.ts` |
| `DELETE` | `/api/v1/admin/tables/:id` | `jwt` | `backend/src/routes/adminTables.ts` |
| `GET` | `/api/v1/admin/activity` | `admin` | `backend/src/routes/activityLog.ts` |

Risco operacional registrado: `adminTables.ts` esta sob `authMiddleware` sem `requireRole('admin')`.

### 5.12 Settings, changelog e upload

| Metodo | Rota | Auth | Implementacao |
|---|---|---|---|
| `GET` | `/api/v1/settings/suggest-styles` | — | `backend/src/routes/settings.ts` |
| `GET` | `/api/v1/changelog` | — | `backend/src/routes/changelog.ts` |
| `POST` | `/api/v1/upload` | `jwt` | `backend/src/routes/upload.ts` |

### 5.13 Rotas implementadas sem exposicao HTTP (sem `app.use`)

`backend/src/routes/tableSchedules.ts` contem handlers, porem nao ha mount correspondente em `backend/src/server.ts`.

| Metodo | Rota no arquivo | Status |
|---|---|---|
| `GET` | `/:tableId/schedules` | Nao exposta |
| `POST` | `/:tableId/schedules` | Nao exposta |
| `PUT` | `/:tableId/schedules/:id` | Nao exposta |
| `DELETE` | `/:tableId/schedules/:id` | Nao exposta |

### 5.14 Derivas legadas removidas do contrato ativo

As rotas abaixo apareciam no mapa legado, mas nao existem como contrato ativo no backend montado:
- `GET /api/v1/systems/tree` (contrato real: `GET /api/v1/systems?view=tree`)
- `GET /api/v1/profile/:username`
- `POST /api/v1/tables/:slug/contact` (contrato existente equivalente esta em `/api/v1/gm/:slug/contact`)
- Familia `/api/v1/aggregator/*` (nao implementada em `backend/src/routes` e sem mount em `server.ts`)

---

## 6. Decisoes Arquiteturais Registradas

| Decisao | Justificativa |
|---|---|
| **Google OAuth como unico metodo de login** | Elimina gerenciamento de senha local, reduz superficie de ataque, simplifica onboarding. Alinha com minima coleta de dados. |
| **Discord como vinculo opcional de perfil, nao como login principal** | Preserva a simplicidade da autenticacao via Google enquanto abre espaco para selos publicos e validacao comunitaria. |
| **Fuse.js client-side para busca** | Consistente com o Glossario, zero latencia. Revisitar se ultrapassar 10k registros ativos. |
| **Slug como identificador de URL** | URLs amigaveis e estaveis sao essenciais para SEO e compartilhamento. Slugs gerados no backend, nunca no frontend. |
| **Separacao entre `profiles` e `gm_profiles`** | Nem todo usuario e mestre. Forcar campos de mestre em todos os perfis polui o modelo. |
| **`table_history` desde a fase 1** | Moderacao sem rastreabilidade e inauditable. Custo de implementar depois e sempre maior. |
| **Toast notifications (react-hot-toast)** | Feedback visual nao-bloqueante alinhado com heuristicas de Nielsen. |
| **sistemas.json e cenarios.json** | Substituicao de arvores_de_sistemas.md por JSON estruturado facilita parsing e manutencao. |
| **URL-Driven State (useUrlState)** | Estado de filtros gerenciado via URL como fonte unica de verdade. URLs compartilhaveis funcionam corretamente. |

---

## 7. Principios de Desenvolvimento

### 7.1 Divisao de Camadas

| Camada | Responsabilidade |
|---|---|
| **Controlador** | Recebe requisicoes HTTP, valida autenticacao, delega para servico |
| **Servico** | Regras de negocio, validacao antes de persistencia |
| **Repositorio** | Acesso ao banco via Kysely, queries parametrizadas |
| **Validador** | Schemas Zod para tipagem em runtime |

### 7.2 Regras de Interface

- **Linguagem de interface:** Portugues, termos familiares ao publico-alvo ("Mesa", "Mestre").
- **Validadores Zod:** Reutilizaveis entre endpoints, composicao de validacoes complexas.
- **Feedback visual:** Toast notifications para todas as acoes (sucesso, erro, carregando).
- **Heuristicas de Nielsen:** Aplicadas em toda nova feature de interface.

### 7.3 Pipeline de Importacao com Parser Python

- **Camada 1 (Parser Python):** extrai e classifica campos estruturados do JSON bruto de anuncios (incluindo `sessions[]`, classificacoes de pagamento/tipo e separacao mestre vs anunciante).
- **Camada 2 (Normalizacao Backend):** unifica payload cru + `enrichedFields`, sem perda silenciosa de campos.
- **Camada 3 (Mapeamento para formulario):** converte candidato em dados de revisao com pre-preenchimento.
- **Camada 4 (Revisao manual):** admin revisa/edita antes de aprovar.
- **Camada 5 (Persistencia):** backend persiste dados revisados e cria registros finais.
- **Regra:** frontend nao decide logica de dominio, elevacao de role ou persistencia direta.

### 7.4 Validacao de UX (Checklist)

Antes de implementar nova feature de interface:
- [ ] Feedback visual imediato para acoes do usuario?
- [ ] Linguagem clara e familiar ao publico-alvo?
- [ ] Usuario pode desfazer/cancelar acoes importantes?
- [ ] Padroes visuais consistentes com resto da aplicacao?
- [ ] Mensagens de erro sao claras e sugerem solucao?

---

## 8. Gestao de Imagens

### 8.1 Fluxo de Upload (Cloudinary Signed)

```
[Usuario seleciona arquivo no ImageUploader]
    -> Frontend abre editor de imagem (crop/zoom)
    -> Frontend envia arquivo para POST /api/v1/upload (multipart)
    -> Backend recebe arquivo, aplica crop se necessario
    -> Backend faz upload signed para Cloudinary
    -> Cloudinary retorna secure_url
    -> Frontend grava secure_url em bannerUrl
    -> Mapper envia banner_url no POST/PUT /api/v1/gm/tables
    -> Backend valida URL e persiste em tables.banner_url
```

### 8.2 Seguranca de Imagens

- **Campos nunca expostos em rotas publicas:** `cover_deletehash`, `avatar_deletehash`, `banner_deletehash`.
- **Upload exclusivamente no Backend:** Variaveis `VITE_CLOUDINARY_*` sao build-time. Upload real via backend.
- **Variaveis de ambiente:**
  - Frontend: `VITE_CLOUDINARY_CLOUD_NAME`
  - Backend: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 8.3 Cobertura de campos de imagem (compatibilidade canonica)

- Em `tables`, documentar e manter os campos: `cover_url`, `cover_source_type`, `cover_origin_url`, `cover_deletehash`, `cover_imgur_id`.
- `cover_source_type` distingue upload proprio de reaproveitamento externo.
- `cover_deletehash` existe para ciclos de limpeza em provedores externos quando aplicavel.

### 8.4 Politica de limpeza e log operacional

- Limpezas de imagem devem registrar resultado em `imgur_cleanup_log`.
- Em rotas publicas, nunca retornar deletehash.
- Em caso de falha de limpeza externa, registrar erro e reprocessar no proximo ciclo agendado.

### 8.5 Fluxos canonicos de Imgur (§16 legado)

**Fluxo A — Upload local para Imgur**

```
[Cliente envia imagem]
    -> Backend recebe multipart/form-data
    -> Backend processa imagem e envia para API do Imgur
    -> Imgur retorna { link, deletehash, id }
    -> Backend persiste cover_url, cover_deletehash, cover_imgur_id
    -> cover_source_type = imgur_upload
```

**Fluxo B — Reaproveitamento Discord**

```
[Aggregator processa anuncio do Discord]
    -> Reaproveita URL publica existente
    -> Persiste cover_url e cover_origin_url
    -> cover_source_type = discord_reused
    -> Nao cria deletehash nem imgur_id
```

### 8.6 Job de cleanup (Imgur)

- Seleciona mesas `ended` ou `cancelled` com `cover_source_type=imgur_upload` e `cover_deletehash` preenchido.
- Executa exclusao externa por deletehash.
- Em sucesso ou not_found, zera campos `cover_*` aplicaveis.
- Registra cada tentativa em `imgur_cleanup_log` com status (`success`, `not_found`, `error`).

---

## 9. Compromissos Publicos Inegociaveis

> [!IMPORTANT]
> Estes compromissos foram declarados publicamente e **nao podem ser revertidos por nenhuma decisao tecnica ou de produto:**

- **100% gratuito** — Nenhuma funcionalidade central sera colocada atras de paywall.
- **Sem anuncios** — Nenhum espaco de publicidade paga na interface.
- **Sem coleta de dados pessoais desnecessaria** — Apenas dados estritamente necessarios para a funcao declarada.
- **Mesas gratuitas e pagas coexistem** — A plataforma e neutra em relacao ao modelo de negocio do mestre.

---

## 10. Glossario

| Termo | Definicao |
|---|---|
| **Mesa** | Anuncio de uma sessao ou campanha de RPG. Entidade central do produto. |
| **Mestre (GM)** | Usuario com role `gm`. Possui `gm_profile` publico. |
| **Jogador** | Usuario com role `player`. Pode buscar, salvar e avaliar mesas. |
| **Slug** | Identificador textual unico usado em URLs. Gerado no backend. |
| **Onboarding** | Fluxo obrigatorio de 3 etapas no primeiro login. |
| **Vinculo comunitario** | Conexao opcional com comunidades autorizadas. |
| **Selo publico** | Marcador visual no perfil do mestre para vinculos validados. |

---

## 11. Infraestrutura de Ambientes

### 11.1 Variaveis de Ambiente — Backend

| Variavel | Descricao |
|---|---|
| `PORT` | Porta do servidor (padrao 3000) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | URL de conexao PostgreSQL |
| `JWT_SECRET` | Segredo para assinatura JWT |
| `JWT_EXPIRES_IN` | Duracao do token (padrao 7d) |
| `FRONTEND_URL` | URL base do frontend |
| `FRONTEND_URLS` | Allowlist de origens para CORS |
| `COOKIE_SAME_SITE` | `none` para fluxo cross-origin |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `DISCORD_CLIENT_ID` | OAuth Discord |
| `DISCORD_CLIENT_SECRET` | OAuth Discord |
| `CLOUDINARY_*` | Credenciais Cloudinary |
| `PUBLIC_SITE_URL` | URL base para Open Graph |
| `INDEX_HTML_PATH` | Caminho para index.html do frontend |

### 11.2 Ambiente Local

**Proxy Vite:** `/api/*` -> `http://localhost:3000`

**Tunel SSH:** necessario para conectar banco beta localmente
```bash
ssh -L 5432:172.18.0.9:5432 -i "chave-ssh" ubuntu@137.131.250.231
```

---

## 12. Regras para Agentes

### 12.1 Idioma

- Toda comunicacao em **portugues**.
- Nomes de arquivos, comandos, funcoes e identificadores de codigo permanecem no formato original.

### 12.2 Mudanca Minima e Reversivel

- Preferir mudancas que possam ser desfeitas.
- Nunca fazer refactor massivo sem aprovacao.
- Nunca quebrar contratos existentes.

### 12.3 Seguranca

- **Nunca expor deletehash em rotas publicas.**
- Upload de imagem **exclusivamente no backend.**
- Logica de autenticacao e permissoes **exclusivamente no Backend** (Node.js/JWT).
- Frontend jamais envia dados diretamente ao banco.

### 12.4 Versionamento

- Commits e pushes **somente com autorizacao explícita do usuário.**
- Nunca sugerir, antecipar ou executar acoes de Git sem solicitacao.
- Commits permitidos automaticos apenas para operacoes de agentes Spec-Kit (via extensao `speckit-git-*`).

### 12.5 Documentacao

- Erros com solucao validada vao para `.specify/memory/errors.md`.
- Requisitos de produto vao para `.specify/features/{id}/spec.md` (via `/speckit.specify`).
- Tarefas tecnicas vao para `.specify/features/{id}/tasks.md`.
- Nunca registrar novos itens em arquivos legados (`BACKLOG_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md`, `ERRORS_SOLUTIONS.md`).
- Nunca registrar no lugar errado.

### 12.6 Stack

- **Frontend:** React/TypeScript. Logica de interface e filtros.
- **Backend:** Node.js/TypeScript. Autenticacao, permissoes, persistencia.
- **Python:** Exclusivamente para scripts fora do runtime da API principal.

---

## 13. Open Graph Dinamico

### 13.1 Arquitetura

```
[Crawler acessa /mestre/:slug]
    -> Nginx detecta user-agent (facebookexternalhit, Twitterbot, etc)
    -> Nginx retorna erro 418 (teapot)
    -> error_page 418 redireciona para @og_proxy
    -> @og_proxy faz rewrite: /mestre/:slug -> /og/mestre/:slug
    -> Proxy para backend
    -> Backend consulta banco (gm_profiles + users + profiles)
    -> Backend injeta meta tags dinamicas no index.html
    -> Retorna HTML completo com meta tags personalizadas
```

### 13.2 Meta Tags Injetadas (tipo `mestre`)

- `og:type`: `profile`
- `og:title`: `{display_name} — Mestre de RPG | Artificio Mesas`
- `og:description`: Truncado de tagline ou bio_long (max 200 chars)
- `og:image`: avatar_url, banner_url ou fallback og-default.png
- `og:url`: URL canonica da pagina
- Twitter Cards equivalentes

### 13.3 Tratamento de Imagens Google

URLs `googleusercontent.com` sao automaticamente ajustadas de `s96-c` para `s400-c` (Facebook exige minimo 200x200).

---

> **Lembre-se:** Este e um presente do Artificio RPG para a comunidade brasileira de RPG.
> Gratuito · Sem anuncios · Sem coleta de dados · Feito com coracao pela comunidade.
