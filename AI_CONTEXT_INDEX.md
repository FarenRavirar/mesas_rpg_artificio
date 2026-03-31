# AI_CONTEXT_INDEX.md

## Objetivo

Roteador de leitura para reduzir contexto, evitar leitura em cascata e eliminar conflito entre instruções no **Anúncios de Mesas RPG**.

## Quando ler

Sempre, imediatamente após `AGENTS.md`.

## Não ler quando

Nunca pular este arquivo; ele define o roteiro mínimo de contexto.

## Pré-requisitos

- Ler `AGENTS.md`
- Identificar o tipo de tarefa (implementação, banco, autenticação, produção, incidente, docs, importação, ingestão automática, imagens)

## Passos

1. Carregar leitura base fixa:
   - `AGENTS.md`
   - `AI_CONTEXT_INDEX.md`
2. Escolher o cenário na matriz abaixo.
3. Classificação de Tarefa e Leitura Condicional

> [!CAUTION]
> **REGRA PÉTREA DE TRATAMENTO DE ERROS:**
> Antes de classificar tarefas ou tentar corrigir um bug local que originou uma mensagem de erro, console log ou fail de pipeline, **todo agente** é OBRIGADO a examinar o `ERRORS_SOLUTIONS.md`.
> - Se for um erro catalogado: aplicar a solução documentada.
> - Se não constar: pare a execução de scripts iterativos em loop, descubra o porquê criticamente, valide a correção, e **adicione a solução em `ERRORS_SOLUTIONS.md`** com formatação rigorosa.
> **Nunca confie em intuições cegas de IA antes de verificar a documentação local mestre de erros.**

4. Não abrir documentos fora da rota sem gatilho explícito.
5. Registrar no chat o que já foi lido para evitar releitura redundante.
6. Em tarefas com GitHub Actions, preferir validação por `gh` na VM antes de concluir diagnóstico. Ver limitações em `GIT_WORKFLOW.md` seção 8 e `ERRORS_SOLUTIONS.md` E055/E056.
7. Classificar o turno antes de agir:
   - `continuidade`: mesma tarefa, mesmo objetivo
   - `ramificacao`: subtarefa da tarefa ativa, com escopo menor
   - `tarefa_separada`: novo objetivo, sem herança automática do contexto anterior

## Pacote mínimo de continuidade (quando houver tarefa ativa)

Manter apenas estado durável e útil:

- `objetivo_tarefa`
- `objetivo_passo_atual`
- `obrigatorios`
- `proibicoes`
- `fatos_confirmados`
- `duvidas_abertas`
- `escopo_permitido`
- `escopo_protegido`

Regras:
- Atualizar por delta (somente mudanças), sem restatement completo desnecessário
- Deduplicar restrições equivalentes
- Resolver conflito de prioridade por esta ordem:
  1. Pedido explícito do usuário
  2. Regra canônica do repositório
  3. Evidência validada da execução
  4. Decisão prévia confirmada
  5. Inferência local

## Gate de admissibilidade antes de executar

Antes de implementar, validar:

1. `Must-Do Omission`: há obrigatório não coberto?
2. `Must-Not Violation`: alguma proibição será violada?
3. `Cross-Turn Inconsistency`: a ação contradiz fato confirmado?
4. `Code Rollback`: há risco de desfazer correção validada?
5. `Repetitive Response`: estamos repetindo sem progresso real?
6. `Segurança de Endpoints`: a mudança ignora verificação de Token JWT exigida pela API Node?
7. `Key Exposure`: existe risco de expor `IMGUR_CLIENT_ID`, `deletehash` ou outra chave sensível no frontend ou repositório?
8. `Imgur Irreversível`: a operação executa deleção no Imgur sem `deletehash` confirmado no banco?
9. `Compromisso Público`: a feature introduz anúncio pago, paywall ou coleta de dados não declarada?

Se houver risco material, reduzir escopo, revisar plano e só então executar.

## Matriz de leitura por cenário

