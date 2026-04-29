# AGENTS.md — Governança de Agentes de IA
**Projeto:** Anúncios de Mesas RPG (Portal Colaborativo)
**Fonte canônica de governança.** Em conflito com qualquer outro arquivo, este prevalece.
Em conflito com `.specify/arquiteture.md` sobre arquitetura ou contratos técnicos, prevalece `.specify/arquiteture.md`.

---

## INÍCIO OBRIGATÓRIO DE SESSÃO

Execute nesta ordem, sem pular etapas:

1. Ler `.specify/memory/project-state.md` — estado atual e próxima ação (gerado por `/speckit.status`)
2. Ler este arquivo (`AGENTS.md`) na íntegra
3. Verificar se existe sessão ativa com checklist incompleta em `/sessoes/`
4. **Se existir sessão ativa incompleta:** continuar nela; é proibido criar nova sessão
5. **Só criar nova sessão** quando houver pedido explícito do usuário **ou** quando a sessão ativa estiver 100% concluída e o usuário autorizar avançar
6. Abrir/retomar o arquivo da sessão e registrar imediatamente: o que vai fazer · o que precisa ser feito · o que foi feito
7. Atualizar a sessão **antes** de qualquer alteração técnica
8. Atualizar a sessão após cada etapa executada (progresso contínuo)
9. Só iniciar trabalho após concluir os passos acima

> **ENFORCEMENT CRÍTICO (F15):** os itens 6, 7 e 8 não são aspiracionais. Sessão não atualizada em tempo real é falha processual registrada no `docs/sdd/SESSION_FAILURES_REGISTRY.md`. A cada 3 commits dentro da branch SDD atual sem commit correspondente em `sessoes/`, o agente DEVE parar e atualizar o arquivo de sessão.

---

## GATE OBRIGATÓRIO — TAREFAS COMPLEXAS

**Se a tarefa envolver auditoria, mapeamento, implementação de feature ou qualquer trabalho com escopo > 10 linhas:**

1. OBRIGATÓRIO executar `/speckit.specify` antes de qualquer leitura de arquivo de código
2. Aguardar spec aprovada antes de prosseguir para `/speckit.plan`
3. Aguardar plan aprovado antes de `/speckit.tasks`
4. Proibido iniciar busca manual em código sem spec ativa

**Tarefa simples (correção pontual, < 10 linhas, sem teste, sem deploy):** leitura de cabeçalhos dos MDs de governança é suficiente — prosseguir diretamente.

---

## LEITURA OBRIGATÓRIA DE GOVERNANCE SDD

Antes de qualquer alteração técnica, ler conforme gatilho:

| Arquivo | Quando ler |
|---|---|
| `.specify/memory/constitution.md` | Cabeçalhos sempre; arquivo completo se: SDD, testes, deploy, migrations, ou mudança > 10 linhas |
| `docs/sdd/SESSION_FAILURES_REGISTRY.md` | Cabeçalhos sempre; completo ao referenciar código F01–F14 |
| `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` | Leitura completa em qualquer trabalho SDD |
| `docs/sdd/analyze-governance-gate.md` | Leitura completa ANTES de rodar `/speckit.analyze` |

---

## GESTÃO DE CONTEXTO — REGRA ÚNICA

**Nunca abra um arquivo grande sem grep primeiro.**

```bash
grep -n "padrão" arquivo.md          # localizar antes de abrir
# depois: abrir só as linhas necessárias via view_range
```

**Arquivos que nunca abrir na íntegra:**
- `.specify/arquiteture.md` (800+ linhas) → grep pelo §, abrir só a seção
- `docs/legacy/FILA_IMPLEMENTACAO.md` → consulta histórica apenas
- `docs/legacy/BACKLOG_OPERACIONAL.md` → consulta histórica apenas

**Hierarquia de leitura por sessão:**
1. `.specify/memory/project-state.md` + feature ativa em `.specify/features/` (sempre)
2. Seção relevante de `.specify/arquiteture.md` (só se afetado)
3. Arquivo de código alvo + `MAPA_DE_API.md` (só se afetado)
4. Arquivos inteiros > 100 linhas: **nunca por padrão**

**Sistema legado vs. SDD:**
- **Legado:** `docs/legacy/BACKLOG_OPERACIONAL.md` e `docs/legacy/FILA_IMPLEMENTACAO.md` (consulta histórica)
- **SDD (canônico):** `.specify/features/{id}/spec.md` (O QUE FAZER) e `.specify/features/{id}/tasks.md` (COMO FAZER)
- **Regra:** Novos requisitos → criar feature via `/speckit.specify`

