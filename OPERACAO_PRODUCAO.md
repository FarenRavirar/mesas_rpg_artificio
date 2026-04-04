# OPERACAO_PRODUCAO.md

Guia operacional dos ambientes beta e produção no Oracle para o **Anúncios de Mesas RPG** (`mesas_rpg_artificio`).

## Objetivo

Definir o runbook de operação para deploy, validação e diagnóstico da aplicação fullstack (React + Node.js + PostgreSQL).

---

## Estado atual dos ambientes

O estado operacional validado mais recente é o seguinte:

- Beta ativo em `mesasbeta.artificiorpg.com`
- Pasta remota beta: `/opt/mesas-beta/`
- Compose beta em uso: `/opt/mesas-beta/docker-compose.beta.yml`
- Containers beta esperados: `mesas-beta-app`, `mesas-beta-api`, `mesas-beta-db`
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

## 1. Ambientes

| Ambiente | Branch | Pasta no servidor | Containers principais | Exposição atual | URL |
|---|---|---|---|---|---|
| Beta | `dev` | `/opt/mesas-beta/` | `mesas-beta-app`, `mesas-beta-api`, `mesas-beta-db` | Cloudflare Tunnel para `http://mesas-beta-app:80`, sem porta pública no host | `mesasbeta.artificiorpg.com` |
| Produção | `main` | `/opt/mesas/` | `mesas-app`, `mesas-api`, `mesas-db` | Publicação prevista para `http://mesas-app:80` via Cloudflare; runtime ainda não publicado | `mesas.artificiorpg.com` |

---

## 2. Deploy automático (único caminho válido)

O deploy ocorre exclusivamente via GitHub Actions:
- Push autorizado em `dev` -> `deploy-beta.yml` -> ambiente beta
- Push autorizado em `main` -> `deploy-production.yml` -> ambiente produção

Comandos remotos atualmente esperados no workflow:

```bash
# Beta
set -e
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml up -d --build --remove-orphans
sleep 10
docker compose -f docker-compose.beta.yml ps
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-app
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-api
docker image prune -f

# Produção
set -e
cd /opt/mesas
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
sleep 10
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-app
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-api
docker image prune -f
```

O que o agente NUNCA deve fazer no Oracle:
- Alterar manualmente arquivos versionados em `/opt/mesas-beta/` ou `/opt/mesas/` como fluxo padrão de deploy
- Rodar `npm install` ou `npm run build` diretamente na VM como substituto do workflow
- Criar novo túnel Cloudflare ou container `cloudflared` paralelo
- Forçar `docker compose down` como padrão sem autorização explícita

O que o agente PODE fazer para diagnóstico read-only:
```bash
# Beta
docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
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
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
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
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api
   ```
7. Quando houver workers futuros efetivamente ativos, validar nos logs da API:
   ```bash
   docker logs mesas-beta-api --tail 30 | grep -E "aggregator|cleanup|cron"
   ```

### Produção (`main`)
1. Confirmar conclusão do run no GitHub Actions:
   ```bash
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
   ```
2. Confirmar se a publicação operacional em produção já existe antes de validar URL pública
3. Após a primeira publicação operacional, testar:
   - `https://mesas.artificiorpg.com`
   - healthcheck equivalente de produção
   - login via Google OAuth
   - containers de produção
4. Logs de produção, quando houver runtime publicado:
   ```bash
   docker compose -f /opt/mesas/docker-compose.prod.yml ps
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api
   ```

---

## 5. Diagnóstico de incidentes

| Sintoma | Causa provável | Solução inicial |
|---|---|---|
| `502 Bad Gateway` | Container offline, erro na API ou destino incorreto no Cloudflare | Verificar `docker compose ps`, logs da app e da API, e o target do hostname no Cloudflare |
| `404 Not Found` | Build frontend ausente, rota errada ou rsync incompleto | Verificar logs do workflow e logs do container `mesas-beta-app` ou `mesas-app` |
| Site desatualizado | Cache de navegador agressivo ou deploy não concluído | Hard refresh e conferência do run no GitHub Actions |
| API não sobe | Falha de conexão com PostgreSQL ou variável ausente | Verificar `.env`, `DATABASE_URL` e logs do container da API |
| Healthcheck falha com `Invalid URL` | `DATABASE_URL` montada incorretamente com caractere especial na senha | Consultar `ERRORS_SOLUTIONS.md` E086 |
| OAuth falha | Callback divergente entre ambiente, compose e runtime | Validar `GOOGLE_CALLBACK_URL` e consultar `ERRORS_SOLUTIONS.md` correspondente |
| Worker futuro silencioso | Circuit breaker ativo ou dependência externa indisponível | Verificar logs da API e consultar `ERRORS_SOLUTIONS.md` |

### 5.1 Nota sobre nomes de containers

Atualmente os nomes canônicos esperados são:
- Beta app: `mesas-beta-app`
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
| `mesasbeta.artificiorpg.com` | `http://mesas-beta-app:80` | Beta ativo |
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

Quando houver workers futuros efetivamente ativos, o agendamento seguirá `AGGREGATOR_CRON_SCHEDULE` definido no ambiente.

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

> Sempre seguir este playbook antes de qualquer push para `main`.
> Autorização explícita do responsável é obrigatória antes de iniciar.

### 10.1 Objetivo da promoção

- Promover para produção apenas código validado no beta
- Preservar o isolamento entre beta e produção
- Evitar divergência entre ambiente remoto e fluxo versionado

### 10.2 Checklist de GO/NO-GO

1. Confirmar autorização explícita no chat
2. Confirmar branch candidata e divergência entre refs
3. Confirmar build local aplicável sem erro
4. Confirmar que a produção está pronta para primeira publicação, quando for o caso
5. Confirmar que não haverá sobrescrita indevida de `.env` remoto
6. Confirmar que a validação do beta foi concluída

### 10.3 Comandos de referência

```bash
git rev-parse --abbrev-ref HEAD
git rev-list --left-right --count origin/main...origin/dev
git worktree list
```

### 10.4 Regra final

- Sem autorização explícita, não promover
- Sem validação do beta, não promover
- Sem consistência documental mínima, não promover
