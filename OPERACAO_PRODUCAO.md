# OPERACAO_PRODUCAO.md

Guia operacional dos ambientes beta e produção no Oracle para o **Anúncios de Mesas RPG** (`mesas_rpg_artificio`).

## Objetivo

Definir o runbook de operação para deploy, validação e diagnóstico da aplicação fullstack (React + Node.js + PostgreSQL).

---

## 🔧 GUIA COMPLETO DE MIGRATIONS (PROCEDIMENTO DEFINITIVO)

> [!CAUTION]
> **Este é o procedimento que SEMPRE funciona.** Siga exatamente estes passos para evitar erros de caracteres, arquivos não encontrados e problemas de TTY.

### Pré-requisitos

- Acesso SSH ao servidor configurado
- Arquivo de migration criado localmente em `backend/src/db/migrations/migration_XX_nome.sql`
- Conhecimento do ambiente alvo (beta ou produção)

### Credenciais do Banco

| Ambiente | Container | Usuário | Banco |
|---|---|---|---|
| Beta | `mesas-beta-db` | `admin` | `mesas_rpg` |
| Produção | `mesas-db` | `admin` | `mesas_rpg` |

---

### PASSO 1: Conectar no Servidor

```powershell
# Método preferencial (usar sempre)
ssh -F C:\projetos\config faren
```

**Alternativas se o método acima falhar:**
```powershell
# Método 2: Chave privada explícita
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231

# Método 3: Chave padrão do sistema
ssh ubuntu@137.131.250.231
```

---

### PASSO 2: Localizar o Diretório de Migrations no Servidor

```bash
# Navegar para o projeto
cd /opt/mesas-beta

# Encontrar onde estão as migrations existentes
find . -name "migration_*.sql" -type f | head -3

# Resultado esperado (um destes):
# ./backend/src/db/migrations/migration_XX.sql
# ./database/migration_XX.sql
# ./backend/migrations/migration_XX.sql
```

**Anotar o caminho encontrado** para usar nos próximos passos.

---

### PASSO 3: Criar Diretório (Se Não Existir)

```bash
# Criar diretório de migrations (ajustar caminho conforme PASSO 2)
mkdir -p /opt/mesas-beta/backend/src/db/migrations
```

---

### PASSO 4: Sair do SSH Temporariamente

```bash
exit
```

---

### PASSO 5: Copiar Arquivo de Migration para o Servidor

```powershell
# No PowerShell local, copiar arquivo
# IMPORTANTE: Ajustar o caminho de destino conforme encontrado no PASSO 2

scp -F C:\projetos\config "c:\projetos\mesas_rpg_artificio\backend\src\db\migrations\migration_XX_nome.sql" faren:/opt/mesas-beta/backend/src/db/migrations/
```

**Resultado esperado:**
```
migration_XX_nome.sql   100%   1279   32.9KB/s   00:00
```

---

### PASSO 6: Reconectar no Servidor

```powershell
ssh -F C:\projetos\config faren
```

---

### PASSO 7: Verificar Arquivo Copiado

```bash
cd /opt/mesas-beta

# Verificar que o arquivo existe
ls -lh backend/src/db/migrations/migration_XX_nome.sql

# Visualizar conteúdo (opcional)
cat backend/src/db/migrations/migration_XX_nome.sql
```

---

### PASSO 8: Aplicar Migration no Banco

```bash
# COMANDO DEFINITIVO (sem -it, sem problemas de TTY)
cat backend/src/db/migrations/migration_XX_nome.sql | docker exec -i mesas-beta-db psql -U admin -d mesas_rpg
```

**Resultado esperado (sucesso):**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
COMMENT
COMMENT
```

**Erros comuns:**

| Erro | Causa | Solução |
|---|---|---|
| `No such file or directory` | Caminho do arquivo incorreto | Verificar PASSO 2 e ajustar caminho |
| `relation already exists` | Migration já foi aplicada | Verificar no banco (PASSO 9) |
| `syntax error` | SQL inválido | Revisar arquivo de migration |
| `the input device is not a TTY` | Uso de `-it` no comando | Remover `-it`, usar apenas `-i` |

---

### PASSO 9: Verificar Tabela Criada

```bash
# Verificar estrutura da tabela (SEM -it)
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d nome_da_tabela'

# Listar todas as tabelas
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\dt'

# Verificar índices criados
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'nome_da_tabela';"
```

---

### PASSO 10: Reiniciar Backend (Se Necessário)

**Quando reiniciar:**
- Migration adiciona/altera colunas usadas pelo backend
- Backend precisa recarregar tipos TypeScript
- Após atualizar código compilado no container

```bash
# Reiniciar apenas o backend
docker restart mesas-beta-api

# Aguardar 10 segundos
sleep 10

# Verificar logs
docker logs mesas-beta-api --tail 20
```

**Resultado esperado:**
```
Server is running on port 3000
```

---

### PASSO 11: Reconciliar Gate de Migrations (OBRIGATÓRIO)

> [!CAUTION]
> A falha neste passo causará erro de Drift Reverso (I2) e bloqueará completamente o próximo deploy automatizado do CI.

Para que o pipeline saiba que esta migration foi aplicada via hotfix manual, você deve registrar o nome dela no disco do gate de migrations.

```bash
# Ambiente beta (padrão para hotfix):
bash scripts/deploy/reconcile_migrations.sh --mark-applied migration_XX_nome.sql docker-compose.beta.yml mesas-beta-db

