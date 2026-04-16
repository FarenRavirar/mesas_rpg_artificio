interface MestreInsightsSectionProps {
  insightsLoading: boolean;
  insights: string[];
}

export function MestreInsightsSection({ insightsLoading, insights }: MestreInsightsSectionProps) {
  return (
    <section className="insights-section mestre-private-panel mestre-private-panel--insights">
      <div className="container mestre-private-panel-container">
        <h2 className="section-title">📊 Insights das suas mesas</h2>
        <p className="mestre-private-panel-note">🔒 Visível apenas para você</p>
        {insightsLoading ? (
          <p className="mestre-private-panel-loading">Carregando insights...</p>
        ) : (
          <ul className="mestre-private-list">
            {insights.map((insight, i) => (
              <li key={i} className="mestre-private-item">
                {insight}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
