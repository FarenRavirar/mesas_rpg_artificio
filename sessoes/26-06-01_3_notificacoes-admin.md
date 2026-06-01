# Sessao 26-06-01_3 - Notificacoes do Admin

**Data:** 2026-06-01
**Objetivo:** feed de notificacoes do admin = tudo que NAO foi o admin que fez (sugestao sistema/cenario, mesa publicada, novo membro), agrupado por categoria, com leitura que persiste e botao "marcar todas como lidas".

## Diagnostico (codigo + Beta)

- `notifications`: user_id(dest), type, title, message, read, action_url, metadata. Sem actor_id, sem categoria.
- Read persiste (`PATCH /:id/read` -> read=true). Mas abrir o sino NAO marca lido; so clique item-a-item. Beta: 8 notifs, 0 read.
- Beta so tem `suggestion_approved`(5)/`suggestion_rejected`(3) -> auto-acao do admin sugeridor (ruido).
- Sugestoes do parser Discord entram via `adminDiscordSync` sem notificar admin.
- Mesa publicada e novo membro: sem emissor de notificacao.

## Decisoes do mantenedor (01/06)

- Mesa: notificar so quando **publicada (status active)**.
- Auto-acao: **filtro no emit** (pula admin que fez a acao), sem migration.
- Leitura: **botao "marcar todas como lidas" + manter historico** (novo endpoint).

## Plano (SDD Lite, sem migration)

- Helper `notifyAdmins({type,title,message,action_url,metadata,excludeUserId}, trx?)`.
- Emitir: system_suggestion (POST + Discord), scenario_suggestion (POST, corrige type), table_published (criar active + draft->active), member_joined (registro).
- Outcome (approved/rejected/resolved): nao notificar o sugeridor se ele e o admin que resolveu.
- Endpoint `PATCH /api/v1/notifications/read-all`.
- Frontend `NotificationBell`: agrupar por categoria + botao marcar todas + render membro/mesa.

## Implementacao (01/06)

- `backend/src/services/adminNotifications.ts` (novo): `notifyAdmins({type,title,message,action_url,metadata,excludeUserId}, trx?)`.
- Emissores: `systemSuggestions` POST (exclui autor), `scenarioSuggestions` POST (corrige type='system'->'scenario_suggestion', exclui autor), `adminDiscordSync` (sugestao Discord -> todos admins), `auth.ts` registro (member_joined), `gmPanel.ts` criar mesa active + publicar draft->active (exclui admin ator).
- `notifications.ts`: novo `PATCH /api/v1/notifications/read-all`.
- `db/types.ts`: NotificationType ganha system_suggestion/scenario_suggestion/table_published/member_joined.
- `NotificationBell.tsx`: normaliza unknown, admin ve so as 4 categorias agrupadas (esconde suggestion_approved/rejected = outcome do sugeridor), botao "marcar todas como lidas", clique navega action_url. Usuario comum ve lista propria.
- Decisao de simplificacao: auto-acao de outcome resolvida via filtro no sino do admin (1 edit) em vez de 7 guards no backend; outcome continua indo pro sugeridor comum.
- `database/changelogs.json`: bullet "Avisos da equipe mais organizados" na entrada 01/06.

Evidencias:
- `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- changelog JSON valido; `git diff --check` limpo (so EOL).
- Pendente: commit/push/deploy Beta (aguardando autorizacao) + validacao do mantenedor em janela anonima.

## Criterio de conclusao

- Admin recebe notif de sugestao sistema/cenario, mesa publicada e novo membro feitos por NAO-admin.
- Auto-acao do admin nao gera notif pro proprio admin.
- Sino agrupa por categoria; botao marca todas lidas e persiste.
- Builds back/front GREEN; validado em Beta pelo mantenedor.
