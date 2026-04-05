# Resumo de Sessão: Parsing Inteligente de Mensagens do Discord

**Data:** 05/04/2026  
**Objetivo:** Implementar parsing inteligente com Python para extrair campos estruturados de mensagens do Discord automaticamente  
**Status:** Planejamento  
**Prioridade:** ALTA (GUT 125)

---

## 📋 Contexto e Motivação

### Problema Identificado na Validação Beta

Durante a validação do REQ-19 em `mesasbeta.artificiorpg.com/gestao`, identificamos que **os campos não estavam sendo auto-preenchidos** a partir do JSON do Discord. Investigação revelou:

**Causa Raiz:**
- O backend **NÃO faz parsing inteligente** do conteúdo das mensagens
- Apenas normaliza a estrutura (author, attachments, embeds)
- O campo `content` (texto bruto da mensagem) não é processado
- Frontend recebe JSON com `content: "# Título: Minha Mesa\n▬ Sistema: D&D\n..."` sem campos estruturados

**Impacto:**
- Admin precisa copiar/colar manualmente todos os campos
- Viola H6 (Reconhecimento vs Memorização) das Heurísticas de Nielsen
- Processo de revisão lento e propenso a erros
- Experiência ruim para o admin

### Solução Temporária Implementada

Criamos parser TypeScript no frontend (`parseDiscordContent.ts`) que extrai campos do `content` usando regex. **Funciona, mas tem limitações:**
- Parsing acontece a cada renderização (ineficiente)
- Regex simples não captura variações complexas
- Difícil manter e expandir
- Não valida dados extraídos

### Solução Definitiva Proposta

**Parser Python no Backend** que processa mensagens **ANTES** de salvar no banco:
- Parsing acontece UMA VEZ (eficiente)
- NLP robusto com spaCy
- Validação com pydantic
- Dados já chegam estruturados no banco
- Reutilizável para outros agregadores (Telegram, WhatsApp)

---

## 🎯 Objetivo da Implementação

Criar serviço Python que:
1. Recebe mensagem bruta do Discord (content + metadata)
2. Extrai campos estruturados usando NLP
3. Valida e normaliza dados
4. Retorna JSON enriquecido para salvar no banco

**Campos a extrair:**
- `title` - Título da mesa
- `system` - Sistema de RPG
- `type` - Tipo (campanha/oneshot)
- `modality` - Modalidade (online/presencial/híbrida)
- `slots` - Número de vagas
- `language` - Idioma
- `starts_at` - Data de início (ISO 8601)
- `schedule` - Horário e dia da semana
- `frequency` - Frequência (semanal/quinzenal/mensal)
- `price_type` - Tipo de preço (gratuita/paga)
- `rules_notes` - Regras e observações
- `actual_gm_name` - Nome do mestre
- `contacts` - Array de contatos (Discord, WhatsApp, Email, Telegram)

---

## 📦 Stack Tecnológica

### Bibliotecas Python

| Biblioteca | Versão | Propósito |
|------------|--------|-----------|
| **spaCy** | 3.7+ | NLP core, extração de entidades, tokenização |
| **pt_core_news_lg** | 3.7+ | Modelo de linguagem português (spaCy) |
| **dateparser** | 1.2+ | Parse de datas em português ("Sábado das 20h") |
| **phonenumbers** | 8.13+ | Validação e normalização de telefones BR |
| **pydantic** | 2.5+ | Validação de schema e type safety |
| **regex** | 2023+ | Regex avançado com Unicode |

### Integração com Backend Node.js

**Opção 1: Child Process (Recomendada)**
```typescript
import { spawn } from 'child_process';

const result = await runPythonParser(messageContent, metadata);
```

**Opção 2: HTTP Service (Futuro)**
```typescript
const response = await fetch('http://localhost:5000/parse', {
  method: 'POST',
  body: JSON.stringify({ content, metadata })
});
```

