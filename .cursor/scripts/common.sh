#!/bin/bash

# Common functions for Cursor Dev Commands (Bash)
# Provides error handling, logging, and parameter validation

# Error handling
error_exit() {
    echo "Error: $1" >&2
    exit 1
}

# Logging functions
log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1" >&2
}

log_success() {
    echo "[SUCCESS] $1"
}

# Parameter validation
validate_required_param() {
    if [ -z "$1" ]; then
        error_exit "Required parameter is missing"
    fi
}

validate_number() {
    if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        error_exit "Parameter must be a number: $1"
    fi
}

# External tool validation
check_command_exists() {
    if ! command -v "$1" &> /dev/null; then
        error_exit "Required command '$1' is not installed or not in PATH"
    fi
}

# GitHub CLI validation
check_gh_cli() {
    check_command_exists "gh"
    if ! gh auth status &> /dev/null; then
        error_exit "GitHub CLI is not authenticated. Please run 'gh auth login'"
    fi
}

# Git validation
check_git() {
    check_command_exists "git"
    if ! git rev-parse --git-dir &> /dev/null; then
        error_exit "Not in a Git repository"
    fi
}

# File operations
create_directory_if_not_exists() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_info "Created directory: $1"
    fi
}

# Script directory resolution
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

# Template directory resolution
get_template_dir() {
    local script_dir=$(get_script_dir)
    echo "$script_dir/../templates"
}

# Utility functions
trim() {
    echo "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Branch name generation
generate_branch_name() {
    local issue_number="$1"
    local branch_type="$2"
    local prefix=""
    
    case "$branch_type" in
        "feature") prefix="feat" ;;
        "fix") prefix="fix" ;;
        "hotfix") prefix="hotfix" ;;
        *) prefix="feat" ;;
    esac
    
    echo "${prefix}/issue-${issue_number}"
}

# Success message
show_success() {
    log_success "$1"
    echo ""
}
