# AGENTS.md

Governança de agentes de IA neste repositório.

## Objetivo

Arquivo bootstrap: define regras mínimas de execução e aponta as fontes canônicas do **Anúncios de Mesas RPG** (Portal Colaborativo Fullstack).

> **NATUREZA DESTE PROJETO (Obrigatório internalizar):**
> - **O que é:** Aplicação fullstack 100% tipada (React/TypeScript no Frontend + Node.js/TypeScript no Backend + PostgreSQL) para descoberta e publicação de mesas de RPG, com autenticação via Google OAuth, autopublicação por mestres e recursos futuros de ingestão automática de anúncios externos (AggregatorBot) e exportação para WhatsApp/Discord, previstos para fases posteriores.
> - **Ecossistema:** Projeto coirmão do Grande Glossário de RPG. Compartilha infraestrutura Oracle on-premise, identidade visual Artifício e filosofia comunitária. São repositórios e containers independentes.
> - **Ambiente beta:** `mesasbeta.artificiorpg.com` — branch `dev`, pasta `/opt/mesas-beta/` no servidor Oracle.
> - **Ambiente de produção:** `mesas.artificiorpg.com` — branch `main`, pasta `/opt/mesas/` no servidor Oracle.
> - **Estado atual dos ambientes:** o beta está ativo em `mesasbeta.artificiorpg.com`; a produção permanece prevista em `mesas.artificiorpg.com`, mas ainda não publicada operacionalmente nesta rodada. O fluxo continua sendo: desenvolve em `dev` → valida em beta → promove para `main` → publicação em produção.

Ao receber solicitação para "ler apenas o AGENTS.md", isso implica consultar também os arquivos obrigatórios e os arquivos por situação listados aqui.

## Quando ler

Sempre no início de qualquer tarefa no repositório.

## Não ler quando

Nunca pular este arquivo.

## Pré-requisitos

- Identificar o tipo de tarefa
- Consultar `GUIA_RAPIDO_OPERACIONAL.md` (tabela-resumo + seção aplicável) para reduzir releitura extensa
- Evitar loops de análise sem objetivo claro (obrigatório)

## Passos

1. Ler `RESUMO_EXECUCAO.md` — estado atual, bloqueios e próxima ação
2. Ler regras base deste arquivo (`AGENTS.md`)
3. Consultar `AI_CONTEXT_INDEX.md` — escolher cenário na matriz e ler só o arquivo indicado
4. Nunca ler `ARQUITETURA_PROJETO.md` na íntegra — sempre por seção específica

## Leitura obrigatória

1. Sempre iniciar por:
   - `RESUMO_EXECUCAO.md` — estado atual do projeto e próxima ação
   - `AGENTS.md`
2. Roteador de contexto (substitui leitura em cascata):
   - `AI_CONTEXT_INDEX.md` — matriz de leitura por cenário com orçamento de tokens
3. Atalho de aceleração (apoio):
   - `GUIA_RAPIDO_OPERACIONAL.md` (tabela de índice + checklists de fechamento)
4. Antes de modificar código:
   - `ARQUITETURA_PROJETO.md` — **somente a seção indicada pelo AI_CONTEXT_INDEX**, não na íntegra
5. Consultar por situação:
   - Git/branch/merge/deploy: `GIT_WORKFLOW.md`
   - Operação em produção/beta: `OPERACAO_PRODUCAO.md`
   - Falha de ambiente/encoding/template: `PRE-FLIGHT_CHECKLIST.md`
   - Erro recorrente e contorno validado: `ERRORS_SOLUTIONS.md`
   - Backlog de requisitos e prioridades (visão estratégica de produto): `TODO_OPERACIONAL.md`
   - Execução de lote com itens técnicos granulares (visão tática de implementação): `FILA_IMPLEMENTACAO.md`
   - Banco de Dados / API Backend (Node): `ARQUITETURA_PROJETO.md` seção 4
   - Imagens, upload e integração Imgur: `ARQUITETURA_PROJETO.md` seção 16
   - Ingestão automática de fontes externas: `ARQUITETURA_PROJETO.md` seção 7.8
   - Registro histórico de sessões anteriores: `/sessoes/` (resumos datados de cada sessão de trabalho)

### Diferença entre TODO_OPERACIONAL e FILA_IMPLEMENTACAO

**TODO_OPERACIONAL.md:**
- **O que é:** Backlog de requisitos de produto (REQ-01, REQ-02, etc.)
- **Granularidade:** Alta (features completas, ex: "Painel do mestre com autopublicação")
- **Score:** GUT (Gravidade/Urgência/Tendência)
- **Status:** Concluído, Em validação beta, Em aberto, Planejado
- **Quando consultar:** Ao planejar novas features, priorizar trabalho, entender roadmap

