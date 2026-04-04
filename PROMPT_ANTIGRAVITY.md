# Prompt — Antigravity: Continuação da Fila de Implementação

## Bootstrap obrigatório (ler nesta ordem, nada mais)

1. `RESUMO_EXECUCAO.md` — estado atual, bloqueios e próxima ação
2. `AI_CONTEXT_INDEX.md` — escolher cenário na matriz antes de abrir qualquer outro arquivo
3. Arquivo canônico do cenário (conforme matriz — nunca abrir `ARQUITETURA_PROJETO.md` na íntegra)

---

## Estado atual (inline — não precisa abrir FILA nem TODO para começar)

| ID | Descrição | Status | Próxima ação |
|---|---|---|---|
| migration_02 | Taxonomia + DDAL no banco beta | ✅ | — |
| 017A | systemsTreeImport | ✅ script pronto | `docker cp` + `docker exec` pós-deploy |
| 021A | Selos DDAL/Covil — backend+frontend | ⏳ pronto local | QA E2E após 017A executado no beta |
| 021B | AppShell global | ✅ | smoke visual no beta |
| 022 | Endpoints GM autenticados | ⏳ pronto local | validar com dados reais após 017A |
| 016–020 | Backend + Frontend Fase 2 (catálogo, home, mesa, mestre) | ⏳ pronto local | push → deploy → validação beta |
| 014 | Onboarding UI (3 etapas) | ⏳ pronto local | validar fluxo completo no beta |
| 015 | Serviço Imgur + Sharp | ⏸ pendente | após estabilização do núcleo |
| 023 | `npm run build` backend | ✅ concluído | exit code 0 — 04/04/2026 |
| 024 | `npm run build` frontend | ✅ concluído | 1746 módulos, dist/ ok — 04/04/2026 |
| 025 | `walkthrough.md` | ✅ concluído | escrito em `walkthrough.md` |

**Bloqueio crítico:** `arvores_de_sistemas.md` não está no container pós-rebuild.
Após cada deploy, executar manualmente:
```powershell
scp -F C:\projetos\config arvores_de_sistemas.md faren:/tmp/arvores_de_sistemas.md
ssh -F C:\projetos\config faren "docker cp /tmp/arvores_de_sistemas.md mesas-beta-api:/app/arvores_de_sistemas.md"
ssh -F C:\projetos\config faren "docker exec mesas-beta-api sh -c 'cd /app && node dist/scripts/systemsTreeImport.js'"
```

---

## Tarefa

Continuar a fila de implementação do projeto **Anúncios de Mesas RPG**.

**Próximo item a executar:** primeiro item sem ✅ na tabela acima, na ordem numérica.

### Regras de execução

- Escrever diretamente nos arquivos. Não exibir código no chat.
- Para arquivos existentes: ler o conteúdo atual antes de modificar. Aplicar só o delta necessário.
- Para arquivos novos: `create_file`.
- Executar itens em sequência sem parar.
- Após concluir cada item: atualizar `RESUMO_EXECUCAO.md` marcando o status.
- Ao primeiro erro (`stderr`, falha de build, crash): parar, consultar `ERRORS_SOLUTIONS.md`, aplicar solução catalogada. Se não houver ID para o erro: registrar antes de continuar.
- Nunca fazer `git commit` ou `git push` sem autorização explícita no chat.
- Toda comunicação em português.

### Contratos inegociáveis (não consultar outro arquivo para isso)

| Regra | Valor |
|---|---|
| Push `dev`/`main` | autorização explícita no chat |
| `cover_deletehash` em rota pública | proibido |
| Upload de imagem | somente no backend |
| Elevação de role `player→gm` | somente no backend |
| `path_slug` DDAL | `dungeons-dragons/5e/2024` |
| Idioma | português |

### Protocolo de fechamento de sessão (obrigatório)

Antes de encerrar, atualizar `RESUMO_EXECUCAO.md`:
- [ ] Tabela de estado de execução — marcar concluídos, atualizar próximas ações
- [ ] Bloqueio atual — remover resolvidos, adicionar novos
- [ ] Último commit validado — hash, mensagem, status do deploy

---

## Contexto de infraestrutura (não buscar em outro lugar)

- **Repo local:** `C:\projetos\mesas_rpg_artificio`
- **Branch ativa:** `dev`
- **Beta:** `mesasbeta.artificiorpg.com` → container `mesas-beta-api:3000`, `mesas-beta-app:80`
- **SSH:** `ssh -F C:\projetos\config faren`
- **Compose beta:** `/opt/mesas-beta/docker-compose.beta.yml`
- **Healthcheck:** `curl.exe https://mesasbeta.artificiorpg.com/api/v1/health`
- **Validação CI:** `gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt`
