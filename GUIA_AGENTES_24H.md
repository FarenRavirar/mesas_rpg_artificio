# Guia Completo — Projeto para Agentes 24h
## Artifício Mesas RPG

> Versão final — 9router como proxy, loop autônomo, sync de arquitetura,
> CI automático e rotina diária. Todos os arquivos interligados.

---

## Visão geral do sistema

```
Você define o que fazer (FILA_IMPLEMENTACAO.md com critério de conclusão)
                    ↓
     Cursor Background Agent trabalha sem parar
                    ↓
   Lê FILA → implementa → build → push → abre PR
                    ↓
   GitHub Actions valida automaticamente (ci.yml)
                    ↓
   CI falha → agente lê erro, corrige, novo commit
   CI passa → PR verde esperando você
                    ↓
   Após cada merge aprovado por você:
     sync-arquitetura.yml roda automaticamente
     → lê diff do merge
     → chama 9router para detectar seções desatualizadas
     → abre PR separado com patches de documentação
                    ↓
   Você acorda → aprova PRs de código + revisa PRs de doc
                    ↓
   Agente pega próximo item → repete infinitamente
```

---

## Arquivos que você vai criar — onde cada um vai

```
C:\projetos\mesas_rpg_artificio\
├── .cursorrules                          ← regras do agente (Passo 3)
├── RESUMO_EXECUCAO.md                    ← estado persistente (Passo 4)
├── scripts\
│   └── sync-arquitetura.js              ← script de sync de doc (Passo 8)
├── docs\
│   └── sync-patches\                    ← patches propostos (criado automaticamente)
└── .github\
    └── workflows\
        ├── ci.yml                        ← valida build em PRs (Passo 7)
        └── sync-arquitetura.yml         ← propõe patches de doc (Passo 8)
```

---

## Passo 1 — Instalar o Cursor

Baixe em `cursor.com/download` e instale no Windows.

Após instalar, abra o projeto:
```
Arquivo → Abrir Pasta → C:\projetos\mesas_rpg_artificio
```

Configure o Cursor para usar o 9router:
```
Cursor → Settings → Models → OpenAI API Key
Base URL: http://localhost:20128/v1
API Key:  (copiar do dashboard do 9router)
Model:    (o alias do combo que você criou no 9router)
```

Para ver os modelos disponíveis no 9router:
```
http://localhost:20128/v1/models
```

---

## Passo 2 — Ativar Background Agent

No Cursor:
```
Ctrl+Shift+P → "Cursor Settings" → aba "Beta"
→ Ativar "Background Agent"
```

O Background Agent permite que o Cursor trabalhe sem você estar
na frente do computador. Roda em sessão separada e você
recebe notificações de PR no GitHub.

---

## Passo 3 — Criar o `.cursorrules`

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\.cursorrules -ItemType File
```

Cole o conteúdo:

```markdown
# Regras de operação — Artifício Mesas RPG
# AGENTS.md prevalece sobre este arquivo em conflitos de governança.
# ARQUITETURA_PROJETO.md prevalece em conflitos técnicos.

---

## Protocolo obrigatório de início de sessão

Leia nesta ordem antes de qualquer ação:
1. AGENTS.md (na íntegra)
2. RESUMO_EXECUCAO.md (estado atual e próxima ação)
3. FILA_IMPLEMENTACAO.md (próximo item com status pendente)
4. TODO_OPERACIONAL.md (REQ correspondente ao item)

Por situação específica, consulte também:
- Erro encontrado → ERRORS_SOLUTIONS.md (antes de tentar corrigir)
- Tarefa de backend ou rota → MAPA_DE_API.md
- Deploy ou produção → PRE_DEPLOY_CHECKLIST.md
- Operação na VM → OPERACAO_PRODUCAO.md
- Conflito de ambiente → PRE-FLIGHT_CHECKLIST.md

Nunca leia ARQUITETURA_PROJETO.md na íntegra.
Consulte apenas a seção indicada pelo roteamento abaixo.

---

## Roteamento de documentos por situação

