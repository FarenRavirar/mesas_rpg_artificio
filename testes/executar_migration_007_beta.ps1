# Script para executar Migration 007 no banco beta
# Adiciona suporte para click tracking e A/B testing

Write-Host "=== EXECUTAR MIGRATION 007 NO BANCO BETA ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se migration existe
$migrationFile = "C:\projetos\mesas_rpg_artificio\backend\migrations\007_click_tracking.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERRO: Migration 007 não encontrada em $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration encontrada: $migrationFile" -ForegroundColor Green
Write-Host ""

# Mostrar conteúdo da migration
Write-Host "=== CONTEÚDO DA MIGRATION ===" -ForegroundColor Yellow
Get-Content $migrationFile
Write-Host ""

# Confirmar execução
Write-Host "ATENÇÃO: Esta operação irá:" -ForegroundColor Yellow
Write-Host "  1. Adicionar coluna clicks_count à tabela table_metrics" -ForegroundColor White
Write-Host "  2. Criar índice idx_table_metrics_ranking para performance" -ForegroundColor White
Write-Host "  3. Criar tabela table_click_events para A/B testing" -ForegroundColor White
Write-Host "  4. Criar índices para análise de eventos" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Deseja prosseguir? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== EXECUTANDO MIGRATION NO BANCO BETA ===" -ForegroundColor Cyan

# Comando SSH para executar migration
$sshCommand = @"
docker exec -i mesas-beta-db psql -U admin -d mesas_rpg < /opt/mesas-beta/backend/migrations/007_click_tracking.sql
"@

Write-Host "Comando SSH:" -ForegroundColor Gray
Write-Host $sshCommand -ForegroundColor Gray
Write-Host ""

# Executar via SSH
try {
    ssh opc@150.136.62.253 $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== MIGRATION EXECUTADA COM SUCESSO ===" -ForegroundColor Green
        Write-Host ""
        
        # Verificar que coluna foi criada
        Write-Host "Verificando estrutura de table_metrics..." -ForegroundColor Cyan
        $verifyCommand = "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d table_metrics'"
        ssh opc@150.136.62.253 $verifyCommand
        
        Write-Host ""
        Write-Host "Verificando tabela table_click_events..." -ForegroundColor Cyan
        $verifyCommand2 = "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d table_click_events'"
        ssh opc@150.136.62.253 $verifyCommand2
        
        Write-Host ""
        Write-Host "=== PRÓXIMOS PASSOS ===" -ForegroundColor Yellow
        Write-Host "1. Implementar ranking inteligente no backend" -ForegroundColor White
        Write-Host "2. Implementar endpoint POST /api/v1/tables/:slug/click" -ForegroundColor White
        Write-Host "3. Instalar React Query no frontend" -ForegroundColor White
        Write-Host "4. Implementar prefetch e click tracking no TableCard" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "ERRO: Migration falhou com código $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Verifique os logs acima para detalhes." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "ERRO ao executar SSH: $_" -ForegroundColor Red
    exit 1
}
