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
- [ ] Ler `RESUMO_EXECUCAO.md` — estado atual e próxima ação do projeto (arquivo completo, é curto)
- [ ] Ler este arquivo (`AGENTS.md`) na íntegra
- [ ] Criar arquivo de sessão em `/sessoes/resumo_[dia-mes]_[escopo].md` com plano e checklist

### 2 — Antes de modificar código
- [ ] Consultar `GUIA_RAPIDO_OPERACIONAL.md` — índice de roteamento rápido por situação
- [ ] Ler **apenas a seção relevante** de `ARQUITETURA_PROJETO.md` (nunca na íntegra — use grep para localizar §X)
- [ ] Consultar `GIT_WORKFLOW.md` se a tarefa envolver Git, branch ou deploy

### 3 — Por situação específica
- [ ] **Erro encontrado?** → `ERRORS_SOLUTIONS.md` — grep pelo ID antes de tentar corrigir
- [ ] **Planejando feature ou verificando rotas?** → `TODO_OPERACIONAL.md` e `MAPA_DE_API.md` (grep pela rota)
- [ ] **Executando lote?** → `FILA_IMPLEMENTACAO.md` (grep por "pendente", ler só o item)
- [ ] **Deploy ou produção?** → `PRE_DEPLOY_CHECKLIST.md` — **OBRIGATÓRIO ANTES DE QUALQUER DEPLOY**
- [ ] **Operação em produção ou beta?** → `OPERACAO_PRODUCAO.md`
- [ ] **Falha de ambiente, encoding ou template?** → `PRE-FLIGHT_CHECKLIST.md`

### 4 — Durante execução
- [ ] Validar qualquer mudança de interface contra as 10 Heurísticas de Nielsen (ver §Regras Específicas)
- [ ] Nunca executar `git commit` ou `git push` em `dev` ou `main` sem autorização explícita do responsável
- [ ] `git push origin feature/*` é permitido sem autorização

### 5 — Ao finalizar a sessão
- [ ] Executar busca final por pendências antes de encerrar (ver §REGRA ANTI-CONCLUSÃO PREMATURA)
- [ ] Verificar checklist do arquivo de sessão — todos os itens devem estar [x]
- [ ] Atualizar documentos afetados pela task (TODO, FILA, ERRORS_SOLUTIONS, GUIA_RAPIDO_OPERACIONAL)
- [ ] **Modificou rotas da API?** → OBRIGATÓRIO atualizar o `MAPA_DE_API.md`
- [ ] Atualizar `RESUMO_EXECUCAO.md` com estado final e arquivo de sessão mais recente

---

## Gestão de Contexto — Regra Crítica

NUNCA abrir arquivos grandes por completo sem necessidade.
Usar grep/search primeiro para confirmar que o arquivo contém o que se busca.

**Arquivos proibidos de abrir na íntegra:**
- `ARQUITETURA_PROJETO.md` (1396+ linhas) → só por seção §X via grep
- `FILA_IMPLEMENTACAO.md` → só o item atual via `grep -n "pendente"`
- `TODO_OPERACIONAL.md` → só o REQ específico via grep
- `ERRORS_SOLUTIONS.md` → só pelo ID do erro via grep
- Qualquer arquivo de código com mais de 200 linhas → grep primeiro

**Sequência obrigatória antes de abrir qualquer arquivo grande:**
1. `grep -n "padrão" arquivo` → confirmar localização
2. Abrir só as linhas necessárias via `view_range`
3. Nunca rolar o arquivo inteiro

**Hierarquia de leitura — do menor para o maior:**
- Nível 1 (sempre): `RESUMO_EXECUCAO.md` + item específico da FILA via grep
- Nível 2 (só a seção): `ARQUITETURA_PROJETO.md` §X + seção relevante do `AGENTS.md`
- Nível 3 (só se afetado pela tarefa): arquivo de código alvo + `MAPA_DE_API.md`
- Nível 4 (nunca por padrão): arquivos inteiros de qualquer documento > 100 linhas

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

