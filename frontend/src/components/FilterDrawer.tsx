import { X, RotateCcw } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({ isOpen, onClose, onClear, children }: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-[#1B2A4A] z-50 md:hidden overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1B2A4A] border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1B2A4A] border-t border-white/10 p-4 flex gap-3">
          <button
            onClick={onClear}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-semibold transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}
