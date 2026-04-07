Tenho tudo. Agora o plano completo e preciso.

---

## Plano de Implementação: Admin Inline nos Steps

### Visão geral das mudanças por arquivo

| Arquivo | Tipo de mudança |
|---|---|
| `useVttPlatforms.ts` | Adicionar `refetch` ao retorno |
| `vttPlatforms.ts` (backend) | Adicionar bloco CRUD admin + aprovação de sugestões |
| `systems.ts` (backend) | Já tem CRUD admin — só adicionar aprovação de sugestões |
| `scenarios.ts` (backend) | Adicionar CRUD admin (não existe) |
| `settings.ts` (backend) | Adicionar CRUD admin |
| `AdminVttPanel.tsx` | Criar — componente inline para StepConfig |
| `AdminSystemPanel.tsx` | Criar — componente inline para StepSystem |
| `AdminScenarioPanel.tsx` | Criar — componente inline para StepSystem |
| `AdminSettingStylesPanel.tsx` | Criar — componente inline para StepFinal |
| `StepConfig.tsx` | Adicionar `userRole` + `token` nos props, injetar `AdminVttPanel` |
| `StepSystem.tsx` | Adicionar `userRole` + `token` nos props, injetar `AdminSystemPanel` + `AdminScenarioPanel` |
| `StepFinal.tsx` | Injetar `AdminSettingStylesPanel` (já tem `userRole`) |
| `CreateTableForm.tsx` | Passar `userRole={user?.role}` e `token={token}` para `StepConfig` e `StepSystem` |

---

### 1. `useVttPlatforms.ts` — adicionar `refetch`

```typescript
export function useVttPlatforms() {
  const [platforms, setPlatforms] = useState<VttPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatforms = async () => {         // extrair para função nomeada
    setLoading(true);
    try {
      const response = await fetch('/api/v1/vtt-platforms');
      if (!response.ok) throw new Error('Erro ao buscar plataformas VTT');
      const data = await response.json();
      setPlatforms(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlatforms(); }, []);

  return { platforms, loading, error, refetch: fetchPlatforms }; // refetch exposto
}
```

---

### 2. Backend — CRUD admin por arquivo

#### `vttPlatforms.ts` — adicionar no final do arquivo

```typescript
// POST /api/v1/vtt-platforms/admin
router.post('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, website_url, sort_order } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório.' });

  const slug = slugify(name); // mesma função de systems.ts

  try {
    const existing = await db.selectFrom('vtt_platforms').select('id')
      .where('slug', '=', slug).executeTakeFirst();
    if (existing) return res.status(409).json({ error: 'VTT com este slug já existe.' });

    const platform = await db.insertInto('vtt_platforms')
      .values({ name: name.trim(), slug, website_url: website_url || null,
                sort_order: sort_order ?? 0, is_active: true })
      .returning(['id', 'name', 'slug', 'website_url', 'sort_order', 'is_active'])
      .executeTakeFirst();

    return res.status(201).json({ data: platform });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar VTT.' });
  }
});

// PUT /api/v1/vtt-platforms/admin/:id
router.put('/admin/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, website_url, sort_order, is_active } = req.body;

  try {
    const updated = await db.updateTable('vtt_platforms')
      .set({ name: name?.trim(), website_url: website_url || null,
             sort_order: sort_order ?? 0, is_active: is_active ?? true,
             updated_at: new Date() })
      .where('id', '=', id)
      .returning(['id', 'name', 'slug', 'website_url', 'sort_order', 'is_active'])
      .executeTakeFirst();

    if (!updated) return res.status(404).json({ error: 'VTT não encontrada.' });
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar VTT.' });
  }
});

// DELETE /api/v1/vtt-platforms/admin/:id
router.delete('/admin/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const inUse = await db.selectFrom('tables').select('id')
      .where('vtt_platform_id', '=', id).limit(1).executeTakeFirst();
    if (inUse) return res.status(409).json({ error: 'VTT em uso por mesas existentes. Desative em vez de deletar.' });

    await db.deleteFrom('vtt_platforms').where('id', '=', id).execute();
    return res.json({ data: { message: 'VTT deletada.' } });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar VTT.' });
  }
});

// GET /api/v1/vtt-platforms/admin/suggestions
router.get('/admin/suggestions', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status = 'pending' } = req.query;
  try {
    const suggestions = await db.selectFrom('vtt_platform_suggestions as s')
      .leftJoin('users as u', 'u.id', 's.suggested_by_user_id')
      .select(['s.id', 's.suggested_name', 's.status', 's.created_at', 'u.email as suggested_by_email'])
      .where('s.status', '=', status as string)
      .orderBy('s.created_at', 'asc')
      .execute();
    return res.json({ data: suggestions });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar sugestões.' });
  }
});

// PATCH /api/v1/vtt-platforms/admin/suggestions/:id/approve
router.patch('/admin/suggestions/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;

  try {
    const suggestion = await db.selectFrom('vtt_platform_suggestions')
      .selectAll().where('id', '=', id).executeTakeFirst();
    if (!suggestion) return res.status(404).json({ error: 'Sugestão não encontrada.' });

    const slug = slugify(suggestion.suggested_name);
    const platform = await db.insertInto('vtt_platforms')
      .values({ name: suggestion.suggested_name, slug, is_active: true, sort_order: 0 })
      .returning(['id', 'name', 'slug'])
      .executeTakeFirst();

    await db.updateTable('vtt_platform_suggestions')
      .set({ status: 'approved', reviewed_at: new Date(), reviewed_by_user_id: adminId })
      .where('id', '=', id).execute();

    return res.json({ data: platform });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
  }
});

// PATCH /api/v1/vtt-platforms/admin/suggestions/:id/reject
router.patch('/admin/suggestions/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;

  try {
    await db.updateTable('vtt_platform_suggestions')
      .set({ status: 'rejected', reviewed_at: new Date(), reviewed_by_user_id: adminId })
      .where('id', '=', id).execute();
    return res.json({ data: { message: 'Sugestão rejeitada.' } });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
  }
});
```

