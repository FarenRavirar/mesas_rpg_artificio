# Auditoria Técnica — Sistemas, Edições, Variantes e Cenários

> Documento orientado à implementação. Cada problema: ID, severidade, evidência (arquivo:linha), full-stack fix (DB → backend → frontend), resultado esperado. Nenhum trecho é hipotético — tudo está ancorado nos arquivos enviados.

# 0. Suplemento
Temos como suplemento o arquivo `sistemas_auditoria_codex.md`


---

## 1. Método

Base: **ISO 9241 Dialogue Principles** (adequação à tarefa, autodescrição, controlabilidade, tolerância a erros). Reforço: **Nielsen** (visibilidade de estado, prevenção de erro, feedback) e **Shneiderman** (reversibilidade, consistência, redução de carga de memória). Sem Weinschenk/Barker/Rams.

## 2. Mapa de Arquivos Recebidos

| Arquivo | Camada | Função |
|---|---|---|
| `server.ts` | backend bootstrap | Registro de rotas |
| `routes/systems.ts` | backend route | GET público + CRUD admin |
| `routes/scenarios.ts` | backend route | GET público + CRUD admin |
| `routes/systemSuggestions.ts` | backend route | POST sugestão + GET /mine |
| `routes/systemSuggestionsAdmin.ts` | backend route | Approve/reject |
| `routes/scenarioSuggestions.ts` | backend route | POST sugestão + GET /mine |
| `routes/tables.ts` | backend route | FK `system_id`/`scenario_id` (contexto) |
| `scripts/importSistemas.ts` | backend script | Import `sistemas.json` |
| `scripts/systemsTreeImport.ts` | backend script | Import por markdown |
| `scripts/importCenarios.ts` | backend script | Import `cenarios.json` |
| `frontend/src/types/systems.ts` | frontend types | `SystemTreeNode`, `SystemNodeType` |
| `frontend/src/features/admin/types.ts` | frontend types | Tipos do painel admin |
| `frontend/src/pages/GestaoPage.tsx` | frontend page | Painel admin |
| `frontend/src/hooks/useSystems.ts` | frontend hook | Catálogo + delete |
| `frontend/src/components/SystemSuggestionModal.tsx` | frontend component | Modal sugestão |
| `frontend/src/components/ScenarioSuggestionModal.tsx` | frontend component | Modal sugestão |
| Migrations 02, 06, 11, 12, 102, 103 | DB | Schema |
| `MAPA_DE_API.md` | doc | Contrato canônico |

**Lacunas toleráveis (não bloqueiam):**
- `backend/src/db/types.ts` (Kysely): assumo que `name_pt` está mapeado nas tabelas `systems` e `scenarios` conforme M102. Se não estiver, `tsc` acusa.
- Conteúdo completo do `GestaoPage.tsx`: auditoria usa pontos citados no `MAPA_DE_API.md` (subaba Sugestões, subaba Plataformas, consumo de `/systems` e `/scenarios`).

---

## 2.1. Fase 0 — Refatoração UX Admin (Pré-requisito Bloqueante)

**Status:** 🟡 EM ANDAMENTO (18/04/2026)  
**Sessão:** `26-04-18_1_auditoria-sistemas-etapa-1.md`

Durante a validação de tipos TypeScript para a Fase 1, foi identificado que a interface admin atual é **infuncional** para gestão hierárquica de sistemas. A UX baseada em lista plana + modal genérico impossibilita:
- Visualizar contexto hierárquico ao criar/editar
- Entender onde um novo item será posicionado
- Navegar eficientemente em árvores com 50+ nós

**Decisão:** Implementar padrão BigTech (split-view 3 colunas: navegação | workspace | inspector) como pré-requisito para validar correções da Fase 1.

### Progresso da Fase 0

- [x] **Bloco 1 — Fundação de Contadores (Backend)** ✅ 18/04 07:00 BRT
  - Adicionado 3 left joins em `GET /api/v1/systems` (children, tables, system_aliases)
  - Contadores agregados: `children_count`, `tables_count`, `aliases_count`
  - Tipos backend (`SystemRecord`) e frontend (`System`) atualizados
  - `MAPA_DE_API.md` documentado com novos campos
- [x] **Bloco 2 — AdminWorkspaceLayout (Frontend)** ✅ 18/04 07:00 BRT
  - Componente de layout 3 colunas criado
  - Workspace (flex-1) + Inspector lateral (400px)
  - Responsivo (drawer < 1280px, fullscreen < 768px)
- [x] **Bloco 3 — CatalogTree + Nodes (Frontend)** ✅ 18/04 07:07 BRT
  - 4 componentes criados: `CatalogTree`, `CatalogTreeNode`, `NodeTypeBadge`, `EntityCounters`
  - Árvore interativa com expand/collapse e keyboard navigation
  - Filtros por busca e tipo, auto-expand de ancestrais
  - Contadores visíveis (Nm·Nf·Na), botão "+" no hover
- [x] **Bloco 4 — EntityInspector (Frontend)** ✅ 18/04 07:20 BRT
  - 4 componentes criados: `EntityInspector`, `AliasesEditor`, `Breadcrumb`, `Field`
  - Edição inline no painel lateral (substitui modal)
  - Breadcrumb de contexto, slug preview, validação de tipos
  - Dirty state tracking, editor de aliases, contador de mesas
- [x] **Bloco 5 — Toolbar + Integração (Frontend)** ✅ 18/04 07:24 BRT
  - `CatalogToolbar` criado (busca + filtros + botão criar)
  - Hook `useSystems` expandido: fetchTree, createSystem, updateSystem, selectedId
  - Helpers: findInTree, countVisibleInTree
- [x] **Bloco 6 — Cenários (Frontend)** ✅ 18/04 07:27 BRT
  - `ScenariosList` criado (lista vertical sem hierarquia)
  - Reaproveitamento do EntityInspector para cenários
  - Busca por nome, name_pt e aliases

**Estimativa:** 20h (2,5 dias) — Progresso: 6/6 blocos (100%) ✅ **FASE 0 COMPLETA**

### 2.2 Fase 0.1 — Integração no GestaoPage

**Status:** ✅ COMPLETA — 3/3 passos finalizados em 18/04/2026 07:50 BRT  
**Objetivo:** Integrar componentes da Fase 0 no GestaoPage para ativar UX BigTech

- [x] **Passo 1 — Integrar Sistemas** ✅ 18/04 07:40 BRT
  - Criado `SystemsAdminView.tsx` (componente integrador)
  - Substituído `<SystemsPage />` por `<SystemsAdminView />`
  - Conectados: AdminWorkspaceLayout, CatalogTree, CatalogToolbar, EntityInspector
  - TypeScript compila sem erros
- [x] **Passo 2 — Integrar Cenários** ✅ 18/04 07:45 BRT
  - Criado `ScenariosAdminView.tsx` (componente integrador)
  - Substituída renderização inline (49 linhas) por `<ScenariosAdminView />`
  - Removidos imports, estados e funções não utilizadas
  - TypeScript compila sem erros
- [x] **Passo 3 — Validação Final** ✅ 18/04 07:50 BRT
  - Sub-tabs Plataformas, Mesas e Sugestões verificadas (análise estática)
  - Sem regressões identificadas
  - TypeScript compila sem erros

**Estimativa:** 4h — Progresso: 3/3 passos (100%) ✅ **FASE 0.1 COMPLETA**

---

## 3. Matriz de Achados

