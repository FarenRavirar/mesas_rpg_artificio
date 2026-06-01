# Sessao 26-05-31_1 - Migracao de Governanca e Skills

**Data:** 2026-05-31  
**Objetivo:** implementar a migracao documental de governanca/skills dos agentes, reduzindo o SDD pesado para uso seletivo e preservando regras petreas de produto, seguranca, dados, Git, deploy e validacao Beta.

---

## Vinculos

- **Sessao anterior relacionada:** `sessoes/26-05-09_2_discord-pipeline-fase-1-em-diante.md` (bloco operacional de 2026-05-31)
- **Plano executivo:** `docs/agents/migration-action-plan.md`
- **Proxima sessao:** a definir somente se sobrar trabalho autorizado

---

## O que vou fazer

1. Executar a Fase 0 do plano: mapear as secoes do `AGENTS.md` e registrar o destino de cada regra critica antes de editar.
2. Criar/atualizar a camada operacional em `docs/agents/`: `operating-model.md`, `skill-decision-matrix.md`, `context-capsule.md` e `skill-stack.md`.
3. Enxugar `AGENTS.md` sem perder regras petreas, deixando ponteiros claros para os documentos operacionais.
4. Atualizar `.specify/memory/project-state.md` e esta sessao com o estado final.
5. Validar buscas finais por referencias antigas conflitantes e por invariantes de produto/seguranca/deploy.

## O que precisa ser feito

- [x] Fase 0: checklist de preservacao registrado.
- [x] Fase 0: mapa de secoes do `AGENTS.md` classificado como manter, mover, historico ou obsoleto.
- [x] Fase 1: `docs/agents/operating-model.md` criado.
- [x] Fase 1: `docs/agents/skill-decision-matrix.md` criado.
- [x] Fase 1: `docs/agents/skill-stack.md` atualizado.
- [x] Fase 2: `docs/agents/context-capsule.md` criado com ate 250 linhas.
- [x] Fase 3/4: `AGENTS.md` enxugado com SDD seletivo e regras petreas preservadas.
- [x] Fase 5: buscas finais de conflito executadas.
- [x] Fase 6: simulacao de retomada com 3 arquivos executada.
- [x] Atualizar `.specify/memory/project-state.md` via procedimento `/speckit.status`.
- [x] Atualizar `sessoes/index.md`.
- [ ] Mover sessao para `encerradas/` somente quando autorizado: nao aplicavel ate autorizacao explicita do mantenedor.

## O que foi feito

- [x] `.specify/memory/project-state.md` lido.
- [x] `AGENTS.md` lido integralmente.
- [x] `docs/agents/migration-action-plan.md` lido.
- [x] `docs/agents/skill-stack.md` lido.
- [x] Secao operacional de 2026-05-31 na sessao `26-05-09_2_*` lida.
- [x] Sessao dedicada criada antes de alteracoes estruturais.
- [x] Fase 0 executada com buscas obrigatorias:
  - `rg -n "Regras Específicas|Regras pétreas|Ações que exigem aprovação|Git|Migrations|Cloudinary|Google OAuth|Discord|deletehash|gratuidade|Normalização|Validação funcional" AGENTS.md`
  - `rg -n "^##|^###" AGENTS.md`
