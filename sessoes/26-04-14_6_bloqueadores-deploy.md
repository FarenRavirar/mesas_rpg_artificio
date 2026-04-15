# Sessão: 14-04 — Resolução Bloqueadores Deploy

**Data:** 14/04/2026 03:15 BRT  
**Objetivo:** Resolver 4 bloqueadores identificados no pré-deploy para produção

---

## Bloqueadores Identificados

| ID | Severidade | Descrição | Status |
|---|---|---|---|
| B1 | 🔴 Crítico | Cenários A/B/C/D sem evidência de execução em beta | Pendente |
| B2 | 🔴 Crítico | migration_17_drop_imgur_legacy nunca aplicada em beta + conflito de numeração | Pendente |
| B3 | 🟠 Alta | Changelog ausente para experiência de upload | Pendente |
| B4 | 🟡 Média | CLOUDINARY_INTEGRATION_GUIDE contradiz migration existente | Pendente |

---

## Plano de Execução

### B1 — Validação Cenários A/B/C/D em Beta

1. Acessar https://mesasbeta.artificiorpg.com
2. Criar mesa com upload de banner (Cenário A)
3. Editar mesa existente sem alterar banner (Cenário B)
4. Editar mesa removendo banner (Cenário C)
5. Testar upload com arquivo inválido (Cenário D)
6. Registrar resultado em sessão

### B2 — Resolver Conflito migration_17

1. Renomear `database/migration_17_drop_imgur_legacy.sql` para `migration_18_drop_imgur_legacy.sql`
2. Documentar decisão em ERRORS_SOLUTIONS.md (E136)
3. Avaliar se aplicação em beta é necessária agora ou pode aguardar produção

### B3 — Adicionar Changelog

1. Criar entrada em `database/changelogs.json` sobre nova experiência de upload de imagem
2. Incluir: upload visual com preview, Cloudinary como provedor, fluxo completo

### B4 — Corrigir Guia Cloudinary

1. Atualizar CLOUDINARY_INTEGRATION_GUIDE.md §12 para refletir que migração de remoção existe

---

## Checklist

- [x] B2 — Renomear migration_17 para 18 (já feito anteriormente)
- [x] B2 — Aplicar migration_18 no beta (14/04/2026 03:35)
- [x] B2 — Validar colunas removidas (0 colunas restantes)
- [x] B3 — Adicionar changelog de upload
- [x] B4 — Corrigir guia Cloudinary
- [ ] Atualizar RESUMO_EXECUCAO.md

---

## Critério de Conclusão

- [ ] Beta validado com cenários A/B/C/D funcionando
- [ ] Changelog existente e completo
- [ ] Conflito de nomenclatura resolvido
- [ ] RESUMO_EXECUCAO.md atualizado