# Plano Mestre — Anúncios de Mesas RPG (Portal Colaborativo)

> Documento vivo de arquitetura. Versão 2.0 — revisado em Abril/2026.
>
> **Fonte canônica de arquitetura.** Em conflito com qualquer outro arquivo, este prevalece.
>
> **Leitura seletiva por seção — não ler na íntegra.** Consultar apenas a seção indicada pela tarefa.
> Índice de referência rápida: §3 infra/banco · §4 modelo de dados · §5 roles · §6 auth · §9 design system · §10 compromissos · §12 rotas · §16 imagens.

---

## Objetivo

Definir a arquitetura oficial, os contratos estruturais e o estado atual de implementação do **Anúncios de Mesas RPG** — plataforma fullstack para descoberta, publicação e filtragem de mesas de RPG de mesa no Brasil, com autopublicação por mestres, ingestão automática de anúncios externos via IA e painel administrativo de curadoria.

**Contexto de Ecossistema:**
- Projeto nativo (não fork), construído do zero com stack própria.
- Parte do ecossistema **Artifício RPG**: compartilha identidade visual e infraestrutura on-premise com o Grande Glossário de RPG. Os dois projetos são independentes mas coirmãos.
- Beta operacional em `mesasbeta.artificiorpg.com`. Produção prevista em `mesas.artificiorpg.com`, ainda não publicada operacionalmente.
- Missão: facilitar que qualquer membro da comunidade brasileira de RPG encontre ou divulgue mesas com autonomia, consistência e sem barreiras de acesso.

---

## 1. Funcionalidades por Módulo — Estado Atual

### O que está implementado e operacional (Beta — Abril/2026)

- **Auth System:** Google OAuth completo com JWT de 7 dias e proteção de rotas por role.
- **Gestão de Taxonomia:** Árvore hierárquica de sistemas (Sistema > Edição > Variante), cenários com subgêneros, importados via `sistemas.json` e `cenarios.json`.
- **Dashboard do Mestre:** Criação de mesas com frequência customizada, regras e suporte a selos.
- **Aggregator Pipeline:** Ingestão de JSON exportado do Discord, normalização de mensagens e fila de candidatos com revisão editorial.
- **Parser Python Inteligente (Fase B):** Extração avançada de múltiplos horários, vagas detalhadas, classificação automática de pagamento e separação mestre vs anunciante.
- **UX:** Toasts via `react-hot-toast`, spinners de carregamento, confirmações de segurança.
- **Admin CRUD:** Interface completa para gerenciar sistemas, cenários e mesas sem acesso direto ao banco.
- **Notificações In-App:** Sino no header com contador de não lidas.
- **Filtros e Ações em Lote:** Revisão de candidatos com filtros avançados, seleção múltipla e deleção em lote (limite 150 IDs).

### O que ainda é placeholder / pendente

- ❌ **CleanupWorker:** Migration 10 (retenção de mesas importadas) precisa de worker Node para deletar fisicamente mesas expiradas e limpar imagens no Imgur.
- ❌ **Imagens via Formulário:** Pipeline Imgur + Sharp para upload em formulários (REQ-03) é parcial — fluxo completo pendente.
- ❌ **Soft Delete:** Deleção de mesas é hard delete. Implementar `deleted_at` para auditoria futura.
- ❌ **Módulo Social:** Perguntas, respostas e avaliações de mesas (REQ-27 a REQ-30) são placeholders no catálogo.
- ❌ **Exportação WhatsApp/Discord:** Prevista para versão posterior, após base principal estável.
- ❌ **AggregatorBot de fontes externas (Facebook, Reddit):** Previsto para Fase 4. O que existe hoje é ingestão manual de JSON exportado do Discord.
- ❌ **Busca tsvector:** Busca Fuse.js no frontend é suficiente abaixo de 10k registros. Migrar para `tsvector` PostgreSQL se ultrapassar esse volume.
- ❌ **Integração de vínculo Discord no perfil:** Prevista para fase posterior — vínculo opcional, não substitui login Google.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Motor de Busca Client-side** | Fuse.js |
| **Backend (API)** | Node.js, Express, TypeScript |
| **Banco de Dados** | PostgreSQL 16+, Kysely (Query Builder type-safe) |
| **Processamento IA** | Python 3, spaCy (`pt_core_news_lg`), Pydantic, Dateparser |
| **Servidor Web** | Nginx (Docker, proxy reverso e serving de build Vite) |
| **Infraestrutura** | Docker & Docker Compose, GitHub Actions (CI/CD) |
| **Autenticação** | Google OAuth 2.0 + JWT customizado para sessão |
| **Imagens** | Imgur API (upload via Client-ID), Sharp (conversão WebP) |
| **Agendamento** | node-cron (AggregatorBot e CleanupWorker, mesmo compose) |

> **Nota React:** O arquivo `documentacao_tecnica.md` menciona React 19; o `ARQUITETURA_PROJETO.md` original mencionava React 18. A versão em uso no build atual é React 19. React 18 era a versão planejada inicial.

---

## 3. Infraestrutura e Ambientes

| Ambiente | URL | Branch Git | Container App |
|---|---|---|---|
| **Beta** | `mesasbeta.artificiorpg.com` | `dev` | `mesas-beta-app` |
| **Produção** | `mesas.artificiorpg.com` | `main` | `mesas-app` |

O ambiente beta é exposto via Cloudflare Tunnel (`mesas-beta-app:80`), sem porta pública dedicada no host.

### 3.1 Credenciais e Nomes Canônicos do PostgreSQL

