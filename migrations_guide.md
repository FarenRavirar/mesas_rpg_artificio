# Guia de Migrations - Mesas RPG Artifício

**Última atualização:** 18/04/2026  
**Baseado em:** Migrations 104-107 (Auditoria de Sistemas)

---

## Índice

1. [Princípios Fundamentais](#princípios-fundamentais)
2. [Estrutura de uma Migration](#estrutura-de-uma-migration)
3. [Erros Comuns e Como Evitar](#erros-comuns-e-como-evitar)
4. [Comandos SQL Seguros](#comandos-sql-seguros)
5. [Validação e Idempotência](#validação-e-idempotência)
6. [Aplicação de Migrations](#aplicação-de-migrations)
7. [Checklist Pré-Deploy](#checklist-pré-deploy)
8. [Rollback e Recuperação](#rollback-e-recuperação)

---

## Princípios Fundamentais

### 1. Idempotência é Obrigatória

**Toda migration DEVE poder ser executada múltiplas vezes sem erro.**

✅ **CORRETO:**
```sql
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description TEXT;
CREATE TABLE IF NOT EXISTS scenario_aliases (...);
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

❌ **ERRADO:**
```sql
ALTER TABLE scenarios ADD COLUMN description TEXT; -- Falha na 2ª execução
CREATE TABLE scenario_aliases (...); -- Falha se já existe
```

### 2. Nunca Usar Operações Destrutivas Sem Backup

**BLOQUEANTE em produção:**
- `TRUNCATE`
- `DROP TABLE` / `DROP COLUMN`
- `DELETE FROM` (sem WHERE muito específico)
- `ALTER TABLE ... ALTER COLUMN` (mudança de tipo)

**Sempre:**
1. Fazer backup via `PRE_DEPLOY_CHECKLIST.md`
2. Testar em beta primeiro
3. Documentar rollback

### 3. Migrations São Imutáveis

**Nunca editar migration antiga (> 1 semana).**

Se precisa corrigir:
- Criar nova migration com a correção
- Documentar no nome: `migration_108_fix_107_constraint.sql`

---

## Estrutura de uma Migration

### Template Padrão

```sql
-- Migration XXX: [Título curto e descritivo]
-- Problema: [O que está errado]
-- Solução: [O que será feito]

-- 1. [Primeira mudança]
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;

-- 2. [Segunda mudança]
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Validação: verificar que mudanças foram aplicadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'column_name'
  ) THEN
    RAISE EXCEPTION 'Migration XXX failed: column not created';
  END IF;
  
  RAISE NOTICE 'Migration XXX completed successfully';
END $$;
```

### Nomenclatura

**Formato:** `migration_XXX_descricao_curta.sql`

**Exemplos:**
- ✅ `migration_104_unify_node_type_check.sql`
- ✅ `migration_107_scenarios_aliases_fields.sql`
- ❌ `fix.sql`
- ❌ `migration_new.sql`

---

## Erros Comuns e Como Evitar

### Erro 1: Blocos `DO $$` com Escape Incorreto

**Problema encontrado:** Heredoc via SSH com `$$` falha porque shell interpreta.

❌ **ERRADO (via SSH):**
```bash
ssh server "cat > file.sql << 'EOF'
DO $$
BEGIN
  ...
END $$;
EOF"
# Resultado: "invalid command \$"
```

✅ **CORRETO:**
```bash
# Opção 1: Copiar arquivo local
scp migration.sql server:/tmp/
ssh server "docker cp /tmp/migration.sql container:/tmp/"
ssh server "docker exec container psql -f /tmp/migration.sql"

# Opção 2: Comandos SQL diretos (sem blocos DO)
ssh server "docker exec container psql -c 'ALTER TABLE ...'"
```

### Erro 2: Aspas Simples em Comandos SSH

**Problema encontrado:** PowerShell e bash interpretam aspas diferente.

❌ **ERRADO:**
```bash
ssh server "psql -c \"CHECK (node_type IN ('system', 'edition'))\""
# Resultado: column "system" does not exist
```

✅ **CORRETO:**
```bash
# Usar aspas simples duplicadas
ssh server "psql -c 'CHECK (node_type IN (''system'', ''edition''))'"

# Ou copiar arquivo (preferível)
scp migration.sql server:/tmp/
```

### Erro 3: Constraints Conflitantes

**Problema encontrado:** Migration 02 e Migration 11 criaram constraints diferentes para `node_type`.

**Sintoma:**
```sql
-- M02 aceita 'subsystem'
CHECK (node_type IN ('system', 'edition', 'variant', 'subsystem'))

-- M11 recusa 'subsystem'
CHECK (node_type IN ('system', 'edition', 'variant'))
```

✅ **SOLUÇÃO:**
```sql
-- Migration 104: Unificar constraints
DO $$
BEGIN
  -- Remove ambas as constraints antigas
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'old_constraint_1') THEN
    ALTER TABLE systems DROP CONSTRAINT old_constraint_1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'old_constraint_2') THEN
    ALTER TABLE systems DROP CONSTRAINT old_constraint_2;
  END IF;
END $$;

-- Adiciona constraint unificada
ALTER TABLE systems
  ADD CONSTRAINT systems_node_type_check
  CHECK (node_type IN ('system', 'edition', 'variant', 'subsystem'));
```

### Erro 4: Tipos TypeScript Desatualizados

**Problema encontrado:** Migration adiciona campos mas `backend/src/db/types.ts` não é atualizado.

**Sintoma:**
```
error TS2353: Object literal may only specify known properties, 
and 'action_url' does not exist in type 'InsertExpression<Database, "notifications">'
```

✅ **SOLUÇÃO:**
1. Sempre atualizar `types.ts` após migration
2. Rodar `npx tsc --noEmit` antes de commitar
3. Adicionar campos com comentário da migration:

```typescript
export interface NotificationsTable {
  // ... campos existentes
  action_url: string | null; // Migration 106
  metadata: Generated<unknown>; // Migration 106 - JSONB
}
```

### Erro 5: Esquecer de Adicionar Tabela na Interface Database

**Problema encontrado:** Tabela `scenario_aliases` criada mas não adicionada em `Database`.

✅ **SOLUÇÃO:**
```typescript
export interface Database {
  // ... outras tabelas
  scenarios: ScenariosTable;
  scenario_aliases: ScenarioAliasesTable; // Migration 107
}
```

### Erro 6: TRUNCATE em Produção Sem Backup

**Problema encontrado:** Migration 11 usa `TRUNCATE TABLE systems CASCADE;` sem validação.

❌ **ERRADO:**
```sql
-- Migration 11 (exemplo real do projeto)
TRUNCATE TABLE systems CASCADE;
-- Comentário: "Confirmado pelo usuário: Pode zerar tudo"
```

**Risco:** Em produção, isso deleta TODOS os dados da tabela e tabelas relacionadas.

✅ **CORRETO:**
```sql
-- NUNCA usar TRUNCATE em migration de produção
-- Se realmente necessário (ex: refactor completo):
-- 1. Fazer backup completo via PRE_DEPLOY_CHECKLIST.md
-- 2. Documentar rollback explícito
-- 3. Usar em migration separada com nome claro
-- 4. Exigir aprovação explícita do responsável

-- Alternativa: migrar dados em vez de deletar
INSERT INTO new_table SELECT * FROM old_table WHERE ...;
```

### Erro 7: Migrations Duplicadas (Numeração Conflitante)

**Problema encontrado:** Projeto tem `migration_104_drop_tables_frequency_columns.sql` E `migration_104_unify_node_type_check.sql`.

**Sintoma:** Confusão sobre qual migration foi aplicada, ordem de execução incorreta.

✅ **SOLUÇÃO:**
```bash
# Sempre verificar último número antes de criar nova migration
ls database/migration_*.sql | sort -V | tail -n 5

# Se encontrar duplicata:
# 1. Renumerar a mais recente para próximo número disponível
# 2. Atualizar referências em documentação
# 3. Adicionar nota no commit sobre renumeração
```

**Convenção do projeto:**
- Migrations 1-99: Features principais
- Migrations 100+: Ajustes e correções
- Sempre usar próximo número sequencial disponível

### Erro 8: Falta de Transações (BEGIN/COMMIT)

**Problema encontrado:** Migration 18 usa `BEGIN/COMMIT`, mas maioria não usa.

**Quando usar transações:**

✅ **USE BEGIN/COMMIT quando:**
```sql
-- Múltiplas operações que devem ser atômicas
BEGIN;

ALTER TABLE table1 DROP COLUMN old_column;
ALTER TABLE table2 DROP COLUMN old_column;
DROP TABLE old_table;

COMMIT;
-- Se qualquer comando falhar, NADA é aplicado
```

❌ **NÃO USE quando:**
```sql
-- Operações idempotentes independentes
ALTER TABLE table1 ADD COLUMN IF NOT EXISTS new_column TEXT;
-- Se falhar, pode rodar novamente sem problema
```

**Regra:** Use transações para operações destrutivas ou interdependentes.

### Erro 9: Conflito de Nomenclatura (Schema vs Código)

**Problema encontrado:** Migration 06 cria `suggestion_type`, mas código espera `node_type`.

**Migration 06 (original):**
```sql
CREATE TABLE system_suggestions (
  suggestion_type VARCHAR(50) NOT NULL CHECK (suggestion_type IN ('new', 'edit', 'variant')),
  ...
);
```

**Código TypeScript:**
```typescript
// Frontend envia
{ node_type: 'edition' }

// Backend lê
const { node_type } = req.body;

// Schema espera
suggestion_type VARCHAR(50)
```

**Resultado:** Três nomes diferentes para o mesmo conceito, bugs silenciosos.

✅ **SOLUÇÃO (Migration 105):**
```sql
-- Renomear coluna para alinhar com código
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_suggestions' AND column_name = 'suggestion_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_suggestions' AND column_name = 'node_type'
  ) THEN
    ALTER TABLE system_suggestions RENAME COLUMN suggestion_type TO node_type;
  END IF;
END $$;
```

**Lição:** Padronizar nomenclatura ANTES de criar migration. Se já existe conflito, criar migration de alinhamento.

### Erro 10: Tipos Desatualizados no Frontend (TypeScript)

**Problema encontrado:** Migration 104 adiciona `'subsystem'` ao `node_type`, mas frontend tem tipo hardcoded sem `'subsystem'`.

**Sintoma (GitHub Actions):**
```
deploy-beta
Interface 'TreeNode' incorrectly extends interface 'System'.
Type 'System | null' is not assignable to parameter of type '{ ... node_type: "variant" | "system" | "edition" ... }'.
```

**Causa raiz:**
```typescript
// backend/src/db/types.ts (atualizado corretamente)
export interface SystemsTable {
  node_type: 'system' | 'edition' | 'variant' | 'subsystem'; // ✅
}

// frontend/src/modules/admin/systems/types.ts (atualizado corretamente)
export interface System {
  node_type: 'system' | 'edition' | 'variant' | 'subsystem'; // ✅
}

// frontend/src/components/SystemEditModal.tsx (ESQUECIDO!)
interface SystemEditModalProps {
  system: {
    node_type: 'system' | 'edition' | 'variant'; // ❌ Falta 'subsystem'
  } | null;
}

const [nodeType, setNodeType] = useState<'system' | 'edition' | 'variant'>('system'); // ❌
```

**Impacto:**
- Build do frontend falha no GitHub Actions
- Deploy é bloqueado
- Erro só aparece no CI/CD, não localmente (se não rodar `tsc`)

✅ **SOLUÇÃO:**

**1. Checklist obrigatório ao alterar enums/tipos:**

```bash
# Após criar migration que altera enum (ex: node_type)
# 1. Atualizar backend/src/db/types.ts
# 2. Buscar TODAS as ocorrências no frontend
grep -r "node_type.*system.*edition.*variant" frontend/src/

# 3. Atualizar TODOS os arquivos encontrados
# 4. Rodar TypeScript no frontend
cd frontend && npx tsc --noEmit

# 5. Rodar TypeScript no backend
cd backend && npx tsc --noEmit
```

**2. Arquivos que SEMPRE verificar ao alterar `node_type`:**

| Arquivo | O que verificar |
|---|---|
| `backend/src/db/types.ts` | Interface `SystemsTable` |
| `frontend/src/modules/admin/systems/types.ts` | Interface `System` |
| `frontend/src/components/SystemEditModal.tsx` | Interface `SystemEditModalProps` + `useState` |
| `frontend/src/modules/admin/systems/SystemsTree.tsx` | Interface `TreeNode extends System` |
| `frontend/src/modules/admin/systems/SystemsPage.tsx` | Interface `TreeNode extends System` |

**3. Pattern para buscar tipos inline:**

```bash
# Buscar definições inline de node_type
grep -rn "node_type.*:.*'system'" frontend/src/ | grep -v "subsystem"

# Buscar useState com tipos restritos
grep -rn "useState<.*system.*edition.*variant" frontend/src/
```

**4. Adicionar opção no select (se aplicável):**

```tsx
// ✅ Sempre adicionar nova opção no formulário
<select value={nodeType} onChange={...}>
  <option value="system">Sistema Base</option>
  <option value="edition">Edição</option>
  <option value="variant">Variante</option>
  <option value="subsystem">Subsistema</option> {/* NOVO */}
</select>
```

**Lição crítica:** Mudanças estruturais em enums/tipos exigem sincronização em **3 camadas**:
1. **Schema (SQL)** - Migration
2. **Backend (TypeScript)** - `types.ts`
3. **Frontend (TypeScript)** - Múltiplos arquivos (types, modals, forms)

**Prevenção:**
- Sempre rodar `npx tsc --noEmit` em backend E frontend antes de commit
- Adicionar hook pre-commit para validar TypeScript
- Documentar tipos canônicos em `ARQUITETURA_PROJETO.md`

---

## Comandos SQL Seguros

### ADD COLUMN

```sql
-- ✅ Sempre usar IF NOT EXISTS
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;

-- ✅ Com default para evitar NULL em registros existentes
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT 'value';

-- ✅ Arrays com default vazio
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
```

### CREATE TABLE

```sql
-- ✅ Sempre usar IF NOT EXISTS
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ... outros campos
);

-- ✅ Foreign keys com ON DELETE
CREATE TABLE IF NOT EXISTS child_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_table(id) ON DELETE CASCADE,
  -- ON DELETE CASCADE: deleta filho quando pai é deletado
  -- ON DELETE SET NULL: seta NULL quando pai é deletado
);
```

### CREATE INDEX

```sql
-- ✅ Sempre usar IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- ✅ Índice GIN para JSONB
CREATE INDEX IF NOT EXISTS idx_metadata_gin ON table_name USING gin(metadata);

-- ✅ Índice parcial (só registros específicos)
CREATE INDEX IF NOT EXISTS idx_pending 
  ON table_name(status) 
  WHERE status = 'pending';
```

### DROP CONSTRAINT

```sql
-- ✅ Sempre verificar existência antes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name') THEN
    ALTER TABLE table_name DROP CONSTRAINT constraint_name;
    RAISE NOTICE 'Dropped constraint: constraint_name';
  END IF;
END $$;
```

### RENAME COLUMN

```sql
-- ✅ Verificar se coluna antiga existe e nova não existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'old_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'new_name'
  ) THEN
    ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
    RAISE NOTICE 'Renamed column: old_name -> new_name';
  END IF;
END $$;
```

---

## Validação e Idempotência

### Bloco de Validação Obrigatório

**Toda migration DEVE terminar com validação:**

```sql
DO $$
BEGIN
  -- Validar colunas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'column_name'
  ) THEN
    RAISE EXCEPTION 'Migration XXX failed: column not created';
  END IF;
  
  -- Validar tabelas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'table_name'
  ) THEN
    RAISE EXCEPTION 'Migration XXX failed: table not created';
  END IF;
  
  -- Validar constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'constraint_name' 
    AND conrelid = 'table_name'::regclass
  ) THEN
    RAISE EXCEPTION 'Migration XXX failed: constraint not created';
  END IF;
  
  -- Validar índices
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'table_name' AND indexname = 'index_name'
  ) THEN
    RAISE EXCEPTION 'Migration XXX failed: index not created';
  END IF;
  
  RAISE NOTICE 'Migration XXX completed successfully';
