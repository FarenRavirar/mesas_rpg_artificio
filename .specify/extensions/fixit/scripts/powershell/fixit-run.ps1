# Fixit extension: fixit-run.ps1
# Main script for spec-aware bug fixing (PowerShell)

param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]]$BugDescription
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Import common utilities
. "$ScriptDir\fixit-common.ps1"

$BugDescriptionStr = $BugDescription -join " "

if ([string]::IsNullOrWhiteSpace($BugDescriptionStr)) {
    Write-StatusError "Usage: fixit-run.ps1 <bug description>"
    Write-Host "Example: fixit-run.ps1 the registration form accepts empty email addresses"
    exit 1
}

# Step 1: Check prerequisites
$GitBashCandidates = @()
if ($env:ProgramFiles) {
    $GitBashCandidates += (Join-Path $env:ProgramFiles "Git\bin\bash.exe")
    $GitBashCandidates += (Join-Path $env:ProgramFiles "Git\usr\bin\bash.exe")
}
if ($env:ProgramW6432) {
    $GitBashCandidates += (Join-Path $env:ProgramW6432 "Git\bin\bash.exe")
}
if (${env:ProgramFiles(x86)}) {
    $GitBashCandidates += (Join-Path ${env:ProgramFiles(x86)} "Git\bin\bash.exe")
}

$BashExe = $GitBashCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $BashExe) {
    $BashCommand = Get-Command bash -ErrorAction SilentlyContinue
    if ($BashCommand -and $BashCommand.Source -and $BashCommand.Source -match 'Git\\.*bash\.exe$') {
        $BashExe = $BashCommand.Source
    }
}

if (-not $BashExe) {
    Write-StatusError "Git Bash not found. Please install Git for Windows."
    exit 1
}

$BashDir = Join-Path $ScriptDir "..\bash"
if (-not (Test-Path $BashDir)) {
    Write-StatusError "Bash scripts directory not found: $BashDir"
    exit 1
}
$BashDir = (Resolve-Path $BashDir).Path

# Step 1: Check prerequisites
Write-StatusInfo "Checking prerequisites..."

try {
    $CheckScript = Join-Path $BashDir "check-prerequisites.sh"
    $FeatureDir = & $BashExe $CheckScript
    if ($LASTEXITCODE -ne 0) {
        exit 1
    }
    
    Write-StatusSuccess "Feature directory: $FeatureDir"
}
catch {
    Write-StatusError "Prerequisites check failed: $_"
    exit 1
}

# Step 2: Load context
Write-StatusInfo "Loading context..."

try {
    $RepoRoot = Get-RepoRoot
    $LoadScript = Join-Path $BashDir "load-context.sh"
    
    $ContextOutput = & $BashExe $LoadScript $FeatureDir $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        exit 1
    }
    
    Write-Host $ContextOutput
}
catch {
    Write-StatusError "Context loading failed: $_"
    exit 1
}

# Step 3: Map bug to spec
Write-StatusInfo "Mapping bug to spec..."

try {
    $MapScript = Join-Path $BashDir "map-bug-to-spec.sh"
    
    $SpecMapping = & $BashExe $MapScript $FeatureDir $BugDescriptionStr
    if ($LASTEXITCODE -ne 0) {
        Write-StatusWarning "Could not map bug to spec. Proceeding with generic fix..."
        $SpecMapping = "No specific spec mapping found"
    }
    
    Write-Host $SpecMapping
}
catch {
    Write-StatusWarning "Spec mapping failed: $_"
    $SpecMapping = "No specific spec mapping found"
}

# Step 4: Locate affected files
Write-StatusInfo "Locating affected files..."

try {
    $LocateScript = Join-Path $BashDir "locate-files.sh"
    
    $AffectedFiles = & $BashExe $LocateScript $FeatureDir $BugDescriptionStr
    if ($LASTEXITCODE -ne 0) {
        Write-StatusError "Could not locate affected files"
        exit 1
    }
    
    Write-Host $AffectedFiles
}
catch {
    Write-StatusError "File location failed: $_"
    exit 1
}

# Step 5: Search historical sessions
Write-StatusInfo "Searching historical sessions..."

try {
    $SearchScript = Join-Path $BashDir "search-sessions.sh"
    
    $SessionHistory = & $BashExe $SearchScript $RepoRoot $BugDescriptionStr $AffectedFiles
    if ($LASTEXITCODE -ne 0) {
        Write-StatusInfo "No related sessions found"
        $SessionHistory = ""
    }
    
    if (-not [string]::IsNullOrWhiteSpace($SessionHistory)) {
        Write-Host $SessionHistory
    }
}
catch {
    Write-StatusInfo "Session search failed (non-blocking): $_"
    $SessionHistory = ""
}

# Step 6: Propose fix
Write-StatusInfo "Proposing fix..."

try {
    $ProposeScript = Join-Path $BashDir "propose-fix.sh"
    
    $FixProposal = & $BashExe $ProposeScript $BugDescriptionStr $SpecMapping $AffectedFiles $SessionHistory
    if ($LASTEXITCODE -ne 0) {
        Write-StatusError "Could not generate fix proposal"
        exit 1
    }
    
    Write-Host $FixProposal
}
catch {
    Write-StatusError "Fix proposal failed: $_"
    exit 1
}

# Step 7: Check auto-approval
Write-Host ""
if ($env:FIXIT_AUTO_APPROVE -ne "yes") {
    Write-StatusWarning "Auto-approval disabled. Set FIXIT_AUTO_APPROVE=yes to apply fixes automatically."
    Write-StatusInfo "Fix proposal ready but not applied (requires manual approval)"
    exit 0
}

# Step 8: Apply fix
Write-StatusSuccess "Fix auto-approved (FIXIT_AUTO_APPROVE=yes)"
Write-StatusInfo "Applying fix..."

try {
    $FixType = if ([string]::IsNullOrWhiteSpace($env:FIXIT_FIX_TYPE)) { "conservative" } else { $env:FIXIT_FIX_TYPE }
    $ApplyScript = Join-Path $BashDir "apply-fix.sh"

    $ApplyOutput = & $BashExe $ApplyScript $FixType $AffectedFiles $FixProposal
    if ($LASTEXITCODE -ne 0) {
        Write-StatusError "Fix application failed"
        exit 1
    }

    if (-not [string]::IsNullOrWhiteSpace($ApplyOutput)) {
        Write-Host $ApplyOutput
    }
}
catch {
    Write-StatusError "Fix application failed: $_"
    exit 1
}

Write-Host ""
Write-StatusInfo "Changes made:"
if (Get-Command git -ErrorAction SilentlyContinue) {
    git diff --stat 2>$null
}
else {
    Write-Host "No git repository detected"
}

Write-Host ""
Write-StatusSuccess "Fixit workflow completed"
