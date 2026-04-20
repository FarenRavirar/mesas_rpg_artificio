# AGENTS.md — Governança de Agentes de IA
**Projeto:** Anúncios de Mesas RPG (Portal Colaborativo)
**Fonte canônica de governança.** Em conflito com qualquer outro arquivo, este prevalece.
Em conflito com `ARQUITETURA_PROJETO.md` sobre arquitetura ou contratos técnicos, prevalece `ARQUITETURA_PROJETO.md`.

---

## INÍCIO OBRIGATÓRIO DE SESSÃO

Execute nesta ordem, sem pular etapas:

1. Ler `RESUMO_EXECUCAO.md` — estado atual e próxima ação (arquivo completo, é curto)
2. Ler este arquivo (`AGENTS.md`) na íntegra
3. Verificar se existe sessão ativa com checklist incompleta em `/sessoes/`
4. **Se existir sessão ativa incompleta:** continuar nela; **é proibido criar nova sessão**
5. **Só criar nova sessão** quando houver pedido explícito do usuário **ou** quando a sessão ativa estiver 100% concluída e o usuário autorizar avançar
6. Abrir/retomar o arquivo da sessão escolhida e registrar imediatamente:
   - o que vai fazer
   - o que precisa ser feito
   - o que foi feito
7. Atualizar a sessão **antes** de qualquer alteração técnica
8. Atualizar a sessão após cada etapa executada (progresso contínuo)
9. Só iniciar trabalho após concluir os passos acima

> **ENFORCEMENT CRÍTICO (F15):** os itens 6, 7 e 8 acima não são 
> aspiracionais. Sessão não atualizada em tempo real é falha 
> processual registrada no `docs/sdd/SESSION_FAILURES_REGISTRY.md`. 
> A cada 3 commits dentro da branch SDD atual (qualquer tipo — feat, 
> fix, docs, chore) sem commit correspondente em `sessoes/`, o agente 
> está OBRIGADO a parar e atualizar o arquivo de sessão. Se o 
> mantenedor perguntar "cadê a sessão?", a resposta esperada é "já 
> atualizei há <N> minutos", não "vou criar agora".

## Leitura obrigatória de governance SDD

Antes de qualquer alteração técnica no repositório, ler os arquivos abaixo 
conforme gatilho aplicável:

- `.specify/memory/constitution.md` — regras invioláveis SDD e infra. 
  Cabeçalhos sempre; arquivo completo se trabalho envolver SDD, testes, 
  deploy, migrations, ou mudança > 10 linhas.
- `docs/sdd/SESSION_FAILURES_REGISTRY.md` — 14 falhas processuais 
  calibradas. Cabeçalhos sempre; consulta por código (F01-F14) quando 
  mantenedor referenciar.
- `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` — gatilhos de bloqueio 
  imediato. Leitura completa obrigatória em qualquer trabalho SDD.
- `docs/sdd/analyze-governance-gate.md` — gate de /speckit.analyze. 
  Leitura completa obrigatória ANTES de rodar /speckit.analyze.

Se o trabalho for trivial (< 10 linhas, sem teste, sem deploy), leitura 
de cabeçalhos é suficiente. Qualquer dúvida, leitura completa.

---

## GESTÃO DE CONTEXTO — REGRA ÚNICA

**Nunca abra um arquivo grande sem grep primeiro.**

```bash
# Sempre: localizar antes de abrir
grep -n "padrão" arquivo.md
# Depois: abrir só as linhas necessárias via view_range
```

**Arquivos que nunca abrir na íntegra:**
- `ARQUITETURA_PROJETO.md` (1396+ linhas) → grep pelo §, abrir só a seção
- `FILA_IMPLEMENTACAO.md` → grep por "pendente" ou ver detalhes no BACKLOG
- `BACKLOG_OPERACIONAL.md` → grep pelo REQ ou ver no Índice

**Diferença entre documentos:**
- `BACKLOG_OPERACIONAL.md` = **O QUE FAZER** (features/produto). Guia canônico para agentes.
- `FILA_IMPLEMENTACAO.md` = **COMO FAZER** (detalhes técnicos). Referência para implementação.
- **Regra:** Primeiro verificar BACKLOG. Se precisa details técnicos, verificar FILA.
- **Regra:** Itens novos → primeiro no BACKLOG. FILA recebe detalhes após.

**Hierarquia de leitura por sessão:**
1. `RESUMO_EXECUCAO.md` + item da FILA via grep (sempre)
2. Seção relevante de `ARQUITETURA_PROJETO.md` (só se afetado)
3. Arquivo de código alvo + `MAPA_DE_API.md` (só se afetado)
4. Arquivos inteiros > 100 linhas: **nunca por padrão**

---

## ROTEAMENTO DE CONTEXTO

