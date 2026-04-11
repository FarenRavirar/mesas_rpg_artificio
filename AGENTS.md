# AGENTS.md

Governança de agentes de IA neste repositório — **Anúncios de Mesas RPG (Portal Colaborativo)**.

> **Fonte canônica de governança.** Em conflito com qualquer outro arquivo de instrução, este prevalece.
> Em conflito com `ARQUITETURA_PROJETO.md` sobre arquitetura ou contratos técnicos, prevalece `ARQUITETURA_PROJETO.md`.

---

## 🚨 LEIA ISTO PRIMEIRO — PROTOCOLO OBRIGATÓRIO DE INÍCIO DE SESSÃO

> [!CAUTION]
> **PARE AGORA. NÃO FAÇA NADA ANTES DE LER ESTE ARQUIVO COMPLETO.**
>
> Se você é um agente de IA iniciando uma nova sessão neste projeto:
> 1. **LEIA ESTE ARQUIVO (`AGENTS.md`) NA ÍNTEGRA AGORA** — não pule para a checklist
> 2. **LEIA `RESUMO_EXECUCAO.md`** — estado atual do projeto
> 3. **SOMENTE ENTÃO** comece a trabalhar seguindo a checklist abaixo
>
> **Por quê?** Agentes que pulam esta etapa causam:
> - Aplicação de migrations antigas que apagam dados (E136)
> - Retrabalho por não consultar `ERRORS_SOLUTIONS.md` (5+ horas perdidas)
> - Violação de regras pétreas (commit sem autorização, instalação de software)
>
> **Você foi avisado.** Se você pular esta leitura e causar problemas, a responsabilidade é sua.

---

## ⚠️ CHECKLIST OBRIGATÓRIA — EXECUTAR NO INÍCIO DE QUALQUER SESSÃO

> [!CAUTION]
> Não pular nenhum item. A checklist existe para evitar retrabalho, não como formalidade.

### 1 — Ao iniciar a sessão (imediatamente)
- [ ] Ler `RESUMO_EXECUCAO.md` — estado atual e próxima ação do projeto
- [ ] Ler este arquivo (`AGENTS.md`) na íntegra

### 2 — Antes de modificar código
- [ ] Consultar `GUIA_RAPIDO_OPERACIONAL.md` — índice de roteamento rápido por situação
- [ ] Ler **apenas a seção relevante** de `ARQUITETURA_PROJETO.md` (nunca na íntegra)
- [ ] Consultar `GIT_WORKFLOW.md` se a tarefa envolver Git, branch ou deploy

### 3 — Por situação específica
- [ ] **Erro encontrado?** → `ERRORS_SOLUTIONS.md` — imediatamente, antes de tentar corrigir
- [ ] **Planejando feature ou verificando rotas em falta no front?** → `TODO_OPERACIONAL.md` e `MAPA_DE_API.md`
- [ ] **Executando lote?** → `FILA_IMPLEMENTACAO.md`
- [ ] **Deploy ou produção?** → `PRE_DEPLOY_CHECKLIST.md` — **OBRIGATÓRIO ANTES DE QUALQUER DEPLOY**
- [ ] **Operação em produção ou beta?** → `OPERACAO_PRODUCAO.md`
- [ ] **Falha de ambiente, encoding ou template?** → `PRE-FLIGHT_CHECKLIST.md`

### 4 — Durante execução
- [ ] Validar qualquer mudança de interface contra as 10 Heurísticas de Nielsen (ver §Regras Específicas)
- [ ] [!CAUTION] **Nunca** executar `git commit` ou `git push` sem autorização explícita do responsável

### 5 — Ao finalizar a sessão
- [ ] Atualizar documentos afetados pela task (TODO, FILA, ERRORS_SOLUTIONS, GUIA_RAPIDO_OPERACIONAL)
- [ ] **Modificou rotas da API?** → OBRIGATÓRIO atualizar o `MAPA_DE_API.md` mapeando a adição, remoção ou link com o Front.

---

## Contexto do Projeto

**O que é:** Aplicação fullstack 100% tipada — React/TypeScript (Frontend) + Node.js/TypeScript (Backend) + PostgreSQL — para descoberta e publicação de mesas de RPG no Brasil. Inclui autenticação via Google OAuth e autopublicação por mestres.

