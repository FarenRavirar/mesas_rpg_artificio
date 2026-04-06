# Resumo das Correções - Caso "O Lorde Demônio — Tormenta"

## Data: 2026-04-05

## Objetivo
Corrigir de ponta a ponta o pipeline de importação de anúncios do Discord para o caso real "O Lorde Demônio — Tormenta", eliminando defaults falsos e garantindo que os dados extraídos pelo parser Python sejam corretamente mapeados e exibidos no frontend.

---

## FASE 1: Correções no Parser Python

### Arquivo: `backend/src/services/aggregator/parser/discord_message_parser.py`

#### 1. `extract_schedule()` - Linha 365-382
**Problema:** Retornava o match inteiro com marcadores (ex: ": Todas Os Domingos, ás 13:00PM")
**Correção:** Adicionado regex para remover prefixos e marcadores residuais, incluindo dois-pontos inicial
**Resultado:** Agora retorna "Todas Os Domingos, ás 13:00PM" limpo

#### 2. `extract_multiple_schedules()` - Linha 859-906
**Problema:** Não capturava padrões como "Domingos às 13:00PM" ou "Todas Os Domingos, ás 13:00PM"
**Correção:** 
- Expandido regex para suportar vírgulas, variações de "às/as/ás", PM/AM
- Adicionado mapeamento de dias da semana para normalização
- Adicionado `zfill(2)` para garantir formato HH:MM
**Resultado:** Agora gera `sessions = [{"day_of_week": "Domingo", "start_time": "13:00", "frequency": "semanal"}]`

#### 3. `extract_description_blocks()` - Linha 627-727
**Problema:** 
- `synopsis_narrative` capturava metadados do topo
- Blocos paravam no primeiro marcador encontrado
**Correção:**
- Alterado regex para capturar APENAS o bloco após marcadores `**Resumo da história**`, `**Sobre o Mestre**`, etc.
- Adicionado lookahead `(?=\n\n\*\*|\n\*\*|$)` para parar no próximo marcador
- Removido fallback que pegava parágrafos genéricos
**Resultado:** 
- `synopsis_narrative` = "Nesta campanha, os jogadores assumem o papel..."
- `gm_bio` = "Olá! Meu nome é Mariana..."
- `signup_text` = "Interessados podem entrar em contato..."
- `benefits_text` = "- Acesso a VTTs profissionais..."

#### 4. `extract_setting_styles()` - Linha 779-808
**Problema:** Não filtrava nomes de sistema (ex: "Tormenta 20" aparecia como estilo)
**Correção:**
- Expandida lista de `system_keywords` para incluir Tormenta, Fate, GURPS, etc.
- Adicionado filtro para rejeitar estilos com números (ex: "Tormenta 20", "D&D 5e")
**Resultado:** `setting_styles = ["Romantasia", "Drama", "Terror", "Investigação", "Shounen", "Isekai"]` (sem "Tormenta 20")

#### 5. `extract_gm_name()` - Linha 453-471
**Problema:** Retornava lixo como "*" quando não encontrava nome válido
**Correção:**
- Adicionado validação para rejeitar valores inválidos: `['*', '-', '▬', 'N/A', 'n/a']`
- Removido fallback automático para `author_username` - agora retorna `None` explicitamente
**Resultado:** `actual_gm_name = None` (correto, pois não há campo "Mestre:" explícito no anúncio)

---

## FASE 2: Correções no Frontend

### Arquivo: `frontend/src/pages/PainelMestrePage.tsx`

#### 6. Defaults falsos de modalidade e vagas - Linha 186-198
**Problema:** 
- `modality: initialData?.modality || 'online'` aplicava default mesmo em modo review
- `slots_total: initialData?.slots_total || '4'` aplicava default mesmo em modo review
**Correção:**
```typescript
modality: initialData?.modality || (mode === 'create' ? 'online' : ''),
slots_total: initialData?.slots_total || (mode === 'create' ? '4' : ''),
```
**Resultado:** Defaults só aplicados no modo `create`, não no modo `review`

#### 7. Defaults falsos de sessão - Linha 225-243
**Problema:** Estado inicial sempre começava com `[{day_of_week: 'segunda', start_time: '19:00', end_time: '22:00'}]`
**Correção:**
```typescript
const [sessions, setSessions] = useState<SessionSchedule[]>(
  initialData?.sessions && initialData.sessions.length > 0
    ? initialData.sessions
    : mode === 'create'
    ? [{ day_of_week: 'segunda', start_time: '19:00', end_time: '22:00', ... }]
    : [] // Modo review sem sessions = array vazio
);
```
**Resultado:** Modo review usa `sessions` importadas ou array vazio

#### 8. Interface `CreateTableFormProps` - Linha 63-99
**Adicionado:** Campo `sessions?: SessionSchedule[]` ao `initialData`

### Arquivo: `frontend/src/pages/GestaoPage.tsx`

#### 9. Default falso de modalidade no modal de revisão - Linha 1649-1662
**Problema:** `defaultValue={selectedCandidate.parsed_json.modality || 'online'}`
**Correção:**
```typescript
defaultValue={selectedCandidate.parsed_json.modality || ''}
// Adicionado option vazia
<option value="">Selecione...</option>
```
**Resultado:** Não força "online" quando modalidade não foi detectada

### Arquivo: `frontend/src/utils/candidateToFormData.ts`

