# Tasks: Refatoração do Changelog

**Input**: Design documents from `/specs/010-refatoracao-changelog/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Validação de JSON, busca por termos proibidos e verificação de duplicidade por data são obrigatórias.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: Mapeia a tarefa para a user story da spec.
- Todas as tarefas devem citar caminho de arquivo.

## Phase 1: Setup (Inventory)

**Purpose**: Inventariar o changelog antes de alterar conteúdo.

- [x] T001 Ler `database/changelogs.json` e registrar na sessão `sessoes/26-05-03_2_refatoracao-changelog.md` o total de entradas e entradas publicadas
- [x] T002 Criar inventário em `specs/010-refatoracao-changelog/changelog-inventory.md` com data, id, título, status publicado e assunto de cada entrada
- [x] T003 Agrupar entradas publicadas por data de calendário em `specs/010-refatoracao-changelog/changelog-inventory.md`

---

## Phase 2: Foundational (Classification)

**Purpose**: Identificar duplicidades, contradições e obsolescências antes da consolidação.

**⚠️ CRITICAL**: Nenhuma edição em `database/changelogs.json` deve iniciar antes desta fase estar concluída.

- [x] T004 Identificar datas com mais de uma entrada publicada em `specs/010-refatoracao-changelog/changelog-inventory.md`
- [x] T005 Identificar assuntos repetidos, correções reabertas ou mensagens contraditórias em `specs/010-refatoracao-changelog/changelog-inventory.md`
- [x] T006 Classificar cada entrada como manter, consolidar, reescrever, despublicar/remover ou fora de escopo em `specs/010-refatoracao-changelog/changelog-inventory.md`
- [x] T007 Registrar na sessão `sessoes/26-05-03_2_refatoracao-changelog.md` os grupos que serão modificados antes do primeiro patch em `database/changelogs.json`

**Checkpoint**: Inventário classificado e pronto para consolidação.

---

## Phase 3: User Story 1 - Consolidar informações duplicadas no changelog (Priority: P1) 🎯 MVP

**Goal**: Remover duplicidade e contradição em entradas publicadas.

**Independent Test**: Confirmar que não há mais de uma entrada publicada por data e que assuntos repetidos foram consolidados.

### Implementation for User Story 1

- [x] T008 [US1] Consolidar entradas duplicadas por data em `database/changelogs.json` conforme decisões registradas em `specs/010-refatoracao-changelog/changelog-inventory.md`
- [x] T009 [US1] Reescrever entradas com correções refeitas para comunicar apenas o estado final em `database/changelogs.json`
- [x] T010 [US1] Preservar ordem cronológica e IDs coerentes em `database/changelogs.json`
- [x] T011 [US1] Registrar na sessão `sessoes/26-05-03_2_refatoracao-changelog.md` entradas consolidadas, reescritas e removidas/despublicadas

**Checkpoint**: Changelog sem duplicidade principal.

---

## Phase 4: User Story 2 - Criar critério de revisão para changelog publicado (Priority: P1)

**Goal**: Evitar que duplicidade volte a acontecer.

**Independent Test**: Aplicar o critério às entradas existentes e confirmar que ele identifica data duplicada, assunto repetido e linguagem técnica.

### Implementation for User Story 2

- [x] T012 [US2] Registrar critérios de revisão em `specs/010-refatoracao-changelog/changelog-inventory.md` para data única, assunto consolidado e linguagem leiga
- [x] T013 [US2] Aplicar critérios em todas as entradas publicadas de `database/changelogs.json`
- [x] T014 [US2] Registrar na sessão `sessoes/26-05-03_2_refatoracao-changelog.md` que critérios foram aplicados ao arquivo final

**Checkpoint**: Critério de revisão aplicado ao changelog final.

---

## Phase 5: User Story 3 - Preservar histórico sem expor ruído técnico ao usuário (Priority: P2)

**Goal**: Garantir que o usuário veja apenas comunicação final relevante.

**Independent Test**: Revisar títulos e corpos publicados e confirmar ausência de jargão, histórico de tentativa ou contradição.

### Implementation for User Story 3

- [x] T015 [US3] Revisar linguagem de títulos e corpos publicados em `database/changelogs.json`
- [x] T016 [US3] Remover termos técnicos proibidos e jargões internos de `database/changelogs.json`
- [x] T017 [US3] Confirmar que mudanças exclusivamente administrativas internas não estão publicadas indevidamente em `database/changelogs.json`

**Checkpoint**: Changelog claro para usuários finais.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação estrutural e editorial.

- [x] T018 Validar que `database/changelogs.json` permanece JSON válido
- [x] T019 Executar busca final em `database/changelogs.json` para termos proibidos: `sidebar vertical`, `migration`, `refactor`, `placeholder`
- [x] T020 Verificar que não há múltiplas entradas publicadas para a mesma data de calendário em `database/changelogs.json`
- [x] T021 Validar `quickstart.md` e registrar evidências na sessão `sessoes/26-05-03_2_refatoracao-changelog.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do inventário.
- **US1, US2 e US3**: dependem da classificação completa.
- **Polish**: depende das alterações de conteúdo.

### User Story Dependencies

- **US1 (P1)**: depende de duplicidades classificadas.
- **US2 (P1)**: pode ser aplicada após US1 para evitar reincidência no resultado final.
- **US3 (P2)**: depende do conteúdo consolidado.

### Parallel Opportunities

- T002 e T003 podem ser paralelas se o inventário já tiver estrutura inicial.
- T015 e T016 podem ocorrer juntas durante revisão editorial.

---

## Implementation Strategy

### MVP First

1. Inventariar entradas.
2. Classificar duplicidades e contradições.
3. Consolidar entradas publicadas.
4. Revisar linguagem.
5. Validar JSON, termos proibidos e data única.

### Incremental Delivery

- Nenhum patch em `database/changelogs.json` sem inventário.
- Cada alteração deve estar rastreada no inventário.
- A conclusão exige busca final sem termos proibidos e sem data publicada duplicada.