| ID | Sev | Evidência | Impacto | Correção | Status |
|---|---|---|---|---|---|
| **A01** | CRÍTICO | `migration_02.sql:39-47` vs `migration_11.sql:56-58` | Duas CHECK sobre `systems.node_type` com valores diferentes. M02 aceita `subsystem`, M11 recusa. Schema final depende da ordem de execução. `systemsTreeImport.ts:96` pode gerar `subsystem` → INSERT quebra silenciosamente dentro da transação. | Migration `104_unify_node_type_check.sql`: `DROP CONSTRAINT IF EXISTS systems_node_type_check; DROP CONSTRAINT IF EXISTS check_node_type; ADD CONSTRAINT com IN ('system','edition','variant','subsystem')`. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Migration 104 aplicada no beta. |
| **A02** | CRÍTICO | `systemSuggestions.ts:50` insere em campo `node_type`; `migration_06.sql:9` criou coluna `suggestion_type` com CHECK `('new','edit','variant')` | POST de sugestão falha para qualquer tipo que não seja `variant` OU o banco foi alterado manualmente sem registro de migration. Não é possível saber sem consultar `pg_constraint` direto. | Migration `105_system_suggestions_align.sql`: `RENAME COLUMN suggestion_type TO node_type` (se ainda existir), `DROP CONSTRAINT antigo`, `ADD CONSTRAINT IN ('system','edition','variant','subsystem')`, `ADD COLUMN IF NOT EXISTS rejection_reason TEXT`. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Migration 105 aplicada no beta. |
| **A03** | CRÍTICO | `systemSuggestionsAdmin.ts:33-54` | Handler de `approve` só faz UPDATE do status. **Não cria** o sistema em `systems`. Fluxo de curadoria comunitária é cosmético. | Reescrever em transação com INSERT em `systems`, cópia de aliases, UPDATE status, INSERT em `notifications`. Código pronto na Seção 6. **Decisão:** Resposta de approve muda de `{ success: true }` para `{ success: true, data: { suggestion_id, system_id, path_slug } }`. Frontend `GestaoPage.tsx` (linhas 118-143) precisa patch com fallback retrocompatível. Reject mantém `{ success: true }` (nada materializado). | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). `systemSuggestionsAdmin.ts` reescrito com materialização completa. |
| **A04** | CRÍTICO | `server.ts:108-120` não registra rota admin para cenários; arquivo `scenarioSuggestionsAdmin.ts` não existe | Sugestões de cenário nunca viram entidade. Subaba \"Sugestões\" no `GestaoPage.tsx` fica sem ação de aprovar para cenário. | Criar `routes/scenarioSuggestionsAdmin.ts` espelhando systems. Registrar no `server.ts`. Código pronto na Seção 6. **Decisão:** Approve materializa em `scenarios` (name, name_pt, slug, subgenres) + notificação com `suggestion_kind: 'scenario'`. Resposta: `{ success: true, data: { suggestion_id, scenario_id, slug } }`. Reject: `{ success: true }`. Cenários são flat (sem depth/path_slug/parent_id). | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). `scenarioSuggestionsAdmin.ts` criado e registrado. |
| **A05** | CRÍTICO | `systems.ts:96-140` | Dois SELECT full-table + Map em memória + build recursivo em JS a cada chamada. `MAPA_DE_API.md` confirma 7 consumidores simultâneos (`SystemEditModal`, `UserSystemsSelector`, `CreateTableForm`, `SystemsPage`, `SystemsTree`, `useSystems`, `CatalogoPage`). Cada um refaz a query toda. | Paginação cursor-based em `view=flat`; `max_depth` parametrizado em `view=tree`; endpoint `/systems/:id/children`; ETag via `MAX(updated_at)`. **Decisão:** `view=tree` NUNCA pagina (cursor/limit ignorados com warning em log) - paginar árvore quebra montagem. Request sem cursor/limit retorna TODOS os registros (retrocompatibilidade). Response sempre inclui envelope `pagination: { next_cursor, has_more }`. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Paginação cursor-based implementada em `systems.ts` e `scenarios.ts`. |
| **A06** | CRÍTICO | `useSystems.ts:8` (`System` importado de `./types`) + `useSystems.ts:63` (filter só em `name` e `slug`) | Tipo `System` não declara `name_pt` nem `aliases`. Busca do hook ignora aliases. Usuário digita \"D&D\" e não encontra \"Dungeons & Dragons\" porque alias não está no fetch local. | Atualizar `frontend/src/modules/admin/systems/types.ts` com `name_pt`, `aliases`, `path_slug`, `depth`, `node_type`, `parent_id`, `has_children`. Expandir filtro local em `frontend/src/modules/admin/systems/useSystems.ts` para cobrir aliases e `name_pt`. **Decisão:** Frontend mantém comportamento atual (carregar todos os registros). Backend garante retrocompatibilidade (request sem cursor retorna tudo + envelope pagination). | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Tipos frontend atualizados, busca expandida implementada. |
| **A07** | ALTO | `scenarios.ts:34-55` | Busca por texto carrega tudo e filtra em JS. Índice GIN `idx_scenarios_name_gin` (M12:27) é **ignorado**. | Trocar por `WHERE to_tsvector('portuguese', name) @@ plainto_tsquery('portuguese', ${search})`. | |
| **A08** | ALTO | `systems.ts:230-308` (PUT admin) linha 300 `// TODO: Recalcular hierarquia` | Admin move sistema de pai; descendentes ficam com `depth`/`path_slug` obsoletos. Queries hierárquicas retornam sub-árvore truncada. | Extrair `reparentSystem()` com `WITH RECURSIVE` em transação. | |
| **A09** | ALTO | `scenarios` sem FK para `systems`. `tables.scenario_id` solto. `MAPA_DE_API.md` não expõe relação scenarios↔systems | Impossível responder \"quais cenários existem para D&D\". API pública não consegue expor navegação canônica. | Decisão de produto: N:N via `scenario_systems(scenario_id, system_id)` ou \"cenário global com `default_system_id`\". Recomendo N:N (seção 7). | |
| **A10** | ALTO | `systemSuggestionsAdmin.ts:36-54, 67-95` | Approve e reject não criam `notifications`. Usuário sugeriu, esperou, nunca recebe aviso. | INSERT em `notifications` no mesmo transaction block. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Notificações implementadas em ambas as rotas admin. |
| **A10.1** | ALTO | `notifications` (M06) sem `action_url` nem `metadata` | Notificação sem caminho de ação é dead-end operacional. Usuário lê, fecha, nunca volta. `metadata` JSONB ausente força parsing de string para consumers futuros. | Migration `106_notifications_action_metadata.sql`: `ADD COLUMN action_url TEXT`, `ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'`, `CREATE INDEX idx_notifications_metadata_gin USING gin(metadata)`. Textos: aprovação com `action_url: /catalogo?system=[path_slug]`, rejeição com `action_url: /perfil/minhas-sugestoes/[id]`, `metadata.suggestion_kind` para filtro futuro. **Decisão:** Opção A (migration) escolhida por eliminar dead-end, evitar parsing, alinhar com `user_links`/`gm_profiles` JSONB. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Migration 106 aplicada no beta. |
| **A10.2** | ALTO | Aliases, description e subgenres não copiados ao aprovar sugestões | Usuário sugere \"Forgotten Realms\" (Reinos Esquecidos) com alias \"FR\" e subgêneros [\"Alta Fantasia\", \"Fantasia Medieval\"], mas ao aprovar esses dados são perdidos. `SystemsTable` usa tabela separada `system_aliases`, `ScenariosTable` não tem `description` nem tabela de aliases. | Migration `107_scenarios_aliases_fields.sql`: `ADD scenarios.description TEXT`, `ADD scenario_suggestions.subgenres TEXT[]`, `CREATE TABLE scenario_aliases`. Lógica de approve: copiar aliases para `system_aliases`/`scenario_aliases`, copiar description e subgenres. **Decisão:** Todos os campos são necessários para preservar informação completa das sugestões. | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026). Migration 107 aplicada no beta, lógica de cópia implementada. |
| **A11** | ALTO | `systems.ts:175-177, 256-258` usam `slug` raso para verificar colisão | \"5e\" debaixo de D&D colide com \"5e\" de Pathfinder. | Unicidade por `path_slug`. Slug raso fica não-único. | |
| **A12** | ALTO | `SystemSuggestionModal.tsx:116` envia `suggestion_type`; `systemSuggestions.ts:23` lê `suggestion_type`; schema espera `node_type` | Três nomes para a mesma coisa. Qualquer refactor silencia bug. | Padronizar request body como `node_type` em toda cadeia. Aceitar `suggestion_type` como alias deprecado com warning. | |
| **A13** | ALTO | `systems.ts:99-100` — `select` do GET público inclui `name_pt` ✅; `MAPA_DE_API.md` seção SYSTEMS não documenta campos retornados | Integradores externos não sabem da existência. Frontend internos confiam em \"vem quando vem\". | Documentar em `MAPA_DE_API.md` os campos de retorno de `GET /systems` e `GET /scenarios`. | |
| **A14** | ALTO | `systemSuggestions.ts:58` usa `.returningAll()` | Campos administrativos futuros (`admin_notes`, `rejection_reason`) vazam para o usuário sugerinte. | Listar campos explicitamente: `['id','name','name_pt','description','parent_id','node_type','status','created_at']`. | |
| **A15** | MÉDIO | `server.ts:114-115` ordem dos `app.use('/api/v1/gm', ...)` | `gmPanelRoutes` antes de `gmRoutes`. Patterns de `:slug` podem ser interceptados. Hoje não ocorre, mas é fonte de bug futuro. | Mover rotas autenticadas para prefixo distinto (`/api/v1/gm-panel`) ou garantir que `gmRoutes` públicas venham primeiro. | |