---

## ROTEAMENTO DE CONTEXTO

| Situação | Arquivo | Como acessar | Gerenciado por |
|---|---|---|---|
| Regras Invioláveis do Projeto | `.specify/memory/constitution.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas | `/speckit.constitution` |
| Arquitetura do projeto (substitui `ARQUITETURA_PROJETO.md`) | `.specify/arquiteture.md` | Seção relevante via busca por `##` | Manual |
| Memória de Falhas Operacionais | `docs/sdd/SESSION_FAILURES_REGISTRY.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas | Manual |
| Gatilhos de bloqueio / Review | `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas | Manual |
| Auditoria / /speckit.analyze | `docs/sdd/analyze-governance-gate.md` | Arquivo completo antes de qualquer run de auditoria | `/speckit.analyze` |
| Introdução ao sistema SDD | `docs/sdd/README.md` | Arquivo completo ao iniciar trabalho SDD | Manual |
| Mapeamento SDD (onde buscar info) | `docs/sdd/MAPEAMENTO_SDD.md` | Consultar ao criar specs | Manual |
| Política de branches SDD | `docs/sdd/BRANCH_POLICY.md` | Seção relevante ao trabalhar com branches | Manual |
| Agente especializado em docs | `DOCS_AGENT.md` | Arquivo completo se trabalho for exclusivo de .md | Manual |
| Git, branch, merge, deploy | `docs/sdd/BRANCH_POLICY.md` + `PRE_DEPLOY_CHECKLIST.md` | seção relevante + checklist completo em produção | Manual |
| Deploy em produção (checklist) | `PRE_DEPLOY_CHECKLIST.md` | arquivo completo | Manual |
| Estado operacional de produção ou beta | `.specify/memory/project-state.md` + `.specify/arquiteture.md` | estado atual sempre; seção arquitetural relevante via busca | `/speckit.status` + Manual |
| Falha de ambiente, encoding, template | `PRE-FLIGHT_CHECKLIST.md` | arquivo completo | Manual |
| Erro encontrado? (substitui `ERRORS_SOLUTIONS.md`) | `.specify/memory/errors.md` | consultar `E###` e executar `/speckit.fixit.run <descrição>` | `/speckit.fixit.run` |
| Migrations (criar, aplicar, erros) | `migrations_guide.md` | seção relevante | Manual |
| Backlog de requisitos (produto) | `.specify/features/req-XX/` | Fonte canônica de requisitos por feature | `/speckit.specify` |
| Planejando feature? | `.specify/features/req-XX/spec.md` | iniciar com `/speckit.specify` | `/speckit.specify` |
| Executando lote? | `.specify/features/req-XX/tasks.md` | executar tarefas na ordem definida | Manual |
| Índice rápido e checklists | `GUIA_RAPIDO_OPERACIONAL.md` | arquivo completo | Manual |
| Estado atual e próxima ação (substitui `RESUMO_EXECUCAO.md`) | `.specify/memory/project-state.md` | gerado por `/speckit.status` | `/speckit.status` |
| Log de sessões e retrospectivas | `.specify/memory/session-log.md` | append automático | `/speckit.retro.run` |

---

## EXECUÇÃO — PRINCÍPIOS

### Executar vs. Parar

**Execute diretamente (sem pedir confirmação):**
- Feature já especificada em documento canônico
- Ajuste de UX dentro do padrão estabelecido
- Correção de bug com solução em `.specify/memory/errors.md`
- Atualização de documentação por delta

**Pare e pergunte quando:**
- Conflito entre requisito e arquitetura
- Decisão de produto não documentada
- Risco de quebra de contrato público
- Ambiguidade crítica de escopo

**Comportamento que causa travamento — proibido:**
- Re-ler o mesmo arquivo múltiplas vezes na mesma sessão
- Consultar `.specify/arquiteture.md` repetidamente ou na íntegra
- Pedir confirmação para cada linha de código
- Reformular o mesmo plano múltiplas vezes sem executar
- Usar "arquivo muito grande" como motivo para não terminar
- Verbalizar raciocínio de escolha de ferramenta antes de executar

### Checklist mental antes de cada ação
```
[ ] Já li este arquivo nesta sessão?
[ ] O plano está claro?
[ ] Estou prestes a re-analisar algo que já analisei?
[ ] Tenho spec ativa para esta tarefa (se complexa)?
```

