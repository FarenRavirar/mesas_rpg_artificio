-- @class: online-safe
-- @requires-backup: true
-- @author: sdd-016-discord-pipeline-rebuild
-- @created: 2026-06-01
-- @description: Impede drafts Discord prontos com campos obrigatorios pendentes.

-- 1. Invariante: status='ready' exige missing_fields como array vazio.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discord_drafts_ready_requires_no_missing'
      AND conrelid = 'discord_import_table_drafts'::regclass
  ) THEN
    ALTER TABLE discord_import_table_drafts
      ADD CONSTRAINT discord_drafts_ready_requires_no_missing
      CHECK (
        status <> 'ready'
        OR (
          normalized_payload IS NOT NULL
          AND jsonb_typeof(normalized_payload->'missing_fields') = 'array'
          AND jsonb_array_length(normalized_payload->'missing_fields') = 0
        )
      )
      NOT VALID;
  END IF;
END $$;

ALTER TABLE discord_import_table_drafts
  VALIDATE CONSTRAINT discord_drafts_ready_requires_no_missing;

-- 2. Validacao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discord_drafts_ready_requires_no_missing'
      AND conrelid = 'discord_import_table_drafts'::regclass
  ) THEN
    RAISE EXCEPTION 'migration falhou: constraint discord_drafts_ready_requires_no_missing nao criada';
  END IF;

  RAISE NOTICE 'migration_118: discord draft ready invariant ok';
END $$;
