# RESUMO FINAL: Correção do Parser - Fidelidade ao Texto-Fonte

**Data:** 2026-04-05  
**Caso:** O Lorde Demônio — Tormenta  
**Objetivo:** Remover invenções do parser e garantir extração fiel ao texto-fonte

---

## 1. ARQUIVOS ALTERADOS

### Backend - Parser Python

**Arquivo:** `backend/src/services/aggregator/parser/discord_message_parser.py`

| Linha | Função | Alteração |
|-------|--------|-----------|
| 556-569 | `extract_platforms()` | Removida detecção automática de plataformas por keywords. Agora extrai APENAS de campo explícito "Plataformas:" ou "Ferramentas:". |
| 915-926 | `extract_multiple_schedules()` | Normalizado `day_of_week` para minúsculas ("domingo" em vez de "Domingo"). |

---

## 2. DIFF EXATO POR ARQUIVO

### discord_message_parser.py - Correção 1: extract_platforms

```diff
 def extract_platforms(content: str) -> Optional[str]:
-    """Extrai plataformas de jogo (Discord, Roll20, Foundry, etc.)."""
+    """Extrai plataformas de jogo APENAS de campo explícito (sem detecção automática)."""
     patterns = [
         r'(?:plataformas?|ferramentas?):\s*(.+?)(?:\n|$)',
     ]
     
     for pattern in patterns:
         match = re.search(pattern, content, re.IGNORECASE)
         if match:
             platforms = match.group(1).strip()
             platforms = re.sub(r'\*\*|\*|__', '', platforms)
             return platforms if platforms else None
     
-    # Detectar plataformas comuns no texto
-    detected = []
-    content_lower = content.lower()
-    
-    platform_keywords = {
-        'Discord': ['discord'],
-        'Roll20': ['roll20', 'roll 20'],
-        'Foundry VTT': ['foundry', 'foundry vtt'],
-        'Owlbear': ['owlbear'],
-        'Alchemy': ['alchemy'],
-        'Astral': ['astral'],
-        'Fantasy Grounds': ['fantasy grounds'],
-        'Tabletop Simulator': ['tabletop simulator', 'tts'],
-    }
-    
-    for platform, keywords in platform_keywords.items():
-        if any(keyword in content_lower for keyword in keywords):
-            detected.append(platform)
-    
-    return ', '.join(detected) if detected else None
+    # CORREÇÃO: Não detectar plataformas automaticamente - retornar None se não houver campo explícito
+    return None
```

### discord_message_parser.py - Correção 2: extract_multiple_schedules

```diff
-        # Normalizar dia da semana
+        # Normalizar dia da semana para minúsculas (formato esperado pelo frontend)
         day_map = {
-            'segunda': 'Segunda',
-            'terça': 'Terça',
-            'quarta': 'Quarta',
-            'quinta': 'Quinta',
-            'sexta': 'Sexta',
-            'sábado': 'Sábado',
-            'sabado': 'Sábado',
-            'domingo': 'Domingo'
+            'segunda': 'segunda',
+            'terça': 'terça',
+            'quarta': 'quarta',
+            'quinta': 'quinta',
+            'sexta': 'sexta',
+            'sábado': 'sábado',
+            'sabado': 'sábado',
+            'domingo': 'domingo'
         }
-        day = day_map.get(day_raw, day_raw.capitalize())
+        day = day_map.get(day_raw, day_raw.lower())
```

---

## 3. COMANDO DE VALIDAÇÃO DO PARSER

```bash
# Executar parser no caso de teste
python testes/generate_fixed_json.py

# Output esperado:
# Parser executado com sucesso!
# Arquivo salvo: _evidencias/08_lorde_demonio_parsed_fixed_2.json
# 
# Campos extraídos:
#   Sistema: Tormenta 20
#   Schedule: Todas Os Domingos, ás 13:00PM
#   Sessions: 1 sessões
#     - day_of_week: domingo
#     - start_time: 13:00
#   Platforms: None
#   Setting styles: ['Romantasia', 'Drama', 'Terror', 'Investigação', 'Shounen', 'Isekai']
#   GM name: None
#   Contacts: 1 contatos
```

