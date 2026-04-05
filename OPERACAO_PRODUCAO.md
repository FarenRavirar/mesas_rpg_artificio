# OPERACAO_PRODUCAO.md

Guia operacional dos ambientes beta e produção no Oracle para o **Anúncios de Mesas RPG** (`mesas_rpg_artificio`).

## Objetivo

Definir o runbook de operação para deploy, validação e diagnóstico da aplicação fullstack (React + Node.js + PostgreSQL).

---

## Estado atual dos ambientes

O estado operacional validado mais recente é o seguinte:

- Beta ativo em `mesasbeta.artificiorpg.com`
- Pasta remota beta: `/opt/mesas-beta/`
- Compose beta em uso: `/opt/mesas-beta/docker-compose.beta.yml`
- Containers beta esperados: `mesas-beta-app`, `mesas-beta-api`, `mesas-beta-db`
- Produção prevista em `mesas.artificiorpg.com`
- Pasta remota de produção: `/opt/mesas/`
- Compose de produção esperado: `/opt/mesas/docker-compose.prod.yml`
- Produção ainda não publicada operacionalmente nesta rodada
- Exposição pública via Cloudflare Tunnel apontando para os containers internos, sem depender de porta pública no host

Regras operacionais:
- Não tratar mais este projeto como infraestrutura inicial pendente
- Não usar `30302` como referência canônica do beta
- Não criar novo túnel Cloudflare
- Não fazer deploy manual no servidor fora do fluxo aprovado

---

## 0. Arquivos de Configuração no Servidor

### 0.1 Localização dos Arquivos `.env`

| Ambiente | Localização | Função | Observações |
|---|---|---|---|
| Beta | `/opt/mesas-beta/.env` | Variáveis de ambiente compartilhadas por todos os containers beta | **Único `.env` do beta**, não existe `/opt/mesas-beta/backend/.env` |
| Produção | `/opt/mesas/.env` | Variáveis de ambiente compartilhadas por todos os containers de produção | **Único `.env` de produção**, não existe `/opt/mesas/backend/.env` |

**Estrutura do `.env` (Beta):**
```env
# Servidor
PORT=3000
NODE_ENV=production

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@mesas-beta-db:5432/mesas_rpg

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d  # Atualizado em 04/04/2026 (era 15m)

# Frontend
FRONTEND_URL=https://mesasbeta.artificiorpg.com

# Imgur
IMGUR_CLIENT_ID=...
```

**Como editar `.env` no servidor:**
```bash
ssh -F C:\projetos\config faren
nano /opt/mesas-beta/.env
# Editar → Ctrl+O → Enter → Ctrl+X
```

**Após editar `.env`, reiniciar containers:**
```bash
docker restart mesas-beta-api mesas-beta-app
```

---

### 0.2 Localização dos Arquivos Docker Compose

| Ambiente | Localização | Função | Observações |
|---|---|---|---|
| Beta | `/opt/mesas-beta/docker-compose.beta.yml` | Define containers beta (app, api, db) | Usado pelo workflow de deploy automático |
| Produção | `/opt/mesas/docker-compose.prod.yml` | Define containers de produção (app, api, db) | Ainda não publicado operacionalmente |

**Estrutura do Compose (Beta):**
```yaml
services:
  mesas-beta-db:
    image: postgres:15
    container_name: mesas-beta-db
    env_file: .env  # ← Lê /opt/mesas-beta/.env
    volumes:
      - pgdata_mesas_beta:/var/lib/postgresql/data
    networks:
      - mesas-beta-network

  mesas-beta-api:
    build: ./backend
    container_name: mesas-beta-api
    env_file: .env  # ← Lê /opt/mesas-beta/.env
    depends_on:
      - mesas-beta-db
    networks:
      - mesas-beta-network

  mesas-beta-app:
    build: ./frontend
    container_name: mesas-beta-app
    depends_on:
      - mesas-beta-api
    networks:
      - mesas-beta-network
```

**Nomes dos Serviços vs Nomes dos Containers:**
- **Serviços no compose:** Definidos em `services:` (ex: `mesas-beta-db`)
- **Nomes dos containers:** Definidos em `container_name:` (ex: `mesas-beta-db`)
- **Para reiniciar:** Use o **nome do container**, não o nome do serviço

