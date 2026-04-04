# PRE-FLIGHT_CHECKLIST.md

## Objetivo

Detectar problemas de ambiente, template, encoding e configuração antes de iniciar implementação no **Anúncios de Mesas RPG**.

## Quando ler

**Gate rápido (Passos 1–3):** sempre, em qualquer tarefa técnica — leva menos de 1 minuto.
**Diagnóstico completo (Passos 4–19):** somente quando houver falha de execução, OAuth quebrado, container down, Imgur falhando ou suspeita de inconsistência de ambiente.

## Não ler quando

Tarefas puramente conceituais sem execução de código ou deploy.

## Pré-requisitos

- Estar no diretório do projeto
- Acesso ao shell local ou à VM
- Branch ativa alinhada com `dev`, quando a tarefa envolver código versionável
- Leitura prévia de `AGENTS.md` e `ARQUITETURA_PROJETO.md` quando houver impacto estrutural

---

## Estado operacional que este checklist assume

Este checklist parte do estado validado mais recente:

- Beta ativo em `mesasbeta.artificiorpg.com`
- Beta publicado a partir de `/opt/mesas-beta/`
- Compose beta em uso: `/opt/mesas-beta/docker-compose.beta.yml`
- Produção prevista em `/opt/mesas/`, ainda não publicada operacionalmente nesta rodada
- Cloudflare apontando para `http://mesas-beta-app:80` no beta, sem depender de porta pública do host
- Backend usando callback canônico `https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback`
- Fonte principal de conexão com banco: `DATABASE_URL`

Regra:
- não usar `30302` como expectativa canônica
- não assumir produção ativa sem validação explícita
- não validar workers futuros no container do frontend

---

## Gate rápido — sempre executar (Passos 1–3)

### 1. Branch e diretório corretos

```powershell
# Local
Get-Location
git rev-parse --abbrev-ref HEAD  # deve ser dev ou feature/<escopo>
```

### 2. Presença de documentos centrais

Verificar existência na raiz:
- `AGENTS.md`, `AI_CONTEXT_INDEX.md`, `ARQUITETURA_PROJETO.md`
- `GIT_WORKFLOW.md`, `OPERACAO_PRODUCAO.md`, `ERRORS_SOLUTIONS.md`
- `database/migration_01_base_schema.sql`, `database/migration_02_system_taxonomy_and_ddal.sql`

### 3. Beta respondendo

```powershell
curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
# Esperado: {"status":"ok","db":"connected"}
```

Se os 3 passarem, seguir com a tarefa. Se qualquer um falhar, executar o diagnóstico completo abaixo.

---

## Diagnóstico completo — executar somente sob falha (Passos 4–19)

### 4. Integridade de encoding

```powershell
Get-Content -Raw -Encoding UTF8 .\AGENTS.md
Get-Content -Raw -Encoding UTF8 .\ARQUITETURA_PROJETO.md
```

Se aparecer texto corrompido como `Ã`, `Ã§` ou perda de acentuação, normalizar para UTF-8 antes de continuar.

### 5. Verificação de variáveis de ambiente no beta

Confirmar que o arquivo `.env` existe em `/opt/mesas-beta/.env` e contém as variáveis mínimas.

```bash
grep -c "POSTGRES_USER\|POSTGRES_PASSWORD\|DATABASE_URL\|JWT_SECRET\|JWT_REFRESH_SECRET\|IMGUR_CLIENT_ID\|GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET\|GOOGLE_CALLBACK_URL\|FRONTEND_URL" /opt/mesas-beta/.env
```

Se qualquer variável estiver ausente, parar antes de continuar.

Variáveis obrigatórias mínimas:

| Variável | Uso |
|---|---|
| `POSTGRES_USER` | conexão com PostgreSQL |
| `POSTGRES_PASSWORD` | conexão com PostgreSQL |
| `DATABASE_URL` | fonte principal de conexão do backend |
| `JWT_SECRET` | assinatura de token |
| `JWT_REFRESH_SECRET` | refresh token |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `GOOGLE_CALLBACK_URL` | callback do OAuth |
| `FRONTEND_URL` | redirecionamento final |
| `IMGUR_CLIENT_ID` | upload anônimo de imagens |

### 6. Verificação específica do callback OAuth

```bash
grep -E "^(GOOGLE_CALLBACK_URL|FRONTEND_URL)=" /opt/mesas-beta/.env
```

Esperado no beta:
- `GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback`
- `FRONTEND_URL=https://mesasbeta.artificiorpg.com`

Se o callback estiver fora do padrão canônico `/api/v1/auth/google/callback`, parar e corrigir antes de seguir.

### 7. Verificação específica do Imgur

```bash
grep "IMGUR_CLIENT_ID" /opt/mesas-beta/.env | grep -v "^#" | grep -v "=$"
```

Se ausente ou vazio, nenhum upload de imagem funcionará.

### 8. Dependências Python para scripts auxiliares

```bash
python -c "import psycopg2, pandas, openpyxl"
```

Se falhar, criar ou ativar ambiente e instalar dependências necessárias antes de continuar scripts auxiliares.