# Ambiente prod (apenas se hotfix foi aplicado direto em produção):
# bash scripts/deploy/reconcile_migrations.sh --mark-applied migration_XX_nome.sql docker-compose.prod.yml mesas-db
```

---

### PASSO 12: Validar Healthcheck

```bash
# Sair do SSH
exit
```

```powershell
# No PowerShell local, testar API
curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
```

**Resultado esperado:**
```json
{"status":"ok","environment":"beta","db":"connected","usersSampled":true}
```

---

### PASSO 13: Documentar Migration Aplicada

Atualizar `ambiente_atual_mesas.md` ou documentação equivalente:

```yaml
migrations_applied:
  - migration_XX_nome: true  # YYYY-MM-DD
```

---

### Troubleshooting Avançado

#### Problema: Caracteres Estranhos no Output

**Causa:** Encoding do terminal ou output muito largo.

**Solução:**
```bash
# Usar formato simplificado
docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c "SELECT COUNT(*) FROM nome_da_tabela;"
```

#### Problema: Migration Falha Parcialmente

**Causa:** Erro no meio do script SQL.

**Solução:**
```bash
# Verificar o que foi criado
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\dt'

# Reverter manualmente se necessário
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "DROP TABLE IF EXISTS nome_da_tabela CASCADE;"
```

#### Problema: Container do Banco Não Responde

**Causa:** Banco travado ou sem recursos.

**Solução:**
```bash
# Verificar status
docker ps | grep mesas-beta-db

# Verificar logs
docker logs mesas-beta-db --tail 50

# Reiniciar banco (CUIDADO: pode causar downtime)
docker restart mesas-beta-db
```

---

### Checklist Final

- [ ] Migration aplicada sem erros
- [ ] Tabela/coluna criada verificada no banco
- [ ] Índices criados (se aplicável)
- [ ] Backend reiniciado (se necessário)
- [ ] Healthcheck passou
- [ ] Documentação atualizada

---

### Comando Rápido (Para Migrations Futuras)

```bash
# Conectar
ssh -F C:\projetos\config faren

# Aplicar (ajustar caminho conforme seu ambiente)
cd /opt/mesas-beta && cat backend/src/db/migrations/migration_XX_nome.sql | docker exec -i mesas-beta-db psql -U admin -d mesas_rpg

# Verificar
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\dt nome_da_tabela'

# Sair
exit
```

---

## Estado atual dos ambientes

O estado operacional validado mais recente é o seguinte:

- Beta ativo em `mesasbeta.artificiorpg.com`
- Pasta remota beta: `/opt/mesas-beta/`
- Compose beta em uso: `/opt/mesas-beta/docker-compose.beta.yml`
- Containers beta esperados: `mesas-beta-frontend`, `mesas-beta-api`, `mesas-beta-db`
- Produção prevista em `mesas.artificiorpg.com`
- Pasta remota de produção: `/opt/mesas/`
- Compose de produção esperado: `/opt/mesas/docker-compose.prod.yml`
- Produção ainda não publicada operacionalmente nesta rodada
- Exposição pública via Cloudflare Tunnel apontando para os containers internos, sem depender de porta pública no host

Regras operacionais:
- Não tratar mais este projeto como infraestrutura inicial pendente
- Não usar `30302` como referência canônica do beta
- Não criar novo túnel Cloudflare
- Não fazer deploy manual no servidor fora do fluxo aprovado

---

## 0. Arquivos de Configuração no Servidor

### 0.1 Localização dos Arquivos `.env`

| Ambiente | Localização | Função | Observações |
|---|---|---|---|
| Beta | `/opt/mesas-beta/.env` | Variáveis de ambiente compartilhadas por todos os containers beta | **Único `.env` do beta**, não existe `/opt/mesas-beta/backend/.env` |
| Produção | `/opt/mesas/.env` | Variáveis de ambiente compartilhadas por todos os containers de produção | **Único `.env` de produção**, não existe `/opt/mesas/backend/.env` |

**Estrutura do `.env` (Beta):**
```env
# Servidor
PORT=3000
NODE_ENV=production

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@mesas-beta-db:5432/mesas_rpg

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d  # Atualizado em 04/04/2026 (era 15m)

# Frontend (origem principal + allowlist para CORS/OAuth)
FRONTEND_URL=https://mesasbeta.artificiorpg.com
FRONTEND_URLS=https://mesasbeta.artificiorpg.com,http://localhost:5173
COOKIE_SAME_SITE=none

# Frontend build-time (upload direto Cloudinary)
VITE_API_URL=https://mesasbeta.artificiorpg.com
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

**Como editar `.env` no servidor:**
```bash
ssh -F C:\projetos\config faren
nano /opt/mesas-beta/.env
# Editar → Ctrl+O → Enter → Ctrl+X
```

**Após editar `.env`, reiniciar containers:**
```bash
docker restart mesas-beta-api mesas-beta-frontend
```

---

### 0.2 Localização dos Arquivos Docker Compose

