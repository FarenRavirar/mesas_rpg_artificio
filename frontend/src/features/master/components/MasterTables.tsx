import type { MasterViewModel } from '../types/masterView.types';
import { TableHero } from '../../table/components/TableHero';
import { TableActionPanel } from '../../table/components/TableActionPanel';

interface MasterTablesProps {
  vm: MasterViewModel;
}

/**
 * Lista de mesas do mestre
 * 
 * Responsabilidades:
 * - Mostrar portfólio de mesas
 * - REUSO MASSIVO: TableHero + TableActionPanel
 * - Ordenação: mesas com vagas primeiro (já vem do mapper)
 * - Highlight na primeira mesa (mais relevante)
 */
export function MasterTables({ vm }: MasterTablesProps) {
  if (vm.tables.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/60">Este mestre ainda não publicou mesas.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Mesas deste mestre ({vm.tables.length})</h2>
      
      {vm.tables.map((table, index) => (
        <div 
          key={table.id} 
          className={`rounded-2xl border bg-white/5 p-5 space-y-4 ${
            index === 0 
              ? 'border-purple-500/50 ring-2 ring-purple-500/30' 
              : 'border-white/10'
          }`}
        >
          {/* REUSO: TableHero em modo compacto */}
          <TableHero vm={table} variant="compact" />
          
          {/* REUSO: TableActionPanel em modo compacto */}
          <TableActionPanel vm={table} variant="compact" />
        </div>
      ))}
    </section>
  );
}
