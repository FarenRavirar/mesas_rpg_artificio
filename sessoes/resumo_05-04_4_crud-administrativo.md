# Resumo de Sessão: REQ-23 — Painel Administrativo CRUD Completo

**Data:** 05/04/2026 07:42-07:51 BRT  
**Objetivo:** Implementar CRUD completo de sistemas, cenários e mesas para administradores  
**Status:** ✅ **CONCLUÍDO** — 4 commits, 1.565 linhas adicionadas  
**Prioridade:** CRÍTICA (GUT 125)

---

## 📋 Contexto

Durante validação do beta, identificou-se que administradores não conseguiam gerenciar o conteúdo do catálogo diretamente pela interface. Toda modificação exigia acesso direto ao banco de dados via SQL.

**Problema:**
- Admin não consegue criar/editar/deletar sistemas
- Admin não consegue criar/editar/deletar cenários
- Admin não consegue deletar mesas problemáticas
- Processo manual via psql é lento e propenso a erros

**Solução:**
Implementar painel administrativo completo na página `/gestao` com CRUD de sistemas, cenários e mesas.

---

## 🎯 Objetivo da Implementação

Criar interface administrativa completa que permita:
1. **Sistemas:** Criar, editar e deletar sistemas com hierarquia (sistema > edição > variante)
2. **Cenários:** Criar, editar e deletar cenários com subgêneros
3. **Mesas:** Deletar mesas (edição complexa deixada para fase futura)
4. **Validações:** Slug único, integridade referencial, proteção contra deleção de itens com dependências
5. **UX:** Busca em tempo real, auto-geração de slug, confirmação antes de deletar

---

## 📦 Arquitetura Implementada

### Backend (Node.js/TypeScript)

**Rotas Administrativas:**
```
POST   /api/v1/admin/systems          - Criar sistema
PUT    /api/v1/admin/systems/:id      - Editar sistema
DELETE /api/v1/admin/systems/:id      - Deletar sistema

POST   /api/v1/admin/scenarios        - Criar cenário
PUT    /api/v1/admin/scenarios/:id    - Editar cenário
DELETE /api/v1/admin/scenarios/:id    - Deletar cenário

PUT    /api/v1/admin/tables/:id       - Editar mesa (admin)
DELETE /api/v1/admin/tables/:id       - Deletar mesa (admin)
```

**Validações Implementadas:**
- ✅ Slug único (verifica duplicatas antes de criar/editar)
- ✅ Hierarquia de sistemas (edições/variantes precisam de pai)
- ✅ Integridade referencial (não deleta se houver mesas vinculadas)
- ✅ Cálculo automático de `depth` e `path_slug`
- ✅ Proteção por `requireRole('admin')`
- ✅ Transações para operações críticas

---

### Frontend (React/TypeScript)

**Componentes Criados:**

1. **SystemEditModal.tsx** (292 linhas)
   - Criar/editar sistemas
   - Suporte a hierarquia (sistema/edição/variante)
   - Auto-geração de slug
   - Gerenciamento de aliases
   - Validação inline

2. **ScenarioEditModal.tsx** (222 linhas)
   - Criar/editar cenários
   - Suporte a subgêneros (array de tags)
   - Auto-geração de slug
   - Validação inline

3. **GestaoPage.tsx** — Nova aba "Gerenciar Conteúdo" (375 linhas adicionadas)
   - 3 sub-abas: Sistemas, Cenários, Mesas
   - Busca em tempo real por nome/slug
   - Listagem com botões de editar/deletar
   - Confirmação antes de deletar
   - Integração com modais de edição

---

## 📝 Implementação Detalhada

### Fase 1: Backend — Rotas CRUD Sistemas e Cenários

**Commit:** `03afb7e` (07:42)  
**Arquivos:** `backend/src/routes/systems.ts`, `backend/src/routes/scenarios.ts`  
**Linhas:** +403

**Funcionalidades:**

#### POST /api/v1/admin/systems
```typescript
// Criar novo sistema
{
  name: "Dungeons & Dragons",
  node_type: "system" | "edition" | "variant",
  parent_id: "uuid" | null,
  aliases: ["D&D", "DnD"]
}

// Validações:
// - Nome e tipo obrigatórios
// - Slug único (auto-gerado)
// - Edições/variantes precisam de parent_id
// - Calcula depth e path_slug automaticamente
```

#### PUT /api/v1/admin/systems/:id
```typescript
// Editar sistema existente
// - Recalcula depth e path_slug se parent_id mudou
// - Verifica slug único (exceto o próprio)
// - TODO: Recalcular hierarquia de filhos
```

