# Plano Mestre — Anúncios de Mesas RPG (Portal Colaborativo)

> Documento vivo de arquitetura. Versão 1.1 — atualizado em Abril/2026.
>
> **Leitura seletiva por seção — não ler na íntegra.** Consultar apenas a seção indicada por `GUIA_RAPIDO_OPERACIONAL.md` para o cenário da tarefa.
> Seções de referência rápida: §4 banco · §5 roles · §6 auth · §9 visual · §10 compromissos · §12 rotas · §16 imagens.
>
> **Fonte canônica de arquitetura.** Em conflito com qualquer outro arquivo, este prevalece.

---

## Objetivo

Definir a arquitetura oficial, os contratos estruturais e o plano de execução do **Anúncios de Mesas RPG** — uma plataforma colaborativa full-stack para descoberta, publicação e filtragem de mesas de RPG de mesa, com autopublicação, landing pages de mestre, filtros estruturados, exportação para WhatsApp/Discord e ingestão automática de anúncios externos.

**NATUREZA DESTE PROJETO E ESTRATÉGIA DE LANÇAMENTO:**
1. **Projeto nativo:** Não é um fork de plugin WordPress. É um webapp próprio, construído do zero com a mesma stack e os mesmos princípios do Grande Glossário de RPG.
2. **Ecossistema Artifício:** Compartilha identidade visual, infraestrutura on-premise e filosofia comunitária com o Glossário. Os dois projetos são independentes mas coirmãos.
3. **Ambientes previstos:** O beta roda em `mesasbeta.artificiorpg.com` e a produção permanece prevista para `mesas.artificiorpg.com`, ainda não publicada operacionalmente nesta rodada.
4. **Missão declarada:** Facilitar que qualquer membro da comunidade brasileira de RPG encontre ou divulgue mesas com autonomia, consistência e sem barreiras de acesso.

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

---

## 3. Infraestrutura e Ambientes

| Ambiente | URL | Branch | Container | Exposição atual |
|---|---|---|---|---|
| **Beta (Deploy Contínuo)** | `mesasbeta.artificiorpg.com` | `dev` | `mesas-beta-frontend` | Cloudflare Tunnel via `mesas-beta-frontend:80`, sem porta pública dedicada no host |
| **Produção** | `mesas.artificiorpg.com` | `main` | `mesas-app` | Ainda não publicada operacionalmente nesta rodada |

### 3.1 Credenciais e Nomes Canônicos do PostgreSQL

> **Fonte de verdade para qualquer comando `psql`, dump, migration ou diagnóstico remoto.**

| Parâmetro | Beta | Produção |
|---|---|---|
| Container DB | `mesas-beta-db` | `mesas-db` |
| `POSTGRES_USER` | `admin` | `admin` |
| `POSTGRES_DB` | `mesas_rpg` | `mesas_rpg` |
| Porta interna | `5432` | `5432` |

Comando padrão de acesso no beta:
```bash
docker exec mesas-beta-db psql -U admin -d mesas_rpg
```

Para confirmar credenciais em runtime (nunca assume o compose como única fonte):
```bash
docker exec mesas-beta-db env | grep POSTGRES
```

> [!CAUTION]
> O banco **não se chama `mesas`** — o nome correto é `mesas_rpg`. Usar `-d mesas` resulta em `FATAL: database "mesas" does not exist`. Ver também `ERRORS_SOLUTIONS.md` E059.

### 3.2 Ambiente de Desenvolvimento Local (Localhost)

> **Palavras-chave para busca:** localhost, desenvolvimento local, túnel SSH, ambiente dev, rodar localmente, testar local, backend local, frontend local, proxy vite, conexão banco local

**Objetivo:** Rodar frontend e backend localmente conectados ao banco de dados beta via túnel SSH para desenvolvimento e testes com dados reais.

#### 3.2.1 Arquitetura do Ambiente Local

```
Frontend (localhost:5173)
    ↓ Proxy Vite (/api/* → localhost:3000)
Backend (localhost:3000)
    ↓ DATABASE_URL (localhost:5432)
Túnel SSH (porta 5432)
    ↓ Encaminha para container remoto
PostgreSQL Beta (172.18.0.9:5432 no servidor Oracle)
```

#### 3.2.2 Pré-requisitos

1. **Node.js** instalado (versão compatível com o projeto)
2. **SSH** configurado com chave privada para acesso ao servidor Oracle
3. **Credenciais do banco beta** (disponíveis em `C:\projetos\Secrets`)

#### 3.2.3 Configuração do Backend Local

**Arquivo:** `backend/.env`

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados PostgreSQL (beta - via túnel SSH)
# Senha: MesasRPG#2026!Xk9vPq (URL-encoded)
DATABASE_URL=postgresql://admin:MesasRPG%232026%21Xk9vPq@localhost:5432/mesas_rpg

# Autenticação JWT
JWT_SECRET=mesas_rpg_jwt_secret_super_seguro_2026_minimo_32_caracteres_aqui

# Frontend URL (para redirect após OAuth)
FRONTEND_URL=http://localhost:5173

# Google OAuth (NECESSÁRIO CONFIGURAR para testar login)
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Imgur API (NECESSÁRIO CONFIGURAR para testar upload de imagens)
IMGUR_CLIENT_ID=seu_imgur_client_id_aqui

