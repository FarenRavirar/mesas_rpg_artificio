# GUIA_RAPIDO_OPERACIONAL.md

Resumo executivo para reduzir custo de contexto dos agentes, com navegação rápida por cenário.

> [!IMPORTANT]
> Este guia **não substitui** os arquivos canônicos.
> Em caso de conflito, prevalecem: `AGENTS.md` → `ARQUITETURA_PROJETO.md`.

---

## Índice rápido (use primeiro)

| Cenário | Fonte canônica | Decisão rápida |
|---|---|---|
| Onboarding (3 etapas) | `ARQUITETURA_PROJETO.md` §1, §7.5 | `AuthCallback` redireciona para `/onboarding` quando `onboarding_completed=false` |
| Catálogo e busca pública | `ARQUITETURA_PROJETO.md` §1 | Busca/filtros ficam no Frontend (Fuse.js); API retorna dados públicos |
| Taxonomia de sistemas (árvore + aliases) | `ARQUITETURA_PROJETO.md` §4 | Modelar `sistema > edição > variante`; aliases servem para busca, não para duplicar sistema. Importados via `sistemas.json` |
| Importação de mesas por JSON (lote) | `ARQUITETURA_PROJETO.md` §7 | Idempotência por `source_url`; reparo automático de JSON truncado via `repairTruncatedJson()`; fallback manual em `ERRORS_SOLUTIONS.md` quando reparo falhar |
| Selos oficiais (Covil/DDAL) | `ARQUITETURA_PROJETO.md` §7.3 | DDAL só é elegível no caminho `dungeons-dragons/5e/2024` e exige metadados mínimos no backend. `is_covil` detectado automaticamente pelo parser Python; editável pelo admin. Ambos como BOOLEAN na tabela `tables` |
| Header/Footer globais | `ARQUITETURA_PROJETO.md` §1 | Header sticky e footer institucional presentes em todas as rotas |
| Landing pública de mestre | `ARQUITETURA_PROJETO.md` §4.4 | Nunca expor `avatar_deletehash` / `banner_deletehash` |
| OAuth / JWT / roles | `ARQUITETURA_PROJETO.md` §5 e §6 | Segurança e elevação de role exclusivamente no Backend |
| Imagens e Imgur | `ARQUITETURA_PROJETO.md` §16 | Upload, conversão WebP e exclusão só no Backend |
| Deploy / Git / promoção | `GIT_WORKFLOW.md` + `OPERACAO_PRODUCAO.md` | Sem `commit`/`push` sem autorização explícita; beta ativo em `dev`; produção só quando publicação operacional existir |
| Aggregator Discord (ingestão, revisão, exportação) | `ARQUITETURA_PROJETO.md` §7 e §12 | Todas as rotas em `/api/v1/aggregator/*` requerem `admin`. Pipeline: source → import/file → candidates → accept/reject. Split automático de JSON >1000 mensagens no Frontend em lotes de 1000 (IMPORT_CHUNK_SIZE). Migration_05 e migration_07 aplicadas no beta |
| Mídia importada via Discord (banner/avatar) | `ARQUITETURA_PROJETO.md` §4.2 | `banner_url` é persistido no banco. `gm_avatar_url` é **apenas visual** no formulário de revisão — não persiste no banco |
| Retenção de mesas importadas | `ARQUITETURA_PROJETO.md` §4.2 | Campo `imported_expires_at` na tabela `tables` (migration_10 — **pendente**). Operação de remoção irreversível — exigir double-confirm |
| Deleção em lote de candidatos | `ARQUITETURA_PROJETO.md` §12 | `DELETE /api/v1/aggregator/candidates/bulk`. Body: `{ ids: string[] }`. Limite: 150 IDs por request. Retorna `{ deleted, requested }` |
| Erros de execução | `ERRORS_SOLUTIONS.md` | Ao primeiro erro: parar e aplicar solução catalogada. Se inédito: registrar antes de continuar |

---

## Contratos inegociáveis (snapshot)

