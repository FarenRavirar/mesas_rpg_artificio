# FILA_IMPLEMENTACAO.md

> Backlog operacional de desenvolvimento. **Guia de implementação técnica.**
> 
> **PARA que Serve:** Detalhes técnicos de como implementar cada item do BACKLOG_OPERACIONAL.
> **DETALHES TÉCNICOS:** Tarefas específicas de código (arquivos, dependências, migrations).
> **NÃO contém itens novos:** Itens novos devem ser adicionados primeiro no BACKLOG_OPERACIONAL.md.
> **Ver BACKLOG:** Para entender o contexto de produto de cada item.
> 
> **MAPEAMENTO:** FILA (números) ↔ BACKLOG (REQ/DEB/OPS) — ver seção §4.

---

## §1. FORMATO — Como adicionar item

Cada item na FILA deve ter:
- **ID**: número sequencial (ex: 075, 086)
- **GUT**: Score (G x U x T)
- **一步**: Ação imediata (1 linha)
- **Dependências**: de quais itens depende (se houver)
- **Arquivos**: arquivos concretos para modificar

**Não adicionar itens sem:**
1. GUT calculado
2.一步 claro
3. Referência de arquivos

---

## §2. ÍNDICE — Pendentes por prioridade

### Alta Prioridade (GUT ≥ 100)

| # | ID | GUT | Item |一步 | BACKLOG ref |
|---|---|---|---|---|---|
| 1 | 075 | 100 | Plataformas como tabelas | ⏳ Validar | ↔ — |
| 2 | 086 | 100 | Frequência detallada | parcialmente | ↔ REQ-30 |
| 3 | 100 | 100 | Campos Cenário/Estilo | Pending | ↔ REQ-21 |

### Média Prioridade (GUT 50-99)

| # | ID | GUT | Item |一步 | BACKLOG ref |
|---|---|---|---|---|---|
| 1 | 084 | 80 | Faixa etária dropdown | Pending | ↔ REQ-21 |
| 2 | 085 | 80 | Nível mesa dropdown | Pending | ↔ REQ-26 |
| 3 | 089 | 80 | Render markdown MesaPage | Pending | ↔ — |
| 4 | 097 | 80 | Migration cenário/estilos | Pending | ↔ REQ-21 |
| 5 | 098 | 80 | Endpoint sugestões estilos | Pending | ↔ REQ-21 |

### Baixa Prioridade (GUT < 50)

| # | ID | GUT | Item |一步 | BACKLOG ref |
|---|---|---|---|---|---|
| 1 | 059 | 64 | Atalhos teclado | Implementar | ↔ — |
| 2 | 060 | 64 | Busca texto candidatos | Implementar | ↔ — |
| 3 | 067 | 48 | Tooltips explicativos | Implementar | ↔ — |
| 4 | 082 | 48 | Markdown sanitizer backend | Pending | ↔ — |
| 5 | 096 | 48 | Dados brutos completos | Pending | ↔ — |
| 6 | 061 | 36 | Status PT-BR | Implementar | ↔ — |
| 7 | 062 | 36 | Botão Cancelar modal | Implementar | ↔ — |
| 8 | 064 | 36 | Ordenação candidatos | Implementar | ↔ — |
| 9 | 065 | 36 | Tabs modal revisão | Implementar | ↔ — |
| 10 | 066 | 36 | Erros específicos | Implementar | ↔ — |

---

## §3. DETALHES — Implementação por item

### Alta Prioridade (GUT ≥ 100)

