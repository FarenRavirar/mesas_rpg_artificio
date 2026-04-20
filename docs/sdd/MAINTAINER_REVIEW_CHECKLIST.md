# Checklist de Review do Mantenedor (uma feature SDD)

Antes de aprovar cada transição de fase, verificar:

## Ao receber "Fase X completa, peço aprovado"

- [ ] Número de commits em `git log <base>..HEAD` = número de tasks da fase
- [ ] Nenhum commit tem mais de 2-3 arquivos mudados (exceto polish docs)
- [ ] Nenhum arquivo fora da lista em plan.md §3 aparece em `git diff --name-only <base>..HEAD`
- [ ] `git status` está limpo (working tree sem surpresas)
- [ ] Último commit tem mensagem no formato `<tipo>(001): <ação específica>` — não genérico

## Ao receber "task X está DONE"

- [ ] Agente colou output LITERAL de comando validando o critério de done
- [ ] Output não está truncado com `...`
- [ ] Se é task de teste: vi RED antes (ou o commit anterior é test red)
- [ ] Se é task de código: vi GREEN agora (saída do teste passando)

## Sinais de alerta imediato

Se o agente escreve qualquer destas frases, parar e investigar:
- "tratamos depois" / "fase posterior" sem justificativa técnica
- "mock performético passou" / "skeleton validado"
- "agente anterior" / "dívida herdada" (na mesma sessão)
- "forçando" / "interceptou" (sem evidência de hook/CI real)
- "inferência" / "inferi" aplicada a decisões de produto
- "ajuste cosmético" em arquivo fora da Seção 3 do plan
- Output resumido com `[cortado para brevidade]` em contexto de debug
- Nomes/papéis não mencionados em spec ("Mantenedor-Chefe", etc.)

## Após merge da feature

- [ ] Registrar em `ERRORS_SOLUTIONS.md` as falhas processuais observadas
- [ ] Atualizar constitution.md se novos padrões emergiram
