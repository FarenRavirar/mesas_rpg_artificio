# Token Usage Report

**Date:** 2026-04-22T14:25:00Z  
**Target Context Window:** 200,000 tokens  
**Estimation Method:** chars ÷ 4.0 (configurable via `chars_per_token`)

---

## Governance Files

| File | Exists | Chars | Est. Tokens | Load Timing | Notes |
|---|---|---|---|---|---|
| `AGENTS.md` | ✅ | 20,342 | 5,086 | Always | Governança operacional |
| `.specify/memory/constitution.md` | ✅ | 10,292 | 2,573 | Always | Regras arquiteturais SDD |
| `CLAUDE.md` | ❌ | 0 | 0 | N/A | Não utilizado |
| `.github/copilot-instructions.md` | ❌ | 0 | 0 | N/A | Não utilizado |

**Total governance tokens:** 7,659 (~3.8% of 200K context window)

---

## Extension Commands (ranked by token cost)

| Extension | Commands | Total Tokens | Largest Command | Largest Tokens |
|---|---|---|---|---|
| **Optimize** | 3 | 10,345 | `speckit.optimize.run` | 5,354 |
| **Brownfield** | 4 | 5,278 | `speckit.brownfield.migrate` | 1,481 |
| **Git** | 5 | 2,452 | `speckit.git.feature` | 817 |
| **MemoryLint** | 2 | 1,387 | `check-boundaries` | 848 |
| **Fixit** | 1 | 374 | `speckit.fixit.run` | 374 |

**Total extension tokens:** 19,836 (loaded per invocation, not per session)

### Detailed Breakdown

**Optimize (10,345 tokens):**
- `speckit.optimize.run.md`: 21,414 chars (5,354 tokens)
- `speckit.optimize.learn.md`: 12,242 chars (3,061 tokens)
- `speckit.optimize.tokens.md`: 7,725 chars (1,931 tokens)

**Brownfield (5,278 tokens):**
- `speckit.brownfield.migrate.md`: 5,925 chars (1,481 tokens)
- `speckit.brownfield.bootstrap.md`: 5,672 chars (1,418 tokens)
- `speckit.brownfield.scan.md`: 5,452 chars (1,363 tokens)
- `speckit.brownfield.validate.md`: 4,063 chars (1,016 tokens)

**Git (2,452 tokens):**
- `speckit.git.feature.md`: 3,268 chars (817 tokens)
- `speckit.git.commit.md`: 1,793 chars (448 tokens)
- `speckit.git.validate.md`: 1,780 chars (445 tokens)
- `speckit.git.initialize.md`: 1,569 chars (392 tokens)
- `speckit.git.remote.md`: 1,396 chars (349 tokens)

**MemoryLint (1,387 tokens):**
- `check-boundaries.md`: 3,393 chars (848 tokens)
- `load-agents.md`: 2,156 chars (539 tokens)

**Fixit (374 tokens):**
- `speckit.fixit.run.md`: 1,496 chars (374 tokens)

---

## Per-Session Token Budget

| Session Type | Tokens | % of 8K | % of 32K | % of 128K | % of 200K | % of 1M |
|---|---|---|---|---|---|
| Baseline (governance only) | 7,659 | 95.7% | 23.9% | 6.0% | 3.8% | 0.8% |
| + Constitution | 7,659 | 95.7% | 23.9% | 6.0% | 3.8% | 0.8% |
| + Largest command (optimize.run) | 13,013 | 162.7% | 40.7% | 10.2% | 6.5% | 1.3% |

**Note:** Constitution is already included in baseline (always-loaded).

---

## Historical Trend

**Status:** First run — no previous report found.

**Recommendation:** Run `/speckit.optimize.tokens` periodically (monthly or after major governance changes) to track trends.

---

## Analysis

### ✅ Strengths

1. **Healthy governance budget:** 7,659 tokens (3.8%) is well below the 20% threshold
2. **Centralized governance:** No CLAUDE.md drift, single constitution file
3. **Clean memory structure:** Only 1 file in `.specify/memory/` (no orphans)
4. **Reasonable extension sizes:** Largest command (optimize.run at 5,354 tokens) is expected for audit tooling

### 🔍 Observations

1. **Optimize is the heaviest extension:** 10,345 tokens total (52% of all extension tokens)
   - Expected: audit commands require comprehensive instructions
   - `optimize.run` alone is 5,354 tokens (6 analysis categories)

2. **Brownfield is second:** 5,278 tokens (27% of extension tokens)
   - Expected: codebase analysis requires detailed scanning logic

3. **Context window utilization:**
   - Baseline session: 3.8% (excellent)
   - With largest command: 6.5% (still healthy)
   - Plenty of headroom for actual work (93.5% available)

### 📊 Governance Distribution

```
AGENTS.md:        5,086 tokens (66.4% of governance)
constitution.md:  2,573 tokens (33.6% of governance)
```

This distribution is appropriate:
- `AGENTS.md`: Operational rules, session protocols, infrastructure
- `constitution.md`: Architectural rules, code standards, SDD principles

---

## Optimization Suggestions

**None required at this time.** Governance overhead is healthy and well-structured.

### Future Monitoring

1. **Track AGENTS.md growth:** Currently 5,086 tokens — monitor for rule accumulation
2. **Watch for CLAUDE.md creation:** Would duplicate governance (currently clean)
3. **Periodic audits:** Run `/speckit.optimize.tokens --diff` monthly to detect drift

---

## Recommended Actions

✅ **No immediate action needed.** Governance is optimized.

**Next steps:**
- Save this report for trend tracking
- Run `/speckit.optimize.run` for deeper constitution analysis (rule health, interpretability, coherence)
- Schedule next token audit in 30 days or after major governance changes