**Comandos corretos:**
```bash
# ✅ CORRETO: Usar nome do container
docker restart mesas-beta-api mesas-beta-app

# ❌ ERRADO: Usar docker compose com nome de serviço
docker compose -f docker-compose.beta.yml restart backend frontend
# (Falha: "no such service: backend")
```

**Listar containers em execução:**
```bash
docker ps --filter 'name=mesas-beta' --format '{{.Names}}'
# Saída:
# mesas-beta-api
# mesas-beta-app
# mesas-beta-db
```

---


## 1. Ambientes

| Ambiente | Branch | Pasta no servidor | Containers principais | Exposição atual | URL |
|---|---|---|---|---|---|
| Beta | `dev` | `/opt/mesas-beta/` | `mesas-beta-app`, `mesas-beta-api`, `mesas-beta-db` | Cloudflare Tunnel para `http://mesas-beta-app:80`, sem porta pública no host | `mesasbeta.artificiorpg.com` |
| Produção | `main` | `/opt/mesas/` | `mesas-app`, `mesas-api`, `mesas-db` | Publicação prevista para `http://mesas-app:80` via Cloudflare; runtime ainda não publicado | `mesas.artificiorpg.com` |

---

## 2. Deploy automático (único caminho válido)

O deploy ocorre exclusivamente via GitHub Actions:
- Push autorizado em `dev` -> `deploy-beta.yml` -> ambiente beta
- Push autorizado em `main` -> `deploy-production.yml` -> ambiente produção

Comandos remotos atualmente esperados no workflow:

```bash
# Beta
set -e
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml up -d --build --remove-orphans
sleep 10
docker compose -f docker-compose.beta.yml ps
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-app
docker compose -f docker-compose.beta.yml logs --tail=30 mesas-beta-api
docker image prune -f

# Produção
set -e
cd /opt/mesas
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
sleep 10
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-app
docker compose -f docker-compose.prod.yml logs --tail=30 mesas-api
docker image prune -f
```

O que o agente NUNCA deve fazer no Oracle:
- Alterar manualmente arquivos versionados em `/opt/mesas-beta/` ou `/opt/mesas/` como fluxo padrão de deploy
- Rodar `npm install` ou `npm run build` diretamente na VM como substituto do workflow
- Criar novo túnel Cloudflare ou container `cloudflared` paralelo
- Forçar `docker compose down` como padrão sem autorização explícita

O que o agente PODE fazer para diagnóstico read-only:
```bash
# Beta
docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api

# Produção
docker compose -f /opt/mesas/docker-compose.prod.yml ps
docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api

# Geral
docker stats --no-stream | grep mesas
docker ps | grep mesas
```

---

## 3. Conexão SSH

**Método 1, preferencial (alias no config local):**
```powershell
ssh -F C:\projetos\config faren
```

**Método 2, fallback (chave privada explícita):**
```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231
```

**Método 3, fallback (chave padrão do sistema):**
```powershell
ssh ubuntu@137.131.250.231
```

| Método | Quando usar |
|---|---|
| `ssh -F C:\projetos\config faren` | Padrão, sempre tentar primeiro |
| `-i privada.key ubuntu@IP` | Se o config não estiver disponível |
| `ubuntu@IP` direto | Se a chave já estiver carregada no agente SSH local |

> Acesso SSH é usado principalmente para diagnóstico. Comandos read-only são permitidos; alterações de estado exigem autorização explícita no chat.

---

## 4. Validação pós-deploy

### Beta (`dev`)
1. Confirmar conclusão do run no GitHub Actions:
   ```bash
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
   ```
2. Confirmar acesso à URL: `https://mesasbeta.artificiorpg.com`
3. Testar healthcheck:
   ```powershell
   curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
   ```
4. Testar login via Google OAuth e fluxo principal de onboarding
5. Verificar containers:
   ```bash
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps
   ```
6. Verificar logs se houver erro:
   ```bash
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-app
   docker compose -f /opt/mesas-beta/docker-compose.beta.yml logs --tail=50 mesas-beta-api
   ```
