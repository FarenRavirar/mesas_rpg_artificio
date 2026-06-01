# Plan 018 - Resolucao de Sugestoes de Sistemas

## Contexto Atual

Arquivos relevantes:

- `frontend/src/pages/GestaoPage.tsx`
- `frontend/src/components/SystemSuggestionModal.tsx`
- `frontend/src/modules/admin/systems/useSystems.ts`
- `backend/src/routes/systemSuggestions.ts`
- `backend/src/routes/systemSuggestionsAdmin.ts`
- `backend/src/routes/systems.ts`
- `backend/src/db/types.ts`
- `database/migration_06_system_suggestions.sql`
- `database/migration_02_system_taxonomy_and_ddal.sql`

Estado observado em Beta em 2026-06-01:

- `system_suggestions`: 37 total, 35 pendentes, 2 aprovadas.
- `scenario_suggestions`: 0.
- A tela exibe cards com checkbox, nome, descricao, tipo/status, aprovar/rejeitar.
- O fluxo atual ainda nao guia alias/edicao/mescla.

## Decisao de Produto

A sugestao nao deve ser aprovada diretamente para sistema raiz sem uma etapa de resolucao.

Acao primaria:

- `Resolver`

Acoes secundarias:

- `Rejeitar`
- `Selecionar em lote`

## Modelo de Resolucao Proposto

### Tipos

- `create_system`: cria raiz em `systems`.
- `create_child`: cria `edition`, `variant` ou `subsystem` com `parent_id`.
- `create_alias`: cria entrada em `system_aliases`.
- `merge_existing`: marca como coberta por sistema existente, sem inserir nada.
- `reject`: rejeita.

### Auditoria

Preferencia: adicionar colunas em `system_suggestions` para evitar tabela paralela inicialmente.

Campos candidatos:

- `resolution_type text null`
- `resolved_system_id uuid null references systems(id)`
- `created_system_id uuid null references systems(id)`
- `created_alias_id uuid null references system_aliases(id)`
- `resolution_notes text null`
- `resolution_payload jsonb not null default '{}'::jsonb`

Se a equipe preferir historico multi-evento, alternativa:

- tabela `system_suggestion_resolutions`

Decisao pendente antes da implementacao.

## API Proposta

### GET candidatos

`GET /api/v1/admin/system-suggestions/:id/candidates`

Resposta:

```json
{
  "data": {
    "suggestion": {},
    "candidates": [
      {
        "system_id": "uuid",
        "name": "Dungeons & Dragons",
        "path_slug": "dungeons-dragons/5e/2024",
        "score": 0.92,
        "reasons": ["alias_match", "edition_token_2024"]
      }
    ],
    "recommended_action": "create_alias"
  }
}
```

### Resolver

`POST /api/v1/admin/system-suggestions/:id/resolve`

Body:

```json
{
  "resolution_type": "create_alias",
  "target_system_id": "uuid",
  "alias": "D&D 5a edicao 2024",
  "notes": "Nome vindo do Discord; catalogo ja possui no 2024."
}
```

Variantes de body:

- `create_system`: `name`, `name_pt`, `description`
- `create_child`: `name`, `name_pt`, `node_type`, `parent_id`, `description`
- `create_alias`: `target_system_id`, `alias`
- `merge_existing`: `target_system_id`, `notes`
- `reject`: `reason`

## Algoritmo de Candidatos

Normalizacao:

- lower-case;
- remover acentos;
- remover `tm`, `r`, `registered`, simbolos comerciais;
- normalizar `&` para `and`;
- remover pontuacao fraca;
- detectar tokens de edicao: `1e`, `1.3`, `5e`, `5a`, `5ª`, `2024`, `revised`, `remaster`;
- comparar contra `name`, `name_pt`, `slug`, `path_slug`, `system_aliases.alias`.

Score inicial:

- match exato normalizado: 1.0
- alias exato normalizado: 0.98
- contem nome + token de edicao: 0.85
- similaridade alta por trigram/Levenshtein local: 0.75
- parent provavel + versao: 0.70

Evitar dependencia pesada inicialmente. Implementar helper puro testavel.

## UX Proposta

### Lista

Card mostra:

- nome sugerido;
- origem;
- status;
- badge de suspeita: `possivel alias`, `possivel edicao`, `novo provavel`, `incerto`;
- melhor candidato quando existir;
- botoes: `Resolver`, `Rejeitar`.

### Drawer Resolver

Secoes:

1. Sugestao original.
2. Candidatos encontrados.
3. Acao escolhida.
4. Previa do efeito.
5. Confirmar resolucao.

Controles:

- radio/segmented: alias, edicao/variante/subsistema, sistema novo, mesclar, rejeitar.
- combobox de sistema alvo.
- select de tipo de no quando criar filho.
- input de alias editavel.
- preview de caminho final.

## Sequencia de Implementacao

1. Criar testes backend para normalizador/candidatos.
2. Criar helper `suggestSystemResolutionCandidates`.
3. Criar endpoint candidates.
4. Definir e aplicar migration de auditoria.
5. Criar endpoint resolve.
6. Atualizar `GestaoPage` para drawer Resolver.
7. Atualizar vinculo de drafts Discord apos resolucao.
8. Validar tecnicamente.
9. Atualizar changelog.
10. Commit/push `dev`, Deploy Beta, mantenedor testa em janela anonima.

## Validacao Tecnica

Minimo:

- `npm --prefix backend test -- systemSuggestions`
- `npm --prefix backend run build`
- `npm --prefix frontend run build`
- `npm --prefix frontend test -- suggestion`
- `git diff --check`

Validacao funcional:

- apenas apos deploy em `dev`/Beta;
- mantenedor resolve amostra real da fila.

## Pendencias de Decisao

- Usar colunas em `system_suggestions` ou tabela nova `system_suggestion_resolutions`.
- Status final deve ser `approved` com `resolution_type`, ou novo status `resolved`.
- Alias duplicado deve marcar sugestao como `merge_existing` ou `create_alias` idempotente.
- Acoes em lote devem permanecer so para rejeitar, ou tambem resolver alias quando candidato e exato.
