# Data Model: Editor Rico em Textareas

## Campo de Texto Longo

**Purpose**: Entrada textual atualmente implementada com `textarea` ou equivalente.

**Key Attributes**:
- `location`: arquivo e tela onde o campo aparece.
- `purpose`: finalidade do campo para o usuário.
- `audience`: público que usa o campo.
- `currentValidation`: limites e obrigatoriedade existentes.
- `currentStorage`: forma como o conteúdo é salvo ou enviado.

**Validation Rules**:
- Toda ocorrência deve ser inventariada.
- Nenhuma ocorrência deve ser substituída antes de classificação.
- Validações existentes devem ser preservadas.

## Editor Rico

**Purpose**: Ferramenta de edição com formatação usada em Descrição da Mesa e reutilizada em campos elegíveis.

**Key Attributes**:
- `toolbar`: conjunto de ações de edição disponíveis.
- `contentValue`: conteúdo editável.
- `emptyState`: comportamento quando não há conteúdo.
- `validationState`: erro, obrigatório, limite ou estado válido.

**Validation Rules**:
- Deve ser o mesmo padrão usado em Descrição da Mesa.
- Deve funcionar em desktop e mobile.
- Não deve criar comportamento divergente por tela sem justificativa.

## Mapeamento de Textareas

**Purpose**: Inventário canônico da feature para decidir substituições.

**Key Attributes**:
- `fieldId`: identificação da ocorrência.
- `filePath`: caminho do arquivo.
- `screen`: tela ou fluxo.
- `classification`: elegível ou não elegível.
- `reason`: justificativa da decisão.
- `replacementStatus`: não iniciado, substituído, mantido ou fora de escopo.

**Validation Rules**:
- Deve cobrir 100% das ocorrências encontradas.
- Cada ocorrência deve ter decisão explícita.
- Campos não elegíveis devem ter justificativa.

## Conteúdo Legado

**Purpose**: Texto existente salvo antes da padronização do editor rico.

**Key Attributes**:
- `rawText`: texto puro existente.
- `renderedText`: forma apresentada ao usuário.
- `editedText`: conteúdo após edição pelo editor.

**Validation Rules**:
- Conteúdo legado deve abrir sem perda.
- Usuário deve conseguir editar e salvar.
- Reabertura deve preservar conteúdo esperado.

## State Transitions

### Mapeamento

1. Buscar todas as ocorrências de `textarea` no frontend.
2. Registrar caminho e finalidade.
3. Classificar como elegível ou não elegível.
4. Validar se o mapeamento cobre 100% das ocorrências.

### Substituição

1. Selecionar campo elegível.
2. Substituir entrada simples pelo editor rico canônico.
3. Preservar valor, validação e salvamento.
4. Testar abrir, editar, salvar e reabrir.
5. Repetir por campo elegível.

### Campo mantido como texto puro

1. Identificar motivo de não elegibilidade.
2. Registrar justificativa.
3. Manter comportamento existente.
4. Confirmar que não houve regressão.
