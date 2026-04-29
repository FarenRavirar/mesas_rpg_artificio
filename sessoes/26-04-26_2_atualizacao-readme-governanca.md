# 26-04-26_2_atualizacao-readme-governanca.md

**Data:** 26/04/2026
**Objetivo:** Atualizar o README.md da raiz para refletir governança SDD atual, comandos Spec-Kit vigentes e fluxos corretos.

## Vínculos
- **Sessão anterior:** `encerradas/26-04-26_1_refactor-hydration-semantic.md`
- **Próxima sessão:** a definir

## Plano de execução
1. ✅ Validar conteúdo canônico de governança (AGENTS.md + constitution.md).
2. ✅ Atualizar seção de governança e operação no `README.md` (raiz).
3. ✅ Incluir comandos Spec-Kit atuais e fluxos recomendados no README.
4. ✅ Incluir workflows por situação e explicar quando usar cada comando no README.
5. 🔄 Operacional: trocar para `dev`, remover branch `001-hydration-semantic` e preparar deploy beta após colagem manual do README.

## O que foi feito
- Seção final do `README.md` substituída por `## 📚 Governança e operação (SDD)`.
- Inclusão de fontes canônicas (`AGENTS.md`, `constitution.md`, `project-state.md`).
- Inclusão do fluxo recomendado (specify → clarify → plan → tasks → analyze → implement).
- Inclusão de atalho `/speckit.prepare`.
- Inclusão da lista de comandos Core, Execução/Qualidade, Utilitários e Extensões instaladas.
- Inclusão de workflows por situação e explicação de uso por comando.

