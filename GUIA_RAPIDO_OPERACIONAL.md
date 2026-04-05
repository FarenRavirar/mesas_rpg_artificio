# GUIA_RAPIDO_OPERACIONAL.md

Resumo executivo para reduzir custo de contexto dos agentes, com navegação rápida por cenário.

> [!IMPORTANT]
> Este guia **não substitui** os arquivos canônicos.
> Em caso de conflito, prevalecem: `AGENTS.md` → `ARQUITETURA_PROJETO.md`.

---

## Índice rápido (use primeiro)

| Cenário | Fonte canônica principal | Decisão rápida |
|---|---|---|
| Onboarding (3 etapas) | `ARQUITETURA_PROJETO.md` §7.5 | `AuthCallback` deve redirecionar para `/onboarding` quando `onboarding_completed=false` |
| Catálogo e busca pública | `ARQUITETURA_PROJETO.md` §7.1-7.3 | Busca/filtros ficam no Frontend, API retorna dados públicos |
| Taxonomia de sistemas (árvore + aliases) | `ARQUITETURA_PROJETO.md` §4 e §7.5 | Modelar `sistema > edição > variante`; aliases servem para busca, não para duplicar sistema |
| Importação de mesas por JSON (lote) | `ARQUITETURA_PROJETO.md` §4 e §7.8 | Exigir `schema_version`, idempotência (`source` + `external_id`), resolução por `system_path_slug` e ao menos 1 contato com `channel=discord` quando o lote pedir nick Discord |
| Selos oficiais (Covil/DDAL) | `ARQUITETURA_PROJETO.md` §7.2, §7.4 e §7.6 | DDAL só é elegível no caminho `D&D > D&D 5e > D&D 2024` e exige metadados mínimos no backend. `is_covil` detectado automaticamente pelo parser Python via análise de texto; editável pelo admin. Ambos persistidos como BOOLEAN na tabela `tables`. |
| Header/Footer globais | `ARQUITETURA_PROJETO.md` §7.1-7.6 | Header sticky e footer institucional devem existir em todas as rotas/etapas |
| Landing pública de mestre | `ARQUITETURA_PROJETO.md` §7.4 | Nunca expor `avatar_deletehash`/`banner_deletehash` |
| OAuth / JWT / roles | `ARQUITETURA_PROJETO.md` §6 | Segurança e role no Backend, nunca no Frontend |
| Imagens e Imgur | `ARQUITETURA_PROJETO.md` §16 | Upload/remoção só no Backend |
| Deploy / Git / promoção | `GIT_WORKFLOW.md` + `OPERACAO_PRODUCAO.md` | Sem `commit`/`push` sem autorização explícita; beta ativo em `dev`; produção só validar publicamente quando a publicação operacional existir |
| Aggregator Discord (ingestão, revisão, exportação) | `ARQUITETURA_PROJETO.md` §12 (rotas Aggregator) | Todas as rotas em `/api/v1/aggregator/*` requerem `admin`. Frontend: `/admin/devtools` visível apenas para admin (não-admin não vê link nem rota registrada). Badge operacional exibe `VITE_ENABLE_DEVTOOLS` para admin no header. Pipeline: source → import/file → candidates → accept/reject. CLI local: `npm run aggregator:import` com auto-reparo de JSON truncado (E088) e fallback manual em `ERRORS_SOLUTIONS.md` quando o reparo falhar. Split automático de JSON >1000 mensagens ocorre no Frontend em lotes de 1000 (IMPORT_CHUNK_SIZE); resumo agrega todos os lotes. Migration_05 aplicada no beta. |
| Mídia importada via Discord (banner/avatar) | `ARQUITETURA_PROJETO.md` §4.2 e §7.8 | `banner_url` é persistido no banco. `gm_avatar_url` é **apenas visual** no formulário (não persiste — Opção B). Ambos são extraídos pelo parser Python de `attachments` e `author.avatarUrl`. |
| Retenção de mesas importadas | `ARQUITETURA_PROJETO.md` §4.2 | Configurável pelo admin no `AdminDevTools`. Campo `imported_expires_at` na tabela `tables` (migration_10). Operação de remoção é irreversível — exigir double-confirm. |
| Erros de execução | `ERRORS_SOLUTIONS.md` | Ao primeiro erro: parar e aplicar solução catalogada |

---

## Contratos inegociáveis (snapshot)

