# Sessão 26-04-22_22_verificacao-arquiteture-v5

**Data:** 23/04/2026  
**Objetivo:** Validar cobertura canônica de `.specify/arquiteture.md` contra `ARQUITETURA_PROJETO.md` nos §§ 4, 7, 12 e 16, com patch mínimo imediato para qualquer lacuna literal.

## Vínculos
- **Sessão anterior:** `encerradas/26-04-22_21_check-migracao-v4-errors.md`
- **Próxima sessão:** `26-04-23_1_verificacao_arquiteture_mapa_de_api.md` (continuação autorizada)

## O que vou fazer
1. Localizar no documento original os trechos de referência dos §§ 4, 7, 12 e 16.
2. Localizar as seções equivalentes em `.specify/arquiteture.md`.
3. Montar matriz de cobertura item a item com evidência literal.
4. Corrigir lacunas identificadas em `.specify/arquiteture.md` com alteração mínima e reversível.
5. Revalidar a matriz após patch.

## O que precisa ser feito
1. Confirmar cobertura explícita das tabelas `tables`, `aggregator_import_candidates` e `imgur_cleanup_log`.
2. Confirmar cobertura explícita dos campos de imagem (`cover_url`, `cover_source_type`, `cover_deletehash` e correlatos).
3. Confirmar cobertura integral das rotas de API esperadas no §12 do original.
4. Confirmar fluxo do parser Python (§7) e regras de gestão Imgur (§16).
5. Atualizar `project-state.md` via `/speckit.status` ao final, conforme protocolo.

## O que foi feito
- Sessão 22 criada para execução da checagem canônica V5.
- Leitura de governança obrigatória concluída: `AGENTS.md`, `.specify/memory/project-state.md`, `.specify/memory/constitution.md`, `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`, `docs/sdd/README.md` e `DOCS_AGENT.md`.
- `sessoes/index.md` atualizado para registrar a sessão 22 como ativa e ajustar o próximo sequencial para `26-04-22_23_*`.
- Documento original canônico localizado no histórico Git e materializado em scratch: `ARQUITETURA_PROJETO__f0727ae.md`.
- Seções obrigatórias do original localizadas com evidência literal: §4 (modelo de dados), §7 (funcionalidades com parser Python), §12 (contratos de API) e §16 (gestão de imagens/Imgur).
- Comparação com `.specify/arquiteture.md` executada por trechos; lacunas confirmadas sem inferência: ausência de `aggregator_import_candidates` e `imgur_cleanup_log`, ausência de cobertura explícita de `cover_url`/`cover_source_type`, ausência de fluxo do parser Python e cobertura parcial de rotas/gestão de imagens frente ao original.
- Patch mínimo aplicado em `.specify/arquiteture.md` cobrindo lacunas de modelo de dados, campos de imagem, fluxo de parser Python, rotas de API e política de gestão/cleanup de imagens.
- Revalidação literal pós-patch concluída com evidências por linha nos dois arquivos.
- Correção textual final aplicada em `.specify/arquiteture.md` para padronizar o título da seção 8.3 (`compatibilidade canonica`).

## Plano de execução
1. Atualizar `sessoes/index.md` para registrar sessão ativa.
2. Executar mapeamento por seção com `grep_search` (sem abrir arquivo grande integralmente).
3. Ler apenas os trechos necessários dos dois documentos.
4. Montar matriz de cobertura e identificar lacunas.
5. Aplicar patch mínimo em `.specify/arquiteture.md` se necessário.
6. Revalidar matriz e registrar progresso na sessão.

## Checklist
- [x] Criar sessão 22
- [x] Atualizar `sessoes/index.md` com sessão 22 ativa
- [x] Localizar §§ 4, 7, 12 e 16 em `ARQUITETURA_PROJETO.md`
- [x] Localizar seções equivalentes em `.specify/arquiteture.md`
- [x] Produzir matriz de cobertura com evidência literal
- [x] Corrigir lacunas em `.specify/arquiteture.md` (se houver)
- [x] Revalidar cobertura após patch
- [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [ ] Mover sessão para `encerradas/` (quando autorizado)
- [ ] Atualizar `sessoes/index.md` ao encerrar

## Arquivos que serão modificados
- `sessoes/26-04-22_22_verificacao-arquiteture-v5.md`
- `sessoes/index.md`
- `.specify/arquiteture.md` (somente se houver lacunas comprovadas)
- `.specify/memory/project-state.md` (etapa final obrigatória)

## Matriz de cobertura literal (V5)
- **Modelo de dados (`aggregator_import_candidates`)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:110`
  - Arquitetura atual: `.specify/arquiteture.md:84`
- **Modelo de dados (`imgur_cleanup_log`)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:113`
  - Arquitetura atual: `.specify/arquiteture.md:88` e `.specify/arquiteture.md:428`
- **Campos de imagem (`cover_url`, `cover_source_type`, `cover_deletehash`)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:134`, `:829-833`
  - Arquitetura atual: `.specify/arquiteture.md:107`, `:389`, `:391`
- **Parser Python (§7)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:377-427`
  - Arquitetura atual: `.specify/arquiteture.md:343-350`
- **Rotas API (§12)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:510-590`
  - Arquitetura atual: `.specify/arquiteture.md:246-305`
- **Gestão Imgur (§16)**
  - Origem: `ARQUITETURA_PROJETO__f0727ae.md:774-895`
  - Arquitetura atual: `.specify/arquiteture.md:395-428`

## Critério de conclusão explícito
- Matriz final com todos os itens obrigatórios em `OK` com evidência literal em ambos os arquivos.
- Nenhuma lacuna obrigatória pendente sem patch correspondente.
- Sem alteração de runtime frontend/backend nesta sessão.
