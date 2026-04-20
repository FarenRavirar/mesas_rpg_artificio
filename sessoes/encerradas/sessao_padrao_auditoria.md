# Sessão Padrão — Auditoria de Sistemas

**Tipo:** Template de governança para sessões de auditoria técnica  
**Aplicável a:** Todas as sessões com prefixo `auditoria-sistemas-etapa-*`

---

## Regras de Leitura de Arquivos

### Arquivos Core (Leitura Obrigatória no Início)

**Ordem de leitura:**
1. `RESUMO_EXECUCAO.md` — estado atual e próxima ação
2. `AGENTS.md` — governança e protocolo de execução
3. `docs/auditoria_sistemas_claude.md` — matriz de achados (via grep, nunca completo)
4. `docs/sistemas_auditoria_codex.md` — dossiê técnico com evidências de código (suplemento)
5. Sessão ativa em `/sessoes/` — checklist e plano

**Método de leitura:**
```bash
# CORRETO — grep primeiro, depois view_file com range
grep -n "A01" docs/auditoria_sistemas_claude.md
view_file docs/auditoria_sistemas_claude.md --start 48 --end 48

# ERRADO — nunca abrir arquivo completo
view_file docs/auditoria_sistemas_claude.md  # 1182 linhas!
```

### Arquivos de Código (Leitura Sob Demanda)

**Só ler quando:**
- Implementar mudança específica
- Validar contrato de API
- Verificar tipo ou interface

**Método:**
```bash
# CORRETO — grep para localizar, view_file com range
grep -n "handleApprove" frontend/src/pages/GestaoPage.tsx
view_file frontend/src/pages/GestaoPage.tsx --start 118 --end 143

# ERRADO — abrir arquivo completo sem necessidade
view_file frontend/src/pages/GestaoPage.tsx
```

---

## Regras de Atualização Durante Implementação

### Protocolo de Atualização Incremental

**A cada subtarefa concluída:**
1. Marcar item no checklist da sessão como `[x]`
2. **Se o item resolve um problema da matriz:** atualizar `docs/auditoria_sistemas_claude.md` marcando o problema como resolvido

**Formato de marcação no documento de auditoria:**

```markdown
| **A01** | CRÍTICO | ... | ... | Migration `104_unify_node_type_check.sql` ... | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026) |
```

**Quando atualizar:**
- ✅ Migration aplicada e validada → marcar problema
- ✅ Rota implementada e testada → marcar problema
- ✅ Tipo frontend atualizado e `tsc` passou → marcar problema
- ❌ Código escrito mas não testado → **NÃO marcar ainda**

### Checklist da Sessão

**Atualizar em tempo real:**
```markdown
### Migrations
- [x] Criar `database/migration_104_unify_node_type_check.sql`
- [x] Criar `database/migration_105_system_suggestions_align.sql`
- [/] Criar `database/migration_106_notifications_action_metadata.sql`  # em progresso
- [ ] Validar idempotência das migrations
```

**Símbolos:**
- `[ ]` — não iniciado
- `[/]` — em progresso
- `[x]` — concluído

---

## Regras de Atualização nos Arquivos da Sessão

### Estrutura Obrigatória

Toda sessão de auditoria DEVE conter:

1. **Cabeçalho**
   - Data, objetivo (1-2 frases)
   - Vínculos (sessão anterior e próxima)

2. **Contexto**
   - Referência aos documentos de auditoria
   - Matriz de problemas (resumida)

3. **Decisões Consolidadas**
   - Todas as decisões técnicas tomadas
   - Justificativas quantificáveis
   - Contratos de API explícitos

4. **Plano de Execução**
   - Seções numeradas (1, 2, 3...)
   - Código SQL/TypeScript inline quando aplicável
   - Erros estruturados documentados

