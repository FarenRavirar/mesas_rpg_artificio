import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, Compass, Crown, Globe, MapPin, ShieldCheck, Swords, Users } from 'lucide-react';
import type { TableDetail } from '../types/tables';
import { applySeo } from '../utils/seo';

const modalityLabel: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

const experienceLabel: Record<string, string> = {
  todos: 'Todos os níveis',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  veterano: 'Veterano',
};

export const MesaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [table, setTable] = useState<TableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadTable = async () => {
      if (!slug) {
        setError('Mesa inválida.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/tables/${slug}`, { signal: controller.signal });

        if (res.status === 404) {
          setError('Mesa não encontrada.');
          setTable(null);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setTable(json.data ?? null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar esta mesa no momento.');
      } finally {
        setLoading(false);
      }
    };

    loadTable();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!table) {
      applySeo('Mesa | Artifício Mesas', 'Detalhes de uma mesa de RPG no portal Artifício Mesas.');
      return;
    }

    applySeo(
      `${table.title} | Artifício Mesas`,
      table.description?.slice(0, 150) || `Conheça os detalhes da mesa ${table.title} no Artifício Mesas.`
    );
  }, [table]);

  const slotsLeft = useMemo(() => {
    if (!table) return 0;
    return Math.max(0, table.slots_total - table.slots_filled);
  }, [table]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center">
        <p className="animate-pulse text-white/70">Carregando aventura...</p>
      </main>
    );
  }

  if (error || !table) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Ops!</h1>
          <p className="text-white/70 mb-5">{error ?? 'Mesa não encontrada.'}</p>
          <Link
            to="/catalogo"
            id="mesa-link-voltar-catalogo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] transition-colors"
          >
            <Compass className="w-4 h-4" /> Voltar ao catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white pb-16">
      <header className="container mx-auto px-6 py-6 text-sm text-white/60">
        <nav aria-label="breadcrumb" className="flex items-center gap-2">
          <Link to="/" className="hover:text-white transition-colors" id="mesa-breadcrumb-home">Home</Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-white transition-colors" id="mesa-breadcrumb-catalogo">Catálogo</Link>
          <span>/</span>
          <span className="text-white/85">{table.title}</span>
        </nav>
      </header>

      <section className="container mx-auto px-6">
        <article className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-5">
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-white/10">
              {table.cover_url ? (
                <img src={table.cover_url} alt={table.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a3f6d] to-[#131f38]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#091427] via-[#091427]/45 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.type}</span>
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.audience}</span>
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.system_name ?? 'Sistema livre'}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{table.title}</h1>
              </div>
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold mb-2">Sobre esta Mesa</h2>
              <p className="text-white/80 leading-relaxed">{table.description || 'Sem descrição detalhada.'}</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold mb-3">Segurança e Alertas</h2>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold mb-1">Content Warnings</p>
                  <p className="text-white/70">{table.content_warnings?.length ? table.content_warnings.join(', ') : 'Não informado.'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold mb-1">Safety Tools</p>
                  <p className="text-white/70">{table.safety_tools?.length ? table.safety_tools.join(', ') : 'Não informado.'}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold">Resumo operacional</h2>

            <div className="space-y-2 text-sm text-white/80">
              <p className="flex items-center gap-2"><Users className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.slots_filled}/{table.slots_total} jogadores ({slotsLeft} vagas)</p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {modalityLabel[table.modality] ?? table.modality}</p>
              <p className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.starts_at ? new Date(table.starts_at).toLocaleString('pt-BR') : 'Data a combinar'}</p>
              <p className="flex items-center gap-2"><Swords className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {experienceLabel[table.experience_level] ?? table.experience_level}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.city && table.state ? `${table.city} - ${table.state}` : 'Online / não informado'}</p>
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--color-artificio-orange)]" /> Idioma: {table.language}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#13213f] p-4">
              <p className="text-xs text-white/60 mb-1">Investimento</p>
              <p className="font-bold text-lg text-[var(--color-artificio-orange)]">
                {table.price_type === 'gratuita' ? 'Mesa Gratuita' : `R$ ${table.price_value ?? 0}`}
              </p>
              {table.price_frequency && <p className="text-xs text-white/60 mt-1">Cobrança por {table.price_frequency}</p>}
            </div>

            {table.gm_slug && (
              <Link
                to={`/mestre/${table.gm_slug}`}
                id="mesa-link-mestre"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange)] transition-colors"
              >
                <Crown className="w-4 h-4" /> Ver perfil do mestre
              </Link>
            )}
          </aside>
        </article>
      </section>
    </main>
  );
};