# Discord OAuth (integração perfil mestre)
DISCORD_CLIENT_ID=1490592397950976162
DISCORD_CLIENT_SECRET=-y9qOC4ICxVJ2l-iM9n81m110chyaNWH
DISCORD_GUILD_ID=1258189767720304672
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
```

**Notas importantes:**
- A senha do PostgreSQL **deve ser URL-encoded** (`#` → `%23`, `!` → `%21`)
- Credenciais completas estão em `C:\projetos\Secrets\senha docker producao posgress.txt`
- Google OAuth e Imgur são **opcionais** para desenvolvimento (funcionalidades relacionadas não funcionarão sem configuração)

#### 3.2.4 Configuração do Frontend Local

**Arquivo:** `frontend/vite.config.local.ts` (criar manualmente, não versionado)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuração LOCAL para desenvolvimento
// Este arquivo NÃO deve ser versionado no Git

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**Função do proxy:** Redireciona todas as requisições `/api/*` do frontend para o backend local, evitando problemas de CORS.

**Nota importante:** O arquivo `vite.config.ts` versionado **não contém** configuração de proxy para não interferir nos builds de produção. O arquivo `vite.config.local.ts` é ignorado pelo Git e usado apenas para desenvolvimento local.

#### 3.2.5 Túnel SSH para PostgreSQL

**Problema:** Os containers PostgreSQL no servidor Oracle **não expõem portas públicas**. Eles rodam em rede Docker interna.

**Solução:** Criar túnel SSH que encaminha porta local `5432` para o IP interno do container beta.

**Passo 1 — Obter IP do container beta:**

```bash
ssh -i "C:/projetos/gerenciador_telegram/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker inspect mesas-beta-db --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"
```

**Resultado esperado:** `172.18.0.9` (pode variar se container for recriado)

**Passo 2 — Criar túnel SSH:**

```bash
ssh -L 5432:172.18.0.9:5432 -i "C:/projetos/gerenciador_telegram/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231
```

**O que esse comando faz:**
- `-L 5432:172.18.0.9:5432` — Mapeia porta local 5432 para porta 5432 do container remoto
- Mantém conexão SSH ativa em background
- Permite que `localhost:5432` acesse o PostgreSQL beta

**Nota:** O túnel deve permanecer ativo durante todo o desenvolvimento. Se a conexão SSH cair, o backend perderá acesso ao banco.

#### 3.2.6 Iniciar Ambiente Local

**Terminal 1 — Túnel SSH:**
```bash
ssh -L 5432:172.18.0.9:5432 -i "C:/projetos/gerenciador_telegram/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev -- --config vite.config.local.ts
```

**Nota:** O parâmetro `--config vite.config.local.ts` é necessário para usar a configuração local com proxy. Sem ele, o frontend usará `vite.config.ts` (sem proxy) e as requisições `/api` falharão.

**Verificação:**
- Backend: `http://localhost:3000` (deve responder "Cannot GET /")
- Frontend: `http://localhost:5173` (deve carregar catálogo com dados reais)

#### 3.2.7 Problemas Comuns

**Erro: "Database connection failed"**
- Verificar se túnel SSH está ativo
- Confirmar IP do container: `docker inspect mesas-beta-db`
- Verificar credenciais no `.env` (senha URL-encoded)

**Erro: "password authentication failed"**
- Senha no `.env` está incorreta ou não está URL-encoded
- Confirmar senha real: `docker exec mesas-beta-db env | grep POSTGRES`

**Imagens não carregam (404)**
- URLs do Discord **expiram** (contêm tokens temporários `ex=`, `is=`, `hm=`)
- Fallback (dado 🎲) deve aparecer automaticamente
- Solução permanente: re-upload para Imgur (conforme arquitetura §16)

**Frontend não conecta ao backend**
- Verificar se proxy está configurado no `vite.config.ts`
- Reiniciar dev server do frontend após alterar `vite.config.ts`
- Verificar se backend está rodando na porta 3000

**Health check retorna 500**
- Problema conhecido (não crítico)
- Não afeta funcionalidade principal da aplicação
- Rotas de dados (`/api/v1/tables`, `/api/v1/systems`) funcionam normalmente

#### 3.2.8 Limitações do Ambiente Local

**Funcionalidades que NÃO funcionam sem configuração adicional:**
- ❌ Login com Google OAuth (requer `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`)
- ❌ Upload de imagens (requer `IMGUR_CLIENT_ID`)
- ❌ Integração Discord (opcional, não essencial para desenvolvimento)

**Funcionalidades que funcionam normalmente:**
- ✅ Catálogo de mesas com dados reais
- ✅ Página de detalhes de mesa
- ✅ Filtros e busca
- ✅ CTA inteligente (Discord/WhatsApp direto)
- ✅ Painel de gestão (se usuário estiver autenticado)
- ✅ Todas as alterações de código (hot reload)

#### 3.2.9 Dados de Teste

**Banco beta contém:**
- 4 mesas de teste
- Sistemas reais (D&D 5e 2024, Fabula Ultima, 2300 AD)
- Cenários e tags
- Usuários e perfis de mestre

**Nota sobre imagens:**
- Mesas de teste têm URLs do Discord que **expiraram**
- Fallback (dado 🎲) funciona corretamente
- Para testar upload de imagens, configurar `IMGUR_CLIENT_ID`

#### 3.2.10 Alternativa: Testar Direto no Beta

Se configurar ambiente local for complexo, testar diretamente em:

**https://mesasbeta.artificiorpg.com**

