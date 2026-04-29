# Research: Editor Rico em Textareas

## Decision 1: Inventário completo antes de qualquer substituição

**Rationale**: O pedido exige mapeamento de todo local com `textarea`. Substituir campo por campo sem inventário cria risco de inconsistência, regressão e duplicidade de padrões.

**Alternatives considered**:
- Procurar apenas campos visíveis ao usuário final: rejeitado porque pode deixar formulários administrativos ou secundários inconsistentes.
- Substituir todos automaticamente: rejeitado porque nem todo campo longo deve ter formatação rica.

## Decision 2: A referência canônica é o editor de Descrição da Mesa

**Rationale**: O produto já possui uma ferramenta aprovada para edição rica. Reaproveitar esse padrão reduz divergência visual, comportamento inesperado e custo de manutenção.

**Alternatives considered**:
- Criar novo editor para outros campos: rejeitado por duplicar UX e manutenção.
- Usar editor rico diferente por tela: rejeitado por inconsistência.

## Decision 3: Elegibilidade depende da finalidade do campo

**Rationale**: Campos descritivos, apresentações, textos públicos e instruções extensas tendem a se beneficiar de edição rica. Campos técnicos, curtos, internos, mensagens simples ou dados com limite rígido podem permanecer texto puro.

**Alternatives considered**:
- Todo `textarea` vira editor rico: rejeitado por excesso de complexidade.
- Nenhum `textarea` muda sem pedido específico por tela: rejeitado porque mantém inconsistência geral.

## Decision 4: Validações e limites existentes devem ser preservados

**Rationale**: A troca do componente de entrada não pode alterar contrato funcional do formulário. Limites, obrigatoriedade, mensagens de erro e salvamento precisam se manter equivalentes.

**Alternatives considered**:
- Remover limites para permitir formatação: rejeitado porque muda regra de produto.
- Migrar validações depois: rejeitado porque gera risco de regressão.

## Decision 5: Conteúdo legado em texto puro deve continuar editável

**Rationale**: Campos existentes podem ter conteúdo salvo sem marcação rica. O editor precisa abrir esse conteúdo de modo seguro e permitir edição sem perda inesperada.

**Alternatives considered**:
- Converter conteúdo legado em lote: rejeitado porque sugere mudança de dados não solicitada.
- Exigir recriação manual do conteúdo: rejeitado porque prejudica usuários.

## Decision 6: Responsividade do editor deve ser validada em cada fluxo substituído

**Rationale**: Editores ricos têm barra de ferramentas e área de edição que podem quebrar layouts em mobile. Cada formulário afetado precisa de validação em desktop e mobile.

**Alternatives considered**:
- Validar apenas o componente isolado: rejeitado porque o problema costuma aparecer no contexto do formulário.
- Validar apenas desktop: rejeitado porque o produto exige abordagem responsiva.
