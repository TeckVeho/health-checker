#!/bin/bash

# Issue Creation Helper Script
# Usage: ./issue-create.sh "summary text"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"summary text\""
    echo "Example: $0 \"Add user authentication to the login flow\""
    exit 1
fi

SUMMARY="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_SCRIPT="$SCRIPT_DIR/issue-generator.js"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Run the issue generator
echo "Generating issue proposal for: \"$SUMMARY\""
echo "=========================================="
echo ""

node "$GENERATOR_SCRIPT" "$SUMMARY"

echo ""
echo "=========================================="
echo "Copy the generated content above to create your GitHub issue."
