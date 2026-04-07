# Checklist de Validação — REQ-28: Importação Inteligente

## Informações
- **ID:** REQ-28
- **Título:** Importação Inteligente de JSON — Fluxo Completo
- **Data de deploy:** 07/04/2026 (previsto)
- **Responsável:** Admin
- **Prazo:** 14/04/2026

---

## 1. Deploy e Build
- [ ] Commit da correção E130 realizado
- [ ] Push para `dev` executado
- [ ] GitHub Actions concluído com sucesso
- [ ] Container `mesas-beta-api` reiniciado
- [ ] `npm run build` no backend: Exit Code 0
- [ ] Logs da API sem erros ao iniciar

---

## 2. Parser Python → TypeScript
- [ ] Interface `ParsedMessageResult` contém os 8 campos:
  - [ ] `campaign_length?: string`
  - [ ] `level_range?: string`
  - [ ] `session_zero_free?: boolean`
  - [ ] `synopsis?: string`
  - [ ] `style_text?: string`
  - [ ] `listing_excerpt?: string`
  - [ ] `technical_requirements?: string`
  - [ ] `requires_pc?: boolean`

---

## 3. Importação de JSON Real
- [ ] Importar JSON do Discord com campos estruturados
- [ ] Verificar log do parser Python (campos extraídos)
- [ ] Verificar candidato criado no banco:
  ```sql
  SELECT 
    parsed_json->>'campaign_length',
    parsed_json->>'level_range',
    parsed_json->>'synopsis',
    parsed_json->>'style_text'
  FROM aggregator_import_candidates 
  WHERE id = '<uuid_do_candidato>';
  ```
- [ ] Campos retornam valores (não NULL)

---

## 4. Formulário de Revisão
- [ ] Abrir modal de revisão do candidato
- [ ] Verificar se campos REQ-26/28 estão pré-preenchidos:
  - [ ] Duração da campanha
  - [ ] Faixa de nível
  - [ ] Sinopse
  - [ ] Estilo/temática
  - [ ] Requisitos técnicos
  - [ ] Checkboxes (PC, câmera, microfone)

---

## 5. Aprovação e Persistência
- [ ] Aprovar candidato
- [ ] Verificar mesa criada no banco:
  ```sql
  SELECT 
    campaign_length,
    level_range,
    synopsis,
    style_text,
    technical_requirements,
    requires_pc
  FROM tables 
  WHERE id = '<uuid_da_mesa>';
  ```
- [ ] Campos persistidos corretamente

---

## 6. Página Pública
- [ ] Acessar `/mesas/<slug>` da mesa aprovada
- [ ] Verificar renderização de todos os campos:
  - [ ] Duração da campanha exibida
  - [ ] Faixa de nível exibida
  - [ ] Sinopse exibida
  - [ ] Estilo/temática exibido
  - [ ] Requisitos técnicos exibidos
  - [ ] Ícones de PC/câmera/microfone (se aplicável)

---

## 7. Casos de Borda
- [ ] Importar JSON sem campos estruturados (anúncio simples)
- [ ] Verificar que campos ficam vazios (não quebra)
- [ ] Importar JSON com campos parciais
- [ ] Verificar que apenas campos presentes são preenchidos

---

## 8. Regressões
- [ ] Criação manual de mesa ainda funciona
- [ ] Edição de mesa existente ainda funciona
- [ ] Catálogo público ainda funciona
- [ ] Filtros ainda funcionam

---

## Resultado

**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas

**Problemas identificados:**
1. 
2. 

**Próxima ação:**
- [ ] Marcar REQ-28 como "Concluído" no TODO_OPERACIONAL.md
- [ ] Marcar itens 127-139 como `concluido` na FILA_IMPLEMENTACAO.md
- [ ] Atualizar RESUMO_EXECUCAO.md

---

**Data de conclusão:** __/__/____  
**Validado por:** ____________
