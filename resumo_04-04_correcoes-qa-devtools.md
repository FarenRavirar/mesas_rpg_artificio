# Resumo 04-04 — Correções QA AdminDevToolsPage

## Objetivo da sessão

Corrigir 5 problemas identificados no QA manual do `/admin/devtools` após deploy da Fase 7B:
1. Guia de token Discord sem links diretos e sem explicação de permissões de bot
2. Erro ao criar source via link de canal Discord
3. Erro ao importar JSON do DiscordChatExporter
4. Árvore de sistemas não carrega (dropdown vazio)
5. Texto duplicado "Selecione um único nó da árvore"

## Plano de execução

1. **Diagnóstico:** Capturar logs de erro do navegador e backend para identificar causa raiz dos erros 2, 3 e 4
2. **Correções de UX (independentes de logs):**
   - Adicionar links diretos no guia de token Discord
   - Adicionar explicação sobre permissões de bot (Read Message History, não precisa ser admin)
   - Expandir explicação de self-bot com passo a passo detalhado
   - Remover texto duplicado (unificar em "Selecione um único nó da árvore para vincular a mesa")
3. **Investigação de erros:**
   - Verificar se `arvores_de_sistemas.md` existe no container (`docker exec mesas-beta-app ls -la`)
   - Testar rota `/api/v1/systems/tree` diretamente
   - Adicionar `try/catch` robusto em `createSourceFromLink` e `importJsonPayload`
   - Validar schema do JSON antes de enviar ao backend
4. **Correções de erro** (após diagnóstico)
5. **Build e push** (aguardar autorização)
6. **QA manual** (validar todas as correções no beta)

## Task list

- [x] Capturar logs de erro do navegador (console F12) ao criar source e importar JSON — **aguardando usuário compartilhar**
- [ ] Capturar logs do backend (`docker logs mesas-beta-app`)
- [ ] Verificar se `arvores_de_sistemas.md` existe no container beta
- [ ] Testar rota `/api/v1/systems/tree` via curl
- [x] Adicionar links diretos no guia de token Discord (portal dev + Discord web)
- [x] Adicionar explicação de permissões de bot (Read Message History)
- [x] Expandir explicação de self-bot com passo a passo detalhado
- [x] Remover texto duplicado (unificar mensagem de seleção de nó)
- [ ] Adicionar `try/catch` robusto em `createSourceFromLink` com mensagem de erro específica
- [ ] Adicionar `try/catch` robusto em `importJsonPayload` com mensagem de erro específica
- [ ] Validar schema do JSON antes de enviar (verificar campos obrigatórios)
- [ ] **Problema 4 redefinido:** Árvore de sistemas no banco está desatualizada (~20 sistemas antigos vs. árvore completa do `arvores_de_sistemas.md`) — precisa reimportar
- [x] Build frontend validado
- [ ] Atualizar documentos relevantes
- [ ] Push para `dev` (aguardar autorização)
- [ ] QA manual no beta

## Arquivos-alvo

| Arquivo | Status | Mudança prevista |
|---|---|---|
| `frontend/src/pages/AdminDevToolsPage.tsx` | ✅ | Links diretos, explicação de permissões, error handling robusto |
| `frontend/src/components/SystemTreeSelector.tsx` | ✅ | Texto unificado |
| `backend/src/routes/aggregatorSources.ts` | 🔄 | Error handling robusto (se necessário após diagnóstico) |
| `backend/src/routes/systems.ts` | ✅ | Rota já existe corretamente |
| `database/` | ⚠️ | Árvore de sistemas precisa ser reimportada |

## Critério de conclusão

- [x] Deploy Fase 7B concluído com sucesso
- [ ] Logs de erro capturados e analisados
- [x] Correções de UX aplicadas (links, textos, explicações)
- [ ] Erros de criação de source e importação de JSON corrigidos
- [ ] Árvore de sistemas atualizada no banco de dados
- [x] Build validado (frontend)
- [ ] Push autorizado e deploy concluído
- [ ] QA manual: todos os 5 problemas resolvidos

## Decisões importantes

**Problema 4 redefinido:** A árvore de sistemas carrega corretamente via API, mas o banco de dados contém apenas ~20 sistemas antigos. A árvore completa do `arvores_de_sistemas.md` precisa ser reimportada no banco.

**Solução:** Executar o script de importação no container beta:
```bash
docker exec mesas-beta-app npx tsx src/scripts/systemsTreeImport.ts
```

O script faz upsert (insert ou update) baseado em `path_slug`, então é seguro executar múltiplas vezes.
