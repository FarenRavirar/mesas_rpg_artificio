# Spec-Kit Fixit Extension

Spec-aware bug fixing — maps bugs to spec artifacts, proposes a plan, applies minimal changes.

## Overview

This extension provides bug fixing operations as an optional, self-contained module. It manages:

- **Bug mapping** to spec artifacts (user stories, requirements, acceptance criteria)
- **Context loading** from spec.md, plan.md, tasks.md, constitution.md, failures registry, and historical sessions
- **File location** prioritizing files referenced in tasks.md
- **Fix proposal** with root cause, planned changes, approach, and escalation warnings
- **Minimal changes** respecting spec intent and existing patterns

## Commands

| Command | Description |
|---------|-------------|
| `speckit.fixit.run` | Fix a bug with spec awareness |

## Hooks

A extensão **não registra hooks de commit automático**.

Isso evita conflitos com a governança local de versionamento e com a regra de não executar/sugerir commit sem solicitação explícita do mantenedor.

## Configuration

Configuration is stored in `.specify/extensions/fixit/fixit-config.yml`:

```yaml
# Maximum files before scope warning
max_files_warning: 4

# Enable escalation warnings
escalation_warnings: true

# Read failures registry
read_failures_registry: true
failures_registry_path: "docs/sdd/SESSION_FAILURES_REGISTRY.md"

# Search historical sessions
read_sessions_history: true
sessions_active_path: "sessoes/"
sessions_archived_path: "sessoes/encerradas/"
```

## Installation

```bash
# Install the fixit extension
specify extension add fixit
```

## Usage

After completing `/speckit.implement`, test your feature manually. When you find a bug:

```bash
/speckit.fixit.run the registration form accepts empty email addresses
```

The command will:
1. Load context (spec, plan, tasks, constitution, failures registry, sessions)
2. Map bug to spec (user story, requirement, acceptance criterion)
3. Locate affected files (prioritize files in tasks.md)
4. Propose fix plan (root cause, changes, approach, warnings)
5. Check auto-approval flag (`FIXIT_AUTO_APPROVE=yes`)
6. Apply minimal fix (if auto-approved)
7. Output inline summary


## Escalation Warnings

### ⚠️ Scope Warning (4+ files)
Fixit warns when a fix touches 4 or more files. You can approve or reject.

### ⚠️ Spec Conflict
Fixit detects when a fix contradicts a spec requirement. You can override with caveat.

### 🛑 Constitution Violation (Hard Block)
Fixit blocks fixes that violate constitution MUST principles. You must find an alternative.

## Scripts

The extension bundles cross-platform scripts:

- `scripts/bash/fixit-run.sh` — Bash implementation
- `scripts/bash/fixit-common.sh` — Shared utilities (Bash)
- `scripts/powershell/fixit-run.ps1` — PowerShell implementation
- `scripts/powershell/fixit-common.ps1` — Shared utilities (PowerShell)
