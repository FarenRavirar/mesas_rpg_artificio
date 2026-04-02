# Plano Mestre — Anúncios de Mesas RPG (Portal Colaborativo)

> Documento vivo de planejamento e engenharia. Versão 1.0 — consolidado em Março/2026.
>
> **Todo agente de IA que trabalhar neste projeto deve ler este documento na íntegra antes de escrever qualquer linha de código.**
>
> **FONTE ÚNICA DE VERDADE MESTRE:** Este documento define a arquitetura oficial do aplicativo de Anúncios de Mesas RPG do Artifício RPG — uma evolução natural do ecossistema do Grande Glossário de RPG, construída com os mesmos princípios: gratuita, sem anúncios, sem coleta de dados pessoais, feita para a comunidade.

---

## Objetivo

Definir a arquitetura oficial, os contratos estruturais e o plano de execução do **Anúncios de Mesas RPG** — uma plataforma colaborativa full-stack para descoberta, publicação e filtragem de mesas de RPG de mesa, com autopublicação, landing pages de mestre, filtros estruturados, exportação para WhatsApp/Discord e ingestão automática de anúncios externos.

**NATUREZA DESTE PROJETO E ESTRATÉGIA DE LANÇAMENTO:**
1. **Projeto nativo:** Não é um fork de plugin WordPress. É um webapp próprio, construído do zero com a mesma stack e os mesmos princípios do Grande Glossário de RPG.
2. **Ecossistema Artifício:** Compartilha identidade visual, infraestrutura on-premise e filosofia comunitária com o Glossário. Os dois projetos são independentes mas coirmãos.
3. **Lançamento (Beta Permanente):** A aplicação rodará em `mesasbeta.artificiorpg.com` (beta) e `mesas.artificiorpg.com` (produção).
4. **Missão declarada:** Facilitar que qualquer membro da comunidade brasileira de RPG encontre ou divulgue mesas com autonomia, consistência e sem barreiras de acesso.

## Quando ler

Antes de qualquer mudança que afete arquitetura, banco de dados, autenticação, fluxos de moderação, modelo de dados, ingestão automática de fontes externas, estrutura de categorias, deploy ou contratos entre o Front-end e o Back-end (API).

## Não ler quando

Para ajustes estritamente locais de componente sem impacto estrutural, usar as premissas em `AGENTS.md`.

## Pré-requisitos

- `AGENTS.md`

## Procedimento obrigatório antes de qualquer implementação

1. Ler este documento (`ARQUITETURA_PROJETO.md`) na íntegra.
2. Nenhuma alteração de infraestrutura maior deve ser feita sem autorização.
3. Todo código frontend deve respeitar rigorosamente os **Princípios Visuais Inegociáveis**.

---

## 1. Descrição Técnica do Projeto

O **Anúncios de Mesas RPG** é uma plataforma colaborativa e dinâmica construída com React (Front-end) e Node.js + PostgreSQL (Back-end próprio). Atua como ferramenta centralizada de descoberta e publicação de mesas de RPG, combinando autopublicação por mestres com ingestão automática de fontes externas.

Os recursos principais arquitetados incluem:

- **Autopublicação:** Mestres criam e gerenciam landing pages próprias e publicam mesas diretamente na plataforma.
- **Catálogo Público:** Listagem filtrada de mesas com busca por sistema, dia, modalidade, plataforma, tema e mais.
- **Landing Page do Mestre:** Perfil público rico com bio, especialidades, avaliações e lista de mesas ativas.
- **Onboarding de Preferências:** Coleta estruturada de gostos para recomendar mesas e permitir filtros salvos.
- **Módulo de Perguntas e Avaliações:** Comunicação pública entre jogadores interessados e mestres.
- **Painel Administrativo:** Moderação de anúncios, curadoria de fontes externas, gestão de taxonomias.
- **Exportação Formatada:** Geração de texto pronto para colar no WhatsApp ou Discord, com formatação otimizada para cada canal. (será uma feature só depois que as partes de cima tiverem rodando.)
- **Ingestão Automática (AggregatorBot):** Coleta diária de anúncios de fontes externas (Facebook, Reddit, grupos Discord, WhatsApp público), com deduplicação e vínculo opcional a perfis locais. (será uma feature só depois que as partes de cima tiverem rodando.)


---

## 2. Stack Tecnológica

| Componente | Escolha |
|---|---|
| **Framework UI** | React 18 + TypeScript + Vite |
| **Estilização** | Tailwind CSS (Fidelidade ao design system Artifício) |
| **Motor de Busca Client-side** | Fuse.js |
| **Backend (API)** | Node.js + Express |
| **Banco de Dados** | PostgreSQL (Container isolado via Docker on-premise) |
| **Autenticação** | Google OAuth 2.0 (primário) + JWT customizado para sessão |
| **Servidor Web** | Nginx (Docker) servindo build Vite |
| **Agendamento (AggregatorBot)** | Node-cron ou worker dedicado rodando no mesmo compose |

---

## 3. Infraestrutura e Ambientes

