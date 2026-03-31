# OPERACAO_PRODUCAO.md

Guia operacional dos ambientes beta e produção no Oracle para o **Anúncios de Mesas RPG** (mesas_rpg_artificio).

## Objetivo

Definir o runbook de operação para deploy, validação e diagnóstico da aplicação fullstack (React + Node.js + PostgreSQL).

---

## ⚠️ PROJETO NOVO — INFRAESTRUTURA AINDA NÃO CONFIGURADA

Este repositório é um projeto criado do zero. Nenhuma infraestrutura existe ainda. Antes de qualquer operação descrita aqui ser executável, os pré-requisitos listados em `GIT_WORKFLOW.md` (bloco de configuração inicial) precisam estar concluídos.

---

## 1. Ambientes

| Ambiente | Branch | Pasta no servidor | Container | Porta | URL |
|---|---|---|---|---|---|
| Beta | `dev` | `/opt/mesas-beta/` | `mesas-beta-app` | `30302` | `mesasbeta.artificiorpg.com` |
| Produção | `main` | `/opt/mesas/` | `mesas-app` | interna (sem exposição no host) | `mesas.artificiorpg.com` |

---

## 2. Deploy Automático (Único Caminho Válido)

O deploy ocorre exclusivamente via GitHub Actions:
- Push em `dev` → `deploy-beta.yml` → ambiente beta
- Push em `main` → `deploy-production.yml` → ambiente produção

**O que o Agente NUNCA deve fazer no Oracle:**
- Alterar arquivos manualmente em `/opt/mesas-beta/` ou `/opt/mesas/`
- Tentar rodar `npm install` ou `npm run build` na VM (feito no GitHub Runner)
- Parar ou rebuildar containers sem motivo de manutenção técnica aprovado

**O que o Agente PODE fazer para diagnóstico (SSH, read-only):**
```bash
# Beta
docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app

# Produção
docker compose -f /opt/mesas/docker-compose.prod.yml ps
docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app

# AggregatorBot / CleanupWorker (rodam dentro do container da API)
docker logs mesas-beta-app --tail=30 | grep -E "aggregator|cleanup|cron"

# Geral
docker stats --no-stream | grep mesas
```

---

## 3. Conexão SSH

**Método 1 — Preferencial (alias no config local):**
```powershell
ssh -F C:\projetos\config faren
```

**Método 2 — Fallback (chave privada explícita):**
```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231
```

**Método 3 — Fallback (chave padrão do sistema):**
```powershell
ssh ubuntu@137.131.250.231
```

| Método | Quando usar |
|---|---|
| `ssh -F C:\projetos\config faren` | Padrão — sempre tentar primeiro |
| `-i privada.key ubuntu@IP` | Se o config não estiver disponível |
| `ubuntu@IP` direto | Se a chave já estiver carregada no agente SSH local |

> Acesso SSH é usado **somente para diagnóstico (read-only)**. Para alterar estado no servidor, exige aprovação explícita no chat.

---

## 4. Validação Pós-Deploy

### Beta (`dev`)
1. Aguardar o GitHub Actions concluir (~2 minutos)
2. Confirmar run: `gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt`
3. Acessar: `mesasbeta.artificiorpg.com`
4. Testar catálogo público e filtros estruturados
5. Testar login via Google OAuth e fluxo de onboarding
6. Verificar containers: `docker ps | grep mesas-beta`
7. Verificar AggregatorBot e CleanupWorker:
   ```bash
   docker logs mesas-beta-app --tail=30 | grep -E "aggregator|cleanup|cron"
   ```

### Produção (`main`)
1. Aguardar o GitHub Actions concluir (~2 minutos)
2. Confirmar run: `gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt`
3. Acessar: `mesas.artificiorpg.com`
4. Testar catálogo, login e publicação de mesa
5. Verificar containers: `docker ps | grep mesas-app`

---

## 5. Diagnóstico de Incidentes

