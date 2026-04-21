#!/usr/bin/env bash
set -euo pipefail

# Scripts roda no runner do github actions durante puxada de PR para main.

echo "Conectando em beta..."
PG_BETA=$(ssh -F C:\\projetos\\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -tAc 'SELECT version();'")
DB_BETA=$(ssh -F C:\\projetos\\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -tAc 'SELECT migration_name FROM schema_migrations ORDER BY migration_name;' 2>/dev/null" || echo "")

echo "Conectando em prod..."
PG_PROD=$(ssh -F C:\\projetos\\config faren "docker exec mesas-db psql -U admin -d mesas_rpg -tAc 'SELECT version();'")
DB_PROD=$(ssh -F C:\\projetos\\config faren "docker exec mesas-db psql -U admin -d mesas_rpg -tAc 'SELECT migration_name FROM schema_migrations ORDER BY migration_name;' 2>/dev/null" || echo "")

DISK_HEAD=$(find ./database -maxdepth 1 -name "migration_*.sql" -exec basename {} \; | sort)

REPORT_FILE="/tmp/preflight_report.md"

cat <<EOF > "$REPORT_FILE"
## Preflight Report

**PostgreSQL Beta:** $PG_BETA
**PostgreSQL Prod:** $PG_PROD

EOF

# Analisa Prod vs Head (bloqueante)
MISSING_PROD=0
cat <<EOF >> "$REPORT_FILE"
### Prod vs HEAD (Main pós-merge simulada)
EOF

for f in $DISK_HEAD; do
  if ! echo "$DB_PROD" | grep -Fxq "$f"; then
    echo "- $f (Pendente em Prod)" >> "$REPORT_FILE"
    MISSING_PROD=$((MISSING_PROD + 1))
  fi
done

for db_mig in $DB_PROD; do
  if ! echo "$DISK_HEAD" | grep -Fxq "$db_mig"; then
     # shellcheck disable=SC2129  # Múltiplos redirects intencionais para legibilidade
     echo "- **DRIFT FATAL (I2):** $db_mig existe no banco de Producao mas ausente na branch." >> "$REPORT_FILE"
     echo "" >> "$REPORT_FILE"
     echo "# :stop_sign: BLOCKED" >> "$REPORT_FILE"
     exit 1
  fi
done

cat <<EOF >> "$REPORT_FILE"
### Beta vs HEAD (Informativo)
EOF

for f in $DISK_HEAD; do
  if ! echo "$DB_BETA" | grep -Fxq "$f"; then
    echo "- $f (Pendente em Beta)" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"

if [ "$MISSING_PROD" -gt 0 ]; then
  echo "# :warning: ATTENTION" >> "$REPORT_FILE"
else
  echo "# :white_check_mark: GO" >> "$REPORT_FILE"
fi

exit 0
