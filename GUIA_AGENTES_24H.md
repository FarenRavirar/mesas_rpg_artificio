# Guia Completo — Projeto para Agentes 24h
## Artifício Mesas RPG — Estado atual em 11/04/2026

---

## O que já está feito — não refazer

```
✅ Cline instalado no VS Code (extensão saoudrizwan.claude-dev)
✅ Cline apontando para 9router:
     Base URL: http://localhost:20128/v1
     API Key:  sk-05609... (dashboard do 9router)
✅ .clinerules/default-rules.md — regras do agente (corrigido — sem loop)
✅ .clinerules/workflows/GIT_WORKFLOW.md
✅ .clinerules/workflows/PRE_DEPLOY_CHECKLIST.md
✅ .clinerules/workflows/PRE-FLIGHT_CHECKLIST.md
✅ .cursor/mcp.json — MCP filesystem + github configurado
✅ RESUMO_EXECUCAO.md — estado persistente entre sessões
✅ .github/workflows/ci.yml — valida build em todo PR para dev
✅ .github/workflows/sync-arquitetura.yml — propõe patches de doc após merge
✅ scripts/sync-arquitetura.js — script de sync via 9router
✅ .gitattributes — normalização de quebras de linha LF/CRLF
✅ GitHub PAT criado para o MCP do github
✅ 9router rodando em http://localhost:20128
✅ Antigravity interceptado via MITM no 9router
```

---

## O que ainda falta fazer — em ordem

### Passo 1 — Adicionar critério de conclusão em cada item pendente da FILA

Abra `FILA_IMPLEMENTACAO.md` e adicione ao final da observação
de cada item com status `pendente` um critério claro:

```
Critério: npm run build passa + [o que valida que funcionou]
```

Exemplos:

Item 137 — Bug erro 500:
```
Critério: npm run build passa + curl -X POST /api/v1/gm/tables
retorna 201 (não 500)
```

Item 059 — Atalhos de teclado:
```
Critério: npm run build passa + teclas A e R funcionam
no modal de revisão em mesasbeta.artificiorpg.com/gestao
```

Sem critério de conclusão o agente não sabe quando parou
e entra em loop tentando validar indefinidamente.

---

### Passo 2 — Criar o RESUMO_EXECUCAO.md se ainda não existir

Se o arquivo ainda não existe na raiz do projeto:

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\RESUMO_EXECUCAO.md -ItemType File
```

Cole e preencha com o estado atual:

```markdown
# RESUMO_EXECUCAO.md

> Estado atual do projeto para continuidade entre sessões.
> Atualizar ao final de cada item concluído.
> Agentes: leia este arquivo imediatamente após AGENTS.md.

---

## Estado atual

**Data:** 11/04/2026
**Branch ativa:** dev
**Último item concluído:** limpeza de documentação (09/04/2026)
**Ambiente beta:** mesasbeta.artificiorpg.com — operacional

---

## Próxima ação imediata

Corrigir bugs críticos 137-139 (bloqueadores do REQ-28).
São os próximos itens pendentes de maior prioridade na FILA.

---

## Contexto crítico para o próximo agente

- Beta: mesasbeta.artificiorpg.com
- Produção: ainda não publicada
- Deploy: push em dev → Actions → beta automaticamente
- Banco: mesas_rpg (não mesas) — ver E059
- Container banco: mesas-beta-db
- Container API: mesas-beta-api
- Container frontend: mesas-beta-app
- SSH: ssh -F C:\projetos\config faren
- 9router: http://localhost:20128/v1

---

## Itens em andamento

| Item | Descrição | Status |
|------|-----------|--------|
| 137 | Bug erro 500 POST /gm/tables | pendente |
| 138 | Bug banner_url não persiste | pendente |
| 139 | Bug descrição incompleta | pendente |

---

## Última sessão

**Data:** 09/04/2026
**O que foi feito:** Limpeza de documentação
**PR:** feature/limpeza-documentos → dev (aprovado)
```

---

### Passo 3 — Adicionar secrets ROUTER_URL e ROUTER_API_KEY no GitHub

Acesse:
```
https://github.com/FarenRavirar/mesas_rpg_artificio/settings/secrets/actions
```

Clique em **New repository secret** e adicione:

| Name | Value |
|------|-------|
| `ROUTER_URL` | URL pública do 9router após ativar Tunnel |
| `ROUTER_API_KEY` | API key do dashboard do 9router |

Para pegar a API key:
```
http://localhost:20128/dashboard → Settings → API Keys
```

Para ativar o Tunnel e obter a URL pública:
```
http://localhost:20128/dashboard → API Endpoint → Tunnel → Ativar
```

A URL gerada (ex: https://xxxx.9router.com) vai em ROUTER_URL.
Isso permite que o GitHub Actions chame o 9router para o
sync-arquitetura.yml funcionar após cada merge.

---

### Passo 4 — Expor o 9router pelo Cloudflare Tunnel (alternativa ao Tunnel nativo)

Se preferir usar o Cloudflare Tunnel que já tem na Oracle,
adicione um novo Public Hostname no painel do Cloudflare:

```
Hostname: router.artificiorpg.com
Service:  http://9router:20128
```

Nesse caso o ROUTER_URL seria `https://router.artificiorpg.com`.

