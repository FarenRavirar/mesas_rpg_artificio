# 26-04-29_2_lancamento-itens-sdd.md

**Data:** 29/04/2026
**Objetivo:** Registrar, classificar e preparar novos itens enviados pelo mantenedor, um por vez, nos artefatos canônicos corretos de Spec-Kit (`tasks`, `bugs` ou `features`), sem iniciar implementação técnica nesta sessão.

## Vínculos
- **Sessão anterior:** `encerradas/26-04-29_1_imagens-banners-placeholder.md`
- **Próxima sessão:** a definir

## Plano de execução
1. [x] Ler estado atual do projeto, cabeçalho de `AGENTS.md`, cabeçalho de `constitution.md` e índice de sessões.
2. [x] Abrir sessão dedicada para lançamento de novos itens SDD.
3. [x] Classificar o item 1: refatorar exclusão de mesa para eliminar confirmação via pop-up e usar confirmação segura dentro da página.
4. [x] Executar `/speckit.specify` como procedimento de IA para o item 1 antes de qualquer leitura de código.
5. [x] Criar spec e checklist de qualidade do item 1.
6. [x] Registrar pendência do item 007: spec criada; planejamento técnico depende de aprovação futura.
7. [x] Repetir o fluxo completo para o item 2: bug visual do catálogo e crash de edição no painel.
8. [x] Repetir o fluxo completo para o item 3: mapear `textarea` e padronizar editor rico igual à Descrição da Mesa.
9. [x] Repetir o fluxo completo para o item 4: refatorar changelog duplicado/obsoleto.
10. [x] Repetir o fluxo completo para o item 5: verificar sugestões de sistemas chegando ao admin/Notificações.
11. [x] Atualizar `.specify/memory/project-state.md` via fechamento documental equivalente a `/speckit.status`.
12. [x] Manter sessão em `sessoes/` até autorização específica de arquivamento em `encerradas/`.
13. [x] Atualizar `sessoes/index.md`.

## O que vai fazer
- Registrar o primeiro item como feature/UX, porque altera o fluxo de exclusão de mesa usado pelo usuário final.
- Criar a especificação SDD correspondente antes de qualquer investigação de código.
- Não implementar a solução nesta sessão sem pedido explícito.

## O que precisa ser feito
- Criar artefato SDD para o fluxo seguro de exclusão de mesa sem pop-up.
- Garantir que a spec descreva o comportamento desejado em termos de usuário e segurança, sem definir implementação técnica.
- Parar após a spec se houver necessidade de aprovação para avançar ao planejamento.

## O que foi feito
- Mantenedor solicitou uma sessão específica para lançar itens em `tasks`, `bugs` ou `features`, um por vez, seguindo o fluxo Spec-Kit exigido pelo `AGENTS.md`.
- Primeiro item recebido: refatorar o sistema de excluir mesa, removendo confirmação via pop-up e substituindo por uma solução segura dentro da página.
- Governança inicial consultada: `project-state.md`, `AGENTS.md`, `constitution.md` e `sessoes/index.md`.
- Skill `speckit.specify` lida para seguir o procedimento de criação da spec.
- Após correção processual do mantenedor, o item 007 foi recriado sem executar comandos Spec-Kit como shell.
- Spec criada em `specs/007-exclusao-mesa-sem-popup/spec.md`.
- Checklist de qualidade criado em `specs/007-exclusao-mesa-sem-popup/checklists/requirements.md`.
- Próximo passo bloqueado por governança: aguardar aprovação explícita da spec antes de `/speckit.plan`.
- Item 2 recebido: bug visual do catálogo sobrescrevendo a tela, com necessidade de investigar bugs relacionados, revisar responsividade e padronizar menus/filtros com o estilo da gestão de sistemas.
- Item 2 classificado como feature/bugfix visual de catálogo.
- Escopo corrigido após apontamento do mantenedor: bug já corrigido do painel não faz parte do item 008.
- Ciclo completo de preparação revisado como procedimento de IA: `/speckit.specify`, `/speckit.plan` e `/speckit.tasks`, sem execução de comandos shell Spec-Kit.
- Artefatos revisados em `specs/008-catalogo-painel-ux-bugs/`: `spec.md`, `checklists/requirements.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md` e `tasks.md`.
- Item 3 recebido: mapear todos os locais de inserção de texto com `textarea` e substituir os elegíveis pela mesma ferramenta de edição usada em Descrição da Mesa.
- Item 3 classificado como feature de padronização editorial/UX com inventário obrigatório antes de implementação.
- Ciclo completo de preparação executado como procedimento de IA: `/speckit.specify`, `/speckit.plan` e `/speckit.tasks`, sem execução de comandos shell Spec-Kit.
- Artefatos criados em `specs/009-editor-rico-textareas/`: `spec.md`, `checklists/requirements.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md` e `tasks.md`.
- Item 4 recebido: refatorar changelog porque há informações duplicadas/obsoletas de alterações que foram comunicadas como resolvidas antes de nova correção.
- Item 4 classificado como feature de conteúdo/governança do changelog, com inventário e consolidação obrigatórios antes de alterar `database/changelogs.json`.
- Ciclo completo de preparação executado como procedimento de IA: `/speckit.specify`, `/speckit.plan` e `/speckit.tasks`, sem execução de comandos shell Spec-Kit.
- Artefatos criados em `specs/010-refatoracao-changelog/`: `spec.md`, `checklists/requirements.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md` e `tasks.md`.
- Item 5 recebido: verificar se sugestões de sistemas realmente chegam ao admin pela gestão ou pela ferramenta de Notificações.
- Item 5 classificado como bugfix/investigação de integração entre sugestão, admin, gestão e notificações.
- Ciclo completo de preparação executado como procedimento de IA: `/speckit.specify`, `/speckit.plan` e `/speckit.tasks`, sem execução de comandos shell Spec-Kit.
- Artefatos criados em `specs/011-verificacao-sugestoes-sistemas-admin/`: `spec.md`, `checklists/requirements.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md` e `tasks.md`.

