# Handoff - Spec 022

## Proximo chat

Leia nesta ordem:

1. `.specify/memory/project-state.md`
2. `AGENTS.md`
3. `docs/agents/context-capsule.md`
4. `specs/022-feedback-desenvolvimento/spec.md`
5. `specs/022-feedback-desenvolvimento/plan.md`
6. `specs/022-feedback-desenvolvimento/tasks.md`
7. `sessoes/26-06-02_1_feedback-desenvolvimento.md`

## Estado atual

Spec/plan/tasks/handoff escritos. Implementacao ainda NAO iniciada (sem branch, sem codigo, sem commit). Mantenedor pediu primeiro montar os artefatos SDD com governanca completa antes de codar.

## Origem da demanda

Mantenedor vai abrir o projeto ao publico para testes. Precisa de um canal em qualquer pagina para o usuario reportar problema ou sugerir melhoria, coletando contexto tecnico (pagina/rota, erros de console, erros globais, falhas de rede, screenshot), entregue em `/gestao` numa aba "Desenvolvimento" de forma clara para investigar e planejar.

## Decisoes do mantenedor (fechadas)

- C1: acesso anonimo + logado.
- C2: `contact_email` opcional para anonimo.
- C3: screenshot via html2canvas, apenas viewport.
- C4: captura console + erros globais + falhas de rede (fetch >= 400).
- C5: FAB em todas as paginas exceto `/login` e `/auth/callback`.

## Pontos criticos

- SDD Completo: migration nova + contrato API publico + upload Cloudinary + permissao admin.
- Reuso central: diagnostics implementa `ErrorTracker` (`frontend/src/services/logger.ts`) e registra via `setErrorTracker`; alem dos hooks globais (`window.onerror`, `unhandledrejection`, wrap `console.error/warn`, patch `window.fetch`).
- Screenshot embutido como data URI no proprio POST; backend faz upload (funciona para anonimo, sem rota authed separada).
- `uploadImageToCloudinary` atual forca crop 1200x650 (distorce screenshot) -> criar `uploadScreenshotToCloudinary` com `crop:'limit'`.
- TDD obrigatorio no validador (`devFeedbackValidator`) antes da implementacao.
- Normalizar payload externo como `unknown` (NFR-004 / AGENTS.md). Sem `.map` em payload nao validado.
- CSRF (`csrfProtection.ts`): anonimo (sem `am_session`) passa; logado same-origin passa. Sem bloqueio esperado.
- `notifyAdmins`/`logActivity` fora de transacao (regra reforcada do project-state).
- Validacao funcional so apos deploy Beta e teste do mantenedor em janela anonima.
- Commit/push/deploy/migration em servidor exigem aprovacao explicita a cada vez.

## Contratos relevantes

- `POST /api/v1/dev-feedback` (publico, `optionalAuth` + `strictRateLimiter`): body com kind/title/description, contexto, console_errors/network_errors, screenshot data URI opcional, contact_email opcional. Resposta `201 { data }`.
- `GET /api/v1/admin/dev-feedback?status=&kind=` (admin): lista com `reporter_name`.
- `PATCH /api/v1/admin/dev-feedback/:id` (admin): status + admin_notes.

## Dependencia nova

- Frontend: `html2canvas` (traz tipos proprios). Backend: nenhuma nova.

## Proximos passos sugeridos

Seguir `tasks.md` na ordem T004+. Comecar por migration/tipos, depois validador TDD, rotas, diagnostics, widget, aba gestao, changelog, builds.
