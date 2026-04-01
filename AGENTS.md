# AGENTS.md

Governança de agentes de IA neste repositório.

## Objetivo

Arquivo bootstrap: define regras mínimas de execução e aponta as fontes canônicas do **Anúncios de Mesas RPG** (Portal Colaborativo Fullstack).

> **NATUREZA DESTE PROJETO (Obrigatório internalizar):**
> - **O que é:** Aplicação fullstack 100% tipada (React/TypeScript no Frontend + Node.js/TypeScript no Backend + PostgreSQL) para descoberta e publicação de mesas de RPG, com autenticação via Google OAuth, autopublicação por mestres, ingestão automática de anúncios externos (AggregatorBot) e exportação para WhatsApp/Discord.
> - **Ecossistema:** Projeto coirmão do Grande Glossário de RPG. Compartilha infraestrutura Oracle on-premise, identidade visual Artifício e filosofia comunitária. São repositórios e containers independentes.
> - **Ambiente beta:** `mesasbeta.artificiorpg.com` — branch `dev`, pasta `/opt/mesas-beta/` no servidor Oracle.
> - **Ambiente produção:** `mesas.artificiorpg.com` — branch `main`, pasta `/opt/mesas/` no servidor Oracle.
> - **Ambos os ambientes estão ativos e independentes.** O fluxo é: desenvolve em `dev` → valida em beta → promove para `main` → produção.

Ao receber solicitação para "ler apenas o AGENTS.md", isso implica consultar também os arquivos obrigatórios e os arquivos por situação listados aqui.

## Quando ler

Sempre no início de qualquer tarefa no repositório.

## Não ler quando

Nunca pular este arquivo.

## Pré-requisitos

- Identificar o tipo de tarefa
- Carregar `AI_CONTEXT_INDEX.md`

## Passos

1. Ler regras base deste arquivo
2. Ler `ARQUITETURA_PROJETO.md` deste repositório (sua única fonte canônica de arquitetura)
3. Aplicar roteamento de leitura no `AI_CONTEXT_INDEX.md`
4. Consultar arquivos canônicos por cenário

## Leitura obrigatória

1. Sempre iniciar por:
   - `AGENTS.md`
   - `AI_CONTEXT_INDEX.md`
2. Antes de modificar código:
   - `ARQUITETURA_PROJETO.md` (seções relevantes roteadas em `AI_CONTEXT_INDEX.md`)
3. Consultar por situação:
   - Git/branch/merge/deploy: `GIT_WORKFLOW.md`
   - Operação em produção/beta: `OPERACAO_PRODUCAO.md`
   - Falha de ambiente/encoding/template: `PRE-FLIGHT_CHECKLIST.md`
   - Erro recorrente e contorno validado: `ERRORS_SOLUTIONS.md`
   - Gestão de melhorias/prioridades operacionais: `TODO_OPERACIONAL.md`
   - Gestão de lote e fechamento por ciclo: `FILA_IMPLEMENTACAO.md`
   - Banco de Dados / API Backend (Node): `ARQUITETURA_PROJETO.md` seção 4
   - Imagens, upload e integração Imgur: `ARQUITETURA_PROJETO.md` seção 16
   - Ingestão automática de fontes externas: `ARQUITETURA_PROJETO.md` seção 7.8

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

## Protocolo de continuidade de sessão

Ver pacote mínimo, regras de delta e gate de admissibilidade em `AI_CONTEXT_INDEX.md`.

## Fonte de verdade (single source of truth)

- Arquitetura, contratos, princípios visuais e decisões: `ARQUITETURA_PROJETO.md`
- Roteamento de leitura e orçamento de contexto: `AI_CONTEXT_INDEX.md`
- Fluxo de Git/merge/deploy: `GIT_WORKFLOW.md`
- Operação de produção/beta e validação pós-deploy: `OPERACAO_PRODUCAO.md`
- Falhas recorrentes e soluções validadas: `ERRORS_SOLUTIONS.md`
- Diagnóstico prévio de ambiente: `PRE-FLIGHT_CHECKLIST.md`
- Backlog operacional vivo de melhorias e prioridades: `TODO_OPERACIONAL.md`
- Fila operacional de implementação por lote/ciclo: `FILA_IMPLEMENTACAO.md`

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

**Branch de desenvolvimento:** `dev` → deploy automático em `mesasbeta.artificiorpg.com`
**Branch de produção:** `main` → deploy automático em `mesas.artificiorpg.com`
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

### Decisões automáticas — não perguntar, apenas executar

| Pergunta | Resposta automática |
|---|---|
| Criar branch `feature/<escopo>` a partir de `dev`? | Sim, sempre |
| PR para `dev` com squash and merge? | Sim, sempre |
| Haverá release após o merge? | Não — só se o responsável solicitar explicitamente |

> ⚠️ Ver regra pétrea de push em `GIT_WORKFLOW.md` seção 4.

Comportamento esperado:

> "Criando branch `feature/<escopo>` a partir de `dev`. Squash and merge para `dev` ao concluir. Sem release automático."

A única exceção: se o escopo da branch for ambíguo, perguntar apenas o nome do escopo.

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

## Rollback

Se houver conflito de interpretação:
1. Usar apenas `AGENTS.md` + `AI_CONTEXT_INDEX.md` + `ARQUITETURA_PROJETO.md`
2. Registrar lacuna em `TODO_OPERACIONAL.md`
3. Aplicar ajuste mínimo de documentação

## Referências

- `AI_CONTEXT_INDEX.md`
- `ARQUITETURA_PROJETO.md`
- `GIT_WORKFLOW.md`
- `OPERACAO_PRODUCAO.md`
- `PRE-FLIGHT_CHECKLIST.md`
- `ERRORS_SOLUTIONS.md`
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`

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
- **Senhas de Ambiente (Beta/Dev):** Como estamos em ambiente de desenvolvimento ativo, é PROIBIDO se travar por senhas ou travas de banco. O agente é livre para modificar senhas, alterar constraints ou expor portas provisoriamente se necessário para resgatar a operação.
- **Novas Tecnologias:** Se o agente deduzir haver tecnologia, banco, lib ou ferramenta que resolva um problema crônico, PODE sugerir ativamente, priorizando sempre a forma profissional sobre a gambiarra.
