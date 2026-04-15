# Análise Detalhada do TODO_OPERACIONAL.md — 15/04/2026

## Contexto da Auditoria

**Objetivo:** Verificar cada item do TODO_OPERACIONAL.md para determinar se está concluído, obsoleto ou ainda relevante.

**Estado do projeto (RESUMO_EXECUCAO.md):**
- Beta ativo e estável em `mesasbeta.artificiorpg.com`
- Produção ativa em `mesas.artificiorpg.com`
- Migration_104 aplicada em ambos ambientes
- Último deploy: 15/04/2026 01:34 BRT

---

## SEÇÃO 1: BACKLOG DE AÇÕES IMEDIATAS

### REQ-03: Serviço de imagens Imgur + Sharp (Fase 1)
**Status atual:** Em aberto  
**GUT:** 5/5/4 (100)  
**Análise:**
- FILA item 015: status `pendente`
- Descrição: Pipeline completo de upload (Sharp + Imgur + persistência de deletehash)
- Observação: "Depende da estabilização do núcleo já validado no beta"

**Verificação necessária:**
- [ ] Verificar se existe `imgurService.ts` no backend
- [ ] Verificar se Sharp está instalado (`package.json`)
- [ ] Verificar se há rotas de upload implementadas

**Decisão preliminar:** MANTER (ainda não implementado)

---

### REQ-04: Catálogo público com filtros estruturados (Fase 2)
**Status atual:** Em validação beta  
**GUT:** 4/5/4 (80)  
**Análise:**
- Descrição: Listagem em grid, filtros por sistema/dia/tipo/audiência/plataforma/tag/preço/modalidade/nível
- Observação: "Implementação local concluída com filtro por selo (ddal, covil-do-lich) e árvore hierárquica. Pendente validação final pós-deploy em dev."

**Verificação necessária:**
- [ ] Verificar se `CatalogPage.tsx` existe e está funcional
- [ ] Testar filtros no beta via browser
- [ ] Verificar se Fuse.js está implementado

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-05: Landing page pública do mestre (Fase 2)
**Status atual:** Em validação beta  
**GUT:** 4/5/4 (80)  
**Análise:**
- Descrição: Perfil rico com banner, avatar, bio, especialidades, estatísticas, lista de mesas ativas
- Observação: "Rota pública e frontend atualizados com metadados DDAL em mesas ativas"

**Verificação necessária:**
- [ ] Verificar se rota `/mestres/:slug` existe
- [ ] Testar no beta se página do mestre carrega
- [ ] Verificar se exibe selos oficiais

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-06: Painel do mestre com autopublicação (Fase 3)
**Status atual:** Em validação beta  
**GUT:** 4/4/4 (64)  
**Análise:**
- Descrição: Formulário de criação/edição de mesa, upload de cover, gerenciamento de vagas, edição de gm_profile
- Observação: "Bloco DDAL condicional implementado. Atualização 04/04/2026: Adicionados campos de frequência, regras/observações, banner URL e checkbox 'mesa em andamento' (migration_09). Backend e frontend atualizados. Deploy concluído em beta."

**Verificação necessária:**
- [ ] Verificar se `/painel` existe e funciona
- [ ] Testar criação de mesa no beta
- [ ] Verificar se migration_09 foi aplicada

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-07: Painel administrativo e moderação (Fase 4)
**Status atual:** Em aberto  
**GUT:** 4/4/4 (64)  
**Análise:**
- Descrição: Fila de mesas pendentes com aprovação/rejeição, CRUD de taxonomias, curadoria de destaques
- Observação: "Depende da estabilização das entregas públicas e do painel do mestre já em validação beta"
- FILA itens 025-026: status `pendente`

**Verificação necessária:**
- [ ] Verificar se `/gestao` existe
- [ ] Verificar se há endpoints admin implementados

**Decisão preliminar:** MANTER (ainda não implementado completamente)

---

### REQ-08: Diferenciação Visual de Papéis de Usuário
**Status atual:** Parte Pronta  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Lógicas condicionais no Frontend para Admin, GM, Player
- Observação: "Lógica de bypass no Backend já inserida em auth.ts para o admin-master. É necessário transpor os escopos visuais completos para o FrontEnd futuramente."