| Ambiente | Localização | Função | Observações |
|---|---|---|---|
| Beta | `/opt/mesas-beta/docker-compose.beta.yml` | Define containers beta (app, api, db) | Usado pelo workflow de deploy automático |
| Produção | `/opt/mesas/docker-compose.prod.yml` | Define containers de produção (app, api, db) | Ainda não publicado operacionalmente |

**Estrutura do Compose (Beta):**
```yaml
services:
  mesas-beta-db:
    image: postgres:15
    container_name: mesas-beta-db
    env_file: .env  # ← Lê /opt/mesas-beta/.env
    volumes:
      - pgdata_mesas_beta:/var/lib/postgresql/data
    networks:
      - mesas-beta-network

  mesas-beta-api:
    build: ./backend
    container_name: mesas-beta-api
    env_file: .env  # ← Lê /opt/mesas-beta/.env
    depends_on:
      - mesas-beta-db
    networks:
      - mesas-beta-network

  mesas-beta-frontend:
    build: ./frontend
    container_name: mesas-beta-frontend
    depends_on:
      - mesas-beta-api
    networks:
      - mesas-beta-network
```

**Nomes dos Serviços vs Nomes dos Containers:**
- **Serviços no compose:** Definidos em `services:` (ex: `mesas-beta-db`)
- **Nomes dos containers:** Definidos em `container_name:` (ex: `mesas-beta-db`)
- **Para reiniciar:** Use o **nome do container**, não o nome do serviço

**Comandos corretos:**
```bash
# ✅ CORRETO: Usar nome do container
docker restart mesas-beta-api mesas-beta-frontend

# ❌ ERRADO: Usar docker compose com nome de serviço
docker compose -f docker-compose.beta.yml restart backend frontend
# (Falha: "no such service: backend")
```

**Listar containers em execução:**
```bash
docker ps --filter 'name=mesas-beta' --format '{{.Names}}'
# Saída:
# mesas-beta-api
# mesas-beta-frontend
# mesas-beta-db
```

---


## 1. Ambientes

| Ambiente | Branch | Pasta no servidor | Containers principais | Exposição atual | URL |
|---|---|---|---|---|---|
| Beta | `dev` | `/opt/mesas-beta/` | `mesas-beta-frontend`, `mesas-beta-api`, `mesas-beta-db` | Cloudflare Tunnel para `http://mesas-beta-frontend:80`, sem porta pública no host | `mesasbeta.artificiorpg.com` |
| Produção | `main` | `/opt/mesas/` | `mesas-app`, `mesas-api`, `mesas-db` | Publicação prevista para `http://mesas-app:80` via Cloudflare; runtime ainda não publicado | `mesas.artificiorpg.com` |

---

## 2. Deploy automático (único caminho válido)

O deploy ocorre exclusivamente via GitHub Actions:
- Push autorizado em `dev` -> `deploy-beta.yml` -> ambiente beta
- Push autorizado em `main` -> `deploy-prod.yml` -> ambiente produção

Comandos remotos atualmente esperados no workflow:

```bash
# Beta
set -e
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml up -d --build --remove-orphans
until docker compose -f docker-compose.beta.yml exec -T mesas-beta-db pg_isready -U admin -d mesas_rpg; do sleep 2; done
bash ./scripts/deploy/apply_required_migrations.sh docker-compose.beta.yml mesas-beta-db
docker compose -f docker-compose.beta.yml up -d mesas-beta-api mesas-beta-frontend
sleep 10
docker compose -f docker-compose.beta.yml ps
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-frontend
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-api
docker image prune -f

# Produção
set -e
cd /opt/mesas
docker compose -f docker-compose.prod.yml up -d mesas-db
until docker compose -f docker-compose.prod.yml exec -T mesas-db pg_isready -U admin -d mesas_rpg; do sleep 2; done
bash ./scripts/deploy/apply_required_migrations.sh docker-compose.prod.yml mesas-db
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans mesas-api mesas-app
sleep 10
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-app
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-api
docker image prune -f
```

Regras do gate de migrations (`apply_required_migrations.sh`):
- Aplica apenas migrations pendentes registrando em `schema_migrations`
- Usa classes explícitas:
  - `ONLINE_SAFE_MIGRATIONS` (automáticas)
  - `MANUAL_RISK_MIGRATIONS` (bloqueadas por padrão)
- Bloqueia deploy automático se houver:
  - mais pendências online-safe que `MAX_AUTO_PENDING`
  - SQL destrutivo em migration classificada como online-safe
  - migration de risco pendente sem autorização explícita (`ALLOW_MANUAL_MIGRATIONS=true`)
- Em produção, migration de risco exige backup (`PROD_BACKUP_FILE`) quando `REQUIRE_PROD_BACKUP_FOR_MANUAL=true`
- Configura proteção de lock/tempo via `LOCK_TIMEOUT` e `STATEMENT_TIMEOUT`
- Valida schema mínimo ao final (`system_suggestions.name_pt`, `scenario_suggestions`, `systems.logo_filename` e `systems.website_url`)

O que o agente NUNCA deve fazer no Oracle:
- Alterar manualmente arquivos versionados em `/opt/mesas-beta/` ou `/opt/mesas/` como fluxo padrão de deploy
- Rodar `npm install` ou `npm run build` diretamente na VM como substituto do workflow
- Criar novo túnel Cloudflare ou container `cloudflared` paralelo
- Forçar `docker compose down` como padrão sem autorização explícita

