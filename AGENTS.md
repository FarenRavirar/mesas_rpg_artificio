# AGENTS.md

Governança de agentes de IA neste repositório — **Anúncios de Mesas RPG (Portal Colaborativo)**.

> **Fonte canônica de governança.** Em conflito com qualquer outro arquivo de instrução, este prevalece.
> Em conflito com `ARQUITETURA_PROJETO.md` sobre arquitetura ou contratos técnicos, prevalece `ARQUITETURA_PROJETO.md`.

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
- [ ] **Planejando feature?** → `TODO_OPERACIONAL.md`
- [ ] **Executando lote?** → `FILA_IMPLEMENTACAO.md`
- [ ] **Deploy ou produção?** → `OPERACAO_PRODUCAO.md`
- [ ] **Falha de ambiente, encoding ou template?** → `PRE-FLIGHT_CHECKLIST.md`

### 4 — Durante execução
- [ ] Validar qualquer mudança de interface contra as 10 Heurísticas de Nielsen (ver §Regras Específicas)
- [ ] [!CAUTION] **Nunca** executar `git commit` ou `git push` sem autorização explícita do responsável

### 5 — Ao finalizar a sessão
- [ ] Atualizar documentos afetados pela task (TODO, FILA, ERRORS_SOLUTIONS, GUIA_RAPIDO_OPERACIONAL)

---

## Contexto do Projeto

**O que é:** Aplicação fullstack 100% tipada — React/TypeScript (Frontend) + Node.js/TypeScript (Backend) + PostgreSQL — para descoberta e publicação de mesas de RPG no Brasil. Inclui autenticação via Google OAuth, autopublicação por mestres e pipeline de ingestão automática de anúncios externos via parser Python + spaCy.

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
| Pipeline de ingestão, parser Python, AggregatorBot | `ARQUITETURA_PROJETO.md` §7 |
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

Quando o plano está claro e aprovado:
- **Executar diretamente** — sem loops de investigação desnecessários
- **Consultar documentação canônica uma vez**, não repetidamente
- **Aplicar mudanças incrementais** sem re-análise completa a cada passo
- **Reportar progresso** de forma concisa, sem restatement excessivo

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

**AggregatorBot:** Qualquer alteração no serviço de ingestão automática deve ser validada em beta antes de ir para produção. O bot tem circuit breaker próprio — falhas de ingestão não devem derrubar a API principal.

**Imgur:** `IMGUR_CLIENT_ID` é variável de ambiente obrigatória. Nunca hardcodar, nunca expor no Frontend, nunca versionar com valor real. Usar `.env.example` com placeholder.

**CleanupWorker:** Job de limpeza de imagens de mesas encerradas roda via node-cron. Alterações no critério de exclusão exigem autorização explícita — deleção no Imgur é irreversível.

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
**Exemplo:** `sessoes/resumo_05-04_aggregator-bulk-delete.md`

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

**Cloudflare Tunnel:** A VM possui túnel mestre interligado à rede Docker interna. Agentes **nunca** devem criar novos túneis, baixar containers `cloudflared` paralelos ou solicitar Tokens ao usuário para expor novos containers. Novos ambientes são expostos via Public Hostname no painel Cloudflare, referenciando o container alvo (ex: `http://mesas-beta-app:80`).

**Acesso SSH assistido:** Ver métodos de conexão e regras em `OPERACAO_PRODUCAO.md` §3.

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
