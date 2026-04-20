# 26-04-20_8_spec-retomada-fluxo.md

## Cabeçalho
- **Data:** 20/04/2026
- **Objetivo:** Retomar o fluxo do `spec_claude.md` em sessão dedicada, sem misturar com outras frentes.

## Vínculos
- **Sessão Anterior:** `26-04-20_7_sdd-sessao-continuacao.md`
- **Próxima Sessão:** `26-04-20_9_*` (somente após fechamento desta)
- **Documento-base:** `spec_claude.md`

## O que vai fazer
- Retomar o fluxo SDD no ponto interrompido.
- Executar PRERREQUISITOS read-only da Seção 2.
- Iniciar FASE A (15 perguntas, uma por vez).

## O que precisa ser feito
1. Validar pré-requisitos locais conforme Seção 2 (`git`, `python/py`, `uv`, `git status`).
2. Confirmar condições de continuidade do fluxo SDD.
3. Iniciar entrevista da FASE A.

## O que foi feito
- [x] Sessão dedicada ao fluxo do spec criada por solicitação explícita do usuário.
- [x] `RESUMO_EXECUCAO.md` lido integralmente no início da sessão.
- [x] `AGENTS.md` lido integralmente no início da sessão.
- [x] Retomada da sessão `26-04-20_8_spec-retomada-fluxo.md` iniciada por solicitação do usuário (20/04/2026 17:04 BRT).
- [x] Status sujo solucionado com sucesso: commit formatado providenciado pelo usuário via shell.
- [x] Iniciada a Fase A formal do fluxo de configuração do novo padrão.
- [x] Pergunta 1/15 respondida (Branch-base: dev).
- [x] Pergunta 2/15 respondida (Branch feature: sim, com nome NNN-nome-semantico).
- [x] Pergunta 3/15 respondida (Nomenclatura: feat/NNN-nome).
- [x] Pergunta 4/15 respondida (Deletar branch após merge: sim automático).
- [x] Pergunta 5/15 respondida (Remote: origin atual).
- [x] Pergunta 6/15 respondida (Versionamento: Semver).
- [x] Pergunta 7/15 respondida (Testes: estritos localmente/unidade quando independentes, ou integrados em dev quando exigirem banco de dados/VM/acessos externos).
- [x] Pergunta 8/15 respondida (PR Modelo: por feature spec completa).
- [x] Pergunta 9/15 respondida (Gate Migrations: Decisão postergada. Será tratado sob os arquivos "001-gate-migrations-refactor" em pastas: tasks, spec e plan posteriormente).
- [x] Pergunta 10/15 respondida (MDs Intocáveis: Flexibilizados. Todos podem mudar se justificado e benéfico para a implementação do projeto com o spec).
- [x] Pergunta 11/15 respondida (Idioma: pt-BR).
- [x] Pergunta 12/15 respondida (Formato spec: Markdown).
- [x] Pergunta 13/15 respondida (Script Spec Kit: ps / PowerShell).
- [x] Pergunta 14/15 respondida (Features retroativas: não, apenas SDD para features novas).
- [x] Pergunta 15/15 respondida via sugestão (Manter regras dos agentes intactas: sim).
- [/] Aguardando aprovação do Resumo da Fase A para instalar o Spec Kit (Fase B).

## Plano de execução
1. Confirmar ponto de retomada no `spec_claude.md`.
2. Executar PRERREQUISITOS read-only.
3. Iniciar FASE A pergunta 1/15.
4. (Novo) Exibir Resumo da Constituição e aguardar "aprovado".

## Checklist
- [x] Criar arquivo de sessão dedicado ao spec.
- [x] Confirmar retomada do fluxo no `spec_claude.md`.
- [x] Executar PRERREQUISITOS read-only da Seção 2.
- [x] Iniciar FASE A (pergunta 1/15) e completar até 15/15.
- [x] Aguardar "aprovado" do Resumo.
- [x] INICIANDO FASE B: Buscar tag de release do CLI Oficial do Spec-Kit.
  - Tag oficial recuperada: `v0.7.3` (17/04/2026).
- [x] FASE B: Aguardando confirmação do usuário da tag estabelecida (`v0.7.3`) para autorizar a instalação do CLI.
- [x] Rodou comando de instalação global `uv tool install` com Encoding formatado em UTF-8.
- [x] Rodou `specify init` com agent `agy` configurando infra powershell (`ps`).
- [x] Analise do diff: Pastas `.specify/` e `.agents/skills/` geradas. E também `.agent/`.
- [x] Aguardando aprovação ("aprovado") para invocar o commit da Fase B.
- [x] Commit da ferramenta SDD de infra finalizado: `chore(sdd): instala spec-kit ...`
- [x] INICIANDO FASE C: Gerando `constitution.md` personalizado e arquivos de governança.
- [x] Sobrescrito o `constitution.md` oficial com as regras brownfield customizadas na Entrevista FASE A.
- [x] Criado o `docs/sdd/README.md` (regras e chamadas CLI SDD).
- [x] Criado o `docs/sdd/MAPEAMENTO_SDD.md` (ponte com documentos canônicas).
- [x] Criado o `docs/sdd/BRANCH_POLICY.md` (regras de workflow em PRs).
- [/] Aguardando "aprovado" para finalizar Fase C com o commit sugerido.

## Status Final da Sessão
Todos os artefatos base da metodologia SDD foram registrados neste repositório Brownfield conforme os limites da governança AGENTS.md.

## Arquivos que serão modificados
- `sessoes/26-04-20_8_spec-retomada-fluxo.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
- `spec_claude.md` (se necessário durante a execução da sessão)

## Critério de conclusão explícito
A sessão só será concluída quando:
- PRERREQUISITOS read-only estiverem registrados;
- FASE A tiver sido iniciada corretamente;
- checklist estiver 100% `[x]`;
- `RESUMO_EXECUCAO.md` e `sessoes/index.md` estiverem atualizados.
