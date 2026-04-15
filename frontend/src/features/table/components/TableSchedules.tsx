import type { TableViewModel } from '../types/tableView.types';

interface TableSchedulesProps {
  vm: TableViewModel;
}

/**
 * Exibe horários das sessões
 * Reutilizável em: MesaPage, Preview, Catálogo expandido
 */
export function TableSchedules({ vm }: TableSchedulesProps) {
  // CORREÇÃO REG-08: Sempre renderizar seção, mesmo se vazio (com fallback)
  const hasSchedules = vm.schedules && vm.schedules.length > 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-bold mb-4">📅 Horários das Sessões</h2>
      
      {!hasSchedules ? (
        <p className="text-sm text-white/60">
          Horários não informados pelo mestre. Entre em contato para mais detalhes.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {vm.schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#13213f] border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🗓️</span>
                  <div>
                    <p className="font-semibold text-white">
                      {schedule.day_of_week}
                    </p>
                    <p className="text-sm text-white/60">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                  </div>
                </div>
                
                {schedule.frequency && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                    {schedule.frequency}
                  </span>
                )}
              </div>
            ))}
          </div>

          {vm.startsAt && (
            <p className="mt-4 text-sm text-white/60">
              Início: {new Date(vm.startsAt).toLocaleDateString('pt-BR')}
            </p>
          )}

        </>
      )}
    </section>
  );
}