| ID | GUT |一步 | Descrição completa | Dependências | Arquivos | Status |
|---|---|---|---|---|---|---|
| **075** | 100 | **⏳ Validar** — campos texto vs tabelas | **Plataformas como tabelas no banco (Diferente do REQ-21):** REQ-21 implementou campos de TEXTO (vtt_platform_id, game_platform_custom, communication_platform). Este item pedindo: (1) criar tabelas game_platforms e communication_platforms, (2) endpoints CRUD admin, (3) endpoint público listagem, (4) seletor multi-select no formulário. **VALIDAR PRIMEIRO:** verificar se campos de texto são suficientes ou se precisa mesmo de tabelas. | Depende de nada | Backend: db/types.ts, routes/vttPlatforms.ts. Frontend: useVttPlatforms.ts, PainelMestrePage.tsx | Pendente |
| **086** | 100 | **parcialmente** | **Frequência detalhada em table_schedules:** Frequência foi movida para table_schedules (não mais em tables). migration_104 removeu tables.frequency. Já existe: frequency (semanal/quinzenal/mensal/avulsa) + day_of_week. Precisa adicionar: (1) campo times_per_month SMALLINT no schema (para frequency=quinzenal), (2) campo custom_notes TEXT (para frequency=mensal), (3) validações condicionais (times obrigatório se quinzenal, notes obrigatório se mensal), (4) UI no SessionRepeater. Ver sessões: 26-04-14_7 (BUG 3 resolvido), 26-04-15_1 (migration_104 aplicada). | Depende de nada | Backend: db/types.ts (ScheduleTable), routes/tableSchedules.ts. Frontend: SessionRepeater.tsx, validator.ts | Parcial |
| **100** | 100 | **Pending** | **Campos Cenário (setting_name) + Estilos (setting_styles) no formulário:** Adicionar ao CreateTableForm: (1) campo "Cenário" (input texto livre, ex: "Forgotten Realms", "Eberron"), (2) campo "Estilos" (multi-select com chips, ex: ["Alta Fantasia", "Aventura Épica"]). Ao digitar no campo Cenário (debounce 500ms), chamar GET /settings/suggest-styles?setting=<valor> e pré-popular campo Estilos com sugestões. Exibir na MesaPage como "Cenário: X | Estilos: Y, Z". Requer: migration para adicionar setting_name e setting_styles na tabela tables, endpoint de sugestões. | Depende de 097 (migration), 098 (endpoint sugestões) | Backend: db/types.ts, routes/settingRoutes.ts. Frontend: PainelMestrePage.tsx, MesaPage.tsx, mapper.ts | Pendente |

### Média Prioridade (GUT 50-99)

| ID | GUT |一步 | Descrição completa | Dependências | Arquivos | Status |
|---|---|---|---|---|---|---|
| **084** | 80 | **Pending** | **Faixa etária dropdown:** Campo age_rating existe como texto (livre/+10/+12/+14/+16/+18). Precisa: substituir input de texto livre por dropdown com opções fixas. Valor padrão: Livre. Exibir ícone visual ao lado de cada opção (🟢 Livre, 🟡 +10, 🟠 +14, 🔴 +18). UI presente no StepConfig. | Depende de nada | Frontend: StepConfig.tsx (age_rating), mapper.ts | Pendente |
| **085** | 80 | **Pending** | **Nível mesa dropdown:** Campo level_range existe como texto. Precisa: substituir por dropdown com opções fixas: Iniciante, Intermediário, Avançado, Misto. Campo opcional. Exibir tooltip explicativo: "Iniciante: nunca jogou RPG. Intermediário: conhece as regras básica. Avançado: domina o sistema. Misto: aceita todos os níveis." UI presente no StepFinal. | Depende de nada | Frontend: StepFinal.tsx (level_range), mapper.ts | Pendente |
| **089** | 80 | **Pending** | **Renderização markdown em MesaPage:** Description e rules_notes são salvos como markdown mas não são renderizados na MesaPage. Precisa: (1) verificar se backend já sanitiza (item 082), (2) usar react-markdown-editor-lite ou dangerouslySetInnerHTML para renderizar. Componente MarkdownEditor já existe. Depende de 082 (sanitização). | Depende de 082 (backend sanitizer) | Frontend: MesaPage.tsx, MarkdownEditor.tsx | Pendente |
| **097** | 80 | **Pending** | **Migration cenário e estilos:** Adicionar colunas na tabela tables: (1) setting_name TEXT, (2) setting_styles TEXT[]. Criar tabela auxiliar setting_style_suggestions com colunas: id UUID PK, setting_name TEXT, suggested_styles TEXT[]. Mapeamento cenário → estilos sugeridos. | Depende de nada | database/migration_XX_setting_styles.sql | Pendente |
| **098** | 80 | **Pending** | **Endpoint sugestões de estilo por cenário:** Criar rota GET /api/v1/settings/suggest-styles?setting=<nome> que retorna array de estilos sugeridos baseado em fuzzy match de setting_name na tabela setting_style_suggestions. Se não encontrar match, retornar array vazio. Exemplos: "Forgotten Realms" → ["Alta Fantasia", "Aventura Épica"], "Eberron" → ["Steampunk", "Magitech", "Noir"]. | Depende de 097 (migration) | Backend: routes/settingRoutes.ts | Pendente |

