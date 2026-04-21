# ADR-001: Metadados no cabeçalho do SQL

## Contexto
Listas paralelas em shell (`ONLINE_SAFE_MIGRATIONS` e `MANUAL_RISK_MIGRATIONS`) são uma fonte crônica de esquecimento; o script isolado falha frequentemente quando essas listas perdem a precisão temporal do surgimento das migrações.

## Escolhido
A adoção formal de um cabeçalho injetado diretamente dentro de cada arquivo `.sql`.

## Rejeitado
- YAML paralelo ou JSON ao lado da query (fragmentação).
- Trobinação num diretório específico, como `/safe` e `/risk` (complexidade no fluxo do enforcer).
- Extração com chaves de regex no SQL em si (não determinístico e pouco fiável).

## Motivo
Manter a fonte de forma única reduz o atrito e mitiga esquecimentos. Arquivo e metadado residem e nascem juntos.

## Consequências
Toda migration nova exigirá esse cabeçalho declarativo antes da instrução primária. Sem ele, o gate de validação barrará a evolução. Arquivos sem cabeçalho deverão receber a injeção retroativa de forma passiva.
