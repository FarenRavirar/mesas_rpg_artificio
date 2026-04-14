import type { TableViewModel, TableHeroVariant } from '../types/tableView.types';
import { getTableBadges, getBadgeClasses } from '../../../utils/tableBadges';
import { getButtonStyle, handleCTA } from '../utils/uiHelpers';
import bannerPlaceholder from '../../../assets/banner_placeholder.webp';

interface TableHeroProps {
  vm: TableViewModel;
  variant?: TableHeroVariant;
}

/**
 * Hero da mesa - Decisão rápida em 3 segundos
 * Reutilizável em: MesaPage, Catálogo, Homepage (destaque)
 */
export function TableHero({ vm, variant = 'full' }: TableHeroProps) {
  const badges = getTableBadges({
    is_ddal: vm.certifications.ddal !== undefined,
    is_covil: vm.certifications.covil !== undefined,
  });

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Cover Image */}
      <img 
        src={vm.coverUrl || bannerPlaceholder}
        alt={vm.title}
        className="w-full h-64 object-cover"
        onError={(event) => {
          const img = event.currentTarget;
          if (img.dataset.fallbackApplied === 'true') return;
          img.dataset.fallbackApplied = 'true';
          img.src = bannerPlaceholder;
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 w-full space-y-3">
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Badges de certificação */}
          {badges.map((badge) => {
            const BadgeIcon = badge.icon;
            return (
              <span
                key={badge.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClasses(badge.color)}`}
              >
                <BadgeIcon className="w-3.5 h-3.5" />
                {badge.label}
              </span>
            );
          })}

          {/* Badge de status (desativada/encerrada) */}
          {vm.status === 'cancelled' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              ⏸️ Mesa desativada
            </span>
          )}
          {vm.status === 'ended' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
              🏁 Mesa encerrada
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white">
          {vm.title}
        </h1>

        {/* Subtitle */}
        {!vm.visibility.compact && vm.subtitle && (
          <p className="text-white/80 text-sm max-w-xl">
            {vm.subtitle}
          </p>
        )}

        {/* Quick Decision Info */}
        {variant === 'full' && (
          <div className="flex flex-wrap gap-3 text-sm mt-2">
            <span className="text-white/90">🎲 {vm.system}</span>
            <span className="text-white/90">🧠 {vm.experience}</span>
            {/* CORREÇÃO B01: Exibir logo VTT pequeno (20px) ao lado de modality */}
            {vm.modality === 'online' && vm.vttPlatform ? (
              <span className="flex items-center gap-1.5 text-white/90" title={vm.vttPlatform.name}>
                {vm.vttPlatform.logo_filename && (
                  <img 
                    src={`/vtt-logos/${vm.vttPlatform.logo_filename}`} 
                    alt={vm.vttPlatform.name}
                    className="h-5 w-auto object-contain"
                    onError={(e) => {
                      // CORREÇÃO E02: Esconder imagem se falhar carregamento
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span>{vm.vttPlatform.name}</span>
              </span>
            ) : vm.modality === 'online' && vm.gamePlatformCustom ? (
              <span className="text-white/90">🌐 {vm.gamePlatformCustom}</span>
            ) : (
              <span className="text-white/90">🌐 {vm.modality}</span>
            )}
          </div>
        )}

        {/* CTA (apenas em highlight) */}
        {variant === 'highlight' && !vm.cta.disabled && (
          <button
            onClick={() => handleCTA(vm.cta)}
            className={`mt-3 px-5 py-2 rounded-lg font-semibold ${getButtonStyle(vm.cta.variant)}`}
          >
            {vm.cta.label}
          </button>
        )}
      </div>
    </div>
  );
}
