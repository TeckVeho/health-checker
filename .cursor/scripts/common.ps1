# Common functions for Cursor Dev Commands (PowerShell)
# Provides error handling, logging, and parameter validation

# Error handling
function Write-ErrorAndExit {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

# Logging functions
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Parameter validation
function Test-RequiredParameter {
    param([string]$Value, [string]$Name)
    if ([string]::IsNullOrEmpty($Value)) {
        Write-ErrorAndExit "Required parameter '$Name' is missing"
    }
}

function Test-NumberParameter {
    param([string]$Value, [string]$Name)
    if (![int]::TryParse($Value, [ref]$null)) {
        Write-ErrorAndExit "Parameter '$Name' must be a number: $Value"
    }
}

# External tool validation
function Test-CommandExists {
    param([string]$CommandName)
    if (!(Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Write-ErrorAndExit "Required command '$CommandName' is not installed or not in PATH"
    }
}

# GitHub CLI validation
function Test-GitHubCLI {
    Test-CommandExists "gh"
    try {
        gh auth status | Out-Null
    }
    catch {
        Write-ErrorAndExit "GitHub CLI is not authenticated. Please run 'gh auth login'"
    }
}

# Git validation
function Test-GitRepository {
    Test-CommandExists "git"
    try {
        git rev-parse --git-dir | Out-Null
    }
    catch {
        Write-ErrorAndExit "Not in a Git repository"
    }
}

# File operations
function New-DirectoryIfNotExists {
    param([string]$Path)
    if (!(Test-Path $Path -PathType Container)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-LogInfo "Created directory: $Path"
    }
}

# Script directory resolution
function Get-ScriptDirectory {
    $scriptPath = $MyInvocation.PSCommandPath
    return Split-Path $scriptPath -Parent
}

# Template directory resolution
function Get-TemplateDirectory {
    $scriptDir = Get-ScriptDirectory
    return Join-Path $scriptDir "..\templates"
}

# Utility functions
function Remove-Whitespace {
    param([string]$Text)
    return $Text.Trim()
}

# Branch name generation
function New-BranchName {
    param([string]$IssueNumber, [string]$BranchType)
    
    $prefix = switch ($BranchType) {
        "feature" { "feat" }
        "fix" { "fix" }
        "hotfix" { "hotfix" }
        default { "feat" }
    }
    
    return "${prefix}/issue-${IssueNumber}"
}

# Success message
function Show-Success {
    param([string]$Message)
    Write-LogSuccess $Message
    Write-Host ""
}
