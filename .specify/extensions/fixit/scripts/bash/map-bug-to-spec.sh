#!/usr/bin/env bash
# Fixit extension: map-bug-to-spec.sh
# Map bug description to spec artifacts (user stories, requirements, acceptance criteria)

set -e

FEATURE_DIR="$1"
BUG_DESCRIPTION="$2"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

# Find spec file
SPEC_FILE=""
if [ -f "$FEATURE_DIR/spec.md" ]; then
    SPEC_FILE="$FEATURE_DIR/spec.md"
elif [ -f "$FEATURE_DIR/specs.md" ]; then
    SPEC_FILE="$FEATURE_DIR/specs.md"
else
    echo "Error: No spec file found" >&2
    exit 1
fi

# Extract keywords from bug description
KEYWORDS=$(echo "$BUG_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | grep -oE '\w+' | grep -vE '^(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must)$' | head -5)

# Search for related sections in spec
echo "→ Searching spec for related sections..."
FOUND_SECTIONS=""

# Search for user stories
while IFS= read -r keyword; do
    if grep -qi "$keyword" "$SPEC_FILE"; then
        MATCHES=$(grep -n -i "$keyword" "$SPEC_FILE" | head -3)
        if [ -n "$MATCHES" ]; then
            FOUND_SECTIONS="$FOUND_SECTIONS\n$MATCHES"
        fi
    fi
done <<< "$KEYWORDS"

if [ -n "$FOUND_SECTIONS" ]; then
    echo "→ Related spec sections found:"
    echo -e "$FOUND_SECTIONS" | head -5
else
    echo "→ No direct spec mapping found"
    echo "→ Bug may be related to implementation details not covered in spec"
fi
