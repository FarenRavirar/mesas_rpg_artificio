# 26-04-24_2_hidratacao-specify

**Data:** 24/04/2026
**Objetivo:** Elaborar a especificação (spec.md) de hidratação de banco de dados a partir dos dados diagnosticados na sessão anterior, categorizando as tabelas para sincronização e definindo os contratos (Backend e UI).

**Plano de execução:**
1. [x] Analisar dependências do banco de dados coletadas em `26-04-24_1_hidratacao-diagnostico.md`.
2. [x] Criar arquivo `spec.md` classificando as tabelas (SINCRONIZAR ou EXCLUIR).
3. [x] Definir a chave de conflito para cada tabela (id, slug, chave composta).
4. [x] Listar PII a serem excluídos/anonimizados.
5. [x] Estabelecer a ordem topológica de inserção respeitando FKs.
6. [x] Documentar o comportamento de merge/update (INSERT, UPDATE, IGNORAR).
7. [x] Definir o contrato do endpoint de backend (POST /hydrate com auth e logs estruturados).
8. [x] Definir o contrato da UI em GestaoPage.tsx (botões de sincronização, dry-run, log visual).

**Arquivos modificados:**
- sessoes/26-04-24_2_hidratacao-specify.md
- .specify/features/ops-hidratacao/spec.md

**Critério de conclusão:**
- spec.md gerado/atualizado com a classificação completa das 38 tabelas de prod, regras de mesclagem, tratamento PII, comportamento de FKs e os contratos da API e UI. Sessão atualizada e aguardando aprovação do mantenedor.
