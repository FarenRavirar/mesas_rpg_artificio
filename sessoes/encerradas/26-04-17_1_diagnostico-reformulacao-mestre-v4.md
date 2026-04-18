# 26-04-17_1_diagnostico-reformulacao-mestre-v4.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Executar diagnóstico técnico real da V4 (`docs/Reformulacao_mestre_v4.md`) contra código atual, sem inferência, e definir plano inicial de implementação sem pular etapas.

## Vínculos
- **Sessão anterior:** `26-04-16_6_definicao-proximo-escopo.md`
- **Próxima sessão:** `26-04-17_2_execucao-v4-passo1-3.md` (somente após autorização)

## Plano de execução
1. Levantar estado real dos arquivos-alvo da V4 (frontend, backend, infra).
2. Validar patch por patch (1 a 21) com evidência objetiva no código.
3. Classificar cada falha com severidade e impacto.
4. Consolidar plano de implementação inicial em ordem obrigatória (Passos 1–10 da V4).
5. Atualizar `RESUMO_EXECUCAO.md` e `sessoes/index.md`.

## Checklist
- [x] Ler `RESUMO_EXECUCAO.md`
- [x] Ler `AGENTS.md`
- [x] Verificar sessão ativa anterior e estado da checklist
- [x] Auditar `docs/Reformulacao_mestre_v4.md` (seções de patches/plano/checklist)
- [x] Auditar backend (`gm.ts`, `gmPanel.ts`, `server.ts`, `linkService.ts`)
- [x] Auditar frontend mestre (`MestrePage.tsx`, componentes `mestre/*`, hooks)
- [x] Auditar infra OG (`frontend/nginx.conf`, `docker-compose*.yml`, `frontend/index.html`, assets)
- [x] Consolidar diagnóstico sem falso-positivo por patch (1–21)
- [x] Definir plano de implementação inicial sem improviso
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

