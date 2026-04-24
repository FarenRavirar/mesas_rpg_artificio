# Workflow Inventory: docker-cleanup.yml

**Workflow Name:** Docker Cleanup  
**File Path:** `.github/workflows/docker-cleanup.yml`  
**Operational Responsibility:** Maintenance — Limpeza periódica de recursos Docker no servidor

---

## Triggers

| Event | Branches | Paths | Conditions |
|---|---|---|---|
| `schedule` | — | — | Cron: `0 3 * * 0` (Sundays at 3 AM UTC) |
| `workflow_dispatch` | — | — | Manual trigger |

---

## Jobs

### Job: `cleanup`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. SSH to server (`appleboy/ssh-action@v1.0.0`):
   - `docker image prune -f`
   - `docker container prune -f`
   - `docker builder prune -f`
   - `docker network prune -f`
   - For each repository (excluding `<none>`):
     - List images sorted by creation date (newest first)
     - Keep 3 most recent images
     - Remove older images: `tail -n +4 | awk '{print $1}' | xargs -r docker rmi -f`
   - Display disk usage: `df -h /var/lib/docker`
2. Notify success: `echo "✅ Limpeza concluída!"`
3. Notify failure: `echo "❌ Limpeza falhou!"`

**Secrets Used:**
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`

**Failure Impact:** Non-blocking (cleanup failure does not affect deployments)

---

## Reusable Workflows Called

None

---

## Called By

N/A (scheduled or manual trigger)

---

## Critical Observations

- **Aggressive pruning:** Removes all dangling images, stopped containers, unused builders, and unused networks
- **Image retention policy:** Keeps only 3 most recent images per repository (may be insufficient for rollback scenarios)
- **Silent failures:** `|| true` on `docker rmi` suppresses errors (images in use are skipped silently)
- **No environment isolation:** Prunes all Docker resources (affects both beta and production if on same host)
- **Disk usage reporting:** Provides visibility into cleanup effectiveness
- **No pre-cleanup validation:** Does not check if containers are running before pruning

---

## Operational Notes

- **Execution frequency:** Weekly (Sundays at 3 AM UTC)
- **Manual trigger available:** For emergency disk space recovery
- **Risk:** May remove images needed for quick rollback (only 3 versions retained)
- **Benefit:** Prevents disk exhaustion from accumulated build artifacts
