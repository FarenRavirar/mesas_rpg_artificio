import type { TableCard } from '../../types/tables';
import { getSlotsVisualState } from '../../utils/slots';

interface Props {
  totalOpenSlots: number;
  tablesCount: number;
  mappedTables: TableCard[];
}

export function MestreFinalCta({ totalOpenSlots, tablesCount, mappedTables }: Props) {
  const hasUrgentTable = mappedTables.some((t) => {
    const { isUrgent, isFull } = getSlotsVisualState(t);
    return isUrgent && !isFull;
  });

  const isLowStock = totalOpenSlots > 0 && totalOpenSlots <= 5;

  // Só renderiza se há urgência REAL
  if (!hasUrgentTable && !isLowStock) return null;

  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="final-cta-card">
          <h2>🔥 Últimas vagas disponíveis</h2>
          <p className="final-cta-subtitle">
            {totalOpenSlots}{' '}
            {totalOpenSlots === 1 ? 'vaga restante' : 'vagas restantes'} em{' '}
            {tablesCount} {tablesCount === 1 ? 'mesa' : 'mesas'}
          </p>
          <a href="#mesas" className="cta-button cta-button-large">
            Ver mesas e garantir vaga
          </a>
          <p className="final-cta-hint">
            ⏰ As vagas preenchem rápido. Não perca sua chance!
          </p>
        </div>
      </div>
    </section>
  );
}
