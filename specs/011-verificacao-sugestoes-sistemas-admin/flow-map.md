# Flow Map: Sugestoes e Notificacoes para Admin

## Decisao

Toda sugestao criada por usuario deve gerar notificacao para administradores autorizados.

## Fluxos cobertos

| Tipo | Frontend | Backend | Persistencia | Notificacao admin |
|---|---|---|---|---|
| Sistema | `frontend/src/components/SystemSuggestionModal.tsx` | `backend/src/routes/systemSuggestions.ts` | `system_suggestions` | Criada em `notifications` para usuarios `role='admin'` |
| Cenario | `frontend/src/components/ScenarioSuggestionModal.tsx` | `backend/src/routes/scenarioSuggestions.ts` | `scenario_suggestions` | Criada em `notifications` para usuarios `role='admin'` |
| Plataforma VTT | Fluxo que chama `/api/v1/vtt-platforms/suggest` | `backend/src/routes/vttPlatforms.ts` | `vtt_platform_suggestions` | Criada em `notifications` para usuarios `role='admin'` |

## Canal administrativo

- `Notificacoes`: canal obrigatorio de alerta para admins.
- `Gestao`: canal de consulta e tratamento das sugestoes.

## Classificacao de falha corrigida

- Camada: integracao backend/notificacoes.
- Severidade: alta para operacao administrativa, porque admins podiam depender de consulta manual.
- Correcao: criar notificacoes administrativas na mesma transacao que registra a sugestao.

## Validacao tecnica

- `npm --prefix backend run build`: GREEN.
- `npm --prefix frontend run build`: GREEN.

## Validacao funcional pendente

Validar no Beta apos deploy: criar sugestao como usuario e confirmar notificacao visivel para admin em janela anonima.