- Backend já está rodando
- Banco de dados já está conectado
- Todas as funcionalidades disponíveis
- Deploy automático via GitHub Actions (branch `dev`)

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
- `system_suggestions` — Sugestões colaborativas de novos sistemas enviadas por usuários (migration_06).
- `notifications` — Notificações in-app para usuários (migration_07).
- `imgur_cleanup_log` — Registro de tentativas de limpeza de imagens hospedadas externamente.
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
| `title`, `description`, `cover_url`, `cover_source_type`, `cover_origin_url`, `cover_deletehash`, `cover_imgur_id` | Conteúdo editorial da mesa e metadados de imagem hospedada ou reaproveitada externamente |
| `banner_url` | URL externa de banner/capa (migration_09) — aceita URLs diretas do Discord sem reupload para Imgur |
| `frequency` | Frequência das sessões: `semanal`, `quinzenal`, `mensal`, `avulsa` (migration_09) |
| `frequency_custom` | Descrição livre de frequência quando `frequency = 'avulsa'` (migration_09) |
| `rules_notes` | Regras, avisos ou notas especiais da mesa (migration_09) |
| `is_ddal` | Mesa vinculada ao programa D&D Adventurers League (DDAL) |
| `ddal_code`, `ddal_name`, `ddal_tier` | Metadados DDAL — obrigatórios quando `is_ddal = true` |
| `publisher_role` | Quem está publicando: `gm` (o próprio mestre) ou `announcer` (apenas divulgador) |
| `actual_gm_name` | Nome do mestre real quando `publisher_role = 'announcer'` |
| `starts_at` | Data/hora de início |
| `experience_level` | `todos`, `iniciante`, `intermediario`, `veterano` |
| `slug` | Gerado automaticamente via `slugify.ts` |
| `billing_text` *(migration_11 — pendente)* | TEXT — Detalhamento de cobrança (ex: "R$ 30 por sessão", "R$ 75 por mês") |
| `session_zero_free` *(migration_11 — pendente)* | BOOLEAN — Sessão zero gratuita |
| `synopsis` *(migration_11 — pendente)* | TEXT — Sinopse curta separada de description (max 300 chars) |
| `style_text` *(migration_11 — pendente)* | TEXT — Estilo/temática da mesa como campo próprio (ex: "Alta Fantasia, Investigação") |
| `technical_requirements` *(migration_11 — pendente)* | TEXT — Requisitos técnicos gerais |
| `requires_pc` *(migration_11 — pendente)* | BOOLEAN — Requer PC |
| `requires_camera` *(migration_11 — pendente)* | BOOLEAN — Requer câmera |
| `requires_microphone` *(migration_11 — pendente)* | BOOLEAN — Requer microfone |
| `level_range` *(migration_11 — pendente)* | TEXT — Faixa de nível (ex: "1-5", "10-15") |
| `campaign_length` *(migration_11 — pendente)* | TEXT — Duração estimada da campanha (ex: "6 meses", "20 sessões") |
| `listing_excerpt` *(migration_11 — pendente)* | TEXT — Resumo curto para listagem (max 200 chars, substitui "placeholder") |
| `external_links` *(migration_11 — pendente)* | JSONB — Array de links externos |
| `setting_name` *(migration_13 — pendente)* | TEXT — Nome do cenário (ex: "Forgotten Realms") |
| `setting_styles` *(migration_13 — pendente)* | TEXT[] — Array de estilos (ex: ["Alta Fantasia", "Aventura Épica"]) |



### 4.3 Automação de Integridade (Slugs)

Todas as entidades estruturais (`systems`, `gm_profiles`, `tables`) possuem geração automática de slugs no Backend via utilitário `slugify.ts`, garantindo URLs amigáveis e unicidade.

### 4.4 Histórico e Rastreabilidade

Alterações de status e campos críticos em `tables` são registradas em `table_history` com `changed_by`, `field`, `old_value`, `new_value` e `changed_at`, permitindo auditoria completa de moderação e importações.


### 4.6 Agenda Estruturada (table_schedules)

A tabela `table_schedules` armazena múltiplos horários de sessão para uma mesa, suportando campanhas com:
- Múltiplos dias da semana
- Múltiplas faixas horárias no mesmo dia
- Frequências diferentes por sessão (semanal/quinzenal/mensal)
- Vagas específicas por sessão
- Sessões em andamento vs abertas

**Campos:**
- `id` UUID PK
- `table_id` UUID FK tables(id) ON DELETE CASCADE
- `day_of_week` TEXT (segunda/terça/.../domingo)
- `start_time` TIME
- `end_time` TIME
- `frequency` TEXT (semanal/quinzenal/mensal/avulsa)
- `slots_per_session` INT (null = herda de table.slots_total)
- `is_ongoing` BOOLEAN (sessão já em andamento)
- `notes` TEXT (observações opcionais)
- `sort_order` SMALLINT (ordem de exibição)
- `created_at` TIMESTAMPTZ


**Exemplo de uso:**
Uma mesa pode ter:
- Segunda 19h-22h (semanal, 4 vagas)
- Quarta 20h-23h (quinzenal, 4 vagas)
- Sábado 14h-18h (mensal, 6 vagas, em andamento)

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
- **Sessão:** JWT gerado pelo Backend após handshake OAuth, com duração padrão de 7 dias (`JWT_EXPIRES_IN=7d`). Refresh token rotativo como arquitetura prevista.
- **Validação inteligente:** O `AuthContext.tsx` implementa validação de sessão com debounce e verificação apenas em navegações críticas, evitando logout inesperado (correção E103/E105 - Abril/2026).
- **Criação de conta:** Automática no primeiro login Google, com onboarding previsto de preferências em 3 etapas.
- **Separação de identidade:** A conta Google alimenta apenas o login. O perfil público (`profiles`, `gm_profiles`) é entidade própria controlada pelo usuário.
- **Integração opcional futura com Discord:** O sistema poderá permitir, em fase posterior, o vínculo opcional de uma conta Discord ao perfil público do usuário. Esse vínculo não substitui o login Google e não será requisito para uso da plataforma.
- **Uso previsto do vínculo Discord:** Quando implementado, o vínculo poderá servir para validar identidade comunitária, consultar cargos públicos em servidores autorizados e habilitar selos contextuais, como `Mestre do Covil`, sem transformar o Discord em provedor principal de autenticação.
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
- Botão de exportação para WhatsApp e Discord, previsto para versão posterior, após a base principal estar estável.

