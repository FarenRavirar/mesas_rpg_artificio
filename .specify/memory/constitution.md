# Constituição do Projeto Mesas RPG Artifício

> Subordinada a AGENTS.md e demais MDs canônicos na raiz.
> Conflito → MDs canônicos da raiz vencem.

## 1. Identidade
- Projeto: Mesas RPG Artifício
- Tipo: Brownfield, TypeScript, monorepo (backend/frontend/database).
- Ambientes: beta (mesasbeta.artificiorpg.com), produção (mesas.artificiorpg.com).

## 2. Princípios inegociáveis
- Gratuito para a comunidade, sem anúncios, coleta mínima de dados.
- Nenhuma decisão de produto é tomada pelo agente — sempre perguntar.
- TypeScript estrito. Proibido `any` implícito.
- Toda mudança de schema passa por migrations_guide.md.
- Nenhum código em produção sem PRE_DEPLOY_CHECKLIST.md verde.

## 3. Branch policy (via Fase A)
- Branch-base dos PRs: dev
- Branch por feature: sim, criada automaticamente pelo Spec Kit com nome NNN-nome-semantico
- Nomenclatura: feat/NNN-nome
- Deletar após merge: sim automático
- Remote: origin atual

## 4. Stack travada
- Runtime: Node.js 22 LTS
- Gerenciador: npm
- Frontend: React + Vite + TypeScript (conforme RESUMO_EXECUCAO.md)
- Backend: Node.js + TypeScript
- Banco: PostgreSQL 16

## 5. Convenções
- Idioma SDD: pt-BR
- PR policy: PR por feature spec completa
- Testes globais: estritos localmente/unidade quando independentes, ou integrados em dev quando exigirem banco de dados/VM/acessos externos
- Testes Shell (Red/Green): Obrigatoriamente rodados em Git Bash (no Windows) ou WSL. CI sempre usa ubuntu-latest. O agente DEVE aferir a disponibilidade do binário testador no ambiente local antes de declarar avanço nas Fases 2 ou 3. Um teste não rodado é sempre BLOCKED, nunca PARTIAL.
- Fidelidade TDD/SDD: Ao implementar função nova, agente DEVE ler o teste correspondente e verificar se a lógica do teste bate com a semântica esperada da função. Se houver divergência entre teste e spec, PARAR e reportar ambiguidade — não implementar função para satisfazer teste incorreto, nem "tratar depois".

## 6. Guardrails técnicos (auto-aplicados, não perguntar)
- APIs HTTP: status codes 400, 401, 403, 404, 409, 422, 429, 500 sempre.
- Validação de input obrigatória em endpoint externo.
- Timeout explícito em chamada externa.
- Logs estruturados, sem PII, com traceId.
- Segredos via env vars, nunca em código.

## 7. Camadas imutáveis (não reescrever)
AGENTS.md, ARQUITETURA_PROJETO.md, BACKLOG_OPERACIONAL.md, MAPA_DE_API.md, FILA_IMPLEMENTACAO.md, ERRORS_SOLUTIONS.md, OPERACAO_PRODUCAO.md, PRE_DEPLOY_CHECKLIST.md, migrations_guide.md. 
*(Exceção: Resposta Pergunta 10 - Todos podem mudar se for justificado e melhor para o projeto sob a ótica da Implementação SDD)*

## 8. Protocolo de divergência
- Ambiguidade → parar e perguntar.
- Conflito entre spec e MD canônico → MD canônico vence. Reportar.
- Necessidade fora de escopo → propor ADR em specs/NNN/adr-*.md, aguardar aprovação.
