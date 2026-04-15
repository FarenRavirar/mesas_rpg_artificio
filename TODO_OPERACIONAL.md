# TODO Operacional — Anúncios de Mesas RPG

> Backlog vivo de melhorias, correções e débitos técnicos. Guia operacional para agentes.

---

## 📋 ÍNDICE — O que fazer (ordenado por GUT)

### Alta Prioridade (GUT ≥ 100)

| # | GUT | Item |一步 |
|---|---|---|---|
| 1 | 125 | REQ-21: Faixa etária (formulário) | Criar campo age_rating |
| 2 | 100 | REQ-29: Auditoria API + implementar | Atualizar MAPA_DE_API.md |

### Média Prioridade (GUT 50-99)

| # | GUT | Item |一步 |
|---|---|---|---|
| 3 | 75 | DEB-06: Integração rotas API órfãs | Após REQ-29 |

### Baixa Prioridade (GUT < 50)

| # | GUT | Item |一步 |
|---|---|---|---|
| 4 | 36 | DEB-01: Engajamento social | Planejado (Fase 5) |
| 5 | 18 | DEB-02: Paginação catálogo | Planejado (sem volume) |
| 6 | 18 | DEB-03: SEO estruturado | Planejado (meta tags) |
| 7 | 12 | DEB-04: Onboarding revisitável | Planejado (UX secundária) |
| 8 | 16 | OPS-01: Logs centralizados | Planejado |
| 9 | 20 | OPS-02: Backup Oracle→Drive | Planejado |
| 10 | 9 | OPS-03: Script dump PostgreSQL | Planejado |
| — | Cancelado | OPS-04: MonitorImgur | Usar Cloudinary |

---

## 1. BACKLOG ATIVO — O que precisa ser feito

### Alta Prioridade (GUT ≥ 100)

| ID | GUT | Descrição | Status |一步 |
|---|---|---|---|---|
| REQ-21 | 125 | **Melhorias críticas formulário (12/14 itens):** Faixa etária estruturada (enum: livre/+10/+12/+14/+16/+18) é o único item pendente dos 14 identificados. Os outros 13 já foram implementados. | Pendente | Criar campo `age_rating` no banco e frontend |
| REQ-29 | 100 | **Auditoria frontend→backend + implementação:** Mapear endpoints via `MAPA_DE_API.md`, atualizar status, implementar UI para os 5 mais críticos. Endereça DEB-06. | Pendente | Primeiro:auditoria, segundo:implementar |

### Média Prioridade (GUT 50-99)

| ID | GUT | Descrição | Status |一步 |
|---|---|---|---|---|
| DEB-06 | 75 | **Integração Rotas API Órfãs:** 29 endpoints pendentes no MAPA_DE_API.md. Depende de REQ-29. | Pendente | Após REQ-29 |

### Baixa Prioridade (GUT < 50)

| ID | GUT | Descrição | Status |一步 |
|---|---|---|---|---|
| DEB-01 | 36 | **Engajamento social:** Q&A, reviews, bookmarks. | Planejado | Após Fases 1–4 |
| DEB-02 | 18 | **Paginação catálogo:** Server-side se volume crescer. | Planejado | Sem dados |
| DEB-03 | 18 | **SEO estruturado:** Open Graph, sitemap. | Planejado | Meta tags |
| DEB-04 | 12 | **Onboarding revisitável:** Atualizar preferências. | Planejado | UX secundária |
| OPS-01 | 16 | **Logs centralizados:** Morgan/Winston. | Planejado | Fase 1 |
| OPS-02 | 20 | **Backup Oracle→Drive:** 3 backups retidos. | Planejado | Herdado |
| OPS-03 | 9 | **Script dump PostgreSQL:** Backup manual. | Planejado | - |

---

## 2. HISTÓRICO DE CONCLUSÃO

_15/04/2026_
- [x] **REQ-03:** Cloudinary + Sharp. Pipeline completo, upload direto, VITE_CLOUDINARY_*. Beta funcional.
- [x] **REQ-04:** Catálogo público. Filtros: sistema, modalidade, preço, experiência, selos, estilos. Busca server-side.
- [x] **REQ-05:** Landing page mestre. Perfil rico, banner, avatar, bio, especialidades, lista mesas.
- [x] **REQ-06:** Painel mestres autopublicação. Cover, vagas, frequência, regras, bloco DDAL.
- [x] **REQ-07:** Painel admin + moderação. GestaoPage, CRUD sistemas/cenários, systemSuggestions.
- [x] **REQ-08:** Diferenciação visual papéis. Badges admin/gm, abas condicionais, redirecionamento.
- [x] **REQ-09:** Selos Covil + DDAL. Persistência, filtro, badges, validação.
- [x] **REQ-11:** Publicador (anunciante vs mestre). publisher_role, selo visual.
- [x] **REQ-12:** Canais de contato. table_contacts, 7 canais, validação backend.
- [x] **REQ-13:** QA publicação real. Fluxo completo: onboarding, gm_profile, publication, Cloudinary, contacts, selos.
- [x] **REQ-17:** Auditoria UX Nielsen. Documentação + regra AGENTS.md.
- [x] **REQ-21 (13/14):** Melhorias formulário. 13/14 itens: paridade, ocultar perfil, frequência, placeholder, renomeado, plataformas, edição admin, editor rico, auto-detecção, dados brutos, nível, cenário/estilo. **Pendente:** faixa etária.
- [x] **REQ-26:** Formulário Expandido. 13 campos: master_display_name, campaign_length, level_range, billing_text, session_zero_free, synopsis, style_text, listing_excerpt, technical_requirements, requires_pc/camera/microphone.
- [x] **REQ-27:** Agenda Estruturada. table_schedules, 4 rotas CRUD, SessionRepeater.
- [x] **REQ-30:** Correção onboarding. Frequency duplicado, editor rico, vagas, cenário, name_pt, toggle PT/EN.
- [x] **REQ-31:** Sync schema beta→prod. Gate workflows, migration_104 aplicada.
- [x] **OPS-04:** MonitorImgur. Cancelado — Cloudinary substituí Imgur.

_14/04/2026_
- [x] **REQ-30 (parcial):** BUGs críticos. Race condition editar mesa (commit 8bb716b), token desativar (PUT→PATCH, E142).

_09/04/2026_
- [x] **REQ-26/REQ-27:** Ver 15/04/2026 (reoriginados para sessão atual).

_05/04/2026_
- [x] **REQ-23:** Painel Admin CRUD. Rotas admin, SystemEditModal, ScenarioEditModal, /gestao.
- [x] **REQ-22:** 3 bugs bloqueadores. Dockerfile .py (E109), SystemTreeSelector (E111), JWT 7d (E116).
- [x] **REQ-16:** Logout inesperado. JWT_EXPIRES_IN 15m→7d no compose.

_04/04/2026_
- [x] **REQ-15:** CRUD sistemas + notificações. Migrations 06/07, 3 rotas, modal, /gestao, sino.
- [x] **REQ-06 (atualização):** Frequência, regras, banner, "em andamento".

_31/03/2026_
- [x] **REQ-01:** Repositório, secrets, Oracle, Cloudflare, React+Node.
- [x] **REQ-02:** Schema + API base. Migrations, Express, Google OAuth, JWT, Kysely.
- [x] **REQ-10:** Layout global. AppShell, SiteHeader+Footer.