| Ambiente | URL | Branch | Container | Porta VM |
|---|---|---|---|---|
| **Beta (Deploy Contínuo)** | `mesasbeta.artificiorpg.com` | `dev` | `mesas-beta-app` | `30302` |
| **Produção** | `mesas.artificiorpg.com` | `main` | `mesas-app` | `80` (interno, via Cloudflare Tunnel) |

---

## 4. Modelo de Dados (Entidades Principais)

### 4.1 Tabelas e Identidades

- `users` — Credenciais, OAuth tokens, role (`visitor`, `player`, `gm`, `admin`), preferências de privacidade.
- `profiles` — Dados públicos do jogador: nome de exibição, bio curta, idiomas, tags.
- `gm_profiles` — Extensão pública do perfil para mestres: banner, bio longa, especialidades, estatísticas acumuladas.
- `systems` — Catálogo de sistemas de RPG (D&D, Pathfinder, Tormenta etc.) com slug.
- `tags` — Taxonomia livre de temas/estilos (Fantasia, Horror, Mistério etc.).
- `platforms` — Plataformas de jogo (Discord, Foundry VTT, Roll20, presencial etc.).
- `tables` — Entidade central do anúncio de mesa (ver 4.2).
- `table_schedules` — Horários recorrentes ou pontuais vinculados a uma mesa.
- `table_platforms` — Relação N:N entre mesas e plataformas.
- `table_tags` — Relação N:N entre mesas e tags.
- `questions` — Perguntas públicas de jogadores sobre uma mesa.
- `answers` — Respostas do mestre a perguntas.
- `reviews` — Avaliações de jogadores após participação.
- `bookmarks` — Mesas salvas por usuários.
- `sources` — Registro de fontes externas para o AggregatorBot.
- `imported_tables` — Anúncios coletados automaticamente antes de deduplicação.
- `user_preferences` — Preferências estruturadas (sistemas, temas, idiomas, plataformas, dias).

### 4.2 Campos Chave em `tables`

| Campo | Descrição |
|---|---|
| `origin` | `manual` (autopublicado) ou `imported` (coletado pelo bot) |
| `status` | `draft` / `active` / `full` / `cancelled` / `ended` / `pending_review` |
| `type` | `campanha`, `one-shot`, `oneshot-serie`, `aberta` |
| `audience` | `livre`, `adultos` |
| `price_type` | `gratuita`, `paga` |
| `price_value` | Valor em BRL (null se gratuita) |
| `price_frequency` | `sessao`, `mes`, `campanha` |
| `slots_total` e `slots_filled` | Vagas totais e preenchidas |
| `language` | Idioma da mesa |
| `modality` | `online`, `presencial`, `hibrida` |
| `source_url` | URL de origem (para anúncios importados) |
| `source_id` | FK para `sources` |
| `gm_id` | FK para `gm_profiles` (null se importado sem vínculo) |
| `system_id` | FK para `systems` |
| `title`, `description`, `cover_url` | Conteúdo editorial da mesa |
| `starts_at` | Data/hora de início |
| `experience_level` | `todos`, `iniciante`, `intermediario`, `veterano` |
| `slug` | Gerado automaticamente via `slugify.ts` |

### 4.3 Automação de Integridade (Slugs)

Todas as entidades estruturais (`systems`, `gm_profiles`, `tables`) possuem geração automática de slugs no Backend via utilitário `slugify.ts`, garantindo URLs amigáveis e unicidade.

### 4.4 Histórico e Rastreabilidade

Alterações de status e campos críticos em `tables` são registradas em `table_history` com `changed_by`, `field`, `old_value`, `new_value` e `changed_at`, permitindo auditoria completa de moderação e importações.

### 4.5 Deduplicação no AggregatorBot

A resolução de anúncios duplicados usa prioridade determinística:
1. Correspondência exata por `source_url`
2. Correspondência por `title` + `gm_name` + `starts_at`
3. Anúncio manual local prevalece sobre importado
4. Entre duplicados importados: mais recente (`updated_at`) vence

---

## 5. Papéis e Permissões (Rotas Privadas API / Middleware JWT)

**Segurança orientada ao Backend é OBRIGATÓRIA.** O Frontend jamais enviará dados diretamente ao banco. Toda mutação e leitura sensível passa por Middlewares de Autenticação na API Node.js.

| Role | Permissões |
|---|---|
| **Visitante Anônimo** | Busca pública, visualização de mesas ativas, perfil público de mestres |
| **Jogador (player)** | Salvar mesas, enviar perguntas, avaliar mesas participadas, gerenciar preferências |
| **Mestre (gm)** | Tudo do jogador + publicar/editar/encerrar mesas próprias, responder perguntas, gerenciar gm_profile |
| **Administrador** | Acesso total ao Painel Administrativo, moderação, gestão de fontes externas, curadoria de taxonomias |

---

## 6. Autenticação e Conta

- **Login principal:** Google OAuth 2.0. É a porta de entrada principal, sem senha local.
- **Sessão:** JWT gerado pelo Backend após handshake OAuth, com refresh token rotativo.
- **Criação de conta:** Automática no primeiro login Google, com onboarding obrigatório de preferências em 3 etapas.
- **Separação de identidade:** A conta Google alimenta apenas o login. O perfil público (`profiles`, `gm_profiles`) é entidade própria controlada pelo usuário.
- **Elevação de role:** Um `player` se torna `gm` ao criar seu primeiro `gm_profile`. A elevação é irreversível via interface (requer admin para reverter).
- **Admin master por e-mail:** O e-mail `paulohenriquercc@gmail.com` deve ser sempre promovido/garantido como role `admin` no Backend durante o login OAuth.