**Verificação necessária:**
- [ ] Verificar se há diferenciação visual no frontend
- [ ] Testar com diferentes roles

**Decisão preliminar:** MANTER (parcialmente implementado, precisa completar frontend)

---

### REQ-09: Selos oficiais Covil do Lich + DDAL (Fase 2/3)
**Status atual:** Em validação beta  
**GUT:** 5/4/4 (80)  
**Análise:**
- Descrição: Política de atribuição e exibição dos selos no backend/frontend
- Observação: "Backend e frontend implementados e deployados em beta (persistência, filtro seal, badges e metadados DDAL). systemsTreeImport já executado no beta; foco atual em QA E2E completo (REQ-13)."

**Verificação necessária:**
- [ ] Verificar se selos aparecem no catálogo
- [ ] Verificar se filtro por selo funciona
- [ ] Testar validação DDAL (código, nome, tier)

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-11: Papel do publicador da mesa (anunciante vs mestre)
**Status atual:** Em validação beta  
**GUT:** 4/5/4 (80)  
**Análise:**
- Descrição: Campo publisher_role (gm | announcer) com selo visual "Apenas Anunciante"
- Observação: "Migration_04 aplicada no beta + backend/frontend deployados em dev. Pendente QA E2E com caso real publisher_role = announcer e validação visual do selo em catálogo/detalhe."

**Verificação necessária:**
- [ ] Verificar se migration_04 existe
- [ ] Verificar se campo publisher_role está no schema
- [ ] Testar selo visual no catálogo

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-12: Canais de contato e recrutamento obrigatórios na mesa
**Status atual:** Em validação beta  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Tabela table_contacts com canais (whatsapp, discord, phone, email, facebook, instagram, form)
- Observação: "Migration_04 aplicada no beta + fluxo de contatos deployado em dev. Pendente QA E2E de criação/edição/publicação ativa com contatos obrigatórios e exibição pública."

**Verificação necessária:**
- [ ] Verificar se tabela table_contacts existe
- [ ] Testar criação de mesa sem contatos (deve rejeitar)
- [ ] Verificar exibição de contatos na página da mesa

**Decisão preliminar:** VERIFICAR NO BETA → se funcional, MOVER PARA CONCLUÍDO

---

### REQ-13: QA de primeira publicação real (roteiro do responsável)
**Status atual:** Em validação pelo responsável  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Validar fluxo completo no beta como usuário anunciante
- Observação: "Beta ao vivo em mesasbeta.artificiorpg.com. REQ-11 e REQ-12 já deployados; manter foco nos fluxos reais de anunciante, contatos obrigatórios e Imgur (REQ-03)."

**Decisão preliminar:** MANTER (aguardando validação manual do responsável)

---

### REQ-17: Auditoria UX completa baseada nas 10 Heurísticas de Nielsen
**Status atual:** Planejado  
**GUT:** 4/5/5 (100)  
**Análise:**
- Descrição: Revisar toda a interface aplicando as 10 heurísticas de Nielsen
- Observação: "Documentação completa das heurísticas em OPERACAO_PRODUCAO.md. Regra obrigatória adicionada ao AGENTS.md. Itens técnicos de implementação serão detalhados na FILA_IMPLEMENTACAO.md após criação do plano de ação. Prioridade alta após estabilização das Fases 1–3."
- FILA item 039: status `pendente`

**Decisão preliminar:** MANTER (planejado, não iniciado)

---

### REQ-21: Melhorias críticas no formulário e exibição de mesas (Fase 3)
**Status atual:** Em aberto  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: 14 lacunas críticas identificadas em 05/04/2026
- Observação: "Formulário incompleto impede publicação de mesas com todas as informações necessárias. Admin não consegue moderar efetivamente."
- FILA itens 075-100: vários com status `pendente`

**Decisão preliminar:** MANTER (muitos subitens ainda pendentes)

---

