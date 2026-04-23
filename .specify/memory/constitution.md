# Constituição do Projeto Mesas RPG Artifício

> Subordinada a AGENTS.md e demais MDs canônicos na raiz.
> Conflito → MDs canônicos da raiz vencem.
>
> **Escopo deste arquivo:** O QUE o projeto proíbe e permite (regras de negócio, stack, infra, ciclo SDD).
> **AGENTS.md:** COMO o agente se comporta (fluxo de sessão, ferramentas, roteamento).
> Regras que existem nos dois arquivos têm dono único aqui ou no AGENTS.md — não nos dois.

## 1. Identidade
- Projeto: Mesas RPG Artifício
- Tipo: Brownfield, TypeScript, monorepo (backend/frontend/database).
- Ambientes: beta (mesasbeta.artificiorpg.com), produção (mesas.artificiorpg.com).

## 2. Princípios inegociáveis
- Gratuito para a comunidade, sem anúncios, coleta mínima de dados.
- Nenhuma decisão de produto é tomada pelo agente — sempre perguntar.
- TypeScript estrito. Proibido `any` implícito.
- Toda mudança de schema passa por migrations_guide.md.
- Nenhum código em produção sem PRE_DEPLOY_CHECKLIST.md verde.

## 3. Branch policy (via Fase A)
- Branch-base dos PRs: dev
- Branch por feature: sim, criada automaticamente pelo Spec Kit com nome NNN-nome-semantico
- Nomenclatura: feat/NNN-nome
- Deletar após merge: sim automático
- Remote: origin atual

## 4. Stack travada
- Runtime: Node.js 22 LTS
- Gerenciador: npm
- Frontend: React + Vite + TypeScript
- Backend: Node.js + TypeScript
- Banco: PostgreSQL 16

## 5. Convenções
- Idioma SDD: pt-BR
- PR policy: PR por feature spec completa
- Testes globais: estritos localmente/unidade quando independentes; integrados em dev quando exigirem banco/VM/acessos externos
- Testes Shell (Red/Green): obrigatoriamente rodados em Git Bash (Windows) ou WSL. CI sempre usa ubuntu-latest. O agente DEVE aferir disponibilidade do binário testador antes de declarar avanço nas Fases 2 ou 3. Um teste não rodado é sempre BLOCKED, nunca PARTIAL.
- Fidelidade TDD/SDD: ao implementar função nova, o agente DEVE ler o teste correspondente e verificar se a lógica bate com a semântica esperada. Divergência entre teste e spec → PARAR e reportar. Não implementar função para satisfazer teste incorreto.

## 6. Guardrails técnicos (auto-aplicados, não perguntar)
- APIs HTTP: status codes 400, 401, 403, 404, 409, 422, 429, 500 sempre.
- Validação de input obrigatória em endpoint externo.
- Timeout explícito em chamada externa.
- Logs estruturados, sem PII, com traceId.
- Segredos via env vars, nunca em código.

## 7. Camadas imutáveis (não reescrever)
AGENTS.md, .specify/arquiteture.md, .specify/memory/errors.md, MAPA_DE_API.md, OPERACAO_PRODUCAO.md, PRE_DEPLOY_CHECKLIST.md, migrations_guide.md.
*(Exceção: qualquer arquivo pode mudar se justificado e melhor para o projeto sob a ótica da Implementação SDD)*

**Nota:** `BACKLOG_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md` e `ERRORS_SOLUTIONS.md` foram migrados para `docs/legacy/` e substituídos por `.specify/features/*/` e `.specify/memory/errors.md`.

## 8. Protocolo de divergência
- Ambiguidade → parar e perguntar.
- Conflito entre spec e MD canônico → MD canônico vence. Reportar.
- Necessidade fora de escopo → propor ADR em specs/NNN/adr-*.md, aguardar aprovação.

## 9. Ciclo SDD — estados e evidências

### 9.1 Estados binários de task

Toda task existe em exatamente um destes estados:

- **NOT STARTED**: critério de done inexistente ou não executado.
- **BLOCKED**: parou por dependência externa não disponível (binário ausente, sem docker, sem rede, sem SSH). NUNCA por "implementação incompleta" da própria task.
- **RED**: teste implementado e confirmado falhando por ausência de implementação (Fase 2 de TDAD).
- **GREEN**: teste passou em execução real neste ambiente. Saída literal do comando foi observada.
- **DONE**: GREEN + critério de done verificado + revisão humana recebida.

Estados proibidos:
- "PARTIAL" — não existe. Ou é BLOCKED, ou é RED.
- "MOCK PERFORMÉTICO PASSOU" — não existe.
- "TRATAMOS DEPOIS" — não existe. Teste que falha é RED, não DONE.

### 9.2 Gate de evidência

Antes de declarar qualquer transição de estado, o agente DEVE colar no chat:

- Estado de origem e destino (NOT STARTED → BLOCKED, RED → GREEN, etc.)
- Comando exato executado
- Output LITERAL (não resumido, não filtrado) da execução
- Arquivos criados ou modificados listados por `git status`

Qualquer transição sem esses quatro itens é rejeitada pelo mantenedor.

### 9.3 Commits atômicos

- Um commit = UMA task OU UMA correção sem relação com tasks pendentes.
- Proibido agregar múltiplas tasks num commit, mesmo que relacionadas.
- Proibido commitar arquivos não mencionados no objetivo do commit.
- Antes de qualquer `git commit`: rodar `git status` e `git diff --cached --stat` e verificar que APENAS os arquivos esperados estão staged.
- Se o hook de pré-commit adicionar arquivos não solicitados ao stage: PARAR, reportar, aguardar instrução.
- Nunca usar `git add -A`, `git add .`, ou `git commit -a` em trabalho SDD. Sempre `git add <path-específico>`.

