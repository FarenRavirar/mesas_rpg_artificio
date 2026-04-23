# Feature Specification: Auditoria e Regularização dos GitHub Actions Workflows

**Feature Branch**: `[003-auditoria-workflows-actions]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Auditar, corrigir e validar todos os workflows em `.github/workflows/` para eliminar redundâncias, evitar falhas silenciosas, garantir testes fora do caminho feliz e estabilizar execução operacional"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inventário confiável dos workflows atuais (Priority: P1)

Como mantenedor, quero um inventário completo e verificável de todos os workflows ativos para entender exatamente o que dispara, quando dispara e com quais dependências.

**Why this priority**: Sem inventário fiel, qualquer correção pode introduzir regressão ou remover comportamentos necessários sem perceber.

**Independent Test**: Pode ser testado isoladamente validando que cada arquivo de `.github/workflows/` possui registro de gatilhos, jobs, dependências, concorrência e acoplamentos.

**Acceptance Scenarios**:

1. **Given** o diretório `.github/workflows/` com workflows reutilizáveis e de execução direta, **When** o inventário é gerado, **Then** 100% dos arquivos estão mapeados com seus gatilhos e responsabilidades.
2. **Given** workflows com `workflow_call`, `push`, `pull_request`, `schedule` e `workflow_dispatch`, **When** o inventário é revisado, **Then** cada tipo de evento e acoplamento entre workflows está explicitamente documentado.

---

### User Story 2 - Diagnóstico de redundâncias e falhas operacionais (Priority: P1)

Como mantenedor, quero identificar falhas concretas (duplicidade, corrida, falha silenciosa, gatilho incorreto) com severidade clara para priorizar correções de menor risco e maior impacto.

**Why this priority**: O problema central reportado é operacional (runs duplicados, inconsistentes e instáveis), então o diagnóstico com evidência é o núcleo da feature.

**Independent Test**: Pode ser testado isoladamente com uma matriz de achados por severidade, cada um com evidência literal e regra de correção proposta.

**Acceptance Scenarios**:

1. **Given** histórico de runs com sinais de duplicidade e resultados conflitantes para contexto semelhante, **When** o diagnóstico é executado, **Then** o relatório identifica causas prováveis e impacto operacional por fluxo.
2. **Given** scripts e steps sensíveis a erro nos workflows, **When** o diagnóstico valida tratamento de falhas, **Then** qualquer padrão de “falha engolida” fica marcado com severidade e ação corretiva.

---

### User Story 3 - Regularização com validação fora do caminho feliz (Priority: P2)

Como mantenedor, quero aplicar correções mínimas e reversíveis nos workflows e comprovar em cenários de falha real que o status exibido representa corretamente sucesso ou erro.

**Why this priority**: Corrigir sem validar cenários adversos mantém risco de regressão silenciosa em deploy e automações críticas.

**Independent Test**: Pode ser testado isoladamente executando uma bateria de cenários off-happy-path e verificando status esperado (✅/❌) e rastreabilidade por run.

**Acceptance Scenarios**:

1. **Given** uma correção aplicada para remover redundância ou corrida, **When** o mesmo gatilho é acionado em condições equivalentes, **Then** apenas o workflow correto executa uma vez.
2. **Given** um cenário induzido de erro controlado em etapa crítica, **When** o workflow roda, **Then** a execução falha de forma explícita com status ❌ e evidência em log.
3. **Given** workflows de deploy e sincronização documental no mesmo repositório, **When** a regularização é concluída, **Then** responsabilidades e limites de execução ficam não ambíguos.

---

### Edge Cases

- Mesmo commit ou mesma mudança lógica aciona múltiplos workflows por sobreposição de gatilhos.
- Dois workflows de produção/beta competem pelo mesmo lock lógico ou infraestrutura compartilhada.
- Workflow reutilizável (`workflow_call`) muda e afeta silenciosamente múltiplos pipelines consumidores.
- Job com sucesso aparente apesar de validação crítica ter sido ignorada por fluxo de shell tolerante.
- Execução manual (`workflow_dispatch`) ocorre durante execução já em progresso e gera comportamento concorrente inesperado.
- Mudança em docs/scripts auxiliares dispara pipeline de deploy sem necessidade operacional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A auditoria MUST cobrir todos os arquivos em `.github/workflows/`, incluindo workflows reutilizáveis e os de operação direta.
- **FR-002**: O inventário MUST registrar para cada workflow: evento disparador, filtros, jobs, dependências, locks de concorrência e destino operacional.
- **FR-003**: O diagnóstico MUST identificar e listar redundâncias de disparo para um mesmo contexto funcional.
- **FR-004**: O diagnóstico MUST identificar possíveis condições de corrida entre workflows com recursos compartilhados.
- **FR-005**: O diagnóstico MUST identificar padrões de falha silenciosa e status enganoso.
- **FR-006**: Cada achado MUST receber severidade explícita (crítica, alta, média, baixa) e impacto operacional descrito.
- **FR-007**: A proposta de correção MUST priorizar mudança mínima, reversível e compatível com contratos já existentes.
- **FR-008**: Nenhum workflow MUST ser removido sem mapeamento prévio de dependências e consumidores.
- **FR-009**: A regularização MUST definir limites claros entre responsabilidades de CI, deploy e sincronizações auxiliares.
- **FR-010**: A validação MUST incluir cenários fora do caminho feliz com expectativa de falha explícita quando aplicável.
- **FR-011**: A validação MUST produzir evidência literal por cenário (run, logs e resultado observado).
- **FR-012**: O resultado final MUST distinguir claramente: itens corrigidos, riscos residuais e pendências bloqueantes.

### Key Entities *(include if feature involves data)*

- **Workflow Inventory Item**: Registro canônico por arquivo de workflow com gatilhos, escopo, dependências e locks.
- **Finding**: Não conformidade detectada durante auditoria, incluindo severidade, impacto e evidência.
- **Regularization Action**: Correção mínima proposta/aplicada para eliminar falha sem quebrar fluxos adjacentes.
- **Validation Scenario**: Cenário de teste (inclusive adverso) com entrada, expectativa e resultado observado.
- **Evidence Record**: Prova verificável da execução (links de run, trechos de log, status final).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos workflows em `.github/workflows/` estão inventariados e classificados por responsabilidade operacional.
- **SC-002**: 100% dos achados críticos e altos têm ação de regularização definida; nenhum permanece sem severidade.
- **SC-003**: Em validação pós-correção, não há duplicidade indevida de execução para o mesmo contexto de disparo definido na spec.
- **SC-004**: 100% dos cenários off-happy-path planejados exibem status coerente com o resultado real (erro real = ❌ visível).
- **SC-005**: Toda correção aplicada possui evidência literal associada e rastreável.

## Assumptions

- O repositório mantém os workflows canônicos no diretório `.github/workflows/`.
- Há acesso ao histórico de runs e logs necessários para validar comportamento observado.
- A regularização não introduzirá novos fluxos de produto; o foco é estabilização operacional dos workflows existentes.
- Mudanças serão aplicadas de forma incremental para reduzir risco de regressão entre CI, deploy beta e deploy produção.
- O critério de aprovação da etapa exige evidência objetiva, sem validação por percepção subjetiva.
