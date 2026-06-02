# Plan 019 - Agenda a Definir

## Decisao de Contrato

Nao alterar a obrigatoriedade de `table_schedules.day_of_week` nem `table_schedules.start_time`.

Contrato novo fica no objeto mesa:

```json
{
  "schedule_day_status": "defined",
  "schedule_time_status": "to_define",
  "schedule_day_hint": "quarta",
  "schedule_time_hint": null,
  "schedules": []
}
```

Quando `schedules` contem sessoes completas, os status ficam `defined` e hints ficam `null`.

## Arquivos

- `database/migration_124_table_schedule_tbd.sql`
- `backend/src/db/types.ts`
- `backend/src/validators/tableValidators.ts`
- `backend/src/services/tableService.ts`
- `backend/src/routes/gmPanel.ts`
- `backend/src/routes/tables.ts`
- `frontend/src/components/SessionRepeater.tsx`
- `frontend/src/features/create-table/**`
- `frontend/src/types/tables.ts`
- `frontend/src/features/table/**`
- `database/changelogs.json`

## Sequencia

1. Migration aditiva em `tables`.
2. Tipos DB/API.
3. Backend valida e persiste status/hints.
4. Frontend permite `to_define` em dia/horario.
5. Mapper filtra sessoes completas; parcial vira status/hint.
6. Exibicao publica usa status/hint quando nao ha schedule completo.
7. Builds e busca final.

## Validacao

- `npm --prefix backend test -- systemSuggestionCandidates`
- `npm --prefix backend run build`
- `npm --prefix frontend run build`
- `database/changelogs.json` parse OK
- `git diff --check`