**Ecossistema:** Projeto coirmão do Grande Glossário de RPG. Compartilha infraestrutura Oracle on-premise, identidade visual Artifício e filosofia comunitária. Repositórios e containers independentes.

**Ambientes:**
| Ambiente | URL | Branch Git | Pasta no servidor |
|---|---|---|---|
| Beta (ativo) | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` |
| Produção (prevista) | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` |

**Fluxo de deploy:** `feature/<escopo>` → `dev` (beta) → aprovação → `main` (produção).

A produção ainda não foi publicada operacionalmente nesta rodada. O desenvolvimento e validação ocorrem no beta.

---

## Roteamento de Contexto

Consulte o arquivo correto para a situação. Não leia documentos que não sejam relevantes para a task atual.

| Situação | Arquivo |
|---|---|
| Banco de dados, modelo de dados, rotas de API | `ARQUITETURA_PROJETO.md` §4 e §12 |
| Imagens, upload, Imgur | `ARQUITETURA_PROJETO.md` §16 |
| Roles, permissões, autenticação | `ARQUITETURA_PROJETO.md` §5 e §6 |
| Decisões arquiteturais e justificativas | `ARQUITETURA_PROJETO.md` §14 |
| Git, branch, merge, deploy | `GIT_WORKFLOW.md` |
| Operação em produção ou beta | `OPERACAO_PRODUCAO.md` |
| Falha de ambiente, encoding ou template | `PRE-FLIGHT_CHECKLIST.md` |
| Erro recorrente com solução validada | `ERRORS_SOLUTIONS.md` |
| Backlog de requisitos (visão de produto, score GUT) | `TODO_OPERACIONAL.md` |
| Fila de execução técnica por lote/fase | `FILA_IMPLEMENTACAO.md` |
| Índice rápido e checklists de fechamento | `GUIA_RAPIDO_OPERACIONAL.md` |
| Estado atual e próxima ação | `RESUMO_EXECUCAO.md` |
| Histórico de sessões anteriores | `/sessoes/` |

---

## Fontes de Verdade (Single Source of Truth)

| Informação | Fonte canônica |
|---|---|
| Arquitetura, contratos, modelo de dados, decisões técnicas | `ARQUITETURA_PROJETO.md` |
| Estado atual do projeto e próxima ação | `RESUMO_EXECUCAO.md` |
| Fluxo de Git, merge e deploy | `GIT_WORKFLOW.md` |
| Operação de produção/beta e validação pós-deploy | `OPERACAO_PRODUCAO.md` |
| Diagnóstico prévio de ambiente | `PRE-FLIGHT_CHECKLIST.md` |
| Falhas recorrentes e soluções validadas | `ERRORS_SOLUTIONS.md` |
| Backlog de requisitos de produto (REQ-xx, score GUT) | `TODO_OPERACIONAL.md` |
| Fila técnica de execução por lote/fase | `FILA_IMPLEMENTACAO.md` |
| Mapeamento de quais rotas do backend existem e quem as consome | `MAPA_DE_API.md` |
| Roteamento rápido por situação e checklists de tarefa | `GUIA_RAPIDO_OPERACIONAL.md` |
| Registro histórico de sessões de trabalho | `/sessoes/` |

---

## Diferença entre TODO_OPERACIONAL e FILA_IMPLEMENTACAO

**TODO_OPERACIONAL.md** — visão de produto:
- Backlog de requisitos de produto (REQ-01, REQ-02, etc.)
- Granularidade alta: features completas (ex: "Painel do mestre com autopublicação")
- Score GUT (Gravidade / Urgência / Tendência)
- Status: `Concluído`, `Em validação beta`, `Em aberto`, `Planejado`
- Consultar ao: planejar novas features, priorizar trabalho, entender roadmap

**FILA_IMPLEMENTACAO.md** — visão técnica:
- Fila de execução por lote/fase (001, 002, etc.)
- Granularidade baixa: tarefas técnicas (ex: "Criar migration_05", "Endpoint GET /tables")
- Status: `pendente`, `em_execucao`, `concluido`, `descartado`
- Consultar ao: executar lote, fazer deploy, rastrear itens técnicos