**Status:** ✅ Executado com sucesso

---

## 4. OUTPUT NOVO DO PARSER

**Arquivo gerado:** `_evidencias/08_lorde_demonio_parsed_fixed_2.json`

### Campos Críticos Validados

| Campo | Valor | Fidelidade |
|-------|-------|------------|
| `title` | "O Lorde Demônio — Tormenta" | ✅ Exato |
| `system` | "Tormenta 20" | ✅ Exato |
| `schedule` | "Todas Os Domingos, ás 13:00PM" | ✅ Exato (preserva erros de digitação) |
| `slots` | 3 | ✅ Exato |
| `modality` | "online" | ✅ Normalizado corretamente |
| `sessions[0].day_of_week` | "domingo" | ✅ Minúsculas (corrigido) |
| `sessions[0].start_time` | "13:00" | ✅ Exato |
| `platforms` | null | ✅ Não inventa mais |
| `synopsis_narrative` | "Nesta campanha, os jogadores assumem..." | ✅ Texto exato do bloco |
| `gm_bio` | "Olá! Meu nome é Mariana..." | ✅ Texto exato do bloco |
| `signup_text` | "Interessados podem entrar em contato..." | ✅ Texto exato do bloco |
| `benefits_text` | "- Acesso a VTTs profissionais..." | ✅ Texto exato do bloco |
| `setting_styles` | ["Romantasia", "Drama", "Terror", "Investigação", "Shounen", "Isekai"] | ✅ Array exato |

---

## 5. COMPARAÇÃO OBJETIVA: TEXTO-FONTE vs OUTPUT

### Blocos Editoriais (Fidelidade 100%)

**synopsis_narrative:**
- **Texto-fonte:** "Nesta campanha, os jogadores assumem o papel de aventureiros em Arton, o mundo de Tormenta. A história gira em torno de um poderoso Lorde Demônio que ameaça destruir o equilíbrio entre os planos. Os heróis precisarão desvendar mistérios antigos, enfrentar cultistas fanáticos e tomar decisões difíceis que podem mudar o destino do mundo.\n\nA narrativa combina elementos de investigação, combate tático e roleplay intenso, com foco em escolhas morais complexas e consequências reais para as ações dos personagens."
- **Output parser:** IDÊNTICO (sem reescrita)
- **Fidelidade:** ✅ 100%

**gm_bio:**
- **Texto-fonte:** "Olá! Meu nome é Mariana e sou mestre de RPG há 8 anos. Tenho experiência com diversos sistemas, mas Tormenta é minha paixão. Gosto de criar histórias envolventes com NPCs memoráveis e desafios que vão além do combate. Minha mesa valoriza a narrativa colaborativa e o desenvolvimento de personagens."
- **Output parser:** IDÊNTICO (sem reescrita)
- **Fidelidade:** ✅ 100%

**signup_text:**
- **Texto-fonte:** "Interessados podem entrar em contato pelo Discord ou WhatsApp 62994292879. Vou fazer uma sessão zero gratuita para alinhamento de expectativas e criação de personagens."
- **Output parser:** IDÊNTICO (sem reescrita)
- **Fidelidade:** ✅ 100%

**benefits_text:**
- **Texto-fonte:** "- Acesso a VTTs profissionais (Foundry VTT)\n- Mapas customizados para cada sessão\n- Tokens personalizados para os PCs\n- Handouts e materiais de apoio\n- Servidor Discord exclusivo da mesa"
- **Output parser:** IDÊNTICO (sem reescrita)
- **Fidelidade:** ✅ 100%

### Plataformas (Correção Aplicada)

**ANTES:**
- Parser detectava automaticamente "Foundry VTT" e "Tabletop Simulator" por keywords no texto
- Output: `"platforms": "Discord, Foundry VTT, Tabletop Simulator"`
- **Problema:** Invenção - não há campo "Plataformas:" explícito

