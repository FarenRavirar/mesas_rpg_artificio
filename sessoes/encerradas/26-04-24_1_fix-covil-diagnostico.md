# Sessão 26-04-24_1: fix-covil-diagnostico

**Data:** 24/04/2026
**Objetivo:** Entender o bug (Covil e Placeholders) e localizar a raiz técnica.
**Sessão Anterior:** 26-04-23_7_registro-bugs-ux.md
**Próxima Sessão:** (Pendente)

## Plano de execução
1. [x] Ler os artefatos obrigatórios (AGENTS.md, constitution.md, project-state.md)
2. [x] Ler relatórios BUG-001.md e BUG-002.md
3. [x] Analisar código alvo via grep (TableCardDashboard.tsx e gmPanel.ts) buscando Covil e placeholders
4. [x] Registrar diagnóstico técnico na sessão
5. [x] Executar operação documental `/speckit.bugfix.patch` (patch em spec.md, plan.md, tasks.md)
6. [x] Executar validação `/speckit.validate` para certificar a correção do código em relação a spec.
7. [x] Executar validação estática `/speckit.checker` para garantir segurança e consistência de tipos.

## Diagnóstico Técnico
**BUG-001 (Covil e DDAL não exibidos):**
A análise mostra que o componente `TableCardDashboard.tsx` (linhas 96-105) depende diretamente de `table.is_covil` e `table.is_ddal`. O back-end em `gmPanel.ts` (linhas 824-825) busca expressamente `'t.is_ddal'` e `'t.is_covil'` no objeto de resposta. Como os campos estão alinhados de ponta a ponta, a ausência em produção indica que as colunas na tabela real podem estar retornando nulo ou falso. Uma hipótese forte é que `is_covil` pertença na verdade à entidade do Mestre (`gm_profiles`) e não à `tables`, fazendo a query em `t.is_covil` falhar silenciosamente ou retornar null, gerando o drift observado.

**BUG-002 (Placeholder indevido no painel do Mestre):**
Em `gmPanel.ts` (linha 803), a query de listagem do painel seleciona a imagem com `'t.banner_url as image_url'`. O componente `TableCardDashboard.tsx` usa `src={table.image_url || bannerPlaceholder}`. A falha ocorre porque as mesas geralmente armazenam sua imagem em `cover_url` (padrão de catálogo público), e não `banner_url` (comum para perfis). Como `t.banner_url` retorna nulo nas mesas, o fallback de placeholder é ativado indevidamente no painel do mestre.

*(Nota secundária: O back-end mapeia métricas como propriedades rasas ex: `metrics_views`, mas o frontend as espera aninhadas no objeto `table.metrics.views`. Isso faz as métricas aparecerem zeradas.)*

## Fechamento
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] Mover sessão para encerradas/ (quando autorizado)
- [x] Atualizar index.md
