# Sessão 26-04-25_2_hidratacao-arquitetural-completa

**Data:** 25/04/2026
**Objetivo:** Corrigir os 3 pontos arquiteturais da feature de hidratação que mantêm o deploy beta quebrado:
1. Acoplamento entre prod.ts e boot da API (lazy-load).
2. PROD_DB_URL não persistida (GitHub Secret + workflow injection).
3. docker-compose.beta.yml do repo divergente do dirty state da VM.

## Vínculos
- Sessão anterior: `sessoes/26-04-25_1_fix-hydrate-on-conflict.md`
- Bug catalogado: E160 (errors.md) + Bug 1 inventário Sessão 11

## Estado pré-sessão
- Branch: dev
- Último commit deployado com sucesso: `e172282` (estado anterior à feature dar problema)
- Commits em dev pendentes de deploy: `89374f5`, `9acb774` (build OK, runtime quebra)
- Dirty state na VM: `/opt/mesas-beta/docker-compose.beta.yml` tem PROD_DB_URL injetado manualmente; `/opt/mesas-beta/backend/src/routes/adminHydration.ts` tem hotpatch de userId

## Plano de execução em 3 commits separados

### COMMIT 1 — Refatorar prod.ts para lazy-load
- [ ] Editar `backend/src/db/prod.ts`: mover throw de PROD_DB_URL para dentro de uma função/getter em vez de top-level.
- [ ] Editar consumidores de prodDb (`backend/src/routes/adminHydration.ts`, eventuais outros — verificar com grep) se a API mudar.
- [ ] Validar: tsc local clean.
- [ ] Commit atômico só com os arquivos de código backend tocados.
- [ ] PUSH NÃO. Esperar próximo commit.

### COMMIT 2 — Workflow injeta PROD_DB_URL via secret
- [ ] Mantenedor cria GitHub Secret `PROD_DB_URL` manualmente em https://github.com/FarenRavirar/mesas_rpg_artificio/settings/secrets/actions (agente NÃO tem acesso, mantenedor faz).
- [ ] Editar `.github/workflows/deploy-beta.yml`: adicionar `PROD_DB_URL: ${{ secrets.PROD_DB_URL }}` nas seções `env:` dos jobs `deploy-app` e `smoke` (apenas onde necessário, identificar via leitura).
- [ ] Validar sintaxe YAML local: `yamllint .github/workflows/deploy-beta.yml` ou `python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-beta.yml'))"`.
- [ ] Commit atômico só com `.github/workflows/deploy-beta.yml`.
- [ ] PUSH NÃO. Esperar próximo commit.

### COMMIT 3 — docker-compose.beta.yml consome placeholder
- [ ] Editar `docker-compose.beta.yml` do repo: adicionar `PROD_DB_URL=${PROD_DB_URL}` na seção `environment` do serviço `mesas-beta-api`.
- [ ] Validar sintaxe YAML local.
- [ ] Commit atômico só com `docker-compose.beta.yml`.
- [ ] PUSH AGORA (push único após 3 commits).

### Validação pós-deploy
- [ ] Aguardar Deploy Beta concluir.
- [ ] Container `mesas-beta-api` deve subir clean (sem throw em load-time).
- [ ] Smoke deve passar.
- [ ] Site `mesasbeta.artificiorpg.com` deve voltar ao ar.
- [ ] Mantenedor clica "Executar sincronização" no front: deve retornar 200 com payload de contagens.
- [ ] Logs do container não mostram nenhum 23505 nem ECONNREFUSED.

### Reconciliação do dirty state da VM
- [ ] Após confirmação de funcionamento end-to-end, fazer `git pull` na pasta `/opt/mesas-beta/` da VM e validar que compose lá fica idêntico ao do repo (com placeholder, recebendo PROD_DB_URL via env do host).

## Critério de conclusão explícito
- Hidratação funciona end-to-end.
- Container nunca crasha por feature opcional ausente.
- Senha de produção não está em texto puro no Git.
- Dirty state reconciliado.
- E160 marcado como resolvido em errors.md (commit separado em sessão futura).
