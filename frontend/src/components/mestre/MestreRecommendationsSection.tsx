interface MestreRecommendationsSectionProps {
  recommendations: string[];
}

export function MestreRecommendationsSection({ recommendations }: MestreRecommendationsSectionProps) {
  return (
    <section className="recommendations-section mestre-private-panel mestre-private-panel--recommendations">
      <div className="container mestre-private-panel-container">
        <h2 className="section-title">🚀 Recomendações</h2>
        <p className="mestre-private-panel-note">🔒 Visível apenas para você</p>
        <ul className="mestre-private-list">
          {recommendations.map((rec, i) => (
            <li key={i} className="mestre-private-item">
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
