# GIT_WORKFLOW.md

Protocolo de Git para o repositório `mesas_rpg_artificio`.

Objetivo: manter rastreabilidade total, evitar commits diretos em `main` e garantir deploy confiável via GitHub Actions.

---

## Estado atual da infraestrutura de deploy

Este repositório já possui base operacional validada para o ambiente beta.

Estado atual confirmado:
- Beta ativo em `mesasbeta.artificiorpg.com`
- Pasta remota beta: `/opt/mesas-beta/`
- Compose beta em uso: `/opt/mesas-beta/docker-compose.beta.yml`
- Produção prevista em `mesas.artificiorpg.com`, com pasta remota `/opt/mesas/`
- Produção ainda não publicada operacionalmente nesta rodada
- Exposição pública via Cloudflare Tunnel apontando para os containers internos, sem depender de porta pública do host
- Workflow beta e workflow de produção existentes e endurecidos
- O `.env` remoto é persistido fora do repositório e não deve ser sobrescrito por rsync

Regras operacionais:
- Não tratar mais este projeto como infraestrutura inicial pendente
- Não usar `30302` como referência canônica de beta
- Não criar novo túnel Cloudflare
- Não fazer deploy manual no servidor

---

## 1. Estrutura de branches

| Branch | Finalidade | Deploy automático |
|---|---|---|
| `main` | Produção estável. Nunca recebe commits diretos. | `deploy-production.yml` para `mesas.artificiorpg.com`, quando a publicação operacional em produção estiver ativa |
| `dev` | Branch de desenvolvimento e homologação (beta). | `deploy-beta.yml` para `mesasbeta.artificiorpg.com` |
| `feature/<escopo>` | Trabalho em curso. Criada a partir de `dev`. | Nenhum deploy automático |

---

## 2. Infraestrutura de deploy

| Ambiente | Branch | Workflow | Pasta no servidor | Container público | Exposição atual |
|---|---|---|---|---|---|
| Beta | `dev` | `deploy-beta.yml` | `/opt/mesas-beta/` | `mesas-beta-app` | Cloudflare Tunnel para `http://mesas-beta-app:80`, sem porta pública no host |
| Produção | `main` | `deploy-production.yml` | `/opt/mesas/` | `mesas-app` | Cloudflare prevista para `http://mesas-app:80`; runtime ainda não publicado |

O deploy é feito validando as credenciais Git com token no GitHub Actions diretamente para a VM Oracle que clona as branches mais recentes e emite builds forçados sem cache (com tempo de shutdown e aguardo do DB) localmente.

---

## 3. Fluxo de trabalho

### 3a. Fluxo padrão para escopos isolados

1. Criar branch `feature/<escopo>` a partir de `dev`.
2. Desenvolver com mudanças pequenas, reversíveis e descritivas.
3. Consolidar localmente o pacote antes de promover para `dev`.
4. Solicitar autorização explícita antes de qualquer `git push` para `dev`.
5. Validar no beta após o deploy automático.

### 3b. Merge local para `dev`

```bash
# Execute no worktree onde a branch dev estiver anexada.
# Se houver bloqueio por worktree (erro E071), use git -C <path-do-worktree>.
git merge --squash feature/<escopo>
git commit -m "tipo: descrição"
```

### 3c. Push para beta

```bash
# A partir da branch local de release alinhada com dev
git push origin HEAD:dev
# -> dispara deploy-beta.yml automaticamente
```

### 3d. Promoção para produção

Somente quando o responsável autorizar explicitamente.

Antes do push para `main`, executar o checklist canônico de promoção em `OPERACAO_PRODUCAO.md`, na seção `Playbook Canônico de Promoção dev -> main`.

Se `git checkout main` ou `git checkout dev` estiver bloqueado por worktree (E071), usar push por refspec:

```bash
git push origin HEAD:main
# -> dispara deploy-production.yml automaticamente
```

Verificar estado dos worktrees antes de operar:

```bash
git worktree list
```

Regra de ouro:
- Nunca fazer commit direto em `main`
- Sempre promover a partir de branch alinhada com `dev`
- Sempre pedir autorização explícita antes do push

---

## 4. Regra pétrea de push

> [!CAUTION]
> Agentes NUNCA devem realizar `git push` para `dev` ou `main` sem pedir autorização explícita ao usuário no chat primeiro. Push em qualquer dessas branches dispara deploy automático e consome recursos de CI/CD.

---

## 5. Regras de segurança

