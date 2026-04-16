import { CalendarDays, Crown, Star, Users, Award } from 'lucide-react';
import type { TableCard } from '../../types/tables';
import type { MestrePublicData } from '../../hooks/useMestre';

interface MestreHeroProps {
  profile: MestrePublicData;
  mappedTables: TableCard[];
  totalOpenSlots: number;
}

export function MestreHero({ profile, mappedTables, totalOpenSlots }: MestreHeroProps) {
  return (
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
            <div className="hero-avatar-placeholder">{profile.display_name.charAt(0).toUpperCase()}</div>
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

          <h1 className="hero-title">Jogue RPG com {profile.display_name}</h1>

          {profile.specialties && profile.specialties.length > 0 ? (
            <p className="hero-bio">{profile.specialties.slice(0, 2).join(' • ')}</p>
          ) : profile.bio_long ? (
            <p className="hero-bio">{profile.bio_long}</p>
          ) : (
            <p className="hero-bio">Campanhas narrativas imersivas</p>
          )}

          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
            {profile.tables_count > 0 && `${profile.tables_count} ${profile.tables_count === 1 ? 'mesa criada' : 'mesas criadas'}`}
            {profile.reviews_count > 0 && ` • ${profile.reviews_count} ${profile.reviews_count === 1 ? 'avaliação' : 'avaliações'}`}
            {profile.average_price && ` • R$ ${profile.average_price.toFixed(0)} / sessão`}
          </p>

          <div className="hero-stats">
            {profile.experience_years && profile.experience_years > 0 && (
              <div className="stat">
                <CalendarDays className="stat-icon" />
                <span className="stat-value">{profile.experience_years}</span>
                <span className="stat-label">Anos mestrando</span>
              </div>
            )}
            {profile.avg_rating && (
              <div className="stat">
                <Star className="stat-icon" />
                <span className="stat-value">{profile.avg_rating.toFixed(1)}</span>
                <span className="stat-label">Avaliação</span>
              </div>
            )}
            {mappedTables.length > 0 && (
              <div className="stat">
                <Users className="stat-icon" />
                <span className="stat-value">{totalOpenSlots}</span>
                <span className="stat-label">Vagas abertas</span>
              </div>
            )}
          </div>

          {mappedTables.length > 0 && (
            <a href="#mesas" className="cta-button">
              Ver Mesas Disponíveis
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