**Relação:** Um REQ do TODO pode gerar múltiplos itens na FILA.
Exemplo: REQ-06 (Painel do mestre) → itens 022, 023, 024 na FILA.
**TODO = "O QUÊ fazer" (produto) | FILA = "COMO fazer" (técnico)**

---

## Princípios de Execução

### Princípio Central: Engineering-first e Confiabilidade

Nunca produzir código sem:
1. Entender o contexto da task
2. Consultar a seção de arquitetura aplicável
3. Propor plano curto e aguardar confirmação (se escopo for ambíguo)
4. Executar mudança mínima
5. Comunicar em português

### Assertividade Operacional

> [!CAUTION]
> **REGRA ANTI-TRAVAMENTO:** Agentes que entram em loops de re-análise causam travamento da sessão.
> Ver `sessoes/resumo_09-04_diagnostico-travamento.md` para análise completa do problema.

Quando o plano está claro e aprovado:
- **Executar diretamente** — sem loops de investigação desnecessários
- **Consultar documentação canônica UMA VEZ**, não repetidamente
- **Aplicar mudanças incrementais** sem re-análise completa a cada passo
- **Reportar progresso** de forma concisa, sem restatement excessivo
- **Nunca re-ler arquivos já lidos na mesma sessão** a menos que tenham sido modificados

**Checklist mental antes de cada ação:**
```
[ ] Já li este arquivo nesta sessão?
[ ] O plano está claro?
[ ] Esta ação é de execução ou investigação?
[ ] Estou prestes a re-analisar algo que já analisei?
```

**Parar para perguntar quando:**
- Conflito entre requisito e arquitetura
- Decisão de produto não documentada
- Risco de quebra de contrato público
- Ambiguidade crítica no escopo

**Não parar quando:**
- Implementação de feature já especificada
- Ajuste de UX dentro do padrão estabelecido
- Correção de bug com solução conhecida em `ERRORS_SOLUTIONS.md`
- Atualização de documentação por delta

**Comportamento proibido que causa travamento:**
- ❌ Re-ler o mesmo arquivo múltiplas vezes na mesma sessão
- ❌ Consultar ARQUITETURA_PROJETO.md repetidamente
- ❌ Pedir confirmação para cada linha de código
- ❌ Entrar em loop de "vou analisar X para entender Y"
- ❌ Reformular o mesmo plano múltiplas vezes sem executar
- ❌ **NUNCA usar "arquivo muito grande" como desculpa para não terminar tarefa. Se o arquivo tem 10.000 linhas, limpe linha por linha se necessário. Tamanho do arquivo NÃO é motivo válido para parar.**

---

## REGRA ANTI-CONCLUSÃO PREMATURA

> [!CAUTION]
> **REGRA CRÍTICA:** Agentes que usam `attempt_completion` antes de terminar COMPLETAMENTE a tarefa causam retrabalho massivo e frustração do usuário.

### Protocolo Obrigatório Antes de attempt_completion

**1. Executar Busca Final Completa:**
```bash
# OBRIGATÓRIO executar ANTES de attempt_completion:
busca_final = buscar_em_todos_arquivos(padrão_da_tarefa)
if busca_final.count > 0:
    continuar_trabalhando()  # Tarefa NÃO está completa
else:
    attempt_completion()  # Tarefa está completa
```

**2. Verificar Checklist Completa:**
- Toda tarefa DEVE ter checklist criada no início
- TODOS os itens devem estar marcados [x]
- Se houver 1 item [ ] pendente = tarefa NÃO está completa

**3. Critério de Conclusão EXPLÍCITO:**

Tarefa só está completa quando:
- ✅ Busca final retorna **ZERO** resultados
- ✅ **TODOS** os itens da checklist estão [x] marcados
- ✅ **Nenhum** arquivo parcialmente modificado
- ✅ **Nenhuma** palavra como "parcial", "restante", "70%", "alguns" na conclusão

