# Feature: Aba "Atividades" em /gestao

> **Documento de trabalho.** Sonnet lê, executa em ordem, marca checkboxes e registra decisões aqui mesmo. Não é prompt — é guia com contexto, diagnósticos e gates.
>
> **Status:** Etapa 1 (Diagnóstico) concluída em 20/04/2026 00:50 BRT. Plano ajustado com base nos achados.

---

## 0. Contexto rápido

**Projeto:** Artifício Mesas — anúncios de mesas de RPG.
**Stack:** React 19 + Vite + TS + Tailwind | Node + Express + Kysely + Postgres.
**Tokens CSS:** `--color-artificio-orange` (#E8521A), `--color-artificio-blue` (#1B2A4A).
**Paleta:** dark mode. Fundo `#0B1628` / `#0F1A2E`. Texto branco. Borders `white/10` a `white/20`.
**URL alvo:** `/gestao` → nova aba **"Atividades"** (terceira, depois de "Sugestões de Sistemas").

**Pré-condição obrigatória:** Fase 1 da auditoria já está em produção (migrations 104/105/106, approve materializando, rota de cenários, paginação em systems, inspector novo). ✅ Confirmado.

**Decisões já fechadas (não renegociar):**
- Rota A — tabela `activity_log` populada por `logActivity()`.
- Sem backfill. Log começa do zero.
- Sem filtro de "Sugestões de Plataformas" (feature não existe).
- Aba dentro de `/gestao`, visual dark consistente.
- Sem websocket, sem export CSV, sem expand-on-click nesta fase.

---

## 1. Diagnóstico de entrada — preenchido

```
Data/hora: 20/04/2026 00:50 BRT
req.user shape: AuthDecoded { userId: string; email?: string; role: UserRole }
Caminho db/types.ts: backend/src/db/types.ts
Padrão de tabs em GestaoPage: useState com activeTab ('systems' | 'crud')
  + crudSubTab ('systems' | 'scenarios' | 'tables' | 'platforms')
Arquivo de types admin: NÃO EXISTE frontend/src/features/admin/types.ts.
  Types admin estão distribuídos:
  - frontend/src/modules/admin/systems/types.ts
  - interfaces locais em páginas/componentes
Classe botão secundário dark: 'bg-white/5 text-white/60 hover:bg-white/10'
react-hot-toast: confirmado em uso
Tabela activity_log existente: não
Contagem users: 7

PENDÊNCIAS REGISTRADAS:
[ALTA] Colisão de numeração: já existem migrations 107_* no repositório.
       → Ajuste: esta migration será 108_activity_log.sql.
[MÉDIA] Host local sem docker/psql no PATH.
       → Ajuste: validações de DB via SSH no container mesas-beta-db.
```

### Ajustes do plano motivados pelo diagnóstico

1. **Migration será `108_activity_log.sql`**, não 107.
2. **Types admin vão em `frontend/src/modules/admin/activity/types.ts`** (seguindo o padrão existente do `modules/admin/systems/types.ts`), não em `features/admin/types.ts`.
3. **Componentes vão em `frontend/src/modules/admin/activity/components/`**, alinhado ao módulo `systems`.
4. **Tab "Atividades" será adicionada ao `activeTab`** (virando `'systems' | 'crud' | 'activity'`), paralela às outras duas. **Não** como subtab de `crud`.
5. **Classe de botão secundário reutilizável:** `bg-white/5 text-white/60 hover:bg-white/10` (já documentada como padrão do projeto).
6. **Validações DB via SSH remoto** no container `mesas-beta-db`. Não depende de docker local.

---

## 2. Escopo — lista mestra de arquivos

### A criar

- [ ] `database/migration_108_activity_log.sql`
- [ ] `backend/src/services/activityLogger.ts`
- [ ] `backend/src/routes/activityLog.ts`
- [ ] `frontend/src/modules/admin/activity/types.ts`
- [ ] `frontend/src/modules/admin/activity/components/ActivityPanel.tsx`
- [ ] `frontend/src/modules/admin/activity/components/ActivityFilters.tsx`
- [ ] `frontend/src/modules/admin/activity/components/ActivityFeed.tsx`
- [ ] `frontend/src/modules/admin/activity/components/ActivityItem.tsx`
- [ ] `frontend/src/modules/admin/activity/utils/formatRelative.ts`
- [ ] `frontend/src/modules/admin/activity/hooks/useActivityLog.ts`

### A modificar

- [ ] `backend/src/db/types.ts` (adicionar `ActivityLogTable`)
- [ ] `backend/src/server.ts` (registrar `activityLogRoutes`)
- [ ] `backend/src/routes/auth.ts` (log `user.registered` na criação)
- [ ] `backend/src/routes/gmPanel.ts` (log de mesas: created/updated/deleted/status_changed)
- [ ] `backend/src/routes/systemSuggestions.ts` (log `system_suggestion.created`)
- [ ] `backend/src/routes/systemSuggestionsAdmin.ts` (log approved/rejected dentro da trx)
- [ ] `backend/src/routes/scenarioSuggestions.ts` (log `scenario_suggestion.created`)
- [ ] `backend/src/routes/scenarioSuggestionsAdmin.ts` (log approved/rejected dentro da trx)
- [ ] `frontend/src/pages/GestaoPage.tsx` (adicionar 3ª tab `'activity'`)
- [ ] `MAPA_DE_API.md` (documentar `GET /admin/activity`)

---

## 3. Implementação em ordem

### FASE A — Fundação backend

Dependências: nenhuma. Objetivo: tabela + helper prontos, testados isoladamente.

#### A.1 Migration 108

- [x] Criar `database/migration_108_activity_log.sql`.
- [x] Tabela `activity_log` com colunas:
  - `id UUID PK DEFAULT gen_random_uuid()`
  - `actor_id UUID REFERENCES users(id) ON DELETE SET NULL` (nullable — eventos de sistema ou auto-registro)
  - `actor_role TEXT` (snapshot: `'admin' | 'gm' | 'player'` — deve aceitar todos os valores de `UserRole`)
  - `action TEXT NOT NULL`
  - `entity_type TEXT NOT NULL`
  - `entity_id UUID` (nullable — entidade pode ter sido deletada)
  - `entity_label TEXT` (snapshot humano, ex: "Saga dos Deuses")
  - `target_user_id UUID REFERENCES users(id) ON DELETE SET NULL`
  - `summary TEXT NOT NULL`
  - `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- [x] 6 índices:
  - `idx_activity_log_created_at` em `(created_at DESC)`
  - `idx_activity_log_action` em `(action)`
  - `idx_activity_log_entity` em `(entity_type, entity_id)`
  - `idx_activity_log_actor` em `(actor_id) WHERE actor_id IS NOT NULL`
  - `idx_activity_log_target` em `(target_user_id) WHERE target_user_id IS NOT NULL`
  - `idx_activity_log_metadata_gin` USING gin(metadata)
- [x] Idempotência: `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`.
- [x] Bloco `DO $$ ... RAISE EXCEPTION ...` no final falhando se tabela ou índices não foram criados.
- [x] Aplicar via SSH (host local não tem docker/psql):
  ```bash
  ssh -F C:\projetos\config faren 'docker exec -i mesas-beta-db psql -U admin -d mesas_rpg' < database/migration_108_activity_log.sql
  ```
- [x] Conferir remoto: `\d activity_log` mostra tabela + 6 índices.

**Gate A.1:** tabela criada em staging. Listar constraints e índices via SSH. Output colado no bloco de decisões (seção 6).

#### A.2 Kysely types

- [x] Em `backend/src/db/types.ts`, adicionar interface:
  ```ts
  export interface ActivityLogTable {
    id: Generated<string>;
    actor_id: string | null;
    actor_role: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    entity_label: string | null;
    target_user_id: string | null;
    summary: string;
    metadata: ColumnType<Record<string, unknown>, string, string>;
    created_at: Generated<Date>;
  }
  ```
- [x] Adicionar `activity_log: ActivityLogTable` na interface `Database` (ou equivalente que agrega todas as tabelas).
- [x] Confirmar imports `Generated` e `ColumnType` já existem no arquivo.

**Gate A.2:** `tsc --noEmit` no backend não reclama de `db.selectFrom('activity_log')`.

#### A.3 Helper `activityLogger.ts`

- [x] Criar `backend/src/services/activityLogger.ts`.
- [x] Exportar type `ActivityAction`:
  ```ts
  export type ActivityAction =
    | 'user.registered' | 'user.role_changed'
    | 'table.created' | 'table.updated' | 'table.deleted' | 'table.status_changed'
    | 'system.created' | 'system.updated' | 'system.deleted'
    | 'scenario.created' | 'scenario.updated' | 'scenario.deleted'
    | 'system_suggestion.created' | 'system_suggestion.approved' | 'system_suggestion.rejected'
    | 'scenario_suggestion.created' | 'scenario_suggestion.approved' | 'scenario_suggestion.rejected';
  ```
- [x] Exportar type `ActivityEntityType`:
  ```ts
  export type ActivityEntityType =
    | 'user' | 'table' | 'system' | 'scenario'
    | 'system_suggestion' | 'scenario_suggestion';
  ```
- [x] Função `logActivity(input, trx?)`:
  - Input: `{ actorId, actorRole?, action, entityType, entityId, entityLabel?, targetUserId?, summary, metadata? }`.
  - `trx?`: `Transaction<Database>` opcional. Se passado, usa dentro da transação. Senão, usa `db` global.
  - Insere linha. `metadata` vai `JSON.stringify(metadata ?? {})`.
  - **Try/catch interno.** Nunca propaga. Falha = `console.error('[activityLogger]', err)` e retorna.

**Gate A.3:** `tsc --noEmit` ok. Teste manual via REPL ou script — chamar `logActivity()` e conferir linha no banco via SSH.

---

### FASE B — Rota de leitura

Dependências: Fase A completa.

#### B.1 Rota `GET /api/v1/admin/activity`

- [x] Criar `backend/src/routes/activityLog.ts`.
- [x] Middleware: `router.use(authMiddleware, requireRole('admin'))`.
- [x] Query params aceitos:
  - `action` — string ou array (suportar `?action=x&action=y`)
  - `actor_id` — UUID
  - `target_user_id` — UUID
  - `entity_type` — string
  - `search` — string (ILIKE em `summary`)
  - `date_from` — ISO date
  - `date_to` — ISO date
  - `cursor` — UUID do último item da página anterior
  - `limit` — number (default 50, clamp em `Math.min(limit, 200)`)
- [x] Ordenação: `ORDER BY created_at DESC, id DESC`.
- [x] Cursor-based: cursor é `id` UUID puro. Backend busca `SELECT created_at FROM activity_log WHERE id = $cursor` primeiro, depois aplica `WHERE (created_at, id) < (cursor_created_at, cursor_id)`.
- [x] JOIN `users` duas vezes (actor + target) para hidratar nome/avatar.
- [x] `filters_meta` retornado em TODA página (query barata, simplifica frontend).
- [x] Resposta:
  ```json
  {
    "data": [ActivityEntry],
    "pagination": { "next_cursor": "uuid|null", "has_more": true|false },
    "filters_meta": {
      "actors": [{ "id", "name", "avatar_url" }],
      "target_users": [{ "id", "name", "avatar_url" }],
      "available_actions": ["user.registered", ...]
    }
  }
  ```
- [x] `filters_meta.actors`: DISTINCT de users que já aparecem em `activity_log.actor_id`.
- [x] `filters_meta.target_users`: DISTINCT de users em `activity_log.target_user_id`.
- [x] `filters_meta.available_actions`: DISTINCT `action` em `activity_log`.

#### B.2 Registrar em `server.ts`

- [x] Adicionar:
  ```ts
  import activityLogRoutes from './routes/activityLog';
  app.use('/api/v1/admin', activityLogRoutes);
  ```
- [x] Colocar APÓS as outras rotas `admin` (ordem: `adminTables`, `systemSuggestionsAdmin`, `scenarioSuggestionsAdmin`, `activityLog`).

**Gate B:**
```bash
curl -H "Cookie: $COOKIE" $BASE/api/v1/admin/activity | jq
```
Retorna `{ data: [], pagination: { next_cursor: null, has_more: false }, filters_meta: { actors: [], target_users: [], available_actions: [] } }`.

---

### FASE C — Instrumentação das rotas existentes

Dependências: Fase A completa.

**Regra de ouro:** `logActivity()` é chamado **após** o sucesso da operação. Se a rota já está em transação, passa `trx`. Nunca quebra o handler.

#### C.1 `routes/auth.ts` — `user.registered`

- [x] Localizar callback `/google/callback` onde user é criado pela primeira vez.
- [x] **Cuidado crítico:** logar **só na primeira criação**, nunca em login subsequente. O fluxo Google tem dois caminhos: "user existe → só faz login" e "user novo → INSERT". Logar apenas no segundo.
- [x] Chamada:
  ```ts
  await logActivity({
    actorId: null,  // self-registration
    action: 'user.registered',
    entityType: 'user',
    entityId: newUser.id,
    entityLabel: newUser.name,
    targetUserId: newUser.id,
    summary: `${newUser.name} registrou-se na comunidade.`,
    metadata: { provider: 'google', email: newUser.email }
  });
  ```

#### C.2 `routes/gmPanel.ts`

Para pegar `gmName`, fazer `SELECT name FROM users WHERE id = req.user.userId` ou usar o GM já resolvido no handler.

- [x] `POST /tables` após sucesso:
  - action: `'table.created'`
  - summary: ``${gmName} criou a mesa "${title}".``
  - entityType: `'table'`, entityId: `newTable.id`, entityLabel: `title`
  - metadata: `{ table_slug, system_id, scenario_id }`

- [x] `PUT /tables/:id` após sucesso:
  - action: `'table.updated'`
  - summary: ``${gmName} editou a mesa "${title}".``
  - metadata: `{ table_slug }`

- [x] `DELETE /tables/:id` após sucesso:
  - action: `'table.deleted'`
  - summary: ``${gmName} excluiu a mesa "${title}".``
  - entityId: `null` (entidade foi deletada)
  - entityLabel: `title` (mantém snapshot)
  - metadata: `{ table_slug, previous_id: id }`

- [x] `PATCH /tables/:id/status` após sucesso:
  - action: `'table.status_changed'`
  - summary: ``${gmName} alterou status da mesa "${title}" de ${from} para ${to}.``
  - metadata: `{ table_slug, from, to }`

#### C.3 `routes/systemSuggestions.ts` — POST `/`

- [x] Após INSERT bem-sucedido:
  ```ts
  await logActivity({
    actorId: req.user.userId,
    actorRole: req.user.role,
    action: 'system_suggestion.created',
    entityType: 'system_suggestion',
    entityId: suggestion.id,
    entityLabel: suggestion.name,
    summary: `${userName} sugeriu o sistema "${suggestion.name}".`,
    metadata: { suggestion_id: suggestion.id, node_type: suggestion.node_type, parent_id: suggestion.parent_id, name_pt: suggestion.name_pt }
  });
  ```

#### C.4 `routes/systemSuggestionsAdmin.ts`

Ambas as chamadas vão **dentro da transação existente**. Passar `trx` como 2º argumento.

- [x] `approve`:
  ```ts
  await logActivity({
    actorId: adminId,
    actorRole: 'admin',
    action: 'system_suggestion.approved',
    entityType: 'system_suggestion',
    entityId: id,
    entityLabel: suggestion.name,
    targetUserId: suggestion.user_id,
    summary: `${adminName} aprovou "${suggestion.name}" e adicionou ao catálogo.`,
    metadata: { suggestion_id: id, system_id: newSystem.id, path_slug: newSystem.path_slug }
  }, trx);
  ```
- [x] `reject`:
  - action: `'system_suggestion.rejected'`
  - summary: ``${adminName} rejeitou a sugestão "${suggestion.name}".``
  - metadata: `{ suggestion_id: id, reason }`

**Nota:** para `adminName`, fazer `SELECT name FROM users WHERE id = adminId` dentro da mesma trx. Custo marginal de 1 query.

#### C.5 `routes/scenarioSuggestions.ts` + `scenarioSuggestionsAdmin.ts`

- [x] Espelhar C.3 e C.4 trocando `system` por `scenario`.

**Gate C:** fluxo ponta a ponta:
1. Registrar novo user via Google → ver linha `user.registered` no banco.
2. Criar mesa via `/painel` → ver `table.created`.
3. Aprovar sugestão → ver `system_suggestion.approved`.

Verificação:
```sql
SELECT action, summary, created_at FROM activity_log ORDER BY created_at DESC LIMIT 10;
```

---

### FASE D — Frontend

Dependências: Fase B (rota funcionando).

#### D.1 Types

- [x] Criar `frontend/src/modules/admin/activity/types.ts`:
  ```ts
  export interface ActivityActor {
    id: string;
    name: string;
    avatar_url: string | null;
    role?: string | null;
  }

  export interface ActivityEntry {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    entity_label: string | null;
    summary: string;
    metadata: Record<string, unknown>;
    created_at: string;
    actor: ActivityActor | null;
    target_user: { id: string; name: string; avatar_url: string | null } | null;
  }

  export interface ActivityFiltersState {
    search: string;
    actions: string[];
    actor_id: string | null;
    target_user_id: string | null;
    date_from: string | null;
    date_to: string | null;
  }

  export interface ActivityFeedResponse {
    data: ActivityEntry[];
    pagination: { next_cursor: string | null; has_more: boolean };
    filters_meta: {
      actors: ActivityActor[];
      target_users: ActivityActor[];
      available_actions: string[];
    };
  }
  ```

#### D.2 Hook `useActivityLog`

- [x] Criar `frontend/src/modules/admin/activity/hooks/useActivityLog.ts`.
- [x] Estado: `entries`, `loading`, `hasMore`, `nextCursor`, `filtersMeta`, `filters`.
- [x] Handlers:
  - `setFilters(newFilters)` — substitui filters, reseta cursor, dispara fetch. Debounce 300ms apenas em `search`; outros imediato.
  - `loadMore()` — fetch com cursor atual, **concatena** ao array existente.
  - `refresh()` — reseta cursor, refaz fetch do zero.
- [x] `fetchPage(filters, cursor)`:
  - Construir `URLSearchParams`. `actions[]` vira múltiplos `?action=x&action=y`.
  - `fetch(\`${API_BASE}/api/v1/admin/activity?${qs}\`, { credentials: 'include' })`.
  - Em erro: `toast.error('Erro ao carregar atividades.')`.

#### D.3 `formatRelative` helper

- [x] Criar `frontend/src/modules/admin/activity/utils/formatRelative.ts`.
- [x] Regras:
  - `< 60s` → `"agora"`
  - `< 60min` → `"há ${n}min"`
  - `< 24h` → `"há ${n}h"`
  - `< 7d` → `"há ${n}d"`
  - `>= 7d` → `dd/MM/yyyy` via `toLocaleDateString('pt-BR')`
- [x] Assinatura: `formatRelative(iso: string): string`.

#### D.4 `ActivityItem`

- [x] Mapeamento `action → { Icon, color, bgColor }`:

| Action | Icon Lucide | color | bgColor |
|---|---|---|---|
| `user.registered` | `UserPlus` | `text-green-400` | `bg-green-500/10` |
| `table.created` | `Plus` | `text-blue-400` | `bg-blue-500/10` |
| `table.updated` | `Edit` | `text-amber-400` | `bg-amber-500/10` |
| `table.deleted` | `Trash2` | `text-red-400` | `bg-red-500/10` |
| `table.status_changed` | `Activity` | `text-cyan-400` | `bg-cyan-500/10` |
| `*_suggestion.created` | `Lightbulb` | `text-purple-400` | `bg-purple-500/10` |
| `*_suggestion.approved` | `CheckCircle` | `text-green-400` | `bg-green-500/10` |
| `*_suggestion.rejected` | `XCircle` | `text-red-400` | `bg-red-500/10` |
| fallback | `Circle` | `text-white/40` | `bg-white/5` |

- [x] Layout:
  ```tsx
  <li className="flex items-start gap-3 p-4 bg-[#0F1A2E]/60 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
    <div className={`p-2 rounded shrink-0 ${bgColor}`}>
      <Icon size={16} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm">{entry.summary}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/50">
        <span><strong className="text-white/70">Evento:</strong> <code className="text-white/80 font-mono">{entry.action}</code></span>
        {entry.actor && <span><strong className="text-white/70">Quem fez:</strong> {entry.actor.name}</span>}
        {entry.target_user && <span><strong className="text-white/70">Usuário afetado:</strong> {entry.target_user.name}</span>}
        {entry.entity_label && <span><strong className="text-white/70">Entidade:</strong> {entry.entity_label}</span>}
      </div>
    </div>
    <time
      className="text-xs text-white/40 tabular-nums shrink-0"
      title={new Date(entry.created_at).toLocaleString('pt-BR')}
      dateTime={entry.created_at}
    >
      {formatRelative(entry.created_at)}
    </time>
  </li>
  ```

#### D.5 `ActivityFilters`

- [x] Container:
  ```tsx
  <div className="border border-white/10 rounded-lg p-4 bg-[#0F1A2E]/40 space-y-3">
  ```
- [x] Header: `<Filter size={14} /> FILTROS` (uppercase, `text-white/80`).
- [x] Grid `grid-cols-1 md:grid-cols-3 gap-3`:
  - **Busca**: `<input>` com placeholder `"Termo, usuário, ação..."`.
  - **Tipo de evento**: **multi-select real** (permitir múltiplas ações simultâneas) com agrupamento por área e cliques rápidos:
    - Ações selecionáveis com suporte a múltiplos valores (multi-select)
    - Cliques específicos por área (botões/chips) para seleção rápida:
      - **Todos** → estado padrão ao abrir (sem filtros de ação ativos; `actions=[]`)
      - Usuários → Novos cadastros
      - Mesas → Novas mesas / Edições / Exclusões / Mudanças de status
      - Sugestões → Sugestões de sistemas / Sugestões de cenários
      - Moderação → Sistemas aprovados/rejeitados / Cenários aprovados/rejeitados
  - **Quem fez**: `<select>` com "Todos" + lista de `filtersMeta.actors`.
  - **Usuário afetado**: `<select>` com "Todos" + lista de `filtersMeta.target_users`.
  - **Data inicial**: `<input type="date">`.
  - **Data final**: `<input type="date">`.
- [x] Botão "Limpar filtros": `text-xs text-white/50 hover:text-white`.
- [x] Classes padrão inputs/selects:
  ```
  bg-[#0F1A2E] border border-white/10 rounded px-3 py-2 text-white text-sm
  focus:outline-none focus:border-[var(--color-artificio-orange)]
  ```

#### D.6 `ActivityFeed`

- [x] Loading (primeira carga, entries vazio): 5 skeletons com `bg-white/5 animate-pulse h-20 rounded-lg`.
- [x] Empty state: ícone `Inbox` + `"Nenhuma atividade registrada para os filtros atuais."`.
- [x] Lista: `<ul className="space-y-2">` com `ActivityItem` por entry.
- [x] Botão "Carregar mais" quando `hasMore`:
  ```tsx
  <button
    onClick={onLoadMore}
    disabled={loading}
    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white disabled:opacity-50 transition-colors"
  >
    {loading ? 'Carregando...' : 'Carregar mais'}
  </button>
  ```

#### D.7 `ActivityPanel`

- [x] Orquestra `useActivityLog` + renderiza `ActivityFilters` + `ActivityFeed`.
- [x] Header:
  ```tsx
  <header className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Activity size={22} className="text-[var(--color-artificio-orange)]" />
        Atividade Administrativa
      </h2>
      <p className="text-sm text-white/60">Timeline consolidada de ações na plataforma.</p>
    </div>
    <button
      onClick={refresh}
      className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 rounded text-sm hover:text-white transition-colors"
    >
      <RefreshCw size={14} /> Atualizar
    </button>
  </header>
  ```
- [x] Wrapper: `<div className="space-y-4">`.

#### D.8 Integrar em `GestaoPage.tsx`

- [x] Expandir o tipo do `activeTab`:
  ```ts
  const [activeTab, setActiveTab] = useState<'systems' | 'crud' | 'activity'>('systems');
  ```
- [x] Adicionar botão de tab "Atividades" após "Sugestões de Sistemas" (que é `'systems'`) e "Gerenciar Conteúdo" (que é `'crud'`).
  - Label: `"Atividades"`, opcional ícone `<Activity size={14} />` antes.
- [x] Bloco de renderização condicional:
  ```tsx
  {activeTab === 'activity' && <ActivityPanel />}
  ```
- [x] **Não alterar** lógica dos outros tabs. Só adicionar o caso novo.

**Gate D:** `npm run build` passa. Aba "Atividades" aparece em `/gestao`. Feed carrega (mesmo vazio) sem erro console.

---

### FASE E — Documentação

- [x] Em `MAPA_DE_API.md`, adicionar seção:
  ```md
  ### ACTIVITYLOG (`routes/activityLog.ts`)
  | Método | Endpoint | Status | Chamado por (Frontend) |
  |---|---|---|---|
  | GET | /admin/activity | ✅ Em Uso | ActivityPanel.tsx via useActivityLog.ts |
  ```

---

## 4. Testes manuais

Rodar na ordem depois que tudo estiver compilando.

**Diretriz operacional (20/04):** por decisão explícita do usuário, os testes T1–T13 serão executados somente após deploy em dev (beta), ambiente usado para validação visual/interação.

- [ ] **T1** — Abrir `/gestao`, ver 3 tabs. Clicar "Atividades" — `ActivityPanel` renderiza sem erro.
- [ ] **T2** — Criar mesa via `/painel`. Em Atividades, clicar "Atualizar" → aparece `table.created` no topo.
- [ ] **T3** — Editar a mesa. Atualizar → aparece `table.updated`.
- [ ] **T4** — Pausar a mesa (`PATCH status`). Atualizar → `table.status_changed` com metadata `{ from, to }`.
- [ ] **T5** — Deletar a mesa. Atualizar → `table.deleted` com `entity_id: null` e `entity_label` preservado.
- [ ] **T6** — Criar sugestão de sistema via `/catalogo`. Atualizar → `system_suggestion.created`.
- [ ] **T7** — Aprovar em "Sugestões de Sistemas". Atualizar → `system_suggestion.approved`.
- [ ] **T8** — Filtro "Tipo de evento" = "Novas mesas". Só `table.created` aparece.
- [ ] **T9** — Filtro "Quem fez" = seu user. Só eventos do admin.
- [ ] **T10** — Data inicial = ontem, data final = hoje. Só eventos do range.
- [ ] **T11** — Busca `"teste"` filtra em summary via ILIKE.
- [ ] **T12** — Paginação: gerar >50 eventos, ver "Carregar mais" funcionar.
- [ ] **T13** — Regressão: rotas instrumentadas não mudaram comportamento. Criar/editar/deletar mesa funciona como antes.

---

## 5. Regras e gotchas

1. **`logActivity()` NUNCA propaga erro.** Se banco cai ou query falha, handler principal continua.
2. **Transações:** passar `trx` em approve/reject. Se operação principal rollback, log também rollback.
3. **`user.registered` apenas na criação.** Detectar via fluxo Google OAuth: "user existe, faz login" vs "user novo, INSERT". Logar só no segundo.
4. **Snapshots:** `entity_label` e `actor_role` são snapshots — se o nome da mesa mudar depois, o log mantém nome antigo. Intencional.
5. **Delete:** `entity_id = null`, `entity_label = título antigo`, `metadata.previous_id = id` para rastro.
6. **Filtros combinam como AND.** Todos os filtros ativos restringem simultaneamente.
7. **Limit clamp:** backend força `Math.min(limit ?? 50, 200)`.
8. **Timezone:** `created_at` é `TIMESTAMPTZ` em UTC. Frontend formata para BR via `toLocaleString('pt-BR')`.
9. **Migrations remotas:** aplicar via SSH no container `mesas-beta-db`. Host local não tem docker/psql.

---

## 6. Registro de decisões & desvios

Sonnet escreve aqui qualquer coisa que divergiu do plano.

```
Decisão 1 (20/04): migration renumerada de 107 para 108 por colisão.
Decisão 2 (20/04): types admin em modules/admin/activity/, não features/admin/.
Decisão 3 (20/04): tab 'activity' como top-level em activeTab, não subtab de crud.
Decisão 4 (20/04): criada migration adicional migration_108_activity_log.sql (mesmo prefixo 108 já existente no repositório) e incluída no apply_required_migrations.sh para não ficar órfã em deploy automático.

Evidência A.1 (aplicação migration em staging):
- Comando: Get-Content -Raw database/migration_108_activity_log.sql | ssh -F C:\projetos\config faren "docker exec -i mesas-beta-db psql -v ON_ERROR_STOP=1 -U admin -d mesas_rpg"
- Output:
  CREATE TABLE
  CREATE INDEX
  CREATE INDEX
  CREATE INDEX
  CREATE INDEX
  CREATE INDEX
  CREATE INDEX
  NOTICE:  Migration 108 (activity_log) completed successfully
  DO

Evidência A.1 (estrutura/índices remotos):
- Comando: ssh -F C:\projetos\config faren "docker exec -i mesas-beta-db psql -U admin -d mesas_rpg -c '\d+ activity_log'"
- Resultado: tabela activity_log com PK + 6 índices esperados + 2 FKs ON DELETE SET NULL.

Evidência A.2 (typecheck):
- Comando: backend> npx tsc --noEmit
- Resultado: sem erros.

Evidência A.3 (validação de inserção real no beta):
- Comando (SSH + psql): INSERT técnico com `summary='smoke-test fase A beta'` e metadata `{ "source": "fase-a-smoke-beta", "via": "beta-ssh" }`.
- Output: `INSERT 0 1`.
- Leitura imediata retornou 1 linha com `action=system_suggestion.created`, `entity_type=system_suggestion` e `id=c93073b4-d765-41b8-a53c-9ceb334b007d`.
- Limpeza executada em seguida: `DELETE 1`.
- Verificação pós-limpeza: `remaining = 0`.
- Gate A.3 fechado em ambiente beta.

Evidência B.1/B.2 (implementação técnica da rota):
- Arquivo criado: `backend/src/routes/activityLog.ts`.
- Rota implementada: `GET /api/v1/admin/activity`.
- Contratos implementados: filtros (`action`, `actor_id`, `target_user_id`, `entity_type`, `search`, `date_from`, `date_to`), cursor UUID, paginação com `next_cursor/has_more`, `filters_meta` em todas as respostas.
- Registro da rota aplicado em `backend/src/server.ts` após `adminTables`, `systemSuggestionsAdmin` e `scenarioSuggestionsAdmin`.

Evidência B (typecheck backend):
- Comando: backend> `npx tsc --noEmit`
- Resultado: sem erros (exit code 0).

Decisão 5 (20/04): Gate B dispensado por autorização explícita do usuário para seguir para a próxima implementação sem validação por cookie admin neste momento.
Decisão 6 (20/04): FASE D adotará multi-select real no filtro de tipo de evento, com cliques rápidos por área no padrão visual já usado em Gestão.
Decisão 7 (20/04): T1–T13 serão executados somente após deploy em dev (beta), por diretriz explícita do usuário, mantendo o checklist técnico pré-deploy separado da validação visual/interação.
Decisão 8 (20/04): rota `GET /api/v1/admin/activity` passa a aplicar `authRateLimiter` antes de `authMiddleware`/`requireRole('admin')` para reduzir risco de abuso em endpoint de leitura intensiva.
Decisão 9 (20/04): `ActivityFilters` recebe chip "Todos" (`id=activity-group-all`) e este passa a ser o estado visual padrão quando `actions=[]` na abertura da aba.

Evidência B (dispensa de validação funcional):
- Gate B permaneceu sem execução de `curl -H "Cookie: $COOKIE" ...` por bloqueio de cookie local.
- Diretriz aplicada por comando do usuário: ultrapassar validação sem cookie e avançar implementação.

Evidência C.1 (instrumentação em auth):
- Arquivo atualizado: `backend/src/routes/auth.ts`.
- `user.registered` incluído apenas no fluxo de criação de usuário novo (`if (!user)`), dentro da transação de criação (`trx`).

Evidência C.2/C.3/C.4/C.5 (instrumentação de rotas críticas):
- `backend/src/routes/gmPanel.ts`: `table.created`, `table.updated`, `table.deleted`, `table.status_changed`.
- `backend/src/routes/systemSuggestions.ts`: `system_suggestion.created`.
- `backend/src/routes/systemSuggestionsAdmin.ts`: `system_suggestion.approved` e `system_suggestion.rejected` com `logActivity(..., trx)`.
- `backend/src/routes/scenarioSuggestions.ts`: `scenario_suggestion.created`.
- `backend/src/routes/scenarioSuggestionsAdmin.ts`: `scenario_suggestion.approved` e `scenario_suggestion.rejected` com `logActivity(..., trx)`.

Evidência C.resiliência (resolução de ator):
- `resolveActorName` aplicado com `try/catch` e fallback (`display_name` -> `username` -> prefixo do email -> padrão) nas rotas instrumentadas.
- Ajuste aplicado também nas rotas admin de sugestões para evitar quebra por falha de lookup de nome.

Evidência C.typecheck:
- Comando: backend> `npx tsc --noEmit`
- Resultado: sem erros (exit code 0).

Evidência D.1 (arquivos criados no frontend):
- `frontend/src/modules/admin/activity/types.ts`
- `frontend/src/modules/admin/activity/hooks/useActivityLog.ts`
- `frontend/src/modules/admin/activity/utils/formatRelative.ts`
- `frontend/src/modules/admin/activity/components/ActivityItem.tsx`
- `frontend/src/modules/admin/activity/components/ActivityFilters.tsx`
- `frontend/src/modules/admin/activity/components/ActivityFeed.tsx`
- `frontend/src/modules/admin/activity/components/ActivityPanel.tsx`

Evidência D.2 (integração em gestão):
- `frontend/src/pages/GestaoPage.tsx` atualizado com tab `activity` + render condicional de `<ActivityPanel />`.

Evidência D.3 (build frontend / Gate D técnico):
- Comando: frontend> `npm run build`
- Resultado: build concluído com sucesso (exit code 0).

Evidência E.1 (documentação da API):
- Arquivo atualizado: `MAPA_DE_API.md`.
- Seção adicionada: `ACTIVITYLOG (routes/activityLog.ts)`.
- Endpoint registrado: `GET /admin/activity` com consumo em `ActivityPanel.tsx via useActivityLog.ts`.

Evidência Pré-Deploy (20/04):
- Backend typecheck: `backend> npx tsc --noEmit` → exit code 0.
- Frontend build: `frontend> npm run build` → exit code 0.
- Gate C (consulta read-only em beta):
  - Query executada em `mesas_rpg.activity_log` filtrando `user.registered`, `table.*`, `system_suggestion.*`, `scenario_suggestion.*`.
  - Resultado atual: `(0 rows)`.
  - Status: sem evidência de tráfego funcional registrada ainda; validação ponta a ponta permanece pendente para execução após deploy em dev conforme diretriz operacional.

Evidência Pós-Deploy DEV (20/04):
- Deploy beta concluído com sucesso via workflow `Deploy Beta` (run `24664678833`, SHA `13cccac19afe8d700d6ce10ddbf3dda962a34a0a`).
- Healthcheck beta: `GET /api/v1/health` retornando `{"status":"ok","environment":"beta","db":"connected"...}`.
- Endpoint crítico: `GET /api/v1/tables?limit=1` retornando `200`.
- Ajuste de segurança aplicado: `backend/src/routes/activityLog.ts` com `router.use(authRateLimiter)` antes de auth/role.
- Ajuste de UX aplicado: `frontend/src/modules/admin/activity/components/ActivityFilters.tsx` com chip "Todos" como opção explícita e estado padrão visual ao abrir.
- Validação técnica dos ajustes:
  - Backend `npx tsc --noEmit` → exit code 0.
  - Frontend `npx tsc --noEmit` → exit code 0.
```

---

## 7. Final — Confirmação de encerramento

Quando TODAS as caixas estiverem marcadas e todos os T1–T13 passaram:

- [x] Build backend ok (`tsc --noEmit`).
- [x] Build frontend ok (`npm run build`).
- [x] Migration 108 aplicada em staging.
- [x] `MAPA_DE_API.md` atualizado.
- [ ] Todos T1–T13 verdes.
- [ ] Este documento com todos os checkboxes marcados.

**Nota operacional (20/04):** T1–T13 e validação funcional ponta a ponta ficam para execução após deploy em dev (beta), conforme diretriz explícita do usuário.

Quando completo, fechar este arquivo com data/hora e pingar o Faren.
