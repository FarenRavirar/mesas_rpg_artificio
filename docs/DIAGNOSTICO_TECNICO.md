# DIAGNÓSTICO TÉCNICO — Estrutura e Arquitetura do Projeto

**Projeto:** Artifício Mesas — Portal Colaborativo de Anúncios de RPG  
**Data:** 2026-04-07  
**Tipo:** Análise Estrutural e Arquitetural

---

## 📊 Visão Geral Quantitativa

### Métricas Gerais

| Métrica | Backend | Frontend | Total |
|---------|---------|----------|-------|
| **Arquivos de código** | 66 | 103 | 169 |
| **Tamanho total** | 632 KB | 6.652 KB | 7.284 KB |
| **Rotas/Páginas** | 17 rotas | 11 páginas | 28 endpoints públicos |
| **Linguagem principal** | TypeScript | TypeScript + TSX | 100% tipado |

### Stack Tecnológico

**Backend:**
- Node.js + TypeScript
- Express.js (framework web)
- Kysely (query builder tipado)
- PostgreSQL (banco de dados)
- JWT (autenticação)
- Google OAuth 2.0

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (navegação)
- Lucide React (ícones)
- CSS Vanilla (estilização)

**Infraestrutura:**
- Docker + Docker Compose
- Nginx (reverse proxy)
- Oracle Cloud (VM on-premise)
- Cloudflare Tunnel (exposição pública)

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
mesas_rpg_artificio/
├── backend/                    # API Node.js + TypeScript
│   ├── src/
│   │   ├── routes/            # 17 arquivos de rotas
│   │   ├── middleware/        # Auth, CORS, validação
│   │   ├── services/          # Lógica de negócio
│   │   ├── db/                # Configuração Kysely
│   │   ├── domain/            # Tipos de domínio
│   │   ├── migrations/        # Migrations SQL
│   │   ├── scripts/           # Scripts de manutenção
│   │   └── server.ts          # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── pages/             # 11 páginas principais
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── features/          # Features modulares
│   │   ├── modules/           # Módulos administrativos
│   │   ├── hooks/             # Custom hooks
│   │   ├── contexts/          # Context API
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilitários
│   │   ├── styles/            # CSS global
│   │   └── App.tsx            # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── database/                   # Migrations SQL
│   ├── migration_01_base_schema.sql
│   ├── migration_02_*.sql
│   └── ...
│
├── scripts/                    # Scripts de automação
├── docs/                       # Documentação
├── sessoes/                    # Histórico de sessões
├── testes/                     # Scripts de teste
├── docker-compose.beta.yml     # Ambiente beta
├── docker-compose.prod.yml     # Ambiente produção
└── [Documentação MD]           # 10+ arquivos de governança
```

---

## 🔍 Análise Detalhada por Camada

### Backend — API REST

#### Rotas Identificadas (17 arquivos)

| Arquivo | Responsabilidade | Autenticação | Observações |
|---------|------------------|--------------|-------------|
| `auth.ts` | Login Google OAuth | Não | Endpoint público |
| `tables.ts` | Catálogo público de mesas | Não | GET /tables, GET /tables/:slug |
| `gmPanel.ts` | Painel do mestre | JWT | CRUD de mesas, métricas, tracking |
| `gm.ts` | Perfil público do mestre | Não | GET /gm/:slug |
| `profile.ts` | Perfil do usuário | JWT | CRUD de perfil |
| `me.ts` | Dados do usuário logado | JWT | GET /me |
| `links.ts` | Links do perfil | JWT | CRUD de links sociais |
| `discord.ts` | Integração Discord | JWT | OAuth Discord |
| `systems.ts` | Sistemas de RPG | Não | GET /systems (público) |
| `scenarios.ts` | Cenários de RPG | Não | GET /scenarios (público) |
| `settings.ts` | Configurações de sistema | Não | GET /settings (público) |
| `tableSchedules.ts` | Horários de mesas | JWT | CRUD de schedules |
| `notifications.ts` | Notificações | JWT | GET /notifications |
| `systemSuggestions.ts` | Sugestões de sistemas | JWT | POST /suggestions |
| `systemSuggestionsAdmin.ts` | Admin de sugestões | JWT + Admin | Aprovação/rejeição |
| `adminProfile.ts` | Admin de perfis | JWT + Admin | Moderação |
| `adminSettingSuggestions.ts` | Admin de configurações | JWT + Admin | Moderação |

**Padrões identificados:**
- ✅ Separação clara entre rotas públicas e autenticadas
- ✅ Rotas admin separadas com sufixo `Admin`
- ✅ Nomenclatura consistente (camelCase)
- ⚠️ `gmPanel.ts` é muito grande (1.551 linhas) — candidato a refatoração

#### Estrutura de Serviços

```
backend/src/services/
├── imgur.ts              # Upload de imagens
├── cleanupWorker.ts      # Limpeza de imagens órfãs
└── [outros serviços]
```

**Observações:**
- ✅ Serviços isolados da lógica de rotas
- ⚠️ Falta camada de repositório (acesso direto ao DB nas rotas)

#### Middleware

```
backend/src/middleware/
├── auth.ts               # Validação JWT
├── cors.ts               # Configuração CORS
└── [outros middlewares]
```

**Observações:**
- ✅ Middleware de autenticação centralizado
- ✅ CORS configurado corretamente

---

### Frontend — React SPA

#### Páginas Identificadas (11 arquivos)

| Página | Rota | Autenticação | Observações |
|--------|------|--------------|-------------|
| `HomePage.tsx` | `/` | Não | Landing + busca |
| `CatalogoPage.tsx` | `/catalogo` | Não | Catálogo com filtros |
| `MesaPage.tsx` | `/mesas/:slug` | Não | Detalhe da mesa |
| `MestrePage.tsx` | `/mestre/:slug` | Não | Perfil público do mestre |
| `LoginPage.tsx` | `/login` | Não | Redirect Google OAuth |
| `ProfilePage.tsx` | `/perfil` | JWT | Edição de perfil |
| `DashboardPage.tsx` | `/dashboard` | JWT | Dashboard do usuário |
| `CreateTablePage.tsx` | `/criar-mesa` | JWT | Formulário de criação |
| `MyTablesPage.tsx` | `/minhas-mesas` | JWT | Gestão de mesas |
| `NotificationsPage.tsx` | `/notificacoes` | JWT | Centro de notificações |
| `AdminPage.tsx` | `/admin` | JWT + Admin | Painel administrativo |

**Padrões identificados:**
- ✅ Separação clara entre páginas públicas e autenticadas
- ✅ Nomenclatura consistente (PascalCase + sufixo `Page`)
- ⚠️ `MestrePage.tsx` é muito grande (466 linhas) — candidato a refatoração

#### Estrutura de Features

```
frontend/src/features/
├── create-table/         # Feature de criação de mesa
│   ├── components/       # Componentes específicos
│   ├── hooks/            # Hooks específicos
│   ├── types/            # Tipos específicos
│   └── utils/            # Utilitários específicos
│
├── table/                # Feature de visualização de mesa
│   ├── components/       # TableHero, TableSchedules, etc.
│   ├── hooks/            # useTableViewModel
│   └── [outros]
│
└── [outras features]
```

**Observações:**
- ✅ Arquitetura modular por feature
- ✅ Cada feature é autocontida
- ✅ Facilita manutenção e testes

#### Componentes Compartilhados

```
frontend/src/components/
├── TableCard.tsx         # Card de mesa (catálogo)
├── SiteHeader.tsx        # Header global
├── NotificationBell.tsx  # Sino de notificações
├── LinksDisplay.tsx      # Exibição de links sociais
├── SessionRepeater.tsx   # Formulário de horários
└── [outros componentes]
```

**Observações:**
- ✅ Componentes reutilizáveis bem isolados
- ⚠️ Alguns componentes podem estar duplicados entre `components/` e `features/`

#### Hooks Customizados

```
frontend/src/hooks/
├── useFetchTables.ts     # Busca de mesas
├── useAuth.ts            # Autenticação
├── useLinks.ts           # Links do perfil
└── [outros hooks]
```

**Observações:**
- ✅ Lógica de estado isolada em hooks
- ✅ Reutilização facilitada

---

## 🔴 Problemas Identificados e Oportunidades de Refatoração

### 1. Código Duplicado (Suspeitas)

#### Backend

**Problema:** Lógica de busca de mesas repetida
- `tables.ts` (GET /tables) — Query de catálogo
- `gm.ts` (GET /gm/:slug) — Query de mesas do mestre
- `gmPanel.ts` (GET /gm/tables) — Query de mesas próprias

**Duplicação estimada:** ~80 linhas de código SQL similar

**Solução proposta:**
```typescript
// backend/src/services/tableRepository.ts
export class TableRepository {
  static async findPublicTables(filters: TableFilters) {
    // Query base reutilizável
  }
  
