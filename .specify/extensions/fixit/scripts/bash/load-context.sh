#!/usr/bin/env bash
# Fixit extension: load-context.sh
# Load context from spec, plan, tasks, constitution, failures registry, sessions

set -e

FEATURE_DIR="$1"
REPO_ROOT="$2"

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/fixit-common.sh"

CONTEXT_LOADED=0

# 1. Load spec.md (required)
if [ -f "$FEATURE_DIR/spec.md" ]; then
    print_status success "spec.md found"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
elif [ -f "$FEATURE_DIR/specs.md" ]; then
    print_status success "specs.md found"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
else
    print_status error "spec.md not found"
    exit 1
fi

# 2. Load tasks.md (required)
if [ -f "$FEATURE_DIR/tasks.md" ]; then
    COMPLETED_TASKS=$(grep -c '^\- \[x\]' "$FEATURE_DIR/tasks.md" || echo "0")
    TOTAL_TASKS=$(grep -c '^\- \[' "$FEATURE_DIR/tasks.md" || echo "0")
    print_status success "tasks.md found ($COMPLETED_TASKS/$TOTAL_TASKS completed)"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
else
    print_status error "tasks.md not found"
    exit 1
fi

# 3. Load plan.md (optional)
if [ -f "$FEATURE_DIR/plan.md" ]; then
    print_status success "plan.md found"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

# 4. Load constitution.md (optional)
if [ -f "$REPO_ROOT/.specify/memory/constitution.md" ]; then
    print_status success "constitution.md found"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

# 5. Load SESSION_FAILURES_REGISTRY.md (optional)
if [ -f "$REPO_ROOT/docs/sdd/SESSION_FAILURES_REGISTRY.md" ]; then
    print_status success "SESSION_FAILURES_REGISTRY.md found"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

# 6. Check for historical sessions (optional)
SESSIONS_FOUND=0
if [ -d "$REPO_ROOT/sessoes" ]; then
    # Count .md files (Windows-compatible)
    while IFS= read -r -d '' file; do
        SESSIONS_FOUND=$((SESSIONS_FOUND + 1))
    done < <(find "$REPO_ROOT/sessoes" -maxdepth 1 -name "*.md" -type f -print0 2>/dev/null)
fi
if [ -d "$REPO_ROOT/sessoes/encerradas" ]; then
    while IFS= read -r -d '' file; do
        SESSIONS_FOUND=$((SESSIONS_FOUND + 1))
    done < <(find "$REPO_ROOT/sessoes/encerradas" -maxdepth 1 -name "*.md" -type f -print0 2>/dev/null)
fi

if [ "$SESSIONS_FOUND" -gt 0 ]; then
    print_status success "Historical sessions: $SESSIONS_FOUND files available"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

# 7. Load AGENTS.md (optional)
if [ -f "$REPO_ROOT/AGENTS.md" ]; then
    print_status success "AGENTS.md found"
    # Extract key sections (roteamento, regras pétreas)
    AGENTS_SECTIONS=$(grep -n "^##" "$REPO_ROOT/AGENTS.md" 2>/dev/null | wc -l || echo "0")
    if [ "$AGENTS_SECTIONS" -gt 0 ]; then
        echo "  Key sections: $AGENTS_SECTIONS"
    fi
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

# 8. Load ARQUITETURA_PROJETO.md headers (optional)
if [ -f "$REPO_ROOT/ARQUITETURA_PROJETO.md" ]; then
    print_status success "ARQUITETURA_PROJETO.md found (headers only)"
    # Extract only section headers (file is large)
    ARCH_SECTIONS=$(grep -n "^##" "$REPO_ROOT/ARQUITETURA_PROJETO.md" 2>/dev/null | wc -l || echo "0")
    if [ "$ARCH_SECTIONS" -gt 0 ]; then
        echo "  Sections available: $ARCH_SECTIONS"
    fi
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
fi

echo ""
echo "Context loaded: $CONTEXT_LOADED sources"
