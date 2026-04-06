# VALIDAÇÃO: Comparação Texto-Fonte vs Output do Parser

**Data:** 2026-04-05  
**Caso:** O Lorde Demônio — Tormenta  
**Objetivo:** Validar fidelidade do parser ao texto-fonte (sem invenções)

---

## TEXTO-FONTE ORIGINAL (06_lorde_demonio_message.json)

```
# O Lorde Demônio — Tormenta

▬ **Sistema**: Tormenta 20
▬ **Tipo**: Campanha
▬ **Modalidade**: Online
▬ **Idioma**: Português
▬ **Dia e Horário**: Todas Os Domingos, ás 13:00PM
▬ **Vagas**: 3
▬ **Preço**: R$ 18,00 por sessão

**Resumo da história**

Nesta campanha, os jogadores assumem o papel de aventureiros em Arton, o mundo de Tormenta. A história gira em torno de um poderoso Lorde Demônio que ameaça destruir o equilíbrio entre os planos. Os heróis precisarão desvendar mistérios antigos, enfrentar cultistas fanáticos e tomar decisões difíceis que podem mudar o destino do mundo.

A narrativa combina elementos de investigação, combate tático e roleplay intenso, com foco em escolhas morais complexas e consequências reais para as ações dos personagens.

**Sobre o Mestre**

Olá! Meu nome é Mariana e sou mestre de RPG há 8 anos. Tenho experiência com diversos sistemas, mas Tormenta é minha paixão. Gosto de criar histórias envolventes com NPCs memoráveis e desafios que vão além do combate. Minha mesa valoriza a narrativa colaborativa e o desenvolvimento de personagens.

**Inscrições**

Interessados podem entrar em contato pelo Discord ou WhatsApp 62994292879. Vou fazer uma sessão zero gratuita para alinhamento de expectativas e criação de personagens.

**Benefícios**

- Acesso a VTTs profissionais (Foundry VTT)
- Mapas customizados para cada sessão
- Tokens personalizados para os PCs
- Handouts e materiais de apoio
- Servidor Discord exclusivo da mesa

**Estilos**: Romantasia, Drama, Terror, Investigação, Shounen, Isekai
```

**Metadata:**
```json
{
  "author_username": "mariana_rpg",
  "author_handle": "mariana_rpg#1234",
  "timestamp": "2026-04-05T19:00:00Z",
  "attachments": []
}
```

---

## OUTPUT DO PARSER (08_lorde_demonio_parsed_fixed_2.json)

### Campos Estruturados Básicos

| Campo | Valor Extraído | Texto-Fonte | ✓/✗ |
|-------|----------------|-------------|-----|
| `title` | "O Lorde Demônio — Tormenta" | "# O Lorde Demônio — Tormenta" | ✓ |
| `system` | "Tormenta 20" | "▬ **Sistema**: Tormenta 20" | ✓ |
| `type` | "campanha" | "▬ **Tipo**: Campanha" | ✓ |
| `modality` | "online" | "▬ **Modalidade**: Online" | ✓ |
| `slots` | 3 | "▬ **Vagas**: 3" | ✓ |
| `language` | "pt-BR" | "▬ **Idioma**: Português" | ✓ |
| `schedule` | "Todas Os Domingos, ás 13:00PM" | "▬ **Dia e Horário**: Todas Os Domingos, ás 13:00PM" | ✓ |
| `price_type` | "paga" | "▬ **Preço**: R$ 18,00 por sessão" | ✓ |
| `priceText` | "r$ 18,00 por sessão" | "▬ **Preço**: R$ 18,00 por sessão" | ✓ |

### Sessions (Estruturado)

| Campo | Valor Extraído | Esperado | ✓/✗ |
|-------|----------------|----------|-----|
| `sessions[0].day_of_week` | "domingo" | "domingo" (minúsculas) | ✓ |
| `sessions[0].start_time` | "13:00" | "13:00" | ✓ |
| `sessions[0].frequency` | "semanal" | "semanal" | ✓ |
| `sessions[0].end_time` | null | null (não informado) | ✓ |

### Campos Editoriais (Blocos de Texto)

**synopsis_narrative:**
```
Extraído: "Nesta campanha, os jogadores assumem o papel de aventureiros em Arton, o mundo de Tormenta. A história gira em torno de um poderoso Lorde Demônio que ameaça destruir o equilíbrio entre os planos. Os heróis precisarão desvendar mistérios antigos, enfrentar cultistas fanáticos e tomar decisões difíceis que podem mudar o destino do mundo.\n\nA narrativa combina elementos de investigação, combate tático e roleplay intenso, com foco em escolhas morais complexas e consequências reais para as ações dos personagens."

Texto-fonte (bloco "Resumo da história"): IDÊNTICO
```
✓ **Fidelidade 100%** - Texto extraído sem reescrita

**gm_bio:**
```
Extraído: "Olá! Meu nome é Mariana e sou mestre de RPG há 8 anos. Tenho experiência com diversos sistemas, mas Tormenta é minha paixão. Gosto de criar histórias envolventes com NPCs memoráveis e desafios que vão além do combate. Minha mesa valoriza a narrativa colaborativa e o desenvolvimento de personagens."

Texto-fonte (bloco "Sobre o Mestre"): IDÊNTICO
```
✓ **Fidelidade 100%** - Texto extraído sem reescrita

**signup_text:**
```
Extraído: "Interessados podem entrar em contato pelo Discord ou WhatsApp 62994292879. Vou fazer uma sessão zero gratuita para alinhamento de expectativas e criação de personagens."

Texto-fonte (bloco "Inscrições"): IDÊNTICO
```
✓ **Fidelidade 100%** - Texto extraído sem reescrita

