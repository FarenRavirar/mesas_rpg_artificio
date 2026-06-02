# Spec 022 - Feedback de Desenvolvimento (Reportar Problema / Sugerir Solucao)

## Objetivo

Dar ao usuario, em qualquer pagina do produto, um canal para reportar um problema (bug) ou sugerir uma melhoria, coletando automaticamente o contexto tecnico (pagina/rota, erros de console, erros globais, falhas de rede e captura de tela) e entregando tudo em `/gestao` numa nova aba "Desenvolvimento", de forma clara o suficiente para investigar, planejar e implementar.

## Problema

O projeto vai abrir ao publico para testes. Hoje existem apenas fluxos de sugestao de catalogo (sistemas e cenarios). Nao ha como o usuario relatar um bug ou propor uma melhoria de produto, nem como a equipe receber esse relato com contexto tecnico suficiente.

Sem contexto coletado, um relato como "deu erro na pagina da mesa" obriga a equipe a reproduzir as cegas. Com pagina/rota, erros de console, falhas de rede e screenshot, o relato vira material acionavel de investigacao.

## Escopo

- Botao flutuante (FAB) global presente em todas as paginas, exceto `/login` e `/auth/callback`.
- Formulario unico que aceita dois tipos: `bug` (problema) e `suggestion` (sugestao).
- Acesso anonimo e autenticado (paginas publicas abrem sem login).
- Coleta automatica de contexto: pagina/rota/titulo, ambiente, user-agent, viewport, erros de console, erros globais, falhas de rede (HTTP >= 400) e captura de tela do viewport.
- Persistencia em nova tabela `dev_feedback`.
- Contrato publico `POST /api/v1/dev-feedback`.
- Contrato admin `GET`/`PATCH /api/v1/admin/dev-feedback`.
- Nova aba "Desenvolvimento" em `/gestao` para triagem (status, notas, visualizacao do contexto).
- Notificacao para admins e registro em activity log.

## Fora do Escopo

- Integracao real com Sentry/LogRocket (a infra `ErrorTracker` ja existe e fica pronta; nao se ativa aqui).
- Triagem ou categorizacao automatica por IA.
- Notificacao de retorno ao usuario sobre o andamento do report.
- Busca/filtro publico de feedbacks.
- Deploy direto para producao.

## Modelo de Dados

Nova tabela `dev_feedback` (migration 125, online-safe, sem backup):