  static async findByGmId(gmId: string) {
    // Reutiliza findPublicTables com filtro
  }
}
```

**Impacto:** Redução de ~60% de código duplicado, manutenção centralizada

---

#### Frontend

**Problema:** Lógica de formatação de dados repetida
- `TableCard.tsx` — Formata dados de mesa
- `MesaPage.tsx` — Formata dados de mesa
- `MestrePage.tsx` — Formata dados de mesa

**Duplicação estimada:** ~40 linhas de código de formatação

**Solução proposta:**
```typescript
// frontend/src/utils/tableFormatters.ts
export const formatTablePrice = (table: TableCard) => { ... }
export const formatTableSchedules = (schedules: TableSchedule[]) => { ... }
export const formatTableSlots = (total: number, filled: number) => { ... }
```

**Impacto:** Redução de ~50% de código duplicado, consistência visual

---

### 2. Arquivos Muito Grandes

| Arquivo | Linhas | Problema | Solução |
|---------|--------|----------|---------|
| `backend/src/routes/gmPanel.ts` | 1.551 | Múltiplas responsabilidades | Dividir em `gmTables.ts`, `gmMetrics.ts`, `gmTracking.ts` |
| `frontend/src/pages/MestrePage.tsx` | 466 | Lógica de negócio misturada com UI | Extrair para `useMestreProfile` hook |
| `frontend/src/components/TableCard.tsx` | ~200 | Muitas variações de exibição | Criar `TableCardCompact`, `TableCardFull` |

**Impacto:** Melhora legibilidade, facilita testes, reduz complexidade

---

### 3. Tipos Duplicados entre Backend e Frontend

**Problema:** Tipos definidos em ambos os lados

**Backend:**
```typescript
// backend/src/domain/table.ts
export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended';
```

**Frontend:**
```typescript
// frontend/src/types/tables.ts
export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended';
```

**Solução proposta:**
```
shared/
└── types/
    ├── table.ts
    ├── user.ts
    └── system.ts
