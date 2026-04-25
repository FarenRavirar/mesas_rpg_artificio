---
description: "Surgically update spec, plan, and tasks to address the reported bug"
---

# Patch Spec Artifacts

Surgically update spec.md, plan.md, and tasks.md to address a reported bug — adds missing requirements, fixes conflicts, reopens false completions, and adds new tasks. Minimal changes only, never regenerates from scratch.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). The user may specify a bug report to patch (e.g., "BUG-001") or describe the fix directly.

## Prerequisites

1. Verify a spec-kit project exists by checking for `.specify/` directory
2. Verify `.specify/memory/errors.md` exists (mandatory error memory)
3. Locate the current feature's spec directory
4. Check for bug reports in `specs/{feature}/bugs/` — if a bug ID is provided, load that report
5. If no bug report exists, inform the user and suggest running `/speckit.bugfix.report` first

## Outline

1. **Mandatory error memory lookup (before patching)**:
   - Read `.specify/memory/errors.md`
   - Check bug report for referenced error IDs (E###) and symptom overlap
   - Determine if this patch addresses a **known cataloged error** or a **new validated error**

2. **Load bug context**: Read the relevant bug report and all spec artifacts:
   - **Bug report**: `specs/{feature}/bugs/BUG-{NNN}.md` (if specified)
   - **Required**: `spec.md`, and at least one of `plan.md` or `tasks.md`
   - **Optional**: `research.md`, `data-model.md`

3. **Determine patches**: Based on the bug type, plan minimal changes:

   | Bug Type | spec.md Patch | plan.md Patch | tasks.md Patch |
   |----------|--------------|---------------|----------------|
   | Spec gap | Add missing requirement to affected user story | Add implementation note to relevant section | Add new task(s) for the missing requirement |
   | Spec conflict | Resolve conflict with strikethrough on superseded text + new clarified requirement | Update affected section | Update affected task descriptions |
   | Implementation drift | Add clarification note to requirement | No change (plan was correct) | Reopen drifted task with correction note |
   | Untested flow | Add success criterion for the edge case | Add edge case to complexity tracking | Add verification task |
   | Dependency issue | Update assumption about external dependency | Update technical context | Add dependency investigation task |

4. **Patch spec.md**:
   - Add missing requirements under the affected user story
   - Mark conflicting text with `~~strikethrough~~` and reason
   - Add success criteria for untested flows
   - Update assumptions if dependencies changed
   - Add a bugfix note:
     ```
     **Bugfix**: [DATE] — [BUG-NNN] [Brief description of what was patched]
     ```

5. **Patch plan.md** (if it exists):
   - Update affected sections with new context
   - Add complexity notes for newly discovered edge cases
   - Preserve all existing content — only add or annotate
   - Add a bugfix note:
     ```
     **Bugfix**: [DATE] — [BUG-NNN] Updated from bugfix patch
     ```

6. **Patch tasks.md** (if it exists):
   - **Add new tasks**: Assign next sequential IDs, proper dependencies, and story labels
   - **Reopen tasks**: Change `[x]` back to `[ ]` with a note: `(reopened — BUG-NNN)`
   - **Mark false completions**: Add `⚠️ Reopened` prefix to task description
   - **Update Wave DAG**: If present, regenerate to include new tasks
   - Add a bugfix note:
     ```
     **Bugfix**: [DATE] — [BUG-NNN] Updated from bugfix patch
     ```

7. **Update bug report**: Mark the bug report file as patched and record catalog status:
   ```
   **Status**: Patched
   **Patched**: [DATE]
   **Catalog Lookup**: [Known error match: E### | NEW_ERROR_PENDING_SYNC]
   ```

8. **Enforce bidirectional sync for new validated errors**:
   - If lookup result is `NEW_ERROR_PENDING_SYNC`, require updates in:
     - `.specify/memory/errors.md`
     - `ERRORS_SOLUTIONS.md`
   - If synchronization is not done, report patch as incomplete

9. **Report**: Output a summary:
   - What changed in each artifact
   - How many requirements were added or updated
   - How many tasks were added or reopened
   - Catalog result (known vs new)
   - Suggest next step: `/speckit.bugfix.verify` to confirm consistency, then `/speckit.implement` to apply the code fix

## Rules

- **Mandatory lookup first** — always consult `.specify/memory/errors.md` before any patching decision
- **Known errors must reuse validated solutions** — anchor patch rationale to matched E### entries
- **Bidirectional sync for new validated errors is mandatory** — update both `.specify/memory/errors.md` and `ERRORS_SOLUTIONS.md`
- **Surgical updates only** — never regenerate artifacts from scratch, only modify affected sections
- **Never delete content** — use strikethrough for superseded text, preserve history
- **Preserve formatting** — match existing artifact style exactly
- **Track changes** — always add bugfix notes with dates and bug IDs
- **Reopen, don't delete tasks** — falsely completed tasks get reopened, not removed
- **Require bug report** — if no bug report or user description is provided, refuse to patch and suggest `/speckit.bugfix.report` first
- **Minimal changes** — change only what is necessary to address the specific bug
