# Mapeamento SDD × MDs canônicos

| Artefato SDD | Fonte de verdade canônica |
|--------------|--------------------------|
| constitution.md — stack | AGENTS.md + ARQUITETURA_PROJETO.md |
| constitution.md — operação | OPERACAO_PRODUCAO.md |
| spec.md — contexto | BACKLOG_OPERACIONAL.md + FILA_IMPLEMENTACAO.md |
| plan.md — API | MAPA_DE_API.md |
| plan.md — migration | migrations_guide.md |
| tasks.md — pré-deploy | PRE_DEPLOY_CHECKLIST.md |
| erros durante implement | ERRORS_SOLUTIONS.md |

## Regra de sincronização
- Spec introduz novo endpoint → última task (Polish) ATUALIZA MAPA_DE_API.md.
- Nova migration → atualizar migrations_guide.md.
- Qualquer outra escrita em MD canônico exige autorização explícita (salvo as abertas no spec).
