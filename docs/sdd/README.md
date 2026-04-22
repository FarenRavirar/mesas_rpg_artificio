# SDD neste projeto

Usa Spec Kit oficial (github/spec-kit) adaptado. Convive com MDs canônicos da raiz — não os substitui.

## Quando usar
- Features médias/grandes que tocam backend + frontend.
- Mudanças de schema.
- Novos endpoints públicos.

## Quando NÃO usar
- Fix de typo, CSS, bump de dependência trivial — fluxo nativo do Antigravity.

## Como usar os Comandos SDD (Fluxo Recomendado)

Pense no SDD como um "assistente de projeto rigoroso". Em vez de pedir para o bot "fazer o código" e correr o risco dele apagar partes erradas, você dita os comandos em sequência. A cada passo, ele gera um documento para você aprovar antes de mexer no projeto real. 

### A Sequência Ideal (A Fase D)
Sempre que for iniciar uma nova feature siga cronologicamente este roteiro pedindo para a IA rodar o comando:

1. **/speckit.specify** (O Início de Tudo) 
   - *O que faz:* Abre instantaneamente uma nova branch segura no repositório isolando o desenvolvimento. Em seguida, escreve um rascunho oficial (a Spec) de como será sua feature baseada na sua ideia.
   - *Quando usar:* No exato momento em que quiser inventar, expandir ou construir uma tela/endpoint complexo pela primeira vez.

> *(Opcional)* **/speckit.clarify** (O Tira-Dúvidas)
> - *O que faz:* Se o requisito (Spec) da feature estiver vago, a inteligência faz 5 perguntas estratégicas para definir detalhes cruciais que faltaram (ex: "Qual a cor do botão?", "Quem tem permissão de ver a aba X?").

2. **/speckit.plan** (O Arquiteto)
   - *O que faz:* O agente para de escrever rascunho de ideia e escreve EXATAMENTE quais arquivos, pastas, linhas e migrations precisará modificar/criar.
   - *Quando usar:* Imediatamente após o `specify` ou `clarify` estarem com a Spec madura. É o seu projeto estrutural antes de gastar cimento.

> *(Opcional)* **/speckit.checklist** (Validação contra Bugs Futuros)
> - *O que faz:* Gera uma lista de verificações pro-ativas baseada no plano montado acima (ex: "Verificar tela em modo Mobile", "Verificar se o JWT tá ok").

3. **/speckit.tasks** (A Fila de Tarefas Atômicas)
   - *O que faz:* Pega o Plano do Arquiteto (`plan`) e vira Trello. Quebra o trabalho em tasks milimétricas (Setup, Testes, Core, Integração, Polish) para o agente não se perder na memória.
   - *Quando usar:* Quando o `plan` estiver 100% aprovado pela sua visão técnica.

> *(Opcional)* **/speckit.analyze** (O Auditor Interno)
> - *O que faz:* Cruza a Spec, o Plan e as Tasks pra checar se ele "esqueceu" alguma instrução ou se inventou arquivo que não deveria ao criar a lista. 

4. **/speckit.implement** (O Operário)
   - *O que faz:* Finalmente coloca a mão no código. Ele varre as tarefas atômicas uma a uma (escrevendo, compilando e testando).
   - *Quando usar:* Somente na última fase! Quando a branch, a spec, o plano e as tasks estiverem 100% aprovadas. Ao final ele mandará PR pro \`dev\`.

---

### Comando Isolado Especial
- **/speckit.constitution**
   - *O que faz:* Regera e molda a Constituição Base (as regras que toda as Specs vão seguir no futuro).
   - *Quando usar:* Raramente. Só quando o norte principal do projeto mudar (como migrar de PostgreSQL pra MongoDB, ou Node.js para Go).

- **/speckit.fixit.run <descrição do bug>**
   - *O que faz:* Corrige bugs com consciência da spec. Mapeia o bug para user story/requirement, localiza arquivos afetados, propõe plano de correção e aplica mudança mínima após aprovação.
   - *Quando usar:* Após `/speckit.implement`, quando testes manuais revelarem bugs. Comando reativo, não faz parte do fluxo principal.
   - *Exemplo:* `/speckit.fixit.run o formulário aceita email vazio`

### Comandos Brownfield (Adoção Incremental de SDD)

Estes comandos ajudam a integrar o projeto existente ao workflow SDD:

- **/speckit.brownfield.scan**
   - *O que faz:* Analisa o projeto existente para descobrir tech stack, arquitetura, convenções de código e estrutura de módulos. Gera um perfil completo do projeto.
   - *Quando usar:* Primeira vez configurando SDD em projeto existente, ou quando precisar atualizar o perfil após mudanças significativas na arquitetura.
   - *Saída:* `.specify/brownfield-project-profile.md`

- **/speckit.brownfield.bootstrap**
   - *O que faz:* Gera configuração customizada do Spec Kit baseada no perfil do projeto. Atualiza templates (spec, plan, tasks) para refletir a estrutura real do projeto (paths, comandos, frameworks).
   - *Quando usar:* Após o scan, para customizar templates genéricos com a arquitetura real do projeto.
   - *Saída:* Templates atualizados em `.specify/templates/`, relatório em `.specify/brownfield-bootstrap-report.md`

- **/speckit.brownfield.validate**
   - *O que faz:* Verifica se a configuração gerada pelo bootstrap corresponde à estrutura real do projeto. Detecta drift (mudanças não documentadas) e valida paths, frameworks e convenções.
   - *Quando usar:* Após o bootstrap, ou periodicamente para detectar divergências entre documentação e código.
   - *Saída:* `.specify/brownfield-validation-report.md`

- **/speckit.brownfield.migrate**
   - *O que faz:* Traz features existentes para o workflow SDD. Faz engenharia reversa de specs a partir do código, reconstrói plan.md e gera tasks.md com todas as tarefas marcadas como completas. Identifica gaps (testes faltando, documentação ausente).
   - *Quando usar:* Para formalizar features já implementadas que não possuem specs, ou para criar documentação retroativa de funcionalidades críticas.
   - *Saída:* `specs/NNN-feature-name/{spec.md,plan.md,tasks.md}` com status `migrated`

**Fluxo Brownfield Completo:**
1. `/speckit.brownfield.scan` → gera perfil do projeto
2. `/speckit.brownfield.bootstrap` → customiza templates
3. `/speckit.brownfield.validate` → verifica alinhamento
4. `/speckit.brownfield.migrate` → formaliza features existentes
5. Novas features seguem fluxo normal (specify → plan → tasks → implement)



## Fonte de verdade
Conflito → AGENTS.md e MDs canônicos vencem sempre.
Detalhes em docs/sdd/MAPEAMENTO_SDD.md.

## Gestão de branches
Ver docs/sdd/BRANCH_POLICY.md.
