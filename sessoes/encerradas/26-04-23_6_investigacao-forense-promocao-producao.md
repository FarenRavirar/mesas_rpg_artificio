# 23-04-2026 — Investigação Forense Promoção Produção

**Objetivo:** Investigar de forma forense a falha no fluxo de promoção para produção, sem aplicar correções antes de fechar diagnóstico com evidência objetiva.
**Sessão Anterior:** [26-04-23_5_promocao-dev-main-feature003.md](26-04-23_5_promocao-dev-main-feature003.md)
**Próxima Sessão:** A definir

## Plano de execução
1. [x] Executar governança SDD complementar obrigatória antes da investigação técnica.
2. [x] Coletar estado do último run de promoção para produção.
3. [x] Coletar logs completos dos jobs com falha.
4. [x] Inspecionar apenas seções relevantes de `.github/workflows/promote-to-prod.yml`.
5. [x] Verificar estado de tags/releases relacionadas à versão da execução.
6. [x] Verificar se o erro já está catalogado em `.specify/memory/errors.md`.
7. [x] Montar matriz de hipóteses com evidência literal e severidade (S0/S1/S2/S3).
8. [x] Consolidar diagnóstico válido (sintoma, causa testada, gatilho, impacto, regressão).
9. [x] Parar e solicitar autorização explícita antes de qualquer patch.

## Checklist de fechamento
- [x] Hipóteses levantadas sem inferência e testadas com evidência literal.
- [x] Causa raiz confirmada por teste objetivo (não por opinião).
- [x] Escopo de impacto mapeado com severidade por cenário.
- [x] Relatório de decisão com opções de correção e rollback preparado.
- [x] Pergunta de autorização enviada: “Posso aplicar a correção recomendada (opção X)?”
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`.
- [x] Atualizar `sessoes/index.md`.
- [x] Mover sessão para `encerradas/` (quando autorizado).

## Registro obrigatório pré-técnico

### O que vai investigar
- Falha no pipeline de promoção `dev` → `main` com foco no workflow canônico de produção e no estágio de release associado.

### O que precisa ser feito
- Coleta de evidência operacional, teste explícito de hipóteses concorrentes, fechamento de diagnóstico válido e gate de autorização antes de patch.

### O que já foi feito
- Leitura de `.specify/memory/project-state.md`.
- Leitura completa de `AGENTS.md`.
- Verificação de sessões ativas em `/sessoes/`.
- Abertura desta nova sessão por solicitação explícita do usuário.
- Leitura de governança complementar SDD: `.specify/memory/constitution.md`, `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` e `docs/sdd/README.md`.
- Coleta de metadados do run falho `24867211797` com `gh run view --json ...`.
- Coleta de jobs/steps do run falho, confirmando falha exclusiva no step `release > Montar resumo executivo`.
- Coleta de log literal do step falho com erro: `fatal: ambiguous argument 'v1.2.3': unknown revision or path not in the working tree.`
- Validação da cronologia do workflow: step falho referencia `${VERSION}` antes do step de criação da release/tag.
- Verificação de release/tag: `v1.2.2` existente; `v1.2.3` inexistente local/remoto no momento da execução.
- Autorização explícita do usuário recebida para aplicar patch mínimo no workflow.
- Patch aplicado em `.github/workflows/promote-to-prod.yml`: fallback de `TARGET_REF` para `origin/main` quando `${VERSION}` ainda não existe como revisão Git no runner.
- Validação local do fallback executada com sucesso: `TARGET_REF=origin/main`, `RANGE=v1.2.2..origin/main`, `TOTAL_COMMITS=87`.
- Diff final validado no arquivo alvo sem alterações fora do bloco de `Montar resumo executivo`.
- Checagem local de lint/sintaxe solicitada: `actionlint` não está instalado no ambiente local (`Get-Command actionlint` falhou).
- Validação de sintaxe YAML local executada com `node + js-yaml` sobre `.github/workflows/promote-to-prod.yml` com resultado `YAML_PARSE_OK`.

## Arquivos que serão modificados
- `sessoes/26-04-23_6_investigacao-forense-promocao-producao.md`
- `.github/workflows/promote-to-prod.yml`
- `sessoes/index.md`
- `.specify/memory/project-state.md` (apenas ao fechamento da etapa autorizada)
- `.specify/memory/errors.md` (somente se erro novo for confirmado)

## Critério de conclusão explícito
- Diagnóstico somente será considerado válido quando houver: sintoma observável, causa raiz testada, condição de disparo identificada, escopo de impacto mapeado e risco de regressão descrito; após isso, a execução para e aguarda autorização explícita do usuário antes de qualquer correção.

## Matriz de hipóteses (evidência literal)

| Hipótese | Evidência coletada | Resultado | Severidade |
|---|---|---|---|
| H1: `VERSION` é usada como revisão Git antes da tag existir | Log do run 24867211797 (`release > Montar resumo executivo`) mostra `VERSION: v1.2.3`, `PREVIOUS_TAG: v1.2.2` e erro `fatal: ambiguous argument 'v1.2.3'`; no workflow, a criação/edição de release/tag ocorre apenas no step final `Criar ou atualizar release` | Confirmada | S1 |
| H2: `PREVIOUS_TAG` inválida causa quebra do range | `PREVIOUS_TAG: v1.2.2` no log; `gh release list` confirma `v1.2.2` publicada; `git tag -l v1.2.2` e `git ls-remote --tags origin refs/tags/v1.2.2` confirmam existência | Refutada | S3 |
| H3: problema de fetch de tags no job release | Step `Fetch tags` executado com sucesso; `v1.2.3` não existe remotamente para ser buscada; reprodução local `git diff --name-only v1.2.2 v1.2.3` retorna o mesmo erro de revisão ambígua | Refutada (como causa primária) | S3 |

## Diagnóstico consolidado
- Sintoma: falha no step `Montar resumo executivo` com exit code 128.
- Causa raiz testada: script monta `RANGE="${PREVIOUS_TAG}..${VERSION}"` e executa `git diff/git log` contra `${VERSION}` quando `${VERSION}` ainda não existe como tag/revisão no repositório do runner.
- Gatilho: execução manual com `inputs.version` novo (ex.: `v1.2.3`) antes da criação da release/tag correspondente.
- Impacto: deploy de produção conclui, mas pipeline fica vermelho no job `release`; não gera `executive_notes.md`, nem notas automáticas, nem release final.
- Regressão: alta probabilidade de recorrência para qualquer nova versão inédita.
