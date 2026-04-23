# Workflow Inventory: promote-to-prod.yml

**Workflow Name:** Promote Beta to Production  
**File Path:** `.github/workflows/promote-to-prod.yml`  
**Operational Responsibility:** CD — Promoção canônica de beta para produção (PR-driven)

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `workflow_dispatch` | (any) | — | Manual trigger with version input |

**Inputs:**
- `version` (string, required): Release version (e.g., `v0.1.1`)

**Concurrency Policy:**
```yaml
group: production-deploy-lock
cancel-in-progress: false
```
- **Shared lock with:** `deploy-prod.yml` (race condition risk)

**Permissions:**
- `contents: write` (for release creation)

---

## Jobs

### Job: `typecheck`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4` (ref: `main`)
2. `actions/setup-node@v4` (Node 22, npm cache via `frontend/package-lock.json`)
3. `npm ci` (frontend)
4. `npx tsc --noEmit` (frontend TypeScript validation) — **CORRECAO WF-TS-01 (promote)**

**Purpose:** Validate TypeScript before promoting to production

**Failure Impact:** Blocks promotion (production unaffected)

---

### Job: `enforce-dir`

**Type:** Reusable workflow call  
**Calls:** `./.github/workflows/_enforce-migration-dir.yml`  
**Dependencies:** None

---

### Job: `lint`

**Type:** Reusable workflow call  
**Calls:** `./.github/workflows/_lint-shell.yml`  
**Dependencies:** None

---

### Job: `governance_gate`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[typecheck, enforce-dir, lint]`

**Steps:**
1. `actions/checkout@v4` (fetch-depth: 0)
2. Validate promotion governance:
   - Check `GITHUB_REF_NAME == main` (must run from `main` branch)
   - `git fetch origin main dev --prune`
   - Calculate `git rev-list --left-right --count origin/main...origin/dev`
   - If `dev` is ahead of `main`: **BLOCK** (PR dev→main required)
   - If `main` is ahead of `dev`: **WARN** (but allow promotion from `main`)

**Purpose:** Enforce PR-first governance (no direct promotion without merge)

**Failure Impact:** Blocks promotion if `dev` has unmerged commits

---

### Job: `deploy`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[governance_gate]`  
**Environment:** `production` (URL: `https://mesas.artificiorpg.com`)

**Steps:**
1. SSH to server (`appleboy/ssh-action@v1.0.0`):
   - `cd /opt/mesas`
   - `git fetch origin main --tags`
   - `git reset --hard origin/main`
   - Set rollback trap (`docker compose -f docker-compose.prod.yml up -d --force-recreate` on ERR) — **CORRECAO WF-ROLLBACK-01 (promote)**
   - `docker compose -f docker-compose.prod.yml down --remove-orphans` — **CORRECAO E144**
   - `docker compose -f docker-compose.prod.yml build --no-cache`
   - Clear trap
   - `docker compose -f docker-compose.prod.yml up -d mesas-db`
   - Wait for `pg_isready` (max 30 retries, 3s interval)
   - Run `bash ./scripts/deploy/apply_required_migrations.sh docker-compose.prod.yml mesas-db`
   - `docker compose -f docker-compose.prod.yml up -d --force-recreate`
   - Wait for `mesas-api` health=healthy (max 20 retries, 3s interval) — **CORRECAO WF-06**
   - Wait for `mesas-app` health=healthy (max 20 retries, 3s interval) — **CORRECAO E145**
   - Check critical routes (same as `deploy-prod.yml`)
   - If routes fail: restart `mesas-app` + re-check (auto-recovery E150)
   - If still failing: exit 1
   - `docker compose ps`
   - `docker image prune -f`

**Secrets Used:**
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY_PROD`

**Failure Impact:** Production deploy fails (rollback attempted)

---

### Job: `release`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[deploy]`  
**Condition:** `if: success()`

**Steps:**
1. `actions/checkout@v4` (fetch-depth: 0)
2. `git fetch --tags origin`
3. Sync with deployed code: `git checkout main`
4. Discover previous release tag via `gh release list`
5. Generate executive summary:
   - Commit count, features, fixes, refactors, chores
   - Impacted areas (frontend, backend, infra, DB, auth, docs)
   - Operational attention flags (DB changes, infra changes, auth changes)
   - Top 15 commits
6. Generate GitHub release notes via API (`repos/{repo}/releases/generate-notes`)
7. Consolidate executive + GitHub notes
8. Create or update release:
   - If tag exists: `gh release edit`
   - If new: `gh release create`
   - Title: `Production ${VERSION}`
   - Mark as `--latest`

**Secrets Used:**
- `GH_TOKEN` (implicit via `github.token`)

**Failure Impact:** Deploy succeeds but release not published (non-blocking)

---

## Reusable Workflows Called

- `_enforce-migration-dir.yml`
- `_lint-shell.yml`

---

## Called By

N/A (manual trigger only)

---

## Critical Observations

- **Canonical promotion path:** Enforces PR-first governance (dev→main merge required)
- **Governance gate:** Validates branch state before deploy (blocks if `dev` ahead of `main`)
- **Race condition:** Shares `production-deploy-lock` with `deploy-prod.yml` (both access `/opt/mesas`)
- **Duplicate logic:** Deploy steps identical to `deploy-prod.yml` (maintenance burden)
- **Release automation:** Generates rich release notes with operational context
- **TypeScript validation:** Runs before deploy (production protected from type errors)
- **Auto-recovery E150:** Same as `deploy-prod.yml` (masks root cause of route failures)

---

## Operational Notes

- **Canonical workflow:** Should be primary production deployment path
- **Version input:** Required for release tagging (semantic versioning expected)
- **Release notes:** Auto-generated with commit analysis and area detection
- **Governance enforcement:** Blocks promotion if PR not merged (prevents drift)