### Baixa Prioridade (GUT < 50)

| ID | GUT |一步 | Descrição completa | Dependências | Arquivos | Status |
|---|---|---|---|---|---|---|
| **059** | 64 | **Implementar** | **Atalhos de teclado na gestão:** Implementar atalhos no modal de revisão de candidatos: 'A' para aprovar, 'R' para rejeitar, 'Esc' para fechar modal. Exibir legenda discreta no rodapé do modal. Aumenta eficiência para power users. Viola H7 (Eficiência). GUT: 64 | Depende de nada | Frontend: GestaoPage.tsx (modal de revisão) | Pendente |
| **060** | 64 | **Implementar** | **Busca por texto em candidatos:** Adicionar campo de busca que filtra candidatos por título ou sistema (case-insensitive). Busca client-side com debounce 300ms. Viola H7 (Eficiência). GUT: 64 | Depende de nada | Frontend: GestaoPage.tsx | Pendente |
| **061** | 36 | **Implementar** | **Traduzir status para PT-BR:** Substituir status em inglês do banco: "awaiting_review" → "Aguardando Revisão", "accepted" → "Aceito", "rejected" → "Rejeitado" (com ícones: ⏳ ✅ ❌). Viola H2 (Correspondência com o mundo real). GUT: 36 | Depende de nada | Frontend: GestaoPage.tsx | Pendente |
| **062** | 36 | **Implementar** | **Botão Cancelar explícito no modal:** Adicionar botão "Cancelar" ao lado de "Aprovar" no modal de revisão (além do "X" no canto). Viola H3 (Controle do usuário). GUT: 36 | Depende de nada | Frontend: GestaoPage.tsx | Pendente |
| **063** | 48 | **Implementar** | **Aviso sistema não detectado:** Exibir badge amarelo "⚠️ Sistema não detectado" se system_id estiver vazio após mapeamento do candidato. Sugerir seleção manual no tooltip. Viola H5 (Prevenção de erros). GUT: 48 | Depende de 047 (findSystemId) | Frontend: GestaoPage.tsx | Pendente |
| **064** | 27 | **Implementar** | **Ordenação de candidatos:** Adicionar dropdown de ordenação: "Mais recentes" (default), "Maior confiança", "Menor confiança". Viola H7 (Eficiência). GUT: 27. Médio esforço. | Depende de nada | Frontend: GestaoPage.tsx | Pendente |
| **065** | 27 | **Implementar** | **Tabs no modal de revisão:** Reorganizar modal com tabs: "Dados Extraídos" (default), "Dados Brutos" (JSON), "Preview" (visualização). Reduz sobrecarga visual. Viola H8 (Minimalismo e estética). GUT: 27. médio esforço. | Depende de nada | Frontend: GestaoPage.tsx | Pendente |
| **066** | 27 | **Implementar** | **Mensagens de erro específicas:** Substituir mensagens genéricas por específicas: "Sistema não encontrado. Selecione manualmente.", "Título obrigatório.", "Descrição obrigatória.", etc. Viola H9 (Recuperação de erros). GUT: 27. Baixo esforço. | Depende de nothing | Frontend: GestaoPage.tsx | Pendente |
| **067** | 27 | **Implementar** | **Tooltips explicativos:** Adicionar ícone "?" com tooltips em campos complexos: "Confiança" (mostrar %), "Publisher Role" (anunciante vs mestre), "Frequência" (semanal/quinzenal/mensal). Viola H10 (Ajuda e documentação). GUT: 27. Baixo esforço. | Depende de nothing | Frontend: GestaoPage.tsx | Pendente |
| **082** | 48 | **Pending** | **Markdown sanitizer no backend:** Adicionar sanitização de markdown no backend usando biblioteca marked + DOMPurify (ou equivalente). Aceitar markdown no payload de description/rules_notes, sanitizar e retornar HTML seguro. Permitir tags seguras: p, strong, em, ul, ol, li, a, br. Bloquear: script, iframe, object, embed. Usar em validação e na resposta GET /tables/:id. GUT: 48. | Dependente de nothing | Backend: utils/markdownSanitizer.ts, validators/tableValidators.ts | Pendente |
| **096** | 48 | **Pending** | **Ver dados brutos completo:** Usuário reportou que "Ver dados brutos não tá mostrando tudo". Verificar implementação do item 049 (dados brutos). Garantir que JSON.stringify(candidate.parsed_json, null, 2) exibe objeto completo, não truncado. Pode ser problema de altura do pre (overflow). GUT: 48. | Depende de 049 | Frontend: GestaoPage.tsx | Pendente |

