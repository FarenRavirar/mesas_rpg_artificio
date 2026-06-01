# Sessão 26-04-24_9_matriz-ambiente

**Data:** 24/04/2026
**Objetivo:** Matriz canônica de ambiente e protocolos de diagnóstico (Sessão 7b).

**Vínculos:**
- Sessão anterior: `26-04-24_5_diagnostico-403-beta.md` (ou 26-04-24_8_*)

**Plano de execução:**
1. Commit 1: Matriz canônica em constitution.md [x]
2. Commit 2: Protocolo Passo 0 em AGENTS.md [x]
3. Commit 3: Padrão de comandos SSH compostos em AGENTS.md [x]

**Arquivos modificados:**
- `.specify/memory/constitution.md`
- `AGENTS.md`

**Critério de conclusão:**
- Três commits atômicos gerados com aprovação, sem tocar noutros arquivos (exceto este MD).

- [x] Atualizar .specify/memory/project-state.md via /speckit.status
- [x] Mover sessão para encerradas/ (quando autorizado)
- [x] Atualizar index.md

## Execução complementar — hotpatch NODE_ENV
- Problema detectado: NODE_ENV=production em mesas-beta-api (container de beta), divergente da matriz canônica §10.5
- Ação: hotpatch aprovado pelo mantenedor via script stdin-piped (conforme §"Execução de comandos compostos na VM")
- Arquivo alterado na VM: /opt/mesas-beta/docker-compose.beta.yml linha 50
- Backup: /opt/mesas-beta/docker-compose.beta.yml.bak-20260424-163400
- Resultado: printenv NODE_ENV = development, container healthy
- Dirty state: ACEITO como transitório — compose da VM diverge do repo versionado até reconciliação futura
- Validação colateral: dry-run do endpoint /api/v1/admin/sync/hydrate retornou STATUS 200 no gate de auth (403 original erradicado); STATUS 500 posterior é bloqueio diferente (PROD_DATABASE_URL ausente) — não escopo desta sessão
- Achados registrados em errors.md: E159 (mismatch userId/id em adminHydration.ts da branch local) e E160 (PROD_DATABASE_URL ausente em mesas-beta-api).
