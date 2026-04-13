# Skill: Navegação de contexto do projeto

Use esta skill antes de ler qualquer arquivo para decidir
o que realmente precisa ser lido.

## Hierarquia de leitura — do menor para o maior

### Nível 1 — Sempre ler (pequenos, alta densidade)
- RESUMO_EXECUCAO.md — estado atual
- Item específico da FILA_IMPLEMENTACAO.md — só o item, não o arquivo inteiro

### Nível 2 — Ler só a seção relevante
- ARQUITETURA_PROJETO.md — consultar índice §X, ler só essa seção
- AGENTS.md — ler só as seções "Fontes de Verdade" e "Protocolo"
- ERRORS_SOLUTIONS.md — buscar por ID do erro, não ler tudo

### Nível 3 — Ler só se diretamente afetado pela tarefa
- Arquivos de código — ler só o arquivo que será modificado
- MAPA_DE_API.md — só se a tarefa envolve rotas
- TODO_OPERACIONAL.md — só o REQ específico, não o arquivo inteiro

### Nível 4 — Nunca ler por padrão
- FILA_IMPLEMENTACAO.md inteiro — usar grep para encontrar o item
- ARQUITETURA_PROJETO.md inteiro — sempre por seção
- Todos os arquivos de /sessoes/ — ler só o mais recente

## Regra de ouro
Antes de abrir qualquer arquivo, pergunte:
"Preciso do arquivo inteiro ou só de uma parte?"
Se precisar de uma parte: use grep/search antes de abrir.