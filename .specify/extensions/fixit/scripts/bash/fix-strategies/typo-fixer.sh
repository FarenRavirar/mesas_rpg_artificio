#!/usr/bin/env bash
# Fixit extension: typo-fixer.sh
# Fix common typos in strings and comments

set -e

AFFECTED_FILES="$1"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$(dirname "$SCRIPT_DIR")/fixit-common.sh"

print_status info "Strategy: Typo Fixer"

# Common typos map (typo -> correct)
declare -A TYPOS=(
    ["teh"]="the"
    ["recieve"]="receive"
    ["occured"]="occurred"
    ["seperate"]="separate"
    ["definately"]="definitely"
    ["accomodate"]="accommodate"
    ["publically"]="publicly"
    ["Pubilcar"]="Publicar"
    ["botão"]="botão"
)

FIXES_MADE=0

while IFS= read -r file; do
    [ -z "$file" ] && continue
    [ ! -f "$file" ] && continue
    
    # Only process text files
    if ! file "$file" | grep -qE 'text|script'; then
        continue
    fi
    
    # Apply typo fixes
    for typo in "${!TYPOS[@]}"; do
        correct="${TYPOS[$typo]}"
        
        # Fix in strings and comments only (safe)
        if grep -q "$typo" "$file" 2>/dev/null; then
            # Use sed with temp file (Windows-compatible)
            TEMP_FILE="${file}.fixit.tmp"
            if sed "s/\\<$typo\\>/$correct/g" "$file" > "$TEMP_FILE" 2>/dev/null; then
                # Check if file changed
                if ! diff -q "$file" "$TEMP_FILE" >/dev/null 2>&1; then
                    mv "$TEMP_FILE" "$file"
                    print_status success "Fixed typo '$typo' -> '$correct' in $file"
                    FIXES_MADE=$((FIXES_MADE + 1))
                else
                    rm -f "$TEMP_FILE"
                fi
            else
                rm -f "$TEMP_FILE"
            fi
        fi
    done
done <<< "$AFFECTED_FILES"

if [ $FIXES_MADE -eq 0 ]; then
    print_status info "No typos found"
else
    print_status success "Fixed $FIXES_MADE typos"
fi
