# Sessão: Mitigação incidente beta OFF após deploy de produção (E144)

## 1) Objetivo da sessão
Corrigir a causa raiz que derrubou o ambiente beta durante deploy de produção, eliminar falso negativo de saúde dos frontends (E145) e restaurar a estabilidade operacional de ambos os ambientes.

## 2) Plano de execução
1. Diagnosticar status atual de produção e beta.
2. Restaurar beta no servidor Oracle se necessário.
3. Corrigir workflows de produção para impedir remoção de containers do beta.
4. Corrigir healthcheck de frontend para evitar `unhealthy` falso positivo.
5. Registrar incidentes e prevenção na documentação canônica.
6. Validar novamente saúde de produção e beta.
7. Registrar encerramento no RESUMO_EXECUCAO.

## 3) Task list (checklist)
- [x] Validar healthcheck de beta e confirmar incidente (502)
- [x] Restaurar containers beta no Oracle com docker compose
- [x] Confirmar beta online (HTTP 200 + /api/v1/health ok)
- [x] Corrigir `.github/workflows/deploy-prod.yml` removendo limpeza global por prefixo
- [x] Corrigir `.github/workflows/promote-to-prod.yml` removendo limpeza global por prefixo
- [x] Registrar erro E144 em `ERRORS_SOLUTIONS.md`
- [x] Atualizar `PRE_DEPLOY_CHECKLIST.md` com validação obrigatória de isolamento beta
- [x] Atualizar `OPERACAO_PRODUCAO.md` com validação pós-deploy produção+beta
- [x] Corrigir warning `[INEFFECTIVE_DYNAMIC_IMPORT]` em `useCreateTableForm.ts`
- [x] Executar build do frontend para validar correção de warning
- [x] Diagnosticar causa de `mesas-app` e `mesas-beta-frontend` como `unhealthy`
- [x] Corrigir healthcheck `localhost:80` -> `127.0.0.1:80` em `docker-compose.prod.yml` e `docker-compose.beta.yml`
- [x] Recriar containers de frontend em produção e beta e confirmar health `healthy`
- [x] Adicionar gate de falha por healthcheck frontend nos workflows `deploy-prod.yml` e `deploy-beta.yml`
- [x] Registrar erro E145 em `ERRORS_SOLUTIONS.md`
- [x] Atualizar `RESUMO_EXECUCAO.md` apontando para esta sessão

## 4) Arquivos-alvo
- `.github/workflows/deploy-prod.yml`
- `.github/workflows/promote-to-prod.yml`
- `.github/workflows/deploy-beta.yml`
- `docker-compose.prod.yml`
- `docker-compose.beta.yml`
- `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
- `ERRORS_SOLUTIONS.md`
- `PRE_DEPLOY_CHECKLIST.md`
- `OPERACAO_PRODUCAO.md`
- `RESUMO_EXECUCAO.md`

## 5) Critério de conclusão
- Beta e produção respondendo HTTP 200 + healthcheck ok.
- Nenhum workflow de produção contendo comando destrutivo global `name=mesas-`.
- Frontends de produção e beta em estado `healthy`.
- Workflows de deploy falham automaticamente se frontend não atingir `healthy`.
- Erros E144 e E145 documentados com recuperação e prevenção.
- Sessão registrada e `RESUMO_EXECUCAO.md` atualizado para este arquivo.
