# Constituição do Projeto Mesas RPG Artifício

> Subordinada a AGENTS.md e demais MDs canônicos na raiz.
> Conflito → MDs canônicos da raiz vencem.

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
- Frontend: React + Vite + TypeScript (conforme RESUMO_EXECUCAO.md)
- Backend: Node.js + TypeScript
- Banco: PostgreSQL 16

## 5. Convenções
- Idioma SDD: pt-BR
- PR policy: PR por feature spec completa
- Testes globais: estritos localmente/unidade quando independentes, ou integrados em dev quando exigirem banco de dados/VM/acessos externos
- Testes Shell (Red/Green): Obrigatoriamente rodados em Git Bash (no Windows) ou WSL. CI sempre usa ubuntu-latest. O agente DEVE aferir a disponibilidade do binário testador no ambiente local antes de declarar avanço nas Fases 2 ou 3. Um teste não rodado é sempre BLOCKED, nunca PARTIAL.
- Fidelidade TDD/SDD: Ao implementar função nova, agente DEVE ler o teste correspondente e verificar se a lógica do teste bate com a semântica esperada da função. Se houver divergência entre teste e spec, PARAR e reportar ambiguidade — não implementar função para satisfazer teste incorreto, nem "tratar depois".

## 6. Guardrails técnicos (auto-aplicados, não perguntar)
- APIs HTTP: status codes 400, 401, 403, 404, 409, 422, 429, 500 sempre.
- Validação de input obrigatória em endpoint externo.
- Timeout explícito em chamada externa.
- Logs estruturados, sem PII, com traceId.
- Segredos via env vars, nunca em código.

## 7. Camadas imutáveis (não reescrever)
AGENTS.md, ARQUITETURA_PROJETO.md, BACKLOG_OPERACIONAL.md, MAPA_DE_API.md, FILA_IMPLEMENTACAO.md, ERRORS_SOLUTIONS.md, OPERACAO_PRODUCAO.md, PRE_DEPLOY_CHECKLIST.md, migrations_guide.md. 
*(Exceção: Resposta Pergunta 10 - Todos podem mudar se for justificado e melhor para o projeto sob a ótica da Implementação SDD)*

## 8. Protocolo de divergência
- Ambiguidade → parar e perguntar.
- Conflito entre spec e MD canônico → MD canônico vence. Reportar.
- Necessidade fora de escopo → propor ADR em specs/NNN/adr-*.md, aguardar aprovação.

## 9. Regras invioláveis de execução SDD

Toda task declarada DONE sem evidência reproduzível é NULA. "Arquivo criado" 
não é evidência. Saída literal de execução é evidência.

### 9.1 Commits atômicos

- Um commit commita UMA task ou UMA correção sem relação com tasks pendentes.
- Proibido agregar múltiplas tasks num commit, mesmo que relacionadas.
- Proibido commitar arquivos não mencionados no objetivo do commit.
- Antes de qualquer `git commit`, rodar `git status` e `git diff --cached --stat` 
  e verificar se APENAS os arquivos esperados estão staged.
- Se o hook de pré-commit (ou qualquer ferramenta) adicionar arquivos não 
  solicitados ao stage, PARAR, reportar, aguardar instrução.
- Nunca usar `git add -A`, `git add .`, ou `git commit -a` em trabalho SDD. 
  Sempre `git add <path-específico>`.

### 9.2 Estados binários de task

Toda task existe em exatamente um destes estados:

- **NOT STARTED**: arquivo do critério de done inexistente ou não foi executado.
- **BLOCKED**: começou mas parou por dependência externa não disponível 
  (binário ausente, sem docker, sem rede, sem SSH). NUNCA por "implementação 
  incompleta" da própria task.
- **RED**: teste da task implementado e confirmado falhando por ausência 
  de implementação (Fase 2 de TDAD).
- **GREEN**: teste passou em execução real neste ambiente. Saída literal 
  do comando de teste foi observada.
- **DONE**: GREEN + critério de done verificado + revisão humana recebida.

Estados proibidos (tentativas anteriores que não serão aceitas):
- "PARTIAL" — não existe. Ou é BLOCKED, ou é RED.
- "MOCK PERFORMÉTICO PASSOU" — não existe. Se o mock rodou, é GREEN.
- "TRATAMOS DEPOIS" — não existe. Teste que falha é RED, não DONE.

### 9.3 Gate de evidência

Antes de declarar qualquer task passou de um estado para outro, o agente 
DEVE colar no chat:

- Estado de origem e destino (NOT STARTED → BLOCKED, RED → GREEN, etc.).
- Comando exato executado para gerar a transição.
- Output LITERAL (não resumido, não filtrado) da execução.
- Arquivos que foram criados ou modificados, listados por `git status`.

Qualquer transição sem esses quatro itens é rejeitada pelo mantenedor.

### 9.4 Escopo estrito

- Nenhum arquivo fora da lista em `plan.md` Seção 3 (arquivos modificados) 
  pode ser tocado sem PARAR e perguntar ao mantenedor.
- Clarifications e decisões de produto são DO MANTENEDOR, não do agente. 
  O agente NUNCA infere uma Clarification nova. Se uma decisão não existe 
  no spec, PARAR e perguntar.
- Termos ou papéis que não aparecem no spec/plan/tasks são PROIBIDOS. 
  Não inventar hierarquia, não inventar processos, não inventar ferramentas.

### 9.5 Ciclo TDAD com ordem estrita

- Fase 2 só é DONE quando RED foi OBSERVADO (saída do teste mostrando 
  falha por ausência de implementação).
- Fase 3 só pode começar após Fase 2 DONE.
- Fase 3 só é DONE quando GREEN foi OBSERVADO (saída do teste mostrando 
  sucesso com implementação real).
- Não é permitido criar teste como placeholder (`assert_failure` sem 
  semântica correta, `exit 1` hardcoded, comentários "for now it will fail"). 
  Teste é contrato da função. Se a semântica não está pronta, PARAR e 
  discutir antes de escrever.

### 9.6 Auto-atribuição vs responsabilidade

O agente não é uma entidade separada do "último agente" ou "agente anterior". 
Toda ação no repositório desta branch foi executada pela sessão atual. 
Proibido usar linguagem de distanciamento ("confissão do último agente", 
"dívida herdada") para referir a própria produção.

### 9.7 Ambiente Windows — regras específicas

- `find` do Windows (não POSIX) retorna "Arquivo não encontrado" em sintaxe 
  diferente e NÃO é equivalente a `find` do Git Bash. Se o comando envolver 
  `find -name`, sempre rodar em Git Bash ou WSL.
- `sed`, `bash`, `bats` e utilitários POSIX NÃO existem nativos no 
  PowerShell. Nunca tentar rodar no cmd.
- `chmod -x` é inócuo no NTFS. Para desabilitar hook, renomear 
  (`.git/hooks/pre-commit.disabled`).
- `Out-File` e similares do PowerShell adicionam BOM. Para arquivos texto 
  de infra (`.gitattributes`, scripts, YAMLs), usar editor que grave UTF-8 
  sem BOM OU gravar via Git Bash.

### 9.8 Regra de consistência interna

Toda vez que o agente cria/edita arquivo que declara contrato (schema SQL, 
assinatura de função, formato de payload), DEVE verificar todos os 
consumidores desse contrato no repositório:

- Criou migration com `column X` → grep em todos `.sh` e `.ts` por usos de X.
- Mudou parâmetro de função → grep por todas as chamadas.
- Se encontrar divergência, RELATAR ao mantenedor antes de decidir qual é 
  canônico.
