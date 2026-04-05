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

**Relação:** TODO = visão estratégica (produto) | FILA = visão tática (técnico) | SESSOES = histórico rastreável

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
| migration_09 | Frequência, regras, banner em tables | ✅ aplicada no beta (04/04/2026) | Campos: frequency, frequency_custom, rules_notes, banner_url |
| REQ-16 | Correção de logout inesperado | ✅ concluído (04/04/2026) | JWT_EXPIRES_IN=7d, validação inteligente AuthContext, sincronização suave entre abas. E103 documentado. |

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
- Hash: `98c8e2b`
- Mensagem: `docs: registra solução E102 para erro getsockname SSH (#3)`
- Deploy beta: ✅ success — `Deploy Beta` concluído em 04/04/2026T16:32Z (run ID: 23982948825)
- Migrations 06 e 07: ✅ aplicadas no banco beta; tabelas `system_suggestions` (14 colunas) e `notifications` (8 colunas) confirmadas
- Healthcheck: ✅ `{"status":"ok","environment":"beta","db":"connected","usersSampled":true}`
- Rotas validadas: ✅ `/api/v1/system-suggestions` e `/api/v1/notifications/unread-count` retornam 401 (autenticação requerida)
- Nota: PR #3 mergeada via GitHub para evitar E101 (deleção de diretório no Windows); erro E102 (getsockname failed) registrado em `ERRORS_SOLUTIONS.md`

## Alterações locais pendentes de push (sessão 04/04/2026)

| Arquivo | Mudança |
|---|---|
| `frontend/src/contexts/AuthContext.tsx` | Validação inteligente (< 5min) e sincronização suave sem reload |
| `frontend/src/pages/PainelMestrePage.tsx` | 4 novos campos: frequency, rules_notes, banner_url, checkbox em andamento |
| `AGENTS.md` | Seção TODO vs FILA + referências a /sessoes/ (3 locais) |
| `ERRORS_SOLUTIONS.md` | E102 (SSH) e E103 (Logout) adicionados |
| `FILA_IMPLEMENTACAO.md` | 13 itens atualizados para status correto |
| `OPERACAO_PRODUCAO.md` | 4 correções aplicadas |
| `RESUMO_EXECUCAO.md` | Seção Documentos de Gestão adicionada |
| `TODO_OPERACIONAL.md` | REQ-03 revertido, REQ-16 adicionado, 4 status corrigidos |

**Builds validados localmente:** backend ✅ (tsc exit 0) · frontend ✅ (vite dist/ ok)

**Próxima ação:** Aguardar autorização para commit e push para `dev`

## Estado atual (04/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Última sessão:** Estabilização de Auth + Formulário de Nova Mesa + Auditoria Completa de Documentação

**Deployado nesta sessão (04/04/2026):**
- Migration 09 aplicada: campos frequency, frequency_custom, rules_notes, banner_url em tables
- Correção de logout inesperado: JWT_EXPIRES_IN=7d, validação inteligente, sincronização suave
- Formulário de nova mesa expandido: checkbox "mesa em andamento", select frequência, textarea regras, input banner
- Bug de busca de sistema corrigido (reset indevido)

**Documentação atualizada nesta sessão:**
- TODO_OPERACIONAL.md: REQ-03 revertido, REQ-16 adicionado, 4 status corrigidos
- FILA_IMPLEMENTACAO.md: 13 itens atualizados para status correto (009, 014, 016-024)
- OPERACAO_PRODUCAO.md: 4 correções críticas aplicadas
- ERRORS_SOLUTIONS.md: E102 (SSH) e E103 (Logout) adicionados
- AGENTS.md: Seção explicativa TODO vs FILA adicionada + referências a /sessoes/
- RESUMO_EXECUCAO.md: Seção Documentos de Gestão adicionada

**Estrutura de sessões criada:**
- Pasta /sessoes/ criada para registro histórico
- 4 resumos de sessões anteriores movidos para /sessoes/
- Protocolo de Continuidade de Sessão atualizado no AGENTS.md

**Próxima ação:** Monitorar estabilidade do beta por 1 semana antes de promover para produção

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
