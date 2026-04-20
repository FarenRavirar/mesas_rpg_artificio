# SESSÃO: 20/04/2026 - Gate de Migrations SDD-001

**Data:** 20/04/2026  
**Objetivo:** Elaborar infraestrutura, shell scripts robustos com reconciliação idempotente e rotinas de validação de metadados das antigas migrations soltas na base, além deter o processo de quebrar beta/prod por colisão.

**Sessão Anterior:** [N/A - Primeira sessão do fluxo SDD]
**Próxima Sessão:** A definir

## Plano de Execução (Baseado em tasks.md do spec 001)
1. Fase 1: Setup e inventário (ADRs e mapeamento).
2. Fase 2: Construção da suite "Red" (mock, unit tests de script).
3. Fase 3: Implantação Core "Green" (`lib_migrations`, `preflight`, check anti-drift).
4. Fase 4: Integração de fluxos GitHub Actions (Jobs de Deploy limitados por Gate transacional).
5. Fase 5: Adaptações de acervo passivo (injecção declarativa da tag de @class).

## Arquivos Modificados
- `specs/001-gate-migrations-refactor/*.md`
- `.github/workflows/deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`
- `.github/workflows/_enforce-migration-dir.yml`, `_lint-shell.yml`, `preflight-prod.yml`
- `scripts/deploy/lib_migrations.sh`
- `scripts/deploy/apply_required_migrations.sh`
- `scripts/deploy/reconcile_migrations.sh`
- `scripts/deploy/preflight_prod.sh`
- `database/migration_114_add_applied_by.sql`
- 45 arquivos antigos `.sql` (movidos para `database/` ou tagueados).

## Checklist
- [x] Levantamento de Inventário na VM para DB e diretórios.
- [x] Setup Local (ADR, Allowlist e README limitador).
- [x] Testes Bats formulados e contrato do header avaliado.
- [x] Rewrite do Apply e adição do Reconcile para comandos avulsos.
- [x] Pull Request Actions restritos criados (workflow multi-job).
- [x] Tag header `online-safe` | `manual-risk` unificadas nas 45 migrations de log.
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `index.md`
- [x] PR 121 aberto na branch `dev`.

## Critério de Conclusão Explícito
Todos arquivos soltos recolocados em `./database`, o sistema barrando instruções destrutivas baseada no metadata dos próprios `.sql`, e fluxos do workflow consolidados.

## Conclusão
A task foi considerada encerrada e push realizada perfeitamente com sua pipeline limpa no GitHub. Aguarda aprovação do code owner.
