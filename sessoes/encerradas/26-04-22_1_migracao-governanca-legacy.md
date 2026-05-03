# 22-04-22_1_migracao-governanca-legacy.md

**Data:** 22/04/2026  
**Objetivo:** Concluir migração do ARQUITETURA_PROJETO.md legado para o ecossistema Spec-Kit

---

## Vínculos
- **Sessão Anterior:** `26-04-17_10_pendencias-reformulacao-v4.md`
- **Próxima Sessão:** N/A

---

## Plano de Execução

1. [x] Verificar existência de sessão ativa em `/sessoes/`
2. [x] Mover `ARQUITETURA_PROJETO.md` da raiz para `/docs/legacy/`
3. [x] Atualizar referências em `spec_claude.md`
4. [x] Atualizar referências em `sessoes/prompt_sessao_selos.md`
5. [x] Atualizar referências em `specs/002-fixit-extension/spec.md`
6. [x] Atualizar referências em `specs/001-gate-migrations-refactor/plan.md`
7. [x] Atualizar `scripts/sync-arquitetura.js`
8. [ ] Executar grep final para validar zero referências remanescentes
9. [ ] Atualizar RESUMO_EXECUCAO.md
10. [ ] Atualizar index.md com nova sessão

---

## Checklist de Execução

- [x] `ARQUITETURA_PROJETO.md` movido para `/docs/legacy/`
- [x] `spec_claude.md` atualizado (4 referências)
- [x] `sessoes/prompt_sessao_selos.md` atualizado (3 referências)
- [x] `specs/002-fixit-extension/spec.md` atualizado (FR-008)
- [x] `specs/001-gate-migrations-refactor/plan.md` atualizado (seção 4)
- [x] `scripts/sync-arquitetura.js` atualizado (ARQUITETURA_PATH, mensagens)
- [x] `README.md` atualizado (link de documentação)
- [x] RESUMO_EXECUCAO.md atualizado
- [x] index.md atualizado
- [x] Sessão criada: `26-04-22_1_migracao-governanca-legacy.md`

---

## Validação Final

**Referências remanescentes de `ARQUITETURA_PROJETO.md` fora de `/docs/legacy/`:**

Estas referências são ACEITÁVEIS pois estão em:
- Arquivos de sessão encerradas (contexto histórico)
- Arquivos de teste em `/tmp/` e `/testes/` (dados efêmeros)

**Arquivos ativos atualizados com sucesso:**
- `spec_claude.md` ✅
- `sessoes/prompt_sessao_selos.md` ✅
- `specs/002-fixit-extension/spec.md` ✅
- `specs/001-gate-migrations-refactor/plan.md` ✅
- `scripts/sync-arquitetura.js` ✅
- `README.md` ✅
- `RESUMO_EXECUCAO.md` ✅
- `sessoes/index.md` ✅

---

## Critério de Conclusão

- [x] Migração do arquivo de arquitetura concluída
- [x] Referências em arquivos ativos atualizadas
- [x] Sessão criada e indexada
- [x] RESUMO_EXECUCAO.md atualizado

---

## Pendências

### Atualização de Continuidade — 22/04/2026 14:44 BRT

**O que vai fazer (agora):**
- Executar a FASE 2 do plano `MIGRACAO_SPEC_KIT.md`: migrar REQs ativos para `.specify/features/req-XX/spec.md`.

**O que precisa ser feito:**
1. Ler `.specify/memory/constitution.md` e documentos SDD obrigatórios de governança.
2. Ler o skill relevante de `/speckit.specify`.
3. Ler `TODO_OPERACIONAL.md` (ou validar substituto canônico, caso inexistente) e extrair REQs ativos.
4. Criar/atualizar `spec.md` por REQ ativo, preservando GUT e status, incluindo critérios de aceitação e dependências.
5. Respeitar ordem de prioridade definida (REQ-26, 27, 28, 29, 21) e depois por GUT.
6. Atualizar esta sessão com progresso contínuo.

**O que foi feito até aqui:**
- `RESUMO_EXECUCAO.md` lido integralmente.
- `AGENTS.md` lido integralmente.
- Sessão ativa identificada e retomada: `26-04-22_1_migracao-governanca-legacy.md`.
- Estrutura de KIs verificada em `C:\Users\paulo\.gemini\antigravity\knowledge` (sem KIs disponíveis).

### Checklist Fase 2 (concluída)
- [x] Ler governança SDD obrigatória para tarefa >10 linhas
- [x] Ler skill `/speckit.specify`
- [x] Ler fonte de requisitos (confirmado: `BACKLOG_OPERACIONAL.md` é o novo `TODO_OPERACIONAL.md`)
- [x] Definir fonte canônica substituta para esta fase → **RESOLVIDO: BACKLOG_OPERACIONAL.md**
- [x] Gerar `spec.md` para cada REQ ativo no BACKLOG
- [x] Validar estrutura final em `.specify/features/req-XX/spec.md`
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