**FILA_IMPLEMENTACAO.md:**
- **O que é:** Fila de execução técnica por lote/fase (001, 002, etc.)
- **Granularidade:** Baixa (tarefas técnicas, ex: "Criar migration_05", "Endpoint GET /tables")
- **Agrupamento:** Por lote e fase (Fase 0, Fase 1, etc.)
- **Status:** pendente, em_execucao, concluido, descartado
- **Quando consultar:** Durante execução de lote, antes de deploy, para rastrear itens técnicos

**Relação:**
- Um REQ do TODO pode gerar múltiplos itens na FILA
- Exemplo: REQ-06 (Painel do mestre) → itens 022, 023, 024 na FILA
- TODO = "O QUÊ fazer" (produto) | FILA = "COMO fazer" (técnico)

## Princípio central

Engineering-first e Confiabilidade.

> [!CAUTION]
> **REGRA PÉTREA DE RESOLUÇÃO DE ERROS:**
> Todo agente que se deparar com UM ERRO (`stderr`, falha de execução, falha de script ou crash na pipeline) DEVE **imediatamente** interromper as tentativas e consultar o arquivo `ERRORS_SOLUTIONS.md`.
> - Se o erro já constar lá: aplique a solução documentada.
> - Se o erro não existir lá: pare, descubra a solução e **VÁ ATÉ O ARQUIVO REGISTRAR QUAL FOI** antes de seguir para a próxima task. **Isso é inegociável** e deve ser respeitado por qualquer agente no projeto.

Nunca produzir código sem:

1. Entender contexto
2. Consultar arquitetura aplicável
3. Propor plano curto
4. Executar mudança mínima
5. Manter comunicação em português

## Princípio de Assertividade Operacional

Ao executar tarefas com escopo definido e plano aprovado:

- **Executar diretamente** quando o plano estiver claro e aprovado
- **Evitar loops de investigação** desnecessários após aprovação
- **Consultar documentação canônica** uma vez, não repetidamente
- **Aplicar mudanças incrementais** sem re-análise completa a cada passo
- **Reportar progresso** de forma concisa, sem restatement excessivo

**Quando parar para perguntar:**
- Conflito entre requisitos e arquitetura
- Decisão de produto não documentada
- Risco de quebra de contrato público
- Ambiguidade crítica no escopo

**Quando NÃO parar:**
- Implementação de feature já especificada
- Ajuste de UX dentro do padrão estabelecido
- Correção de bug com solução conhecida
- Atualização de documentação por delta

## Protocolo de Continuidade de Sessão

> [!IMPORTANT]
> **REGRA OBRIGATÓRIA — Resumo de Sessão:**
> Ao iniciar qualquer nova sessão de trabalho (nova conversa ou retomada após interrupção), o agente DEVE criar imediatamente um arquivo de resumo no formato:
>
> **Nome:** `resumo_[dia-mes]_[task-curta].md`
> **Localização:** `/sessoes/` (pasta de registro histórico)
> **Exemplo:** `sessoes/resumo_04-04_aggregator-accept-flow.md`
>
> **Conteúdo mínimo obrigatório:**
> 1. **Objetivo da sessão** — o que será feito (1-2 frases)
> 2. **Plano de execução** — lista numerada de passos principais
> 3. **Task list embutida** — checklist markdown com `[ ]` / `[x]` de cada item do plano
> 4. **Arquivos-alvo** — lista de arquivos que serão modificados
> 5. **Critério de conclusão** — como saber que a tarefa está completa
> 6. **Item obrigatório ao final da task list:** `[ ] Atualizar documentos relevantes` — sempre incluir como último item para garantir que documentação canônica seja atualizada antes de concluir a sessão
>
> **Atualização contínua:** O agente deve atualizar o resumo conforme progride, marcando itens como `[x]` e registrando decisões importantes inline.
>
> **Ao final da sessão:** Garantir que o resumo esteja completo e atualizado em `/sessoes/` para servir como registro histórico rastreável.
>
> **Finalidade:** Permitir que qualquer agente (ou o mesmo agente em sessão futura) retome o trabalho exatamente de onde parou, sem perda de contexto ou retrabalho. A pasta `/sessoes/` serve como registro histórico completo e rastreável de todas as sessões de trabalho.



## Fonte de verdade (single source of truth)