- [x] Confirmado: regras de produto/seguranca/deploy/dados existem em `AGENTS.md` e tem destino definido no mapa antes do enxugamento.
- [x] `docs/agents/operating-model.md` criado com os modos Sem SDD, SDD Lite e SDD Completo.
- [x] `docs/agents/skill-decision-matrix.md` criado com roteamento por situacao e uso seletivo de Superpowers.
- [x] `docs/agents/skill-stack.md` atualizado com ponteiros para modelo, matriz e capsule.
- [x] `docs/agents/context-capsule.md` criado com 108 linhas.
- [x] `AGENTS.md` enxugado: regras petreas, produto, seguranca, dados, Git, deploy, validacao Beta e normalizacao foram mantidas; operacao diaria movida para `docs/agents/`.
- [x] SDD reclassificado em Sem SDD, SDD Lite e SDD Completo; `/speckit.*` registrado como procedimento documental, nao CLI nem skill ativa.
- [x] `.specify/integrations/agy.manifest.json` aposentado (`status: retired`) para remover caminhos antigos de skills como fonte ativa.
- [x] Busca final por referencias antigas executada: ocorrencias restantes aparecem apenas como historico/desativacao explicita em `AGENTS.md`, `docs/agents/`, plano de migracao e `project-state.md`.
- [x] Busca final por `obrigatório.*10 linhas` executada: zero instrucao ativa; unica ocorrencia remanescente e o proprio comando de validacao no plano.
- [x] Busca direcionada sem o plano confirmou zero ocorrencias ativas de `obrigatório.*10 linhas`.
- [x] Busca direcionada confirmou zero ocorrencias de referencias antigas como fonte ativa/dependencia operacional.
- [x] Busca final por invariantes de produto/seguranca/deploy executada: `Cloudinary`, `Google OAuth`, `deletehash`, `gratuidade`, `sem anúncios`, `Normalização`, `git push origin dev`, `git push origin main`, `docker restart`, `TRUNCATE`, `DROP`, `ALTER` e `Beta` encontrados em `AGENTS.md` e/ou `context-capsule.md`.
- [x] Validacao de escopo: `git status --short backend frontend database migrations` sem resultados.
- [x] Manifesto `.specify/integrations/agy.manifest.json` validado como JSON.
- [x] Diretorios ativos antigos verificados como ausentes: `.agent/skills`, `.agents/skills`, `.gemini/skills`.
- [x] Tamanho final verificado: `AGENTS.md` com 214 linhas; `docs/agents/context-capsule.md` com 107 linhas.
- [x] Simulacao de retomada com 3 arquivos:
  - Estado atual: migracao de governanca concluida documentalmente; roadmap tecnico continua liderado pela spec 016 do pipeline Discord.
  - Stack ativo: Matt + Caveman + `.system`; Superpowers somente referencia seletiva.
  - Quando usar SDD: Sem SDD para baixo risco, SDD Lite para risco moderado, SDD Completo para alto risco.
  - Proxima acao segura: para governanca, revisar diff; para produto, retomar spec 016 apenas quando solicitado.

### Revisao completa solicitada - 2026-05-31

**Pedido do mantenedor:** fazer uma revisao completa novamente.

**Plano de revisao:**
1. Revisar o diff documental completo da migracao.
2. Validar preservacao de invariantes em `AGENTS.md` e `context-capsule.md`.
3. Verificar referencias antigas de skills e comandos `/speckit.*`.
4. Conferir escopo para garantir que nao houve alteracao de produto/runtime.
5. Registrar findings, riscos e validacoes.

**Progresso da revisao:**
- [x] Pedido registrado antes de nova analise.
- [x] Diff documental revisado.
- [x] Buscas de invariantes executadas.
- [x] Buscas de conflitos executadas.
- [x] Escopo de arquivos alterados conferido.
- [x] Resultado reportado ao mantenedor.

**Findings da revisao:**
- [ ] Regra de changelog para mudancas visiveis saiu do `AGENTS.md`/docs operacionais novos.
- [ ] `pr-description.md` deixou de aparecer como artefato obrigatorio de SDD Completo antes de PR.
- [ ] Fechamento de sessao perdeu mencao a `/speckit.retro.run`/`session-log.md`.
- [ ] Protocolo de erro conhecido (`.specify/memory/errors.md` + `/speckit.fixit.run`) nao esta mais acionavel na leitura minima.

### Ajuste de prontidao operacional - 2026-05-31

**Esclarecimento do mantenedor:** a revisao deve verificar se as alteracoes deixam a documentacao pronta para o agente operar melhor, sem se perder nem piorar. O plano de migracao e claro e deve ser refletido no resultado.

**Plano de ajuste:**
1. Repor regras operacionais essenciais que foram enxugadas demais.
2. Manter o `AGENTS.md` curto, mas suficiente para guiar uma nova sessao.
3. Atualizar `operating-model.md` e `context-capsule.md` para cobrir decisao, erro, evidencia e fechamento.
4. Rodar validacao final de prontidao contra o plano.