| Tema | Regra |
|---|---|
| Idioma | Toda comunicação em português |
| Auth | Apenas Google OAuth — sem login por e-mail/senha local |
| JWT | Backend valida token em todas as rotas privadas |
| Role | `player → gm` somente no Backend ao criar `gm_profile` |
| Dados sensíveis | Nunca retornar `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` em rotas públicas |
| Imagem | Processamento WebP e upload/exclusão no Imgur exclusivamente no Backend |
| Git | `commit`/`push` só com autorização explícita do usuário |
| Fluxo de branch | `feature/<escopo>` → `dev` (beta) → `main` (produção) |
| Nome do banco | `mesas_rpg` — nunca `mesas` (ver E059) |

---

## Aggregator Discord — Checklist Operacional

### Importação de JSON (Admin)
- [ ] Acessar `/admin/devtools` como admin
- [ ] Fazer upload do JSON exportado do DiscordChatExporter
- [ ] Selecionar source associada (opcional)
- [ ] Se >1000 mensagens: aviso de split automático aparece (IMPORT_CHUNK_SIZE=1000)
- [ ] Executar preview (`dryRun=true`) — progressão por lote se split ativo
- [ ] Validar resumo consolidado (aceitas, rejeitadas, falhas, número de lotes)
- [ ] Confirmar importação (`dryRun=false`)

### Revisão de Candidatos (Admin)
- [ ] Acessar fila em `/admin/candidates`
- [ ] Aplicar filtros (data, mestre, status) se necessário
- [ ] Revisar campos enriquecidos pelo parser Python (`sessions[]`, `payment_classification`, `publisher_role`)
- [ ] Aceitar, rejeitar ou marcar para revisão manual
- [ ] Para deleção em lote: selecionar (limite 150), confirmar no modal com checkbox obrigatório

### Validação de Expiração
- [ ] Mesas importadas com `imported_expires_at` expirado não aparecem no catálogo
- [ ] Prazo configurável pelo admin no `AdminDevTools` (migration_10 — **pendente**)
- [ ] Mesas manuais (`origin='manual'`) não são afetadas pela política de retenção

### Troubleshooting
- **Falha de parse:** JSON corrompido ou formato incompatível — verificar `ERRORS_SOLUTIONS.md` E088
- **Rejeição por sistema não encontrado:** Sistema não cadastrado no banco — cadastrar via CRUD admin de sistemas
- **Rejeição por mesa paga:** Filtro automático do parser, não é bug
- **JSON truncado:** `repairTruncatedJson()` aplica 6 estratégias automáticas; fallback manual em `ERRORS_SOLUTIONS.md`

---

## Checklist de fechamento — Task de código

- [ ] Escopo entregue sem refactor fora do pedido
- [ ] Build/teste mínimo executado; resultado registrado inline
- [ ] Erro ocorreu → `ERRORS_SOLUTIONS.md` consultado e atualizado se inédito
- [ ] JWT/roles validados no Backend; nenhum segredo ou deletehash exposto
- [ ] Contrato conferido em `ARQUITETURA_PROJETO.md` (seção aplicável)
- [ ] Docs atualizadas por delta: `GUIA_RAPIDO_OPERACIONAL.md`, `TODO_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md` — só se houve mudança real
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário**

---

## Checklist de fechamento — Task de documentação

- [ ] Alinhado com canônicos: `AGENTS.md`, `ARQUITETURA_PROJETO.md`, `GIT_WORKFLOW.md` e `OPERACAO_PRODUCAO.md`
- [ ] Sem duplicação: resumo + referência ao canônico quando aplicável
- [ ] Alterações por delta mínimo; links e nomes de seção revisados
- [ ] Erro recorrente tratado → `ERRORS_SOLUTIONS.md` atualizado no padrão
- [ ] Mudança de fluxo → refletida em `GUIA_RAPIDO_OPERACIONAL.md`
- [ ] Impacto em backlog → `TODO_OPERACIONAL.md` e/ou `FILA_IMPLEMENTACAO.md` atualizados
- [ ] Docs modificadas listadas no resumo da task
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário**

---

## Protocolo de autoatualização contínua

Quando uma task alterar contrato, checklist, fluxo recorrente ou decisão operacional:
1. Atualizar **somente por delta** a seção afetada deste guia
2. Não duplicar regra já presente em arquivo canônico — referenciar o canônico
3. Se houver conflito, corrigir o guia para refletir o canônico
4. Registrar no resumo da task que o guia foi atualizado

> [!NOTE]
> A autoatualização é assistida por agentes (não automática por script). O objetivo é manter este guia enxuto, atual e fiel às fontes canônicas.
