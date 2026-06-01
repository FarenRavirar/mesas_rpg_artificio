# Sessão 26-04-25_3_fix-mismatch-userid

**Data:** 25/04/2026  
**Status:** Fechada parcialmente. E164 escopado para sessão futura.

## Objetivo original
Corrigir Bug 2 do inventário da Sessão 11: endpoint /api/v1/admin/sync/hydrate retornava 403 para admin legítimo (mismatch userId/id no JWT).

## Vínculos
- Sessão anterior: `sessoes/26-04-25_2_hidratacao-arquitetural-completa.md`
- Bugs catalogados nesta sessão: E161, E162, E163, E164 (em `errors.md`)
- Bug originador: Sessão 11, inventário de bugs da hidratação

## Jornada real

A sessão começou com o objetivo único de corrigir 403. À medida que cada fix era deployado, novos erros eram revelados em cascata. Cada um foi diagnosticado por log e corrigido individualmente:

### Etapa 1 — Resolução do 403 (E161)
- Diagnóstico: handler lia `req.user?.id` mas JWT é assinado com `userId`. Outros 33 usos no backend já usavam `userId` corretamente — bug isolado em `adminHydration.ts` linha 43.
- Fix: commit `201eb11` troca para `req.user?.userId`.
- Resultado: 403 → 500.

### Etapa 2 — Resolução do 500 inicial (E162)
- Diagnóstico: ON CONFLICT em `auth_providers` apontava para UNIQUE composto `(provider, provider_user_id)`, mas o conflito real estourava na PK por id (23505).
- Fix: commit `bc74176` troca para `ON CONFLICT (id) DO NOTHING` em `auth_providers` e `user_systems`. `bookmarks` preservada (PK composta sem coluna id).
- Resultado: 500 → 500 diferente.

### Etapa 3 — Diagnóstico via log temporário (E163)
- Erro: `column id does not exist` (42703). Investigação inicial não localizou tabela suspeita.
- Estratégia: commit `9ab498d` adiciona log temporário antes do switch e no catch.
- Identificação: `player_profiles` (PK `user_id`, sem coluna `id`) caía no case genérico que usa `RETURNING id`.
- Fix: commit `aac9274` cria case dedicado com `column('user_id')` e `returning(['user_id', 'xmax'])`. Logs temporários removidos no mesmo commit.
- Resultado: 500 ainda persistente, mas erro mudou.

### Etapa 4 — Bug arquitetural revelado (E164)
- Erro: FK violation em `tables_communication_platform_id_fkey` seguido de `25P02` (transaction abortada).
- Investigação: prod e beta foram seedados independentemente com `gen_random_uuid()`. UUIDs divergentes para entidades semanticamente iguais (Discord, Meet, etc). ON CONFLICT (slug) DO UPDATE preserva ids do beta. Mesas vindas da prod referenciam ids inexistentes no beta.
- Inventário de dados exclusivos do beta: 2 mesas, 1 usuário totalmente exclusivo, alguns user_systems.
- Decisão do mantenedor: refatorar para arquitetura semântica via JSON intermediário, com match por slug/email em vez de id direto. Permite reuso futuro pra import via Discord bot.
- Status: PENDENTE para sessão futura.

## Commits desta sessão
- `201eb11` — fix(hydration): corrige leitura de req.user.userId
- `bc74176` — fix(hydration): troca ON CONFLICT para id em auth_providers e user_systems
- `9ab498d` — debug(hydration): log temporário (incorporado em aac9274)
- `aac9274` — fix(hydration): trata player_profiles com PK user_id e remove logs

## Aprendizados que viraram regras (constitution.md §11)
- §11.1 Lazy-load obrigatório (E160, sessão anterior).
- §11.2 Sincronização por identificadores semânticos (E164, esta sessão).
- §11.3 ON CONFLICT aponta para constraint do conflito real (E162, esta sessão).
- §11.4 Compose do repo é fonte da verdade (E160, sessão anterior).

## Critério de conclusão original
- Endpoint /api/v1/admin/sync/hydrate retorna 200 quando admin clica "Executar sincronização".

## Critério atendido?
Parcialmente:
- ✅ Auth funciona (E161 resolvido).
- ✅ Catch de erro Postgres não derruba mais a API (E160, E162, E163 resolvidos).
- ❌ Endpoint ainda retorna 500 quando há mesa com FK divergente (E164 — decidido refatorar arquitetura).

## Próxima sessão
Refatoração arquitetural do `adminHydration.ts` para arquitetura semântica via JSON. Plano completo a ser elaborado no início da sessão nova.
