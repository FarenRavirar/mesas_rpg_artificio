# GIT_WORKFLOW.md

Protocolo de Git para o repositório `mesas_rpg_artificio`.

Objetivo: manter rastreabilidade total, evitar commits diretos em `main` e garantir deploy confiável via GitHub Actions.

---

## ⚠️ PROJETO NOVO — INFRAESTRUTURA AINDA NÃO CONFIGURADA

Este repositório é um **projeto criado do zero**. Ao contrário do Grande Glossário de RPG, aqui **não existe** infraestrutura prévia herdada.

As seguintes etapas ainda precisam ser executadas manualmente pelo responsável antes de qualquer deploy funcionar:

### Na Oracle (VM)

- [ ] Criar pasta `/opt/mesas-beta/` e `/opt/mesas/`
- [ ] Criar arquivo `.env` em cada pasta com as variáveis obrigatórias (ver `PRE-FLIGHT_CHECKLIST.md` passo 5)
- [ ] Criar `docker-compose.beta.yml` em `/opt/mesas-beta/`
- [ ] Criar `docker-compose.prod.yml` em `/opt/mesas/`
- [ ] Configurar novo Public Hostname no painel Cloudflare apontando para `http://mesas-beta-app:80` (beta) e `http://mesas-app:80` (produção), aproveitando o túnel existente — **nunca criar novo túnel**
- [ ] Confirmar que a porta `30302` está disponível na VM (não conflita com outros projetos)
- [ ] Adicionar chave SSH do GitHub Actions à VM (ou reutilizar a já configurada para o Glossário, se aplicável)

### No GitHub

- [ ] Criar repositório `mesas_rpg_artificio` na conta `FarenRavirar`
- [ ] Criar branch `dev` como branch padrão de desenvolvimento
- [ ] Configurar Secrets do repositório:
  - `SSH_PRIVATE_KEY` — chave SSH para acesso à VM Oracle
  - `SSH_HOST` — IP ou hostname da VM
  - `SSH_USER` — usuário SSH
- [ ] Criar arquivo `.github/workflows/deploy-beta.yml` (trigger: push em `dev`)
- [ ] Criar arquivo `.github/workflows/deploy-production.yml` (trigger: push em `main`)
- [ ] Proteger branch `main`: exigir PR, sem commits diretos

Enquanto qualquer item acima estiver pendente, **não executar push para `dev` ou `main`**.

---

## 1. Estrutura de branches

| Branch | Finalidade | Deploy automático |
|---|---|---|
| `main` | Produção estável. Nunca recebe commits diretos. | `deploy-production.yml` → `mesas.artificiorpg.com` |
| `dev` | Branch de desenvolvimento e homologação (beta). | `deploy-beta.yml` → `mesasbeta.artificiorpg.com` |
| `feature/<escopo>` | Trabalho em curso. Criada a partir de `dev`. | Nenhum deploy automático. |

---

## 2. Infraestrutura de deploy

| Ambiente | Branch | Workflow | Pasta no servidor | Container | Porta |
|---|---|---|---|---|---|
| Beta | `dev` | `deploy-beta.yml` | `/opt/mesas-beta/` | `mesas-beta-app` | `30302` |
| Produção | `main` | `deploy-production.yml` | `/opt/mesas/` | `mesas-app` | sem porta pública (via Cloudflare) |

O deploy é feito via **rsync + SSH** pelo GitHub Actions para a VM Oracle, seguido de rebuild Docker.

---

## 3. Fluxo de trabalho

### 3a. Fluxo padrão (feature branch — para escopos isolados)

1. **Criar branch:** `feature/<escopo>` a partir de `dev`.
2. **Desenvolver:** Commits pequenos e descritivos em português.
3. **Merge squash para dev:**
   ```bash
   # Execute no worktree onde a branch dev estiver anexada.
   # Se houver bloqueio por worktree (erro E071), use git -C <path-do-worktree>.
   git merge --squash feature/<escopo>
   git commit -m "tipo: descrição"
   ```
4. **Push para beta (requer autorização explícita do responsável):**
   ```bash
   # A partir da branch local de release alinhada com dev
   git push origin HEAD:dev
   # → dispara deploy-beta.yml automaticamente
   ```
5. **Validar em:** `mesasbeta.artificiorpg.com`

### 3b. Promoção para produção (requer autorização explícita)

Somente quando o responsável autorizar explicitamente.

Antes do push para `main`, executar o checklist canônico de promoção em `OPERACAO_PRODUCAO.md` seção **Playbook Canônico de Promoção `dev` → `main`**.

> **⚠️ Restrição condicional de worktree:** se `git checkout main`/`git checkout dev` estiver bloqueado por worktree (E071), usar push por refspec:

```bash
# A partir da branch de release alinhada com dev
git push origin HEAD:main
# → dispara deploy-production.yml automaticamente
```

Verificar estado dos worktrees antes de operar: `git worktree list`

> **Regra de ouro:** NUNCA fazer commit direto em `main`. Sempre promover via `git push origin HEAD:main` a partir da branch de release alinhada com `dev`, após validação no beta.

---

## 4. Regra pétrea de push (custos e CI/CD)

> [!CAUTION]
> Agentes **NUNCA** devem realizar `git push` para `dev` ou `main` sem pedir autorização explícita ao usuário no chat primeiro. Push em qualquer dessas branches dispara deploy automático e consome recursos de CI/CD.

---

## 5. Regras de segurança

- **NUNCA** commitar arquivos `.xlsx` grandes (usar script local para gerar JSON ou importar via painel admin).
- **NUNCA** commitar pastas `node_modules` ou `dist`.
- **NUNCA** commitar chaves SSH ou arquivos `.env`.
- **NUNCA** commitar o valor real de `IMGUR_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ou `JWT_SECRET` — usar `.env.example` com placeholders.
- Deploy manual no servidor é **estritamente proibido** para evitar divergências de configuração.

---

## 6. Comandos de deploy (GitHub Actions)

O que o Actions faz automaticamente no servidor (beta como exemplo):

```bash
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml down
docker compose -f docker-compose.beta.yml build --no-cache
docker compose -f docker-compose.beta.yml up -d
```

Para produção, usa `docker-compose.prod.yml` em `/opt/mesas/`.

---

## 7. Validação pós-deploy

Após o deploy, o Agente DEVE validar:

1. Status do run no GitHub Actions:
   ```bash
   gh run list --limit 5
   # Nota: usar sem --branch (não suportado nesta versão do gh na VM)
   ```
2. Acesso à URL correspondente ao ambiente deployado.
3. Logs do container em caso de erro:
   ```bash
   # Beta
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
   # Produção
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
   ```
4. Verificar que AggregatorBot e CleanupWorker inicializaram corretamente:
   ```bash
   docker logs mesas-beta-app --tail 30 | grep -E "aggregator|cleanup|cron"
   ```

---

## 8. Limitações conhecidas do ambiente (VM Oracle)

Ver `ERRORS_SOLUTIONS.md` E055 e E056. Comando canônico de validação de CI:
```bash
gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
```

---

## 9. Status de execução (obrigatório informar ao usuário)

- Alteração local: SIM|NÃO
- Commit: SIM|NÃO
- Push autorizado: SIM|NÃO
- Deploy acionado: SIM|NÃO
- Deploy concluído: SIM|NÃO
- Validação pós-deploy: SIM|NÃO

---

## 10. Fila de ajustes (modo rápido)

Para múltiplos ajustes em sequência na mesma sessão, o Agente pode acumular até 3 commits antes do push, sempre informando ao usuário o que foi acumulado. Ao final, solicitar autorização para `push origin dev` único.
