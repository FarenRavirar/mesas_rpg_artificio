# Checklist de Validação Beta — Painel do Mestre
**Data:** 07/04/2026  
**Objetivo:** Validar correções das falhas críticas identificadas na auditoria  
**Ambiente:** `https://mesasbeta.artificiorpg.com/painel`

---

## Pré-requisitos

- [ ] Correções P1 (bloqueadores) aplicadas e deployadas em beta
- [ ] Banco de dados limpo ou com dados de teste conhecidos
- [ ] Usuário de teste com role `gm` criado
- [ ] Usuário de teste com role `admin` criado
- [ ] Pelo menos 3 mesas de teste criadas (1 ativa, 1 draft, 1 ended)

---

## Cenário 1: Criação Manual de Mesa ✅

### 1.1. Criação Básica (Caminho Feliz)
- [ ] Acessar `/painel`
- [ ] Clicar em "Nova Mesa"
- [ ] **Step 1 (Básico):**
  - [ ] Preencher título: "Mesa de Teste Auditoria"
  - [ ] Preencher descrição
  - [ ] Selecionar type: "campanha"
  - [ ] Selecionar modality: "online"
  - [ ] Preencher slots_total: 4
  - [ ] Preencher slots_open: 4
  - [ ] Clicar "Próximo"
- [ ] **Step 2 (Sistema):**
  - [ ] Selecionar sistema: "Dungeons & Dragons > 5e > 2024"
  - [ ] Clicar "Próximo"
- [ ] **Step 3 (Sessões):**
  - [ ] Adicionar horário: Segunda, 19:00-22:00, Semanal
  - [ ] Selecionar frequência: "Semanal"
  - [ ] Clicar "Próximo"
- [ ] **Step 4 (Configuração):**
  - [ ] Manter publisher_role: "gm"
  - [ ] Clicar "Próximo"
- [ ] **Step 5 (Finalização):**
  - [ ] Adicionar contato: WhatsApp, valor válido
  - [ ] Clicar "Próximo"
- [ ] **Step 6 (Revisão):**
  - [ ] Verificar dados exibidos
  - [ ] Clicar "Publicar Mesa"
- [ ] **Validação:**
  - [ ] Mesa aparece no dashboard
  - [ ] Status: "active"
  - [ ] Todos os campos persistidos corretamente

### 1.2. Criação com Campos Avançados (REQ-26)
- [ ] Repetir fluxo 1.1 até Step 5
- [ ] **Step 5 (Finalização):**
  - [ ] Preencher "Nome de exibição do mestre"
  - [ ] Preencher "Duração da campanha"
  - [ ] Preencher "Faixa de nível"
  - [ ] Marcar "Sessão zero gratuita"
  - [ ] Preencher "Sinopse"
  - [ ] Preencher "Requisitos técnicos"
  - [ ] Marcar "Requer PC"
- [ ] Submeter
- [ ] **Validação:**
  - [ ] Todos os campos avançados persistidos
  - [ ] Campos visíveis ao editar mesa

### 1.3. Criação com Schedules Múltiplos (REQ-27)
- [ ] Repetir fluxo 1.1 até Step 3
- [ ] **Step 3 (Sessões):**
  - [ ] Adicionar horário 1: Segunda, 19:00-22:00, Semanal
  - [ ] Adicionar horário 2: Quarta, 20:00-23:00, Semanal
  - [ ] Adicionar horário 3: Sábado, 14:00-18:00, Quinzenal
- [ ] Submeter
- [ ] **Validação:**
  - [ ] 3 schedules persistidos
  - [ ] Schedules visíveis ao editar mesa

### 1.4. Validação Frontend — Campos Obrigatórios
- [ ] Tentar submeter sem sistema (Step 2 vazio)
  - [ ] **Esperado:** Erro claro antes de submit
- [ ] Tentar submeter sem contatos (Step 5, remover todos)
  - [ ] **Esperado:** Erro claro antes de submit