| Situação | Arquivo | Como acessar |
|---|---|---|
| Banco de dados, modelo de dados, rotas de API | `ARQUITETURA_PROJETO.md` §4 e §12 | grep pelo §, ler só a seção |
| Imagens, upload, Imgur | `ARQUITETURA_PROJETO.md` §16 | grep pelo §, ler só a seção |
| Roles, permissões, autenticação | `ARQUITETURA_PROJETO.md` §5 e §6 | grep pelo §, ler só a seção |
| Decisões arquiteturais e justificativas | `ARQUITETURA_PROJETO.md` §14 | grep pelo §, ler só a seção |
| Git, branch, merge, deploy | `GIT_WORKFLOW.md` | seção relevante |
| Operação em produção ou beta | `OPERACAO_PRODUCAO.md` | seção relevante |
| Falha de ambiente, encoding ou template | `PRE-FLIGHT_CHECKLIST.md` | arquivo completo |
| Erro recorrente com solução validada | `ERRORS_SOLUTIONS.md` | grep pelo ID E### |
| Backlog de requisitos (visão de produto, score GUT) | `TODO_OPERACIONAL.md` | grep pelo REQ |
| Fila de execução técnica por lote/fase | `FILA_IMPLEMENTACAO.md` | grep por "pendente" |
| Índice rápido e checklists de fechamento | `GUIA_RAPIDO_OPERACIONAL.md` | arquivo completo |
| Estado atual e próxima ação | `RESUMO_EXECUCAO.md` | arquivo completo |
| Histórico de sessões anteriores | `/sessoes/` | só o mais recente |

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
2. Consultar a seção de arquitetura aplicável (via grep, não na íntegra)
3. Propor plano curto e aguardar confirmação (se escopo for ambíguo)
4. Executar mudança mínima
5. Comunicar em português

### Assertividade Operacional

> [!CAUTION]
> **REGRA ANTI-TRAVAMENTO:** Agentes que entram em loops de re-análise causam travamento da sessão.

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
- ❌ Consultar `ARQUITETURA_PROJETO.md` repetidamente ou na íntegra
- ❌ Pedir confirmação para cada linha de código
- ❌ Entrar em loop de "vou analisar X para entender Y"
- ❌ Reformular o mesmo plano múltiplas vezes sem executar
- ❌ Usar "arquivo muito grande" como desculpa para não terminar tarefa
- ❌ Parar no meio de uma tarefa por qualquer motivo que não seja erro irresolvível

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
- ✅ `RESUMO_EXECUCAO.md` atualizado com sessão mais recente
- ✅ **Nenhuma** palavra como "parcial", "restante", "70%", "alguns" na conclusão

**4. PROIBIDO attempt_completion se:**
- ❌ Busca ainda retorna resultados (mesmo que "só 1 arquivo")
- ❌ Checklist tem itens [ ] pendentes
- ❌ Você usou palavras: "parcial", "restante", "alguns", "maioria", "principais"
- ❌ Você disse: "documentação técnica não foi limpa"
- ❌ Você disse: "X de Y arquivos" onde X < Y
- ❌ Você disse: "70% limpo" ou qualquer porcentagem < 100%
- ❌ `RESUMO_EXECUCAO.md` ainda aponta para sessão anterior

### Proibição Absoluta — Tamanho de Arquivo
❌ **NUNCA usar "arquivo muito grande" como desculpa para não terminar tarefa.**
Se o arquivo tem 10.000 linhas, processe linha por linha se necessário.
Tamanho do arquivo NÃO é motivo válido para parar.

### Exemplos de ERRO (Conclusão Prematura)

❌ **ERRADO:** "9 de 10 arquivos limpos" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "70% limpo" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "documentação técnica não foi limpa" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "referências restantes são contextuais" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** "principais arquivos limpos" → NÃO ESTÁ COMPLETO
❌ **ERRADO:** RESUMO_EXECUCAO.md aponta para sessão anterior → NÃO ESTÁ COMPLETO

### Exemplo CORRETO

✅ **CORRETO:**
```
Busca final executada: 0 resultados encontrados
Checklist: 30/30 itens marcados [x]
RESUMO_EXECUCAO.md atualizado com sessão atual
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
   e. Verificar se RESUMO_EXECUCAO.md aponta para sessão atual
   f. Se checklist 100% [x] E busca = 0 E RESUMO atualizado: attempt_completion
```

---

## Regras Pétreas (Inegociáveis)

