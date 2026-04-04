# RESUMO_EXECUCAO.md

## Identidade do projeto
- **Repo:** `mesas_rpg_artificio` — `C:\projetos\mesas_rpg_artificio`
- **Beta:** `mesasbeta.artificiorpg.com` → branch `dev` → `/opt/mesas-beta/`
- **Produção:** `mesas.artificiorpg.com` → branch `main` → `/opt/mesas/` (não publicada)
- **Stack:** React/TS + Node/TS + PostgreSQL + Docker Compose + VM Oracle
- **SSH:** `ssh -F C:\projetos\config faren`

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
| 021A | Selos DDAL/Covil — backend+frontend | ⏳ em validação beta | QA E2E com dados reais no beta |
| 021B | AppShell global | ✅ concluído | validar smoke visual no beta pós último deploy |
| 022 | Endpoints GM autenticados | ⏳ em validação beta | validar CRUD com dados reais no beta |
| 023 | `npm run build` backend | ✅ concluído | exit code 0, sem erros de tipo |
| 024 | `npm run build` frontend | ✅ concluído | 1746 módulos, dist/ ok |
| 025 | `walkthrough.md` | ✅ concluído | escrito em `walkthrough.md` |
| 026 | REQ-11 + REQ-12 (fullstack) | ✅ deployado em `dev`/beta | executar QA E2E de anunciante + contatos obrigatórios |
| Fase 7 | Aggregator Discord — pipeline completo | ✅ backend implementado + migration aplicada no beta | 1) criar source via API, 2) importar export_exemple.json, 3) revisar candidatos via `/aggregator/candidates`, 4) validar rota `/admin/devtools` com JWT admin no beta |
| Fase 7B | Fechamento Aggregator — `TableOrigin` + expiração + AdminDevToolsPage completo | ✅ implementado local — **aguardando push autorizado para `dev`** | 1) autorizar push → 2) QA manual no beta (`/admin/devtools`) → 3) validar semáforo de testes, criação de source, dry-run e split automático de JSON |

**Legenda:** ✅ concluído · ⏳ pronto local, aguardando validação beta · ⏸ bloqueado por dependência

---

## Bloqueio atual

~~`systemsTreeImport.ts` não executa no beta porque `arvores_de_sistemas.md` não está no container após rebuild.~~ **Resolvido em 04/04/2026** — `docker cp` + `docker exec` executados com sucesso após o deploy (125 nós atualizados, idempotente).

**Bloqueio remanescente:** `arvores_de_sistemas.md` ainda não está no estágio `production` do Dockerfile — após o próximo rebuild o passo manual precisará ser repetido.

**Desbloqueio manual (após cada deploy):**
```powershell
scp -F C:\projetos\config arvores_de_sistemas.md faren:/tmp/arvores_de_sistemas.md
ssh -F C:\projetos\config faren "docker cp /tmp/arvores_de_sistemas.md mesas-beta-api:/app/arvores_de_sistemas.md"
ssh -F C:\projetos\config faren "docker exec mesas-beta-api sh -c 'cd /app && node dist/scripts/systemsTreeImport.js'"
```

**Desbloqueio permanente (quando autorizado):**
Adicionar no estágio `production` do `backend/Dockerfile`:
```dockerfile
COPY --from=builder /app/arvores_de_sistemas.md ./
```

---

## Último commit validado
- Branch: `dev`
- Hash: `df3fa8b`
- Mensagem: `feat(aggregator): pipeline Discord completo - Fase 7`
- Deploy beta: ✅ success — `Deploy Beta` concluído em 04/04/2026T06:33Z
- Migration_05: ✅ aplicada manualmente antes do deploy; tabelas `aggregator_sources`, `aggregator_imported_raw_messages`, `aggregator_import_candidates`, `aggregator_settings` confirmadas no banco
- Healthcheck: ✅ `{"status":"ok","environment":"beta","db":"connected"}`
- Dry-run Aggregator: ✅ 153 mensagens processadas, 5 aceitas, 148 aguardando revisão, 0 falhas
- Nota: `export_exemple.json` tinha JSON truncado (E088). O importador passou a aplicar `repairTruncatedJson()` automaticamente antes do parse, com fallback manual documentado em `ERRORS_SOLUTIONS.md`

## Alterações locais pendentes de push (sessão 04/04/2026 — Fase 7B)

## Estado atual (04/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Última sessão:** Correções QA AdminDevToolsPage + Migração nickname + Plano CRUD Sistemas

**Deployado recentemente:**
- Guia de token Discord com links diretos e explicações de permissões
- Texto duplicado removido (seletor de sistemas)
- Árvore de sistemas reimportada (125 sistemas no banco beta)
- Bug de logout por 401 transitório corrigido
- Auto-run de testes desabilitado no DevTools
- Botão perigoso "Aplicar na sessão" removido
- Migração `migration_03_gm_profile_nickname.sql` aplicada no banco beta

**Próxima ação:** Aguardando aprovação do plano de CRUD de sistemas para admin

**Bloqueios:** Nenhum
| Arquivo | Mudança |
|---|---|
| `backend/src/db/types.ts` | Adicionado `TableOrigin`, campo `origin` e `source_id` em `TablesTable` |
| `backend/src/routes/tables.ts` | Filtro SQL de expiração em `GET /tables`; validação em memória em `GET /tables/:slug` |
| `backend/src/services/aggregator/candidateService.ts` | `accept()` agora cria mesa em `tables` com `origin='imported'`, `gm_id=null`, `source_id`; atualiza `published_table_id` no candidato |
| `backend/Dockerfile` | Adicionado `COPY --from=builder /app/arvores_de_sistemas.md` no estágio production — elimina `docker cp` manual |
| `frontend/src/pages/AdminDevToolsPage.tsx` | Split automático >1000 msgs; `parseDiscordChannelLink` com suporte `discord://`; `aggregateImportSummaries`; aviso de chunk; resumo com lotes |
| `ERRORS_SOLUTIONS.md` | E100 — `grep_search` com escape regex inválido |
| `ARQUITETURA_PROJETO.md` | Documentado fluxo de criação de mesa ao aceitar candidato; `gm_id=null` válido no schema |

**Builds validados localmente:** backend ✅ (tsc exit 0) · frontend ✅ (vite dist/ ok)
**Próxima ação:** autorizar push para `dev` → aguardar Deploy Beta → QA manual em `/admin/devtools`

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
