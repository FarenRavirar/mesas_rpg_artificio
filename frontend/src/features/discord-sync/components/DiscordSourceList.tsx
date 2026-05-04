import { useState } from 'react';
import toast from 'react-hot-toast';
import type { DiscordDiscoveredChannel, DiscordDiscoveredGuild, DiscordSource } from '../types';
import { discordSyncApi } from '../api/discordSyncApi';

interface Props {
  sources: DiscordSource[];
  onRefresh: () => void;
  onFetchMessages: (sourceId: string) => void;
  fetchingSourceId: string | null;
}

interface NewSourceForm {
  guild_id: string;
  channel_id: string;
  channel_name: string;
}

const emptyForm: NewSourceForm = { guild_id: '', channel_id: '', channel_name: '' };
const selectClassName =
  'px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm disabled:opacity-50 [&_option]:bg-white [&_option]:text-slate-900';

export function DiscordSourceList({ sources, onRefresh, onFetchMessages, fetchingSourceId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewSourceForm>(emptyForm);
  const [guilds, setGuilds] = useState<DiscordDiscoveredGuild[]>([]);
  const [channels, setChannels] = useState<DiscordDiscoveredChannel[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedGuildId('');
    setSelectedChannelId('');
    setChannels([]);
    setDiscoveryError(null);
    setManualMode(false);
  };

  const loadGuilds = async () => {
    setLoadingGuilds(true);
    setDiscoveryError(null);
    try {
      const discoveredGuilds = await discordSyncApi.discoverGuilds();
      setGuilds(discoveredGuilds);
      if (discoveredGuilds.length === 0) {
        setDiscoveryError('Nenhum servidor encontrado. Convide o bot para o servidor Discord e tente novamente.');
      }
    } catch (err) {
      setGuilds([]);
      setDiscoveryError(err instanceof Error ? err.message : 'Erro ao descobrir servidores.');
    } finally {
      setLoadingGuilds(false);
    }
  };

  const openForm = () => {
    setShowForm(true);
    if (guilds.length === 0 && !loadingGuilds) {
      loadGuilds();
    }
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSelectGuild = async (guildId: string) => {
    setSelectedGuildId(guildId);
    setSelectedChannelId('');
    setChannels([]);
    setDiscoveryError(null);
    if (!guildId) return;

    setLoadingChannels(true);
    try {
      const discoveredChannels = await discordSyncApi.discoverChannels(guildId);
      setChannels(discoveredChannels);
      if (discoveredChannels.length === 0) {
        setDiscoveryError('Nenhum canal textual encontrado. Revise permissões do bot no servidor e nos canais.');
      }
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : 'Erro ao descobrir canais.');
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleCreateDiscovered = async () => {
    const channel = channels.find((item) => item.id === selectedChannelId);
    if (!selectedGuildId || !channel) {
      toast.error('Selecione um servidor e um canal.');
      return;
    }
    setSaving(true);
    try {
      await discordSyncApi.createSource({
        guild_id: selectedGuildId,
        channel_id: channel.id,
        channel_name: channel.name,
      });
      toast.success('Canal cadastrado.');
      closeForm();
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar canal.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateManual = async () => {
    if (!form.guild_id.trim() || !form.channel_id.trim()) {
      toast.error('Guild ID e Channel ID são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await discordSyncApi.createSource({
        guild_id: form.guild_id.trim(),
        channel_id: form.channel_id.trim(),
        channel_name: form.channel_name.trim() || undefined,
      });
      toast.success('Canal cadastrado.');
      closeForm();
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar canal.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (source: DiscordSource) => {
    try {
      await discordSyncApi.updateSource(source.id, { enabled: !source.enabled });
      toast.success(source.enabled ? 'Canal desabilitado.' : 'Canal habilitado.');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar canal.');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await discordSyncApi.deleteSource(id);
      toast.success('Canal removido.');
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover canal.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Canais monitorados</h3>
        <button
          onClick={() => (showForm ? closeForm() : openForm())}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + Adicionar canal
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 space-y-3">
          {!manualMode && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-white/50">
                  Servidor
                  <select
                    value={selectedGuildId}
                    onChange={e => handleSelectGuild(e.target.value)}
                    disabled={loadingGuilds}
                    className={selectClassName}
                  >
                    <option className="bg-white text-slate-900" value="">{loadingGuilds ? 'Carregando servidores...' : 'Selecione um servidor'}</option>
                    {guilds.map(guild => (
                      <option className="bg-white text-slate-900" key={guild.id} value={guild.id}>
                        {guild.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/50">
                  Canal
                  <select
                    value={selectedChannelId}
                    onChange={e => setSelectedChannelId(e.target.value)}
                    disabled={!selectedGuildId || loadingChannels}
                    className={selectClassName}
                  >
                    <option className="bg-white text-slate-900" value="">{loadingChannels ? 'Carregando canais...' : 'Selecione um canal'}</option>
                    {channels.map(channel => (
                      <option className="bg-white text-slate-900" key={channel.id} value={channel.id}>
                        {channel.parent_name ? `${channel.parent_name} / #${channel.name}` : `#${channel.name}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {discoveryError && (
                <p className="text-yellow-300 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2 text-sm">
                  {discoveryError}
                </p>
              )}
            </div>
          )}

          {manualMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Guild ID *"
                value={form.guild_id}
                onChange={e => setForm(f => ({ ...f, guild_id: e.target.value }))}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm"
              />
              <input
                placeholder="Channel ID *"
                value={form.channel_id}
                onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm"
              />
              <input
                placeholder="Nome do canal (opcional)"
                value={form.channel_name}
                onChange={e => setForm(f => ({ ...f, channel_name: e.target.value }))}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setManualMode(v => !v)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors"
            >
              {manualMode ? 'Usar descoberta' : 'Modo avançado'}
            </button>
            <button
              onClick={closeForm}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={manualMode ? handleCreateManual : handleCreateDiscovered}
              disabled={saving}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {sources.length === 0 ? (
        <p className="text-white/40 text-sm py-4 text-center">Nenhum canal cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {sources.map(source => (
            <div
              key={source.id}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <span className="text-white font-medium text-sm">
                  {source.channel_name ?? source.channel_id}
                </span>
                <span className="ml-2 text-white/40 text-xs">#{source.channel_id}</span>
                {source.last_synced_at && (
                  <span className="ml-2 text-white/30 text-xs">
                    sync {new Date(source.last_synced_at).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleEnabled(source)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    source.enabled
                      ? 'bg-green-700/50 text-green-300 hover:bg-green-700/70'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {source.enabled ? 'Habilitado' : 'Desabilitado'}
                </button>
                <button
                  onClick={() => onFetchMessages(source.id)}
                  disabled={fetchingSourceId === source.id || !source.enabled}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors disabled:opacity-40"
                >
                  {fetchingSourceId === source.id ? 'Buscando...' : 'Buscar mensagens'}
                </button>
                {confirmDeleteId === source.id ? (
                  <>
                    <span className="text-white/60 text-xs">Confirmar?</span>
                    <button
                      onClick={() => handleDelete(source.id)}
                      disabled={deletingId === source.id}
                      className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === source.id ? '...' : 'Sim'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                    >
                      Não
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(source.id)}
                    className="px-2 py-1 bg-white/10 hover:bg-red-700/50 text-white/60 hover:text-white text-xs rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
