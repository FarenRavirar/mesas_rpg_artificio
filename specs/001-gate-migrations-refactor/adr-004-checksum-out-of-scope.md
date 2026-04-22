# ADR-004: Checksum fora do escopo

## Contexto
As migrações podem eventualmente em ecossistemas vastos sofrer flutuações, quando o dev acidentalmente muda a instrução dentro de um script antigo, resultando na defasagem ou inconsistência histórica do comportamento executado versus código no repositório.

## Escolhido
Adicionar integridade (`checksum`) não será realizado de momento. Adicionaremos provisoriamente a auditoria do `applied_by`.

## Rejeitado
Implementação imediata da verificação de hash ao `schema_migrations`.

## Motivo
Exigiria rotinas pesadas de backfill em todas as migrations validadas antes contra um escopo que tenta apenas limitar as fronteiras do *gate deployment*.

## Consequências
O reconhecimento posterior "script readulterado" após seu aceite e merge é um item alocado para a fase de evolução do Gate.