**Progresso:**
- [x] Esclarecimento registrado antes de editar.
- [x] Regras essenciais repostas.
- [x] Prontidao operacional validada.

**Resultado do ajuste:**
- [x] `AGENTS.md` preserva changelog obrigatorio para mudancas visiveis.
- [x] `AGENTS.md`, `operating-model.md` e `context-capsule.md` preservam `pr-description.md` quando houver PR em SDD Completo.
- [x] `AGENTS.md`, `operating-model.md` e `context-capsule.md` preservam fechamento via `/speckit.retro.run`/`session-log` quando aplicavel.
- [x] `AGENTS.md`, `operating-model.md` e `context-capsule.md` preservam protocolo de erro conhecido com `.specify/memory/errors.md`, `E###` e `/speckit.fixit.run`.
- [x] `AGENTS.md` preserva regra operacional de usar `apply_patch` para edicoes manuais.
- [x] Leituras minimas continuam pequenas: `AGENTS.md` 229 linhas, `context-capsule.md` 115 linhas.
- [x] Validacao de invariantes e prontidao executada com busca por changelog, `pr-description.md`, `session-log`, `E###`, `/speckit.fixit.run`, `apply_patch`, Cloudinary, Google OAuth, deletehash, gratuidade, sem anuncios, Normalizacao, Beta, Git/deploy, Docker e migrations.
- [x] Validacao de escopo confirmou zero alteracoes em `backend`, `frontend`, `database` e `migrations`.
- [x] `git diff --check` passou sem erros; resta apenas aviso de normalizacao CRLF/LF em `.specify/integrations/agy.manifest.json`.

### Revisao contra plano de migracao - 2026-05-31

**Pedido do mantenedor:** reler `docs/agents/migration-action-plan.md` e verificar se a migracao esta como deveria estar.

**Plano de revisao:**
1. Reler o plano de migracao como fonte de verdade.
2. Conferir entregaveis por fase.
3. Validar criterios de sucesso e invariantes do plano.
4. Apontar ajustes restantes, se houver.

**Progresso:**
- [x] Pedido registrado antes da analise.
- [x] Plano relido.
- [x] Estado atual comparado fase a fase.
- [x] Resultado reportado ao mantenedor.

**Resultado da revisao contra o plano:**
- [x] Fase 0 preservada: mapa/checklist registrados antes de enxugar `AGENTS.md`.
- [x] Fase 1 preservada: `operating-model.md`, `skill-decision-matrix.md` e `skill-stack.md` cobrem modos, riscos, skills e evidencia.
- [x] Fase 2 preservada: `context-capsule.md` existe, tem 115 linhas e cobre identidade, ambientes, stack, regras petreas, estado, decisoes, riscos e retomada.
- [x] Fase 3 preservada: `AGENTS.md` ficou menor e mantem regras petreas e invariantes.
- [x] Fase 4 preservada: SDD foi reclassificado em Sem SDD, SDD Lite e SDD Completo; `/speckit.*` e procedimento documental.
- [x] Fase 5 preservada: referencias antigas aparecem apenas como historico/desativacao; invariantes seguem encontraveis.
- [x] Fase 6 preservada: leitura maxima de tres arquivos orienta estado atual, stack ativo, uso de SDD e proxima acao segura.
- [x] Escopo preservado: zero alteracoes em `backend`, `frontend`, `database` e `migrations`.

### Correcao final de desvios da migracao - 2026-06-01

**Pedido do mantenedor:** corrigir desvios finais antes de considerar a migracao pronta.

**O que vou fazer:**
1. Inventariar arquivos antigos remanescentes fora de `skills` (`.agent/workflows`, `.agents/rules`, `.agents/workflows`, `.gemini/default-rules.md`, `.gemini/workflows`).
2. Aposentar/remover workflows ou regras antigas que apontem para skills apagadas, preferindo tombstone curto quando houver diretorio remanescente.
3. Documentar explicitamente a aposentadoria do AGY em `skill-stack.md`, `project-state.md` e nesta sessao.
4. Repor preflight seletivo de governanca para SDD Completo em `AGENTS.md` e `operating-model.md`.
5. Executar buscas finais exigidas pelo mantenedor.

