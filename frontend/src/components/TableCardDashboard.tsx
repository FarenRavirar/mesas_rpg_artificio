import { getSlotsVisualState } from '../utils/slots';

interface TableMetrics {
  views: number;
  clicks: number;
  contacts: number;
  favorites: number;
}

interface MyTableEnhanced {
  id: string;
  slug: string;
  title: string;
  status: string;
  modality: string;
  slots_total: number;
  slots_filled: number;
  slots_open?: number; // REQ-02: Vagas abertas para recrutamento
  system_name: string | null;
  image_url?: string | null;
  metrics?: TableMetrics;
}

interface TableCardDashboardProps {
  table: MyTableEnhanced;
  onEdit: (id: string) => void;
  onToggle: (table: MyTableEnhanced) => void;
  onDelete: (table: MyTableEnhanced) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

export function TableCardDashboard({
  table,
  onEdit,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: TableCardDashboardProps) {
  const { open: openSlots } = getSlotsVisualState(table);
  const metrics = table.metrics || { views: 0, clicks: 0, contacts: 0, favorites: 0 };

  // Feedback inteligente: muitas views mas zero contatos
  const hasPerformanceIssue = metrics.views > 50 && metrics.contacts === 0;
  
  // UX: Identificar mesas desativadas
  const isInactive = table.status === 'cancelled' || table.status === 'ended';

  return (
    <div className={`relative rounded-2xl border p-4 flex flex-col gap-3 hover:scale-[1.01] transition-all ${
      isInactive 
        ? 'border-white/5 bg-[#13213f]/40 opacity-60' // Desativada: borda sutil, fundo escurecido, opacidade reduzida
        : 'border-white/10 bg-[#13213f]' // Ativa: estilo normal
    }`}>
      {/* BADGE DE STATUS - Apenas para mesas desativadas */}
      {isInactive && (
        <div className="absolute top-2 right-2 bg-gray-500/80 text-white text-xs px-2 py-1 rounded-md font-medium z-10">
          {table.status === 'cancelled' ? '⏸️ Desativada' : '🏁 Encerrada'}
        </div>
      )}

      {/* IMAGE */}
      <a 
        href={`/mesas/${table.slug}`}
        className={`block h-32 rounded-lg overflow-hidden bg-white/10 hover:opacity-90 transition-opacity cursor-pointer ${
          isInactive ? 'grayscale' : '' // Desativada: imagem em escala de cinza
        }`}
      >
        {table.image_url ? (
          <img src={table.image_url} alt={table.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            ⚠️ Sem imagem
          </div>
        )}
      </a>

      {/* TITLE */}
      <div>
        <a 
          href={`/mesas/${table.slug}`}
          className={`font-semibold line-clamp-2 hover:text-[var(--color-artificio-orange)] transition-colors cursor-pointer ${
            isInactive ? 'text-white/50' : 'text-white' // Desativada: texto mais apagado
          }`}
        >
          {table.title}
        </a>
        <p className="text-xs text-white/50 mt-1">
          {table.system_name ?? 'Sistema livre'} · {table.modality}
        </p>
      </div>

      {/* STATUS HUMANO */}
      <div className="text-sm">
        {isInactive ? (
          <span className="text-gray-400">
            {table.status === 'cancelled' ? '⏸️ Mesa pausada' : '🏁 Mesa encerrada'}
          </span>
        ) : openSlots === 0 ? (
          <span className="text-red-400">🔥 Mesa cheia</span>
        ) : openSlots <= 2 ? (
          <span className="text-yellow-400">⚡ Últimas vagas ({openSlots})</span>
        ) : (
          <span className="text-green-400">✅ {openSlots} vagas abertas</span>
        )}
      </div>

      {/* METRICS */}
      <div className="flex gap-3 text-xs text-white/60">
        <span title="Visualizações">👁️ {metrics.views}</span>
        <span title="Contatos">💬 {metrics.contacts}</span>
        <span title="Favoritos">❤️ {metrics.favorites}</span>
      </div>

      {/* INSIGHT AUTOMÁTICO */}
      {hasPerformanceIssue && !isInactive && (
        <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg text-yellow-300">
          💡 Muitas visualizações, poucos contatos. Tente melhorar título ou imagem.
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onEdit(table.id)}
          className="flex-1 py-2 text-xs bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Editar
        </button>

        <button
          onClick={() => onToggle(table)}
          disabled={isToggling}
          className="flex-1 py-2 text-xs bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isToggling ? '⏳' : table.status === 'active' ? 'Desativar' : 'Ativar'}
        </button>

        <button
          onClick={() => onDelete(table)}
          disabled={isDeleting}
          className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isDeleting ? '⏳' : 'Deletar'}
        </button>
      </div>
    </div>
  );
}
