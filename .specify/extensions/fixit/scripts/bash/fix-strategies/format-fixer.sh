#!/usr/bin/env bash
# Fixit extension: format-fixer.sh
# Apply code formatting using Prettier

set -e

AFFECTED_FILES="$1"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$(dirname "$SCRIPT_DIR")/fixit-common.sh"

print_status info "Strategy: Format Fixer"

# Check if Prettier is available
if ! command -v prettier >/dev/null 2>&1; then
    print_status info "Prettier not installed, skipping formatting (install with: npm install -g prettier)"
    exit 0
fi

print_status info "Using Prettier for formatting"

FIXES_MADE=0

while IFS= read -r file; do
    [ -z "$file" ] && continue
    [ ! -f "$file" ] && continue
    
    # Only format supported file types
    case "$file" in
        *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.yml|*.yaml)
            print_status info "Formatting: $file"
            
            if prettier --write "$file" >/dev/null 2>&1; then
                print_status success "Formatted: $file"
                FIXES_MADE=$((FIXES_MADE + 1))
            else
                print_status warning "Failed to format: $file"
            fi
            ;;
    esac
done <<< "$AFFECTED_FILES"

if [ $FIXES_MADE -eq 0 ]; then
    print_status info "No files formatted"
else
    print_status success "Formatted $FIXES_MADE files"
fi
