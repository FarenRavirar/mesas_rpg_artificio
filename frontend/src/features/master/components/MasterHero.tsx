import type { MasterViewModel } from '../types/masterView.types';

interface MasterHeroProps {
  vm: MasterViewModel;
}

/**
 * Hero do perfil do mestre
 * 
 * Responsabilidades:
 * - Identidade visual (avatar + banner)
 * - Nome do mestre
 * - Badge Covil do Lich (certificação)
 */
export function MasterHero({ vm }: MasterHeroProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
      {/* Banner (opcional) */}
      {vm.banner && (
        <div className="w-full h-48 overflow-hidden">
          <img 
            src={vm.banner} 
            alt={`Banner de ${vm.name}`}
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      
      {/* Avatar + Nome + Covil */}
      <div className="p-6 flex items-center gap-4">
        <img
          src={vm.avatar}
          alt={vm.name}
          className="w-20 h-20 rounded-full border-2 border-white/20 object-cover"
        />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{vm.name}</h1>
          
          {vm.isCovil && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-medium">
              👑 Covil do Lich
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
