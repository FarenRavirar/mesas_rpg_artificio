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

## Modelo de Resolucao Implementado

### Tipos

- `create_system`: cria raiz em `systems`.
- `create_child`: cria `edition`, `variant` ou `subsystem` com `parent_id`; pode cadastrar aliases do filho (`aliases`) e aliases da base no pai (`parent_aliases`) de forma idempotente.
- `create_alias`: cria entrada em `system_aliases`.
- `merge_existing`: marca como coberta por sistema existente, sem inserir nada.
- `reject`: rejeita.

### Auditoria

Decisao: adicionar colunas em `system_suggestions` para evitar tabela paralela inicialmente.

Campos candidatos:

- `resolution_type text null`
- `resolved_system_id uuid null references systems(id)`
- `created_system_id uuid null references systems(id)`
- `created_alias_id uuid null references system_aliases(id)`
- `resolution_notes text null`
- `resolution_payload jsonb not null default '{}'::jsonb`

Historico multi-evento em tabela separada fica fora do escopo atual.

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
    "recommended_action": "create_alias",
    "analysis": {
      "base": "d and d",
      "edition_tokens": ["5e", "2024"],
      "suggested_child_name": "5e 2024",
      "suggested_child_type": "edition",
      "has_edition_context": true,
      "has_qualifier_context": false
    }
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

- `create_system`: `name`, `name_pt`, `description`, `aliases`, `edition_name`, `force`
- `create_child`: `name`, `name_pt`, `node_type`, `parent_id`, `description`, `aliases`, `parent_aliases`
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
- comparar contra `name`, `name_pt`, `slug`, `path_slug`, `system_aliases.alias`;
- remover artigos iniciais e sufixos estruturais conservadores (`RPG`/`TTRPG` e frase `Roleplaying Game`; nao remover `Game` isolado);
- nao inferir traducao/sinonimo por dicionario hardcoded; traducao so conta se vier de `name_pt` ou alias catalogado.

Score inicial:

- match exato normalizado: 1.0
- alias exato normalizado: 0.98
- contem nome + token de edicao: 0.85
- similaridade alta por trigram/Levenshtein local: 0.75
- base existente + edicao/complemento: `create_child`
- base sem edicao: `create_alias`
- sem candidato: `create_system`

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
3. Interpretacao (base detectada, tokens, filho sugerido, tipo sugerido e candidato).
4. Acao escolhida.
5. Contexto/acoes relacionadas da acao.
6. Previa do efeito.
7. Confirmar resolucao.

Controles:

- radio/segmented: alias, edicao/variante/subsistema, sistema novo, mesclar, rejeitar.
- combobox de sistema alvo.
- select de tipo de no quando criar filho.
- input de alias editavel.
- TagInput para aliases do filho e, quando aplicavel, `parent_aliases`.
- paineis de risco em `merge_existing` e `create_system` quando a sugestao tambem parece alias/filho.
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

## Decisoes Fechadas

- Auditoria em colunas de `system_suggestions`.
- Status final reusa `approved` com `resolution_type`.
- Alias duplicado em `create_alias` e idempotente.
- Acoes em lote permanecem so para rejeitar.
- Reconhecimento automatico de traducao/sinonimo depende de `name_pt` ou alias catalogado; sem dicionario hardcoded.
