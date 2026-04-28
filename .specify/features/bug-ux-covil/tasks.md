# Tarefas de Execução: Bugfix Covil e Placeholders

## Phase 1: Correção de Mapeamento da API e UI

- [x] **T001**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), alinhar a extração de capa da mesa para utilizar a coluna de imagem canônica e real (`t.cover_url` ou fallback), garantindo consistência visual com o catálogo público no painel do mestre. (reopened — BUG-002)
- [x] **T002**: Em `backend/src/routes/gmPanel.ts` (GET `/tables`), auditar e corrigir a query que retorna `is_covil` e `is_ddal` da tabela `tables` para assegurar que cheguem estritamente booleanas e populadas no payload enviado ao frontend. E no arquivo `frontend/src/components/TableCardDashboard.tsx`, assegurar que os mesmos são consumidos com segurança. Adicionalmente: corrigido `backend/src/routes/gm.ts` para incluir `is_covil` na query do perfil público do mestre, e adicionados badges em `frontend/src/components/mestre/MestreFeaturedTable.tsx`. (reopened — BUG-001, BUG-004)
- [x] **T004**: Em `frontend/src/features/create-table/utils/mapper.ts`, normalizar `price_type` de valores legados (`free`/`paid`) para enum canônico (`gratuita`/`paga`) no payload final. (BUG-003)
- [x] **T005**: Em `frontend/src/features/create-table/hooks/useCreateTableForm.ts` e chamadas relacionadas, confirmar que submit de create/edit passa pelo mapper normalizado. (BUG-003)
- [x] **T007**: Em `frontend/src/features/table/components/TableHero.tsx`, desacoplar renderização de badges do bloco condicional `{showOverlay && (...)}`. Badges devem ser renderizados sempre, com posicionamento ajustado baseado no estado de `showOverlay`. Quando `showOverlay={false}`, badges devem aparecer posicionados absolutamente no topo do hero. (BUG-004)

## Phase 2: Validação

- [x] **T003**: Confirmar (off-happy-path) que os payloads de resposta do endpoint agora contêm a chave de imagem populada corretamente, e que os selos de `is_covil`/`is_ddal` estão visíveis e funcionais nos cards do painel do mestre.
- [x] **T006**: Validar em runtime no beta a publicação de mesa sem 400 por enum inválido, registrando evidência literal (comando, output, status HTTP). (BUG-003) — Evidência: `HTTP=201`, id `98f9e6f1-97db-4b86-93aa-6de6471140fc` registrada em `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md`.
- [ ] **T008**: Validar visualmente em ambiente beta que badges (Covil do Lich, DDAL) aparecem corretamente em: (a) página da mesa (`/mesas/:slug`), (b) perfil do mestre (`/mestre/:slug`), (c) catálogo (`/catalogo`), (d) painel do mestre (`/painel`). (BUG-004)

## Phase 3: Refatoração — Componente Único de Badges (Eliminação de Duplicação)

**Contexto:** Atualmente, badges de certificação (`is_covil`, `is_ddal`) estão duplicados inline em 3 componentes diferentes. Isso viola DRY e dificulta manutenção.

- [x] **T009**: Criar componente compartilhado `frontend/src/components/CertificationBadges.tsx` que recebe `{ is_covil?: boolean; is_ddal?: boolean; className?: string }` e renderiza os badges com estilos consistentes.
- [x] **T010**: Refatorar `frontend/src/components/TableCard.tsx` para usar `<CertificationBadges is_covil={table.is_covil} is_ddal={table.is_ddal} />` ao invés de código inline (linhas 111-120).
- [x] **T011**: Refatorar `frontend/src/components/TableCardDashboard.tsx` para usar `<CertificationBadges is_covil={table.is_covil} is_ddal={table.is_ddal} />` ao invés de código inline (linhas 96-105).
- [x] **T012**: Refatorar `frontend/src/components/mestre/MestreFeaturedTable.tsx` para usar `<CertificationBadges is_covil={table.is_covil} is_ddal={table.is_ddal} />` ao invés de código inline (linhas 46-57).
- [ ] **T013**: Validar visualmente que refatoração não quebrou nenhum layout em: catálogo, página da mesa, perfil do mestre, painel do mestre.
- [x] **T014**: Buscar outros locais no código que possam renderizar badges de mesa e consolidar no componente único (busca por `is_covil` e `is_ddal` em arquivos `.tsx`). Resultado: todos os badges de mesa já consolidados; outros usos são contextos diferentes (filtros, formulários, badges de mestre).

**Benefícios:**
- Manutenção centralizada (mudança de estilo em 1 lugar)
- Consistência visual garantida
- Facilita adição de novos badges no futuro
- Reduz ~40 linhas de código duplicado

**Bugfix**: 2026-04-28 — [BUG-004] Adicionadas tasks T007 (implementação) e T008 (validação) para desacoplamento de badges. T002 reaberta para validação completa de visibilidade de badges.
**Bugfix**: 2026-04-28 — [BUG-003] tasks de contrato `price_type` adicionadas com trilha formal report/patch/verify.
**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Atualizado via speckit bugfix patch. Removido task fantasma das métricas.
