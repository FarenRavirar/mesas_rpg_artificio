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
- Hash: `a4dc87f`
- Mensagem: `fix(aggregator): corrige mapeamento de candidatos e adiciona parser TS`
- Deploy beta: ⏳ em andamento — GitHub Actions processando
- Alterações principais:
  - Correção de 4 bugs críticos de mapeamento (sanitização, busca fuzzy, contatos, imagem)
  - Parser TypeScript (`parseDiscordContent.ts`) para extração automática de campos
  - Integração completa no `candidateToFormData.ts`
  - REQ-19 Fases 1-4 concluídas (itens 055-058)
- Build validado: ✅ Frontend 411.80 kB (gzip: 119.53 kB) - exit 0
- Documentação: ✅ `sessoes/resumo_05-04_2_correcao-bugs-criticos.md` + `sessoes/resumo_05-04_3_parsing_inteligente.md` (plano)

## Commit anterior
- Branch: `dev`
- Hash: `98c8e2b`
- Mensagem: `docs: registra solução E102 para erro getsockname SSH (#3)`
- Deploy beta: ✅ success — `Deploy Beta` concluído em 04/04/2026T16:32Z (run ID: 23982948825)
**Próxima ação:** Aguardar autorização para commit e push para `dev`

## Estado atual (05/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Sessão anterior concluída:** REQ-19 — Melhorias UX Nielsen (itens 055-058, commit a4dc87f)

**Sessão atual em andamento (REQ-20 — Integração de Mídia e Covil do Lich):**
- Parser Python: extração de `banner_url` (attachments) e `avatar_url` (author) ✅ implementado
- Schema Pydantic: campos `banner_url` e `avatar_url` adicionados ✅
- `normalizeExporterPayload.ts`: passa `attachments` e `author` completo ao parser ✅
- `candidateToFormData.ts`: `banner_url` e `gm_avatar_url` mapeados do `enrichedFields` ✅
- **Em execução:** `is_covil` (migration_10), preview visual no formulário, checkbox Covil, retenção no AdminDevTools

**Decisões arquiteturais desta sessão:**
- `gm_avatar_url` — Opção B: apenas pré-preenche o formulário visualmente, NÃO persiste no banco (URL externa do Discord não sobe para Imgur neste fluxo)
- `is_covil` — persiste no banco como boolean (similar ao `is_ddal`)
- Selo "Covil do Lich" — detectado automaticamente pelo parser, editável pelo admin
- `imported_expires_at` — campo no banco para expiração configurável via AdminDevTools

**Próximas ações (REQ-20):**
1. Criar `migration_10_covil_and_expiration.sql` com `is_covil` e `imported_expires_at`
2. Adicionar preview de banner no `CreateTableForm` (PainelMestrePage.tsx)
3. Adicionar campo avatar do mestre (visual only, mode=review) com preview
4. Adicionar bloco "Covil do Lich" com checkbox e auto-detecção
5. Atualizar `candidateToFormData.ts` para mapear `is_covil` automaticamente
6. Expandir preview de revisão em `GestaoPage.tsx` (banner + avatar + badge Covil)
7. Adicionar seção de Retenção no `AdminDevToolsPage.tsx`

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
