#!/usr/bin/env bash
# Fixit extension: locate-files.sh
# Locate files affected by the bug (prioritize files in tasks.md)

set -e

FEATURE_DIR="$1"
BUG_DESCRIPTION="$2"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

# Extract file references from tasks.md
TASKS_FILE="$FEATURE_DIR/tasks.md"
REFERENCED_FILES=$(grep -oE '`[^`]+\.(ts|tsx|js|jsx|py|sh|yml|yaml|json|md)`' "$TASKS_FILE" 2>/dev/null | sed 's/`//g' | sort -u || echo "")

# Extract keywords from bug description
KEYWORDS=$(echo "$BUG_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | grep -oE '\w+' | grep -vE '^(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must)$')

# Find files mentioned in tasks that match keywords
CANDIDATE_FILES=""
while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r keyword; do
        [ -z "$keyword" ] && continue
        if echo "$file" | grep -qi "$keyword"; then
            CANDIDATE_FILES="$CANDIDATE_FILES\n$file"
            break
        fi
    done <<< "$KEYWORDS"
done <<< "$REFERENCED_FILES"

if [ -n "$CANDIDATE_FILES" ]; then
    echo "→ Candidate files from tasks.md:"
    echo -e "$CANDIDATE_FILES" | sort -u | head -5
else
    echo "→ No specific files identified from tasks.md"
    echo "→ Manual investigation required"
fi
