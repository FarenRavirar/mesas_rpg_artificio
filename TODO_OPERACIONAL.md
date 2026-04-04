# TODO Operacional — Anúncios de Mesas RPG

> Backlog vivo de melhorias, correções e débitos técnicos acumulados. Este documento é a bússola operacional primária para agentes não engajados em features de arquitetura mestre.

## Status Atual: FASE 1 CONCLUÍDA — Em desenvolvimento Fases 2 e 3 (Catálogo Público e Painel do Mestre)

> [!IMPORTANT]
> **REGRA DE ATUALIZAÇÃO:** Todo agente que fechar uma issue abaixo deve removê-la e mover para a seção "Concluídos Recentes". Se identificar uma nova dívida técnica, DEVE registrá-la aqui com uma estimativa GUT.

> [!CAUTION]
> ⚠️ **Fases 6 e 7 bloqueadas** até Fases 1–5 validadas em beta. Ver fases detalhadas em `FILA_IMPLEMENTACAO.md`.

---

## 1. Backlog de Ações Imediatas (Prioridade Alta)

| ID | GUT | Descrição | Status | Observação |
|---|---|---|---|---|
| REQ-02 | 5/5/5 | **Schema inicial do banco e API base (Fase 1):** Migrations de todas as tabelas base + setup Express + autenticação Google OAuth + JWT. | **Concluído** | OAuth funcional no beta. Kysely configurado. Middlewares de role operantes. Ver `FILA_IMPLEMENTACAO.md` lote `fundacao-schema-auth`. |
| REQ-03 | 5/5/4 | **Serviço de imagens Imgur + Sharp (Fase 1):** Implementar pipeline completo de upload — receber imagem, converter para WebP via Sharp, enviar ao Imgur, salvar `url`/`deletehash`/`imgur_id` no banco. | Em aberto | `IMGUR_CLIENT_ID` nunca exposto no Frontend. `deletehash` nunca retornado em rotas públicas. Ver `ARQUITETURA_PROJETO.md` seção 16. |
| REQ-04 | 4/5/4 | **Catálogo público com filtros estruturados (Fase 2):** Listagem em grid com card denso, painel de filtros por sistema/dia/tipo/audiência/plataforma/tag/preço/modalidade/nível, busca por Fuse.js e suporte à taxonomia em árvore (`sistema > edição > variante`) com aliases pesquisáveis. | Em validação beta | Implementação local concluída com filtro por selo (`ddal`, `covil-do-lich`) e árvore hierárquica. Pendente validação final pós-deploy em `dev`. |
| REQ-05 | 4/5/4 | **Landing page pública do mestre (Fase 2):** Perfil rico com banner, avatar, bio, especialidades por sistema, estatísticas, lista de mesas ativas e exibição de selos oficiais de parceria/programa. | Em validação beta | Rota pública e frontend atualizados com metadados DDAL em mesas ativas; manter política de não exposição de `deletehash`. |
| REQ-06 | 4/4/4 | **Painel do mestre com autopublicação (Fase 3):** Formulário de criação/edição de mesa, upload de cover via `imgurService`, gerenciamento de vagas, edição de `gm_profile`. | Em validação beta | Bloco DDAL condicional por caminho `dungeons-dragons/5e/2024` implementado no frontend + validação hard no backend. |
| REQ-07 | 4/4/4 | **Painel administrativo e moderação (Fase 4):** Fila de mesas pendentes com aprovação/rejeição, CRUD de taxonomias com slugs automáticos, curadoria de destaques da home. | Em aberto | Depende da estabilização das entregas públicas e do painel do mestre já em validação beta. Ver seção 7.7. |
| REQ-08 | 5/5/5 | **Diferenciação Visual de Papéis de Usuário (Admin, GM, Player):** Implementar lógicas condicionais no Frontend. O _Admin_ (`paulohenriquercc@gmail.com`) precisa de abas e controles globais de curadoria; o _Mestre/GM_ precisa de controles de escopo próprio nas suas mesas e aba de publicação; o _Player_ apenas visualiza e altera próprio perfil de jogador. | Parte Pronta | Lógica de bypass no Backend já inserida em `auth.ts` para o admin-master. É necessário transpor os escopos visuais completos para o FrontEnd futuramente. |
| REQ-09 | 5/4/4 | **Selos oficiais Covil do Lich + DDAL (Fase 2/3):** Implementar política de atribuição e exibição dos selos no backend/frontend. `covil_do_lich` para mestres/mesas da parceria; `ddal` somente para mesa vinculada ao caminho `D&D > D&D 5e > D&D 2024`, com validação obrigatória de `codigo`, `nome` e `tier`. | Em validação beta | Backend e frontend implementados e deployados em beta (persistência, filtro `seal`, badges e metadados DDAL). `systemsTreeImport` já executado no beta; foco atual em QA E2E completo (REQ-13). |
| REQ-10 | 4/4/3 | **Layout global da aplicação (Fase 2):** Header sticky sempre disponível em qualquer rota/etapa e footer institucional unificado em todo o frontend. | **Concluído** | `AppShell` aplicado em todas as rotas com `SiteHeader` + `SiteFooter`, removendo duplicação por página. |
| REQ-11 | 4/5/4 | **Papel do publicador da mesa (anunciante vs mestre):** Quem publica uma mesa pode ser o próprio mestre que vai narrá-la, ou apenas um anunciante divulgando a mesa de outro mestre. O campo `publisher_role` (enum: `gm` \| `announcer`) deve ser adicionado à tabela `tables`. Quando `publisher_role = 'announcer'`, o campo `actual_gm_name TEXT` (nome do mestre real, texto livre) deve ser preenchido. **Selo visual obrigatório:** quando `publisher_role = 'announcer'`, exibir um selo discreto e bem posicionado com o texto "Apenas Anunciante" no card do catálogo (canto ou rodapé do card) e na página da mesa (próximo ao nome do publicador). O selo deve comunicar claramente que o publicador não é o mestre que vai narrar — sem julgamento de valor, apenas informativo. Estilo sugerido: badge neutro (cor cinza/secundária, ícone de megafone ou similar), diferente dos selos de parceria (Covil, DDAL) que têm cor e destaque próprios. | Em validação beta | Migration_04 aplicada no beta + backend/frontend deployados em `dev`. Pendente QA E2E com caso real `publisher_role = announcer` e validação visual do selo em catálogo/detalhe. |
| REQ-12 | 5/5/5 | **Canais de contato e recrutamento obrigatórios na mesa:** Toda mesa deve ter ao menos um canal preenchido. Canais suportados: WhatsApp (número/link), Discord (username/link de DM), Telefone, E-mail, Facebook (link), Instagram (handle/link), Formulário/outro link genérico. **Detalhe Discord:** quando o canal for `discord`, há um segundo campo opcional `discord_server_url` (link de convite do servidor) — exibido como alternativa caso o contato direto não seja possível, com texto sugerido "Não conseguiu contato? Entre no servidor e procure o usuário". **Modelo de dados:** tabela `table_contacts` com colunas `id UUID PK`, `table_id UUID FK tables(id) ON DELETE CASCADE`, `channel TEXT NOT NULL` (enum: `whatsapp`, `discord`, `phone`, `email`, `facebook`, `instagram`, `form`), `value TEXT NOT NULL` (username/número/link principal), `extra_url TEXT NULL` (usado apenas em `discord` para link do servidor), `label TEXT NULL` (rótulo opcional), `sort_order SMALLINT DEFAULT 0`. **Regra de negócio:** backend rejeita publicação (`status = active`) sem ao menos um contato; `extra_url` só é persistido quando `channel = 'discord'`. Frontend exibe os canais na página da mesa e no formulário do painel. | Em validação beta | Migration_04 aplicada no beta + fluxo de contatos deployado em `dev`. Pendente QA E2E de criação/edição/publicação ativa com contatos obrigatórios e exibição pública. |
| REQ-13 | 5/5/5 | **QA de primeira publicação real (roteiro do responsável):** Validar o fluxo completo no beta como usuário anunciante: (1) onboarding — preferências de sistemas, dias e plataformas; (2) criação de perfil de mestre; (3) publicação de mesa como `publisher_role = announcer` com nome do mestre real; (4) upload de imagem de cover e avatar; (5) canais de contato na mesa; (6) visualização pública no catálogo e na página da mesa; (7) selos DDAL/Covil visíveis quando aplicáveis. **Saída esperada:** lista de gaps encontrados → registrar cada um como novo REQ no backlog antes de iniciar implementação. | Em validação pelo responsável | Beta ao vivo em `mesasbeta.artificiorpg.com`. REQ-11 e REQ-12 já deployados; manter foco da validação nos fluxos reais de anunciante, contatos obrigatórios e Imgur (REQ-03). |
| REQ-14 | 5/5/4 | **Importador manual de mesas via JSON (lote, com nick Discord):** Implementar contrato versionado (`schema_version`) para ingestão em lote por admin (`dry-run` e `commit`), com idempotência (`source` + `external_id`), resolução por `gm_slug` e `system_path_slug`, suporte a `publisher_role`/`actual_gm_name`, `contacts[]` e validação de contato `discord` com nick em `value` quando exigido no lote. Deve gerar relatório por item (`created`, `updated`, `failed`) e impedir persistência parcial fora de transação por item. | Planejado | Escopo documental fechado e pronto para execução sob chamada futura do responsável. Dependências: Fases 1–5 estáveis e endpoints admin de importação ativos. |
---

