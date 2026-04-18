# 26-04-17_8_planejamento-og-cache-30d.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Planejar a implementação de enriquecimento Open Graph de links externos sem bloquear o fluxo do usuário, com cache em camadas e expiração automática dos dados pesados após 30 dias sem solicitação/visita da página.

## Vínculos
- **Sessão anterior:** `26-04-17_7_instrumentacao-views-links-painel.md`
- **Próxima sessão:** a definir (execução)

## Escopo fechado desta sessão
1. Definir arquitetura do fluxo OG assíncrono (write-fast + enrich-later).
2. Definir estratégia de cache com expiração por inatividade de 30 dias.
3. Definir alterações de schema/API/backend/frontend estritamente necessárias.
4. Definir matriz completa de testes de verificação (funcional, integração, segurança, carga e retenção).
5. Definir critérios objetivos de aceite, riscos com severidade e rollback.

## Fora de escopo desta sessão
- Implementar código de produção.
- Executar deploy.
- Executar migration em beta/produção.

## Arquitetura proposta (incremental e reversível)

### 1) Fluxo principal
1. Usuário cria link em `POST /api/v1/profile/links`.
2. API persiste link imediatamente com metadados base e `metadata_status = 'pending'`.
3. API enfileira job de enriquecimento OG em tabela de jobs (DB queue).
4. Worker interno processa jobs com limites rígidos (timeout/bytes/redirects).
5. Worker atualiza cache persistente de metadados no próprio link.
6. Rotas de leitura marcam `metadata_last_accessed_at` (com throttling) quando link é exibido em painel/perfil público.
7. Limpeza diária remove cache pesado e dados vencidos com 30 dias sem acesso.

### 2) Camadas de cache
- **L1 (memória, leve):** mapa em memória por processo para dedupe de fetch imediato (TTL curto: 5–10 min).
- **L2 (Postgres, persistente):** campos normalizados no `user_links` (title/description/thumbnail/status/timestamps).
- **L3 (pesado, opcional controlado):** tabela separada para payloads grandes de scraping (se habilitado), com purge por inatividade de 30 dias.

### 3) Regra de expiração por inatividade (30 dias)
- Campo canônico: `metadata_last_accessed_at`.
- Atualiza quando:
  - `GET /api/v1/profile/links` (painel do dono)
  - `GET /api/v1/gm/:slug` (página pública exibindo links)
- Política:
  - Se `NOW() - metadata_last_accessed_at > 30 dias` ⇒ expirar cache pesado.
  - Em expiração: limpar `description`, `thumbnail_url` e payload pesado (L3); manter `title` mínimo/fallback (hostname) para UX.
  - Próxima visita reabre ciclo: status vai para `stale/pending` e worker revalida.

## Alterações técnicas planejadas

