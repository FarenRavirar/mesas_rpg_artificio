# Feature Specification: Refatoração do Changelog

**Feature Branch**: `010-refatoracao-changelog`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Refatoração do changelog, pois mostra diversas alterações que foram alteradas novamente, pois foi pensado que tava resolvido, mas não estava, então tá com informação duplicada."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consolidar informações duplicadas no changelog (Priority: P1)

Como usuário final, quero ler um changelog sem entradas duplicadas ou contraditórias, para entender claramente o que mudou no sistema.

**Why this priority**: Changelog duplicado reduz confiança, cria ruído e pode comunicar que um problema foi resolvido antes de estar realmente corrigido.

**Independent Test**: Revisar o changelog publicado e confirmar que alterações repetidas ou reabertas foram consolidadas em uma comunicação única e coerente.

**Acceptance Scenarios**:

1. **Given** que uma melhoria aparece em mais de uma entrada, **When** ela trata do mesmo assunto corrigido novamente, **Then** o changelog deve consolidar a comunicação sem duplicidade.
2. **Given** que uma entrada dizia que algo foi resolvido mas depois foi alterado novamente, **When** o changelog for revisado, **Then** o texto deve refletir o estado correto sem prometer resolução anterior indevida.
3. **Given** que várias mudanças ocorreram na mesma data, **When** elas forem publicadas, **Then** devem respeitar a regra de entrada unificada por data.

---

### User Story 2 - Criar critério de revisão para changelog publicado (Priority: P1)

Como mantenedor, quero ter critérios objetivos para revisar entradas de changelog, para evitar duplicações futuras e mensagens enganosas.

**Why this priority**: Sem critério, o mesmo problema pode reaparecer quando uma correção é reaberta ou ajustada novamente.

**Independent Test**: Aplicar o critério em entradas existentes e confirmar que duplicidades, reaberturas e mensagens obsoletas são identificadas.

**Acceptance Scenarios**:

1. **Given** que uma nova entrada é criada, **When** já existe entrada da mesma data, **Then** a nova informação deve ser consolidada no objeto existente.
2. **Given** que uma correção foi reaberta, **When** o changelog é atualizado, **Then** ele deve comunicar a atualização final em linguagem leiga sem duplicar histórico técnico.
3. **Given** que uma entrada usa termo técnico, **When** for revisada, **Then** deve ser reescrita em linguagem clara para usuários finais.

---

### User Story 3 - Preservar histórico sem expor ruído técnico ao usuário (Priority: P2)

Como usuário final, quero ver apenas mudanças relevantes e atuais, sem histórico interno de tentativas, para não ser confundido por informações antigas ou duplicadas.

**Why this priority**: O changelog é comunicação de produto, não log técnico interno. Ele deve preservar clareza e confiança.

**Independent Test**: Verificar que o changelog final não contém linguagem técnica proibida, duplicidade por data ou entradas que contradizem o estado atual.

**Acceptance Scenarios**:

1. **Given** que há entradas históricas redundantes, **When** o changelog for consolidado, **Then** o usuário deve ver uma narrativa única e atual.
2. **Given** que um item foi alterado mais de uma vez, **When** a entrada final é exibida, **Then** ela deve descrever o benefício final sem detalhar tentativas anteriores.
3. **Given** que a mudança é visível para usuário final, **When** o changelog é publicado, **Then** ele deve usar linguagem leiga e familiar.

---

### Edge Cases

- Múltiplas entradas no mesmo dia de calendário.
- Entradas antigas que mencionam correções posteriormente refeitas.
- Textos que dizem “corrigido” mas foram substituídos por nova abordagem.
- Mistura de mudanças administrativas internas com mudanças visíveis ao usuário.
- Termos técnicos proibidos ou pouco claros para usuário final.
- Ordem cronológica afetada por consolidação.
- IDs de changelog duplicados ou com data divergente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O changelog MUST ser revisado para identificar entradas duplicadas, contraditórias ou obsoletas.
- **FR-002**: Melhorias publicadas na mesma data MUST ser consolidadas em um único objeto por data de calendário.
- **FR-003**: Entradas que comunicam correções posteriormente refeitas MUST ser reescritas para refletir o estado atual sem duplicidade.
- **FR-004**: O texto do changelog MUST usar linguagem leiga, familiar e compreensível para usuários finais.
- **FR-005**: O texto do changelog MUST NOT usar termos proibidos pela governança, incluindo `sidebar vertical`, `migration`, `refactor` e `placeholder`.
- **FR-006**: Mudanças exclusivamente administrativas internas MUST NOT ser publicadas como changelog de usuário final.
- **FR-007**: A consolidação MUST preservar ordem cronológica e IDs coerentes.
- **FR-008**: O processo MUST registrar quais entradas foram consolidadas, removidas, reescritas ou mantidas.
- **FR-009**: O changelog final MUST evitar comunicar tentativa intermediária como resultado final.
- **FR-010**: A validação MUST verificar que não há múltiplas entradas publicadas para a mesma data.

### Key Entities *(include if feature involves data)*

- **Entrada de Changelog**: Objeto publicado com data, título, corpo, tipo e status.
- **Grupo por Data**: Conjunto de entradas pertencentes ao mesmo dia de calendário.
- **Mudança Duplicada**: Informação repetida ou reaberta em mais de uma entrada.
- **Entrada Consolidada**: Versão final unificada, escrita para usuários finais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Não existe mais de uma entrada publicada para a mesma data de calendário.
- **SC-002**: 100% das duplicidades identificadas são consolidadas, removidas ou justificadas.
- **SC-003**: 100% das entradas revisadas usam linguagem leiga e não técnica.
- **SC-004**: Nenhuma entrada publicada contém os termos proibidos pela governança do changelog.
- **SC-005**: O changelog final comunica o estado atual das mudanças sem contradições internas.

## Assumptions

- O arquivo principal do changelog é `database/changelogs.json`.
- O escopo é refatoração/consolidação de conteúdo do changelog, não alteração do componente visual, salvo descoberta documentada.
- O changelog é comunicação para usuários finais e mestres, não registro técnico interno.
- O trabalho deve preservar JSON válido e não publicar mudanças administrativas internas desnecessárias.
