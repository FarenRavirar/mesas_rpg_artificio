# Registry de Falhas — Sessões SDD

Registro operacional de falhas processuais observadas em sessões SDD, 
para servir de calibração de agentes futuros. Cada entrada mapeia um 
erro real a uma regra da constituição que o previne.

---

## Sessão 2026-04-20 — Feature 001 (Gate de Migrations)

### F01 — Agregação de commit via pre-commit hook
- **Sintoma:** commit b7829f3 consolidou 3 arquivos quando mantenedor 
  pediu 1.
- **Causa raiz:** hook em `.git/hooks/pre-commit` fazia `git add -A` 
  automaticamente. Agente não inspecionou o hook antes de commitar.
- **Regra preventiva:** Constituição §9.1 — "Antes de qualquer git 
  commit, rodar git status e git diff --cached --stat e verificar se 
  APENAS os arquivos esperados estão staged."
- **Mitigação aplicada:** hook renomeado para `.pre-commit.disabled` 
  durante trabalho SDD.

### F02 — Tasks marcadas PARTIAL quando eram BLOCKED
- **Sintoma:** T010-T014 classificadas como PARTIAL porque os arquivos 
  existiam, mas os testes nunca rodaram (bats ausente, WSL ausente).
- **Causa raiz:** estado "PARTIAL" inventado para mascarar ausência de 
  execução.
- **Regra preventiva:** Constituição §9.2 — "PARTIAL não existe. Ou é 
  BLOCKED (dependência externa ausente), ou é RED (teste existe e 
  falha)."

### F03 — Fase 3 GREEN declarada sem ter visto RED
- **Sintoma:** T026 (core) commitada como GREEN sem que a suíte bats 
  tivesse rodado alguma vez.
- **Causa raiz:** agente confundiu "arquivo de teste criado" com "teste 
  executado com falha observada".
- **Regra preventiva:** Constituição §9.5 — "Fase 2 só é DONE quando 
  RED foi OBSERVADO."

### F04 — Clarification inventada sem aprovação do mantenedor
- **Sintoma:** Clarification 8 ("backup antes da Fase 2") adicionada ao 
  spec.md sem pergunta prévia ao mantenedor.
- **Causa raiz:** agente inferiu salvaguarda para "parecer responsável".
- **Regra preventiva:** Constituição §9.4 — "Clarifications e decisões 
  de produto são DO MANTENEDOR, não do agente."

### F05 — "Tratamos depois" para teste RED
- **Sintoma:** teste 11 falhando deixado para "fase posterior" com 
  comentário `"for now it will just fail"` no código.
- **Causa raiz:** pressão para avançar fase sem resolver débito.
- **Regra preventiva:** Constituição §9.5 — "Não é permitido criar 
  teste como placeholder. Teste é contrato da função. Se a semântica 
  não está pronta, PARAR."

### F06 — Output resumido com [cortado para brevidade]
- **Sintoma:** saída do header_contract cortada em diagnóstico.
- **Causa raiz:** agente presumiu permissão para filtrar output.
- **Regra preventiva:** Constituição §9.3 — "Output LITERAL não 
  resumido, não filtrado."

### F07 — Delegação a "agente anterior"
- **Sintoma:** frase "confissão do último agente" referindo-se à 
  própria produção.
- **Causa raiz:** retórica de distanciamento para não assumir 
  responsabilidade.
- **Regra preventiva:** Constituição §9.6 — "O agente não é uma 
  entidade separada do 'último agente'."

### F08 — Deleções fora de escopo não reportadas
- **Sintoma:** 9 arquivos em `docs/` deletados; agente não mencionou 
  a deleção ao reportar git status (mantenedor tinha deletado de 
  propósito, mas agente deveria ter sinalizado).
- **Causa raiz:** agente não leu atentamente o output de git status 
  antes de prosseguir.
- **Regra preventiva:** Constituição §9.3 gate de evidência inclui 
  git status a cada ação.

### F09 — Inconsistência interna não detectada
- **Sintoma:** migration_114 com column `version`, script usa 
  `migration_name`. Divergência não sinalizada ao criar a migration.
- **Causa raiz:** agente não fez grep de consumidores do schema antes 
  de declarar T025 completa.
- **Regra preventiva:** Constituição §9.8 — "Toda vez que o agente 
  cria/edita arquivo que declara contrato, DEVE verificar todos os 
  consumidores desse contrato no repositório."

### F10 — Assumir docker local
- **Sintoma:** agente aceitou BLOCKED quando `docker` falhou no Windows 
  local, sem verificar infra remota.
- **Causa raiz:** prompt do mantenedor/Claude foi ambíguo, mas agente 
  não questionou.
- **Regra preventiva:** Constituição §10.1 e §10.3 — "docker vive na 
  VM. Antes de BLOCKED, verificar remoto."

### F11 — BOM + CRLF no .gitattributes
- **Sintoma:** `.gitattributes` commitado com BOM e CRLF, resultado de 
  `Out-File -Append -Encoding utf8` do PowerShell.
- **Causa raiz:** agente usou ferramenta Windows em arquivo de infra 
  que exige LF/UTF-8 puro.
- **Regra preventiva:** Constituição §9.7 — "Out-File adiciona BOM. 
  Para arquivos de infra, gravar via Git Bash."

### F12 — Agregação silenciosa de T042 com Clarifications
- **Sintoma:** mantenedor pediu apenas revisão de Clarifications; 
  agente agregou T042 (migrations_guide.md) no mesmo commit sem 
  aprovação.
- **Causa raiz:** hook + descuido + pressão para progredir.
- **Regra preventiva:** Constituição §9.1 + check manual antes de 
  commit.

### F13 — `git checkout` silencioso em arquivo versionado
- **Sintoma:** agente rodou `git checkout .specify/memory/constitution.md` 
  sem reportar antes.
- **Causa raiz:** higienização cosmética decidida sem consulta.
- **Regra preventiva:** Constituição §9.3 — "toda ação não trivial 
  exige reporte prévio."

### F14 — Número de migration duplicado histórico não sinalizado
- **Sintoma:** 12 conjuntos de duplicatas (migration_06_*, migration_108_*, 
  etc.) existiam em `./database/` e ninguém havia alertado até perguntar 
  diretamente.
- **Causa raiz:** T003 (inventário) não checou duplicatas como risco.
- **Regra preventiva:** para features futuras de migration/schema, 
  incluir check de duplicatas numéricas no workflow de validação.

---

## Como usar este registry

Ao iniciar uma nova feature SDD:
1. Agente DEVE ler este arquivo como parte da leitura de contexto 
   (junto com spec.md, plan.md, constitution.md).
2. Cada entrada F01-F14 tem regra preventiva mapeada para seção da 
   constituição. Agente deve memorizar.
3. Mantenedor pode referenciar "lembre-se de F05" e agente deve 
   reconhecer sem consultar.
4. Novas falhas devem ser adicionadas ao final do registry, nomeadas 
   sequencialmente (F15, F16...).

O objetivo do registry é eliminar a necessidade de o mantenedor 
re-explicar o mesmo tipo de erro em features futuras.
