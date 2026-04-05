# Setup Python Environment for Discord Message Parser
# Windows PowerShell Script
# Uso: .\setup_python_env.ps1

Write-Host "=== Setup Python Environment ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "Verificando instalação do Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python não encontrado. Instale Python 3.8+ antes de continuar." -ForegroundColor Red
    exit 1
}

# Verificar versão mínima (3.8+)
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
        Write-Host "✗ Python 3.8+ é necessário. Versão atual: $pythonVersion" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Atualizar pip
Write-Host "Atualizando pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ pip atualizado com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Falha ao atualizar pip" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Instalar dependências do requirements.txt
Write-Host "Instalando dependências do requirements.txt..." -ForegroundColor Yellow
$requirementsPath = Join-Path $PSScriptRoot "..\requirements.txt"
if (Test-Path $requirementsPath) {
    pip install -r $requirementsPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependências instaladas com sucesso" -ForegroundColor Green
    } else {
        Write-Host "✗ Falha ao instalar dependências" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Arquivo requirements.txt não encontrado em: $requirementsPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Baixar modelo spaCy pt_core_news_lg
Write-Host "Baixando modelo spaCy pt_core_news_lg..." -ForegroundColor Yellow
Write-Host "(Isso pode levar alguns minutos na primeira vez)" -ForegroundColor Gray
python -m spacy download pt_core_news_lg
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Modelo spaCy baixado com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Falha ao baixar modelo spaCy" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Validar instalação do modelo
Write-Host "Validando instalação do modelo spaCy..." -ForegroundColor Yellow
python -m spacy info pt_core_news_lg 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Modelo pt_core_news_lg validado com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Modelo pt_core_news_lg não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup concluído com sucesso! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Implementar parser core em src/services/aggregator/parser/" -ForegroundColor White
Write-Host "2. Criar extractors modulares" -ForegroundColor White
Write-Host "3. Integrar com backend Node.js" -ForegroundColor White
Write-Host ""
