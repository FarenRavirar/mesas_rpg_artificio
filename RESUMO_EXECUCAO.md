# RESUMO_EXECUCAO.md

> **Primeiro arquivo a ser lido em qualquer sessão.** Reflete o estado real do projeto.
> Atualizar obrigatoriamente ao final de cada sessão (ver §Protocolo de Fechamento).

---

## Identidade do Projeto

| Parâmetro | Valor |
|---|---|
| **Repositório local** | `mesas_rpg_artificio` — `C:\projetos\mesas_rpg_artificio` |
| **Beta** | `mesasbeta.artificiorpg.com` → branch `dev` → `/opt/mesas-beta/` |
| **Produção** | `mesas.artificiorpg.com` → branch `main` → `/opt/mesas/` (não publicada) |
| **Stack** | React 19/TS + Node.js/TS + PostgreSQL + Docker Compose + VM Oracle |
| **SSH** | `ssh -F C:\projetos\config faren` |

---

## Documentos de Gestão

| Documento | Propósito | Quando Consultar |
|---|---|---|
| `AGENTS.md` | Governança de agentes — regras, protocolos, checklists | Início de sessão, dúvidas de governança |
| `ARQUITETURA_PROJETO.md` | Arquitetura, contratos, modelo de dados, decisões técnicas | Antes de modificar código |
| `GUIA_RAPIDO_OPERACIONAL.md` | Índice rápido de roteamento por cenário | Roteamento rápido antes de abrir canônicos |
| `TODO_OPERACIONAL.md` | Backlog de requisitos (REQ-xx) com score GUT | Planejamento de features, priorização |
| `FILA_IMPLEMENTACAO.md` | Fila técnica de execução por lote/fase | Durante execução de lote, antes de deploy |
| `ERRORS_SOLUTIONS.md` | Erros conhecidos e soluções validadas | Ao primeiro sinal de erro |
| `GIT_WORKFLOW.md` | Fluxo de Git, merge, deploy | Qualquer operação Git |
| `OPERACAO_PRODUCAO.md` | Operação de beta e produção | Deploy, troubleshooting de ambiente |
| `ambiente_atual_mesas.md` | Snapshot técnico de infraestrutura | Auditoria técnica, validação de deploy |
| `/sessoes/` | Registro histórico de sessões anteriores | Dúvidas sobre decisões passadas |

---

## Regras de Operação

| Regra | Valor |
|---|---|
| Push para `dev` ou `main` | Somente com autorização explícita no chat |
| Commit sem autorização | Proibido |
| Novo túnel Cloudflare | Proibido |
| Deploy manual na VM | Proibido |
| `cover_deletehash` / `avatar_deletehash` / `banner_deletehash` em rota pública | Proibido |
| Upload ou processamento de imagem no frontend | Proibido |
| `path_slug` canônico para DDAL | `dungeons-dragons/5e/2024` |
| Nome do banco PostgreSQL | `mesas_rpg` (nunca `mesas` — ver E059) |
| Idioma de toda comunicação | Português |

---

## Estado das Migrations (Beta)

| Migration | Descrição | Status |
|---|---|---|
| migration_02 | Taxonomia + DDAL no banco | ✅ aplicada |
| migration_04 | Publisher role + contatos (REQ-11/REQ-12) | ✅ aplicada |
| migration_05 | Aggregator Discord — fontes, fila bruta, candidatos | ✅ aplicada (04/04/2026) |
| migration_06 | `system_suggestions` | ✅ aplicada (04/04/2026) |
| migration_07 | `notifications` + Parser Fase B — 15 colunas + 9 índices em `aggregator_import_candidates` | ✅ aplicada (05/04/2026) |
| migration_09 | Campos `frequency`, `frequency_custom`, `rules_notes`, `banner_url` em `tables` | ✅ aplicada (04/04/2026) |
| migration_10 | `is_covil`, `imported_expires_at` em `tables` + CleanupWorker | ❌ pendente |

---

## Estado de Execução — Itens Técnicos