### Quando encontrar um erro
1. Parar tentativas imediatamente
2. `grep -n "E###" .specify/memory/errors.md`
3. Se constar: aplicar solução documentada
4. Se não constar: descobrir, registrar no arquivo, só então continuar

---

## FERRAMENTAS

Preferir específicas sobre genéricas. Executar direto — sem verbalizar a escolha.

| Evitar | Usar |
|---|---|
| `bash grep` | `grep_search` |
| `bash ls` | `list_dir` |
| `bash cat` (visualizar) | `view_file` |
| `bash cat` / `sed` (editar) | `replace_file_content` / `write_to_file` |
| `bash cat` (criar arquivo) | `write_to_file` |

---

## PROTOCOLO DE CONCLUSÃO — ALGORITMO ÚNICO

Uma tarefa só está concluída quando **todas** as condições abaixo são verdadeiras:

```
[ ] Busca final retorna ZERO resultados para o padrão da tarefa
[ ] TODOS os itens da checklist da sessão estão [x]
[ ] Nenhum arquivo parcialmente modificado
[ ] `.specify/memory/project-state.md` atualizado via `/speckit.status` ou `/speckit.retro.run`
```

Se qualquer condição for falsa: **continue trabalhando**.

**Palavras que invalidam automaticamente uma conclusão:**
`parcial` · `restante` · `maioria` · `principais` · `alguns` · `70%` · `X de Y arquivos`

**Para auditorias especificamente:**
- Liste todos os itens antes de começar
- Verifique item por item — sem pular por "baixa prioridade"
- Só declare "auditoria completa" com checklist 100% [x]

---

## REGRAS PÉTREAS

### Migrations e Schema

- Nunca aplicar migration com `TRUNCATE`, `DROP`, `DELETE` ou `ALTER` em produção sem dump prévio via `PRE_DEPLOY_CHECKLIST.md`
- Nunca executar `ALTER TABLE` avulso em produção — reverter via rollback documentado
- Migrations antigas (> 1 semana): nunca reaplicar

### Ações que exigem aprovação explícita do usuário

```
BLOQUEANTE — nunca executar sem aprovação:
- docker restart / stop / start
- scp, rsync, docker cp
- npm run build (no servidor)
- git commit
- git push origin dev ou main
- git push origin --delete (deletar branches remotos)
- psql com INSERT, UPDATE, DELETE, DROP, ALTER
- Reiniciar containers ou serviços
- Copiar ou sobrescrever arquivos em produção
- Modificar arquivos fora do escopo da tarefa
```

**Comandos read-only — permitidos sem aprovação:**
`docker ps` · `docker logs` · `docker stats` · `docker inspect` · `ls` · `cat` · `grep` · `find` · `head` · `tail` · `curl -s` (GET) · `psql` com `SELECT`

**Formato obrigatório para solicitar aprovação:**
```
## APROVAÇÃO NECESSÁRIA

Ação: [o que será feito]
Motivo: [por que é necessário]
Risco: [o que pode dar errado]
Rollback: [como desfazer]

Comandos:
1. comando1
2. comando2

Posso prosseguir?
```

### Git

| Operação | Autorização |
|---|---|
| Criar branch `feat/NNN-nome` | Automático |
| `git push origin feat/*` | Automático |
| Abrir PR para dev | Automático |
| `git push origin dev` | Exige autorização explícita |
| `git push origin main` | Exige autorização explícita |
| Merge de PR | Exclusivo do responsável — nunca pelo agente |

### Proibição absoluta — checkout entre branches

Nunca usar `git checkout` entre `dev` e `main` durante deploy. Causa desaparecimento de arquivos (ver `.specify/memory/errors.md` E143).

```bash
# CORRETO — deploy via PR
gh pr create --base main --head dev --title "..." --body "..."
gh pr merge <número> --merge --delete-branch=false

# CORRETO — verificar divergência sem checkout
git log origin/main..origin/dev --oneline
git rev-list --left-right --count origin/main...origin/dev
```

### Documentação — onde registrar

| Tipo | Arquivo | Status |
|---|---|---|
| Requisito de produto | `.specify/features/{id}/spec.md` | ✅ Canônico (SDD) |
| Tarefa técnica | `.specify/features/{id}/tasks.md` | ✅ Canônico (SDD) |
| Erro com solução validada | `.specify/memory/errors.md` | ✅ Canônico |
| ~~Requisito de produto~~ | ~~`BACKLOG_OPERACIONAL.md`~~ | ⚠️ Legado |
| ~~Tarefa técnica~~ | ~~`FILA_IMPLEMENTACAO.md`~~ | ⚠️ Legado |

