# Guia de Migrations

**Última atualização:** 18/04/2026

---

## Regras de Ouro

1. **Idempotência:** Toda migration roda 2x sem erro
2. **IF NOT EXISTS:** Sempre usar em ALTER/CREATE/DROP
3. **Tipos sincronizados:** Backend + Frontend sempre alinhados
4. **Testar em beta:** Nunca aplicar direto em produção

---

## Template de Migration

```sql
-- Migration XXX: [Título]
-- Problema: [O que está errado]
-- Solução: [O que será feito]

-- 1. Mudanças
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT 'value';
CREATE TABLE IF NOT EXISTS new_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- 2. Validação
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

---

## Checklist Pré-Deploy

### 1. SQL (Migration)
- [ ] Nome: `migration_XXX_descricao.sql`
- [ ] Todos os comandos usam `IF NOT EXISTS`
- [ ] Bloco de validação no final
- [ ] Sem `TRUNCATE`, `DROP`, `DELETE` sem proteção
- [ ] Defaults sensatos: `DEFAULT '{}'::jsonb`, `DEFAULT '{}'`

### 2. Backend (TypeScript)
- [ ] Atualizar `backend/src/db/types.ts`
- [ ] Adicionar novos campos/tabelas
- [ ] Se alterou ENUM: buscar TODAS as ocorrências
  ```bash
  grep -rn "node_type.*:" backend/src/
  ```
- [ ] Rodar TypeScript:
  ```bash
  cd backend && npx tsc --noEmit
  ```

### 3. Frontend (TypeScript)
- [ ] Se alterou ENUM: buscar definições inline
  ```bash
  grep -rn "node_type.*:.*'system'" frontend/src/
  ```
- [ ] Atualizar TODOS os arquivos:
  - `frontend/src/modules/admin/systems/types.ts`
  - `frontend/src/components/SystemEditModal.tsx`
  - `frontend/src/types/systems.ts`
  - Qualquer `useState<'system' | 'edition'>`
- [ ] Adicionar opção em `<select>` se aplicável
- [ ] Rodar TypeScript:
  ```bash
  cd frontend && npx tsc --noEmit
  ```

### 4. Aplicar em Beta
```bash
# Copiar
scp -F C:\projetos\config database/migration_XXX.sql faren:/tmp/
ssh -F C:\projetos\config faren "docker cp /tmp/migration_XXX.sql mesas-beta-db:/tmp/"

# Aplicar
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /tmp/migration_XXX.sql"

# Testar idempotência (rodar 2x)
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /tmp/migration_XXX.sql"
```

### 5. Commit e Push
```bash
git add database/migration_XXX.sql backend/src/db/types.ts frontend/src/...
git commit -m "feat(migration): [descrição]"
git push origin dev
```

### 6. Validar Deploy
- [ ] GitHub Actions passou
- [ ] Containers rodando: `docker ps --filter name=mesas-beta`
- [ ] API respondendo: `curl https://mesasbeta.artificiorpg.com/api/v1/health`
- [ ] Testar funcionalidade afetada

---

## Erros Comuns

### Erro: "Interface 'TreeNode' incorrectly extends interface 'System'"

**Causa:** Alterou enum mas esqueceu frontend.

**Solução:**
```bash
# Buscar TODAS as ocorrências
grep -rn "node_type.*:" frontend/src/

# Atualizar TODOS os arquivos
# Rodar tsc no frontend
cd frontend && npx tsc --noEmit

# Se ainda falhar: commit vazio para forçar rebuild
git commit --allow-empty -m "chore: force rebuild"
git push origin dev
```

---

### Erro: "Types of property 'X' are incompatible"

**Causa:** Campo obrigatório em um tipo, opcional em outro.

**Solução:**
1. Tornar campo opcional em TODOS os tipos
2. Adicionar verificações de segurança:
   ```typescript
   node.children?.some()  // Optional chaining
   node.aliases ?? []     // Nullish coalescing
   if (node.children) {}  // Verificação explícita
   ```

---

### Erro: Migration falha na 2ª execução

**Causa:** Falta `IF NOT EXISTS`.

**Solução:** Criar migration de correção com `IF NOT EXISTS`.

---

## Comandos Úteis

### Verificar Estado do Banco
```bash
# Ver constraints
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c \"SELECT conname FROM pg_constraint WHERE conrelid = 'systems'::regclass;\""

# Ver colunas
ssh -F C:\projetos\config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '\d systems'"
```

### Forçar Rebuild
```bash
git commit --allow-empty -m "chore: force rebuild to clear cache"
git push origin dev
```

---

## Lições Aprendidas

### L01: Sincronização de Tipos (18/04/2026)
- **Problema:** Migration adicionou `'subsystem'` ao enum, mas 3 arquivos frontend não foram atualizados
- **Arquivos esquecidos:** `SystemEditModal.tsx`, `types/systems.ts`, `SystemTreeSelector.tsx`
- **Solução:** Sempre usar grep para encontrar TODAS as ocorrências
- **Prevenção:** Checklist item 3 é obrigatório

### L02: Campos Opcionais (18/04/2026)
- **Problema:** `depth`, `aliases`, `has_children`, `children` eram obrigatórios em um tipo, opcionais em outro
- **Impacto:** 17 erros de TypeScript, deploy bloqueado
- **Solução:** Tornar TODOS opcionais e adicionar verificações de segurança
- **Prevenção:** Sempre usar optional chaining (`?.`) e nullish coalescing (`??`)

---

## Referências Rápidas

| Situação | Comando |
|---|---|
| Último número de migration | `ls database/migration_*.sql \| sort -V \| tail -n 1` |
| Buscar enum no backend | `grep -rn "node_type.*:" backend/src/` |
| Buscar enum no frontend | `grep -rn "node_type.*:" frontend/src/` |
| Testar TypeScript backend | `cd backend && npx tsc --noEmit` |
| Testar TypeScript frontend | `cd frontend && npx tsc --noEmit` |
| Aplicar migration em beta | Ver Checklist item 4 |
| Forçar rebuild | `git commit --allow-empty -m "chore: force rebuild"` |

---

**Última atualização:** 18/04/2026  
**Próxima revisão:** Após próxima migration complexa