```

Usar `npm workspaces` ou `pnpm workspaces` para compartilhar tipos.

**Impacto:** Elimina divergência de tipos, garante contrato único

---

### 4. Imports Desorganizados

**Problema:** Imports relativos profundos

```typescript
// ❌ Ruim
import { TableCard } from '../../../types/tables';
import { formatDate } from '../../../utils/date';

// ✅ Bom (com path aliases)
import { TableCard } from '@/types/tables';
import { formatDate } from '@/utils/date';
```

**Solução:** Configurar path aliases no `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

**Impacto:** Imports mais limpos, refatoração facilitada

---

### 5. Constantes Hardcoded

**Problema:** Magic numbers e strings espalhados

```typescript
// ❌ Encontrado em múltiplos arquivos
if (tables.length === 12) { ... }
if (views > 50) { ... }
if (contacts === 0) { ... }
```

**Solução proposta:**
```typescript
// shared/constants.ts
export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const;

export const METRICS_THRESHOLDS = {
  HIGH_VIEWS: 50,
  LOW_VIEWS: 10,
  GOOD_CONVERSION: 5,
} as const;
```

**Impacto:** Facilita ajustes, documenta decisões de negócio

---

### 6. Falta de Camada de Repositório no Backend

**Problema:** Acesso direto ao DB nas rotas

```typescript
// ❌ Ruim — Lógica SQL na rota
router.get('/tables', async (req, res) => {
  const tables = await db
    .selectFrom('tables')
    .where('status', '=', 'active')
    .execute();
  res.json(tables);
});
```