---

### Passo 5 — Criar a pasta /sessoes/ no projeto

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\sessoes -ItemType Directory -Force
New-Item -Path C:\projetos\mesas_rpg_artificio\sessoes\.gitkeep -ItemType File
```

O Cline cria um arquivo de sessão aqui no início de cada tarefa.
Isso garante continuidade entre sessões.

---

### Passo 6 — Commitar e fazer push de tudo

```powershell
cd C:\projetos\mesas_rpg_artificio
git add .
git commit -m "feat: setup completo de agentes 24h — Cline, CI, sync-arquitetura"
git push origin dev
```

---

## Como usar o Cline para trabalho contínuo

### Prompt inicial — cole no Cline para começar:

```
Inicie uma sessão de trabalho seguindo o .clinerules/default-rules.md.

Leia em ordem:
1. AGENTS.md (na íntegra)
2. RESUMO_EXECUCAO.md
3. FILA_IMPLEMENTACAO.md — identifique o próximo item pendente
   de maior score GUT
4. TODO_OPERACIONAL.md — entenda o REQ correspondente

Após a leitura:
- Crie o arquivo de sessão em /sessoes/
- Implemente o item
- Ao concluir, atualize os documentos e parta para o próximo
- Trabalhe em português
- Não pare para pedir confirmação exceto antes de comandos SSH na VM
- Encerre a sessão apenas quando a fila estiver vazia
```

### Como deixar rodando sem parar:

1. Abrir o VS Code com o projeto
2. Abrir o painel do Cline (ícone do robô na barra lateral)
3. Colar o prompt acima
4. Deixar o VS Code minimizado — não fechar
5. O Cline vai trabalhar até a fila ficar vazia ou encontrar bloqueio

---

## Rotina diária

### Antes de sair

```
1. FILA_IMPLEMENTACAO.md tem itens pendentes com critério de conclusão?
   → Se não: adicionar critério antes de iniciar

2. RESUMO_EXECUCAO.md está atualizado?
   → Se não: atualizar com estado atual

3. 9router está rodando?
   → Verificar: http://localhost:20128/v1/models deve retornar JSON

4. Abrir VS Code → colar prompt no Cline → minimizar
```

### Ao acordar

```
1. GitHub → Pull Requests → filtrar por base: dev
   → PRs normais: revisar diff → aprovar ou pedir changes
   → PRs com label "documentation": revisar patches em
     docs/sync-patches/ → aplicar no ARQUITETURA_PROJETO.md
     → fechar o PR

2. RESUMO_EXECUCAO.md → ver o que foi feito

3. ERRORS_SOLUTIONS.md → ver erros novos registrados

4. FILA_IMPLEMENTACAO.md → ver itens bloqueados
   → definir ação para cada bloqueio
```

---

## Estrutura de arquivos do sistema

```
C:\projetos\mesas_rpg_artificio\
│
├── .clinerules/
│   ├── default-rules.md          ← regras do Cline (corrigido — sem loop)
│   └── workflows/
│       ├── GIT_WORKFLOW.md
│       ├── PRE_DEPLOY_CHECKLIST.md
│       └── PRE-FLIGHT_CHECKLIST.md
│
├── .cursor/
│   └── mcp.json                  ← MCP filesystem + github
│
├── scripts/
│   └── sync-arquitetura.js       ← sync de doc via 9router
│
├── sessoes/                      ← histórico de sessões do Cline
│   └── .gitkeep
│
├── docs/
│   └── sync-patches/             ← patches propostos (criado automaticamente)
│
├── RESUMO_EXECUCAO.md            ← estado persistente entre sessões
├── AGENTS.md                     ← governança (prevalece sobre tudo)
├── ARQUITETURA_PROJETO.md        ← fonte de verdade técnica
├── TODO_OPERACIONAL.md           ← backlog de produto
├── FILA_IMPLEMENTACAO.md         ← fila técnica de execução
├── MAPA_DE_API.md                ← contratos de API
├── ERRORS_SOLUTIONS.md           ← memória de erros
├── .gitattributes                ← normalização LF/CRLF
│
└── .github/
    └── workflows/
        ├── deploy-beta.yml       ← já existia
        ├── deploy-production.yml ← já existia
        ├── ci.yml                ← valida build em PRs para dev
        └── sync-arquitetura.yml  ← propõe patches após merge
