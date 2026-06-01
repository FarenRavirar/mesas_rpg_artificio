# Data Model: Refatoração do Changelog

## Entrada de Changelog

**Purpose**: Objeto publicado para comunicar mudanças visíveis ao usuário final.

**Key Attributes**:
- `id`: identificador único baseado na data e tema consolidado.
- `title`: título curto e leigo.
- `body`: texto familiar orientado a benefício.
- `type`: categoria da entrada.
- `published`: indica se aparece para usuários.
- `created_at`: data e hora da publicação.

**Validation Rules**:
- Deve haver no máximo uma entrada publicada por data de calendário.
- Título e corpo não devem conter termos técnicos proibidos.
- Corpo deve consolidar mudanças do dia quando aplicável.

## Grupo por Data

**Purpose**: Conjunto de entradas com a mesma data de calendário.

**Key Attributes**:
- `date`: data no formato YYYY-MM-DD.
- `entries`: entradas pertencentes à data.
- `publishedCount`: quantidade de entradas publicadas.
- `consolidationDecision`: manter, consolidar, remover ou reescrever.

**Validation Rules**:
- `publishedCount` não pode ser maior que 1 no resultado final.
- Entradas do mesmo dia devem virar uma narrativa única quando publicadas.

## Mudança Duplicada

**Purpose**: Informação repetida, contraditória ou reaberta em múltiplas entradas.

**Key Attributes**:
- `topic`: assunto da mudança.
- `sourceEntries`: entradas onde aparece.
- `conflict`: descrição da duplicidade ou contradição.
- `finalMessage`: mensagem final consolidada.

**Validation Rules**:
- Duplicidade deve ser resolvida ou justificada.
- Mensagem final não deve expor tentativa intermediária.

## Entrada Consolidada

**Purpose**: Versão final unificada, pronta para usuários finais.

**Key Attributes**:
- `date`: data da publicação consolidada.
- `title`: título representativo do conjunto.
- `body`: lista de benefícios e mudanças finais.
- `mergedFrom`: entradas originais consideradas, registrado fora do changelog público quando necessário.

**Validation Rules**:
- Deve preservar o estado atual da mudança.
- Deve ser compreensível sem contexto técnico.
- Deve respeitar formato JSON existente.

## State Transitions

### Revisão

1. Ler entradas existentes.
2. Agrupar por data de calendário.
3. Identificar múltiplas entradas publicadas na mesma data.
4. Identificar assuntos repetidos ou contraditórios.
5. Classificar entrada como manter, consolidar, reescrever ou remover.

### Consolidação

1. Selecionar grupo com duplicidade.
2. Definir mensagem final orientada ao usuário.
3. Atualizar entrada consolidada.
4. Remover ou despublicar redundâncias conforme decisão documentada.
5. Validar JSON e regras editoriais.