END $$;
```

### Teste de Idempotência

**Sempre rodar migration 2x:**

```bash
# Primeira execução
psql -f migration_XXX.sql
# Deve executar com sucesso

# Segunda execução (teste de idempotência)
psql -f migration_XXX.sql
# Deve executar com sucesso SEM erros
```

---

## Aplicação de Migrations

### Ambiente Local (Beta)

```bash
# 1. Copiar migration para servidor
scp -F C:\projetos\config database/migration_XXX.sql faren:/tmp/

# 2. Copiar para container
ssh -F C:\projetos\config faren "docker cp /tmp/migration_XXX.sql mesas-beta-db:/tmp/"

# 3. Aplicar migration
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /tmp/migration_XXX.sql"

# 4. Testar idempotência (rodar novamente)
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /tmp/migration_XXX.sql"

# 5. Verificar resultado
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d table_name'"
```

### Comandos Úteis de Verificação

```bash
# Ver constraints de uma tabela
psql -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'table_name'::regclass;"

# Ver colunas de uma tabela
psql -c "\d table_name"

# Ver índices de uma tabela
psql -c "\di table_name*"

# Ver todas as tabelas
psql -c "\dt"
```

---

## Checklist Pré-Deploy

### Antes de Aplicar em Beta

- [ ] Migration tem nome descritivo (`migration_XXX_descricao.sql`)
- [ ] Usa `IF NOT EXISTS` em todos os comandos
- [ ] Tem bloco de validação no final
- [ ] Testada localmente (se possível)
- [ ] `backend/src/db/types.ts` atualizado
- [ ] `npx tsc --noEmit` passou sem erros (backend)
- [ ] Documentada na sessão ativa

### Antes de Aplicar em Produção

- [ ] Aplicada e validada em beta
- [ ] Testada idempotência (rodou 2x sem erro)
- [ ] Backup criado via `PRE_DEPLOY_CHECKLIST.md`
- [ ] Rollback documentado
- [ ] Sem operações destrutivas (`DROP`, `TRUNCATE`, `DELETE`)
- [ ] Changelog atualizado (se mudança visível ao usuário)
- [ ] Aprovação explícita do responsável

---

## Rollback e Recuperação

### Estratégias de Rollback

**1. Rollback via Migration Reversa**

```sql
-- migration_108_rollback_107.sql
-- Reverte migration 107

