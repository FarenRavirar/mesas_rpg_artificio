# Sessão 26-04-25_1_fix-hydrate-on-conflict

**Data:** 25/04/2026
**Objetivo:** Corrigir 500 em POST /api/v1/admin/sync/hydrate (erro 23505 em adminHydration.ts:123) adicionando ON CONFLICT em todos os INSERTs do endpoint conforme estratégia por categoria.

## Vínculos
- Sessão anterior: `sessoes/26-04-24_11_fix-hydrate-403.md`
- Bug catalogado: E160 (mitigado em runtime) + Bug 4 do inventário da Sessão 11

## Diagnóstico já realizado nesta linha de trabalho
- E160 mitigado: PROD_DB_URL injetado em mesas-beta-api, conexão com mesas-db OK (validado via `docker exec mesas-beta-api printenv | grep -i prod`).
- Erro atual confirmado nos logs: `duplicate key value violates unique constraint "communication_platforms_name_key"` (Postgres 23505) em adminHydration.js:123, primeira ocorrência ao inserir `Discord`.
- Código backend lê variável `PROD_DB_URL` (não `PROD_DATABASE_URL`) — confirmado em `backend/src/db/prod.ts` linha ~9.
- Endpoint itera sobre array `tablesToSync` (linhas 32–49 de adminHydration.ts) executando o mesmo bloco INSERT/UPDATE genérico (linhas 109 e 116) para 35 tabelas.

## Estratégia decidida pelo mantenedor (por categoria)

| Categoria | Tabelas | Estratégia SQL |
|---|---|---|
| CATÁLOGO | systems, scenarios, platforms, tags, vtt_platforms, communication_platforms, sources, scenario_aliases, scenario_suggestions, system_aliases, system_suggestions, vtt_platform_suggestions, setting_style_suggestions | `ON CONFLICT (name) DO UPDATE SET ...` (prod = fonte da verdade) |
| MESAS | tables, table_contacts, table_platforms, table_schedules, table_tags, table_history, imported_tables, table_metrics, table_interests | `ON CONFLICT (id) DO UPDATE SET ...` (prod sobrescreve coincidentes; exclusivas do beta preservadas) |
| IDENTIDADE | users, auth_providers, profiles, player_profiles, gm_profiles, user_preferences, user_links, user_systems, gm_profile_metrics | `ON CONFLICT (id) DO NOTHING` (nunca toca quem já existe no beta) |
| INTERAÇÕES | bookmarks, questions, answers, reviews | `ON CONFLICT (id) DO NOTHING` |

Observação: `table_interests` foi alocada em MESAS (decisão do mantenedor).