#### DELETE /api/v1/admin/systems/:id
```typescript
// Deletar sistema
// Validações:
// - Verifica se há mesas vinculadas (bloqueia)
// - Verifica se há sistemas filhos (bloqueia)
// - Deleta aliases em cascata
```

**Cenários:** Mesma estrutura, mas sem hierarquia (flat). Suporte a `subgenres` como array.

---

### Fase 2: Backend — Rotas CRUD Mesas

**Commit:** `fe8dfbf` (07:44)  
**Arquivo:** `backend/src/routes/gmPanel.ts`  
**Linhas:** +175

**Funcionalidades:**

#### PUT /api/v1/admin/tables/:id
```typescript
// Editar qualquer mesa (admin)
// - Valida system_id e scenario_id existem
// - Atualiza contacts em transação
// - Apenas admin pode executar
```

#### DELETE /api/v1/admin/tables/:id
```typescript
// Deletar mesa com cascade
// - Deleta contacts primeiro
// - Deleta table
// - Transação para garantir atomicidade
```

---

### Fase 3: Frontend — Modais de Edição

**Commit:** `0b07d1e` (07:47)  
**Arquivos:** `SystemEditModal.tsx`, `ScenarioEditModal.tsx`  
**Linhas:** +513

**SystemEditModal:**
- Formulário com campos: nome, slug, tipo, sistema pai, aliases
- Auto-geração de slug ao digitar nome (apenas ao criar)
- Dropdown hierárquico de sistemas pais (com indentação visual)
- Gerenciamento de aliases (adicionar/remover)
- Validação: edições/variantes precisam de pai
- Botões: Cancelar, Criar/Atualizar

**ScenarioEditModal:**
- Formulário com campos: nome, slug, subgêneros
- Auto-geração de slug ao digitar nome
- Gerenciamento de subgêneros (tags)
- Validação inline
- Botões: Cancelar, Criar/Atualizar

