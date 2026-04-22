#!/usr/bin/env bats

load 'test_helper/bats-support/load'
load 'test_helper/bats-assert/load'

setup() {
  # Mock lib_migrations.sh if needed later, but right now it doesn't exist or is empty
  # Actually, we should source it, but it might not exist yet. We'll touch an empty one for now to avoid 'source not found' error early on if we want, or just let it fail.
  
  if [ ! -f "scripts/deploy/lib_migrations.sh" ]; then
    mkdir -p "scripts/deploy"
    touch "scripts/deploy/lib_migrations.sh"
  fi
  source scripts/deploy/lib_migrations.sh
}

@test "parse_header extracts all fields from valid header" {
  run parse_header "testes/deploy/fixtures/header_valid.sql"
  assert_success
}

@test "parse_header rejects missing class" {
  run parse_header "testes/deploy/fixtures/header_no_class.sql"
  assert_failure
}

@test "parse_header rejects invalid class value" {
  run parse_header "testes/deploy/fixtures/header_invalid_class.sql"
  assert_failure
}

@test "parse_header rejects requires-backup true combined with online-safe" {
  run parse_header "testes/deploy/fixtures/header_coerence.sql"
  assert_failure
}

@test "validate_sql_against_class accepts online-safe + CREATE" {
  run validate_sql_against_class "testes/deploy/fixtures/header_valid.sql" "online-safe"
  assert_success
}

@test "validate_sql_against_class rejects online-safe + DROP TABLE" {
  run validate_sql_against_class "testes/deploy/fixtures/sql_online_drop.sql" "online-safe"
  assert_failure
}

@test "validate_sql_against_class rejects online-safe + TRUNCATE" {
  run validate_sql_against_class "testes/deploy/fixtures/sql_online_truncate.sql" "online-safe"
  assert_failure
}

@test "validate_sql_against_class rejects online-safe + DELETE FROM" {
  run validate_sql_against_class "testes/deploy/fixtures/sql_online_delete.sql" "online-safe"
  assert_failure
}

@test "validate_sql_against_class accepts manual-risk + DROP TABLE" {
  run validate_sql_against_class "testes/deploy/fixtures/sql_manual_drop.sql" "manual-risk"
  assert_success
}

@test "validate_sql_against_class ignores instructions in comments" {
  run validate_sql_against_class "testes/deploy/fixtures/sql_comment.sql" "online-safe"
  assert_success
}

@test "list_pending_by_set_diff returns pending when disk has more than db" {
  # Mock: psql retorna apenas 2 migrations registradas
  function mock_psql_registered() {
    echo "migration_01_base_schema.sql"
    echo "migration_02_system_taxonomy_and_ddal.sql"
  }
  export -f mock_psql_registered
  
  # Mock: disco tem 3 arquivos (01, 02, 03)
  mkdir -p "$BATS_TEST_TMPDIR/database"
  touch "$BATS_TEST_TMPDIR/database/migration_01_base_schema.sql"
  touch "$BATS_TEST_TMPDIR/database/migration_02_system_taxonomy_and_ddal.sql"
  touch "$BATS_TEST_TMPDIR/database/migration_03_gm_profile_nickname.sql"
  
  # Stub a função que consulta o banco — retorne a lista mockada
  export MIGRATIONS_DIR="$BATS_TEST_TMPDIR/database"
  
  run list_pending_by_set_diff "mock-compose" "mock-db" mock_psql_registered
  
  assert_success
  assert_output --partial "migration_03_gm_profile_nickname.sql"
  refute_output --partial "migration_01_base_schema.sql"
  refute_output --partial "migration_02_system_taxonomy_and_ddal.sql"
}

@test "list_pending_by_set_diff fails with I2 when db has more than disk (reverse drift)" {
  # Mock: psql retorna 3 migrations registradas
  function mock_psql_registered() {
    echo "migration_01_base_schema.sql"
    echo "migration_02_system_taxonomy_and_ddal.sql"
    echo "migration_99_ghost.sql"
  }
  export -f mock_psql_registered
  
  # Mock: disco tem apenas 2 arquivos
  mkdir -p "$BATS_TEST_TMPDIR/database"
  touch "$BATS_TEST_TMPDIR/database/migration_01_base_schema.sql"
  touch "$BATS_TEST_TMPDIR/database/migration_02_system_taxonomy_and_ddal.sql"
  export MIGRATIONS_DIR="$BATS_TEST_TMPDIR/database"
  
  run list_pending_by_set_diff "mock-compose" "mock-db" mock_psql_registered
  
  assert_failure
  assert_output --partial "DRIFT"
  assert_output --partial "migration_99_ghost.sql"
}
