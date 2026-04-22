# Manual de Implementação SDD no Projeto `mesas_rpg_artificio`

**Destinatário:** Codex (GPT-5.3-codex-high) operando dentro do Google Antigravity.
**Objetivo:** Implantar Spec-Driven Development (SDD) adaptado ao projeto brownfield `mesas_rpg_artificio`, usando o GitHub Spec Kit oficial (suporte nativo a Antigravity via `--ai agy`), inspirado no template `sdd-antigravity-template` da Alphinside e na estratégia de revisão do LionLab.
**Modo de operação obrigatório:** SESSÃO ATIVA → ENTREVISTAR → CONFIRMAR → INSTALAR → IMPLEMENTAR. Nunca pule perguntas. Nunca gere código antes da confirmação explícita. Antes de qualquer ação técnica, abrir/retomar sessão e manter registro contínuo de progresso.

---

## 0. Contexto do projeto (estado já conhecido)

- **Repositório:** `FarenRavirar/mesas_rpg_artificio`, branch ativa `dev`.
- **Domínio:** portal colaborativo de mesas de RPG.
- **Stack:** TypeScript (91%), pastas `backend/`, `frontend/`, `database/`, `scripts/`, `testes/`.
- **Infra:** `docker-compose.beta.yml` e `docker-compose.prod.yml`; ambientes beta e produção ativos.
- **Governança existente:** `AGENTS.md`, `ARQUITETURA_PROJETO.md`, `BACKLOG_OPERACIONAL.md`, `MAPA_DE_API.md`, `FILA_IMPLEMENTACAO.md`, `ERRORS_SOLUTIONS.md`, `OPERACAO_PRODUCAO.md`, `PRE_DEPLOY_CHECKLIST.md`, `migrations_guide.md`, `.agents/`, `.cursorrules`, `.clinerules`, `.gemini/`.
- **Classificação:** BROWNFIELD. MDs canônicos e `.agents/` NÃO podem ser sobrescritos.

---

## 1. Hierarquia de precedência (imutável)

1. `AGENTS.md` e MDs canônicos da raiz — **lei superior**.
2. `.specify/memory/constitution.md` — a criar.
3. Artefatos de feature em `specs/NNN-nome/`.
4. Decisão momentânea do agente — só em vácuo.

---

## 2. Prerrequisitos (executar ANTES da Fase A)

O agente verifica ambiente. Se algo faltar, PARA e reporta — não instala nada sem autorização.

```bash
git --version          # obrigatório
python3 --version      # >= 3.11 (exigência do Spec Kit)
uv --version           # gerenciador oficial do Spec Kit
```

Se `uv` não existir, reportar:

```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows PowerShell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Estado do repositório antes da instalação:**

```bash
cd /caminho/para/mesas_rpg_artificio
git status                    # working tree limpa
git branch --show-current     # anotar branch atual
```

Se houver arquivos não commitados, PARAR e pedir para o usuário resolver.

---

## 3. Fases sequenciais

- **Fase A** — Entrevista de Constituição (sem tocar em arquivos).
- **Fase B** — Instalação via CLI oficial do Spec Kit.
- **Fase C** — Personalização brownfield (constituição + docs SDD).
- **Fase D** — Primeira feature piloto (sessão separada).

Cada fase exige `aprovado` explícito antes de avançar.

---

## 4. Fase A — Entrevista de Constituição

Regras:
- Uma pergunta por vez, múltipla escolha (a/b/c/d) sempre que possível.
- Se a resposta já está clara nos MDs canônicos, o agente sugere a opção mais provável e pede confirmação.
- Opção (d) sempre: "Não sei — me sugere".

**15 perguntas obrigatórias:**

1. **Branch-base dos PRs:** (a) `dev`; (b) `main`; (c) outra; (d) não sei.
2. **Branch por feature:** (a) sim, criada automaticamente pelo Spec Kit com nome `NNN-nome-semantico`; (b) manter `dev`, usar só a pasta `specs/NNN-nome/`; (c) branch por release agregando features; (d) não sei.
3. **Nomenclatura de branch:** (a) `speckit/NNN-nome`; (b) `feat/NNN-nome`; (c) `NNN-nome` puro (default Spec Kit); (d) não sei.
4. **Deletar branch após merge:** (a) sim automático; (b) manter para histórico; (c) não sei.
5. **Remote:** (a) `origin` atual; (b) remote separado; (c) só local + PR manual; (d) não sei.
6. **Versionamento:** (a) Semver; (b) data-based; (c) manter política atual; (d) não sei.
7. **Testes antes do merge:** (a) TDAD estrito (teste antes do código); (b) sim, apenas unit; (c) opcional por feature; (d) não sei.
8. **Modelo de PR:** (a) PR por feature spec completa; (b) PR por task atômica; (c) livre; (d) não sei.
9. **Gate de migrations:** (a) manter `migrations_guide.md` como único caminho; (b) estender SDD com aprovação extra; (c) não sei.
10. **MDs canônicos intocáveis** (confirmar lista): AGENTS.md, ARQUITETURA_PROJETO.md, BACKLOG_OPERACIONAL.md, MAPA_DE_API.md, FILA_IMPLEMENTACAO.md, ERRORS_SOLUTIONS.md, OPERACAO_PRODUCAO.md, PRE_DEPLOY_CHECKLIST.md, migrations_guide.md. (a) confirmo; (b) remover algum — qual; (c) adicionar outro.
11. **Idioma dos artefatos SDD:** (a) pt-BR; (b) en; (c) misto.
12. **Formato dos specs:** (a) Markdown (default); (b) JSON; (c) ambos.
13. **Script Spec Kit:** (a) `sh`; (b) `ps`; (c) detectar pelo OS.
14. **Features em andamento viram SDD retroativamente:** (a) sim — listar quais; (b) não, só novas.
15. **Política sobre `.cursorrules`, `.clinerules`, `.gemini/`:** (a) manter intactos; (b) sincronizar com `constitution.md`; (c) não sei.

Ao final: **resumo + "Confirma? Posso instalar o Spec Kit?"**. Só com `aprovado` avança para Fase B.

---

## 5. Fase B — Instalação via CLI oficial

O Spec Kit oficial tem suporte nativo a Antigravity. O agente NÃO cria workflows manualmente — usa o CLI que gera a estrutura correta com `--ai-skills` (exigido pelo Antigravity).

### 5.1 Instalar o CLI `specify`

```bash
# 1. Buscar a release estável mais recente em
#    https://github.com/github/spec-kit/releases
#    e confirmar a tag com o usuário antes de prosseguir.

# 2. Instalar (substituir vX.Y.Z pela tag confirmada):
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z

# 3. Verificar:
specify --version
specify check
```

**Regra crítica:** NÃO instalar `specify-cli` do PyPI — não é oficial. Sempre do repositório GitHub `github/spec-kit`.

### 5.2 Inicializar no projeto existente (brownfield)

```bash
# Dentro da raiz do projeto, com working tree limpa
specify init . \
  --ai agy \
  --ai-skills \
  --script sh \
  --force
```

Flags:
- `.` — inicializa no diretório atual (brownfield).
- `--ai agy` — agente Antigravity.
- `--ai-skills` — instala como skills em `.agents/skills/` (**exigido pelo Antigravity**).
- `--script sh` — bash (ou `ps` no Windows, conforme pergunta 13).
- `--force` — permite merge em diretório já populado.

### 5.3 Estrutura criada pelo CLI

```
.specify/
├── memory/
│   └── constitution.md              # placeholder oficial — será sobrescrito na Fase C
├── scripts/
│   └── bash/
│       ├── common.sh
│       ├── create-new-feature.sh    # cria a branch automaticamente via /speckit.specify
│       ├── setup-plan.sh
│       └── ...
└── templates/
    ├── spec-template.md
    ├── plan-template.md
    ├── tasks-template.md
    └── checklist-template.md

.agents/skills/                      # onde o Antigravity carrega as skills SDD
├── speckit-constitution/
├── speckit-specify/
├── speckit-clarify/
├── speckit-plan/
├── speckit-tasks/
├── speckit-analyze/
├── speckit-checklist/
└── speckit-implement/
```

**Atenção brownfield:** a pasta `.agents/` já existe no projeto. O `--force` faz merge. O agente DEVE diffar antes de commitar para garantir que nada pré-existente em `.agents/` foi sobrescrito. Se houver conflito, PARAR e reportar.

### 5.4 Verificação e commit

```bash
ls -la .specify/
ls -la .agents/skills/ | grep speckit
specify check
git status
git diff --stat
```

Apresentar diff. Commit sugerido:

```bash
git add .specify/ .agents/skills/speckit-*
git commit -m "chore(sdd): instala spec-kit oficial com suporte Antigravity (agy)"
```

Aguardar `aprovado` antes do commit.

---

## 6. Fase C — Personalização brownfield

O `specify init` gera artefatos genéricos. Agora personalizar para o contexto do projeto.

### 6.1 Sobrescrever `.specify/memory/constitution.md`

Substituir o placeholder oficial pelo conteúdo abaixo, com valores preenchidos via Fase A:

```markdown
# Constituição do Projeto Mesas RPG Artifício

