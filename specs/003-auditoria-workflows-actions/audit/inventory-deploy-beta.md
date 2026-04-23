# Workflow Inventory: deploy-beta.yml

**Workflow Name:** Deploy Beta  
**File Path:** `.github/workflows/deploy-beta.yml`  
**Operational Responsibility:** CD — Deploy automático para ambiente Beta

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `push` | `dev` | (all) | — |

**Concurrency Policy:**
```yaml
group: deploy-beta-${{ github.ref }}
cancel-in-progress: false
```
- **Risk:** Commits enfileirados executam sequencialmente (backlog de deploys obsoletos)

---

## Jobs

### Job: `enforce-dir`

**Type:** Reusable workflow call  
**Calls:** `./.github/workflows/_enforce-migration-dir.yml`  
**Dependencies:** None

**Purpose:** Validate migration file canonicity (block rogue migrations)

---

### Job: `lint`

**Type:** Reusable workflow call  
**Calls:** `./.github/workflows/_lint-shell.yml`  
**Dependencies:** None

**Purpose:** Shellcheck + actionlint validation

---

### Job: `validate`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. `bash testes/deploy/header_contract.sh`

**Purpose:** Validate migration header contract compliance

---

### Job: `migrate`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[enforce-dir, lint, validate]`

**Steps:**
1. `actions/checkout@v4`
2. SSH to server (`appleboy/ssh-action@v1.0.0`)
   - Acquire flock on `/tmp/mesas-beta-deploy.lock` (120s timeout)
   - Sync code via `git fetch` + `git reset --hard FETCH_HEAD`
   - Start DB container (`docker compose -f docker-compose.beta.yml up -d mesas-beta-db`)
   - Wait for `pg_isready` (max 30 retries, 3s interval)
   - Run `bash ./scripts/deploy/apply_required_migrations.sh docker-compose.beta.yml mesas-beta-db`

**Secrets Used:**
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`
- `GH_TOKEN` (for git fetch via HTTPS)

**Failure Impact:** Blocks deploy (migration gate)

---

### Job: `deploy-app`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[migrate]`

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22, npm cache via `frontend/package-lock.json`)
3. `npm ci` (frontend)
4. `npx tsc --noEmit` (frontend TypeScript validation) — **CORRECAO WF-TS-01**
5. SSH to server:
   - Acquire flock on `/tmp/mesas-beta-deploy.lock` (120s timeout)
   - `cd /opt/mesas-beta`
   - Set rollback trap (`docker compose up -d --force-recreate` on ERR)
   - `docker compose -f docker-compose.beta.yml down --remove-orphans`
   - `docker compose -f docker-compose.beta.yml build --no-cache`
   - Clear trap
   - `docker compose -f docker-compose.beta.yml up -d --force-recreate`

**Secrets Used:** Same as `migrate`

**Failure Impact:** Triggers rollback (best-effort container restart)

---

### Job: `smoke`

**Runs On:** `ubuntu-latest`  
**Dependencies:** `[deploy-app]`

**Steps:**
1. SSH to server:
   - Wait for `mesas-beta-api` health=healthy (max 20 retries, 3s interval) — **E147**
   - Wait for `mesas-beta-frontend` health=healthy (max 20 retries, 3s interval) — **E145**
   - Check `https://mesasbeta.artificiorpg.com` returns HTTP 200
   - Check critical routes:
     - `/api/v1/tables?limit=1` → HTTP 200
     - `/api/v1/systems?view=tree` → HTTP 200
     - `/auth/google?frontend_redirect=...` → HTTP 302
   - `docker compose ps`
   - `docker image prune -f`
   - `docker builder prune -f --filter "until=168h"`

**Failure Impact:** Deploy marked as failed (but containers remain up)

---

## Reusable Workflows Called

- `_enforce-migration-dir.yml`
- `_lint-shell.yml`

---

## Called By

N/A (triggered by push to `dev`)

---

## Critical Observations

- **Concurrency risk:** `cancel-in-progress: false` causes backlog of obsolete deploys
- **TypeScript validation:** Added in `deploy-app` (WF-TS-01) but runs AFTER migration (risk: type error discovered post-migration)
- **Rollback strategy:** Best-effort via trap (no state verification, no migration rollback)
- **Lock mechanism:** flock prevents race conditions but 120s timeout may be insufficient for slow builds
- **Silent failure risk:** Smoke tests fail but containers remain up (inconsistent state)
- **Health check dependency:** Relies on Docker healthcheck (if misconfigured, false positive)

---

## Operational Notes

- Primary deployment pipeline for beta environment
- Executes on every push to `dev` (high frequency)
- Migration gate enforced before app deployment
- No manual approval required (fully automated)