- Estado atual do projeto e próxima ação: `RESUMO_EXECUCAO.md`
- Roteamento de leitura por cenário e orçamento de tokens: `AI_CONTEXT_INDEX.md`
- Arquitetura, contratos, princípios visuais e decisões: `ARQUITETURA_PROJETO.md`
- Fluxo de Git/merge/deploy: `GIT_WORKFLOW.md`
- Operação de produção/beta e validação pós-deploy: `OPERACAO_PRODUCAO.md`
- Falhas recorrentes e soluções validadas: `ERRORS_SOLUTIONS.md`
- Diagnóstico prévio de ambiente: `PRE-FLIGHT_CHECKLIST.md`
- Backlog de requisitos de produto com score GUT: `TODO_OPERACIONAL.md`
- Fila técnica de execução por lote/fase: `FILA_IMPLEMENTACAO.md`
- Guia de índice rápido e checklists de fechamento (apoio, não canônico): `GUIA_RAPIDO_OPERACIONAL.md`
- Registro histórico de sessões anteriores: `/sessoes/` (resumos datados de cada sessão de trabalho)

Se houver conflito entre orientação operacional e arquitetura, prevalece `ARQUITETURA_PROJETO.md`.

## Regras gerais

- Mudança mínima
- Mudança reversível
- Sem refactor massivo
- Sem quebrar contratos
- Lógica de interface, busca e filtros no Frontend (React/TypeScript)
- Python usado exclusivamente para scripts de infraestrutura, conversão e importação de dados executados fora do runtime da API principal
- Lógica de autenticação e permissões gerenciadas pelo Backend (API Node.js em TypeScript) via JWT — nunca confiar segurança ao frontend
- Upload e processamento de imagens (conversão WebP, envio ao Imgur) executados **sempre no Backend**, nunca no Frontend
- `cover_deletehash`, `avatar_deletehash` e `banner_deletehash` são campos internos — **nunca retornados por rotas públicas da API**

## Regras específicas deste projeto

- **AggregatorBot:** Qualquer alteração no serviço de ingestão automática deve ser validada em ambiente beta antes de ir para produção. O bot possui circuit breaker próprio — falhas de ingestão não devem derrubar a API principal.
- **Imgur:** O `IMGUR_CLIENT_ID` é variável de ambiente obrigatória. Nunca hardcodar, nunca expor no Frontend, nunca versionar com valor real. Usar `.env.example` com placeholder.
- **CleanupWorker:** O job de limpeza de imagens de mesas encerradas roda via node-cron. Alterações no critério de exclusão exigem autorização explícita — uma deleção no Imgur é irreversível.
- **Google OAuth:** É o único método de autenticação. Não implementar login por email/senha local sem autorização explícita do responsável.
- **Discord:** Quando implementado, será apenas vínculo opcional de perfil para contexto comunitário, selos e leitura autorizada de cargos públicos. Não deve substituir o Google OAuth como autenticação principal.
- **Elevação de role:** Um `player` torna-se `gm` ao criar o primeiro `gm_profile`. Esta lógica é exclusiva do Backend. O Frontend não decide elevação de role.
- **Compromissos públicos inegociáveis** (ver `ARQUITETURA_PROJETO.md` seção 10): gratuidade, sem anúncios e sem coleta desnecessária de dados são restrições de produto, não de preferência. Nenhuma feature pode violar esses compromissos.

## Regra de idioma

Toda comunicação produzida por agentes neste projeto deve ser em português.

Isso inclui:
- Respostas em chat
- Mensagens de erro na UI
- Logs visíveis ao usuário
- Explicações e planos de execução

Elementos técnicos podem permanecer no formato original:
- Nomes de arquivos
- Comandos
- Nomes de funções
- Identificadores de código

## Protocolo de Git

Antes de iniciar qualquer alteração de código, consultar e seguir `GIT_WORKFLOW.md`.

> [!CAUTION]
> **REGRA PÉTREA DE ECONOMIA DE TOKENS E TEMPO:**
> NENHUM `git commit` ou `git push` deve ser gerado, executado ou agendado pelo agente sem a prévia autorização explícita do usuário no chat. O agente deve realizar as edições locais e parar, aguardando o usuário revisar e aprovar o escopo das alterações antes de realizar o commit daquele pacote e seu push.

**Branch de desenvolvimento:** `dev` → deploy automático em `mesasbeta.artificiorpg.com`
**Branch de produção:** `main` → workflow de deploy para `mesas.artificiorpg.com`, quando a publicação operacional em produção estiver ativa
**Fluxo:** `feature/<escopo>` → `dev` (beta) → aprovação → `main` (produção)

## Disponibilidade operacional atual

- A VM Oracle possui `gh` autenticado para a conta mantenedora e permite consulta de runs no GitHub Actions.
- Para validação de CI e limitações do `gh` na VM, ver `GIT_WORKFLOW.md` seção 8 e `ERRORS_SOLUTIONS.md` E055/E056.
- Nunca registrar, expor ou versionar token/PAT em chat, logs, commits ou arquivos do repositório.

