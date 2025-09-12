# Issue Creation Helper Script for Windows PowerShell
# Usage: .\issue-create.ps1 "summary text"

param(
    [Parameter(Mandatory=$true)]
    [string]$Summary
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GeneratorScript = Join-Path $ScriptDir "issue-generator.js"

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

# Run the issue generator
Write-Host "Generating issue proposal for: `"$Summary`"" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

node $GeneratorScript $Summary

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Copy the generated content above to create your GitHub issue." -ForegroundColor Cyan
