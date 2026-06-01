# Data Model: Catálogo e Painel UX Bugs

Esta feature não altera banco de dados. O modelo abaixo descreve entidades de UI, estados de apresentação e contratos de dados já existentes que precisam ser preservados.

## CatalogLayoutState

Representa a composição visual da página pública `/catalogo`.

**Campos**
- `headerState`: estado visual do cabeçalho do catálogo.
- `filterSurfaceState`: estado da superfície de filtros desktop.
- `mobileDrawerState`: aberto, fechado ou bloqueado durante aplicação.
- `resultsState`: carregando, atualizando, vazio, erro ou com resultados.
- `viewportMode`: mobile, tablet ou desktop.

**Regras**
- Cabeçalho, filtros e resultados não podem se sobrepor.
- Em mobile, drawer e botão flutuante não podem bloquear permanentemente conteúdo essencial.
- Estados de erro/vazio/carregando devem manter layout estável.

## CatalogFilterState

Representa os filtros públicos preservados por URL.

**Campos existentes**
- `search`
- `system`
- `modality`
- `priceType`
- `experience`
- `seal`
- `styles`
- `sort`
- `page`

**Regras**
- Parâmetros e semântica existentes devem ser preservados.
- Chips ativos devem permitir remoção individual sem quebrar os demais filtros.
- A aplicação/limpeza de filtros deve retornar o usuário para contexto compreensível.

## SystemSelectionState

Representa a seleção de sistema pelo `SystemTreeSelector`, usado no catálogo e no formulário de mesa.

**Campos**
- `selectedIds`
- `activeRootId`
- `activeMidId`
- `language`
- `search`
- `singleSelect`

**Regras**
- Em `singleSelect`, selecionar outro sistema substitui a seleção anterior.
- A seleção de edição/subsistema/variante deve usar a lista correspondente ao nível correto.
- Busca deve continuar funcionando por nome, nome em português, slug, path e aliases.
- O componente deve continuar utilizável tanto no catálogo quanto no painel.

## TableCardPresentationState

Representa a robustez visual de cada card de mesa.

**Campos relevantes**
- `cover_url`
- `title`
- `system_name`
- `system_logo_filename`
- `modality`
- `featured`
- `is_ddal`
- `is_covil`
- `vtt_platform`
- `gm_display_name`
- `slots_total`
- `slots_open`
- `price_type`
- `price_value`

**Regras**
- Conteúdo longo deve truncar ou quebrar sem invadir áreas vizinhas.
- Badges e logos devem manter dimensões estáveis.
- Cards devem manter altura e grid previsíveis nos breakpoints planejados.

## EditTableInitialState

Representa dados carregados da API para edição de mesa no painel.

**Campos de atenção**
- `selectedSystemId`
- `selectedScenarioId`
- `form.price_type`
- arrays/objetos vindos de `sessions`, `contacts`, `setting_styles` e metadados de imagem.

**Regras**
- Se este arquivo for tocado, payload externo deve ser tratado como `unknown` e normalizado antes de entrar em estado React.
- O carregamento de edição não pode crashar quando campos opcionais vierem ausentes, nulos ou em formato legado conhecido.
