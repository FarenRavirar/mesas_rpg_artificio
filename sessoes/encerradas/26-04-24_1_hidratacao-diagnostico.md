# 26-04-24_1_hidratacao-diagnostico

**Data:** 24/04/2026
**Objetivo:** Mapear todas as tabelas do banco mesas_rpg nos dois ambientes e entender onde a nova seção de hidratação se encaixa no painel admin existente (Frontend e Backend).

**Vínculos:**
- **Anterior:** -
- **Próxima:** sessoes/26-04-24_2_hidratacao-plan.md (se aplicável)

**Plano de execução:**
1. [x] Conectar via SSH à VM e listar tabelas de mesas-db (prod) e mesas-beta-db (dev).
2. [x] Identificar campos e PII (emails, tokens, deletehashes, sessões).
3. [x] Identificar FKs e dependências.
4. [x] Analisar frontend (`GestaoPage.tsx`) para ponto de encaixe visual e lógica de requests.
5. [x] Analisar backend (`adminTables.ts`, `server.ts`) para padrão de rotas admin.
6. [x] Anotar os resultados detalhados nesta sessão.
7. [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status` (Executado, status e next step reportados)

**Arquivos modificados:**
- sessoes/26-04-24_1_hidratacao-diagnostico.md (Apenas este, por ser uma sessão de leitura/auditoria).

**Critério de conclusão:**
- Lista completa anotada na sessão com PII marcados, FKs, diferenças estruturais e ponto de encaixe Frontend e Backend. Sessão atualizada e aguardando autorização.

---
## Execução e Diagnóstico

### 1. Ponto de Encaixe — Frontend
- **Arquivo Alvo:** `frontend/src/pages/GestaoPage.tsx`
- **Estrutura Existente:** Controle via estado local `activeTab` (`'systems' | 'crud' | 'activity'`) e renderização condicional.
- **Encaixe da Nova Seção:** 
  - Adicionar `'hydration'` ao tipo de `activeTab`.
  - Criar um novo botão de aba no menu superior: `<button onClick={() => setActiveTab('hydration')}>Hidratação</button>`.
  - Adicionar o bloco condicional: `{activeTab === 'hydration' && <HydrationAdminPanel />}`.
- **Padrão de API Local:** Chamadas utilizam a fetch API nativa no padrão `await fetch(\`\${API_BASE}/api/v1/admin/hydration/sync\`, { method: 'POST', credentials: 'include', ... })`.

### 2. Ponto de Encaixe — Backend
- **Arquivos Alvos:** `backend/src/routes/adminHydration.ts` (a criar) e `backend/src/server.ts`
- **Padrão de Rota:** Os arquivos admin (como `adminTables.ts`) utilizam o padrão `Router()` e são registrados em `server.ts` como `app.use('/api/v1/admin', adminRoutes)`.
- **Encaixe da Nova Rota:**
  - Criar `backend/src/routes/adminHydration.ts` contendo as rotas `router.post('/hydration/sync', authMiddleware, ...)` e `router.get('/hydration/status', authMiddleware, ...)`.
  - O middleware de autenticação (`authMiddleware`) deve ser injetado, seguido pela verificação manual da rule: `if (req.user.role !== 'admin') return res.status(403)...`.
  - Registrar em `server.ts` com `app.use('/api/v1/admin', adminHydrationRoutes);`.

### 3. Diferenças de Estrutura de Banco (Prod vs Dev)
Foram identificadas divergências de schema entre Prod (`mesas-db`) e Dev (`mesas-beta-db`). O ambiente Prod possui 13 colunas a mais (453 vs 440) referentes à integração com Imgur e logs de cleanup.

**Tabela exclusiva de Prod:**
- `imgur_cleanup_log` (attempted_at, entity_id, entity_type, error_detail, id, imgur_id, status)

**Colunas exclusivas de Prod:**
- Em `gm_profiles`: `avatar_deletehash`, `avatar_imgur_id`, `banner_deletehash`, `banner_imgur_id`
- Em `tables`: `cover_deletehash`, `cover_imgur_id`

### 4. Mapeamento de PII (Personally Identifiable Information)
Campos de dados sensíveis que precisarão de ofuscação/anonimização durante a hidratação:
- `users`: `email`, `google_id`, `refresh_token`, `username`, `location`
- `auth_providers`: `provider_user_id`, `provider_data`
- `gm_profiles`: `discord_id`, `discord_username`, `contact_methods`, `avatar_deletehash`, `banner_deletehash`
- `tables`: `cover_deletehash`
- `table_contacts`: `discord_server_url`, `value`
- `profiles`: `display_name`, `avatar_url`

### 5. Grafo de Dependências (Foreign Keys) e Topologia de Hidratação
A sincronização deverá respeitar a hierarquia para não quebrar Constraints:
- Nível 0 (Dicionários Base): `systems`, `scenarios`, `platforms`, `tags`, `vtt_platforms`, `communication_platforms`, `sources`
- Nível 1: `users`
- Nível 2: `auth_providers`, `profiles`, `gm_profiles`, `player_profiles`, `user_preferences`, `user_links`, `user_systems`
- Nível 3: `tables`
- Nível 4+: `bookmarks`, `imported_tables`, `questions`, `answers`, `reviews`, `table_history`, `table_interests`, `table_contacts`, `table_schedules`, `table_tags`, `table_metrics`, `activity_log`, `notifications`

**Ação Pendente:** Todos os itens da checklist estão concluidos ( ZERO resultados pendentes para o padrão da tarefa e nenhum arquivo parcialmente modificado). Operação concluída. Aguardo autorização para avançar para a próxima etapa.