**Arquivos que podem ser modificados nesta rodada:**
- `AGENTS.md`
- `docs/agents/operating-model.md`
- `docs/agents/skill-stack.md`
- `.specify/memory/project-state.md`
- `.specify/integrations/agy.manifest.json`
- arquivos tombstone/README em `.agent/`, `.agents/` e `.gemini/`, se aplicavel
- `sessoes/26-05-31_1_migracao-governanca-skills.md`

**Progresso:**
- [x] Leituras solicitadas concluídas.
- [x] Checklist de arquivamento da sessao corrigido para pendente/nao aplicavel ate autorizacao.
- [x] Inventario de remanescentes antigos concluido: `.agent/workflows`, `.agents/rules`, `.agents/workflows`, `.gemini/default-rules.md` e `.gemini/workflows` existem.
- [x] Busca confirmou que `.agent/workflows/*` ainda apontava para `.agent/skills/...` removidas; decisao: aposentar com tombstones/README curtos.
- [x] Remanescentes antigos tratados: tombstones em `.agent/workflows`, `.agents/rules`, `.agents/workflows` e `.gemini/default-rules.md`; `.gemini/workflows` sem workflows ativos/rastreados porque novos arquivos sob `.gemini/` sao ignorados.
- [x] AGY documentado como aposentado intencionalmente em `skill-stack.md`, `project-state.md` e nesta sessao.
- [x] Preflight seletivo de SDD Completo reposto em `AGENTS.md` e `operating-model.md`.
- [x] Buscas finais executadas.

**Validacao final da correcao de desvios:**
- [x] `rg` em `.agent`, `.agents` e `.gemini` retornou zero referencias a `.agent/skills`, `.agents/skills`, `.gemini/skills`, leituras de skill apagada ou workflows `/speckit.*` antigos.
- [x] `.agent/workflows`, `.agents/rules` e `.agents/workflows` contem apenas `README.md` tombstone.
- [x] `.gemini/default-rules.md` e tombstone rastreado; `.gemini/workflows` nao contem arquivos.
- [x] `.specify/integrations/agy.manifest.json` validado como JSON e mantido com `status: retired`.
- [x] Busca confirmou preflight seletivo de SDD Completo em `AGENTS.md`, `operating-model.md` e `project-state.md`.
- [x] Busca confirmou invariantes de produto/seguranca/deploy em `AGENTS.md` e `context-capsule.md`.
- [x] Busca direcionada nos docs ativos retornou zero referencia antiga como fonte ativa/dependencia operacional e zero regra ativa de `obrigatório.*10 linhas`.
- [x] `git status --short backend frontend database migrations` sem resultados.
- [x] `git diff --check` sem erros; permanece apenas aviso de normalizacao CRLF/LF em `.specify/integrations/agy.manifest.json`.

### Correcao de ultimo remanescente legado - 2026-06-01

**Pedido do mantenedor:** converter `.agents/default-rules.md` em tombstone curto, equivalente ao `.gemini/default-rules.md`, sem manter instrucao operacional antiga.

**O que vou fazer:**
1. Verificar `.agents/default-rules.md` e `.gemini/default-rules.md`.
2. Substituir `.agents/default-rules.md` por tombstone curto apontando para `AGENTS.md` e `docs/agents/`.
3. Registrar a correcao e validar busca final obrigatoria.

**Progresso:**
- [x] Leituras solicitadas concluidas.
- [x] `.agents/default-rules.md` convertido em tombstone.
- [x] `.gemini/default-rules.md` confirmado como tombstone curto.
- [x] Busca final obrigatoria executada: zero resultados para governanca antiga operacional em `.agent`, `.agents` e `.gemini`.
- [x] Escopo de produto/runtime validado: `git status --short backend frontend database migrations` sem resultados.
- [x] `git diff --check` sem erros; permanece apenas aviso de normalizacao CRLF/LF em `.specify/integrations/agy.manifest.json`.
- [x] `project-state.md` atualizado para registrar que `.agents/default-rules.md` era o ultimo remanescente legado e foi aposentado.

