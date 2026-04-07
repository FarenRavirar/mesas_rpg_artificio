**Diagnóstico estrutural antes das tabelas:**

O backend **não tem `src/`** — o código-fonte TypeScript compilado está em `dist/` e é tratado como fonte. Isso significa que a migração não é só reorganização de pastas: é também a criação do `src/` que deveria existir. A estrutura alvo será `backend/src/modules/...` com o `dist/` passando a ser exclusivamente output do `tsc`.

O `dist/db/aggregator.js` é a duplicata silenciosa mais perigosa — existe um `aggregator.js` em `db/` (acesso a dados) e outro em `routes/` (rota HTTP), com nomes idênticos em camadas diferentes.

---

## Plano Completo — 5 Etapas

### Etapa 1 — Core (Infraestrutura Global)

| Arquivo Original (`dist/`) | Destino (`src/`) | Ação |
|---|---|---|
| `dist/db/index.js` | `src/core/db/index.ts` | Mover |
| `dist/db/types.js` | `src/core/db/types.ts` | Mover |
| `dist/db/aggregator.js` | `src/modules/aggregator/repository/db.ts` | Mover — **não é infraestrutura global**, é acesso a dados específico do agregador |
| `dist/middleware/auth.js` | `src/core/middleware/auth.ts` | Mover |
| `dist/server.js` | `src/server.ts` | Manter na raiz do `src/` |

**Estrutura `core/` resultante:**
```
backend/src/
├── core/
│   ├── db/
│   │   ├── index.ts        # pool/conexão Postgres
│   │   └── types.ts        # tipos de persistência agnósticos
│   ├── middleware/
│   │   └── auth.ts         # verifyJWT, requireRole
│   └── index.ts            # barrel re-exporta tudo
└── server.ts
```

**Ajuste de imports no `server.ts`:**
```ts
// antes (paths do dist/ flat)
import db from './db'
import auth from './middleware/auth'

// depois (barrel do core)
import { db, auth } from './core'
import usersRouter from './modules/users'
import aggregatorRouter from './modules/aggregator'
import gameRouter from './modules/game'
import systemsRouter from './modules/systems'
```

---

### Etapa 2 — Módulo de Identidade e Perfis (`modules/users/`)

**Conflito do `candidateService` — diagnóstico:**

Existem três instâncias:
- `dist/services/candidateService.js` — versão genérica/raiz, provavelmente legada
- `dist/services/aggregator/candidateService.js` — versão atual específica do agregador
- `dist/services/aggregator/candidateService_old.js` — backup explícito, lixo confirmado

A lógica de "candidate" no contexto do agregador (candidato à mesa) é domínio do agregador, não de usuário. O `candidateService` da raiz de `services/` é provavelmente um stub ou versão anterior que vazou para fora do módulo.

| Arquivo Original (`dist/`) | Destino (`src/`) | Ação |
|---|---|---|
| `dist/routes/adminProfile.js` | `src/modules/users/routes/admin.ts` | Mover |
| `dist/routes/me.js` | `src/modules/users/routes/me.ts` | Mover |
| `dist/routes/profile.js` | `src/modules/users/routes/profile.ts` | Mover |
| `dist/routes/auth.js` | `src/modules/users/routes/auth.ts` | Mover |
| `dist/routes/notifications.js` | `src/modules/users/routes/notifications.ts` | Mover |
| `dist/routes/settings.js` | `src/modules/users/routes/settings.ts` | Mover |
| `dist/routes/adminSettingSuggestions.js` | `src/modules/users/routes/adminSettings.ts` | Mover |
| `dist/services/profileService.js` | `src/modules/users/services/profileService.ts` | Mover |
| `dist/services/candidateService.js` | — | **Deletar** — duplicata fora do módulo correto |
| `dist/services/aggregator/candidateService_old.js` | — | **Deletar** — backup explícito |
| `dist/services/linkService.js` | `src/modules/users/services/linkService.ts` | Mover — links são de perfil de usuário/mestre |

**Estrutura `modules/users/` resultante:**
```
src/modules/users/
├── routes/
│   ├── auth.ts
│   ├── me.ts
│   ├── profile.ts
│   ├── admin.ts
│   ├── notifications.ts
│   ├── settings.ts
│   └── adminSettings.ts
├── services/
│   ├── profileService.ts
│   └── linkService.ts
└── index.ts               # monta o router e exporta
```

**`index.ts` do módulo users:**
```ts
import { Router } from 'express'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import profileRoutes from './routes/profile'
import adminRoutes from './routes/admin'
import notificationsRoutes from './routes/notifications'
import settingsRoutes from './routes/settings'

const router = Router()
router.use('/auth', authRoutes)
router.use('/me', meRoutes)
router.use('/profile', profileRoutes)
router.use('/admin', adminRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/settings', settingsRoutes)

export default router
```