| **A16** | MÉDIO | `importSistemas.ts:64` + `systemsTreeImport.ts:221` — dois scripts concorrentes geram slugs incompatíveis | Rodar ambos no mesmo banco cria registros duplicados com slugs distintos para o mesmo sistema conceitual. | Escolher uma fonte canônica (recomendo `systemsTreeImport.ts` por preservar hierarquia no markdown). Deprecar o outro, marcar no README. |
| **A17** | MÉDIO | `scenarios.ts:159-162` bloqueia delete se houver mesa vinculada | Correto. Mas não retorna **quais** mesas. Admin precisa caçar manualmente. | `blocked_by: { tables: [{id, slug, title}...], limit: 10 }`. |
| **A18** | MÉDIO | `useSystems.ts:60-67` — busca local ignora aliases | Modal admin ao buscar "D&D" não acha "Dungeons & Dragons". | Estender filter para incluir `aliases` e `name_pt`. |
| **A19** | MÉDIO | `scenarios.ts:26-54` — paginação inexistente | `GET /scenarios` consumido por `ScenarioSelector`, `CreateTableForm`, `GestaoPage`, `ScenarioEditModal` (MAPA:196). Sem paginação, todos pagam custo full-table. | Cursor-based igual systems. |
| **A20** | BAIXO | `importSistemas.ts:19`, `scenarios.ts:19` — `slugify` não transliteração asiática/árabe | Nomes com caracteres fora do Latin-1 geram slug vazio. Baixa frequência, mas cria registros órfãos. | Lib `slugify` npm com `strict: true`. |

---

## 4. Inconsistências de Contrato

| A | Campo | B | Campo | Divergência | Impacto |
|---|---|---|---|---|---|
| DB M06 | `suggestion_type VARCHAR CHECK ('new','edit','variant')` | Backend `systemSuggestions.ts:23` | `suggestion_type IN ('system','edition','variant','subsystem')` | CHECK original incompatível com código atual | Insert silenciosamente quebrado ou schema alterado fora do versionamento |
| DB M06 | `suggestion_type` | Backend `systemSuggestions.ts:50` | INSERT em `node_type` | Nome divergente | Insert quebra ou coluna renomeada manualmente |
| DB M02 | `CHECK ('system','edition','variant','subsystem')` | DB M11 | `CHECK ('system','edition','variant')` | Conflito direto | Ambiente depende da última migration executada |
| Backend `systems.ts:99` | Retorna `name_pt` | Frontend `systems.ts` types | `SystemTreeNode.name_pt` ok | Consistente aqui | — |
| Backend `systems.ts:99` | Retorna array ordenado | Frontend `useSystems.ts:9` | Tipo `System` de `./types` **não vi** | Pode faltar `name_pt/aliases` | Busca quebrada, UI sem tradução |
| DB `scenarios` | sem relação com `systems` | Backend `tables.scenario_id` | FK solta | Domínio sem navegação | Impossível listar cenários de um sistema |
| DB `scenario_suggestions` (M103) | `rejection_reason TEXT` | DB `system_suggestions` (M06) | sem `rejection_reason` | Schemas gêmeos divergentes | Handler admin precisa duplicar lógica |
| Backend approve/reject | UPDATE status | Expectativa do domínio | "aprovado = no catálogo" | Materialização ausente | Fluxo cosmético |
| Frontend `SystemSuggestionModal.tsx:116` | envia `suggestion_type` | Backend lê `suggestion_type`, persiste em `node_type` | 3 nomes para 1 coisa | Refactor perigoso |

---

## 5. Diagnóstico Por Problema (ISO 9241 / Nielsen / Shneiderman)

### PROB-01 — Aprovação cosmética (A03)

**Problema:** aprovar sugestão não cria entidade.
**Evidência:** `systemSuggestionsAdmin.ts:33-54`.
**Impacto operacional:** admin aprova, nada muda no catálogo público. Usuário em `/mine` vê `approved` mas o sistema sugerido não aparece em `GET /systems`.
**Princípio violado:** ISO 9241 — **conformidade com expectativas**. Nielsen — **visibilidade do estado**.
**Origem frontend:** painel consome `PATCH /approve`, recebe 200, considera feito.
**Origem backend:** handler apenas atualiza status.
**Correção:** transação atômica com INSERT + notificação (código na Seção 6).

### PROB-02 — Duas migrations conflitantes em `node_type` (A01)

**Problema:** M02 e M11 criam CHECK incompatíveis.
**Evidência:** `migration_02_system_taxonomy_and_ddal.sql:39-47` vs `migration_11_sistemas_json.sql:56-58`.
**Impacto operacional:** `systemsTreeImport.ts:96` pode gerar `subsystem` → INSERT falha em transação, rollback silencioso do script. Catálogo fica incompleto sem erro óbvio.
**Princípio violado:** ISO 9241 — **confiabilidade**.
**Origem backend:** migrations acumuladas sem linearização.
**Correção:** M104 unificando CHECK.

### PROB-03 — Contrato de sugestão triplamente divergente (A02, A12)

**Problema:** campo se chama `suggestion_type` no frontend, `suggestion_type` no request, `node_type` no INSERT. Schema original (M06) chamava `suggestion_type` com valores diferentes. M103 só adicionou `name_pt`, não tocou no campo.
**Evidência:** `SystemSuggestionModal.tsx:116`, `systemSuggestions.ts:23,50`, `migration_06.sql:9`.
**Impacto operacional:** impossível auditar o que realmente está no banco sem query direta. Refactor de tipos quebra silenciosamente.
**Princípio violado:** Nielsen — **consistência e padrões**.
**Correção:** M105 alinha schema. Código backend padroniza em `node_type`. Frontend passa a enviar `node_type`.

### PROB-04 — Listagem sem paginação (A05)

**Problema:** `GET /systems` carrega tudo, monta árvore em JS.
**Evidência:** `systems.ts:96-140`.
**Impacto operacional:** 7 consumidores simultâneos (MAPA linhas 119-122). Modal `SystemSuggestionModal.tsx:77` refaz a cada abertura. CatalogoPage chama no load. Banda e CPU desperdiçadas.
**Princípio violado:** ISO 9241 — **adequação à tarefa**. Shneiderman — **eficiência**.
**Correção:** `?cursor=&limit=` em flat; `?max_depth=` em tree; `/systems/:id/children` para drill-down; ETag.

### PROB-05 — Reparent não atualiza descendentes (A08)

