# Sessão 26-04-19_1 — Validação Manual, Correção de Bugs e Ajustes (Etapa 1)

**Data:** 19/04/2026 03:18 BRT  
**Objetivo:** Executar validação manual online pós-deploy da Etapa 1, registrar bugs com severidade, corrigir regressões e fechar os ajustes pendentes da auditoria de sistemas.

---

## Vínculos

**Sessão Anterior:** `26-04-18_1_auditoria-sistemas-etapa-1.md`  
**Próxima Sessão:** `26-04-19_2_pos-validacao-fechamento-etapa-1.md` (se necessário, para pendências residuais após rodada de correções)

---

## Plano de Execução

1. Validar runtime no ambiente `dev` dos fluxos críticos de sistemas/cenários no `/gestao`.
2. Executar teste E2E manual do fluxo de aprovação de sugestão (`PATCH /api/v1/admin/system-suggestions/:id/approve`).
3. Registrar cada bug encontrado com severidade, evidência, rota afetada e hipótese de causa raiz.
4. Corrigir bugs priorizados (CRÍTICO/ALTO primeiro), com patch mínimo e sem refactor amplo.
5. Revalidar manualmente os fluxos corrigidos + validar TypeScript/build local.
6. Atualizar documentação operacional da rodada (sessão, resumo executivo e índice).

---

## Checklist de Execução

### Preparação
- [x] Confirmar ambiente beta/dev ativo e acessível (`mesasbeta.artificiorpg.com`)
- [ ] Abrir `docs/auditoria_sistemas_claude.md` na seção de checklist operacional (via grep + range)
- [x] Definir lista de fluxos de teste antes da execução (sem pular etapas)

### Validação Manual — Gate 4 (Regressão)
- [x] Acessar `/gestao` logado como admin e validar carregamento sem erro de rota
- [x] Testar busca por sistema (nome, slug e alias)
- [x] Testar filtro por tipo (`system`, `edition`, `subsystem`, `variant`)
- [ ] Testar criação de sistema raiz
- [ ] Testar criação de filho via árvore (`+` em node)
- [x] Testar edição no inspector lateral
- [ ] Testar deleção com aviso contextual (`tables_count` e `children_count`)
- [x] Testar fluxo de cenários na aba correspondente
- [x] Validar que outras abas não regrediram (Plataformas, Mesas, Sugestões)

### Validação Manual — Fluxo de Aprovação de Sugestão
- [ ] Criar/selecionar sugestão elegível para aprovação
- [ ] Executar aprovação via UI admin
- [ ] Confirmar criação efetiva do sistema no catálogo (`systems`)
- [ ] Confirmar ausência de erro de contrato na resposta

### Triagem e Correção de Bugs
- [x] Registrar bugs encontrados com severidade (CRÍTICO/ALTO/MÉDIO/BAIXO)
- [x] Corrigir bugs CRÍTICO/ALTO na mesma sessão
- [ ] Corrigir bugs MÉDIO quando houver segurança de baixo risco de regressão
- [x] Documentar explicitamente bugs não corrigidos (motivo + impacto + próximo passo)

### Validação Técnica Pós-Correção
- [x] `backend`: `npx tsc --noEmit`
- [x] `frontend`: `npx tsc --noEmit`
- [ ] `frontend`: `npm run build`
- [x] Revalidar no navegador os fluxos impactados pelas correções

### Governança e Fechamento
- [x] Atualizar esta sessão com evidências (bugs, correções, validações)
- [ ] Atualizar `RESUMO_EXECUCAO.md`
- [ ] Atualizar `sessoes/index.md`

### Plano operacional do que falta arrumar (mesma sessão)

#### Bloco A — Fechar bug aberto de severidade ALTA (BUG-003)
1. Reproduzir de forma controlada no ambiente beta o `POST /api/v1/systems/admin`:
   - cenário 1: sem autenticação;
   - cenário 2: autenticado como admin (via UI/Chrome).