## Plano de execução
1. [x] Registrar abertura da sessão (este arquivo).
2. [ ] Mapear, para cada uma das 35 tabelas, qual coluna é a chave de conflito real (verificar `name` vs `id` nas tabelas catálogo — algumas podem ter `name` UNIQUE composto ou outro nome).
3. [ ] Mapear, para cada tabela MESAS/IDENTIDADE/INTERAÇÕES, se a PK é de fato `id` UUID.
4. [ ] Propor diff único em `backend/src/routes/adminHydration.ts` cobrindo as 4 estratégias.
5. [ ] Aguardar aprovação do mantenedor antes de aplicar.
6. [ ] Aplicar diff localmente, commit atômico, push para `dev`.
7. [ ] Aguardar deploy automático para beta.
8. [ ] Validar via curl externo ao endpoint, esperando 200.
9. [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`.
10. [ ] Atualizar `.specify/memory/errors.md`: marcar E160 como resolvido em runtime; abrir entrada nova para o Bug 4 (ON CONFLICT) e marcar resolvido neste commit.

## Critério de conclusão explícito
- Endpoint retorna 200 com payload de contagens por tabela em chamada real ao beta.
- Nenhum erro 23505 nos logs após a chamada.
- Sessão de identidade do mantenedor preservada (não foi sobrescrita).
- Mesas exclusivas do beta preservadas (não foram apagadas).

## Inspeção de schema real (mesas-db)

1. `vtt_platforms`
- PK: `id` (uuid)
- UNIQUEs: `name`, `slug`
- Conclusão: `ON CONFLICT (slug) DO UPDATE SET ...` (mantendo padrão do catálogo)

2. `vtt_platform_suggestions`
- PK: `id` (uuid)
- UNIQUEs: Nenhuma restrição unique além da PK.
- Conclusão: `ON CONFLICT (id) DO NOTHING` (tabela de sugestão de usuário)

3. `scenario_suggestions`
- PK: `id` (uuid)
- UNIQUEs: Nenhuma restrição unique além da PK.
- Conclusão: `ON CONFLICT (id) DO NOTHING` (tabela de sugestão de usuário)

4. `system_suggestions`
- PK: `id` (uuid)
- UNIQUEs: Nenhuma restrição unique além da PK.
- Conclusão: `ON CONFLICT (id) DO NOTHING` (tabela de sugestão de usuário)

Regra geral: tabelas `*_suggestions` seguem estratégia INTERAÇÕES (DO NOTHING por id) — não CATÁLOGO.

## Patch proposto v1 (descartado)

```diff
--- backend/src/routes/adminHydration.ts
+++ backend/src/routes/adminHydration.ts
@@ -101,23 +101,114 @@
-            // Busca no DB local (Beta) para checar se existe e comparar
-            const existingRecord = await trx.selectFrom(tableName as any)
-              .selectAll()
-              .where('id', '=', record.id)
-              .executeTakeFirst();
-
-            if (!existingRecord) {
-              // INSERT
-              await trx.insertInto(tableName as any).values(safeRecord).execute();
-              inserted++;
-            } else {
-              // UPDATE (só se diferente)
-              // Comparação básica JSON
-              const isEqual = JSON.stringify(existingRecord) === JSON.stringify(safeRecord);
-              if (!isEqual) {
-                await trx.updateTable(tableName as any)
-                  .set(safeRecord)
-                  .where('id', '=', record.id)
-                  .execute();
-                updated++;
-              } else {
-                ignored++;
-              }
-            }
+            const updateObj = { ...safeRecord };
+            delete updateObj.id;
+            delete updateObj.created_at;
+
+            switch (tableName) {
+              // 1) CATÁLOGO (ON CONFLICT slug/url/composite DO UPDATE)
+              case 'systems':
+              case 'scenarios':
+              case 'platforms':
+              case 'tags':
+              case 'vtt_platforms':
+              case 'communication_platforms':
+                delete updateObj.slug;
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('slug').doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+                
+              case 'sources':
+                delete updateObj.url;
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('url').doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+
+              case 'scenario_aliases':
+                delete updateObj.alias_slug;
+                delete updateObj.scenario_id;
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['scenario_id', 'alias_slug']).doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+
+              case 'system_aliases':
+                delete updateObj.alias_slug;
+                delete updateObj.system_id;
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['system_id', 'alias_slug']).doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+
+              case 'setting_style_suggestions':
+                delete updateObj.setting_name;
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('setting_name').doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+
+              // 2) SUGGESTIONS (ON CONFLICT id DO NOTHING)
+              case 'vtt_platform_suggestions':
+              case 'scenario_suggestions':
+              case 'system_suggestions':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              // 3) MESAS (ON CONFLICT id DO UPDATE)
+              case 'tables':
+              case 'table_contacts':
+              case 'table_schedules':
+              case 'table_history':
+              case 'imported_tables':
+              case 'table_metrics':
+              case 'table_interests':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doUpdateSet(updateObj))
+                  .execute();
+                inserted++;
+                break;
+
+              // MESAS - COMPOSTAS (ON CONFLICT PK DO UPDATE/NOTHING)
+              case 'table_platforms':
+                delete updateObj.table_id;
+                delete updateObj.platform_id;
+                if (Object.keys(updateObj).length > 0) {
+                  await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'platform_id']).doUpdateSet(updateObj))
+                    .execute();
+                } else {
+                  await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'platform_id']).doNothing())
+                    .execute();
+                }
+                inserted++;
+                break;
+
+              case 'table_tags':
+                delete updateObj.table_id;
+                delete updateObj.tag_id;
+                if (Object.keys(updateObj).length > 0) {
+                  await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'tag_id']).doUpdateSet(updateObj))
+                    .execute();
+                } else {
+                  await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'tag_id']).doNothing())
+                    .execute();
+                }
+                inserted++;
+                break;
+
+              // 4 e 5) IDENTIDADE e INTERAÇÕES (ON CONFLICT id/PK DO NOTHING)
+              case 'users':
+              case 'profiles':
+              case 'player_profiles':
+              case 'gm_profiles':
+              case 'user_preferences':
+              case 'user_links':
+              case 'gm_profile_metrics':
+              case 'questions':
+              case 'answers':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              case 'auth_providers':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['provider', 'provider_user_id']).doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              case 'user_systems':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['user_id', 'system_id', 'type']).doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              case 'bookmarks':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['user_id', 'table_id']).doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              case 'reviews':
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['table_id', 'user_id']).doNothing())
+                  .execute();
+                inserted++;
+                break;
+
+              default:
+                await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doNothing())
+                  .execute();
+                inserted++;
+                break;
+            }
```

## Patch proposto v2

```diff
--- backend/src/routes/adminHydration.ts
+++ backend/src/routes/adminHydration.ts
@@ -101,23 +101,130 @@
-            // Busca no DB local (Beta) para checar se existe e comparar
-            const existingRecord = await trx.selectFrom(tableName as any)
-              .selectAll()
-              .where('id', '=', record.id)
-              .executeTakeFirst();
-
-            if (!existingRecord) {
-              // INSERT
-              await trx.insertInto(tableName as any).values(safeRecord).execute();
-              inserted++;
-            } else {
-              // UPDATE (só se diferente)
-              // Comparação básica JSON
-              const isEqual = JSON.stringify(existingRecord) === JSON.stringify(safeRecord);
-              if (!isEqual) {
-                await trx.updateTable(tableName as any)
-                  .set(safeRecord)
-                  .where('id', '=', record.id)
-                  .execute();
-                updated++;
-              } else {
-                ignored++;
-              }
-            }
+            const updateObj = { ...safeRecord };
+            delete updateObj.id;
+            delete updateObj.created_at;
+
+            let result: any;
+
+            switch (tableName) {
+              // 1) CATÁLOGO (ON CONFLICT slug/url/composite DO UPDATE)
+              case 'systems':
+              case 'scenarios':
+              case 'platforms':
+              case 'tags':
+              case 'vtt_platforms':
+              case 'communication_platforms':
+                delete updateObj.slug;
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('slug').doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+                
+              case 'sources':
+                delete updateObj.url;
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('url').doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'scenario_aliases':
+                delete updateObj.alias_slug;
+                delete updateObj.scenario_id;
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['scenario_id', 'alias_slug']).doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'system_aliases':
+                delete updateObj.alias_slug;
+                delete updateObj.system_id;
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['system_id', 'alias_slug']).doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'setting_style_suggestions':
+                delete updateObj.setting_name;
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('setting_name').doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              // 2) SUGGESTIONS (ON CONFLICT id DO NOTHING)
+              case 'vtt_platform_suggestions':
+              case 'scenario_suggestions':
+              case 'system_suggestions':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doNothing())
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              // 3) MESAS (ON CONFLICT id DO UPDATE)
+              case 'tables':
+              case 'table_contacts':
+              case 'table_schedules':
+              case 'table_history':
+              case 'imported_tables':
+              case 'table_metrics':
+              case 'table_interests':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doUpdateSet(updateObj))
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              // MESAS - COMPOSTAS (ON CONFLICT PK DO UPDATE/NOTHING)
+              case 'table_platforms':
+                delete updateObj.table_id;
+                delete updateObj.platform_id;
+                if (Object.keys(updateObj).length > 0) {
+                  result = await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'platform_id']).doUpdateSet(updateObj))
+                    .returning(['table_id', sql<string>`xmax`.as('xmax')])
+                    .executeTakeFirst();
+                } else {
+                  result = await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'platform_id']).doNothing())
+                    .returning(['table_id', sql<string>`xmax`.as('xmax')])
+                    .executeTakeFirst();
+                }
+                break;
+
+              case 'table_tags':
+                delete updateObj.table_id;
+                delete updateObj.tag_id;
+                if (Object.keys(updateObj).length > 0) {
+                  result = await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'tag_id']).doUpdateSet(updateObj))
+                    .returning(['table_id', sql<string>`xmax`.as('xmax')])
+                    .executeTakeFirst();
+                } else {
+                  result = await trx.insertInto(tableName as any)
+                    .values(safeRecord)
+                    .onConflict((oc) => oc.columns(['table_id', 'tag_id']).doNothing())
+                    .returning(['table_id', sql<string>`xmax`.as('xmax')])
+                    .executeTakeFirst();
+                }
+                break;
+
+              // 4 e 5) IDENTIDADE e INTERAÇÕES (ON CONFLICT id/PK DO NOTHING)
+              case 'users':
+              case 'profiles':
+              case 'player_profiles':
+              case 'gm_profiles':
+              case 'user_preferences':
+              case 'user_links':
+              case 'gm_profile_metrics':
+              case 'questions':
+              case 'answers':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.column('id').doNothing())
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'auth_providers':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['provider', 'provider_user_id']).doNothing())
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'user_systems':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['user_id', 'system_id', 'type']).doNothing())
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'bookmarks':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['user_id', 'table_id']).doNothing())
+                  .returning(['user_id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              case 'reviews':
+                result = await trx.insertInto(tableName as any)
+                  .values(safeRecord)
+                  .onConflict((oc) => oc.columns(['table_id', 'user_id']).doNothing())
+                  .returning(['id', sql<string>`xmax`.as('xmax')])
+                  .executeTakeFirst();
+                break;
+
+              default:
+                throw new Error(`Tabela ${tableName} não tem estratégia de hidratação definida no switch`);
+            }
+
+            if (!result) {
+              ignored++;
+            } else if (result.xmax === '0') {
+              inserted++;
+            } else {
+              updated++;
+            }
```

## Investigação pré-patch

### Ponto A — Telemetria do endpoint
1. Declaração das variáveis em `backend/src/routes/adminHydration.ts`: linhas 57 (`inserted`), 58 (`updated`), 59 (`ignored`).
2. Retorno das variáveis: linhas 138-140 (dentro de `logs.push()`) e lidas/retornadas na linha 151: `return res.json({ success: true, dry_run: dryRun, data: { tables: logs } });`.
3. Consumo no frontend: No arquivo `frontend/src/modules/admin/hydration/HydrationAdminPanel.tsx` a telemetria é consumida separadamente e exibida em uma tabela detalhada.

**Trecho backend:**
```typescript
        logs.push({
          table: tableName,
          candidates,
          inserted,
          updated,
          ignored
        });
// ...
    return res.json({ success: true, dry_run: dryRun, data: { tables: logs } });
```

**Trecho frontend (`HydrationAdminPanel.tsx`):**
```tsx
                {lastResult.data.tables.map((log) => (
                  <tr key={log.table} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{log.table}</td>
                    <td className="px-4 py-3 text-right">{log.candidates}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{log.inserted}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{log.updated}</td>
                    <td className="px-4 py-3 text-right font-mono text-white/40">{log.ignored}</td>
                  </tr>
                ))}
```
**Conclusão A:** A telemetria importa para o front.

### Ponto B — Classificação de `setting_style_suggestions`

**Output literal de `\d setting_style_suggestions`:**
```
                        Table "public.setting_style_suggestions"
      Column      |           Type           | Collation | Nullable |      Default      
------------------+--------------------------+-----------+----------+-------------------
 id               | uuid                     |           | not null | gen_random_uuid()
 setting_name     | text                     |           | not null | 
 suggested_styles | text[]                   |           | not null | 
 created_at       | timestamp with time zone |           | not null | now()
 updated_at       | timestamp with time zone |           | not null | now()
Indexes:
    "setting_style_suggestions_pkey" PRIMARY KEY, btree (id)
    "idx_setting_suggestions_name_trgm" gin (setting_name gin_trgm_ops)
    "setting_style_suggestions_setting_name_key" UNIQUE CONSTRAINT, btree (setting_name)
```

**Verificações:**
a) Não existe coluna `user_id` nem indicação de "criada por usuário".
b) Não existe coluna `status`.
c) Estruturalmente, não é uma "sugestão de usuário", mas sim uma tabela de mapeamento administrativo (Catálogo) com `UNIQUE (setting_name)`.

### Ponto C — Default do switch

1. O array `tablesToSync` possui exatas 35 tabelas.
2. O diff proposto possui exatos 35 `cases`. Nenhuma tabela do array foi omitida, portanto, nenhuma tabela conhecida cairá no `default`. O `default` atuará unicamente como fallback passivo caso uma nova tabela seja adicionada ao array sem ser mapeada no switch.