**Problema:** PUT admin permite mudar `parent_id` sem recomputar subtree.
**Evidência:** `systems.ts:300` (TODO explícito).
**Impacto operacional:** árvore fica com descendentes órfãos. Filtros hierárquicos quebram.
**Princípio violado:** ISO 9241 — **tolerância a erros**.
**Correção:** service `reparentSystem()` com `WITH RECURSIVE`, validação de não-circularidade, transação.

### PROB-06 — Sem rota admin de cenários (A04)

**Problema:** cenários têm POST de sugestão, não têm approve/reject.
**Evidência:** ausência de registro em `server.ts`; arquivo inexistente.
**Impacto operacional:** `GestaoPage.tsx` subaba Sugestões, ao filtrar por cenários, não tem ação disponível OU quebra com 404.
**Princípio violado:** ISO 9241 — **controlabilidade**.
**Correção:** criar rota espelhada de systems.

### PROB-07 — Busca em cenários ignora índice GIN (A07)

**Problema:** `GET /scenarios?search=X` filtra em JS.
**Evidência:** `scenarios.ts:34-53`.
**Impacto operacional:** CPU backend queima, latência cresce com tabela.
**Princípio violado:** ISO 9241 — **adequação à tarefa** (sistema precisa usar os recursos que tem).
**Correção:** query SQL com `to_tsvector/plainto_tsquery`.

### PROB-08 — Busca no hook admin ignora aliases e `name_pt` (A06, A18)

**Problema:** `useSystems.ts:60-67` filtra só `name` e `slug`.
**Evidência:** linhas citadas.
**Impacto operacional:** admin digita "D&D" e não encontra "Dungeons & Dragons". Digita "Vampiro" e não acha "Vampire: The Masquerade" (alias `name_pt`).
**Princípio violado:** ISO 9241 — **conformidade com expectativas**. Shneiderman — **redução de carga de memória**.
**Correção:** expandir filtro para `aliases` e `name_pt`; idealmente delegar ao backend via `?search=X` que já existe.

### PROB-09 — UI de inserção sem separação clara por tipo (derivado de A12)

**Problema:** `SystemSuggestionModal.tsx:170` usa `<select>` único para tipo de sugestão. Usuário leigo não sabe distinguir "edition" de "variant".
**Evidência:** `SystemSuggestionModal.tsx:164-180`.
**Impacto operacional:** sugestões chegam com tipo errado. Admin gasta tempo corrigindo. Usuário frustrado porque não entende o vocabulário.
**Princípio violado:** ISO 9241 — **autodescrição** e **adequação à tarefa**. Nielsen — **reconhecimento em vez de recall**.
**Correção:** substituir `<select>` por 3 cards clicáveis:
- "Novo sistema" (primeiro do tipo, ex: "RuneQuest")
- "Nova edição de sistema existente" (ex: "D&D 5e 2024")
- "Nova variante de edição" (ex: "D&D 5e 2024 PT-BR")
Cada card com descrição breve e exemplo concreto.

### PROB-10 — Aliases não notificados no fluxo de sugestão

**Problema:** usuário não pode sugerir aliases junto com sistema novo. `systemSuggestions.ts:45-57` só aceita `name, name_pt, description, parent_id, node_type`.
**Impacto operacional:** sistema aprovado entra sem aliases. Admin precisa editar depois. Dois passos em vez de um.
**Princípio violado:** Shneiderman — **eficiência**.
**Correção:** adicionar campo `aliases: string[]` opcional no POST. Persistir como `system_suggestion_aliases` (nova tabela) OU em `description` como texto estruturado. Recomendo tabela separada (Seção 7.h).

### PROB-11 — Notificações ausentes (A10)

**Problema:** approve/reject não cria notificação.
**Evidência:** `systemSuggestionsAdmin.ts:33-95`.
**Impacto operacional:** usuário sugere, espera indefinidamente. Se aprovar, usuário não sabe que o sistema já está no catálogo. Se rejeitar, não sabe o motivo.
**Princípio violado:** Nielsen — **feedback informativo**. ISO 9241 — **autodescrição**.
**Correção:** INSERT em `notifications` em cada transação.

### PROB-12 — Exibir bloqueadores de delete (A17)

**Problema:** delete bloqueado por mesas ou filhos só retorna contagem.
**Evidência:** `systems.ts:353-379`, `scenarios.ts:157-170`.
**Impacto operacional:** admin não sabe **o que** precisa desvincular.
**Princípio violado:** Nielsen — **ajudar usuários a reconhecer e recuperar erros**.
**Correção:** retornar lista limitada de bloqueadores com dados navegáveis.

---

## 6. Código de Correção Pronto

### 6.1 Migration `104_unify_node_type_check.sql`

```sql
-- Unifica CHECK em systems.node_type (conflito M02 vs M11)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'systems_node_type_check') THEN
    ALTER TABLE systems DROP CONSTRAINT systems_node_type_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_node_type') THEN
    ALTER TABLE systems DROP CONSTRAINT check_node_type;
  END IF;
END $$;

ALTER TABLE systems
  ADD CONSTRAINT systems_node_type_check
  CHECK (node_type IN ('system', 'edition', 'variant', 'subsystem'));
```

### 6.2 Migration `105_system_suggestions_align.sql`

```sql
-- Alinha system_suggestions ao contrato real do código (node_type + rejection_reason)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_suggestions' AND column_name = 'suggestion_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_suggestions' AND column_name = 'node_type'
  ) THEN
    ALTER TABLE system_suggestions RENAME COLUMN suggestion_type TO node_type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_suggestions_suggestion_type_check') THEN
    ALTER TABLE system_suggestions DROP CONSTRAINT system_suggestions_suggestion_type_check;
  END IF;
END $$;

ALTER TABLE system_suggestions
  ADD CONSTRAINT system_suggestions_node_type_check
  CHECK (node_type IN ('system','edition','variant','subsystem'));

ALTER TABLE system_suggestions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

### 6.3 `routes/systemSuggestionsAdmin.ts` — handler `approve` reescrito

```ts
import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { db } from '../db';
import { sql } from 'kysely';

const router = Router();
router.use(authMiddleware, requireRole('admin'));

const slugify = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

router.get('/system-suggestions', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let q = db.selectFrom('system_suggestions').selectAll().orderBy('created_at', 'desc');
    if (status && typeof status === 'string') q = q.where('status', '=', status as any);
    const suggestions = await q.execute();
    return res.json({ data: suggestions });
  } catch (error: any) {
    console.error('[GET /admin/system-suggestions]', error);
    return res.status(500).json({ error: 'Erro ao listar sugestões.' });
  }
});

