# Diagnóstico: Problema de Travamento do Agente

**Data:** 09/04/2026 08:22 BRT  
**Contexto:** Agente travando nas últimas 2 sessões ao trabalhar com Git

---

## Sintoma Relatado

"Você está travando o tempo todo, travou nos últimos 2 chats, quando mexe com algo do git"

**Esclarecimento do usuário:** "Não são nas operações git, você que trava. O git funcionou normalmente todas as vezes"

---

## Causa Raiz Identificada

O agente está **violando o princípio de Assertividade Operacional** definido em `AGENTS.md` §Princípios de Execução.

### Comportamento Incorreto Atual

1. **Loop de re-análise excessiva**
   - Consulta documentação repetidamente mesmo após já ter o contexto
   - Re-lê arquivos que já foram lidos na mesma sessão
   - Reformula o mesmo plano múltiplas vezes sem executar

2. **Investigação desnecessária**
   - Entra em modo investigativo quando o plano já está claro e aprovado
   - Pede confirmação para ações que já foram especificadas
   - Cria loops de "vou ler X para entender Y" ao invés de executar

3. **Falta de execução direta**
   - Não aplica a regra "Não parar quando: implementação de feature já especificada"
   - Não aplica a regra "Não parar quando: correção de bug com solução conhecida"
   - Não aplica a regra "Não parar quando: atualização de documentação por delta"

### Exemplo Concreto do Problema

**Situação típica que causa travamento:**
```
Usuário: "Corrija o bug X"
Agente: "Vou ler o arquivo Y para entender o contexto"
[lê arquivo Y]
Agente: "Agora vou ler o arquivo Z para confirmar"
[lê arquivo Z]
Agente: "Vou consultar ARQUITETURA_PROJETO.md"
[lê ARQUITETURA_PROJETO.md]
Agente: "Entendi o problema. Posso prosseguir?"
Usuário: "Sim"
Agente: "Vou ler o arquivo Y novamente para confirmar"
[LOOP INFINITO]
```

**O que deveria acontecer:**
```
Usuário: "Corrija o bug X"
Agente: [lê arquivo Y uma vez]
Agente: [aplica correção diretamente]
Agente: [reporta resultado]
```

---

## Regras Violadas (AGENTS.md)

### Assertividade Operacional — O que fazer

✅ **Executar diretamente quando:**
- Plano está claro e aprovado
- Feature já especificada
- Bug com solução conhecida em ERRORS_SOLUTIONS.md
- Ajuste de UX dentro do padrão estabelecido
- Atualização de documentação por delta

✅ **Consultar documentação canônica UMA VEZ**, não repetidamente

✅ **Aplicar mudanças incrementais** sem re-análise completa a cada passo

✅ **Reportar progresso** de forma concisa, sem restatement excessivo

### Assertividade Operacional — Quando parar

❌ **Parar para perguntar APENAS quando:**
- Conflito entre requisito e arquitetura
- Decisão de produto não documentada
- Risco de quebra de contrato público
- Ambiguidade crítica no escopo

❌ **NÃO parar quando:**
- Implementação de feature já especificada
- Ajuste de UX dentro do padrão estabelecido
- Correção de bug com solução conhecida
- Atualização de documentação por delta

---

## Solução Aplicada

### Mudança de Comportamento Obrigatória

1. **Leitura única de contexto**
   - Ler cada arquivo relevante UMA VEZ no início da task
   - Não re-ler a menos que o arquivo tenha sido modificado
   - Não consultar documentação repetidamente

2. **Execução direta**
   - Se o plano está claro → executar imediatamente
   - Se a solução está em ERRORS_SOLUTIONS.md → aplicar diretamente
   - Se é atualização de documentação → fazer o delta e seguir

3. **Comunicação concisa**
   - Reportar "Aplicando correção X" ao invés de "Vou analisar Y para entender Z"
   - Mostrar progresso real ao invés de intenções
   - Evitar restatement do que já foi dito

4. **Checklist mental antes de cada ação**
   ```
   [ ] Já li este arquivo nesta sessão?
   [ ] O plano está claro?
   [ ] Esta ação é de execução ou investigação?
   [ ] Estou prestes a re-analisar algo que já analisei?
   ```

---

## Teste de Validação

**Próxima task:** Item 139 (REQ-28) — Corrigir descrição incompleta

**Comportamento esperado:**
1. Ler `candidateToFormData.ts` UMA VEZ
2. Identificar o problema
3. Propor solução editorial
4. Implementar correção
5. Reportar resultado

**Comportamento proibido:**
1. ❌ Re-ler `candidateToFormData.ts` múltiplas vezes
2. ❌ Consultar ARQUITETURA_PROJETO.md repetidamente
3. ❌ Pedir confirmação para cada linha de código
4. ❌ Entrar em loop de "vou analisar X"

---

## Compromisso de Correção

A partir desta sessão, o agente se compromete a:

1. ✅ Executar diretamente quando o plano está claro
2. ✅ Consultar documentação UMA VEZ por sessão
3. ✅ Reportar progresso real, não intenções
4. ✅ Aplicar mudanças incrementais sem re-análise
5. ✅ Parar APENAS quando houver ambiguidade crítica

---

## Referências

- `AGENTS.md` §Princípios de Execução → Assertividade Operacional
- `AGENTS.md` §Regras Pétreas → Resolução de Erros
- `ERRORS_SOLUTIONS.md` → Soluções validadas para aplicação direta