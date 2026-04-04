# Guia de Teste: CRUD de Sistemas + Notificações

## 📋 Pré-requisitos

1. **Aplicar migrações no banco de dados**

   Como `psql` e `docker` não estão disponíveis localmente, você precisa aplicar as migrações manualmente:

   **Opção A - Via SSH no servidor:**
   ```bash
   ssh usuario@servidor
   cd /opt/mesas-beta
   docker exec -i mesas-beta-db psql -U postgres -d mesas_rpg < /caminho/para/apply_migrations_06_07.sql
   ```

   **Opção B - Via ferramenta de banco (DBeaver, pgAdmin, etc):**
   - Conecte no banco de desenvolvimento
   - Execute o arquivo `database/apply_migrations_06_07.sql`

   **Opção C - Via API de admin (se disponível):**
   - Copie o conteúdo de `apply_migrations_06_07.sql`
   - Execute via interface administrativa

2. **Iniciar servidores locais**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

---

## 🧪 Testes Funcionais

### Teste 1: Criar Sugestão de Sistema

**Objetivo:** Verificar que usuário consegue sugerir novo sistema

**Passos:**
1. Acesse `http://localhost:5173/painel`
2. Faça login com Google
3. Localize o botão "Adicionar Sistema" acima do seletor de sistemas
4. Clique no botão
5. Preencha o formulário:
   - Nome: "Pathfinder 2e"
   - Tipo: "Sistema Raiz"
   - Descrição: "Segunda edição do Pathfinder"
   - Aliases: "PF2e, Pathfinder 2"
6. Clique em "Enviar Sugestão"

**Resultado esperado:**
- ✅ Modal fecha
- ✅ Mensagem de sucesso
- ✅ Sugestão criada no banco

**Verificação no banco:**
```sql
SELECT * FROM system_suggestions WHERE name = 'Pathfinder 2e';
```

---

### Teste 2: Validação de Limite (5 sugestões)

**Objetivo:** Verificar que usuário não pode criar mais de 5 sugestões pendentes

**Passos:**
1. Repita o Teste 1 cinco vezes com nomes diferentes
2. Tente criar a sexta sugestão

**Resultado esperado:**
- ✅ Aviso visual: "Você atingiu o limite de 5 sugestões pendentes"
- ✅ Botão "Enviar Sugestão" desabilitado
- ❌ Não permite enviar

---

### Teste 3: Validação de Hierarquia

**Objetivo:** Verificar que sistema com edições só aceita variantes

**Passos:**
1. Abra o modal "Adicionar Sistema"
2. Selecione um sistema que já tenha edições (ex: D&D 5e)
3. Observe o tipo disponível

**Resultado esperado:**
- ✅ Aviso: "Este sistema já possui edições publicadas. Você só pode adicionar Variantes."
- ✅ Opção "Edição / Subsistema" desabilitada
- ✅ Apenas "Variante" disponível

---

### Teste 4: Aprovar Sugestão (Admin)

**Objetivo:** Verificar que admin consegue aprovar sugestão

**Pré-requisito:** Usuário admin logado

**Passos:**
1. Acesse `http://localhost:5173/gestao`
2. Veja a lista de sugestões pendentes
3. Clique em "✅ Aprovar" em uma sugestão
4. Confirme a aprovação

**Resultado esperado:**
- ✅ Sugestão aprovada
- ✅ Sistema criado na tabela `systems`
- ✅ Aliases criados na tabela `system_aliases`
- ✅ Notificação criada para o usuário
- ✅ Sugestão move para aba "Log"

**Verificação no banco:**
```sql
-- Verificar sistema criado
SELECT * FROM systems WHERE name = 'Pathfinder 2e';

-- Verificar aliases
SELECT * FROM system_aliases WHERE system_id = (SELECT id FROM systems WHERE name = 'Pathfinder 2e');

-- Verificar notificação
SELECT * FROM notifications WHERE type = 'suggestion_approved' ORDER BY created_at DESC LIMIT 1;
```

---

### Teste 5: Aprovar com Edição (Admin)

**Objetivo:** Verificar que admin pode editar antes de aprovar

**Passos:**
1. Acesse `http://localhost:5173/gestao`
2. Clique em "✏️ Editar e Aprovar" em uma sugestão
3. Modifique o nome: "Pathfinder Segunda Edição"
4. Modifique a descrição
5. Adicione mais aliases
6. Clique em "✅ Aprovar e Publicar"

**Resultado esperado:**
- ✅ Sistema criado com valores editados
- ✅ Notificação criada com nome editado

---

### Teste 6: Rejeitar Sugestão (Admin)

**Objetivo:** Verificar que admin consegue rejeitar com motivo

**Passos:**
1. Acesse `http://localhost:5173/gestao`
2. Clique em "❌ Rejeitar" em uma sugestão
3. Modal abre pedindo motivo
4. Digite: "Sistema já existe como 'Pathfinder 2e'"
5. Clique em "Confirmar Rejeição"

**Resultado esperado:**
- ✅ Sugestão rejeitada
- ✅ Motivo salvo
- ✅ Notificação criada para o usuário
- ✅ Sugestão move para aba "Log"

