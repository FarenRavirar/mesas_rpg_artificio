# REQ-20 u2014 Integrau00e7u00e3o de Mu00eddia, Covil do Lich e Retenu00e7u00e3o

Implementar as Fases 2.A a 2.H conforme plano documentado em `sessoes/resumo_05-04_3_parsing_inteligente.md`.
Este plano completa a integrau00e7u00e3o do parser Python (ju00e1 implementado) com o restante do sistema: persistu00eancia dos novos campos, previews visuais, badge de Covil do Lich e configurau00e7u00e3o de retenu00e7u00e3o.

---

## Estado Atual (verificado)

**Ju00e1 implementado (sessu00e3o anterior `a4dc87f`):**
- Parser Python extrai `banner_url` (de `attachments`) e `avatar_url` (de `author`)
- `candidateToFormData.ts` prioriza `enrichedFields` do parser
- Funu00e7u00e3o `isCovil()` existe (linha 346) mas **nu00e3o u00e9 chamada**
- `CreateTableForm` tem campo `bannerUrl` e bloco DDAL (referu00eancia para Covil)

**Lacunas identificadas (verificadas no cu00f3digo):**
- `CandidateFormData` nu00e3o tem `gm_avatar_url?` nem `is_covil?`
- `enrichedFields.banner_url` nu00e3o u00e9 lido como prioridade 1 (apenas `attachments` como fallback)
- `enrichedFields.avatar_url` nu00e3o u00e9 mapeado para `gm_avatar_url`
- `isCovil()` nu00e3o u00e9 chamada em `mapCandidateToFormData()`
- `TablesTable` (types.ts) nu00e3o tem `is_covil` nem `imported_expires_at`
- `candidateService.ts` nu00e3o passa `is_covil` nem `imported_expires_at` no INSERT
- `GestaoPage.tsx`: sem badge "Covil do Lich" nos cards
- `AdminDevToolsPage.tsx`: `sanitizeDiscordExporterJson()` retorna `string`, sem feedback visual
- `CreateTableFormProps.initialData` nu00e3o inclui `gm_avatar_url`, `is_covil`, `banner_url`, etc.

---

## Decisu00f5es Arquiteturais (inegociu00e1veis)

| Decisu00e3o | Escolha | Motivo |
|---|---|---|
| `gm_avatar_url` no banco | **Nu00c3O** | URL externa Discord; nu00e3o sobe para Imgur; apenas visual |
| `is_covil` no banco | **SIM** | Boolean persistido, similar a `is_ddal` |
| `imported_expires_at` no banco | **SIM** | Controla expirau00e7u00e3o, calculado no aceite |
| Padru00e3o de expirau00e7u00e3o (fase inicial) | **30 dias fixo** | API de configurau00e7u00e3o seru00e1 integrada em fase posterior |
| Configurau00e7u00e3o de retenu00e7u00e3o no AdminDevTools | **localStorage por ora** | Campo visual; integrau00e7u00e3o com `aggregator_settings` no backlog |

---

## Proposed Changes

### Fase 2.A u2014 Banco de Dados

---

#### [NEW] database/migration_10_covil_and_expiration.sql

```sql
-- Migration 10: is_covil e imported_expires_at
ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_covil BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS imported_expires_at TIMESTAMPTZ;
COMMENT ON COLUMN tables.is_covil IS 'Mesa vinculada ao Covil do Lich u2014 detectado automaticamente pelo parser Python, editu00e1vel pelo admin';
COMMENT ON COLUMN tables.imported_expires_at IS 'Data de expirau00e7u00e3o configuru00e1vel para mesas importadas via JSON do Discord u2014 polu00edtica gerenciada pelo AdminDevTools';
```

---

### Fase 2.B u2014 Backend

---

#### [MODIFY] backend/src/db/types.ts

Adicionar os dois campos u00e0 interface `TablesTable`:
```ts
  is_covil: Generated<boolean>;        // apu00f3s is_ddal
  imported_expires_at: Date | null;    // apu00f3s is_covil
```

#### [MODIFY] backend/src/services/aggregator/candidateService.ts

No mu00e9todo `accept()`, no INSERT da tabela `tables`:
1. Ler `parsedJson.is_covil` (boolean, default `false`)
2. Calcular `imported_expires_at` = `new Date(Date.now() + 30 * 24 * 3600 * 1000)`
3. Incluir ambos no `.values({...})`
4. Incluir `'is_covil', 'imported_expires_at'` no `.returning([...])`

> **Regra pu00e9trea:** `gm_avatar_url` **Nu00c3O** entra no INSERT.

---

### Fase 2.C u2014 Frontend: candidateToFormData.ts

---

#### [MODIFY] frontend/src/utils/candidateToFormData.ts

Quatro mudanu00e7as mu00ednimas e precisas:

1. **Interface `CandidateFormData`**: adicionar apu00f3s `banner_url?`:
   ```ts
   gm_avatar_url?: string;   // URL do avatar do Discord (apenas visual, nu00e3o persiste)
   is_covil?: boolean;       // Detectado pelo parser, editu00e1vel pelo admin
   ```

