import { Link } from 'react-router-dom';
import { BadgeCheck, Dice1, Globe, MapPin, Megaphone, Users } from 'lucide-react';
import type { TableCard } from '../types/tables';

const modalityLabels: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

const experienceLabels: Record<string, string> = {
  todos: 'Todos os Níveis',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  veterano: 'Veterano',
};

export function TableCardSkeleton() {
  return (
    <div className="w-full h-[340px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
  );
}

export function TableCardComponent({ table }: { table: TableCard }) {
  const slotsLeft = table.slots_total - table.slots_filled;
  const isFull = slotsLeft <= 0;

  return (
    <Link
      to={`/mesas/${table.slug}`}
      className="group relative block w-full h-[340px] rounded-2xl overflow-hidden bg-[#1B2A4A] border border-white/10 hover:border-[var(--color-artificio-orange)]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(232,82,26,0.15)] hover:-translate-y-1"
      id={`table-card-${table.slug}`}
    >
      {table.cover_url ? (
        <img
          src={table.cover_url}
          alt={table.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A3F6D] to-[#1B2A4A]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a30] via-[#0d1a30]/70 to-transparent z-10" />

      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
        {table.is_ddal && (
          <div
            id={`table-card-ddal-${table.slug}`}
            className="px-2 py-1 bg-amber-500/90 rounded-md text-[11px] font-black tracking-wide text-white inline-flex items-center gap-1"
          >
            <BadgeCheck className="w-3 h-3" /> DDAL
          </div>
        )}

        {slotsLeft === 1 && !isFull && (
          <div className="px-2 py-1 bg-orange-500/90 rounded-md text-[11px] font-black tracking-wide text-white">
            Falta 1 jogador!
          </div>
        )}
      </div>

      {table.featured && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-[var(--color-artificio-orange)] rounded-md text-xs font-bold text-white">
          ★ Destaque
        </div>
      )}

      <div className="absolute bottom-0 left-0 p-5 z-20 w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          {table.system_name && (
            <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-[var(--color-artificio-orange)] border border-white/10">
              <Dice1 className="w-3 h-3" />
              {table.system_name}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-white border border-white/10">
            {table.modality === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {modalityLabels[table.modality] ?? table.modality}
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${isFull ? 'bg-red-900/50 text-red-300 border-red-700/50' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'}`}>
            {isFull ? 'Lotada' : `${slotsLeft} vaga${slotsLeft !== 1 ? 's' : ''}`}
          </span>
          {table.publisher_role === 'announcer' && (
            <span
              id={`table-card-announcer-${table.slug}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300/25 bg-slate-500/15 text-slate-100 text-xs font-semibold"
            >
              <Megaphone className="w-3 h-3" /> Apenas anunciante
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-artificio-orange)] transition-colors line-clamp-2 leading-tight">
          {table.title}
        </h3>

        {table.description && (
          <p className="text-xs text-white/60 line-clamp-2">{table.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-white/40 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {table.slots_filled}/{table.slots_total}
          </span>
          <span>{experienceLabels[table.experience_level] ?? table.experience_level}</span>
          {table.price_value && (
            <span className="text-yellow-400 font-semibold">
              R$ {table.price_value}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
