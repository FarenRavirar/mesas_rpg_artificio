# PR - Spec 023 Fases 0-2

## Resumo

Entrega parcial da Spec 023 antes da Fase 3, conforme pedido do mantenedor:

- Fase 0: sessao dedicada, D1-D3 confirmadas, branch dedicada e baseline regenerado.
- Fase 1: `no-unused-vars` e `react-refresh/only-export-components` zerados.
- Fase 2: `@typescript-eslint/no-explicit-any` zerado.

## Escopo

- Extrai hooks/contextos de arquivos que exportavam componentes para satisfazer Fast Refresh sem mudar providers usados por `App.tsx`.
- Substitui `any` por tipos reais, `unknown` com narrowing, ou normalizadores locais.
- Adiciona normalizacao para payloads vindos de API/localStorage antes de estado/renderizacao nos pontos tocados.
- Mantem Fase 3 pendente por pedido do mantenedor: hooks, `set-state-*` e warnings restantes.

## Evidencias

Baseline inicial:

```text
npm --prefix frontend run lint
✖ 124 problems (110 errors, 14 warnings)
```

Depois das Fases 0-2:

```text
rg -n "any" frontend\src
sem resultados

npm --prefix frontend run lint
✖ 19 problems (5 errors, 14 warnings)
```

Build:

```text
npm --prefix frontend run build
✓ 2168 modules transformed.
✓ built in 3.75s
```

## Pendencias antes de concluir Spec 023

- Fase 3: resolver/justificar `exhaustive-deps`, remover disable inutil e corrigir `set-state-in-effect`/`set-state-in-render`.
- Fase 4: lint/build/test/diff final.
- Fase 5: deploy Beta por fase concluida e validacao funcional do mantenedor em janela anonima.

## Checklist pos-merge

- [ ] Deploy Beta GREEN.
- [ ] Confirmar que a entrega parcial nao altera comportamento observado.
- [ ] Retomar Fase 3 somente depois do deploy/validacao desta fase.
