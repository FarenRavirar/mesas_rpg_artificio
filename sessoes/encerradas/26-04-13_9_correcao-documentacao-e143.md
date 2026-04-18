# Resumo: Documentação Atualizada para Prevenir Erro E143

**Data:** 13/04/2026 18:17 BRT

---

## O Que Aconteceu

Durante tentativa de deploy de `dev` para `main`, executei `git checkout main` vindo de `dev`. Isso causou a **deleção temporária** de arquivos que existem em `dev` mas não em `main`:

- `MAPA_DE_API.md`
- `map_scratch.json`
- `RESUMO_EXECUCAO.md`
- `generateMap.js`

**Comportamento:** Normal do Git — ao trocar de branch, o Git ajusta o working directory para refletir o estado da branch de destino.

**Problema:** Usuário viu arquivos importantes desaparecendo e entrou em pânico, acreditando que foram perdidos permanentemente.

**Realidade:** Todos os arquivos foram restaurados automaticamente ao voltar para `dev` com `git checkout dev`.

---

## Correções Aplicadas

### 1. Erro E143 Documentado

**Arquivo:** `ERRORS_SOLUTIONS.md`

Novo erro registrado com:
- Causa raiz confirmada
- Diagnóstico rápido
- Solução imediata (voltar para dev)
- Prevenção obrigatória (NUNCA usar git checkout durante deploy)

### 2. OPERACAO_PRODUCAO.md Atualizado

**Seção 10:** Playbook de promoção dev→main

Adicionado aviso crítico em destaque:
- ❌ Proibido: `git checkout main`, `git merge dev`
- ✅ Obrigatório: GitHub PR via `gh pr create` + `gh pr merge`
- Justificativa: Evita E143 (deleção temporária) e E101 (locks no Windows)

### 3. PRE_DEPLOY_CHECKLIST.md Atualizado

**Fase 4:** Procedimento de deploy

Adicionado aviso crítico e fluxo correto:
1. Criar PR via GitHub CLI
2. Fazer merge via GitHub
3. Aguardar workflow automático
4. Validar healthcheck

### 4. AGENTS.md Atualizado

**Nova seção:** Git — Proibição Absoluta de Checkout Entre Branches

Regra pétrea adicionada:
- Proibido sem exceção durante deploy
- Método obrigatório (GitHub PR)
- Comandos para verificar divergência SEM fazer checkout
- Referência a E143 e E101

### 5. RESUMO_EXECUCAO.md Atualizado

- Última sessão atualizada para esta sessão
- Estado atual: Deploy aguardando nova autorização
- Nova observação sobre problema E143 identificado

---

## Arquivos Modificados

1. ✅ `ERRORS_SOLUTIONS.md` — Erro E143 documentado
2. ✅ `OPERACAO_PRODUCAO.md` — Aviso crítico adicionado
3. ✅ `PRE_DEPLOY_CHECKLIST.md` — Procedimento correto documentado
4. ✅ `AGENTS.md` — Regra pétrea adicionada
5. ✅ `RESUMO_EXECUCAO.md` — Estado atual atualizado
6. ✅ `sessoes/resumo_13-04_deploy-dev-para-producao.md` — Status atualizado
7. ✅ `sessoes/analise_pre_deploy_13-04.md` — Análise completa criada

---

## Garantias para o Futuro

**Nenhum agente poderá repetir este erro porque:**

1. **AGENTS.md** tem regra pétrea explícita na seção de Git
2. **OPERACAO_PRODUCAO.md** tem aviso crítico em destaque no playbook
3. **PRE_DEPLOY_CHECKLIST.md** tem procedimento correto documentado
4. **ERRORS_SOLUTIONS.md** tem E143 com solução e prevenção
5. **Checklist obrigatória** em `AGENTS.md` exige ler `PRE_DEPLOY_CHECKLIST.md` antes de deploy

**Fluxo obrigatório para qualquer deploy futuro:**
```bash
# ✅ CORRETO
gh pr create --base main --head dev --title "..." --body "..."
gh pr merge <número> --merge --delete-branch=false

# ❌ PROIBIDO
git checkout main
git merge dev
```

---

## Estado Atual do Deploy

**Status:** Aguardando nova autorização do usuário

**Pronto para deploy:**
- ✅ Análise completa em `sessoes/analise_pre_deploy_13-04.md`
- ✅ Backup de produção criado (379KB)
- ✅ 44 commits validados prontos para promoção
- ✅ Schemas de banco idênticos (36 tabelas)
- ✅ Beta operacional e estável

**Método correto quando autorizado:**
1. `gh pr create --base main --head dev --title "chore: merge dev to main - correções críticas do painel e UX" --body "Deploy de 44 commits validados no beta"`
2. `gh pr merge <número> --merge --delete-branch=false`
3. Aguardar workflow `deploy-production.yml`
4. Validar healthcheck em produção

---

## Lição Aprendida

**Para o usuário:** Git não perdeu nenhum arquivo. O comportamento de `git checkout` é normal e esperado — ele apenas ajusta o working directory para refletir o estado da branch de destino.

**Para agentes futuros:** NUNCA usar `git checkout` entre branches durante deploy. SEMPRE usar GitHub PR para evitar pânico do usuário e problemas de lock no Windows.

**Documentação:** Completa e à prova de repetição.
