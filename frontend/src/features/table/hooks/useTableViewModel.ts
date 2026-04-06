import { useMemo } from 'react';
import type { TableDetail } from '../../../types/tables';
import type { TableViewModel } from '../types/tableView.types';
import { mapTableToView } from '../mappers/tableViewMapper';

/**
 * Hook para transformar TableDetail em TableViewModel
 * 
 * Ponto de extensão para:
 * - Feature flags
 * - Tracking/analytics
 * - Data enrichment (ranking, score)
 * - A/B experiments
 * 
 * Usa useMemo para otimização (evita recalcular em cada render)
 */
export function useTableViewModel(table: TableDetail): TableViewModel {
  return useMemo(() => mapTableToView(table), [table]);
}
