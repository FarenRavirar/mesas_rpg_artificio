# Workflow Inventory: preflight-prod.yml

**Workflow Name:** Preflight Prod Gate  
**File Path:** `.github/workflows/preflight-prod.yml`  
**Operational Responsibility:** CI/CD — Gate de validação pré-produção em PRs para `main`

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `pull_request` | `main` | `database/**`, `scripts/deploy/**` | Path filter active |

**Purpose:** Block PRs to `main` if migration drift detected between beta and production

---

## Jobs

### Job: `preflight`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. Setup SSH directory (`mkdir -p ~/.ssh && chmod 700 ~/.ssh`)
3. Create SSH config file:
   ```
   Host faren
     HostName ${{ secrets.SERVER_HOST }}
     User ${{ secrets.SERVER_USER }}
     IdentityFile ~/.ssh/id_rsa
     StrictHostKeyChecking no
   ```
4. Configure SSH key (`echo "${{ secrets.SSH_PRIVATE_KEY_PROD }}" > ~/.ssh/id_rsa`)
5. Adjust script path: `sed -i 's|C:\\\\projetos\\\\config|~/.ssh/config|g' scripts/deploy/preflight_prod.sh`
6. Run preflight check: `bash scripts/deploy/preflight_prod.sh`
   - Environment variables:
     - `DB_CONTAINER_PROD=mesas-db`
     - `DB_CONTAINER_BETA=mesas-beta-db`
     - `DB_USER=admin`
     - `DB_NAME=mesas_rpg`
7. Read report from `/tmp/preflight_report.md`
8. Find existing comment on PR (via `peter-evans/find-comment@v3`)
9. Create or update comment with report (via `peter-evans/create-or-update-comment@v4`)

**Secrets Used:**
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY_PROD`

**Failure Impact:** Blocks PR merge to `main` if drift detected

---

## Reusable Workflows Called

None

---

## Called By

N/A (triggered by PR events)

---

## Critical Observations

- **Path filter:** Only triggers on changes to `database/**` or `scripts/deploy/**` (may miss indirect migration impacts)
- **SSH config workaround:** `sed` command adjusts script for GitHub runner environment (fragile, assumes specific path format)
- **External script dependency:** Relies on `scripts/deploy/preflight_prod.sh` (logic not visible in workflow)
- **Report persistence:** Uses `/tmp/preflight_report.md` (ephemeral, lost if step fails before read)
- **PR comment integration:** Updates PR with drift report (good UX for reviewers)
- **No fallback:** If script fails before generating report, generic error message posted

---

## Operational Notes

- **Gate purpose:** Prevent production deployment if beta and prod databases are out of sync
- **Execution context:** Runs in GitHub runner, connects to remote server via SSH
- **Report format:** Markdown (rendered in PR comment)
- **Blocking behavior:** PR cannot merge if preflight fails (required check)