| Situação | Documento | Seção |
|----------|-----------|-------|
| O que fazer (produto) | TODO_OPERACIONAL.md | — |
| Como fazer (técnico) | FILA_IMPLEMENTACAO.md | — |
| Banco, modelo de dados | ARQUITETURA_PROJETO.md | §4 |
| Roles e permissões | ARQUITETURA_PROJETO.md | §5 e §6 |
| Rotas de API | ARQUITETURA_PROJETO.md | §12 |
| Imagens e upload | ARQUITETURA_PROJETO.md | §16 |
| Ingestão e parser | ARQUITETURA_PROJETO.md | §7 |
| Decisões técnicas | ARQUITETURA_PROJETO.md | §14 |
| Erro encontrado | ERRORS_SOLUTIONS.md | — |
| Rotas existentes | MAPA_DE_API.md | — |
| Deploy e rollback | PRE_DEPLOY_CHECKLIST.md | — |
| Estado atual | RESUMO_EXECUCAO.md | — |
| Operação na VM | OPERACAO_PRODUCAO.md | — |

---

## Loop de execução autônoma

Após identificar o próximo item pendente na FILA:

1. Criar branch a partir de dev:
   git checkout -b feature/<escopo> origin/dev

2. Criar arquivo de sessão:
   /sessoes/resumo_[dia-mes]_[escopo].md
   com plano, checklist e critério de conclusão

3. Ler seção relevante de ARQUITETURA_PROJETO.md

4. Implementar com mudança mínima e incremental

5. Rodar: npm run build
   - Se falhar: ler erro, corrigir, rodar build novamente
   - Máximo 3 tentativas de correção por erro
   - Se não resolver em 3 tentativas:
     → registrar em ERRORS_SOLUTIONS.md
     → marcar item como bloqueado na FILA
     → pegar próximo item pendente

6. Atualizar documentos (ver seção "Atualização por tipo de tarefa")

7. Commit com mensagem em português seguindo Conventional Commits:
   feat: descrição da feature
   fix: descrição da correção
   docs: atualização de documentação

8. Push: git push origin feature/<escopo>

9. Abrir PR para dev com:
   - Título descritivo em português
   - Descrição do que foi feito
   - Checklist de validação
   - Referência ao item da FILA (ex: "Fecha item 059")

10. Aguardar resultado do CI (máximo 15 minutos)
    - Se CI falhar: ler logs no PR, corrigir, novo commit
    - Se CI passar: PR verde — pegar próximo item da FILA

---

## Critério de parada obrigatória

Parar completamente e registrar em ERRORS_SOLUTIONS.md quando:
- Mesmo erro ocorre 3 vezes consecutivas sem solução
- Item da FILA não tem critério de conclusão definido
- Conflito entre requisito e arquitetura não documentado
- FILA não tem mais itens com status pendente
- Qualquer operação que modifique estado na VM

---

## Atualização de documentos por tipo de tarefa

### Sempre ao concluir qualquer item:
- FILA_IMPLEMENTACAO.md → status: concluido + data
- RESUMO_EXECUCAO.md → atualizar próxima ação
- Arquivo de sessão em /sessoes/ → marcar checklist [x]

### Se rota de API foi criada, alterada ou removida:
- MAPA_DE_API.md → atualizar status da rota
- ARQUITETURA_PROJETO.md §12 → atualizar apenas trecho afetado

### Se erro novo foi encontrado e resolvido:
- ERRORS_SOLUTIONS.md → registrar com causa raiz e solução validada

### Se REQ do TODO foi concluído:
- TODO_OPERACIONAL.md → mover para Concluídos Recentes com data

### Se docker-compose ou Dockerfile foi alterado:
- ARQUITETURA_PROJETO.md §3 → atualizar apenas trecho afetado

### Se migration foi criada ou aplicada:
- ARQUITETURA_PROJETO.md §4 → atualizar lista de migrations

### Sobre o ARQUITETURA_PROJETO.md (regra especial):
O agente atualiza apenas trechos específicos quando a task
afeta diretamente uma seção documentada.
Após cada merge aprovado, o workflow sync-arquitetura.yml
roda automaticamente via 9router e propõe patches adicionais
via PR separado para revisão humana.

### Limpeza a cada 5 itens concluídos:
- FILA_IMPLEMENTACAO.md → mover lotes inteiros concluídos para seção Histórico
- TODO_OPERACIONAL.md → remover REQs em Concluídos Recentes com mais de 30 dias

---

## Regras de Git

