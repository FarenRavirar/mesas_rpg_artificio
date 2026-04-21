-- @class: online-safe
-- @requires-backup: false
-- @author: test-fixture
-- @created: 2026-04-20
-- @description: fixture online-safe para integration test — cria índice idempotente

CREATE INDEX IF NOT EXISTS idx_test_901_applied_at 
  ON schema_migrations(applied_at);