### 7.4 Landing Page do Mestre

- Banner/capa customizável
- Avatar, nome, badge de role, data de entrada
- Bio longa
- Idiomas e tags de perfil (streamer, veterano, criador de conteúdo etc.)
- Estatísticas: mesas narradas, avaliação geral, feedbacks recebidos
- Especialidades por sistema (com contagem de mesas)
- Lista de mesas ativas do mestre (usando o mesmo card do catálogo)
- Aba de avaliações recebidas
- Área de vínculos comunitários, prevista para fase posterior, com exibição opcional de integrações externas autorizadas
- Quando a integração com Discord for implementada, a landing page poderá exibir selos públicos derivados de vínculo validado com comunidades parceiras, como o Covil do Lich

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
- Gestão futura de vínculos externos do perfil, incluindo conexão opcional com Discord para validação comunitária e eventual resgate de cargos públicos em servidores autorizados
- Configuração futura de visibilidade desses vínculos e selos no perfil público do mestre
- Gerador de texto de divulgação (exportação WhatsApp/Discord), previsto para versão posterior, após a base principal estar estável.

### 7.7 Painel Administrativo

- **Moderação de Mesas Pendentes:** Aprovação/rejeição de anúncios com registro em `table_history`.
- **CRUD Completo de Taxonomias (REQ-23 - Implementado Abril/2026):**
  - **Sistemas:** Criação, edição e deleção com suporte a hierarquia (sistema > edição > variante). Cálculo automático de `depth` e `path_slug`. Gerenciamento de aliases (array de strings). Busca em tempo real por nome/alias.
  - **Cenários:** Criação, edição e deleção com suporte a subgêneros (array de tags). Slug gerado automaticamente.
  - **Mesas:** Funcionalidade de deleção administrativa (hard delete com cascade de contatos e relacionamentos).
  - **UX Administrativa:** Modais de edição (`SystemEditModal`, `ScenarioEditModal`), confirmação de deleção, feedback via `react-hot-toast`, estados de carregamento (spinners).
- **Notificações In-App (REQ-15 - Implementado Abril/2026):** Sino no header com contador de não lidas. Notificações de sugestões de sistemas aprovadas/rejeitadas.
- **Destaques da Home:** Curadoria manual das mesas exibidas no hero.
- **Workflow de Continuidade:** Modal de moderação suporta estado `stayOpen` para processar múltiplos itens em sequência.

  - Preview de banner quando `banner_url` existir
  - Canais de recrutamento quando detectados
  - Requisitos técnicos quando marcados
  - Checkbox de mesa em andamento
  - Bloco de cenário e estilos quando preenchidos
  - Repetidor de agenda (se suportado) ou texto bruto
- Admin pode editar qualquer campo antes de aprovar
- Regra: sistema não exige redigitação do que já estava no JSON

**Regra Arquitetural:** A lógica de negócio fica no backend. O frontend nunca decide segurança, elevação de role ou persistência direta.

---

## 8. Exportação WhatsApp e Discord

Esta funcionalidade é prevista para versão posterior, após a base principal pública e administrativa do projeto estar estável.

Quando implementada, ao clicar em "Exportar para WhatsApp" ou "Exportar para Discord", o sistema deverá gerar texto formatado automaticamente.

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

Toda nova implantação deve ser gerada localmente no branch correspondente ao ambiente, `dev` para beta e `main` para produção.
Qualquer falha de build ou erro em runtime deve primeiramente ser catalogada em `ERRORS_SOLUTIONS.md` antes de qualquer looping de reescrita de código pela IA.

### Resgate de Banco e Ambiente Beta

O contêiner de API Node.js só inicializa se conseguir bater porta e sincronizar no PostgreSQL (`mesas-beta-db`). Se o ambiente der tela preta por corrupção de variáveis de ambiente ou o contêiner da API explodir em runtime:

1. Verifique o `docker compose logs` e consulte `ERRORS_SOLUTIONS.md` urgentemente.
2. Use SSH assistido se e somente se métricas do repositório GitHub e os Actions falharem primeiro.

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
| `GET` | `/api/v1/me` | Retorna perfil do usuário autenticado |

### Mesas
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/tables` | — | Listagem pública com filtros via query params |
| `GET` | `/api/v1/tables/:slug` | — | Página individual da mesa |
| `POST` | `/api/v1/tables` | `gm` | Criar nova mesa |
| `PUT` | `/api/v1/tables/:id` | `gm` (própria) | Editar mesa |
| `PATCH` | `/api/v1/tables/:id/status` | `gm` / `admin` | Alterar status |
| `POST` | `/api/v1/tables/:id/bookmark` | `player` | Salvar mesa |
| `POST` | `/api/v1/tables/:id/export` | — | Gerar texto de exportação, previsto para fase posterior |

### Mestres
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/gm/:slug` | — | Perfil público do mestre |
| `POST` | `/api/v1/gm/profile` | `player` | Criar gm_profile (eleva role) |
| `PUT` | `/api/v1/gm/profile` | `gm` | Editar gm_profile |

