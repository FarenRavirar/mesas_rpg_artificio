# Implementation Plan: Catálogo e Painel UX Bugs

**Branch**: `feat/008-catalogo-painel-ux-bugs` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/008-catalogo-painel-ux-bugs/spec.md`, revisada criticamente contra código por orientação do mantenedor.

## Summary

Corrigir a experiência visual do catálogo público, eliminando sobreposição entre cabeçalho, filtros, drawer mobile, cards e estados da página, sem alterar regras de negócio ou endpoints. Como a spec foi gerada por IA, o planejamento parte de validação no código: o escopo inclui `CatalogoPage`, `FilterDrawer`, `ActiveFiltersChips`, `TableCard` e o `SystemTreeSelector` compartilhado com o painel de criação/edição de mesa. A referência visual interna confirmada é a gestão de sistemas (`SystemsAdminView`, `CatalogToolbar`, `CatalogTree`), especialmente a organização compacta de busca, chips de tipo e contagem de resultados.

Achado adicional de código: o `SystemTreeSelector` usado no catálogo e no painel tem lógica suspeita no bloco de variantes em modo `singleSelect`, usando `midNodes` e texto de edição no seletor de variantes. Isso pode explicar bugs relacionados ao painel e deve entrar no escopo da feature 008, apesar de a spec atual focar mais no catálogo público.

## Technical Context

**Language/Version**: TypeScript estrito, React + Vite no frontend; Node.js 25.9.0 no projeto.  
**Primary Dependencies**: React, React Router, lucide-react, hooks locais de catálogo (`useCatalogFilters`, `useCatalogTables`) e componentes locais de sistemas.  
**Storage**: N/A para esta feature; sem alteração de banco de dados.  
**Testing**: `npm --prefix frontend run build`; testes Vitest focados se forem adicionados para normalizadores ou componentes puros; validação visual manual/browser em desktop, tablet e mobile; validação funcional final em Beta em janela anônima.  
**Target Platform**: Web responsivo em navegador moderno, com foco em `/catalogo` e fluxo de criação/edição no `/painel`.  
**Project Type**: Monorepo web app, mudança frontend.  
**Performance Goals**: manter busca/filtros perceptivelmente imediatos para o usuário; evitar reflow visual brusco ao aplicar filtros, abrir drawer ou trocar seleção de sistema.  
**Constraints**: não alterar autenticação, permissões, contratos públicos de API, dados de mesa ou migrations; preservar URLs de filtros existentes; todo payload externo que entrar em estado deve passar por normalização tipada se o arquivo for tocado.  
**Scale/Scope**: uma página pública de catálogo, componentes compartilhados de filtros/cards e um componente compartilhado de seleção de sistemas usado também pelo painel.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mudança mínima e reversível**: PASS. Escopo limitado ao frontend e aos componentes diretamente envolvidos no catálogo/painel.
- **Sem decisão de produto inferida**: PASS com cautela. O mantenedor autorizou pesquisar código em caso de dúvida; decisões de produto novas ficam fora do plano.
- **Normalização de fronteira**: PASS com obrigação. Se `mapTableApiToInitialData.ts` ou payload de catálogo forem tocados, dados vindos da API devem ser tratados como `unknown` e normalizados antes de estado/renderização.
- **Sem migrations/schema**: PASS. Não há alteração de banco.
- **Validação Beta**: PASS planejado. Build/testes locais são validação técnica; validação funcional final deve ocorrer em Beta em janela anônima.
- **Escopo estrito do plan.md §3**: PASS. Arquivos tocáveis listados abaixo; qualquer arquivo fora da lista exige parar e pedir orientação.

## Project Structure

### Documentation (this feature)

```text
specs/008-catalogo-painel-ux-bugs/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── CatalogoPage.tsx              # layout, filtros desktop/mobile, estados e grid do catálogo
│   │   └── PainelMestrePage.tsx          # somente se necessário para validar fluxo de edição
│   ├── components/
│   │   ├── FilterDrawer.tsx              # drawer mobile e bloqueio visual durante aplicação
│   │   ├── ActiveFiltersChips.tsx        # chips ativos e remoção de filtros
│   │   ├── TableCard.tsx                 # card público e robustez contra conteúdo variável
│   │   └── SystemTreeSelector.tsx        # seletor compartilhado catálogo/formulário de mesa
│   ├── components/form-steps/steps/
│   │   └── StepSystem.tsx                # integração do seletor no painel de mesa
│   ├── features/create-table/utils/
│   │   └── mapTableApiToInitialData.ts   # somente se o bug de edição exigir normalização do payload
│   ├── features/admin/components/
│   │   ├── CatalogToolbar.tsx            # referência visual de menus/filtros da gestão de sistemas
│   │   ├── CatalogTree.tsx               # referência de lista/estado vazio
│   │   └── CatalogTreeNode.tsx           # referência de item selecionável
│   └── test/
│       └── [feature tests, se criados]
```

**Structure Decision**: feature frontend sem backend/database. O catálogo público deve continuar consumindo os hooks e serviços atuais; o painel entra no escopo apenas pelo componente compartilhado de seleção de sistemas e pelo carregamento de edição quando comprovadamente relacionado.

## Phase 0 Research

Decisões registradas em [research.md](./research.md):

- tratar a spec como hipótese e validar contra código antes da implementação;
- reduzir risco de sobreposição removendo dependência de offsets sticky hardcoded ou consolidando a superfície de filtros;
- usar a gestão de sistemas como referência de densidade e agrupamento, não como cópia visual literal;
- incluir `SystemTreeSelector` no escopo por ser compartilhado com catálogo e painel;
- não alterar backend, banco ou API.

## Phase 1 Design

Artefatos de design:

- [data-model.md](./data-model.md): estados de UI e entidades de apresentação envolvidas;
- [contracts/README.md](./contracts/README.md): contrato visual/funcional esperado para catálogo, filtros, cards e seletor de sistemas;
- [quickstart.md](./quickstart.md): roteiro de validação técnica e manual.

## Re-Check Constitution

- **Escopo técnico fechado**: PASS. Arquivos candidatos estão listados na estrutura do plano.
- **Sem placeholder**: PASS. Artefatos descrevem decisões e validações executáveis.
- **Testes**: PASS planejado. `npm --prefix frontend run build` é obrigatório antes de qualquer commit/deploy; testes específicos serão adicionados se houver lógica isolável.
- **Normalização**: PASS com alerta. `mapTableApiToInitialData.ts` atualmente recebe `any`; se for alterado nesta feature, deve ser corrigido para normalização tipada conforme AGENTS.md.
- **UX/Nielsen**: PASS planejado. Validação precisa cobrir visibilidade de estado, controle do usuário, consistência, prevenção de erro e responsividade.

## Complexity Tracking

Nenhuma violação constitucional planejada.