---

## 7. Funcionalidades por Módulo

### 7.1 Home e Descoberta

- Hero com busca ampla por título, sistema ou nome do mestre.
- CTAs diretos para "Buscar Mesas" e "Buscar Mestres".
- Seção de mesas em destaque (curadas pelo admin ou mais bem avaliadas recentemente).
- Navegação pública funciona completamente sem login.

### 7.2 Catálogo de Mesas

Listagem em grid com card denso por mesa, exibindo (nessa ordem):

1. Badge de tipo (`Campanha`, `One-shot`) e audiência (`Livre`, `Adultos`)
2. Cover/banner da mesa
3. Status contextual (`Começa em X dias`, `Falta 1 jogador`, `Mesa confirmada`)
4. Título e sistema
5. Plataformas e tags temáticas
6. Mestre (avatar + nome + avaliação geral)
7. Vagas preenchidas / total
8. Modalidade, preço, periodicidade, data e horário
9. Botão "Ver Detalhes"

**Filtros estruturados disponíveis:** Sistema, Agenda (dia da semana), Modo/Estilo, Tags, Idioma, Plataforma, Tipo (campanha/one-shot), Audiência, Nível de experiência, Preço (gratuita/paga), Modalidade (online/presencial).

### 7.3 Página Individual da Mesa

- Banner/cover no topo
- Breadcrumb de navegação
- Bloco lateral direito: detalhes operacionais (vagas, modalidade, início, periodicidade, dias, idioma, preço) + botão de reserva/interesse + compartilhamento
- Corpo principal com seções: Sobre esta Mesa, Sobre os Jogadores, Sobre a Aventura, Sobre o Sistema, Requisitos para Participar, Tags
- Seção de Perguntas e Respostas (login obrigatório para perguntar)
- Seção de Avaliações
- Botão de exportação para WhatsApp e Discord

### 7.4 Landing Page do Mestre

- Banner/capa customizável
- Avatar, nome, badge de role, data de entrada
- Bio longa
- Idiomas e tags de perfil (streamer, veterano, criador de conteúdo etc.)
- Estatísticas: mesas narradas, avaliação geral, feedbacks recebidos
- Especialidades por sistema (com contagem de mesas)
- Lista de mesas ativas do mestre (usando o mesmo card do catálogo)
- Aba de avaliações recebidas

### 7.5 Onboarding de Preferências (3 Etapas)

**Etapa 1:** Dados básicos do perfil (nome de exibição, bio curta)

**Etapa 2 — Preferências:**
- Sistemas de RPG favoritos (multiselect com busca, obrigatório)
- Temas e estilos preferidos
- Idiomas
- Plataformas preferidas
- Dias da semana disponíveis

**Etapa 3:** Confirmação e redirecionamento.

Preferências alimentam: recomendações na home, filtros pré-salvos, notificações futuras.

### 7.6 Painel do Mestre

- Formulário de criação/edição de mesa com todos os campos de `tables`
- Upload de cover/banner
- Gerenciamento de vagas em tempo real
- Histórico de perguntas recebidas com resposta inline
- Lista de avaliações recebidas
- Edição do `gm_profile`
- Gerador de texto de divulgação (exportação WhatsApp/Discord)

### 7.7 Painel Administrativo

- **Moderação de Mesas Pendentes:** Aprovação/rejeição de anúncios com registro em `table_history`.
- **Gestão de Fontes Externas:** Cadastro e monitoramento de fontes para o AggregatorBot (URL, tipo, frequência, status).
- **Preview de Importação (Dry Run):** Antes de persistir lote importado, exibe preview com detecção de duplicatas.
- **Gestão de Taxonomias:** CRUD de sistemas, tags e plataformas com geração de slug automática.
- **Destaques da Home:** Curadoria manual das mesas exibidas no hero.
- **Workflow de Continuidade:** Modal de moderação suporta estado `stayOpen` para processar múltiplos itens em sequência.

### 7.8 AggregatorBot (Ingestão Automática)

- Serviço Node.js rodando via node-cron no mesmo compose do Backend.
- Coleta diária configurável por fonte.
- Parseia anúncios para o schema de `imported_tables`.
- Executa deduplicação automática (ver 4.5).
- Anúncios não vinculados a perfis locais ficam como `origin=imported`, sem `gm_id`.
- Mestres podem "reivindicar" um anúncio importado, vinculando ao próprio perfil.
- Todos os logs de ingestão registrados com timestamp, fonte e resultado (novo/duplicado/erro).

---

## 8. Exportação WhatsApp e Discord

Ao clicar em "Exportar para WhatsApp" ou "Exportar para Discord", o sistema gera texto formatado automaticamente:

**WhatsApp (sem markdown):**
```
🎲 [TÍTULO DA MESA]
Sistema: [Sistema]
Tipo: [Campanha / One-shot]
Vagas: [X de Y]
Quando: [Dia], [Horário]
Preço: [Gratuita / R$X por mês]
Plataforma: [Plataforma]

[Link da landing page da mesa]
```

**Discord (com markdown):**
```
## 🎲 [TÍTULO DA MESA]
**Sistema:** [Sistema] | **Tipo:** [Campanha / One-shot]
**Vagas:** [X/Y] | **Quando:** [Dia], [Horário]
**Preço:** [Gratuita / R$X] | **Plataforma:** [Plataforma]

🔗 [Link da landing page]
```

---

## 9. Princípios Visuais Inegociáveis (Design System)

Este projeto herda e adapta a identidade visual do Grande Glossário de RPG para o contexto de um catálogo dinâmico.

- **Identidade "Premium RPG Comunitário":** Paleta baseada em `azul-escuro` (#1B2A4A) com `laranja` (#E8521A) como cor de ação primária. Cards e catálogo podem usar fundo escuro (#0F1C36) para ambiente de descoberta imersivo.
- **Cards de Mesa:** Alta densidade informacional com leitura rápida via badges coloridos. Hierarquia visual clara entre título, mestre, vagas e ação.
- **Padrão de Formulário Canônico:**
  - **Cabeçalho de Modal/Seção:** Fundo Azul Escuro, Borda Inferior Laranja (4px), Tipografia *Black Italic Upper*.
  - **Inputs:** Bordas `rounded-xl`, Fundo Branco (light) ou cinza escuro (dark mode), Foco `ring-laranja`.
  - **Labels:** Tipografia `text-[10px] font-black uppercase tracking-widest`.
- **Badges:** Semântica de cor consistente — Verde para status positivo (confirmada, gratuita), Laranja para alerta (falta jogador, começa em breve), Cinza para neutro.
- **Perfil do Mestre:** Tratado como ativo de confiança e vitrine pública. Banner customizável, avatar proeminente, estatísticas visíveis.
- **Filosofia de UX:** Navegação pública funciona sem login. Cadastro só é solicitado no momento de ação (perguntar, salvar, publicar). Sem dark patterns.

---

## 10. Compromissos Públicos (Inegociáveis de Produto)

Estes compromissos foram declarados publicamente no anúncio do projeto e **não podem ser revertidos por nenhuma decisão técnica ou de produto:**

- **100% gratuito** — Nenhuma funcionalidade central será colocada atrás de paywall.
- **Sem anúncios** — Nenhum espaço de publicidade paga na interface, agora ou no futuro.
- **Sem coleta de dados pessoais desnecessária** — Apenas dados estritamente necessários para a função declarada são coletados. Sem tracking de terceiros.
- **Mesas gratuitas e pagas coexistem** — O modelo não discrimina por preço. A plataforma é neutra em relação ao modelo de negócio do mestre.

---

## 11. Tratativa de Rollback ou Falhas

Toda nova implantação deve ser gerada localmente no branch `dev`.
Qualquer falha de build ou erro em runtime deve primeiramente ser catalogada em `ERRORS_SOLUTIONS.md` antes de qualquer looping de reescrita de código pela IA.

### Resgate de Banco e Ambiente Beta

O contêiner de API Node.js só inicializa se conseguir bater porta e sincronizar no PostgreSQL (`mesas-beta-db`). Se o ambiente der tela preta por corrupção de variáveis de ambiente ou o contêiner da API explodir em runtime:

1. Verifique o `docker compose logs` e consulte `ERRORS_SOLUTIONS.md` urgentemente.
2. Use SSH assistido se e somente se métricas do repositório GitHub e os Actions falharem primeiro.
3. O AggregatorBot possui circuit breaker próprio: em caso de falha de conexão com o banco, ele aborta o ciclo de ingestão e registra o erro em log, sem tentar novamente até o próximo ciclo agendado.

### Política de Migrations

- Toda migration de banco deve ser versionada via arquivo sequencial em `db/migrations/`.
- Migrations destrutivas (DROP, ALTER que remove coluna) requerem aprovação explícita e backup prévio.
- O Backend não executa migrations automaticamente em produção — deploy de migration é etapa manual e documentada.

---

## 12. Contratos de API (Rotas Principais)

Referência rápida das rotas estruturais da API. Todas as rotas mutáveis exigem JWT válido no header `Authorization: Bearer <token>`.

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/auth/google` | Inicia handshake OAuth Google |
| `GET` | `/api/v1/auth/google/callback` | Callback OAuth, retorna JWT |
| `POST` | `/api/v1/auth/logout` | Invalida refresh token |
| `GET` | `/api/v1/auth/me` | Retorna perfil do usuário autenticado |

### Mesas
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/tables` | — | Listagem pública com filtros via query params |
| `GET` | `/tables/:slug` | — | Página individual da mesa |
| `POST` | `/tables` | `gm` | Criar nova mesa |
| `PUT` | `/tables/:id` | `gm` (própria) | Editar mesa |
| `PATCH` | `/tables/:id/status` | `gm` / `admin` | Alterar status |
| `POST` | `/tables/:id/bookmark` | `player` | Salvar mesa |
| `POST` | `/tables/:id/export` | — | Gerar texto de exportação |

### Mestres
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/gm/:slug` | — | Perfil público do mestre |
| `POST` | `/gm/profile` | `player` | Criar gm_profile (eleva role) |
| `PUT` | `/gm/profile` | `gm` | Editar gm_profile |

### Perguntas e Avaliações
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/tables/:id/questions` | — | Listar perguntas públicas |
| `POST` | `/tables/:id/questions` | `player` | Enviar pergunta |
| `POST` | `/questions/:id/answer` | `gm` (própria mesa) | Responder pergunta |
| `POST` | `/tables/:id/reviews` | `player` | Avaliar mesa |

### Admin
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/admin/tables/pending` | `admin` | Mesas aguardando moderação |
| `PATCH` | `/admin/tables/:id/moderate` | `admin` | Aprovar ou rejeitar mesa |
| `GET` | `/admin/sources` | `admin` | Listar fontes do AggregatorBot |
| `POST` | `/admin/sources` | `admin` | Cadastrar nova fonte |
| `POST` | `/admin/import/dry-run` | `admin` | Preview de importação em lote |
| `POST` | `/admin/import/commit` | `admin` | Confirmar importação em lote |
| `GET` | `/admin/import/logs` | `admin` | Histórico de ingestões do bot |

---

## 13. Plano de Fases de Desenvolvimento

O projeto é desenvolvido em fases incrementais, priorizando o núcleo funcional público antes dos módulos sociais e de automação.

### Fase 1 — Fundação (MVP Público)
- Setup de infraestrutura (Docker compose, Nginx, PostgreSQL, Node.js, React/Vite)
- Migrations iniciais: `users`, `profiles`, `gm_profiles`, `systems`, `tags`, `platforms`, `tables`, `table_schedules`, `table_platforms`, `table_tags`
- Autenticação Google OAuth completa com onboarding de 3 etapas
- Catálogo público de mesas com filtros estruturados
- Página individual da mesa
- Landing page do mestre
- Painel do mestre: criar e editar mesas
- Exportação WhatsApp e Discord
- Deploy em beta

### Fase 2 — Moderação e Administração
- Painel Administrativo completo
- Fluxo de moderação com `table_history`
- Gestão de taxonomias (sistemas, tags, plataformas)
- Curadoria de destaques da home
- Bookmarks de mesas

### Fase 3 — Engajamento Social
- Módulo de Perguntas e Respostas
- Sistema de Avaliações (`reviews`)
- Notificações básicas (novas respostas, status de mesa)
- Filtros salvos por usuário

### Fase 4 — AggregatorBot
- Serviço de ingestão automática (node-cron)
- Cadastro e monitoramento de fontes externas
- Dry run + commit de importação em lote
- Mecanismo de reivindicação de anúncios importados por mestres locais
- Logs de ingestão no painel admin

### Fase 5 — Crescimento e Estabilização
- Recomendações baseadas em preferências do usuário
- Integração com sistema de notificações por email (vazamentos de vaga, início próximo)
- SEO estruturado (meta tags, sitemap, Open Graph para compartilhamento de mesas)
- Métricas internas de uso no painel admin (sem tracking de terceiros)

---

## 14. Decisões de Arquitetura Registradas

Este bloco documenta decisões tomadas com justificativa, para evitar que sejam revertidas sem consciência do raciocínio original.

| Decisão | Justificativa |
|---|---|
| **Google OAuth como único método de login** | Elimina gerenciamento de senha local, reduz superfície de ataque e simplifica onboarding. Alinha com a proposta de mínima coleta de dados. |
| **AggregatorBot no mesmo compose** | Simplifica deploy e compartilha variáveis de ambiente e rede interna com a API. Worker separado seria custo operacional desnecessário na escala atual. |
| **Fuse.js client-side para busca** | Consistente com o Glossário, mantém zero latência de busca para o usuário. Para volume de mesas esperado na fase inicial, busca client-side é suficiente. Revisitar se ultrapassar 10k registros ativos. |
| **Slug como identificador de URL** | URLs amigáveis e estáveis são essenciais para SEO e compartilhamento social. Slugs são gerados no backend, nunca no frontend. |
| **Separação entre `profiles` e `gm_profiles`** | Nem todo usuário é mestre. Forçar campos de mestre em todos os perfis polui o modelo. A elevação de role é um evento explícito, não automático. |
| **`table_history` desde a fase 1** | Moderação sem rastreabilidade é inauditável. O custo de implementar auditoria depois é sempre maior que implementar desde o início. |
| **Deduplicação determinística no bot** | Evita seleção aleatória de "vencedor" entre duplicatas, garantindo que anúncios manuais do próprio Artifício sempre prevaleçam sobre importados. |

---

## 15. Glossário do Projeto

| Termo | Definição no contexto deste projeto |
|---|---|
| **Mesa** | Anúncio de uma sessão ou campanha de RPG, publicada por um mestre ou importada de fonte externa. Entidade central do produto. |
| **Mestre (GM)** | Usuário com role `gm`, responsável por narrar a mesa. Possui `gm_profile` público. |
| **Jogador** | Usuário com role `player`. Pode buscar, salvar e avaliar mesas, mas não publicar. |
| **AggregatorBot** | Serviço interno de coleta automática de anúncios de fontes externas. |
| **Fonte** | URL ou canal externo monitorado pelo AggregatorBot (ex: grupo do Facebook, subreddit). |
| **Reivindicação** | Ação de um mestre local que vincula um anúncio importado ao próprio `gm_profile`. |
| **Dry Run** | Simulação de importação em lote sem persistir dados, usada para preview e detecção de duplicatas. |
| **Slug** | Identificador textual único gerado a partir do nome da entidade, usado em URLs. |
| **Onboarding** | Fluxo obrigatório de 3 etapas executado no primeiro login para configurar perfil e preferências. |
| **Exportação** | Geração de texto formatado para WhatsApp ou Discord a partir dos dados estruturados de uma mesa. |
.js só inicializa se conseguir bater porta e sincronizar no PostgreSQL (`mesas-beta-db`). Se o ambiente der tela preta por corrupção de variáveis de ambiente ou o contêiner API explodir em runtime:

1. Verifique o `docker compose logs` e consulte `ERRORS_SOLUTIONS.md` urgentemente.
2. Use SSH assistido se e somente se métricas do repositório GitHub e os Actions falharem primeiro.
3. O banco PostgreSQL possui snapshot diário automático. Em caso de corrupção de dados, restaurar o snapshot mais recente antes de qualquer tentativa de reescrita manual.
4. O AggregatorBot possui modo `--dry-run` para diagnóstico sem persistência. Sempre usar dry-run para validar fontes novas antes de ativar coleta real.

---

## 12. Rotas de API — Contrato Estrutural

Todas as rotas seguem o prefixo `/api/v1/`. Nenhum endpoint sensível é acessível sem o header `Authorization: Bearer <jwt>`.

### 12.1 Rotas Públicas (sem autenticação)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/tables` | Listagem paginada de mesas ativas com filtros |
| GET | `/tables/:slug` | Detalhe completo de uma mesa |
| GET | `/gm/:slug` | Landing page pública de um mestre |
| GET | `/systems` | Listagem de sistemas cadastrados |
| GET | `/tags` | Listagem de tags disponíveis |
| GET | `/platforms` | Listagem de plataformas disponíveis |
| GET | `/tables/:slug/questions` | Perguntas e respostas de uma mesa |

### 12.2 Rotas Autenticadas — Jogador (player+)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/me` | Dados do próprio perfil |
| PUT | `/me/preferences` | Atualizar preferências |
| POST | `/tables/:slug/questions` | Enviar pergunta |
| POST | `/tables/:slug/bookmark` | Salvar mesa |
| DELETE | `/tables/:slug/bookmark` | Remover mesa salva |
| POST | `/tables/:slug/reviews` | Avaliar mesa (requer participação) |

### 12.3 Rotas Autenticadas — Mestre (gm+)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/tables` | Criar nova mesa |
| PUT | `/tables/:slug` | Editar mesa própria |
| PATCH | `/tables/:slug/status` | Alterar status (cancelar, encerrar, marcar cheia) |
| POST | `/gm/profile` | Criar gm_profile |
| PUT | `/gm/profile` | Editar gm_profile |
| POST | `/questions/:id/answer` | Responder pergunta |
| GET | `/tables/:slug/export` | Gerar texto de exportação (WhatsApp/Discord) |

### 12.4 Rotas Autenticadas — Administrador

| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/tables/pending` | Mesas aguardando moderação |
| PATCH | `/admin/tables/:id/review` | Aprovar ou rejeitar mesa |
| GET | `/admin/sources` | Listar fontes do AggregatorBot |
| POST | `/admin/sources` | Cadastrar nova fonte |
| PATCH | `/admin/sources/:id` | Editar/ativar/desativar fonte |
| POST | `/admin/aggregator/run` | Disparar coleta manual |
| GET | `/admin/aggregator/preview` | Dry-run de importação |
| GET | `/admin/systems` | CRUD de sistemas |
| POST | `/admin/systems` | Criar sistema |
| PUT | `/admin/systems/:id` | Editar sistema |
| POST | `/admin/featured` | Atualizar mesas em destaque da home |

---

## 13. Estrutura de Diretórios (Frontend)

```
src/
├── assets/             # Imagens, ícones estáticos
├── components/
│   ├── ui/             # Componentes base: Button, Badge, Input, Modal
│   ├── table/          # TableCard, TableDetail, TableFilters
│   ├── gm/             # GmProfileCard, GmBanner, GmStats
│   ├── layout/         # Header, Footer, Sidebar
│   └── admin/          # PainelModeração, FontesList, TaxonomiaEditor
├── pages/
│   ├── Home.tsx
│   ├── Catalog.tsx
│   ├── TableDetail.tsx
│   ├── GmProfile.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard/
│   │   ├── GmDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── Auth/
│       └── Callback.tsx    # Handler do OAuth Google
├── hooks/              # useSearch, useFilters, useAuth, useBookmarks
├── services/           # api.ts (axios instance), auth.ts, export.ts
├── store/              # Zustand ou Context para estado global
├── types/              # Interfaces TypeScript alinhadas ao modelo de dados
└── utils/
    ├── slugify.ts
    ├── formatExport.ts  # Gerador de texto WhatsApp/Discord
    └── dateHelpers.ts
```

### Estrutura de Diretórios (Backend)

```
src/
├── routes/
│   ├── public/         # tables.ts, gm.ts, systems.ts
│   ├── player/         # bookmarks.ts, questions.ts, reviews.ts
│   ├── gm/             # dashboard.ts, tableCrud.ts
│   └── admin/          # moderation.ts, sources.ts, aggregator.ts
├── middleware/
│   ├── auth.ts         # Verificação JWT
│   └── requireRole.ts  # Guard de permissão por role
├── services/
│   ├── aggregator/
│   │   ├── index.ts    # Orquestrador do AggregatorBot
│   │   ├── sources/    # Parsers por tipo de fonte
│   │   └── dedup.ts    # Lógica de deduplicação
│   ├── export.ts       # Gerador de texto de divulgação
│   └── slug.ts         # slugify.ts compartilhado
├── db/
│   ├── migrations/     # Arquivos SQL de migração versionados
│   ├── seeds/          # Seeds de sistemas, tags, plataformas iniciais
│   └── index.ts        # Pool de conexão PostgreSQL
└── utils/
    └── logger.ts
```

---

## 14. Fluxos Críticos Documentados

### 14.1 Publicação de Mesa por Mestre

```
Mestre preenche formulário
  → Frontend valida campos obrigatórios
  → POST /api/v1/tables (com JWT)
  → Backend valida role=gm
  → Backend gera slug via slugify.ts
  → Insere em tables com status=draft
  → Se admin aprova → status=active
  → Mesa aparece no catálogo público
```

### 14.2 Ingestão pelo AggregatorBot

```
node-cron dispara coleta (diária ou manual)
  → Para cada fonte ativa em sources:
      → Parser específico extrai anúncios brutos
      → Normaliza para schema de imported_tables
      → Executa deduplicação (ver 4.5)
      → Insere novos como status=pending_review
      → Registra log (novo/duplicado/erro)
  → Admin vê fila no painel e modera
```

### 14.3 Reivindicação de Anúncio Importado por Mestre

```
Mestre encontra mesa importada que é sua
  → Clica em "Esta mesa é minha"
  → Backend vincula gm_id ao registro
  → Mestre pode editar, atualizar vagas e encerrar
  → origin permanece=imported para rastreabilidade
```

### 14.4 Exportação para WhatsApp/Discord

```
Usuário clica em "Exportar"
  → GET /api/v1/tables/:slug/export?channel=whatsapp
  → Backend monta template com dados da mesa
  → Retorna texto formatado
  → Frontend exibe modal com texto + botão "Copiar"
```

---

## 15. Variáveis de Ambiente Obrigatórias

Todas as variáveis devem estar definidas no `.env` de cada ambiente. **Nunca commitar `.env` no repositório.**

```env
# Banco de Dados
DATABASE_URL=postgresql://user:pass@mesas-beta-db:5432/mesas

# Autenticação
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=https://mesasbeta.artificiorpg.com

# AggregatorBot
AGGREGATOR_CRON_SCHEDULE="0 6 * * *"   # Roda todo dia às 6h
AGGREGATOR_DRY_RUN=false
```

---

Aqui está o trecho novo. **Insira como nova seção `## 16. Gestão de Imagens e Integração Imgur`**, logo após o Glossário (seção 15), no final do documento.

---

## 16. Gestão de Imagens e Integração Imgur

### 16.1 Princípio Geral

Imagens do ecossistema do projeto são divididas em duas categorias com tratamentos distintos:

**Imagens estáticas do site** (logos, ícones, ilustrações de UI) — servidas diretamente pelo Nginx a partir do build do Vite. Nunca vão para o Imgur.

**Imagens de conteúdo gerado por usuários** — processadas na Oracle, convertidas para WebP e hospedadas no Imgur via API. São elas:
- Banners de mesas (`tables.cover_url`)
- Avatar e banner do perfil do mestre (`gm_profiles.avatar_url`, `gm_profiles.banner_url`)

### 16.2 Pipeline de Upload (Oracle → Imgur)

Todo upload de imagem de conteúdo segue este fluxo, executado integralmente no Backend (nunca no Frontend):

```
[Cliente envia imagem] 
    → API Node.js recebe o arquivo via multipart/form-data
    → Sharp converte para WebP (qualidade 85, resize proporcional com limite de 1280px de largura)
    → Buffer WebP é enviado para a API do Imgur via POST /image (base64)
    → Imgur retorna { link, deletehash, id }
    → Backend salva no banco: link (URL pública), deletehash (para exclusão futura), imgur_id
    → URL pública do Imgur é retornada ao Frontend e gravada no campo correspondente
```

**Dependências no Backend:**
- `sharp` — conversão e resize para WebP
- `axios` ou `node-fetch` — chamadas à API do Imgur
- Variável de ambiente `IMGUR_CLIENT_ID` — obrigatória, nunca exposta ao Frontend

### 16.3 Campos de Banco Adicionais

Para suportar o ciclo de vida das imagens, os seguintes campos devem estar presentes:

**Em `tables`:**
| Campo | Tipo | Descrição |
|---|---|---|
| `cover_url` | `TEXT` | URL pública do Imgur |
| `cover_deletehash` | `TEXT` | Hash de exclusão (privado, nunca exposto na API pública) |
| `cover_imgur_id` | `TEXT` | ID da imagem no Imgur |

**Em `gm_profiles`:**
| Campo | Tipo | Descrição |
|---|---|---|
| `avatar_url` | `TEXT` | URL pública do Imgur |
| `avatar_deletehash` | `TEXT` | Hash de exclusão |
| `avatar_imgur_id` | `TEXT` | ID da imagem |
| `banner_url` | `TEXT` | URL pública do Imgur |
| `banner_deletehash` | `TEXT` | Hash de exclusão |
| `banner_imgur_id` | `TEXT` | ID da imagem |

### 16.4 Política de Expiração e Exclusão

**Banners de mesas** possuem ciclo de vida vinculado ao status da mesa:

Quando o status de uma mesa transitar para `ended` ou `cancelled`, um job de limpeza executa automaticamente a exclusão da imagem no Imgur via `DELETE /image/{deletehash}`. Após confirmação de exclusão bem-sucedida, os campos `cover_url`, `cover_deletehash` e `cover_imgur_id` são zerados no banco.

**Imagens de mestres** (avatar e banner do `gm_profile`) **não possuem expiração automática**. Só são excluídas do Imgur quando o mestre faz upload de uma nova imagem (substituição) — neste caso, a imagem anterior é deletada do Imgur antes de persistir a nova — ou quando a conta do mestre é encerrada por um administrador.

### 16.5 Job de Limpeza (CleanupWorker)

Rodando via node-cron junto ao AggregatorBot, o `CleanupWorker` executa diariamente:

```
1. Busca no banco todas as mesas com status = 'ended' OR 'cancelled' 
   onde cover_deletehash IS NOT NULL
2. Para cada mesa: chama DELETE /image/{deletehash} na API do Imgur
3. Se resposta 200: zera cover_url, cover_deletehash, cover_imgur_id no banco
4. Se resposta 404 (já deletada): zera os campos no banco sem erro
5. Se falha de rede: registra em log e tenta novamente no próximo ciclo
6. Registra resultado de cada operação em tabela imgur_cleanup_log
```

**Tabela `imgur_cleanup_log`:**
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID` | PK |
| `entity_type` | `TEXT` | `table` ou `gm_profile` |
| `entity_id` | `UUID` | FK da entidade |
| `imgur_id` | `TEXT` | ID da imagem deletada |
| `status` | `TEXT` | `success`, `not_found`, `error` |
| `attempted_at` | `TIMESTAMPTZ` | Timestamp da tentativa |
| `error_detail` | `TEXT` | Mensagem de erro se houver |

### 16.6 Limites e Regras de Upload

- **Tamanho máximo aceito pelo Backend:** 10MB por arquivo (antes da conversão WebP)
- **Formatos aceitos na entrada:** JPEG, PNG, WebP, AVIF, GIF (estático — GIF animado é rejeitado)
- **Saída sempre em WebP**, qualidade 85, largura máxima 1280px, altura proporcional
- **Uma imagem por campo por vez:** ao substituir, a anterior é deletada do Imgur antes do novo upload
- **Imgur Client ID** deve ser de aplicação registrada como anônima (anonymous upload) para não exigir OAuth do usuário final
- **Rate limit do Imgur:** respeitar o limite de 1250 uploads por dia por Client ID. Em caso de `429`, o Backend deve retornar erro claro ao usuário e não tentar novamente na mesma requisição

### 16.7 Segurança

- `cover_deletehash`, `avatar_deletehash` e `banner_deletehash` são campos **nunca retornados por nenhuma rota pública da API**. Ficam restritos ao Backend e ao painel admin.
- O `IMGUR_CLIENT_ID` é variável de ambiente obrigatória, listada no `.env.example` sem valor real.
- Uploads são processados apenas por usuários autenticados com role `gm` (para imagens de mesa e perfil de mestre) ou `admin`.


## 17. Referências e Documentos Relacionados

| Documento | Finalidade |
|---|---|
| `AGENTS.md` | Instruções de comportamento para agentes de IA no projeto |
| `ERRORS_SOLUTIONS.md` | Registro de erros conhecidos e suas soluções |
| `CHANGELOG.md` | Histórico de versões e mudanças relevantes |
| `docker-compose.yml` | Definição dos serviços: API, PostgreSQL, Nginx, AggregatorBot |
| `arvores_de_sistemas.md` | precisa ser copiado manualmente para o container após rebuild: `scp ... faren:/tmp/ && docker cp /tmp/arvores_de_sistemas.md mesas-beta-api:/app/`. O arquivo não é copiado automaticamente pelo estágio `production` do Dockerfile ainda.
---

> **Lembre-se:** Este é um presente do Artifício RPG para a comunidade brasileira de RPG.
> Gratuito · Sem anúncios · Sem coleta de dados · Feito com ♥ pela comunidade.