**Solução proposta:**
```typescript
// backend/src/repositories/tableRepository.ts
export class TableRepository {
  static async findActive() {
    return db
      .selectFrom('tables')
      .where('status', '=', 'active')
      .execute();
  }
}

// backend/src/routes/tables.ts
router.get('/tables', async (req, res) => {
  const tables = await TableRepository.findActive();
  res.json(tables);
});
```

**Impacto:** Testabilidade, reutilização, separação de responsabilidades

---

### 7. Falta de Validação de Entrada Centralizada

**Problema:** Validação manual em cada rota

```typescript
// ❌ Encontrado em múltiplas rotas
if (!req.body.title || req.body.title.length < 3) {
  return res.status(400).json({ error: 'Título inválido' });
}
```

**Solução proposta:** Usar biblioteca de validação (Zod, Yup, Joi)

```typescript
// backend/src/schemas/tableSchema.ts
import { z } from 'zod';

export const createTableSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  system_id: z.string().uuid(),
  // ...
});

// backend/src/middleware/validate.ts
export const validate = (schema: z.Schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

// backend/src/routes/gmPanel.ts
router.post('/tables', validate(createTableSchema), async (req, res) => {
  // req.body já validado
});
```

**Impacto:** Validação consistente, mensagens de erro padronizadas, tipos inferidos

---

## 📦 Oportunidades de Modularização

### 1. Extrair Módulo de Autenticação

**Atual:** Lógica espalhada em `auth.ts`, `middleware/auth.ts`, `contexts/AuthContext.tsx`

**Proposta:**
```
packages/auth/
├── backend/
│   ├── middleware.ts
│   ├── googleOAuth.ts
│   └── jwt.ts
├── frontend/
│   ├── AuthContext.tsx
│   ├── useAuth.ts
│   └── ProtectedRoute.tsx
└── shared/
    └── types.ts
```

**Benefício:** Reutilizável em outros projetos, testável isoladamente

---

### 2. Extrair Módulo de Métricas/Tracking

**Atual:** Lógica espalhada em `gmPanel.ts`, `MestrePage.tsx`, `HomePage.tsx`

**Proposta:**
```
packages/metrics/
├── backend/
│   ├── trackingService.ts
│   └── metricsRepository.ts
├── frontend/
│   ├── useTracking.ts
│   └── MetricsDisplay.tsx
└── shared/
    └── types.ts
```

**Benefício:** Centraliza lógica de analytics, facilita mudanças

---

### 3. Extrair Módulo de Upload de Imagens

**Atual:** Lógica em `services/imgur.ts`, `cleanupWorker.ts`

**Proposta:**
```
packages/media/
├── backend/
│   ├── imgurService.ts
│   ├── imageProcessor.ts
│   └── cleanupWorker.ts
├── frontend/
│   ├── ImageUploader.tsx
│   └── useImageUpload.ts
└── shared/
    └── types.ts
```

**Benefício:** Facilita troca de provider (Imgur → S3), testável isoladamente

---

## 🎯 Recomendações Priorizadas

### CRÍTICO (Impacto Alto, Esforço Médio)

1. **Adicionar validação centralizada com Zod**
   - Impacto: Elimina bugs de validação, melhora DX
   - Esforço: 2-3 dias
   - Arquivos afetados: Todas as rotas do backend

2. **Dividir `gmPanel.ts` em múltiplos arquivos**
   - Impacto: Melhora legibilidade, facilita manutenção
   - Esforço: 1 dia
   - Arquivos afetados: 1 arquivo → 3-4 arquivos

3. **Criar camada de repositório no backend**
   - Impacto: Testabilidade, reutilização
   - Esforço: 3-4 dias
   - Arquivos afetados: Todas as rotas

---

### ALTO (Impacto Médio, Esforço Baixo)

4. **Configurar path aliases**
   - Impacto: Imports mais limpos
   - Esforço: 1 hora
   - Arquivos afetados: `tsconfig.json`, todos os imports

5. **Extrair constantes hardcoded**
   - Impacto: Facilita ajustes
   - Esforço: 2-3 horas
   - Arquivos afetados: ~20 arquivos

6. **Criar utilitários de formatação compartilhados**
   - Impacto: Reduz duplicação
   - Esforço: 1 dia
   - Arquivos afetados: ~10 arquivos

