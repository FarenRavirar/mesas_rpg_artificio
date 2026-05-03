# 26-04-24_3_hidratacao-plan

**Data:** 24/04/2026
**Objetivo:** Elaborar o plano de implementação (plan.md) da hidratação de banco de dados, estabelecendo as diretrizes técnicas do script de sincronização Prod -> Beta.

**Plano de execução:**
1. [x] Criar arquivo `plan.md` para a feature `ops-hidratacao`.
2. [x] Definir localização da rota backend (`adminHydration.ts`).
3. [x] Descrever a sequência exata de tabelas (ordem topológica de FK).
4. [x] Especificar a lógica UPSERT (`INSERT ON CONFLICT DO UPDATE`) e exclusão de PII.
5. [x] Especificar o mecanismo de proteção/verificação de ambiente contra gravações acidentais em Produção (ABORT).
6. [x] Definir a estrutura de transação atômica global (ROLLBACK automático em erro).
7. [x] Especificar o formato de log por tabela.
8. [x] Detalhar estrutura Frontend (GestaoPage, toggle dry-run, log e localStorage history).
9. [x] Definir o formato de integração (Resposta única bloqueante justificada por transação de DB).
10. [x] Listar exata de arquivos a serem criados/modificados.
11. [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
12. [x] Mover sessão para encerradas/ (quando autorizado)

**Arquivos modificados:**
- sessoes/26-04-24_3_hidratacao-plan.md
- .specify/features/ops-hidratacao/plan.md

**Critério de conclusão explícito:**
- `plan.md` gerado seguindo todas as restrições arquiteturais e documentado perfeitamente as operações e restrições exigidas pelo prompt (Frontend, Backend, Integração, Lista). Sessão atualizada. Aguardar aprovação do mantenedor.
