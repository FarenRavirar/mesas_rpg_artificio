# Feature Specification: Pacote Operacional Runtime e Workflows

**Feature Branch**: `005-runtime-workflows`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "Pacote operacional Runtime e Workflows, cobrindo: 1. revisão e correção do mesas-cron; 2. atualização do npm e Node.js; 3. revisão dos workflows"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cron Operacional Confiável (Priority: P1)

Como mantenedor do projeto, preciso que o serviço de rotinas agendadas esteja saudável e execute suas tarefas recorrentes sem ficar em ciclo de reinício, para que atividades automatizadas do portal continuem acontecendo sem intervenção manual.

**Why this priority**: O serviço `mesas-cron` já apresenta falha operacional observada em produção. Corrigir esse ponto reduz risco imediato antes de qualquer mudança de runtime.

**Independent Test**: Pode ser testado isoladamente verificando que o serviço de rotinas agendadas permanece saudável, sem reinícios contínuos, e executa uma rodada esperada das tarefas recorrentes.

**Acceptance Scenarios**:

1. **Given** o serviço de rotinas agendadas está em falha, **When** a correção é aplicada e validada, **Then** ele permanece ativo sem reiniciar continuamente.
2. **Given** uma rotina recorrente está configurada, **When** o serviço executa seu ciclo normal, **Then** a execução é registrada com sucesso e sem erro de comando ausente.
3. **Given** a correção precisa ser revertida, **When** o rollback documentado é seguido, **Then** o ambiente retorna ao estado anterior conhecido.

---

### User Story 2 - Runtime Atualizado com Segurança (Priority: P2)

Como mantenedor do projeto, preciso avaliar e aplicar atualizações compatíveis de runtime e gerenciador de pacotes, para reduzir risco de defasagem sem quebrar deploy, CI ou execução dos containers.

**Why this priority**: A atualização de npm é compatível com o runtime atual, mas mudanças de runtime precisam respeitar a linha LTS definida pelo projeto e a consistência entre VM, containers e CI.

**Independent Test**: Pode ser testado confirmando o inventário de versões antes/depois, executando validações de build e verificando que os serviços principais continuam saudáveis.

**Acceptance Scenarios**:

1. **Given** as versões atuais foram inventariadas, **When** a atualização compatível é planejada, **Then** a decisão registra impacto, rollback e evidência de compatibilidade.
2. **Given** uma atualização é aplicada, **When** os serviços principais são validados, **Then** os ambientes continuam respondendo sem regressão operacional.
3. **Given** uma atualização major é considerada, **When** ela excede a linha LTS vigente do projeto, **Then** ela é tratada como mudança separada que exige aprovação e validação próprias.

---

### User Story 3 - Workflows Coerentes com o Runtime (Priority: P3)

Como mantenedor do projeto, preciso que os workflows de CI/deploy estejam coerentes com o runtime suportado, para evitar divergência entre validação automatizada, build de imagens e operação na VM.

**Why this priority**: Mesmo com runtime estável, divergências entre workflows, imagens e VM podem gerar falhas de deploy ou validação falsa.

**Independent Test**: Pode ser testado por revisão completa dos workflows relevantes e execução de validações que confirmem que as versões e comandos esperados estão alinhados.

**Acceptance Scenarios**:

1. **Given** há workflows de build, deploy e promoção, **When** a revisão é concluída, **Then** cada workflow relevante tem runtime, instalação e comandos compatíveis com a política do projeto.
2. **Given** uma inconsistência é encontrada, **When** a correção é proposta, **Then** ela inclui evidência de impacto e rollback.
3. **Given** o pacote operacional é concluído, **When** o mantenedor revisa as evidências, **Then** há rastreabilidade clara entre cron, runtime e workflows.

---

### Edge Cases

