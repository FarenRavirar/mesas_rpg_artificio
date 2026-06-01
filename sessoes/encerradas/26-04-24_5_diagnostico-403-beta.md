# Sessão 26-04-24_5: Diagnóstico 403 Beta (Hydrate)

## Objetivo
Diagnosticar a causa raiz do erro 403 no endpoint POST `/api/v1/admin/sync/hydrate` no ambiente Beta, seguindo estritamente as 4 fases solicitadas, sem afetar o banco de produção.

## Vínculos
- Sessão anterior: `26-04-24_4_hidratacao-tasks.md`
- Próxima sessão: N/A

## Plano de Execução
1. [x] Fase 1: Validar commit em `/opt/mesas-beta` (Concluído: `139dfb9`)
2. [ ] Fase 1: Obter token de admin com mantenedor e reproduzir `curl` capturando o body da resposta 403.
3. [ ] Fase 2: Correlacionar requisição com logs do container backend beta.
4. [ ] Fase 3: Consultar estado (token claims/banco Beta ou printenv NODE_ENV do container).
5. [ ] Fase 4: Classificar a causa raiz (A, B, C ou nova) e propor o fix.
6. [ ] Criar arquivo `.specify/features/hidratacao/diagnostico-403-beta.md`.
7. [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`.
8. [x] Mover sessão para encerradas/ (quando autorizado).
9. [x] Atualizar `index.md`.

## Arquivos Modificados
- `.specify/features/hidratacao/diagnostico-403-beta.md` (novo)

## Critério de Conclusão
- O arquivo de diagnóstico gerado contém os outputs literais de todas as fases, e a Fase 4 está clara e explícita apontando para uma das causas, com provas factuais.