**No `server.ts`:**
```ts
import usersRouter from './modules/users'
app.use('/api', usersRouter)
// substitui os 7 requires individuais de rotas que existiam antes
```

---

### Etapa 3 — Motor do Agregador (`modules/aggregator/`)

Este é o módulo mais complexo e com mais logic leakage. Toda a inteligência de processamento está dispersa entre `domain/aggregator/`, `services/aggregator/`, `routes/aggregator.js`, `routes/aggregatorReview.js` e `routes/discord.js`.

| Arquivo Original (`dist/`) | Destino (`src/`) | Ação |
|---|---|---|
| `dist/routes/aggregator.js` | `src/modules/aggregator/routes/aggregator.ts` | Mover |
| `dist/routes/aggregatorReview.js` | `src/modules/aggregator/routes/review.ts` | Mover |
| `dist/routes/discord.js` | `src/modules/aggregator/routes/discord.ts` | Mover — parsing do Discord pertence ao agregador |
| `dist/routes/links.js` | `src/modules/aggregator/routes/links.ts` | Mover — links de mesa são do agregador |
| `dist/db/aggregator.js` | `src/modules/aggregator/repository/db.ts` | Mover (veio da Etapa 1) |
| `dist/domain/aggregator/classifyPayment.js` | `src/modules/aggregator/domain/classifyPayment.ts` | Mover |
| `dist/domain/aggregator/classifySystem.js` | `src/modules/aggregator/domain/classifySystem.ts` | Mover |
| `dist/domain/aggregator/extractMediaLinks.js` | `src/modules/aggregator/domain/extractMediaLinks.ts` | Mover |
| `dist/domain/aggregator/formatForPublication.js` | `src/modules/aggregator/domain/formatForPublication.ts` | Mover |
| `dist/domain/aggregator/normalizeCandidate.js` | `src/modules/aggregator/domain/normalizeCandidate.ts` | Mover |
| `dist/domain/aggregator/normalizeExporterPayload.js` | `src/modules/aggregator/domain/normalizeExporterPayload.ts` | Mover |
| `dist/domain/aggregator/parseExporterMessage.js` | `src/modules/aggregator/domain/parseExporterMessage.ts` | Mover |
| `dist/domain/aggregator/resolveMasterRecruiter.js` | `src/modules/aggregator/domain/resolveMasterRecruiter.ts` | Mover |
| `dist/domain/aggregator/sanitizeDiscordJson.js` | `src/modules/aggregator/domain/sanitizeDiscordJson.ts` | Mover |
| `dist/domain/aggregator/types.js` | `src/modules/aggregator/types.ts` | Mover — tipos públicos do módulo |
| `dist/services/aggregator/candidateService.js` | `src/modules/aggregator/services/candidateService.ts` | Mover |
| `dist/services/aggregator/exportService.js` | `src/modules/aggregator/services/exportService.ts` | Mover |
| `dist/services/aggregator/importFromExporterService.js` | `src/modules/aggregator/services/importFromExporterService.ts` | Mover |
| `dist/services/aggregator/publishService.js` | `src/modules/aggregator/services/publishService.ts` | Mover |
| `dist/services/aggregator/pythonParserService.js` | `src/modules/aggregator/services/pythonParserService.ts` | Mover |
| `dist/services/aggregator/rawImportService.js` | `src/modules/aggregator/services/rawImportService.ts` | Mover |
| `dist/services/aggregator/sourceService.js` | `src/modules/aggregator/services/sourceService.ts` | Mover |
| `dist/services/aggregator/candidateService_old.js` | — | **Deletar** |

**Estrutura `modules/aggregator/` resultante:**
```
src/modules/aggregator/
├── domain/                  # lógica pura, sem I/O
│   ├── classifyPayment.ts
│   ├── classifySystem.ts
│   ├── extractMediaLinks.ts
│   ├── formatForPublication.ts
│   ├── normalizeCandidate.ts
│   ├── normalizeExporterPayload.ts
│   ├── parseExporterMessage.ts
│   ├── resolveMasterRecruiter.ts
│   └── sanitizeDiscordJson.ts
├── repository/
│   └── db.ts                # queries SQL do agregador
├── services/                # orquestração com I/O
│   ├── candidateService.ts
│   ├── exportService.ts
│   ├── importFromExporterService.ts
│   ├── publishService.ts
│   ├── pythonParserService.ts
│   ├── rawImportService.ts
│   └── sourceService.ts
├── routes/
│   ├── aggregator.ts
│   ├── review.ts
│   ├── discord.ts
│   └── links.ts
├── types.ts
└── index.ts
```

---

### Etapa 4 — Módulo de Gameplay (`modules/game/`)