**4. PROIBIDO attempt_completion se:**
- ❌ Busca ainda retorna resultados (mesmo que "só 1 arquivo")
- ❌ Checklist tem itens [ ] pendentes
- ❌ Você usou palavras: "parcial", "restante", "alguns", "maioria", "principais"
- ❌ Você disse: "documentação técnica não foi limpa"
- ❌ Você disse: "X de Y arquivos" onde X < Y
- ❌ Você disse: "70% limpo" ou qualquer porcentagem < 100%

### Exemplos de ERRO (Conclusão Prematura)

❌ **ERRADO:** "9 de 10 arquivos limpos" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "70% limpo" → NÃO ESTÁ COMPLETO  
❌ **ERRADO:** "documentação técnica não foi limpa" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "referências restantes são contextuais" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "principais arquivos limpos" → NÃO ESTÁ COMPLETO

### Exemplo CORRETO

✅ **CORRETO:**
```
Busca final executada: 0 resultados encontrados
Checklist: 30/30 itens marcados [x]
Nenhum arquivo pendente
Tarefa 100% completa
```

### Fluxo Obrigatório

```
1. Receber tarefa
2. Criar checklist COMPLETA de TODOS os arquivos/passos
3. Executar cada item da checklist
4. Marcar [x] cada item concluído
5. Quando achar que terminou:
   a. Executar busca final
   b. Se busca retornar > 0: voltar ao passo 3
   c. Se busca retornar 0: verificar checklist
   d. Se checklist tem [ ]: voltar ao passo 3
   e. Se checklist 100% [x] E busca = 0: attempt_completion
```

---

## Regras Pétreas (Inegociáveis)

> [!CAUTION]
> As regras abaixo não têm exceção. Violá-las causa retrabalho, perda de dados ou quebra de confiança.

### Resolução de Erros
Ao deparar com qualquer erro (`stderr`, falha de execução, crash de script ou falha na pipeline):
1. **Interromper tentativas imediatamente**
2. Consultar `ERRORS_SOLUTIONS.md`
3. Se o erro constar lá: aplicar a solução documentada
4. Se não constar: descobrir a solução e **registrar no arquivo antes de seguir para a próxima task**

### Migrations e Alterações de Schema (A REGRA ANTI-FRANKENSTEIN)

> [!CAUTION]
> **REGRA ABSOLUTA DE INTEGRIDADE DO BANCO DE PRODUÇÃO:**
> O Banco de Dados de Produção não é um ambiente de testes e não suporta "remendos" manuais para consertar features caídas.

**Antes de aplicar QUALQUER migration no Deploy:**
1. **Obrigatório Dump Prévio:** Se o deploy que você está realizando enviar migrations que contém `TRUNCATE`, `DROP`, ou `DELETE` ou mexem em colunas (ex via Prisma/Typeorm ou raw SQL), você OBRIGATORIAMENTE deve executar um backup/dump em Produção através da instrução no `PRE_DEPLOY_CHECKLIST.md`. Nunca assuma segurança implícita.
2. **Schema Alignment (Paridade Obrigatória):** Nenhuma alteração estrutural ocorre em Produção antes de ter rodado por script contínuo e testado exaustivamente no banco Beta primeiro. O deploy será falho ou rejeitado caso tente pular a vida em Dev.

**Quando a Produção Quebra Após Deploys (Falta de Coluna / Relation does not exist):**
- ❌ **O QUE VOCÊ NÃO DEVE FAZER:** Você não está autorizado a iniciar investigações abrindo o `psql` na Produção e emitindo `ALTER TABLE tables ADD COLUMN...`. Isso cria um Schema "Frankenstein" desassociado do código gerador real. O que causou o maior trauma de governança no dia 09/04/2026 foi tentar consertar Produção quebrando com patches avulsos pelo terminal ao invés de buscar a raiz.
- ✅ **O QUE VOCÊ DEVE FAZER (Rollback):** Sua primeira ação imediata deve ser desfazer o código da Aplicação, retornando os containers ao Commit / Snapshot anterior que dialogava nativamente com aquela exata forma do Banco (ver seção **PROTOCOLO GERAL DE EMERGÊNCIA (ROLLBACK)** do `PRE_DEPLOY_CHECKLIST.md`). Diagnosticaremos do Beta de forma perfeitamente assíncrona após restabelecer a paz da via mestre.

