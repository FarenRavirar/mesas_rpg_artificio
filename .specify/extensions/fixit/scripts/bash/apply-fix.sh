#!/usr/bin/env bash
# Fixit extension: apply-fix.sh
# Apply fixes automatically to affected files

set -e

FIX_TYPE="$1"        # conservative, moderate, aggressive
AFFECTED_FILES="$2"  # Newline-separated list of files
FIX_PLAN="$3"        # Fix plan description

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

if [ -z "$FIX_TYPE" ] || [ -z "$AFFECTED_FILES" ]; then
    echo "Usage: apply-fix.sh <fix_type> <affected_files> <fix_plan>" >&2
    echo "Fix types: conservative, moderate, aggressive" >&2
    exit 1
fi

# Validate fix type
case "$FIX_TYPE" in
    conservative|moderate|aggressive)
        ;;
    *)
        echo "Error: Invalid fix type: $FIX_TYPE" >&2
        echo "Valid types: conservative, moderate, aggressive" >&2
        exit 1
        ;;
esac

print_status info "Applying $FIX_TYPE fixes..."

# Create backup before applying
BACKUP_DIR=".fixit-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"

print_status info "Creating backup in $BACKUP_DIR..."

# Backup affected files
while IFS= read -r file; do
    [ -z "$file" ] && continue
    [ ! -f "$file" ] && continue
    
    # Create directory structure in backup
    FILE_DIR=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$FILE_DIR"
    
    # Copy file to backup
    cp "$file" "$BACKUP_DIR/$file"
    print_status success "Backed up: $file"
done <<< "$AFFECTED_FILES"

# Apply fixes based on type
FIXES_APPLIED=0
FIXES_FAILED=0

# Helper function to apply a strategy
apply_strategy() {
    local strategy="$1"
    local files="$2"
    
    if [ -f "$SCRIPT_DIR/fix-strategies/$strategy.sh" ]; then
        if "$SCRIPT_DIR/fix-strategies/$strategy.sh" "$files"; then
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            return 0
        else
            FIXES_FAILED=$((FIXES_FAILED + 1))
            return 1
        fi
    fi
    return 0
}

case "$FIX_TYPE" in
    conservative)
        print_status info "Applying conservative fixes (typos, imports, formatting)..."
        apply_strategy "typo-fixer" "$AFFECTED_FILES"
        apply_strategy "import-fixer" "$AFFECTED_FILES"
        apply_strategy "format-fixer" "$AFFECTED_FILES"
        ;;
        
    moderate)
        print_status info "Applying moderate fixes (logic, validations)..."
        apply_strategy "typo-fixer" "$AFFECTED_FILES"
        apply_strategy "import-fixer" "$AFFECTED_FILES"
        apply_strategy "format-fixer" "$AFFECTED_FILES"
        apply_strategy "validation-fixer" "$AFFECTED_FILES"
        apply_strategy "conditional-fixer" "$AFFECTED_FILES"
        ;;
        
    aggressive)
        print_status warning "Applying aggressive fixes (refactoring)..."
        apply_strategy "typo-fixer" "$AFFECTED_FILES"
        apply_strategy "import-fixer" "$AFFECTED_FILES"
        apply_strategy "format-fixer" "$AFFECTED_FILES"
        apply_strategy "validation-fixer" "$AFFECTED_FILES"
        apply_strategy "conditional-fixer" "$AFFECTED_FILES"
        apply_strategy "refactor-fixer" "$AFFECTED_FILES"
        ;;
esac

# Check if any fixes were applied
if [ $FIXES_APPLIED -eq 0 ] && [ $FIXES_FAILED -eq 0 ]; then
    print_status warning "No fix strategies available yet (proof-of-concept)"
    print_status info "Backup preserved at: $BACKUP_DIR"
    exit 0
fi

# Report results
echo ""
print_status success "Fixes applied: $FIXES_APPLIED"
if [ $FIXES_FAILED -gt 0 ]; then
    print_status warning "Fixes failed: $FIXES_FAILED"
fi

# Remove backup if all successful
if [ $FIXES_FAILED -eq 0 ]; then
    print_status info "Removing backup (all fixes successful)..."
    rm -rf "$BACKUP_DIR"
else
    print_status warning "Backup preserved at: $BACKUP_DIR"
    print_status info "To rollback: cp -r $BACKUP_DIR/* ."
fi

echo ""
print_status success "Fix application completed"
