import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, InputHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronRight, Dice1, Globe, MapPin, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import type { TableContact } from '../types/tables';
// Componente refatorado
import { CreateTableForm } from '../features/create-table/components/CreateTableForm';

type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';

interface GmProfile {
  id: string;
  slug: string;
  nickname: string | null;
  bio_long: string | null;
  avatar_url: string | null;
  languages: string[];
  specialties: string[];
  tables_count: number;
  avg_rating: number | null;
}

interface MyTable {
  id: string;
  slug: string;
  title: string;
  status: TableStatus;
  modality: string;
  slots_total: number;
  slots_filled: number;
  system_name: string | null;
  publisher_role: 'gm' | 'announcer';
  actual_gm_name: string | null;
  contacts: TableContact[];
  is_ddal?: boolean;
  ddal_code?: string | null;
  ddal_name?: string | null;
  ddal_tier?: number | null;
  created_at: string;
}

// Tipos para dashboard de métricas
interface TableMetrics {
  views: number;
  clicks: number;
  contacts: number;
  favorites: number;
}

interface MyTableEnhanced extends MyTable {
  image_url?: string | null;
  metrics?: TableMetrics;
}


const slugifyFromNickname = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

function InputField({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <input
        id={id}
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
      />
    </div>
  );
}

function CreateGmProfileForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugifyFromNickname(nickname));
    }
  }, [nickname, slugEdited]);

  const suggestedSlug = slugifyFromNickname(nickname);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1: URL relativa com fallback
      const res = await fetch(`${apiUrl}/api/v1/gm/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, nickname, bio_long: bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <p className="text-white/60 text-sm leading-relaxed">
        Para publicar mesas, você precisa criar seu perfil de Mestre. Escolha um identificador único — ele vai aparecer na URL do seu perfil.
      </p>
      <InputField
        label="Nick público *"
        id="gm-nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Ex: Mestre Corvo"
        minLength={2}
        maxLength={40}
        required
      />

      <InputField
        label="Identificador (slug) *"
        id="gm-slug"
        value={slug}
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(slugifyFromNickname(e.target.value));
        }}
        placeholder="ex: mestre-corvo"
        required
      />
      <p className="text-xs text-white/30 -mt-2">Apenas letras minúsculas, números e hífens. Não pode ser alterado depois.</p>
      {slugEdited && suggestedSlug && suggestedSlug !== slug && (
        <button
          type="button"
          id="btn-gm-slug-usar-sugestao"
          onClick={() => {
            setSlug(suggestedSlug);
            setSlugEdited(false);
          }}
          className="text-left text-xs text-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange-hover)] transition-colors"
        >
          Usar sugestão automática: {suggestedSlug}
        </button>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="gm-bio" className="text-sm font-medium text-white/70">Bio (opcional)</label>
        <textarea
          id="gm-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Conte um pouco sobre você como mestre..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
        />
      </div>
      {error && <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        id="btn-criar-perfil-gm"
        className="w-full py-4 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
      >
        {loading ? 'Criando perfil...' : 'Criar Perfil de Mestre'}
      </button>
    </form>
  );
}

// Componente: Card de KPI
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <p className="text-sm text-white/50 mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

// Componente: Card de Mesa com Métricas
function TableCardDashboard({ 
  table, 
  onEdit, 
  onToggle, 
  onDelete,
  isToggling,
  isDeleting
}: { 
  table: MyTableEnhanced; 
  onEdit: (id: string) => void;
  onToggle: (table: MyTableEnhanced) => void;
  onDelete: (table: MyTableEnhanced) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const openSlots = Math.max(table.slots_total - table.slots_filled, 0);
  const metrics = table.metrics || { views: 0, clicks: 0, contacts: 0, favorites: 0 };
  
  // Feedback inteligente: muitas views mas zero contatos
  const hasPerformanceIssue = metrics.views > 50 && metrics.contacts === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#13213f] p-4 flex flex-col gap-3 hover:scale-[1.01] transition-all">
      
      {/* IMAGE */}
      <div className="h-32 rounded-lg overflow-hidden bg-white/10">
        {table.image_url ? (
          <img src={table.image_url} alt={table.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            ⚠️ Sem imagem
          </div>
        )}
      </div>

      {/* TITLE */}
      <div>
        <h3 className="font-semibold text-white line-clamp-2">{table.title}</h3>
        <p className="text-xs text-white/50 mt-1">
          {table.system_name ?? 'Sistema livre'} · {table.modality}
        </p>
      </div>

      {/* STATUS HUMANO */}
      <div className="text-sm">
        {openSlots === 0 ? (
          <span className="text-red-400">🔥 Mesa cheia</span>
        ) : openSlots <= 2 ? (
          <span className="text-yellow-400">⚡ Últimas vagas ({openSlots})</span>
        ) : (
          <span className="text-green-400">✅ {openSlots} vagas abertas</span>
        )}
      </div>

      {/* METRICS */}
      <div className="flex gap-3 text-xs text-white/60">
        <span title="Visualizações">👁️ {metrics.views}</span>
        <span title="Contatos">💬 {metrics.contacts}</span>
        <span title="Favoritos">❤️ {metrics.favorites}</span>
      </div>

      {/* INSIGHT AUTOMÁTICO */}
      {hasPerformanceIssue && (
        <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg text-yellow-300">
          💡 Muitas visualizações, poucos contatos. Tente melhorar título ou imagem.
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onEdit(table.id)}
          className="flex-1 py-2 text-xs bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Editar
        </button>

        <button
          onClick={() => onToggle(table)}
          disabled={isToggling}
          className="flex-1 py-2 text-xs bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isToggling ? '⏳' : table.status === 'active' ? 'Desativar' : 'Ativar'}
        </button>

        <button
          onClick={() => onDelete(table)}
          disabled={isDeleting}
          className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isDeleting ? '⏳' : 'Deletar'}
        </button>
      </div>
    </div>
  );
}

export const PainelMestrePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [gmProfile, setGmProfile] = useState<GmProfile | null>(null);
  const [myTables, setMyTables] = useState<MyTableEnhanced[]>([]);
  const [view, setView] = useState<'dashboard' | 'create-table' | 'create-profile'>('dashboard');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableData, setEditingTableData] = useState<any>(null);
  const [togglingTableId, setTogglingTableId] = useState<string | null>(null); // CORREÇÃO B3
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null); // CORREÇÃO B4

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }

    const loadPanelData = async () => {
      setLoadingProfile(true);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1
        const profileRes = await fetch(`${apiUrl}/api/v1/gm/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          if (user.role !== 'gm') {
            setView('create-profile');
          }
          setGmProfile(null);
          setMyTables([]);
          return;
        }

        const profileJson = await profileRes.json();
        const profile = profileJson?.data ?? null;

        if (!profile) {
          if (user.role !== 'gm') {
            setView('create-profile');
          }
          setGmProfile(null);
          setMyTables([]);
          return;
        }

        setGmProfile(profile);

        const tablesRes = await fetch(`${apiUrl}/api/v1/gm/tables`, { // CORREÇÃO A1: Reusar apiUrl
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tablesRes.ok) {
          const tablesJson = await tablesRes.json();
          const tables = tablesJson?.data ?? [];

          // Mapear para MyTableEnhanced com métricas
          const enhancedTables: MyTableEnhanced[] = tables.map((t: any) => ({
            ...t,
            image_url: t.image_url ?? null,
            metrics: {
              views: t.metrics_views ?? 0,
              clicks: t.metrics_clicks ?? 0,
              contacts: t.metrics_contacts ?? 0,
              favorites: t.metrics_favorites ?? 0,
            }
          }));

          setMyTables(enhancedTables);
        } else {
          setMyTables([]);
        }

        setView('dashboard');
      } catch {
        setGmProfile(null);
        setMyTables([]);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadPanelData();
  }, [navigate, token, user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('edit');

    if (editId && token) {
      setEditingTableId(editId);

      const loadTableData = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1
          const response = await fetch(`${apiUrl}/api/v1/tables/${editId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setEditingTableData(data.data);
            setView('create-table');
          } else {
            toast.error('Mesa não encontrada');
            setEditingTableId(null);
          }
        } catch (error) {
          console.error('[PainelMestrePage] Erro ao carregar mesa para edição:', error);
          toast.error('Erro ao carregar mesa');
          setEditingTableId(null);
        }
      };

      loadTableData();
    }
  }, [token, editingTableId]); // CORREÇÃO B2: Adicionar editingTableId nas dependências

  const refreshData = () => {
    // CORREÇÃO A2: Validar token antes de usar
    if (!token) {
      console.warn('[PainelMestrePage] refreshData chamado sem token');
      return;
    }

    // CORREÇÃO C2, C3: Limpar estado de edição e query params
    setEditingTableId(null);
    setEditingTableData(null);
    window.history.replaceState({}, '', '/painel');
    
    setView('dashboard');
    setLoadingProfile(true);

    const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1
    Promise.all([
      fetch(`${apiUrl}/api/v1/gm/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${apiUrl}/api/v1/gm/tables`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([profileRes, tablesRes]) => {
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setGmProfile(profileJson?.data ?? null);
        }


        if (tablesRes.ok) {
          const tablesJson = await tablesRes.json();
          const tables = tablesJson?.data ?? [];

          // Mapear para MyTableEnhanced com métricas
          const enhancedTables: MyTableEnhanced[] = tables.map((t: any) => ({
            ...t,
            image_url: t.image_url ?? null,
            metrics: {
              views: t.metrics_views ?? 0,
              clicks: t.metrics_clicks ?? 0,
              contacts: t.metrics_contacts ?? 0,
              favorites: t.metrics_favorites ?? 0,
            }
          }));

          setMyTables(enhancedTables);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingProfile(false));
  };

  const activeTablesCount = useMemo(
    () => myTables.filter((table) => table.status === 'active').length,
    [myTables]
  );

  const openSlotsCount = useMemo(
    () => myTables.reduce((acc, table) => acc + Math.max(table.slots_total - table.slots_filled, 0), 0),
    [myTables]
  );

  // KPIs de métricas
  const totalViews = useMemo(
    () => myTables.reduce((acc, table) => acc + (table.metrics?.views ?? 0), 0),
    [myTables]
  );

  const totalContacts = useMemo(
    () => myTables.reduce((acc, table) => acc + (table.metrics?.contacts ?? 0), 0),
    [myTables]
  );

  const conversionRate = useMemo(
    () => totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0.0',
    [totalViews, totalContacts]
  );


  const handleToggleTableStatus = async (tableId: string, currentStatus: string, title: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'desativar';

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} mesa "${title}"?`)) return;

    setTogglingTableId(tableId); // CORREÇÃO B3: Mostrar loading
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1
      const endpoint = user?.role === 'admin'
        ? `${apiUrl}/api/v1/gm/admin/tables/${tableId}`
        : `${apiUrl}/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Mesa ${action === 'ativar' ? 'ativada' : 'desativada'}!`);
        refreshData();
      } else {
        const data = await response.json();
        toast.error(data.error || `Erro ao ${action} mesa`);
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao alterar status da mesa:', error);
      toast.error(`Erro ao ${action} mesa`);
    } finally {
      setTogglingTableId(null); // CORREÇÃO B3: Limpar loading
    }
  };

  const handleDeleteTable = async (tableId: string, title: string) => {
    if (!token) return;
    if (!confirm(`Deletar mesa "${title}"? Esta ação não pode ser desfeita.`)) return;

    setDeletingTableId(tableId); // CORREÇÃO B4: Mostrar loading
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''; // CORREÇÃO A1
      const endpoint = user?.role === 'admin'
        ? `${apiUrl}/api/v1/gm/admin/tables/${tableId}`
        : `${apiUrl}/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Mesa deletada!');
        refreshData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar mesa');
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao deletar mesa:', error);
      toast.error('Erro ao deletar mesa');
    } finally {
      setDeletingTableId(null); // CORREÇÃO B4: Limpar loading
    }
  };

  if (!user) return null;

  return (
    <main className="w-full">
      <div className="container mx-auto px-6 py-10">
        {loadingProfile ? (
          <div className="flex justify-center py-20 animate-pulse text-white/40">Carregando painel...</div>
        ) : view === 'create-profile' ? (
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-3">Torne-se um Mestre</h1>
              <p className="text-white/50">Crie seu perfil público e comece a publicar mesas gratuitamente.</p>
            </div>
            <CreateGmProfileForm token={token!} onSuccess={refreshData} />
          </div>
        ) : view === 'create-table' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors cursor-pointer text-sm">← Voltar</button>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <h1 className="text-2xl font-bold">{editingTableId ? 'Editar Mesa' : 'Nova Mesa'}</h1>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <CreateTableForm
                token={token!}
                onSuccess={refreshData}
                initialData={editingTableData || undefined}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {gmProfile ? `Olá, ${gmProfile.nickname ?? `@${gmProfile.slug}`}` : 'Painel do Mestre'}
                </h1>
                {gmProfile && (
                  <p className="text-white/40 mt-1 text-sm">
                    {gmProfile.tables_count} mesa{gmProfile.tables_count !== 1 ? 's' : ''} publicada{gmProfile.tables_count !== 1 ? 's' : ''}
                    {gmProfile.avg_rating ? ` · ★ ${gmProfile.avg_rating.toFixed(1)}` : ''}
                  </p>
                )}
              </div>
              <button
                id="btn-nova-mesa"
                onClick={() => setView('create-table')}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                Nova Mesa
              </button>
            </div>

            {/* DASHBOARD DE MÉTRICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="👁️ Visualizações" value={totalViews} />
              <StatCard label="💬 Contatos" value={totalContacts} />
              <StatCard label="📈 Conversão" value={`${conversionRate}%`} />
            </div>

            {myTables.length > 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <h2 className="text-lg font-bold inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-artificio-orange)]" />
                  Suas mesas publicadas
                </h2>

                <div className="space-y-3">
                  {myTables.map((table) => {
                    const openSlots = Math.max(table.slots_total - table.slots_filled, 0);

                    return (
                      <article
                        key={table.id}
                        className="rounded-xl border border-white/10 bg-[#13213f]/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{table.title}</p>
                          <p className="text-xs text-white/60">{table.system_name ?? 'Sistema livre'} · {table.modality}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/75">
                              {table.slots_filled}/{table.slots_total} ({openSlots} vagas)
                            </span>
                            {table.publisher_role === 'announcer' && (
                              <span className="px-2 py-1 rounded-md border border-slate-300/30 bg-slate-500/15 text-slate-100" id={`painel-mesa-announcer-${table.slug}`}>
                                Apenas anunciante{table.actual_gm_name ? ` · Mestre: ${table.actual_gm_name}` : ''}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/70">
                              {table.contacts?.length ?? 0} contato{(table.contacts?.length ?? 0) !== 1 ? 's' : ''}
                            </span>
                            {table.is_ddal && (
                              <span className="px-2 py-1 rounded-md border border-amber-400/40 bg-amber-500/15 text-amber-100" id={`painel-mesa-ddal-${table.slug}`}>
                                DDAL{table.ddal_code ? ` · ${table.ddal_code}` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-md text-xs border border-white/15 bg-white/5 text-white/70 uppercase">
                            {table.status}
                          </span>
                          <Link
                            to={`/mesas/${table.slug}`}
                            className="px-3 py-2 rounded-lg text-xs border border-white/20 hover:border-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange)] transition-colors"
                            id={`painel-mesa-link-${table.slug}`}
                          >
                            Abrir página
                          </Link>
                          <Link
                            to={`/painel?edit=${table.id}`} // CORREÇÃO C1: Rota correta é /painel, não /painel-mestre
                            className="px-3 py-2 rounded-lg text-xs bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleToggleTableStatus(table.id, table.status, table.title)}
                            disabled={togglingTableId === table.id} // CORREÇÃO B3: Desabilitar durante loading
                            className={`px-3 py-2 rounded-lg text-xs ${table.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {togglingTableId === table.id ? '⏳' : (table.status === 'active' ? 'Desativar' : 'Ativar')}
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id, table.title)}
                            disabled={deletingTableId === table.id} // CORREÇÃO B4: Desabilitar durante loading
                            className="px-3 py-2 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingTableId === table.id ? '⏳' : 'Deletar'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
                <MapPin className="w-10 h-10 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma mesa ainda.</p>
                <p className="text-sm mt-2">Clique em "Nova Mesa" para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
