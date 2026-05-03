import { useState } from 'react';
import toast from 'react-hot-toast';
import type { DiscordDraft, DiscordImportDraftStatus } from '../types';
import { discordSyncApi } from '../api/discordSyncApi';

interface Props {
  draft: DiscordDraft;
  onUpdate: (updated: DiscordDraft) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: DiscordImportDraftStatus[] = ['draft', 'ready', 'needs_review', 'rejected'];

export function DiscordDraftPreview({ draft, onUpdate, onClose }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<DiscordImportDraftStatus>(draft.status);
  const [reviewNotes, setReviewNotes] = useState(draft.review_notes ?? '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'parsed' | 'normalized'>('normalized');

  const handleSync = async () => {
    if (!confirm('Sincronizar este draft como mesa real?')) return;
    setSyncing(true);
    try {
      const result = await discordSyncApi.syncDraft(draft.id);
      toast.success(`Mesa ${result.action === 'created' ? 'criada' : 'atualizada'}: ${result.table_id}`);
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
      toast.error(err instanceof Error ? err.message : 'Reparse ainda não disponível (Fase 5).');
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

  const payload = activeTab === 'parsed' ? draft.parsed_payload : (draft.normalized_payload ?? draft.parsed_payload);
  const canSync = draft.status === 'ready' || draft.status === 'needs_review';

  const tabClass = (t: 'parsed' | 'normalized') =>
    `px-3 py-1 text-xs rounded-lg transition-colors ${
      activeTab === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1B2A4A] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold">Draft</h3>
            <p className="text-white/40 text-xs mt-0.5">{draft.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
          {editingStatus ? (
            <>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as DiscordImportDraftStatus)}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                placeholder="Notas de revisão..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30"
              />
              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
              >
                {savingStatus ? '...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditingStatus(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span className="text-white/60 text-sm">Status:</span>
              <span className="text-white text-sm font-medium">{draft.status}</span>
              {draft.confidence != null && (
                <span className="text-white/40 text-xs">confiança: {(draft.confidence * 100).toFixed(0)}%</span>
              )}
              <button
                onClick={() => setEditingStatus(true)}
                className="ml-auto px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs rounded-lg transition-colors"
              >
                Editar status
              </button>
            </>
          )}
        </div>

        {/* Payload tabs */}
        <div className="flex gap-2 px-5 pt-3">
          <button className={tabClass('normalized')} onClick={() => setActiveTab('normalized')}>
            Normalizado
          </button>
          <button className={tabClass('parsed')} onClick={() => setActiveTab('parsed')}>
            Bruto (parsed)
          </button>
        </div>

        {/* Payload viewer */}
        <div className="flex-1 overflow-auto px-5 py-3">
          <pre className="text-xs text-green-300 bg-black/30 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {/* Review notes */}
        {draft.review_notes && !editingStatus && (
          <div className="px-5 py-2 border-t border-white/10">
            <p className="text-white/50 text-xs">Notas: {draft.review_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-2 justify-end">
          <button
            onClick={handleReparse}
            disabled={reparsing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
          >
            {reparsing ? 'Reparseando...' : 'Reparsar'}
          </button>
          {canSync && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar como mesa'}
            </button>
          )}
          {draft.status === 'synced' && draft.table_id && (
            <span className="text-green-400 text-sm self-center">
              Mesa: {draft.table_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
