# Feature Specification: Imagens, Banners e Placeholders

**Feature Branch**: `006-imagens-banners-placeholder`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Investigar como o sistema recebe as imagens e armazena. Diversas mesas com link direto não estão sendo reupadas no serviço de upload usado, fazendo com que links diretos que expiram vão para o placeholder. Refatorar o código do placeholder ou da exibição do banner e onde ele insere na página principal, catálogo, página do mestre e página da mesa, centralizando como foi feito com badges DDAL/Covil do Lich."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preservar banners enviados por link (Priority: P1)

Como mestre, quero que uma imagem informada por link direto continue aparecendo na minha mesa mesmo quando a origem temporária expirar, para que meu anúncio não perca identidade visual nem caia indevidamente em placeholder.

**Why this priority**: O problema atual afeta anúncios publicados e causa perda visual visível para jogadores e mestres.

**Independent Test**: Pode ser testado publicando ou editando uma mesa com imagem por link direto temporário e verificando que a imagem final exibida usa uma fonte persistente aprovada, não o link temporário original.

**Acceptance Scenarios**:

1. **Given** um mestre informa um link direto válido como banner de mesa, **When** a mesa é salva, **Then** o anúncio passa a depender de uma imagem persistida em fonte aprovada pelo projeto.
2. **Given** o link original deixa de responder ou expira, **When** a mesa é exibida, **Then** o banner persistido continua aparecendo sem substituir a arte por placeholder.
3. **Given** a imagem informada não pode ser baixada ou validada, **When** a mesa é salva ou exibida, **Then** o usuário recebe feedback compreensível e a interface usa fallback consistente.

---

### User Story 2 - Exibir o mesmo banner correto em todas as telas (Priority: P2)

Como jogador, quero ver a mesma imagem correta de uma mesa na página principal, no catálogo, na página do mestre e na página da mesa, para reconhecer o anúncio sem inconsistência entre telas.

**Why this priority**: O print mostra inconsistência visual no catálogo/principal e o relato indica placeholder constante na página do mestre.

**Independent Test**: Pode ser testado acessando uma mesa com banner válido em todas as telas listadas e comparando se a mesma fonte visual aparece sem regressão para placeholder.

**Acceptance Scenarios**:

1. **Given** uma mesa tem banner persistente válido, **When** ela aparece na página principal, catálogo, página do mestre e página da mesa, **Then** todas as telas exibem o banner correto.
2. **Given** uma mesa não tem banner válido, **When** ela aparece em qualquer tela, **Then** todas as telas usam o mesmo fallback visual definido para esse contexto.
3. **Given** uma imagem falha ao carregar no navegador, **When** a tela aplica fallback, **Then** o comportamento é igual nos componentes de listagem e detalhe.

---

### User Story 3 - Centralizar regras de placeholder e banner (Priority: P3)

Como mantenedor, quero que a escolha entre banner real e placeholder fique em um único ponto reutilizável, para reduzir duplicação e impedir que cada página corrija o problema de um jeito diferente.

**Why this priority**: A manutenção fica frágil quando a lógica de fallback é duplicada e espalhada por telas.

**Independent Test**: Pode ser testado alterando a regra de fallback em um único local e verificando que as telas afetadas seguem o mesmo comportamento.

**Acceptance Scenarios**:

1. **Given** existe uma regra central para resolver imagem de mesa, **When** qualquer tela renderiza banner, **Then** ela consome a mesma regra em vez de duplicar decisões locais.
2. **Given** há variações de tamanho/layout entre telas, **When** a imagem é exibida, **Then** a regra de origem/fallback permanece centralizada e apenas a apresentação visual varia por contexto.

### Edge Cases

- Link direto válido no momento do cadastro, mas expirado após publicação.
- Link direto que retorna erro, HTML, conteúdo não-imagem ou imagem pesada demais.
- Imagem persistida ausente, removida ou inacessível no serviço aprovado.
- Mesa sem banner, mestre sem imagem de perfil ou dados antigos importados antes da regra atual.
- Falha de carregamento no navegador mesmo com URL persistente aparentemente válida.
- Listagens com várias mesas carregando imagens ao mesmo tempo sem quebrar layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST identificar quando uma imagem de mesa ou mestre foi fornecida por link direto externo.
- **FR-002**: O sistema MUST persistir imagens fornecidas por link direto em uma fonte aprovada e durável antes de depender delas para exibição pública.
- **FR-003**: O sistema MUST evitar que links diretos temporários sejam usados como fonte final de banner em anúncios públicos quando houver persistência aprovada disponível.
- **FR-004**: O sistema MUST registrar uma origem de imagem consistente para cada mesa exibida publicamente.
- **FR-005**: O sistema MUST aplicar uma regra única e reutilizável para decidir entre imagem real e placeholder em banners de mesa.
- **FR-006**: O sistema MUST aplicar comportamento consistente de banner/fallback na página principal, catálogo, página do mestre e página da mesa.
- **FR-007**: O sistema MUST preservar a experiência visual quando a imagem original expira, desde que uma cópia persistente tenha sido obtida com sucesso.
- **FR-008**: O sistema MUST tratar falhas de imagem com fallback compreensível e consistente, sem quebrar o layout da página.
- **FR-009**: O sistema MUST permitir auditoria de mesas afetadas por links diretos que não foram persistidos corretamente.
- **FR-010**: O sistema MUST manter compatibilidade visual com mesas existentes durante a transição para a regra centralizada.
- **FR-011**: Em imagens inseridas por URL manual, o sistema MUST oferecer uma opção explícita para manter link direto sem reupload, acompanhada de aviso claro sobre risco de quebra futura.
- **FR-012**: Quando o usuário optar por manter link direto, o sistema MUST preservar essa escolha e não tentar importar a imagem automaticamente para a hospedagem aprovada.

### Key Entities

- **Imagem de Mesa**: Arte visual associada a uma mesa, com origem informada, fonte persistida e estado de disponibilidade.
- **Mesa**: Anúncio público que usa imagem/banner em listagens e página de detalhe.
- **Perfil de Mestre**: Página pública do mestre que pode exibir banners de mesas e imagens associadas.
- **Placeholder Visual**: Imagem fallback usada quando não há imagem válida ou quando a imagem falha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das telas afetadas exibem a mesma decisão de imagem para a mesma mesa em validação manual.
- **SC-002**: Mesas com links diretos válidos no cadastro deixam de depender do link externo temporário como fonte pública final.
- **SC-003**: Mesas com imagem persistida continuam exibindo banner real mesmo após indisponibilidade do link original.
- **SC-004**: A lógica de escolha entre banner e placeholder passa a ter um ponto canônico documentado para manutenção.
- **SC-005**: Nenhuma tela afetada fica com banner quebrado, layout colapsado ou placeholder indevido quando existe imagem válida.

## Assumptions

- O projeto continuará usando o serviço de upload/hospedagem de imagem já aprovado pela governança atual.
- A investigação deve cobrir imagens de mesas e imagens relacionadas à exibição pública de mestres, sem alterar regras de autenticação.
- Dados antigos podem conter URLs diretas externas e precisam ser considerados no diagnóstico.
- A correção de dados já publicados pode exigir etapa separada de backfill ou rotina de auditoria após o mapeamento técnico.
- Para imagens de perfil e banners informados por URL manual, a experiência padrão deve favorecer reupload/persistência durável, mas usuários avançados podem escolher manter link direto assumindo o risco de indisponibilidade.
