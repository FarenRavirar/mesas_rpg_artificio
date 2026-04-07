# Roteiro de Smoke Test Pós-Deploy — Auditoria de Segurança Backend

**Objetivo:** Validar que as correções de segurança estão funcionando corretamente em ambiente beta após deploy.

---

## Pré-requisitos

- [ ] Migration `migration_07_table_metric_events.sql` executada no banco
- [ ] Backend reiniciado com build atualizado
- [ ] Acesso ao ambiente beta: `mesasbeta.artificiorpg.com`
- [ ] Ferramenta para testes HTTP (Postman, curl, ou DevTools do navegador)

---

## 1. Teste de OAuth Seguro

### 1.1 Validar State CSRF
```bash
# Acessar rota de login
GET https://mesasbeta.artificiorpg.com/api/v1/auth/google

# Verificar:
✓ URL de redirect contém parâmetro `state`
✓ State é um JWT válido (formato: xxx.yyy.zzz)
```

### 1.2 Validar Token via postMessage
```bash
# Completar fluxo OAuth no navegador
# Abrir DevTools > Console antes de fazer login

# Verificar:
✓ Após callback, janela popup envia postMessage
✓ Token NÃO aparece na URL (query string)
✓ Console mostra evento postMessage com { type: 'AUTH_SUCCESS', token: '...', isNew: ... }
```

### 1.3 Validar Novo Usuário sem Admin
```bash
# Fazer login com conta Google nova (que nunca usou o sistema)

# Verificar no banco:
SELECT email, role FROM users WHERE email = 'email_teste@gmail.com';

# Resultado esperado:
✓ role = 'player' (NÃO 'admin')
```

---

## 2. Teste de Ownership em removeUserSystem

### 2.1 Criar Dois Usuários
```bash
# Usuário A: fazer login e adicionar sistema favorito
POST /api/v1/profile/me/systems
Authorization: Bearer <token_usuario_A>
{
  "system_id": "<uuid_sistema>",
  "type": "favorite"
}

# Anotar o ID retornado: <user_system_id_A>
```

### 2.2 Tentar Remover Sistema de Outro Usuário
```bash
# Usuário B: tentar remover sistema do Usuário A
DELETE /api/v1/profile/me/systems/<user_system_id_A>
Authorization: Bearer <token_usuario_B>

# Resultado esperado:
✓ Status 204 (sem erro, mas não remove nada)
✓ Sistema do Usuário A permanece no banco
```

### 2.3 Validar Remoção Própria
```bash
# Usuário A: remover seu próprio sistema
DELETE /api/v1/profile/me/systems/<user_system_id_A>
Authorization: Bearer <token_usuario_A>

# Resultado esperado:
✓ Status 204
✓ Sistema removido do banco
```

---

## 3. Teste de Anti-Abuso de Métricas

### 3.1 Preparar Ambiente
```bash
# Escolher uma mesa ativa no catálogo
# Anotar: slug da mesa e ID da mesa
```

### 3.2 Teste de Throttle — View (15 minutos)
```bash
# Primeira chamada
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<slug>/view
Content-Type: application/json

# Resultado esperado:
✓ Status 200
✓ Métrica incrementada no banco

# Segunda chamada (imediatamente após)
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<slug>/view

# Resultado esperado:
✓ Status 202 (Accepted but not processed)
✓ Métrica NÃO incrementada no banco

# Validar no banco:
SELECT views_count FROM table_metrics WHERE table_id = '<table_id>';
# Deve mostrar apenas 1 view, não 2
```

### 3.3 Teste de Throttle — Click (5 minutos)
```bash
# Primeira chamada
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/click

# Resultado esperado:
✓ Status 200

# Segunda chamada (imediatamente após)
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/click

# Resultado esperado:
✓ Status 202
✓ clicks_count não incrementa
```

### 3.4 Teste de Throttle — Contact (30 minutos)
```bash
# Primeira chamada
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/contact

# Resultado esperado:
✓ Status 200

# Segunda chamada (imediatamente após)
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/contact

# Resultado esperado:
✓ Status 202
✓ contacts_count não incrementa
```

### 3.5 Teste de Throttle — Favorite (24 horas)
```bash
# Primeira chamada
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/favorite

# Resultado esperado:
✓ Status 200

# Segunda chamada (imediatamente após)
POST https://mesasbeta.artificiorpg.com/api/v1/tables/<table_id>/favorite

# Resultado esperado:
✓ Status 202
✓ favorites_count não incrementa
```

