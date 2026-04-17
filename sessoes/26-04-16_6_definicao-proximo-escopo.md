# 26-04-16_6_definicao-proximo-escopo.md

## Cabeçalho
- **Data:** 16/04/2026
- **Objetivo:** Executar REQ-29 (auditoria API + atualização de status no MAPA_DE_API) como primeira etapa para endereçar DEB-06, iniciando pelos endpoints com consumidor real já existente.

## Vínculos
- **Sessão anterior:** `26-04-16_5_reformulacao-mestre-etapa3.md`
- **Próxima sessão:** a definir

## Plano de execução
1. Consolidar escopo do novo ciclo em REQ-29/DEB-06 (auditoria de endpoints pendentes no `MAPA_DE_API.md`).
2. Priorizar endpoints com evidência de consumo real já presente no frontend/backend para atualização de status.
3. Aplicar sincronização incremental no `MAPA_DE_API.md` (mudanças mínimas por bloco).
4. Registrar progresso, pendências remanescentes e rastreabilidade no fechamento parcial da sessão.

## Checklist
- [x] Abrir `sessoes/26-04-16_6_definicao-proximo-escopo.md`
- [x] Confirmar escopo operacional exato com o usuário
- [x] Validar impacto em código/documentação antes de editar
- [x] Executar alterações estritamente dentro do escopo (bloco inicial: LINKS)
- [x] Validar resultado da etapa executada (evidência de uso real)
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `sessoes/26-04-16_6_definicao-proximo-escopo.md`
- `MAPA_DE_API.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- Escopo REQ-29/DEB-06 consolidado para execução incremental.
- Pelo menos um bloco de endpoints pendentes sincronizado com evidência real de uso.
- Checklist da sessão atualizado com pendências remanescentes explicitadas.

## Diagnóstico inicial (REQ-29 / DEB-06)
- `BACKLOG_OPERACIONAL.md` confirma `REQ-29` (GUT 100, pendente) e dependência direta de `DEB-06`.
- `MAPA_DE_API.md` contém múltiplos endpoints `❌ Pendente/Front`.
- Evidência de consumo real confirmada para `LINKS` (`useLinks.ts`, `LinksManager.tsx`) e `DISCORD` (`ProfileEditPage.tsx`).

## Execução parcial
- ✅ Atualizado `MAPA_DE_API.md` na seção `LINKS` (`GET/POST/DELETE/PATCH /links`) de `❌ Pendente/Front` para `✅ Em Uso`.
- ✅ Atualizado `MAPA_DE_API.md` na seção `DISCORD` (`GET /discord/connect`, `GET /discord/callback`, `DELETE /discord/disconnect`) de `❌ Pendente/Front` para `✅ Em Uso`.
- ✅ Mantido `POST /discord/verify-covil` como `❌ Pendente/Front` por ausência de chamada no frontend.

## Pendências remanescentes deste ciclo
- Revisar próximos blocos pendentes do `MAPA_DE_API.md` por prioridade e evidência real de consumo.
- Fechar a sessão com critério de busca final do padrão-alvo do lote atual.
