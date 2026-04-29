---
description: "Run a full project health diagnostic — checks structure, agents, features, scripts, extensions, and git status."
scripts:
  sh: scripts/bash/doctor.sh
  ps: scripts/powershell/doctor.ps1
---

# Project Health Check

Run a diagnostic scan of the current Spec Kit project to identify setup issues, missing artifacts, and configuration problems.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Run diagnostic script**: Execute `{SCRIPT}` from the project root and review the output.

2. **Analyze results**: The script checks 6 areas:
   - **Project structure** — `.specify/`, `.specify/features/`, `.specify/memory/`, `.specify/templates/`, `.specify/memory/constitution.md`, `scripts/`
   - **AI agent configuration** — detects known agent folders and warns when command/workflow directories are empty
   - **Feature specifications** — lists features in `.specify/features/`, checks for `spec.md`/`plan.md`/`tasks.md`
   - **Scripts health** — verifies required scripts in `scripts/bash/` and `scripts/powershell/`
   - **Extensions health** — validates `.specify/extensions.yml` and `.specify/extensions/registry.json`
   - **Git status** — checks if inside a git repo, shows current branch

3. **Report findings**: Present the diagnostic results to the user:
   - **Errors** — things that are broken and need fixing
   - **Warnings** — things that could cause problems
   - **Notes** — informational items about the project state

4. **Suggest fixes**: For each error or warning found, suggest the specific command or action needed to resolve it. Common fixes include:
   - Missing `.specify` directories → `specify init --here`
   - Missing constitution → copy from `.specify/templates/constitution-template.md` to `.specify/memory/constitution.md`
   - Missing feature artifacts → run `/speckit.plan` or `/speckit.tasks`
   - Missing required scripts → restore files in `scripts/bash/` or `scripts/powershell/`
   - Empty agent commands/workflows → initialize the corresponding agent configuration
