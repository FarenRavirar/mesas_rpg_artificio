\# AI\_CONTEXT\_INDEX.md



\## Objetivo



Roteador de leitura para reduzir contexto, evitar leitura em cascata e eliminar conflito entre instruções no \*\*Anúncios de Mesas RPG\*\*.



\## Quando ler



Sempre, imediatamente após `AGENTS.md`.



\## Não ler quando



Nunca pular este arquivo; ele define o roteiro mínimo de contexto.



\## Pré-requisitos



\- Ler `AGENTS.md`

\- Identificar o tipo de tarefa (implementação, banco, autenticação, produção, incidente, docs, importação, ingestão automática, imagens)



\## Passos



1\. Carregar leitura base fixa:

&#x20;  - `AGENTS.md`

&#x20;  - `AI\_CONTEXT\_INDEX.md`

2\. Ler `GUIA\_RAPIDO\_OPERACIONAL.md` (somente tabela-resumo + seção do cenário da tarefa).

3\. Escolher o cenário na matriz abaixo.

4\. Classificação de Tarefa e Leitura Condicional



> \[!CAUTION]

> \*\*REGRA PÉTREA DE TRATAMENTO DE ERROS:\*\*

> Antes de classificar tarefas ou tentar corrigir um bug local que originou uma mensagem de erro, console log ou fail de pipeline, \*\*todo agente\*\* é OBRIGADO a examinar o `ERRORS\_SOLUTIONS.md`.

> - Se for um erro catalogado: aplicar a solução documentada.

> - Se não constar: pare a execução de scripts iterativos em loop, descubra o porquê criticamente, valide a correção, e \*\*adicione a solução em `ERRORS\_SOLUTIONS.md`\*\* com formatação rigorosa.

> \*\*Nunca confie em intuições cegas de IA antes de verificar a documentação local mestre de erros.\*\*



4\. Não abrir documentos fora da rota sem gatilho explícito.

5\. Registrar no chat o que já foi lido para evitar releitura redundante.

6\. Em tarefas com GitHub Actions, preferir validação por `gh` na VM antes de concluir diagnóstico. Ver limitações em `GIT\_WORKFLOW.md` seção 8 e `ERRORS\_SOLUTIONS.md` E055/E056.

7\. Classificar o turno antes de agir:

&#x20;  - `continuidade`: mesma tarefa, mesmo objetivo

&#x20;  - `ramificacao`: subtarefa da tarefa ativa, com escopo menor

&#x20;  - `tarefa\_separada`: novo objetivo, sem herança automática do contexto anterior



\## Pacote mínimo de continuidade (quando houver tarefa ativa)



Manter apenas estado durável e útil:



\- `objetivo\_tarefa`

\- `objetivo\_passo\_atual`

\- `obrigatorios`

\- `proibicoes`

\- `fatos\_confirmados`

\- `duvidas\_abertas`

\- `escopo\_permitido`

\- `escopo\_protegido`



Regras:

\- Atualizar por delta (somente mudanças), sem restatement completo desnecessário

\- Deduplicar restrições equivalentes

\- Resolver conflito de prioridade por esta ordem:

&#x20; 1. Pedido explícito do usuário

&#x20; 2. Regra canônica do repositório

&#x20; 3. Evidência validada da execução

&#x20; 4. Decisão prévia confirmada

&#x20; 5. Inferência local



\## Gate de admissibilidade antes de executar



Antes de implementar, validar:



1\. `Must-Do Omission`: há obrigatório não coberto?

2\. `Must-Not Violation`: alguma proibição será violada?

3\. `Cross-Turn Inconsistency`: a ação contradiz fato confirmado?

4\. `Code Rollback`: há risco de desfazer correção validada?

5\. `Repetitive Response`: estamos repetindo sem progresso real?

6\. `Segurança de Endpoints`: a mudança ignora verificação de Token JWT exigida pela API Node?

7\. `Key Exposure`: existe risco de expor `IMGUR\_CLIENT\_ID`, `deletehash` ou outra chave sensível no frontend ou repositório?

