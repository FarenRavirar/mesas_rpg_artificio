#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Uso: bash scripts/deploy/apply_required_migrations.sh <compose_file> <db_service>"
  exit 1
fi

COMPOSE_FILE="$1"
DB_SERVICE="$2"
DB_NAME="mesas_rpg"
DB_USER="admin"
MIGRATIONS_DIR="./database"

LOCK_TIMEOUT="${LOCK_TIMEOUT:-5s}"
STATEMENT_TIMEOUT="${STATEMENT_TIMEOUT:-120s}"
MAX_AUTO_PENDING="${MAX_AUTO_PENDING:-5}"
ALLOW_MANUAL_MIGRATIONS="${ALLOW_MANUAL_MIGRATIONS:-false}"
REQUIRE_PROD_BACKUP_FOR_MANUAL="${REQUIRE_PROD_BACKUP_FOR_MANUAL:-true}"
PROD_BACKUP_FILE="${PROD_BACKUP_FILE:-}"

ONLINE_SAFE_MIGRATIONS=(
  "migration_101_add_banner_crop_data.sql"
  "migration_102_add_name_pt.sql"
  "migration_103_scenario_suggestions.sql"
  "migration_105_communication_platforms.sql"
  "migration_106_vtt_logo_filenames.sql"
  "migration_107_gm_public_profile_v2.sql"
)

# Migrations classificadas como risco/execucao manual.
# Exemplo de uso futuro:
# MANUAL_RISK_MIGRATIONS=("migration_104_backfill_heavy.sql")
MANUAL_RISK_MIGRATIONS=(
  "migration_104_drop_tables_frequency_columns.sql"
)

is_true() {
  case "${1,,}" in
    1|true|yes|y) return 0 ;;
    *) return 1 ;;
  esac
}

sql_escape_literal() {
  local raw="$1"
  printf "%s" "$raw" | sed "s/'/''/g"
}

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERRO: Compose file nao encontrado: $COMPOSE_FILE"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "ERRO: Diretorio de migrations nao encontrado: $MIGRATIONS_DIR"
  exit 1
fi

if [[ "$COMPOSE_FILE" == *"prod"* ]]; then
  IS_PROD=true
else
  IS_PROD=false
fi

PG_OPTS="-c lock_timeout=${LOCK_TIMEOUT} -c statement_timeout=${STATEMENT_TIMEOUT}"

echo "[migrations] garantindo tabela schema_migrations..."
docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

is_applied() {
  local migration_name="$1"
  local escaped_name
  escaped_name="$(sql_escape_literal "$migration_name")"

  docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
    psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM schema_migrations WHERE migration_name='${escaped_name}' LIMIT 1;"
}

PENDING_ONLINE=()
for migration in "${ONLINE_SAFE_MIGRATIONS[@]}"; do
  migration_path="$MIGRATIONS_DIR/$migration"
  if [ ! -f "$migration_path" ]; then
    echo "ERRO: Migration online-safe nao encontrada: $migration_path"
    exit 1
  fi

  applied=$(is_applied "$migration")
  if [ "$applied" != "1" ]; then
    PENDING_ONLINE+=("$migration")
  fi
done

PENDING_MANUAL=()
for migration in "${MANUAL_RISK_MIGRATIONS[@]}"; do
  migration_path="$MIGRATIONS_DIR/$migration"
  if [ ! -f "$migration_path" ]; then
    echo "ERRO: Migration manual/risk nao encontrada: $migration_path"
    exit 1
  fi

  applied=$(is_applied "$migration")
  if [ "$applied" != "1" ]; then
    PENDING_MANUAL+=("$migration")
  fi
done

if [ "${#PENDING_ONLINE[@]}" -gt "$MAX_AUTO_PENDING" ]; then
  echo "ERRO: Muitas migrations online-safe pendentes (${#PENDING_ONLINE[@]} > $MAX_AUTO_PENDING)."
  echo "ABORTANDO deploy automatico para execucao controlada."
  printf ' - %s\n' "${PENDING_ONLINE[@]}"
  exit 1
fi

if [ "${#PENDING_MANUAL[@]}" -gt 0 ]; then
  if ! is_true "$ALLOW_MANUAL_MIGRATIONS"; then
    echo "ERRO: Existem migrations classificadas como MANUAL/RISK pendentes."
    echo "Deploy automatico bloqueado. Execute fluxo manual com janela e backup."
    printf ' - %s\n' "${PENDING_MANUAL[@]}"
    exit 1
  fi

  if [ "$IS_PROD" = true ] && is_true "$REQUIRE_PROD_BACKUP_FOR_MANUAL"; then
    if [ -z "$PROD_BACKUP_FILE" ] || [ ! -s "$PROD_BACKUP_FILE" ]; then
      echo "ERRO: Backup obrigatorio de producao ausente para migration manual/risk."
      echo "Defina PROD_BACKUP_FILE com caminho valido para dump recente antes de prosseguir."
      exit 1
    fi
  fi
fi

for migration in "${PENDING_ONLINE[@]}"; do
  migration_path="$MIGRATIONS_DIR/$migration"

  if grep -Eiv '^[[:space:]]*--' "$migration_path" | grep -Eiq '\b(TRUNCATE|DROP[[:space:]]+TABLE|DROP[[:space:]]+COLUMN|DELETE[[:space:]]+FROM)\b'; then
    echo "ERRO: Migration online-safe contem comando destrutivo: $migration"
    echo "Reclassifique como MANUAL_RISK_MIGRATIONS e use fluxo manual com backup."
    exit 1
  fi

  echo "[migrations] aplicando online-safe: $migration..."
  cat "$migration_path" | docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
    psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"

  escaped_migration="$(sql_escape_literal "$migration")"

  docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
    psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
    -c "INSERT INTO schema_migrations (migration_name) VALUES ('${escaped_migration}') ON CONFLICT (migration_name) DO NOTHING;"
done

if [ "${#PENDING_MANUAL[@]}" -gt 0 ] && is_true "$ALLOW_MANUAL_MIGRATIONS"; then
  for migration in "${PENDING_MANUAL[@]}"; do
    migration_path="$MIGRATIONS_DIR/$migration"
    echo "[migrations] aplicando manual/risk: $migration..."

    cat "$migration_path" | docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
      psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"

    escaped_migration="$(sql_escape_literal "$migration")"

    docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
      psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
      -c "INSERT INTO schema_migrations (migration_name) VALUES ('${escaped_migration}') ON CONFLICT (migration_name) DO NOTHING;"
  done
fi

echo "[migrations] validando schema minimo esperado..."
docker compose -f "$COMPOSE_FILE" exec -T -e PGOPTIONS="$PG_OPTS" "$DB_SERVICE" \
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'system_suggestions'
      AND column_name = 'name_pt'
  ) THEN
    RAISE EXCEPTION 'Schema invalido: coluna system_suggestions.name_pt ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'scenario_suggestions'
  ) THEN
    RAISE EXCEPTION 'Schema invalido: tabela scenario_suggestions ausente';
  END IF;
END $$;
SQL

echo "[migrations] schema em conformidade para runtime."
