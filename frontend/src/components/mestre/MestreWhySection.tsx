import { CheckCircle, Star, Award, MessageCircle, Globe } from 'lucide-react';
import type { MestrePublicData } from '../../hooks/useMestre';

interface MestreWhySectionProps {
  profile: MestrePublicData;
}

export function MestreWhySection({ profile }: MestreWhySectionProps) {
  return (
    <section className="why-section">
      <div className="container">
        <h2 className="section-title">Por que jogar comigo?</h2>

        <div className="benefits-grid">
          {profile.experience_years && profile.experience_years > 0 && (
            <div className="benefit-card">
              <CheckCircle className="benefit-icon" />
              <h3>Experiência Comprovada</h3>
              <p>
                {profile.experience_years} {profile.experience_years === 1 ? 'ano' : 'anos'} mestrando RPG
              </p>
            </div>
          )}

          {profile.specialties && profile.specialties.length > 0 && (
            <div className="benefit-card">
              <Star className="benefit-icon" />
              <h3>Estilo de Jogo</h3>
              <p>{profile.specialties.join(', ')}</p>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div className="benefit-card">
              <Globe className="benefit-icon" />
              <h3>Idiomas</h3>
              <p>{profile.languages.join(', ')}</p>
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
  );
}
