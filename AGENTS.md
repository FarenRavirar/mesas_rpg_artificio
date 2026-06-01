# AGENTS.md - Governanca de Agentes de IA

**Projeto:** Mesas RPG Artificio
**Fonte canonica de governanca operacional.** Em conflito com documentos operacionais, este arquivo prevalece. Em conflito sobre arquitetura ou contratos tecnicos, prevalece `.specify/arquiteture.md`.

Toda comunicacao com o mantenedor deve ser em portugues. Nomes de arquivos, comandos, funcoes e identificadores permanecem no formato original.

---

## Leitura Minima de Retomada

No inicio de sessao, leia nesta ordem:

1. `.specify/memory/project-state.md`
2. `AGENTS.md`
3. `docs/agents/context-capsule.md`

Depois verifique `sessoes/` para localizar sessao ativa incompleta. Se houver sessao ativa incompleta, continue nela, salvo pedido explicito do mantenedor para abrir sessao dedicada. Antes de qualquer alteracao, registre na sessao: o que vai fazer, o que precisa ser feito e o que ja foi feito.

Detalhes operacionais ficam em:

- `docs/agents/operating-model.md`
- `docs/agents/skill-decision-matrix.md`
- `docs/agents/skill-stack.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

---

## Modos de Trabalho

Escolha o menor processo que controle o risco.

| Modo | Quando usar | Artefatos minimos |
|---|---|---|
| Sem SDD | pergunta, delta documental, correcao pontual, ajuste pequeno sem risco critico | sessao + evidencia |
| SDD Lite | bug moderado, feature pequena, ajuste localizado com impacto de produto | mini-spec/decisao registrada + checklist + evidencia |
| SDD Completo | migration, banco, auth, permissoes, dados pessoais, upload/Cloudinary, contrato publico/API, deploy, CI/CD, infraestrutura, feature grande ou refatoracao ampla | `spec.md` + `plan.md` + `tasks.md` + validacao + sessao |

Comandos `/speckit.*` sao procedimentos documentais do agente. Nao sao comandos de terminal, nao sao skills locais ativas e nao devem ser executados como CLI.

Para SDD Completo, seguir o fluxo `spec -> plan -> tasks -> implement` e atualizar a sessao continuamente. Quando houver PR, criar `pr-description.md` como sumario executivo, evidencias de teste e checklist pos-merge. Para tarefas simples, nao criar cerimonia desnecessaria.

Preflight seletivo de SDD Completo:

- Consultar `.specify/memory/constitution.md`.
- Consultar `docs/sdd/SESSION_FAILURES_REGISTRY.md`.
- Consultar `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`.
- Antes de analise/auditoria, consultar `docs/sdd/analyze-governance-gate.md`.

Esse preflight nao se aplica a Sem SDD nem a tarefas simples de baixo risco.

---

## Stack de Skills

Fonte ativa de skills pessoais: `C:\Users\paulo\.codex\skills`.

Stack autorizado:

- `mattpocock/skills`: fluxo diario para alinhamento, diagnostico, TDD, arquitetura, handoff, PRD/issues.
- `JuliusBrussee/caveman`: compressao de saida e economia de contexto quando solicitada ou util em sessoes longas.
- Skills `.system` do Codex: recursos internos do runtime.
- `obra/superpowers`: referencia metodologica seletiva, nao pacote ativo.

Skills antigas `.agent/skills`, `.agents/skills` e `.gemini/skills` estao desativadas. Nao recriar nem depender delas sem decisao explicita do mantenedor.

Workflows/regras antigas em `.agent/workflows`, `.agents/rules`, `.agents/workflows`, `.gemini/default-rules.md` e `.gemini/workflows` foram aposentados ou removidos. Nao usar esses caminhos como fonte ativa.

---

## Regras Petreas

### Aprovacao Obrigatoria

Nunca executar sem aprovacao explicita do mantenedor:

- `docker restart`, `docker stop`, `docker start`
- `scp`, `rsync`, `docker cp`
- `npm run build` no servidor
- `git commit`
- `git push origin dev` ou `git push origin main`
- `git push origin --delete`
- `psql` com `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`
- restart de containers ou servicos
- copiar ou sobrescrever arquivos em producao
- modificar arquivos fora do escopo solicitado

Comandos read-only permitidos sem aprovacao: `docker ps`, `docker logs`, `docker stats`, `docker inspect`, `ls`, `cat`, `grep`, `find`, `head`, `tail`, `curl -s` GET e `psql` com `SELECT`.

Formato obrigatorio para pedir aprovacao:

```text
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