**Migrations antigas (criadas há mais de 1 semana):**
- **NUNCA DEIXE MIGRATIONS REPETIREM.** Os arquivos em `database/*.sql` não são ferramentas de debugging; não reexecute e não tente reler `.sql` antigos na Produção. Isso causa falhas silenciosas que expurgam dados inteiros (E136 catalogado em `ERRORS_SOLUTIONS.md`).

### Contenção de Agentes — Ações Destrutivas Proibidas

> [!CAUTION]
> **PARE ANTES DE EXECUTAR. LEIA ESTA SEÇÃO A CADA VEZ QUE FOR EXECUTAR UM COMANDO.**

**Definição de ação destrutiva:**
Qualquer comando que: escreva em disco no servidor, reinicie processo/container, delete arquivo, modifique configuração em produção, copie arquivos para servidor, ou afete outros usuários.

**Proibido sem aprovação explícita do usuário:**
- ❌ Reiniciar containers ou serviços (`docker restart`, `systemctl restart`)
- ❌ Copiar ou sobrescrever arquivos em produção (`scp`, `docker cp` para servidor)
- ❌ Executar builds e deployar artefatos no servidor
- ❌ Modificar arquivos fora do escopo da tarefa descrita
- ❌ Investigar bugs não mencionados na tarefa atual
- ❌ "Corrigir" problemas encontrados durante investigação sem autorização

**Comportamento obrigatório:**
1. ✅ **"Investigar" significa:** ler arquivos, executar comandos read-only (`ls`, `cat`, `grep`, `docker logs`, `curl -s`), relatar findings
2. ✅ **"Investigar" NÃO significa:** modificar, copiar, reiniciar, ou deployar
3. ✅ Ao encontrar um problema durante investigação: **PARE e descreva o que encontrou**
4. ✅ Apresente o plano completo antes de executar qualquer comando destrutivo
5. ✅ Execute uma ação por vez, aguarde confirmação
6. ✅ Se o escopo da tarefa não estiver claro, pergunte antes de agir
7. ✅ Nunca assuma que "reiniciar vai resolver" — pergunte primeiro

**Comandos read-only permitidos sem aprovação:**
- `docker ps`, `docker logs`, `docker stats`, `docker inspect`
- `ls`, `cat`, `grep`, `find`, `head`, `tail`
- `curl -s` (GET requests)
- `psql` com `SELECT` (nunca `INSERT`, `UPDATE`, `DELETE` sem aprovação)

**Comandos que SEMPRE exigem aprovação:**
- `docker restart`, `docker stop`, `docker start`
- `scp`, `rsync`, `docker cp` (para servidor)
- `npm run build` (no servidor)
- `git commit`, `git push`
- `psql` com `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`

**Formato de solicitação de aprovação:**
```
## 🛑 APROVAÇÃO NECESSÁRIA

**Ação:** [descrever o que será feito]
**Motivo:** [por que é necessário]
**Risco:** [o que pode dar errado]
**Rollback:** [como desfazer se necessário]

**Comandos que serão executados:**
1. comando1
2. comando2

Posso prosseguir?
```

### Git — Commit e Push
`git commit` e `git push` são **proibidos sem autorização explícita do responsável no chat**. O agente realiza as edições locais e para, aguardando revisão e aprovação antes de commitar.

### Documentação — Onde Registrar
Antes de adicionar ou mover qualquer informação em arquivos de documentação:
1. Perguntar: "Esta informação é de produto (feature) ou técnica (tarefa/arquivo específico)?"
2. Se **requisito de produto** → `TODO_OPERACIONAL.md`
3. Se **tarefa técnica** → `FILA_IMPLEMENTACAO.md`
4. Se **erro com solução validada** → `ERRORS_SOLUTIONS.md`
5. **Nunca registrar no lugar errado.** Isso gera confusão e retrabalho.

### Confirmação de Interpretação
Antes de implementar requisito complexo ou ambíguo, o agente deve:
1. Reformular o requisito em suas próprias palavras
2. Apresentar a interpretação de forma estruturada
3. Aguardar confirmação explícita antes de prosseguir