```

---

## Mapa de responsabilidades

| Quem | O que faz |
|------|-----------|
| Você | Define itens na FILA com critério de conclusão |
| Você | Aprova ou rejeita PRs de código |
| Você | Revisa e aplica patches de ARQUITETURA_PROJETO.md |
| Você | Define ação para itens bloqueados |
| Cline | Implementa itens da FILA sem parar |
| Cline | Atualiza FILA, TODO, MAPA_DE_API, ERRORS_SOLUTIONS, RESUMO |
| Cline | Abre PRs para dev (nunca faz merge) |
| ci.yml | Valida build em todo PR — você só vê PRs verdes |
| sync-arquitetura.yml | Propõe patches de doc após cada merge via 9router |

---

## Como funciona o sync de arquitetura

Após cada merge aprovado por você em dev:

```
sync-arquitetura.yml dispara automaticamente
         ↓
Gera diff do último merge
         ↓
sync-arquitetura.js analisa o diff
Detecta padrões:
  docker-compose → §3 Infraestrutura
  migration_     → §4 Banco de dados
  routes/auth    → §6 Autenticação
  routes/tables  → §12 Rotas de API
  imgur/upload   → §16 Imagens
         ↓
Chama 9router (ROUTER_URL) com o diff + seções afetadas
         ↓
9router roteia para o modelo configurado
         ↓
Resposta salva em docs/sync-patches/
         ↓
PR aberto com label "documentation"
         ↓
Você revisa → aplica manualmente no ARQUITETURA_PROJETO.md
```

O ARQUITETURA_PROJETO.md nunca é modificado automaticamente.
A decisão final é sempre humana.

---

## Diagrama do fluxo completo

```
FILA_IMPLEMENTACAO.md
(itens com critério de conclusão)
           ↓
   Cline lê → implementa
           ↓
    npm run build
   ↙           ↘
falha          passa
  ↓              ↓
corrige      atualiza docs
(max 3x)     (FILA, RESUMO,
  ↓           MAPA_API, etc)
falha 3x         ↓
  ↓          commit + push
registra     feature/<escopo>
ERRORS           ↓
marca        PR aberto → dev
bloqueado        ↓
próximo    ci.yml roda (build)
item         ↙       ↘
          falha       passa
            ↓           ↓
         Cline       PR verde ✓
         corrige          ↓
                  Cline → próximo item
                          ↓
                   (repete até fila vazia)
                          ↓
                  Você acorda → aprova PRs
                          ↓
                     merge em dev
                          ↓
               sync-arquitetura.yml dispara
                          ↓
               PR de doc com label documentation
                          ↓
               Você revisa patches → aplica
```

---

## Troubleshooting — problemas comuns

### Cline entra em loop após completar tarefa
**Causa:** Critério de conclusão não definido ou regra de transição ausente.
**Solução:** Verificar se o `default-rules.md` tem a seção
"Critério de conclusão da tarefa" e "Transição entre tarefas".
Usar o `default-rules.md` corrigido desta sessão.

### Cline para e pede confirmação para git push
**Causa:** Regra antiga dizia para parar antes de push.
**Solução:** O `default-rules.md` corrigido permite
`git push origin feature/*` sem autorização.

### sync-arquitetura.yml falha com erro de conexão
**Causa:** ROUTER_URL não configurado ou 9router não acessível publicamente.
**Solução:** Ativar Tunnel no dashboard do 9router e atualizar
o secret ROUTER_URL no GitHub.

### CI falha com erro de build
**Causa:** O agente commitou código que não compila.
**Solução:** O Cline deve rodar `npm run build` antes de qualquer commit.
Verificar se o `default-rules.md` tem essa regra no passo 7.

### Cline não lê os arquivos de regras
**Causa:** O arquivo está em `.clinerules/default-rules.md` mas o
Cline espera `.clinerules` como arquivo ou pasta com nome específico.
**Solução:** Verificar nas configurações do Cline qual o nome de
arquivo de regras que ele lê. Se necessário, criar um
`.clinerules` na raiz apontando para o default-rules.md.