---

## §4. MAPEAMENTO — FILA ↔ BACKLOG

> Este mapeamento conecta itens por **conteúdo**, não por número.

| FILA ID | ↔ | BACKLOG ID | Conteúdo |
|---|---|---|---|
| 084 | ↔ | REQ-21 | Faixa etária dropdown |
| 100, 097, 098 | ↔ | REQ-21 (parcial) | Cenário/Estilos |
| 085 | ↔ | REQ-26 | Nível mesa dropdown |
| 086 | ↔ | REQ-30 | Frequência detalhada |
| DEB-06 | ↔ | REQ-29 | Auditoria API (mesmo item) |
| 075 | ↔ | — | Plataformas como tabelas |
| 015 | ↔ | OPS-04 | Imgur → Cloudinary |
| 039 | ↔ | REQ-17 | Auditoria UX Nielsen |
| 090 | ↔ | REQ-08, REQ-11 | Perfil announcer + badges |
| 068 | ↔ | REQ-09 | Selos Covil + DDAL |
| 025-026 | ↔ | REQ-07 | Admin + moderação |
| 059-067 | ↔ | — | UX Gestão (itens técnicos) |
| 082, 089 | ↔ | — | Markdown (backend + render) |

---

## §5. HISTÓRICO DE CONCLUSÃO

_15/04/2026_
- [x] **015**: Imgur → descartado (Cloudinary substituiu) | BACKLOG: OPS-04
- [x] **017A**: carga sistemas → parcialmente | BACKLOG: —
- [x] **025-026**: admin → concluído | BACKLOG: REQ-07
- [x] **027-030**: engajamento → planejado (Fase 5) | BACKLOG: DEB-01
- [x] **039**: Auditoria UX Nielsen → concluído | BACKLOG: REQ-17
- [x] **045-054**: 10 itens admin → concluídos | BACKLOG: REQ-07
- [x] **068**: is_covil → concluído | BACKLOG: REQ-09
- [x] **069-073**: campos formulário → concluídos | BACKLOG: REQ-26
- [x] **077**: level_range → concluído | BACKLOG: REQ-26
- [x] **084**: faixa etária parcialmente (campo existe) | BACKLOG: REQ-21
- [x] **087**: renomeado → concluído | BACKLOG: REQ-21
- [x] **088**: editor rico → concluído | BACKLOG: REQ-21
- [x] **090**: perfil announcer → concluído | BACKLOG: REQ-08, REQ-11
- [x] **143**: name_pt → concluído | BACKLOG: REQ-30

_14/04/2026_
- [x] **REQ-30 (parcial)**: bugs críticos (race condition, token) | BACKLOG: REQ-30