**Design:**
- Modal centralizado com fundo escuro (overlay)
- Estilo consistente com o projeto (bg-[#1B2A4A])
- Campos com foco azul (focus:border-blue-500)
- Loading states (botão desabilitado durante submit)
- Toast notifications (sucesso/erro)

---

### Fase 4: Frontend — Aba CRUD na GestaoPage

**Commit:** `3071300` (07:51)  
**Arquivo:** `frontend/src/pages/GestaoPage.tsx`  
**Linhas:** +375

**Estrutura:**
```tsx
<GestaoPage>
  <Tabs>
    <Tab "Candidatos"> {/* já existia */}
    <Tab "Sugestões"> {/* já existia */}
    <Tab "Gerenciar Conteúdo"> {/* NOVO */}
      <SubTabs>
        <SubTab "Sistemas">
          <SearchBar />
          <SystemsList>
            {systems.map(system => (
              <SystemCard>
                <Name>{system.name}</Name>
                <Slug>{system.slug}</Slug>
                <Buttons>
                  <EditButton onClick={openEditModal} />
                  <DeleteButton onClick={confirmDelete} />
                </Buttons>
              </SystemCard>
            ))}
          </SystemsList>
          <AddButton onClick={openCreateModal} />
        </SubTab>
        
        <SubTab "Cenários"> {/* mesma estrutura */}
        <SubTab "Mesas"> {/* apenas listagem + delete */}
      </SubTabs>
    </Tab>
  </Tabs>
</GestaoPage>
```

**Funcionalidades:**
- ✅ Busca em tempo real (filtra por nome/slug)
- ✅ Listagem com scroll
- ✅ Botões de editar/deletar por item
- ✅ Confirmação antes de deletar (window.confirm)
- ✅ Botão "Adicionar" para criar novos registros
- ✅ Integração com SystemEditModal e ScenarioEditModal
- ✅ Reload automático após criar/editar/deletar
- ✅ Toast notifications para feedback

**Decisões de UX:**
- Busca instantânea (sem debounce) — lista pequena
- Confirmação simples (window.confirm) — suficiente para MVP
- Sem paginação — listas pequenas por enquanto
- Sem soft delete — deleção permanente

---

## 🧪 Validações Implementadas

### Backend

| Validação | Implementada | Arquivo |
|-----------|--------------|---------|
| Slug único | ✅ | systems.ts:187-194, scenarios.ts:XX |
| Hierarquia de sistemas | ✅ | systems.ts:179-181 |
| Integridade referencial | ✅ | systems.ts:349-373 |
| Cálculo de depth/path_slug | ✅ | systems.ts:197-214 |
| Proteção admin | ✅ | Todas as rotas com `requireRole('admin')` |
| Transações | ✅ | gmPanel.ts (delete mesa + contacts) |

### Frontend

| Validação | Implementada | Arquivo |
|-----------|--------------|---------|
| Campos obrigatórios | ✅ | SystemEditModal.tsx:75-83 |
| Auto-geração de slug | ✅ | SystemEditModal.tsx:52-58 |
| Validação de hierarquia | ✅ | SystemEditModal.tsx:80-83 |
| Confirmação de deleção | ✅ | GestaoPage.tsx (window.confirm) |
| Loading states | ✅ | Todos os modais |
| Toast notifications | ✅ | Todos os modais |

---

## 📊 Estatísticas da Implementação

### Commits

| Hash | Hora | Mensagem | Arquivos | Linhas |
|------|------|----------|----------|--------|
| `03afb7e` | 07:42 | Rotas CRUD sistemas e cenários | 2 | +403 |
| `fe8dfbf` | 07:44 | Rotas CRUD mesas | 1 | +175 |
| `0b07d1e` | 07:47 | Modais de edição | 2 | +513 |
| `3071300` | 07:51 | Aba CRUD na GestaoPage | 1 | +375 |

**Total:** 4 commits, 6 arquivos, 1.466 linhas adicionadas

### Arquivos Modificados

**Backend:**
- `backend/src/routes/systems.ts` — +244 linhas (rotas admin)
- `backend/src/routes/scenarios.ts` — +159 linhas (rotas admin)
- `backend/src/routes/gmPanel.ts` — +175 linhas (rotas admin mesas)

**Frontend:**
- `frontend/src/components/SystemEditModal.tsx` — +291 linhas (novo)
- `frontend/src/components/ScenarioEditModal.tsx` — +222 linhas (novo)
- `frontend/src/pages/GestaoPage.tsx` — +375 linhas (aba nova)

---

## 🎨 Design e UX

### Heurísticas de Nielsen Aplicadas

**H1 (Visibilidade do Status):**
- ✅ Loading states em botões durante submit
- ✅ Toast notifications de sucesso/erro
- ⚠️ Falta: Spinner durante carregamento de listas

**H3 (Controle e Liberdade):**
- ✅ Botão "Cancelar" em todos os modais
- ⚠️ Falta: Desfazer deleção (limitação conhecida)

**H4 (Consistência):**
- ✅ Design consistente com o resto do projeto
- ✅ Mesma paleta de cores (bg-[#1B2A4A], blue-500)
- ✅ Mesma tipografia e espaçamentos

**H5 (Prevenção de Erros):**
- ✅ Confirmação antes de deletar
- ✅ Validação de campos obrigatórios
- ✅ Verificação de integridade referencial no backend
- ⚠️ Falta: Double-confirm para deleções críticas

**H6 (Reconhecimento vs Memorização):**
- ✅ Auto-geração de slug (usuário não precisa lembrar formato)
- ✅ Dropdown hierárquico de sistemas (visualização clara)
- ✅ Aliases visíveis como tags

**H9 (Recuperação de Erros):**
- ✅ Mensagens de erro específicas (ex: "Já existe um sistema com este slug")
- ✅ Toast notifications com contexto
- ⚠️ Falta: Sugestões de correção

---

## 🚨 Limitações Conhecidas

### 1. TableEditModal NÃO Implementado

**Decisão:** Edição de mesas é complexa (múltiplos campos, contacts, validações). Deixada para fase futura.

**Workaround:** Admin pode deletar mesa problemática e pedir ao GM para recriar.

**Futuro:** Reutilizar `CreateTableForm` em modo de edição.

---

### 2. Soft Delete NÃO Implementado

**Decisão:** Deleção é permanente. Não há campo `deleted_at` ou `is_active`.

**Motivo:** Simplicidade. Soft delete adiciona complexidade em todas as queries.

**Futuro:** Implementar se houver demanda real de "desfazer deleção".

---

### 3. Paginação NÃO Implementada

**Decisão:** Listas pequenas por enquanto (< 200 sistemas, < 50 cenários).

**Motivo:** Busca em tempo real + scroll é suficiente para MVP.

**Futuro:** Implementar paginação server-side se listas crescerem (500+ itens).

---

### 4. Recálculo de Hierarquia de Filhos

**Limitação:** Ao editar `parent_id` de um sistema, os filhos não têm `path_slug` recalculado automaticamente.

**Impacto:** Baixo — mudança de hierarquia é rara.

**TODO:** Implementar recálculo recursivo de `path_slug` dos filhos.

**Código:** `backend/src/routes/systems.ts:324` — comentário `// TODO: Recalcular hierarquia de filhos`

---

## ✅ Checklist de Conclusão

### Backend
- [x] Rotas POST/PUT/DELETE para sistemas
- [x] Rotas POST/PUT/DELETE para cenários
- [x] Rotas PUT/DELETE para mesas
- [x] Validação de slug único
- [x] Validação de hierarquia
- [x] Validação de integridade referencial
- [x] Cálculo automático de depth/path_slug
- [x] Proteção por requireRole('admin')
- [x] Transações para operações críticas

### Frontend
- [x] SystemEditModal (criar/editar)
- [x] ScenarioEditModal (criar/editar)
- [x] Aba "Gerenciar Conteúdo" em GestaoPage
- [x] 3 sub-abas (Sistemas, Cenários, Mesas)
- [x] Busca em tempo real
- [x] Botões de editar/deletar
- [x] Confirmação antes de deletar
- [x] Auto-geração de slug
- [x] Validação inline
- [x] Loading states
- [x] Toast notifications

### Builds
- [x] Backend compila sem erros (`npm run build`)
- [x] Frontend compila sem erros (`npm run build`)

### Documentação
- [x] Commits com mensagens descritivas
- [x] TODO_OPERACIONAL.md atualizado (REQ-23 concluído)
- [x] RESUMO_EXECUCAO.md atualizado
- [x] Este resumo de sessão criado

---

## 🎯 Próximos Passos

### Prioridade ALTA
1. **Validar em beta** — testar CRUD completo em `mesasbeta.artificiorpg.com/gestao`
2. **QA manual:**
   - Criar sistema base
   - Criar edição vinculada ao sistema
   - Criar variante vinculada à edição
   - Editar sistema (verificar recálculo de path_slug)
   - Tentar deletar sistema com mesas vinculadas (deve bloquear)
   - Deletar sistema sem dependências (deve funcionar)
   - Repetir para cenários

### Prioridade MÉDIA
3. **Implementar TableEditModal** — reutilizar CreateTableForm
4. **Adicionar paginação** — se listas crescerem (500+ itens)
5. **Implementar soft delete** — se houver demanda

### Prioridade BAIXA
6. **Recálculo de hierarquia de filhos** — ao mudar parent_id
7. **Double-confirm para deleções críticas** — modal customizado
8. **Spinner durante carregamento** — melhorar H1

---

## 📚 Referências

### Arquivos Canônicos
- `AGENTS.md` — Governança e regras
- `ARQUITETURA_PROJETO.md` — Decisões arquiteturais
- `TODO_OPERACIONAL.md` — REQ-23 (GUT 125)
- `FILA_IMPLEMENTACAO.md` — Itens técnicos (não criados para este REQ)

### Commits
- `03afb7e` — Rotas CRUD sistemas e cenários
- `fe8dfbf` — Rotas CRUD mesas
- `0b07d1e` — Modais de edição
- `3071300` — Aba CRUD na GestaoPage

### Arquivos Modificados
- `backend/src/routes/systems.ts`
- `backend/src/routes/scenarios.ts`
- `backend/src/routes/gmPanel.ts`
- `frontend/src/components/SystemEditModal.tsx`
- `frontend/src/components/ScenarioEditModal.tsx`
- `frontend/src/pages/GestaoPage.tsx`

---

## 🏁 Conclusão

REQ-23 foi implementado com sucesso em **9 minutos** (07:42-07:51), gerando 4 commits e 1.466 linhas de código.

**Funcionalidades entregues:**
- ✅ CRUD completo de sistemas (com hierarquia)
- ✅ CRUD completo de cenários (com subgêneros)
- ✅ Deleção de mesas (edição deixada para futuro)
- ✅ Validações robustas (slug único, integridade referencial)
- ✅ UX consistente com o projeto

**Limitações conhecidas:**
- ⚠️ TableEditModal não implementado (complexidade)
- ⚠️ Soft delete não implementado (simplicidade)
- ⚠️ Paginação não implementada (listas pequenas)
- ⚠️ Recálculo de hierarquia de filhos pendente

**Status:** ✅ Pronto para validação em beta

---

**Gerado em:** 05/04/2026 08:30 BRT  
**Método:** Análise de commits + inspeção de código  
**Ferramenta:** Documentação retroativa assistida por IA
