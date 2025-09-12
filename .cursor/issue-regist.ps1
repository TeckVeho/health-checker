# Issue Registration Script for Windows PowerShell
# Usage: .\issue-regist.ps1 "summary text"

param(
    [Parameter(Mandatory=$true)]
    [string]$Summary
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GeneratorScript = Join-Path $ScriptDir "issue-generator.js"
$RegistratorScript = Join-Path $ScriptDir "issue-regist.js"

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
} catch {
    Write-Error "Error: Node.js is required but not installed or not in PATH."
    exit 1
}

# Check if GitHub CLI is available
try {
    $ghVersion = gh --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI not found"
    }
} catch {
    Write-Error "Error: GitHub CLI is required but not installed or not in PATH."
    exit 1
}

Write-Host "Generating and registering issue for: `"$Summary`"" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

try {
    # Run the issue registrator
    node $RegistratorScript $Summary
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "Issue has been successfully created and registered to GitHub!" -ForegroundColor Green
} catch {
    Write-Error "Failed to register issue: $($_.Exception.Message)"
    exit 1
}