O que o agente PODE fazer para diagnóstico read-only:
```bash
# Beta
docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-frontend
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api

# Produção
docker compose -f /opt/mesas/docker-compose.prod.yml ps
docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api

# Geral
docker stats --no-stream | grep mesas
docker ps | grep mesas
```

---

## 3. Conexão SSH

**Método 1, preferencial (alias no config local):**
```powershell
ssh -F C:\projetos\config faren
```

**Método 2, fallback (chave privada explícita):**
```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231
```

**Método 3, fallback (chave padrão do sistema):**
```powershell
ssh ubuntu@137.131.250.231
```

| Método | Quando usar |
|---|---|
| `ssh -F C:\projetos\config faren` | Padrão, sempre tentar primeiro |
| `-i privada.key ubuntu@IP` | Se o config não estiver disponível |
| `ubuntu@IP` direto | Se a chave já estiver carregada no agente SSH local |

> Acesso SSH é usado principalmente para diagnóstico. Comandos read-only são permitidos; alterações de estado exigem autorização explícita no chat.

---

## 4. Validação pós-deploy

### Beta (`dev`)
1. Confirmar conclusão do run no GitHub Actions:
   ```bash
   # Disparar e aguardar — deploy leva ~100s. Aguarde antes de fazer polling.
   gh run list --workflow "Deploy Beta" --limit 1

   # Aguardar 100s antes de verificar (tempo normal de um deploy completo)
   sleep 100

   # Então verificar status
   gh run view <RUN_ID> --json status,conclusion,attempt,url
   ```
2. Confirmar acesso à URL: `https://mesasbeta.artificiorpg.com`
3. Testar healthcheck:
   ```powershell
   curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
   ```
4. Testar login via Google OAuth e fluxo principal de onboarding
5. Verificar containers:
   ```bash
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
   ```
6. Verificar logs se houver erro:
   ```bash
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-frontend
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api
   ```
7. **Parser Python e mídia Discord (REQ-20 — migration_10 pendente):**
   - Verificar se migration_10 foi aplicada:
     ```bash
     docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='tables' AND column_name IN ('is_covil','imported_expires_at');"
     ```
   - Se retornar 0 linhas, a migration_10 não foi aplicada ainda.
   - Verificar se Python está disponível no container da API:
     ```bash
     docker exec mesas-beta-api python3 --version
     ```


### Produção (`main`)
1. Confirmar conclusão do run no GitHub Actions:
   ```bash
   # Deploy de produção leva ~100s. Aguarde antes de fazer polling.
   gh run list --workflow "Deploy Production" --limit 1

   # Aguardar 100s antes de verificar (tempo normal de um deploy completo)
   sleep 100

   # Então verificar status
   gh run view <RUN_ID> --json status,conclusion,attempt,url
   ```
2. Confirmar no log da etapa de deploy a evidência do gate de migration:
   - `[migrations] schema em conformidade para runtime.`
3. Confirmar se a publicação operacional em produção já existe antes de validar URL pública
4. Após a primeira publicação operacional, testar:
   - `https://mesas.artificiorpg.com`
   - healthcheck equivalente de produção
   - login via Google OAuth
   - containers de produção
5. Logs de produção, quando houver runtime publicado:
   ```bash
   docker compose -f /opt/mesas/docker-compose.prod.yml ps
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api
   ```

### Execução controlada (apenas migrations de risco)

> [!CAUTION]
> Executar somente com autorização explícita e backup válido em produção.

```bash
# Exemplo (produção) com migration de risco liberada explicitamente
cd /opt/mesas
export ALLOW_MANUAL_MIGRATIONS=true
export REQUIRE_PROD_BACKUP_FOR_MANUAL=true
export PROD_BACKUP_FILE=/tmp/backup_YYYYMMDD_HHMMSS_pre_deploy.sql
bash ./scripts/deploy/apply_required_migrations.sh docker-compose.prod.yml mesas-db
```

---

## 5. Diagnóstico de incidentes

| Sintoma | Causa provável | Solução inicial |
|---|---|---|
| `502 Bad Gateway` | Container offline, erro na API ou destino incorreto no Cloudflare | Verificar `docker compose ps`, logs da app e da API, e o target do hostname no Cloudflare |
| `404 Not Found` | Build frontend ausente, rota errada ou rsync incompleto | Verificar logs do workflow e logs do container `mesas-beta-frontend` ou `mesas-app` |
| Site desatualizado | Cache de navegador agressivo ou deploy não concluído | Hard refresh e conferência do run no GitHub Actions |
| API não sobe | Falha de conexão com PostgreSQL ou variável ausente | Verificar `.env`, `DATABASE_URL` e logs do container da API |
| Healthcheck falha com `Invalid URL` | `DATABASE_URL` montada incorretamente com caractere especial na senha | Consultar `ERRORS_SOLUTIONS.md` E086 |
| OAuth falha | Callback divergente entre ambiente, compose e runtime | Validar `GOOGLE_CALLBACK_URL` e consultar `ERRORS_SOLUTIONS.md` correspondente |
| Worker futuro silencioso | Circuit breaker ativo ou dependência externa indisponível | Verificar logs da API e consultar `ERRORS_SOLUTIONS.md` |