## Arquivos modificados nesta sessão
- `sessoes/26-04-17_1_diagnostico-reformulacao-mestre-v4.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- Diagnóstico V4 fechado com status de todos os patches (1–21), cada um com evidência de código.
- Severidade definida para todas as falhas encontradas.
- Plano inicial de implementação documentado na ordem obrigatória da V4.

---

## Diagnóstico técnico real (V4) — patch por patch

| Patch | Status real | Severidade | Evidência objetiva |
|---|---|---|---|
| 1 — deduplicar `buildRecommendations` (`backend/src/routes/gm.ts`) | ❌ Pendente | Média | `buildRecommendations` faz `recs.push(...)` sem dedupe (`gm.ts` linhas 32–61). |
| 2 — `useMestreInsights.ts` tipado estruturado | ❌ Pendente | Alta | Hook usa `useState<string[]>` para `insights`/`recommendations` (`useMestreInsights.ts` linhas 28–29). |
| 3 — `MestreInsightsSection.tsx` com cards estruturados | ❌ Pendente | Alta | Componente recebe `insights: string[]` e renderiza texto corrido (`MestreInsightsSection.tsx` linhas 1–20). |
| 4 — `MestreRecommendationsSection.tsx` com Lucide/estrutura | ❌ Pendente | Alta | Componente recebe `recommendations: string[]` e renderiza lista textual (`MestreRecommendationsSection.tsx` linhas 1–16). |
| 5 — `MestreHero.tsx` reescrito | ❌ Pendente | Alta | Hero atual tem 1 CTA e métricas derivadas (`totalOpenSlots`, `experience_years`) e não entrega estrutura V4 (`MestreHero.tsx` linhas 58–86). |
| 6 — novo `MestreBio.tsx` | ❌ Pendente | Alta | Arquivo inexistente em `frontend/src/components/mestre`. |
| 7 — novo `MestreSellingPoints.tsx` | ❌ Pendente | Alta | Arquivo inexistente em `frontend/src/components/mestre`. |
| 8 — novo `MestreFeaturedTable.tsx` | ❌ Pendente | Alta | Arquivo inexistente em `frontend/src/components/mestre`. |
| 9 — novo `MestreTablesGrid.tsx` | ❌ Pendente | Média | Arquivo inexistente em `frontend/src/components/mestre`. |
| 10 — `MestreTablesSection.tsx` atualizado | ❌ Pendente | Alta | Grid plano sem featured wrapper; subtítulo sempre renderiza (`MestreTablesSection.tsx` linhas 14–23). |
| 11 — novo `MestreClosedGroupSection.tsx` | ❌ Pendente | Alta | Arquivo inexistente; `MestrePage.tsx` não importa nem renderiza seção. |
| 12 — `MestreFinalCta.tsx` condicional de urgência | ❌ Pendente | Média | Título/urgência fixa; render depende apenas de `mappedTables.length > 0` em `MestrePage.tsx` (linha 85). |
| 13 — `TableCard.tsx` (Patch 7 V3) | ❌ Pendente | Alta | Mantém alturas fixas (`h-[420px]`, `h-[168px]`, `h-[252px]`), badge urgente com `animate-pulse` e bloco morto “Ver detalhes” (`TableCard.tsx` linhas 93, 97, 148, 216–221). |
| 14 — `LinksDisplay.tsx` (Patch 8 V3) | ❌ Pendente | Média | Emojis em categorias e título; iframe sem `loading="lazy"`/`referrerPolicy` (`LinksDisplay.tsx` linhas 41–44, 62, 108–113). |
| 15 — `MestrePage.tsx` composição final | ❌ Pendente | Alta | Ainda usa `MestreWhySection` e não usa os novos componentes V4 (`MestrePage.tsx` linhas 12, 66). |
| 16 — `MestrePage.css` classes novas | ❌ Pendente | Média | Classes V4 ausentes (`hero-title-accent`, `closed-group-section`, `recommendation-item`, `owner-only-banner` etc.). |
| 17 — `MestreSkeleton.tsx` com hero | ❌ Pendente | Baixa | Skeleton só renderiza grid de `TableCardSkeleton` (`MestreSkeleton.tsx` linhas 5–10). |
| 18 — OG Express route (`backend/src/routes/og.ts`) | ❌ Pendente | Alta | Arquivo `og.ts` inexistente; `server.ts` não registra rota OG. |
| 19 — Nginx proxy condicional crawler | ❌ Pendente | Alta | `frontend/nginx.conf` não possui `map $http_user_agent` nem proxy condicional para `/mestre/*`. |
| 20 — docker-compose volume compartilhado OG | ❌ Pendente | Alta | `docker-compose.beta.yml` e `docker-compose.prod.yml` não têm volume compartilhado de `frontend/dist` para backend. |
| 21 — `frontend/index.html` meta tags base | ❌ Pendente | Alta | HTML só tem charset/viewport/favicon/title (`index.html` linhas 4–7). |

---

## Falhas adicionais confirmadas (fora da tabela de patch, mas bloqueadoras)

1. **Contrato incompleto no hook `useMestre.ts`** — não tipa `tagline`, `promo_badge_text`, `selling_points`, `closed_group`, apesar de backend já retornar esses campos.  
   - **Severidade:** Alta  
   - **Evidência:** interface `MestrePublicData` sem esses campos (`useMestre.ts` linhas 10–32).

2. **Painel do Mestre sem fluxo de edição de perfil V4** — só existe `CreateGmProfileForm` mínimo (`slug`, `nickname`, `bio_long`) e o estado de view não inclui `edit-profile`.  
   - **Severidade:** Alta  
   - **Evidência:** `CreateGmProfileForm` envia somente `{ slug, nickname, bio_long }` (`PainelMestrePage.tsx` linha 110); `view` não inclui `edit-profile` (`PainelMestrePage.tsx` linha 203).

---

## Plano inicial de implementação (ordem obrigatória V4)

### Lote A — Fundacional (Passos 1, 2 e 3)
1. Criar asset `frontend/public/og-default.png` (Passo 1).
2. Aplicar Patch 1 em `backend/src/routes/gm.ts` (dedupe real sem alterar contrato) (Passo 2).
3. Aplicar Patch 2 em `frontend/src/hooks/useMestreInsights.ts` (dados estruturados) (Passo 3).

### Lote B — Composição de página pública (Passos 4, 5, 6, 7, 8)
4. Criar os 5 componentes novos (Patches 6, 7, 8, 9, 11).
5. Reescrever os componentes existentes do fluxo público (Patches 5, 3, 4, 12, 17, 10, 15).
6. Ajustar `TableCard.tsx` e `LinksDisplay.tsx` (Patches 13 e 14).
7. Aplicar classes CSS do Patch 16 em `MestrePage.css`.
8. Remover `MestreWhySection.tsx` e imports órfãos.

### Lote C — OG e painel (Passos 9 e 10)
9. Implementar OG completo (Patches 18, 19, 20, 21) com rota backend + nginx condicional + compose + meta base.
10. Implementar `EditGmProfileForm` no `PainelMestrePage.tsx` para `tagline`, `promo_badge_text`, `selling_points`, `closed_group_*`.

---

## Riscos técnicos mapeados (pré-implementação)

1. **Regressão de tipagem** ao migrar `useMestreInsights` de strings para estrutura (impacta 3 componentes).  
2. **Regressão de UX em mobile** após Patch 16 se classes novas forem aplicadas sem teste por breakpoint.  
3. **Quebra de rota SPA** no Passo 9 se regex de crawler no Nginx for ampla demais.  
4. **Painel salvar payload parcial** se `EditGmProfileForm` não alinhar com validações já existentes no backend (`gmPanel.ts`).

---

## Pendências após diagnóstico

1. Iniciar implementação **somente** no Lote A (Passos 1–3), sem avançar para Passo 4 sem validação.
2. Executar validação incremental após cada passo conforme seção 7 da V4.