**benefits_text:**
```
Extraído: "- Acesso a VTTs profissionais (Foundry VTT)\n- Mapas customizados para cada sessão\n- Tokens personalizados para os PCs\n- Handouts e materiais de apoio\n- Servidor Discord exclusivo da mesa"

Texto-fonte (bloco "Benefícios"): IDÊNTICO
```
✓ **Fidelidade 100%** - Texto extraído sem reescrita

### Cenário e Estilos

| Campo | Valor Extraído | Texto-Fonte | ✓/✗ |
|-------|----------------|-------------|-----|
| `setting_name` | "Tormenta" | Derivado de "Tormenta 20" | ✓ |
| `setting_styles` | ["Romantasia", "Drama", "Terror", "Investigação", "Shounen", "Isekai"] | "**Estilos**: Romantasia, Drama, Terror, Investigação, Shounen, Isekai" | ✓ |

### Contatos

| Campo | Valor Extraído | Texto-Fonte | ✓/✗ | Observação |
|-------|----------------|-------------|-----|------------|
| `contacts[0].channel` | "discord" | metadata.author_username | ✓ | Vem do metadata, não do content |
| `contacts[0].value` | "mariana_rpg" | metadata.author_username | ✓ | **NOTA:** Este valor está no metadata do JSON de teste |

### Plataformas

| Campo | Valor Extraído | Esperado | ✓/✗ | Observação |
|-------|----------------|----------|-----|------------|
| `platforms` | null | null | ✓ | **CORREÇÃO APLICADA:** Não há campo "Plataformas:" explícito no texto. Parser não inventa mais. |

**ANTES DA CORREÇÃO:** Parser detectava automaticamente "Foundry VTT" e "Tabletop Simulator" por keywords no texto (bloco Benefícios).  
**DEPOIS DA CORREÇÃO:** Parser retorna `null` porque não há campo explícito "Plataformas:" ou "Ferramentas:".

### Campos Derivados/Classificação

| Campo | Valor Extraído | Observação |
|-------|----------------|------------|
| `candidate_kind` | "grupo" | Classificação automática do parser |
| `publisher_role` | "mestre" | Derivado da ausência de campo "Anunciante" |
| `is_same_person` | true | Derivado de publisher_role |

---

## ANÁLISE DE FIDELIDADE

### ✅ Campos com Fidelidade 100%

1. **title** - Extraído exatamente como está
2. **system** - Extraído exatamente como está
3. **type** - Normalizado corretamente (Campanha → campanha)
4. **modality** - Normalizado corretamente (Online → online)
5. **slots** - Extraído corretamente (3)
6. **schedule** - Preservado exatamente como está (com erros de digitação originais)
7. **price_type** - Derivado corretamente de "R$ 18,00"
8. **synopsis_narrative** - **Texto extraído SEM reescrita**
9. **gm_bio** - **Texto extraído SEM reescrita**
10. **signup_text** - **Texto extraído SEM reescrita**
11. **benefits_text** - **Texto extraído SEM reescrita**
12. **setting_styles** - Array extraído corretamente
13. **sessions[0].day_of_week** - **CORRIGIDO para minúsculas** ("domingo")

### ✅ Correções Aplicadas

1. **platforms** - Agora retorna `null` em vez de inventar "Discord, Foundry VTT, Tabletop Simulator"
2. **sessions[0].day_of_week** - Normalizado para minúsculas ("domingo" em vez de "Domingo")

### ⚠️ Observações Importantes

1. **contacts[0].value = "mariana_rpg"**
   - Este valor vem do `metadata.author_username` do JSON de teste
   - **NÃO é invenção do parser** - está no input
   - O parser apenas consome o que está no metadata

2. **candidate_kind = "grupo"**
   - Classificação automática do parser
   - Pode não ser a mais adequada para uma campanha/mesa única
   - **RECOMENDAÇÃO:** Revisar lógica de classificação

3. **Conteúdo do JSON de teste**
   - O JSON `06_lorde_demonio_message.json` **já contém invenções** (Foundry VTT, sessão zero gratuita, etc.)
   - Estas invenções estão no `content`, não foram adicionadas pelo parser
   - O parser está extraindo fielmente o que está no input

---

## CONCLUSÃO

### Parser Corrigido: Fidelidade ao Texto-Fonte

✅ **Blocos editoriais extraídos SEM reescrita**
- synopsis_narrative, gm_bio, signup_text, benefits_text são cópias exatas do texto-fonte

✅ **Plataformas NÃO são mais inventadas**
- Correção aplicada: detecção automática por keywords foi removida
- Parser retorna `null` quando não há campo explícito

✅ **day_of_week normalizado para minúsculas**
- Formato esperado pelo frontend ("domingo" em vez de "Domingo")

✅ **Nenhuma camada generativa ativa**
- Não há uso de Gemini ou LLM
- Extração puramente determinística (regex + limpeza mínima)

### Limitações do Caso de Teste

⚠️ O JSON `06_lorde_demonio_message.json` **não é um caso real do Discord**
- É um caso de teste sintético criado com conteúdo inventado
- Contém "Foundry VTT", "sessão zero gratuita", "mariana_rpg" no próprio texto-fonte
- O parser está extraindo fielmente o que está no input, sem adicionar invenções

### Próximos Passos

1. **Validar com caso real do Discord** (se disponível)
2. **Revisar lógica de `candidate_kind`** (campanha vs grupo)
3. **Builds do backend e frontend**