### Roteamento e Túneis (Cloudflare)
- A VM possui túnel Cloudflare mestre interligado à rede Docker interna.
- **Regra:** Agentes **NUNCA** devem tentar criar novos túneis, baixar containers `cloudflared` paralelos ou pedir Tokens de ambiente para o usuário ao iniciar novos containers.
- **Procedimento Obrigatório:** Novos ambientes devem ser expostos aproveitando o túnel existente via Public Hostname no painel Cloudflare, referenciando o container alvo (ex: `http://mesas-beta-app:80`).

### Acesso SSH assistido (consulta)

Ver métodos de conexão e regras de uso em `OPERACAO_PRODUCAO.md` seção 3.

Diagnóstico read-only é **sempre permitido** sem autorização: `docker ps`, `docker logs`, `docker stats`

Comandos com alteração de estado exigem autorização explícita do responsável no chat.

### Decisões automáticas em tarefas com fluxo Git ativo

| Pergunta | Resposta automática |
|---|---|
| Criar branch `feature/<escopo>` a partir de `dev`? | Sim, por padrão, quando a tarefa realmente envolver alteração versionável com fluxo Git |
| PR para `dev` com squash and merge? | Sim, por padrão |
| Haverá release após o merge? | Não — só se o responsável solicitar explicitamente |

> ⚠️ Ver regra pétrea de push em `GIT_WORKFLOW.md` seção 4.

Comportamento esperado:

> "Em tarefa com fluxo Git ativo, criar branch `feature/<escopo>` a partir de `dev`. Usar squash and merge para `dev` ao concluir. Sem release automático."

A única exceção é quando o escopo da branch for ambíguo. Nesse caso, perguntar apenas o nome do escopo.

## Diagnóstico antes de repetir tentativas

Se houver falha de ambiente, leitura de arquivos, encoding ou inconsistência de template:

1. Consultar `PRE-FLIGHT_CHECKLIST.md`
2. Consultar `ERRORS_SOLUTIONS.md`
3. Só então repetir tentativa

## Validação

- Decisões operacionais devem referenciar arquivo canônico
- Fluxo de Git deve seguir `GIT_WORKFLOW.md`
- Comunicação com usuário deve estar em português
- Mudanças em backlog operacional devem manter `Score GUT` e `status real` consistentes em `TODO_OPERACIONAL.md`
- Mudanças em execução por lote devem manter status consistente em `FILA_IMPLEMENTACAO.md`
- Toda interação com dados requer comunicação com a API Backend portando token JWT válido
- Toda operação de imagem (upload, substituição, exclusão) deve ser registrável via `imgur_cleanup_log`
- Sempre que possível, atualizar `GUIA_RAPIDO_OPERACIONAL.md` por delta ao fim da task quando houver mudança de contrato, checklist, fluxo ou decisão operacional recorrente

## Rollback

Se houver conflito de interpretação:
1. Usar apenas `AGENTS.md` + `ARQUITETURA_PROJETO.md`
2. Registrar lacuna em `TODO_OPERACIONAL.md`
3. Aplicar ajuste mínimo de documentação

## Referências

- `ARQUITETURA_PROJETO.md`
- `GIT_WORKFLOW.md`
- `OPERACAO_PRODUCAO.md`
- `PRE-FLIGHT_CHECKLIST.md`
- `ERRORS_SOLUTIONS.md`
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`
- `GUIA_RAPIDO_OPERACIONAL.md`

## Limite de escopo

Este arquivo não descreve arquitetura detalhada nem runbook completo; ele define apenas governança base.

## Formato de resposta esperado

Contexto
Plano curto
Patch incremental
Validação
Riscos
Rollback

- **Arquivos temporários:** Qualquer script de teste/diagnóstico `.py` criado pelo agente **DEVE** ser alocado no diretório `/testes`. É proibido sujar a raiz do projeto.

### Permissão sobre Ferramentas e Configuração
- **PowerShell:** O sistema rodará scripts no PowerShell 7.6.0 (ou compatível com pwsh).
- **Senhas de Ambiente (Beta/Dev):** O agente não deve travar por problemas de credenciais, constraints ou configuração em ambiente de desenvolvimento. Ainda assim, qualquer mudança persistente de senha, alteração estrutural de banco ou exposição de porta deve respeitar a política de autorização explícita do responsável no chat, especialmente quando afetar ambiente remoto ou configuração pública.
- **Novas Tecnologias:** Se o agente deduzir haver tecnologia, banco, lib ou ferramenta que resolva um problema crônico, PODE sugerir ativamente, priorizando sempre a forma profissional sobre a gambiarra.