### Perguntas e Avaliações
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/tables/:id/questions` | — | Listar perguntas públicas |
| `POST` | `/api/v1/tables/:id/questions` | `player` | Enviar pergunta |
| `POST` | `/api/v1/questions/:id/answer` | `gm` (própria mesa) | Responder pergunta |
| `POST` | `/api/v1/tables/:id/reviews` | `player` | Avaliar mesa |

### Admin
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/admin/tables/pending` | `admin` | Mesas aguardando moderação |
| `PATCH` | `/api/v1/admin/tables/:id/moderate` | `admin` | Aprovar ou rejeitar mesa |
| `DELETE` | `/api/v1/admin/tables/:id` | `admin` | Deletar mesa (hard delete com cascade) |
| `POST` | `/api/v1/admin/systems` | `admin` | Criar sistema |
| `PUT` | `/api/v1/admin/systems/:id` | `admin` | Editar sistema |
| `DELETE` | `/api/v1/admin/systems/:id` | `admin` | Deletar sistema |
| `POST` | `/api/v1/admin/scenarios` | `admin` | Criar cenário |
| `PUT` | `/api/v1/admin/scenarios/:id` | `admin` | Editar cenário |
| `DELETE` | `/api/v1/admin/scenarios/:id` | `admin` | Deletar cenário |

### Notificações (REQ-15 - Implementado Abril/2026)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | `player` | Listar notificações do usuário |
| `PATCH` | `/api/v1/notifications/:id/read` | `player` | Marcar notificação como lida |


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

### Fase 5 — Crescimento e Estabilização
- Recomendações baseadas em preferências do usuário
- Integração com sistema de notificações por email (vazamentos de vaga, início próximo)
- SEO estruturado (meta tags, sitemap, Open Graph para compartilhamento de mesas)
- Métricas internas de uso no painel admin (sem tracking de terceiros)
- Exportação WhatsApp e Discord
---

## 14. Decisões de Arquitetura Registradas

Este bloco documenta decisões tomadas com justificativa, para evitar que sejam revertidas sem consciência do raciocínio original.

| Decisão | Justificativa |
|---|---|
| **Google OAuth como único método de login** | Elimina gerenciamento de senha local, reduz superfície de ataque e simplifica onboarding. Alinha com a proposta de mínima coleta de dados. |
| **Discord como vínculo opcional de perfil, não como login principal** | Preserva a simplicidade e o estado já validado da autenticação via Google, enquanto abre espaço para selos públicos, validação comunitária e leitura futura de cargos públicos em servidores autorizados, sem acoplar o acesso principal da plataforma ao Discord. |
| **Fuse.js client-side para busca** | Consistente com o Glossário, mantém zero latência de busca para o usuário. Para volume de mesas esperado na fase inicial, busca client-side é suficiente. Revisitar se ultrapassar 10k registros ativos. |
| **Slug como identificador de URL** | URLs amigáveis e estáveis são essenciais para SEO e compartilhamento social. Slugs são gerados no backend, nunca no frontend. |
| **Separação entre `profiles` e `gm_profiles`** | Nem todo usuário é mestre. Forçar campos de mestre em todos os perfis polui o modelo. A elevação de role é um evento explícito, não automático. |
| **`table_history` desde a fase 1** | Moderação sem rastreabilidade é inauditável. O custo de implementar auditoria depois é sempre maior que implementar desde o início. |
| **Toast notifications modernas (REQ-19 - Abril/2026)** | Substituição de `alert()` por `react-hot-toast` melhora UX significativamente. Feedback visual não-bloqueante alinhado com heurísticas de Nielsen (H1, H9). |
| **Migração para sistemas.json e cenarios.json (Abril/2026)** | Substituição de `arvores_de_sistemas.md` por JSON estruturado facilita parsing, validação e manutenção. Suporte a aliases e subgêneros em formato programático. |

---

## 14.1 Divisão de Camadas para Operações Administrativas de Mesa

Novo sistema de operações administrativas para mesas implementado com separação clara de responsabilidades entre diferentes camadas de execução.

### Controlador: adminTables.ts

Controlador responsável pelas rotas administrativas de mesas sob o namespace `/api/v1/admin/tables/:id`. Centraliza as operações:

- `PUT /api/v1/admin/tables/:id` para atualizar campos administrativos (status, is_covil)
- `DELETE /api/v1/admin/tables/:id` para exclusão completa da mesa via soft/hard-delete

Implementa verificação de permissão exigindo role `admin` via middleware de autenticação JWT.

### Camada de Serviço: tableService.ts

Agrupa as regras de negócio relacionadas a mesas, separando a lógica reutilizável da camada de controle. Responsável por:

- Validação de regras de negócio antes de persistência (ex: não permitir downgrade de mesa " Covil do Lich" sem justificativa apropriada)
- Coordenação da lógica entre diferentes camadas
- Interface de dados padronizados para uso nos controladores

### Camada de Persistência: tableRepository.ts

Camada de acesso ao banco de dados para operações relacionadas a mesas, centralizando:

- CRUD operações na tabela `tables`
- Manipulação de relações com entidades dependentes (`table_schedules`, `reviews`, `questions`, etc.)
- Aplicação de regras de exclusão em cascata
- Prevenção de injeção SQL através de queries parametrizadas

### Camada de Validação: tableValidators.ts

Define schemas de validação Zod para dados relacionados a mesas, assegurando:

- Tipagem forte no Runtime
- Validação consistente entre diferentes endpoints
- Reutilização de schemas na composição de validações complexas
- Segurança contra ataques baseados em payload malicioso