8\. `Imgur Irreversível`: a operação executa deleção no Imgur sem `deletehash` confirmado no banco?

9\. `Compromisso Público`: a feature introduz anúncio pago, paywall ou coleta de dados não declarada?



Se houver risco material, reduzir escopo, revisar plano e só então executar.



\## Matriz de leitura por cenário



| Cenário | Leitura condicional (ordem) | Não ler quando | Orçamento sugerido de contexto |

|---|---|---|---|

| Atalho de leitura rápida (todos os cenários) | `GUIA\_RAPIDO\_OPERACIONAL.md` (tabela + seção aplicável) → arquivo canônico do cenário | Não usar como fonte única em decisões críticas | 500 a 1.200 tokens |

| Implementação de código (React/Frontend) | `ARQUITETURA\_PROJETO.md` (seções relevantes) → `GIT\_WORKFLOW.md` | Não abrir docs de banco sem necessidade direta | 3.500 a 6.500 tokens |

| Banco de dados / PostgreSQL / Node.js API | `ARQUITETURA\_PROJETO.md` seção 4 → `01\_schema.sql` | Não abrir arquivos de frontend sem necessidade | 2.500 a 4.500 tokens |

| Autenticação (Google OAuth / JWT / perfis / elevação de role) | `ARQUITETURA\_PROJETO.md` seções 5 e 6 → `GIT\_WORKFLOW.md` | Não implementar lógica de permissão no frontend | 2.500 a 4.000 tokens |

| Imagens (upload, conversão WebP, Imgur, CleanupWorker) | `ARQUITETURA\_PROJETO.md` seção 16 → `ERRORS\_SOLUTIONS.md` | Não processar imagem no frontend; não expor deletehash | 2.000 a 3.500 tokens |

| AggregatorBot (ingestão, deduplicação, fontes externas) | `ARQUITETURA\_PROJETO.md` seção 7.8 e 4.5 → `ERRORS\_SOLUTIONS.md` | Não alterar critério de deduplicação sem autorização | 2.500 a 4.500 tokens |

| Bug hunting de falhas visuais / CSS limitadas | Apenas o arquivo do componente afetado | Não refazer componentes globais sem aviso explícito | 1.000 a 2.000 tokens |

| Deploy Beta (`dev`) ou Produção (`main`) via GitHub Actions | `GIT\_WORKFLOW.md` → `OPERACAO\_PRODUCAO.md` | Não reescrever yaml de CD arbitrariamente | 1.500 a 2.500 tokens |

| Novo Componente Estrutural / Core | `ARQUITETURA\_PROJETO.md` para contratos React locais | Não segregar lógica de moderação fora do endpoint de dados | 3.000 a 6.000 tokens |

| Painel administrativo / moderação | `ARQUITETURA\_PROJETO.md` seção 7.7 → `01\_schema.sql` | Não implementar lógica de permissão fora do Backend | 3.000 a 5.000 tokens |

| Catálogo público / filtros / busca | `ARQUITETURA\_PROJETO.md` seções 7.1 e 7.2 | Não mover lógica de filtro para o backend sem necessidade | 2.000 a 4.000 tokens |

| Landing page do mestre / perfil público | `ARQUITETURA\_PROJETO.md` seções 7.4 e 4.1 | Não expor campos internos de gm\_profile na rota pública | 2.000 a 3.500 tokens |

| Exportação WhatsApp / Discord | `ARQUITETURA\_PROJETO.md` seção 8 | Não gerar texto de exportação no frontend com dados parciais | 1.000 a 2.000 tokens |

| Onboarding de preferências | `ARQUITETURA\_PROJETO.md` seção 7.5 | Não pular etapas do onboarding por conveniência de UX | 1.500 a 2.500 tokens |

| Troubleshooting de infra (containers, proxy, SSH) | `OPERACAO\_PRODUCAO.md` → `ERRORS\_SOLUTIONS.md` | Não quebrar o isolamento do túnel (`cloudflared`) | 2.000 a 3.500 tokens |

