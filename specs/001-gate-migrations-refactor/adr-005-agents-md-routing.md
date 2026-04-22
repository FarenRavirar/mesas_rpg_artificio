# ADR-005: Roteamento de SDD governance no AGENTS.md

**Status:** proposto — aguarda aprovação do mantenedor

## Contexto

A Feature 001 criou governance SDD consolidada em 4 arquivos:
- `.specify/memory/constitution.md` (regras invioláveis)
- `docs/sdd/SESSION_FAILURES_REGISTRY.md` (14 falhas calibradas)
- `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` (gatilhos)
- `docs/sdd/analyze-governance-gate.md` (gate do /speckit.analyze)

Porém, o `AGENTS.md` (entry point que todo agente lê ao nascer) não 
referencia nenhum deles. Consequência: agente futuro abre o projeto 
e não sabe que essas regras existem. Governance vira arquivo morto.

## Decisão

Editar `AGENTS.md` para:

1. Adicionar nas instruções de "Início Obrigatório de Sessão" leitura 
   hierárquica dos 4 arquivos de governance SDD.
2. Adicionar entradas na tabela de Roteamento de Contexto apontando 
   cada arquivo e quando deve ser consultado.
3. Política de leitura parcial: agente lê cabeçalhos e índices sempre; 
   leitura completa obrigatória em qualquer trabalho que envolva SDD, 
   testes, migrations, deploy, ou mudança > 10 linhas.

## Alternativas rejeitadas

- **Deixar como está (governance órfã):** rejeitado. Arquivos sem 
  roteamento não são lidos. Desperdício de trabalho.
- **Criar arquivo separado de bootstrap:** rejeitado. Duplica função 
  do AGENTS.md e cria nova fonte de verdade.
- **Depender de menção manual do mantenedor:** rejeitado. Mantenedor 
  não deve ser ponto único de falha para governance ser lida.

## Consequências

- Toda sessão nova tem overhead de leitura adicional (aceitável).
- AGENTS.md vira mais extenso (mitigado por seção "leitura parcial").
- Futuras features SDD terão ponto de extensão claro (adicionar ao 
  roteamento).
- Proteção contra degradação: se alguém reverter o AGENTS.md acidentalmente, 
  governance sumirá — risco conhecido, aceitável por enquanto.

## Validação

Aprovação explícita do mantenedor neste ADR antes da edição do AGENTS.md.