### Integração com o sistema existente

Os novos componentes se integram perfeitamente com o modelo de autenticação e permissões existente:

- Usam o middleware JWT existente para verificação de permissão
- Reutilizam estruturas de modelo e tipagem existentes nas camadas inferiores
- Integram-se ao schema de histórico e auditoria (`table_history`)

### Princípios de Camadas Aplicados

- **Separation of Concerns**: Cada componente tem responsabilidade única e bem definida
- **Reusabilidade**: Serviços e repositórios podem ser usados por diferentes controladores
- **Manutenibilidade**: Mudanças de implementação ocorrem em camadas específicas
- **Testabilidade**: Cada camada pode ser testada isoladamente

---

## 14.5. Princípios de UX/UI


### 14.5.1. As 10 Heurísticas de Nielsen

Este projeto segue as 10 heurísticas de usabilidade de Jakob Nielsen como princípios fundamentais de design de interface:

1. **Visibilidade do Status do Sistema**
   - A interface mantém o usuário informado sobre o que está acontecendo em tempo real
   - Exemplos: feedback de seleção, loading states, mensagens de sucesso/erro

2. **Correspondência entre Sistema e Mundo Real**
   - Uso de linguagem familiar ao usuário, evitando termos técnicos desnecessários
   - Exemplos: "Mesa" em vez de "Table", "Mestre" em vez de "GM"

3. **Controle e Liberdade do Usuário**
   - Saídas de emergência claras para ações realizadas por engano
   - Exemplos: botões de cancelar, confirmações antes de ações destrutivas

4. **Consistência e Padrões**
   - Manutenção de padrões de design e convenções da plataforma
   - Exemplos: botões primários sempre laranja Artifício, layout consistente

5. **Prevenção de Erros**
   - Interface projetada para evitar erros antes que aconteçam
   - Exemplos: validação em tempo real, campos obrigatórios marcados, confirmações

6. **Reconhecimento em vez de Memorização**
   - Opções e informações visíveis, minimizando necessidade de memorização
   - Exemplos: placeholders descritivos, textos de ajuda contextual, breadcrumbs

7. **Flexibilidade e Eficiência de Uso**
   - Atalhos para usuários experientes mantendo simplicidade para iniciantes
   - Exemplos: busca rápida em seletores, atalhos de teclado (futuro)

8. **Estética e Design Minimalista**
   - Foco no essencial, evitando informações irrelevantes
   - Exemplos: hierarquia visual clara, espaçamento adequado, cores intencionais

9. **Recuperação de Erros**
   - Mensagens de erro claras com soluções práticas
   - Exemplos: "Informe pelo menos um canal de contato" em vez de "Validation failed"

10. **Ajuda e Documentação**
    - Sistema fácil de usar sem documentação, mas com ajuda disponível quando necessário
    - Exemplos: tooltips, textos de ajuda inline, links para documentação

### 14.5.2. Aplicação Prática

**SystemTreeSelector:**
- Heurística #1: Scroll automático para item selecionado, feedback visual de seleção, caixa destacada no topo mostrando sistema selecionado com refinamento hierárquico (E111 - Abril/2026)
- Heurística #4: Comportamento consistente de seleção única
- Heurística #6: Texto de ajuda contextual, contador de seleção visível, caminho completo da seleção atual
- Heurística #8: Interface limpa com três colunas hierárquicas

**Formulário de Nova Mesa:**
- Heurística #5: Validação de contatos obrigatórios, confirmação de papel de anunciante
- Heurística #6: Placeholders descritivos, labels claros
- Heurística #9: Mensagens de erro específicas e acionáveis

**Painel de Revisão de Candidatos (REQ-19 - Abril/2026):**
- Heurística #1: Toast notifications com feedback instantâneo de ações (aceitar/rejeitar), spinners em botões durante processamento
- Heurística #3: Botão "Desfazer Rejeição" permite recuperação de erro sem perda de dados
- Heurística #5: Validação de campos obrigatórios antes de aceitar candidato, previne publicação incompleta
- Heurística #9: Mensagens claras: "Informe pelo menos um canal de contato" em vez de "Validation failed"

**CRUD Administrativo (REQ-23 - Abril/2026):**
- Heurística #1: Estados de carregamento visíveis, feedback de sucesso/erro via toast
- Heurística #3: Confirmação antes de deleção, botões de cancelar em modais
- Heurística #7: Busca em tempo real em seletores, eficiência para administradores
- Heurística #8: Modais focados, sem informações desnecessárias