7. **Aggregator Discord (Fase 7 — migration_05 aplicada no beta em 04/04/2026):**
   - Verificar tabelas no banco:
     ```bash
     docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c '\dt aggregator*'
     ```
   - Fluxo operacional de ingestão:
     1. Criar source: `POST /api/v1/aggregator/sources` (requer JWT admin)
     2. Importar export JSON local: `npm run aggregator:import -- <arquivo.json> --source-id=<uuid>`
     3. Revisar candidatos: `GET /api/v1/aggregator/candidates?status=awaiting_review`
     4. Aceitar/rejeitar: `PATCH /api/v1/aggregator/candidates/:id/accept` ou `/reject`
   - Para dry-run sem persistir: `npm run aggregator:import -- <arquivo.json> --source-id=<uuid> --dry-run`
   - Logs de erros de ingestão (quando worker automático for ativo):
     ```bash
     docker logs mesas-beta-api --tail 30 | grep -E "aggregator|cleanup|cron"
     ```


### Produção (`main`)
1. Confirmar conclusão do run no GitHub Actions:
   ```bash
   gh run list --repo FarenRavirar/mesas_rpg_artificio -L 3 --json databaseId,name,status,conclusion,headBranch,createdAt
   ```
2. Confirmar se a publicação operacional em produção já existe antes de validar URL pública
3. Após a primeira publicação operacional, testar:
   - `https://mesas.artificiorpg.com`
   - healthcheck equivalente de produção
   - login via Google OAuth
   - containers de produção
4. Logs de produção, quando houver runtime publicado:
   ```bash
   docker compose -f /opt/mesas/docker-compose.prod.yml ps
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-app
   docker compose -f /opt/mesas/docker-compose.prod.yml logs --tail=50 mesas-api
   ```

---

## 5. Diagnóstico de incidentes

| Sintoma | Causa provável | Solução inicial |
|---|---|---|
| `502 Bad Gateway` | Container offline, erro na API ou destino incorreto no Cloudflare | Verificar `docker compose ps`, logs da app e da API, e o target do hostname no Cloudflare |
| `404 Not Found` | Build frontend ausente, rota errada ou rsync incompleto | Verificar logs do workflow e logs do container `mesas-beta-app` ou `mesas-app` |
| Site desatualizado | Cache de navegador agressivo ou deploy não concluído | Hard refresh e conferência do run no GitHub Actions |
| API não sobe | Falha de conexão com PostgreSQL ou variável ausente | Verificar `.env`, `DATABASE_URL` e logs do container da API |
| Healthcheck falha com `Invalid URL` | `DATABASE_URL` montada incorretamente com caractere especial na senha | Consultar `ERRORS_SOLUTIONS.md` E086 |
| OAuth falha | Callback divergente entre ambiente, compose e runtime | Validar `GOOGLE_CALLBACK_URL` e consultar `ERRORS_SOLUTIONS.md` correspondente |
| Worker futuro silencioso | Circuit breaker ativo ou dependência externa indisponível | Verificar logs da API e consultar `ERRORS_SOLUTIONS.md` |

### 5.1 Nota sobre nomes de containers

Atualmente os nomes canônicos esperados são:
- Beta app: `mesas-beta-app`
- Beta API: `mesas-beta-api`
- Beta DB: `mesas-beta-db`
- Produção app: `mesas-app`
- Produção API: `mesas-api`
- Produção DB: `mesas-db`

Sempre confirmar em runtime com:
```bash
docker ps | grep mesas
```

---

## 6. Cloudflare Tunnel

O túnel é reutilizado a partir da infraestrutura já existente na VM Oracle.

Regra:
- NUNCA criar novo túnel
- NUNCA iniciar `cloudflared` paralelo
- NUNCA pedir token de novo túnel ao usuário como caminho padrão

Novos hostnames devem aproveitar o túnel já existente e apontar para containers internos na rede Docker compartilhada.

Mapeamentos relevantes atualmente conhecidos:

| Domínio | Serviço interno | Observação |
|---|---|---|
| `mesasbeta.artificiorpg.com` | `http://mesas-beta-app:80` | Beta ativo |
| `mesas.artificiorpg.com` | `http://mesas-app:80` | Produção prevista, ainda não publicada nesta rodada |
| `glossariorpg.artificiorpg.com` | `http://glossario-app:80` | Glossário, não mexer sem escopo explícito |
| `glossariobeta.artificiorpg.com` | `http://glossario-beta-app:80` | Glossário beta, não mexer sem escopo explícito |
| `telegram.artificiorpg.com` | `http://web:5000` | Bot Telegram, não mexer sem escopo explícito |