**DEPOIS:**
- Parser extrai APENAS de campo explícito "Plataformas:" ou "Ferramentas:"
- Output: `"platforms": null`
- **Correção:** ✅ Não inventa mais

### Sessions (Correção Aplicada)

**ANTES:**
- `day_of_week`: "Domingo" (capitalizado)
- **Problema:** Frontend espera minúsculas

**DEPOIS:**
- `day_of_week`: "domingo" (minúsculas)
- **Correção:** ✅ Formato correto

---

## 6. BUILDS EXECUTADOS E STATUS

### Backend

```bash
cd backend
npm run build
```

**Status:** ✅ Exit code 0 (sem erros)

### Frontend

```bash
cd frontend
npm run build
```

**Status:** ✅ Exit code 0 (sem erros)

---

## 7. RISCOS REMANESCENTES

### R01: Caso de Teste Sintético

**Descrição:** O JSON `06_lorde_demonio_message.json` **não é um caso real do Discord**. É um caso de teste sintético que já contém invenções no próprio texto-fonte (Foundry VTT, sessão zero gratuita, mariana_rpg).

**Impacto:** Não é possível validar se o parser inventa dados em casos reais do Discord, apenas se ele extrai fielmente o que está no input.

**Mitigação:** O parser foi corrigido para extrair fielmente qualquer input. Validação com caso real do Discord é recomendada.

### R02: Classificação candidate_kind

**Descrição:** Parser classifica este caso como `"candidate_kind": "grupo"`, mas é uma campanha/mesa única.

**Impacto:** Pode afetar fluxo de aprovação ou exibição no frontend.

**Mitigação:** Revisar lógica de classificação de `candidate_kind` no parser.

### R03: Contatos do Metadata

**Descrição:** O campo `contacts[0].value = "mariana_rpg"` vem do `metadata.author_username`, não do `content`.

**Impacto:** Se o metadata do Discord real não contiver username, o contato Discord ficará vazio.

**Mitigação:** Parser já trata fallback para `author_handle`. Validar com caso real do Discord.

---

## 8. EVIDÊNCIAS GERADAS

1. **`_evidencias/08_lorde_demonio_parsed_fixed_2.json`** - Output do parser corrigido
2. **`_evidencias/VALIDACAO_FIDELIDADE_PARSER.md`** - Comparação detalhada texto-fonte vs output
3. **`testes/generate_fixed_json.py`** - Script de validação do parser

---

## 9. CONCLUSÃO

### ✅ Correções Aplicadas

1. **Plataformas não são mais inventadas**
   - Detecção automática por keywords foi removida
   - Parser retorna `null` quando não há campo explícito

2. **day_of_week normalizado para minúsculas**
   - Formato esperado pelo frontend ("domingo" em vez de "Domingo")

3. **Blocos editoriais extraídos com fidelidade 100%**
   - synopsis_narrative, gm_bio, signup_text, benefits_text são cópias exatas do texto-fonte
   - Nenhuma reescrita, nenhuma invenção

### ✅ Validações Executadas

1. Parser executado no caso de teste ✅
2. JSON gerado e validado ✅
3. Comparação campo por campo com texto-fonte ✅
4. Build do backend ✅
5. Build do frontend ✅

### ⚠️ Limitações

1. Caso de teste é sintético (não é anúncio real do Discord)
2. `candidate_kind` pode precisar de revisão
3. Validação com caso real do Discord é recomendada

### 📊 Estatísticas

- **Arquivos alterados:** 1 (discord_message_parser.py)
- **Funções corrigidas:** 2 (extract_platforms, extract_multiple_schedules)
- **Linhas modificadas:** 30
- **Fidelidade dos blocos editoriais:** 100%
- **Builds:** 2/2 passaram ✅

---

## 10. PRÓXIMA AÇÃO

**Recomendação:** Validar parser com caso real do Discord (se disponível) para confirmar que não há invenções em cenário de produção.

**Status:** Parser corrigido e validado localmente. Pronto para deploy no beta.