2. **Bloco Banner URL** (linhas 247-254): ler `enrichedFields.banner_url` como **prioridade 0** antes do bloco de `imageUrl/banner/thumbnail`:
   ```ts
   // Banner URL (prioridade: enrichedFields.banner_url > imageUrl > banner > thumbnail)
   if (parsedContent.banner_url) {
     mapped.banner_url = parsedContent.banner_url;
   } else if (enrichedJson.imageUrl || enrichedJson.banner || ...)  {
     ...
   }
   ```

3. **Novo bloco gm_avatar_url**: apu00f3s o bloco de banner:
   ```ts
   // Avatar do mestre (apenas visual, nu00e3o persiste no banco)
   if (parsedContent.avatar_url) {
     mapped.gm_avatar_url = parsedContent.avatar_url;
   }
   ```

4. **Chamar `isCovil()`**: antes do `return mapped`:
   ```ts
   // Detecu00e7u00e3o automu00e1tica de Covil do Lich
   mapped.is_covil = isCovil(parsedContent);
   ```

---

### Fase 2.D u2014 Frontend: CreateTableForm (PainelMestrePage.tsx)

---

#### [MODIFY] frontend/src/pages/PainelMestrePage.tsx

O arquivo tem 1135 linhas. As mudanu00e7as su00e3o mu00ednimas e precisas:

**1. Expandir `CreateTableFormProps.initialData`** (linhas 59-69) para incluir os novos campos:
```ts
initialData?: {
  ...
  banner_url?: string;        // ju00e1 existe como bannerUrl no estado mas falta no initialData
  gm_avatar_url?: string;     // novo u2014 apenas visual
  is_covil?: boolean;         // novo
  system_id?: string;         // ju00e1 existia como selectedSystemId
  contacts?: ...;             // ju00e1 existia
  frequency?: string;         // ju00e1 existia
  frequency_custom?: string;  // ju00e1 existia
  rules_notes?: string;       // ju00e1 existia
  starts_at?: string;         // ju00e1 existia
}
```

**2. Estado do formulu00e1rio** u2014 carregar `initialData.banner_url` em `bannerUrl`:
```ts
const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
const [gmAvatarUrl] = useState(initialData?.gm_avatar_url || '');  // readonly
const [isCovil, setIsCovil] = useState(initialData?.is_covil ?? false); // novo estado
```

**3. Preview de banner** (apu00f3s o `InputField` de `banner_url`, linha 631):
```tsx
{bannerUrl && (
  <div className="mt-2">
    <img src={bannerUrl} alt="Preview do banner" className="w-full max-h-48 object-cover rounded-xl border border-white/10" onError={...} />
  </div>
)}
```

**4. Avatar do mestre** (somente em `mode=review`):
```tsx
{mode === 'review' && gmAvatarUrl && (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
    <img src={gmAvatarUrl} alt="Avatar do mestre" className="w-12 h-12 rounded-full object-cover border border-white/20" />
    <p className="text-sm text-white/60">Avatar do mestre (importado do Discord, nu00e3o salvo no banco)</p>
  </div>
)}
```

**5. Bloco Covil do Lich** (apu00f3s o bloco DDAL, linha 761):
```tsx
{mode === 'review' && (
  <section className="rounded-2xl border border-orange-500/30 bg-orange-900/10 p-5 space-y-3" id="painel-mestre-covil-block">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-orange-200 flex items-center gap-2">
          ud83cudff0 Mesa do Covil do Lich
        </p>
        <p className="text-xs text-orange-100/70 mt-1">Detectado automaticamente pelo parser. Pode ser editado.</p>
      </div>
      <label htmlFor="covil-toggle" className="inline-flex items-center gap-2 text-sm text-orange-100">
        <input id="covil-toggle" type="checkbox" checked={isCovil} onChange={(e) => setIsCovil(e.target.checked)} className="h-4 w-4" />
        u00c9 Covil do Lich
      </label>
    </div>
  </section>
)}
```

**6. Payload de submit** u2014 adicionar `is_covil` e garantir que `gm_avatar_url` Nu00c3O entra:
```ts
const payload = {
  ...form,
  ...
  is_covil: mode === 'review' ? isCovil : false,
  // gm_avatar_url Nu00c3O estu00e1 aqui u2014 apenas visual
};
```

---

### Fase 2.E u2014 Frontend: GestaoPage.tsx (badge Covil)

---

#### [MODIFY] frontend/src/pages/GestaoPage.tsx

Duas adiu00e7u00f5es mu00ednimas:

**1. Badge no card** (apu00f3s o tu00edtulo, linha ~576):
```tsx
const formData = mapCandidateToFormData(candidate.parsed_json);
// ...
{formData.is_covil && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-900/40 text-orange-300 border border-orange-500/30">
    ud83cudff0 Covil do Lich
  </span>
)}
```

**2. Badge no modal de revisu00e3o** (apu00f3s o tu00edtulo, linha ~657):
```tsx
{mapCandidateToFormData(selectedCandidate.parsed_json).is_covil && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-900/40 text-orange-300 border border-orange-500/30">
    ud83cudff0 Covil do Lich
  </span>
)}
```