router.patch('/system-suggestions/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user!.userId;

  try {
    const result = await db.transaction().execute(async (trx) => {
      const sug = await trx
        .selectFrom('system_suggestions').selectAll()
        .where('id', '=', id).where('status', '=', 'pending')
        .executeTakeFirst();

      if (!sug) throw new Error('NOT_FOUND_OR_REVIEWED');

      let depth = 0;
      let parentPath: string | null = null;
      if (sug.parent_id) {
        const parent = await trx.selectFrom('systems')
          .select(['id', 'depth', 'path_slug'])
          .where('id', '=', sug.parent_id).executeTakeFirst();
        if (!parent) throw new Error('PARENT_NOT_FOUND');
        depth = parent.depth + 1;
        parentPath = parent.path_slug;
      }

      const segment = slugify(sug.name);
      const pathSlug = parentPath ? `${parentPath}/${segment}` : segment;
      const globalSlug = pathSlug.replace(/\//g, '--');

      const conflict = await trx.selectFrom('systems')
        .select('id').where('path_slug', '=', pathSlug).executeTakeFirst();
      if (conflict) throw new Error('PATH_SLUG_CONFLICT');

      const [created] = await trx.insertInto('systems').values({
        name: sug.name,
        name_pt: sug.name_pt,
        slug: globalSlug,
        path_slug: pathSlug,
        parent_id: sug.parent_id,
        node_type: sug.node_type as any,
        depth,
        description: sug.description,
      }).returning(['id']).execute();

      await trx.updateTable('system_suggestions').set({
        status: 'approved',
        reviewed_at: new Date(),
        reviewed_by: adminId,
      }).where('id', '=', id).execute();

      await trx.insertInto('notifications').values({
        user_id: sug.user_id,
        type: 'suggestion_approved',
        title: 'Sua sugestão foi aprovada',
        message: `O sistema "${sug.name}" foi adicionado ao catálogo.`,
        read: false,
      }).execute();

      return { systemId: created.id, pathSlug };
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    const code = err.message;
    if (code === 'NOT_FOUND_OR_REVIEWED')
      return res.status(404).json({ error: 'Sugestão não encontrada ou já revisada.' });
    if (code === 'PARENT_NOT_FOUND')
      return res.status(404).json({ error: 'Sistema pai não existe mais.' });
    if (code === 'PATH_SLUG_CONFLICT')
      return res.status(409).json({ error: 'Já existe um sistema com este caminho no catálogo.' });
    console.error('[PATCH /approve]', err);
    return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
  }
});

router.patch('/system-suggestions/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user!.userId;

  if (!reason?.trim()) return res.status(400).json({ error: 'Motivo obrigatório.' });

  try {
    const result = await db.transaction().execute(async (trx) => {
      const sug = await trx.selectFrom('system_suggestions')
        .select(['user_id', 'name'])
        .where('id', '=', id).where('status', '=', 'pending')
        .executeTakeFirst();

      if (!sug) throw new Error('NOT_FOUND');

      await trx.updateTable('system_suggestions').set({
        status: 'rejected',
        rejection_reason: reason.trim(),
        reviewed_at: new Date(),
        reviewed_by: adminId,
      }).where('id', '=', id).execute();

      await trx.insertInto('notifications').values({
        user_id: sug.user_id,
        type: 'suggestion_rejected',
        title: 'Sua sugestão foi revisada',
        message: `"${sug.name}": ${reason.trim()}`,
        read: false,
      }).execute();

      return true;
    });

    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND')
      return res.status(404).json({ error: 'Sugestão não encontrada ou já revisada.' });
    console.error('[PATCH /reject]', err);
    return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
  }
});

export default router;
```

### 6.4 `routes/scenarioSuggestionsAdmin.ts` — arquivo novo

```ts
import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { db } from '../db';

const router = Router();
router.use(authMiddleware, requireRole('admin'));

const slugify = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

router.get('/scenario-suggestions', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let q = db.selectFrom('scenario_suggestions').selectAll().orderBy('created_at', 'desc');
    if (status && typeof status === 'string') q = q.where('status', '=', status as any);
    return res.json({ data: await q.execute() });
  } catch (error: any) {
    console.error('[GET /admin/scenario-suggestions]', error);
    return res.status(500).json({ error: 'Erro ao listar sugestões.' });
  }
});

router.patch('/scenario-suggestions/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user!.userId;

  try {
    const result = await db.transaction().execute(async (trx) => {
      const sug = await trx.selectFrom('scenario_suggestions').selectAll()
        .where('id', '=', id).where('status', '=', 'pending').executeTakeFirst();
      if (!sug) throw new Error('NOT_FOUND');

      const slug = slugify(sug.name);
      const conflict = await trx.selectFrom('scenarios').select('id')
        .where('slug', '=', slug).executeTakeFirst();
      if (conflict) throw new Error('SLUG_CONFLICT');

      const [created] = await trx.insertInto('scenarios').values({
        name: sug.name, name_pt: sug.name_pt, slug, subgenres: [],
      }).returning(['id']).execute();

      await trx.updateTable('scenario_suggestions').set({
        status: 'approved', reviewed_at: new Date(), reviewed_by: adminId,
      }).where('id', '=', id).execute();

      await trx.insertInto('notifications').values({
        user_id: sug.user_id, type: 'suggestion_approved',
        title: 'Sua sugestão de cenário foi aprovada',
        message: `O cenário "${sug.name}" foi adicionado ao catálogo.`, read: false,
      }).execute();

      return { scenarioId: created.id, slug };
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Sugestão não encontrada ou já revisada.' });
    if (err.message === 'SLUG_CONFLICT') return res.status(409).json({ error: 'Já existe cenário com este slug.' });
    console.error('[scenario approve]', err);
    return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
  }
});

router.patch('/scenario-suggestions/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user!.userId;
  if (!reason?.trim()) return res.status(400).json({ error: 'Motivo obrigatório.' });

  try {
    await db.transaction().execute(async (trx) => {
      const sug = await trx.selectFrom('scenario_suggestions')
        .select(['user_id', 'name'])
        .where('id', '=', id).where('status', '=', 'pending').executeTakeFirst();
      if (!sug) throw new Error('NOT_FOUND');

      await trx.updateTable('scenario_suggestions').set({
        status: 'rejected', rejection_reason: reason.trim(),
        reviewed_at: new Date(), reviewed_by: adminId,
      }).where('id', '=', id).execute();

      await trx.insertInto('notifications').values({
        user_id: sug.user_id, type: 'suggestion_rejected',
        title: 'Sua sugestão foi revisada',
        message: `"${sug.name}": ${reason.trim()}`, read: false,
      }).execute();
    });
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Sugestão não encontrada.' });
    console.error('[scenario reject]', err);
    return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
  }
});

export default router;
```

### 6.5 Registrar no `server.ts`

**Substituir:**
```ts
import systemSuggestionsAdminRoutes from './routes/systemSuggestionsAdmin';
```
**Por:**
```ts
import systemSuggestionsAdminRoutes from './routes/systemSuggestionsAdmin';
import scenarioSuggestionsAdminRoutes from './routes/scenarioSuggestionsAdmin';
```

**Substituir:**
```ts
app.use('/api/v1/admin', systemSuggestionsAdminRoutes);
```
**Por:**
```ts
app.use('/api/v1/admin', systemSuggestionsAdminRoutes);
app.use('/api/v1/admin', scenarioSuggestionsAdminRoutes);
```

### 6.6 `scenarios.ts` — busca com índice GIN

**Substituir linhas 34-55:**
```ts
    if (search.trim().length > 0) {
      const normalizedSearch = normalizeText(search);
      const scenarios = await query.execute() as ScenarioRecord[];
      const filtered = scenarios.filter((scenario) => { /* ... */ });
      return res.json({ data: filtered });
    }
```

**Por:**
```ts
    if (search.trim().length > 0) {
      const term = search.trim();
      const scenarios = await db
        .selectFrom('scenarios')
        .select(['id', 'name', 'name_pt', 'slug', 'subgenres'])
        .where(sql`to_tsvector('portuguese', name || ' ' || COALESCE(name_pt, '')) @@ plainto_tsquery('portuguese', ${term})`)
        .orderBy('name', 'asc')
        .limit(100)
        .execute();
      return res.json({ data: scenarios });
    }
```

(Adicionar `import { sql } from 'kysely'` no topo.)

### 6.7 `systems.ts` — unicidade por `path_slug` + notificação

**Substituir linhas 175-195 (POST admin) — trocar checagem de colisão:**

```ts
    // Calcular depth e path_slug ANTES de checar colisão
    let depth = 0;
    let path_slug = slugify(name);

    if (parent_id) {
      const parent = await db.selectFrom('systems')
        .select(['depth', 'path_slug'])
        .where('id', '=', parent_id).executeTakeFirst();
      if (!parent) return res.status(404).json({ error: 'Sistema pai não encontrado.' });
      depth = parent.depth + 1;
      path_slug = `${parent.path_slug}/${slugify(name)}`;
    }

    // Unicidade por path_slug (evita colisão entre filhos de pais diferentes)
    const existing = await db.selectFrom('systems')
      .select('id').where('path_slug', '=', path_slug).executeTakeFirst();
    if (existing) {
      return res.status(409).json({ error: 'Já existe um sistema com este caminho na hierarquia.' });
    }

    const slug = path_slug.replace(/\//g, '--'); // slug único derivado do path
```

Repetir lógica equivalente no PUT (`systems.ts:256-302`).

### 6.8 `useSystems.ts` — filtro com aliases e `name_pt`

**Substituir linhas 60-67:**
```ts
  const filteredSystems = systems.filter((sys) =>
    searchQuery
      ? sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sys.slug.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );
```

**Por:**
```ts
  const filteredSystems = systems.filter((sys) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sys.name.toLowerCase().includes(q) ||
      (sys.name_pt?.toLowerCase().includes(q) ?? false) ||
      sys.slug.toLowerCase().includes(q) ||
      (sys.path_slug?.toLowerCase().includes(q) ?? false) ||
      (sys.aliases ?? []).some(a => a.toLowerCase().includes(q))
    );
  });