**Formato de confirmação:**
```
## Entendi o requisito como:

[Descrição clara do que será feito]

**Comportamento esperado:**
1. [Passo 1]
2. [Passo 2]

**Arquivos que serão modificados:**
- arquivo1.tsx
- arquivo2.ts

Isso está correto? Posso prosseguir?
```

### Changelog — Linguagem e Formato Obrigatórios
**Toda mudança visível ao usuário final DEVE ter entrada no changelog (`database/changelogs.json`) antes do deploy.** Não há exceções.

**Regras obrigatórias:**
1. **Data/hora explícita** — usar formato ISO 8601 com timezone (`YYYY-MM-DDTHH:MM:SS-03:00`)
2. **Rodapé com data/hora** — incluir linha `_Atualização publicada em DD/MM/YYYY às HH:MM_` no final do body
3. **Linguagem 100% leiga** — sem jargão técnico, explicar benefícios para o usuário final
4. **Arquivo JSON versionado** — adicionar entrada em `database/changelogs.json` e commitar junto com o código

**Formato obrigatório:**
```json
{
  "id": "YYYY-MM-DD-descricao-curta",
  "title": "Título Curto e Descritivo",
  "body": "Descrição em linguagem familiar e leiga com bullets:\n\n• **Primeira mudança** - Explicação do benefício para o usuário\n• **Segunda mudança** - O que melhorou na experiência\n• **Terceira mudança** - Como isso ajuda o usuário\n\nFrase de encerramento convidativa! 🎲\n\n_Atualização publicada em DD/MM/YYYY às HH:MM_",
  "type": "app",
  "published": true,
  "created_at": "YYYY-MM-DDTHH:MM:SS-03:00"
}
```

**Como adicionar novo changelog:**
1. Abrir `database/changelogs.json`
2. Adicionar novo objeto no início do array (mais recente primeiro)
3. Commitar junto com o código da feature

**Linguagem obrigatória: familiar, leiga e acessível.**
- ❌ **NUNCA** usar jargão técnico: "sidebar vertical", "overflow-x", "placeholder visual", "migration", "refactor"
- ✅ **SEMPRE** explicar o benefício: "filtros no topo", "mais espaço para ver as mesas", "dado bonitinho"
- ❌ **NUNCA** descrever implementação: "Implementado fallback de imagem com gradient"
- ✅ **SEMPRE** descrever resultado: "Mesas sem foto agora mostram um dado 🎲"

**Exemplos corretos:**
- "Agora os filtros ficam no topo da página, deixando mais espaço para você ver as mesas"
- "Mesas sem foto agora mostram um dado 🎲 bonitinho"
- "Os botões de WhatsApp e Discord agora abrem direitinho"
- "Você vê o link real embaixo do botão para copiar se quiser"

**Exemplos PROIBIDOS:**
- "Migração de sidebar vertical para barra horizontal sticky"
- "Implementado placeholder visual com fallback"
- "Refatoração do componente TableCard"
- "Correção de bug no handler de click"

**Quando criar changelog:**
- Mudança de UI/UX visível
- Nova funcionalidade acessível ao usuário
- Correção de bug que o usuário percebe
- Melhoria de performance perceptível
- Mudança de comportamento existente

**Quando NÃO criar changelog:**
- Refactor interno sem impacto visível
- Mudança de dependência sem efeito perceptível
- Correção de bug que nunca chegou em produção
- Melhoria de código sem mudança de comportamento

---

## Regras Gerais de Código

- **Mudança mínima** — sem refactor massivo, sem quebrar contratos existentes
- **Mudança reversível** — preferir abordagens que possam ser desfeitas
- **Lógica de interface, busca e filtros** → Frontend (React/TypeScript)
- **Lógica de autenticação e permissões** → Backend (Node.js/TypeScript via JWT). O frontend nunca decide segurança.
- **Python** → exclusivamente para scripts de infraestrutura, conversão e importação de dados fora do runtime da API principal (ex: `discord_message_parser.py`)
- **Upload e processamento de imagens** (conversão WebP, envio ao Imgur) → sempre no Backend, nunca no Frontend
- **`cover_deletehash`, `avatar_deletehash`, `banner_deletehash`** → campos internos, **nunca retornados por rotas públicas da API**

