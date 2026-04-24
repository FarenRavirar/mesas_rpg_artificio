# Workflow Inventory: ci.yml

**Workflow Name:** CI — Validação de PR  
**File Path:** `.github/workflows/ci.yml`  
**Operational Responsibility:** CI/CD — Validação de qualidade em PRs para `dev`

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `pull_request` | `dev` | (all) | — |

**Concurrency Policy:** None (implicit: multiple PRs can run in parallel)

---

## Jobs

### Job: `build-frontend`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22, npm cache via `frontend/package-lock.json`)
3. `npm ci` (frontend)
4. `npm run build` (frontend)

**Purpose:** Validate frontend build integrity before merge to `dev`

**Failure Impact:** Blocks PR merge (required check)

---

### Job: `build-backend`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22, npm cache via `backend/package-lock.json`)
3. `npm ci` (backend)
4. `npm run build` (backend)

**Purpose:** Validate backend build integrity before merge to `dev`

**Failure Impact:** Blocks PR merge (required check)

---

## Reusable Workflows Called

None

---

## Called By

N/A (triggered by GitHub events, not by other workflows)

---

## Secrets Used

None

---

## Environment Variables

None

---

## Critical Observations

- **No TypeScript validation:** Builds run but `tsc --noEmit` is absent (type errors may pass)
- **No linting:** No ESLint, Prettier, or shellcheck integration
- **No test execution:** No unit/integration tests run in CI
- **Parallel execution:** Both jobs run independently (no dependency chain)
- **No artifact caching:** Build outputs are discarded (not used downstream)

---

## Operational Notes

- Lightweight validation workflow
- Does not interact with remote infrastructure
- Fast feedback loop for contributors
- Missing: type checking, linting, testing (gaps for Phase 3 diagnosis)