> Subordinada a AGENTS.md e demais MDs canônicos na raiz.
> Conflito → MDs canônicos da raiz vencem.

## 1. Identidade
- Projeto: Mesas RPG Artifício
- Tipo: Brownfield, TypeScript, monorepo (backend/frontend/database).
- Ambientes: beta (mesasbeta.artificiorpg.com), produção (mesas.artificiorpg.com).

## 2. Princípios inegociáveis
- Gratuito para a comunidade, sem anúncios, coleta mínima de dados.
- Nenhuma decisão de produto é tomada pelo agente — sempre perguntar.
- TypeScript estrito. Proibido `any` implícito.
- Toda mudança de schema passa por migrations_guide.md.
- Nenhum código em produção sem PRE_DEPLOY_CHECKLIST.md verde.

## 3. Branch policy (via Fase A)
- Branch-base dos PRs: [resposta 1]
- Branch por feature: [resposta 2]
- Nomenclatura: [resposta 3]
- Deletar após merge: [resposta 4]
- Remote: [resposta 5]

## 4. Stack travada
- Runtime: Node.js [versão exata]
- Gerenciador: [npm/pnpm/yarn + versão]
- Frontend: [framework + versão]
- Backend: [framework + versão]
- Banco: PostgreSQL [versão]

## 5. Convenções
- Idioma SDD: [resposta 11]
- PR policy: [resposta 8]
- Testes: [resposta 7]

## 6. Guardrails técnicos (auto-aplicados, não perguntar)
- APIs HTTP: status codes 400, 401, 403, 404, 409, 422, 429, 500 sempre.
- Validação de input obrigatória em endpoint externo.
- Timeout explícito em chamada externa.
- Logs estruturados, sem PII, com traceId.
- Segredos via env vars, nunca em código.

## 7. Camadas imutáveis (não reescrever)
[lista confirmada na pergunta 10]

## 8. Protocolo de divergência
- Ambiguidade → parar e perguntar.
- Conflito entre spec e MD canônico → MD canônico vence. Reportar.
- Necessidade fora de escopo → propor ADR em specs/NNN/adr-*.md, aguardar aprovação.
```

### 6.2 Criar `docs/sdd/README.md`

```markdown
# SDD neste projeto

Usa Spec Kit oficial (github/spec-kit) adaptado. Convive com MDs canônicos da raiz — não os substitui.

## Quando usar
- Features médias/grandes que tocam backend + frontend.
- Mudanças de schema.
- Novos endpoints públicos.

## Quando NÃO usar
- Fix de typo, CSS, bump de dependência trivial — fluxo nativo do Antigravity.

## Comandos (Antigravity chat)
- /speckit.constitution — cria/atualiza constituição (1x por projeto).
- /speckit.specify — inicia feature nova; CRIA BRANCH automaticamente.
- /speckit.clarify — resolve ambiguidades (antes de /plan).
- /speckit.plan — gera plano técnico.
- /speckit.tasks — decompõe em tasks atômicas.
- /speckit.analyze — consistency check (GATE antes de implement).
- /speckit.checklist — checklists de qualidade (opcional).
- /speckit.implement — executa tasks.

## Fonte de verdade
Conflito → AGENTS.md e MDs canônicos vencem sempre.
Detalhes em docs/sdd/MAPEAMENTO_SDD.md.

## Gestão de branches
Ver docs/sdd/BRANCH_POLICY.md.
```

### 6.3 Criar `docs/sdd/MAPEAMENTO_SDD.md`

```markdown
# Mapeamento SDD × MDs canônicos

| Artefato SDD | Fonte de verdade canônica |
|--------------|--------------------------|
| constitution.md — stack | AGENTS.md + ARQUITETURA_PROJETO.md |
| constitution.md — operação | OPERACAO_PRODUCAO.md |
| spec.md — contexto | BACKLOG_OPERACIONAL.md + FILA_IMPLEMENTACAO.md |
| plan.md — API | MAPA_DE_API.md |
| plan.md — migration | migrations_guide.md |
| tasks.md — pré-deploy | PRE_DEPLOY_CHECKLIST.md |
| erros durante implement | ERRORS_SOLUTIONS.md |