---

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│ Discord JSON (DiscordChatExporter)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Node.js (importFromExporterService)                 │
│ - Normaliza estrutura (author, attachments, embeds)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Python Parser Service (discord_message_parser.py)           │
│ - Extrai campos estruturados do content                    │
│ - Valida e normaliza dados                                 │
│ - Retorna JSON enriquecido                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Banco de Dados (aggregator_import_candidates)              │
│ - parsed_json já contém campos estruturados                │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (GestaoPage)                                       │
│ - Campos auto-preenchidos automaticamente                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Plano de Implementação

### Fase 1: Setup e Dependências (Item 059)

**Objetivo:** Preparar ambiente Python e instalar dependências

**Tarefas:**
- [ ] Criar `backend/requirements.txt` com dependências
- [ ] Criar `backend/scripts/setup_python_env.sh` (Linux/Mac)
- [ ] Criar `backend/scripts/setup_python_env.ps1` (Windows)
- [ ] Instalar spaCy e baixar modelo `pt_core_news_lg`
- [ ] Validar instalação com script de teste
- [ ] Documentar setup em `OPERACAO_PRODUCAO.md`

**Arquivos:**
```
backend/
├── requirements.txt (NOVO)
├── scripts/
│   ├── setup_python_env.sh (NOVO)
│   └── setup_python_env.ps1 (NOVO)
└── src/services/aggregator/parser/
    └── __init__.py (NOVO)
```

**Critério de Conclusão:** `python -m spacy info pt_core_news_lg` retorna sucesso

---

### Fase 2: Parser Core (Item 060)

**Objetivo:** Criar serviço Python de parsing