| Sintoma | Causa Provável | Solução |
|---|---|---|
| `502 Bad Gateway` | Container offline ou porta divergente | `docker compose up -d` no compose correto, ou validar rota no Cloudflare Tunnel |
| `404 Not Found` | Falha na cópia da pasta `dist` | Verificar logs do GitHub Actions (etapa rsync) |
| Site desatualizado | Cache de navegador agressivo | `Ctrl + F5` (Hard Refresh) |
| Erro de permissão | Ownership incorreto em `/opt` | `sudo chown -R ubuntu:ubuntu /opt/mesas-beta/` ou `/opt/mesas/` |
| Container beta sobe mas produção não | `docker-compose.prod.yml` com nome de container conflitante | Verificar `container_name` nos dois compose files |
| Migrations não aplicadas | O CI copia os arquivos SQL mas não executa no banco automaticamente | Rodar manualmente: `cat /opt/mesas-beta/database/migration_XX.sql \| docker exec -i mesas-beta-db psql -U admin -d mesas` (substituir `mesas-beta-db` por `mesas-db` em prod) |
| API Node.js não inicializa | Falha de conexão com PostgreSQL ou variável de ambiente ausente | Verificar `.env` (ver `PRE-FLIGHT_CHECKLIST.md` passo 5), depois `docker compose logs mesas-beta-app` |
| AggregatorBot silencioso | Circuit breaker ativado por falha de conexão ou fonte externa indisponível | Verificar logs com `grep aggregator`, consultar `ERRORS_SOLUTIONS.md`; bot retoma automaticamente no próximo ciclo agendado |
| CleanupWorker com erros repetidos | `deletehash` ausente no banco ou falha de rede com o Imgur | **Não tentar forçar deleção manualmente** — consultar `ERRORS_SOLUTIONS.md`; deleções no Imgur são irreversíveis |
| Upload de imagem falha com `429` | Rate limit do Imgur atingido (1250 uploads/dia) | Aguardar reset diário; verificar se há upload em loop na aplicação; monitorar `OPS-04` do `TODO_OPERACIONAL.md` |

### 5.1 Nota sobre nomes de Containers

**Atualmente o docker compose nomeia os containers da seguinte forma:**
- Beta API/App: `mesas-beta-app`
- Beta DB: `mesas-beta-db` (PostgreSQL)
- Prod API/App: `mesas-app`
- Prod DB: `mesas-db`

Sempre validar com `docker ps | grep mesas` para extrair os nomes exatos em execução.

---

## 6. Cloudflare Tunnel

O túnel é gerenciado pelo container `gerenciador_telegram-cloudflared-1` já existente na VM Oracle.

**Regra:** Agentes **NUNCA** devem criar novos túneis ou containers `cloudflared`. Novos domínios são adicionados pelo responsável via painel web do Cloudflare, adicionando um "Public Hostname" apontando para o container alvo.

| Domínio | Serviço interno | Observação |
|---|---|---|
| `mesas.artificiorpg.com` | `http://mesas-app:80` | Produção |
| `mesasbeta.artificiorpg.com` | `http://mesas-beta-app:80` | Beta |
| `glossariorpg.artificiorpg.com` | `http://glossario-app:80` | Glossário — não mexer |
| `glossariobeta.artificiorpg.com` | `http://glossario-beta-app:80` | Glossário beta — não mexer |
| `telegram.artificiorpg.com` | `http://web:5000` | Bot Telegram — não mexer |
| `code.artificiorpg.com` | `http://172.17.0.1:8080` | Code-server — não mexer |

---

## 7. Limitações conhecidas do `gh` na VM

Ver `ERRORS_SOLUTIONS.md` E055 e E056.

---

## 8. Fuso Horário

Logs do servidor seguem UTC. Para correlação de eventos, considerar horário de Brasília (`America/Araguaina` — sem horário de verão).

O AggregatorBot é agendado via `AGGREGATOR_CRON_SCHEDULE` no `.env` (padrão: `0 6 * * *` = 6h UTC, equivalente a 3h de Brasília).

---

## 9. Outros recursos no servidor

| Item | Localização | Observação |
|---|---|---|
| `stress-test-semanal.sh` | `/opt/stress-test-semanal.sh` | Script de carga agendado — não remover sem verificar se há cron ativo |

### Volumes Docker ativos (Mesas RPG)

| Volume | Usado por |
|---|---|
| `mesas-beta_pgdata_beta` | `mesas-beta-db` (beta) |
| `mesas_pgdata_prod` | `mesas-db` (produção) |

---

## 10. Playbook Canônico de Promoção `dev` → `main` (Sem Perda de Dados)

> Sempre seguir este playbook antes de qualquer push para `main`.
> Autorização explícita do responsável é obrigatória antes de iniciar.

### 10.1 Objetivo da promoção

- Publicar o código homologado no beta em produção.
- Garantir que quaisquer dados escritos em produção durante o ciclo beta sejam preservados.
- Garantir que beta e produção permaneçam isolados por ambiente (API, banco e container distintos).