| Arquivo Original (`dist/`) | Destino (`src/`) | Ação |
|---|---|---|
| `dist/routes/tables.js` | `src/modules/game/routes/tables.ts` | Mover |
| `dist/routes/tableSchedules.js` | `src/modules/game/routes/schedules.ts` | Mover |
| `dist/routes/scenarios.js` | `src/modules/game/routes/scenarios.ts` | Mover |
| `dist/routes/gmPanel.js` | `src/modules/game/routes/gmPanel.ts` | Mover |
| `dist/routes/gm.js` | `src/modules/game/routes/gm.ts` | Mover |

**Estrutura `modules/game/` resultante:**
```
src/modules/game/
├── routes/
│   ├── tables.ts
│   ├── schedules.ts
│   ├── scenarios.ts
│   ├── gm.ts
│   └── gmPanel.ts
└── index.ts
```

---

### Etapa 5 — Módulo de Sistemas + Scripts Isolados

**Systems** tem rotas + sugestões + admin de sugestões — é um módulo próprio:

| Arquivo Original (`dist/`) | Destino (`src/`) | Ação |
|---|---|---|
| `dist/routes/systems.js` | `src/modules/systems/routes/systems.ts` | Mover |
| `dist/routes/systemSuggestions.js` | `src/modules/systems/routes/suggestions.ts` | Mover |
| `dist/routes/systemSuggestionsAdmin.js` | `src/modules/systems/routes/suggestionsAdmin.ts` | Mover |

**Scripts — isolamento total do runtime:**

| Arquivo Original (`dist/`) | Destino | Ação |
|---|---|---|
| `dist/scripts/importCenarios.js` | `src/tasks/importCenarios.ts` | Mover |
| `dist/scripts/importDiscordExport.js` | `src/tasks/importDiscordExport.ts` | Mover |
| `dist/scripts/importSistemas.js` | `src/tasks/importSistemas.ts` | Mover |
| `dist/scripts/systemsTreeImport.js` | `src/tasks/systemsTreeImport.ts` | Mover |
| `backend/cenarios.json` | `src/tasks/data/cenarios.json` | Mover |
| `backend/sistemas.json` | `src/tasks/data/sistemas.json` | Mover |

Scripts em `tasks/` são executados via `ts-node src/tasks/importCenarios.ts` diretamente — nunca importados pelo `server.ts`. O `package.json` recebe scripts npm para cada um:
```json
"scripts": {
  "task:import-cenarios": "ts-node src/tasks/importCenarios.ts",
  "task:import-sistemas": "ts-node src/tasks/importSistemas.ts",
  "task:import-discord": "ts-node src/tasks/importDiscordExport.ts"
}
```

---

### Junk Files — Lista Consolidada

| Arquivo | Motivo | Ação |
|---|---|---|
| `secrets.txt` (raiz) | Credenciais em texto plano no repo | **Deletar + revogar imediatamente** |
| `ssh-key-2026-03-07privada.key` (raiz) | Chave SSH privada no repo | **Deletar + revogar imediatamente** |
| `teste.json` (raiz) | Arquivo de teste ad-hoc sem destino | Deletar |
| `docker-compose.beta.yml.backup` (raiz) | Backup explícito de config | Deletar — git já versiona |
| `dist/services/aggregator/candidateService_old.js` | Sufixo `_old` — backup manual | Deletar |
| `dist/services/candidateService.js` | Duplicata fora do módulo correto | Deletar |
| `backend/test_jsonrepair.js` | Script de teste solto na raiz do backend | Mover para `testes/` ou deletar |
| `tmp/` (pasta inteira) | 9 arquivos SQL de QA ad-hoc + txt vazio | Deletar a pasta |
| `frontend/src/utils/candidateToFormData_old.ts` | Sufixo `_old` | Deletar |
| `frontend/src/assets/banner_placeholder_backup.png` | Sufixo `backup` | Deletar |
| `testes/import_systems_catalog_v2.cpython-311.pyc` | Bytecode Python compilado no repo | Deletar + adicionar `*.pyc` ao `.gitignore` |

---

### Estrutura Final Completa

```
backend/src/
├── core/
│   ├── db/index.ts
│   ├── db/types.ts
│   ├── middleware/auth.ts
│   └── index.ts
├── modules/
│   ├── users/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── aggregator/
│   │   ├── domain/
│   │   ├── repository/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── game/
│   │   ├── routes/
│   │   └── index.ts
│   └── systems/
│       ├── routes/
│       └── index.ts
├── tasks/
│   ├── data/
│   ├── importCenarios.ts
│   ├── importDiscordExport.ts
│   ├── importSistemas.ts
│   └── systemsTreeImport.ts
└── server.ts
```

---

**Ordem de execução segura:** Etapa 1 primeiro (core não tem dependências internas), depois Etapa 3 (aggregator — módulo mais isolável porque já tem `domain/` separado), depois Etapas 2, 4, 5 em paralelo, e limpeza de junk ao final de cada etapa. O `server.ts` só é tocado depois que todos os `index.ts` dos módulos existem.