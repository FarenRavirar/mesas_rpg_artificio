import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { DiscordDraft, DiscordImportDraftStatus } from '../types';
import { discordSyncApi } from '../api/discordSyncApi';
import type { SystemTreeNode } from '../../../types/systems';

interface Props {
  draft: DiscordDraft;
  onUpdate: (updated: DiscordDraft) => void;
  onClose: () => void;
}

type DraftTableType = 'campanha' | 'one-shot' | 'oneshot-serie' | 'aberta';
type DraftModality = 'online' | 'presencial' | 'hibrida';
type DraftPriceType = 'gratuita' | 'paga';
type DraftDayOfWeek = 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado' | 'domingo';
type DraftFrequency = 'semanal' | 'quinzenal' | 'mensal' | 'avulsa';

interface DraftForm {
  title: string;
  description: string;
  system_id: string;
  system_name: string;
  type: DraftTableType;
  modality: DraftModality;
  price_type: DraftPriceType;
  price_value: string;
  slots_total: string;
  slots_open: string;
  day_of_week: '' | DraftDayOfWeek;
  start_time: string;
  frequency: DraftFrequency;
  contact_url: string;
  contact_discord: string;
}

interface DraftPayload {
  kind?: unknown;
  source?: Record<string, unknown>;
  table?: Record<string, unknown>;
  confidence?: unknown;
}

