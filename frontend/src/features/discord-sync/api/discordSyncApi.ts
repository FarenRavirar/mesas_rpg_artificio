import type {
  DiscordSource,
  DiscordMessage,
  DiscordDraft,
  DiscordImportMessageStatus,
  DiscordImportDraftStatus,
  IngestResult,
  SyncReadyResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE = `${API_BASE}/api/v1/admin/discord-sync`;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data.data as T;
}

export const discordSyncApi = {
  getSources: () =>
    apiFetch<DiscordSource[]>('/sources'),

  createSource: (body: { guild_id: string; channel_id: string; channel_name?: string; enabled?: boolean }) =>
    apiFetch<DiscordSource>('/sources', { method: 'POST', body: JSON.stringify(body) }),

  updateSource: (id: string, body: { channel_name?: string; enabled?: boolean; auto_sync_enabled?: boolean }) =>
    apiFetch<DiscordSource>(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteSource: (id: string) =>
    apiFetch<{ message: string }>(`/sources/${id}`, { method: 'DELETE' }),

  fetchMessages: (body: { source_id: string; limit?: number; before_message_id?: string }) =>
    apiFetch<IngestResult>('/fetch', { method: 'POST', body: JSON.stringify(body) }),

  getMessages: (params?: { source_id?: string; status?: DiscordImportMessageStatus; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.source_id) qs.set('source_id', params.source_id);
    if (params?.status) qs.set('status', params.status);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    return apiFetch<DiscordMessage[]>(`/messages?${qs}`);
  },

  getDrafts: (params?: { status?: DiscordImportDraftStatus; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    return apiFetch<DiscordDraft[]>(`/drafts?${qs}`);
  },

  getDraft: (id: string) =>
    apiFetch<DiscordDraft>(`/drafts/${id}`),

  updateDraft: (id: string, body: { normalized_payload?: Record<string, unknown>; status?: DiscordImportDraftStatus; review_notes?: string }) =>
    apiFetch<DiscordDraft>(`/drafts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  syncDraft: (id: string) =>
    apiFetch<{ tableId: string; created: boolean }>(`/drafts/${id}/sync`, { method: 'POST' }),

  reparseDraft: (id: string) =>
    apiFetch<DiscordDraft>(`/drafts/${id}/reparse`, { method: 'POST' }),

  syncReady: () =>
    apiFetch<SyncReadyResult>('/sync-ready', { method: 'POST' }),
};
