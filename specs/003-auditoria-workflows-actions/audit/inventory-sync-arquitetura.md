# Workflow Inventory: sync-arquitetura.yml

**Workflow Name:** Sync ARQUITETURA_PROJETO.md  
**File Path:** `.github/workflows/sync-arquitetura.yml`  
**Operational Responsibility:** Documentation — Sincronização automática de documentação de arquitetura

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `push` | `dev` | (all) | — |

**Permissions:**
- `contents: write`
- `pull-requests: write`

---

## Jobs

### Job: `sync-arquitetura`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4` (fetch-depth: 2)
2. `actions/setup-node@v4` (Node 22)
3. Generate diff of last merge: `git diff HEAD~1 HEAD > /tmp/last_merge.diff`
4. Check if diff is relevant:
   - If contains files matching `\.(ts|tsx|py|yml|yaml|sql)$`: `relevant=true`
   - Else: `relevant=false`
5. If relevant:
   - Run `node scripts/sync-arquitetura.js`
   - Environment variables:
     - `ROUTER_URL` (secret)
     - `ROUTER_API_KEY` (secret)
     - `ROUTER_MODEL=if/kimi-k2-thinking`
6. Check if updates proposed:
   - If `/tmp/arquitetura_patch.md` missing or contains "Nenhuma atualização necessária": `has_updates=false`
   - Else: `has_updates=true`
7. If has updates:
   - Copy patch to `docs/sync-patches/patch-$(date +%Y%m%d-%H%M%S).md`
   - Open PR via `peter-evans/create-pull-request@v5`:
     - Branch: `docs/sync-arquitetura-${{ github.sha }}`
     - Title: `docs: sync ARQUITETURA_PROJETO.md após merge`
     - Body: Instructions for manual review and application
     - Base: `dev`
     - Labels: `documentation`

**Secrets Used:**
- `ROUTER_URL`
- `ROUTER_API_KEY`
- `PAT_TOKEN` (for PR creation)

**Failure Impact:** Non-blocking (documentation sync failure does not affect deployments)

---

## Reusable Workflows Called

None

---

## Called By

N/A (triggered by push to `dev`)

---

## Critical Observations

- **AI-powered sync:** Uses external LLM API (`if/kimi-k2-thinking`) to analyze diff and propose documentation updates
- **Relevance filter:** Only processes diffs containing code/config files (skips pure markdown changes)
- **Non-destructive:** Generates patch proposals, does not auto-apply changes (human review required)
- **PR automation:** Creates PR with patch for manual review and application
- **External dependency:** Relies on `ROUTER_URL` availability (failure if API down)
- **Cost implications:** LLM API calls on every push to `dev` (may incur costs)
- **Patch persistence:** Stores patches in `docs/sync-patches/` (accumulates over time)

---

## Operational Notes

- **Execution frequency:** On every push to `dev` (high frequency)
- **Purpose:** Keep `ARQUITETURA_PROJETO.md` in sync with code changes
- **Human-in-the-loop:** Requires manual review and application of patches
- **Risk:** External API dependency (workflow fails if API unavailable)
- **Benefit:** Reduces documentation drift via automated detection