| Situação | Arquivo | Como acessar |
|---|---|---|
| Regras Invioláveis do Projeto | `.specify/memory/constitution.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas |
| Memória de Falhas Operacionais | `docs/sdd/SESSION_FAILURES_REGISTRY.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas |
| Gatilhos de bloqueio / Review | `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` | Cabeçalhos sempre; Completo se: SDD, testes, deploy ou mudança > 10 linhas |
| Auditoria / /speckit.analyze | `docs/sdd/analyze-governance-gate.md` | Arquivo completo antes de qualquer run de auditoria |
| Banco, modelo de dados, rotas de API | `ARQUITETURA_PROJETO.md` §4 e §12 | grep pelo §, só a seção |
| Upload, imagens, Cloudinary | `ARQUITETURA_PROJETO.md` §16 | grep pelo §, só a seção |
| Roles, permissões, autenticação | `ARQUITETURA_PROJETO.md` §5 e §6 | grep pelo §, só a seção |
| Decisões arquiteturais | `ARQUITETURA_PROJETO.md` §14 | grep pelo §, só a seção |
| Git, branch, merge, deploy | `GIT_WORKFLOW.md` | seção relevante |
| Deploy em produção (checklist) | `PRE_DEPLOY_CHECKLIST.md` | arquivo completo |
| Operação em produção ou beta | `OPERACAO_PRODUCAO.md` | seção relevante |
| Falha de ambiente, encoding, template | `PRE-FLIGHT_CHECKLIST.md` | arquivo completo |
| Erro com solução validada | `ERRORS_SOLUTIONS.md` | grep por `E###` |
| Migrations (criar, aplicar, erros) | `migrations_guide.md` | seção relevante |
| Backlog de requisitos (produto) | `BACKLOG_OPERACIONAL.md` | Ver Índice ou grep pelo REQ |
| Fila de execução técnica | `FILA_IMPLEMENTACAO.md` | Ver BACKLOG para detalhes |
| Índice rápido e checklists | `GUIA_RAPIDO_OPERACIONAL.md` | arquivo completo |
| Estado atual e próxima ação | `RESUMO_EXECUCAO.md` | arquivo completo |

---

## EXECUÇÃO — PRINCÍPIOS

### Executar vs. Parar

**Execute diretamente (sem pedir confirmação):**
- Feature já especificada em documento canônico
- Ajuste de UX dentro do padrão estabelecido
- Correção de bug com solução em `ERRORS_SOLUTIONS.md`
- Atualização de documentação por delta

**Pare e pergunte quando:**
- Conflito entre requisito e arquitetura
- Decisão de produto não documentada
- Risco de quebra de contrato público
- Ambiguidade crítica de escopo

**Comportamento que causa travamento — proibido:**
- Re-ler o mesmo arquivo múltiplas vezes na mesma sessão
- Consultar `ARQUITETURA_PROJETO.md` repetidamente ou na íntegra
- Pedir confirmação para cada linha de código
- Reformular o mesmo plano múltiplas vezes sem executar
- Usar "arquivo muito grande" como motivo para não terminar

### Checklist mental antes de cada ação
```
[ ] Já li este arquivo nesta sessão?
[ ] O plano está claro?
[ ] Estou prestes a re-analisar algo que já analisei?
```

### Quando encontrar um erro
1. Parar tentativas imediatamente
2. `grep -n "E###" ERRORS_SOLUTIONS.md`
3. Se constar: aplicar solução documentada
4. Se não constar: descobrir, registrar no arquivo, só então continuar

---

## PROTOCOLO DE CONCLUSÃO — ALGORITMO ÚNICO

Uma tarefa só está concluída quando **todas** as condições abaixo são verdadeiras:

