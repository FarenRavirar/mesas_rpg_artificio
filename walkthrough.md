# Walkthrough — Taxonomia de Sistemas + Selos DDAL/Covil + AppShell

**Data:** 04/04/2026  
**Branch:** `dev`  
**Último commit:** `410b5e9` — "pos claude"

---

## Resumo do lote implementado

Este lote cobre os itens 017A, 021A, 021B, 022 e parcialmente 016–020 da `FILA_IMPLEMENTACAO.md`.

### Banco de dados

- `migration_02_system_taxonomy_and_ddal.sql` — taxonomia hierárquica (`sistema > edição > variante`), campos DDAL em `tables`, índices. Aplicada no beta.

### Backend

- `backend/src/db/types.ts` — tipos Kysely atualizados com campos novos (`parent_id`, `node_type`, `depth`, `path_slug`, `is_ddal`, campos DDAL).
- `backend/src/scripts/systemsTreeImport.ts` — importador idempotente por `path_slug`. 125 nós validados. `path_slug` canônico DDAL: `dungeons-dragons/5e/2024`.
- `backend/src/routes/systems.ts` — `GET /api/v1/systems` com suporte a `?q=` (busca por alias) e `?view=tree` (hierarquia aninhada).
- `backend/src/routes/me.ts` — `GET /api/v1/me/options` retorna sistemas com hierarquia e aliases; `PUT /api/v1/me/preferences` mantém contrato de `UUID[]`.
- `backend/src/routes/gmPanel.ts` — `POST/PUT` de mesas aceitam campos DDAL; validação de elegibilidade por `path_slug`; 400 em português se inelegível.
- `backend/src/routes/tables.ts` — filtro `?seal=ddal` e `?seal=covil-do-lich`; campos DDAL expostos no retorno público; `cover_deletehash` ausente do SELECT.

### Frontend

- `SiteHeader.tsx` — header sticky com links de navegação, login/logout condicional.
- `SiteFooter.tsx` — footer institucional (gratuidade, sem anúncios, sem coleta de dados).
- `AppShell.tsx` — wrapper global `SiteHeader + {children} + SiteFooter`.
- `App.tsx` — todas as rotas envolvidas pelo `AppShell`.
- `PainelMestrePage.tsx` — header local redundante removido; seletor hierárquico de sistemas + bloco DDAL condicional implementados.
- `SystemTreeSelector.tsx` — seletor em 3 colunas (raiz → edição → variante), busca por nome e alias, responsivo.
- `types/tables.ts` — campos DDAL no tipo `Table`; tipo `Seal` adicionado.
- `hooks/useFetchTables.ts` — parâmetro `seal` nos filtros.
- `OnboardingPage.tsx` — etapa 2 usa `SystemTreeSelector` em vez de select flat.
- `CatalogoPage.tsx` — filtro de selos no painel lateral.
- `TableCard.tsx` — badges DDAL e Covil do Lich.
- `MesaPage.tsx` — bloco de metadados DDAL quando `is_ddal=true`.
- `MestrePage.tsx` — selos oficiais exibidos quando presentes no perfil.

---

## Status dos builds

| Build | Resultado | Detalhes |
|---|---|---|
| `npm run build` (backend) | ✅ Sucesso | `tsc` — exit code 0, sem erros de tipo |
| `npm run build` (frontend) | ✅ Sucesso | 1746 módulos, `dist/` gerado em 8.03s, exit code 0 |

---

## Bloqueios pendentes (pós-build)

| Item | Bloqueio | Ação necessária |
|---|---|---|
| `systemsTreeImport` no beta | `arvores_de_sistemas.md` não está no container após rebuild | `docker cp` manual após autorização de push |
| QA E2E selos DDAL/Covil | Depende da execução do script acima | Validar após `docker exec mesas-beta-api node dist/scripts/systemsTreeImport.js` |
| Validação visual smoke do AppShell | Deploy beta ainda não realizado | Validar após push autorizado |

**Desbloqueio manual (executar após push + deploy):**
```powershell
scp -F C:\projetos\config arvores_de_sistemas.md faren:/tmp/arvores_de_sistemas.md
ssh -F C:\projetos\config faren "docker cp /tmp/arvores_de_sistemas.md mesas-beta-api:/app/arvores_de_sistemas.md"
ssh -F C:\projetos\config faren "docker exec mesas-beta-api sh -c 'cd /app && node dist/scripts/systemsTreeImport.js'"
```

---

## Documentação operacional atualizada nesta sessão

- `ERRORS_SOLUTIONS.md` — E085 expandido com tabela de equivalentes PowerShell para comandos Unix; E094 criado (regra de perguntar antes de instalar software externo).
- `PRE-FLIGHT_CHECKLIST.md` — Seção 18 criada com tabela de substituição e regra de autorização para software externo.

---

## Próxima ação

Aguardando autorização de push para `dev` para deploy no beta e início do QA E2E.