**Sistema canônico (SDD):**
- Novos requisitos → criar feature em `.specify/features/{id}/` via `/speckit.specify`
- Feature contém: `spec.md` (requisitos), `plan.md` (arquitetura), `tasks.md` (execução)
- Após conclusão → arquivar via `/speckit.archive.run`

### Artefatos Obrigatórios por Feature SDD

Toda feature SDD deve ter os seguintes artefatos em `specs/NNN-*/` antes de abrir PR:

- `spec.md` — especificação da feature
- `plan.md` — plano de implementação
- `tasks.md` — checklist de execução
- `pr-description.md` — sumário executivo para o corpo do PR (criado como última tarefa de documentação)

O `pr-description.md` deve conter: sumário executivo · mudanças por fase/componente · testing evidence · checklist pós-merge.

### Changelog

Toda mudança visível que impacte **mestres e/ou usuários finais** exige entrada em `database/changelogs.json` antes do deploy. Mudanças exclusivas de área administrativa interna não exigem registro.

**CUIDADO BLOQUEANTE:** Melhorias publicadas na mesma data DEVEM ser unificadas em um único objeto. Proibido criar múltiplas entradas JSON para a mesma data de calendário.

```json
{
  "id": "YYYY-MM-DD-atualizacoes-do-dia",
  "title": "Título Curto e Descritivo Consolidado",
  "body": "Descrição em linguagem familiar:\n\n• **Mudança 1** - Benefício\n• **Mudança 2** - Benefício\n\n_Atualização unificada publicada em DD/MM/YYYY às HH:MM_",
  "type": "app",
  "published": true,
  "created_at": "YYYY-MM-DDTHH:MM:SS-03:00"
}
```

Linguagem 100% leiga. Proibido: `sidebar vertical`, `migration`, `refactor`, `placeholder`.

---

## REGRAS ESPECÍFICAS DO PROJETO

- **Cloudinary:** `VITE_CLOUDINARY_CLOUD_NAME` e `VITE_CLOUDINARY_UPLOAD_PRESET` são variáveis de build-time. Nunca hardcodar. Upload exclusivamente via backend com signed preset.
- **Google OAuth:** único método de autenticação. Sem login por e-mail/senha sem autorização.
- **Discord:** vínculo opcional de perfil. Não substitui Google OAuth.
- **Elevação de role:** `player` → `gm` ao criar primeiro `gm_profile`. Lógica exclusiva do Backend.
- **`cover_deletehash`, `avatar_deletehash`, `banner_deletehash`:** nunca retornados por rotas públicas.
- **Nome do banco:** `mesas_rpg`, não `mesas`. Ver `.specify/memory/errors.md` E059.
- **Compromissos inegociáveis:** gratuidade, sem anúncios, sem coleta desnecessária de dados.
- **UX:** toda mudança de interface valida contra as 10 Heurísticas de Nielsen antes do merge.
- **Testes de interface:** usuário sempre testa em janela anônima. Nunca perguntar sobre cache de browser ou sugerir limpeza de cache.
- **Validação funcional/manual:** só é considerada válida após deploy do branch `dev` no ambiente Beta (`mesasbeta.artificiorpg.com`). Build, testes automatizados e checks locais são validações técnicas pré-deploy, mas não substituem teste funcional em Beta. Ao finalizar implementação que afete UI/fluxos reais, registrar como próximo passo: push/deploy para `dev` e teste do usuário em janela anônima no Beta.

---

## REGRAS GERAIS DE CÓDIGO

- Mudança mínima — sem refactor massivo, sem quebrar contratos existentes
- Mudança reversível — preferir abordagens que possam ser desfeitas
- Lógica de interface, busca e filtros → Frontend (React/TypeScript)
- Lógica de autenticação e permissões → Backend (Node.js/TypeScript via JWT)
- Python → exclusivamente para scripts fora do runtime da API principal
- Upload e processamento de imagens → sempre no Backend
- **Normalização obrigatória de dados de fronteira:** todo dado vindo de API, banco, JSON/JSONB, query string, `localStorage` ou integração externa deve ser tratado como `unknown` até passar por normalizador tipado antes de entrar em estado React, props de componente ou renderização. É proibido chamar `.map`, `.filter`, `.reduce`, `.forEach`, spread de array, `.length` sem semântica validada, ou acessar campos aninhados assumindo formato em payload externo sem `Array.isArray`, parser/schema/normalizador ou fallback explícito. Para campos legados que podem vir como JSON string ou objeto, o normalizador deve aceitar formatos conhecidos, retornar valor seguro (`[]`, `{}` ou `null`) quando inválido e ter validação local (`npm --prefix frontend run build`) antes de commit/deploy.

