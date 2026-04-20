# Gestão de branches no fluxo SDD

## Branch-base
PRs de feature SDD abrem contra: dev

## Criação automática de branch
/speckit.specify invoca `.specify/scripts/bash/create-new-feature.sh`, que:
1. Escaneia specs/ para determinar o próximo NNN (001, 002, ...).
2. Gera slug semântico a partir da descrição.
3. Cria a branch no padrão feat/NNN-nome, ex: `feat/NNN-nome-semantico`.
4. Cria pasta `specs/NNN-nome/` com spec.md a partir do template.
5. Faz checkout automaticamente.

## Checkpoints durante /speckit.implement
Ao final de cada fase (Setup, Tests, Core, Integration, Polish):

```bash
git add <arquivos-da-fase>
git commit -m "feat(NNN-nome): <fase> — <resumo>"
```

## Abertura de PR
Após /speckit.implement completar e testes passarem:

```bash
git push -u origin feat/NNN-nome-semantico
gh pr create \
  --base dev \
  --head feat/NNN-nome-semantico \
  --title "feat(NNN): <nome feature>" \
  --body-file specs/NNN-nome/pr-description.md
```

O agente gera `pr-description.md` automaticamente com:
- Link para spec.md, plan.md, tasks.md.
- Checklist do PRE_DEPLOY_CHECKLIST.md.
- Resumo de arquivos tocados.

## Pós-merge
- Delecionar branch remota e local: Sim, deleção automática permitida pós-merge finalizado.

## Emergência / rollback
- Falha antes de merge: `git reset --hard <último-commit-bom>` e reportar.
- Falha após merge: revert via PR separado; nunca force-push.

## Proibições absolutas
- Nunca force-push em branch-base.
- Nunca commit direto na branch-base (tudo via PR).
- Nunca commitar em branch de outra feature ativa.
- Nunca renomear branch após push sem aprovação.
