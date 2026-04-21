# ADR-002: Forward-only

## Contexto
O ecossistema dispõe de migrações bidirecionais (up/down) em arquiteturas complexas. Nosso ciclo atual contesta essa dinâmica por não fornecer ferramentas suficientes para validações de "downs" coesas durante a implantação, induzindo à falha e à instabilidades em rollback acidental.

## Escolhido
Política *Forward-only*. Apenas criamos e impulsionamos scripts que reajustem ou modifiquem a base à frente.

## Rejeitado
Abordagens usando scripts duais "up/down".

## Motivo
"Down" em produção com dados reais detém fator de risco exponencial, consideravelmente superior a criar uma "migration corretiva nova". Essa característica mitiga perdas assíncronas.

## Consequências
Disciplina com a imutabilidade pós-aplicação. Um insert com typos na estrutura é desfeito adicionando outrem (`_alter`), sem apagar rastros e permitindo linearidade visual no script e banco.