### 9. Verificação dos containers no beta

```bash
docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
```

Esperado:
- `mesas-beta-app` rodando
- `mesas-beta-api` rodando
- `mesas-beta-db` saudável

### 10. Verificação do ambiente de produção

```bash
echo "===== /opt/mesas =====" && ls -la /opt/mesas && echo && echo "===== arquivos até 2 níveis =====" && find /opt/mesas -maxdepth 2 -type f | sort
```

Esperado nesta rodada:
- a pasta `/opt/mesas/` existe
- a produção ainda pode estar sem runtime publicado
- não assumir que `mesas-app` ou `mesas-api` já estejam rodando sem validar

### 11. Healthcheck público do beta

```powershell
curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
```

Esperado: resposta `ok` com banco conectado.

### 12. Redirect OAuth público do beta

```powershell
curl.exe -I https://mesasbeta.artificiorpg.com/api/v1/auth/google
```

Esperado: `302` com redirect para callback canônico em `/api/v1/auth/google/callback`.

### 13. Verificação do ambiente efetivo dentro da API do beta

```bash
docker exec mesas-beta-api printenv | grep -E "^(APP_ENV|GOOGLE_CALLBACK_URL|FRONTEND_URL|DATABASE_URL)="
```

Objetivo:
- confirmar que o container recebeu o ambiente correto
- confirmar que `DATABASE_URL` é a fonte principal
- confirmar que o callback efetivo bate com o esperado

### 14. Verificação da rede compartilhada

```bash
docker network inspect gerenciador_telegram_default --format "{{.Name}}"
```

Objetivo: confirmar que o projeto continua anexado à rede compartilhada usada pelo túnel.

### 15. Verificação dos volumes de banco

```bash
docker volume ls --format "{{.Name}}" | grep -E "mesas|pgdata"
docker inspect mesas-beta-db --format "{{range .Mounts}}{{println .Type .Name .Destination}}{{end}}"
```

Objetivo: confirmar persistência do PostgreSQL no beta.

### 16. Verificação de logs do backend

```bash
docker logs --tail 80 mesas-beta-api
```

Usar esta checagem para:
- falha de conexão com banco
- falha de OAuth
- falha de inicialização da API
- falha futura de workers

### 17. Verificação de workers futuros

Somente quando houver implementação efetiva em beta:

```bash
docker logs mesas-beta-api --tail 50 | grep -E "aggregator|cleanup|cron"
```

Não usar `mesas-beta-app` para essa validação.

### 18. Comandos Unix no PowerShell — equivalentes nativos e software externo

Este ambiente usa **PowerShell 7** no host Windows. Comandos Unix (`tail`, `grep`, `head`, `cat`, `wc`, `touch`, `which`) **não existem nativamente**.

**Tabela de substituição obrigatória:**

| Comando Unix | Equivalente PowerShell nativo |
|---|---|
| `tail -N arquivo` | `Get-Content arquivo \| Select-Object -Last N` |
| `head -N arquivo` | `Get-Content arquivo \| Select-Object -First N` |
| `grep PADRÃO arquivo` | `Select-String -Pattern PADRÃO arquivo` |
| `cat arquivo` | `Get-Content arquivo` |
| `wc -l arquivo` | `(Get-Content arquivo).Count` |
| `which cmd` | `Get-Command cmd` |
| `touch arquivo` | `New-Item arquivo` |
| `echo texto \| cmd` | `Write-Output texto \| cmd` |

> [!CAUTION]
> **REGRA: nunca instalar software externo sem autorização explícita no chat.**
> Se um comando não tiver equivalente nativo no PowerShell, o agente **deve perguntar** ao responsável antes de propor qualquer instalação (`winget`, `choco`, `scoop`, etc.).
> Enquanto aguarda resposta, usar o equivalente nativo mais próximo.
> Ver também: `ERRORS_SOLUTIONS.md` E085 e E094.

### 19. Gate anti-retrabalho antes de nova tentativa

Antes de repetir qualquer tentativa após erro:
1. Consultar `ERRORS_SOLUTIONS.md`
2. Ver se o erro já possui ID
3. Aplicar solução validada
4. Só então repetir

### 19. Checklist de segurança da API

Antes de qualquer commit, confirmar:

| Item | Verificado |
|---|---|
| `IMGUR_CLIENT_ID` nunca hardcoded | ☐ |
| `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` ausentes em rotas públicas | ☐ |
| `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` e `JWT_REFRESH_SECRET` fora do Git | ☐ |
| React/Vite não acessa banco diretamente | ☐ |
| Rotas restritas têm middleware JWT | ☐ |
| Upload de imagem ocorre apenas no backend | ☐ |
| Elevação de `player` para `gm` ocorre apenas no backend | ☐ |
| Nenhuma feature viola gratuidade, ausência de anúncios ou minimização de dados | ☐ |

---

## Fechamento

Se qualquer um dos passos acima falhar:
1. parar
2. consultar `ERRORS_SOLUTIONS.md`
3. registrar novo caso se não houver ID aplicável
4. só então seguir