| Item | Descrição | Status | Próxima ação |
|---|---|---|---|
| 017A | `systemsTreeImport` via `sistemas.json` | ✅ executado (132 nós, 280 aliases) | Dockerfile atualizado — cópia automática no build (fix permanente aplicado) |
| 021A | Selos DDAL/Covil — backend + frontend | ✅ deployado e funcional no beta | — |
| 021B | AppShell global | ✅ concluído | Validar smoke visual no beta |
| 022 | Endpoints GM autenticados | ✅ deployado e funcional no beta | — |
| 023 | `npm run build` backend | ✅ exit code 0, sem erros de tipo | — |
| 024 | `npm run build` frontend | ✅ 1746 módulos, dist/ ok | — |
| 026 | REQ-11 + REQ-12 fullstack (publisher role + contatos) | ✅ deployado em `dev`/beta | QA E2E de anunciante + contatos obrigatórios |
| Fase 7 | Aggregator Discord — pipeline completo | ✅ backend + migration aplicada | QA manual: criar source, importar JSON, revisar candidatos, validar `/admin/devtools` |
| Fase 7B | `TableOrigin` + expiração + AdminDevToolsPage | ✅ deployado em `dev`/beta | QA manual no beta: semáforo de testes, dry-run, split automático de JSON |
| Fase 8 | CRUD sistemas colaborativo + notificações in-app | ✅ deployado em `dev`/beta (04/04/2026) | QA manual: sugestão de sistemas no `/painel-mestre`, revisão em `/gestao`, sino do header |
| REQ-16 | Correção de logout inesperado | ✅ corrigido e validado (05/04/2026) | Teste manual de sessão de 30 minutos |
| REQ-22 | 3 bugs críticos — E109, E111, E103 | ✅ resolvido e deployado | — |
| REQ-23 | CRUD Admin completo | ✅ deployado e funcional no beta | — |
| REQ-24 | Parser Python Fase B | ✅ deployado e funcional no beta (05/04/2026) | QA com anúncios reais do Discord |
| REQ-25 | Filtros avançados + deleção em lote de candidatos | ✅ implementado com 10 heurísticas de Nielsen | — |

**Legenda:** ✅ concluído · ⏳ pronto local, aguardando validação beta · ⏸ bloqueado

---

## Estado Atual (05/04/2026)

**Ambiente beta:** Estável e operacional em `mesasbeta.artificiorpg.com`

**Última sessão concluída (05/04/2026 - 18:24):**
- REQ-28 expandido para cobrir fluxo completo de importação inteligente
- Documentação canônica atualizada: `TODO_OPERACIONAL.md`, `ARQUITETURA_PROJETO.md`
- Arquitetura consolidada: 5 camadas (Parser Python → Normalização → FormPatch → Revisão → Persistência)
- Backend Fase 1 mantido: `setting_name` e `setting_styles` funcionais (5/5 testes passando)

**Próxima ação prioritária:**
Expandir parser Python (`discord_message_parser.py`) com todos os campos do plano de importação inteligente: `banner_url`, `avatar_url`, `external_links`, `is_paid`, `priceText`, `signupText`, `requires_pc/camera/microphone`, `is_ongoing`, `reviewFlags`. Atualizar schemas Pydantic e TypeScript. Garantir que `enrichedFields` preserve todos os campos sem perda silenciosa.

**REQs identificados e pendentes (integrados ao TODO_OPERACIONAL.md):**
- REQ-21: Melhorias críticas no formulário (14 lacunas — plataformas, faixa etária, editor rico)
- REQ-28: Importação Inteligente — Backend Fase 1 concluído, pendente Fases 2-6 (parser expandido, auto-preenchimento, abertura de blocos, overrides, página pública)

---

## Último Commit Validado

| Campo | Valor |
|---|---|
| Branch | `dev` |
| Hash | `ec238f2` |
| Mensagem | `fix(REQ-28): Garante que types.ts está sincronizado com schema do banco` |
| Deploy beta | ✅ success |
| Build | ✅ Backend e Frontend compilam sem erros |

**Commits desta sessão:**
1. `79ffde6` — `feat(REQ-28): Implementa extração de cenário e estilos no fluxo de importação`
2. `ec238f2` — `fix(REQ-28): Garante que types.ts está sincronizado com schema do banco`

**Commit anterior:** `3071300` — `feat: Adicionar aba CRUD completa na página de gestão` — ✅ success

---

## Bloqueios Ativos

Nenhum bloqueio no momento (05/04/2026).

> Ao identificar novo bloqueio, registrar aqui com data e descrição da dependência.

---

## Protocolo de Fechamento (Obrigatório)

Antes de encerrar qualquer sessão, atualizar as três seções abaixo. **Sessão não está encerrada sem isso.**

- [ ] **Estado de execução** — marcar o que foi concluído, atualizar próximas ações
- [ ] **Bloqueios ativos** — remover resolvidos, adicionar novos
- [ ] **Último commit validado** — atualizar hash, mensagem e status do deploy