---

## Regras Específicas do Projeto

**Imgur:** `IMGUR_CLIENT_ID` é variável de ambiente obrigatória. Nunca hardcodar, nunca expor no Frontend, nunca versionar com valor real. Usar `.env.example` com placeholder.

**Google OAuth:** Único método de autenticação. Não implementar login por e-mail/senha local sem autorização explícita do responsável.

**Discord:** Quando implementado, será vínculo opcional de perfil para contexto comunitário e selos. Não substitui o Google OAuth como autenticação principal.

**Elevação de role:** Um `player` torna-se `gm` ao criar o primeiro `gm_profile`. Lógica exclusiva do Backend — o Frontend não decide elevação de role.

**Compromissos públicos inegociáveis** (ver `ARQUITETURA_PROJETO.md` §10): gratuidade, sem anúncios e sem coleta desnecessária de dados são restrições de produto. Nenhuma feature pode violar esses compromissos.

**Heurísticas de Nielsen (UX obrigatória):** Toda mudança de interface deve respeitar as 10 heurísticas desde o design. Ao propor ou implementar qualquer componente, modal, formulário ou fluxo, validar contra: (1) Visibilidade do status, (2) Compatibilidade com o mundo real, (3) Controle e liberdade, (4) Consistência, (5) Prevenção de erros, (6) Reconhecimento vs memorização, (7) Eficiência e flexibilidade, (8) Design minimalista, (9) Recuperação de erros, (10) Ajuda e documentação. Interfaces que violam essas heurísticas devem ser corrigidas antes do merge.

**Nome do banco:** O banco PostgreSQL se chama `mesas_rpg`, não `mesas`. Ver `ERRORS_SOLUTIONS.md` E059.

---

## Protocolo de Sessão

> [!IMPORTANT]
> Ao iniciar qualquer nova sessão (nova conversa ou retomada após interrupção), criar imediatamente um arquivo de resumo.

**Nome:** `resumo_[dia-mes]_[task-curta].md`  
**Localização:** `/sessoes/`  
**Exemplo:** `sessoes/resumo_11-04_limpeza-documentacao.md`

**Conteúdo mínimo obrigatório:**
1. **Objetivo da sessão** — o que será feito (1-2 frases)
2. **Plano de execução** — lista numerada de passos principais
3. **Task list embutida** — checklist `[ ]` / `[x]` de cada item do plano
4. **Arquivos-alvo** — lista de arquivos que serão modificados
5. **Critério de conclusão** — como saber que a task está completa
6. **Último item obrigatório:** `[ ] Atualizar documentos relevantes`

O resumo deve ser atualizado conforme o progresso, marcando `[x]` e registrando decisões importantes inline. Ao final, o arquivo em `/sessoes/` serve de registro histórico para qualquer agente retomar o trabalho sem perda de contexto.

---

## Protocolo de Git

Consultar e seguir `GIT_WORKFLOW.md` antes de qualquer alteração versionável.

**Branches:**
- `feature/<escopo>` → criada a partir de `dev`
- `dev` → deploy automático em beta (`mesasbeta.artificiorpg.com`)
- `main` → deploy em produção (quando publicação operacional estiver ativa)

**Decisões automáticas em tarefas com fluxo Git ativo:**

| Pergunta | Resposta automática |
|---|---|
| Criar branch `feature/<escopo>` a partir de `dev`? | Sim, por padrão |
| PR para `dev` com squash and merge? | Sim, por padrão |
| Haverá release após o merge? | Não — só se o responsável solicitar explicitamente |

A única exceção é quando o escopo da branch for ambíguo — nesse caso, perguntar apenas o nome do escopo.

> [!CAUTION]
> `git commit` e `git push` são proibidos sem autorização explícita no chat. Ver regra pétrea acima.

---

## Infraestrutura e Diagnóstico

**VM Oracle:** Possui `gh` autenticado para a conta mantenedora. Para limitações do `gh` na VM, ver `GIT_WORKFLOW.md` §8 e `ERRORS_SOLUTIONS.md` E055/E056.

