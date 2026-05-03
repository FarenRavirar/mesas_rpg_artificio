# Inventario do Changelog

**Data da revisao**: 2026-05-03
**Arquivo revisado**: `database/changelogs.json`

## Resumo

- Total de entradas: 11
- Entradas publicadas: 11
- Datas publicadas duplicadas: 0
- Decisao sobre a hipotese do spec: nao ha duplicidade por data no estado atual do arquivo; a execucao fica restrita a revisao editorial e validacao.

## Criterios aplicados

- Uma unica entrada publicada por data de calendario.
- Linguagem leiga, sem termos tecnicos proibidos pela governanca.
- Remocao de ruido interno quando o texto puder ser explicado como beneficio para usuario.
- Preservacao de historico publicado quando a entrada ja esta consolidada e coerente.

## Inventario por entrada

| Data | ID | Titulo | Status | Assunto | Decisao |
|---|---|---|---|---|---|
| 2026-05-03 | `2026-05-03-atualizacoes-do-dia` | Sugestoes agora chegam mais rapido para a administracao | publicado | sugestoes e confirmacao | reescrever linguagem para "equipe responsavel" |
| 2026-04-29 | `2026-04-29-atualizacoes-do-dia` | Catalogo, imagens e exclusao de mesas ficaram mais confiaveis | publicado | catalogo, imagens e exclusao | reescrever "exclusao administrativa" para linguagem de gestao |
| 2026-04-24 | `2026-04-24-atualizacoes-do-dia` | Melhorias visuais nos cards e selos do painel do mestre | publicado | cards e selos | manter |
| 2026-04-19 | `2026-04-19-atualizacoes-do-dia` | Ajustes de usabilidade deixaram a navegacao mais estavel | publicado | usabilidade e telas principais | manter |
| 2026-04-18 | `2026-04-18-atualizacoes-do-dia` | Painel do mestre e gestao de sistemas ficaram mais claros e confiaveis | publicado | painel e gestao de sistemas | reescrever termos internos de comparacao e arvore administrativa |
| 2026-04-17 | `2026-04-17-atualizacoes-do-dia` | Perfil de mestre e gerenciamento de fotos ficaram mais completos | publicado | perfil, fotos e ajuda | manter |
| 2026-04-16 | `2026-04-16-atualizacoes-do-dia` | Perfil e cadastro de mesas ficaram mais claros e estaveis | publicado | perfil e cadastro | manter |
| 2026-04-15 | `2026-04-15-atualizacoes-do-dia` | Cadastro de mesa ficou mais simples, colaborativo e claro | publicado | cadastro e sugestoes | manter |
| 2026-04-13 | `2026-04-13-painel-mestre-melhorias` | Painel do mestre ficou mais confiavel para gerenciar mesas | publicado | painel do mestre | manter |
| 2026-04-08 | `2026-04-08-atualizacoes-do-dia` | Perfil, vagas e catalogo otimizados | publicado | perfil, vagas e catalogo | reescrever "performance", "otimizados" e "admin" |
| 2026-04-07 | `2026-04-07-atualizacoes-do-dia` | Filtros do catalogo ficaram mais simples de usar | publicado | filtros | manter |

## Grupos por data

Nenhum grupo com mais de uma entrada publicada foi encontrado.

## Entradas modificadas

- `2026-05-03-atualizacoes-do-dia`: linguagem ajustada para reduzir foco interno administrativo.
- `2026-04-29-atualizacoes-do-dia`: item de exclusao pela gestao reescrito sem jargao.
- `2026-04-18-atualizacoes-do-dia`: termos de comparacao e arvore administrativa reescritos em linguagem leiga.
- `2026-04-08-atualizacoes-do-dia`: titulo e corpo revisados para evitar "performance", "otimizados" e "admin".

## Entradas removidas ou despublicadas

Nenhuma.

## Evidencias de validacao

- JSON valido: `JSON_OK`.
- Termos proibidos (`sidebar vertical`, `migration`, `refactor`, `placeholder`): busca final sem ocorrencias.
- Jargoes revisados (`performance`, `otimizados`, `Q1`, `Q4`, `administrativa`, `arvore administrativa`, `admin`): busca final sem ocorrencias.
- Duplicidade por data publicada: `DUPLICATE_DATES_OK`.