---

## 7. Limitações conhecidas do `gh` na VM

Ver `ERRORS_SOLUTIONS.md` E055 e E056.

Comando canônico:
```bash
gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt
```

---

## 8. Fuso horário

Logs do servidor seguem UTC.

Para correlação operacional, considerar `America/Araguaina` como referência local do projeto.

Quando houver workers futuros efetivamente ativos, o agendamento seguirá `AGGREGATOR_CRON_SCHEDULE` definido no ambiente.

---

## 9. Outros recursos no servidor

| Item | Localização | Observação |
|---|---|---|
| `stress-test-semanal.sh` | `/opt/stress-test-semanal.sh` | Script de carga agendado; não remover sem verificar cron ativo |

### Volumes Docker esperados

| Volume lógico | Ambiente | Observação |
|---|---|---|
| `pgdata_mesas_beta` | Beta | No host, o nome real pode receber prefixo do compose |
| `pgdata_mesas_prod` | Produção | No host, o nome real pode receber prefixo do compose |

---

## 10. Playbook canônico de promoção `dev` -> `main`

> Sempre seguir este playbook antes de qualquer push para `main`.
> Autorização explícita do responsável é obrigatória antes de iniciar.

### 10.1 Objetivo da promoção

- Promover para produção apenas código validado no beta
- Preservar o isolamento entre beta e produção
- Evitar divergência entre ambiente remoto e fluxo versionado

### 10.2 Checklist de GO/NO-GO

1. Confirmar autorização explícita no chat
2. Confirmar branch candidata e divergência entre refs
3. Confirmar build local aplicável sem erro
4. Confirmar que a produção está pronta para primeira publicação, quando for o caso
5. Confirmar que não haverá sobrescrita indevida de `.env` remoto
6. Confirmar que a validação do beta foi concluída

### 10.3 Comandos de referência

```bash
git rev-parse --abbrev-ref HEAD
git rev-list --left-right --count origin/main...origin/dev
git worktree list
```

### 10.4 Regra final

- Sem autorização explícita, não promover
- Sem validação do beta, não promover
- Sem consistência documental mínima, não promover

---

## 11. Heurísticas de Usabilidade (10 Heurísticas de Nielsen)

> [!IMPORTANT]
> **REGRA OBRIGATÓRIA:** Toda nova funcionalidade de interface deve respeitar as 10 heurísticas de usabilidade de Jakob Nielsen desde o design inicial. Interfaces que violam essas heurísticas devem ser rejeitadas ou corrigidas antes do merge.

### 11.1 Visibilidade do Status do Sistema

**Princípio:** O sistema deve sempre manter os usuários informados sobre o que está acontecendo, através de feedback apropriado em tempo razoável.

**Aplicação prática:**
- Indicadores de carregamento durante requisições assíncronas
- Feedback visual ao salvar/publicar mesas (spinner, mensagem de sucesso)
- Breadcrumbs ou indicador de posição no fluxo de onboarding
- Status de aprovação/rejeição visível em sugestões de sistemas
- Badge de contador em notificações não lidas

**Exemplo negativo:** Botão "Publicar Mesa" que não mostra feedback enquanto processa, deixando o usuário sem saber se clicou corretamente.

**Exemplo positivo:** Playlist do YouTube mostra qual vídeo está sendo reproduzido, quais já foram assistidos e quais vêm a seguir.

---

### 11.2 Compatibilidade entre o Sistema e o Mundo Real

**Princípio:** O sistema deve falar a linguagem do usuário, com palavras, frases e conceitos familiares, ao invés de jargão técnico. Seguir convenções do mundo real, fazendo a informação aparecer em ordem natural e lógica.

**Aplicação prática:**
- Usar "Mestre" ao invés de "GM" ou "Dungeon Master" quando o contexto for brasileiro
- Ícones reconhecíveis (lupa para busca, sino para notificações, engrenagem para configurações)
- Linguagem natural em mensagens de erro ("Você precisa preencher o título da mesa" ao invés de "Campo 'title' é obrigatório")
- Termos do universo RPG que a comunidade já conhece

**Exemplo negativo:** Modal de revisão de candidatos mostrando JSON bruto ao invés de campos formatados.

**Exemplo positivo:** Usar ícone de d20 para representar sistemas de RPG, megafone para "Apenas Anunciante".