**Token/PAT:** Nunca registrar, expor ou versionar em chat, logs, commits ou arquivos do repositório.

**Diagnóstico read-only** — permitido sempre, sem autorização: `docker ps`, `docker logs`, `docker stats`

**Comandos com alteração de estado** — exigem autorização explícita do responsável no chat.

**Cloudflare Tunnel:** A VM possui túnel mestre interligado à rede Docker interna. Agentes **nunca** devem criar novos túneis, baixar containers `cloudflared` paralelos ou solicitar Tokens ao usuário para expor novos containers. Novos ambientes são expostos via Public Hostname no painel Cloudflare, referenciando o container alvo (ex: `http://mesas-beta-frontend:80`).

**Acesso SSH:** A VM Oracle está acessível via SSH. Métodos de conexão, credenciais e regras de uso estão documentados em `OPERACAO_PRODUCAO.md` §3. **Não pergunte como se conectar — a documentação já existe.** Use comandos read-only para diagnóstico (`docker ps`, `docker logs`, `cat`, `grep`) e solicite aprovação antes de qualquer comando destrutivo.

**Credenciais do PostgreSQL:**
```bash
# Acesso padrão ao banco no beta:
docker exec mesas-beta-db psql -U admin -d mesas_rpg

# Confirmar credenciais em runtime:
docker exec mesas-beta-db env | grep POSTGRES
```

**PowerShell:** Scripts rodam no PowerShell 7.6.0 (ou compatível com `pwsh`).

**Arquivos temporários e de teste:** Devem ser alocados em `/testes/`. É proibido criar scripts de diagnóstico na raiz do projeto.

---

## Validação e Rollback

**Validações obrigatórias antes de concluir qualquer task:**
- Decisões operacionais referenciam arquivo canônico correto
- Fluxo de Git segue `GIT_WORKFLOW.md`
- Comunicação com o usuário está em português
- Mudanças em backlog mantêm `Score GUT` e `status real` consistentes em `TODO_OPERACIONAL.md`
- Mudanças em execução mantêm status consistente em `FILA_IMPLEMENTACAO.md`
- Toda interação com dados passa pela API Backend com JWT válido
- Toda operação de imagem (upload, substituição, exclusão) é registrável via `imgur_cleanup_log`
- `GUIA_RAPIDO_OPERACIONAL.md` atualizado por delta se houver mudança de contrato, checklist ou fluxo operacional recorrente

**Em caso de conflito de interpretação:**
1. Usar apenas `AGENTS.md` + `ARQUITETURA_PROJETO.md`
2. Registrar lacuna em `TODO_OPERACIONAL.md`
3. Aplicar ajuste mínimo de documentação

**Em caso de conflito entre arquivos:** `ARQUITETURA_PROJETO.md` prevalece sobre qualquer outro documento de arquitetura. `AGENTS.md` prevalece sobre qualquer outro documento de governança de agentes.

---

## Idioma

Toda comunicação produzida por agentes deve ser em **português**:
- Respostas em chat
- Mensagens de erro na UI
- Logs visíveis ao usuário
- Explicações e planos de execução

Elementos técnicos permanecem no formato original: nomes de arquivos, comandos, funções, identificadores de código.

---

## Formato de Resposta Esperado

```
Contexto         — o que foi entendido
Plano curto      — o que será feito (lista numerada)
Execução         — patches incrementais
Validação        — o que foi verificado
Riscos           — o que pode dar errado
Rollback         — como desfazer se necessário
```

---

## Sugestão de Tecnologia

Se o agente identificar uma tecnologia, biblioteca ou ferramenta que resolva um problema crônico de forma mais profissional, **pode e deve sugerir ativamente**, sempre priorizando a solução correta sobre a gambiarra. A sugestão não é autorização para implementar — aguardar aprovação do responsável.

---

## Limite de Escopo

Este arquivo define apenas governança de agentes. Não descreve arquitetura detalhada nem runbook operacional. Para esses fins, consultar `ARQUITETURA_PROJETO.md` e `OPERACAO_PRODUCAO.md`.