| Gestão contínua de backlog operacional | `TODO\_OPERACIONAL.md` → `ARQUITETURA\_PROJETO.md` (se impactar contrato) → `ERRORS\_SOLUTIONS.md` (se houver incidente) | Não manter item sem `Score GUT`, critério de aceite e status real | 2.500 a 4.500 tokens |

| Modo Lote | `FILA\_IMPLEMENTACAO.md` → `GIT\_WORKFLOW.md` | Não fazer push para `dev` antes de "Fechar lote" | 1.500 a 3.000 tokens |



\## Política de depreciação



\- Arquivos obsoletos devem ser movidos para pasta de backup ou removidos se não houver utilidade.

\- Não manter arquivos de outros projetos no repositório ativo.



\## Single Source of Truth



| Tema | Arquivo canônico |

|---|---|

| Governança de agentes e idioma | `AGENTS.md` |

| Roteamento de leitura e orçamento de contexto | `AI\_CONTEXT\_INDEX.md` |

| Arquitetura mestre, contratos e decisões | `ARQUITETURA\_PROJETO.md` |

| Git, branches, merge, deploy | `GIT\_WORKFLOW.md` |

| Operação e diagnóstico dos ambientes beta e produção | `OPERACAO\_PRODUCAO.md` |

| Pre-flight de ambiente/template | `PRE-FLIGHT\_CHECKLIST.md` |

| Erros recorrentes e contornos validados | `ERRORS\_SOLUTIONS.md` |

| Backlog operacional de melhorias | `TODO\_OPERACIONAL.md` |

| Fila operacional por lote/ciclo | `FILA\_IMPLEMENTACAO.md` |

| Guia de aceleração de leitura (apoio, não canônico) | `GUIA\_RAPIDO\_OPERACIONAL.md` |



\## Validação



\- A leitura de cada tarefa deve caber no orçamento da matriz.

\- Não deve existir leitura em cascata sem gatilho explícito.

\- Toda decisão operacional deve apontar um arquivo canônico.

\- O turno deve estar classificado (`continuidade`/`ramificacao`/`tarefa\_separada`) quando houver dúvida de escopo.

\- O gate de admissibilidade deve ser aplicado antes de mudanças não triviais.

\- Em mudanças no backlog operacional, manter ordenação por matriz GUT e snapshot de status real em `TODO\_OPERACIONAL.md`.

\- Em execução por lote, manter status dos itens e fechamento de lote atualizados em `FILA\_IMPLEMENTACAO.md`.

\- \*\*Sempre que possível\*\*, atualizar `GUIA\_RAPIDO\_OPERACIONAL.md` por delta ao fim da task quando houver mudança relevante de contrato/fluxo/checklist operacional.

\- \*\*Nunca\*\* processar upload ou deleção de imagem no frontend — toda operação com Imgur é exclusiva do Backend.

\- \*\*Nunca\*\* retornar `deletehash` em rotas públicas da API, sob qualquer circunstância.

\- \*\*Nunca\*\* referenciar fonte de dados estática ou JSON local em runtime — este projeto usa Backend Node.js com banco PostgreSQL.



\## Rollback



Se o roteamento não cobrir um cenário real:

1\. Voltar para leitura mínima (`AGENTS.md` + `ARQUITETURA\_PROJETO.md` + `GIT\_WORKFLOW.md`)

2\. Registrar lacuna em `TODO\_OPERACIONAL.md`

3\. Ajustar este arquivo em patch incremental



\## Referências



\- `AGENTS.md`

\- `ARQUITETURA\_PROJETO.md`

\- `GIT\_WORKFLOW.md`

\- `OPERACAO\_PRODUCAO.md`

\- `PRE-FLIGHT\_CHECKLIST.md`

\- `ERRORS\_SOLUTIONS.md`

\- `TODO\_OPERACIONAL.md`

\- `FILA\_IMPLEMENTACAO.md`

\- `GUIA\_RAPIDO\_OPERACIONAL.md`



\## Limite de escopo



Este arquivo não descreve arquitetura de produto nem runbook detalhado; ele apenas roteia o que ler e quando ler.