-- Remove tabela criada
DROP TABLE IF EXISTS scenario_aliases;

-- Remove colunas adicionadas
ALTER TABLE scenarios DROP COLUMN IF EXISTS description;
ALTER TABLE scenario_suggestions DROP COLUMN IF EXISTS subgenres;
```

**2. Rollback via Restore de Backup**

```bash
# Restaurar backup completo
pg_restore -U admin -d mesas_rpg /path/to/backup.dump

# Restaurar apenas uma tabela
pg_restore -U admin -d mesas_rpg -t table_name /path/to/backup.dump
```

### Quando Fazer Rollback

**Fazer rollback imediatamente se:**
- Migration causa erro em produção
- Performance degrada significativamente
- Dados são corrompidos
- Aplicação quebra após deploy

**Não fazer rollback se:**
- Migration aplicou com sucesso mas código tem bug (corrigir código)
- Mudança é cosmética e não afeta funcionamento

---

## Boas Práticas Adicionais

### 1. Comentários Descritivos

```sql
-- ✅ BOM: Explica o porquê
-- Adiciona description em scenarios para permitir que usuários
-- forneçam contexto completo ao sugerir cenários.
-- Exemplo: "Forgotten Realms - Cenário de alta fantasia..."
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description TEXT;

-- ❌ RUIM: Apenas repete o código
-- Adiciona coluna description
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description TEXT;
```

### 2. Agrupar Mudanças Relacionadas

```sql
-- ✅ BOM: Uma migration para mudanças relacionadas
-- Migration 107: Suporte completo a aliases e metadados de cenários
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE scenario_suggestions ADD COLUMN IF NOT EXISTS subgenres TEXT[];
CREATE TABLE IF NOT EXISTS scenario_aliases (...);

