# Script para executar Migration 17 no ambiente Beta
# Sistema de Changelog/Atualizações

Write-Host "=== Executando Migration 17 (update_log) no Beta ===" -ForegroundColor Cyan

# Conectar via SSH e executar migration
ssh -F C:\projetos\config faren @"
cd /opt/mesas-beta
docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /docker-entrypoint-initdb.d/migration_17_update_log.sql
"@

Write-Host "`n=== Migration 17 concluída ===" -ForegroundColor Green