| Cenário | Leitura condicional (ordem) | Não ler quando | Orçamento sugerido de contexto |
|---|---|---|---|
| Implementação de código (React/Frontend) | `ARQUITETURA_PROJETO.md` (seções relevantes) → `GIT_WORKFLOW.md` | Não abrir docs de banco sem necessidade direta | 3.500 a 6.500 tokens |
| Banco de dados / PostgreSQL / Node.js API | `ARQUITETURA_PROJETO.md` seção 4 → `01_schema.sql` | Não abrir arquivos de frontend sem necessidade | 2.500 a 4.500 tokens |
| Autenticação (Google OAuth / JWT / perfis / elevação de role) | `ARQUITETURA_PROJETO.md` seções 5 e 6 → `GIT_WORKFLOW.md` | Não implementar lógica de permissão no frontend | 2.500 a 4.000 tokens |
| Imagens (upload, conversão WebP, Imgur, CleanupWorker) | `ARQUITETURA_PROJETO.md` seção 16 → `ERRORS_SOLUTIONS.md` | Não processar imagem no frontend; não expor deletehash | 2.000 a 3.500 tokens |
| AggregatorBot (ingestão, deduplicação, fontes externas) | `ARQUITETURA_PROJETO.md` seção 7.8 e 4.5 → `ERRORS_SOLUTIONS.md` | Não alterar critério de deduplicação sem autorização | 2.500 a 4.500 tokens |
| Bug hunting de falhas visuais / CSS limitadas | Apenas o arquivo do componente afetado | Não refazer componentes globais sem aviso explícito | 1.000 a 2.000 tokens |
| Deploy Beta (`dev`) ou Produção (`main`) via GitHub Actions | `GIT_WORKFLOW.md` → `OPERACAO_PRODUCAO.md` | Não reescrever yaml de CD arbitrariamente | 1.500 a 2.500 tokens |
| Novo Componente Estrutural / Core | `ARQUITETURA_PROJETO.md` para contratos React locais | Não segregar lógica de moderação fora do endpoint de dados | 3.000 a 6.000 tokens |
| Painel administrativo / moderação | `ARQUITETURA_PROJETO.md` seção 7.7 → `01_schema.sql` | Não implementar lógica de permissão fora do Backend | 3.000 a 5.000 tokens |
| Catálogo público / filtros / busca | `ARQUITETURA_PROJETO.md` seções 7.1 e 7.2 | Não mover lógica de filtro para o backend sem necessidade | 2.000 a 4.000 tokens |
| Landing page do mestre / perfil público | `ARQUITETURA_PROJETO.md` seções 7.4 e 4.1 | Não expor campos internos de gm_profile na rota pública | 2.000 a 3.500 tokens |
| Exportação WhatsApp / Discord | `ARQUITETURA_PROJETO.md` seção 8 | Não gerar texto de exportação no frontend com dados parciais | 1.000 a 2.000 tokens |
| Onboarding de preferências | `ARQUITETURA_PROJETO.md` seção 7.5 | Não pular etapas do onboarding por conveniência de UX | 1.500 a 2.500 tokens |
| Troubleshooting de infra (containers, proxy, SSH) | `OPERACAO_PRODUCAO.md` → `ERRORS_SOLUTIONS.md` | Não quebrar o isolamento do túnel (`cloudflared`) | 2.000 a 3.500 tokens |
| Gestão contínua de backlog operacional | `TODO_OPERACIONAL.md` → `ARQUITETURA_PROJETO.md` (se impactar contrato) → `ERRORS_SOLUTIONS.md` (se houver incidente) | Não manter item sem `Score GUT`, critério de aceite e status real | 2.500 a 4.500 tokens |
| Modo Lote | `FILA_IMPLEMENTACAO.md` → `GIT_WORKFLOW.md` | Não fazer push para `dev` antes de "Fechar lote" | 1.500 a 3.000 tokens |

## Política de depreciação

- Arquivos obsoletos devem ser movidos para pasta de backup ou removidos se não houver utilidade.
- Não manter arquivos de outros projetos no repositório ativo.

## Single Source of Truth

| Tema | Arquivo canônico |
|---|---|
| Governança de agentes e idioma | `AGENTS.md` |
| Roteamento de leitura e orçamento de contexto | `AI_CONTEXT_INDEX.md` |
| Arquitetura mestre, contratos e decisões | `ARQUITETURA_PROJETO.md` |
| Git, branches, merge, deploy | `GIT_WORKFLOW.md` |
| Operação e diagnóstico dos ambientes beta e produção | `OPERACAO_PRODUCAO.md` |
| Pre-flight de ambiente/template | `PRE-FLIGHT_CHECKLIST.md` |
| Erros recorrentes e contornos validados | `ERRORS_SOLUTIONS.md` |
| Backlog operacional de melhorias | `TODO_OPERACIONAL.md` |
| Fila operacional por lote/ciclo | `FILA_IMPLEMENTACAO.md` |

## Validação

- A leitura de cada tarefa deve caber no orçamento da matriz.
- Não deve existir leitura em cascata sem gatilho explícito.
- Toda decisão operacional deve apontar um arquivo canônico.
- O turno deve estar classificado (`continuidade`/`ramificacao`/`tarefa_separada`) quando houver dúvida de escopo.
- O gate de admissibilidade deve ser aplicado antes de mudanças não triviais.
- Em mudanças no backlog operacional, manter ordenação por matriz GUT e snapshot de status real em `TODO_OPERACIONAL.md`.
- Em execução por lote, manter status dos itens e fechamento de lote atualizados em `FILA_IMPLEMENTACAO.md`.
- **Nunca** processar upload ou deleção de imagem no frontend — toda operação com Imgur é exclusiva do Backend.
- **Nunca** retornar `deletehash` em rotas públicas da API, sob qualquer circunstância.
- **Nunca** referenciar fonte de dados estática ou JSON local em runtime — este projeto usa Backend Node.js com banco PostgreSQL.

## Rollback

Se o roteamento não cobrir um cenário real:
1. Voltar para leitura mínima (`AGENTS.md` + `ARQUITETURA_PROJETO.md` + `GIT_WORKFLOW.md`)
2. Registrar lacuna em `TODO_OPERACIONAL.md`
3. Ajustar este arquivo em patch incremental

## Referências

- `AGENTS.md`
- `ARQUITETURA_PROJETO.md`
- `GIT_WORKFLOW.md`
- `OPERACAO_PRODUCAO.md`
- `PRE-FLIGHT_CHECKLIST.md`
- `ERRORS_SOLUTIONS.md`
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`

## Limite de escopo

Este arquivo não descreve arquitetura de produto nem runbook detalhado; ele apenas roteia o que ler e quando ler.
