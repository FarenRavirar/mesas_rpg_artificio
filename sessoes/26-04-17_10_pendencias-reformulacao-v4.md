# 26-04-17_10_pendencias-reformulacao-v4.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Concluir as pendências abertas da Reformulação V4, iniciando pela correção do texto dinâmico em `MestreFinalCta` e avançando até zerar o índice de pendências.

## Vínculos
- **Sessão anterior:** `26-04-17_9_execucao-og-cache-links.md`
- **Próxima sessão:** a definir

## Plano de execução
1. Confirmar as pendências abertas no índice de `docs/Reformulacao_mestre_v4.md`.
2. Corrigir PENDÊNCIA 1 (`MestreFinalCta`) com texto/label dinâmico por cenário de urgência.
3. Validar regressão do componente (renderização condicional + tipagem).
4. Corrigir PENDÊNCIA 2 (`TableCard`) removendo altura mínima fixa.
5. Validar regressão visual e estrutural do card.
6. Tratar PENDÊNCIA 3 (`og.ts`) com rota extensível sem quebrar rota atual.
7. Atualizar `docs/Reformulacao_mestre_v4.md` marcando evidências de cada pendência resolvida.
8. Validar busca final de pendências (zero itens ⚠️ no índice de pendências).

## Checklist
- [x] Confirmar pendências abertas no `Reformulacao_mestre_v4.md`
- [x] Implementar correção da PENDÊNCIA 1 em `MestreFinalCta.tsx`
- [x] Validar PENDÊNCIA 1 (comportamento + tipagem)
- [x] **EXTRA:** Implementar Central de Ajuda completa com 8 seções no painel
- [x] **EXTRA:** Mover CTA dinâmico para antes da seção de mesas
- [x] **EXTRA:** Atualizar changelog com todas as funcionalidades
- [x] Deploy beta da PENDÊNCIA 1 + extras concluído
- [x] Implementar correção da PENDÊNCIA 2 em `TableCard.tsx`
- [x] Validar PENDÊNCIA 2 (layout fluido)
- [x] Implementar correção da PENDÊNCIA 3 em `backend/src/routes/og.ts`
- [x] Validar PENDÊNCIA 3 (rota extensível e fallback)
- [x] Atualizar MAPA_DE_API.md com nova rota OG extensível
- [x] Atualizar ARQUITETURA_PROJETO.md §17 com nova estrutura
- [x] Atualizar `docs/Reformulacao_mestre_v4.md` com status final
- [x] Executar busca final com zero pendências abertas
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

## Arquivos que serão modificados
- `frontend/src/components/mestre/MestreFinalCta.tsx`
- `frontend/src/components/TableCard.tsx`
- `backend/src/routes/og.ts`
- `docs/Reformulacao_mestre_v4.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
- `sessoes/26-04-17_10_pendencias-reformulacao-v4.md`

## Critério de conclusão explícito
- As 3 pendências do índice inicial desta sessão estão marcadas como resolvidas no `docs/Reformulacao_mestre_v4.md`.
- Não há ocorrência de pendência aberta no bloco "ÍNDICE DE PENDÊNCIAS" da V4.
- Validação de código executada sem erro para os arquivos alterados.
- Checklist desta sessão com 100% dos itens em `[x]`.
- `RESUMO_EXECUCAO.md` e `sessoes/index.md` atualizados com esta sessão.