### 5.1 Nota sobre nomes de containers

Atualmente os nomes canônicos esperados são:
- Beta app: `mesas-beta-frontend`
- Beta API: `mesas-beta-api`
- Beta DB: `mesas-beta-db`
- Produção app: `mesas-app`
- Produção API: `mesas-api`
- Produção DB: `mesas-db`

Sempre confirmar em runtime com:
```bash
docker ps | grep mesas
```

---

## 6. Cloudflare Tunnel

O túnel é reutilizado a partir da infraestrutura já existente na VM Oracle.

Regra:
- NUNCA criar novo túnel
- NUNCA iniciar `cloudflared` paralelo
- NUNCA pedir token de novo túnel ao usuário como caminho padrão

Novos hostnames devem aproveitar o túnel já existente e apontar para containers internos na rede Docker compartilhada.

Mapeamentos relevantes atualmente conhecidos:

| Domínio | Serviço interno | Observação |
|---|---|---|
| `mesasbeta.artificiorpg.com` | `http://mesas-beta-frontend:80` | Beta ativo |
| `mesas.artificiorpg.com` | `http://mesas-app:80` | Produção prevista, ainda não publicada nesta rodada |
| `glossariorpg.artificiorpg.com` | `http://glossario-app:80` | Glossário, não mexer sem escopo explícito |
| `glossariobeta.artificiorpg.com` | `http://glossario-beta-app:80` | Glossário beta, não mexer sem escopo explícito |
| `telegram.artificiorpg.com` | `http://web:5000` | Bot Telegram, não mexer sem escopo explícito |

---

## 7. Limitações conhecidas do `gh` na VM

Ver `ERRORS_SOLUTIONS.md` E055 e E056.

Comando canônico:
```bash
gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
```

---

## 8. Fuso horário

Logs do servidor seguem UTC.

Para correlação operacional, considerar `America/Araguaina` como referência local do projeto.

---

## 9. Outros recursos no servidor

| Item | Localização | Observação |
|---|---|---|
| `stress-test-semanal.sh` | `/opt/stress-test-semanal.sh` | Script de carga agendado; não remover sem verificar cron ativo |

### Volumes Docker esperados

| Volume lógico | Ambiente | Observação |
|---|---|---|
| `pgdata_mesas_beta` | Beta | No host, o nome real pode receber prefixo do compose |
| `pgdata_mesas_prod` | Produção | No host, o nome real pode receber prefixo do compose |

---

## 10. Playbook canônico de promoção `dev` -> `main`

> [!CAUTION]
> **AVISO CRÍTICO — NUNCA USAR `git checkout` ENTRE BRANCHES DURANTE DEPLOY**
>
> **Problema:** Ao executar `git checkout main` vindo de `dev`, o Git remove temporariamente arquivos que existem em `dev` mas não em `main` (comportamento normal). Isso causa pânico no usuário que vê arquivos importantes desaparecendo (ex: `MAPA_DE_API.md`, `map_scratch.json`, `RESUMO_EXECUCAO.md`).
>
> **Regra obrigatória para agentes:**
> - ❌ **NUNCA** executar `git checkout <outra-branch>` durante deploy
> - ❌ **NUNCA** fazer merge local (`git merge dev`)
> - ✅ **SEMPRE** usar GitHub PR: `gh pr create --base main --head dev`
> - ✅ **SEMPRE** fazer merge via GitHub: `gh pr merge <número>`
>
> **Justificativa:** Merge via GitHub evita:
> 1. Deleção temporária de arquivos (E143)
> 2. Locks de diretório no Windows (E101)
> 3. Problemas de permissão e conflitos locais
>
> **Ver:** `ERRORS_SOLUTIONS.md` E143 e E101

> Sempre seguir este playbook antes de qualquer push para `main`.
> Autorização explícita do responsável é obrigatória antes de iniciar.
>
> **IMPORTANTE:** Este playbook deve ser executado em conjunto com `PRE_DEPLOY_CHECKLIST.md` (4 fases obrigatórias: validação, migrations, backup, deploy).

### 10.1 Objetivo da promoção

- Promover para produção apenas código validado no beta
- Preservar o isolamento entre beta e produção
- Evitar divergência entre ambiente remoto e fluxo versionado

### 10.2 Checklist de GO/NO-GO

**Pré-requisito obrigatório:** Executar `PRE_DEPLOY_CHECKLIST.md` completo antes de prosseguir.

1. Confirmar autorização explícita no chat
2. Confirmar branch candidata e divergência entre refs
3. Confirmar build local aplicável sem erro
4. Confirmar que a produção está pronta para primeira publicação, quando for o caso
5. Confirmar que não haverá sobrescrita indevida de `.env` remoto
6. Confirmar que a validação do beta foi concluída

### 10.3 Comandos de referência (SEM checkout)

```bash
# Verificar divergência SEM fazer checkout
git rev-parse --abbrev-ref HEAD
git rev-list --left-right --count origin/main...origin/dev
git log origin/main..origin/dev --oneline

# Criar PR via GitHub CLI (método correto)
gh pr create --base main --head dev --title "chore: merge dev to main - descrição" --body "Detalhes do deploy"

# Fazer merge via GitHub (evita problemas locais)
gh pr merge <número> --merge --delete-branch=false
```

