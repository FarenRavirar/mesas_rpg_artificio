# Tasks: Verificação de Sugestões de Sistemas no Admin

**Input**: Design documents from `/specs/011-verificacao-sugestoes-sistemas-admin/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Validação funcional no Beta com envio real e consulta admin é obrigatória; build técnico é obrigatório se houver implementação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: Mapeia a tarefa para a user story da spec.
- Todas as tarefas devem citar caminho de arquivo.

## Phase 1: Setup (Flow Mapping)

**Purpose**: Mapear o fluxo existente antes de corrigir.

- [ ] T001 Identificar telas/componentes de envio de sugestão de sistemas em `frontend/src/` e registrar caminhos na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T002 Identificar rotas/serviços backend responsáveis por receber sugestão de sistemas em `backend/src/` e registrar caminhos na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T003 Identificar persistência/tabelas/repositorios de sugestões de sistemas em `backend/src/` e `database/`, registrando caminhos na sessão
- [ ] T004 Identificar tela administrativa de gestão de sistemas/sugestões em `frontend/src/` e registrar caminhos na sessão
- [ ] T005 Identificar ferramenta de Notificações e integração com notificações administrativas em `frontend/src/` e `backend/src/`
- [ ] T006 Criar mapa do fluxo em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` com telas, rotas, persistência, permissões e notificações envolvidas

---

## Phase 2: Foundational (Channel Decision & Failure Classification)

**Purpose**: Definir canal administrativo e critérios de falha antes de patches.

**⚠️ CRITICAL**: Nenhuma correção técnica deve iniciar antes desta fase estar concluída.

- [ ] T007 Definir em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` se o canal obrigatório será gestão, Notificações ou ambos
- [ ] T008 Classificar em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` possíveis falhas por camada: frontend, backend, persistência, permissão, integração ou notificação
- [ ] T009 Registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md` os arquivos que serão modificados se a verificação encontrar falha

**Checkpoint**: Fluxo mapeado e canal administrativo definido.

---

## Phase 3: User Story 1 - Confirmar envio de sugestão de sistema (Priority: P1) 🎯 MVP

**Goal**: Verificar se sugestão enviada pelo usuário é registrada corretamente.

**Independent Test**: Enviar sugestão no Beta e confirmar registro consultável.

### Implementation for User Story 1

- [ ] T010 [US1] Validar fluxo de envio no frontend identificado em `frontend/src/` para confirmar que sucesso só é exibido após registro real
- [ ] T011 [US1] Validar rota/serviço backend identificado em `backend/src/` para confirmar persistência da sugestão
- [ ] T012 [US1] Registrar evidência do envio real no Beta em `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T013 [US1] Se houver falha no envio/persistência, registrar severidade, camada e correção proposta em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md`

**Checkpoint**: Envio confirmado ou falha classificada.

---

## Phase 4: User Story 2 - Admin visualiza sugestões na gestão (Priority: P1)

**Goal**: Confirmar que admin consegue ver sugestões pendentes na gestão.

**Independent Test**: Enviar sugestão e confirmar que ela aparece na gestão administrativa.

### Implementation for User Story 2

- [ ] T014 [US2] Validar listagem/filtros da gestão administrativa identificada em `frontend/src/`
- [ ] T015 [US2] Validar rota/serviço admin identificado em `backend/src/` para consultar sugestões pendentes
- [ ] T016 [US2] Validar permissões administrativas do fluxo sem expor sugestões para usuários não autorizados
- [ ] T017 [US2] Registrar evidência de visualização admin no Beta em `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T018 [US2] Se houver falha na gestão, registrar severidade, camada e correção proposta em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md`

**Checkpoint**: Admin visualiza sugestões pela gestão ou falha classificada.

---

## Phase 5: User Story 3 - Admin recebe ou consulta notificação de sugestão (Priority: P1)

**Goal**: Definir e validar participação da ferramenta de Notificações.

**Independent Test**: Enviar sugestão e verificar Notificações; se não for canal obrigatório, registrar decisão de produto.

### Implementation for User Story 3

- [ ] T019 [US3] Validar fluxo de criação/listagem de Notificações identificado em `frontend/src/` e `backend/src/`
- [ ] T020 [US3] Se Notificações for canal obrigatório, validar criação de alerta para admin autorizado
- [ ] T021 [US3] Se Notificações não for canal obrigatório, registrar em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` que gestão é canal oficial e como ela sinaliza pendências
- [ ] T022 [US3] Registrar evidência da decisão e validação em `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Canal administrativo sem ambiguidade.

---

## Phase 6: User Story 4 - Mapear o fluxo ponta a ponta antes de corrigir (Priority: P1)

**Goal**: Consolidar o diagnóstico e impedir correção na camada errada.

**Independent Test**: Revisar `flow-map.md` e confirmar que cada etapa tem evidência de funcionamento ou falha.

### Implementation for User Story 4

- [ ] T023 [US4] Consolidar em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` o status de cada etapa do fluxo
- [ ] T024 [US4] Listar em `specs/011-verificacao-sugestoes-sistemas-admin/flow-map.md` correções concretas necessárias, se houver
- [ ] T025 [US4] Se nenhuma falha for encontrada, registrar evidência ponta a ponta e critério de monitoramento futuro em `flow-map.md`

**Checkpoint**: Diagnóstico completo e rastreável.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação técnica e funcional.

- [ ] T026 Executar `npm --prefix frontend run build` se houver mudança no frontend e registrar saída na sessão
- [ ] T027 Executar validação técnica do backend se houver mudança no backend e registrar saída na sessão
- [ ] T028 Validar `quickstart.md` no Beta em janela anônima/fluxo real e registrar resultado na sessão
- [ ] T029 Atualizar `database/changelogs.json` se a correção alterar experiência visível de usuários/admins

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do mapa do fluxo.
- **US1, US2, US3 e US4**: dependem da definição de canal e critérios de falha.
- **Polish**: depende de diagnóstico/correções.

### User Story Dependencies

- **US1 (P1)**: valida origem do fluxo.
- **US2 (P1)**: depende de sugestão registrada ou falha classificada em US1.
- **US3 (P1)**: depende da definição de canal administrativo.
- **US4 (P1)**: consolida evidências das histórias anteriores.

### Parallel Opportunities

- T001, T004 e T005 podem ocorrer em paralelo na investigação frontend.
- T002 e T003 podem ocorrer em paralelo na investigação backend/persistência.
- T014 e T019 podem ser paralelas se gestão e notificações estiverem em arquivos diferentes.

---

## Implementation Strategy

### MVP First

1. Mapear envio, persistência, gestão e notificações.
2. Definir canal administrativo obrigatório.
3. Validar envio real.
4. Validar chegada na gestão.
5. Validar ou documentar Notificações.
6. Classificar falhas e propor correções.

### Incremental Delivery

- Nenhuma correção antes do mapa do fluxo.
- Falhas devem ter camada, severidade e correção proposta.
- A conclusão exige evidência no Beta ou registro claro do bloqueio.