> [!CAUTION]
> As regras abaixo não têm exceção. Violá-las causa retrabalho, perda de dados ou quebra de confiança.

### Resolução de Erros
Ao deparar com qualquer erro:
1. **Interromper tentativas imediatamente**
2. Consultar `ERRORS_SOLUTIONS.md` via grep pelo ID ou palavra-chave
3. Se o erro constar lá: aplicar a solução documentada
4. Se não constar: descobrir a solução e **registrar no arquivo antes de seguir**

### Migrations e Alterações de Schema (A REGRA ANTI-FRANKENSTEIN)

> [!CAUTION]
> **REGRA ABSOLUTA DE INTEGRIDADE DO BANCO DE PRODUÇÃO:**
> O Banco de Dados de Produção não é um ambiente de testes.

**Antes de aplicar QUALQUER migration no Deploy:**
1. **Obrigatório Dump Prévio:** Se o deploy enviar migrations com `TRUNCATE`, `DROP`, `DELETE` ou ALTER em colunas, executar backup via `PRE_DEPLOY_CHECKLIST.md` antes.
2. **Schema Alignment:** Nenhuma alteração estrutural ocorre em Produção antes de testar exaustivamente no banco Beta.

**Quando a Produção Quebrar Após Deploy:**
- ❌ **NÃO FAZER:** Abrir `psql` na Produção e emitir `ALTER TABLE` avulso. Isso cria Schema "Frankenstein".
- ✅ **FAZER:** Reverter o código da Aplicação para o commit anterior via rollback documentado em `PRE_DEPLOY_CHECKLIST.md`.

**Migrations antigas (criadas há mais de 1 semana):**
- **NUNCA DEIXE MIGRATIONS REPETIREM.** Os arquivos em `database/*.sql` não são ferramentas de debugging.

### Contenção de Agentes — Ações Destrutivas Proibidas

> [!CAUTION]
> **PARE ANTES DE EXECUTAR. LEIA ESTA SEÇÃO A CADA VEZ QUE FOR EXECUTAR UM COMANDO.**

**Proibido sem aprovação explícita do usuário:**
- ❌ Reiniciar containers ou serviços
- ❌ Copiar ou sobrescrever arquivos em produção
- ❌ Executar builds e deployar artefatos no servidor
- ❌ Modificar arquivos fora do escopo da tarefa descrita
- ❌ Investigar bugs não mencionados na tarefa atual

**Comandos read-only permitidos sem aprovação:**
- `docker ps`, `docker logs`, `docker stats`, `docker inspect`
- `ls`, `cat`, `grep`, `find`, `head`, `tail`
- `curl -s` (GET requests)
- `psql` com `SELECT`

**Comandos que SEMPRE exigem aprovação:**
- `docker restart`, `docker stop`, `docker start`
- `scp`, `rsync`, `docker cp`
- `npm run build` (no servidor)
- `git commit`, `git push` para `dev` ou `main`
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

| Operação | Autorização necessária |
|---|---|
| `git push origin feature/*` | Não — permitido sempre |
| `git push origin dev` | Sim — autorização explícita no chat |
| `git push origin main` | Sim — autorização explícita no chat |
| `git commit` | Sim — autorização explícita no chat |
| Abrir PR para dev | Não — permitido sempre |
| Fazer merge de PR | Nunca — exclusivo do responsável |

### Git — Proibição Absoluta de Checkout Entre Branches

> [!CAUTION]
> **REGRA PÉTREA — NUNCA USAR `git checkout` ENTRE BRANCHES DURANTE DEPLOY**

**Proibido sem exceção:**
- ❌ `git checkout main` (quando em `dev`)
- ❌ `git checkout dev` (quando em `main`)
- ❌ `git merge dev` (merge local)
- ❌ Qualquer operação local de merge entre `dev` e `main`

**Motivo:** `git checkout` entre branches remove temporariamente arquivos que existem em uma branch mas não em outra (comportamento normal do Git). Isso causa pânico no usuário que vê arquivos importantes desaparecendo (ex: `MAPA_DE_API.md`, `map_scratch.json`, `RESUMO_EXECUCAO.md`, `generateMap.js`).