### 10.2 Checklist de GO/NO-GO (obrigatório)

1. Confirmar autorização explícita no chat para promoção.
2. Confirmar branch candidata:
   ```bash
   git rev-parse --abbrev-ref HEAD
   git rev-list --left-right --count origin/main...origin/dev
   ```
3. Confirmar builds sem erro:
   - `frontend`: `npm run build`
   - `backend`: `npm run build`
4. Confirmar isolamento de ambientes:
   - Container `mesas-app` deve apontar para API de produção (`mesas-db`), nunca para `mesas-beta-db`.
5. Confirmar paridade de schema entre beta e produção (ver 10.7).
6. Confirmar plano de conciliação de dados (se produção recebeu escrita após último sync).
7. Confirmar que AggregatorBot e CleanupWorker estão com logs de ciclo recente sem erros críticos.
8. Confirmar que `IMGUR_CLIENT_ID` está no `.env` de produção e não está hardcoded em nenhum arquivo versionado.
9. Somente após todos os itens acima: promover para `main`.

Se qualquer item falhar: corrigir no mesmo ciclo e revalidar; usar **NO-GO** apenas quando a correção não for tecnicamente viável no ciclo.

### 10.3 Proteção de dados antes do cutover

Executar backup lógico dos dois bancos (beta e produção) antes da promoção:

```bash
# Produção
docker exec mesas-db pg_dump -U admin -d mesas > /tmp/mesas_prod_pre_cutover.sql

# Beta
docker exec mesas-beta-db pg_dump -U admin -d mesas > /tmp/mesas_beta_pre_cutover.sql
```

Registrar snapshot de contagem por tabela crítica:
- `users`
- `profiles`
- `gm_profiles`
- `tables`
- `table_history`
- `questions`
- `reviews`
- `imgur_cleanup_log`

### 10.4 Regra de conciliação de dados (quando produção teve escrita no período)

Se houver novos cadastros em produção durante o ciclo beta, **não descartar**:

1. Definir janela de sincronização (`LAST_SYNC_AT`) do último ponto estável.
2. Extrair deltas de produção (`created_at`/`updated_at >= LAST_SYNC_AT`).
3. Aplicar em staging e reconciliar conflitos.
4. Só então promover.

Diretrizes de reconciliação:
- `users`: conciliar por `email` (campo único via Google OAuth).
- `tables` e demais tabelas relacionais: preservar IDs e vínculos; se houver remapeamento de `gm_id` ou `user_id`, atualizar FKs de forma consistente.
- Nunca sobrescrever cegamente produção com dump beta sem conciliar deltas.

### 10.5 Aprendizados fixos (registrar a cada promoção concluída)

1. Verificar que o compose realmente usado no deploy de produção é `docker-compose.prod.yml`, nunca editar arquivo errado.
2. Validar configuração de proxy dentro do container de produção após deploy.
3. Migrations SQL **não** rodam automaticamente só com rsync — precisam de execução explícita no banco on-premise.
4. Antes do GO final, comparar ambiente público beta vs produção via endpoints de verificação e confirmar roteamento correto.
5. Confirmar que `deletehash` de imagens não vazou em nenhuma rota pública após o deploy.

### 10.6 Validação pós-promoção (produção)

1. Confirmar run do GitHub Actions:
   ```bash
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
   ```
2. Acessar `mesas.artificiorpg.com` e testar:
   - Catálogo público com filtros
   - Login via Google OAuth
   - Publicação de mesa (role `gm`)
   - Upload de imagem (cover de mesa ou avatar de mestre)
3. Verificar logs:
   ```bash
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=80 mesas-app
   ```
4. Confirmar persistência: criar mesa de teste controlada e confirmar leitura posterior.
5. Verificar AggregatorBot e CleanupWorker:
   ```bash
   docker logs mesas-app --tail=30 | grep -E "aggregator|cleanup|cron"
   ```

### 10.7 Gate Anti-Divergência de Schema (Auto-Correção Obrigatória)

> Objetivo: eliminar divergências estruturais entre beta e produção **sem interromper a promoção por padrão**.
> Regra: detectar → corrigir no mesmo ciclo → revalidar → seguir com GO.

1. Paridade de schema (`--schema-only`) obrigatória antes do push para `main`:

```bash
# Na VM (via SSH), gerar snapshots de schema
docker exec mesas-beta-db pg_dump -U admin -d mesas --schema-only --no-owner --no-privileges > /tmp/schema_beta.sql
docker exec mesas-db      pg_dump -U admin -d mesas --schema-only --no-owner --no-privileges > /tmp/schema_prod.sql

# Comparar
diff -u /tmp/schema_prod.sql /tmp/schema_beta.sql
```

Regra: se houver diferença estrutural não planejada, alinhar produção ao schema homologado no mesmo ciclo e reexecutar até ficar sem drift crítico.

2. Paridade mínima das tabelas críticas (existência) em ambos os ambientes:

```sql
SELECT
  to_regclass('public.users')               AS users_ok,
  to_regclass('public.profiles')            AS profiles_ok,
  to_regclass('public.gm_profiles')         AS gm_profiles_ok,
  to_regclass('public.systems')             AS systems_ok,
  to_regclass('public.tables')              AS tables_ok,
  to_regclass('public.table_history')       AS table_history_ok,
  to_regclass('public.table_schedules')     AS table_schedules_ok,
  to_regclass('public.table_platforms')     AS table_platforms_ok,
  to_regclass('public.table_tags')          AS table_tags_ok,
  to_regclass('public.user_preferences')    AS user_preferences_ok,
  to_regclass('public.imgur_cleanup_log')   AS imgur_cleanup_log_ok;
```

Regra: qualquer `NULL` dispara correção imediata (migration faltante) e nova validação até convergir.

3. Paridade mínima funcional (smoke API) em produção imediatamente após deploy:
   - `GET /api/v1/tables` deve retornar `200`.
   - `GET /auth/google` deve redirecionar corretamente.
   - Logs do container sem erros de conexão com o banco.
   - Confirmar que nenhuma rota pública retorna `cover_deletehash`, `avatar_deletehash` ou `banner_deletehash`.

4. Migrations de release com execução explicitamente registrada:
   - Toda migration necessária para o release deve ter comando de aplicação registrado.
   - Não assumir execução automática de SQL pelo deploy.
   - Fechar promoção com evidência de execução + validação.

5. Política de resolução de GO:
   - Se produção estiver sem migration crítica, aplicar imediatamente.
   - Reexecutar validações 1, 2 e 3.
   - Confirmada a convergência, seguir com GO.
   - Só escalar para pausa de promoção quando houver erro técnico que impeça a correção no ciclo (ex.: migration inválida ou falha irreversível).

---

## 11. Dossiê Executivo (Backend Sênior) — Estado Inicial

### 11.1 Estado atual confirmado

- Repositório `mesas_rpg_artificio` ainda **não criado** na conta `FarenRavirar`.
- Infraestrutura Oracle ainda **não configurada** (pastas, compose, `.env`, Cloudflare hostnames).
- Workflows de CI/CD ainda **não existem**.
- Nenhum código de aplicação existe ainda.

### 11.2 Pontos estruturais a observar desde o início

- Beta e produção devem ter bancos PostgreSQL independentes (`mesas-beta-db` e `mesas-db`) para isolar escrita de teste da escrita real.
- Não existe pipeline automático de CDC/sincronização entre os dois bancos — reconciliação é manual via playbook (seção 10).
- Migrations não são executadas automaticamente pelo deploy — execução é sempre explícita e registrada.
- AggregatorBot e CleanupWorker rodam dentro do mesmo container da API Node.js, via node-cron.

### 11.3 Requisitos de negócio críticos para todas as decisões

Preservar sem perda:
- usuários (`users`, `profiles`);
- perfis de mestre (`gm_profiles`);
- mesas e seu histórico (`tables`, `table_history`);
- registros de auditoria de imagens (`imgur_cleanup_log`);
- vínculos e IDs/FKs consistentes entre todas as tabelas relacionais.

### 11.4 Decisões de arquitetura já tomadas (não reverter sem autorização)

| Decisão | Justificativa |
|---|---|
| Google OAuth como único método de login | Elimina senha local, reduz superfície de ataque, alinha com mínima coleta de dados |
| Uploads e processamento de imagem exclusivamente no Backend | Segurança: `IMGUR_CLIENT_ID` e `deletehash` nunca expostos ao frontend |
| AggregatorBot no mesmo compose da API | Simplifica deploy e compartilha rede interna; overhead operacional desnecessário para escala atual |
| Dois bancos independentes (beta/prod) | Isolamento real de ambiente; reconciliação manual via playbook canônico |
| Migrations manuais e versionadas | Controle explícito sobre mudanças destrutivas; sem surpresas em produção |