### 10.4 Regra final

- Sem autorização explícita, não promover
- Sem validação do beta, não promover
- Sem consistência documental mínima, não promover
- **Sem GitHub PR, não promover** — NUNCA fazer merge local
- **Sem validação de isolamento beta, não promover** — obrigatório validar que beta continua 200 após deploy de produção (E144)

### 10.5 Validação pós-deploy obrigatória (produção + beta)

Após qualquer deploy em produção, executar imediatamente:

```bash
# Produção deve responder 200
curl -s -o /dev/null -w "%{http_code}" https://mesas.artificiorpg.com
curl -s https://mesas.artificiorpg.com/api/v1/health
curl -s -o /dev/null -w "%{http_code}" "https://mesas.artificiorpg.com/api/v1/tables?limit=1"
curl -s -o /dev/null -w "%{http_code}" "https://mesas.artificiorpg.com/api/v1/systems?view=tree"
curl -s -D /tmp/prod_oauth.headers -o /dev/null -w "%{http_code}" "https://mesas.artificiorpg.com/auth/google?frontend_redirect=https%3A%2F%2Fmesas.artificiorpg.com"
grep -i '^location: https://accounts.google.com/o/oauth2/v2/auth' /tmp/prod_oauth.headers

# Beta deve permanecer online (isolamento)
curl -s -o /dev/null -w "%{http_code}" https://mesasbeta.artificiorpg.com
curl -s https://mesasbeta.artificiorpg.com/api/v1/health
curl -s -o /dev/null -w "%{http_code}" "https://mesasbeta.artificiorpg.com/api/v1/tables?limit=1"
curl -s -o /dev/null -w "%{http_code}" "https://mesasbeta.artificiorpg.com/api/v1/systems?view=tree"
curl -s -D /tmp/beta_oauth.headers -o /dev/null -w "%{http_code}" "https://mesasbeta.artificiorpg.com/auth/google?frontend_redirect=https%3A%2F%2Fmesasbeta.artificiorpg.com"
grep -i '^location: https://accounts.google.com/o/oauth2/v2/auth' /tmp/beta_oauth.headers

# Containers beta devem continuar ativos
ssh -F C:\projetos\config faren "docker ps --filter name=mesas-beta --format 'table {{.Names}}\t{{.Status}}'"

# Frontend deve estar healthy nos dois ambientes
ssh -F C:\projetos\config faren "docker inspect mesas-app --format '{{.State.Health.Status}}'"
ssh -F C:\projetos\config faren "docker inspect mesas-beta-frontend --format '{{.State.Health.Status}}'"
```

**Critério de sucesso:**
- Produção: HTTP 200 + health `status: ok`
- Beta: HTTP 200 + health `status: ok`
- `GET /api/v1/tables?limit=1` retorna `200` em produção e beta
- `GET /api/v1/systems?view=tree` retorna `200` em produção e beta
- `GET /auth/google?frontend_redirect=...` retorna `302` com `Location` apontando para `https://accounts.google.com/o/oauth2/v2/auth` em produção e beta
- Containers beta (`mesas-beta-frontend`, `mesas-beta-api`, `mesas-beta-db`) continuam ativos
- Frontends `mesas-app` e `mesas-beta-frontend` com health `healthy` (E145)

**Se beta cair após deploy de produção:**
1. Registrar incidente `E144` em `ERRORS_SOLUTIONS.md`
2. Recuperar beta imediatamente (`docker compose -f docker-compose.beta.yml up -d --force-recreate`)
3. Corrigir workflow antes do próximo deploy

**Se frontend ficar `unhealthy` com HTTP 200 externo (E145):**
1. Inspecionar healthcheck do container: `docker inspect <container> --format '{{json .State.Health}}'`
2. Se erro for `Connecting to localhost:80 ([::1]:80) ... Connection refused`, ajustar compose para `http://127.0.0.1:80`
3. Recriar somente frontend (`docker compose -f <compose> up -d --force-recreate <frontend>`) e revalidar health

**Se rotas críticas falharem com containers `healthy` (E150):**
1. Executar `docker restart` apenas no frontend do ambiente afetado (`mesas-app` ou `mesas-beta-frontend`)
2. Aguardar frontend voltar para `healthy`
3. Reexecutar as validações de `tables`, `systems?view=tree` e `auth/google` imediatamente
4. Se persistir falha após segunda tentativa, tratar deploy como falho e coletar logs de frontend/API

---

## 11. Heurísticas de Usabilidade (10 Heurísticas de Nielsen)

> [!IMPORTANT]
> **REGRA OBRIGATÓRIA:** Toda nova funcionalidade de interface deve respeitar as 10 heurísticas de usabilidade de Jakob Nielsen desde o design inicial. Interfaces que violam essas heurísticas devem ser rejeitadas ou corrigidas antes do merge.

### 11.1 Visibilidade do Status do Sistema

**Princípio:** O sistema deve sempre manter os usuários informados sobre o que está acontecendo, através de feedback apropriado em tempo razoável.

**Aplicação prática:**
- Indicadores de carregamento durante requisições assíncronas
- Feedback visual ao salvar/publicar mesas (spinner, mensagem de sucesso)
- Breadcrumbs ou indicador de posição no fluxo de onboarding
- Status de aprovação/rejeição visível em sugestões de sistemas
- Badge de contador em notificações não lidas