### 9.4 Ciclo TDAD com ordem estrita

- Fase 2 só é DONE quando RED foi OBSERVADO (saída do teste mostrando falha por ausência de implementação).
- Fase 3 só pode começar após Fase 2 DONE.
- Fase 3 só é DONE quando GREEN foi OBSERVADO (saída do teste mostrando sucesso com implementação real).
- Proibido criar teste como placeholder (`assert_failure` sem semântica correta, `exit 1` hardcoded). Teste é contrato da função. Se a semântica não está pronta, PARAR e discutir.

### 9.5 Escopo estrito

- Nenhum arquivo fora da lista em `plan.md` Seção 3 pode ser tocado sem PARAR e perguntar ao mantenedor.
- Clarifications e decisões de produto são DO MANTENEDOR. O agente NUNCA infere Clarification nova.
- Termos ou papéis que não aparecem no spec/plan/tasks são PROIBIDOS. Não inventar hierarquia, processos ou ferramentas.

### 9.6 Responsabilidade de sessão

O agente não é uma entidade separada do "último agente". Toda ação no repositório desta branch foi executada pela sessão atual. Proibido usar linguagem de distanciamento ("confissão do último agente", "dívida herdada") para referir a própria produção.

### 9.7 Consistência interna de contratos

Toda vez que o agente cria/edita arquivo que declara contrato (schema SQL, assinatura de função, formato de payload), DEVE verificar todos os consumidores desse contrato:

- Criou migration com `column X` → grep em todos `.sh` e `.ts` por usos de X.
- Mudou parâmetro de função → grep por todas as chamadas.
- Divergência encontrada → RELATAR ao mantenedor antes de decidir qual é canônico.

### 9.8 Placeholder proibido

Código marcado como "placeholder", "TODO", "for now it will fail", "mock temporário", ou similar é PROIBIDO em qualquer commit SDD.

Se uma função precisa ser stub por dependência ausente, o stub deve:
- Retornar erro explícito com mensagem `"NOT IMPLEMENTED: <nome>"`
- Ter teste correspondente marcado `@skip` com justificativa
- Ter issue/task em tasks.md apontando prazo para implementação

Nunca escrever `exit 1` sem lógica que o justifique. Nunca escrever `assert_failure` sem assertion de conteúdo depois.

## 10. Infraestrutura do projeto — regras ambientais

### 10.1 Docker e banco de dados vivem na VM remota, SEMPRE

Este projeto NÃO tem Docker local no ambiente de desenvolvimento Windows. Docker e Postgres vivem EXCLUSIVAMENTE na VM Oracle Cloud, acessada via:

    ssh -F C:/projetos/config faren

Regras invioláveis:

- ❌ NUNCA assumir que `docker` existe local.
- ❌ NUNCA propor `docker run` ou `docker compose` como comando direto em máquina Windows.
- ❌ NUNCA declarar BLOCKED por ausência de docker sem antes tentar a invocação remota via SSH.
- ✅ SEMPRE prefixar comandos docker com: `ssh -F C:/projetos/config faren "docker ..."`.
- ✅ Para testes que envolvem Postgres descartável, criar container na VM com nome distinto (ex: `mesas-test-pg-<timestamp>`) e portas não-colidentes.

### 10.2 Banco de dados canônicos

| Ambiente | Container | Pasta VM | URL pública |
|---|---|---|---|
| Beta | `mesas-beta-db` | `/opt/mesas-beta/` | `mesasbeta.artificiorpg.com` |
| Prod | `mesas-db` | `/opt/mesas/` | `mesas.artificiorpg.com` |
| Teste (efêmero) | `mesas-test-pg-*` | `/tmp/mesas-test/` | não exposto |

Qualquer comando que envolva banco de dados deve especificar container-alvo EXPLICITAMENTE. Default implícito é proibido.

### 10.3 Protocolo antes de declarar BLOCKED por dependência

Antes de reportar "BLOCKED: binário X ausente":

1. Verificar se X é ferramenta de desenvolvimento do mantenedor (ex: `bats`, `git`, `jq`).
2. Se X é infraestrutura do projeto (ex: `docker`, `psql`, `postgres`), verificar se vive remoto. Consultar §10.1 e §10.2.
3. Se X é ferramenta cross-platform (ex: `sed`, `find`), verificar se existe em Git Bash ou WSL antes de declarar ausente.
4. Só declarar BLOCKED após passos 1–3 esgotados.

Exemplo proibido: `"docker não encontrado no Windows → BLOCKED"`

Exemplo aceito: `"docker local ausente (Windows); verificada infra remota via SSH; container disponível em mesas-beta-db; procedendo com invocação SSH"`

### 10.4 Ambiente Windows — regras específicas

- `find` do Windows (não POSIX) retorna "Arquivo não encontrado" em sintaxe diferente — NÃO é equivalente a `find` do Git Bash. Se o comando envolver `find -name`, sempre rodar em Git Bash ou WSL.
- `sed`, `bash`, `bats` e utilitários POSIX NÃO existem nativos no PowerShell. Nunca tentar rodar no cmd.
- `chmod -x` é inócuo no NTFS. Para desabilitar hook, renomear (`.git/hooks/pre-commit.disabled`).
- `Out-File` e similares do PowerShell adicionam BOM. Para arquivos texto de infra (`.gitattributes`, scripts, YAMLs), usar editor que grave UTF-8 sem BOM OU gravar via Git Bash.