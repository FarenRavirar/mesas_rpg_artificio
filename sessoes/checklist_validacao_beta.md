# Checklist de Validação Beta — Template

## Informações do Requisito
- **ID:** REQ-XX
- **Título:** [Nome do requisito]
- **Data de deploy:** DD/MM/AAAA
- **Responsável pela validação:** [Nome/Role]
- **Prazo de validação:** DD/MM/AAAA (máx. 7 dias após deploy)

---

## Checklist de Validação

### 1. Deploy e Infraestrutura
- [ ] Deploy realizado com sucesso no beta
- [ ] Containers reiniciados (se necessário)
- [ ] Migrations aplicadas (se aplicável)
- [ ] Build sem erros TypeScript
- [ ] Logs da API sem erros críticos

### 2. Smoke Test Básico
- [ ] Funcionalidade principal acessível
- [ ] Sem erros 500 em operações básicas
- [ ] Sem erros de console no frontend
- [ ] Autenticação funcionando corretamente

### 3. Fluxo Ponta a Ponta
- [ ] Fluxo completo executado manualmente
- [ ] Dados persistidos corretamente no banco
- [ ] Dados exibidos corretamente na UI
- [ ] Validações de negócio funcionando

### 4. Casos de Borda
- [ ] Campos obrigatórios validados
- [ ] Campos opcionais tratados corretamente
- [ ] Erros de validação exibem mensagens claras
- [ ] Operações concorrentes não causam inconsistência

### 5. Regressões
- [ ] Funcionalidades existentes não foram quebradas
- [ ] Performance não degradou significativamente
- [ ] UX não piorou em relação à versão anterior

### 6. Documentação
- [ ] README atualizado (se aplicável)
- [ ] ARQUITETURA_PROJETO.md atualizado (se aplicável)
- [ ] ERRORS_SOLUTIONS.md atualizado (se novos erros)
- [ ] TODO_OPERACIONAL.md atualizado

---

## Resultado da Validação

**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas

**Problemas identificados:**
1. [Descrição do problema]
2. [Descrição do problema]

**Ações corretivas necessárias:**
1. [Ação necessária]
2. [Ação necessária]

**Observações:**
[Comentários adicionais]

---

**Data de conclusão da validação:** DD/MM/AAAA  
**Validado por:** [Nome]
