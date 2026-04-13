import { useEffect, useState, useMemo } from 'react';
import type { FormEvent, InputHTMLAttributes } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import type { TableContact } from '../types/tables';
import { TableCardDashboard } from '../components/TableCardDashboard';
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

const API_BASE = import.meta.env.VITE_API_URL || '';

function CreateGmProfileForm({ onSuccess }: { onSuccess: () => void }) {
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
      const res = await fetch(`${API_BASE}/api/v1/gm/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

export const PainelMestrePage = () => {
  const { user, isAuthenticated } = useAuth();
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
    if (!user || !isAuthenticated) {
      navigate('/');
      return;
    }

    const loadPanelData = async () => {
      setLoadingProfile(true);

      try {
        const profileRes = await fetch(`${API_BASE}/api/v1/gm/me`, {
          credentials: 'include',
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

        const tablesRes = await fetch(`${API_BASE}/api/v1/gm/tables`, {
          credentials: 'include',
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
  }, [navigate, isAuthenticated, user]);

  const [searchParams] = useSearchParams();
  const editIdFromUrl = searchParams.get('edit');

  useEffect(() => {
    if (editIdFromUrl && isAuthenticated) {
      setEditingTableId(editIdFromUrl);

      const loadTableData = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/v1/gm/tables/${editIdFromUrl}`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const { mapTableApiToInitialData } = await import('../features/create-table/utils/mapTableApiToInitialData');
            setEditingTableData(mapTableApiToInitialData(data.data));
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
  }, [isAuthenticated, editIdFromUrl]);

  const refreshData = () => {
    if (!isAuthenticated) {
      console.warn('[PainelMestrePage] refreshData chamado sem autenticação');
      return;
    }

    setEditingTableId(null);
    setEditingTableData(null);
    window.history.replaceState({}, '', '/painel');
    
    setView('dashboard');
    setLoadingProfile(true);

    Promise.all([
      fetch(`${API_BASE}/api/v1/gm/me`, { credentials: 'include' }),
      fetch(`${API_BASE}/api/v1/gm/tables`, { credentials: 'include' }),
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

  // KPIs antigos removidos - agora usando métricas de engajamento

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
    if (!isAuthenticated) return;
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'desativar';

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} mesa "${title}"?`)) return;

    setTogglingTableId(tableId);
    try {
      // CORREÇÃO: Usar PUT /tables/:id em vez de PATCH /tables/:id/status
      const endpoint = user?.role === 'admin'
        ? `${API_BASE}/api/v1/admin/tables/${tableId}`
        : `${API_BASE}/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Mesa ${action === 'ativar' ? 'ativada' : 'desativada'}!`);
        refreshData();
      } else {
        // CORREÇÃO: Tratamento robusto de erro (pode retornar HTML em vez de JSON)
        let errorMessage = `Erro ao ${action} mesa`;
        
        try {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text.slice(0, 200) || errorMessage;
          }
        } catch {
          // Se falhar ao parsear, usar mensagem padrão
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao alterar status da mesa:', error);
      toast.error(`Erro ao ${action} mesa`);
    } finally {
      setTogglingTableId(null);
    }
  };

  const handleDeleteTable = async (tableId: string, title: string) => {
    if (!isAuthenticated) return;
    if (!confirm(`Deletar mesa "${title}"? Esta ação não pode ser desfeita.`)) return;

    setDeletingTableId(tableId);
    try {
      const endpoint = user?.role === 'admin'
        ? `${API_BASE}/api/v1/admin/tables/${tableId}`
        : `${API_BASE}/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Mesa deletada!');
        refreshData();
      } else {
        // CORREÇÃO: Tratamento robusto de erro (pode retornar HTML em vez de JSON)
        let errorMessage = 'Erro ao deletar mesa';
        
        try {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text.slice(0, 200) || errorMessage;
          }
        } catch {
          // Se falhar ao parsear, usar mensagem padrão
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao deletar mesa:', error);
      toast.error('Erro ao deletar mesa');
    } finally {
      setDeletingTableId(null);
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
            <CreateGmProfileForm onSuccess={refreshData} />
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


                {/* GRID DE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myTables.map((table) => (
                    <TableCardDashboard
                      key={table.id}
                      table={table}
                      onEdit={(id: string) => navigate(`/painel?edit=${id}`)}
                      onToggle={(table) => handleToggleTableStatus(table.id, table.status, table.title)}
                      onDelete={(table) => handleDeleteTable(table.id, table.title)}
                      isToggling={togglingTableId === table.id}
                      isDeleting={deletingTableId === table.id}
                    />
                  ))}
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
