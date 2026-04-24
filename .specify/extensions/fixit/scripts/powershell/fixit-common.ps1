# Fixit extension: fixit-common.ps1
# Shared utilities for fixit scripts (PowerShell)

function Write-StatusSuccess {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-StatusError {
    param([string]$Message)
    Write-Host "[ERR] $Message" -ForegroundColor Red
}

function Write-StatusWarning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-StatusInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Get-RepoRoot {
    $dir = Get-Location
    while ($dir.Path -ne $dir.Root.Path) {
        if ((Test-Path "$($dir.Path)\.specify") -or (Test-Path "$($dir.Path)\.git")) {
            return $dir.Path
        }
        $dir = $dir.Parent
    }
    throw "Could not find project root (.specify or .git directory)"
}

function Test-HasGit {
    param([string]$RepoRoot)
    
    try {
        $null = git -C $RepoRoot rev-parse --is-inside-work-tree 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function ConvertTo-JsonEscape {
    param([string]$String)

    if ($null -eq $String) {
        return ""
    }

    return $String
}

function Get-FixitConfig {
    param([string]$ConfigFile)
    
    if (-not (Test-Path $ConfigFile)) {
        return $null
    }
    
    # Simple YAML parser for our config
    $config = @{}
    
    Get-Content $ConfigFile | ForEach-Object {
        $line = $_.Trim()
        
        # Skip comments and empty lines
        if ($line -match '^#' -or [string]::IsNullOrWhiteSpace($line)) {
            return
        }
        
        # Parse key: value
        if ($line -match '^([^:]+):\s*(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            $config[$key] = $value
        }
    }
    
    return $config
}


