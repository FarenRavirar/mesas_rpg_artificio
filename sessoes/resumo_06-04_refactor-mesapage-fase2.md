# Sessão: Refatoração MesaPage - Fase 2 (Continuação)

## 🎯 Objetivo da Sessão

Continuar a refatoração modular da MesaPage, substituindo os blocos restantes (Hero, Schedules, Content, Master, Security, Technical) pelos componentes modulares já criados.

---

## 📍 Estado Atual (06/04/2026)

### ✅ Concluído nas Sessões Anteriores

**Arquitetura Modular Completa:**
- ✅ `features/table/` estrutura criada
- ✅ ViewModel + Decision Engine implementado
- ✅ 7 componentes atômicos criados
- ✅ 3 blocos compostos criados
- ✅ TableView container criado
- ✅ Build passando

**Refatoração MesaPage:**
- ✅ **Fase 1:** ViewModel integrado (linha 80)
- ✅ **Fase 2.1:** TableActionPanel substituído (linha 758)
  - Aside de 72 linhas → 1 linha com componente
  - MesaPage: 839 → 762 linhas (-77 linhas, -9%)

**Commits:**
1. `feat(UX): implement Decision Hero + extensible badge system`
2. `fix(build): remove unused import to fix deployment`
3. `feat(architecture): implement modular Table feature with Decision Engine`
4. `refactor(MesaPage): replace aside with TableActionPanel (Phase 2.1)`

**Branch:** `dev`  
**Deploy:** Beta atualizado (`mesasbeta.artificiorpg.com`)

---

## ⏳ Próximos Passos (Fase 2 Continuação)

### Blocos a Substituir (em ordem)

1. **TableHero** (substituir hero section ~linha 120-180)
2. **TableSchedules** (substituir horários ~linha 189-260)
3. **TableContent** (substituir conteúdo narrativo)
4. **TableMaster** (substituir seção do mestre)
5. **TableSecurity** (substituir segurança)
6. **TableTechnical** (substituir detalhes técnicos)

### Meta Final
- MesaPage: 762 linhas → ~80-120 linhas (redução de ~85%)
- Toda lógica movida para componentes reutilizáveis

---

## 🔧 Estratégia de Execução (SEGUIR RIGOROSAMENTE)

### Regras de Ouro

1. **Um bloco por vez** - nunca refatorar múltiplos blocos simultaneamente
2. **Build após cada substituição** - validar antes de continuar
3. **Commit incremental** - commit após cada bloco substituído
4. **Limpar imports** - remover imports não usados após cada substituição

### Ordem de Substituição (do plano original)

```
1. Aside (✅ CONCLUÍDO)
2. Hero (⏳ PRÓXIMO)
3. Schedules
4. Content
5. Master
6. Security
7. Technical
```

### Template de Substituição

Para cada bloco:

```tsx
// ANTES (exemplo Hero):
<section id="hero">
  ...100 linhas...
</section>

// DEPOIS:
{vm && <TableHero vm={vm} variant="full" />}
```

**Checklist por bloco:**
- [ ] Adicionar import do componente
- [ ] Substituir bloco antigo pelo componente
- [ ] Remover imports não usados
- [ ] Validar build (`npm run build`)
- [ ] Commit incremental

---

## 📂 Arquivos Relevantes

### Componentes Disponíveis (já criados)
- `features/table/components/TableHero.tsx`
- `features/table/components/TableActionPanel.tsx` (✅ já usado)
- `features/table/components/TableSchedules.tsx`
- `features/table/components/TableContent.tsx`
- `features/table/components/TableMaster.tsx`
- `features/table/components/TableSecurity.tsx`
- `features/table/components/TableTechnical.tsx`

### Arquivo Alvo
- `frontend/src/pages/MesaPage.tsx` (762 linhas atualmente)

### ViewModel
- Hook: `useTableViewModel` (já integrado na linha 80)
- Variável: `vm` (disponível para uso)

---

## 🚨 Armadilhas a Evitar

1. ❌ **Não refatorar tudo de uma vez** - vai quebrar e você não saberá onde
2. ❌ **Não misturar `table` e `vm`** - sempre usar `vm` nos novos componentes
3. ❌ **Não passar props individuais** - sempre passar `vm` completo
4. ❌ **Não duplicar lógica** - tudo vem do ViewModel

---

## 📋 Checklist de Validação (Após Concluir Todos os Blocos)

Antes de considerar a refatoração completa:

- [ ] CTA funciona (scroll para contato)
- [ ] Urgência de vagas correta
- [ ] Horários aparecem
- [ ] DDAL e Covil aparecem corretamente
- [ ] Nenhum "Não informado" na UI
- [ ] Build passando
- [ ] Todos os imports limpos
- [ ] MesaPage com ~80-120 linhas

---

## 🎯 Prompt para Iniciar a Sessão

```
Continuar refatoração modular da MesaPage (Fase 2).

Estado atual:
- Fase 1 concluída (ViewModel integrado)
- Fase 2.1 concluída (TableActionPanel substituído)
- MesaPage: 762 linhas (meta: ~80-120 linhas)

Próximo bloco: TableHero (substituir hero section)

Estratégia:
1. Adicionar import de TableHero
2. Localizar hero section (~linha 120-180)
3. Substituir por: {vm && <TableHero vm={vm} variant="full" />}
4. Remover imports não usados
5. Validar build
6. Commit incremental

Seguir ordem: Hero → Schedules → Content → Master → Security → Technical

Arquivo: frontend/src/pages/MesaPage.tsx
ViewModel disponível: vm (linha 80)

Executar bloco por bloco, validando build após cada substituição.
```

---

## 📊 Métricas de Progresso

| Bloco | Status | Linhas Removidas | Commit |
|-------|--------|------------------|--------|
| TableActionPanel | ✅ Concluído | -77 | cfd892a |
| TableHero | ⏳ Próximo | ~60 | - |
| TableSchedules | ⏳ Pendente | ~70 | - |
| TableContent | ⏳ Pendente | ~150 | - |
| TableMaster | ⏳ Pendente | ~20 | - |
| TableSecurity | ⏳ Pendente | ~40 | - |
| TableTechnical | ⏳ Pendente | ~200 | - |
| **Total** | **13%** | **-77 / -617** | - |

---

## 🔗 Referências

- Plano original: `implementation_plan.md` (sessão anterior)
- Arquitetura: `ARQUITETURA_PROJETO.md`
- Governança: `AGENTS.md`
- Walkthrough anterior: `walkthrough.md` (sessão anterior)

---

## ⚡ Comando Rápido para Validação

```bash
# Build
cd frontend && npm run build

# Commit incremental (após cada bloco)
git add frontend/src/pages/MesaPage.tsx
git commit -m "refactor(MesaPage): replace [BLOCO] with [COMPONENTE] (Phase 2.X)"

# Deploy (após todos os blocos)
git push origin dev
```

---

## 🎓 Lições Aprendidas

1. **Substituição incremental funciona** - TableActionPanel foi substituído com sucesso
2. **Build valida cada passo** - erros detectados imediatamente
3. **Imports devem ser limpos** - evita warnings e mantém código limpo
4. **ViewModel isola lógica** - componentes não decidem, apenas renderizam

---

**Última atualização:** 06/04/2026 00:09  
**Próxima ação:** Substituir TableHero
