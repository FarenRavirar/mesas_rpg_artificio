import type { ChangeEvent, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface StepConfigProps {
  form: {
    type: string;
    modality: string;
    audience: string;
    age_rating: string;
    price_type: string;
    price_value: string;
    slots_total: string;
    experience_level: string;
    table_level: string;
    language: string;
  };
  setForm: (form: any) => void;
  publisherRole: 'gm' | 'announcer';
  setPublisherRole: (role: 'gm' | 'announcer') => void;
  actualGmName: string;
  setActualGmName: (name: string) => void;
  gamePlatform: string;
  setGamePlatform: (platform: string) => void;
  communicationPlatform: string;
  setCommunicationPlatform: (platform: string) => void;
  frequency: 'semanal' | 'quinzenal' | 'mensal' | 'outros' | null;
  setFrequency: (freq: 'semanal' | 'quinzenal' | 'mensal' | 'outros' | null) => void;
  frequencyCustom: string;
  setFrequencyCustom: (custom: string) => void;
}

function InputField({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <input
        id={id}
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
      />
    </div>
  );
}

function SelectField({ label, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <select
        id={id}
        {...props}
        className="w-full bg-[#1B2A4A] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

export function StepConfig({
  form,
  setForm,
  publisherRole,
  setPublisherRole,
  actualGmName,
  setActualGmName,
  gamePlatform,
  setGamePlatform,
  communicationPlatform,
  setCommunicationPlatform,
  frequency,
  setFrequency,
  frequencyCustom,
  setFrequencyCustom,
}: StepConfigProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isOnline = form.modality === 'online' || form.modality === 'hibrida';

  return (
    <div className="space-y-6">
      {/* Publisher Role */}
      <div className="rounded-2xl border border-white/10 bg-[#13213f]/60 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-white">Quem está publicando esta mesa?</p>
          <p className="text-xs text-white/60 mt-1">Você pode publicar como mestre narrador ou como apenas anunciante.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            htmlFor="publisher-role-gm"
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              publisherRole === 'gm'
                ? 'border-[var(--color-artificio-orange)] bg-[var(--color-artificio-orange)]/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <input
              id="publisher-role-gm"
              type="radio"
              name="publisher_role"
              className="sr-only"
              checked={publisherRole === 'gm'}
              onChange={() => setPublisherRole('gm')}
            />
            <p className="text-sm font-semibold">Sou o mestre desta mesa</p>
            <p className="text-xs text-white/60 mt-1">Sem selo de anunciante.</p>
          </label>

          <label
            htmlFor="publisher-role-announcer"
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              publisherRole === 'announcer'
                ? 'border-[var(--color-artificio-orange)] bg-[var(--color-artificio-orange)]/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <input
              id="publisher-role-announcer"
              type="radio"
              name="publisher_role"
              className="sr-only"
              checked={publisherRole === 'announcer'}
              onChange={() => setPublisherRole('announcer')}
            />
            <p className="text-sm font-semibold">Sou apenas anunciante</p>
            <p className="text-xs text-white/60 mt-1">A mesa exibirá o selo "Apenas anunciante".</p>
          </label>
        </div>

        {publisherRole === 'announcer' && (
          <InputField
            label="Nome do mestre real *"
            id="actual-gm-name"
            name="actual_gm_name"
            value={actualGmName}
            onChange={(event) => setActualGmName(event.target.value)}
            placeholder="Ex: Mestre Arandur"
            required
          />
        )}
      </div>

      {/* Configurações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Tipo de Mesa *" id="type" name="type" value={form.type} onChange={handleChange}>
          <option value="campanha">Campanha</option>
          <option value="one-shot">One-Shot</option>
          <option value="oneshot-serie">One-Shot em Série</option>
          <option value="aberta">Mesa Aberta</option>
        </SelectField>

        <SelectField label="Modalidade *" id="modality" name="modality" value={form.modality} onChange={handleChange}>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
          <option value="hibrida">Híbrida</option>
        </SelectField>

        {/* Plataformas (apenas para online/híbrida) */}
        {isOnline && (
          <>
            <InputField
              label="Plataforma de Jogo"
              id="game_platform"
              name="game_platform"
              value={gamePlatform}
              onChange={(e) => setGamePlatform(e.target.value)}
              placeholder="Ex: Roll20, Foundry VTT, Teatro da Mente"
            />

            <InputField
              label="Plataforma de Comunicação"
              id="communication_platform"
              name="communication_platform"
              value={communicationPlatform}
              onChange={(e) => setCommunicationPlatform(e.target.value)}
              placeholder="Ex: Discord, Zoom, Google Meet"
            />
          </>
        )}

        <SelectField label="Faixa Etária *" id="age_rating" name="age_rating" value={form.age_rating} onChange={handleChange}>
          <option value="livre">Livre (Todos os públicos)</option>
          <option value="+10">+10 anos</option>
          <option value="+12">+12 anos</option>
          <option value="+14">+14 anos</option>
          <option value="+16">+16 anos</option>
          <option value="+18">+18 anos</option>
        </SelectField>

        <SelectField label="Audiência (legado)" id="audience" name="audience" value={form.audience} onChange={handleChange}>
          <option value="livre">Livre (Todos os públicos)</option>
          <option value="adultos">Adultos (+18)</option>
        </SelectField>

        <SelectField label="Cobrança" id="price_type" name="price_type" value={form.price_type} onChange={handleChange}>
          <option value="gratuita">Gratuita</option>
          <option value="paga">Paga</option>
        </SelectField>

        {form.price_type === 'paga' && (
          <InputField
            label="Valor (R$)"
            id="price_value"
            name="price_value"
            type="number"
            min="0"
            step="0.01"
            value={form.price_value}
            onChange={handleChange}
            placeholder="Ex: 25.00"
          />
        )}

        <SelectField
          label="Nível de Experiência do Jogador"
          id="experience_level"
          name="experience_level"
          value={form.experience_level}
          onChange={handleChange}
        >
          <option value="todos">Todos os Níveis</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="veterano">Veterano</option>
        </SelectField>

        <SelectField
          label="Nível de Complexidade da Mesa"
          id="table_level"
          name="table_level"
          value={form.table_level}
          onChange={handleChange}
        >
          <option value="todos">Todos os Níveis</option>
          <option value="iniciante">Iniciante (regras simples)</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado (regras complexas)</option>
        </SelectField>

        <SelectField
          label={`Frequência das Sessões${(form.type === 'campanha' || form.type === 'oneshot-serie') ? ' *' : ''}`}
          id="frequency"
          name="frequency"
          value={frequency || ''}
          onChange={(e) => setFrequency(e.target.value as any || null)}
        >
          <option value="">Não especificado</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
          <option value="outros">Outros</option>
        </SelectField>

        {frequency === 'outros' && (
          <InputField
            label="Frequência Customizada"
            id="frequency_custom"
            name="frequency_custom"
            value={frequencyCustom}
            onChange={(e) => setFrequencyCustom(e.target.value)}
            placeholder="Ex: A cada 3 semanas, Bimestral"
          />
        )}

        <InputField
          label="Vagas Totais"
          id="slots_total"
          name="slots_total"
          type="number"
          min="1"
          max="20"
          value={form.slots_total}
          onChange={handleChange}
        />

        <InputField
          label="Idioma"
          id="language"
          name="language"
          value={form.language}
          onChange={handleChange}
          placeholder="Português"
        />
      </div>
    </div>
  );
}
