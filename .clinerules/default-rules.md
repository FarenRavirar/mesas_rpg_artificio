# Regras de operação — Artifício Mesas RPG
# Fonte de autoridade: AGENTS.md prevalece sobre este arquivo em conflitos de governança.
# Fonte de arquitetura: ARQUITETURA_PROJETO.md prevalece sobre qualquer outro em conflitos técnicos.

---

## Gestão de contexto — regra crítica

NUNCA abrir arquivos grandes por completo sem necessidade.
Usar grep/search primeiro para confirmar que o arquivo contém o que se busca.

Arquivos proibidos de abrir na íntegra:
- ARQUITETURA_PROJETO.md (1396+ linhas) → só por seção §X
- FILA_IMPLEMENTACAO.md → só o item atual via grep
- BACKLOG_OPERACIONAL.md → só o REQ específico via grep
- ERRORS_SOLUTIONS.md → só pelo ID do erro via grep
- Qualquer arquivo de código com mais de 200 linhas → grep primeiro

Sequência obrigatória antes de abrir qualquer arquivo grande:
1. grep -n "padrão" arquivo → confirmar localização
2. Abrir só as linhas necessárias via view_range
3. Nunca rolar o arquivo inteiro

Hierarquia de leitura — do menor para o maior:
- Nível 1 (sempre): RESUMO_EXECUCAO.md + item específico da FILA via grep
- Nível 2 (só a seção): ARQUITETURA_PROJETO.md §X + seção do AGENTS.md
- Nível 3 (só se afetado pela tarefa): arquivo de código alvo + MAPA_DE_API.md
- Nível 4 (nunca por padrão): arquivos inteiros de qualquer documento > 100 linhas

---

## Protocolo obrigatório de início de sessão

Antes de qualquer ação, leia nesta ordem exata usando grep seletivo:
1. AGENTS.md — seções "Fontes de Verdade" e "Protocolo" (não na íntegra)
2. RESUMO_EXECUCAO.md — estado atual e próxima ação (arquivo completo, é curto)
3. FILA_IMPLEMENTACAO.md — grep pelo próximo item pendente, ler só esse bloco
4. BACKLOG_OPERACIONAL.md — grep pelo REQ correspondente ao item, ler só esse bloco

Por situação específica, consulte também:
- Erro encontrado → ERRORS_SOLUTIONS.md (grep pelo ID antes de tentar corrigir)
- Tarefa de backend ou rota → MAPA_DE_API.md (grep pela rota específica)
- Deploy ou produção → workflows/PRE_DEPLOY_CHECKLIST.md
- Operação na VM → OPERACAO_PRODUCAO.md
- Falha de ambiente → workflows/PRE-FLIGHT_CHECKLIST.md

Nunca leia ARQUITETURA_PROJETO.md na íntegra — consulte apenas a seção §X indicada.

---

## Roteamento de documentos por função

| Situação | Documento | Como acessar |
|----------|-----------|--------------|
| O que fazer (produto, prioridade) | BACKLOG_OPERACIONAL.md | grep pelo REQ |
| Como fazer (técnico, lote, fase) | FILA_IMPLEMENTACAO.md | grep por "pendente" |
| Erro encontrado | ERRORS_SOLUTIONS.md | grep pelo ID E### |
| Rotas de API existentes | MAPA_DE_API.md | grep pela rota |
| Deploy e rollback | workflows/PRE_DEPLOY_CHECKLIST.md | arquivo completo |
| Estado atual do projeto | RESUMO_EXECUCAO.md | arquivo completo |
| Arquitetura e contratos | ARQUITETURA_PROJETO.md | só seção §X |
| Operação na VM | OPERACAO_PRODUCAO.md | seção relevante |
| Git, branch, merge | workflows/GIT_WORKFLOW.md | seção relevante |
| Falha de ambiente | workflows/PRE-FLIGHT_CHECKLIST.md | arquivo completo |

---

## Fluxo de trabalho por tarefa

1. Identificar o próximo item da FILA com status pendente e maior score GUT
   → grep -n "pendente" FILA_IMPLEMENTACAO.md | head -5
2. Verificar o REQ correspondente no BACKLOG_OPERACIONAL.md
   → grep -n "REQ-XX" BACKLOG_OPERACIONAL.md
3. Consultar ERRORS_SOLUTIONS.md para erros conhecidos relacionados
   → grep -n "palavra-chave" ERRORS_SOLUTIONS.md