5. **Checklist de Execução**
   - Agrupado por tipo (Migrations, Backend, Frontend, Validação, Documentação)
   - Item obrigatório: `[ ] Atualizar docs/auditoria_sistemas_claude.md marcando problemas resolvidos`

6. **Arquivos que Serão Modificados**
   - Separado em "Novos" e "Modificados"
   - Comentário breve sobre o que muda

7. **Critério de Conclusão**
   - Condições explícitas para considerar sessão completa
   - Validações obrigatórias

### Atualização de Status

**Ao concluir a sessão:**
1. Todos os itens do checklist `[x]`
2. `RESUMO_EXECUCAO.md` atualizado com campo "Última Sessão"
3. `sessoes/index.md` atualizado com nova sessão
4. **Aguardar confirmação do usuário** antes de mover para `/sessoes/encerradas/`

---

## Leitura dos Arquivos Core

### `docs/auditoria_sistemas_claude.md`

**Estrutura:**
- Linhas 1-43: Método e mapa de arquivos
- Linhas 44-68: Matriz de achados (A01-A20)
- Linhas 69+: Diagnóstico detalhado por problema

**Como ler:**
```bash
# Localizar problema específico
grep -n "A03" docs/auditoria_sistemas_claude.md

# Ler só a linha da matriz
view_file docs/auditoria_sistemas_claude.md --start 50 --end 50

# Ler diagnóstico detalhado (se necessário)
grep -n "PROB-03" docs/auditoria_sistemas_claude.md
view_file docs/auditoria_sistemas_claude.md --start X --end Y
```

**Quando atualizar:**
- Problema resolvido → adicionar `✅ **RESOLVIDO** — Sessão X (data)` na coluna "Correção"
- Decisão técnica tomada → adicionar `**Decisão:** ...` na coluna "Correção"

### `docs/sistemas_auditoria_codex.md`

**Estrutura:**
- Dossiê técnico com evidências de código
- Complementa `auditoria_sistemas_claude.md`

**Como ler:**
```bash
# Buscar evidência específica
grep -n "systemSuggestionsAdmin" docs/sistemas_auditoria_codex.md
```

**Quando atualizar:**
- Raramente. Documento é snapshot do estado inicial.
- Só atualizar se descobrir nova evidência crítica durante implementação.

---

## Atualização no Documento de Auditoria

### Formato de Resolução

**Antes:**
```markdown
| **A03** | CRÍTICO | `systemSuggestionsAdmin.ts:33-54` | Handler de `approve` só faz UPDATE do status. **Não cria** o sistema em `systems`. Fluxo de curadoria comunitária é cosmético. | Reescrever em transação com INSERT em `systems`, cópia de aliases, UPDATE status, INSERT em `notifications`. Código pronto na Seção 6. |
```

**Depois:**
```markdown
| **A03** | CRÍTICO | `systemSuggestionsAdmin.ts:33-54` | Handler de `approve` só faz UPDATE do status. **Não cria** o sistema em `systems`. Fluxo de curadoria comunitária é cosmético. | Reescrever em transação com INSERT em `systems`, cópia de aliases, UPDATE status, INSERT em `notifications`. Código pronto na Seção 6. **Decisão:** Resposta de approve muda de `{ success: true }` para `{ success: true, data: { suggestion_id, system_id, path_slug } }`. Frontend `GestaoPage.tsx` (linhas 118-143) precisa patch com fallback retrocompatível. Reject mantém `{ success: true }` (nada materializado). | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026) |
```

### Quando Adicionar Nova Linha

**Se descobrir problema não catalogado:**
1. Adicionar linha na matriz com ID sequencial (A21, A22...)
2. Classificar severidade (CRÍTICO, ALTO, MÉDIO, BAIXO)
3. Documentar evidência (arquivo:linha)
4. Propor correção
5. Avisar usuário da descoberta

---

## Protocolo de Execução

### Fase de Implementação