---

## PROTOCOLO DE SESSÃO

**Nome do arquivo:** `AA-MM-DD_N_<escopo>.md`
**Localização:** `/sessoes/`
**Índice:** `/sessoes/index.md`

**Formato:**
```
AA-MM-DD_N_<escopo>.md
│ │ │  │ │
│ │ │  │ └── escopo (curto, minúsculas, hifens)
│ │ │  └──── número sequencial (1, 2, 3...)
│ │ └────── dia
│ └───────── mês
└─────────── ano (2 dígitos)
```

**Verificar número sequencial:**
1. Consultar `index.md` para saber o próximo número
2. Se a última sessão do dia é `26-04-15_3_*`, a próxima é `26-04-16_1_*`

**Conteúdo mínimo obrigatório:**
1. **Cabeçalho** — Data, Objetivo (1–2 frases)
2. **Vínculos** — Sessão Anterior e Próxima Sessão (se aplicável)
3. **Plano de execução** — lista numerada
4. **Checklist de fechamento** — executar `/speckit.retro.run` (substitui checklist manual)
5. **Arquivos que serão modificados**
6. **Critério de conclusão explícito**
7. `[ ] Atualizar .specify/memory/project-state.md via /speckit.status` — último item obrigatório
8. `[ ] Mover sessão para encerradas/ (quando autorizado)` — arquivamento após confirmação
9. `[ ] Atualizar index.md` — adicionar sessão ao índice

**Ao finalizar a sessão:**
- Fechamento registrado via `/speckit.retro.run` (substitui checklist manual)
- `.specify/memory/project-state.md` atualizado via `/speckit.status` ou `/speckit.retro.run`
- `.specify/memory/session-log.md` atualizado com entrada da sessão
- `index.md` atualizado com nova sessão
- Verificar se sessão referenciada no project-state.md existe (validação)

**Arquivamento de sessões encerradas:**
- Sessões concluídas permanecem em `/sessoes/` até confirmação explícita do usuário
- Somente após confirmação do usuário, mover para `/sessoes/encerradas/`
- Atualizar `index.md` com novo caminho
- Nunca mover sessões automaticamente

---

## INFRAESTRUTURA

- **VM Oracle:** `gh` autenticado para a conta mantenedora. Consultar `.specify/arquiteture.md` apenas pela seção relevante quando detalhes de infraestrutura forem necessários.
  Acesso SSH: `ssh -F C:\projetos\config faren`
- **Token/PAT:** nunca registrar, expor ou versionar em chat, logs, commits ou arquivos.
- **Cloudflare Tunnel:** nunca criar novos túneis ou containers `cloudflared` paralelos.
- **Credenciais PostgreSQL:**
  ```bash
  docker exec mesas-beta-db psql -U admin -d mesas_rpg
  docker exec mesas-beta-db env | grep POSTGRES
  ```
- **PowerShell:** versão 7.6.0.
- **Arquivos temporários e de teste:** alocar em `/testes/`. Proibido criar scripts de diagnóstico na raiz.

---

## AMBIENTES

| Ambiente | URL | Branch | Pasta |
|---|---|---|---|
| Beta (ativo) | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` |
| Produção (ativo) | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` |

Fluxo: `feat/NNN-nome` → `dev` (beta) → aprovação → `main` (produção).

> **Referência:** Credenciais de banco, variáveis de ambiente e infraestrutura completa estão documentadas em `.specify/arquiteture.md` §2 e §11.

---

## FORMATO DE RESPOSTA

```
Contexto         — o que foi entendido
Plano            — o que será feito (lista numerada)
Execução         — patches incrementais
Validação        — o que foi verificado
Riscos           — o que pode dar errado
Rollback         — como desfazer se necessário
Próximos Passos  — próximos passos objetivos e imediatos
```

---

## COMANDOS SPEC-KIT E EXTENSÕES

**Natureza dos comandos:** Todos os comandos Spec-Kit são **instruções para o agente AI**, não comandos CLI executáveis diretamente no terminal.

