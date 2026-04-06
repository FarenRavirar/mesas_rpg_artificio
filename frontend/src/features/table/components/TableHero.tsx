import type { TableViewModel, TableHeroVariant } from '../types/tableView.types';
import { getTableBadges, getBadgeClasses } from '../../../utils/tableBadges';
import { getButtonStyle, handleCTA } from '../utils/uiHelpers';

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
    is_covil_lich: vm.certifications.covil !== undefined,
  } as any);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Cover Image */}
      {vm.coverUrl && (
        <img 
          src={vm.coverUrl} 
          alt={vm.title}
          className="w-full h-64 object-cover"
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 w-full space-y-3">
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
          </div>
        )}

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
            <span className="text-white/90">🌐 {vm.modality}</span>
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
