# Script para executar Migration 006 no banco beta
# CORREÇÃO A-CRIT-01: Executar migration pendente que está causando erro 500

Write-Host "=== EXECUTAR MIGRATION 006 NO BANCO BETA ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se migration existe
$migrationFile = "C:\projetos\mesas_rpg_artificio\backend\migrations\006_create_vtt_platforms.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERRO: Migration 006 não encontrada em $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration encontrada: $migrationFile" -ForegroundColor Green
Write-Host ""

# Mostrar conteúdo da migration
Write-Host "=== CONTEÚDO DA MIGRATION ===" -ForegroundColor Yellow
Get-Content $migrationFile | Select-Object -First 20
Write-Host "..." -ForegroundColor Gray
Write-Host ""

# Confirmar execução
Write-Host "ATENÇÃO: Esta operação irá:" -ForegroundColor Yellow
Write-Host "  1. Criar tabela vtt_platforms" -ForegroundColor White
Write-Host "  2. Criar tabela vtt_platform_suggestions" -ForegroundColor White
Write-Host "  3. Adicionar colunas vtt_platform_id, game_platform_custom e game_platform_legacy à tabela tables" -ForegroundColor White
Write-Host "  4. Migrar dados existentes de game_platform para game_platform_legacy" -ForegroundColor White
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
docker exec -i mesas-beta-db psql -U admin -d mesas_rpg < /opt/mesas-beta/backend/migrations/006_create_vtt_platforms.sql
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
        
        # Verificar que tabela foi criada
        Write-Host "Verificando que tabela vtt_platforms foi criada..." -ForegroundColor Cyan
        $verifyCommand = "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d vtt_platforms'"
        ssh opc@150.136.62.253 $verifyCommand
        
        Write-Host ""
        Write-Host "=== PRÓXIMOS PASSOS ===" -ForegroundColor Yellow
        Write-Host "1. Testar endpoint que estava quebrado:" -ForegroundColor White
        Write-Host "   curl https://mesasbeta.artificiorpg.com/api/v1/tables/a-voz-nas-cartas-mnoks2do" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Verificar logs do backend:" -ForegroundColor White
        Write-Host "   ssh opc@150.136.62.253 'docker logs mesas-beta-api --tail 50'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Acessar mesa no navegador:" -ForegroundColor White
        Write-Host "   https://mesasbeta.artificiorpg.com/mesa/a-voz-nas-cartas-mnoks2do" -ForegroundColor Gray
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
