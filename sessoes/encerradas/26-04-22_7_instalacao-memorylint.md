# Sessão 26-04-22_7 — Instalação MemoryLint

**Data:** 22/04/2026 10:42 BRT  
**Objetivo:** Instalar e configurar a extensão MemoryLint do Spec-Kit para governança de memória AI

---

## Vínculos

**Sessão Anterior:** `26-04-22_6_documentacao-retroativa-fixit.md`  
**Próxima Sessão:** (a definir)

---

## Contexto

- Spec-Kit já instalado e configurado
- Extensões existentes: Git, Fixit, Brownfield
- Arquivos de governança: `AGENTS.md` (raiz) e `.specify/memory/constitution.md`
- MemoryLint versão: v1.3.0
- Release oficial: https://github.com/RbBtSn0w/spec-kit-extensions/releases/download/memorylint-v1.3.0/memorylint.zip

---

## Plano de Execução

1. **Instalar MemoryLint via Spec-Kit**
   - Executar comando `specify extension add memorylint --from <URL>`
   - Verificar download e extração

2. **Validar Instalação**
   - Verificar estrutura em `.specify/extensions/memorylint/`
   - Confirmar registro em `.specify/extensions/.registry`
   - Verificar comandos disponíveis
   - Verificar hooks registrados

3. **Executar Auditoria Inicial**
   - Rodar `/speckit.memorylint.run` para auditar `AGENTS.md`
   - Identificar regras arquiteturais que deveriam estar em `constitution.md`
   - Identificar workflows de infraestrutura faltantes
   - Documentar achados

4. **Atualizar Documentação**
   - Adicionar seção sobre MemoryLint em `docs/sdd/README.md`
   - Atualizar `RESUMO_EXECUCAO.md` com a instalação
   - Atualizar `index.md` com esta sessão

---

## Arquivos que Serão Modificados

- `.specify/extensions/.registry` (atualizado automaticamente)
- `.specify/extensions/memorylint/` (criado)
- `docs/sdd/README.md` (atualizado ou criado)
- `RESUMO_EXECUCAO.md` (atualizado)
- `sessoes/index.md` (atualizado)

---

## Critério de Conclusão

✅ Sessão concluída quando:
1. MemoryLint instalado e registrado em `.registry`
2. Estrutura de extensão validada
3. Auditoria inicial executada com relatório documentado
4. Documentação atualizada
5. Todos os itens da checklist marcados [x]
6. Próximos passos definidos

---

## Progresso

### [10:42] Início da Sessão
- Sessão criada
- Contexto carregado: `.registry` possui 3 extensões (git, fixit, brownfield)
- Próximo número sequencial confirmado: 7

### [10:43] Fase 1: Instalação
- ✅ Instalação concluída (apesar de erro de encoding na saída)
- Extensão registrada em `.registry` com timestamp 2026-04-22T13:43:29
- Versão instalada: 1.3.0
- Comandos registrados: `speckit.memorylint.run`, `speckit.memorylint.load-agents`
- Hooks registrados: `before_constitution` (opcional), `before_plan` (obrigatório)

### [10:44] Fase 2: Validação
- ✅ Estrutura verificada em `.specify/extensions/memorylint/`
  - `extension.yml` (manifest)
  - `README.md` (documentação completa)
  - `commands/check-boundaries.md` (auditoria de boundaries)
  - `commands/load-agents.md` (gate obrigatório de planejamento)
  - `LICENSE` (MIT)
- ✅ Comandos confirmados no registry
- ✅ Hooks confirmados: `before_constitution` e `before_plan`

### [10:44] Fase 3: Auditoria Inicial

**Contexto analisado:**
- `AGENTS.md` (433 linhas) - governança operacional
- `constitution.md` (217 linhas) - regras arquiteturais SDD
- `package.json` - stack tecnológica (monorepo TypeScript)

**Resultado da Auditoria:**

#### Extracted Architectural Rules for Constitution
*(None found. AGENTS.md is clean.)*

