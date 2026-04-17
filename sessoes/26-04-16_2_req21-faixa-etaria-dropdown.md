# 26-04-16_2_req21-faixa-etaria-dropdown.md

## Cabeçalho
- **Data:** 16/04/2026
- **Objetivo:** Executar exclusivamente o REQ-21 (↔ FILA 084), finalizando o dropdown de faixa etária com ícones visuais conforme backlog/fila.

## Vínculos
- **Sessão anterior:** `26-04-16_1_limpeza-fila-backlog-concluidos.md`
- **Próxima sessão:** a definir

## Plano de execução
1. Validar escopo canônico do REQ-21 no BACKLOG_OPERACIONAL.md e da FILA 084 em FILA_IMPLEMENTACAO.md.
2. Ajustar o dropdown de faixa etária no frontend para incluir ícones visuais nas opções.
3. Garantir compatibilidade do valor persistido (`age_rating`) sem quebrar contrato existente.
4. Revisar mapper/tipos relacionados ao campo, se necessário, com mudança mínima.
5. Validar comportamento em create/edit de mesa.
6. Atualizar FILA/BACKLOG (status do item 084/REQ-21) se o critério do item for atingido.

## Checklist
- [x] Confirmar escopo REQ-21 e FILA 084
- [x] Implementar ícones visuais no dropdown de faixa etária
- [x] Validar persistência de `age_rating` sem regressão
- [x] Validar fluxo create/edit no formulário
- [x] Atualizar FILA_IMPLEMENTACAO.md (084)
- [x] Atualizar BACKLOG_OPERACIONAL.md (REQ-21)
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

## Arquivos que serão modificados
- `frontend/src/components/form-steps/steps/StepConfig.tsx`
- `FILA_IMPLEMENTACAO.md`
- `BACKLOG_OPERACIONAL.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- O dropdown de faixa etária exibe ícones visuais definidos no requisito.
- O valor salvo/transportado de `age_rating` permanece compatível com backend.
- Item 084 e REQ-21 atualizados conforme resultado real da execução.
- Checklist da sessão 100% marcado.