**Exemplo negativo:** Botão "Publicar Mesa" que não mostra feedback enquanto processa, deixando o usuário sem saber se clicou corretamente.

**Exemplo positivo:** Playlist do YouTube mostra qual vídeo está sendo reproduzido, quais já foram assistidos e quais vêm a seguir.

---

### 11.2 Compatibilidade entre o Sistema e o Mundo Real

**Princípio:** O sistema deve falar a linguagem do usuário, com palavras, frases e conceitos familiares, ao invés de jargão técnico. Seguir convenções do mundo real, fazendo a informação aparecer em ordem natural e lógica.

**Aplicação prática:**
- Usar "Mestre" ao invés de "GM" ou "Dungeon Master" quando o contexto for brasileiro
- Ícones reconhecíveis (lupa para busca, sino para notificações, engrenagem para configurações)
- Linguagem natural em mensagens de erro ("Você precisa preencher o título da mesa" ao invés de "Campo 'title' é obrigatório")
- Termos do universo RPG que a comunidade já conhece

**Exemplo negativo:** Modal de revisão de candidatos mostrando JSON bruto ao invés de campos formatados.

**Exemplo positivo:** Usar ícone de d20 para representar sistemas de RPG, megafone para "Apenas Anunciante".

---

### 11.3 Controle e Liberdade para o Usuário

**Princípio:** Usuários frequentemente escolhem funções por engano e precisam de uma "saída de emergência" claramente marcada para sair do estado indesejado sem ter que passar por um diálogo extenso.

**Aplicação prática:**
- Botão "Cancelar" em todos os formulários
- Confirmação antes de ações destrutivas (deletar mesa, rejeitar candidato)
- Possibilidade de editar mesa após publicação
- Desfazer ações quando possível (ex: restaurar mesa deletada da lixeira)
- Fechar modais com ESC ou clicando fora

**Exemplo negativo:** Formulário de criação de mesa sem botão "Cancelar", forçando o usuário a preencher ou fechar a aba.

**Exemplo positivo:** Gmail permite recuperar e-mails deletados da lixeira.

---

### 11.4 Consistência e Padronização

**Princípio:** Usuários não devem ter que se perguntar se palavras, situações ou ações diferentes significam a mesma coisa. Seguir convenções de plataforma.

**Aplicação prática:**
- Botões de ação primária sempre na mesma cor (ex: verde para aprovar, vermelho para rejeitar)
- Layout consistente entre páginas (header, footer, navegação)
- Padrão de formulários (labels, placeholders, validação)
- Nomenclatura consistente ("Mesa" vs "Anúncio", escolher um e manter)
- Ícones com significado consistente em toda a aplicação

**Exemplo negativo:** Botão "Salvar" em uma página e "Confirmar" em outra para a mesma ação.

**Exemplo positivo:** Material Design do Google mantém padrões visuais e de interação consistentes em todos os produtos.

---

### 11.5 Prevenção de Erros

**Princípio:** Melhor do que boas mensagens de erro é um design cuidadoso que previne que o problema ocorra. Eliminar condições propensas a erro ou verificar e apresentar aos usuários uma opção de confirmação antes de se comprometerem com a ação.

**Aplicação prática:**
- Validação em tempo real de campos obrigatórios
- Desabilitar botão "Publicar" até que todos os campos obrigatórios estejam preenchidos
- Confirmação antes de deletar mesa ou rejeitar candidato
- Limitar caracteres em campos com limite (ex: título com 100 caracteres)
- Prevenir envio de formulário incompleto

**Exemplo negativo:** Permitir publicar mesa sem contato, gerando erro apenas no backend.

**Exemplo positivo:** Caixa de confirmação ao deletar arquivo no Windows.

---

### 11.6 Reconhecimento em Vez de Memorização

**Princípio:** Minimizar a carga de memória do usuário tornando objetos, ações e opções visíveis. O usuário não deve ter que lembrar informações de uma parte do diálogo para outra. Instruções de uso do sistema devem estar visíveis ou facilmente recuperáveis quando apropriado.

**Aplicação prática:**
- Dropdown de sistemas ao invés de campo de texto livre
- Autocomplete em campos de busca
- Histórico de buscas recentes
- Pré-preencher formulários com dados já conhecidos
- Mostrar preview de imagem após upload

**Exemplo negativo:** Exigir que o usuário lembre o slug exato do sistema para criar uma mesa.

**Exemplo positivo:** Salvar arquivo no Excel mostra pastas recentes e sugestões de nome baseadas no conteúdo.

---

### 11.7 Eficiência e Flexibilidade de Uso

**Princípio:** Aceleradores — invisíveis para usuários novatos — podem frequentemente acelerar a interação para usuários experientes, de modo que o sistema possa atender tanto usuários inexperientes quanto experientes.

**Aplicação prática:**
- Atalhos de teclado (Enter para enviar formulário, ESC para fechar modal)
- Ações em lote (aprovar/rejeitar múltiplos candidatos)
- Filtros avançados no catálogo para usuários experientes
- Modo de edição rápida para mestres com muitas mesas
- Botão "Aprovar" rápido vs "Revisar" detalhado para candidatos