**Filtros Avançados e Seleção em Lote (REQ-25 - 05/04/2026):**
- Heurística #1: Badge "X filtros ativos" visível, contador "X de Y selecionados" em tempo real, spinners durante deleção, estados visuais de botões (disabled com opacity-50)
- Heurística #2: Labels em português claro ("Data Início", "Buscar por Mestre"), linguagem não-técnica ("Deletar Selecionados" não "DELETE bulk"), mensagens humanizadas ("Esta ação é irreversível!")
- Heurística #3: Botão "Limpar Filtros" sempre acessível, botão "Cancelar" no modal, checkbox de confirmação pode ser desmarcado, seleção individual reversível
- Heurística #4: Padrões visuais consistentes (bg-white/5, border-white/10), cores semânticas (vermelho para ações destrutivas), estrutura de modais consistente
- Heurística #5: Confirmação dupla para deleção (modal + checkbox obrigatório), limite configurável (50/100/150) para evitar timeouts, validação backend (máximo 150 IDs), preview de candidatos antes de deletar
- Heurística #6: Filtros sempre visíveis (não escondidos), badge mostra quantidade ativa, preview dos candidatos no modal, contador sempre visível, tooltip "Filtros salvos automaticamente"
- Heurística #7: Filtros combinados (data + mestre + status) para usuários avançados, limite configurável (usuário escolhe velocidade vs quantidade), "Selecionar Todos" para operações rápidas, seleção individual para controle fino, persistência no localStorage
- Heurística #8: Informações essenciais destacadas (badge, contador), informações secundárias em texto menor/cor suave, botões aparecem apenas quando relevantes, sem poluição visual
- Heurística #9: Feedback diferenciado (sucesso total/parcial/falha), toast quando limite é atingido ("Selecionados 50 de 200 candidatos (limite atingido)"), mensagens de erro claras, validação de limite no backend retorna erro específico
- Heurística #10: Tooltip explicativo no badge, texto de ajuda "💡 Os filtros são salvos automaticamente...", placeholders nos inputs ("Nome do mestre..."), labels descritivos, mensagem clara no modal explicando consequências

### 14.5.3. Checklist de Revisão de UX

Antes de implementar nova feature de interface:
- [ ] Feedback visual imediato para ações do usuário?
- [ ] Linguagem clara e familiar ao público-alvo?
- [ ] Usuário pode desfazer/cancelar ações importantes?
- [ ] Padrões visuais consistentes com resto da aplicação?
- [ ] Validações previnem erros comuns?
- [ ] Informações necessárias estão visíveis (não requerem memorização)?
- [ ] Interface funciona bem para iniciantes e experientes?
- [ ] Design limpo, sem elementos desnecessários?
- [ ] Mensagens de erro são claras e sugerem solução?
- [ ] Ajuda contextual disponível quando necessário?

### 14.6. Padrão URL-Driven State (useUrlState<T>)

**Decisão Arquitetural (Abril/2026):** Estado de filtros e navegação deve ser gerenciado via URL como fonte única de verdade.

**Motivação:**
- URLs compartilháveis funcionam corretamente (filtros preservados)
- Botões voltar/avançar do navegador funcionam naturalmente
- Cache do React Query alinhado deterministicamente com estado visível
- Eliminação de estado duplicado (URL vs React state)

**Implementação:**

**Hook Genérico (`hooks/useUrlState.ts`):**
```typescript
useUrlState<T>(
  parse: (params: URLSearchParams) => T,
  serialize: (state: T) => URLSearchParams
): [T, (updater: T | ((prev: T) => T)) => void]
```

**Características:**
- Normalização automática de URL (formato canônico)
- Proteção anti-loop via `useRef`
- Updater function estilo React (`T | (prev: T) => T`)
- Performance otimizada com `useMemo`
- Dev warnings em desenvolvimento

**Adapter Específico (`hooks/useCatalogFilters.ts`):**
```typescript
useCatalogFilters(): [CatalogFilters, SetCatalogFilters]
```

**Parser e Builder (`utils/catalogFilters.ts`):**
- `parseCatalogFilters(params: URLSearchParams): CatalogFilters`
- `buildCatalogParams(filters: CatalogFilters): URLSearchParams`
- Helper DRY: `parseEnum<T>(value, validValues, fallback)`
- URI encoding/decoding para caracteres especiais

**Uso em Novas Features:**
Qualquer feature que precise de estado na URL deve usar `useUrlState<T>` com parser e serializer específicos. Não reimplementar lógica de normalização ou sincronização manualmente.

**Exemplo de Implementação:**
Ver `CatalogoPage.tsx` (refatorado em Abril/2026) como referência de uso correto do padrão.

---

## 15. Glossário do Projeto

| Termo | Definição no contexto deste projeto |
|---|---|
| **Mesa** | Anúncio de uma sessão ou campanha de RPG, publicada por um mestre ou importada de fonte externa. Entidade central do produto. |
| **Mestre (GM)** | Usuário com role `gm`, responsável por narrar a mesa. Possui `gm_profile` público. |
| **Jogador** | Usuário com role `player`. Pode buscar, salvar e avaliar mesas, mas não publicar. |
| **Reivindicação** | Ação de um mestre local que vincula um anúncio importado ao próprio `gm_profile`. |
| **Dry Run** | Simulação de importação em lote sem persistir dados, usada para preview e detecção de duplicatas. |
| **Slug** | Identificador textual único gerado a partir do nome da entidade, usado em URLs. |
| **Onboarding** | Fluxo obrigatório de 3 etapas executado no primeiro login para configurar perfil e preferências. |
| **Exportação** | Geração de texto formatado para WhatsApp ou Discord a partir dos dados estruturados de uma mesa. |
| **Vínculo comunitário** | Conexão opcional entre o perfil do usuário e comunidades autorizadas, usada para validação contextual e exibição pública controlada. |
| **Selo público** | Marcador visual exibido no perfil do mestre quando houver vínculo validado com comunidade parceira ou critério editorial definido pela plataforma. |
| **Cargo público do Discord** | Informação pública de cargo obtida futuramente por integração autorizada com servidores Discord elegíveis, usada apenas para fins de contexto comunitário e selos. |

## 16. Gestão de Imagens e Integração Imgur

### 16.1 Princípio Geral

Imagens do ecossistema do projeto são divididas em três categorias com tratamentos distintos:

**Imagens estáticas do site** (logos, ícones, ilustrações de UI) — servidas diretamente pelo Nginx a partir do build do Vite. Nunca vão para o Imgur.