## Retomada em 28/04/2026 — pré-deploy dev para prod
- Pedido atual do mantenedor: verificar tudo e fazer testes antes do deploy de `dev` para produção.
- Sessão retomada porque permanece ativa/incompleta em `/sessoes/`, conforme regra de AGENTS.md.
- O que vai ser feito: leitura dos checklists canônicos de deploy, verificação de divergência `dev`/`main`, validações locais e remotas somente leitura, e relatório go/no-go.
- O que precisa ser feito antes de qualquer ação bloqueante: solicitar aprovação explícita para merge/push/deploy, backup, comandos de escrita em banco, reinício de containers ou execução de workflow que altere produção.
- O que foi feito nesta retomada: `AGENTS.md`, `.specify/memory/project-state.md` e `.specify/memory/constitution.md` lidos; sessão ativa incompleta identificada.
- Progresso: `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`, `PRE_DEPLOY_CHECKLIST.md` e `docs/sdd/BRANCH_POLICY.md` lidos.
- Observação de governança: havia referências a runbooks legados em documentação ativa; o mantenedor corrigiu o escopo e determinou que a governança atual deve apontar para `AGENTS.md`, `PRE_DEPLOY_CHECKLIST.md`, `docs/sdd/BRANCH_POLICY.md`, `.specify/memory/project-state.md` e `migrations_guide.md`.
- Correção de escopo solicitada pelo mantenedor: runbooks legados de Git/operação não devem ser referenciados pela governança atual.
- Próxima ação antes de retomar deploy: verificar referências legadas em documentação canônica, atualizar os documentos afetados e validar busca final com zero referências indevidas.
- Progresso documental: removidas referências legadas de `AGENTS.md`, `PRE_DEPLOY_CHECKLIST.md`, `docs/sdd/BRANCH_POLICY.md`, `docs/sdd/MAPEAMENTO_SDD.md`, `migrations_guide.md` e `README.md`.
- Validação intermediária encontrou referências remanescentes em `.specify/memory/constitution.md` e `.specify/memory/errors.md`; serão atualizadas antes de retomar qualquer validação de deploy.
- Progresso documental: `.specify/memory/constitution.md` e `.specify/memory/errors.md` atualizados para apontar somente para fontes atuais.
- Validação: busca em documentação ativa por referências legadas retornou zero resultados; `git diff --check` sem erros.
- Próximo bloqueio antes do deploy: para que a documentação atualizada entre no candidato `dev`, é necessária aprovação explícita para commit e push em `origin/dev`.
- Retomada operacional: leitura obrigatória de início concluída em 28/04/2026 (`project-state.md`, `AGENTS.md`, sessão ativa, `constitution.md`, `SESSION_FAILURES_REGISTRY.md`, `MAINTAINER_REVIEW_CHECKLIST.md`, `PRE_DEPLOY_CHECKLIST.md`, `BRANCH_POLICY.md`, `migrations_guide.md`).
- Próxima execução autorizada nesta etapa: validações somente leitura para relatório GO/NO-GO, usando `origin/dev` vs `origin/main` como candidato remoto e sem depender da árvore local suja.
- Progresso pré-deploy: `git fetch origin --prune` concluído; candidato remoto confirmado em `origin/dev=bf1eb29` contra `origin/main=f88b875`, divergência `5 28`.
- Progresso GitHub: último `Deploy Beta` (`25080459429`) e `CodeQL` (`25080459112`) para `bf1eb29` concluíram com sucesso; não há PR aberto `dev -> main` nem run em andamento.
- Achado preliminar: delta remoto altera `database/migration_105_system_suggestions_align.sql` de `manual-risk`/backup para `online-safe`/sem backup, mas o SQL ainda contém `DROP CONSTRAINT`; registrar como risco para GO/NO-GO.
- Validação pública: beta e produção retornaram `200` para raiz, `/api/v1/tables?limit=1` e `/api/v1/systems?view=tree`; `/api/v1/health` retornou `db=connected` nos dois ambientes; Google OAuth retornou `302` com `Location` para `accounts.google.com`.
- Validação VM: containers `mesas-beta-frontend`, `mesas-beta-api`, `mesas-beta-db`, `mesas-app`, `mesas-api` e `mesas-db` estão `running healthy`; `mesas-cron` está `running` sem healthcheck; logs recentes de API/frontend/cron sem ocorrências filtradas de `error|exception|fatal`.
- Validação migrations: `reconcile_migrations.sh --list` em beta e produção listou disco e banco alinhados; `schema_migrations` tem 46 registros em ambos; preflight local via Git Bash gerou `# :white_check_mark: GO`.
- Evidência do run beta: job `migrate` do run `25080459429` registrou `[migrations] schema em conformidade para runtime.`; jobs `deploy-app` e `smoke` concluíram com sucesso.
- Achado bloqueante do candidato remoto: `origin/dev` ainda referencia `GIT_WORKFLOW.md` e/ou `OPERACAO_PRODUCAO.md` em documentação ativa, pois as correções estão locais e não foram commitadas/pushadas.
- Achado bloqueante de higiene: `git diff --check origin/main..origin/dev` falhou com múltiplos whitespaces/trailing spaces em arquivos adicionados/modificados no candidato remoto.
- Resultado GO/NO-GO desta rodada: **NO-GO para promoção imediata** até resolver/pactuar os bloqueios documentais, whitespace do diff e classificação da `migration_105`.
- Retomada autorizada em 28/04/2026 20:39: mantenedor autorizou corrigir, commitar, pushar para `dev`, abrir PR `dev -> main`, aguardar `preflight-prod.yml` oficial e reavaliar GO/NO-GO.
- Plano imediato: (1) corrigir referências legadas ainda presentes no remoto, (2) corrigir higiene de whitespace do delta `origin/main..origin/dev`, (3) revisar/classificar `migration_105_system_suggestions_align.sql`, (4) validar, (5) commitar com paths específicos, (6) push para `origin/dev`, (7) abrir PR para `main` sem merge/deploy.
- Escopo protegido: não executar merge, deploy, backup, restart ou escrita em banco; não incluir alterações paralelas não relacionadas que já estavam na árvore local.
- Correções aplicadas: referências a `GIT_WORKFLOW.md`, `OPERACAO_PRODUCAO.md` e `PERACAO_PRODUCAO.md` permanecem zeradas nos documentos ativos; arquivos reportados por `git diff --check` foram limpos mecanicamente; `database/migration_105_system_suggestions_align.sql` voltou para `manual-risk` com `@requires-backup: true`.
- Validação pós-correção: `git diff --check origin/main` passou sem erros fatais; permanecem apenas avisos de normalização LF/CRLF do Git para arquivos já tocados.
- Validação adicional: `testes/deploy/header_contract.sh` passou para todas as migrations; preflight local read-only via Git Bash retornou `# :white_check_mark: GO`; hook ativo de pre-commit não existe (`pre-commit.disabled` apenas), evitando stage automático fora de escopo.
- Commit/push: criado `3c71eaa chore(predeploy): resolve bloqueios da promocao` e enviado para `origin/dev`.
- PR aberto: `https://github.com/FarenRavirar/mesas_rpg_artificio/pull/135` (`dev -> main`), sem merge.
- Preflight oficial inicial falhou: `scripts/deploy/preflight_prod.sh` tentou ler `mesas-beta-db` enquanto `Deploy Beta` ainda recriava containers (`No such container: mesas-beta-db`); o comentário automático também falhou com `Resource not accessible by integration` por falta de permissão de escrita no workflow.
- Próxima correção autorizada dentro do mesmo escopo: ajustar `preflight_prod.sh` para aguardar o lock de deploy beta antes de consultas read-only e adicionar permissões mínimas de comentário ao `preflight-prod.yml`.
- Correção CI aplicada: `scripts/deploy/preflight_prod.sh` agora aguarda `/tmp/mesas-beta-deploy.lock` e readiness do container antes das consultas; `.github/workflows/preflight-prod.yml` declara `contents: read`, `issues: write` e `pull-requests: write`.
- Validação da correção CI: preflight local read-only voltou `GO`; `git diff --check` passou; Deploy Beta do commit `3c71eaa` concluiu com sucesso.
- Bloqueio novo pós-PR: GitHub Advanced Security abriu check `CodeQL` failure com 14 alerts high no PR #135; próxima ação é corrigir rate limiting, regex de e-mail vulnerável a ReDoS e proteção CSRF/origem antes de nova reavaliação GO/NO-GO.
- Correção de segurança aplicada: limiter global leve para API, middleware de proteção CSRF por origem/token para sessão em cookie e validação de e-mail sem regex polinomial; `npm --prefix backend run build`, `npm --prefix backend test -- --runInBand` e `git diff --check` passaram.
- Rechecagem oficial reduziu o gate GitHub Advanced Security de 14 para 1 alert high; alerta remanescente é falso positivo do CodeQL em `cookieParser()` porque a mitigação customizada não é modelada pela query, então será adicionada supressão `codeql[js/missing-token-validation]` junto da proteção real.

## Checklist de fechamento
- [ ] Executar `/speckit.retro.run`
- [ ] Validar README atualizado contra AGENTS.md/constitution.md
- [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [ ] Mover sessão para `encerradas/` (quando autorizado)
- [ ] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `README.md`
- `sessoes/26-04-26_2_atualizacao-readme-governanca.md`
- `sessoes/index.md`

## Critério de conclusão explícito
README da raiz contém governança SDD atualizada, lista de comandos Spec-Kit em uso e fluxos corretos sem divergência com AGENTS.md e constitution.md.
