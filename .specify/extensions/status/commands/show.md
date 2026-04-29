---
description: "Show project status and SDD workflow progress — active feature, artifacts, task completion, phase, and extensions."
scripts:
  sh: scripts/bash/status.sh
  ps: scripts/powershell/status.ps1
---

# Project Status

Show a unified overview of the current Spec Kit project state and SDD workflow progress.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Read base state**: Load `.specify/memory/project-state.md` if it exists. This provides the canonical baseline for project state.

2. **Run status script**: Execute `{SCRIPT}` from the project root and parse the JSON output.

3. **Present project information**:
   - **Project name** — current directory name
   - **AI agent(s)** — which agent folders are detected, whether commands are present
   - **Script type** — bash, PowerShell, or both
   - **Git branch** — current branch name (or SPECIFY_FEATURE env var fallback)
   - **Feature directory** — resolved specs/NNN-name/ path
   - **Last commit** — `git log -1 --oneline` output

4. **Show environment status** (from project-state.md):
   - Beta: URL + branch + status
   - Produção: URL + branch + status

5. **Show migrations status** (from project-state.md + real-time check):
   - Total migrations in disk: count `database/migration_*.sql`
   - Drift status: compare with project-state.md baseline
   - Special migrations: list any with `manual-risk` or special notes

6. **Show SDD artifact status** for the current feature:
   - Check existence of: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`
   - Check `contracts/` directory (show file count if present)
   - Check `checklists/` directory (show count and pass/fail status)
   - Mark each with ✓ (exists) or ✗ (missing)

7. **Parse task progress** for ALL features in `.specify/features/`:
   - For each feature directory, read `tasks.md` if it exists
   - Count lines matching `- [X]` or `- [x]` as completed
   - Count lines matching `- [ ]` as incomplete
   - Show summary table with feature name, completion %, and status

8. **Detect workflow phase** based on which artifacts exist:
   - No spec.md → **Not Started** (run /speckit.specify)
   - spec.md only → **Plan** (ready for /speckit.clarify or /speckit.plan)
   - plan.md exists → **Tasks** (ready for /speckit.tasks)
   - tasks.md exists, not all done → **Implement** (ready for /speckit.implement)
   - All tasks [X] → **Complete**

9. **Show extensions summary**:
   - Count installed extensions from `.specify/extensions/` registry
   - Note: available catalog count is not shown (run `specify extension search` for that)

10. **Show active blockers** (from project-state.md):
    - List any technical or administrative blockers
    - Show "Nenhum" if no blockers

11. **Show next action** (from project-state.md):
    - Display the recommended next action
    - Highlight feature with highest GUT pending

12. **Update project-state.md**:
    - Update timestamp to current time
    - Update "Branch ativa" and "Último commit"
    - Update "Features Ativas" table with real-time task completion data
    - Update "Migrations" section with current count
    - Preserve all other sections unchanged
    - Write updated content back to `.specify/memory/project-state.md`

13. **Handle edge cases**:
    - On main/master branch with no feature → show project info + hint to switch branches
    - No git available → use SPECIFY_FEATURE env var or scan specs/ for latest feature
    - No features exist → show "No features created yet"
    - No .specify/ directory → script exits with error
    - No project-state.md → show warning and continue with script data only