| Tema | Regra |
|---|---|
| Idioma | Toda comunicação em português |
| Auth | Apenas Google OAuth |
| JWT | Backend valida token em rotas privadas |
| Role | `player -> gm` somente no Backend ao criar `gm_profile` |
| Dados sensíveis | Nunca retornar `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` em rotas públicas |
| Imagem | Processamento e Imgur exclusivamente no Backend |
| Git | `commit`/`push` só com autorização explícita do usuário |
| Fluxo de branch | `feature/<escopo>` → `dev` (beta) → `main` (produção) |

---

> As seções de detalhe (Onboarding, Catálogo, Landing, OAuth, Imgur, Git, Erros) foram removidas deste guia.
> O roteamento por cenário está na tabela de índice rápido acima. Os contratos canônicos estão em `ARQUITETURA_PROJETO.md`.

---

## Aggregator Discord — Checklist Operacional

### Configuração Inicial (Admin DevTools)
- [ ] Acessar `/admin/devtools` como admin
- [ ] Configurar token Discord (bot recomendado)
- [ ] Executar testes automáticos (todos devem ficar verdes)
- [ ] Cadastrar source via link de canal ou manualmente

### Importação de JSON
- [ ] Fazer upload do arquivo JSON do DiscordChatExporter
- [ ] Selecionar source associada (opcional)
- [ ] Verificar preview: se >1000 mensagens, aviso de split automático aparece (IMPORT_CHUNK_SIZE=1000)
- [ ] Executar preview (`dryRun=true`) — se split ativo, progressão por lote exibida
- [ ] Validar resumo consolidado (aceitas, rejeitadas, falhas, número de lotes)
- [ ] Confirmar importação (`dryRun=false`)

### Validação de Expiração
- [ ] Mesas importadas com `imported_expires_at` expirado não aparecem no catálogo
- [ ] Prazo de expiração é configurável pelo admin no `AdminDevTools` (migration_10 — pendente)
- [ ] Mesas manuais (`origin='manual'`) não são afetadas pela política de retenção

### Troubleshooting
- **Teste vermelho:** Verificar permissões do token no Discord
- **Rejeição por sistema customizado:** Sistema não existe no banco, precisa ser cadastrado
- **Rejeição por mesa paga:** Filtro automático, não é bug
- **Falha de parse:** JSON corrompido ou formato incompatível

---

## Checklist de fechamento — Task de código

- [ ] Escopo entregue sem refactor fora do pedido.
- [ ] Build/teste mínimo executado; resultado registrado inline.
- [ ] Erro ocorreu → `ERRORS_SOLUTIONS.md` consultado e atualizado se inédito.
- [ ] JWT/roles validados no Backend; nenhum segredo ou deletehash exposto.
- [ ] Contrato conferido em `ARQUITETURA_PROJETO.md` (seção aplicável).
- [ ] Docs atualizadas por delta: `GUIA_RAPIDO_OPERACIONAL.md`, `TODO_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md` — só se houve mudança real.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Checklist de fechamento — Task de documentação

- [ ] Alinhado com canônicos: `AGENTS.md`, `ARQUITETURA_PROJETO.md`, `GIT_WORKFLOW.md` e `OPERACAO_PRODUCAO.md`, quando aplicável.
- [ ] Sem duplicação: resumo + referência ao canônico quando aplicável.
- [ ] Alterações por delta mínimo; links e nomes de seção revisados.
- [ ] Erro recorrente tratado → `ERRORS_SOLUTIONS.md` atualizado no padrão.
- [ ] Mudança de fluxo → refletida em `GUIA_RAPIDO_OPERACIONAL.md`.
- [ ] Impacto em backlog → `TODO_OPERACIONAL.md` e/ou `FILA_IMPLEMENTACAO.md` atualizados.
- [ ] Docs modificadas listadas no resumo da task.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Protocolo de autoatualização contínua (sempre que possível)

Quando uma task alterar contrato, checklist, fluxo recorrente ou decisão operacional:
1. Atualizar **somente por delta** a seção afetada deste guia.
2. Não duplicar regra já presente em arquivo canônico; referenciar o canônico.
3. Se houver conflito, corrigir o guia para refletir o canônico.
4. Registrar no resumo da task que o guia foi atualizado.

> [!NOTE]
> A autoatualização é assistida por agentes (não automática por script). O objetivo é manter este guia sempre enxuto, atual e fiel às fontes canônicas.