## Regra de sincronização
- Spec introduz novo endpoint → última task (Polish) ATUALIZA MAPA_DE_API.md.
- Nova migration → atualizar migrations_guide.md.
- Qualquer outra escrita em MD canônico exige autorização explícita.
```

### 6.4 Criar `docs/sdd/BRANCH_POLICY.md` (gestão de branches)

```markdown
# Gestão de branches no fluxo SDD

## Branch-base
PRs de feature SDD abrem contra: [branch-base definida na Fase A]

## Criação automática de branch
/speckit.specify invoca `.specify/scripts/bash/create-new-feature.sh`, que:
1. Escaneia specs/ para determinar o próximo NNN (001, 002, ...).
2. Gera slug semântico a partir da descrição.
3. Cria a branch no padrão [definido na Fase A], ex: `NNN-nome-semantico`.
4. Cria pasta `specs/NNN-nome/` com spec.md a partir do template.
5. Faz checkout automaticamente.

## Checkpoints durante /speckit.implement
Ao final de cada fase (Setup, Tests, Core, Integration, Polish):

```
git add <arquivos-da-fase>
git commit -m "feat(NNN-nome): <fase> — <resumo>"
```

## Abertura de PR
Após /speckit.implement completar e testes passarem:

```
git push -u origin NNN-nome-semantico
gh pr create \
  --base [branch-base] \
  --head NNN-nome-semantico \
  --title "feat(NNN): <nome feature>" \
  --body-file specs/NNN-nome/pr-description.md
```

O agente gera `pr-description.md` automaticamente com:
- Link para spec.md, plan.md, tasks.md.
- Checklist do PRE_DEPLOY_CHECKLIST.md.
- Resumo de arquivos tocados.

## Pós-merge
- Se resposta 4 = sim → deletar branch remota e local.
- Se resposta 4 = não → manter; apenas voltar para branch-base.

## Emergência / rollback
- Falha antes de merge: `git reset --hard <último-commit-bom>` e reportar.
- Falha após merge: revert via PR separado; nunca force-push.

## Proibições absolutas
- Nunca force-push em branch-base.
- Nunca commit direto na branch-base (tudo via PR).
- Nunca commitar em branch de outra feature ativa.
- Nunca renomear branch após push sem aprovação.
```

---

## 7. Fase D — Primeira feature piloto (sessão separada)

Em sessão nova, após Fase C aprovada e commitada:

1. Escolher feature pequena do `BACKLOG_OPERACIONAL.md` ou `FILA_IMPLEMENTACAO.md`.
2. Rodar o ciclo completo:

```
/speckit.constitution      # apenas se ainda não rodou
/speckit.specify <descrição>
                           # CRIA BRANCH NNN-nome-semantico + spec.md
                           # faz entrevista de gaps antes de gerar
/speckit.clarify           # 5-10 ambiguidades resolvidas
/speckit.plan              # gera plan.md técnico
/speckit.tasks             # decompõe em tasks atômicas
/speckit.analyze           # GATE: consistency check
/speckit.implement         # executa com checkpoints por fase
```

Cada comando tem gate humano. Nenhum avanço automático.

Após `/speckit.implement` completar: `git push` + abertura de PR via `gh pr create` conforme BRANCH_POLICY.md.

---

## 8. Gestão de branches — resumo operacional

### O Spec Kit faz automaticamente
O script `.specify/scripts/bash/create-new-feature.sh`, invocado por `/speckit.specify`:
- numeração de feature;
- criação da branch com nome semântico;
- criação da pasta `specs/NNN-nome/`;
- checkout.

O agente NÃO executa `git checkout -b` manualmente. Invoca `/speckit.specify` e o script oficial cuida.

### O agente FAZ manualmente
1. Verificar working tree limpa antes de `/speckit.specify`.
2. Confirmar descrição da feature com o usuário.
3. Durante `/speckit.implement`: commit por fase.
4. Ao final: push + PR.
5. Pós-merge: cleanup conforme policy.

### O agente NUNCA faz sem autorização
- `git push --force`.
- `git rebase` em branch compartilhada.
- `git checkout` em branch-base com alterações pendentes.
- Deletar branch sem merge confirmado.
- Commit direto em `dev`, `main`, ou qualquer branch-base.

---

## 9. Prompt de ativação (copiar no Antigravity)

```
Leia spec_claude.md na raiz e execute ESTRITAMENTE:

