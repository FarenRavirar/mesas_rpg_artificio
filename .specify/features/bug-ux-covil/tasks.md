# Tarefas de Execução: Bugfix Covil e Placeholders

## Phase 1: Correção de Mapeamento da API e UI

- [x] **T001**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), alinhar a extração de capa da mesa para utilizar a coluna de imagem canônica e real (`t.cover_url` ou fallback), garantindo consistência visual com o catálogo público no painel do mestre. (reopened — BUG-002)
- [ ] **T002**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), auditar e corrigir a query que retorna `is_covil` e `is_ddal` da tabela `tables` para assegurar que cheguem estritamente booleanas e populadas no payload enviado ao frontend. E no arquivo `frontend/src/components/TableCardDashboard.tsx`, assegurar que os mesmos são consumidos com segurança. (reopened — BUG-001, BUG-004)
- [x] **T004**: Em `frontend/src/features/create-table/utils/mapper.ts`, normalizar `price_type` de valores legados (`free`/`paid`) para enum canônico (`gratuita`/`paga`) no payload final. (BUG-003)
- [x] **T005**: Em `frontend/src/features/create-table/hooks/useCreateTableForm.ts` e chamadas relacionadas, confirmar que submit de create/edit passa pelo mapper normalizado. (BUG-003)
- [x] **T007**: Em `frontend/src/features/table/components/TableHero.tsx`, desacoplar renderização de badges do bloco condicional `{showOverlay && (...)}`. Badges devem ser renderizados sempre, com posicionamento ajustado baseado no estado de `showOverlay`. Quando `showOverlay={false}`, badges devem aparecer posicionados absolutamente no topo do hero. (BUG-004)

## Phase 2: Validação

- [x] **T003**: Confirmar (off-happy-path) que os payloads de resposta do endpoint agora contêm a chave de imagem populada corretamente, e que os selos de `is_covil`/`is_ddal` estão visíveis e funcionais nos cards do painel do mestre.
- [x] **T006**: Validar em runtime no beta a publicação de mesa sem 400 por enum inválido, registrando evidência literal (comando, output, status HTTP). (BUG-003) — Evidência: `HTTP=201`, id `98f9e6f1-97db-4b86-93aa-6de6471140fc` registrada em `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md`.
- [ ] **T008**: Validar visualmente em beta que badges (Covil do Lich, DDAL) aparecem na página de detalhes da mesa (`/mesas/:slug`) mesmo com `showOverlay={false}`. Testar com mesa `a-voz-nas-cartas-mnoks2do` (is_covil=true). (BUG-004)

**Bugfix**: 2026-04-28 — [BUG-004] Adicionadas tasks T007 (implementação) e T008 (validação) para desacoplamento de badges. T002 reaberta para validação completa de visibilidade de badges.
**Bugfix**: 2026-04-28 — [BUG-003] tasks de contrato `price_type` adicionadas com trilha formal report/patch/verify.
**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Atualizado via speckit bugfix patch. Removido task fantasma das métricas.
