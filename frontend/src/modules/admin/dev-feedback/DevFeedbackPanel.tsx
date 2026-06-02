import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchDevFeedback,
  updateDevFeedback,
  type DevFeedbackItem,
  type DevFeedbackStatus,
} from '../../../features/dev-feedback/devFeedbackApi';

const STATUS_OPTIONS: { value: DevFeedbackStatus; label: string }[] = [
  { value: 'new', label: 'Novo' },
  { value: 'triaged', label: 'Triado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'wont_fix', label: 'Nao sera feito' },
  { value: 'duplicate', label: 'Duplicado' },
];

const STATUS_LABEL = new Map(STATUS_OPTIONS.map((s) => [s.value, s.label]));

export const DevFeedbackPanel = () => {
  const [items, setItems] = useState<DevFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDevFeedback({ status: statusFilter, kind: kindFilter });
      setItems(data);
    } catch (error) {
      console.error('[DevFeedbackPanel] Erro ao carregar feedbacks:', error);
      toast.error('Erro ao carregar feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, kindFilter]);

  const handleStatusChange = async (item: DevFeedbackItem, status: DevFeedbackStatus) => {
    setSavingId(item.id);
    try {
      await updateDevFeedback(item.id, { status });
      toast.success('Status atualizado.');
      void load();
    } catch {
      toast.error('Erro ao atualizar status.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (item: DevFeedbackItem) => {
    const notes = notesDraft[item.id] ?? item.admin_notes ?? '';
    setSavingId(item.id);
    try {
      await updateDevFeedback(item.id, { admin_notes: notes });
      toast.success('Notas salvas.');
      void load();
    } catch {
      toast.error('Erro ao salvar notas.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos os tipos</option>
          <option value="bug">Problema</option>
          <option value="suggestion">Sugestao</option>
        </select>
        <button
          onClick={() => void load()}
          className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-white/60">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-white/60">Nenhum feedback encontrado.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      item.kind === 'bug' ? 'bg-red-600/80 text-white' : 'bg-blue-600/80 text-white'
                    }`}>
                      {item.kind === 'bug' ? '🐞 Problema' : '💡 Sugestao'}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">
                      {STATUS_LABEL.get(item.status) ?? item.status}
                    </span>
                    {item.environment && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/50">{item.environment}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">{item.description}</p>
                </div>
                <div className="text-right text-xs text-white/40">
                  {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}
                </div>
              </div>

              {/* Contexto */}
              <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-white/50 sm:grid-cols-2">
                <div>
                  Pagina:{' '}
                  {item.page_url ? (
                    <a href={item.page_url} target="_blank" rel="noreferrer" className="text-[#F26733] hover:underline">
                      {item.route_path || item.page_url}
                    </a>
                  ) : (item.route_path || '-')}
                </div>
                <div>Reporter: {item.reporter_name}{item.reporter_role ? ` (${item.reporter_role})` : ''}</div>
                {item.contact_email && <div>Contato: {item.contact_email}</div>}
                {item.viewport && <div>Tela: {item.viewport}</div>}
                {item.user_agent && <div className="sm:col-span-2 truncate">UA: {item.user_agent}</div>}
              </div>

              {/* Erros de console */}
              {item.console_errors.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-white/70">
                    Erros de console ({item.console_errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 rounded bg-black/30 p-2 font-mono text-[11px] text-white/70">
                    {item.console_errors.map((e, i) => (
                      <li key={i} className="break-words">[{e.level}] {e.message}</li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Falhas de rede */}
              {item.network_errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-white/70">
                    Falhas de rede ({item.network_errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 rounded bg-black/30 p-2 font-mono text-[11px] text-white/70">
                    {item.network_errors.map((e, i) => (
                      <li key={i} className="break-words">{e.status} {e.method} {e.url}</li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Screenshot */}
              {item.screenshot_url && (
                <a href={item.screenshot_url} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                  <img
                    src={item.screenshot_url}
                    alt="Captura de tela do relato"
                    className="max-h-40 rounded border border-white/10"
                  />
                </a>
              )}

              {/* Triagem */}
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-3">
                <div>
                  <label className="mb-1 block text-xs text-white/60">Status</label>
                  <select
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={(e) => void handleStatusChange(item, e.target.value as DevFeedbackStatus)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1 block text-xs text-white/60">Notas da equipe</label>
                  <textarea
                    rows={2}
                    defaultValue={item.admin_notes ?? ''}
                    onChange={(e) => setNotesDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                    className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={() => void handleSaveNotes(item)}
                  disabled={savingId === item.id}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  Salvar notas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
