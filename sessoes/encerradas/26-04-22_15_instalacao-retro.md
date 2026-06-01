# 26-04-22_15_instalacao-retro.md

**Data:** 22/04/2026  
**Objetivo:** Instalar extensão Spec-Kit Retro v1.0.0 para análise retrospectiva de sprints

---

## Vínculos
- **Sessão Anterior:** `26-04-22_14_instalacao-doctor.md`
- **Próxima Sessão:** N/A

---

## Plano de Execução

1. [x] Verificar número sequencial no `index.md` (próxima: 15)
2. [x] Criar arquivo de sessão `26-04-22_15_instalacao-retro.md`
3. [x] Download da extensão v1.0.0 do repositório GitHub
4. [x] Extração e cópia para `.specify/extensions/retro/`
5. [x] Limpeza de arquivos temporários
6. [x] Cálculo de hash SHA256 do manifest
7. [x] Registro em `.specify/extensions/.registry`
8. [x] Atualização de `AGENTS.md` (tabela + documentação)
9. [x] Criação de `docs/sdd/RETRO_EXTENSION.md`
10. [x] Validação da instalação
11. [x] Atualizar RESUMO_EXECUCAO.md
12. [x] Atualizar index.md

---

## Checklist de Execução

- [x] Download concluído
- [x] Extração concluída
- [x] Arquivos copiados para `.specify/extensions/retro/`
- [x] Arquivos temporários removidos
- [x] Hash SHA256 calculado: `f27959726b2bb9b5257b8a164f0096e94c03c443b2e99ccde14af220f9781457`
- [x] Registry atualizado
- [x] `AGENTS.md` atualizado
- [x] Documentação criada
- [x] Validação técnica completa
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Validação da Instalação

**22/04/2026 15:32 BRT:**

✅ **Estrutura de arquivos:**
- `.specify/extensions/retro/` criado
- `extension.yml` presente (628 bytes)
- `commands/run.md` presente (12,339 bytes)
- `commands/retro-template.md` presente (3,273 bytes)
- `README.md` presente (1,042 bytes, 42 linhas)
- `CHANGELOG.md` presente (789 bytes)
- `LICENSE` presente (1,064 bytes)

✅ **Registry:**
- Entrada `retro` registrada em `.specify/extensions/.registry`
- Hash SHA256: `f27959726b2bb9b5257b8a164f0096e94c03c443b2e99ccde14af220f9781457`
- Comando: `speckit.retro.run`
- Timestamp: `2026-04-22T18:26:40.000000+00:00`

✅ **Documentação:**
- `AGENTS.md` atualizado (tabela de extensões + referência)
- `docs/sdd/RETRO_EXTENSION.md` criado (documentação completa)

✅ **Manifest válido:**
- ID: `retro`
- Versão: `1.0.0`
- Comando: `speckit.retro.run`
- Requer: Spec-Kit >= 0.1.0

**Instalação validada com sucesso.**

---

## Checklist de Execução

- [ ] Download concluído
- [ ] Extração concluída
- [ ] Arquivos copiados para `.specify/extensions/retro/`
- [ ] Arquivos temporários removidos
- [ ] Hash SHA256 calculado
- [ ] Registry atualizado
- [ ] `AGENTS.md` atualizado
- [ ] Documentação criada
- [ ] Validação técnica completa
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Arquivos que serão modificados

- `.specify/extensions/.registry` — adicionar entrada retro
- `AGENTS.md` — adicionar na tabela de extensões + referência de documentação
- `docs/sdd/RETRO_EXTENSION.md` — documentação completa (novo)
- `RESUMO_EXECUCAO.md` — atualizar última sessão
- `sessoes/index.md` — adicionar sessão 15

---

## Critério de Conclusão

- [ ] Extensão baixada e instalada em `.specify/extensions/retro/`
- [ ] Registry atualizado com hash e comandos
- [ ] `AGENTS.md` atualizado
- [ ] Documentação completa criada
- [ ] Validação técnica: estrutura, manifest, comandos
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Detalhes da Extensão

**Nome:** Spec-Kit Retro v1.0.0  
**Repositório:** https://github.com/arunt14/spec-kit-retro  
**Comando:** `speckit.retro.run [focus area]`

**Função:**
- Análise retrospectiva de sprint com métricas
- Avaliação de precisão da spec vs. implementação
- Avaliação de efetividade do plano
- Qualidade de implementação (review, QA)
- Métricas git (commits, arquivos, linhas, datas)
- Identificação de tendências
- Sugestões de melhorias acionáveis
- Atualização opcional da constitution com aprendizados

**O Que Analisa:**
1. **Spec accuracy** — requisitos cumpridos vs. implementação real
2. **Plan effectiveness** — escopo de tasks, trabalho não planejado
3. **Implementation quality** — achados de review, resultados de QA
4. **Git metrics** — commits, arquivos alterados, linhas, intervalo de datas
5. **Trends** — identificação de padrões entre retrospectivas
6. **Improvements** — sugestões acionáveis

**Workflow:**
`/speckit.ship` → `/speckit.retro.run` → (próximo ciclo de feature)

**Output:**
Relatórios gerados em `FEATURE_DIR/retros/retro-{timestamp}.md` usando template.

---

## Progresso

**22/04/2026 15:25 BRT:**
- ✅ Sessão criada
- ⏳ Próximo: download da extensão