-- ❌ RUIM: Três migrations separadas para mudanças relacionadas
-- migration_107_scenarios_description.sql
-- migration_108_scenario_suggestions_subgenres.sql
-- migration_109_scenario_aliases_table.sql
```

### 3. Defaults Sensatos

```sql
-- ✅ BOM: Default que faz sentido
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS subgenres TEXT[] DEFAULT '{}';

-- ❌ RUIM: NOT NULL sem default (falha em registros existentes)
ALTER TABLE notifications ADD COLUMN metadata JSONB NOT NULL;
```

### 4. Ordem de Execução

```sql
-- ✅ BOM: Ordem lógica
-- 1. Criar tabelas
CREATE TABLE IF NOT EXISTS parent_table (...);
CREATE TABLE IF NOT EXISTS child_table (...); -- FK para parent

-- 2. Adicionar colunas
ALTER TABLE table_name ADD COLUMN ...;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS ...;

-- 4. Adicionar constraints
ALTER TABLE table_name ADD CONSTRAINT ...;

-- 5. Validar
DO $$ ... END $$;
```

### 5. Documentação com COMMENT

**Boa prática encontrada na Migration 11:**

```sql
-- ✅ BOM: Documentar campos complexos
COMMENT ON COLUMN systems.parent_id IS 'FK para sistema pai — edição aponta para base, variante aponta para edição. NULL para sistemas base.';
COMMENT ON COLUMN systems.node_type IS 'Tipo do nó na hierarquia: system (base), edition (edição), variant (variante)';
COMMENT ON COLUMN systems.depth IS 'Profundidade na hierarquia: 0=sistema base, 1=edição, 2=variante';
COMMENT ON COLUMN systems.path_slug IS 'Caminho completo slugificado para identificação única (ex: dungeons-dragons/5e/2024)';
```

**Quando usar:**
- Campos com lógica de negócio complexa
- Campos com valores específicos (enums)
- Campos com formato específico (ex: path_slug)
- Campos que podem causar confusão

**Benefício:** Documentação fica no banco, visível em ferramentas como pgAdmin, DBeaver, etc.

### 6. Índices Especiais

**GIN para Full-Text Search (Migration 11):**

```sql
-- ✅ Índice GIN para busca em português
CREATE INDEX IF NOT EXISTS idx_systems_name_gin 
  ON systems USING gin(to_tsvector('portuguese', name));