```

Atualizar `frontend/src/features/admin/types.ts` (ou equivalente) para incluir `name_pt`, `path_slug`, `aliases`, `depth`, `node_type`, `parent_id`, `has_children`.

---

## 7. API Pública — Desenho (padrão BigTech)

### 7.a Princípios

- Versionamento em path: `/api/public/v1/`.
- Separação clara entre `public` (sem auth) e `internal` (auth).
- Cursor-based pagination padrão. `limit` máximo 100. Default 50.
- ETag em todas as respostas de coleção.
- Erros seguem RFC 7807 Problem Details.
- Rate limit: 60 req/min anon, 600 req/min autenticado. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### 7.b Endpoints de leitura hierárquica

```
GET /api/public/v1/systems
  Query: ?search= &parent_id= &node_type= &cursor= &limit= &locale=pt-BR
  Resposta 200:
  {
    "data": [{ "id", "name", "name_pt", "slug", "path_slug",
               "node_type", "depth", "parent_id", "aliases": [...],
               "has_children": bool, "children_count": n,
               "updated_at" }, ...],
    "pagination": { "next_cursor": "string|null", "has_more": bool, "total_estimated": n },
    "links": {
      "self": "/api/public/v1/systems?cursor=...",
      "next": "/api/public/v1/systems?cursor=..."
    }
  }
  Headers: ETag, Cache-Control: public, max-age=60

GET /api/public/v1/systems/:path_slug
  Resposta 200: objeto system + ancestors + children + aliases completos

GET /api/public/v1/systems/:path_slug/children
  Drill-down paginado de filhos diretos

GET /api/public/v1/systems/tree?root= &max_depth=2
  Árvore limitada. Default max_depth=2. Máximo 4.

GET /api/public/v1/scenarios
  Query: ?search= &system_id= (após N:N) &cursor= &limit= &locale=
  Resposta 200: lista paginada com systems relacionados embutidos

GET /api/public/v1/scenarios/:slug
  Detalhe com sistemas compatíveis
```

### 7.c Endpoint de hidratação em lote

```
POST /api/public/v1/lookup
Body:
{
  "systems": { "by_id": ["uuid1","uuid2"], "by_path": ["dnd/5e/2024"] },
  "scenarios": { "by_id": ["uuid3"], "by_slug": ["forgotten-realms"] }
}
Resposta 200:
{
  "systems": [...],
  "scenarios": [...],
  "not_found": { "systems": ["uuidX"], "scenarios": [] }
}
Limite: máx 100 IDs totais por request. Rate limit dobrado comparado a GET.
```

Casos de uso: frontend renderizando mesas com múltiplos `system_id` diferentes evita N fetches individuais.

### 7.d Endpoints de sugestão e aprovação

```
POST /api/public/v1/suggestions/systems (auth)
POST /api/public/v1/suggestions/scenarios (auth)
GET  /api/public/v1/suggestions/mine (auth) — retorna ambas

GET   /api/admin/v1/suggestions (auth + admin)
PATCH /api/admin/v1/suggestions/:type/:id/approve
PATCH /api/admin/v1/suggestions/:type/:id/reject
```

Onde `:type ∈ ('system','scenario')`.

### 7.e Contratos mínimos (TypeScript)

```ts
interface SystemResource {
  id: string;
  slug: string;
  path_slug: string;
  name: string;
  name_pt: string | null;
  description: string | null;
  node_type: 'system' | 'edition' | 'variant' | 'subsystem';
  depth: number;
  parent_id: string | null;
  aliases: string[];
  has_children: boolean;
  children_count: number;
  created_at: string; // ISO-8601
  updated_at: string;
}

interface ScenarioResource {
  id: string;
  slug: string;
  name: string;
  name_pt: string | null;
  subgenres: string[];
  compatible_systems: Array<{ id: string; path_slug: string; name: string }>;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  next_cursor: string | null;
  has_more: boolean;
  total_estimated?: number;
}

interface ProblemDetails {
  type: string;      // URI
  title: string;     // short
  status: number;    // HTTP
  detail?: string;
  instance?: string; // request path
  errors?: Array<{ field: string; message: string }>;
}
```

### 7.f Backward compatibility

- Adicionar campo: seguro, sempre compatível.
- Remover campo: exige deprecação 6 meses com header `Deprecation: <sunset-date>` e entrada no `CHANGELOG`.
- Renomear: nunca. Criar novo e deprecar antigo.
- Valor de enum novo: clientes antigos tratam como string literal, não quebra.
- Remover valor de enum: major version bump.

### 7.g Erros (RFC 7807)

```json
HTTP 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://api.artificiorpg.com/errors/path-slug-conflict",
  "title": "Path slug already exists",
  "status": 409,
  "detail": "A system with path dnd/5e/2024 already exists in the catalog.",
  "instance": "/api/admin/v1/suggestions/system/uuid/approve"
}
```

### 7.h Tabela N:N para cenários (A09)

```sql
-- Migration 106
CREATE TABLE IF NOT EXISTS scenario_systems (
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  system_id   UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scenario_id, system_id)
);

CREATE INDEX idx_scenario_systems_system_id ON scenario_systems(system_id);

-- Garante no máximo um default por cenário
CREATE UNIQUE INDEX uq_scenario_default_system
  ON scenario_systems(scenario_id) WHERE is_default = TRUE;
```

### 7.i Exemplo de payload (request/response)

**Request:**
```http
GET /api/public/v1/systems?parent_id=550e8400-e29b-41d4-a716-446655440000&limit=20
Accept: application/json
Accept-Language: pt-BR
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
ETag: "W/\"7a3c8f9e\""
Cache-Control: public, max-age=60
X-RateLimit-Remaining: 59

