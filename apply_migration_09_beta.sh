#!/bin/bash
# Script para aplicar migration_09 no beta
# Uso: bash apply_migration_09_beta.sh

echo "=== Aplicando Migration 09 no Beta ==="

# Transferir arquivo para VM
echo "1. Transferindo migration para VM..."
scp database/migration_09_table_frequency_rules_banner.sql faren:/tmp/migration_09.sql

if [ $? -ne 0 ]; then
    echo "Erro ao transferir arquivo. Tentando método alternativo..."
    ssh faren "cat > /tmp/migration_09.sql" < database/migration_09_table_frequency_rules_banner.sql
fi

# Aplicar migration
echo "2. Aplicando migration no banco beta..."
ssh faren "cat /tmp/migration_09.sql | docker exec -i mesas-beta-db psql -U admin -d mesas_rpg"

# Verificar
echo "3. Verificando colunas criadas..."
ssh faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c \"\\d tables\" | grep -E 'frequency|rules_notes|banner_url'"

echo "=== Migration 09 aplicada com sucesso! ==="