-- Permite queries como:
-- SELECT * FROM systems WHERE to_tsvector('portuguese', name) @@ to_tsquery('portuguese', 'dragões');
```

**GIN para JSONB (Migration 106):**

```sql
-- ✅ Índice GIN para queries em JSONB
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin
  ON notifications USING gin(metadata);

-- Permite queries como:
-- SELECT * FROM notifications WHERE metadata->>'system_id' = 'uuid';
-- SELECT * FROM notifications WHERE metadata @> '{"suggestion_kind": "system"}';
```

**GIN para Arrays:**

```sql
-- ✅ Índice GIN para busca em arrays
CREATE INDEX IF NOT EXISTS idx_scenarios_subgenres_gin
  ON scenarios USING gin(subgenres);

-- Permite queries como:
-- SELECT * FROM scenarios WHERE subgenres @> ARRAY['Alta Fantasia'];
```

---

## Histórico de Migrations

### Migration 06 (Original)
- **Objetivo:** Criar tabela `system_suggestions` e `notifications`
- **Problema:** Usou `suggestion_type` em vez de `node_type` (conflito com código)
- **Aprendizado:** Alinhar nomenclatura entre schema e código ANTES de criar migration
- **Correção:** Migration 105 renomeou coluna

### Migration 11 (Original)
- **Objetivo:** Adicionar hierarquia a `systems` (parent_id, node_type, depth, path_slug)
- **Problema:** Usou `TRUNCATE TABLE systems CASCADE` sem validação
- **Aprendizado:** NUNCA usar TRUNCATE em migration de produção sem backup explícito
- **Boa prática:** Usou `COMMENT ON COLUMN` para documentar campos complexos
- **Boa prática:** Criou índice GIN para full-text search em português
- **Problema:** Criou constraint `check_node_type` que conflita com M02

### Migration 18 (Original)
- **Objetivo:** Remover campos legados do Imgur
- **Boa prática:** Usou `BEGIN/COMMIT` para operações atômicas
- **Boa prática:** Usou `DROP ... IF EXISTS` para idempotência
- **Aprendizado:** Transações são essenciais para múltiplas operações destrutivas

### Migration 104 (18/04/2026)
- **Objetivo:** Unificar constraints conflitantes de `node_type` em `systems`
- **Problema resolvido:** M02 e M11 criaram constraints diferentes
- **Aprendizado:** Sempre verificar constraints existentes antes de adicionar novas
- **Comando útil:** `SELECT conname FROM pg_constraint WHERE conrelid = 'systems'::regclass;`
- **Técnica:** DROP ambas constraints antigas, ADD única constraint unificada

### Migration 105 (18/04/2026)
- **Objetivo:** Alinhar `system_suggestions` com contrato real do código
- **Problema resolvido:** `suggestion_type` vs `node_type` (conflito M06)
- **Aprendizado:** RENAME COLUMN precisa verificar existência de ambas as colunas
- **Erro evitado:** Tentar renomear coluna que já foi renomeada
- **Campos adicionados:** `rejection_reason`, `user_notified`, `updated_at`

### Migration 106 (18/04/2026)
- **Objetivo:** Adicionar `action_url` e `metadata` JSONB em `notifications`
- **Problema resolvido:** Notificações sem caminho de ação (dead-end operacional)
- **Aprendizado:** Índice GIN é essencial para queries em JSONB
- **Comando:** `CREATE INDEX USING gin(metadata)`
- **Pattern:** JSONB para metadados estruturados evita parsing de strings

### Migration 107 (18/04/2026)
- **Objetivo:** Suporte completo a aliases, description e subgenres
- **Problema resolvido:** Dados perdidos ao aprovar sugestões
- **Aprendizado:** Tabelas de aliases devem ter UNIQUE(parent_id, alias_slug)
- **Pattern:** Tabela separada para aliases (normalização)
- **Campos adicionados:** `scenarios.description`, `scenario_suggestions.subgenres`
- **Tabela criada:** `scenario_aliases` (similar a `system_aliases`)

---

## Gestão de Migrations Duplicadas

### Problema: Numeração Conflitante

**Situação atual do projeto:**
```
migration_104_drop_tables_frequency_columns.sql  (antiga)
migration_104_unify_node_type_check.sql          (nova - auditoria)
migration_105_communication_platforms.sql        (antiga)
migration_105_system_suggestions_align.sql       (nova - auditoria)
```

### Solução: Renumeração Estratégica

**Opção 1: Manter ambas (se já aplicadas em produção)**
```bash
# Renomear migrations antigas para números livres
mv migration_104_drop_tables_frequency_columns.sql migration_110_drop_tables_frequency_columns.sql
mv migration_105_communication_platforms.sql migration_111_communication_platforms.sql

