#!/usr/bin/env bash
# Fixit extension: search-sessions.sh
# Search historical sessions for similar bugs and corrections

set -e

REPO_ROOT="$1"
BUG_DESCRIPTION="$2"
AFFECTED_FILES="$3"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

# Extract keywords from bug description
KEYWORDS=$(echo "$BUG_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | grep -oE '\w+' | grep -vE '^(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must)$' | head -5)

RELATED_SESSIONS=""

# Search in active sessions
if [ -d "$REPO_ROOT/sessoes" ]; then
    while IFS= read -r keyword; do
        [ -z "$keyword" ] && continue
        MATCHES=$(grep -l -i "$keyword" "$REPO_ROOT/sessoes"/*.md 2>/dev/null || echo "")
        if [ -n "$MATCHES" ]; then
            RELATED_SESSIONS="$RELATED_SESSIONS\n$MATCHES"
        fi
    done <<< "$KEYWORDS"
fi

# Search in archived sessions
if [ -d "$REPO_ROOT/sessoes/encerradas" ]; then
    while IFS= read -r keyword; do
        [ -z "$keyword" ] && continue
        MATCHES=$(grep -l -i "$keyword" "$REPO_ROOT/sessoes/encerradas"/*.md 2>/dev/null || echo "")
        if [ -n "$MATCHES" ]; then
            RELATED_SESSIONS="$RELATED_SESSIONS\n$MATCHES"
        fi
    done <<< "$KEYWORDS"
fi

if [ -n "$RELATED_SESSIONS" ]; then
    UNIQUE_SESSIONS=$(echo -e "$RELATED_SESSIONS" | sort -u | head -3)
    echo "→ Related sessions found:"
    while IFS= read -r session; do
        [ -z "$session" ] && continue
        SESSION_NAME=$(basename "$session")
        echo "  - $SESSION_NAME"
    done <<< "$UNIQUE_SESSIONS"
else
    echo "→ No related sessions found"
fi
