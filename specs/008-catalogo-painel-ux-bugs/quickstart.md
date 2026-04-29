# Quickstart: Revisão Visual e Responsiva do Catálogo

## Objetivo

Validar que o catálogo foi revisado contra bugs visuais relacionados, não sobrescreve a tela, segue padrão visual coerente com a gestão de sistemas e funciona de forma responsiva.

## Pré-condições

- Bugs visuais relacionados ao catálogo mapeados antes da implementação.
- Feature implementada no frontend.
- Build técnico do frontend executado com sucesso antes de deploy.
- Deploy disponível no Beta.
- Teste funcional realizado em janela anônima.

## Cenário 1: Mapeamento de bugs visuais relacionados

1. Abrir o catálogo.
2. Inspecionar menus, filtros, cards e estados visuais.
3. Registrar bugs de sobreposição, espaçamento, rolagem horizontal, estados quebrados e inconsistências com gestão de sistemas.
4. Classificar cada achado como dentro ou fora do escopo da feature.

**Resultado esperado**: lista de achados visuais relacionados ao catálogo antes dos patches técnicos.

## Cenário 2: Catálogo em desktop

1. Abrir o catálogo no Beta.
2. Verificar cabeçalho, menus, filtros, cards e resultados.
3. Rolar a página.
4. Abrir e fechar filtros/menus.
5. Confirmar que nenhum elemento cobre outro indevidamente.
6. Comparar filtros e menus com o padrão da gestão de sistemas.

**Resultado esperado**: catálogo escaneável, sem sobreposição e visualmente coerente com a gestão de sistemas.

## Cenário 3: Catálogo em tablet/mobile

1. Abrir o catálogo em viewport estreito ou dispositivo móvel.
2. Verificar que não há rolagem horizontal indevida.
3. Abrir e fechar menus/filtros.
4. Confirmar que controles não cobrem resultados de forma permanente.
5. Alternar orientação, se aplicável.

**Resultado esperado**: navegação responsiva clara, filtros acessíveis e resultados preservados.

## Cenário 4: Estados do catálogo

1. Validar estado carregando.
2. Validar estado vazio.
3. Validar estado de erro, se reproduzível.
4. Validar resultados com poucos e muitos cards.
5. Validar cards com textos longos ou imagens ausentes.

**Resultado esperado**: todos os estados permanecem legíveis e sem sobreposição indevida.

## Evidências obrigatórias

- Resultado do build técnico do frontend.
- Lista de bugs visuais relacionados investigados.
- Confirmação funcional do catálogo em desktop.
- Confirmação funcional do catálogo em tablet/mobile.
- Confirmação de padronização de menus/filtros com gestão de sistemas.
- Registro de que o teste final foi feito em janela anônima no Beta.
