import { TableCardComponent } from '../TableCard';
import type { TableCard } from '../../types/tables';

interface MestreTablesSectionProps {
  mappedTables: TableCard[];
}

export function MestreTablesSection({ mappedTables }: MestreTablesSectionProps) {
  return (
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
  );
}
