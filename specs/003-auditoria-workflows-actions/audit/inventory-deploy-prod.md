# Workflow Inventory: deploy-prod.yml

**Workflow Name:** Deploy Production  
**File Path:** `.github/workflows/deploy-prod.yml`  
**Operational Responsibility:** CD — Deploy manual break-glass para produção

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `workflow_dispatch` | (any) | — | Manual trigger only |

**Concurrency Policy:**
```yaml
group: production-deploy-lock
cancel-in-progress: false
```
- **Shared lock with:** `promote-to-prod.yml` (race condition risk)

---

## Jobs

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

### Job: `deploy-production`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[enforce-dir, lint]`  
**Environment:** `production` (URL: `https://mesas.artificiorpg.com`)

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22, npm cache via `frontend/package-lock.json`)
3. `npm ci` (frontend)
4. `npx tsc --noEmit` (frontend TypeScript validation) — **CORRECAO WF-TS-01 (prod)**
5. SSH to server (`appleboy/ssh-action@v1.0.0`):
   - `cd /opt/mesas`
   - Validate `.env` exists
   - Validate required keys: `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`
   - `git fetch origin main`
   - `git reset --hard origin/main`
   - Set rollback trap (`docker compose -f docker-compose.prod.yml up -d --force-recreate` on ERR) — **CORRECAO WF-ROLLBACK-01 (prod)**
   - `docker compose -f docker-compose.prod.yml down --remove-orphans` — **CORRECAO E144**
   - `docker compose -f docker-compose.prod.yml build --no-cache`
   - Clear trap
   - `docker compose -f docker-compose.prod.yml up -d mesas-db`
   - Wait for `pg_isready` (max 30 retries, 3s interval)
   - Run `bash ./scripts/deploy/apply_required_migrations.sh docker-compose.prod.yml mesas-db`
   - `docker compose -f docker-compose.prod.yml up -d --force-recreate`
   - Wait for `mesas-api` health=healthy (max 20 retries, 3s interval) — **CORRECAO WF-06**
   - Wait for `mesas-app` health=healthy (max 20 retries, 3s interval) — **CORRECAO E145**
   - Check critical routes:
     - `/api/v1/tables?limit=1` → HTTP 200
     - `/api/v1/systems?view=tree` → HTTP 200
     - `/auth/google?frontend_redirect=...` → HTTP 302 + Location header validation
   - If routes fail: restart `mesas-app` + re-check (auto-recovery E150)
   - If still failing: exit 1
   - `docker compose ps`
   - `docker image prune -f`
   - `docker builder prune -f --filter "until=168h"`

**Secrets Used:**
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY_PROD`

**Failure Impact:** Production deploy fails (rollback attempted)

---

## Reusable Workflows Called

- `_enforce-migration-dir.yml`
- `_lint-shell.yml`

---

## Called By

N/A (manual trigger only)

---

## Critical Observations

- **Break-glass workflow:** Intended for emergency use (bypasses PR flow)
- **No governance gate:** Does not validate branch state or PR approval
- **Race condition:** Shares `production-deploy-lock` with `promote-to-prod.yml` (both can access `/opt/mesas` simultaneously)
- **TypeScript validation:** Runs in GitHub runner (not on server) — if fails, production untouched
- **Rollback strategy:** Best-effort via trap (no migration rollback, no state verification)
- **Auto-recovery E150:** Restarts frontend if critical routes fail (masks root cause)
- **Container name collision risk (E144):** Fixed via explicit compose file (no longer uses `docker rm $(docker ps -aq --filter name=mesas-)`)

---

## Operational Notes

- **Usage policy:** Should be documented as "break-glass only" (not canonical deploy path)
- **Canonical path:** `promote-to-prod.yml` (PR-driven, governance-enforced)
- **Redundancy:** Overlaps significantly with `promote-to-prod.yml` (duplicate logic)
- **Risk:** Manual trigger from any branch (no branch validation)
