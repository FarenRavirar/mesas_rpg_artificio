---
description: "Fix a bug with spec awareness"
---

# Fix Bug (Spec-Aware)

Fix a bug by mapping it to spec artifacts, proposing a plan, and applying minimal changes.

## User Input

```text
$ARGUMENTS
```

The user input is the bug description. Example: "the registration form accepts empty email addresses"

## Prerequisites

- Verify spec.md exists in feature directory
- Verify tasks.md exists in feature directory
- Verify at least one completed task ([x]) in tasks.md

Run: `.specify/extensions/fixit/scripts/bash/check-prerequisites.sh`

If prerequisites fail, stop and report error to user.

## Execution

Run the main fixit script:

**Bash**: `.specify/extensions/fixit/scripts/bash/fixit-run.sh "$ARGUMENTS"`
**PowerShell**: `.specify/extensions/fixit/scripts/powershell/fixit-run.ps1 "$ARGUMENTS"`

The script will:
1. Load context (spec, plan, tasks, constitution, failures registry, sessions)
2. Map bug to spec (user story, requirement, acceptance criterion)
3. Locate affected files (prioritize files in tasks.md)
4. Propose fix plan (root cause, changes, approach, warnings)
5. Check auto-approval flag (FIXIT_AUTO_APPROVE=yes to apply automatically)
6. Apply minimal fix (if auto-approved)
7. Output inline summary

**Note:** Set `FIXIT_AUTO_APPROVE=yes` environment variable to apply fixes automatically without manual approval.

## Output

The script outputs:
- Bug description
- Related spec section
- Files changed
- Explanation of fix
- Any escalation warnings or caveats
