# SESSÃO: 21/04/2026 - Correção de Stdin Drain e Bug de Integração (Feature 001)

**Data:** 21/04/2026
**Objetivo:** Adicionar regra F16 (handoff preventivo) e corrigir o bug de stdin drain no script de integração via injeção de `< /dev/null`, além de corrigir perda de exit code do `list_pending_by_set_diff`.

**Sessão Anterior:** `26-04-20_9_gate-migrations-refactor.md`
**Próxima Sessão:** A definir

## Plano de Execução
1. [x] Adicionar F16 ao `SESSION_FAILURES_REGISTRY.md`.
2. [x] Commit de governance.
3. [x] Inserir `< /dev/null` nos scripts `lib_migrations.sh`, `apply_required_migrations.sh`, `reconcile_migrations.sh`, e `integration_apply.sh`.
4. [x] Corrigir perda de exit code no set-diff (substituindo process substitution por captura de variável).
5. [x] Rodar `integration_apply.sh`.
6. [x] Se GREEN, commit atômico e push.
7. [ ] T042: Atualização do `migrations_guide.md` (Referências Rápidas, Erros Reais TS, Lições Feature 001).
8. [x] T043: `OPERACAO_PRODUCAO.md` - Passo obrigatório para reconciliação manual.
9. [x] T044: `PRE_DEPLOY_CHECKLIST.md` - Novos gates, preflight output, flags de manual-risk.
10. [x] T044.5: Auditoria de `ambiente_atual_mesas.md`.
11. [ ] Atualizar `RESUMO_EXECUCAO.md`
12. [ ] Atualizar `sessoes/index.md`

## Arquivos Modificados
- `docs/sdd/SESSION_FAILURES_REGISTRY.md`
- `scripts/deploy/reconcile_migrations.sh`
- `scripts/deploy/lib_migrations.sh`
- `scripts/deploy/apply_required_migrations.sh`
- `testes/deploy/integration_apply.sh`

## Critério de Conclusão
Testes de integração finalizados em GREEN, com commits atômicos de governance e do fix realizados.

## Próximos Passos
Aguardar o mantenedor analisar o output literal do teste e autorizar prosseguir.
