# 26-04-22_14_instalacao-doctor.md

**Data:** 22/04/2026  
**Objetivo:** Instalar extensão Spec-Kit Doctor v1.0.0 para diagnóstico de saúde do projeto

---

## Vínculos
- **Sessão Anterior:** `26-04-22_13_instalacao-archive.md`
- **Próxima Sessão:** N/A

---

## Plano de Execução

1. [x] Verificar número sequencial no `index.md` (próxima: 14)
2. [x] Criar arquivo de sessão `26-04-22_14_instalacao-doctor.md`
3. [x] Download da extensão v1.0.0 do repositório GitHub
4. [x] Extração e cópia para `.specify/extensions/doctor/`
5. [x] Limpeza de arquivos temporários
6. [x] Cálculo de hash SHA256 do manifest
7. [x] Registro em `.specify/extensions/.registry`
8. [x] Atualização de `AGENTS.md` (tabela + documentação)
9. [x] Criação de `docs/sdd/DOCTOR_EXTENSION.md`
10. [x] Validação da instalação
11. [x] Atualizar RESUMO_EXECUCAO.md
12. [x] Atualizar index.md

---

## Checklist de Execução

- [ ] Download concluído
- [ ] Extração concluída
- [ ] Arquivos copiados para `.specify/extensions/doctor/`
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

- `.specify/extensions/.registry` — adicionar entrada doctor
- `AGENTS.md` — adicionar na tabela de extensões + referência de documentação
- `docs/sdd/DOCTOR_EXTENSION.md` — documentação completa (novo)
- `RESUMO_EXECUCAO.md` — atualizar última sessão
- `sessoes/index.md` — adicionar sessão 14

---

## Critério de Conclusão

- [ ] Extensão baixada e instalada em `.specify/extensions/doctor/`
- [ ] Registry atualizado com hash e comandos
- [ ] `AGENTS.md` atualizado
- [ ] Documentação completa criada
- [ ] Validação técnica: estrutura, manifest, comandos
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Detalhes da Extensão

**Nome:** Spec-Kit Doctor v1.0.0  
**Repositório:** https://github.com/KhawarHabibKhan/spec-kit-doctor  
**Comandos:** `speckit.doctor.check`, `speckit.doctor` (alias)

**Função:**
- Diagnóstico de saúde do projeto Spec-Kit
- Verifica 6 áreas: estrutura, configuração AI, features, scripts, extensões, git
- Reporta erros, warnings e notas com sugestões de correção

**Áreas de Verificação:**
1. **Project structure** — `.specify/`, `specs/`, `scripts/`, `templates/`, `memory/` presentes?
2. **AI agent configuration** — qual agente configurado, comandos existem?
3. **Feature specifications** — para cada feature, `spec.md`/`plan.md`/`tasks.md` presentes?
4. **Scripts health** — scripts bash e PowerShell presentes e executáveis?
5. **Extensions health** — `extensions.yml` válido, registry intacto?
6. **Git status** — em repo, qual branch?

---

## Progresso

**22/04/2026 15:11 BRT:**
- ✅ Sessão criada
- ⏳ Próximo: download da extensão

**22/04/2026 15:19 BRT:**
- ✅ Download, extração e instalação concluídos
- ✅ Registry, AGENTS.md e documentação atualizados
- ✅ Validação técnica completa

---

## Validação da Instalação

✅ **Estrutura de arquivos:**
- `.specify/extensions/doctor/` criado
- `extension.yml` presente (719 bytes)
- `commands/check.md` presente (1,904 bytes)
- `README.md` presente (1,042 bytes, 45 linhas)
- `CHANGELOG.md` presente (232 bytes)
- `scripts/` presente

✅ **Registry:**
- Entrada `doctor` registrada em `.specify/extensions/.registry`
- Hash SHA256: `45150c8ac10b6b002ebea9de34a203911951fe3a89cb8635a2a149082c02eeed`
- Comandos: `speckit.doctor.check`, `speckit.doctor`
- Timestamp: `2026-04-22T18:14:31.000000+00:00`

✅ **Documentação:**
- `AGENTS.md` atualizado (tabela de extensões + referência)
- `docs/sdd/DOCTOR_EXTENSION.md` criado (documentação completa)

✅ **Manifest válido:**
- ID: `doctor`
- Versão: `1.0.0`
- Comandos: `speckit.doctor.check` (alias: `speckit.doctor`)
- Requer: Spec-Kit >= 0.1.0

**Instalação validada com sucesso.**