**Justificativa:**
- `AGENTS.md` contém exclusivamente regras de infraestrutura:
  - Protocolos de sessão e documentação
  - Git workflows e branch policy
  - Comandos de infraestrutura (SSH, Docker remoto, PostgreSQL)
  - Gestão de contexto e roteamento de documentos
  - Protocolos de aprovação e segurança operacional
  
- `constitution.md` contém corretamente as regras arquiteturais:
  - Stack tecnológica (Node.js, TypeScript, React, PostgreSQL)
  - Convenções de código (TypeScript estrito, proibição de `any`)
  - Ciclo TDAD e estados de task
  - Guardrails técnicos (HTTP status codes, validação, logs)
  - Regras de commits atômicos e evidência

- **Referência cruzada já existe**: Linhas 3-4 de `AGENTS.md` declaram subordinação a `ARQUITETURA_PROJETO.md` para contratos técnicos.

#### Enhancements Made to AGENTS.md
*(None needed. Infrastructure guidelines are comprehensive.)*

**Justificativa:**
- Build/test commands: Documentados via npm scripts (referenciados em constitution.md)
- Git workflows: Completos (branch policy, commit conventions, PR protocol)
- Environment setup: Detalhado (SSH remoto, Docker, PostgreSQL, PowerShell 7.6.0)
- Agent behaviors: Protocolos de execução, aprovação e conclusão bem definidos

**Conclusão da Auditoria:**
O projeto possui **governança de memória AI exemplar**. A separação entre `AGENTS.md` (infraestrutura/operacional) e `constitution.md` (arquitetura/código) está correta e bem mantida. Não há regras arquiteturais vazando para `AGENTS.md`, e não há workflows de infraestrutura faltantes.

### [10:45] Fase 4: Documentação
- ✅ Criado `docs/sdd/MEMORYLINT_EXTENSION.md` com documentação completa
  - Objetivo e comandos disponíveis
  - Regras de boundary (infraestrutura vs arquitetura)
  - Resultado da auditoria inicial
  - Integração com workflow SDD
  - Manutenção contínua e troubleshooting
- ✅ Atualizado `RESUMO_EXECUCAO.md` com sessão 7
- ✅ Atualizado `sessoes/index.md` com nova sessão

### [10:47] Fase 5: Finalização
- ✅ Todos os itens da checklist concluídos
- ✅ Documentação completa e sincronizada
- ✅ Próximos passos definidos

---

## Checklist de Execução (Atualizada)

### Fase 1: Instalação
- [x] Executar `specify extension add memorylint --from <URL>`
- [x] Verificar estrutura de diretórios criada
- [x] Verificar registro em `.registry`

### Fase 2: Validação
- [x] Listar estrutura de `.specify/extensions/memorylint/`
- [x] Verificar comandos registrados
- [x] Verificar hooks registrados
- [x] Testar comando `/speckit.memorylint.run --help` (se disponível)

### Fase 3: Auditoria Inicial
- [x] Executar `/speckit.memorylint.run` em `AGENTS.md`
- [x] Analisar relatório de achados
- [x] Identificar regras arquiteturais mal posicionadas
- [x] Identificar workflows faltantes
- [x] Documentar recomendações

### Fase 4: Documentação
- [x] Criar/atualizar seção MemoryLint em `docs/sdd/MEMORYLINT_EXTENSION.md`
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

### Fase 5: Finalização
- [x] Validar que todos os itens anteriores estão [x]
- [x] Definir próximos passos para governança contínua

---

## Próximos Passos

1. **Governança contínua**: Executar `/speckit.memorylint.run` antes de grandes atualizações em `constitution.md`
2. **Hook automático**: `before_plan` ativo — `AGENTS.md` será carregado automaticamente em todo planejamento SDD
3. **Auditoria trimestral**: Agendar revisão de boundaries a cada 3 meses
4. **Monitoramento**: Observar se novos agentes respeitam a separação durante sessões SDD

---

## Critério de Conclusão

✅ **Sessão concluída:**
1. ✅ MemoryLint instalado e registrado em `.registry`
2. ✅ Estrutura de extensão validada
3. ✅ Auditoria inicial executada com relatório documentado
4. ✅ Documentação atualizada
5. ✅ Todos os itens da checklist marcados [x]
6. ✅ Próximos passos definidos
