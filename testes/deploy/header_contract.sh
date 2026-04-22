#!/usr/bin/env bash
set -euo pipefail

# Contract test: every sql file in ./database/ must have a valid header
DIR="${1:-./database}"

if [ ! -d "$DIR" ]; then
    echo "Directory $DIR does not exist."
    exit 0
fi

# We use the parse_header function from lib_migrations.sh
if [ ! -f "scripts/deploy/lib_migrations.sh" ]; then
    echo "Error: lib_migrations.sh not found. Tests will fail."
    exit 1
fi

# shellcheck disable=SC1091  # Caminho estático, shellcheck não consegue seguir em tempo de parse
source scripts/deploy/lib_migrations.sh

# Find all migration SQL files
migrations=$(find "$DIR" -maxdepth 1 -type f -name "migration_*.sql" | sort)

if [ -z "$migrations" ]; then
    echo "No migrations found in $DIR. Ok."
    exit 0
fi

failures=0

for migration in $migrations; do
    echo "Checking header for $migration..."
    if ! parse_header "$migration" > /dev/null; then
        echo "::error::Invalid header in $migration"
        failures=$((failures + 1))
    fi
done

if [ "$failures" -gt 0 ]; then
    echo "$failures migrations failed header contract."
    exit 1
fi

echo "All migrations pass header contract."
exit 0
