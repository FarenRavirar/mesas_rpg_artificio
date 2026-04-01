# GUIA_RAPIDO_OPERACIONAL.md

Resumo executivo para reduzir custo de contexto dos agentes, com navegação rápida por cenário.

> [!IMPORTANT]
> Este guia **não substitui** os arquivos canônicos.
> Em caso de conflito, prevalecem: `AGENTS.md` → `AI_CONTEXT_INDEX.md` → `ARQUITETURA_PROJETO.md`.

---

## Índice rápido (use primeiro)

| Cenário | Ler primeiro (atalho) | Fonte canônica principal | Decisão rápida |
|---|---|---|---|
| Onboarding (3 etapas) | Seção 1 deste guia | `ARQUITETURA_PROJETO.md` §7.5 | `AuthCallback` deve redirecionar para `/onboarding` quando `onboarding_completed=false` |
| Catálogo e busca pública | Seção 2 | `ARQUITETURA_PROJETO.md` §7.1-7.3 | Busca/filtros ficam no Frontend, API retorna dados públicos |
| Landing pública de mestre | Seção 3 | `ARQUITETURA_PROJETO.md` §7.4 | Nunca expor `avatar_deletehash`/`banner_deletehash` |
| OAuth / JWT / roles | Seção 4 | `ARQUITETURA_PROJETO.md` §6 | Segurança e role no Backend, nunca no Frontend |
| Imagens e Imgur | Seção 5 | `ARQUITETURA_PROJETO.md` §16 | Upload/remoção só no Backend |
| Deploy / Git / promoção | Seção 6 | `GIT_WORKFLOW.md` + `OPERACAO_PRODUCAO.md` | Sem `push`/`commit` sem autorização explícita |
| Erros de execução | Seção 7 | `ERRORS_SOLUTIONS.md` | Ao primeiro erro: parar e aplicar solução catalogada |

---

## Contratos inegociáveis (snapshot)

| Tema | Regra |
|---|---|
| Idioma | Toda comunicação em português |
| Auth | Apenas Google OAuth |
| JWT | Backend valida token em rotas privadas |
| Role | `player -> gm` somente no Backend ao criar `gm_profile` |
| Dados sensíveis | Nunca retornar `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` em rotas públicas |
| Imagem | Processamento e Imgur exclusivamente no Backend |
| Git | `commit`/`push` só com autorização explícita do usuário |
| Fluxo de branch | `feature/<escopo>` → `dev` (beta) → `main` (produção) |

---

## 1) Onboarding (atalho prático)

### Endpoints mínimos
- `GET /api/v1/me`
- `GET /api/v1/me/options`
- `PUT /api/v1/me/preferences`

### Regra de navegação
1. Login OAuth conclui em `/auth/callback`
2. Front chama `/api/v1/me`
3. Se `onboarding_completed=false` → `/onboarding`
4. Se `true` → Home

### Checklist rápido
- [ ] `display_name` validado
- [ ] mínimo 1 sistema favorito
- [ ] upsert em `user_preferences`
- [ ] payload público sem campos internos

---

## 2) Catálogo público

### Ordem visual mínima do card
1. Tipo/audiência
2. Cover
3. Status contextual
4. Título + sistema
5. Mestre
6. Vagas
7. Modalidade/preço
8. CTA

### Regra de implementação
- Filtro e experiência de busca no Frontend
- API pública entrega só dados necessários ao card e detalhe

---

## 3) Landing pública de mestre

### Deve conter
- Banner, avatar, nome
- Bio longa
- Idiomas/especialidades/badges
- Estatísticas (`tables_count`, `avg_rating`, `reviews_count`)
- Lista de mesas ativas

### Nunca conter
- `avatar_deletehash`
- `banner_deletehash`

---

## 4) OAuth, JWT e role

### Fluxo
1. OAuth Google no Backend
2. Upsert em `users`/`profiles`
3. Geração de JWT
4. Front salva token e segue fluxo de onboarding

### Regra admin master
- Email `paulohenriquercc@gmail.com` deve manter role `admin`

---

## 5) Imagens / Imgur

### Regras pétreas
- `IMGUR_CLIENT_ID` só em variável de ambiente
- Upload/conversão/remoção apenas no Backend
- Limpeza irreversível exige cuidado com `deletehash`

---

## 6) Git e deploy

### Regras operacionais
- Sem `commit`/`push` sem autorização do usuário
- `dev` publica em beta
- `main` publica em produção

### Validação pós-deploy
- `gh run list` (campos compatíveis com VM)
- checagem de logs Docker

---

## 7) Tratamento de erros (obrigatório)

Ao primeiro erro (`stderr`, crash, falha build/pipeline):
1. Parar tentativa em loop
2. Consultar `ERRORS_SOLUTIONS.md`
3. Aplicar solução catalogada
4. Se não existir ID, registrar novo caso no arquivo

---

## Checklist de fechamento — Task de código

- [ ] Escopo entregue sem refactor fora do pedido.
- [ ] Build/teste mínimo executado; resultado registrado inline.
- [ ] Erro ocorreu → `ERRORS_SOLUTIONS.md` consultado e atualizado se inédito.
- [ ] JWT/roles validados no Backend; nenhum segredo ou deletehash exposto.
- [ ] Contrato conferido em `ARQUITETURA_PROJETO.md` (seção aplicável).
- [ ] Docs atualizadas por delta: `GUIA_RAPIDO_OPERACIONAL.md`, `TODO_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md` — só se houve mudança real.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Checklist de fechamento — Task de documentação

- [ ] Alinhado com canônicos: `AGENTS.md`, `AI_CONTEXT_INDEX.md`, `ARQUITETURA_PROJETO.md`.
- [ ] Sem duplicação: resumo + referência ao canônico quando aplicável.
- [ ] Alterações por delta mínimo; links e nomes de seção revisados.
- [ ] Erro recorrente tratado → `ERRORS_SOLUTIONS.md` atualizado no padrão.
- [ ] Mudança de fluxo → refletida em `GUIA_RAPIDO_OPERACIONAL.md`.
- [ ] Impacto em backlog → `TODO_OPERACIONAL.md` e/ou `FILA_IMPLEMENTACAO.md` atualizados.
- [ ] Docs modificadas listadas no resumo da task.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Protocolo de autoatualização contínua (sempre que possível)

Quando uma task alterar contrato, checklist, fluxo recorrente ou decisão operacional:
1. Atualizar **somente por delta** a seção afetada deste guia.
2. Não duplicar regra já presente em arquivo canônico; referenciar o canônico.
3. Se houver conflito, corrigir o guia para refletir o canônico.
4. Registrar no resumo da task que o guia foi atualizado.

> [!NOTE]
> A autoatualização é assistida por agentes (não automática por script). O objetivo é manter este guia sempre enxuto, atual e fiel às fontes canônicas.