## Checklist de fechamento
- [x] Executar fechamento documental equivalente a `/speckit.retro.run`
- [x] Atualizar `.specify/memory/project-state.md` via fechamento equivalente a `/speckit.status`
- [x] Manter sessão em `sessoes/` até autorização específica para mover para `encerradas/`
- [x] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- `sessoes/index.md`
- `.specify/memory/project-state.md`
- `specs/007-exclusao-mesa-sem-popup/spec.md`
- `specs/007-exclusao-mesa-sem-popup/checklists/requirements.md`
- `specs/008-catalogo-painel-ux-bugs/spec.md`
- `specs/008-catalogo-painel-ux-bugs/checklists/requirements.md`
- `specs/008-catalogo-painel-ux-bugs/plan.md`
- `specs/008-catalogo-painel-ux-bugs/research.md`
- `specs/008-catalogo-painel-ux-bugs/data-model.md`
- `specs/008-catalogo-painel-ux-bugs/quickstart.md`
- `specs/008-catalogo-painel-ux-bugs/contracts/README.md`
- `specs/008-catalogo-painel-ux-bugs/tasks.md`
- `specs/009-editor-rico-textareas/spec.md`
- `specs/009-editor-rico-textareas/checklists/requirements.md`
- `specs/009-editor-rico-textareas/plan.md`
- `specs/009-editor-rico-textareas/research.md`
- `specs/009-editor-rico-textareas/data-model.md`
- `specs/009-editor-rico-textareas/quickstart.md`
- `specs/009-editor-rico-textareas/contracts/README.md`
- `specs/009-editor-rico-textareas/tasks.md`
- `specs/010-refatoracao-changelog/spec.md`
- `specs/010-refatoracao-changelog/checklists/requirements.md`
- `specs/010-refatoracao-changelog/plan.md`
- `specs/010-refatoracao-changelog/research.md`
- `specs/010-refatoracao-changelog/data-model.md`
- `specs/010-refatoracao-changelog/quickstart.md`
- `specs/010-refatoracao-changelog/contracts/README.md`
- `specs/010-refatoracao-changelog/tasks.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/spec.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/checklists/requirements.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/plan.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/research.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/data-model.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/quickstart.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/contracts/README.md`
- `specs/011-verificacao-sugestoes-sistemas-admin/tasks.md`

## Critério de conclusão explícito
Sessão concluída: todos os itens enviados pelo mantenedor para lançamento foram classificados e registrados nos artefatos canônicos corretos, sem implementação técnica solicitada para estes itens, com `project-state.md` e `sessoes/index.md` atualizados.

## Fechamento
- **Status:** encerrada documentalmente em 29/04/2026 13:02 BRT.
- **Pedido do mantenedor:** itens acabaram; fazer deploy da sessão para `dev`.
- **Observação processual:** a sessão permanece em `sessoes/` porque não houve autorização específica para mover o arquivo para `sessoes/encerradas/`.
- **Pendência operacional:** publicar as mudanças documentais no branch `dev` conforme pedido explícito do mantenedor.
