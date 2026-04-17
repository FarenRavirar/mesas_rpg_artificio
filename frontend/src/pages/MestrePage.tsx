import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LinksDisplay } from '../components/LinksDisplay';
import { MestreBio } from '../components/mestre/MestreBio';
import { MestreClosedGroupSection } from '../components/mestre/MestreClosedGroupSection';
import { MestreError } from '../components/mestre/MestreError';
import { MestreFinalCta } from '../components/mestre/MestreFinalCta';
import { MestreHero } from '../components/mestre/MestreHero';
import { MestreInsightsSection } from '../components/mestre/MestreInsightsSection';
import { MestreNotFound } from '../components/mestre/MestreNotFound';
import { MestreRecommendationsSection } from '../components/mestre/MestreRecommendationsSection';
import { MestreSellingPoints } from '../components/mestre/MestreSellingPoints';
import { MestreSkeleton } from '../components/mestre/MestreSkeleton';
import { MestreTablesSection } from '../components/mestre/MestreTablesSection';
import { applySeo } from '../utils/seo';
import { useMestre } from '../hooks/useMestre';
import { useMestreInsights } from '../hooks/useMestreInsights';
import './MestrePage.css';

export const MestrePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const {
    profile,
    links,
    mappedTables,
    totalOpenSlots,
    canSeeInsights,
    loading,
    error,
  } = useMestre(slug);

  const { metrics, recommendations, insightsLoading } = useMestreInsights({
    slug,
    canSeeInsights,
  });

  useEffect(() => {
    applySeo(
      profile
        ? `${profile.display_name} | Mestre | Artifício Mesas`
        : 'Mestre | Artifício Mesas',
      profile?.tagline ||
        profile?.bio_long?.slice(0, 150) ||
        'Landing pública de mestre com mesas ativas e especialidades.'
    );
  }, [profile]);

  if (loading) return <MestreSkeleton />;
  if (error === 'Mestre não encontrado.') return <MestreNotFound />;
  if (error || !profile) {
    return <MestreError message={error ?? 'Não foi possível carregar este perfil.'} />;
  }

  return (
    <main className="mestre-page">
      <MestreHero
        profile={profile}
        mappedTables={mappedTables}
        totalOpenSlots={totalOpenSlots}
      />

      <MestreBio profile={profile} />

      <MestreSellingPoints sellingPoints={profile.selling_points ?? []} />

      <MestreTablesSection mappedTables={mappedTables} />

      <MestreClosedGroupSection closedGroup={profile.closed_group} />

      {canSeeInsights && (insightsLoading || metrics.length > 0) && (
        <MestreInsightsSection insightsLoading={insightsLoading} metrics={metrics} />
      )}

      {canSeeInsights && recommendations.length > 0 && (
        <MestreRecommendationsSection recommendations={recommendations} />
      )}

      {links.length > 0 && (
        <section id="contato" className="links-section">
          <div className="container">
            <LinksDisplay links={links} />
          </div>
        </section>
      )}

      {mappedTables.length > 0 && (
        <MestreFinalCta
          totalOpenSlots={totalOpenSlots}
          tablesCount={mappedTables.length}
          mappedTables={mappedTables}
        />
      )}
    </main>
  );
};