- Branch sempre a partir de dev: feature/<escopo>
- Nunca commitar direto em dev ou main
- npm run build deve passar antes de qualquer commit
- PR sempre para dev — nunca para main
- Nunca fazer merge — apenas abrir PR verde

---

## Regras de código

- Mudança mínima — sem refactor massivo
- Mudança reversível — preferir abordagens desfazíveis
- Frontend: lógica de interface, busca, filtros
- Backend: autenticação, permissões, regras de negócio
- Python: apenas scripts de infraestrutura fora do runtime da API
- Imagens: sempre no backend, nunca no frontend
- Nunca expor IMGUR_CLIENT_ID, tokens ou credenciais
- Nome do banco: mesas_rpg (não mesas) — ver ERRORS_SOLUTIONS.md E059

---

## Proibido sem autorização explícita

- Qualquer comando SSH que modifique estado na VM
- Reiniciar containers
- Fazer merge de PR
- Modificar arquivos fora do escopo do item atual
- Criar migrations em produção
- Resolver bugs não listados na FILA
- Instalar dependências globais

---

## Permitido sem autorização

- Leitura de qualquer arquivo local
- npm run build, npm run lint, npm run test
- git status, git log, git diff
- git checkout -b feature/*, git push origin feature/*
- Abrir PR no GitHub via MCP
- docker ps, docker logs (read-only)
- curl em endpoints públicos

---

## Idioma

Toda comunicação em português.
Elementos técnicos permanecem no formato original.
```

---

## Passo 4 — Criar o `RESUMO_EXECUCAO.md`

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\RESUMO_EXECUCAO.md -ItemType File
```

Cole e preencha com o estado atual:

```markdown
# RESUMO_EXECUCAO.md

> Estado atual do projeto para continuidade entre sessões de agentes.
> Atualizar ao final de cada item concluído.
> Agentes: leia este arquivo imediatamente após AGENTS.md.

---

## Estado atual

**Data da última atualização:** 10/04/2026
**Branch ativa:** dev
**Último PR aprovado:** feature/limpeza-documentos
**Último item concluído:** Limpeza de documentação (09/04/2026)
**Ambiente beta:** mesasbeta.artificiorpg.com — operacional

---

## Próxima ação imediata

Pegar próximo item pendente na FILA_IMPLEMENTACAO.md.
Verificar bugs críticos 137-139 (bloqueadores do REQ-28).
Esses itens bloqueiam todo o fluxo de importação inteligente.

---

## Contexto crítico para o próximo agente

- Beta rodando em mesasbeta.artificiorpg.com
- Produção ainda não publicada (main existe mas não foi deployada)
- Deploy: push em dev → Actions → beta automaticamente
- git push requer GH_TOKEN configurado no workflow
- Banco PostgreSQL: nome é mesas_rpg (não mesas) — ver E059
- Container banco beta: mesas-beta-db
- Container API beta: mesas-beta-api
- Container frontend beta: mesas-beta-app
- SSH: ssh -F C:\projetos\config faren
- 9router: http://localhost:20128/v1

---

## Itens em andamento

| Item | Descrição | Status | Branch | PR |
|------|-----------|--------|--------|----|
| 137 | Bug crítico erro 500 POST /gm/tables | pendente | — | — |
| 138 | Bug banner_url não persiste | pendente | — | — |
| 139 | Bug descrição incompleta | pendente | — | — |

---

## Última sessão

**Data:** 09/04/2026
**O que foi feito:** Limpeza de documentação
**PR:** feature/limpeza-documentos → dev (aprovado)
**Pendências:** nenhuma

---

## Histórico resumido de sessões

| Data | O que foi feito |
|------|----------------|
| 09/04/2026 | Limpeza de documentação |
| 08/04/2026 | Configuração de deploy-beta.yml com GH_TOKEN |
| 05/04/2026 | REQ-18, REQ-19, REQ-24, REQ-25 implementados |
```

---

## Passo 5 — Padronizar critério de conclusão na FILA

Cada item pendente precisa de critério de conclusão explícito.
Sem isso o agente não sabe quando parou e entra em loop.

Adicione ao final da observação de cada item pendente:

**Exemplos:**

Item 137 — Bug erro 500:
```
Critério: npm run build passa + curl -X POST /api/v1/gm/tables
retorna 201 com mesa criada (verificar via SELECT no banco)
```

Item 059 — Atalhos de teclado:
```
Critério: npm run build passa + teclas A e R funcionam no
modal de revisão em mesasbeta.artificiorpg.com/gestao
```

Item 025 — Endpoints admin:
```
Critério: npm run build passa + GET /api/v1/admin/tables
retorna 200 com JWT admin + 403 com JWT player
```

---

## Passo 6 — Configurar MCP no Cursor

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\.cursor -ItemType Directory -Force
New-Item -Path C:\projetos\mesas_rpg_artificio\.cursor\mcp.json -ItemType File -Force
```

Cole o conteúdo — substitua o token pelo seu PAT atual:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\projetos\\mesas_rpg_artificio"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "SEU_TOKEN_AQUI"
      }
    }
  }
}
```

No Cursor, ative:
```
Cursor → Settings → MCP → Add MCP Server
→ apontar para .cursor/mcp.json
```

---

## Passo 7 — Criar workflow de CI para PRs

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\.github\workflows\ci.yml -ItemType File
```

Cole o arquivo `ci.yml` disponível junto a este guia.

Commit e push na dev. A partir daí todo PR aberto para dev
roda build automático de frontend e backend.
O agente lê o resultado e corrige se falhar.

---

## Passo 8 — Criar script e workflow de sync de arquitetura

### 8a — Criar a pasta de scripts

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\scripts -ItemType Directory -Force
```

### 8b — Criar o script `sync-arquitetura.js`

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\scripts\sync-arquitetura.js -ItemType File
```

Cole o arquivo `sync-arquitetura.js` disponível junto a este guia.

O script faz o seguinte:
1. Lê o diff do último merge em dev
2. Detecta quais seções do ARQUITETURA_PROJETO.md foram afetadas
   usando mapeamento de padrões (docker-compose → §3, migrations → §4, etc.)
3. Extrai apenas as seções afetadas (não envia o doc inteiro de 1396 linhas)
4. Chama o 9router com o diff + seções para propor patches cirúrgicos
5. Salva o resultado em /tmp/arquitetura_patch.md

### 8c — Criar o workflow de sync

```powershell
New-Item -Path C:\projetos\mesas_rpg_artificio\.github\workflows\sync-arquitetura.yml -ItemType File
```

Cole o arquivo `sync-arquitetura.yml` disponível junto a este guia.

### 8d — Expor o 9router pelo Cloudflare Tunnel

Você já tem o túnel da Oracle configurado. Adicione um novo
Public Hostname no painel do Cloudflare apontando para o
container do 9router:

```
Hostname: router.artificiorpg.com
Service:  http://9router:20128
```

Se o 9router estiver rodando como Docker com `--name 9router`
na mesma rede Docker do projeto, o hostname interno é `9router:20128`.

### 8e — Adicionar secrets no GitHub

Acesse:
```
github.com/FarenRavirar/mesas_rpg_artificio/settings/secrets/actions
```

Adicione dois secrets novos:

| Name | Value |
|------|-------|
| `ROUTER_URL` | `https://router.artificiorpg.com` |
| `ROUTER_API_KEY` | API key copiada do dashboard do 9router |

Para pegar a API key no 9router:
```
http://localhost:20128/dashboard → Settings → API Keys → copiar
```

---

## Passo 9 — Prompt inicial para o Cursor

Cole isso no chat do Cursor para iniciar o loop de 24h:

```
Inicie uma sessão de trabalho autônoma seguindo o .cursorrules.

Sequência obrigatória de início:
1. Leia AGENTS.md na íntegra
2. Leia RESUMO_EXECUCAO.md
3. Leia FILA_IMPLEMENTACAO.md — identifique o próximo item
   com status "pendente" de maior prioridade (maior score GUT)
4. Leia TODO_OPERACIONAL.md para entender o REQ correspondente
5. Crie o arquivo de sessão em /sessoes/ seguindo o protocolo do AGENTS.md

Após a leitura:
- Apresente o plano antes de implementar
- Implemente seguindo o loop de execução autônoma do .cursorrules
- Ao concluir cada item, atualize os documentos e pegue o próximo
- Trabalhe em português
- Não peça confirmação para ações listadas como permitidas no .cursorrules
- Pare apenas nas condições de parada obrigatória definidas no .cursorrules
```

---

## Passo 10 — Rotina diária

### Antes de sair

```
1. Verificar se FILA_IMPLEMENTACAO.md tem itens pendentes
   com critério de conclusão definido
   → Se não tiver: adicionar critério antes de iniciar o agente

2. Verificar se RESUMO_EXECUCAO.md está atualizado

3. Verificar se o 9router está rodando:
   http://localhost:20128/v1/models deve retornar JSON

4. Abrir o Cursor com o projeto

5. Colar o prompt do Passo 9

6. Minimizar — não fechar
```

### Ao acordar

```
1. GitHub → Pull Requests → filtrar por base: dev

2. PRs normais (código):
   → Verificar CI verde ✓
   → Revisar diff
   → Aprovar ou pedir changes

3. PRs com label "documentation" (sync de arquitetura):
   → Abrir docs/sync-patches/ no PR
   → Ler patches propostos pelo 9router
   → Aplicar manualmente os pertinentes no ARQUITETURA_PROJETO.md
   → Fechar o PR após aplicar

4. Verificar RESUMO_EXECUCAO.md
   → Ver o que foi feito

5. Verificar ERRORS_SOLUTIONS.md
   → Ver erros novos registrados pelo agente

6. Verificar FILA_IMPLEMENTACAO.md
   → Ver itens bloqueados
   → Definir ação para cada bloqueio
```

---

## Mapa de responsabilidades

| Quem | O que faz |
|------|-----------|
| Você | Define itens na FILA com critério de conclusão claro |
| Você | Aprova ou rejeita PRs de código |
| Você | Revisa e aplica patches de documentação |
| Você | Define ação para itens bloqueados |
| Agente | Implementa itens da FILA sem parar |
| Agente | Atualiza FILA, TODO, MAPA_DE_API, ERRORS_SOLUTIONS, RESUMO |
| Agente | Abre PRs para dev (nunca faz merge) |
| Agente | Corrige erros de CI automaticamente |
| ci.yml | Valida build em todo PR aberto para dev |
| sync-arquitetura.yml | Propõe patches de doc após cada merge via 9router |

---

## O que cada arquivo faz nesse sistema

| Arquivo | Função |
|---------|--------|
| `.cursorrules` | Regras de operação — o agente lê e segue |
| `RESUMO_EXECUCAO.md` | Estado persistente entre sessões |
| `FILA_IMPLEMENTACAO.md` | Fila de trabalho com critérios de conclusão |
| `TODO_OPERACIONAL.md` | Contexto de produto — o porquê de cada item |
| `MAPA_DE_API.md` | Contratos de API — o agente não inventa rotas |
| `ERRORS_SOLUTIONS.md` | Memória de erros — consulta antes de tentar |
| `AGENTS.md` | Governança — regras inegociáveis |
| `ARQUITETURA_PROJETO.md` | Fonte de verdade técnica — consulta por seção |
| `/sessoes/` | Histórico de sessões — continuidade entre agentes |
| `ci.yml` | Valida build em todo PR — você só vê PRs verdes |
| `scripts/sync-arquitetura.js` | Detecta seções desatualizadas via 9router |
| `sync-arquitetura.yml` | Roda sync após cada merge, propõe patches via PR |
| `docs/sync-patches/` | Histórico auditável de patches propostos |

---

## Diagrama final

```
FILA_IMPLEMENTACAO.md
(itens com critério de conclusão)
           ↓
  Cursor Background Agent
  lê → implementa → build
           ↓
    build falha?
   ↙           ↘
 sim              não
  ↓                ↓
corrige         commit + push
(max 3x)       feature/<escopo>
  ↓                ↓
falha 3x       PR aberto → dev
  ↓                ↓
registra    ci.yml roda automaticamente
ERRORS          ↓
próximo    CI falha?
item      ↙       ↘
        sim          não
         ↓            ↓
      corrige      PR verde ✓
      novo commit      ↓
                 Você acorda
                      ↓
               revisa → aprova
                      ↓
                merge em dev
                      ↓
          sync-arquitetura.yml roda
                      ↓
          chama 9router com diff
                      ↓
          seções desatualizadas?
           ↙                ↘
         sim                 não
          ↓                   ↓
    PR de doc aberto      nada a fazer
    label: documentation
          ↓
    Você revisa patches
    aplica no ARQUITETURA_PROJETO.md
          ↓
    Agente já pegou próximo item
          ↓
        repete
```