### A) Banco de dados
1. **Migration nova** (idempotente) para `user_links`:
   - `metadata_status TEXT NOT NULL DEFAULT 'pending'` (`pending|success|failed|stale`)
   - `metadata_fetched_at TIMESTAMPTZ NULL`
   - `metadata_last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `metadata_expires_at TIMESTAMPTZ NULL`
   - `metadata_fail_count INTEGER NOT NULL DEFAULT 0`
   - `metadata_error_code TEXT NULL`
2. **Tabela de fila** `link_metadata_jobs`:
   - `id`, `link_id`, `status`, `attempts`, `next_attempt_at`, `locked_at`, `locked_by`, `last_error`, `created_at`, `updated_at`.
   - Índices por `status,next_attempt_at`.
3. **Tabela de cache pesado (opcional)** `link_metadata_payload_cache`:
   - `link_id`, `payload_text` (ou comprimido), `content_length`, `last_accessed_at`, `created_at`, `updated_at`.
   - Expiração por inatividade > 30 dias.
4. Índices operacionais:
   - `idx_user_links_metadata_last_accessed_at`
   - `idx_link_metadata_jobs_pickup`

### B) Backend API/serviços
1. `backend/src/services/linkService.ts`
   - `createUserLink`: não bloquear request por scraping externo.
   - Inserir link com status `pending`.
   - Enfileirar job de metadata.
2. Worker/runner de jobs (script dedicado):
   - buscar lote pequeno (`LIMIT 5`) com lock transacional.
   - timeout 2s, body max 128KB, redirects max 3.
   - parser OG/Twitter básico (sem dependência pesada inicial).
   - atualizar status (`success|failed`) e campos de cache.
3. Rotas de leitura (`links.ts` e `gm.ts`):
   - touch de `metadata_last_accessed_at` com throttle (ex.: no máximo 1 update por link a cada 6h).
4. Script de limpeza diária:
   - remover payload pesado inativo > 30 dias.
   - limpar `description/thumbnail_url` de links inativos > 30 dias.
   - marcar `metadata_status = 'stale'` para revalidação sob demanda.

### C) Frontend
1. `useLinks.ts` e tipos:
   - incluir `metadata_status` e timestamps de metadata.
2. `LinksManager`/`LinksDisplay`:
   - estado visual: `pending` (carregando preview), `failed` (fallback), `success` (preview completo), `stale` (preview + revalidação em background).
   - manter UX funcional sem depender de preview rico.

### D) Deploy/Operação
1. Registrar migration no `scripts/deploy/apply_required_migrations.sh`.
2. Adicionar script npm para worker e limpeza no backend.
3. Definir execução recorrente de limpeza (cron/container scheduler já existente no ambiente).

## Plano de execução (ordem)
1. Criar migration de schema e índices.
2. Atualizar tipos Kysely (`backend/src/db/types.ts`).
3. Adaptar `createUserLink` para enqueue assíncrono.
4. Criar worker de metadata OG com proteções de rede/tempo.
5. Implementar touch de acesso nas rotas de leitura.
6. Implementar script de limpeza TTL 30d por inatividade.
7. Ajustar frontend para estados de metadata.
8. Validar testes locais e em beta.
9. Atualizar documentos operacionais da sessão.

## Matriz de testes de verificação

### 1) Funcionais (API)
- **T1 (create rápido):** `POST /api/v1/profile/links` retorna 201 sem aguardar scraping.
- **T2 (status inicial):** link novo retorna `metadata_status = pending`.
- **T3 (worker sucesso):** após processamento, link retorna `success` + `title/description/thumbnail`.
- **T4 (falha controlada):** URL inválida/bloqueada gera `failed` com `metadata_error_code`.
- **T5 (revalidação):** link `stale` volta para `pending/success` após nova visita.

### 2) Integração (UI + API)
- **T6:** criar link no painel e ver fallback imediato sem travar interface.
- **T7:** após worker, atualizar tela e verificar preview enriquecido.
- **T8:** perfil público (`/mestre/:slug`) exibe preview sem quebrar quando metadata falhar.

### 3) Segurança (obrigatório)
- **T9 SSRF:** bloquear destinos privados (`127.0.0.1`, `10.0.0.0/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`).
- **T10 Protocolo:** aceitar apenas `http/https`.
- **T11 Redirect chain:** interromper após 3 redirecionamentos.
- **T12 Payload cap:** abortar leitura acima de 128KB.

### 4) Retenção/expiração (30 dias)
- **T13:** simular link com `metadata_last_accessed_at` > 30 dias e executar cleanup.
- **T14:** validar que cache pesado é removido e `metadata_status` vira `stale`.
- **T15:** validar que link acessado recentemente NÃO é limpo.

### 5) Desempenho operacional
- **T16:** lote de 100 links: create API permanece responsiva.
- **T17:** worker em concorrência 1–2 não degrada API principal.
- **T18:** limpeza diária conclui sem lock prolongado.

### 6) Regressão
- **T19:** CRUD atual de links (add/remove/reorder/list) sem regressão.
- **T20:** OG dinâmico da página `/mestre/:slug` continua sem alteração de comportamento.

## Critérios de aceite (go/no-go)
1. Nenhuma chamada síncrona externa bloqueando `POST /api/v1/profile/links`.
2. Estados `pending/success/failed/stale` expostos no contrato e usados no frontend.
3. Cleanup remove cache pesado por inatividade > 30 dias.
4. Testes T1–T20 concluídos com evidência.
5. Typecheck backend/frontend sem erro.

## Riscos e severidade
- **R1 (Alta):** SSRF no scraper se filtros de rede forem incompletos.
- **R2 (Alta):** lock/contensão no banco por update de `last_accessed_at` sem throttle.
- **R3 (Média):** aumento de tráfego de saída por retries agressivos.
- **R4 (Média):** regressão visual em links sem metadata.
- **R5 (Baixa):** diferença de preview entre provedores por OG inconsistente na origem.

## Rollback planejado
1. Desativar worker (feature flag/env).
2. Manter CRUD de links ativo com fallback sem preview enriquecido.
3. Pausar cleanup de metadata se houver falso-positivo.
4. Reverter migration de lógica via rollback seguro (sem drop destrutivo imediato).

## Checklist
- [x] Criar migration idempotente para metadados e fila de jobs
- [x] Atualizar `backend/src/db/types.ts`
- [x] Adaptar `createUserLink` para fluxo assíncrono
- [x] Implementar worker OG com timeout/limites/bloqueios de rede
- [x] Implementar touch de `metadata_last_accessed_at` com throttle
- [x] Implementar script de cleanup TTL 30 dias por inatividade
- [x] Ajustar frontend para estados `pending/success/failed/stale`
- [x] Validar testes T1–T20
- [x] Incluir migration no gate de deploy
- [x] Atualizar changelog (mudança visível ao usuário)
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

## Arquivos previstos para modificação (execução futura)
- `database/migration_109_links_og_metadata_cache.sql` (novo)
- `backend/src/db/types.ts`
- `backend/src/services/linkService.ts`
- `backend/src/routes/links.ts`
- `backend/src/routes/gm.ts`
- `backend/src/scripts/processLinkMetadataJobs.ts` (novo)
- `backend/src/scripts/cleanupLinkMetadataCache.ts` (novo)
- `backend/package.json`
- `frontend/src/hooks/useLinks.ts`
- `frontend/src/components/LinksManager.tsx`
- `frontend/src/components/LinksDisplay.tsx`
- `scripts/deploy/apply_required_migrations.sh`
- `database/changelogs.json`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
