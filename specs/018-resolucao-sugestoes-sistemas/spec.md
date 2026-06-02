# Spec 018 - Resolucao de Sugestoes de Sistemas

## Objetivo

Criar um fluxo administrativo para resolver sugestoes de sistemas sem gerar redundancia no catalogo. A sugestao deve poder virar sistema novo, edicao, variante, subsistema, alias, nome em portugues/ingles, ou apenas ser mesclada/rejeitada.

## Problema

Hoje a fila de sugestoes oferece quase so "Aprovar" ou "Rejeitar". Isso incentiva criar sistemas raiz duplicados quando a sugestao na verdade e:

- sistema ja existente com outro nome;
- nome em portugues ou ingles;
- alias com marca, acento, pontuacao ou simbolo `TM`;
- edicao/versao, como `1.3`, `5e`, `2024`;
- variante ou subsistema de item existente;
- sugestao automatica do parser Discord com nome extraido de titulo/contexto.

Exemplos observados na fila Beta:

- `D&D 5a edicao 2024` deve apontar para `Dungeons & Dragons > 5e > 2024` ou alias equivalente, nao criar sistema raiz.
- `CAIN 1.3` parece versao/edicao de `CAIN`.
- `Demonio: A Queda` pode ser nome PT/alias de linha existente quando houver dado catalogado (`name_pt` ou alias); o sistema nao deve inventar traducao por dicionario hardcoded.
- `Pokemon RPG` pode ser sistema novo ou alias de sistema Pokemon ja cadastrado.
- `On-Two-Six` pode ser sistema novo, mas precisa comparar antes.

## Escopo

- Fila administrativa de sugestoes de sistemas.
- Sugestoes criadas por usuarios e sugestoes automaticas vindas do Discord.
- Resolucao assistida com candidatos provaveis.
- Auditoria da decisao administrativa.
- Vinculo com drafts Discord que aguardam `raw_system_hint`.

## Fora do Escopo

- Reestruturar todo o catalogo de sistemas.
- Resolver cenarios no mesmo fluxo, salvo aprendizado reaproveitavel.
- Deploy direto para producao.
- Criar automacao que aprove sem revisao humana.

## User Stories

### US1 - Resolver sugestao como alias

Como admin, quero transformar uma sugestao em alias de sistema existente para evitar duplicar catalogo.

Aceite:

- Admin escolhe sistema alvo.
- Sugestao vira `approved` ou `resolved` com tipo `alias`.
- Alias e criado em `system_aliases`.
- Se alias ja existir no alvo, a resolucao e idempotente e nao duplica registro.

### US2 - Resolver sugestao como edicao/variante/subsistema

Como admin, quero vincular uma sugestao a um pai existente e escolher o tipo correto de no.

Aceite:

- UI permite escolher tipo: `edition`, `variant`, `subsystem`.
- UI exige pai valido conforme regra de hierarquia atual.
- Novo no e criado em `systems` com `parent_id`, `depth` e `path_slug` corretos.
- Quando a sugestao contem uma base separavel e o admin escolhe o pai, a UI pode gravar alias do pai na mesma resolucao via `parent_aliases`, sem inferir traducao automaticamente.

### US3 - Resolver sugestao como sistema novo

Como admin, quero criar sistema raiz somente quando a sugestao realmente nao existir.

Aceite:

- Criacao de sistema raiz exige decisao explicita.
- Antes de confirmar, UI mostra candidatos similares e alerta de possivel duplicidade.

### US4 - Mesclar sem criar nada

Como admin, quero marcar uma sugestao como duplicada/mesclada quando o catalogo ja cobre aquilo.

Aceite:

- Sugestao sai da fila pendente.
- Decisao registra alvo existente e motivo.
- Nenhum novo sistema/alias e criado.

### US5 - Sugerir candidatos automaticamente

Como admin, quero ver candidatos provaveis antes de decidir.

Aceite:

- Backend compara sugestao contra `systems` e `system_aliases`.
- Resultado mostra score, motivo e analise: nome igual, alias igual, mesma base, base + edicao, base + complemento, similaridade aproximada, tokens de edicao e filho sugerido.
- Traducao/sinonimo so deve contar como candidato automatico quando existir em `name_pt` ou alias do catalogo. Nao usar dicionario hardcoded de sistemas ou termos.
- UI destaca acao recomendada, mas exige confirmacao humana.

## Requisitos Funcionais

- FR-001: Substituir acao binaria "Aprovar" por "Resolver".
- FR-002: Drawer/modal de resolucao deve mostrar sugestao, origem, descricao e candidatos.
- FR-003: Resolver como alias deve inserir em `system_aliases`.
- FR-004: Resolver como no novo deve inserir em `systems`.
- FR-005: Resolver como mescla deve nao inserir nada no catalogo.
- FR-006: Rejeicao continua disponivel.
- FR-007: Toda resolucao deve registrar quem decidiu, quando, tipo de resolucao e alvo.
- FR-008: Apos resolucao, drafts Discord com `raw_system_hint` correspondente devem poder ser reavaliados.
- FR-009: Fluxo deve aceitar nomes PT/EN e alias sem sobrescrever nomes oficiais sem revisao.
- FR-010: Busca de candidatos deve normalizar acento, caixa, pontuacao, simbolos comerciais e palavras de edicao.
- FR-011: Criar filho pode receber `parent_aliases` opcionais para cadastrar alias da base no pai durante a mesma resolucao.
- FR-012: Sistema novo raiz deve ser caminho de risco quando houver candidato similar; confirmacao `force` so e aceita apos mostrar candidatos/analise.

## Requisitos Nao Funcionais

- NFR-001: Nao criar sistema raiz por clique unico se houver candidato similar.
- NFR-002: Mudancas visiveis exigem `database/changelogs.json` antes de deploy.
- NFR-003: Validacao funcional de UI so conta apos deploy em `dev`/Beta e analise do mantenedor.
- NFR-004: Dados de API/DB devem entrar no frontend como `unknown` e passar por normalizador tipado.
- NFR-005: Operacoes de escrita em DB fora de ambiente local/Beta seguem aprovacoes de `AGENTS.md`.

## Risco e Processo

Classificacao: SDD Completo.

Motivo:

- Pode exigir migration/auditoria.
- Altera contrato admin.
- Envolve permissao admin.
- Pode alterar catalogo canonico usado por criacao de mesa e Discord Sync.

## Criterio de Pronto

- Admin consegue resolver as 35 sugestoes pendentes Beta sem criar redundancia evidente.
- Sistema/alias/edicao criados aparecem no seletor de Nova Mesa apos refresh.
- Sugestoes resolvidas saem da fila pendente.
- Candidatos similares aparecem antes de criacao de novo sistema.
- Build frontend/backend GREEN.
- Deploy Beta GREEN.
- Mantenedor valida em janela anonima.