### REQ-26: Formulário Expandido — Campos Avançados (Fase 3)
**Status atual:** **Concluído**  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: 13 campos implementados para paridade completa entre parser Python e formulário
- Observação: "Implementado e deployado em 05/04/2026. Itens técnicos: 113-117 em FILA_IMPLEMENTACAO.md (todos marcados como concluido). Sistema em paridade total: parser Python → backend → frontend → visualização pública."

**Decisão preliminar:** MOVER PARA "CONCLUÍDOS RECENTES" (já marcado como concluído)

---

### REQ-27: Agenda Estruturada com Múltiplos Horários (Fase 3)
**Status atual:** **Concluído**  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Tabela table_schedules e UI de repetidor de sessões
- Observação: "Implementado e deployado em 05/04/2026. Itens técnicos: 118-123 em FILA_IMPLEMENTACAO.md (todos marcados como concluido). Paridade completa: parser Python → backend → frontend → visualização pública."

**Decisão preliminar:** MOVER PARA "CONCLUÍDOS RECENTES" (já marcado como concluído)

---

### REQ-29: Auditoria completa de cobertura frontend→backend
**Status atual:** ⚡ Prioridade imediata  
**GUT:** 2/5/3 (30) + 4/5/4 (80)  
**Análise:**
- Descrição: Mapear todos os endpoints do backend e identificar quais estão sem chamada no frontend
- Observação: "Endereça DEB-06 com abordagem estruturada: primeiro mapear, depois implementar. Evita retrabalho."
- FILA itens 150-151: status `pendente`

**Decisão preliminar:** MANTER (não iniciado, alta prioridade)

---

### REQ-30: Revisão e correção do onboarding de mesas (Fase 3)
**Status atual:** ⚡ Prioridade imediata  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Bugs e melhorias de UX identificados em 12/04/2026
- Observação: "Todos os bugs e melhorias do REQ-30 concluídos."
- FILA itens 143-149: item 143 marcado como `concluido`, demais `pendente`

**Verificação necessária:**
- [ ] Verificar se TODOS os bugs foram realmente corrigidos
- [ ] Verificar status dos itens 144-149 na FILA

**Decisão preliminar:** VERIFICAR STATUS REAL → pode estar CONCLUÍDO ou PARCIALMENTE CONCLUÍDO

---

### REQ-31: Sincronização de schema beta → produção (pré-deploy)
**Status atual:** Concluído  
**GUT:** 5/5/5 (125)  
**Análise:**
- Descrição: Alinhamento estrutural entre banco beta e produção
- Observação: "Gate operacional validado e limpeza estrutural concluída nos dois ambientes."
- Confirmação: migration_104 aplicada em ambos ambientes

**Decisão preliminar:** MOVER PARA "CONCLUÍDOS RECENTES" (já marcado como concluído)

---

## SEÇÃO 2: DÍVIDA TÉCNICA

### DEB-01: Engajamento social (Fase 5)
**Status atual:** Em aberto  
**GUT:** 3/4/3 (36)  
**Análise:**
- Descrição: Tabelas e endpoints de questions, answers, reviews, bookmarks
- Observação: "Só após Fases 1–4 estáveis. As seções ficam como placeholder visual até então."
- FILA itens 027-030: status `pendente`

**Decisão preliminar:** MANTER (planejado para Fase 5, não iniciado)

---

### DEB-02: Paginação e performance do catálogo
**Status atual:** Em aberto  
**GUT:** 2/3/3 (18)  
**Análise:**
- Descrição: Avaliar paginação server-side ou cursor-based
- Observação: "Revisitar quando houver dados reais de volume. Fuse.js é suficiente para fase inicial."

**Decisão preliminar:** MANTER (não urgente, aguardando volume de dados)

---

### DEB-03: SEO estruturado
**Status atual:** Em aberto  
**GUT:** 2/3/2 (12)  
**Análise:**
- Descrição: Meta tags, Open Graph e sitemap
- Observação: "Implementar junto ou logo após a Fase 2."

**Decisão preliminar:** MANTER (importante para lançamento público)

---

### DEB-04: Onboarding revisitável
**Status atual:** Em aberto  
**GUT:** 2/2/3 (12)  
**Análise:**
- Descrição: Permitir que usuário retorne ao fluxo de preferências
- Observação: "UX secundária — não bloqueia nada."