- O serviço de rotinas agendadas pode estar falhando por uma dependência ausente, comando incorreto, ambiente incompleto ou divergência entre imagem e script.
- A atualização do gerenciador de pacotes pode ser compatível com o runtime atual, mas incompatível com alguma etapa de instalação, build ou deploy.
- A atualização de runtime pode ser segura localmente, mas ainda assim fora da linha LTS definida pelo projeto.
- Um workflow pode validar uma versão diferente daquela usada pelos containers ou pela VM.
- Uma correção operacional pode exigir ação em produção; nesse caso, as regras de aprovação explícita do projeto continuam obrigatórias.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O pacote MUST inventariar o estado atual do serviço de rotinas agendadas, incluindo status, erro observado, impacto operacional e evidência de reprodução.
- **FR-002**: O pacote MUST corrigir ou propor correção rastreável para o serviço de rotinas agendadas, com validação de que o serviço deixa de reiniciar continuamente.
- **FR-003**: O pacote MUST documentar rollback para a correção do serviço de rotinas agendadas antes de qualquer alteração em ambiente operacional.
- **FR-004**: O pacote MUST inventariar as versões atuais de runtime e gerenciador de pacotes na VM, nos serviços principais e nos fluxos automatizados relevantes.
- **FR-005**: O pacote MUST manter a atualização dentro da linha de runtime suportada pelo projeto, salvo aprovação explícita para mudança major separada.
- **FR-006**: O pacote MUST avaliar compatibilidade da atualização do gerenciador de pacotes antes de qualquer aplicação.
- **FR-007**: O pacote MUST registrar evidências de validação após qualquer atualização aplicada, incluindo saúde dos serviços afetados.
- **FR-008**: O pacote MUST revisar todos os workflows relevantes de CI, deploy e promoção para confirmar alinhamento com o runtime suportado.
- **FR-009**: O pacote MUST registrar inconsistências encontradas nos workflows, classificando impacto, ação recomendada e rollback.
- **FR-010**: O pacote MUST impedir que falhas preexistentes do serviço de rotinas agendadas sejam atribuídas indevidamente à atualização de runtime ou gerenciador de pacotes.
- **FR-011**: O pacote MUST preservar as regras de aprovação explícita para ações em produção, reinício de serviços, build no servidor e alterações fora do escopo.
- **FR-012**: O pacote MUST produzir evidências suficientes para o mantenedor decidir se a próxima fase pode avançar para planejamento e execução.

### Key Entities

- **Serviço de Rotinas Agendadas**: Representa o componente responsável por executar tarefas recorrentes do portal; inclui status, comando de execução, histórico de falhas e evidências de saúde.
- **Baseline de Runtime**: Representa a versão suportada do ambiente de execução e do gerenciador de pacotes; inclui versões atuais, versões candidatas, compatibilidade e decisão.
- **Workflow Operacional**: Representa cada fluxo automatizado relevante de validação, deploy ou promoção; inclui objetivo, runtime esperado, comandos executados e divergências encontradas.
- **Evidência de Validação**: Registro verificável de que uma ação foi testada; inclui comando observado, resultado, ambiente e impacto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O serviço de rotinas agendadas permanece saudável por pelo menos 30 minutos após a correção, sem ciclo de reinício contínuo.
- **SC-002**: 100% dos ambientes e serviços definidos como relevantes têm versões inventariadas antes de qualquer atualização.
- **SC-003**: 100% das atualizações aplicadas têm evidência de compatibilidade, validação pós-ação e rollback documentado.
- **SC-004**: 100% dos workflows relevantes de CI, deploy e promoção são revisados e classificados como alinhados ou com ação corretiva registrada.
- **SC-005**: Nenhuma mudança major de runtime é aplicada sem aprovação explícita e registro de escopo separado.
- **SC-006**: O mantenedor consegue auditar a sequência de decisão do pacote operacional em até 10 minutos usando os artefatos SDD e a sessão ativa.

## Assumptions

- O pacote tem foco operacional e não altera requisitos de produto voltados a mestres ou jogadores.
- O serviço de rotinas agendadas deve ser corrigido antes de qualquer mudança maior de runtime.
- A linha Node.js 25.9.0 Current passa a ser a baseline aprovada do projeto até decisão explícita em contrário.
- A atualização do npm dentro de uma faixa compatível pode ser avaliada neste pacote, desde que acompanhada de evidência e rollback.
- Qualquer ação que reinicie serviços, altere produção ou execute build no servidor exige aprovação explícita conforme AGENTS.md.
