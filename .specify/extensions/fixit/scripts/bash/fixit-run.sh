#!/usr/bin/env bash
# Fixit extension: fixit-run.sh
# Main script for spec-aware bug fixing

set -e

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

BUG_DESCRIPTION="$*"

if [ -z "$BUG_DESCRIPTION" ]; then
    echo "Usage: fixit-run.sh <bug description>" >&2
    echo "Example: fixit-run.sh the registration form accepts empty email addresses" >&2
    exit 1
fi

# Step 1: Check prerequisites
print_status info "🔍 Checking prerequisites..."
FEATURE_DIR=$("$SCRIPT_DIR/check-prerequisites.sh") || exit 1
print_status success "Feature directory: $FEATURE_DIR"

# Step 2: Load context
print_status info "📚 Loading context..."
REPO_ROOT=$(get_repo_root)
CONTEXT_OUTPUT=$("$SCRIPT_DIR/load-context.sh" "$FEATURE_DIR" "$REPO_ROOT") || exit 1
echo "$CONTEXT_OUTPUT"

# Step 3: Map bug to spec
print_status info "📍 Mapping bug to spec..."
SPEC_MAPPING=$("$SCRIPT_DIR/map-bug-to-spec.sh" "$FEATURE_DIR" "$BUG_DESCRIPTION") || {
    print_status warning "Could not map bug to spec. Proceeding with generic fix..."
    SPEC_MAPPING="No specific spec mapping found"
}
echo "$SPEC_MAPPING"

# Step 4: Locate affected files
print_status info "🔎 Locating affected files..."
AFFECTED_FILES=$("$SCRIPT_DIR/locate-files.sh" "$FEATURE_DIR" "$BUG_DESCRIPTION") || {
    print_status error "Could not locate affected files"
    exit 1
}
echo "$AFFECTED_FILES"

# Step 5: Search historical sessions
print_status info "📖 Searching historical sessions..."
SESSION_HISTORY=$("$SCRIPT_DIR/search-sessions.sh" "$REPO_ROOT" "$BUG_DESCRIPTION" "$AFFECTED_FILES") || {
    print_status info "No related sessions found"
    SESSION_HISTORY=""
}
if [ -n "$SESSION_HISTORY" ]; then
    echo "$SESSION_HISTORY"
fi

# Step 6: Propose fix
print_status info "💡 Proposing fix..."
FIX_PROPOSAL=$("$SCRIPT_DIR/propose-fix.sh" "$BUG_DESCRIPTION" "$SPEC_MAPPING" "$AFFECTED_FILES" "$SESSION_HISTORY") || {
    print_status error "Could not generate fix proposal"
    exit 1
}
echo "$FIX_PROPOSAL"

# Step 7: Check auto-approval
echo ""
if [ "${FIXIT_AUTO_APPROVE:-no}" != "yes" ]; then
    print_status warning "Auto-approval disabled. Set FIXIT_AUTO_APPROVE=yes to apply fixes automatically."
    print_status info "Fix proposal ready but not applied (requires manual approval)"
    exit 0
fi

# Step 8: Apply fix
print_status success "✅ Fix auto-approved (FIXIT_AUTO_APPROVE=yes)"
print_status info "📝 Applying fix..."

# Determine fix type from config (default: conservative)
FIX_TYPE="${FIXIT_FIX_TYPE:-conservative}"

# Apply fixes
if "$SCRIPT_DIR/apply-fix.sh" "$FIX_TYPE" "$AFFECTED_FILES" "$FIX_PROPOSAL"; then
    print_status success "Fix applied successfully"
    
    # Show diff
    echo ""
    print_status info "Changes made:"
    git diff --stat 2>/dev/null || echo "No git repository detected"
    
    echo ""
    print_status success "Fixit workflow completed"
else
    print_status error "Fix application failed"
    exit 1
fi
