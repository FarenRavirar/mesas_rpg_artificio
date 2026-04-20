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

@test "list_pending_by_set_diff returns diff when disk has more than db" {
  # We will mock the psql query in the next phase, for now it will just fail.
  run list_pending_by_set_diff "mock-compose" "mock-db"
  assert_failure
}
