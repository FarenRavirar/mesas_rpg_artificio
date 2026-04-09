# Regras de operação — Artifício Mesas RPG
# Fonte de autoridade: AGENTS.md prevalece sobre este arquivo em conflitos de governança.
# Fonte de arquitetura: ARQUITETURA_PROJETO.md prevalece sobre qualquer outro em conflitos técnicos.

---

## Protocolo obrigatório de início de sessão

Antes de qualquer ação, leia nesta ordem exata:
1. AGENTS.md — governança completa (leia na íntegra)
2. RESUMO_EXECUCAO.md — estado atual e próxima ação
3. TODO_OPERACIONAL.md — backlog de produto (REQ-xx, score GUT)
4. FILA_IMPLEMENTACAO.md — fila técnica de execução (lotes e fases)

Por situação específica, consulte também:
- Erro encontrado → ERRORS_SOLUTIONS.md (antes de tentar corrigir)
- Tarefa de backend ou rota → MAPA_DE_API.md
- Deploy ou produção → PRE_DEPLOY_CHECKLIST.md
- Operação na VM → OPERACAO_PRODUCAO.md
- Falha de ambiente → PRE-FLIGHT_CHECKLIST.md

Nunca leia ARQUITETURA_PROJETO.md na íntegra — consulte apenas a seção relevante.

---

## Roteamento de documentos por função

| Situação | Documento |
|----------|-----------|
| O que fazer (produto, prioridade) | TODO_OPERACIONAL.md |
| Como fazer (técnico, lote, fase) | FILA_IMPLEMENTACAO.md |
| Erro encontrado | ERRORS_SOLUTIONS.md |
| Rotas de API existentes | MAPA_DE_API.md |
| Deploy e rollback | PRE_DEPLOY_CHECKLIST.md |
| Estado atual do projeto | RESUMO_EXECUCAO.md |
| Arquitetura e contratos | ARQUITETURA_PROJETO.md (seção relevante) |
| Operação na VM | OPERACAO_PRODUCAO.md |

---

## Fluxo de trabalho por tarefa

1. Identificar o próximo item da FILA_IMPLEMENTACAO.md (status: pendente, maior prioridade)
2. Verificar o REQ correspondente no TODO_OPERACIONAL.md
3. Consultar ERRORS_SOLUTIONS.md para erros conhecidos relacionados
4. Criar branch: feature/<escopo> a partir de dev
5. Criar arquivo de sessão em /sessoes/resumo_[dia-mes]_[escopo].md com plano e checklist
6. Implementar com mudança mínima e incremental
7. Rodar npm run build — se falhar, corrigir antes de continuar
8. Atualizar status na FILA_IMPLEMENTACAO.md (pendente → em_execucao → concluido)
9. Atualizar status no TODO_OPERACIONAL.md se o REQ foi concluído
10. Atualizar MAPA_DE_API.md se rotas foram adicionadas ou removidas
11. Registrar erros novos em ERRORS_SOLUTIONS.md
12. Atualizar RESUMO_EXECUCAO.md com estado atual
13. Abrir PR para dev com descrição do que foi feito
14. PARAR — aguardar aprovação do PR antes de qualquer push ou merge

---

## Atualização de documentos ao concluir tarefa

- FILA_IMPLEMENTACAO.md → marcar item como concluido com data
- TODO_OPERACIONAL.md → atualizar status do REQ, mover para "Concluídos Recentes" se fechado
- ERRORS_SOLUTIONS.md → registrar erros novos encontrados durante a execução
- MAPA_DE_API.md → obrigatório se qualquer rota foi criada, removida ou alterada
- RESUMO_EXECUCAO.md → atualizar próxima ação

---


## Regras de Git

- Branch sempre a partir de dev: feature/<escopo>
- Nunca commitar direto em dev ou main
- npm run build deve passar antes de qualquer commit
- PR sempre para dev, nunca para main
- PARAR após abrir PR — não fazer merge
- git commit e git push exigem autorização explícita no chat

## Exceções de auto-aprovação

Para tarefas exclusivamente de documentação (sem alteração de código):
- git push pode ser executado sem pausa para aprovação
- PR pode ser aberto automaticamente

Tarefas de documentação são identificadas quando:
- Apenas arquivos .md são modificados
- Nenhum arquivo .ts, .tsx, .js, .py ou .yml é alterado

---

## Proibido sem autorização explícita

- Reiniciar containers na VM
- Executar qualquer comando SSH que modifique estado no servidor
- Modificar arquivos fora do escopo do item atual
- Resolver bugs não listados na FILA ou TODO
- Fazer deploy diretamente
- Criar migrations em produção
- Expor IMGUR_CLIENT_ID, tokens ou credenciais em qualquer arquivo

---

## Comandos permitidos sem autorização

- Leitura de arquivos locais
- npm run build, npm run lint
- git status, git log, git diff
- docker ps, docker logs, docker stats (read-only na VM)
- curl read-only em endpoints públicos


## Regra de limpeza de documentos

### FILA_IMPLEMENTACAO.md
- Item com status `concluido` há mais de 2 sessões consecutivas → remover da fila ativa
- Mover para seção `## Histórico — [Lote]` no final do arquivo
- Lotes inteiros concluídos → colapsar em uma linha de sumário

### TODO_OPERACIONAL.md  
- REQ com status `Concluído` validado em beta E em prod → remover da seção ativa
- Manter apenas em `## Concluídos Recentes` por 30 dias, depois remover
- REQ com status `Em validação beta` por mais de 2 sessões sem atualização → forçar decisão: concluir ou reabrir

### ARQUITETURA_PROJETO.md
- Sempre que modificar: docker-compose, workflows, rotas de API, banco de dados → atualizar a seção correspondente
- Não atualizar na íntegra — apenas a seção afetada pela task atual

### MAPA_DE_API.md
- Obrigatório atualizar ao final de qualquer task que adicione, remova ou altere rota
- Rotas marcadas `❌ Pendente/Front` que forem implementadas → atualizar para `✅ Em Uso`

---

## Idioma

Toda comunicação em português.
Elementos técnicos (nomes de arquivo, comandos, funções) permanecem no formato original.