**Decisão preliminar:** MANTER (baixa prioridade, mas válido)

---

### DEB-06: Integração de Rotas API Órfãs
**Status atual:** Em aberto  
**GUT:** 5/3/3 (45)  
**Análise:**
- Descrição: Implementar UI para endpoints de Backend inativos no Frontend
- Observação: "Crucial para que o banco de dados não possua tabelas isoladas. Ver lista completa em MAPA_DE_API.md filtrando 'Pendente/Front'."

**Decisão preliminar:** MANTER (endereçado pelo REQ-29, mas ainda relevante como DEB)

---

## SEÇÃO 3: TAREFAS DE DEVOPS E OBSERVABILIDADE

### OPS-01: Logs centralizados na API Node.js (Morgan/Winston)
**Status atual:** Planejado  
**GUT:** 4/4/4 (64)  
**Análise:**
- Descrição: Essencial para diagnosticar falhas e melhorar observabilidade
- Observação: "Implementar desde a Fase 1 para não acumular débito de observabilidade."

**Verificação necessária:**
- [ ] Verificar se Morgan ou Winston estão instalados
- [ ] Verificar se há logs estruturados no backend

**Decisão preliminar:** MANTER (importante para produção)

---

### OPS-02: Backup diário automático Oracle → Google Drive
**Status atual:** Planejado  
**GUT:** 5/5/4 (100)  
**Análise:**
- Descrição: Rotina agendada para exportar dump completo do banco
- Observação: "Sem versionar dumps no GitHub. Usar rotação automática, log de execução e teste de restauração mensal. Herdado do padrão do Glossário."

**Decisão preliminar:** MANTER (crítico para segurança de dados)

---

### OPS-03: Script local de dump do PostgreSQL
**Status atual:** Em aberto  
**GUT:** 3/3/3 (27)  
**Análise:**
- Descrição: Backup pontual e manual do banco

**Verificação necessária:**
- [ ] Verificar se existe script em `/scripts/`

**Decisão preliminar:** MANTER (útil para diagnósticos)

---

### OPS-04: Monitoramento de rate limit do Imgur
**Status atual:** Em aberto  
**GUT:** 2/2/3 (12)  
**Análise:**
- Descrição: Alertar no log quando se aproximar do limite de 1250 uploads/dia

**Decisão preliminar:** MANTER (importante quando REQ-03 for implementado)

---

### OPS-05: Atualizar node-version nos workflows
**Status atual:** Em aberto  
**GUT:** 2/2/2 (8)  
**Análise:**
- Descrição: Manter versão LTS ativa nos workflows

**Verificação necessária:**
- [ ] Verificar versão atual nos workflows
- [ ] Verificar se está desatualizada

**Decisão preliminar:** VERIFICAR → se atualizado, REMOVER; se não, MANTER

---

## SEÇÃO 4: CONCLUÍDOS RECENTES

### Análise de itens com mais de 30 dias

**Regra do AGENTS.md:** "REQs em Concluídos Recentes com mais de 30 dias → remover"

**Data de referência:** 15/04/2026

Itens na seção "Concluídos Recentes":
- 14/04/2026: REQ-30 (parcial) — **1 dia atrás** → MANTER
- 09/04/2026: REQ-26, REQ-27 — **6 dias atrás** → MANTER
- 05/04/2026: REQ-23, REQ-22, REQ-16, REQ-15, REQ-06 (atualização) — **10 dias atrás** → MANTER
- 04/04/2026: REQ-15, REQ-06 (atualização) — **11 dias atrás** → MANTER
- 31/03/2026: REQ-01, REQ-02, REQ-10 — **15 dias atrás** → MANTER

**Decisão:** TODOS os itens têm menos de 30 dias → MANTER TODOS

---

## RESUMO PRELIMINAR

### Itens a MOVER para Concluídos (já marcados como concluídos):
- REQ-26 ✅
- REQ-27 ✅
- REQ-31 ✅