### 3.6 Validar Fingerprint por IP
```bash
# Fazer chamada de view de dois IPs diferentes (ex: celular + desktop)
# Ambas devem retornar 200 e incrementar

# Fazer segunda chamada do mesmo IP
# Deve retornar 202

# Validar no banco:
SELECT COUNT(*) FROM table_metric_events 
WHERE table_id = '<table_id>' AND action = 'view';

# Deve mostrar 2 eventos (um por IP)
```

---

## 4. Teste de Captura de IP Atrás de Proxy

### 4.1 Validar Headers de Proxy
```bash
# No servidor, adicionar log temporário em gmPanel.ts (linha ~25):
console.log('[IP Debug]', {
  'x-forwarded-for': req.headers['x-forwarded-for'],
  'x-real-ip': req.headers['x-real-ip'],
  'socket': req.socket.remoteAddress
});

# Fazer chamada de métrica e verificar logs
# Resultado esperado:
✓ x-forwarded-for contém IP real do cliente
✓ getClientIp() retorna o primeiro IP da lista
```

---

## 5. Validação no Banco de Dados

### 5.1 Verificar Estrutura da Tabela
```sql
-- Conectar ao banco
docker exec mesas-beta-db psql -U admin -d mesas_rpg

-- Verificar tabela existe
\d table_metric_events

-- Resultado esperado:
✓ Tabela existe
✓ Colunas: id, table_id, action, fingerprint_hash, created_at
✓ Índices: idx_metric_events_dedup, idx_metric_events_cleanup
```

### 5.2 Verificar Eventos Registrados
```sql
SELECT 
  action,
  COUNT(*) as total,
  COUNT(DISTINCT fingerprint_hash) as unique_clients,
  MAX(created_at) as last_event
FROM table_metric_events
GROUP BY action;

-- Resultado esperado:
✓ Eventos registrados para cada ação testada
✓ fingerprint_hash é SHA256 (64 caracteres hex)
```

### 5.3 Verificar Métricas Incrementadas
```sql
SELECT 
  t.slug,
  t.title,
  tm.views_count,
  tm.clicks_count,
  tm.contacts_count,
  tm.favorites_count
FROM tables t
JOIN table_metrics tm ON tm.table_id = t.id
WHERE t.slug = '<slug_testado>';

-- Resultado esperado:
✓ Contadores refletem apenas chamadas únicas (não duplicatas)
```

---

## 6. Checklist de Validação Final

- [ ] OAuth: State assinado presente na URL de redirect
- [ ] OAuth: Token enviado via postMessage (não query string)
- [ ] OAuth: Novos usuários criados como 'player'
- [ ] Ownership: Usuário não consegue remover sistema de outro
- [ ] Ownership: Usuário consegue remover próprio sistema
- [ ] Métricas: View retorna 202 em duplicata (15min)
- [ ] Métricas: Click retorna 202 em duplicata (5min)
- [ ] Métricas: Contact retorna 202 em duplicata (30min)
- [ ] Métricas: Favorite retorna 202 em duplicata (24h)
- [ ] Métricas: Fingerprint diferencia IPs distintos
- [ ] Banco: table_metric_events existe e registra eventos
- [ ] Banco: Contadores não incrementam em duplicatas

---

## 7. Rollback em Caso de Falha

Se qualquer teste falhar:

```bash
# 1. Reverter deploy
cd /opt/mesas-beta
git log --oneline -5  # Identificar commit anterior
git checkout <commit_anterior>
docker-compose restart backend

# 2. Reverter migration (se necessário)
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "DROP TABLE IF EXISTS table_metric_events CASCADE;"

# 3. Reportar falha com logs
docker logs mesas-beta-backend --tail 100 > /tmp/rollback_logs.txt
```

---

## 8. Limpeza Pós-Teste

```sql
-- Remover eventos de teste
DELETE FROM table_metric_events WHERE created_at > NOW() - INTERVAL '1 hour';

-- Resetar métricas de teste (opcional)
UPDATE table_metrics 
SET views_count = 0, clicks_count = 0, contacts_count = 0, favorites_count = 0
WHERE table_id IN (SELECT id FROM tables WHERE slug = '<slug_testado>');
```

---

## Critério de Sucesso

✅ **Deploy aprovado** se todos os 11 itens do checklist passarem.  
⚠️ **Deploy condicional** se falhas forem não-críticas e documentadas.  
❌ **Rollback obrigatório** se falhas críticas de segurança (OAuth ou ownership).
