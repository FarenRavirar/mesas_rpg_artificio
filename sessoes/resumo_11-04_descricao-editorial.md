# Sessão 11/04/2026 — Descrição Editorial (Item 139)

## Objetivo da Sessão
Definir e implementar regra editorial de separação de campos de texto em anúncios importados: synopsis (sinopse curta), description (descrição principal longa), rules/observations (regras e observações), signupText (instruções de inscrição).

## Contexto
Sistema atual trata synopsis como descrição completa, mas anúncios reais do Discord têm múltiplos blocos de texto que devem ser separados e mapeados corretamente.

## Plano de Execução

1. [ ] Analisar estrutura atual do parser Python (`discord_message_parser.py`)
2. [ ] Analisar normalização backend (`normalizeExporterPayload.ts`)
3. [ ] Analisar mapeamento frontend (`candidateToFormData.ts`)
4. [ ] Definir regra editorial clara de separação
5. [ ] Implementar extração separada no parser Python
6. [ ] Atualizar normalização para preservar campos separados
7. [ ] Atualizar mapeamento do formulário
8. [ ] Validar persistência no banco
9. [ ] Testar renderização na página pública
10. [ ] Atualizar documentos relevantes

## Arquivos-Alvo
- `backend/src/services/aggregator/parser/discord_message_parser.py`
- `backend/src/domain/aggregator/normalizeExporterPayload.ts`
- `backend/src/domain/aggregator/parseExporterMessage.ts`
- `frontend/src/utils/candidateToFormData.ts`
- `backend/src/routes/gmPanel.ts`
- `frontend/src/pages/MesaPage.tsx`

## Critério de Conclusão
- Regra editorial documentada e implementada
- Parser extrai blocos separados
- Normalização preserva separação
- Formulário mapeia corretamente
- Descrição completa persiste sem truncamento
- Página pública renderiza texto completo
- npm run build passa sem erros
- FILA_IMPLEMENTACAO.md atualizada (item 139 → concluido)
- TODO_OPERACIONAL.md atualizado se REQ-28 for concluído
- RESUMO_EXECUCAO.md atualizado

## Decisões e Observações
_Será preenchido durante a execução_