4. Criar branch: feature/<escopo> a partir de dev
5. Criar arquivo de sessão em /sessoes/resumo_[dia-mes]_[escopo].md
   com plano completo e checklist de TODOS os passos numerados
6. Implementar com mudança mínima e incremental
   → ler só a seção relevante de ARQUITETURA_PROJETO.md antes de implementar
7. Rodar npm run build — se falhar, corrigir antes de continuar (máximo 3 tentativas)
8. Atualizar status na FILA_IMPLEMENTACAO.md: pendente → em_execucao → concluido + data
9. Atualizar status no BACKLOG_OPERACIONAL.md se o REQ foi concluído
10. Atualizar MAPA_DE_API.md se rotas foram adicionadas, removidas ou alteradas
11. Registrar erros novos em ERRORS_SOLUTIONS.md
12. Atualizar RESUMO_EXECUCAO.md com estado atual e próxima ação
13. Commit + push origin feature/<escopo> + abrir PR para dev

---

## Critério de conclusão da tarefa

A tarefa está 100% concluída quando TODOS estes pontos forem verdadeiros:
- npm run build passou sem erros
- FILA_IMPLEMENTACAO.md marcado como concluido com data
- RESUMO_EXECUCAO.md atualizado com próxima ação
- PR aberto no GitHub apontando para dev
- Todos os itens [ ] do checklist no arquivo de sessão estão [x]
- Busca final por pendências retornou zero resultados
- Critério de conclusão do item da FILA foi atingido

Quando todos os pontos forem verdadeiros: ENCERRAR a tarefa imediatamente.
Não tentar validar novamente. Não repetir passos anteriores.
Não aguardar resposta. Ir direto para a transição entre tarefas.

---

## REGRA ANTI-CONCLUSÃO PREMATURA

> [!CAUTION]
> REGRA CRÍTICA: attempt_completion antes de terminar COMPLETAMENTE a tarefa
> causa retrabalho massivo. É proibido.

### Protocolo obrigatório antes de encerrar qualquer tarefa

Passo 1 — Executar busca final:
Buscar em todos os arquivos afetados por padrões relacionados à tarefa.
Se retornar qualquer resultado pendente: continuar trabalhando.
Somente encerrar se retornar zero resultados pendentes.

Passo 2 — Verificar checklist:
Toda tarefa DEVE ter checklist criada no início com TODOS os passos.
TODOS os itens devem estar marcados [x].
Se houver qualquer item [ ] pendente: a tarefa NÃO está concluída.

Passo 3 — Verificar critério explícito:
O item da FILA tem um campo "Critério:" — verificar se foi atingido.
Se não foi atingido: voltar à implementação.

### PROIBIDO encerrar a tarefa se:
- Busca ainda retorna resultados
- Checklist tem itens [ ] pendentes
- Você usou palavras: "parcial", "restante", "alguns", "maioria", "principais"
- Você disse: "X de Y arquivos" onde X < Y
- Você disse: "70% concluído" ou qualquer porcentagem abaixo de 100%
- Você disse: "documentação não foi atualizada"
- Você disse: "arquivo muito grande" como justificativa para parar

### Proibição absoluta — tamanho de arquivo
❌ NUNCA usar "arquivo muito grande" como desculpa para não terminar.
Se o arquivo tem 10.000 linhas, processe linha por linha se necessário.
Tamanho do arquivo NÃO é motivo válido para parar ou encerrar prematuramente.

### Palavras proibidas na conclusão
Qualquer uso das palavras abaixo na mensagem de conclusão indica tarefa incompleta:
"parcial" | "restante" | "alguns" | "maioria" | "principais" | "70%" |
"documentação técnica não foi" | "X de Y" | "não foi limpo" | "não atualizado"

### Formato correto de conclusão
```
Busca final: 0 resultados pendentes
Checklist: X/X itens marcados [x]
Critério da FILA atingido: sim
npm run build: passou
PR aberto: [URL]
Tarefa 100% concluída
```

### Fluxo obrigatório antes de encerrar
```
1. Criar checklist completa de TODOS os arquivos e passos no início
2. Executar cada item e marcar [x]
3. Quando achar que terminou:
   a. Executar busca final por pendências
   b. Se busca > 0: voltar ao passo 2
   c. Se busca = 0: verificar checklist
   d. Se checklist tem [ ]: voltar ao passo 2
   e. Se checklist 100% [x] E busca = 0: attempt_completion
```