### Extensões Instaladas

| Extensão | Versão | Comandos | Tipo |
|---|---|---|---|
| **Git** | - | `speckit.git.initialize`, `speckit.git.feature`, `speckit.git.validate`, `speckit.git.remote`, `speckit.git.commit` | Automação Git |
| **Fixit** | - | `speckit.fixit.run` | Correção de bugs com consciência de spec |
| **Brownfield** | - | `speckit.brownfield.scan`, `speckit.brownfield.bootstrap`, `speckit.brownfield.validate`, `speckit.brownfield.migrate` | Adoção incremental de SDD |
| **MemoryLint** | 1.3.0 | `speckit.memorylint.run`, `speckit.memorylint.load-agents` | Governança de memória AI |
| **Optimize** | 1.0.0 | `speckit.optimize.run`, `speckit.optimize.tokens`, `speckit.optimize.learn` | Otimização de governança AI |
| **Reconcile** | 1.0.0 | `speckit.reconcile.run` | Reconciliação de drift entre artefatos SDD e implementação |
| **Bugfix** | 1.0.0 | `speckit.bugfix.report`, `speckit.bugfix.patch`, `speckit.bugfix.verify` | Correção estruturada de bugs com rastreabilidade |
| **Status** | 1.0.0 | `speckit.status.show`, `speckit.status` | Dashboard de estado SDD e progresso de workflow |
| **Verify-Tasks** | 1.0.0 | `speckit.verify-tasks.run`, `speckit.verify-tasks` | Detecção de phantom completions em tasks.md |
| **Archive** | 1.0.0 | `speckit.archive.run` | Arquivamento pós-merge de features na memória canônica |
| **Doctor** | 1.0.0 | `speckit.doctor.check`, `speckit.doctor` | Diagnóstico de saúde do projeto Spec-Kit |
| **Retro** | 1.0.0 | `speckit.retro.run` | Análise retrospectiva de sprint com métricas e melhorias |

### Comandos Core

- `/speckit.specify` — gera `spec.md` (especificação da feature)
- `/speckit.plan` — gera `plan.md` (plano de implementação)
- `/speckit.tasks` — gera `tasks.md` (checklist de execução)
- `/speckit.implement` — executa implementação seguindo tasks
- `/speckit.constitution` — regenera `.specify/memory/constitution.md`

### Protocolo de Uso

1. **Comandos core:** Solicitar ao agente que execute (ex: "execute /speckit.specify")
2. **Comandos de extensão:** Solicitar ao agente que siga as instruções do comando
3. **Hooks automáticos:** Executam automaticamente em pontos específicos do workflow SDD
4. **Nunca tentar executar via CLI:** `specify speckit.memorylint.run` falhará (não é comando CLI)
5. **Regra pétrea de execução:** todo comando no formato `/speckit.*` deve ser tratado como **guia procedural do agente** (workflow + skill + atualização documental). É proibido marcar concluído sem evidência do procedimento executado.
6. **Não tratar como terminal:** `/speckit.*` é guia procedural de execução do agente; não é comando de shell.

### Documentação das Extensões

- **Spec-Kit core:** `docs/sdd/README.md`
- **Git:** `.agents/skills/speckit-git-*/`
- **Fixit:** `docs/sdd/FIXIT_EXTENSION.md`
- **Brownfield:** `docs/sdd/README.md` (seção Brownfield)
- **MemoryLint:** `docs/sdd/MEMORYLINT_EXTENSION.md`
- **Optimize:** `docs/sdd/OPTIMIZE_EXTENSION.md`
- **Reconcile:** `docs/sdd/RECONCILE_EXTENSION.md`
- **Bugfix:** `docs/sdd/BUGFIX_EXTENSION.md`
- **Status:** `docs/sdd/STATUS_EXTENSION.md`
- **Verify-Tasks:** `docs/sdd/VERIFY_TASKS_EXTENSION.md`
- **Archive:** `docs/sdd/ARCHIVE_EXTENSION.md`
- **Doctor:** `docs/sdd/DOCTOR_EXTENSION.md`
- **Retro:** `docs/sdd/RETRO_EXTENSION.md`

---

## IDIOMA

Toda comunicação em **português**. Nomes de arquivos, comandos, funções e identificadores de código permanecem no formato original.

<!-- SPECKIT START -->
Current active plan: `specs/008-catalogo-painel-ux-bugs/plan.md`.
<!-- SPECKIT END -->