```
[ ] Busca final retorna ZERO resultados para o padrão da tarefa
[ ] TODOS os itens da checklist da sessão estão [x]
[ ] Nenhum arquivo parcialmente modificado
[ ] RESUMO_EXECUCAO.md atualizado com a sessão atual
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
| Criar branch `feature/<escopo>` | Automático |
| `git push origin feature/*` | Automático |
| Abrir PR para dev | Automático |
| `git push origin dev` | Exige autorização explícita |
| `git push origin main` | Exige autorização explícita |
| Merge de PR | Exclusivo do responsável — nunca pelo agente |

### Proibição absoluta — checkout entre branches

Nunca usar `git checkout` entre `dev` e `main` durante deploy. Causa desaparecimento de arquivos (ver `ERRORS_SOLUTIONS.md` E143).

```bash
# CORRETO — deploy via PR
gh pr create --base main --head dev --title "..." --body "..."
gh pr merge <número> --merge --delete-branch=false

# CORRETO — verificar divergência sem checkout
git log origin/main..origin/dev --oneline
git rev-list --left-right --count origin/main...origin/dev
```

### Documentação — onde registrar

| Tipo | Arquivo |
|---|---|
| Requisito de produto | `BACKLOG_OPERACIONAL.md` |
| Tarefa técnica | `FILA_IMPLEMENTACAO.md` |
| Erro com solução validada | `ERRORS_SOLUTIONS.md` |

Nunca registrar no lugar errado.

### Changelog

Toda mudança visível que impacte **mestres e/ou usuários finais** exige entrada em `database/changelogs.json` antes do deploy.

Mudanças **exclusivas de área administrativa interna** (painel/fluxos apenas de admin) **não exigem** registro em changelog.

**CUIDADO BLOQUEANTE:** Melhorias publicadas na mesma data DEVEM, OBRIGATORIAMENTE, ser unificadas em um único objeto (ex: `YYYY-MM-DD-atualizacoes-do-dia`). É proibido criar ou manter múltiplas entradas JSON dispersas sobre a mesma data de calendário. Aglomere todas as novidades em bullets sob a mesma propriedade "body".

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

- **Cloudinary:** `VITE_CLOUDINARY_CLOUD_NAME` e `VITE_CLOUDINARY_UPLOAD_PRESET` são variáveis de build-time. Nunca hardcodar. Upload de imagens exclusivamente via backend com signed preset.
- **Google OAuth:** único método de autenticação. Sem login por e-mail/senha sem autorização.
- **Discord:** vínculo opcional de perfil. Não substitui Google OAuth.
- **Elevação de role:** `player` → `gm` ao criar primeiro `gm_profile`. Lógica exclusiva do Backend.
- **`cover_deletehash`, `avatar_deletehash`, `banner_deletehash`:** nunca retornados por rotas públicas.
- **Nome do banco:** `mesas_rpg`, não `mesas`. Ver `ERRORS_SOLUTIONS.md` E059.
- **Compromissos inegociáveis:** gratuidade, sem anúncios, sem coleta desnecessária de dados.
- **UX:** toda mudança de interface valida contra as 10 Heurísticas de Nielsen antes do merge.

---

## REGRAS GERAIS DE CÓDIGO

- Mudança mínima — sem refactor massivo, sem quebrar contratos existentes
- Mudança reversível — preferir abordagens que possam ser desfeitas
- Lógica de interface, busca e filtros → Frontend (React/TypeScript)
- Lógica de autenticação e permissões → Backend (Node.js/TypeScript via JWT)
- Python → exclusivamente para scripts fora do runtime da API principal
- Upload e processamento de imagens → sempre no Backend

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
4. **Checklist** — `[ ]` / `[x]` de cada passo
5. **Arquivos que serão modificados**
6. **Critério de conclusão explícito**
7. `[ ] Atualizar RESUMO_EXECUCAO.md` — último item obrigatório
8. `[ ] Atualizar index.md` — adicionar sessão ao índice

**Ao finalizar a sessão:**
- Todos os itens da checklist [x]
- `RESUMO_EXECUCAO.md` atualizado com campo "Última Sessão"
- `index.md` atualizado com nova sessão
- Verificar se sessão referenciada no RESUMO_EXECUCAO.md existe (validação)

**Arquivamento de sessões encerradas:**
- Sessões concluídas permanecem em `/sessoes/` até confirmação explícita do usuário
- **Somente após o usuário confirmar** que a sessão está encerrada, mover o arquivo para `/sessoes/encerradas/`
- Atualizar `index.md` com o novo caminho: `encerradas/AA-MM-DD_N_<escopo>.md`
- Nunca mover sessões automaticamente sem autorização explícita do usuário

---

## INFRAESTRUTURA

- **VM Oracle:** `gh` autenticado para a conta mantenedora. Ver `GIT_WORKFLOW.md` §8.
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

Fluxo: `feature/<escopo>` → `dev` (beta) → aprovação → `main` (produção).

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

## IDIOMA

Toda comunicação em **português**. Nomes de arquivos, comandos, funções e identificadores de código permanecem no formato original.

---

## PROTOCOLO DE EXECUÇÃO DE FERRAMENTAS

Antes de executar qualquer ferramenta, o agente DEVE:

1. **Recitar as instruções críticas:**
   - CRITICAL INSTRUCTION 1: Priorizar ferramentas específicas. Nunca usar cat/ls/grep/sed em bash quando há ferramentas dedicadas.
   - CRITICAL INSTRUCTION 2: Listar todas as ferramentas relacionadas à tarefa. Só executar se outras são mais genéricas ou não aplicáveis.

2. **Listar ferramentas relacionadas:**
   - Exemplo: "Ferramentas relacionadas: grep_search (específica), view_file (específica), run_command (genérica)"

3. **Justificar escolha:**
   - Exemplo: "Usando grep_search porque é específica para busca em arquivos"

4. **Só então executar**

Este protocolo é obrigatório para TODA execução de ferramenta, sem exceção.

### Regras específicas:

- NUNCA usar `cat` para criar/editar arquivos → usar `write_to_file` ou `replace_file_content`
- NUNCA usar `grep` em bash → usar `grep_search`
- NUNCA usar `ls` → usar `list_dir`
- NUNCA usar `cat` para visualizar → usar `view_file`
- NUNCA usar `sed` para editar → usar ferramentas de edição

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
