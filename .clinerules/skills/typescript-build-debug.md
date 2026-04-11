# Skill: Debug de erros de build TypeScript

Quando npm run build falhar:

1. Ler o erro completo no terminal
2. Buscar o ID do erro em ERRORS_SOLUTIONS.md
3. Se encontrar: aplicar a solução documentada
4. Se não encontrar:
   - Verificar se o erro é de tipo (TS2345, TS2322, etc.)
   - Verificar se é import faltando
   - Verificar se é arquivo não encontrado
5. Registrar a solução em ERRORS_SOLUTIONS.md após resolver
6. Nunca usar @ts-ignore ou any como solução permanente