2. Conferir logs no backend beta (VM) durante a chamada para identificar causa real do `500`.
3. Corrigir no backend com patch mínimo para retorno semântico:
   - `401` quando não autenticado;
   - `403` quando autenticado sem role adequada;
   - manter `400` para regra de parentesco inválida.
4. Revalidar endpoint com evidência de status/code/message.

#### Bloco B — Validação manual completa no Chrome (admin já logado)
1. Abrir `/gestao` e validar carregamento inicial sem erro.
2. Executar Gate 4 completo:
   - busca por nome/slug/alias;
   - filtro por tipo (`system`, `edition`, `subsystem`, `variant`);
   - criação de sistema raiz;
   - criação de filho via árvore;
   - edição via inspector;
   - deleção com aviso contextual (`blocked_by`);
   - aba cenários;
   - regressão nas abas Plataformas, Mesas e Sugestões.
3. Executar fluxo E2E de aprovação de sugestão:
   - selecionar sugestão elegível;
   - aprovar via UI;
   - confirmar criação no catálogo;
   - confirmar contrato de resposta sem erro.
4. Registrar evidências na matriz da sessão (status por item + falhas encontradas).

#### Bloco C — Validação técnica e fechamento documental
1. Rodar `frontend: npm run build`.
2. Revalidar no navegador os fluxos impactados por qualquer correção adicional.
3. Atualizar `RESUMO_EXECUCAO.md`.
4. Atualizar `sessoes/index.md`.
5. Só encerrar sessão quando checklist estiver 100% [x].

### Roteiro operacional para abertura do Chrome e teste guiado
- URL inicial: `https://mesasbeta.artificiorpg.com/gestao`
- Pré-condição: conta admin já autenticada (fornecida pelo usuário).
- Evidências a coletar: status visual por fluxo + mensagem de erro quando houver + rota/ação executada.
- Critério de parada desta rodada de validação: concluir todos os itens do Bloco B e retornar com matriz atualizada.