---

## Transição entre tarefas

Após concluir uma tarefa:
1. Registrar no arquivo de sessão em /sessoes/ que a tarefa foi concluída com [x]
2. grep -n "pendente" FILA_IMPLEMENTACAO.md para identificar próximo item
3. Se houver próximo item não bloqueado → iniciar nova tarefa do zero pelo passo 1 do fluxo
4. Se não houver mais itens pendentes → encerrar sessão com:
   "Sessão encerrada. [N] itens concluídos, [M] bloqueados. PRs: [lista]. Fila vazia."

Nunca voltar a um item já marcado como concluido.
Nunca encerrar no meio de um item — sempre terminar o ciclo completo.

---

## Critério de parada por erro

Se o mesmo erro ocorrer 3 vezes consecutivas sem solução:
1. Registrar em ERRORS_SOLUTIONS.md com causa identificada
2. Marcar item como bloqueado na FILA com observação do erro
3. Atualizar RESUMO_EXECUCAO.md informando o bloqueio
4. Partir para o próximo item pendente não bloqueado
5. Se não houver próximo item → encerrar sessão

---

## Atualização de documentos ao concluir tarefa

- FILA_IMPLEMENTACAO.md → marcar item como concluido com data
- BACKLOG_OPERACIONAL.md → atualizar status do REQ, mover para "Concluídos Recentes" se fechado
- ERRORS_SOLUTIONS.md → registrar erros novos encontrados durante a execução
- MAPA_DE_API.md → obrigatório se qualquer rota foi criada, removida ou alterada
- RESUMO_EXECUCAO.md → atualizar próxima ação e arquivo de sessão mais recente
- ARQUITETURA_PROJETO.md → atualizar APENAS a seção afetada:
  - docker-compose ou containers alterados → §3
  - migrations criadas → §4
  - rotas de API alteradas → §12
  - imagens/upload alterados → §16

---

## Regra de limpeza de documentos

### FILA_IMPLEMENTACAO.md
- Lotes inteiros com todos os itens concluidos → mover para ## Histórico no final
- Manter apenas pendente e em_execucao na área ativa

### BACKLOG_OPERACIONAL.md
- REQs em Concluídos Recentes com mais de 30 dias → remover
- REQs com status Em validação beta sem atualização por mais de 2 sessões → marcar [REVISAR]

### MAPA_DE_API.md
- Rotas marcadas Pendente/Front que forem implementadas → atualizar para Em Uso

---

## Regras de Git

Consultar workflows/GIT_WORKFLOW.md antes de qualquer operação Git.

- Branch sempre a partir de dev: feature/<escopo>
- Nunca commitar direto em dev ou main
- npm run build deve passar antes de qualquer commit
- PR sempre para dev — nunca para main
- Nunca fazer merge — apenas abrir PR

### Permissões de push sem autorização:
- git push origin feature/* → PERMITIDO sempre
- git push origin dev → EXIGE autorização explícita no chat
- git push origin main → EXIGE autorização explícita no chat

### Exceções para tarefas de documentação:
Quando APENAS arquivos .md são modificados (nenhum .ts, .tsx, .js, .py ou .yml):
- git push origin feature/* é permitido sem pausa
- PR pode ser aberto automaticamente

---

## Proibido sem autorização explícita

- Reiniciar containers na VM
- Executar qualquer comando SSH que modifique estado no servidor
- Modificar arquivos fora do escopo do item atual
- Resolver bugs não listados na FILA ou TODO
- Fazer deploy diretamente
- Criar migrations em produção
- Expor IMGUR_CLIENT_ID, tokens ou credenciais em qualquer arquivo
- Fazer merge de PR

---

## Comandos permitidos sem autorização

- Leitura de qualquer arquivo local (preferencialmente via grep seletivo)
- npm run build, npm run lint, npm run test
- git status, git log, git diff, git checkout -b feature/*
- git push origin feature/*
- Abrir PR no GitHub
- grep, find, wc (ferramentas de busca local)
- docker ps, docker logs, docker stats (read-only)
- curl em endpoints públicos

---

## Idioma

Toda comunicação em português.
Elementos técnicos (nomes de arquivo, comandos, funções) permanecem no formato original.