- [ ] Tentar submeter campanha sem frequência
  - [ ] **Esperado:** Erro claro antes de submit
- [ ] Tentar submeter mesa paga sem valor
  - [ ] **Esperado:** Erro claro antes de submit

---

## Cenário 2: Edição de Mesa ⚠️ (CRÍTICO)

### 2.1. Edição Básica
- [ ] No dashboard, clicar em "Editar" em mesa existente
- [ ] **Validação de carregamento:**
  - [ ] Formulário carrega com todos os dados da mesa
  - [ ] Título correto
  - [ ] Sistema correto
  - [ ] Schedules carregados (se houver)
  - [ ] Contatos carregados
  - [ ] Campos avançados carregados
- [ ] Alterar título para "Mesa Editada - Teste"
- [ ] Clicar "Publicar Mesa"
- [ ] **Validação crítica:**
  - [ ] ✅ Mesa é ATUALIZADA (não cria nova)
  - [ ] ✅ Título alterado no dashboard
  - [ ] ✅ ID da mesa permanece o mesmo
  - [ ] ✅ Não há mesa duplicada

### 2.2. Edição de Schedules
- [ ] Editar mesa com 1 schedule
- [ ] Adicionar 2 schedules novos
- [ ] Remover schedule original
- [ ] Submeter
- [ ] **Validação:**
  - [ ] Apenas 2 schedules novos persistidos
  - [ ] Schedule original removido

### 2.3. Edição de Campos Editoriais Fase 6
- [ ] Editar mesa
- [ ] No Step 5, preencher:
  - [ ] "Sinopse narrativa" (synopsis_narrative)
  - [ ] "Texto de benefícios" (benefits_text)
  - [ ] "Bio do mestre" (gm_bio)
- [ ] Submeter
- [ ] **Validação:**
  - [ ] Campos persistidos corretamente
  - [ ] Campos visíveis ao recarregar edição

---

## Cenário 3: Ativação/Desativação de Mesa ⚠️ (CRÍTICO)

### 3.1. Desativar Mesa Ativa
- [ ] No dashboard, localizar mesa com status "active"
- [ ] Clicar em botão "Desativar" (ou toggle)
- [ ] Confirmar ação
- [ ] **Validação crítica:**
  - [ ] ✅ Status muda para "draft" (ou outro status válido)
  - [ ] ✅ Card atualiza visualmente
  - [ ] ✅ Botão muda para "Ativar"
  - [ ] ✅ Sem erro no console
  - [ ] ✅ Sem requisição 404/500

### 3.2. Ativar Mesa Inativa
- [ ] No dashboard, localizar mesa com status "draft"
- [ ] Clicar em botão "Ativar"
- [ ] Confirmar ação
- [ ] **Validação crítica:**
  - [ ] ✅ Status muda para "active"
  - [ ] ✅ Card atualiza visualmente
  - [ ] ✅ Botão muda para "Desativar"

### 3.3. Validação de Persistência
- [ ] Recarregar página
- [ ] **Validação:**
  - [ ] Status permanece alterado
  - [ ] Mudança persistida no banco

---

## Cenário 4: Deleção de Mesa

### 4.1. Deleção por GM
- [ ] No dashboard, clicar em "Deletar" em mesa de teste
- [ ] Confirmar ação
- [ ] **Validação:**
  - [ ] Mesa removida do dashboard
  - [ ] Sem erro no console
  - [ ] Schedules deletados (verificar no banco)
  - [ ] Contatos deletados (verificar no banco)

### 4.2. Deleção por Admin
- [ ] Logar como admin
- [ ] Acessar `/painel`
- [ ] Clicar em "Deletar" em qualquer mesa
- [ ] Confirmar ação
- [ ] **Validação crítica:**
  - [ ] ✅ Mesa deletada com sucesso
  - [ ] ✅ Sem erro 404
  - [ ] ✅ Schedules deletados (verificar no banco)
  - [ ] ✅ Contatos deletados (verificar no banco)

