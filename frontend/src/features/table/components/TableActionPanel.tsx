import type { TableViewModel, TableActionPanelVariant } from '../types/tableView.types';
import { getButtonStyle, getUrgencyColor, handleCTA } from '../utils/uiHelpers';

interface TableActionPanelProps {
  vm: TableViewModel;
  variant?: TableActionPanelVariant;
}

/**
 * Action Panel - Motor de decisão
 * Ordem fixa: CTA → Urgência → Preço → Info → Contato
 * Reutilizável em: MesaPage, Painel do Mestre, Card expandido
 */
export function TableActionPanel({ vm, variant = 'full' }: TableActionPanelProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      
      {/* CTA Primário */}
      <button
        disabled={vm.cta.disabled}
        onClick={() => handleCTA(vm.cta)}
        className={`w-full py-3 rounded-xl font-semibold ${getButtonStyle(vm.cta.variant)}`}
      >
        {vm.cta.label}
      </button>

      {/* Urgência (Vagas) */}
      <div className={`text-sm font-semibold ${getUrgencyColor(vm.urgency.tone)}`}>
        {vm.urgency.label}
      </div>

      {/* Preço */}
      {vm.visibility.showPrice && vm.price !== undefined && (
        <div className="p-4 rounded-xl bg-[#13213f] border border-orange-400/30">
          <p className="text-xs text-white/60 uppercase tracking-wide">Investimento</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">
            R$ {vm.price}
            {vm.priceFrequency && (
              <span className="text-sm text-white/60 font-normal ml-1">
                / {vm.priceFrequency}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Info Rápida */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Sistema</span>
          <span className="text-white font-medium">{vm.system}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Experiência</span>
          <span className="text-white font-medium">{vm.experience}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Modalidade</span>
          <span className="text-white font-medium">{vm.modality}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Vagas</span>
          <span className="text-white font-medium">
            {vm.slotsFilled}/{vm.slotsTotal}
          </span>
        </div>
      </div>

      {/* Contatos */}
      {vm.contacts.length > 0 && (
        <div id="mesa-contato" className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
            Como participar
          </h3>
          <div className="space-y-2">
            {vm.contacts.map((contact, idx) => (
              <a
                key={idx}
                href={contact.value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-orange-400 transition"
              >
                <span className="text-lg">{getContactIcon(contact.channel)}</span>
                <span>{contact.label || contact.channel}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Variante Owner (Painel do Mestre) */}
      {variant === 'owner' && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <button className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition">
            ✏️ Editar mesa
          </button>
          <button className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition">
            🗑️ Excluir mesa
          </button>
        </div>
      )}
    </aside>
  );
}

/**
 * Helper para ícones de contato
 */
function getContactIcon(type: string): string {
  const icons: Record<string, string> = {
    whatsapp: '💬',
    discord: '🎮',
    email: '📧',
    form: '📝',
    other: '🔗',
  };
  return icons[type.toLowerCase()] || icons.other;
}