**Para cada item do plano:**
1. Ler código relevante (grep + view_file com range)
2. Implementar mudança
3. Validar (tsc, smoke test, etc)
4. Atualizar checklist da sessão `[x]`
5. **Se resolve problema da matriz:** atualizar `docs/auditoria_sistemas_claude.md`

### Fase de Validação

**Obrigatório antes de concluir:**
1. `tsc --noEmit` no frontend (zero erros)
2. `tsc --noEmit` no backend (zero erros)
3. Smoke tests manuais documentados
4. Migrations aplicadas e validadas (rodar 2x sem erro)

### Fase de Documentação

**Obrigatório antes de concluir:**
1. `MAPA_DE_API.md` atualizado (se aplicável)
2. `docs/auditoria_sistemas_claude.md` atualizado (problemas resolvidos)
3. `RESUMO_EXECUCAO.md` atualizado
4. `sessoes/index.md` atualizado

---

## Exemplo de Fluxo Completo

### Implementar Migration 104

**1. Ler contexto:**
```bash
grep -n "A01" docs/auditoria_sistemas_claude.md
# Resultado: linha 48
view_file docs/auditoria_sistemas_claude.md --start 48 --end 48
```

**2. Implementar:**
```bash
write_to_file database/migration_104_unify_node_type_check.sql
```

**3. Validar:**
```bash
# Aplicar migration
psql -U admin -d mesas_rpg < database/migration_104_unify_node_type_check.sql
# Aplicar novamente (idempotência)
psql -U admin -d mesas_rpg < database/migration_104_unify_node_type_check.sql
# Verificar constraint
psql -U admin -d mesas_rpg -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'systems'::regclass;"
```

**4. Atualizar checklist da sessão:**
```markdown
- [x] Criar `database/migration_104_unify_node_type_check.sql`
```

**5. Atualizar documento de auditoria:**
```markdown
| **A01** | CRÍTICO | ... | ... | Migration `104_unify_node_type_check.sql` ... | ✅ **RESOLVIDO** — Sessão `26-04-18_1` (18/04/2026) |
```

---

## Regras Pétreas

1. **Nunca abrir arquivo > 500 linhas sem grep primeiro**
2. **Sempre usar view_file com range após grep**
3. **Atualizar checklist em tempo real**
4. **Atualizar documento de auditoria só após validação**
5. **Aguardar confirmação do usuário antes de mover sessão para encerradas**
6. **Toda decisão técnica vai para "Decisões Consolidadas" da sessão E para o documento de auditoria**
7. **Código inline no plano quando < 30 linhas, referência a arquivo quando > 30 linhas**

---

## Checklist de Início de Sessão

Antes de iniciar qualquer trabalho:

- [ ] Ler `RESUMO_EXECUCAO.md` (arquivo completo)
- [ ] Ler `AGENTS.md` (arquivo completo)
- [ ] Localizar problemas relevantes em `docs/auditoria_sistemas_claude.md` via grep
- [ ] Consultar `docs/sistemas_auditoria_codex.md` para evidências técnicas (via grep)
- [ ] Verificar se existe sessão ativa incompleta em `/sessoes/`
- [ ] Se existe sessão ativa: continuar nela (proibido criar nova)
- [ ] Se não existe: criar nova sessão com estrutura obrigatória

---

## Checklist de Conclusão de Sessão

Antes de declarar sessão concluída:

- [ ] Todos os itens do checklist da sessão estão `[x]`
- [ ] `tsc --noEmit` passou no frontend
- [ ] `tsc --noEmit` passou no backend
- [ ] Smoke tests executados e documentados
- [ ] `docs/auditoria_sistemas_claude.md` atualizado com problemas resolvidos
- [ ] `MAPA_DE_API.md` atualizado (se aplicável)
- [ ] `RESUMO_EXECUCAO.md` atualizado
- [ ] `sessoes/index.md` atualizado
- [ ] **Aguardar confirmação do usuário para mover para `/sessoes/encerradas/`**
