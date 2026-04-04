# Como Aplicar as Migrações

## ⚠️ Importante

As migrações precisam ser aplicadas no banco de dados do servidor beta, pois não há PostgreSQL rodando localmente.

## 📝 Opções de Aplicação

### Opção 1: Via SSH no Servidor Beta (Recomendado)

```bash
# 1. Conectar ao servidor
ssh usuario@servidor

# 2. Navegar para o diretório do projeto
cd /opt/mesas-beta

# 3. Copiar arquivo de migração para o servidor (se necessário)
# Você pode usar scp ou git pull para atualizar os arquivos

# 4. Aplicar migrações via Docker
docker exec -i mesas-beta-db psql -U postgres -d mesas_rpg < database/apply_migrations_06_07.sql

# 5. Verificar se as tabelas foram criadas
docker exec -i mesas-beta-db psql -U postgres -d mesas_rpg -c "\dt system_suggestions"
docker exec -i mesas-beta-db psql -U postgres -d mesas_rpg -c "\dt notifications"
```

### Opção 2: Via Docker Compose (Se tiver acesso ao servidor)

```bash
# No servidor beta
cd /opt/mesas-beta
docker-compose -f docker-compose.beta.yml exec db psql -U postgres -d mesas_rpg -f /caminho/para/apply_migrations_06_07.sql
```

### Opção 3: Via Ferramenta de Banco (DBeaver, pgAdmin, etc)

1. Conecte-se ao banco beta via túnel SSH
2. Abra o arquivo `database/apply_migrations_06_07.sql`
3. Execute o script completo

## ✅ Verificação Pós-Migração

Após aplicar as migrações, execute estas queries para verificar:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_suggestions', 'notifications')
ORDER BY table_name;

-- Verificar estrutura da tabela system_suggestions
\d system_suggestions

-- Verificar estrutura da tabela notifications
\d notifications

-- Contar registros (deve ser 0 inicialmente)
SELECT COUNT(*) FROM system_suggestions;
SELECT COUNT(*) FROM notifications;
```

## 🔄 Próximo Passo

Após aplicar as migrações com sucesso, você pode:

1. **Fazer push do código** para o repositório
2. **Deploy automático** será acionado no beta
3. **Testar o fluxo completo** conforme `GUIA_TESTES_CRUD_SISTEMAS.md`

---

**Nota:** O script `backend/scripts/apply-migrations.mjs` foi criado mas requer PostgreSQL local. Como não temos banco local, use uma das opções acima.
