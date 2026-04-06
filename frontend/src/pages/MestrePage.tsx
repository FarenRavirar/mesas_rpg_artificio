import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Crown, Star, Users, CheckCircle, Award, MessageCircle } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import { LinksDisplay } from '../components/LinksDisplay';
import type { TableCard } from '../types/tables';
import type { UserLink } from '../hooks/useLinks';
import { applySeo } from '../utils/seo';
import './MestrePage.css';

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
    // Novos campos do perfil completo
    discord_connected?: boolean;
    discord_username?: string | null;
    covil_verified?: boolean;
    experience_years?: number | null;
    average_price?: number | null;
    tables: Array<
      Omit<TableCard, 'gm_slug' | 'gm_avatar_url' | 'gm_display_name'>
    >;
  };
}

export const MestrePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<GmProfilePayload['data'] | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
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
        
        // Buscar links do mestre (se tiver user_id)
        if (json.data?.id) {
          try {
            const linksRes = await fetch(`/api/v1/profile/links?user_id=${json.data.id}`, {
              signal: controller.signal
            });
            if (linksRes.ok) {
              const linksData = await linksRes.json();
              setLinks(linksData.data || []);
            }
          } catch (err) {
            // Links são opcionais, não quebrar se falhar
            console.warn('Failed to load links:', err);
          }
        }
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
    <main className="mestre-page">
      {/* Hero Section - Otimizado para conversão */}
      <section className="hero-section">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt={`Capa de ${profile.display_name}`} className="hero-banner" />
        ) : (
          <div className="hero-banner-gradient" />
        )}
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <div className="hero-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} />
            ) : (
              <div className="hero-avatar-placeholder">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="hero-info">
            <div className="hero-badges">
              <span className="badge badge-mestre">
                <Crown className="w-4 h-4" /> Mestre
              </span>
              {profile.covil_verified && (
                <span className="badge badge-covil">
                  <Award className="w-4 h-4" /> Mestre do Covil
                </span>
              )}
            </div>

            <h1 className="hero-title">{profile.display_name}</h1>
            
            {profile.bio_long && (
              <p className="hero-bio">{profile.bio_long}</p>
            )}

            <div className="hero-stats">
              <div className="stat">
                <Users className="stat-icon" />
                <span className="stat-value">{profile.tables_count}</span>
                <span className="stat-label">Mesas</span>
              </div>
              {profile.experience_years && (
                <div className="stat">
                  <CalendarDays className="stat-icon" />
                  <span className="stat-value">{profile.experience_years}</span>
                  <span className="stat-label">Anos</span>
                </div>
              )}
              {profile.avg_rating && (
                <div className="stat">
                  <Star className="stat-icon" />
                  <span className="stat-value">{profile.avg_rating.toFixed(1)}</span>
                  <span className="stat-label">Avaliação</span>
                </div>
              )}
            </div>

            {/* CTA Principal */}
            {mappedTables.length > 0 && (
              <a href="#mesas" className="cta-button">
                Ver Mesas Disponíveis
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Por que jogar comigo? - Prova Social */}
      <section className="why-section">
        <div className="container">
          <h2 className="section-title">Por que jogar comigo?</h2>
          
          <div className="benefits-grid">
            {profile.experience_years && profile.experience_years > 0 && (
              <div className="benefit-card">
                <CheckCircle className="benefit-icon" />
                <h3>Experiência Comprovada</h3>
                <p>{profile.experience_years} {profile.experience_years === 1 ? 'ano' : 'anos'} mestrando RPG</p>
              </div>
            )}

            {profile.tables_count > 0 && (
              <div className="benefit-card">
                <Users className="benefit-icon" />
                <h3>Mesas Ativas</h3>
                <p>{profile.tables_count} {profile.tables_count === 1 ? 'mesa ativa' : 'mesas ativas'} no momento</p>
              </div>
            )}

            {profile.covil_verified && (
              <div className="benefit-card">
                <Award className="benefit-icon" />
                <h3>Mestre Verificado</h3>
                <p>Selo "Mestre do Covil" - Qualidade garantida pela comunidade</p>
              </div>
            )}

            {profile.discord_connected && profile.discord_username && (
              <div className="benefit-card">
                <MessageCircle className="benefit-icon" />
                <h3>Comunidade Ativa</h3>
                <p>Conectado no Discord: {profile.discord_username}</p>
              </div>
            )}

            {profile.specialties && profile.specialties.length > 0 && (
              <div className="benefit-card">
                <Star className="benefit-icon" />
                <h3>Especialidades</h3>
                <p>{profile.specialties.slice(0, 3).join(', ')}</p>
              </div>
            )}

            {profile.average_price && (
              <div className="benefit-card">
                <CheckCircle className="benefit-icon" />
                <h3>Preço Médio</h3>
                <p>R$ {profile.average_price.toFixed(2)} por sessão</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mesas Ativas - Otimizado para conversão */}
      <section id="mesas" className="tables-section">
        <div className="container">
          <h2 className="section-title">Mesas Disponíveis</h2>
          
          {mappedTables.length > 0 ? (
            <>
              <p className="tables-subtitle">
                Escolha a mesa perfeita para você e comece sua aventura hoje mesmo!
              </p>
              <div className="tables-grid">
                {mappedTables.map((table) => (
                  <TableCardComponent key={table.id} table={table} />
                ))}
              </div>
            </>
          ) : (
            <div className="no-tables">
              <p>Este mestre ainda não possui mesas ativas.</p>
              <p className="no-tables-hint">Volte em breve para conferir novas aventuras!</p>
            </div>
          )}
        </div>
      </section>

      {/* Links e Conteúdo - Prova Social Externa */}
      {links.length > 0 && (
        <section className="links-section">
          <div className="container">
            <LinksDisplay links={links} />
          </div>
        </section>
      )}

      {/* Como Funciona - Reduz fricção */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">Como Funciona</h2>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Escolha sua mesa</h3>
              <p>Navegue pelas mesas disponíveis e escolha a que mais combina com você</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Entre em contato</h3>
              <p>Use os canais de contato para tirar dúvidas e garantir sua vaga</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Comece a jogar</h3>
              <p>Participe da sessão zero e embarque na aventura!</p>
            </div>
          </div>

          <p className="how-it-works-note">
            ✨ Sem experiência? Sem problema. Todas as mesas aceitam iniciantes.
          </p>
        </div>
      </section>

      {/* CTA Final - Urgência */}
      {mappedTables.length > 0 && (
        <section className="final-cta-section">
          <div className="container">
            <div className="final-cta-card">
              <h2>🔥 Últimas vagas disponíveis</h2>
              <p className="final-cta-subtitle">
                {mappedTables.reduce((acc, t) => acc + (t.slots_total - t.slots_filled), 0)} vagas restantes em {mappedTables.length} {mappedTables.length === 1 ? 'mesa' : 'mesas'}
              </p>
              <a href="#mesas" className="cta-button cta-button-large">
                Ver Mesas e Garantir Vaga
              </a>
              <p className="final-cta-hint">
                ⏰ As vagas preenchem rápido. Não perca sua chance!
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
