# Resumo de Sessão — 05/04/2026 (Sessão 3)

## Objetivo da sessão
Documentar melhorias críticas no formulário de criação/edição de mesas e na exibição pública, identificadas durante validação em beta pelo responsável.

## Plano de execução
1. Analisar requisitos do usuário e classificar por natureza (produto vs técnico)
2. Criar REQ-21 no TODO_OPERACIONAL.md (requisito de produto)
3. Criar itens técnicos 075-095 na FILA_IMPLEMENTACAO.md (tarefas de implementação)
4. Atualizar documentos relevantes

## Task list
- [x] Analisar e classificar requisitos do usuário
- [x] Criar REQ-21 no TODO_OPERACIONAL.md
- [x] Criar itens 075-095 na FILA_IMPLEMENTACAO.md
- [x] Validar consistência entre TODO e FILA
- [x] Atualizar documentos relevantes

## Arquivos-alvo
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`

## Critério de conclusão
Todos os requisitos documentados corretamente, com score GUT atribuído e itens técnicos mapeados.

## Requisitos identificados pelo usuário

### 1. Paridade de campos (criação vs visualização)
- Todos os campos visíveis em `/mesas/:slug` devem estar disponíveis no formulário de criação

### 2. Perfil do mestre em mesas de anunciantes
- Mesas com `publisher_role = 'announcer'` NÃO devem exibir link "Ver perfil do mestre"

### 3. Frequência para mesas em andamento
- Mesas com `is_ongoing = true` ainda precisam selecionar frequência (semanal/quinzenal/mensal)
- Se semanal: selecionar dia da semana
- Se quinzenal: quantas vezes por mês
- Se mensal: qual dia da semana ou observações

### 4. Placeholder não funcional
- Campo de placeholder não está funcionando (contexto não especificado pelo usuário)

### 5. Renomear seção
- "Resumo Operacional" → "Informações da Mesa"

### 6. Modalidade online expandida
- Se `modality = 'online'`, adicionar campos:
  - **Plataforma de Jogo** (lista expandida via pesquisa)
  - **Plataforma de Comunicação** (Discord, Meet, Zoom, etc.)

### 7. Faixa etária estruturada
- Substituir campo livre por enum: `livre`, `+10`, `+12`, `+14`, `+16`, `+18`

### 8. Edição/exclusão administrativa
- Admin não consegue editar/excluir mesas
- Adicionar botão "Editar Mesa" visível para admin

### 9. Editor rico para descrição/regras
- Campos `description` e `rules_notes` devem suportar formatação básica (negrito, markdown)
- Avaliar biblioteca de editor (ex: TipTap, React-Quill)

### 10. Auto-detecção não funcional
- Sistema, tags e outros campos com auto-detecção do JSON não estão funcionando

### 11. Logout em 5 minutos
- Usuário ainda está sendo desconectado após ~5 minutos (REQ-16 não resolveu completamente?)

### 12. "Ver dados brutos" incompleto
- Seção não está mostrando todos os campos do JSON

### 13. Nível da Mesa
- Adicionar campo "Nível da Mesa" (ex: iniciante, intermediário, avançado)

### 14. Cenário e Estilo
- **Cenário:** Campo de texto livre (ex: "Forgotten Realms", "Eberron", "Ravenloft")
- **Estilo:** Tags sugeridas automaticamente baseadas no cenário (ex: "Alta Fantasia", "Steampunk", "Horror Gótico")
- **Comportamento:** Ao digitar o nome do cenário, sistema sugere estilos automaticamente via tabela de mapeamento
- **Exibição:** "Cenário: Forgotten Realms | Estilos: Alta Fantasia, Aventura Épica"
- **Flexibilidade:** Usuário pode aceitar sugestões, remover ou adicionar estilos manualmente

---

## Resumo da Documentação Criada

### REQ-21 (TODO_OPERACIONAL.md)
- **Score GUT:** 125 (5×5×5) — Prioridade crítica
- **Status:** Em aberto
- **Natureza:** Requisito de produto (feature completa)
- **Impacto:** Bloqueia validação completa do beta

### Itens Técnicos (FILA_IMPLEMENTACAO.md)
Total de **25 itens** criados (075-099):

**Banco de dados (5 itens):**
- 075: Migration plataformas de jogo e comunicação
- 076: Migration faixa etária estruturada (enum)
- 077: Migration nível da mesa
- 078: Migration frequência detalhada
- 096: Migration cenário e estilos

**Backend (6 itens):**
- 079: Endpoints CRUD de plataformas
- 080: Atualizar tipos e validações
- 081: Endpoint de edição/exclusão administrativa
- 082: Suporte a markdown em descrição/regras
- 097: Endpoint de sugestões de estilo por cenário
- 098: Endpoint CRUD de mapeamento cenário→estilos (admin)

**Frontend (14 itens):**
- 083: Seletor de plataformas (jogo + comunicação)
- 084: Seletor de faixa etária estruturado
- 085: Seletor de nível da mesa
- 086: Campos de frequência detalhada
- 087: Renomear "Resumo Operacional" → "Informações da Mesa"
- 088: Editor rico para descrição e regras
- 089: Renderização de markdown em MesaPage
- 090: Ocultar "Ver perfil do mestre" em mesas de anunciantes
- 091: Botão "Editar Mesa" para admin
- 092: Investigar placeholder não funcional
- 093: Corrigir auto-detecção de sistema/tags
- 094: Investigar logout em 5 minutos (REQ-16 não resolveu)
- 095: Expandir "Ver dados brutos" com todos os campos
- 099: Campos de Cenário e Estilo no formulário

## Decisões Técnicas Pendentes

### 1. Biblioteca de Editor Markdown (item 088)
**Opções:**
- **TipTap:** Moderno, extensível, baseado em ProseMirror
- **React-Quill:** Maduro, pesado (~200KB), rico em features
- **SimpleMDE:** Leve (~50KB), markdown puro, simples

**Recomendação:** Consultar responsável antes de escolher.

### 2. Tipo de Exclusão Administrativa (item 081)
**Opções:**
- **Soft delete:** Marcar `deleted_at TIMESTAMPTZ` (reversível, mantém histórico)
- **Hard delete:** `DELETE FROM tables WHERE id = ?` (irreversível, limpa banco)

**Recomendação:** Soft delete para auditoria e possível recuperação.

### 3. Investigações Críticas
- **Item 094:** Logout em 5 minutos persiste — REQ-16 deveria ter resolvido
- **Item 093:** Auto-detecção de sistema não funciona — pode estar relacionado ao item 047
- **Item 092:** Placeholder não funcional — contexto insuficiente, validar com responsável

## Próximos Passos

1. **Validação com responsável:** Confirmar priorização dos 21 itens
2. **Decisões técnicas:** Biblioteca de editor markdown e tipo de exclusão
3. **Investigações críticas:** Itens 092, 093, 094 requerem diagnóstico antes de implementação
4. **Execução:** Iniciar implementação por ordem de dependência (banco → backend → frontend)

## Status Final da Sessão

✅ **Concluído:**
- REQ-21 documentado no TODO_OPERACIONAL.md (14 problemas identificados)
- 25 itens técnicos (075-099) documentados na FILA_IMPLEMENTACAO.md
- Consistência validada entre TODO e FILA
- Resumo de sessão completo

📋 **Pendente:**
- Atualização de RESUMO_EXECUCAO.md (se necessário)
- Aprovação do responsável para iniciar implementação
- Envio da tabela de mapeamento cenário→estilos para popular `setting_style_suggestions`

