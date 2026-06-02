# Spec 019 - Agenda a Definir na Nova Mesa

## Objetivo

Permitir que o mestre publique uma mesa com `dia da semana a definir` e/ou `horario a definir`, sem gravar linhas incompletas em `table_schedules`.

## Problema

O fluxo Nova Mesa exige ao menos uma sessao com `day_of_week` e `start_time`. O backend e o banco tambem tratam `table_schedules` como estrutura completa: `day_of_week` e `start_time` sao obrigatorios. Isso impede anuncios validos em que o grupo ainda vai combinar dia ou horario.

## Escopo

- Fluxo Nova Mesa e edicao de mesa pelo mestre.
- Contrato `POST/PUT /api/v1/gm/tables`.
- Exibicao publica da pagina da mesa.
- Preservacao de `table_schedules` como fonte de sessoes completas.

## Fora do Escopo

- Alterar regras do Discord Sync.
- Criar busca/filtro publico por mesas com agenda flexivel.
- Mudar `table_schedules` para aceitar `NULL` em `day_of_week` ou `start_time`.

## Modelo de Dados

`table_schedules` continua recebendo apenas sessoes completas.

Campos novos em `tables`:

- `schedule_day_status`: `defined | to_define`
- `schedule_time_status`: `defined | to_define`
- `schedule_day_hint`: dia conhecido quando horario ainda esta a definir.
- `schedule_time_hint`: horario conhecido quando dia ainda esta a definir.

Regras:

- Se dia e horario estao definidos, enviar/gravar `table_schedules`.
- Se dia ou horario esta a definir, nao criar linha parcial em `table_schedules`; gravar status/hint em `tables`.
- Se `schedule_day_status='to_define'`, `schedule_day_hint` deve ser `NULL`.
- Se `schedule_time_status='to_define'`, `schedule_time_hint` deve ser `NULL`.

## Requisitos Funcionais

- FR-001: Nova Mesa deve oferecer opcao explicita `Dia da semana a definir`.
- FR-002: Nova Mesa deve oferecer opcao explicita `Horario a definir`.
- FR-003: Formulario deve validar sessoes completas quando dia e horario estao definidos.
- FR-004: Formulario deve aceitar dia/horario indefinidos sem exigir linha completa.
- FR-005: API deve validar o novo contrato e nunca inserir `table_schedules` incompleto.
- FR-006: Pagina publica deve exibir `Dia a definir`, `Horario a definir` ou ambos quando aplicavel.
- FR-007: Edicao de mesa deve carregar os status/hints sem preencher horario ficticio.

## Risco e Processo

Classificacao: SDD Completo.

Motivo: migration aditiva, contrato API, validacao backend/frontend e exibicao publica.

## Criterio de Pronto

- Criar/editar mesa com agenda a definir passa no build e validacao local.
- `table_schedules` permanece sem linhas parciais.
- Exibicao publica mostra texto leigo para agenda a definir.
- `database/changelogs.json` atualizado.
