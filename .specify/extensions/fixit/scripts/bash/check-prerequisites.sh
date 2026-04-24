#!/usr/bin/env bash
# Fixit extension: check-prerequisites.sh
# Validates prerequisites before running fixit

set -e

# Find project root
_find_project_root() {
    local dir="$PWD"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.specify" ] || [ -d "$dir/.git" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

REPO_ROOT=$(_find_project_root) || {
    echo "Error: Could not find project root (.specify or .git directory)" >&2
    exit 1
}

SPECS_DIR="$REPO_ROOT/specs"

# Find feature directory
FEATURE_DIR=""
if [ -d "$SPECS_DIR" ]; then
    # Try to find feature directory from current branch
    if command -v git >/dev/null 2>&1; then
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
        if [ -n "$CURRENT_BRANCH" ] && [ -d "$SPECS_DIR/$CURRENT_BRANCH" ]; then
            FEATURE_DIR="$SPECS_DIR/$CURRENT_BRANCH"
        fi
    fi
    
    # If not found, try to find most recent feature directory
    if [ -z "$FEATURE_DIR" ]; then
        FEATURE_DIR=$(find "$SPECS_DIR" -maxdepth 1 -type d -name "[0-9]*-*" | sort -r | head -1)
    fi
fi

if [ -z "$FEATURE_DIR" ] || [ ! -d "$FEATURE_DIR" ]; then
    echo "Error: Cannot locate feature directory" >&2
    echo "Expected: specs/<feature-name>/" >&2
    exit 1
fi

# Check spec.md exists
if [ ! -f "$FEATURE_DIR/spec.md" ] && [ ! -f "$FEATURE_DIR/specs.md" ]; then
    echo "Error: Missing spec.md in $FEATURE_DIR" >&2
    echo "Run /speckit.specify first" >&2
    exit 1
fi

# Check tasks.md exists
if [ ! -f "$FEATURE_DIR/tasks.md" ]; then
    echo "Error: Missing tasks.md in $FEATURE_DIR" >&2
    echo "Run /speckit.tasks first" >&2
    exit 1
fi

# Check at least one completed task
if ! grep -q '^\- \[x\]' "$FEATURE_DIR/tasks.md"; then
    echo "Error: No completed tasks in tasks.md" >&2
    echo "Run /speckit.implement first" >&2
    exit 1
fi

# Output feature directory path
echo "$FEATURE_DIR"
