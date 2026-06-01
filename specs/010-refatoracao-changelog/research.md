# Research: Refatoração do Changelog

## Decision 1: Consolidar por data de calendário

**Rationale**: A governança do projeto proíbe múltiplas entradas publicadas na mesma data. Quando várias alterações ocorreram no mesmo dia, a comunicação precisa ser unificada em um único objeto.

**Alternatives considered**:
- Manter entradas separadas por assunto: rejeitado porque viola a regra de changelog por data.
- Criar entrada nova para corrigir entrada anterior: rejeitado porque aumenta duplicidade e ruído.

## Decision 2: Reescrever correções reabertas como narrativa final

**Rationale**: Quando algo foi anunciado como resolvido e depois precisou ser alterado novamente, o changelog não deve expor tentativas intermediárias. O usuário precisa entender o estado atual e o benefício final.

**Alternatives considered**:
- Manter histórico completo das tentativas: rejeitado porque changelog não é log técnico.
- Apagar toda menção à mudança: rejeitado se a mudança for visível ao usuário final.

## Decision 3: Usar linguagem leiga e orientada a benefício

**Rationale**: O changelog é comunicação para usuários finais. Termos técnicos reduzem clareza e podem expor detalhes internos desnecessários.

**Alternatives considered**:
- Manter nomes técnicos para precisão interna: rejeitado porque a precisão técnica deve ficar em documentação técnica, não no changelog público.
- Usar linguagem genérica demais: rejeitado porque o usuário ainda precisa entender o que mudou.

## Decision 4: Separar mudanças públicas de mudanças administrativas internas

**Rationale**: Nem toda alteração deve aparecer para o usuário final. Mudanças exclusivamente internas aumentam ruído e confundem a percepção do produto.

**Alternatives considered**:
- Publicar tudo para transparência total: rejeitado porque mistura comunicação de produto com log operacional.
- Publicar apenas grandes features: rejeitado porque correções visíveis também são relevantes.

## Decision 5: Validar termos proibidos e duplicidade por busca final

**Rationale**: A regra do projeto define termos proibidos e entrada única por data. A conclusão precisa de verificação objetiva.

**Alternatives considered**:
- Revisão manual sem busca final: rejeitado porque pode deixar duplicidade ou termo técnico passar.
- Validar apenas JSON: rejeitado porque JSON válido não garante qualidade editorial.