### Git, Branch e Deploy

- Criar branch `feat/NNN-nome`: automatico.
- `git push origin feat/*`: automatico.
- Abrir PR para `dev`: automatico.
- `git push origin dev`: exige aprovacao explicita.
- `git push origin main`: exige aprovacao explicita.
- Merge de PR: exclusivo do responsavel por padrao; agente so executa com autorizacao explicita.
- Nunca usar `git checkout` entre `dev` e `main` durante deploy. Use PR e comparacoes sem checkout.

Fluxo de ambientes: `feat/*` -> `dev`/Beta -> `main`/Producao.

| Ambiente | URL | Branch | Pasta |
|---|---|---|---|
| Beta | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` |
| Producao | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` |

### Migrations, Banco e Infra

- Nunca aplicar migration com `TRUNCATE`, `DROP`, `DELETE` ou `ALTER` em producao sem dump previo e `PRE_DEPLOY_CHECKLIST.md`.
- Nunca executar `ALTER TABLE` avulso em producao; usar rollback documentado.
- Nunca reaplicar migrations antigas com mais de uma semana.
- Banco canonico: `mesas_rpg`, nao `mesas`.
- Nunca criar tunnel/container `cloudflared` paralelo.
- Nunca registrar, expor ou versionar token, PAT, segredo ou credencial.

---

## Regras de Produto e Segurança

- Compromissos inegociaveis: gratuidade, sem anúncios e sem coleta desnecessaria de dados.
- Google OAuth e o unico login autorizado. Login por e-mail/senha exige autorizacao explicita.
- Discord e vinculo opcional de perfil; nao substitui Google OAuth.
- Elevacao `player -> gm` ao criar primeiro `gm_profile` e exclusiva do Backend.
- Upload e processamento de imagens ocorrem sempre no Backend.
- Cloudinary: `VITE_CLOUDINARY_CLOUD_NAME` e `VITE_CLOUDINARY_UPLOAD_PRESET` sao variaveis de build-time. Nunca hardcodar. Upload exclusivamente via backend com signed preset.
- `cover_deletehash`, `avatar_deletehash` e `banner_deletehash` nunca retornam por rotas publicas.
- Mudancas de interface devem respeitar as 10 Heuristicas de Nielsen antes do merge.
- Teste funcional/manual de UI ou fluxo real so conta apos deploy em Beta e teste do mantenedor em janela anonima. Nao sugerir limpeza de cache.
- Mudanca visivel para mestres ou usuarios finais exige entrada em `database/changelogs.json` antes do deploy. Melhorias da mesma data devem ser unificadas em uma unica entrada, com linguagem leiga.

---

## Regras Gerais de Codigo

- Mudanca minima, reversivel e dentro do escopo.
- Sem refactor massivo sem autorizacao.
- Lógica de interface, busca e filtros: Frontend React/TypeScript.
- Lógica de autenticacao e permissoes: Backend Node.js/TypeScript via JWT.
- Python: apenas scripts fora do runtime principal da API.
- **Normalização obrigatória:** todo dado vindo de API, banco, JSON/JSONB, query string, `localStorage` ou integracao externa deve ser tratado como `unknown` ate passar por normalizador tipado antes de entrar em estado React, props ou renderizacao.
- Proibido usar `.map`, `.filter`, `.reduce`, `.forEach`, spread de array, `.length` sem semantica validada, ou acessar campos aninhados assumindo payload externo sem `Array.isArray`, schema/normalizador ou fallback explicito.
- Campos legados que podem vir como JSON string ou objeto devem aceitar formatos conhecidos e retornar fallback seguro (`[]`, `{}` ou `null`) quando invalidos.
- Edicoes manuais em arquivos devem usar `apply_patch`.

