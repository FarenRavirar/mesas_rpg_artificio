#!/usr/bin/env bash
# Fixit extension: propose-fix.sh
# Generate fix proposal with root cause, changes, approach, and warnings

set -e

BUG_DESCRIPTION="$1"
SPEC_MAPPING="$2"
AFFECTED_FILES="$3"
SESSION_HISTORY="$4"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Fix Proposal"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Bug Description:"
echo "  $BUG_DESCRIPTION"
echo ""
echo "Root Cause:"
echo "  [Analysis required - this is a proof-of-concept]"
echo "  Based on the bug description and context, manual investigation"
echo "  is needed to determine the exact root cause."
echo ""
echo "Planned Changes:"
echo "  [To be determined after root cause analysis]"
echo ""
echo "Approach:"
echo "  1. Investigate affected files"
echo "  2. Identify root cause"
echo "  3. Apply minimal fix"
echo "  4. Test manually"
echo "  5. Register validation evidence"
echo ""

# Count affected files for escalation warning
FILE_COUNT=$(echo "$AFFECTED_FILES" | grep -c '^→' || echo "0")

if [ "$FILE_COUNT" -ge 4 ]; then
    echo "⚠️  Escalation Warning: Scope"
    echo "  This fix may affect $FILE_COUNT or more files."
    echo "  Consider breaking into smaller fixes."
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
