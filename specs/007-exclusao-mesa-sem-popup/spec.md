# Feature Specification: Exclusão de Mesa Sem Pop-up

**Feature Branch**: `007-exclusao-mesa-sem-popup`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Refatorar sistema de excluir uma mesa. Hoje está usando pop-up, o que é nada profissional para o usuário final. Tem que refazer para que faça tudo dentro da página, sem confirmação via pop up. Mas pensando em uma solução segura que não use pop up."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirmar exclusão dentro da página (Priority: P1)

Como mestre responsável por uma mesa, quero excluir uma mesa usando uma confirmação integrada à própria página, sem pop-up, para manter uma experiência profissional e clara em uma ação destrutiva.

**Why this priority**: A exclusão de mesa remove um conteúdo importante do mestre. O fluxo atual com pop-up quebra a experiência visual, parece improvisado para o usuário final e ainda precisa ser substituído por um fluxo seguro.

**Independent Test**: Pode ser testado acessando uma mesa própria ou área de gerenciamento, iniciando a exclusão e confirmando a ação dentro da própria página sem exibição de pop-up.

**Acceptance Scenarios**:

1. **Given** que o mestre está em uma área onde pode excluir uma mesa própria, **When** ele escolhe excluir, **Then** a página exibe uma confirmação integrada ao layout, sem pop-up.
2. **Given** que a confirmação integrada está visível, **When** o mestre confirma a exclusão, **Then** a mesa é excluída e a página informa o sucesso da ação.
3. **Given** que a confirmação integrada está visível, **When** o mestre cancela a exclusão, **Then** a mesa permanece inalterada e a página retorna ao estado anterior.

---

### User Story 2 - Evitar exclusão acidental (Priority: P1)

Como mestre, quero que a exclusão exija uma segunda ação consciente dentro da página, para impedir que um clique acidental apague uma mesa.

**Why this priority**: A substituição do pop-up só é aceitável se mantiver ou aumentar a segurança contra erro humano.

**Independent Test**: Pode ser testado clicando inicialmente em excluir e verificando que a mesa não é removida até que uma confirmação adicional seja realizada.

**Acceptance Scenarios**:

1. **Given** que o mestre clicou em excluir, **When** ele ainda não confirmou a ação final, **Then** a mesa não deve ser removida.
2. **Given** que o mestre iniciou a exclusão por engano, **When** ele cancela ou abandona a confirmação, **Then** nenhuma alteração deve ocorrer na mesa.
3. **Given** que a exclusão está em processamento, **When** o mestre tenta confirmar novamente, **Then** o sistema deve impedir duplicidade de ação.

---

### User Story 3 - Entender o impacto antes da exclusão (Priority: P2)

Como mestre, quero ver de forma simples qual mesa será excluída e qual será a consequência, para confirmar a ação com segurança.

**Why this priority**: A clareza reduz erro, arrependimento e percepção de risco em uma operação destrutiva.

**Independent Test**: Pode ser testado iniciando a exclusão e verificando se a própria página identifica a mesa afetada e comunica a consequência antes da confirmação final.

**Acceptance Scenarios**:

1. **Given** que o mestre iniciou a exclusão, **When** a confirmação aparece, **Then** ela identifica a mesa afetada.
2. **Given** que o mestre iniciou a exclusão, **When** a confirmação aparece, **Then** ela comunica em linguagem simples que a mesa será removida da plataforma.
3. **Given** que ocorre falha na exclusão, **When** o sistema retorna erro, **Then** a página mostra a falha sem usar pop-up e sem perder o contexto.

---

### Edge Cases

- O mestre inicia a exclusão e muda de ideia antes de confirmar.
- O mestre tenta confirmar a exclusão duas vezes rapidamente.
- A exclusão falha por instabilidade temporária.
- A mesa já foi removida ou deixou de estar disponível antes da confirmação final.
- Um usuário sem permissão tenta acionar o fluxo de exclusão.
- O fluxo é usado em tela pequena ou dispositivo móvel.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST substituir confirmações de exclusão de mesa baseadas em pop-up por confirmação integrada à própria página.
- **FR-002**: O sistema MUST impedir que uma mesa seja excluída apenas pela primeira ação de intenção.
- **FR-003**: O mestre MUST conseguir cancelar a exclusão antes da confirmação final sem alterar a mesa.
- **FR-004**: A confirmação integrada MUST estar visualmente associada à mesa ou ação que será executada.
- **FR-005**: A confirmação integrada MUST identificar a mesa que será excluída.
- **FR-006**: A confirmação integrada MUST explicar, em linguagem simples, que a mesa será removida da plataforma.
- **FR-007**: O sistema MUST impedir confirmações duplicadas enquanto a exclusão estiver em processamento.
- **FR-008**: O sistema MUST mostrar retorno de sucesso dentro da página após a exclusão.
- **FR-009**: O sistema MUST mostrar retorno de erro dentro da página quando a exclusão falhar.
- **FR-010**: O sistema MUST preservar as permissões atuais de exclusão de mesa.
- **FR-010a**: Na página/preview da mesa, o sistema MUST usar o endpoint de mestre para o dono da mesa e o endpoint administrativo para usuário admin, preservando o contexto de permissão que tornou a ação visível.
- **FR-011**: O fluxo MUST ser compreensível e utilizável em desktop e mobile.
- **FR-012**: O sistema MUST manter navegação clara após sucesso, cancelamento ou erro.

**Bugfix**: 2026-04-29 — BUG-001 A página/preview da mesa deve selecionar a rota de exclusão conforme contexto de gestão (`gm` ou `admin`) para evitar 404 indevido em exclusões administrativas.

### Key Entities *(include if feature involves data)*

- **Mesa**: Conteúdo criado e gerenciado por um mestre, com identidade e título usados para confirmação antes da exclusão.
- **Mestre responsável**: Usuário autorizado a gerenciar e excluir a mesa.
- **Confirmação de exclusão**: Estado temporário da interface que exige uma segunda ação consciente antes da remoção.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos fluxos de exclusão de mesa acessíveis ao usuário final deixam de usar pop-up.
- **SC-002**: Em teste funcional, a mesa não é excluída após apenas uma ação inicial de intenção.
- **SC-003**: Em teste funcional, o usuário consegue cancelar a exclusão e manter a mesa sem alteração.
- **SC-004**: Em teste funcional, sucesso e erro da exclusão aparecem dentro da página, sem pop-up.
- **SC-005**: Em validação visual, o fluxo de confirmação permanece compreensível em desktop e mobile.

## Assumptions

- O escopo se limita aos fluxos de exclusão de mesa acessíveis ao usuário final autorizado.
- A feature não altera regras de permissão nem quem pode excluir uma mesa.
- A feature não exige mudança de banco de dados.
- A confirmação segura será uma segunda ação consciente dentro da página.
- A implementação deve preservar a proteção existente contra exclusões não autorizadas.