- NUNCA commitar arquivos `.xlsx` grandes
- NUNCA commitar `node_modules`, `dist`, caches locais ou artefatos temporários
- NUNCA commitar chaves SSH ou arquivos `.env`
- NUNCA commitar valores reais de `IMGUR_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` ou `JWT_REFRESH_SECRET`
- Deploy manual no servidor é estritamente proibido para evitar divergências de configuração
- Alterações de estado na VM fora do fluxo normal exigem autorização explícita do responsável no chat

---

## 6. Comandos de deploy executados pelo GitHub Actions

### Beta

```bash
set -euo pipefail
export GH_TOKEN="${{ secrets.GH_TOKEN }}"
cd /opt/mesas-beta
git fetch https://$GH_TOKEN@github.com/FarenRavirar/mesas_rpg_artificio.git dev
git reset --hard FETCH_HEAD

# Remover containers órfãos antigos
docker ps -a --filter "name=mesas-beta" --format "{{.Names}}" | grep -v -E "(mesas-beta-frontend|mesas-beta-api|mesas-beta-db)$" | xargs -r docker rm -f || true

docker compose -f docker-compose.beta.yml down
docker compose -f docker-compose.beta.yml build --no-cache
docker compose -f docker-compose.beta.yml up -d mesas-beta-db

# Aguardar DB ficar pronto
MAX_RETRIES=30
RETRIES=0
until docker compose -f docker-compose.beta.yml exec -T mesas-beta-db pg_isready -U admin -d mesas_rpg; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "❌ Banco não ficou pronto"
    exit 1
  fi
  sleep 3
done

# Subir resto da stack e validar
docker compose -f docker-compose.beta.yml up -d --force-recreate
sleep 20
if ! docker compose -f docker-compose.beta.yml ps | grep "mesas-beta-api" | grep -q "Up"; then
  exit 1
fi
docker compose -f docker-compose.beta.yml ps
docker image prune -f
```

### Produção

```bash
set -euo pipefail
cd /opt/mesas
git fetch origin main
git reset --hard origin/main

# Remover containers órfãos antigos
docker ps -a --filter "name=mesas-" --format "{{.Names}}" | grep -v -E "(mesas-app|mesas-api|mesas-db)$" | xargs -r docker rm -f || true

docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d mesas-db

# Aguardar DB ficar pronto
MAX_RETRIES=30
RETRIES=0
until docker compose -f docker-compose.prod.yml exec -T mesas-db pg_isready -U admin -d mesas_rpg; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "❌ Banco não ficou pronto"
    exit 1
  fi
  sleep 3
done

# Subir resto da stack e validar
docker compose -f docker-compose.prod.yml up -d --force-recreate
sleep 20
if ! docker compose -f docker-compose.prod.yml ps | grep "mesas-api" | grep -q "Up"; then
  exit 1
fi
docker compose -f docker-compose.prod.yml ps
docker image prune -f
```

Observações:
- O workflow real no GitHub Actions utiliza rotinas endurecidas (`set -euo pipefail`, `--no-cache`, reinicialização forçada, healthchecks síncronos).
- A sincronização agora acontece via Git diretamente na máquina alvo no momento do deploy, não por rsync.
- O arquivo `.env` remoto permanece intocado (não é atualizado via workflow).

---

## 7. Validação pós-deploy

Após o deploy, o agente deve validar:

1. Status do run no GitHub Actions:
   ```bash
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
   ```

2. Acesso à URL correspondente ao ambiente:
   - Beta: `https://mesasbeta.artificiorpg.com`
   - Produção: `https://mesas.artificiorpg.com`, somente quando houver publicação operacional

3. Healthcheck da API:
   ```bash
   curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
   ```
   Para produção, usar o endpoint equivalente somente após a publicação.

4. Logs de containers em caso de erro:
   ```bash
   # Beta
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api

   # Produção
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api
   ```

---

## 8. Limitações conhecidas do ambiente

Ver `ERRORS_SOLUTIONS.md` E055 e E056.

Comando canônico de validação de CI:

```bash
gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
```

---

## 9. Status de execução que deve ser informado ao usuário

- Alteração local: SIM|NÃO
- Commit: SIM|NÃO
- Push autorizado: SIM|NÃO
- Deploy acionado: SIM|NÃO
- Deploy concluído: SIM|NÃO
- Validação pós-deploy: SIM|NÃO

---

## 10. Fila de ajustes em modo rápido

Para múltiplos ajustes em sequência na mesma sessão, o agente pode acumular até 3 commits antes do push, sempre informando ao usuário o que foi acumulado.

Ao final:
- solicitar autorização explícita para `push origin dev`
- validar o beta após o deploy automático
- só então considerar promoção para `main`