A função `slugify` já existe em `systems.ts` — mover para `backend/src/utils/slugify.ts` e importar nos dois arquivos.

#### `systems.ts` — adicionar aprovação de sugestões

Já tem POST/PUT/DELETE admin. Adicionar:

```typescript
// GET  /api/v1/systems/admin/suggestions
// PATCH /api/v1/systems/admin/suggestions/:id/approve
// PATCH /api/v1/systems/admin/suggestions/:id/reject
```

Mesmo padrão de VTTs. Ao aprovar: INSERT em `systems` com `node_type: 'system'`, `depth: 0`.

#### `scenarios.ts` — criar CRUD admin completo

```typescript
// GET    /api/v1/scenarios/admin
// POST   /api/v1/scenarios/admin
// PUT    /api/v1/scenarios/admin/:id
// DELETE /api/v1/scenarios/admin/:id
```

`scenarios` não tem hierarquia, sem `parent_id`. Campos: `name`, `system_id` (opcional), `is_active`. Sem tabela de sugestões — cenários não têm fluxo de sugestão de usuário.

#### `settings.ts` — criar CRUD admin

`adminSettingSuggestions.ts` já existe com CRUD completo para `setting_style_suggestions`. O problema é que esse arquivo gerencia uma tabela que mistura "sugestão de usuário" com "dado canônico" — a tabela `setting_style_suggestions` serve os dois propósitos. Não muda a tabela, só adiciona os endpoints diretamente em `settings.ts`:

```typescript
// GET    /api/v1/settings/admin
// POST   /api/v1/settings/admin
// PUT    /api/v1/settings/admin/:id
// DELETE /api/v1/settings/admin/:id
```

---

### 3. Componentes AdminPanel — estrutura padrão

Cada panel segue a mesma estrutura. Exemplo completo para VTT que os outros replicam:

```typescript
// frontend/src/components/admin/AdminVttPanel.tsx

interface AdminVttPanelProps {
  token: string;
  onDataChanged: () => void; // chama refetch do useVttPlatforms
}

export function AdminVttPanel({ token, onDataChanged }: AdminVttPanelProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<VttPlatform[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', website_url: '', sort_order: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch items + suggestions quando abre
  // create, update, delete, approve, reject com fetch + token
  // após cada mutação: fetchItems() + onDataChanged()

  return (
    <details className="mt-3 rounded-xl border border-purple-400/30 bg-purple-900/20">
      <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-purple-300">
        ⚙️ Admin: Gerenciar VTT Platforms
      </summary>
      <div className="p-4 space-y-4">
        {/* Lista de sugestões pendentes */}
        {/* Formulário criar/editar */}
        {/* Lista de VTTs existentes com editar/deletar/toggle */}
      </div>
    </details>
  );
}
```

O `<details>` nativo resolve o colapso sem dependência. A borda roxa distingue visualmente do conteúdo do formulário normal.

`AdminSystemPanel`, `AdminScenarioPanel`, `AdminSettingStylesPanel` — mesma estrutura, endpoints diferentes.

---

### 4. `CreateTableForm.tsx` — duas linhas de mudança

No `StepSystem` (step 2), adicionar dois props:
```tsx
<StepSystem
  // ...props existentes...
  userRole={user?.role}
  token={token}
/>
```

No `StepConfig` (step 4), adicionar dois props:
```tsx
<StepConfig
  // ...props existentes...
  userRole={user?.role}
  token={token}
/>
```

`StepFinal` já recebe `userRole={user?.role}`. Adicionar apenas `token={token}`.

---

### 5. Steps — injeção dos panels

**`StepConfig.tsx`** — após o bloco do select de VTT e o campo `communicationPlatform`:
```tsx
{isOnline && userRole === 'admin' && (
  <AdminVttPanel token={token} onDataChanged={refetch} />
)}
```
`refetch` vem do `useVttPlatforms()` com a modificação da fase 1.

**`StepSystem.tsx`** — após o `SystemTreeSelector`:
```tsx
{userRole === 'admin' && (
  <AdminSystemPanel token={token} onDataChanged={onRefreshSystems} />
)}
```
Após o `ScenarioSelector`:
```tsx
{userRole === 'admin' && (
  <AdminScenarioPanel token={token} onDataChanged={() => {/* refetch cenários */}} />
)}
```

**`StepFinal.tsx`** — dentro da seção "Cenário e Estilos", após o `SettingStylesField`:
```tsx
{props.userRole === 'admin' && (
  <AdminSettingStylesPanel token={props.token} onDataChanged={() => {}} />
)}
```

---

### Ordem de execução

1. `slugify` para utilitário compartilhado — evita duplicar nos arquivos backend
2. Backend VTTs — CRUD admin + sugestões (mais urgente, sugestões sem aprovação acumulando)
3. `useVttPlatforms` — adicionar `refetch`
4. `AdminVttPanel` + injeção em `StepConfig` — validar o padrão completo funcionando
5. Backend Systems — aprovação de sugestões (CRUD já existe)
6. Backend Scenarios + Settings — CRUD admin
7. `AdminSystemPanel`, `AdminScenarioPanel`, `AdminSettingStylesPanel` + injeção nos steps
8. Propagação de `userRole` e `token` em `CreateTableForm` para todos os steps