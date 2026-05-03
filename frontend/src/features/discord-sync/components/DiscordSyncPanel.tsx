import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { DiscordSource, DiscordMessage, DiscordImportMessageStatus } from '../types';
import { discordSyncApi } from '../api/discordSyncApi';
import { DiscordSourceList } from './DiscordSourceList';
import { DiscordDraftReviewTable } from './DiscordDraftReviewTable';

const MESSAGE_STATUS_LABELS: Record<DiscordImportMessageStatus, string> = {
  pending: 'Pendente',
  parsed: 'Parseada',
  needs_review: 'Revisar',
  synced: 'Sincronizada',
  ignored: 'Ignorada',
  error: 'Erro',
};

const MESSAGE_STATUS_COLORS: Record<DiscordImportMessageStatus, string> = {
  pending: 'bg-yellow-700/40 text-yellow-300',
  parsed: 'bg-blue-700/40 text-blue-300',
  needs_review: 'bg-orange-700/40 text-orange-300',
  synced: 'bg-green-700/40 text-green-300',
  ignored: 'bg-white/10 text-white/40',
  error: 'bg-red-700/40 text-red-300',
};

type PanelTab = 'fontes' | 'mensagens' | 'drafts';

export function DiscordSyncPanel() {
  const [tab, setTab] = useState<PanelTab>('fontes');
  const [sources, setSources] = useState<DiscordSource[]>([]);
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchingSourceId, setFetchingSourceId] = useState<string | null>(null);
  const [messageStatusFilter, setMessageStatusFilter] = useState<DiscordImportMessageStatus | ''>('');

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const data = await discordSyncApi.getSources();
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar fontes.');
    } finally {
      setLoadingSources(false);
    }
  };

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await discordSyncApi.getMessages({
        status: messageStatusFilter || undefined,
        limit: 100,
      });
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    if (tab === 'mensagens') {
      loadMessages();
    }
  }, [tab, messageStatusFilter]);

  const handleFetchMessages = async (sourceId: string) => {
    setFetchingSourceId(sourceId);
    try {
      const result = await discordSyncApi.fetchMessages({ source_id: sourceId, limit: 50 });
      toast.success(`+${result.inserted} inseridas, ${result.updated} atualizadas.`);
      if (tab === 'mensagens') loadMessages();
      loadSources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar mensagens.');
    } finally {
      setFetchingSourceId(null);
    }
  };

  const tabClass = (t: PanelTab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-white">Discord Sync — Covil do Lich</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tabClass('fontes')} onClick={() => setTab('fontes')}>Fontes</button>
        <button className={tabClass('mensagens')} onClick={() => setTab('mensagens')}>Mensagens</button>
        <button className={tabClass('drafts')} onClick={() => setTab('drafts')}>Drafts</button>
      </div>

      {tab === 'fontes' && (
        <div>
          {loadingSources ? (
            <p className="text-white/40 text-sm py-4 text-center">Carregando...</p>
          ) : (
            <DiscordSourceList
              sources={sources}
              onRefresh={loadSources}
              onFetchMessages={handleFetchMessages}
              fetchingSourceId={fetchingSourceId}
            />
          )}
        </div>
      )}

      {tab === 'mensagens' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={messageStatusFilter}
              onChange={e => setMessageStatusFilter(e.target.value as DiscordImportMessageStatus | '')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos os status</option>
              {(Object.keys(MESSAGE_STATUS_LABELS) as DiscordImportMessageStatus[]).map(s => (
                <option key={s} value={s}>{MESSAGE_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={loadMessages}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
            >
              Recarregar
            </button>
          </div>

          {loadingMessages ? (
            <p className="text-white/40 text-sm py-4 text-center">Carregando...</p>
          ) : messages.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">Nenhuma mensagem encontrada.</p>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${MESSAGE_STATUS_COLORS[msg.status]}`}>
                          {MESSAGE_STATUS_LABELS[msg.status]}
                        </span>
                        <span className="text-white/40 text-xs">
                          {msg.discord_author_name ?? msg.discord_author_id ?? 'autor desconhecido'}
                        </span>
                        {msg.message_created_at && (
                          <span className="text-white/30 text-xs">
                            {new Date(msg.message_created_at).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm truncate">{msg.content_raw.slice(0, 200)}</p>
                      {msg.parse_error && (
                        <p className="text-red-400 text-xs mt-1">Erro: {msg.parse_error}</p>
                      )}
                    </div>
                    {msg.discord_message_url && (
                      <a
                        href={msg.discord_message_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs shrink-0"
                      >
                        Ver no Discord
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'drafts' && (
        <DiscordDraftReviewTable />
      )}
    </div>
  );
}
