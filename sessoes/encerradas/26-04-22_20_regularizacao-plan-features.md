# Sessão 26-04-22_20_regularizacao-plan-features

**Data:** 22/04/2026  
**Objetivo:** Regularizar `plan.md` das features pendentes no layout canônico `.specify/features/*`, iniciando por `ops-08`, sem alterar escopo funcional e sem tocar código de runtime.

## Vínculos
- **Sessão anterior:** `encerradas/26-04-22_19_check-doctor-inicial.md`
- **Próxima sessão:** `26-04-22_21_check-migracao-v4-errors.md`

## O que vou fazer agora
1. Mapear artefatos existentes (`spec.md` e `tasks.md`) de cada feature alvo.
2. Criar `plan.md` canônico por feature na ordem exigida.
3. Validar consistência documental (`spec.md` ↔ `plan.md` ↔ `tasks.md`) por feature.
4. Registrar progresso contínuo e riscos concretos nesta sessão.
5. Atualizar `.specify/memory/project-state.md` via fluxo `/speckit.status` ao final.

## O que precisa ser feito
1. `ops-08`
2. `deb-01`
3. `deb-02`
4. `deb-03`
5. `deb-04`
6. `deb-05` (validar existência)
7. `deb-06`
8. `deb-07` (validar existência)
9. `deb-08`
10. `deb-09`
11. `ops-01`
12. `ops-02`
13. `ops-03`
14. `ops-04` (validar existência)
15. `ops-05` (validar existência)
16. `ops-06`
17. `ops-07`
18. `req-29`
19. `req-orphan`

## O que foi feito
- Leitura de governança obrigatória concluída (`project-state.md`, `AGENTS.md`, `constitution.md`, `SESSION_FAILURES_REGISTRY.md`, `MAINTAINER_REVIEW_CHECKLIST.md`, `docs/sdd/README.md`).
- Estrutura de `.specify/features/` confirmada com 15 features pendentes sem `plan.md`.
- Sessão criada e iniciada antes de alterações técnicas em artefatos de feature.

## Plano de execução
1. Levantar estrutura canônica de `plan.md` e padrão de consistência.
2. Processar features na ordem mandatória do usuário.
3. Após cada feature, atualizar este arquivo com status e risco/pendência concreta.
4. Consolidar lista final de regularizadas e bloqueadas.
5. Atualizar `project-state.md` pelo fluxo `/speckit.status`.

## Checklist
- [x] Leitura inicial de governança obrigatória
- [x] Criar/retomar sessão ativa
- [x] Regularizar `ops-08`
- [x] Regularizar `deb-01`
- [x] Regularizar `deb-02`
- [x] Regularizar `deb-03`
- [x] Regularizar `deb-04`
- [x] Verificar `deb-05` (existência/bloqueio)
- [x] Regularizar `deb-06`
- [x] Verificar `deb-07` (existência/bloqueio)
- [x] Regularizar `deb-08`
- [x] Regularizar `deb-09`
- [x] Regularizar `ops-01`
- [x] Regularizar `ops-02`
- [x] Regularizar `ops-03`
- [x] Verificar `ops-04` (existência/bloqueio)
- [x] Verificar `ops-05` (existência/bloqueio)
- [x] Regularizar `ops-06`
- [x] Regularizar `ops-07`
- [x] Regularizar `req-29`
- [x] Regularizar `req-orphan`
- [x] Consolidar lista de features regularizadas
- [x] Consolidar lista de features bloqueadas com motivo objetivo
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] Atualizar `sessoes/index.md`
- [x] Formalizar descarte técnico de `deb-05`, `deb-07`, `ops-04`, `ops-05`
- [x] Mover sessão para `encerradas/` (somente quando autorizado)

## Progresso contínuo
- `ops-08/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-01/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-02/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-03/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-04/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-06/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-08/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `deb-09/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `ops-01/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `ops-02/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `ops-03/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `ops-06/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `ops-07/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `req-29/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- `req-orphan/plan.md` criado no formato canônico e consistente com `spec.md`/`tasks.md`.
- Bloqueios por inexistência de diretório confirmados: `deb-05`, `deb-07`, `ops-04`, `ops-05`.
- Descarte técnico formalizado por autorização explícita do usuário para: `deb-05`, `deb-07`, `ops-04`, `ops-05`.
- Arquivamento da sessão 20 autorizado pelo usuário; continuidade da migração será registrada na sessão `26-04-22_21_check-migracao-v4-errors.md`.

## Lista de features regularizadas
- `ops-08`
- `deb-01`
- `deb-02`
- `deb-03`
- `deb-04`
- `deb-06`
- `deb-08`
- `deb-09`
- `ops-01`
- `ops-02`
- `ops-03`
- `ops-06`
- `ops-07`
- `req-29`
- `req-orphan`

## Lista de features descartadas tecnicamente (formalização)
- `deb-05` — diretório `.specify/features/deb-05` inexistente; descarte autorizado pelo usuário nesta sessão
- `deb-07` — diretório `.specify/features/deb-07` inexistente; descarte autorizado pelo usuário nesta sessão
- `ops-04` — diretório `.specify/features/ops-04` inexistente; descarte autorizado pelo usuário nesta sessão
- `ops-05` — diretório `.specify/features/ops-05` inexistente; descarte autorizado pelo usuário nesta sessão

## Arquivos que serão modificados
- `sessoes/26-04-22_20_regularizacao-plan-features.md`
- `sessoes/index.md`
- `.specify/memory/project-state.md`
- `.specify/features/ops-08/plan.md`
- `.specify/features/deb-01/plan.md`
- `.specify/features/deb-02/plan.md`
- `.specify/features/deb-03/plan.md`
- `.specify/features/deb-04/plan.md`
- `.specify/features/deb-06/plan.md`
- `.specify/features/deb-08/plan.md`
- `.specify/features/deb-09/plan.md`
- `.specify/features/ops-01/plan.md`
- `.specify/features/ops-02/plan.md`
- `.specify/features/ops-03/plan.md`
- `.specify/features/ops-06/plan.md`
- `.specify/features/ops-07/plan.md`
- `.specify/features/req-29/plan.md`
- `.specify/features/req-orphan/plan.md`

## Critério de conclusão explícito
- Todos os `plan.md` das 15 features pendentes existentes foram criados no layout canônico e consistentes com seus respectivos `spec.md` e `tasks.md`.
- Features solicitadas sem diretório existente foram formalmente descartadas com autorização explícita do usuário.
- Checklist desta sessão sem itens pendentes.
- `.specify/memory/project-state.md` atualizado via fluxo `/speckit.status`.