---

## Arquivos que serao modificados

- `AGENTS.md`
- `docs/agents/operating-model.md`
- `docs/agents/context-capsule.md`
- `docs/agents/skill-decision-matrix.md`
- `docs/agents/skill-stack.md`
- `.specify/memory/project-state.md`
- `sessoes/26-05-31_1_migracao-governanca-skills.md`
- `sessoes/index.md`

## Fora de escopo

- Codigo de frontend/backend.
- Migrations, banco de dados, deploy, runtime ou infraestrutura.
- Commit, push, PR ou merge.
- Recriacao de skills antigas.

## Criterio de conclusao explicito

Uma nova sessao deve conseguir entender o projeto e operar lendo no maximo:

1. `.specify/memory/project-state.md`
2. `AGENTS.md`
3. `docs/agents/context-capsule.md`

Tambem devem estar verdes as buscas finais por referencias conflitantes a `.agent/skills`, `.agents/skills` e `.gemini/skills`, e por invariantes de produto/seguranca/deploy.

---

## Fase 0 - Preservacao antes de enxugar `AGENTS.md`

### Checklist de preservacao

- [x] Regras de produto preservadas.
- [x] Regras de seguranca e privacidade preservadas.
- [x] Regras de dados, banco e migrations preservadas.
- [x] Regras de auth, Cloudinary e upload preservadas.
- [x] Regras de Git, deploy e aprovacoes preservadas.
- [x] Regras de validacao Beta preservadas.
- [x] Regras de sessao preservadas em forma mais curta.
- [x] SDD reclassificado sem eliminar rastreabilidade de alto risco.
- [x] Skills antigas citadas apenas como historico/desativadas, nunca como fonte ativa.

### Mapa de secoes do `AGENTS.md`

| Secao atual | Destino | Registro |
|---|---|---|
| Inicio obrigatorio de sessao | Manter em `AGENTS.md` | Resumir e apontar para `context-capsule.md`. |
| Gate obrigatorio - tarefas complexas | Manter/mover | Trocar para classificacao Sem SDD / SDD Lite / SDD Completo; detalhes em `operating-model.md`. |
| Leitura obrigatoria de governance SDD | Mover | Virar regra seletiva em `operating-model.md`; manter ponteiro em `AGENTS.md`. |
| Gestao de contexto | Manter/mover | Manter regra curta em `AGENTS.md`; detalhes no capsule/modelo operacional. |
| Roteamento de contexto | Mover | Consolidar em `context-capsule.md` e `operating-model.md`. |
| Execucao - principios | Manter/mover | Manter principios criticos; mover exemplos operacionais. |
| Ferramentas | Remover por obsolescencia parcial | A lista cita ferramentas nao disponiveis neste runtime; substituir por regra simples de preferir ferramentas especificas. |
| Agent Skills - stack ativo local | Manter/mover | Manter resumo em `AGENTS.md`; detalhes em `skill-stack.md` e matriz. |
| Protocolo de conclusao | Manter | Preservar exigencia de evidencia fresca e fechamento de sessao. |
| Regras petreas | Manter | Preservar integralmente em forma curta e rastreavel. |
| Regras especificas do projeto | Manter | Preservar invariantes de produto/seguranca/dados/auth. |
| Regras gerais de codigo | Manter | Preservar, mesmo sem editar codigo nesta sessao. |
| Protocolo de sessao | Manter/mover | Manter minimo em `AGENTS.md`; detalhes operacionais podem ficar em `operating-model.md`. |
| Infraestrutura | Manter/mover | Manter aprovacoes e dados essenciais; detalhes ficam em docs existentes. |
| Ambientes | Manter | Preservar URLs, branchs e fluxo Beta/Producao. |
| Formato de resposta | Mover | Tratar como preferencia operacional, nao regra petrea. |
| Comandos Spec-Kit e extensoes | Mover/resumir | Registrar que `/speckit.*` e procedimento documental, nao CLI nem skill ativa. |
| Idioma | Manter | Portugues obrigatorio. |
| SPECKIT active plan | Historico | Atualizar/remover ponteiro se ficar conflitante com governanca atual. |