---

### 11.3 Controle e Liberdade para o Usuário

**Princípio:** Usuários frequentemente escolhem funções por engano e precisam de uma "saída de emergência" claramente marcada para sair do estado indesejado sem ter que passar por um diálogo extenso.

**Aplicação prática:**
- Botão "Cancelar" em todos os formulários
- Confirmação antes de ações destrutivas (deletar mesa, rejeitar candidato)
- Possibilidade de editar mesa após publicação
- Desfazer ações quando possível (ex: restaurar mesa deletada da lixeira)
- Fechar modais com ESC ou clicando fora

**Exemplo negativo:** Formulário de criação de mesa sem botão "Cancelar", forçando o usuário a preencher ou fechar a aba.

**Exemplo positivo:** Gmail permite recuperar e-mails deletados da lixeira.

---

### 11.4 Consistência e Padronização

**Princípio:** Usuários não devem ter que se perguntar se palavras, situações ou ações diferentes significam a mesma coisa. Seguir convenções de plataforma.

**Aplicação prática:**
- Botões de ação primária sempre na mesma cor (ex: verde para aprovar, vermelho para rejeitar)
- Layout consistente entre páginas (header, footer, navegação)
- Padrão de formulários (labels, placeholders, validação)
- Nomenclatura consistente ("Mesa" vs "Anúncio", escolher um e manter)
- Ícones com significado consistente em toda a aplicação

**Exemplo negativo:** Botão "Salvar" em uma página e "Confirmar" em outra para a mesma ação.

**Exemplo positivo:** Material Design do Google mantém padrões visuais e de interação consistentes em todos os produtos.

---

### 11.5 Prevenção de Erros

**Princípio:** Melhor do que boas mensagens de erro é um design cuidadoso que previne que o problema ocorra. Eliminar condições propensas a erro ou verificar e apresentar aos usuários uma opção de confirmação antes de se comprometerem com a ação.

**Aplicação prática:**
- Validação em tempo real de campos obrigatórios
- Desabilitar botão "Publicar" até que todos os campos obrigatórios estejam preenchidos
- Confirmação antes de deletar mesa ou rejeitar candidato
- Limitar caracteres em campos com limite (ex: título com 100 caracteres)
- Prevenir envio de formulário incompleto

**Exemplo negativo:** Permitir publicar mesa sem contato, gerando erro apenas no backend.

**Exemplo positivo:** Caixa de confirmação ao deletar arquivo no Windows.

---

### 11.6 Reconhecimento em Vez de Memorização

**Princípio:** Minimizar a carga de memória do usuário tornando objetos, ações e opções visíveis. O usuário não deve ter que lembrar informações de uma parte do diálogo para outra. Instruções de uso do sistema devem estar visíveis ou facilmente recuperáveis quando apropriado.

**Aplicação prática:**
- Dropdown de sistemas ao invés de campo de texto livre
- Autocomplete em campos de busca
- Histórico de buscas recentes
- Pré-preencher formulários com dados já conhecidos
- Mostrar preview de imagem após upload

**Exemplo negativo:** Exigir que o usuário lembre o slug exato do sistema para criar uma mesa.

**Exemplo positivo:** Salvar arquivo no Excel mostra pastas recentes e sugestões de nome baseadas no conteúdo.

---

### 11.7 Eficiência e Flexibilidade de Uso

**Princípio:** Aceleradores — invisíveis para usuários novatos — podem frequentemente acelerar a interação para usuários experientes, de modo que o sistema possa atender tanto usuários inexperientes quanto experientes.

**Aplicação prática:**
- Atalhos de teclado (Enter para enviar formulário, ESC para fechar modal)
- Ações em lote (aprovar/rejeitar múltiplos candidatos)
- Filtros avançados no catálogo para usuários experientes
- Modo de edição rápida para mestres com muitas mesas
- Botão "Aprovar" rápido vs "Revisar" detalhado para candidatos

**Exemplo negativo:** Forçar admin a revisar cada candidato individualmente sem opção de aprovação em lote.

**Exemplo positivo:** Alt+Tab, Ctrl+C/Ctrl+V, Windows+D são atalhos que aceleram tarefas comuns.

---

### 11.8 Estética e Design Minimalista