> **Fonte de verdade para qualquer comando `psql`, dump, migration ou diagnóstico remoto.**

| Parâmetro | Beta | Produção |
|---|---|---|
| Container DB | `mesas-beta-db` | `mesas-db` |
| `POSTGRES_USER` | `admin` | `admin` |
| `POSTGRES_DB` | `mesas_rpg` | `mesas_rpg` |
| Porta interna | `5432` | `5432` |

Comando padrão de acesso no beta:
```bash
docker exec mesas-beta-db psql -U admin -d mesas_rpg
```

Para confirmar credenciais em runtime:
```bash
docker exec mesas-beta-db env | grep POSTGRES
```

> [!CAUTION]
> O banco **não se chama `mesas`** — o nome correto é `mesas_rpg`. Usar `-d mesas` resulta em `FATAL: database "mesas" does not exist`. Ver `ERRORS_SOLUTIONS.md` E059.

### 3.2 Variáveis de Ambiente Principais

| Variável | Finalidade |
|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL |
| `JWT_SECRET` | Chave privada para assinatura dos tokens de sessão |
| `JWT_EXPIRES_IN` | Duração do token (configurado como `7d`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais do Google Cloud Console para OAuth |
| `GOOGLE_CALLBACK_URL` | Rota de retorno OAuth (ex: `/api/v1/auth/google/callback`) |
| `IMGUR_CLIENT_ID` | Client-ID para upload anônimo de imagens no Imgur — **nunca exposta ao frontend** |
| `PYTHON_CMD` | Comando do interpretador Python (`python3` no Linux, `python` no Windows) |
| `VITE_API_URL` | (Frontend) URL base da API para requisições do cliente |

### 3.3 Scripts de Inicialização

```bash
# Backend
npm run dev          # Desenvolvimento
npm run build        # Compilação TypeScript
npm run start        # Produção

# Frontend
npm run dev          # Vite dev server
npm run build        # Geração de assets estáticos

# Importadores de dados
npm run systems:import-tree    # Popula taxonomia de sistemas via sistemas.json
npm run aggregator:import      # Processa JSON exportado do Discord
```

### 3.4 Política de Migrations

- Toda migration de banco é versionada via arquivo sequencial em `db/migrations/`.
- Migrations destrutivas (DROP, ALTER que remove coluna) requerem aprovação explícita e backup prévio.
- O Backend **não executa migrations automaticamente em produção** — deploy de migration é etapa manual e documentada.
- Migrations aplicadas no beta até Abril/2026: migration_01 a migration_09. Migration_10 (expiração/retenção) está **pendente**.

---

## 4. Modelo de Dados

### 4.1 Tabelas Existentes

| Tabela | Descrição |
|---|---|
| `users` | Credenciais, OAuth tokens, role (`visitor`, `player`, `gm`, `admin`), preferências de privacidade |
| `profiles` | Dados públicos do jogador: nome de exibição, bio curta, idiomas, tags |
| `gm_profiles` | Extensão pública do mestre: banner, bio longa, especialidades, estatísticas acumuladas |
| `systems` | Catálogo hierárquico de sistemas (Sistema > Edição > Variante) com slug, aliases, depth, path_slug |
| `tags` | Taxonomia livre de temas/estilos (Fantasia, Horror, Mistério etc.) |
| `platforms` | Plataformas de jogo (Discord, Foundry VTT, Roll20, presencial etc.) |
| `tables` | Entidade central do anúncio de mesa (ver 4.2) |
| `table_schedules` | Horários recorrentes ou pontuais vinculados a uma mesa |
| `table_platforms` | Relação N:N entre mesas e plataformas |
| `table_tags` | Relação N:N entre mesas e tags |
| `table_history` | Auditoria de alterações de status e campos críticos em mesas |
| `questions` | Perguntas públicas de jogadores sobre uma mesa |
| `answers` | Respostas do mestre a perguntas |
| `reviews` | Avaliações de jogadores após participação |
| `bookmarks` | Mesas salvas por usuários |
| `sources` | Fontes externas cadastradas para o AggregatorBot |
| `imported_tables` | Anúncios coletados antes de deduplicação |
| `aggregator_import_candidates` | Candidatos aguardando revisão editorial (ver 4.3) |
| `system_suggestions` | Sugestões colaborativas de novos sistemas por usuários (migration_06) |
| `notifications` | Notificações in-app para usuários (migration_07) |
| `imgur_cleanup_log` | Registro de tentativas de limpeza de imagens no Imgur (ver §16) |
| `user_preferences` | Preferências estruturadas (sistemas, temas, idiomas, plataformas, dias) |

### 4.2 Campos Chave em `tables`

| Campo | Descrição |
|---|---|
| `origin` | `manual` (autopublicado pelo mestre) ou `imported` (coletado pelo bot) |
| `status` | `draft` / `active` / `full` / `cancelled` / `ended` / `pending_review` |
| `type` | `campanha`, `one-shot`, `oneshot-serie`, `aberta` |
| `audience` | `livre`, `adultos` |
| `price_type` | `gratuita`, `paga` |
| `price_value` | Valor em BRL (null se gratuita) |
| `price_frequency` | `sessao`, `mes`, `campanha` |
| `slots_total` e `slots_filled` | Vagas totais e preenchidas |
| `language` | Idioma da mesa |
| `modality` | `online`, `presencial`, `hibrida` |
| `frequency` | `semanal`, `quinzenal`, `mensal`, `avulsa` (migration_09) |
| `frequency_custom` | Descrição livre quando `frequency = 'avulsa'` (migration_09) |
| `rules_notes` | Regras, avisos ou notas especiais da mesa (migration_09) |
| `experience_level` | `todos`, `iniciante`, `intermediario`, `veterano` |
| `publisher_role` | `gm` (o próprio mestre publica) ou `announcer` (apenas divulgador) |
| `actual_gm_name` | Nome do mestre real quando `publisher_role = 'announcer'` |
| `source_url` | URL de origem (para anúncios importados) |
| `source_id` | FK para `sources` |
| `gm_id` | FK para `gm_profiles` (null se importado sem vínculo) |
| `system_id` | FK para `systems` |
| `slug` | Gerado automaticamente via `slugify.ts` no backend |
| `starts_at` | Data/hora de início |
| `is_ddal` | Mesa vinculada ao programa D&D Adventurers League |
| `ddal_code`, `ddal_name`, `ddal_tier` | Metadados DDAL — obrigatórios quando `is_ddal = true` |
| `is_covil` *(migration_10 — pendente)* | BOOLEAN — pertence ao programa Covil do Lich; detectado pelo parser, editável pelo admin |
| `imported_expires_at` *(migration_10 — pendente)* | TIMESTAMPTZ — data de expiração para mesas importadas |
| `cover_url` | URL pública da imagem de capa |
| `cover_source_type` | Origem da imagem: `imgur_upload` ou `discord_reused` |
| `cover_origin_url` | URL original quando reaproveitada de fonte externa |
| `cover_deletehash` | Hash de exclusão no Imgur — **nunca retornado por rotas públicas** |
| `cover_imgur_id` | ID da imagem no Imgur |
| `banner_url` | URL externa de banner (migration_09) — aceita URLs diretas do Discord sem reupload |
| `billing_text` *(migration_11 — pendente)* | TEXT — Detalhamento de cobrança (ex: "R$ 30 por sessão", "R$ 75 por mês") |
| `session_zero_free` *(migration_11 — pendente)* | BOOLEAN — Sessão zero gratuita |
| `synopsis` *(migration_11 — pendente)* | TEXT — Sinopse curta separada de description (max 300 chars) |
| `style_text` *(migration_11 — pendente)* | TEXT — Estilo/temática da mesa como campo próprio (ex: "Alta Fantasia, Investigação") |
| `technical_requirements` *(migration_11 — pendente)* | TEXT — Requisitos técnicos gerais |
| `requires_pc` *(migration_11 — pendente)* | BOOLEAN — Requer PC |
| `requires_camera` *(migration_11 — pendente)* | BOOLEAN — Requer câmera |
| `requires_microphone` *(migration_11 — pendente)* | BOOLEAN — Requer microfone |
| `level_range` *(migration_11 — pendente)* | TEXT — Faixa de nível (ex: "1-5", "10-15") |
| `campaign_length` *(migration_11 — pendente)* | TEXT — Duração estimada da campanha (ex: "6 meses", "20 sessões") |
| `listing_excerpt` *(migration_11 — pendente)* | TEXT — Resumo curto para listagem (max 200 chars, substitui "placeholder") |
| `external_links` *(migration_11 — pendente)* | JSONB — Array de links externos |
| `setting_name` *(migration_13 — pendente)* | TEXT — Nome do cenário (ex: "Forgotten Realms") |
| `setting_styles` *(migration_13 — pendente)* | TEXT[] — Array de estilos (ex: ["Alta Fantasia", "Aventura Épica"]) |

> **Decisão arquitetural (05/04/2026):** O campo `gm_avatar_url` extraído pelo parser Python **não é persistido** no banco. É usado apenas para pré-preencher visualmente o formulário de revisão de candidatos. O mestre real é vinculado à mesa via `gm_id` apenas quando reivindicar o anúncio importado.

> **Regra do selo DDAL:** O campo `is_ddal` só é permitido se o `system_id` apontar para o caminho hierárquico `dungeons-dragons/5e/2024`.

### 4.3 Tabela `aggregator_import_candidates`

Candidatos importados do Discord aguardando revisão editorial. Status possíveis: `awaiting_review`, `accepted`, `rejected`.

Campos enriquecidos pelo parser Python (migration_07):
- `sessions[]` — Array de `SessionSchedule` com dia da semana, horário inicial/final, frequência e vagas por sessão
- `slots_total`, `slots_available`, `slots_filled` — Vagas detalhadas
- `system_raw`, `system_normalized`, `system_classification` — Sistema detectado, normalizado e classificado (válido/inválido/revisável)
- `is_homebrew`, `is_custom` — Flags de sistema homebrew ou próprio
- `payment_classification` — `gratuita`, `paga` ou `ambígua`
- `candidate_kind` — `individual`, `grupo_servidor`, `multiplo`, `invalido`
- `master_display_name`, `publisher_role`, `is_same_person` — Separação entre autor do post e mestre real
- 9 índices no banco (GIN para JSONB, B-tree para classificações)

Suporta filtros avançados (data, mestre, status) e deleção em lote (limite 150 IDs por request).

### 4.4 Campos de Imagem em `gm_profiles`

| Campo | Tipo | Descrição |
|---|---|---|
| `avatar_url` | TEXT | URL pública do Imgur |
| `avatar_deletehash` | TEXT | Hash de exclusão — **nunca retornado por rotas públicas** |
| `avatar_imgur_id` | TEXT | ID da imagem no Imgur |
| `banner_url` | TEXT | URL pública do Imgur |
| `banner_deletehash` | TEXT | Hash de exclusão — **nunca retornado por rotas públicas** |
| `banner_imgur_id` | TEXT | ID da imagem no Imgur |

### 4.5 Integridade e Rastreabilidade

- **Slugs automáticos:** `systems`, `gm_profiles` e `tables` geram slugs via `slugify.ts` no backend. Nunca gerado no frontend.
- **Auditoria:** `table_history` registra `changed_by`, `field`, `old_value`, `new_value`, `changed_at` para todas as alterações de status e campos críticos em `tables`.
- **Atomicidade:** Operações complexas (ex: aceitar candidato → criar mesa + contatos) são executadas em `db.transaction().execute()` via Kysely.
- **Deduplicação no AggregatorBot** — prioridade determinística:
  1. Correspondência exata por `source_url`
  2. Correspondência por `title` + `gm_name` + `starts_at`
  3. Anúncio manual local sempre prevalece sobre importado
  4. Entre duplicados importados: mais recente (`updated_at`) vence

### 4.6 Agenda Estruturada (table_schedules)

A tabela `table_schedules` armazena múltiplos horários de sessão para uma mesa, suportando campanhas com:
- Múltiplos dias da semana
- Múltiplas faixas horárias no mesmo dia
- Frequências diferentes por sessão (semanal/quinzenal/mensal)
- Vagas específicas por sessão
- Sessões em andamento vs abertas

**Campos:**
- `id` UUID PK
- `table_id` UUID FK tables(id) ON DELETE CASCADE
- `day_of_week` TEXT (segunda/terça/quarta/quinta/sexta/sábado/domingo)
- `start_time` TIME
- `end_time` TIME
- `frequency` TEXT (semanal/quinzenal/mensal/avulsa)
- `slots_per_session` INT (null = herda de table.slots_total)
- `is_ongoing` BOOLEAN (sessão já em andamento)
- `notes` TEXT (observações opcionais)
- `sort_order` SMALLINT (ordem de exibição)
- `created_at` TIMESTAMPTZ

**Integração com Parser Python:**
O parser extrai `sessions[]` com interface `SessionSchedule` (REQ-24, migration_07). Ao aceitar candidato, o backend mapeia automaticamente cada objeto do array para um registro em `table_schedules` vinculado à mesa criada.

**Exemplo de uso:**
Uma mesa pode ter:
- Segunda 19h-22h (semanal, 4 vagas)
- Quarta 20h-23h (quinzenal, 4 vagas)
- Sábado 14h-18h (mensal, 6 vagas, em andamento)

**Status de implementação (05/04/2026):**
- ✅ Migration 12 aplicada no beta
- ✅ Tipos TypeScript completos
- ✅ Rotas CRUD implementadas (GET, POST, PUT, DELETE)
- ✅ Integração com candidateService.accept() concluída
- ⚠️ Frontend pendente (componente SessionRepeater)

---

## 5. Papéis e Permissões

Toda mutação e leitura sensível passa por middleware de autenticação na API Node.js. O frontend **nunca acessa o banco diretamente**.

| Role | Permissões |
|---|---|
| **Visitante Anônimo** | Busca pública, visualização de mesas ativas, perfil público de mestres |
| **Jogador (`player`)** | Salvar mesas, enviar perguntas, avaliar mesas participadas, gerenciar preferências |
| **Mestre (`gm`)** | Tudo do jogador + publicar/editar/encerrar mesas próprias, responder perguntas, gerenciar `gm_profile`, upload de imagens |
| **Administrador (`admin`)** | Acesso total: moderação, gestão de fontes externas, curadoria de taxonomias, deleção administrativa, painel de candidatos |

**Elevação de role:** Um `player` se torna `gm` ao criar seu primeiro `gm_profile`. A elevação é irreversível via interface (requer admin para reverter).

**Admin master:** O e-mail `paulohenriquercc@gmail.com` deve ser sempre promovido/garantido como role `admin` no backend durante o login OAuth.

---

## 6. Autenticação e Sessão

- **Login:** Google OAuth 2.0 exclusivamente. Sem senha local.
- **Sessão:** JWT assinado pelo backend com `JWT_EXPIRES_IN=7d`. Refresh token rotativo é arquitetura prevista, não implementado.
- **Handshake:** No callback OAuth, o backend extrai `id`, `email` e `picture` do Google e realiza upsert na tabela `users`.
- **AuthContext:** Validação de sessão com debounce e verificação apenas em navegações críticas, evitando logout inesperado (correção E103/E105 — Abril/2026).
- **Criação de conta:** Automática no primeiro login Google. Onboarding de 3 etapas previsto (sistemas favoritos, temas, plataformas, dias disponíveis).
- **Separação de identidade:** A conta Google alimenta apenas o login. O perfil público (`profiles`, `gm_profiles`) é entidade própria controlada pelo usuário.
- **Discord como vínculo futuro:** O Discord poderá ser vinculado opcionalmente ao perfil para validação comunitária e selos públicos. Não será login principal nem requisito de uso.

---

## 7. Pipeline de Ingestão e Parser Python

### 7.1 Fluxo Geral

```
[JSON exportado do Discord]
    → POST /api/v1/aggregator/import/file (admin)
    → repairTruncatedJson() — corrige exports incompletos (6 estratégias)
    → pythonParserService.ts — spawn child_process Python
    → discord_message_parser.py — spaCy pt_core_news_lg + Pydantic
    → JSON enriquecido retornado via stdout (PYTHONUNBUFFERED=1)
    → Backend prioriza enrichedFields do Python
    → Fallback: parseDiscordContent.ts (regex, frontend)
    → Inserção em aggregator_import_candidates
    → Deduplicação automática
    → Fila de revisão editorial para o admin
```

### 7.2 Campos Extraídos pelo Parser Python

**Fase A (Campos Básicos):**
- Sistema de RPG (nome do sistema detectado via `sistemas.json`)
- Data e horário de início
- Vagas (total e preenchidas)
- Modalidade (online/presencial)
- URLs de imagem dos attachments (banner/avatar)
- Detecção de badge "Covil do Lich" via análise de conteúdo

**Fase B (Campos Avançados — implementada em 05/04/2026):**
- Múltiplos horários estruturados em `sessions[]` (interface `SessionSchedule` compartilhada entre Python/Pydantic e TypeScript)
- Vagas detalhadas: `slots_total`, `slots_available`, `slots_filled` (padrões: "2/4 vagas", "Restam 3 vagas")
- Classificação de sistema: `system_raw`, `system_normalized`, `system_classification`, `is_homebrew`, `is_custom`
- Classificação de pagamento: `payment_classification` (gratuita/paga/ambígua)
- Classificação de tipo de candidato: `candidate_kind`
- Separação mestre vs anunciante: `master_display_name`, `publisher_role`, `is_same_person`

### 7.3 Regras Editoriais Automáticas

- **Selo DDAL:** Só permitido se `system_id` apontar para o caminho `dungeons-dragons/5e/2024`.
- **Selo Covil do Lich:** Detectado automaticamente pelo parser se termos como "Covil" ou "Lich" aparecerem no título ou sinopse. Editável pelo admin.
- **Imagem de anúncios Discord:** Quando a postagem importada já tiver imagem pública e reutilizável, o bot a aproveita como `cover_url` com `cover_source_type = discord_reused`, sem reupload para Imgur.

### 7.4 Taxonomia de Sistemas (`sistemas.json` e `cenarios.json`)

Migração concluída em Abril/2026: substituiu `arvores_de_sistemas.md` por arquivos JSON estruturados.

- `sistemas.json`: taxonomia com `name`, `aliases`, `editions`, `variants`, `depth`, `path_slug`
- `cenarios.json`: cenários com campo `subgenero` como array de tags
- Dockerfile atualizado para copiar ambos no build
- Script de importação: `systemsTreeImport.ts`
- Parser Python usa `sistemas.json` para detecção automática de sistemas nas mensagens

---

## 8. Persistência — Kysely

O projeto usa Kysely como query builder type-safe em vez de ORM pesado.

- **Tipagem:** Interface `Database` em `backend/src/db/types.ts` mapeia todas as colunas, incluindo enums (`user_role`, `table_status`).
- **Atomicidade:** Operações críticas executadas em `db.transaction().execute()`.
- **Migrations:** Arquivos sequenciais em `db/migrations/`, aplicação manual em produção.

---

## 9. Princípios Visuais (Design System)

O projeto herda e adapta a identidade visual do Grande Glossário de RPG.

- **Paleta:** Azul-escuro `#1B2A4A` como base, laranja `#E8521A` como cor de ação primária. Catálogo pode usar fundo `#0F1C36` para ambiente imersivo.
- **Botões primários:** Sempre laranja Artifício.
- **Badges semânticos:** Verde = positivo (confirmada, gratuita) · Laranja = alerta (falta jogador, começa em breve) · Cinza = neutro.
- **Cards de Mesa:** Alta densidade informacional com leitura rápida via badges. Hierarquia visual clara entre título, mestre, vagas e ação.
- **Formulários:**
  - Cabeçalho de modal/seção: fundo azul-escuro, borda inferior laranja 4px, tipografia *Black Italic Upper*
  - Inputs: `rounded-xl`, foco `ring-laranja`
  - Labels: `text-[10px] font-black uppercase tracking-widest`
- **Filosofia de UX:** Navegação pública funciona sem login. Cadastro solicitado apenas no momento da ação (perguntar, salvar, publicar). Sem dark patterns.
- **Heurísticas de Nielsen:** As 10 heurísticas são aplicadas sistematicamente. Ver checklist completo na seção 14.5 do histórico de decisões.

---

## 10. Compromissos Públicos (Inegociáveis de Produto)

Declarados publicamente no anúncio do projeto. **Não podem ser revertidos por nenhuma decisão técnica ou de produto:**

- **100% gratuito** — Nenhuma funcionalidade central atrás de paywall.
- **Sem anúncios** — Nenhum espaço de publicidade paga na interface, agora ou no futuro.
- **Sem coleta de dados desnecessária** — Apenas dados estritamente necessários para a função declarada. Sem tracking de terceiros.
- **Mesas gratuitas e pagas coexistem** — A plataforma é neutra em relação ao modelo de negócio do mestre.

---

## 11. Tratamento de Rollback e Falhas

- Toda nova implantação parte do branch correspondente ao ambiente (`dev` para beta, `main` para produção).
- Falhas de build ou erros em runtime devem ser catalogados em `ERRORS_SOLUTIONS.md` antes de qualquer reescrita de código.
- O container de API Node.js só inicializa se conseguir conectar ao PostgreSQL (`mesas-beta-db`).

**Procedimento em caso de tela preta ou crash da API:**
1. Verificar `docker compose logs`
2. Consultar `ERRORS_SOLUTIONS.md`
3. SSH assistido apenas se GitHub Actions falhar primeiro

**AggregatorBot:** Deve implementar circuit breaker próprio — em falha de conexão com o banco, aborta o ciclo de ingestão e registra o erro sem tentar novamente até o próximo ciclo.

---

## 12. Contratos de API (Rotas Completas)

Todas as rotas mutáveis exigem JWT válido no header `Authorization: Bearer <token>`. Prefixo global: `/api/v1`.

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/auth/google` | Inicia handshake OAuth Google |
| `GET` | `/auth/google/callback` | Callback OAuth, retorna JWT |
| `POST` | `/auth/logout` | Invalida refresh token |
| `GET` | `/me` | Retorna perfil do usuário autenticado |

### Mesas

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/tables` | — | Listagem pública com filtros via query params |
| `GET` | `/tables/:slug` | — | Página individual da mesa |
| `POST` | `/tables` | `gm` | Criar nova mesa |
| `PUT` | `/tables/:id` | `gm` (própria) | Editar mesa |
| `PATCH` | `/tables/:id/status` | `gm` / `admin` | Alterar status |
| `POST` | `/tables/:id/bookmark` | `player` | Salvar mesa |
| `POST` | `/tables/:id/export` | — | Gerar texto de exportação *(previsto para fase posterior)* |

### Horários de Mesas (table_schedules)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/tables/:tableId/schedules` | — | Listar todos os horários de uma mesa (público) |
| `POST` | `/tables/:tableId/schedules` | `gm` (owner) / `admin` | Criar novo horário para uma mesa |
| `PUT` | `/tables/:tableId/schedules/:id` | `gm` (owner) / `admin` | Atualizar horário existente |
| `DELETE` | `/tables/:tableId/schedules/:id` | `gm` (owner) / `admin` | Deletar horário |

### Mestres

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/gm/:slug` | — | Perfil público do mestre |
| `POST` | `/gm/profile` | `player` | Criar gm_profile (eleva role para `gm`) |
| `PUT` | `/gm/profile` | `gm` | Editar gm_profile |

### Perguntas e Avaliações *(placeholders — pendentes)*

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/tables/:id/questions` | — | Listar perguntas públicas |
| `POST` | `/tables/:id/questions` | `player` | Enviar pergunta |
| `POST` | `/questions/:id/answer` | `gm` (própria mesa) | Responder pergunta |
| `POST` | `/tables/:id/reviews` | `player` | Avaliar mesa |

### Admin — Moderação e Taxonomias

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/admin/tables/pending` | `admin` | Mesas aguardando moderação |
| `PATCH` | `/admin/tables/:id/moderate` | `admin` | Aprovar ou rejeitar mesa |
| `DELETE` | `/admin/tables/:id` | `admin` | Deletar mesa (hard delete com cascade) |
| `POST` | `/admin/systems` | `admin` | Criar sistema |
| `PUT` | `/admin/systems/:id` | `admin` | Editar sistema |
| `DELETE` | `/admin/systems/:id` | `admin` | Deletar sistema |
| `POST` | `/admin/scenarios` | `admin` | Criar cenário |
| `PUT` | `/admin/scenarios/:id` | `admin` | Editar cenário |
| `DELETE` | `/admin/scenarios/:id` | `admin` | Deletar cenário |

### Notificações

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/notifications` | `player` | Listar notificações do usuário |
| `PATCH` | `/notifications/:id/read` | `player` | Marcar notificação como lida |

### Aggregator — Fontes e Importação

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/aggregator/sources` | `admin` | Listar fontes cadastradas |
| `POST` | `/aggregator/sources` | `admin` | Cadastrar nova fonte Discord |
| `PUT` | `/aggregator/sources/:id` | `admin` | Editar fonte |
| `PATCH` | `/aggregator/sources/:id/toggle` | `admin` | Habilitar/desabilitar fonte |
| `POST` | `/aggregator/import/file` | `admin` | Importar JSON de export Discord (suporta `dry_run`) |
| `POST` | `/aggregator/import/source/:id/run` | `admin` | Re-processar mensagens brutas de uma source |
| `GET` | `/aggregator/exports/day` | `admin` | Exportação diária JSON de candidatos aceitos |
| `GET` | `/aggregator/exports/day.txt` | `admin` | Exportação diária TXT de candidatos aceitos |

### Aggregator — Revisão Editorial de Candidatos

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/aggregator/candidates` | `admin` | Listar candidatos (filtros: `status`, `source_id`, data, mestre; paginação) |
| `GET` | `/aggregator/candidates/:id` | `admin` | Detalhe de um candidato |
| `PATCH` | `/aggregator/candidates/:id/accept` | `admin` | Aceitar candidato e publicar como mesa ativa |
| `PATCH` | `/aggregator/candidates/:id/reject` | `admin` | Rejeitar candidato |
| `PATCH` | `/aggregator/candidates/:id/review` | `admin` | Marcar para revisão manual |
| `PATCH` | `/aggregator/candidates/reject-all` | `admin` | Rejeição em lote |
| `PATCH` | `/aggregator/candidates/:id/undo-rejection` | `admin` | Desfazer rejeição |
| `DELETE` | `/aggregator/candidates/bulk` | `admin` | Deletar múltiplos candidatos permanentemente. Body: `{ ids: string[] }`. Validações: array não-vazio, todos strings, **limite 150 por request**. Retorna: `{ data: { deleted: number, requested: number } }` |

---

## 13. Plano de Fases de Desenvolvimento

### Fase 1 — Fundação (MVP Público) ✅ Concluída
Setup de infraestrutura, migrations iniciais, auth Google OAuth, catálogo público, página de mesa, landing page de mestre, painel do mestre, deploy em beta.

### Fase 2 — Moderação e Administração ✅ Concluída
Painel administrativo, moderação com `table_history`, CRUD de taxonomias, notificações in-app, bookmarks.

### Fase 3 — Engajamento Social ⚠️ Parcialmente pendente
Módulo de Perguntas e Respostas, sistema de avaliações, notificações de respostas, filtros salvos.

### Fase 4 — AggregatorBot Completo ⚠️ Parcialmente implementado
Ingestão manual de JSON do Discord está operacional. Coleta automática de fontes externas (Facebook, Reddit) e dry run completo são pendentes.

### Fase 5 — Crescimento e Estabilização 🔜 Pendente
Recomendações por preferências, notificações por email, SEO estruturado, métricas internas, exportação WhatsApp/Discord.

---

## 14. Decisões Arquiteturais Registradas

| Decisão | Justificativa |
|---|---|
| **Google OAuth como único método de login** | Elimina gerenciamento de senha local, reduz superfície de ataque, mínima coleta de dados. |
| **Discord como vínculo opcional, não login** | Preserva simplicidade do auth Google. Abre espaço para selos públicos e validação comunitária sem acoplar o acesso principal ao Discord. |
| **AggregatorBot no mesmo compose** | Simplifica deploy, compartilha variáveis de ambiente e rede interna. Worker separado seria custo desnecessário na escala atual. |
| **Fuse.js client-side para busca** | Zero latência para o usuário. Suficiente abaixo de 10k registros ativos. Migrar para `tsvector` PostgreSQL se ultrapassar esse volume. |
| **Slug como identificador de URL** | URLs amigáveis e estáveis para SEO e compartilhamento. Gerados no backend, nunca no frontend. |
| **Separação entre `profiles` e `gm_profiles`** | Nem todo usuário é mestre. Elevação de role é evento explícito. |
| **`table_history` desde a fase 1** | Moderação sem rastreabilidade é inauditável. Custo de implementar depois é sempre maior. |
| **Deduplicação determinística no bot** | Anúncios manuais do Artifício sempre prevalecem sobre importados. Sem seleção aleatória de vencedor. |
| **Parser Python com spaCy no backend (REQ-18)** | NLP avançado para extração de campos de mensagens Discord. Precisão superior ao parser TypeScript. Execução no backend garante consistência e segurança. |
| **Toast notifications (REQ-19)** | Substituição de `alert()` por `react-hot-toast`. Feedback não-bloqueante alinhado com heurísticas de Nielsen. |
| **Validação antes de aprovar candidatos (REQ-19)** | Previne publicação de mesas com dados incompletos. Campos obrigatórios validados antes de aceitar. |
| **`sistemas.json` e `cenarios.json` (Abril/2026)** | Substituição de `arvores_de_sistemas.md` por JSON estruturado facilita parsing, validação e manutenção programática. |
| **`gm_avatar_url` não persistido (05/04/2026)** | Avatar extraído do Discord é apenas visual no formulário de revisão. Vínculo real é feito via `gm_id` na reivindicação. |
| **Kysely em vez de ORM** | TypeScript ao máximo. Controle total das queries, sem mágica de ORM, com tipagem completa da interface `Database`. |

---

## 15. Glossário

| Termo | Definição |
|---|---|
| **Mesa** | Anúncio de uma sessão ou campanha de RPG, publicada por um mestre ou importada de fonte externa. Entidade central do produto. |
| **Mestre (GM)** | Usuário com role `gm`, responsável por narrar a mesa. Possui `gm_profile` público. |
| **Jogador** | Usuário com role `player`. Pode buscar, salvar e avaliar mesas, mas não publicar. |
| **AggregatorBot** | Serviço interno de coleta e processamento de anúncios de fontes externas. |
| **Fonte** | URL ou canal externo monitorado pelo AggregatorBot (ex: servidor Discord). |
| **Candidato** | Anúncio importado que aguarda revisão editorial na fila de curadoria. |
| **Reivindicação** | Ação de um mestre local que vincula um anúncio importado ao próprio `gm_profile`. |
| **Dry Run** | Simulação de importação em lote sem persistir dados, usada para preview e detecção de duplicatas. |
| **Slug** | Identificador textual único gerado a partir do nome da entidade, usado em URLs amigáveis. |
| **Onboarding** | Fluxo de 3 etapas executado no primeiro login para configurar perfil e preferências. |
| **Selo** | Marcador visual no perfil do mestre derivado de critério editorial ou vínculo comunitário validado (ex: DDAL, Covil do Lich). |
| **Covil do Lich** | Comunidade parceira. Mesas associadas recebem o selo automaticamente via parser se termos correspondentes forem detectados. |
| **DDAL** | D&D Adventurers League. Programa oficial de jogo organizado da Wizards of the Coast. Exige `system_id` apontando para `dungeons-dragons/5e/2024`. |
| **SessionSchedule** | Interface compartilhada (Python/Pydantic + TypeScript) representando um horário de sessão com dia, hora, frequência e vagas. |

---

## 16. Gestão de Imagens e Integração Imgur

### 16.1 Categorias de Imagem

**Imagens estáticas do site** (logos, ícones, ilustrações de UI) — servidas pelo Nginx a partir do build Vite. Nunca vão para o Imgur.

**Imagens enviadas por usuários** — processadas no backend, convertidas para WebP via Sharp, hospedadas no Imgur:
- Banners de mesas criadas localmente (`tables.cover_url` com `cover_source_type = imgur_upload`)
- Avatar e banner do mestre (`gm_profiles.avatar_url`, `gm_profiles.banner_url`)

**Imagens reaproveitadas de fontes externas** — quando anúncio importado do Discord já traz imagem pública reutilizável, ela é usada diretamente como `cover_url` com `cover_source_type = discord_reused`, sem reupload.

### 16.2 Fluxos de Imagem

**Fluxo A — Upload local para Imgur:**
```
[Cliente envia imagem via multipart/form-data]
    → API Node.js recebe o arquivo
    → Sharp converte para WebP (qualidade 85, largura máx 1280px, proporcional)
    → Buffer WebP enviado ao Imgur via POST /image (base64)
    → Imgur retorna { link, deletehash, id }
    → Backend salva: link, deletehash, imgur_id no banco
    → cover_source_type = 'imgur_upload'
    → URL pública retornada ao frontend
```

**Fluxo B — Reaproveitamento de imagem do Discord:**
```
[AggregatorBot encontra anúncio com imagem pública]
    → Valida se a URL é pública e reutilizável
    → Grava cover_url com a URL original
    → Grava cover_origin_url com a mesma URL
    → cover_source_type = 'discord_reused'
    → Não gera deletehash nem imgur_id
```

**Regra arquitetural:** Para anúncios importados de canais monitorados, a imagem da campanha deve ser reaproveitada sempre que a postagem já fornecer URL pública utilizável.

### 16.3 Limites e Regras de Upload

- Tamanho máximo aceito pelo backend: **10MB por arquivo** (antes da conversão WebP)
- Formatos aceitos na entrada: JPEG, PNG, WebP, AVIF, GIF estático (GIF animado é rejeitado)
- Saída sempre em **WebP**, qualidade 85, largura máxima 1280px, altura proporcional
- Uma imagem por campo por vez — ao substituir, a anterior é deletada do Imgur antes do novo upload
- Rate limit do Imgur: 1250 uploads/dia por Client-ID. Em `429`, retornar erro claro ao usuário sem retry na mesma requisição
- Uploads aceitos apenas de usuários autenticados com role `gm` (imagens de mesa e perfil) ou `admin`

### 16.4 Política de Expiração e Exclusão

**Mesas com imagens do Imgur (`imgur_upload`):** Quando status transitar para `ended` ou `cancelled`, o CleanupWorker executa exclusão da imagem via `DELETE /image/{deletehash}`. Após confirmação, todos os campos de imagem são zerados no banco.

**Mesas com imagens reaproveitadas do Discord (`discord_reused`):** O sistema apenas limpa a referência local. Nenhum `DELETE` é enviado à origem externa.

**Imagens de mestres (avatar/banner):** Não têm expiração automática. São excluídas do Imgur apenas ao substituir (a anterior é deletada antes do novo upload) ou ao encerrar a conta do mestre via admin.

### 16.5 CleanupWorker *(pendente — migration_10)*

Roda via node-cron junto ao AggregatorBot, diariamente:

```
1. Busca mesas com status = 'ended' OR 'cancelled'
   WHERE cover_source_type = 'imgur_upload'
   AND cover_deletehash IS NOT NULL
2. Para cada mesa: DELETE /image/{deletehash} na API do Imgur
3. Se 200: zera todos os campos de imagem no banco
4. Se 404 (já deletada): zera os campos sem erro
5. Se falha de rede: registra em log, tenta novamente no próximo ciclo
6. Imagens com cover_source_type = 'discord_reused' são ignoradas
7. Registra cada operação em imgur_cleanup_log
```

**Estrutura da tabela `imgur_cleanup_log`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `entity_type` | TEXT | `table` ou `gm_profile` |
| `entity_id` | UUID | FK da entidade |
| `imgur_id` | TEXT | ID da imagem deletada |
| `status` | TEXT | `success`, `not_found`, `error` |
| `attempted_at` | TIMESTAMPTZ | Timestamp da tentativa |
| `error_detail` | TEXT | Mensagem de erro, se houver |

### 16.6 Segurança de Imagens

- `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` são campos **nunca retornados por nenhuma rota pública da API**.
- `IMGUR_CLIENT_ID` é variável de ambiente obrigatória, listada no `.env.example` sem valor real, nunca exposta ao frontend.
- URLs externas reaproveitadas do Discord só podem ser usadas quando já forem públicas na postagem importada. O sistema não modifica nem exclui arquivos em origens externas.

---

## 17. Documentos Relacionados

| Documento | Finalidade |
|---|---|
| `AGENTS.md` | Instruções de comportamento para agentes de IA no projeto |
| `ERRORS_SOLUTIONS.md` | Registro de erros conhecidos e soluções (E001–E111 catalogados até Abril/2026) |
| `CHANGELOG.md` | Histórico de versões e mudanças relevantes |
| `GUIA_RAPIDO_OPERACIONAL.md` | Referência rápida de tarefas operacionais para agentes |
| `docker-compose.yml` | Definição dos serviços: API, PostgreSQL, Nginx, AggregatorBot |
| `sistemas.json` | Taxonomia de sistemas (name, aliases, editions, variants, depth, path_slug) |
| `cenarios.json` | Cenários com campo `subgenero` como array de tags |
| `backend/src/db/types.ts` | Interface `Database` com tipagem completa de todas as tabelas |
| `slugify.ts` | Utilitário de geração de slugs únicos |
| `pythonParserService.ts` | Orquestrador Node.js do parser Python via child_process |
| `discord_message_parser.py` | Script Python com spaCy para extração de campos estruturados |

---

> **Este é um presente do Artifício RPG para a comunidade brasileira de RPG.**
> Gratuito · Sem anúncios · Sem coleta de dados · Feito com ♥ pela comunidade.