**Imagens enviadas por usuários** — processadas na Oracle, convertidas para WebP e hospedadas no Imgur via API. São elas:
- Banners de mesas criadas localmente (`tables.cover_url` quando `cover_source_type=imgur_upload`)
- Avatar e banner do perfil do mestre (`gm_profiles.avatar_url`, `gm_profiles.banner_url`)

**Imagens reaproveitadas de fontes externas monitoradas pelo bot** — especialmente campanhas importadas dos canais do Covil do Lich no Discord. Quando a postagem já trouxer uma imagem de campanha com URL pública reutilizável, essa imagem poderá ser usada diretamente como `cover_url` da mesa importada, sem reupload obrigatório para Imgur.

### 16.2 Fluxos de imagem (Upload e Reaproveitamento Externo)

**Fluxo A — Upload local para Imgur**

```
[Cliente envia imagem]
    → API Node.js recebe o arquivo via multipart/form-data
    → Sharp converte para WebP (qualidade 85, resize proporcional com limite de 1280px de largura)
    → Buffer WebP é enviado para a API do Imgur via POST /image (base64)
    → Imgur retorna { link, deletehash, id }
    → Backend salva no banco: link (URL pública), deletehash (para exclusão futura), imgur_id
    → cover_source_type = imgur_upload
    → URL pública do Imgur é retornada ao Frontend e gravada no campo correspondente
```

**Fluxo B — Reaproveitamento de imagem externa vinda do Discord**

```
[Sistema encontra anúncio no Discord]
    → Extrai a imagem de campanha já publicada na postagem
    → Valida se a URL é pública e reutilizável externamente
    → Grava a URL em cover_url
    → Grava a mesma origem em cover_origin_url
    → cover_source_type = discord_reused
    → Não cria deletehash nem imgur_id
```

**Regra arquitetural:** para anúncios importados dos canais monitorados do Covil do Lich, a imagem da campanha deve ser reaproveitada sempre que a postagem já fornecer uma URL pública utilizável.

**Dependências no Backend:**
- `sharp` — conversão e resize para WebP
- `axios` ou `node-fetch` — chamadas à API do Imgur e consumo de origens externas quando necessário
- Variável de ambiente `IMGUR_CLIENT_ID` — obrigatória para uploads próprios, nunca exposta ao Frontend

### 16.3 Campos de Banco Adicionais

Para suportar o ciclo de vida das imagens, os seguintes campos devem estar presentes:

**Em `tables`:**
| Campo | Tipo | Descrição |
|---|---|---|
| `cover_url` | `TEXT` | URL pública da imagem exibida na mesa |
| `cover_source_type` | `TEXT` | Origem da imagem, como `imgur_upload` ou `discord_reused` |
| `cover_origin_url` | `TEXT` | URL original da imagem quando vier de fonte externa reaproveitada |
| `cover_deletehash` | `TEXT` | Hash de exclusão no Imgur, quando aplicável |
| `cover_imgur_id` | `TEXT` | ID da imagem no Imgur, quando aplicável |

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

**Banners enviados localmente e hospedados no Imgur** possuem ciclo de vida vinculado ao status da mesa:

Quando o status de uma mesa transitar para `ended` ou `cancelled`, um job de limpeza executa automaticamente a exclusão da imagem no Imgur via `DELETE /image/{deletehash}`. Após confirmação de exclusão bem-sucedida, os campos `cover_url`, `cover_source_type`, `cover_origin_url`, `cover_deletehash` e `cover_imgur_id` são zerados no banco.

**Banners reaproveitados de importação do Discord** não devem gerar tentativa de exclusão na origem externa. Quando a mesa importada for encerrada, cancelada ou removida, o sistema apenas poderá limpar a referência local conforme a política de retenção do anúncio, sem enviar `DELETE` ao provedor externo.

**Imagens de mestres** (avatar e banner do `gm_profile`) **não possuem expiração automática**. Só são excluídas do Imgur quando o mestre faz upload de uma nova imagem (substituição) — neste caso, a imagem anterior é deletada do Imgur antes de persistir a nova — ou quando a conta do mestre é encerrada por um administrador.

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
- URLs externas reaproveitadas do Discord só podem ser usadas quando já forem públicas e reutilizáveis na própria postagem importada. O sistema não tenta apagar nem modificar o arquivo na origem externa.
- Uploads são processados apenas por usuários autenticados com role `gm` (para imagens de mesa e perfil de mestre) ou `admin`.


## 18. Referências e Documentos Relacionados

| Documento | Finalidade |
|---|---|
| `AGENTS.md` | Instruções de comportamento para agentes de IA no projeto |
| `ERRORS_SOLUTIONS.md` | Registro de erros conhecidos e suas soluções (E001-E111 catalogados até Abril/2026) |
| `CHANGELOG.md` | Histórico de versões e mudanças relevantes |
| `docker-compose.yml` | Definição dos serviços: API, PostgreSQL, Nginx |
| `sistemas.json` e `cenarios.json` | **Migração concluída (Abril/2026):** Substituição de `arvores_de_sistemas.md` por `sistemas.json` (taxonomia de sistemas com `name`, `aliases`, `editions`, `variants`, `depth`, `path_slug`) e `cenarios.json` (cenários com campo `subgenero` como array de tags). Dockerfile atualizado para copiar ambos automaticamente no build. Scripts de importação (`systemsTreeImport.ts`) processam JSON. |
---

> **Lembre-se:** Este é um presente do Artifício RPG para a comunidade brasileira de RPG.
> Gratuito · Sem anúncios · Sem coleta de dados · Feito com ♥ pela comunidade.




