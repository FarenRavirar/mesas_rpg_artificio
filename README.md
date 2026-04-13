# 🎲 Anúncios de Mesas RPG

> **Plataforma colaborativa para descoberta e publicação de mesas de RPG de mesa no Brasil**

[![Beta](https://img.shields.io/badge/beta-mesasbeta.artificiorpg.com-orange)](https://mesasbeta.artificiorpg.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)

---

## 🌟 O que é este projeto?

O **Anúncios de Mesas RPG** é uma plataforma gratuita e colaborativa que conecta mestres e jogadores de RPG de mesa em todo o Brasil. Nosso objetivo é facilitar a descoberta de mesas abertas e permitir que mestres divulguem suas campanhas de forma profissional e organizada.

### Por que este projeto existe?

- **Centralização:** Anúncios de mesas estão espalhados em dezenas de grupos no Discord, Facebook, Reddit e WhatsApp. Queremos reunir tudo em um só lugar.
- **Profissionalização:** Mestres merecem uma vitrine digna para suas campanhas, com landing pages ricas e filtros inteligentes.
- **Acessibilidade:** 100% gratuito, sem anúncios, sem paywalls. A comunidade brasileira de RPG merece uma ferramenta de qualidade sem barreiras.

---

## ✨ Funcionalidades

### Para Jogadores
- 🔍 **Busca avançada** por sistema, modalidade, dia da semana, preço, idioma e mais
- 📋 **Catálogo público** com todas as mesas ativas
- 💾 **Salvar mesas favoritas** para acompanhar vagas
- 💬 **Perguntas públicas** para mestres (em desenvolvimento)
- ⭐ **Avaliações** de mesas participadas (em desenvolvimento)

### Para Mestres
- 📝 **Autopublicação** de mesas com formulário completo
- 🎨 **Landing page personalizada** com bio, especialidades e estatísticas
- 📊 **Painel de gestão** para editar mesas, gerenciar vagas e responder perguntas
- 🔗 **Integração com Discord/WhatsApp** para recrutamento direto
- 📈 **Métricas de engajamento** (visualizações, cliques, conversões)

### Para Administradores
- 🛡️ **Moderação** de anúncios com histórico de alterações
- 🏷️ **Gestão de taxonomias** (sistemas, cenários, tags)
- 🤖 **Ingestão automática** de anúncios externos (em desenvolvimento)
- 📊 **Painel administrativo** completo

---

## 🚀 Experimente agora

**Ambiente Beta:** [mesasbeta.artificiorpg.com](https://mesasbeta.artificiorpg.com)

O beta está ativo e funcional! Você pode:
- Navegar pelo catálogo de mesas
- Criar uma conta com Google OAuth
- Publicar suas próprias mesas
- Testar todas as funcionalidades principais

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (design system Artifício)
- **React Query** para cache e sincronização
- **Fuse.js** para busca client-side

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** para persistência
- **Google OAuth 2.0** para autenticação
- **JWT** para sessões
- **Imgur API** para hospedagem de imagens

### Infraestrutura
- **Docker** + **Docker Compose**
- **Nginx** como servidor web
- **GitHub Actions** para CI/CD
- **Cloudflare Tunnel** para exposição pública

---

## 🤝 Como Contribuir

Adoraríamos sua ajuda para tornar este projeto ainda melhor! Existem várias formas de contribuir:

### 1. Testando e Reportando Bugs

Acesse o [beta](https://mesasbeta.artificiorpg.com) e teste as funcionalidades. Se encontrar algum problema:

1. Verifique se já existe uma [issue aberta](https://github.com/FarenRavirar/mesas_rpg_artificio/issues)
2. Se não, [crie uma nova issue](https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new) com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs comportamento atual
   - Screenshots (se aplicável)

### 2. Sugerindo Funcionalidades

Tem uma ideia para melhorar a plataforma? [Abra uma issue](https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new) com a tag `enhancement` e descreva:
- O problema que a funcionalidade resolve
- Como você imagina que funcionaria
- Por que seria útil para a comunidade

### 3. Contribuindo com Código

#### Pré-requisitos
- Node.js 18+ instalado
- Git configurado
- Conta no GitHub

#### Setup do Ambiente Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/FarenRavirar/mesas_rpg_artificio.git
   cd mesas_rpg_artificio
   ```

2. **Instale as dependências:**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Configure o ambiente local:**
   
   Consulte a [documentação completa de ambiente local](ARQUITETURA_PROJETO.md#32-ambiente-de-desenvolvimento-local-localhost) para instruções detalhadas sobre:
   - Configuração do túnel SSH para o banco de dados beta
   - Variáveis de ambiente necessárias
   - Como rodar frontend e backend localmente

4. **Crie uma branch para sua feature:**
   ```bash
   git checkout -b feature/minha-feature
   ```

5. **Faça suas alterações e teste localmente**

6. **Commit suas mudanças:**
   ```bash
   git add .
   git commit -m "feat: descrição clara da mudança"
   ```

7. **Push para o GitHub:**
   ```bash
   git push origin feature/minha-feature
   ```

8. **Abra um Pull Request:**
   - Acesse o repositório no GitHub
   - Clique em "Pull Requests" → "New Pull Request"
   - Selecione sua branch
   - Descreva suas alterações de forma clara
   - Aguarde revisão

#### Convenções de Código

- **TypeScript:** Todo código deve ser 100% tipado
- **Commits:** Seguir [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` para novas funcionalidades
  - `fix:` para correções de bugs
  - `docs:` para documentação
  - `refactor:` para refatorações
  - `test:` para testes
- **Linting:** O projeto usa ESLint e Prettier (configurados automaticamente)
- **Pre-commit hooks:** Validação de tipos TypeScript antes de cada commit

### 4. Melhorando a Documentação

Documentação clara é essencial! Você pode ajudar:
- Corrigindo erros de digitação
- Melhorando explicações confusas
- Adicionando exemplos práticos
- Traduzindo documentação (futuro)

---

## 📚 Documentação Técnica

Para desenvolvedores que querem entender a arquitetura do projeto:

- **[ARQUITETURA_PROJETO.md](ARQUITETURA_PROJETO.md)** — Documento completo de arquitetura, modelo de dados, decisões técnicas
- **[GIT_WORKFLOW.md](.agents/rules/GIT_WORKFLOW.md)** — Fluxo de Git, branches e deploy
- **[ERRORS_SOLUTIONS.md](ERRORS_SOLUTIONS.md)** — Catálogo de erros conhecidos e soluções

---

## 🎯 Roadmap

### ✅ Fase 1 — MVP Público (Concluído)
- [x] Autenticação Google OAuth
- [x] Catálogo público de mesas
- [x] Página individual de mesa
- [x] Landing page do mestre
- [x] Painel do mestre (criar/editar mesas)
- [x] Filtros estruturados
- [x] Deploy em beta

### 🚧 Fase 2 — Moderação e Administração (Em Andamento)
- [x] Painel administrativo
- [x] Gestão de taxonomias (sistemas, cenários)
- [x] Notificações in-app
- [ ] Curadoria de destaques da home
- [ ] Bookmarks de mesas

### 📋 Fase 3 — Engajamento Social (Planejado)
- [ ] Módulo de perguntas e respostas
- [ ] Sistema de avaliações
- [ ] Notificações de novas respostas
- [ ] Filtros salvos por usuário

### 🌱 Fase 4 — Crescimento (Futuro)
- [ ] Recomendações baseadas em preferências
- [ ] Notificações por email
- [ ] SEO estruturado
- [ ] Exportação WhatsApp/Discord

---

## 💡 Compromissos Públicos

Estes compromissos são inegociáveis e guiam todas as decisões do projeto:

- ✅ **100% gratuito** — Nenhuma funcionalidade será colocada atrás de paywall
- ✅ **Sem anúncios** — Nenhum espaço de publicidade paga na interface
- ✅ **Privacidade** — Apenas dados estritamente necessários são coletados
- ✅ **Neutralidade** — Mesas gratuitas e pagas coexistem sem discriminação

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + TypeScript + Tailwind CSS + React Query           │
│  (localhost:5173 dev | mesasbeta.artificiorpg.com prod)    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  Node.js + Express + TypeScript + JWT                      │
│  (localhost:3000 dev | container interno prod)             │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                            │
│  Banco de dados relacional com migrations versionadas      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testando Localmente

### Opção 1: Testar no Beta (Recomendado)

A forma mais simples de testar é acessar diretamente o [beta](https://mesasbeta.artificiorpg.com). Todas as funcionalidades estão disponíveis e você pode criar uma conta real.

### Opção 2: Rodar Localmente

Se você quer desenvolver ou testar alterações localmente, consulte a [documentação de ambiente local](ARQUITETURA_PROJETO.md#32-ambiente-de-desenvolvimento-local-localhost).

**Resumo rápido:**
1. Configure túnel SSH para o banco de dados beta
2. Configure variáveis de ambiente no `backend/.env`
3. Configure proxy Vite no `frontend/vite.config.ts`
4. Rode backend (`npm run dev` na pasta `backend`)
5. Rode frontend (`npm run dev` na pasta `frontend`)
6. Acesse `http://localhost:5173`

---

## 🐛 Problemas Conhecidos

- **Imagens do Discord expiram:** URLs de imagens do Discord contêm tokens temporários que expiram. Solução: re-upload para Imgur (em desenvolvimento)
- **Health check retorna 500:** Problema conhecido, não afeta funcionalidade principal
- **OAuth local requer configuração:** Para testar login localmente, é necessário configurar credenciais do Google OAuth

Consulte [ERRORS_SOLUTIONS.md](ERRORS_SOLUTIONS.md) para lista completa de problemas conhecidos e soluções.

---

## 📞 Contato e Comunidade

- **Discord:** [Artifício RPG](https://discord.gg/artificiorpg) (comunidade principal)
- **Issues:** [GitHub Issues](https://github.com/FarenRavirar/mesas_rpg_artificio/issues)
- **Email:** paulohenriquercc@gmail.com (mantenedor principal)

---

## 📄 Licença

Este projeto é licenciado sob a [MIT License](LICENSE) — você é livre para usar, modificar e distribuir, desde que mantenha os créditos originais.

---

## 🙏 Agradecimentos

Este projeto é parte do ecossistema **Artifício RPG**, uma iniciativa comunitária para criar ferramentas de qualidade para a comunidade brasileira de RPG de mesa.

Agradecimentos especiais a todos que contribuíram com feedback, testes e sugestões durante o desenvolvimento do beta.

---

## 💻 Quer Contribuir?

Este é um projeto **open source** e **colaborativo**! Se você é desenvolvedor, designer, ou simplesmente tem uma ideia para melhorar a plataforma, sua contribuição é muito bem-vinda.

### 🚀 Como você pode ajudar:

- **🐛 Reportar bugs** — Encontrou algo quebrado? [Abra uma issue](https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new)
- **💡 Sugerir melhorias** — Tem uma ideia? [Compartilhe conosco](https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new)
- **👨‍💻 Contribuir com código** — Veja nosso [guia de contribuição](#3-contribuindo-com-código) acima
- **📖 Melhorar a documentação** — Toda ajuda é bem-vinda!
- **⭐ Dar uma estrela** — Mostre seu apoio no [GitHub](https://github.com/FarenRavirar/mesas_rpg_artificio)

**Repositório:** [github.com/FarenRavirar/mesas_rpg_artificio](https://github.com/FarenRavirar/mesas_rpg_artificio)

---

## 🎲 Vamos jogar RPG juntos!

Se você chegou até aqui, obrigado pelo interesse! Este projeto só existe porque acreditamos que a comunidade brasileira de RPG merece ferramentas melhores.

**Contribua, teste, divulgue e, principalmente, jogue muito RPG! 🎲**

---

<div align="center">

### Feito com ❤️ pela comunidade Artifício RPG

[![GitHub](https://img.shields.io/badge/GitHub-FarenRavirar%2Fmesas__rpg__artificio-blue?logo=github)](https://github.com/FarenRavirar/mesas_rpg_artificio)
[![Issues](https://img.shields.io/github/issues/FarenRavirar/mesas_rpg_artificio)](https://github.com/FarenRavirar/mesas_rpg_artificio/issues)
[![Stars](https://img.shields.io/github/stars/FarenRavirar/mesas_rpg_artificio?style=social)](https://github.com/FarenRavirar/mesas_rpg_artificio)

**[🌐 Beta](https://mesasbeta.artificiorpg.com)** • **[📖 Documentação](ARQUITETURA_PROJETO.md)** • **[💬 Discord](https://discord.gg/artificiorpg)** • **[🐛 Issues](https://github.com/FarenRavirar/mesas_rpg_artificio/issues)**

</div>
