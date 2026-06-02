# Spec 024 - Triagem de Feedback (Arquivar, Excluir, Mesclar)

## Objetivo

Adicionar acoes de triagem na aba "Desenvolvimento" (`/gestao`, Spec 022): arquivar, excluir e mesclar feedbacks, para a equipe organizar os relatos durante os testes publicos.

## Problema

A aba so permite mudar status e notas. Com volume de testes, faltam: tirar itens resolvidos da lista ativa (sem perder historico), remover lixo de vez, e consolidar relatos duplicados num so.

## Escopo

- Arquivar/desarquivar feedback (soft, reversivel).
- Excluir feedback (remove registro + screenshot no Cloudinary).
- Mesclar: escolher 1 destino + N secundarios; integrar TODAS as infos dos secundarios no destino; arquivar os secundarios com referencia ao destino.
- Filtro de arquivados na listagem.
- API admin + UI no `DevFeedbackPanel`.

## Fora do Escopo

- Mescla automatica por similaridade (sugestao de duplicados). "Inteligente" aqui = integracao estruturada manual de todas as infos.
- Notificacao de retorno ao usuario.
- Deploy direto para producao.

## Modelo de Dados

Migration 126 (online-safe) adiciona em `dev_feedback`:

- `archived_at TIMESTAMPTZ NULL` — NULL = ativo.
- `screenshot_public_id TEXT NULL` — public_id Cloudinary, para excluir o asset junto.
- `merged_into UUID NULL REFERENCES dev_feedback(id) ON DELETE SET NULL` — destino quando mesclado.
- `merged_sources JSONB NOT NULL DEFAULT '[]'` — snapshots completos dos integrados.
- Indice `idx_dev_feedback_archived_at`.

## Decisoes do Mantenedor

- C1: secundarios da mescla -> arquivados (nao excluidos), com `merged_into` no destino.
- C2: mesclar integra TUDO (descricao, console+rede, screenshots, contato/e-mail, rota) — util p/ feedback futuro.
- C3: arquivar via coluna `archived_at` (preserva o status de triagem).
- C4: excluir apaga tambem o screenshot do Cloudinary (requer `screenshot_public_id`).

## Requisitos Funcionais

- FR-001: `PATCH /api/v1/admin/dev-feedback/:id` aceita `archived: boolean` (seta/zera `archived_at`).
- FR-002: `DELETE /api/v1/admin/dev-feedback/:id` remove a linha e, se houver `screenshot_public_id`, apaga do Cloudinary (nao-fatal).
- FR-003: `POST /api/v1/admin/dev-feedback/merge` `{ primary_id, source_ids[] }` integra os secundarios no destino e arquiva os secundarios (`merged_into = primary_id`).
- FR-004: A mescla une `console_errors`/`network_errors` (dedup, cap 100) e acumula snapshot completo de cada secundario em `merged_sources`.
- FR-005: `GET` aceita `?archived=false|true|all`; default esconde arquivados.
- FR-006: POST publico passa a gravar `screenshot_public_id`.
- FR-007: Painel: botoes Arquivar/Desarquivar e Excluir (confirmacao inline) por card; selecao multipla + barra de mescla com escolha de destino; bloco "Integrados" e badges Arquivado/Mesclado.

## Requisitos Nao Funcionais

- NFR-001: Migration online-safe, sem backup.
- NFR-002: Mescla atomica (transacao).
- NFR-003: UUID validado nas rotas admin (400 em vez de 500).
- NFR-004: Payload de API normalizado como `unknown` no frontend.
- NFR-005: Acao interna de admin; sem entrada user-facing em `changelogs.json`.
- NFR-006: Operacoes irreversiveis (excluir/mesclar) confirmadas na UI.

## Risco e Processo

Classificacao: SDD Completo (migration + DELETE irreversivel + integracao de dados + API admin).

## Criterio de Pronto

- Arquivar/desarquivar, excluir (com remocao do screenshot) e mesclar funcionam.
- Mescla integra tudo no destino e arquiva os secundarios.
- Helper de mescla coberto por teste (TDD).
- Builds back/front GREEN; lint dos arquivos novos limpo.
- Migration 126 aplicada no gate Beta.
- Mantenedor valida em janela anonima no Beta.
