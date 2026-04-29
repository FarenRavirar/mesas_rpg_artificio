# Quickstart: Catálogo e Painel UX Bugs

## Pré-condições

- Branch ativa: `feat/008-catalogo-painel-ux-bugs`.
- Feature ativa em `.specify/feature.json`: `specs/008-catalogo-painel-ux-bugs`.
- Nenhuma migration planejada.
- Antes de implementar, revisar `tasks.md` gerado pela próxima fase.

## Roteiro Técnico

1. Confirmar arquivos alterados esperados:
   ```powershell
   git status --short
   ```

2. Implementar ajustes somente nos arquivos permitidos pelo plan:
   - `frontend/src/pages/CatalogoPage.tsx`
   - `frontend/src/components/FilterDrawer.tsx`
   - `frontend/src/components/ActiveFiltersChips.tsx`
   - `frontend/src/components/TableCard.tsx`
   - `frontend/src/components/SystemTreeSelector.tsx`
   - `frontend/src/components/form-steps/steps/StepSystem.tsx`
   - `frontend/src/features/create-table/utils/mapTableApiToInitialData.ts` somente se o bug de edição exigir.

3. Rodar validação técnica obrigatória:
   ```powershell
   npm --prefix frontend run build
   ```

4. Se houver lógica isolável nova ou corrigida no seletor/normalizador, rodar testes focados:
   ```powershell
   npm --prefix frontend run test
   ```

## Validação Visual Local

Validar `/catalogo` nos seguintes cenários:

- Desktop largo: filtros, cabeçalho e grid não se sobrepõem.
- Tablet: grid e filtros continuam legíveis sem rolagem horizontal.
- Mobile: drawer abre e fecha sem cobrir permanentemente os resultados; botão flutuante não oculta ações críticas.
- Filtros ativos: chips removíveis aparecem sem quebrar linha de modo desorganizado.
- Estados: carregando, atualizando, vazio e erro mantêm estrutura clara.
- Conteúdo extremo: título longo, mestre com nome longo, sistema com nome longo, badges e imagem ausente.

Validar painel:

- Abrir criação/edição de mesa.
- Selecionar sistema base, edição/subsistema e variante.
- Confirmar que o seletor não troca opções de nível incorreto.
- Confirmar que a edição de mesa carrega sem crash quando a mesa possui sistema já definido.

## Validação Beta

Após merge/deploy em `dev`, a validação funcional da feature só conta como final quando o mantenedor testar em janela anônima no Beta:

- `https://mesasbeta.artificiorpg.com/catalogo`
- fluxo de edição/criação no painel, se alterado pela implementação.

## Rollback

- Reverter os arquivos frontend alterados nesta feature.
- Preservar artefatos SDD para histórico.
- Como não há migration, rollback não exige banco.