---

## Gestao de Contexto

- Nunca abra arquivo grande sem busca previa.
- `.specify/arquiteture.md` deve ser consultado por secao relevante, nunca inteiro por padrao.
- `docs/legacy/FILA_IMPLEMENTACAO.md` e `docs/legacy/BACKLOG_OPERACIONAL.md` sao historicos.
- Novos requisitos de produto devem ir para artefato SDD quando o modo de risco exigir.
- `docs/agents/context-capsule.md` deve sobreviver a compactacoes e conter apenas o contexto necessario de retomada.

---

## Erros Conhecidos

Ao encontrar erro ou regressao:

1. Parar tentativas repetidas.
2. Consultar `.specify/memory/errors.md` pelo codigo `E###` ou pelo sintoma.
3. Se existir solucao documentada, aplicar e registrar evidencia.
4. Se nao existir, diagnosticar, registrar aprendizado validado e usar `/speckit.fixit.run` como procedimento documental quando o risco justificar.

---

## Protocolo de Sessao

Arquivos de sessao ficam em `sessoes/` com formato `AA-MM-DD_N_<escopo>.md`. Consulte `sessoes/index.md` para numeracao.

Conteudo minimo:

1. Cabecalho com data e objetivo.
2. Vinculos.
3. Plano de execucao.
4. Checklist de fechamento.
5. Arquivos que serao modificados.
6. Criterio de conclusao explicito.
7. Item para atualizar `.specify/memory/project-state.md`.
8. Item para atualizar `.specify/memory/session-log.md` via `/speckit.retro.run` quando houver fechamento real.
9. Item para mover a sessao para `encerradas/` somente quando autorizado.
10. Item para atualizar `sessoes/index.md`.

Atualize a sessao antes de alteracoes tecnicas e apos cada etapa relevante.

---

## Conclusao de Tarefas

Uma tarefa so esta concluida quando:

- A busca final relevante retorna o resultado esperado.
- A checklist da sessao esta concluida.
- Nao ha arquivo parcialmente modificado.
- `.specify/memory/project-state.md` foi atualizado quando o estado operacional mudou.
- `/speckit.retro.run` ou equivalente documental foi executado quando a sessao foi fechada.
- Validacao tecnica/manual adequada foi registrada.

Evite declarar conclusao com termos como "parcial", "restante", "maioria", "principais", "alguns" ou percentuais incompletos.

---

## Documentacao Canonica

| Tipo | Fonte |
|---|---|
| Governanca operacional | `AGENTS.md` |
| Contexto minimo de retomada | `docs/agents/context-capsule.md` |
| Modelo diario de operacao | `docs/agents/operating-model.md` |
| Matriz de skills | `docs/agents/skill-decision-matrix.md` |
| Stack de skills | `docs/agents/skill-stack.md` |
| Arquitetura/contratos tecnicos | `.specify/arquiteture.md` |
| Estado atual | `.specify/memory/project-state.md` |
| Erros conhecidos | `.specify/memory/errors.md` |
| Deploy producao | `PRE_DEPLOY_CHECKLIST.md` |
| Branch/deploy SDD | `docs/sdd/BRANCH_POLICY.md` |

<!-- SPECKIT START -->
SDD completo e seletivo. Use `docs/agents/operating-model.md` para escolher Sem SDD, SDD Lite ou SDD Completo.
<!-- SPECKIT END -->
