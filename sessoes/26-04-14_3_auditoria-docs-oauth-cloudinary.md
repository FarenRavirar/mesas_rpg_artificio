# Sessão — 14/04 — Auditoria documental OAuth + Cloudinary

## 1) Objetivo da sessão
Revisar e atualizar os documentos canônicos para refletir com precisão os contratos atuais de OAuth local e imagens (Cloudinary/aliases), eliminando divergências com o código em runtime.

## 2) Plano de execução
1. Auditar contratos reais no backend/frontend (OAuth, cookies, aliases de imagem).
2. Auditar os 4 documentos-alvo e listar divergências concretas.
3. Aplicar correções mínimas e pontuais nos documentos canônicos.
4. Validar consistência cruzada entre documentos e código.
5. Atualizar resumo da sessão e `RESUMO_EXECUCAO.md`.
6. Executar correção técnica do preload (`banner_url ?? image_url`) e registrar priorização máxima do item Cloudinary (153) na fila.

## 3) Task list embutida
- [x] Confirmar contratos OAuth atuais (`FRONTEND_URLS`, `frontend_redirect`, cookie `am_session`, `COOKIE_SAME_SITE`).
- [x] Confirmar contratos de imagem atuais (`banner_url`, aliases `image_url` e `cover_url`).
- [x] Revisar `ARQUITETURA_PROJETO.md` e corrigir divergências.
- [x] Revisar `MAPA_DE_API.md` e corrigir divergências.
- [x] Revisar `OPERACAO_PRODUCAO.md` e corrigir divergências.
- [x] Revisar `CLOUDINARY_INTEGRATION_GUIDE.md` e corrigir divergências.
- [x] Executar busca final por termos divergentes nos 4 documentos.
- [x] Atualizar checklist desta sessão com todos os itens em `[x]`.
- [x] Atualizar `RESUMO_EXECUCAO.md` apontando para esta sessão.
- [x] Corrigir mapper de preload no formulário (`banner_url ?? image_url`).
- [x] Atualizar `FILA_IMPLEMENTACAO.md` com item 153 em prioridade máxima imediata.
- [ ] Revalidar login local (`localhost:5173`) com sessão ativa em `GET /api/v1/me` (adiado por solicitação do usuário).

## 4) Arquivos-alvo
- `ARQUITETURA_PROJETO.md`
- `MAPA_DE_API.md`
- `OPERACAO_PRODUCAO.md`
- `CLOUDINARY_INTEGRATION_GUIDE.md`
- `sessoes/resumo_14-04_auditoria-docs-oauth-cloudinary.md`
- `RESUMO_EXECUCAO.md`

## 5) Critério de conclusão
- Os 4 documentos refletem o contrato real do código em runtime.
- Nenhuma referência incorreta aos aliases/fluxos de imagem permanece nos trechos auditados.
- OAuth local documentado com `FRONTEND_URLS` e política de cookie compatível com cross-origin.
- Busca final sem ocorrências de termos incorretos nos arquivos auditados.
- Mapper de preload de banner corrigido para contrato real do endpoint de detalhe.
- Item 153 registrado na fila com prioridade máxima imediata.

## 6) Encerramento obrigatório
- [x] Atualizar `RESUMO_EXECUCAO.md` apontando para esta sessão
