import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Compass, PlusCircle, LogOut, ChevronRight, Dice1, Globe, MapPin, Users } from 'lucide-react';

// ───── Tipos locais ───────────────────────────────────────────────────────────

interface GmProfile {
  id: string;
  slug: string;
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
  status: string;
  modality: string;
  slots_total: number;
  slots_filled: number;
  system_name: string | null;
  created_at: string;
}

// ───── Sub-componentes ────────────────────────────────────────────────────────

function InputField({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
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

function SelectField({ label, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <select
        id={id}
        {...props}
        className="w-full bg-[#1B2A4A] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

// ───── Formulário de Criação de Mesa ─────────────────────────────────────────

function CreateTableForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [systems, setSystems] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    system_id: '',
    type: 'campanha',
    audience: 'livre',
    modality: 'online',
    price_type: 'gratuita',
    price_value: '',
    slots_total: '4',
    experience_level: 'todos',
    starts_at: '',
    language: 'Português',
  });

  // Carrega sistemas disponíveis
  useEffect(() => {
    fetch('/api/v1/systems')
      .then(r => r.json())
      .then(d => d.data && setSystems(d.data))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        price_value: form.price_value ? parseFloat(form.price_value) : null,
        slots_total: parseInt(form.slots_total),
        starts_at: form.starts_at || null,
        system_id: form.system_id || null,
      };

      const res = await fetch('/api/v1/gm/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro desconhecido');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputField label="Título da Mesa *" id="title" name="title" value={form.title} onChange={handleChange} placeholder="Ex: A Queda do Império Sombrio" required />
        </div>

        <SelectField label="Sistema de RPG" id="system_id" name="system_id" value={form.system_id} onChange={handleChange}>
          <option value="">— Selecione um sistema —</option>
          {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectField>

        <SelectField label="Tipo de Mesa *" id="type" name="type" value={form.type} onChange={handleChange}>
          <option value="campanha">Campanha</option>
          <option value="one-shot">One-Shot</option>
          <option value="oneshot-serie">One-Shot em Série</option>
          <option value="aberta">Mesa Aberta</option>
        </SelectField>

        <SelectField label="Modalidade *" id="modality" name="modality" value={form.modality} onChange={handleChange}>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
          <option value="hibrida">Híbrida</option>
        </SelectField>

        <SelectField label="Audiência" id="audience" name="audience" value={form.audience} onChange={handleChange}>
          <option value="livre">Livre (Todos os públicos)</option>
          <option value="adultos">Adultos (+18)</option>
        </SelectField>

        <SelectField label="Cobrança" id="price_type" name="price_type" value={form.price_type} onChange={handleChange}>
          <option value="gratuita">Gratuita</option>
          <option value="paga">Paga</option>
        </SelectField>

        {form.price_type === 'paga' && (
          <InputField label="Valor (R$)" id="price_value" name="price_value" type="number" min="0" step="0.01" value={form.price_value} onChange={handleChange} placeholder="Ex: 25.00" />
        )}

        <SelectField label="Nível de Experiência" id="experience_level" name="experience_level" value={form.experience_level} onChange={handleChange}>
          <option value="todos">Todos os Níveis</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="veterano">Veterano</option>
        </SelectField>

        <InputField label="Vagas Totais" id="slots_total" name="slots_total" type="number" min="1" max="20" value={form.slots_total} onChange={handleChange} />
        <InputField label="Data de Início (opcional)" id="starts_at" name="starts_at" type="datetime-local" value={form.starts_at} onChange={handleChange} />
        <InputField label="Idioma" id="language" name="language" value={form.language} onChange={handleChange} placeholder="Português" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-white/70">Descrição da Mesa</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Descreva sua campanha, o tom da história, o que esperar..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        id="btn-criar-mesa"
        className="w-full py-4 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors cursor-pointer"
      >
        {loading ? 'Publicando...' : 'Publicar Mesa'}
      </button>
    </form>
  );
}

// ───── Formulário de Criação de Perfil GM ────────────────────────────────────

function CreateGmProfileForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/gm/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, bio_long: bio }),
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
        label="Identificador (slug) *"
        id="gm-slug"
        value={slug}
        onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="ex: mestre-joao"
        required
      />
      <p className="text-xs text-white/30 -mt-2">Apenas letras minúsculas, números e hífens. Não pode ser alterado depois.</p>
      <div className="flex flex-col gap-1">
        <label htmlFor="gm-bio" className="text-sm font-medium text-white/70">Bio (opcional)</label>
        <textarea
          id="gm-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
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

// ───── Página Principal do Painel ────────────────────────────────────────────

export const PainelMestrePage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [gmProfile, setGmProfile] = useState<GmProfile | null>(null);
  const [myTables, _setMyTables] = useState<MyTable[]>([]);
  const [view, setView] = useState<'dashboard' | 'create-table' | 'create-profile'>('dashboard');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }

    // Buscar perfil GM do usuário logado
    fetch('/api/v1/gm/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setGmProfile(data.data);
        else if (user.role !== 'gm') setView('create-profile');
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user, token, navigate]);

  const refreshData = () => {
    setView('dashboard');
    setLoadingProfile(true);
    fetch('/api/v1/gm/me', { headers: { Authorization: `Bearer ${token!}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setGmProfile(data.data); })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-artificio-blue)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#1B2A4A]/80 border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-[var(--color-artificio-orange)] font-bold text-xl tracking-wide cursor-pointer">
            <Compass className="w-6 h-6" />
            <span>Artifício<span className="text-white">Mesas</span></span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">Painel do Mestre</span>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        {loadingProfile ? (
          <div className="flex justify-center py-20 animate-pulse text-white/40">Carregando perfil...</div>
        ) : view === 'create-profile' ? (
          // Onboarding — Criar perfil GM
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-3">Torne-se um Mestre</h1>
              <p className="text-white/50">Crie seu perfil público e comece a publicar mesas gratuitamente.</p>
            </div>
            <CreateGmProfileForm token={token!} onSuccess={refreshData} />
          </div>
        ) : view === 'create-table' ? (
          // Formulário de Nova Mesa
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors cursor-pointer text-sm">← Voltar</button>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <h1 className="text-2xl font-bold">Nova Mesa</h1>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <CreateTableForm token={token!} onSuccess={refreshData} />
            </div>
          </div>
        ) : (
          // Dashboard principal
          <div className="space-y-8">
            {/* Boas vindas */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {gmProfile ? `Olá, @${gmProfile.slug}` : 'Painel do Mestre'}
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

            {/* Cards rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Mesas Ativas', value: myTables.filter(t => t.status === 'active').length, icon: <Globe className="w-5 h-5" /> },
                { label: 'Vagas Abertas', value: myTables.reduce((a, t) => a + (t.slots_total - t.slots_filled), 0), icon: <Users className="w-5 h-5" /> },
                { label: 'Total de Mesas', value: gmProfile?.tables_count ?? 0, icon: <Dice1 className="w-5 h-5" /> },
              ].map(card => (
                <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-artificio-orange)]/10 text-[var(--color-artificio-orange)] flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-white/40 text-sm">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Estado vazio */}
            {myTables.length === 0 && (
              <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
                <MapPin className="w-10 h-10 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma mesa ainda.</p>
                <p className="text-sm mt-2">Clique em "Nova Mesa" para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