{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "slug": "dnd--5e",
      "path_slug": "dnd/5e",
      "name": "Dungeons & Dragons 5e",
      "name_pt": "Dungeons & Dragons 5ª Edição",
      "node_type": "edition",
      "depth": 1,
      "parent_id": "550e8400-...",
      "aliases": ["D&D 5e", "DnD 5e"],
      "has_children": true,
      "children_count": 2,
      "created_at": "2025-06-10T12:00:00Z",
      "updated_at": "2026-04-01T09:15:00Z"
    }
  ],
  "pagination": { "next_cursor": null, "has_more": false },
  "links": { "self": "/api/public/v1/systems?parent_id=550e8400-..." }
}
```

---

## 8. Gestão Amigável — UI do Admin

### 8.a Fluxo de inserção por tipo (PROB-09)

Substituir `<select>` único por wizard de 2 etapas.

**Etapa 1 — "O que você quer sugerir?"**

3 cards clicáveis, cada um com:
- Ícone distinto (Lucide).
- Label curto.
- 1 frase explicativa.
- 1 exemplo concreto.

| Opção | Label | Explicação | Exemplo |
|---|---|---|---|
| `system` | Sistema novo | Um RPG que ainda não existe no catálogo | Daggerheart |
| `edition` | Nova edição | Uma versão diferente de um sistema existente | D&D 5e 2024 |
| `variant` | Nova variante | Uma variação dentro de uma edição | D&D 5e 2024 PT-BR |

**Etapa 2 — Formulário específico**

Para `system`: campos `name`, `name_pt`, `description`, `aliases[]`.
Para `edition`: mesmos + `parent_id` (seleciona sistema).
Para `variant`: mesmos + `parent_id` (seleciona edição, filtrado).

### 8.b Painel de aprovação (tela admin)

Layout em **3 colunas**:

1. **Lista de sugestões pendentes** (esquerda, 30% largura)
   - Filtros: tipo (`system|scenario`), status (`pending|approved|rejected`).
   - Cada item: tipo (badge), nome, autor, data, status colorido.
   - Ordem: `created_at DESC` com mais antigos no topo para evitar fila esquecida.

2. **Preview da sugestão** (centro, 45%)
   - Campos do formulário em leitura.
   - Sistema pai proposto (com path_slug).
   - Aliases sugeridos.
   - Aviso automático se `path_slug` resultante colide com algum existente (valida antes de aprovar).

3. **Ações** (direita, 25%)
   - Botão "Aprovar" (primário, verde) → abre modal de confirmação com path_slug final.
   - Botão "Rejeitar" (secundário, vermelho) → abre textarea obrigatório de motivo.
   - Link "Ver histórico" → lista de revisões anteriores do mesmo usuário.
   - Área "Notas do admin" (opcional, não notificada ao usuário).

Regras de interação:
- Clicar fora do item não perde seleção.
- `ESC` fecha modais.
- Após ação, mostrar toast com link para o sistema/cenário criado no catálogo.

### 8.c Listagem de sistemas com drill-down

Tela `SystemsPage.tsx` com tree interativo:

- Raiz: sistemas com `depth=0`.
- Expand/collapse com ícone `ChevronRight/Down`.
- Ao expandir, chama `GET /systems/:id/children` (lazy loading).
- Cada nó mostra: nome + `name_pt` (cinza, menor) + count de filhos + count de mesas.
- Ações inline (hover): editar, deletar, mover (reparent).
- Barra de busca no topo: usa `GET /systems?search=X` com debounce 300ms.
- Filtros por `node_type`.

### 8.d Estado de ações (feedback)

| Ação | Estado inicial | Estado em curso | Estado final |
|---|---|---|---|
| Aprovar sugestão | Botão habilitado | Spinner no botão + botão desabilitado | Toast "Sistema criado: [nome]" com link |
| Rejeitar sugestão | Botão habilitado | Spinner + textarea desabilitado | Toast "Sugestão rejeitada. Usuário notificado." |
| Deletar sistema | Botão + modal | Spinner | Toast OU modal "Não é possível deletar: 3 mesas vinculadas" com lista |
| Editar sistema | Form | Spinner no submit | Toast "Sistema atualizado" |

### 8.e Exclusão protegida (A17, PROB-12)

Modal com:
- Título "Deletar [nome]?".
- Aviso: "Esta ação não pode ser desfeita."
- Listar bloqueadores se existirem: "Não é possível deletar. Este sistema está em uso por: [lista de mesas clicáveis] + [lista de sistemas filhos clicáveis]".
- Botões: "Cancelar" (primário) e "Deletar" (destrutivo, vermelho, desabilitado se houver bloqueador).

Backend retorna em 409:
```json
{
  "type": "https://api.artificiorpg.com/errors/delete-blocked",
  "title": "Cannot delete: entity in use",
  "status": 409,
  "blocked_by": {
    "tables": [{"id":"uuid","slug":"mesa-x","title":"Mesa X"}, ...],
    "children": [{"id":"uuid","path_slug":"dnd/5e/variante","name":"..."}, ...]
  }
}
```

---

## 9. Arquitetura de Tela — Implementação

### 9.a `GestaoPage.tsx` — estrutura canônica

```
<GestaoPage>
  <PageHeader title="Gestão do Catálogo" />
  <Tabs>
    <Tab id="systems" label="Sistemas">
      <SystemsAdminPanel />
    </Tab>
    <Tab id="scenarios" label="Cenários">
      <ScenariosAdminPanel />
    </Tab>
    <Tab id="suggestions" label="Sugestões" badge={pendingCount}>
      <SuggestionsReviewPanel />
    </Tab>
    <Tab id="platforms" label="Plataformas">
      <PlatformsPage />
    </Tab>
    <Tab id="tables" label="Mesas">
      <AdminTablesPanel />
    </Tab>
  </Tabs>
</GestaoPage>
```

### 9.b `SystemsAdminPanel`

```
[SearchBar] [FilterByNodeType] [BtnNovoSistema]
[SystemsTree lazy-loaded]
  └─ Dungeons & Dragons (system) [edit][delete]
      └─ D&D 5e (edition) [edit][delete]
          └─ 2014 (variant) [edit][delete]
          └─ 2024 (variant) [edit][delete]
```

### 9.c `SuggestionsReviewPanel`

Layout 3 colunas descrito em 8.b.

### 9.d Arquivo de rotas (App.tsx)

Nenhuma alteração necessária — `GestaoPage.tsx` já existe em `/gestao`.

---

## 10. Roadmap por Fases

### Fase 1 — Correções críticas (gate: sem CRÍTICO aberto)

**Escopo:** A01, A02, A03, A04, A05, A06.
**Gate de saída:**
- Migrations 104 e 105 aplicadas em dev/staging/prod.
- `approve` cria sistema. Verificado com teste E2E.
- Rota `scenarioSuggestionsAdmin` existente e registrada.
- Paginação cursor em `GET /systems`. Teste com 5k registros < 100ms.
- Frontend `SystemRecord` alinhado ao backend. `tsc --noEmit` sem erros.

**Prazo estimado:** 2-3 dias.

### Fase 2 — Fluxo de gestão (gate: usabilidade operacional)

**Escopo:** A08, A10, A11, A12, A17, A18, PROB-09, PROB-12.
**Gate de saída:**
- PUT admin recalcula descendentes corretamente (teste de reparent).
- Notificações criadas em approve/reject (verificado no banco).
- Frontend padroniza `node_type` em todas as camadas.
- Unicidade por `path_slug`.
- Busca do hook cobre aliases.
- Wizard de 3 cards implementado.
- Delete retorna bloqueadores estruturados.

**Prazo estimado:** 4-6 dias.

### Fase 3 — API pública (gate: contrato estável)

**Escopo:** Seção 7 completa.
**Gate de saída:**
- `/api/public/v1/` publicado com rate limit funcional.
- OpenAPI schema gerado e servido em `/api/public/v1/openapi.json`.
- Endpoint de lookup em lote testado.
- N:N scenario_systems implementado (migration 106).
- ETag funcional.

**Prazo estimado:** 5-7 dias.

### Fase 4 — Qualidade e escala (gate: produção hardened)

**Escopo:** A07, A09, A13, A14, A16, A19, A20.
**Gate de saída:**
- GIN queries em scenarios.
- `MAPA_DE_API.md` atualizado com contratos.
- `returningAll()` eliminado em rotas públicas.
- Um único script de import canônico.
- Slugify cobre i18n.
- Testes de regressão passando.

**Prazo estimado:** 3-4 dias.

---

## 11. Riscos e Mitigação

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| Migration 104 falha em prod porque constraint foi alterada manualmente | M | A | Dry-run em staging; script `verify_constraints.sql` antes de aplicar |
| Reparent recursivo causa lock longo em tabela grande | B | M | Executar em janela de baixo tráfego; notificar por transação curta com LIMIT |
| Notificações em massa (approve de 50 sugestões antigas) geram pico | B | B | Batch size de 10 + throttle entre commits |
| Cursor-based pagination quebra clientes antigos que esperavam retorno total | M | A | Manter compatibility flag `?paginated=false` por 60 dias com warning |
| Frontend consumidores desalinham quando `node_type` é padronizado | M | M | Feature flag + rollout por componente; monitorar `tsc --noEmit` antes do deploy |
| Delete de sistema com mesas órfãs falha silenciosamente | B | A | Backend retorna 409 com `blocked_by` detalhado; frontend exibe modal informativo |

---

## 12. Correções Priorizadas

### Alta — bloqueia funcionalidade

1. **Aplicar migrations 104 e 105**. Arquivos: `migration_104_unify_node_type_check.sql`, `migration_105_system_suggestions_align.sql`.
2. **Reescrever `systemSuggestionsAdmin.ts`** com materialização. Arquivo único.
3. **Criar `scenarioSuggestionsAdmin.ts`** + registrar em `server.ts`. Dois arquivos.
4. **Paginar `GET /systems`** e `GET /scenarios`. `systems.ts`, `scenarios.ts`.
5. **Alinhar tipo `System` no frontend**. `frontend/src/features/admin/types.ts` (ou onde estiver o tipo importado por `useSystems.ts`).

### Média — qualidade operacional

6. **Implementar `reparentSystem()`**. `systems.ts` PUT admin.
7. **Notificações em approve/reject**. Já coberto pelos patches de 2 e 3.
8. **Unicidade `path_slug`** no POST/PUT. `systems.ts`.
9. **Busca por aliases no hook**. `useSystems.ts`.
10. **Wizard de sugestão por tipo**. `SystemSuggestionModal.tsx`.
11. **Delete com bloqueadores detalhados**. `systems.ts`, `scenarios.ts`, + componente `DeleteBlockedDialog.tsx` novo no frontend.

### Baixa — hardening

12. GIN queries em scenarios.
13. Documentação `MAPA_DE_API.md`.
14. `returningAll()` → explícito.
15. Um único import script.
16. Slugify com transliteração i18n.
17. Ordem de rotas em `server.ts`.

---

## 13. Arquivos Ainda Necessários (para validações finais)

| Arquivo | Camada | Motivo | Prioridade |
|---|---|---|---|
| `backend/src/db/types.ts` | backend | Confirmar mapeamento de `name_pt`, `rejection_reason`, `node_type` em Kysely | Alta |
| `frontend/src/features/admin/types.ts` (ou equivalente do `System`) | frontend | Alinhar com `SystemRecord` do backend | Alta |
| `frontend/src/pages/GestaoPage.tsx` (conteúdo real) | frontend | Implementar subaba Sugestões com 3 colunas | Alta |
| `frontend/src/components/SystemEditModal.tsx` e `ScenarioEditModal.tsx` | frontend | Confirmar que enviam `node_type` padronizado | Média |

Se esses 4 não existirem ou precisarem ser criados, a Fase 2 expande em +1 dia.

---

## 14. Prompt Final Para Implementação

```
CONTEXTO
========
Correção do ecossistema de Sistemas, Edições, Variantes e Cenários
em produto de anúncios de mesas de RPG. Stack: React+Vite+TS (frontend),
Node+Express+Kysely+Postgres (backend), Nginx + Docker.