0. PROTOCOLO DE SESSÃO (obrigatório antes de qualquer ação técnica):
   - Ler `RESUMO_EXECUCAO.md` e `AGENTS.md`.
   - Verificar se existe sessão ativa incompleta em `/sessoes/`.
   - Se existir, continuar nela; se não existir, criar nova sessão no formato `AA-MM-DD_N_<escopo>.md`.
   - Registrar imediatamente: o que vai fazer, o que precisa ser feito, o que foi feito.
   - Atualizar a sessão antes de qualquer alteração técnica e após cada etapa executada.

1. Modo ENTREVISTADOR. Antes da Fase A estar completa e com meu "aprovado", é proibido criar/alterar arquivos e executar comandos de modificação.
   Exceção: são permitidos apenas comandos de diagnóstico/read-only, sem efeito colateral (ex.: git --version, python3 --version, uv --version, git status).

2. LEITURA PREPARATÓRIA — leia em ordem e resuma em até 10 linhas:
   AGENTS.md, ARQUITETURA_PROJETO.md, OPERACAO_PRODUCAO.md, migrations_guide.md, BACKLOG_OPERACIONAL.md, MAPA_DE_API.md.
   Pare e aguarde "continue".

3. PRERREQUISITOS (Seção 2): git --version, python3 --version, uv --version. Se uv faltar, reportar e pedir autorização. Verificar git status limpo. Se sujo, parar.

4. FASE A — Entrevista (Seção 4): 15 perguntas UMA POR VEZ, múltipla escolha. Se resposta está clara nos MDs lidos, sugerir a opção e pedir confirmação. Ao final, resumo + "aprovado".

5. FASE B — Instalação CLI (Seção 5):
   - buscar última tag estável em https://github.com/github/spec-kit/releases e confirmar comigo;
   - uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z;
   - specify init . --ai agy --ai-skills --script <sh|ps> --force;
   - listar o que foi criado;
   - git diff --stat e aguardar "aprovado" antes de commitar.

6. FASE C — Personalização (Seção 6):
   - sobrescrever .specify/memory/constitution.md com respostas da Fase A;
   - criar docs/sdd/README.md, docs/sdd/MAPEAMENTO_SDD.md, docs/sdd/BRANCH_POLICY.md;
   - diff + "aprovado" antes de commitar.

7. NÃO avance para Fase D nesta sessão.

8. ZONAS PROIBIDAS: nenhum arquivo em backend/, frontend/, database/, scripts/, testes/. Nenhum MD canônico da raiz.

9. Conflito entre manual e estado real → PARAR e reportar. Não decidir sozinho.

Confirme que entendeu antes de começar a leitura.
```

---

## 10. Critérios de done

- [ ] `specify --version` funciona.
- [ ] `.specify/` existe com `memory/`, `scripts/`, `templates/`.
- [ ] `.agents/skills/speckit-*` existem (8 skills).
- [ ] `.specify/memory/constitution.md` personalizada com Fase A.
- [ ] `docs/sdd/README.md`, `MAPEAMENTO_SDD.md`, `BRANCH_POLICY.md` existem.
- [ ] Nenhum MD canônico da raiz modificado.
- [ ] Nenhum código em `backend/`, `frontend/`, `database/`, `testes/` modificado.
- [ ] `.agents/` pré-existente não sobrescrito em áreas não-speckit.
- [ ] Dois commits: (1) `chore(sdd): instala spec-kit oficial com suporte Antigravity (agy)`, (2) `chore(sdd): personaliza constituição e docs SDD para brownfield`.

---

## 11. Anti-padrões (agente NÃO pode)

- Instalar `specify-cli` do PyPI (não oficial).
- Rodar `specify init` sem `--ai agy --ai-skills`.
- Rodar `specify init` com working tree suja.
- Criar workflows/skills SDD manualmente em vez de usar o CLI.
- Sobrescrever arquivos pré-existentes em `.agents/` sem diff revisado.
- Criar branch manualmente via `git checkout -b` em vez de `/speckit.specify`.
- Pular `/speckit.clarify` alegando spec claro.
- Rodar `/speckit.implement` sem `/speckit.analyze` verde.
- Modificar MD canônico sem task de Fase 5 (Polish) declarada.
- `git push --force` em qualquer circunstância.
- Assumir resposta de pergunta de negócio.
- Avançar de fase sem `aprovado` explícito.
