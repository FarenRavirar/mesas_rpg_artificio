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

## Fonte de verdade
Conflito → AGENTS.md e MDs canônicos vencem sempre.
Detalhes em docs/sdd/MAPEAMENTO_SDD.md.

## Gestão de branches
Ver docs/sdd/BRANCH_POLICY.md.
