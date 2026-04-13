# Workflow: /ler-contexto

Use antes de iniciar qualquer tarefa para carregar
o mínimo necessário de contexto.

## Passo 1 — Localizar o item da FILA sem abrir o arquivo inteiro
grep -n "pendente" FILA_IMPLEMENTACAO.md | head -5

## Passo 2 — Ler só o bloco do item encontrado
Abrir FILA_IMPLEMENTACAO.md e ler apenas as linhas do item.

## Passo 3 — Localizar a seção do ARQUITETURA_PROJETO.md
grep -n "^## [0-9]" ARQUITETURA_PROJETO.md
# Ler só a seção com o número indicado pelo roteamento

## Passo 4 — Localizar erro em ERRORS_SOLUTIONS.md
grep -n "E[0-9][0-9][0-9]" ERRORS_SOLUTIONS.md | grep "palavra-chave"
# Ler só o bloco do erro encontrado

## Passo 5 — Verificar arquivo de código antes de abrir
grep -n "função ou padrão buscado" caminho/do/arquivo.ts
# Abrir só se o grep confirmar que é o arquivo certo