---

### Fase 2.F u2014 Frontend: AdminDevToolsPage.tsx

---

#### [MODIFY] frontend/src/pages/AdminDevToolsPage.tsx

Tru00eas melhorias:

**1. `sanitizeDiscordExporterJson()` com retorno rico:**
```ts
const sanitizeDiscordExporterJson = (rawJson: string): { json: string; wasRepaired: boolean; repairFailed: boolean } => {
  try {
    JSON.parse(rawJson); // Ju00e1 u00e9 vu00e1lido
    return { json: rawJson, wasRepaired: false, repairFailed: false };
  } catch {
    try {
      const repaired = jsonrepair(rawJson);
      return { json: repaired, wasRepaired: true, repairFailed: false };
    } catch {
      return { json: rawJson, wasRepaired: false, repairFailed: true };
    }
  }
};
```

**2. Novos estados e banners:**
```ts
const [jsonWasRepaired, setJsonWasRepaired] = useState(false);
const [jsonRepairFailed, setJsonRepairFailed] = useState(false);
const [repairBannerDismissed, setRepairBannerDismissed] = useState(false);
```

Banners visuais no JSX:
- Amarelo (`wasRepaired=true`): `u26a0ufe0f JSON corrompido detectado e corrigido automaticamente...` + botu00e3o "Entendi"
- Vermelho (`repairFailed=true`): `u274c Nu00e3o foi possu00edvel corrigir o JSON...`

**3. Barra de progresso durante upload:**
```ts
const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
```
No loop de chunks: `setImportProgress({ current: index + 1, total: payloadChunks.length })`

**4. Seu00e7u00e3o "Retenu00e7u00e3o de Mesas Importadas"** (nova seu00e7u00e3o ao final):
- Campo numu00e9rico "Dias atu00e9 expirau00e7u00e3o" (salvo em localStorage)
- Aviso de irreversibilidade
- Double-confirm ao reduzir prazo
- Nota sobre limitau00e7u00e3o H3 (aceite irreversu00edvel)

---

## Ordem de Execuu00e7u00e3o

1. `database/migration_10_covil_and_expiration.sql` (CRIAR)
2. `backend/src/db/types.ts` (MODIFICAR u2014 2 linhas)
3. `backend/src/services/aggregator/candidateService.ts` (MODIFICAR u2014 bloco de INSERT)
4. `frontend/src/utils/candidateToFormData.ts` (MODIFICAR u2014 4 blocos precisos)
5. `frontend/src/pages/PainelMestrePage.tsx` (MODIFICAR u2014 interface + estado + JSX)
6. `frontend/src/pages/GestaoPage.tsx` (MODIFICAR u2014 badge Covil em 2 lugares)
7. `frontend/src/pages/AdminDevToolsPage.tsx` (MODIFICAR u2014 sanitize + banners + progress + retenu00e7u00e3o)
8. Verificar build: `npm run build` no frontend
9. Atualizar documentau00e7u00e3o (FILA, RESUMO, AMBIENTE, TODO)

---

## User Review Required

> [!IMPORTANT]
> **Confirmar antes de aprovar:**
> O plano propu00f5e que `is_covil` seja passado no payload de submit do `CreateTableForm` para a rota `POST /api/v1/gm/tables`. Essa rota estu00e1 em `gmPanel.ts`. u00c9 necessu00e1rio verificar se ela ju00e1 aceita `is_covil` ou se precisaru00e1 de ajuste tambu00e9m. **Isso seru00e1 verificado no inu00edcio da execuu00e7u00e3o (Fase 2.B).**

> [!NOTE]
> A configurau00e7u00e3o de retenu00e7u00e3o no AdminDevTools seru00e1 salva em `localStorage` nesta fase. O `imported_expires_at` continuaru00e1 sendo calculado com 30 dias fixo no backend atu00e9 que a integrau00e7u00e3o com a API `aggregator_settings` seja feita (backlog).

> [!NOTE]
> Nenhum `git commit` ou `git push` seru00e1 feito sem autorizau00e7u00e3o explu00edcita. Todas as alterau00e7u00f5es ficam locais atu00e9 aprovau00e7u00e3o.

---

## Verification Plan

### Build automu00e1tico
```powershell
npm run build  # no diretu00f3rio frontend
# Esperado: exit 0, sem erros TypeScript
```

### Validau00e7u00e3o de banco (apu00f3s apply manual autorizado)
```bash
docker exec mesas-beta-db psql -U admin -d mesas_rpg -t -c \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tables' AND column_name IN ('is_covil','imported_expires_at');"
# Esperado: 2 linhas
```

### Validau00e7u00e3o visual (apu00f3s deploy autorizado)
- Candidato com "Covil" no tu00edtulo u2192 badge u2705
- Preview de banner no modal de revisu00e3o u2192 imagem visu00edvel u2705
- Upload de JSON truncado u2192 banner amarelo u2705
- `gm_avatar_url` ausente no payload (Network DevTools) u2705