**Princípio:** Diálogos não devem conter informação irrelevante ou raramente necessária. Cada unidade extra de informação em um diálogo compete com as unidades relevantes de informação e diminui sua visibilidade relativa.

**Aplicação prática:**
- Mostrar apenas campos essenciais no card de mesa do catálogo
- Detalhes secundários em abas ou seções expansíveis
- Evitar poluição visual com informações técnicas (IDs, timestamps internos)
- Priorizar informação relevante para a decisão do usuário
- Usar hierarquia visual (tamanho, cor, espaçamento)

**Exemplo negativo:** Modal de revisão mostrando JSON bruto com todos os campos técnicos.

**Exemplo positivo:** Medium mantém interface limpa focando no conteúdo, com controles secundários discretos.

---

### 11.9 Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar-se de Erros

**Princípio:** Mensagens de erro devem ser expressas em linguagem simples (sem códigos), indicar precisamente o problema e sugerir construtivamente uma solução.

**Aplicação prática:**
- Mensagens de erro claras e acionáveis ("Título da mesa é obrigatório" ao invés de "Erro 400")
- Destacar campo com erro no formulário
- Sugerir correção ("Você quis dizer 'D&D 5e'?")
- Evitar jargão técnico em mensagens visíveis ao usuário
- Mostrar motivo de rejeição de forma clara

**Exemplo negativo:** Erro genérico "Falha ao criar mesa" sem indicar qual campo está incorreto.

**Exemplo positivo:** Formulário de cadastro do Spotify destaca campos não preenchidos e explica o que está errado.

---

### 11.10 Ajuda e Documentação

**Princípio:** Embora seja melhor que o sistema possa ser usado sem documentação, pode ser necessário fornecer ajuda e documentação. Qualquer informação deve ser fácil de buscar, focada na tarefa do usuário, listar passos concretos a serem realizados e não ser muito extensa.

**Aplicação prática:**
- Tooltips em campos complexos (ex: "O que é DDAL?")
- Link "Saiba mais" em funcionalidades avançadas
- FAQ acessível no footer
- Mensagens de ajuda contextual (ex: "Primeira vez criando uma mesa? Veja nosso guia")
- Documentação de API para desenvolvedores

**Exemplo negativo:** Usuário não sabe o que é "publisher_role" e não há explicação disponível.

**Exemplo positivo:** Aplicativos com seção "Ajuda" acessível, tutoriais interativos ou chatbot de suporte.

---

### 11.11 Checklist de Validação UX

Ao implementar ou revisar uma funcionalidade, validar:

- [ ] **H1 - Visibilidade:** Há feedback visual para todas as ações do usuário?
- [ ] **H2 - Linguagem:** A interface usa termos familiares à comunidade RPG brasileira?
- [ ] **H3 - Controle:** Usuário pode cancelar/desfazer ações facilmente?
- [ ] **H4 - Consistência:** Padrões visuais e de interação são consistentes?
- [ ] **H5 - Prevenção:** Erros comuns são prevenidos por design?
- [ ] **H6 - Reconhecimento:** Usuário não precisa memorizar informações entre telas?
- [ ] **H7 - Eficiência:** Há atalhos para usuários experientes?
- [ ] **H8 - Minimalismo:** Apenas informação essencial está visível?
- [ ] **H9 - Recuperação:** Mensagens de erro são claras e acionáveis?
- [ ] **H10 - Ajuda:** Há documentação/ajuda contextual quando necessário?

---

### 11.12 Exemplos de Violações Identificadas (REQ-17)

| Componente | Heurística Violada | Problema | Solução Proposta |
|---|---|---|---|
| Modal "Revisar Candidato" | H8 (Minimalismo), H6 (Reconhecimento) | Mostra JSON bruto inútil ao invés de formulário editável | Substituir por formulário de edição de mesa pré-preenchido |
| Gestão de Mesas Importadas | H7 (Eficiência) | Falta botão "Rejeitar Todas" para ações em lote | Adicionar botão de rejeição em lote |
| Gestão de Mesas Importadas | H6 (Reconhecimento) | Falta filtros de preço (Grátis/Pagas/Não Identificadas) | Adicionar filtros de preço com detecção automática |
| Formulários em geral | H5 (Prevenção) | Validação apenas no backend, sem feedback em tempo real | Implementar validação client-side com feedback visual |

**Nota:** Lista será expandida durante auditoria completa (REQ-17).