## 2. Dívida Técnica (Melhorias de Médio Prazo)

| ID | GUT | Descrição | Status | Observação |
|---|---|---|---|---|
| DEB-01 | 3/4/3 | **Engajamento social (Fase 5):** Tabelas e endpoints de `questions`, `answers`, `reviews`, `bookmarks`. UI de Q&A e avaliações nas páginas de mesa. | Em aberto | Só após Fases 1–4 estáveis. As seções ficam como placeholder visual até então. |
| DEB-02 | 2/3/3 | **Paginação e performance do catálogo:** Avaliar paginação server-side ou cursor-based se volume de mesas ativas ultrapassar escala confortável para Fuse.js client-side. | Em aberto | Revisitar quando houver dados reais de volume. Fuse.js é suficiente para fase inicial. |
| DEB-03 | 2/3/2 | **SEO estruturado:** Meta tags, Open Graph e sitemap para páginas de mesa e landing pages de mestres — importantes para compartilhamento social e descoberta orgânica. | Em aberto | Implementar junto ou logo após a Fase 2. |
| DEB-04 | 2/2/3 | **Onboarding revisitável:** Permitir que usuário retorne ao fluxo de preferências após o onboarding inicial para atualizar sistemas, dias e plataformas favoritas. | Em aberto | UX secundária — não bloqueia nada. |