---

## Cenário 5: Listagem e Métricas

### 5.1. Dashboard de Métricas
- [ ] Acessar `/painel`
- [ ] **Validação:**
  - [ ] KPI "Visualizações" exibe número correto
  - [ ] KPI "Contatos" exibe número correto
  - [ ] KPI "Conversão" exibe percentual correto
  - [ ] Cards de mesa exibem métricas individuais

### 5.2. Listagem de Mesas
- [ ] **Validação:**
  - [ ] Todas as mesas do GM listadas
  - [ ] Campos básicos visíveis (título, sistema, status)
  - [ ] Botões de ação presentes (Editar, Ativar/Desativar, Deletar)
  - [ ] Loading states funcionam

---

## Cenário 6: Regressões Conhecidas

### 6.1. Criação sem Sistema
- [ ] Tentar criar mesa pulando Step 2 (sistema)
- [ ] **Esperado:** Erro claro no frontend antes de submit
- [ ] **Não esperado:** Erro genérico após 6 steps

### 6.2. Edição com System_ID Inválido
- [ ] Editar mesa
- [ ] Manipular DOM para alterar system_id para UUID inválido
- [ ] Submeter
- [ ] **Esperado:** Erro 400 com mensagem clara
- [ ] **Não esperado:** Erro 500 genérico

### 6.3. Edição Carrega Dados Completos
- [ ] Editar mesa com múltiplos schedules e contatos
- [ ] **Validação:**
  - [ ] Todos os schedules carregados
  - [ ] Todos os contatos carregados
  - [ ] Campos avançados carregados
  - [ ] Sem perda de dados

---

## Validação de Banco de Dados (Pós-Testes)

### Integridade Referencial
```sql
-- Verificar schedules órfãos
SELECT * FROM table_schedules 
WHERE table_id NOT IN (SELECT id FROM tables);
-- Esperado: 0 registros

-- Verificar contatos órfãos
SELECT * FROM table_contacts 
WHERE table_id NOT IN (SELECT id FROM tables);
-- Esperado: 0 registros
```

### Persistência de Campos REQ-26
```sql
-- Verificar campos avançados persistidos
SELECT id, title, master_display_name, campaign_length, 
       session_zero_free, requires_pc 
FROM tables 
WHERE master_display_name IS NOT NULL;
-- Esperado: Registros com campos preenchidos
```

### Persistência de Campos REQ-28 Fase 6
```sql
-- Verificar campos editoriais persistidos
SELECT id, title, synopsis_narrative, benefits_text, gm_bio 
FROM tables 
WHERE synopsis_narrative IS NOT NULL 
   OR benefits_text IS NOT NULL 
   OR gm_bio IS NOT NULL;
-- Esperado: Registros com campos preenchidos
```

---

## Critérios de Aprovação

### Bloqueadores (P1) — OBRIGATÓRIOS
- [ ] ✅ Edição de mesa funciona (não cria duplicata)
- [ ] ✅ Ativação/desativação funciona
- [ ] ✅ Deleção admin funciona

### Graves (P2) — OBRIGATÓRIOS
- [ ] ✅ Edição carrega dados completos
- [ ] ✅ Campos editoriais Fase 6 persistem
- [ ] ✅ Admin DELETE remove schedules
- [ ] ✅ Validações backend no PUT funcionam

### Moderadas (P3) — DESEJÁVEIS
- [ ] Validações frontend bloqueiam submit inválido
- [ ] Mensagens de erro claras e contextualizadas
- [ ] Loading states em todas as ações

---

## Registro de Falhas Encontradas

| ID | Cenário | Descrição | Gravidade | Status |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

## Conclusão da Validação

**Data:** ___/___/______  
**Responsável:** _______________________  
**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas  
**Observações:**

---

**Próximo passo:** Se aprovado, merge para `dev` e atualização de `RESUMO_EXECUCAO.md`.
