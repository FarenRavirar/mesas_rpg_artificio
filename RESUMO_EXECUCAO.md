# RESUMO_EXECUCAO.md

## Identidade do projeto
- **Repo:** `mesas_rpg_artificio` — `C:\projetos\mesas_rpg_artificio`
- **Beta:** `mesasbeta.artificiorpg.com` → branch `dev` → `/opt/mesas-beta/`
- **Produção:** `mesas.artificiorpg.com` → branch `main` → `/opt/mesas/` (não publicada)
- **Stack:** React/TS + Node/TS + PostgreSQL + Docker Compose + VM Oracle
- **SSH:** `ssh -F C:\projetos\config faren`

---

## Documentos de Gestão

| Documento | Propósito | Quando Consultar |
|---|---|---|
| `TODO_OPERACIONAL.md` | Backlog de requisitos (REQ-01, REQ-02...) com score GUT | Planejamento de features, priorização, roadmap |
| `FILA_IMPLEMENTACAO.md` | Fila técnica de execução (001, 002...) por lote/fase | Durante execução de lote, antes de deploy |
| `/sessoes/` | Registro histórico de sessões anteriores | Quando houver dúvida sobre decisões passadas, contexto de implementações anteriores |
| `ambiente_atual_mesas.md` | Snapshot técnico de infraestrutura (containers, env vars, volumes) | Auditoria técnica, troubleshooting de ambiente, validação de deploy |

**Relação:** TODO = visão estratégica (produto) | FILA = visão tática (técnico) | SESSOES = histórico rastreável | AMBIENTE = snapshot de infraestrutura

---

## Regras de operação (não repetir em outros arquivos)

| Regra | Valor |
|---|---|
| Push para `dev` ou `main` | somente com autorização explícita no chat |
| Commit sem autorização | proibido |
| Novo túnel Cloudflare | proibido |
| Deploy manual na VM | proibido |
| `cover_deletehash` em rota pública | proibido |
| Upload de imagem no frontend | proibido |
| `path_slug` canônico para DDAL | `dungeons-dragons/5e/2024` |
| Idioma de toda comunicação | português |

---

## Estado de execução — atualizar a cada sessão

| ID | Descrição | Status | Próxima ação |
|---|---|---|---|
| migration_02 | Taxonomia + DDAL no banco | ✅ aplicada no beta | — |
| migration_04 | Publisher role + contatos (REQ-11/REQ-12) | ✅ aplicada no beta | — |
| migration_05 | Aggregator Discord — fontes, fila bruta, candidatos | ✅ aplicada no beta (04/04/2026) | — |
| 017A | systemsTreeImport | ✅ executado no beta (132 nós, 280 aliases) | manter rotina `docker cp` + `docker exec` após rebuild até fix no Dockerfile |
| 021A | Selos DDAL/Covil — backend+frontend | ✅ concluído | Deployado e funcional no beta |
| 021B | AppShell global | ✅ concluído | validar smoke visual no beta pós último deploy |
| 022 | Endpoints GM autenticados | ✅ concluído | Deployado e funcional no beta |
| 023 | `npm run build` backend | ✅ concluído | exit code 0, sem erros de tipo |
| 024 | `npm run build` frontend | ✅ concluído | 1746 módulos, dist/ ok |
| 025 | `walkthrough.md` | ✅ concluído | escrito em `walkthrough.md` |
| 026 | REQ-11 + REQ-12 (fullstack) | ✅ deployado em `dev`/beta | executar QA E2E de anunciante + contatos obrigatórios |
| Fase 7 | Aggregator Discord — pipeline completo | ✅ backend implementado + migration aplicada no beta | 1) criar source via API, 2) importar export_exemple.json, 3) revisar candidatos via `/aggregator/candidates`, 4) validar rota `/admin/devtools` com JWT admin no beta |
| Fase 7B | Fechamento Aggregator — `TableOrigin` + expiração + AdminDevToolsPage completo | ✅ implementado local — **aguardando push autorizado para `dev`** | 1) autorizar push → 2) QA manual no beta (`/admin/devtools`) → 3) validar semáforo de testes, criação de source, dry-run e split automático de JSON |
| Fase 8 | CRUD de sistemas colaborativo + notificações in-app | ✅ deployado em `dev`/beta (04/04/2026) | QA manual: 1) mestres testarem sugestão de sistemas via `/painel-mestre`, 2) admin revisar em `/gestao`, 3) validar notificações no sino do header |
| migration_06 | system_suggestions | ✅ aplicada no beta (04/04/2026) | — |
| migration_07 | notifications | ✅ aplicada no beta (04/04/2026) | — |
| migration_07 (advanced_parser) | Parser Fase B - 15 colunas avançadas | ✅ aplicada no beta (05/04/2026) | 15 colunas + 9 índices em aggregator_import_candidates. Todas as colunas validadas. |
| migration_09 | Frequência, regras, banner em tables | ✅ aplicada no beta (04/04/2026) | Campos: frequency, frequency_custom, rules_notes, banner_url |
| REQ-16 | Correção de logout inesperado | ✅ **CORRIGIDO E VALIDADO (05/04/2026)** | **Causa raiz:** JWT_EXPIRES_IN=15m hardcoded no docker-compose.beta.yml sobrescrevia .env. **Solução:** Corrigido hardcode para 7d + recreação completa dos containers (down && up). **Validado em runtime:** docker exec confirma JWT_EXPIRES_IN=7d. E116 documentado em docs/E116_JWT_HARDCODED_DOCKER_COMPOSE.md. Próximo: teste manual de sessão de 30 minutos. |

**Legenda:** ✅ concluído · ⏳ pronto local, aguardando validação beta · ⏸ bloqueado por dependência