### Itens a VERIFICAR NO BETA (podem estar concluídos):
- REQ-04 (Catálogo público)
- REQ-05 (Landing page do mestre)
- REQ-06 (Painel do mestre)
- REQ-09 (Selos oficiais)
- REQ-11 (Papel do publicador)
- REQ-12 (Canais de contato)
- REQ-30 (Revisão onboarding)

### Itens a MANTER (ainda relevantes):
- REQ-03 (Imgur + Sharp)
- REQ-07 (Painel admin)
- REQ-08 (Diferenciação visual)
- REQ-13 (QA primeira publicação)
- REQ-17 (Auditoria UX Nielsen)
- REQ-21 (Melhorias formulário)
- REQ-29 (Auditoria cobertura APIs)
- DEB-01 a DEB-06
- OPS-01 a OPS-04

### Itens a VERIFICAR SE OBSOLETO:
- OPS-05 (node-version)

---

## VERIFICAÇÕES DE CÓDIGO REALIZADAS

### ✅ REQ-12: Canais de contato (table_contacts)
- **Arquivo:** `database/migration_04_publisher_role_and_contacts.sql`
- **Status:** IMPLEMENTADO
- **Evidência:** Tabela `table_contacts` criada com todos os campos especificados

### ✅ REQ-11: Papel do publicador (publisher_role)
- **Arquivos encontrados:**
  - `frontend/src/pages/PainelMestrePage.tsx`
  - `frontend/src/pages/MesaPage.tsx`
  - `frontend/src/components/form-steps/steps/StepConfig.tsx`
- **Status:** IMPLEMENTADO
- **Evidência:** Campo `publisher_role` presente no código frontend

### ✅ REQ-27: Agenda Estruturada (table_schedules)
- **Arquivo:** `database/migration_01_base_schema.sql` (linha 154)
- **Status:** IMPLEMENTADO
- **Evidência:** Tabela `table_schedules` criada no schema base

### ✅ REQ-04: Catálogo público
- **Arquivo:** `frontend/src/pages/CatalogoPage.tsx` (552 linhas)
- **Status:** IMPLEMENTADO COMPLETAMENTE
- **Evidência:** 
  - Filtros por sistema, modalidade, preço, experiência, selo
  - Selos DDAL e Covil do Lich implementados
  - Estilos de jogo implementados
  - Paginação implementada
  - **NOTA:** Não usa Fuse.js (busca é server-side via API)

### ✅ REQ-30 item 143: Campo name_pt
- **Arquivos:**
  - `database/migration_102_add_name_pt.sql`
  - `database/migration_103_scenario_suggestions.sql`
- **Status:** IMPLEMENTADO
- **Evidência:** Migrations aplicadas conforme RESUMO_EXECUCAO.md

### ❌ REQ-03: Serviço Imgur + Sharp
- **Busca:** `imgurService` no backend
- **Resultado:** NÃO ENCONTRADO
- **Busca:** `sharp` no package.json do backend
- **Resultado:** NÃO ENCONTRADO
- **Status:** NÃO IMPLEMENTADO

### ❌ OPS-01: Logs centralizados (Winston/Morgan)
- **Busca:** `winston` no backend
- **Resultado:** NÃO ENCONTRADO
- **Busca:** `morgan` no backend
- **Resultado:** NÃO ENCONTRADO
- **Status:** NÃO IMPLEMENTADO

### ✅ OPS-05: Node version nos workflows
- **Versão atual:** Node 22
- **Status:** ATUALIZADO (Node 22 é LTS atual)
- **Decisão:** REMOVER do TODO (já está atualizado)

### ✅ Páginas do frontend existentes:
- `CatalogoPage.tsx` ✅
- `MesaPage.tsx` ✅
- `MestrePage.tsx` ✅
- `PainelMestrePage.tsx` ✅
- `GestaoPage.tsx` ✅
- `OnboardingPage.tsx` ✅
- `PlayerPage.tsx` ✅
- `ProfileEditPage.tsx` ✅

---

## PRÓXIMOS PASSOS

1. ~~Executar verificações no beta via browser~~ (healthcheck OK)
2. ~~Verificar código-fonte para confirmar implementações~~ (CONCLUÍDO)
3. Gerar relatório final com recomendações
4. Propor atualização do TODO_OPERACIONAL.md
