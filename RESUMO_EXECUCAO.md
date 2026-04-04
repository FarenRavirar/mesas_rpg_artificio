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
| 017A | systemsTreeImport | ✅ script pronto | `docker cp arvores_de_sistemas.md` pós-deploy → `docker exec node dist/scripts/systemsTreeImport.js` |
| 021A | Selos DDAL/Covil — backend+frontend | ⏳ pronto local | QA E2E após 017A executado |
| 021B | AppShell global | ✅ concluído | validar smoke visual no beta |
| 022 | Endpoints GM autenticados | ⏳ pronto local | validar com dados reais após 017A |
| 023 | `npm run build` backend | ⏸ pendente | executar após push + deploy beta |
| 024 | `npm run build` frontend | ⏸ pendente | executar após push + deploy beta |
| 025 | `walkthrough.md` | ⏸ pendente | escrever após builds verificados |

**Legenda:** ✅ concluído · ⏳ pronto local, aguardando validação beta · ⏸ bloqueado por dependência

---

## Bloqueio atual

`systemsTreeImport.ts` não executa no beta porque `arvores_de_sistemas.md` não está no container após rebuild. O Dockerfile não copia o arquivo no estágio production.

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
- Hash: `f043488`
- Mensagem: `Update docker-compose.beta.yml`
- Deploy beta: success

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