---

## Bloqueio atual

**Resolvido em 04/04/2026** — `docker cp` + `docker exec` executados com sucesso após o deploy (125 nós atualizados, idempotente).

**Atualização 05/04/2026:** Migração para `sistemas.json` e `cenarios.json` (com campo `subgenero`). Scripts serão reescritos para processar JSON. Dockerfile será atualizado para copiar ambos os arquivos. Aguardando recebimento dos arquivos.

**Comandos de cópia manual (DEPRECATED - será substituído por cópia automática no Dockerfile):**
```bash
scp -F C:\projetos\config sistemas.json faren:/tmp/sistemas.json
scp -F C:\projetos\config cenarios.json faren:/tmp/cenarios.json
ssh -F C:\projetos\config faren "docker cp /tmp/sistemas.json mesas-beta-api:/app/sistemas.json"
ssh -F C:\projetos\config faren "docker cp /tmp/cenarios.json mesas-beta-api:/app/cenarios.json"
```

**Fix permanente no Dockerfile (pendente):**
```dockerfile
COPY --from=builder /app/sistemas.json ./
COPY --from=builder /app/cenarios.json ./
```

**Desbloqueio permanente (quando autorizado):**
Adicionar no estágio `production` do `backend/Dockerfile`:
```dockerfile
COPY --from=builder /app/sistemas.json ./
COPY --from=builder /app/cenarios.json ./
```

---

## Último commit validado
- Branch: `dev`
- Hash: `3071300`
- Mensagem: `feat: Adicionar aba CRUD completa na página de gestão`
- Deploy beta: ⏳ em andamento — GitHub Actions processando
- Alterações principais:
  - **Backend:** Rotas CRUD completas para sistemas, cenários e mesas (POST, PUT, DELETE)
  - **Frontend:** SystemEditModal, ScenarioEditModal e nova aba "Gerenciar Conteúdo" em /gestao
  - **Validações:** Integridade referencial, hierarquia de sistemas, slug único
  - **Segurança:** Todas as rotas protegidas por requireRole('admin')
- Build validado: ✅ Backend e Frontend compilam sem erros
- Documentação: ✅ `walkthrough.md` + `task.md` atualizados
- Commits desta sessão:
  1. `fe8dfbf` - Rotas CRUD sistemas
  2. `be1ca16` - Rotas CRUD cenários  
  3. `0b07d1e` - Modais de edição
  4. `3071300` - Aba CRUD na GestaoPage

## Commit anterior
- Branch: `dev`
- Hash: `a4dc87f`
- Mensagem: `fix(aggregator): corrige mapeamento de candidatos e adiciona parser TS`
- Deploy beta: ✅ success

## Estado atual (05/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Sessão atual concluída (REQ-24 — Parser Python Fase B + Bug Fixes):**
- Parser Python: 7 novas funções avançadas (312 linhas) ✅
- Backend: Migration 07 com 15 colunas + 9 índices ✅
- Backend: Integração TypeScript dos 15 campos ✅
- Bug fix: GestaoPage filtro approved→accepted ✅
- Bug fix: PUT systems/:id agora atualiza aliases ✅
- Feature: DELETE permanente de candidatos (backend + frontend) ✅
- Auditoria: 22 rotas frontend vs backend (100% cobertura) ✅
- **Status:** Implementação local concluída, aguardando autorização para commit

**Funcionalidades implementadas:**
- Parser extrai múltiplos horários estruturados (sessions[])
- Parser extrai vagas detalhadas (slots_total, slots_available, slots_filled)
- Parser classifica sistema (homebrew, custom, normalizado)
- Parser classifica pagamento (gratuita/paga/ambígua)
- Parser classifica tipo de candidato (mesa/grupo/múltiplo/inválido)
- Parser separa mestre vs anunciante (master_display_name, publisher_role)
- Admin pode deletar candidatos permanentemente em qualquer status
- Admin pode editar sistemas e aliases são persistidos corretamente
- Abas "aprovadas" e "rejeitadas" agora mostram dados corretos

**Decisões arquiteturais desta sessão:**
- 15 novos campos no schema `import_candidates` (JSONB para sessions, índices para performance)
- Interface `SessionSchedule` compartilhada entre Python e TypeScript
- Botão de delete com modal de confirmação (ação irreversível)
- Auditoria completa de rotas confirmou 100% de cobertura backend

**Próximas ações sugeridas:**
1. Autorizar commit das alterações locais
2. Aplicar migration_07 no banco beta
3. QA manual: testar parser com anúncios reais do Discord
4. Validar que os 15 campos aparecem corretamente na UI de revisão
5. Testar delete permanente de candidatos em todos os status

**Bloqueios:** Nenhum

---

## Protocolo de fechamento (obrigatório antes de encerrar sessão)

Antes de encerrar qualquer sessão de trabalho, atualizar as três seções abaixo:

- [ ] **Estado de execução** — marcar o que foi concluído, atualizar próximas ações
- [ ] **Bloqueio atual** — remover bloqueios resolvidos, adicionar novos
- [ ] **Último commit validado** — atualizar hash, mensagem e status do deploy

Sem atualizar essas três seções, a sessão não está encerrada.

---

## Leitura obrigatória ao iniciar sessão

1. Este arquivo (`RESUMO_EXECUCAO.md`) — estado atual
2. `AI_CONTEXT_INDEX.md` — roteador de leitura por cenário
3. Arquivo canônico do cenário da tarefa (conforme matriz do AI_CONTEXT_INDEX)

**Não ler AGENTS.md na íntegra a cada sessão.** Consultá-lo apenas quando a tarefa envolver governança, segurança ou regras de idioma.
