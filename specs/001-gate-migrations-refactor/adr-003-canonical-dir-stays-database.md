# ADR-003: Canônico permanece em "./database"

## Contexto
Durante refatorações de código e reorganizações de pasta do framework backend, arquivos foram lançados incidentalmente à instâncias separadas (como `/backend/migrations`). Modificar o enforcer da raiz atual `MIGRATIONS_DIR="./database"` impulsiona uma cascata de realocação drástica.

## Escolhido
Manter de prontidão nesta fase o canônico da variável aponta para `./database`.

## Rejeitado
A transição imediata para formatos restritivos à la `database/migrations/` em concorrência a esse *Feature*.

## Motivo
Reduzir as esferas de modificações. Consolidar primeiro o portal do CI limitando a complexidade para ter clareza antes de promover realocações maiores no ambiente.

## Consequências
Arquivos de forma sub-jacente mantêm agrupamento original e sua reorganização estrutural transforma-se numa "ADR" independente posterior.