**Tarefas:**
- [ ] Criar `discord_message_parser.py` com estrutura base
- [ ] Implementar extração de título (primeira linha com #)
- [ ] Implementar extração de sistema (regex + NLP)
- [ ] Implementar extração de tipo de mesa
- [ ] Implementar extração de modalidade
- [ ] Implementar extração de vagas (números)
- [ ] Implementar extração de idioma
- [ ] Implementar extração de datas com dateparser
- [ ] Implementar extração de horários e dias da semana
- [ ] Implementar extração de frequência
- [ ] Implementar extração de preço
- [ ] Implementar extração de regras/observações
- [ ] Implementar extração de nome do mestre
- [ ] Criar schema Pydantic para validação

**Arquivos:**
```
backend/src/services/aggregator/parser/
├── discord_message_parser.py (NOVO)
├── schemas.py (NOVO - Pydantic models)
├── extractors/
│   ├── __init__.py (NOVO)
│   ├── title_extractor.py (NOVO)
│   ├── system_extractor.py (NOVO)
│   ├── datetime_extractor.py (NOVO)
│   ├── contact_extractor.py (NOVO)
│   └── price_extractor.py (NOVO)
└── tests/
    ├── __init__.py (NOVO)
    └── test_parser.py (NOVO)
```

**Exemplo de Schema Pydantic:**
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date

class Contact(BaseModel):
    channel: str
    value: str
    extra_url: Optional[str] = None

class ParsedMessage(BaseModel):
    title: Optional[str] = None
    system: Optional[str] = None
    type: Optional[str] = None
    modality: Optional[str] = None
    slots: Optional[int] = None
    language: Optional[str] = None
    starts_at: Optional[date] = None
    schedule: Optional[str] = None
    frequency: Optional[str] = None
    price_type: Optional[str] = None
    rules_notes: Optional[str] = None
    actual_gm_name: Optional[str] = None
    contacts: List[Contact] = Field(default_factory=list)
    
    @validator('price_type')
    def validate_price_type(cls, v):
        if v and v not in ['gratuita', 'paga']:
            raise ValueError('price_type deve ser gratuita ou paga')
        return v
```

**Critério de Conclusão:** Parser extrai todos os campos de mensagem de teste

---

### Fase 3: Integração com Backend Node.js (Item 061)

**Objetivo:** Integrar parser Python no fluxo de importação

**Tarefas:**
- [ ] Criar `pythonParserService.ts` para invocar Python
- [ ] Implementar função `runPythonParser(content, metadata)`
- [ ] Integrar no `normalizeExporterPayload.ts`
- [ ] Adicionar fallback para parser TS se Python falhar
- [ ] Implementar logging de erros do parser
- [ ] Adicionar métricas de performance

**Arquivos:**
```
backend/src/services/aggregator/
├── pythonParserService.ts (NOVO)
└── parser/
    └── discord_message_parser.py (já existe)

backend/src/domain/aggregator/
└── normalizeExporterPayload.ts (MODIFICADO)
```

**Exemplo de Integração:**
```typescript
import { pythonParserService } from '../../services/aggregator/pythonParserService';

const normalizeMessage = async (item: unknown): Promise<NormalizedExporterMessage | null> => {
  // ... código existente ...
  
  // Tentar parsing inteligente com Python
  let enrichedFields = {};
  if (content) {
    try {
      enrichedFields = await pythonParserService.parseMessage(content, {
        author: author,
        timestamp: timestamp,
      });
    } catch (error) {
      console.warn('[Python Parser] Falhou, usando fallback TS:', error);
      // Fallback para parser TS (já implementado)
    }
  }
  
  return {
    // ... campos existentes ...
    enrichedFields, // Campos extraídos pelo parser
  };
};
```

**Critério de Conclusão:** Importação de JSON do Discord enriquece `parsed_json` automaticamente

---

### Fase 4: Testes com Mensagens Reais (Item 062)

**Objetivo:** Validar parser com mensagens reais do Discord

**Tarefas:**
- [ ] Criar suite de testes com `exemplo_mesa_1_fixed.json`
- [ ] Testar extração de todos os campos
- [ ] Validar taxa de acerto (meta: >90%)
- [ ] Identificar padrões não capturados
- [ ] Ajustar regex e lógica de extração
- [ ] Documentar casos edge e limitações

**Arquivos:**
```
backend/src/services/aggregator/parser/tests/
├── fixtures/
│   ├── exemplo_mesa_1.json (cópia de testes/fixtures)
│   ├── exemplo_mesa_2.json (NOVO)
│   └── exemplo_mesa_3.json (NOVO)
└── test_real_messages.py (NOVO)
```

**Métricas de Sucesso:**
- Taxa de acerto por campo (ex: título 95%, sistema 85%, horário 70%)
- Tempo de processamento (<500ms por mensagem)
- Taxa de falha do parser (<5%)

**Critério de Conclusão:** Parser extrai corretamente 90%+ dos campos de mensagens reais

---

### Fase 5: Deploy e Validação em Beta (Item 063)

**Objetivo:** Deploy do parser em beta e validação com usuário

**Tarefas:**
- [ ] Atualizar Dockerfile para incluir Python e dependências
- [ ] Atualizar workflow de deploy beta
- [ ] Deploy para `mesasbeta.artificiorpg.com`
- [ ] Importar JSON real e validar campos auto-preenchidos
- [ ] Coletar feedback do admin
- [ ] Ajustar parser baseado em feedback
- [ ] Documentar melhorias em `ERRORS_SOLUTIONS.md`

**Arquivos:**
```
.github/workflows/
└── deploy-beta.yml (MODIFICADO)

backend/
├── Dockerfile (MODIFICADO)
└── .dockerignore (MODIFICADO)
```

**Exemplo de Dockerfile:**
```dockerfile
FROM node:20-alpine

# Instalar Python e pip
RUN apk add --no-cache python3 py3-pip

# Copiar requirements e instalar dependências Python
COPY backend/requirements.txt /app/backend/
RUN pip3 install --no-cache-dir -r /app/backend/requirements.txt

# Baixar modelo spaCy
RUN python3 -m spacy download pt_core_news_lg

# ... resto do Dockerfile ...
```

**Critério de Conclusão:** Admin valida que campos são auto-preenchidos corretamente em beta

---

### Fase 6: Migração Gradual e Cleanup (Item 064)

**Objetivo:** Remover parser TS do frontend e consolidar lógica no backend

**Tarefas:**
- [ ] Confirmar que parser Python está estável em beta
- [ ] Remover `parseDiscordContent.ts` do frontend
- [ ] Simplificar `candidateToFormData.ts` (remover parsing)
- [ ] Atualizar testes do frontend
- [ ] Documentar mudança em `RESUMO_EXECUCAO.md`
- [ ] Atualizar `ambiente_atual_mesas.md`

**Arquivos:**
```
frontend/src/utils/
├── parseDiscordContent.ts (DELETAR)
└── candidateToFormData.ts (SIMPLIFICAR)
```

**Critério de Conclusão:** Frontend apenas mapeia campos já estruturados do `parsed_json`

---

## 🧪 Estratégia de Testes

### Testes Unitários (Python)

```python
# backend/src/services/aggregator/parser/tests/test_extractors.py

def test_extract_title():
    content = "# Dungeons & Dragons: Curse of Strahd™"
    result = extract_title(content)
    assert result == "Dungeons & Dragons: Curse of Strahd™"

def test_extract_system():
    content = "▬ **Sistema:** Dungeons & Dragons 2024"
    result = extract_system(content)
    assert result == "Dungeons & Dragons 2024"

def test_extract_schedule():
    content = "Sextas-feiras das 21h30 às 00h30"
    result = extract_schedule(content)
    assert result.day_of_week == "sexta"
    assert result.start_time == "21:30"
    assert result.end_time == "00:30"
```

### Testes de Integração (Node.js)

```typescript
// backend/src/services/aggregator/parser/pythonParserService.test.ts

describe('pythonParserService', () => {
  it('should parse Discord message and return structured fields', async () => {
    const content = `# Dungeons & Dragons: Curse of Strahd™
▬ **Sistema:** Dungeons & Dragons 2024
▬ **Vagas:** 4
▬ **Data & Horário:** Sextas-feiras das 21h30`;

    const result = await pythonParserService.parseMessage(content, {});
    
    expect(result.title).toBe('Dungeons & Dragons: Curse of Strahd™');
    expect(result.system).toBe('Dungeons & Dragons 2024');
    expect(result.slots).toBe(4);
  });
});
```

### Testes End-to-End

```typescript
// Importar JSON real e validar que campos são extraídos
const payload = require('../fixtures/exemplo_mesa_1_fixed.json');
const result = await importFromExporterService.importPayload({ payload });

expect(result.candidates[0].parsed_json.title).toBeDefined();
expect(result.candidates[0].parsed_json.system).toBeDefined();
```

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Taxa de acerto (título) | >95% | Testes com 100 mensagens reais |
| Taxa de acerto (sistema) | >85% | Testes com 100 mensagens reais |
| Taxa de acerto (horário) | >70% | Testes com 100 mensagens reais |
| Tempo de processamento | <500ms | Benchmark com spaCy |
| Taxa de falha do parser | <5% | Logs de produção |
| Redução de tempo de revisão | >50% | Feedback do admin |

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| spaCy muito pesado para container | ALTO | MÉDIA | Usar modelo `sm` ao invés de `lg` se necessário |
| Parser Python falha em produção | ALTO | BAIXA | Manter fallback para parser TS |
| Tempo de processamento alto | MÉDIO | MÉDIA | Processar em background, não bloquear importação |
| Modelo pt não captura gírias de RPG | MÉDIO | ALTA | Treinar modelo customizado ou usar regex híbrido |
| Dependências Python quebram build | ALTO | BAIXA | Fixar versões no requirements.txt |

---

## 📚 Referências e Aprendizados

### Aprendizados da Sessão Anterior (resumo_05-04_2)

1. **Sempre validar build antes de commit** - Evita quebrar CI/CD
2. **Documentar bugs encontrados em validação** - Facilita rastreamento
3. **Usar fallbacks para features críticas** - Parser TS como backup
4. **Testar com dados reais, não sintéticos** - Revela edge cases
5. **Seguir Heurísticas de Nielsen** - H6 (Reconhecimento) foi violada

### Documentação Técnica

- [spaCy Documentation](https://spacy.io/usage)
- [dateparser Documentation](https://dateparser.readthedocs.io/)
- [pydantic Documentation](https://docs.pydantic.dev/)
- [phonenumbers Documentation](https://github.com/daviddrysdale/python-phonenumbers)

### Arquivos Canônicos

- `AGENTS.md` - Governança e regras
- `ARQUITETURA_PROJETO.md` - Decisões arquiteturais
- `OPERACAO_PRODUCAO.md` - Heurísticas de Nielsen
- `ERRORS_SOLUTIONS.md` - Erros conhecidos e soluções
- `TODO_OPERACIONAL.md` - Backlog de requisitos
- `FILA_IMPLEMENTACAO.md` - Fila técnica de execução

---

## 📈 Acompanhamento de Progresso

### Status Atual: PLANEJAMENTO

**Última Atualização:** 05/04/2026 02:18

### Fases Concluídas:
- ✅ Fase 0: Análise e Planejamento (este documento)

### Fases Pendentes:
- ⏳ Fase 1: Setup e Dependências (Item 059)
- ⏳ Fase 2: Parser Core (Item 060)
- ⏳ Fase 3: Integração com Backend Node.js (Item 061)
- ⏳ Fase 4: Testes com Mensagens Reais (Item 062)
- ⏳ Fase 5: Deploy e Validação em Beta (Item 063)
- ⏳ Fase 6: Migração Gradual e Cleanup (Item 064)

### Próxima Ação:
Aguardando aprovação do usuário para iniciar Fase 1 (Setup Python)

---

### [Data/Hora] - Início da Implementação
- [ ] Aprovação do plano recebida
- [ ] Branch criada: `feature/python-parser`
- [ ] Fase 1 iniciada

---

### [Data/Hora] - Fase 1: Setup Concluído
- [ ] requirements.txt criado
- [ ] Scripts de setup criados (Linux + Windows)
- [ ] spaCy instalado e modelo baixado
- [ ] Validação de ambiente OK

---

### [Data/Hora] - Fase 2: Parser Core Concluído
- [ ] discord_message_parser.py criado
- [ ] Todos os extractors implementados
- [ ] Schema Pydantic validado
- [ ] Testes unitários passando

---

### [Data/Hora] - Fase 3: Integração Backend Concluída
- [ ] pythonParserService.ts criado
- [ ] Integração em normalizeExporterPayload.ts
- [ ] Fallback para parser TS funcionando
- [ ] Testes de integração passando

---

### [Data/Hora] - Fase 4: Testes Reais Concluídos
- [ ] Suite de testes com mensagens reais criada
- [ ] Taxa de acerto >90% validada
- [ ] Casos edge documentados
- [ ] Ajustes finais aplicados

---

### [Data/Hora] - Fase 5: Deploy Beta
- [ ] Dockerfile atualizado
- [ ] Workflow de deploy atualizado
- [ ] Deploy para beta concluído
- [ ] Validação manual OK
- [ ] Feedback do admin coletado

---

### [Data/Hora] - Fase 6: Cleanup e Finalização
- [ ] parseDiscordContent.ts removido do frontend
- [ ] candidateToFormData.ts simplificado
- [ ] Testes do frontend atualizados
- [ ] Documentação atualizada
- [ ] Commit final e merge para dev

---

## ✅ Checklist de Fechamento

- [ ] Todas as 6 fases implementadas e testadas
- [ ] Parser Python validado em beta
- [ ] Taxa de acerto >90% em mensagens reais
- [ ] Tempo de processamento <500ms
- [ ] Fallback para parser TS funcionando
- [ ] Documentação atualizada (OPERACAO_PRODUCAO, ERRORS_SOLUTIONS)
- [ ] Dockerfile e workflows atualizados
- [ ] Frontend simplificado (parser removido)
- [ ] Testes unitários e de integração passando
- [ ] Admin validou melhoria na experiência de revisão
- [ ] Atualizar documentos relevantes (TODO, FILA, RESUMO, AMBIENTE)

---

**FIM DO RESUMO DE SESSÃO**

> Este arquivo serve como **plano de implementação completo** para o parsing inteligente.
> Contém todo o contexto, arquitetura, fases de implementação e critérios de sucesso.
> Atualizar conforme a implementação progride para manter rastreabilidade completa.
