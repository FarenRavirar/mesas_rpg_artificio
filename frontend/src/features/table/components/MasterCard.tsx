import { User } from 'lucide-react';

interface MasterCardProps {
  masterName?: string;
  masterSlug?: string;
  masterAvatar?: string;
  masterBio?: string;
}

/**
 * Card do Mestre na página de detalhes da mesa
 * Exibe foto, nome, bio resumida e link para perfil público
 */
export function MasterCard({ masterName, masterSlug, masterAvatar, masterBio }: MasterCardProps) {
  if (!masterName || !masterSlug) {
    return null;
  }

  return (
    <a
      href={`/mestre/${masterSlug}`}
      className="block p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-[1.02] group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {masterAvatar ? (
            <img
              src={masterAvatar}
              alt={masterName}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30 group-hover:border-purple-500/60 transition"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/30 group-hover:border-purple-500/60 transition flex items-center justify-center">
              <User className="w-8 h-8 text-purple-300" />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
              {masterName}
            </h3>
            <span className="text-xs text-purple-300/60 uppercase tracking-wide">
              Mestre
            </span>
          </div>

          {masterBio && (
            <p className="text-sm text-white/70 line-clamp-2 mb-3">
              {masterBio}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-purple-300 group-hover:text-purple-200 transition">
            <span>Ver perfil completo</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}