**Exemplo negativo:** Forçar admin a revisar cada candidato individualmente sem opção de aprovação em lote.

**Exemplo positivo:** Alt+Tab, Ctrl+C/Ctrl+V, Windows+D são atalhos que aceleram tarefas comuns.

---

### 11.8 Estética e Design Minimalista

**Princípio:** Diálogos não devem conter informação irrelevante ou raramente necessária. Cada unidade extra de informação em um diálogo compete com as unidades relevantes de informação e diminui sua visibilidade relativa.

**Aplicação prática:**
- Mostrar apenas campos essenciais no card de mesa do catálogo
- Detalhes secundários em abas ou seções expansíveis
- Evitar poluição visual com informações técnicas (IDs, timestamps internos)
- Priorizar informação relevante para a decisão do usuário
- Usar hierarquia visual (tamanho, cor, espaçamento)

**Exemplo negativo:** Modal de revisão mostrando JSON bruto com todos os campos técnicos.

**Exemplo positivo:** Medium mantém interface limpa focando no conteúdo, com controles secundários discretos.

---

### 11.9 Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar-se de Erros

**Princípio:** Mensagens de erro devem ser expressas em linguagem simples (sem códigos), indicar precisamente o problema e sugerir construtivamente uma solução.

**Aplicação prática:**
- Mensagens de erro claras e acionáveis ("Título da mesa é obrigatório" ao invés de "Erro 400")
- Destacar campo com erro no formulário
- Sugerir correção ("Você quis dizer 'D&D 5e'?")
- Evitar jargão técnico em mensagens visíveis ao usuário
- Mostrar motivo de rejeição de forma clara

**Exemplo negativo:** Erro genérico "Falha ao criar mesa" sem indicar qual campo está incorreto.

**Exemplo positivo:** Formulário de cadastro do Spotify destaca campos não preenchidos e explica o que está errado.

---

### 11.10 Ajuda e Documentação

**Princípio:** Embora seja melhor que o sistema possa ser usado sem documentação, pode ser necessário fornecer ajuda e documentação. Qualquer informação deve ser fácil de buscar, focada na tarefa do usuário, listar passos concretos a serem realizados e não ser muito extensa.

**Aplicação prática:**
- Tooltips em campos complexos (ex: "O que é DDAL?")
- Link "Saiba mais" em funcionalidades avançadas
- FAQ acessível no footer
- Mensagens de ajuda contextual (ex: "Primeira vez criando uma mesa? Veja nosso guia")
- Documentação de API para desenvolvedores

**Exemplo negativo:** Usuário não sabe o que é "publisher_role" e não há explicação disponível.

**Exemplo positivo:** Aplicativos com seção "Ajuda" acessível, tutoriais interativos ou chatbot de suporte.

---

### 11.11 Checklist de Validação UX

Ao implementar ou revisar uma funcionalidade, validar:

- [ ] **H1 - Visibilidade:** Há feedback visual para todas as ações do usuário?
- [ ] **H2 - Linguagem:** A interface usa termos familiares à comunidade RPG brasileira?
- [ ] **H3 - Controle:** Usuário pode cancelar/desfazer ações facilmente?
- [ ] **H4 - Consistência:** Padrões visuais e de interação são consistentes?
- [ ] **H5 - Prevenção:** Erros comuns são prevenidos por design?
- [ ] **H6 - Reconhecimento:** Usuário não precisa memorizar informações entre telas?
- [ ] **H7 - Eficiência:** Há atalhos para usuários experientes?
- [ ] **H8 - Minimalismo:** Apenas informação essencial está visível?
- [ ] **H9 - Recuperação:** Mensagens de erro são claras e acionáveis?
- [ ] **H10 - Ajuda:** Há documentação/ajuda contextual quando necessário?

---

### 11.12 Exemplos de Violações Identificadas (REQ-17/REQ-20)

| Componente | Heurística Violada | Problema | Solução Proposta |
|---|---|---|---|
| Modal "Revisar Candidato" | H8 (Minimalismo), H6 (Reconhecimento) | Mostra JSON bruto inútil ao invés de formulário editável | Substituir por formulário de edição de mesa pré-preenchido |
| Gestão de Mesas Importadas | H7 (Eficiência) | Falta botão "Rejeitar Todas" para ações em lote | Adicionar botão de rejeição em lote |
| Gestão de Mesas Importadas | H6 (Reconhecimento) | Falta filtros de preço (Grátis/Pagas/Não Identificadas) | Adicionar filtros de preço com detecção automática |
| Formulários em geral | H5 (Prevenção) | Validação apenas no backend, sem feedback em tempo real | Implementar validação client-side com feedback visual |
| Formulário de Criação/Edição de Mesa | H6 (Reconhecimento) | Sem pré-visualização de banner e avatar do mestre | Adicionar preview inline de banner_url e avatar do mestre (REQ-20) |
| Revisão de Candidatos (GestaoPage) | H1 (Visibilidade) | Sem indicação visual de mesas do Covil do Lich | Adicionar badge "Covil do Lich" pré-detectado pelo parser Python (REQ-20) |
| AdminDevTools | H3 (Controle) | Não há controle de retenção de mesas importadas | Adicionar configuração de dias de expiração (REQ-20, migration_10) |

**Nota:** Lista será expandida durante auditoria completa (REQ-17).
