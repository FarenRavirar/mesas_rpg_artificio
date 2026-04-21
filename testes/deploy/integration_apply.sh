#!/usr/bin/env bash
# Integration test — runs against remote VM via SSH, uses ephemeral postgres via docker compose.
# Arquitetura documentada em specs/001-gate-migrations-refactor/plan.md §8.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

SSH_CONFIG="C:/projetos/config"
SSH_TARGET="faren"
REMOTE_DIR="/tmp/mesas-integration-$$"
COMPOSE_PROJECT="mesas_test_$$"

echo "[integration] Iniciando — PID=$$"
echo "[integration] Remote dir: $REMOTE_DIR"
echo "[integration] Compose project: $COMPOSE_PROJECT"

# --- Empacotar artefatos para envio ---
echo "[integration] Empacotando..."
TARBALL="$(mktemp).tar.gz"
tar -czf "$TARBALL" \
  scripts/deploy/lib_migrations.sh \
  scripts/deploy/apply_required_migrations.sh \
  scripts/deploy/reconcile_migrations.sh \
  testes/deploy/fixtures/ \
  testes/deploy/docker-compose.test.yml \
  database/migration_114_add_applied_by.sql

SIZE=$(stat -c%s "$TARBALL" 2>/dev/null || stat -f%z "$TARBALL" 2>/dev/null || echo "?")
echo "[integration] Tarball: $SIZE bytes"

# --- Enviar e executar em single shot SSH ---
echo "[integration] Enviando e executando remotamente..."

ssh -F "$SSH_CONFIG" "$SSH_TARGET" "mkdir -p $REMOTE_DIR"
cat "$TARBALL" | ssh -F "$SSH_CONFIG" "$SSH_TARGET" "cd $REMOTE_DIR && tar -xzf -"
rm "$TARBALL"

# Script remoto — cuidado com escape de variáveis:
#   \$var = variável resolvida NA VM (remote shell)
#   $var  = variável resolvida AQUI (local shell, expandida antes do SSH)
ssh -F "$SSH_CONFIG" "$SSH_TARGET" bash << REMOTE_SCRIPT
set -euo pipefail
cd $REMOTE_DIR

COMPOSE_FILE="testes/deploy/docker-compose.test.yml"
DB_SERVICE="test-pg"
COMPOSE_PROJECT="$COMPOSE_PROJECT"

cleanup() {
  echo "[cleanup] Derrubando compose project \$COMPOSE_PROJECT"
  docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
  rm -rf "$REMOTE_DIR"
}
trap cleanup EXIT INT TERM

# Preparar diretório de migrations dedicado ao teste
MIG_DIR=\$(mktemp -d)
cp database/migration_114_add_applied_by.sql "\$MIG_DIR/"
cp testes/deploy/fixtures/migration_901_test_online_safe.sql "\$MIG_DIR/"

# Subir container
echo "[TEST] Subindo postgres descartável..."
docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" up -d