---

## 3. Tarefas de DevOps e Observabilidade

| ID | GUT | Descrição | Status | Observação |
|---|---|---|---|---|
| OPS-01 | 4/4/4 | **Logs centralizados na API Node.js (Morgan/Winston):** Essencial para diagnosticar falhas do AggregatorBot e do CleanupWorker quando forem ativados na Fase 7. | Planejado | Implementar desde a Fase 1 para não acumular débito de observabilidade. |
| OPS-02 | 5/5/4 | **Backup diário automático Oracle → Google Drive (retenção 3):** Rotina agendada para exportar dump completo do banco (`mesas-db` e `mesas-beta-db`) para pasta dedicada no Drive, mantendo somente os 3 backups mais recentes. | Planejado | Sem versionar dumps no GitHub. Usar rotação automática, log de execução e teste de restauração mensal. Herdado do padrão do Glossário. |
| OPS-03 | 3/3/3 | **Script local de dump do PostgreSQL:** Backup pontual e manual do banco para uso em diagnósticos e promoção beta → prod. | Em aberto | — |
| OPS-04 | 2/2/3 | **Monitoramento de rate limit do Imgur:** Alertar no log quando o CleanupWorker ou o serviço de upload se aproximar do limite de 1250 uploads/dia do Client ID. | Em aberto | Implementar junto com a Fase 7. Limite documentado em `ARQUITETURA_PROJETO.md` seção 16.6. |
| OPS-05 | 2/2/2 | **Atualizar `node-version` nos workflows:** Manter versão LTS ativa nos arquivos `deploy-beta.yml` e `deploy-production.yml`. Revisar antes de qualquer LTS entrar em end-of-life no GitHub Actions. | Em aberto | Os workflows já existem; revisar periodicamente a versão configurada e atualizar quando necessário. |

---

## Concluídos Recentes

_31/03/2026_
- [x] **REQ-01 (Fase 0):** Repositório criado, secrets configurados, Oracle `mesas-beta` populado, arquivos `.env` presentes, Cloudflare funcionando e scaffolds de React+Node iniciados em `.dev`.