const STATUS_OPTIONS: DiscordImportDraftStatus[] = ['draft', 'ready', 'needs_review', 'rejected'];
const API_BASE = import.meta.env.VITE_API_URL || '';
const STATUS_LABELS: Record<DiscordImportDraftStatus, string> = {
  draft: 'Rascunho',
  ready: 'Pronto',
  needs_review: 'Revisar',
  synced: 'Sincronizado',
  rejected: 'Rejeitado',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumberString(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function normalizePayload(value: unknown): DraftPayload {
  return isRecord(value) ? value : {};
}

function buildForm(payload: DraftPayload): DraftForm {
  const table = asRecord(payload.table);
  return {
    title: asString(table.title),
    description: asString(table.description),
    system_id: asString(table.system_id),
    system_name: asString(table.system_name) || asString(table.raw_system_hint),
    type: (asString(table.type) as DraftTableType) || 'campanha',
    modality: (asString(table.modality) as DraftModality) || 'online',
    price_type: (asString(table.price_type) as DraftPriceType) || 'gratuita',
    price_value: asNumberString(table.price_value),
    slots_total: asNumberString(table.slots_total),
    slots_open: asNumberString(table.slots_open),
    day_of_week: (asString(table.day_of_week) as DraftForm['day_of_week']) || '',
    start_time: asString(table.start_time),
    frequency: (asString(table.frequency) as DraftFrequency) || 'semanal',
    contact_url: asString(table.contact_url),
    contact_discord: asString(table.contact_discord),
  };
}

function parseOptionalPositiveInt(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalMoney(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validateForm(form: DraftForm): string[] {
  const missing: string[] = [];
  if (!form.title.trim()) missing.push('Título');
  if (!form.description.trim()) missing.push('Descrição');
  if (!form.system_id.trim()) missing.push('Sistema');
  if (!form.type.trim()) missing.push('Tipo');
  if (!form.modality.trim()) missing.push('Modalidade');
  if (!form.price_type.trim()) missing.push('Preço');
  if (!parseOptionalPositiveInt(form.slots_total) && !parseOptionalPositiveInt(form.slots_open)) missing.push('Vagas');
  if (!form.contact_url.trim() && !form.contact_discord.trim()) missing.push('Contato');
  if (!form.day_of_week) missing.push('Dia');
  if (!form.start_time.trim()) missing.push('Horário');
  return missing;
}

function buildUpdatedPayload(base: DraftPayload, form: DraftForm): Record<string, unknown> {
  const baseTable = asRecord(base.table);
  const slotsTotal = parseOptionalPositiveInt(form.slots_total);
  const slotsOpen = parseOptionalPositiveInt(form.slots_open);
  const priceValue = parseOptionalMoney(form.price_value);

  return {
    ...base,
    kind: base.kind ?? 'table_draft',
    source: asRecord(base.source),
    table: {
      ...baseTable,
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      system_id: form.system_id.trim() || null,
      system_name: form.system_name.trim() || null,
      type: form.type,
      modality: form.modality,
      price_type: form.price_type,
      price_value: form.price_type === 'paga' ? priceValue : null,
      slots_total: slotsTotal,
      slots_open: slotsOpen ?? slotsTotal,
      day_of_week: form.day_of_week || null,
      start_time: form.start_time.trim() || null,
      frequency: form.frequency,
      contact_url: form.contact_url.trim() || null,
      contact_discord: form.contact_discord.trim() || null,
    },
  };
}

function flattenSystems(nodes: SystemTreeNode[]): SystemTreeNode[] {
  const result: SystemTreeNode[] = [];
  const walk = (items: SystemTreeNode[]) => {
    for (const node of items) {
      result.push(node);
      if (Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

async function loadSystems(): Promise<SystemTreeNode[]> {
  const res = await fetch(`${API_BASE}/api/v1/systems?view=tree`, { credentials: 'include' });
  const json: unknown = await res.json();
  if (!res.ok) throw new Error('Erro ao carregar sistemas.');
  const data = asRecord(json).data;
  return Array.isArray(data) ? data.filter(isRecord) as unknown as SystemTreeNode[] : [];
}

export function DiscordDraftPreview({ draft, onUpdate, onClose }: Props) {
  const initialPayload = useMemo(
    () => normalizePayload(draft.normalized_payload ?? draft.parsed_payload),
    [draft.normalized_payload, draft.parsed_payload]
  );
  const [form, setForm] = useState<DraftForm>(() => buildForm(initialPayload));
  const [systems, setSystems] = useState<SystemTreeNode[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<DiscordImportDraftStatus>(draft.status);
  const [reviewNotes, setReviewNotes] = useState(draft.review_notes ?? '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'parsed' | 'normalized'>('editor');

  useEffect(() => {
    setForm(buildForm(initialPayload));
    setNewStatus(draft.status);
    setReviewNotes(draft.review_notes ?? '');
  }, [draft.id, draft.review_notes, draft.status, initialPayload]);

  useEffect(() => {
    let cancelled = false;
    setSystemsLoading(true);
    loadSystems()
      .then((items) => {
        if (!cancelled) setSystems(flattenSystems(items));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Erro ao carregar sistemas.');
      })
      .finally(() => {
        if (!cancelled) setSystemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const missingFields = validateForm(form);
  const canSync = draft.status === 'ready' && missingFields.length === 0;
  const displayStatus: DiscordImportDraftStatus = draft.status === 'ready' && !canSync ? 'needs_review' : draft.status;
  const selectedPayload = activeTab === 'parsed' ? draft.parsed_payload : (draft.normalized_payload ?? draft.parsed_payload);

  const updateForm = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSystemChange = (systemId: string) => {
    const selected = systems.find((system) => system.id === systemId);
    setForm((prev) => ({
      ...prev,
      system_id: systemId,
      system_name: selected?.name_pt || selected?.name || prev.system_name,
    }));
  };

  const handleSaveFields = async () => {
    setSavingFields(true);
    try {
      const nextMissing = validateForm(form);
      const updated = await discordSyncApi.updateDraft(draft.id, {
        normalized_payload: buildUpdatedPayload(initialPayload, form),
        status: nextMissing.length === 0 ? 'ready' : 'needs_review',
        review_notes: nextMissing.length === 0 ? reviewNotes || undefined : `Campos pendentes: ${nextMissing.join(', ')}`,
      });
      toast.success(nextMissing.length === 0 ? 'Draft pronto para sincronizar.' : 'Draft salvo para revisão.');
      onUpdate(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar campos do draft.');
    } finally {
      setSavingFields(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await discordSyncApi.syncDraft(draft.id);
      toast.success(`Mesa ${result.created ? 'criada' : 'atualizada'}: ${result.tableId}`);
      const updated = await discordSyncApi.getDraft(draft.id);
      onUpdate(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar draft.');
    } finally {
      setSyncing(false);
    }
  };

  const handleReparse = async () => {
    setReparsing(true);
    try {
      const updated = await discordSyncApi.reparseDraft(draft.id);
      toast.success('Draft reparseado.');
      onUpdate(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reparsar draft.');
    } finally {
      setReparsing(false);
    }
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const updated = await discordSyncApi.updateDraft(draft.id, {
        status: newStatus,
        review_notes: reviewNotes || undefined,
      });
      toast.success('Status atualizado.');
      setEditingStatus(false);
      onUpdate(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const tabClass = (tab: typeof activeTab) =>
    `px-3 py-1 text-xs rounded-lg transition-colors ${
      activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
    }`;

  const inputClass = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30';
  const labelClass = 'block text-white/60 text-xs mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1B2A4A] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold">Draft de mesa</h3>
            <p className="text-white/40 text-xs mt-0.5">{draft.id}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-lg leading-none">
            X
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
          {editingStatus ? (
            <>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DiscordImportDraftStatus)} className="app-select py-1">
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                placeholder="Notas de revisão..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30"
              />
              <button onClick={handleSaveStatus} disabled={savingStatus} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50">
                {savingStatus ? '...' : 'Salvar'}
              </button>
              <button onClick={() => setEditingStatus(false)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span className="text-white/60 text-sm">Status:</span>
              <span className="text-white text-sm font-medium">{STATUS_LABELS[displayStatus]}</span>
              {draft.confidence != null && <span className="text-white/40 text-xs">confiança: {(draft.confidence * 100).toFixed(0)}%</span>}
              <button onClick={() => setEditingStatus(true)} className="ml-auto px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs rounded-lg transition-colors">
                Editar status
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 pt-3">
          <button className={tabClass('editor')} onClick={() => setActiveTab('editor')}>Campos</button>
          <button className={tabClass('normalized')} onClick={() => setActiveTab('normalized')}>Normalizado</button>
          <button className={tabClass('parsed')} onClick={() => setActiveTab('parsed')}>Bruto</button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-3">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              {missingFields.length > 0 && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
                  Campos pendentes: {missingFields.join(', ')}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label>
                  <span className={labelClass}>Título</span>
                  <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Sistema</span>
                  <select value={form.system_id} onChange={(e) => handleSystemChange(e.target.value)} className="app-select w-full">
                    <option value="">{systemsLoading ? 'Carregando sistemas...' : 'Selecione um sistema'}</option>
                    {systems.map((system) => (
                      <option key={system.id} value={system.id}>{system.name_pt || system.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Tipo</span>
                  <select value={form.type} onChange={(e) => updateForm('type', e.target.value as DraftTableType)} className="app-select w-full">
                    <option value="campanha">Campanha</option>
                    <option value="one-shot">One-shot</option>
                    <option value="oneshot-serie">Série de one-shots</option>
                    <option value="aberta">Aberta</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Modalidade</span>
                  <select value={form.modality} onChange={(e) => updateForm('modality', e.target.value as DraftModality)} className="app-select w-full">
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Preço</span>
                  <select value={form.price_type} onChange={(e) => updateForm('price_type', e.target.value as DraftPriceType)} className="app-select w-full">
                    <option value="gratuita">Gratuita</option>
                    <option value="paga">Paga</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Valor</span>
                  <input value={form.price_value} onChange={(e) => updateForm('price_value', e.target.value)} className={inputClass} placeholder="0" disabled={form.price_type === 'gratuita'} />
                </label>
                <label>
                  <span className={labelClass}>Vagas totais</span>
                  <input value={form.slots_total} onChange={(e) => updateForm('slots_total', e.target.value)} className={inputClass} inputMode="numeric" />
                </label>
                <label>
                  <span className={labelClass}>Vagas abertas</span>
                  <input value={form.slots_open} onChange={(e) => updateForm('slots_open', e.target.value)} className={inputClass} inputMode="numeric" />
                </label>
                <label>
                  <span className={labelClass}>Dia</span>
                  <select value={form.day_of_week} onChange={(e) => updateForm('day_of_week', e.target.value as DraftForm['day_of_week'])} className="app-select w-full">
                    <option value="">Selecione</option>
                    <option value="segunda">Segunda</option>
                    <option value="terça">Terça</option>
                    <option value="quarta">Quarta</option>
                    <option value="quinta">Quinta</option>
                    <option value="sexta">Sexta</option>
                    <option value="sábado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Horário</span>
                  <input value={form.start_time} onChange={(e) => updateForm('start_time', e.target.value)} className={inputClass} placeholder="19:00" />
                </label>
                <label>
                  <span className={labelClass}>Frequência</span>
                  <select value={form.frequency} onChange={(e) => updateForm('frequency', e.target.value as DraftFrequency)} className="app-select w-full">
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="avulsa">Avulsa</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Contato Discord</span>
                  <input value={form.contact_discord} onChange={(e) => updateForm('contact_discord', e.target.value)} className={inputClass} />
                </label>
                <label className="md:col-span-2">
                  <span className={labelClass}>Link de inscrição/contato</span>
                  <input value={form.contact_url} onChange={(e) => updateForm('contact_url', e.target.value)} className={inputClass} />
                </label>
                <label className="md:col-span-2">
                  <span className={labelClass}>Descrição</span>
                  <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} className={`${inputClass} min-h-28 resize-y`} />
                </label>
              </div>
            </div>
          ) : (
            <pre className="text-xs text-green-300 bg-black/30 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          )}
        </div>

        {draft.review_notes && !editingStatus && (
          <div className="px-5 py-2 border-t border-white/10">
            <p className="text-white/50 text-xs">Notas: {draft.review_notes}</p>
          </div>
        )}

        <div className="px-5 py-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
          <button onClick={handleReparse} disabled={reparsing} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-40">
            {reparsing ? 'Reparseando...' : 'Reparsar'}
          </button>
          <button onClick={handleSaveFields} disabled={savingFields} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
            {savingFields ? 'Salvando...' : 'Salvar campos'}
          </button>
          <button
            onClick={handleSync}
            disabled={!canSync || syncing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
            title={!canSync ? 'Salve todos os campos obrigatórios e deixe o draft como ready.' : undefined}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar como mesa'}
          </button>
          {draft.status === 'synced' && draft.table_id && <span className="text-green-400 text-sm self-center">Mesa: {draft.table_id}</span>}
        </div>
      </div>
    </div>
  );
}