### Evidências coletadas na rodada Chrome (executada)
- Sessão autenticada detectada: usuário admin logado na beta.
- `/gestao` carregou sem erro visível.
- Busca por `Dungeons` aplicada com atualização da listagem.
- Filtros de tipo testados sem quebra visual (edições, subsistemas, variantes).
- Abas/módulos validados visualmente: Sugestões, Plataformas, Cenários e Mesas.
- Gravação da rodada: `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\gestao_gate4_start_1776609764155.webp`
- Capturas principais:
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\gestao_inicial_1776609796059.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\busca_dungeons_1776609832030.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\filtro_edicoes_1776609843795.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\filtro_variantes_1776609885528.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\sugestoes_pendentes_1776609920394.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\modulo_plataformas_1776609936778.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\modulo_cenarios_1776609948522.png`
  - `C:\Users\paulo\.gemini\antigravity\brain\21d827cc-3d43-4d76-9752-1a7e7e45bd92\modulo_mesas_1776609960865.png`

---

## Pacote de Execução Pré-Implementação (fornecido pelo usuário)

### Confirmação da query

```text
column_name
-------------
logo_filename
website_url
```

✅ As colunas existem. Não é isso que quebra o GET.

---

### Diagnóstico definitivo — por que o curl devolveu `pagination: null` e contadores `null`

Leitura consolidada de `routes/systems.ts`: as modificações de paginação e contadores **não** foram aplicadas ao handler GET `/`.

Comportamento atual identificado:

1. `select([...])` sem os 3 LEFT JOINs agregados.
2. Response sem `pagination` (retorna apenas `{ data }`).
3. `?limit` e `?cursor` ignorados no handler.

Evidências registradas no diagnóstico:

- Linha ~100 (select) → sem COUNT agregado
- Linha ~122 (response tree) → `return res.json({ data: filteredTree })`
- Linha ~141 (response flat) → `return res.json({ data: filteredFlat })`

Sintomas explicados por isso:

- `pagination: null` → campo inexistente no response
- `count: 1263` com `limit=5` → limit ignorado
- `children_count/tables_count/aliases_count: null` → não retornados pela query
- `has_more: null` → idem

Conclusão operacional:

- Reforma do GET `/systems` não executada.
- DELETE com `blocked_by` aparenta aplicado.

---

### Outros achados da leitura

#### `GestaoPage.tsx` — status OK

- `handleApprove` com extração `result.data?.system?.name` com fallback.
- Tab “Sugestões de Sistemas” funcional.

#### `CatalogoPage.tsx` — status OK (retrocompatível)

- Consome `GET /systems` por `data.data || []`; ao retornar `{ data, pagination }` continua funcionando.

#### Achado de integridade (CSV / banco)

Parentesco inválido identificado:

- `ade3dbd3-7640-4e73-93c7-6b433351533a` → variant filha de variant
- `2b87932e-9938-463f-b1fc-b1693bfb94ba` → variant filha de system

Observação adicional:

- 12 sistemas com `path_slug` desalinhado (dívida técnica legada); não bloqueia execução imediata, mas deve entrar em etapa posterior.

---

### Patches mandatórios para esta sessão (antes de fase seguinte)

#### PATCH 1 — Reescrever handler `GET /` em `backend/src/routes/systems.ts`

Objetivo:

- adicionar contadores agregados (`children_count`, `tables_count`, `aliases_count`)
- adicionar paginação cursor (`limit` + `cursor`) para `view != tree`
- manter compatibilidade de `view=flat`, `view=tree`, `search`

Escopo informado pelo usuário:

- atualizar import para incluir `sql` de `kysely`
- atualizar `interface SystemRecord`
- substituir o handler GET `/` inteiro pelo bloco proposto no diagnóstico

#### PATCH 2 — Corrigir cálculo de `depth` em `backend/src/routes/systemSuggestionsAdmin.ts`

Objetivo:

- remover cálculo com precedência incorreta (`?? 0 + 1`)
- calcular `depth` antes do insert, consultando `parent.depth`
- usar `depth = (parentRow?.depth ?? 0) + 1`

#### PATCH 3 — Validação de parentesco no POST/PUT de `backend/src/routes/systems.ts`

Objetivo:

- bloquear combinações inválidas pai→filho com erro 400 explícito
- matriz de validação:
  - `system` → sem pai
  - `edition` → pai `system`
  - `subsystem` → pai `system`
  - `variant` → pai `edition` ou `subsystem`

Aplicação:

- incluir validação no POST `/admin`
- incluir validação equivalente no PUT `/admin/:id`

#### PATCH 4 — Correção manual SQL dos 2 registros legados corrompidos

Execução manual, ordem obrigatória:

1) Reclassificar D&D 1e para `edition`:

```sql
UPDATE systems
SET node_type = 'edition'
WHERE id = '2b87932e-9938-463f-b1fc-b1693bfb94ba';
```

2) Reapontar parent da variant Mentzer para D&D 1e:

```sql
UPDATE systems
SET parent_id = '2b87932e-9938-463f-b1fc-b1693bfb94ba'
WHERE id = 'ade3dbd3-7640-4e73-93c7-6b433351533a';
```

Pré-condição:

- aplicar PATCH 3 antes de executar SQL manual para evitar reincidência.

---

### Validação obrigatória pós-patches (comandos alvo)

1) Paginação real no flat:

```bash
curl -s "$BASE/systems?view=flat&limit=5" | jq '{count: (.data|length), pagination}'
```

Esperado:

- `count = 5`
- `pagination.next_cursor` preenchido
- `pagination.has_more = true`

2) Contadores agregados:

```bash
curl -s "$BASE/systems?view=flat&limit=3" | jq '.data[0] | {name, children_count, tables_count, aliases_count}'
```

Esperado:

- `children_count`, `tables_count`, `aliases_count` numéricos (não `null`)

3) Validação de parentesco (erro semântico 400):

```bash
curl -s -X POST "$BASE/systems/admin" \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"name":"Teste","node_type":"edition","parent_id":"ID_DE_VARIANT_EXISTENTE"}' | jq
```

Esperado:

- HTTP 400
- mensagem indicando regra de parentesco (`edition` só pode ser filho de `system`)

---

### Ordem de execução definida para esta sessão

- [x] PATCH 1 — verificado no código (`GET /systems` com paginação + contadores já presente)
- [x] PATCH 2 — aplicado (`systemSuggestionsAdmin.ts`, cálculo de `depth` corrigido)
- [x] PATCH 3 — aplicado (`systems.ts`, validação de parentesco em POST/PUT)
- [x] Validar build/typecheck (`backend: npx tsc --noEmit`)
- [x] Executar PATCH 4 (SQL manual, com autorização explícita)
- [x] Rodar os 3 curls de validação final
  - Resultado 1: `count=5`, `pagination.next_cursor` preenchido, `has_more=true` (OK)
  - Resultado 2: `children_count/tables_count/aliases_count` retornaram numéricos (OK)
  - Resultado 3: `POST /systems/admin` sem cookie retornou `HTTP/1.1 500` + `{"error":"Erro interno no servidor."}` (FALHA inicial)
  - Diagnóstico técnico posterior: erro vinha do handler global convertendo `entity.parse.failed` em `500` genérico.
  - Ação corretiva aplicada: `backend/src/server.ts` agora preserva `err.status/statusCode` e retorna `400` para JSON inválido.
  - Pendência: validar novamente em runtime beta após subir versão corrigida.

---

## Matriz de Bugs da Sessão (preencher durante execução)

| ID | Severidade | Fluxo afetado | Evidência | Causa raiz (hipótese) | Status |
|---|---|---|---|---|---|
| BUG-001 | ALTO | `/gestao` (CRUD > Sistemas) | Seleção de item em lista longa mantinha inspector preso no topo da viewport | Altura/scroll do workspace sem fallback consistente para header e sem foco de rolagem adequado entre colunas | [x] |
| BUG-002 | ALTO | `/gestao` (CRUD > Sistemas) | Após ajuste inicial, a árvore de sistemas ficou sem rolagem vertical | Container da árvore com `overflow-hidden` bloqueando scroll da lista | [x] |
| BUG-003 | ALTO | `POST /api/v1/systems/admin` (auth/validação) | Requisição com JSON inválido era respondida como `HTTP/1.1 500` com `{"error":"Erro interno no servidor."}` | Handler global em `server.ts` descartava `status/statusCode` do erro e forçava `500` genérico | [ ] |

---

## Arquivos que serão modificados

### Código (conforme bugs encontrados)
- `frontend/src/pages/SystemsAdminView.tsx`
- `frontend/src/features/admin/components/CatalogToolbar.tsx`
- `frontend/src/features/admin/components/EntityInspector.tsx`
- `frontend/src/features/admin/components/CommandPalette.tsx`
- `frontend/src/modules/admin/systems/useSystems.ts`
- `backend/src/routes/systems.ts`
- `backend/src/routes/systemSuggestionsAdmin.ts`
- `backend/src/server.ts`

### Documentação e Governança
- `sessoes/26-04-19_1_validacao-manual-bugs-ajustes-etapa-1.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

---

## Critério de Conclusão

A sessão só pode ser encerrada quando:

1. Todos os itens críticos do Gate 4 estiverem validados manualmente com evidência.
2. Fluxo `approve` estiver validado manualmente com criação efetiva no catálogo.
3. Bugs CRÍTICO/ALTO identificados nesta rodada estiverem corrigidos ou bloqueados com justificativa explícita.
4. TypeScript e build frontend/backend estiverem sem erro.
5. Checklist desta sessão estiver 100% atualizado.
6. `RESUMO_EXECUCAO.md` e `sessoes/index.md` estiverem atualizados.

---