Fase atual: executar as Fases 1 e 2 do roadmap do documento
Reformulacao_sistemas_v1.md. Nada fora disso.

ARQUIVOS A CRIAR
================
1. database/migration_104_unify_node_type_check.sql
2. database/migration_105_system_suggestions_align.sql
3. backend/src/routes/scenarioSuggestionsAdmin.ts

ARQUIVOS A ALTERAR (patches precisos, sem refactor estético)
============================================================
1. backend/src/server.ts
   - Adicionar import de scenarioSuggestionsAdminRoutes.
   - Registrar app.use('/api/v1/admin', scenarioSuggestionsAdminRoutes)
     logo abaixo de systemSuggestionsAdminRoutes.

2. backend/src/routes/systemSuggestionsAdmin.ts
   - Reescrever COMPLETAMENTE.
   - Handler approve usa transação: SELECT sugestão pending, calcula
     depth/path_slug, verifica colisão, INSERT em systems, UPDATE status,
     INSERT em notifications. Erros: NOT_FOUND_OR_REVIEWED (404),
     PARENT_NOT_FOUND (404), PATH_SLUG_CONFLICT (409).
   - Handler reject: SELECT pending, UPDATE status + rejection_reason,
     INSERT em notifications. Erros: NOT_FOUND (404), reason obrigatório (400).
   - Handler GET /system-suggestions inalterado funcionalmente.

3. backend/src/routes/systems.ts
   - Paginação cursor-based em GET /: aceita ?cursor=&limit=&search=&parent_id=&node_type=&view=flat|tree&max_depth=.
   - view=tree com max_depth default 2, máx 4.
   - Novo endpoint GET /:id/children com paginação.
   - POST/PUT admin: unicidade por path_slug (não por slug raso).
     Slug raso derivado: path_slug.replace(/\//g, '--').
   - PUT admin: se parent_id mudou, executar reparentSystem() em
     transação com WITH RECURSIVE para atualizar depth e path_slug
     de todos os descendentes. Validar não-circularidade antes.
   - DELETE admin: retornar 409 com { blocked_by: { tables: [...],
     children: [...] } } em vez de só mensagem.

4. backend/src/routes/scenarios.ts
   - Busca via to_tsvector/plainto_tsquery português (usa índice GIN
     existente idx_scenarios_name_gin).
   - Paginação cursor.
   - DELETE admin retorna blocked_by estruturado.

5. frontend/src/hooks/useSystems.ts
   - Estender filtro local para cobrir aliases, name_pt, path_slug.
   - Atualizar tipo System importado (adicionar name_pt, aliases,
     path_slug, depth, node_type, parent_id, has_children).

6. frontend/src/components/SystemSuggestionModal.tsx
   - Trocar <select> de suggestion_type por wizard de 2 etapas.
   - Etapa 1: 3 cards clicáveis (system, edition, variant) com
     descrição e exemplo.
   - Etapa 2: formulário específico por tipo.
   - Renomear campo no body do POST: suggestion_type → node_type.
   - Adicionar input de aliases[] opcional para tipo system.
   - Back button volta à etapa 1.

7. frontend/src/components/ScenarioSuggestionModal.tsx
   - Sem alteração estrutural (escopo estável).

REGRAS DE EXECUÇÃO
==================
- Compilar backend: tsc --noEmit deve passar.
- Compilar frontend: npm run build deve passar.
- Migrations 104 e 105 devem ser idempotentes (usam DO $$ com IF EXISTS).
- Em cada passo, commit isolado para rollback granular.
- NÃO alterar: rate limit, auth, middleware, schema de Tables,
  rotas de Gm, rotas de Og, rotas de Links.
- Preservar todos os 7 consumidores de /systems do MAPA_DE_API.md.
  Paginação deve ser retrocompatível: sem cursor = default limit=100.
- Atualizar MAPA_DE_API.md ao final com todos os endpoints novos
  e alterados.

RESULTADO ESPERADO
==================
- Aprovar sugestão cria sistema no catálogo com notificação ao usuário.
- Aprovar sugestão de cenário funciona equivalentemente.
- Admin consegue mover sistema de pai sem quebrar subtree.
- Catálogo paginado suporta 10k+ sistemas sem degradação.
- Busca admin encontra sistemas por alias e name_pt.
- Delete bloqueado exibe o que está bloqueando.
- Wizard de sugestão força usuário a escolher tipo antes de preencher.
- Zero regressão em MestrePage, CatalogoPage, CreateTableForm,
  ScenarioSelector, SystemsTree.

PROIBIDO
========
- Redesign estético não solicitado.
- Alterar arquivos fora da lista.
- Introduzir dependência nova sem aprovação prévia.
- Renomear campos já em uso por frontend sem alias de compatibilidade.
- Commits mesclando múltiplos arquivos de camadas diferentes.

SE ALGO DIVERGIR
================
Parar e pedir: backend/src/db/types.ts, e o arquivo real que
define o tipo System importado por useSystems.ts (features/admin/types.ts
ou similar). Não improvisar.
```