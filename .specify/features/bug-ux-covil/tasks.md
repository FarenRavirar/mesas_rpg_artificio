# Tarefas de Execução: Bugfix Covil e Placeholders

## Phase 1: Correção de Mapeamento da API e UI

- [x] **T001**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), alinhar a extração de capa da mesa para utilizar a coluna de imagem canônica e real (`t.cover_url` ou fallback), garantindo consistência visual com o catálogo público no painel do mestre. (reopened — BUG-002)
- [x] **T002**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), auditar e corrigir a query que retorna `is_covil` e `is_ddal` da tabela `tables` para assegurar que cheguem estritamente booleanas e populadas no payload enviado ao frontend. E no arquivo `frontend/src/components/TableCardDashboard.tsx`, assegurar que os mesmos são consumidos com segurança. (reopened — BUG-001)
- [x] **T004**: Em `frontend/src/features/create-table/utils/mapper.ts`, normalizar `price_type` de valores legados (`free`/`paid`) para enum canônico (`gratuita`/`paga`) no payload final. (BUG-003)
- [x] **T005**: Em `frontend/src/features/create-table/hooks/useCreateTableForm.ts` e chamadas relacionadas, confirmar que submit de create/edit passa pelo mapper normalizado. (BUG-003)

## Phase 2: Validação

- [x] **T003**: Confirmar (off-happy-path) que os payloads de resposta do endpoint agora contêm a chave de imagem populada corretamente, e que os selos de `is_covil`/`is_ddal` estão visíveis e funcionais nos cards do painel do mestre.
- [ ] **T006**: Validar em runtime no beta a publicação de mesa sem 400 por enum inválido, registrando evidência literal (comando, output, status HTTP). (BUG-003)

**Bugfix**: 2026-04-28 — [BUG-003] tasks de contrato `price_type` adicionadas com trilha formal report/patch/verify.
**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Atualizado via speckit bugfix patch. Removido task fantasma das métricas.