**Método obrigatório para deploy:**
```bash
# ✅ CORRETO: Criar PR via GitHub CLI
gh pr create --base main --head dev --title "chore: merge dev to main - descrição" --body "Detalhes"

# ✅ CORRETO: Fazer merge via GitHub
gh pr merge <número> --merge --delete-branch=false
```

**Para verificar divergência SEM fazer checkout:**
```bash
# ✅ CORRETO: Ver commits sem trocar de branch
git log origin/main..origin/dev --oneline
git rev-list --left-right --count origin/main...origin/dev
```

**Ver:** `ERRORS_SOLUTIONS.md` E143 (arquivos desaparecem) e E101 (locks no Windows)

### Documentação — Onde Registrar
Antes de adicionar qualquer informação em documentação:
1. Pergunta: "É requisito de produto ou tarefa técnica?"
2. Se **requisito de produto** → `TODO_OPERACIONAL.md`
3. Se **tarefa técnica** → `FILA_IMPLEMENTACAO.md`
4. Se **erro com solução validada** → `ERRORS_SOLUTIONS.md`
5. **Nunca registrar no lugar errado.**

### Confirmação de Interpretação
Antes de implementar requisito complexo ou ambíguo:
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
**Toda mudança visível ao usuário final DEVE ter entrada no changelog (`database/changelogs.json`) antes do deploy.**

**Regras obrigatórias:**
1. Data/hora explícita em ISO 8601 com timezone
2. Rodapé com data/hora no final do body
3. Linguagem 100% leiga — sem jargão técnico
4. Arquivo JSON versionado — commitar junto com o código

**Formato obrigatório:**
```json
{
  "id": "YYYY-MM-DD-descricao-curta",
  "title": "Título Curto e Descritivo",
  "body": "Descrição em linguagem familiar:\n\n• **Mudança** - Benefício para o usuário\n\n_Atualização publicada em DD/MM/YYYY às HH:MM_",
  "type": "app",
  "published": true,
  "created_at": "YYYY-MM-DDTHH:MM:SS-03:00"
}
```

**Linguagem obrigatória:**
- ❌ NUNCA: "sidebar vertical", "migration", "refactor", "placeholder"
- ✅ SEMPRE: benefício para o usuário em linguagem familiar

---

## Regras Gerais de Código

- **Mudança mínima** — sem refactor massivo, sem quebrar contratos existentes
- **Mudança reversível** — preferir abordagens que possam ser desfeitas
- **Lógica de interface, busca e filtros** → Frontend (React/TypeScript)
- **Lógica de autenticação e permissões** → Backend (Node.js/TypeScript via JWT)
- **Python** → exclusivamente para scripts fora do runtime da API principal
- **Upload e processamento de imagens** → sempre no Backend, nunca no Frontend
- **`cover_deletehash`, `avatar_deletehash`, `banner_deletehash`** → nunca retornados por rotas públicas

---

## Regras Específicas do Projeto

**Imgur:** `IMGUR_CLIENT_ID` é variável de ambiente obrigatória. Nunca hardcodar, nunca expor no Frontend.

**Google OAuth:** Único método de autenticação. Não implementar login por e-mail/senha sem autorização.

**Discord:** Vínculo opcional de perfil. Não substitui Google OAuth como autenticação principal.

**Elevação de role:** Um `player` torna-se `gm` ao criar o primeiro `gm_profile`. Lógica exclusiva do Backend.

**Compromissos inegociáveis:** gratuidade, sem anúncios, sem coleta desnecessária de dados. Nenhuma feature viola esses compromissos.

**Heurísticas de Nielsen (UX obrigatória):** Toda mudança de interface valida contra as 10 heurísticas antes do merge: (1) Visibilidade do status, (2) Compatibilidade com o mundo real, (3) Controle e liberdade, (4) Consistência, (5) Prevenção de erros, (6) Reconhecimento vs memorização, (7) Eficiência e flexibilidade, (8) Design minimalista, (9) Recuperação de erros, (10) Ajuda e documentação.

**Nome do banco:** `mesas_rpg`, não `mesas`. Ver `ERRORS_SOLUTIONS.md` E059.

---

## Protocolo de Sessão

**Nome:** `resumo_[dia-mes]_[task-curta].md`
**Localização:** `/sessoes/`
**Exemplo:** `sessoes/resumo_11-04_limpeza-documentacao.md`

