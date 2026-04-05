# Sessão: Operacionalização do Plano de Importação Inteligente

**Data:** 05/04/2026  
**Horário:** 18:23 - 18:28  
**Objetivo:** Transformar `sessoes/plano_json.md` em ações executáveis dentro do sistema de documentação canônico

---

## Contexto

O arquivo `sessoes/plano_json.md` contém um plano detalhado de engenharia para a importação inteligente de JSON do Discord, mas é apenas consultivo. A tarefa foi consolidar esse plano nos documentos canônicos do projeto (`TODO_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md`, `RESUMO_EXECUCAO.md`, `ARQUITETURA_PROJETO.md`, `ERRORS_SOLUTIONS.md`) sem criar arquivos novos ou duplicar informação.

---

## Plano de Execução

1. [x] Analisar `sessoes/plano_json.md` e documentos canônicos
2. [x] Expandir REQ-28 em `TODO_OPERACIONAL.md` para cobrir fluxo completo
3. [x] Adicionar seção 7.9 em `ARQUITETURA_PROJETO.md` documentando arquitetura do fluxo
4. [x] Atualizar `RESUMO_EXECUCAO.md` com estado atual e próxima ação
5. [x] Adicionar erros esperados E122-E126 em `ERRORS_SOLUTIONS.md`
6. [x] Adicionar lote de implementação (itens 127-136) em `FILA_IMPLEMENTACAO.md`
7. [x] Atualizar documentos relevantes

---

## Mudanças Realizadas

### 1. TODO_OPERACIONAL.md

**Linha 36 - REQ-28 expandido:**
- **Antes:** Cenário e Estilos com Sugestões Automáticas (escopo limitado)
- **Depois:** Importação Inteligente de JSON — Fluxo Completo (Fase 3)
- **Escopo expandido:** 6 fases (A-F):
  - (A) Parser Python enriquecido — 11 novos campos
  - (B) Normalização backend — priorizar enrichedFields
  - (C) Auto-preenchimento do formulário — sistema, cobrança, canais, banner, requisitos, cenário/estilos, agenda
  - (D) Abertura automática de blocos — UX inteligente
  - (E) Persistência com overrides — aceitar edições do admin
  - (F) Página pública — indistinguível de mesa manual
- **Status:** Backend Fase 1 concluído (setting_name, setting_styles), Fases 2-6 pendentes
- **Score GUT:** 125 (5×5×5)

### 2. ARQUITETURA_PROJETO.md

**Seção 7.9 adicionada - Fluxo de Importação Inteligente:**
- Documentação completa da arquitetura em 5 camadas:
  1. **Parser Python (Enriquecimento):** Extração via NLP, campos estruturados, regras de inferência
  2. **Normalização Backend:** Merge de payloads, priorização de enrichedFields, logs de rastreamento
  3. **Mapeamento para Formulário:** Auto-preenchimento inteligente de 13+ campos
  4. **Revisão Manual:** Abertura automática de blocos, edição antes de aprovar
  5. **Persistência com Overrides:** Endpoint aceita payload revisado, merge com parsed_json
- **Separação de responsabilidades:** Parser (NLP) → Backend (lógica) → Frontend (apresentação)
- **Regra arquitetural:** Lógica de negócio fica no backend

### 3. RESUMO_EXECUCAO.md

**Estado atual atualizado:**
- Última sessão: 05/04/2026 - 18:24
- REQ-28 expandido para fluxo completo
- Documentação canônica atualizada
- Arquitetura consolidada em 5 camadas
- Backend Fase 1 mantido (5/5 testes passando)

**Próxima ação prioritária:**
Expandir parser Python com todos os campos do plano: `banner_url`, `avatar_url`, `external_links`, `is_paid`, `priceText`, `signupText`, `requires_pc/camera/microphone`, `is_ongoing`, `reviewFlags`. Atualizar schemas Pydantic e TypeScript.

### 4. ERRORS_SOLUTIONS.md

**5 novos erros esperados adicionados (E122-E126):**

| ID | Sintoma | Causa | Solução |
|---|---|---|---|
| E122 | enrichedFields ignorados pelo TypeScript | Merge incorreto, fallback sobrescreve parser | Inverter prioridade: `{ ...rawPayload, ...enrichedFields }` |
| E123 | Sistema não pré-selecionado no formulário | Mapeamento incorreto de system_path_slug | Atualizar candidateToFormData.ts |
| E124 | Banner não importado automaticamente | banner_url não mapeado ou preview não reage | Mapear campo + adicionar preview visual |
| E125 | Cenário/estilos perdidos após aprovação | candidateService não persiste campos revisados | Modificar endpoint accept para aceitar overrides |
| E126 | Endpoint accept rejeita payload com edições | Validação rejeita body não vazio | Aceitar overrides opcionais, validar whitelist |

### 5. FILA_IMPLEMENTACAO.md

**Novo lote adicionado - importacao-inteligente-completa (REQ-28):**

10 itens técnicos (127-136) organizados por camada:

**Backend (127-130, 133-134):**
- 127: Parser Python - 11 novos campos
- 128: pythonParserService - Interface atualizada
- 129: Normalização - Priorizar enrichedFields
- 130: parseExporterMessage - Priorizar enrichedFields
- 133: Endpoint accept com overrides opcionais
- 134: candidateService - Persistir campos revisados

**Frontend (131-132, 135):**
- 131: candidateToFormData - Auto-preenchimento completo
- 132: Abertura automática de blocos
- 135: MesaPage - Renderizar campos importados

**Testes (136):**
- 136: Testes E2E do fluxo completo (8 etapas)

Todos os itens com status `pendente`, GUT entre 4/4/4 e 5/5/5.

---

## Critério de Conclusão

- [x] REQ-28 expandido em `TODO_OPERACIONAL.md`
- [x] Arquitetura documentada em `ARQUITETURA_PROJETO.md`
- [x] Estado atual atualizado em `RESUMO_EXECUCAO.md`
- [x] Erros esperados registrados em `ERRORS_SOLUTIONS.md`
- [x] Fila técnica criada em `FILA_IMPLEMENTACAO.md`
- [x] Nenhum arquivo novo criado
- [x] Informação consolidada sem duplicação

---

## Decisões Técnicas

1. **REQ-28 como guarda-chuva:** O requisito foi expandido para cobrir todo o fluxo de importação inteligente, não apenas cenário/estilos. Isso evita criar múltiplos REQs fragmentados.

2. **5 camadas arquiteturais:** A separação clara entre Parser → Normalização → FormPatch → Revisão → Persistência facilita debug e manutenção.

3. **Erros esperados antecipados:** Registrar E122-E126 antes da implementação permite consulta rápida quando os problemas aparecerem.

4. **Fila técnica granular:** 10 itens com dependências claras permitem execução incremental e validação por camada.

---

## Próximos Passos

1. Executar item 127 da fila: expandir parser Python com 11 novos campos
2. Validar extração em ambiente de teste
3. Atualizar schemas Pydantic e TypeScript (item 128)
4. Implementar normalização com priorização de enrichedFields (item 129)
5. Validar que parsed_json preserva todos os campos do parser

---

## Observações

- `sessoes/plano_json.md` permanece como referência consultiva, mas a verdade operacional está nos documentos canônicos
- Backend Fase 1 (setting_name, setting_styles) já está funcional e não foi alterado
- A implementação seguirá a ordem da fila (127→136) respeitando dependências entre camadas
- Nenhum deploy será feito até validação completa do fluxo E2E (item 136)