**Verificação no banco:**
```sql
SELECT * FROM system_suggestions WHERE status = 'rejected' ORDER BY reviewed_at DESC LIMIT 1;
SELECT * FROM notifications WHERE type = 'suggestion_rejected' ORDER BY created_at DESC LIMIT 1;
```

---

### Teste 7: Visualizar Log (Admin)

**Objetivo:** Verificar histórico de aprovações/rejeições

**Passos:**
1. Acesse `http://localhost:5173/gestao`
2. Clique na aba "Log de Aprovações/Rejeições"

**Resultado esperado:**
- ✅ Tabela com todas as sugestões processadas
- ✅ Colunas: Sistema, Tipo, Ação, Admin, Data/Hora, Motivo
- ✅ Badge verde para aprovadas
- ✅ Badge vermelho para rejeitadas
- ✅ Nome do admin que processou

---

### Teste 8: Listar Notificações (API)

**Objetivo:** Verificar que notificações são criadas corretamente

**Passos:**
1. Obtenha o token JWT do usuário (localStorage)
2. Faça request:
   ```bash
   curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/v1/notifications
   ```

**Resultado esperado:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "suggestion_approved",
      "title": "✅ Sugestão Aprovada",
      "message": "Sua sugestão \"Pathfinder 2e\" foi aprovada e publicada!",
      "link": "/catalogo?system=uuid",
      "read": false,
      "created_at": "2026-04-04T13:00:00Z"
    }
  ]
}
```

---

### Teste 9: Contar Notificações Não Lidas (API)

**Passos:**
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/v1/notifications/unread-count
```

**Resultado esperado:**
```json
{
  "count": 2
}
```

---

### Teste 10: Marcar Notificação Como Lida (API)

**Passos:**
```bash
curl -X PATCH -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/v1/notifications/NOTIFICATION_ID/read
```

**Resultado esperado:**
```json
{
  "message": "Notificação marcada como lida"
}
```

---

## 🐛 Testes de Validação de Erros

### Erro 1: Criar sugestão sem nome
**Esperado:** Erro de validação no frontend

### Erro 2: Criar sugestão sem autenticação
**Esperado:** HTTP 401 Unauthorized

### Erro 3: Aprovar sugestão já processada
**Esperado:** HTTP 404 "Sugestão não existe ou já foi processada"

### Erro 4: Rejeitar sem motivo
**Esperado:** HTTP 400 "É necessário fornecer um motivo para a rejeição"

### Erro 5: Acessar /gestao sem ser admin
**Esperado:** Mensagem "Acesso negado. Esta página é restrita a administradores."

---

## 📊 Checklist de Validação

### Backend
- [ ] Migração 06 aplicada (tabela `system_suggestions` existe)
- [ ] Migração 07 aplicada (tabela `notifications` existe)
- [ ] POST `/api/v1/system-suggestions` funciona
- [ ] GET `/api/v1/system-suggestions/mine` funciona
- [ ] GET `/api/v1/admin/system-suggestions` funciona (admin)
- [ ] PATCH `/api/v1/admin/system-suggestions/:id/approve` funciona
- [ ] PATCH `/api/v1/admin/system-suggestions/:id/reject` funciona
- [ ] GET `/api/v1/notifications` funciona
- [ ] Notificações são criadas automaticamente

### Frontend
- [ ] Modal "Adicionar Sistema" abre
- [ ] Validação de hierarquia funciona
- [ ] Limite de 5 sugestões funciona
- [ ] Página `/gestao` carrega
- [ ] Aba "Pendentes" mostra sugestões
- [ ] Aba "Log" mostra histórico
- [ ] Aprovar sugestão funciona
- [ ] Rejeitar sugestão funciona
- [ ] Editar e aprovar funciona

### Integração
- [ ] Sistema criado aparece na árvore de sistemas
- [ ] Aliases funcionam na busca
- [ ] Notificações são criadas no banco
- [ ] Log de auditoria está completo

---

## 🚨 Problemas Conhecidos

Se encontrar algum problema, verifique:

1. **Migrações não aplicadas:** Tabelas não existem
   - Solução: Executar `apply_migrations_06_07.sql`

2. **Erro de autenticação:** Token inválido
   - Solução: Fazer logout e login novamente

3. **CSS não carregando:** Estilos quebrados
   - Solução: Verificar se `suggestions.css` foi importado

4. **Hierarquia não validando:** Busca não recursiva
   - Solução: Já corrigido, verificar se código está atualizado

---

## 📝 Relatório de Testes

Após executar os testes, preencha:

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Criar sugestão | ⬜ | |
| 2. Limite de 5 | ⬜ | |
| 3. Validação hierarquia | ⬜ | |
| 4. Aprovar sugestão | ⬜ | |
| 5. Aprovar com edição | ⬜ | |
| 6. Rejeitar sugestão | ⬜ | |
| 7. Visualizar log | ⬜ | |
| 8. Listar notificações | ⬜ | |
| 9. Contar não lidas | ⬜ | |
| 10. Marcar como lida | ⬜ | |

**Legenda:** ✅ Passou | ❌ Falhou | ⬜ Não testado

---

## 🎯 Próximo Passo

Após validar todos os testes, estará pronto para:
- Push para repositório
- Deploy em ambiente beta
- QA manual completo