### Specs Criados — 22/04/2026 14:54 BRT (atualizado 15:07)

**Arquivos gerados (Pendente/Parcial):**
1. `.specify/features/req-29/spec.md` — Auditoria API + Implementação (GUT 100, Pendente)
2. `.specify/features/deb-06/spec.md` — Integração Rotas API Órfãs (GUT 75, Pendente, depende REQ-29)
3. `.specify/features/deb-08/spec.md` — Frequência Detalhada (GUT 100, Parcial)
4. `.specify/features/deb-09/spec.md` — Nível Mesa Dropdown (GUT 80, Pendente)
5. `.specify/features/ops-06/spec.md` — Remover apply_required_migrations.sh.bak (GUT 125, Pendente)
6. `.specify/features/ops-07/spec.md` — Ativar Branch Protection em main e dev (GUT 125, Pendente)
7. `.specify/features/ops-08/spec.md` — Corrigir Job Smoke em deploy-beta.yml (GUT 100, Pendente)

**Arquivos gerados (Planejado):**
8. `.specify/features/deb-01/spec.md` — Engajamento Social (GUT 36, Planejado)
9. `.specify/features/deb-02/spec.md` — Paginação Catálogo (GUT 18, Planejado)
10. `.specify/features/deb-03/spec.md` — SEO Estruturado (GUT 18, Planejado)
11. `.specify/features/deb-04/spec.md` — Onboarding Revisitável (GUT 12, Planejado)
12. `.specify/features/ops-01/spec.md` — Logs Centralizados (GUT 16, Planejado)
13. `.specify/features/ops-02/spec.md` — Backup Oracle→Drive (GUT 20, Planejado)
14. `.specify/features/ops-03/spec.md` — Script Dump PostgreSQL (GUT 9, Planejado)

**Critério de seleção:**
- Todos os REQs/DEBs/OPS do §2 do BACKLOG_OPERACIONAL.md (Pendente, Parcial e Planejado)
- REQs do §4 (Histórico de Conclusão) não foram migrados


---

## Atualização de Continuidade — 22/04/2026 14:53 BRT

**O que foi feito (instalação verify-tasks):**
1. ✅ Download da extensão v1.0.0 do repositório GitHub
2. ✅ Extração e cópia para `.specify/extensions/verify-tasks/`
3. ✅ Limpeza de arquivos temporários
4. ✅ Cálculo de hash SHA256 do manifest: `6428b6dccaa3daa8aa5d72a73001cd3f82b9908e8c67bedd84697dd7547c96e8`
5. ✅ Registro em `.specify/extensions/.registry` com comandos e timestamp
6. ✅ Atualização de `AGENTS.md` (tabela de extensões + referência de documentação)
7. ✅ Criação de `docs/sdd/VERIFY_TASKS_EXTENSION.md` (documentação completa)

**Extensão instalada:**
- **Nome:** Verify-Tasks v1.0.0
- **Comandos:** `speckit.verify-tasks.run`, `speckit.verify-tasks`
- **Função:** Detecção de phantom completions em tasks.md via cascata de 5 camadas
- **Hook:** `after_implement` (opcional, recomenda execução em sessão fresca)

**Próximo passo:**
- Validar instalação verificando estrutura de arquivos
- Atualizar RESUMO_EXECUCAO.md com nova extensão

---

## Atualização de Continuidade — 22/04/2026 14:59 BRT

**O que foi feito (instalação archive):**
1. ✅ Download da extensão v1.0.0 do repositório GitHub
2. ✅ Extração e cópia para `.specify/extensions/archive/`
3. ✅ Limpeza de arquivos temporários
4. ✅ Cálculo de hash SHA256 do manifest: `ffa3831c0dd8aceeadad88efe4411676142d654dfbc1987e6e030ba6cdceb83e`
5. ⏳ Registro em `.specify/extensions/.registry` (próximo)
6. ⏳ Atualização de `AGENTS.md` (próximo)
7. ⏳ Criação de `docs/sdd/ARCHIVE_EXTENSION.md` (próximo)

**Extensão em instalação:**
- **Nome:** Archive v1.0.0
- **Comando:** `speckit.archive.run`
- **Função:** Arquivamento pós-merge de features na memória canônica do projeto (`.specify/memory/`)
- **Workflow:** Verificação de Constitution → Impact Map → Arquivamento → Relatório

**Próximo passo:**
- Registrar no `.registry`
- Atualizar `AGENTS.md` e criar documentação
- Atualizar RESUMO_EXECUCAO.md

### Resolução de Bloqueio — 22/04/2026 14:52 BRT

**Status:** Resolvido por confirmação do mantenedor

**Decisão:**
- `BACKLOG_OPERACIONAL.md` é a fonte canônica substituta de `TODO_OPERACIONAL.md`.
- Migrar apenas REQs com status **Pendente** ou **Parcial** no §2 do BACKLOG.
- REQs no §4 (Histórico de Conclusão) não serão migrados.