# Aguardar healthcheck
echo "[TEST] Aguardando pg_isready..."
for i in {1..30}; do
  status=\$(docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" ps --format json test-pg 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "")
  if [ "\$status" = "healthy" ]; then
    echo "[TEST] Postgres pronto."
    break
  fi
  sleep 2
done

# ==================== TEST 1 — aplicação limpa ====================
echo ""
echo "[TEST 1] Aplicação limpa de migration online-safe"

MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"

REGISTERED=\$(docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" exec -T "\$DB_SERVICE" \\
  psql -U admin -d mesas_rpg -tAc \\
  "SELECT count(*) FROM schema_migrations WHERE migration_name='migration_901_test_online_safe.sql';" < /dev/null | tr -d '[:space:]')

if [ "\$REGISTERED" != "1" ]; then
  echo "FAIL [TEST 1]: migration_901 não registrada (count=\$REGISTERED)"
  exit 1
fi
echo "OK [TEST 1]"

# ==================== TEST 2 — idempotência ====================
echo ""
echo "[TEST 2] Idempotência — segunda execução não reaplica"

MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"

COUNT=\$(docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" exec -T "\$DB_SERVICE" \\
  psql -U admin -d mesas_rpg -tAc "SELECT count(*) FROM schema_migrations;" < /dev/null | tr -d '[:space:]')

# esperado: 2 (bootstrap do schema_migrations via migration_114 + migration_901)
if [ "\$COUNT" != "2" ]; then
  echo "FAIL [TEST 2]: esperado 2, obtido \$COUNT"
  exit 1
fi
echo "OK [TEST 2]"

# ==================== TEST 3 — manual-risk bloqueia ====================
echo ""
echo "[TEST 3] manual-risk bloqueado sem ALLOW_MANUAL_MIGRATIONS"

cp testes/deploy/fixtures/migration_902_test_manual_risk.sql "\$MIG_DIR/"
set +e
MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"
EXIT_3=\$?
set -e

if [ "\$EXIT_3" = "0" ]; then
  echo "FAIL [TEST 3]: deveria bloquear (exit 0 recebido)"
  exit 1
fi
echo "OK [TEST 3] (exit=\$EXIT_3)"

# ==================== TEST 4 — manual-risk liberado ====================
echo ""
echo "[TEST 4] manual-risk aplicado com ALLOW_MANUAL_MIGRATIONS + backup"

FAKE_BACKUP=\$(mktemp)
echo "-- fake backup" > "\$FAKE_BACKUP"

ALLOW_MANUAL_MIGRATIONS=true \\
REQUIRE_PROD_BACKUP_FOR_MANUAL=false \\
PROD_BACKUP_FILE="\$FAKE_BACKUP" \\
MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"

APPLIED_902=\$(docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" exec -T "\$DB_SERVICE" \\
  psql -U admin -d mesas_rpg -tAc \\
  "SELECT count(*) FROM schema_migrations WHERE migration_name='migration_902_test_manual_risk.sql';" < /dev/null | tr -d '[:space:]')

if [ "\$APPLIED_902" != "1" ]; then
  echo "FAIL [TEST 4]: 902 não aplicada após liberação"
  exit 1
fi
echo "OK [TEST 4]"

# ==================== TEST 5 — drift I2 ====================
echo ""
echo "[TEST 5] Drift I2 — banco tem migration que disco não tem"

docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" exec -T "\$DB_SERVICE" \\
  psql -U admin -d mesas_rpg -c \\
  "INSERT INTO schema_migrations (migration_name, applied_by) VALUES ('migration_999_ghost.sql', 'test');" < /dev/null

set +e
MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"
EXIT_5=\$?
set -e

if [ "\$EXIT_5" = "0" ]; then
  echo "FAIL [TEST 5]: deveria bloquear por drift I2"
  exit 1
fi
echo "OK [TEST 5] (exit=\$EXIT_5)"

# ==================== TEST 6 — cabeçalho ausente ====================
echo ""
echo "[TEST 6] Cabeçalho ausente bloqueia em validate"

# Limpar drift do teste 5 para isolar causa do teste 6
docker compose -p "\$COMPOSE_PROJECT" -f "\$COMPOSE_FILE" exec -T "\$DB_SERVICE" \\
  psql -U admin -d mesas_rpg -c \\
  "DELETE FROM schema_migrations WHERE migration_name='migration_999_ghost.sql';" < /dev/null

cp testes/deploy/fixtures/migration_903_test_missing_header.sql "\$MIG_DIR/"
set +e
MIGRATIONS_DIR="\$MIG_DIR" \\
COMPOSE_PROJECT="\$COMPOSE_PROJECT" \\
bash scripts/deploy/apply_required_migrations.sh "\$COMPOSE_FILE" "\$DB_SERVICE"
EXIT_6=\$?
set -e

if [ "\$EXIT_6" = "0" ]; then
  echo "FAIL [TEST 6]: deveria bloquear por cabeçalho inválido"
  exit 1
fi
echo "OK [TEST 6] (exit=\$EXIT_6)"

echo ""
echo "=== ALL INTEGRATION TESTS PASSED ==="
REMOTE_SCRIPT

REMOTE_EXIT=$?
echo ""
echo "[integration] Exit code remoto: $REMOTE_EXIT"
exit $REMOTE_EXIT