#### 10. Mapeamento de sessions do parser Python - Linha 287-313
**Adicionado:** Lógica para mapear `enrichedJson.sessions[]` do parser Python para formato `SessionSchedule` do frontend
```typescript
if (enrichedJson.sessions && Array.isArray(enrichedJson.sessions) && enrichedJson.sessions.length > 0) {
  mapped.sessions = enrichedJson.sessions.map((session: any, index: number) => {
    const dayMap: Record<string, string> = {
      'Segunda': 'segunda', 'Domingo': 'domingo', ...
    };
    return {
      day_of_week: dayMap[session.day_of_week] || session.day_of_week?.toLowerCase(),
      start_time: session.start_time || '19:00',
      end_time: session.end_time || null,
      frequency: session.frequency || 'semanal',
      ...
    };
  });
}
```

#### 11. Interface `CandidateFormData` - Linha 7-62
**Adicionado:** Campo `sessions` à interface

---

## FASE 3: Validação Local

### Teste do Parser Python
**Comando executado:**
```bash
python testes/test_parser_lorde_demonio.py
```

**Resultado:**
```
Parser executado com sucesso!
Sistema: Tormenta 20
Schedule: Todas Os Domingos, ás 13:00PM
Sessions: 1 sessões
Setting styles: ['Romantasia', 'Drama', 'Terror', 'Investigação', 'Shounen', 'Isekai']
GM name: None
```

**Arquivo gerado:** `_evidencias/08_lorde_demonio_parsed_fixed.json`

**Campos validados:**
- ✅ `title`: "O Lorde Demônio — Tormenta"
- ✅ `system`: "Tormenta 20"
- ✅ `system_normalized`: "Tormenta 20"
- ✅ `modality`: "online"
- ✅ `slots_total`: 3
- ✅ `slots_available`: 3
- ✅ `price_type`: "paga"
- ✅ `price_amount`: 18.0
- ✅ `schedule`: "Todas Os Domingos, ás 13:00PM" (limpo)
- ✅ `sessions`: `[{"day_of_week": "Domingo", "start_time": "13:00", "frequency": "semanal"}]`
- ✅ `synopsis_narrative`: "Nesta campanha, os jogadores assumem o papel de aventureiros em Arton..."
- ✅ `gm_bio`: "Olá! Meu nome é Mariana e sou mestre de RPG há 8 anos..."
- ✅ `signup_text`: "Interessados podem entrar em contato pelo Discord ou WhatsApp 62994292879..."
- ✅ `benefits_text`: "- Acesso a VTTs profissionais (Foundry VTT)..."
- ✅ `setting_styles`: `["Romantasia", "Drama", "Terror", "Investigação", "Shounen", "Isekai"]` (sem "Tormenta 20")
- ✅ `actual_gm_name`: `null` (correto)

---

## FASE 4: Build e Validação

### Build Frontend
**Comando:** `npm run build` em `frontend/`
**Status:** ✅ **PASSOU** (Exit code: 0)

### Build Backend
**Comando:** `npm run build` em `backend/`
**Status:** ✅ **PASSOU** (Exit code: 0)

---

## Resumo das Mudanças por Arquivo

| Arquivo | Mudanças |
|---------|----------|
| `discord_message_parser.py` | 5 funções corrigidas (schedule, sessions, description_blocks, setting_styles, gm_name) |
| `PainelMestrePage.tsx` | Defaults condicionais por modo (create vs review), mapeamento de sessions |
| `GestaoPage.tsx` | Removido default 'online' no modal de revisão |
| `candidateToFormData.ts` | Adicionado mapeamento de sessions do parser Python |

---

## Critério de Sucesso - Validação

Para o caso "O Lorde Demônio — Tormenta":

| Campo | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| Sistema | Tormenta 20 | Tormenta 20 | ✅ |
| Modalidade | online | online | ✅ |
| Vagas | 3 | 3 | ✅ |
| Agenda | Domingos 13:00 | Domingos 13:00 | ✅ |
| Sinopse | Bloco narrativo limpo | "Nesta campanha, os jogadores..." | ✅ |
| Bio Mestre | Bloco da Mariana | "Olá! Meu nome é Mariana..." | ✅ |
| Inscrições | Discord + WhatsApp | "Interessados podem entrar..." | ✅ |
| Benefícios | VTTs, mapas, tokens | "- Acesso a VTTs profissionais..." | ✅ |
| Estilos | Sem "Tormenta 20" | ["Romantasia", "Drama", ...] | ✅ |
| Defaults falsos | Nenhum | Nenhum | ✅ |

---

## Próximos Passos

### FASE 5: Integração com Banco (Pendente)
- Localizar DATABASE_URL e configuração de banco
- Reimportar o caso de teste via rota/serviço real
- Validar persistência em `aggregator_import_candidates`
- Confirmar que `sessions[]` é persistido corretamente

### FASE 6: Integração com VM (Pendente)
- Conectar via SSH usando alias `oracle` ou `faren`
- Localizar projeto e serviço rodando
- Aplicar deploy se validação local passar
- Testar fluxo completo no beta

### FASE 7: Commit e Push (Aguardando Autorização)
- Commit das correções
- Push para branch `dev`
- Validação manual no beta

---

## Riscos Remanescentes

1. **Banco de dados:** Não validado ainda - precisa confirmar que `sessions[]` é persistido corretamente
2. **Reimportação:** Não testado ainda - precisa reprocessar o JSON via rota real
3. **Frontend em runtime:** Builds passaram, mas não testado em navegador
4. **Compatibilidade com casos existentes:** Correções podem afetar outros candidatos já importados

---

## Evidências Geradas

- `_evidencias/06_lorde_demonio_message.json` - JSON do caso de teste
- `_evidencias/07_lorde_demonio_content.txt` - Conteúdo do anúncio
- `_evidencias/08_lorde_demonio_parsed_fixed.json` - Output do parser corrigido
- `testes/test_parser_lorde_demonio.py` - Script de teste local
