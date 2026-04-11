# Workflow: Verificação antes de abrir PR

Execute antes de qualquer git push para feature/*:

1. npm run build passou sem erros? Se não: corrigir antes de continuar
2. FILA_IMPLEMENTACAO.md atualizado com status concluido?
3. RESUMO_EXECUCAO.md atualizado?
4. MAPA_DE_API.md atualizado se rota foi alterada?
5. Arquivo de sessão em /sessoes/ com checklist 100% [x]?
6. Busca final por pendências retornou zero resultados?

Se todos os 6 pontos forem sim: abrir PR.
Se qualquer ponto for não: resolver antes de abrir PR.