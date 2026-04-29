# Research: Verificação de Sugestões de Sistemas no Admin

## Decision 1: Investigar fluxo ponta a ponta antes de corrigir

**Rationale**: O pedido é verificar se o sistema realmente funciona. A falha pode estar no formulário, rota, validação, persistência, filtro administrativo, permissão ou integração com Notificações. Corrigir sem mapa pode atacar a camada errada.

**Alternatives considered**:
- Ajustar diretamente a tela de gestão: rejeitado porque a sugestão pode nem estar sendo persistida.
- Criar notificação imediatamente: rejeitado porque pode mascarar falha na gestão ou duplicar canais.

## Decision 2: Definir canal administrativo oficial

**Rationale**: O admin pode acompanhar sugestões pela gestão ou por Notificações. O produto precisa definir se Notificações é obrigatória ou se a gestão deve sinalizar pendências com clareza suficiente.

**Alternatives considered**:
- Exigir os dois canais sem análise: rejeitado porque pode gerar ruído operacional.
- Não definir canal: rejeitado porque mantém incerteza para o admin.

## Decision 3: Classificar falhas por camada

**Rationale**: A correção depende de identificar se o problema é frontend, backend, persistência, permissão, integração ou notificação. Essa classificação evita correções superficiais.

**Alternatives considered**:
- Registrar apenas “não chegou no admin”: rejeitado porque não orienta correção.
- Tratar como bug visual: rejeitado porque pode ser falha de persistência ou permissão.

## Decision 4: Preservar permissões administrativas

**Rationale**: Sugestões administrativas podem conter dados de usuários ou decisões internas. A listagem e notificações devem ser visíveis apenas para perfis autorizados.

**Alternatives considered**:
- Tornar sugestões públicas para facilitar validação: rejeitado por risco de exposição.
- Ignorar permissão durante teste: rejeitado porque teste precisa representar uso real.

## Decision 5: Validação deve ocorrer no Beta com envio real

**Rationale**: O funcionamento precisa ser comprovado no ambiente onde o problema é relevante. Simulações locais não substituem envio real e consulta por admin no Beta.

**Alternatives considered**:
- Validar apenas pelo banco: rejeitado porque admin precisa enxergar no produto.
- Validar apenas pela UI: rejeitado porque falha pode estar escondida em persistência ou filtros.
