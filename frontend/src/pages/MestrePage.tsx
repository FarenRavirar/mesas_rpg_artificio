import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Crown, Star, Users } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import type { TableCard } from '../types/tables';
import { applySeo } from '../utils/seo';

interface GmProfilePayload {
  data: {
    id: string;
    slug: string;
    display_name: string;
    bio_long: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    languages: string[];
    specialties: string[];
    badges: string[];
    tables_count: number;
    avg_rating: number | null;
    reviews_count: number;
    created_at: string;
    tables: Array<
      Omit<TableCard, 'gm_slug' | 'gm_avatar_url' | 'gm_display_name'>
    >;
  };
}

export const MestrePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<GmProfilePayload['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!slug) {
        setError('Perfil inválido.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/gm/${slug}`, { signal: controller.signal });

        if (res.status === 404) {
          setError('Mestre não encontrado.');
          setProfile(null);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as GmProfilePayload;
        setProfile(json.data ?? null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar o perfil do mestre.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    applySeo(
      profile ? `${profile.display_name} | Mestre | Artifício Mesas` : 'Mestre | Artifício Mesas',
      profile?.bio_long?.slice(0, 150) || 'Landing pública de mestre com mesas ativas e especialidades.'
    );
  }, [profile]);

  const mappedTables = useMemo(() => {
    if (!profile) return [] as TableCard[];

    return profile.tables.map((table) => ({
      ...table,
      gm_slug: profile.slug,
      gm_avatar_url: profile.avatar_url,
      gm_display_name: profile.display_name,
    }));
  }, [profile]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white px-6 py-16">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <TableCardSkeleton key={idx} />
          ))}
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil indisponível</h1>
          <p className="text-white/70 mb-5">{error ?? 'Não foi possível carregar este perfil.'}</p>
          <Link
            to="/catalogo"
            id="mestre-link-catalogo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] transition-colors"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white pb-16">
      <section className="relative h-56 md:h-72 border-b border-white/10 overflow-hidden">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt={`Capa de ${profile.display_name}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#243a63] via-[#13213f] to-[#0e1a30]" />
        )}
        <div className="absolute inset-0 bg-black/35" />
      </section>

      <section className="container mx-auto px-6 -mt-14 relative z-10">
        <article className="rounded-3xl border border-white/10 bg-[#122243]/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 bg-white/10 shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--color-artificio-orange)]">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                {profile.display_name}
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-artificio-orange)]/20 border border-[var(--color-artificio-orange)]/40 text-[var(--color-artificio-orange)] inline-flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Mestre
                </span>
              </h1>
              <p className="text-white/70 mt-2">{profile.bio_long || 'Narrador da comunidade Artifício RPG.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-white/60">Mesas narradas</p>
              <p className="text-lg font-bold flex items-center gap-1"><Users className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {profile.tables_count}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-white/60">Avaliação</p>
              <p className="text-lg font-bold flex items-center gap-1"><Star className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {profile.avg_rating ?? 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-white/60">Feedbacks</p>
              <p className="text-lg font-bold">{profile.reviews_count}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-white/60">Desde</p>
              <p className="text-lg font-bold flex items-center gap-1"><CalendarDays className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {new Date(profile.created_at).getFullYear()}</p>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold mb-2">Idiomas</h2>
              <p className="text-white/70">{profile.languages?.length ? profile.languages.join(', ') : 'Não informado.'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold mb-2">Especialidades</h2>
              <p className="text-white/70">{profile.specialties?.length ? profile.specialties.join(', ') : 'Não informado.'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold mb-2">Badges</h2>
              <p className="text-white/70">{profile.badges?.length ? profile.badges.join(', ') : 'Não informado.'}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="container mx-auto px-6 mt-10">
        <h2 className="text-2xl font-bold mb-5">Mesas ativas deste mestre</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedTables.length > 0 ? (
            mappedTables.map((table) => <TableCardComponent key={table.id} table={table} />)
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-white/65">
              Este mestre ainda não possui mesas ativas.
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
