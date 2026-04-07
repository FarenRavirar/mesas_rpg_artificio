# 🎲 Mesas RPG - Portal de Anúncios de Mesas de RPG

[![Status](https://img.shields.io/badge/status-beta-yellow)](https://mesasbeta.artificiorpg.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/FarenRavirar/mesas_rpg_artificio)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **Conectando mestres e jogadores de RPG em todo o Brasil** 🇧🇷

Portal gratuito e sem anúncios para publicação e descoberta de mesas de RPG. Criado pela comunidade Artifício RPG.

---

## 🌟 Features

### Para Mestres
- ✅ **Publicação gratuita** de mesas de RPG
- ✅ **Perfil público** personalizável
- ✅ **Dashboard de métricas** (visualizações, contatos, conversão)
- ✅ **Gestão completa** de mesas (criar, editar, ativar/desativar, deletar)
- ✅ **Upload de imagens** (capa de mesa, avatar, banner)
- ✅ **Múltiplos canais de contato** (Discord, WhatsApp, Telegram, etc)

### Para Jogadores
- ✅ **Busca avançada** por sistema, modalidade, localização
- ✅ **Filtros inteligentes** para encontrar a mesa ideal
- ✅ **Visualização detalhada** de cada mesa
- ✅ **Contato direto** com o mestre
- ✅ **Perfis públicos** de mestres

### Segurança e Privacidade
- 🔐 **Autenticação via Google OAuth 2.0**
- 🔐 **Sessões seguras** (HttpOnly cookies)
- 🔐 **Proteção contra XSS**
- 🔐 **CORS restrito**
- 🔐 **Sem coleta desnecessária de dados**

---

## 🚀 Acesso Rápido

- **Beta:** [mesasbeta.artificiorpg.com](https://mesasbeta.artificiorpg.com)
- **Produção:** [mesas.artificiorpg.com](https://mesas.artificiorpg.com) _(em breve)_
- **Documentação:** [docs/](docs/)
- **Postman Collection:** [postman/](postman/)

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Node.js 22 (LTS)
- **Framework:** Express.js
- **Linguagem:** TypeScript (strict mode)
- **Banco de Dados:** PostgreSQL 16
- **Autenticação:** JWT + Google OAuth 2.0
- **Upload de Imagens:** Imgur API
- **Containerização:** Docker

### Frontend
- **Framework:** React 18
- **Linguagem:** TypeScript (strict mode)
- **Build Tool:** Vite
- **Roteamento:** React Router v6
- **Estado Global:** Context API
- **Estilização:** CSS Vanilla (variáveis CSS)
- **Ícones:** Lucide React
- **Notificações:** React Hot Toast

### Infraestrutura
- **Servidor:** Oracle Cloud (VM ARM64)
- **Proxy Reverso:** Nginx
- **Túnel:** Cloudflare Tunnel
- **CI/CD:** Git-based deployment
- **Monitoramento:** Docker logs

---

## 📦 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 22+
- PostgreSQL 16+
- Docker (opcional, recomendado)
- Conta Google Cloud (para OAuth)
- Conta Imgur (para upload de imagens)

### 1. Clone o repositório

```bash
git clone https://github.com/FarenRavirar/mesas_rpg_artificio.git
cd mesas_rpg_artificio
```

### 2. Configure as variáveis de ambiente

#### Backend (.env)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# Banco de Dados
DATABASE_URL=postgresql://admin:senha@localhost:5432/mesas_rpg

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Imgur
IMGUR_CLIENT_ID=seu_imgur_client_id
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

### 3. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Configure o banco de dados

```bash
# Criar banco
createdb mesas_rpg

# Rodar migrations
cd backend
npm run migrate
```

### 5. Inicie os servidores

```bash
# Backend (porta 3000)
cd backend
npm run dev

# Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🐳 Docker (Recomendado)

### Desenvolvimento Local

```bash
# Subir todos os serviços
docker-compose -f docker-compose.beta.yml up -d

# Ver logs
docker-compose -f docker-compose.beta.yml logs -f

# Parar serviços
docker-compose -f docker-compose.beta.yml down
```

### Build de Produção

```bash
# Backend
docker build -t mesas-backend:latest ./backend

# Frontend (com build arg obrigatório)
docker build \
  --build-arg VITE_API_URL=https://mesas.artificiorpg.com \
  -t mesas-frontend:latest \
  ./frontend
```

---

## 📚 Documentação

### Arquitetura
- [ARQUITETURA_PROJETO.md](ARQUITETURA_PROJETO.md) - Arquitetura completa do sistema
- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) - Fluxo de Git e deploy
- [OPERACAO_PRODUCAO.md](OPERACAO_PRODUCAO.md) - Runbook operacional

### Desenvolvimento
- [AGENTS.md](AGENTS.md) - Governança de agentes de IA
- [ERRORS_SOLUTIONS.md](ERRORS_SOLUTIONS.md) - Soluções de erros conhecidos
- [PRE-FLIGHT_CHECKLIST.md](PRE-FLIGHT_CHECKLIST.md) - Checklist de ambiente

### Gestão
- [TODO_OPERACIONAL.md](TODO_OPERACIONAL.md) - Backlog de produto
- [FILA_IMPLEMENTACAO.md](FILA_IMPLEMENTACAO.md) - Fila técnica
- [GUIA_RAPIDO_OPERACIONAL.md](GUIA_RAPIDO_OPERACIONAL.md) - Índice rápido

---

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run build  # Valida TypeScript
npm run lint   # Valida ESLint
```

### E2E (Manual)
Consulte: [sessoes/checklist_validacao_oauth.md](sessoes/checklist_validacao_oauth.md)

---

## 🚀 Deploy

### Beta (Automático)
```bash
git push origin dev
# Deploy automático em mesasbeta.artificiorpg.com
```

### Produção (Manual)
```bash
# 1. Merge para main
git checkout main
git merge dev
git push origin main

# 2. Criar tag
git tag -a v1.0.0 -m "Release v1.0.0 Fortuna"
git push origin v1.0.0

# 3. Deploy no servidor
ssh usuario@servidor-prod
cd /opt/mesas
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Convenção de Commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (sem mudança de código)
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/FarenRavirar/mesas_rpg_artificio/issues) com:

- **Descrição clara** do problema
- **Passos para reproduzir**
- **Comportamento esperado** vs **comportamento atual**
- **Screenshots** (se aplicável)
- **Ambiente** (navegador, OS, versão)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 🌐 Comunidade

- **Discord:** [Artifício RPG](https://discord.gg/artificiorpg)
- **Site:** [artificiorpg.com](https://artificiorpg.com)
- **Glossário:** [glossario.artificiorpg.com](https://glossario.artificiorpg.com)

---

## 📞 Contato

- **Maintainer:** Paulo (Faren)
- **Email:** contato@artificiorpg.com
- **Discord:** @faren

---

## 🙏 Agradecimentos

- Comunidade **Artifício RPG** pelo suporte e feedback
- Todos os **mestres e jogadores** que testaram o beta
- **Kiro AI** pela assistência no desenvolvimento

---

## 📊 Status do Projeto

### Roadmap

#### ✅ v1.0.0 "Fortuna" (Atual)
- Autenticação OAuth
- Publicação de mesas
- Painel do mestre
- Dashboard de métricas

#### 🚧 v1.1.0 "Conexão" (Maio 2026)
- Discord OAuth
- Vínculo de perfil Discord
- Selos de comunidade

#### 📋 v1.2.0 "Descoberta" (Junho 2026)
- Sistema de favoritos
- Histórico de mesas
- Recomendações personalizadas

#### 📋 v1.3.0 "Engajamento" (Julho 2026)
- Notificações por e-mail
- Sistema de avaliações
- Badges de mestre

---

## 💡 FAQ

### Por que criar mais um portal de mesas?
Porque acreditamos em ferramentas **gratuitas, sem anúncios e focadas na comunidade brasileira de RPG**.

### É realmente gratuito?
Sim! Sem taxas, sem anúncios, sem pegadinhas. Mantido pela comunidade Artifício RPG.

### Posso usar para RPG comercial?
Sim! Mestres profissionais são bem-vindos.

### Suporta quais sistemas?
Todos! D&D, Pathfinder, Tormenta, Ordem Paranormal, Call of Cthulhu, e qualquer outro sistema de RPG.

### Como reporto um problema?
Abra uma [issue no GitHub](https://github.com/FarenRavirar/mesas_rpg_artificio/issues) ou entre em contato no Discord.

---

## 🎲 Que os dados sejam favoráveis!

**Feito com ❤️ pela comunidade Artifício RPG**

---

**Última atualização:** 07/04/2026  
**Versão:** 1.0.0 "Fortuna"
