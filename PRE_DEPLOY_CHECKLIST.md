# PRE-DEPLOY CHECKLIST

> [!CAUTION]
> **CHECKLIST OBRIGATÓRIO ANTES DE QUALQUER DEPLOY EM PRODUÇÃO**
>
> Este checklist constitui a principal barreira de defesa contra corrupção do banco de dados e downtime da Produção. A Produção é a Única Fonte de Dados Reais do sistema. Qualquer agente que subverter essa lista será responsabilizado por perda de dados críticos.

---

## 🛑 FASE 1: VALIDAÇÃO DE ESTADO (LOCAL E BETA)

Antes sequer de cogitar enviar código novo para produção, o agente DEVE garantir que a versão "Release Candidate" rodou perfeitamente no Beta.

- [ ] **Mergulho pré-deploy:** Ler `AGENTS.md`, `RESUMO_EXECUCAO.md` e consultar este checklist.
- [ ] **Paridade Testada no Beta:** O código que vai para produção já foi submetido via push/merge para a branch `dev` e os containers do `mesas-beta` iniciaram com sucesso?
- [ ] **Migrations Foram Executadas no Beta:** Se houve nova Migration `.sql`, ela subiu pro banco Beta sem quebrar os dados preexistentes?
- [ ] **Teste de Ponta-a-Ponta no Beta:** Interfaces impactadas foram checadas manualmente (seja pelo usuário ou log do agente via `curl`/terminal)? Todo deploy pressupõe a aprovação unânime do comportamento em `mesasbeta.artificiorpg.com`.

## 🛑 FASE 2: PREVENÇÃO DE DESASTRE DE SCHEMA

O maior risco para a aplicação reside na incompatibilidade entre o backend (código) de Produção e a estrutura das colunas/tabelas no Banco da Produção.

> [!CAUTION]
> **A Regra Primária de Falhas de Deploy:** Se você atualizar o backend em Produção e a aplicação cair porque o banco responde com `column does not exist` ou `relation does not exist`, **NUNCA TENTE CONSERTAR A PRODUÇÃO COM `ALTER TABLE` A VULSO.** Você DEVE reverter (Rollback) o código para a versão imediatamente anterior que funcionava com o banco, investigar a Migration em ambiente Beta e só então submeter a automação corrigida.

- [ ] **Auditoria de Migrations Destrutivas:** O banco da Produção receberá migrations nesta subida? Verifique se os arquivos incluem:
  - `TRUNCATE`
  - `DELETE FROM`
  - `DROP TABLE` ou `DROP COLUMN`
  - Se positivo, **PARE**. Faça um dump preventivo da tabela afetada usando `pg_dump` antes de liberar a execução do SQL na produção.

## 🛑 FASE 3: BACKUP DA PRODUÇÃO (MANDATÓRIO)

Você está mudando a infraestrutura que os clientes pagam e/ou usam diariamente.

- [ ] Execute e **confirme via filesize** o backup diário ou imediato do banco de dados completo na VM. Nenhuma Migration pode tocar Produção antes de certificar que o script abaixo produziu um artefato válido nos últimos minutos.
```bash
ssh -i "C:/projetos/Secrets/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 \
  "docker exec mesas-db pg_dump -U admin -d mesas_rpg > /tmp/backup_$(date +%Y%m%d_%H%M%S)_pre_deploy.sql"
```
- [ ] Se houver modificação nos diretórios estáticos montados localmente, realize o backup de arquivos visados.

## 🛑 FASE 4: PROCEDIMENTO DE DEPLOY NA VM

A Produção (`mesas.artificiorpg.com`) reflete os arquivos em `/opt/mesas/` servindo pela branch `main`.

1. **Sincronização:** Atualize ou alterne (via Git push pra main ou build customizado) os arquivos em Produção para equivaler ao Beta perfeitamente aprovado. Nenhuma modificação solta local é permitida saltar pra cá sem ir pro Git.
2. **Reboot dos Containers:** Suba os containers envolvidos (`docker compose up -d`).
3. **Verificação de Healthcheck (em menos de 1 min):** Utilize validações silentes em vez de interações manuais excludentes. 
   - [ ] Confirmar Logs: `docker logs mesas-api --since 1m` ou `tail` nas linhas mais recentes em busca explícita por erros (`grep -i 'error\|exception\|fatal'`).
   - [ ] Ping na Rota: `wget -qO- http://localhost:3000/api/v1/health`
4. **Verificação Visual do Healthcheck Completo:**
   - [ ] Testou se a API retornou um Code `200` com `{ status: 'ok' }` e `db: 'connected'`?

## 🚨 PROTOCOLO GERAL DE EMERGÊNCIA (ROLLBACK)

Se a bateria 4 falhar e os logs mostrarem um crash backend em Produção no minuto do deploy:

**NÃO INVISTA HORAS CORRIGINDO PELA LINHA DE COMANDO:**
1. Abaixe a versão ofensiva (`docker compose down`).
2. Desfaça a branch no diretório local da VM apontando pro hash do commit anterior e faça checkout seguro (`git revert` ou `git checkout <hash_antigo>`).
3. Rode `docker compose up -d` para restaurar.
4. Se o esquema do banco foi tocado e quebrou o App revertido, restaure o SQL via comando baseut de restabelecimento. `docker exec mesas-db psql ... < /tmp/backup_...sql`
5. Diagnostique os deltas de schema **No ambiente Beta** ou **em ambiente isolado**, NÃO usando o banco de produção de playground. Crie relatório em `ERRORS_SOLUTIONS.md` documentando o rollback, em base na evidência guardada pela investigação pré-reversão.

---

> *"Para alterar a Produção sem temor, é necessário agir no Beta com rigor absoluto. E quando for tocar a Produção, que seja metódico."*
