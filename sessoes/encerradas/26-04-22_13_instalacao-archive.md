# 26-04-22_13_instalacao-archive.md

**Data:** 22/04/2026  
**Objetivo:** Instalar extensão Spec-Kit Archive v1.0.0 para arquivamento pós-merge de features

---

## Vínculos
- **Sessão Anterior:** `26-04-22_1_migracao-governanca-legacy.md`
- **Próxima Sessão:** N/A

---

## Plano de Execução

1. [x] Verificar número sequencial no `index.md` (próxima: 13)
2. [x] Criar arquivo de sessão `26-04-22_13_instalacao-archive.md`
3. [x] Download da extensão v1.0.0 do repositório GitHub
4. [x] Extração e cópia para `.specify/extensions/archive/`
5. [x] Limpeza de arquivos temporários
6. [x] Cálculo de hash SHA256 do manifest
7. [x] Registro em `.specify/extensions/.registry`
8. [x] Atualização de `AGENTS.md` (tabela + documentação)
9. [x] Criação de `docs/sdd/ARCHIVE_EXTENSION.md`
10. [x] Validação da instalação
11. [x] Atualizar RESUMO_EXECUCAO.md
12. [x] Atualizar index.md

---

## Checklist de Execução

- [x] Download concluído
- [x] Extração concluída
- [x] Arquivos copiados para `.specify/extensions/archive/`
- [x] Arquivos temporários removidos
- [x] Hash SHA256 calculado: `ffa3831c0dd8aceeadad88efe4411676142d654dfbc1987e6e030ba6cdceb83e`
- [x] Registry atualizado
- [x] `AGENTS.md` atualizado
- [x] Documentação criada
- [x] Validação técnica completa
- [x] RESUMO_EXECUCAO.md atualizado
- [x] index.md atualizado

---

## Validação da Instalação

**22/04/2026 15:06 BRT:**

✅ **Estrutura de arquivos:**
- `.specify/extensions/archive/` criado
- `extension.yml` presente (622 bytes)
- `commands/archive.md` presente (16,369 bytes)
- `README.md` presente (2,115 bytes, 46 linhas)
- `LICENSE` presente (1,075 bytes)

✅ **Registry:**
- Entrada `archive` registrada em `.specify/extensions/.registry`
- Hash SHA256: `ffa3831c0dd8aceeadad88efe4411676142d654dfbc1987e6e030ba6cdceb83e`
- Comando: `speckit.archive.run`
- Timestamp: `2026-04-22T18:01:44.000000+00:00`

✅ **Documentação:**
- `AGENTS.md` atualizado (tabela de extensões + referência)
- `docs/sdd/ARCHIVE_EXTENSION.md` criado (documentação completa, 280+ linhas)

✅ **Manifest válido:**
- ID: `archive`
- Versão: `1.0.0`
- Requer: `check-prerequisites.sh`
- Comando: `speckit.archive.run`

**Instalação validada com sucesso.**

---

## Arquivos que serão modificados

- `.specify/extensions/.registry` — adicionar entrada archive
- `AGENTS.md` — adicionar na tabela de extensões + referência de documentação
- `docs/sdd/ARCHIVE_EXTENSION.md` — documentação completa (novo)
- `RESUMO_EXECUCAO.md` — atualizar última sessão
- `sessoes/index.md` — adicionar sessão 13

---

## Critério de Conclusão

- [x] Extensão baixada e instalada em `.specify/extensions/archive/`
- [ ] Registry atualizado com hash e comandos
- [ ] `AGENTS.md` atualizado
- [ ] Documentação completa criada
- [ ] Validação técnica: estrutura, manifest, comando
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Detalhes da Extensão

**Nome:** Spec-Kit Archive v1.0.0  
**Repositório:** https://github.com/stn1slv/spec-kit-archive  
**Comando:** `speckit.archive.run`

**Função:**
- Arquivamento pós-merge de features na memória canônica do projeto (`.specify/memory/`)
- Implementa "Outer Loop" do framework Double-Loop Parity
- Consolida specs, plans e débito técnico finalizados

**Workflow:**
1. Executar `check-prerequisites.sh` para encontrar artefatos da feature
2. Verificar conformidade com Constitution
3. Realizar Impact Map (até 5 perguntas de clarificação)
4. Arquivar dados (append em `.specify/memory/`)
5. Gerar relatório de arquivamento

**Opções:**
- `--spec-only` — atualizar apenas `.specify/memory/spec.md`
- `--plan-only` — atualizar apenas `.specify/memory/plan.md`
- `--changelog-only` — atualizar apenas `.specify/memory/changelog.md`
- `--agent-only` — atualizar apenas arquivo de conhecimento do agente

---

## Progresso

**22/04/2026 15:01 BRT:**
- ✅ Sessão criada
- ✅ Download e extração concluídos
- ✅ Hash calculado
- ⏳ Próximo: registrar no `.registry`
