# Sessão: Deploy de Dev para Produção

**Data:** 13/04/2026 18:08 BRT  
**Objetivo:** Promover branch `dev` para `main` e realizar primeiro deploy em produção seguindo todos os protocolos de segurança

---

## Contexto

Usuário solicitou deploy de `dev` para produção com ênfase em:
- Conferir toda a documentação (histórico de erros que levam horas para corrigir)
- Atenção especial à parte do banco de dados

---

## Plano de Execução

### Fase 1: Leitura Obrigatória e Validação de Estado
- [ ] Ler `PRE_DEPLOY_CHECKLIST.md` completo
- [ ] Ler `OPERACAO_PRODUCAO.md` seção 10 (Playbook de promoção dev→main)
- [ ] Ler `ARQUITETURA_PROJETO.md` seção 3.1 (Credenciais PostgreSQL)
- [ ] Verificar estado atual do projeto em `RESUMO_EXECUCAO.md`
- [ ] Listar migrations existentes e identificar quais foram aplicadas no beta
- [ ] Consultar `ERRORS_SOLUTIONS.md` para erros críticos de deploy (E133, E136, E086, E108)

### Fase 2: Validação do Beta (GO/NO-GO)
- [ ] Confirmar que beta está operacional: `https://mesasbeta.artificiorpg.com`
- [ ] Testar healthcheck do beta: `curl https://mesasbeta.artificiorpg.com/api/v1/health`
- [ ] Verificar último deploy bem-sucedido no GitHub Actions
- [ ] Confirmar que não há issues críticos pendentes no beta
- [ ] Validar que todas as migrations necessárias foram aplicadas no beta

### Fase 3: Análise de Divergência entre Dev e Main
- [ ] Verificar commits à frente em dev: `git rev-list --left-right --count origin/main...origin/dev`
- [ ] Listar commits que serão promovidos: `git log origin/main..origin/dev --oneline`
- [ ] Identificar migrations novas que precisarão ser aplicadas em produção
- [ ] Verificar se há mudanças em `.env` ou `docker-compose.prod.yml`

### Fase 4: Preparação do Banco de Produção
- [ ] Conectar no servidor: `ssh -F C:\projetos\config faren`
- [ ] Verificar containers de produção existentes: `docker ps | grep mesas`
- [ ] Confirmar credenciais do banco de produção: `docker exec mesas-db env | grep POSTGRES`
- [ ] **BACKUP OBRIGATÓRIO:** Fazer dump completo do banco de produção
- [ ] Listar migrations aplicadas no banco de produção
- [ ] Identificar migrations que precisam ser aplicadas (diff entre beta e prod)

### Fase 5: Validação de Migrations
- [ ] Para cada migration nova, ler conteúdo completo
- [ ] Verificar se há comandos destrutivos: `TRUNCATE`, `DROP`, `DELETE`, `ALTER ... DROP COLUMN`
- [ ] Se houver comandos destrutivos, fazer backup específico das tabelas afetadas
- [ ] Validar que migrations foram testadas no beta sem problemas
- [ ] Preparar arquivos `.sql` para aplicação remota

### Fase 6: Merge e Push para Main (com autorização)
- [ ] **PARAR E SOLICITAR AUTORIZAÇÃO EXPLÍCITA DO USUÁRIO**
- [ ] Criar branch de sincronização se necessário
- [ ] Resolver conflitos se houver
- [ ] Fazer merge de dev para main
- [ ] Push para origin/main (SOMENTE com autorização)

### Fase 7: Deploy em Produção
- [ ] Aguardar conclusão do workflow `deploy-production.yml`
- [ ] Monitorar logs do GitHub Actions em tempo real
- [ ] Verificar que containers foram recriados: `docker ps --format '{{.CreatedAt}} {{.Names}}' | grep mesas`

### Fase 8: Aplicação de Migrations em Produção
- [ ] Para cada migration nova, aplicar via pipeline:
  ```powershell
  Get-Content -Raw "database\migration_XX.sql" | ssh -F C:\projetos\config faren "docker exec -i mesas-db psql -U admin -d mesas_rpg"
  ```
- [ ] Verificar sucesso de cada migration
- [ ] Reiniciar backend se necessário: `docker restart mesas-api`

### Fase 9: Validação Pós-Deploy
- [ ] Testar URL de produção: `https://mesas.artificiorpg.com`
- [ ] Testar healthcheck: `curl https://mesas.artificiorpg.com/api/v1/health`
- [ ] Testar login via Google OAuth
- [ ] Testar fluxo crítico: visualizar mesa, criar mesa (se aplicável)
- [ ] Verificar logs de erro: `docker logs mesas-api --tail 50 | grep -i error`

### Fase 10: Documentação e Fechamento
- [ ] Atualizar `RESUMO_EXECUCAO.md` com estado pós-deploy
- [ ] Documentar migrations aplicadas
- [ ] Registrar problemas encontrados em `ERRORS_SOLUTIONS.md` se houver
- [ ] Atualizar esta sessão com resultado final

---

## Critério de Conclusão

Deploy está completo quando:
- ✅ Produção está acessível via `https://mesas.artificiorpg.com`
- ✅ Healthcheck retorna `{"status":"ok","db":"connected"}`
- ✅ Todas as migrations foram aplicadas sem erro
- ✅ Fluxos críticos testados e funcionando
- ✅ Nenhum erro crítico nos logs
- ✅ `RESUMO_EXECUCAO.md` atualizado

---

## Notas de Segurança

**REGRAS INEGOCIÁVEIS:**
1. NUNCA aplicar migration antiga sem ler conteúdo completo (E136)
2. SEMPRE fazer backup antes de migrations destrutivas
3. NUNCA usar `git push origin main` sem autorização explícita
4. SEMPRE validar credenciais do banco antes de aplicar migrations (E059)
5. NUNCA assumir que migration local foi aplicada em prod (E127)

**Erros críticos a evitar:**
- E133: Deploy sem `--force-recreate` (containers não atualizam)
- E136: Migration antiga apaga dados estruturados
- E086: Senha com `#` não URL-encoded quebra DATABASE_URL
- E108: SQL via argumento de linha de comando falha no PowerShell
- E059: Nome do banco errado (`mesas` vs `mesas_rpg`)

---

## Arquivos-Alvo

- `PRE_DEPLOY_CHECKLIST.md` (leitura)
- `OPERACAO_PRODUCAO.md` (leitura)
- `RESUMO_EXECUCAO.md` (atualização)
- `database/*.sql` (migrations a aplicar)
- `.github/workflows/deploy-production.yml` (monitoramento)

---

## Status Atual

**Fase atual:** Deploy CANCELADO — Documentação atualizada para prevenir recorrência

**Resultado:**
- ❌ Deploy não foi concluído (cancelado pelo usuário após `git checkout main`)
- ✅ Backup do banco de produção criado (379KB)
- ✅ Erro E143 documentado em `ERRORS_SOLUTIONS.md`
- ✅ `OPERACAO_PRODUCAO.md` atualizado com aviso crítico
- ✅ `PRE_DEPLOY_CHECKLIST.md` atualizado com procedimento correto
- ✅ `AGENTS.md` atualizado com regra pétrea sobre git checkout

**Próxima ação:** Aguardar nova autorização do usuário para deploy via GitHub PR (método correto)