- `id uuid pk`
- `user_id uuid null references users(id) on delete set null` (nullable: anonimo permitido)
- `reporter_role text null` (visitor|player|gm|admin|null)
- `contact_email text null` (opcional, opt-in do anonimo)
- `kind text not null check (kind in ('bug','suggestion'))`
- `title text not null`
- `description text not null`
- `page_url text null` (href completo)
- `route_path text null` (pathname real, ex.: `/mesas/minha-mesa`)
- `page_title text null`
- `environment text null` (beta|production|development, derivado de hostname com fallback `import.meta.env.MODE`)
- `user_agent text null`
- `viewport text null` (ex.: `1920x1080`)
- `console_errors jsonb not null default '[]'::jsonb`
- `network_errors jsonb not null default '[]'::jsonb` (URL, metodo, status; sem corpo/headers/tokens)
- `screenshot_url text null` (secure_url Cloudinary)
- `status text not null default 'new' check (status in ('new','triaged','in_progress','resolved','wont_fix','duplicate'))`
- `admin_notes text null`
- `reviewed_by uuid null references users(id) on delete set null`
- `reviewed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indices: `status`, `kind`, `created_at desc`.

## User Stories

### US1 - Reportar um problema de qualquer pagina (Prioridade P1)

Como usuario (logado ou anonimo), quero clicar num botao fixo em qualquer pagina e relatar um problema, para que a equipe receba o relato com o contexto da tela.

Aceite:

- FAB visivel em todas as paginas exceto `/login` e `/auth/callback`.
- Ao abrir, formulario pre-seleciona "Problema".
- Sistema coleta e exibe rota atual, numero de erros capturados e viewport antes do envio.
- Apos envio bem-sucedido, retorna `201` e grava linha em `dev_feedback` com `kind='bug'`.

### US2 - Sugerir uma melhoria (Prioridade P1)

Como usuario, quero sugerir uma melhoria pelo mesmo botao, para contribuir com o produto.

Aceite:

- Toggle permite alternar para "Sugestao".
- Envio grava `kind='suggestion'`.
- Sugestao nao exige captura de erros para ser valida.

### US3 - Coleta automatica de contexto tecnico (Prioridade P1)

Como equipe, quero receber pagina/rota, erros de console, erros globais e falhas de rede junto do relato, para investigar sem reproduzir as cegas.

Aceite:

- Erros de `console.error`/`console.warn`, `window.onerror` e `unhandledrejection` sao capturados num buffer limitado.
- Falhas de rede (HTTP >= 400 via `fetch`) sao registradas como URL/metodo/status.
- O buffer e anexado ao payload quando o usuario mantem a opcao "incluir erros tecnicos" (default ligada).

### US4 - Captura de tela opcional (Prioridade P2)

Como usuario, quero anexar uma captura da tela visivel, para mostrar o problema.

Aceite:

- Checkbox "incluir captura de tela" (default ligada) gera imagem do viewport via html2canvas.
- A imagem sobe pelo backend (nunca direto do cliente para o Cloudinary) e grava `screenshot_url`.
- Falha na captura/upload nao bloqueia o envio do relato (grava sem screenshot).

### US5 - Contato opcional para retorno (Prioridade P3)

Como usuario anonimo, quero deixar meu e-mail opcionalmente, para receber retorno.

Aceite:

- Campo e-mail opcional, destacado para anonimo.
- Quando informado, valida formato e grava `contact_email`.
- Usuario logado nao precisa informar (vinculo via `user_id`).

### US6 - Triagem na aba Desenvolvimento (Prioridade P1)

Como admin, quero ver os relatos com todo o contexto e mudar status/anotar, para organizar a investigacao.

Aceite:

- Nova aba "Desenvolvimento" em `/gestao`.
- Lista com filtro por `status` e `kind`.
- Cada card mostra tipo, titulo, descricao, pagina/rota clicavel, reporter+role (+contato se houver), ambiente, data, viewport/UA, erros de console, falhas de rede e thumbnail da captura.
- Admin altera `status` e grava `admin_notes` via `PATCH`.

## Requisitos Funcionais

- FR-001: FAB global presente em todas as paginas exceto `/login` e `/auth/callback`.
- FR-002: Formulario aceita `kind` em {`bug`,`suggestion`}, com `title` e `description` obrigatorios.
- FR-003: Coletar `page_url`, `route_path`, `page_title`, `environment`, `user_agent`, `viewport` no momento do envio.
- FR-004: Capturar erros de console, erros globais e rejeicoes nao tratadas num buffer limitado (cap ~30, mensagem truncada ~500 chars).
- FR-005: Capturar falhas de rede HTTP >= 400 (URL, metodo, status), sem corpo, headers ou tokens.
- FR-006: Captura de tela do viewport opcional (default ligada), enviada como data URI e processada pelo backend.
- FR-007: Upload de imagem ocorre exclusivamente no backend (Cloudinary signed), nunca no cliente.
- FR-008: Falha de captura/upload de screenshot nao impede o registro do feedback.
- FR-009: `contact_email` opcional e validado quando presente.
- FR-010: `POST /api/v1/dev-feedback` aceita request anonimo e autenticado; preenche `reporter_role` e `user_id` conforme sessao.
- FR-011: Ao criar, notificar admins (`notifyAdmins`, fora de transacao) e registrar activity log.
- FR-012: `GET /api/v1/admin/dev-feedback?status=&kind=` lista para admin com nome do reporter resolvido.
- FR-013: `PATCH /api/v1/admin/dev-feedback/:id` atualiza `status` e/ou `admin_notes`, gravando `reviewed_by`/`reviewed_at`.
- FR-014: Aba "Desenvolvimento" exibe todo o contexto coletado de forma legivel.
- FR-015: O usuario ve e pode desligar (opt-out) screenshot e erros tecnicos antes de enviar.

## Requisitos Nao Funcionais

- NFR-001: Coleta minima. `network_errors` guarda apenas URL/metodo/status. Sem corpo, headers ou tokens.
- NFR-002: Mudanca visivel exige entrada em `database/changelogs.json` antes do deploy.
- NFR-003: Validacao funcional de UI so conta apos deploy em `dev`/Beta e analise do mantenedor em janela anonima.
- NFR-004: Dados de API/DB entram no frontend como `unknown` e passam por normalizador tipado (regra AGENTS.md). Sem `.map`/`.filter` em payload externo nao validado.
- NFR-005: Operacoes de escrita em DB fora de local/Beta seguem aprovacoes de `AGENTS.md`.
- NFR-006: Anti-spam no endpoint publico via `strictRateLimiter` (10/15min por IP).
- NFR-007: Validador de payload coberto por teste unitario (TDD) antes da implementacao.
- NFR-008: TypeScript estrito, sem `any` implicito.
- NFR-009: Acessibilidade: FAB e modal com `aria-label`, foco visivel, fechamento por ESC, focus trap (padrao `ConfirmDialog`). Respeitar 10 Heuristicas de Nielsen.

## Decisoes do Mantenedor (Clarifications)

Decisoes tomadas via perguntas diretas antes do plano:

- C1: Acesso anonimo + logado (nao restringir a logado).
- C2: `contact_email` opcional para anonimo (coletar opt-in).
- C3: Screenshot via html2canvas, apenas viewport visivel (nao pagina inteira).
- C4: Captura tecnica inclui console + erros globais + falhas de rede (fetch >= 400).
- C5: FAB em todas as paginas exceto `/login` e `/auth/callback` (inclui `/gestao`).

## Risco e Processo

Classificacao: SDD Completo.

Motivo:

- Migration nova (tabela `dev_feedback`).
- Contrato de API publico novo.
- Upload Cloudinary (dados pessoais potenciais: e-mail opcional, screenshot).
- Permissao admin na rota de triagem.

## Consideracoes de Seguranca

- CSRF: confirmado em `backend/src/middleware/csrfProtection.ts`. Request anonimo (sem cookie `am_session`) passa; request logado same-origin passa por checagem de origin. Nenhum bloqueio esperado para o POST do frontend.
- Screenshot pode conter dados visiveis na tela do usuario; por isso e opt-out explicito e o usuario sabe que sera enviado.
- `contact_email` e PII opt-in; nao obrigatorio.
- Nunca registrar segredos/tokens em `network_errors`.

## Criterio de Pronto

- Usuario consegue enviar bug e sugestao de qualquer pagina (exceto login/callback), anonimo ou logado.
- Contexto (rota, console, rede) e screenshot chegam gravados na linha de `dev_feedback`.
- Admin ve o relato completo na aba "Desenvolvimento" e altera status/notas.
- Teste unitario do validador GREEN (TDD).
- Build backend GREEN; build/lint/test frontend GREEN.
- `database/changelogs.json` atualizado e JSON valido.
- `git diff --check` limpo.
- Nenhuma validacao funcional de UI declarada concluida antes do teste do mantenedor em Beta (janela anonima).
