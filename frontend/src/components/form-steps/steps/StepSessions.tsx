import { SessionRepeater, type SessionSchedule } from '../../SessionRepeater';

interface StepSessionsProps {
  sessions: SessionSchedule[];
  setSessions: (sessions: SessionSchedule[]) => void;
  form: {
    type: string;
    slots_total: string;
    slots_open: string;
  };
  setForm: (form: any) => void;
  frequency: 'semanal' | 'quinzenal' | 'mensal' | 'outros' | null;
  setFrequency: (freq: 'semanal' | 'quinzenal' | 'mensal' | 'outros' | null) => void;
  frequencyCustom: string;
  setFrequencyCustom: (custom: string) => void;
}

export function StepSessions({ 
  sessions, 
  setSessions,
  form,
  setForm,
  frequency,
  setFrequency,
  frequencyCustom,
  setFrequencyCustom,
}: StepSessionsProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#13213f]/60 p-4">
        <SessionRepeater
          sessions={sessions}
          onChange={setSessions}
          disabled={false}
        />
      </div>

      {/* Frequência das Sessões */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="frequency" className="text-sm font-medium text-white/70">
            Frequência das Sessões{(form.type === 'campanha' || form.type === 'oneshot-serie') ? ' *' : ''}
          </label>
          <select
            id="frequency"
            name="frequency"
            value={frequency || ''}
            onChange={(e) => setFrequency(e.target.value as any || null)}
            className="w-full bg-[#1B2A4A] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all cursor-pointer"
          >
            <option value="">Não especificado</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {frequency === 'outros' && (
          <div className="flex flex-col gap-1">
            <label htmlFor="frequency_custom" className="text-sm font-medium text-white/70">
              Frequência Customizada
            </label>
            <input
              id="frequency_custom"
              name="frequency_custom"
              value={frequencyCustom}
              onChange={(e) => setFrequencyCustom(e.target.value)}
              placeholder="Ex: A cada 3 semanas, Bimestral"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
            />
          </div>
        )}
      </div>

      {/* Vagas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="slots_total" className="text-sm font-medium text-white/70">
            Vagas Totais
          </label>
          <input
            id="slots_total"
            name="slots_total"
            type="number"
            min="1"
            max="20"
            value={form.slots_total}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="slots_open" className="text-sm font-medium text-white/70">
            Vagas Abertas para Recrutamento
          </label>
          <input
            id="slots_open"
            name="slots_open"
            type="number"
            min="0"
            max={form.slots_total || "20"}
            value={form.slots_open}
            onChange={handleChange}
            placeholder="Quantas vagas estão abertas para novos jogadores?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
          />
          <p className="text-xs text-white/50 mt-1">
            💡 Vagas abertas devem ser menores ou iguais ao total de jogadores
          </p>
        </div>
      </div>
    </div>
  );
}
