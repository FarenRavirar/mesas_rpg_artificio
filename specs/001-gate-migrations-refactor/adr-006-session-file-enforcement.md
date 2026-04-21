# ADR-006: Reforço de enforcement da sessão em tempo real

**Status:** proposto — aguarda aprovação do mantenedor

## Contexto

A seção "INÍCIO OBRIGATÓRIO DE SESSÃO" do AGENTS.md (linhas 8-23) 
determina nos itens 6-8 que o agente deve:
- Abrir/retomar arquivo da sessão e registrar o que vai/precisa/foi 
  feito.
- Atualizar a sessão ANTES de qualquer alteração técnica.
- Atualizar a sessão após cada etapa executada.

Esta sessão (SDD-001 / 2026-04-20) violou esses itens do início ao 
fim, acumulando dezenas de commits sem reflexo em sessoes/. Falha 
registrada como F15 no SESSION_FAILURES_REGISTRY.md.

## Decisão

Adicionar ao AGENTS.md uma nota enfática imediatamente após o item 9, 
tornando a regra impossível de ignorar sem escolha deliberada.

Texto proposto (a ser inserido logo após a linha 17 do AGENTS.md, antes 
da seção seguinte):

```
> **ENFORCEMENT CRÍTICO (F15):** os itens 6, 7 e 8 acima não são 
> aspiracionais. Sessão não atualizada em tempo real é falha 
> processual registrada. A cada 3 commits de feature sem commit 
> correspondente em `sessoes/`, o agente está OBRIGADO a parar e 
> atualizar. Se o mantenedor perguntar "cadê a sessão", a resposta 
> esperada é "já atualizei há <N> minutos", não "vou criar agora".
```

## Alternativas rejeitadas

- **Deixar como está:** falha recorrente já documentada (F15).
- **Automatizar via hook:** pre-commit verificando sessões é frágil e 
  agressivo demais para casos legítimos (docs, chores). Enforcement 
  via texto + registry + checklist é mais robusto.

## Consequências

- AGENTS.md ganha uma nota mais, ainda em escopo mínimo.
- Agente tem referência explícita para "por que isso importa".
- Maintenedor tem frase catchphrase ("cadê a sessão?") que dispara 
  verificação rápida.
