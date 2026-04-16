interface MestreFinalCtaProps {
  totalOpenSlots: number;
  tablesCount: number;
}

export function MestreFinalCta({ totalOpenSlots, tablesCount }: MestreFinalCtaProps) {
  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="final-cta-card">
          <h2>🔥 Últimas vagas disponíveis</h2>
          <p className="final-cta-subtitle">
            {totalOpenSlots} vagas restantes em {tablesCount} {tablesCount === 1 ? 'mesa' : 'mesas'}
          </p>
          <a href="#mesas" className="cta-button cta-button-large">
            Ver Mesas e Garantir Vaga
          </a>
          <p className="final-cta-hint">⏰ As vagas preenchem rápido. Não perca sua chance!</p>
        </div>
      </div>
    </section>
  );
}