# Atualizar documentação
# Adicionar nota no CHANGELOG sobre renumeração
```

**Opção 2: Consolidar (se ainda não aplicadas)**
```bash
# Mesclar migrations relacionadas em uma única
# Ex: 104 + 110 → nova 104 consolidada
```

### Prevenção: Checklist Antes de Criar Migration

```bash
# 1. Verificar último número usado
ls database/migration_*.sql | sort -V | tail -n 1

# 2. Verificar se número desejado já existe
ls database/migration_104_*.sql

# 3. Se existir, usar próximo número disponível
# Ex: se 104 existe, usar 108 (próximo livre)

# 4. Documentar na sessão qual número foi usado
```

### Convenção Atualizada

**Faixas de numeração:**
- **1-50:** Schema base e features principais
- **51-99:** Features secundárias e integrações
- **100-109:** Ajustes e correções (primeira leva)
- **110-199:** Ajustes e correções (segunda leva)
- **200+:** Refactors e migrações grandes

**Regra:** Sempre usar próximo número sequencial disponível na faixa apropriada.

---

## Recursos Úteis

### Documentação PostgreSQL
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [Information Schema](https://www.postgresql.org/docs/current/information-schema.html)

### Comandos de Diagnóstico

```sql
-- Ver tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver queries lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Ver locks ativos
SELECT * FROM pg_locks WHERE NOT granted;
```

---

## Contato e Suporte

**Em caso de dúvida:**
1. Consultar este guia
2. Verificar `ERRORS_SOLUTIONS.md` para erros conhecidos
3. Consultar sessões em `/sessoes/` para exemplos práticos
4. Revisar `docs/auditoria_sistemas_claude.md` para decisões arquiteturais

**Antes de aplicar migration em produção:**
- Sempre seguir `PRE_DEPLOY_CHECKLIST.md`
- Sempre ter backup validado
- Sempre testar em beta primeiro

---

**Última atualização:** 18/04/2026  
**Próxima revisão:** Após próxima migration complexa