**Conteúdo mínimo obrigatório:**
1. **Objetivo da sessão** — o que será feito (1-2 frases)
2. **Plano de execução** — lista numerada de passos principais
3. **Task list embutida** — checklist `[ ]` / `[x]` de cada item do plano
4. **Arquivos-alvo** — lista de arquivos que serão modificados
5. **Critério de conclusão** — como saber que a task está completa
6. **Último item obrigatório:** `[ ] Atualizar RESUMO_EXECUCAO.md apontando para esta sessão`

O arquivo de sessão deve ser atualizado conforme o progresso. Ao final, serve de registro histórico para continuidade sem perda de contexto.

**Após concluir a sessão, obrigatório:**
- Atualizar `RESUMO_EXECUCAO.md` campo "Última Sessão" para apontar para o arquivo desta sessão
- Não encerrar sem que o RESUMO aponte para a sessão mais recente

---

## Protocolo de Git

Consultar `GIT_WORKFLOW.md` antes de qualquer alteração versionável.

**Branches:**
- `feature/<escopo>` → criada a partir de `dev`
- `dev` → deploy automático em beta
- `main` → deploy em produção

**Permissões:**

| Operação | Autorização |
|---|---|
| Criar branch `feature/<escopo>` | Automático — sem perguntar |
| `git push origin feature/*` | Automático — sem perguntar |
| Abrir PR para dev | Automático — sem perguntar |
| `git push origin dev` | Exige autorização explícita no chat |
| `git push origin main` | Exige autorização explícita no chat |
| Merge de PR | Exclusivo do responsável — nunca pelo agente |

---

## Infraestrutura e Diagnóstico

**VM Oracle:** `gh` autenticado para a conta mantenedora. Ver `GIT_WORKFLOW.md` §8 e `ERRORS_SOLUTIONS.md` E055/E056.

**Token/PAT:** Nunca registrar, expor ou versionar em chat, logs, commits ou arquivos do repositório.

**Diagnóstico read-only** — permitido sempre, sem autorização: `docker ps`, `docker logs`, `docker stats`

**Comandos com alteração de estado** — exigem autorização explícita.

**Cloudflare Tunnel:** Agentes **nunca** devem criar novos túneis ou baixar containers `cloudflared` paralelos. Novos ambientes são expostos via Public Hostname no painel Cloudflare.

**SSH:** Métodos de conexão em `OPERACAO_PRODUCAO.md` §3. Use read-only para diagnóstico e solicite aprovação antes de qualquer comando destrutivo.

**Credenciais do PostgreSQL:**
```bash
docker exec mesas-beta-db psql -U admin -d mesas_rpg
docker exec mesas-beta-db env | grep POSTGRES
```

**PowerShell:** Scripts rodam no PowerShell 7.6.0.

**Arquivos temporários e de teste:** Alocar em `/testes/`. Proibido criar scripts de diagnóstico na raiz.

---

## Validação e Rollback

**Validações obrigatórias antes de concluir qualquer task:**
- Decisões operacionais referenciam arquivo canônico correto
- Fluxo de Git segue `GIT_WORKFLOW.md`
- Comunicação com o usuário está em português
- `TODO_OPERACIONAL.md` com Score GUT e status consistentes
- `FILA_IMPLEMENTACAO.md` com status consistente
- `RESUMO_EXECUCAO.md` aponta para a sessão mais recente
- Toda interação com dados passa pela API Backend com JWT válido
- `GUIA_RAPIDO_OPERACIONAL.md` atualizado se houver mudança de contrato ou fluxo

**Em caso de conflito entre arquivos:** `ARQUITETURA_PROJETO.md` prevalece sobre qualquer outro de arquitetura. `AGENTS.md` prevalece sobre qualquer outro de governança.

---

## Idioma

Toda comunicação em **português**:
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

Se o agente identificar uma tecnologia que resolva um problema crônico de forma mais profissional, pode e deve sugerir ativamente. A sugestão não é autorização para implementar — aguardar aprovação do responsável.

---

## Limite de Escopo

Este arquivo define apenas governança de agentes. Não descreve arquitetura detalhada nem runbook operacional. Para esses fins, consultar `ARQUITETURA_PROJETO.md` e `OPERACAO_PRODUCAO.md`.