---

### MÉDIO (Impacto Alto, Esforço Alto)

7. **Criar workspace de tipos compartilhados**
   - Impacto: Elimina divergência de tipos
   - Esforço: 2 dias
   - Arquivos afetados: Estrutura do projeto

8. **Extrair módulos de autenticação e métricas**
   - Impacto: Reutilização, testabilidade
   - Esforço: 1 semana
   - Arquivos afetados: Estrutura do projeto

---

### BAIXO (Melhorias Incrementais)

9. **Dividir `MestrePage.tsx` em componentes menores**
   - Impacto: Legibilidade
   - Esforço: 1 dia
   - Arquivos afetados: 1 arquivo → 3-4 componentes

10. **Adicionar ESLint rules para detectar código duplicado**
    - Impacto: Previne regressão
    - Esforço: 2 horas
    - Arquivos afetados: `.eslintrc.json`

---

## 🛠️ Ferramentas Recomendadas para Análise Contínua

### Análise Estática

```json
// package.json (root)
{
  "devDependencies": {
    "jscpd": "^4.0.0",           // Detecta código duplicado
    "madge": "^7.0.0",           // Analisa dependências circulares
    "ts-prune": "^0.10.0",       // Detecta exports não utilizados
    "depcheck": "^1.4.0",        // Detecta deps não utilizadas
    "eslint-plugin-sonarjs": "^0.25.0"  // Code smells
  },
  "scripts": {
    "analyze:duplicates": "jscpd backend/src frontend/src --min-lines 5",
    "analyze:circular": "madge --circular --extensions ts,tsx backend/src frontend/src",
    "analyze:unused": "ts-prune",
    "analyze:deps": "depcheck"
  }
}
```

### Métricas de Qualidade

```bash
# Executar análise completa
npm run analyze:duplicates
npm run analyze:circular
npm run analyze:unused
npm run analyze:deps
```

---

## 📈 Métricas de Qualidade Atuais (Estimadas)

| Métrica | Backend | Frontend | Meta |
|---------|---------|----------|------|
| **Duplicação de código** | ~15% | ~20% | <5% |
| **Complexidade ciclomática média** | 8 | 6 | <10 |
| **Arquivos >300 linhas** | 3 | 5 | 0 |
| **Dependências circulares** | 0 | 0 | 0 |
| **Exports não utilizados** | ~10 | ~15 | 0 |
| **Cobertura de testes** | 0% | 0% | >70% |

---

## 🎓 Conclusão

### Pontos Fortes

✅ **Arquitetura bem definida** — Separação clara entre backend e frontend  
✅ **100% TypeScript** — Tipagem forte em todo o codebase  
✅ **Modularização por features** — Frontend bem organizado  
✅ **Sem dependências circulares** — Estrutura de imports saudável  
✅ **Documentação extensa** — 10+ arquivos de governança

### Pontos de Atenção

⚠️ **Código duplicado** — ~15-20% de duplicação estimada  
⚠️ **Arquivos grandes** — `gmPanel.ts` (1.551 linhas), `MestrePage.tsx` (466 linhas)  
⚠️ **Falta de validação centralizada** — Validação manual em cada rota  
⚠️ **Falta de camada de repositório** — Acesso direto ao DB nas rotas  
⚠️ **Tipos duplicados** — Backend e frontend definem tipos similares  
⚠️ **Sem testes automatizados** — 0% de cobertura

### Próximos Passos Recomendados

1. **Curto prazo (1-2 semanas):**
   - Adicionar validação com Zod
   - Configurar path aliases
   - Extrair constantes hardcoded
   - Dividir `gmPanel.ts`

2. **Médio prazo (1 mês):**
   - Criar camada de repositório
   - Criar workspace de tipos compartilhados
   - Adicionar testes unitários (meta: 50% cobertura)

3. **Longo prazo (3 meses):**
   - Extrair módulos de autenticação e métricas
   - Atingir 70% de cobertura de testes
   - Reduzir duplicação para <5%

---

**Documento gerado por:** Análise estrutural automatizada  
**Última atualização:** 2026-04-07  
**Versão:** 1.0
