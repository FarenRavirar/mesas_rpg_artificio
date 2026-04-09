import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dice1, Globe, MapPin } from 'lucide-react';
import type { TableCard } from '../types/tables';
import { getSlotsVisualState } from '../utils/slots';
import { SlotsIndicator } from './SlotsIndicator';

const modalityLabels: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

export function TableCardSkeleton() {
  // CORREÇÃO UX-SENIOR-05: Skeleton realista que imita layout do card
  return (
    <div className="w-full h-[380px] rounded-2xl bg-[#1B2A4A] border border-white/10 overflow-hidden">
      {/* Cover placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2A3F6D] to-[#1B2A4A] animate-pulse" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a30] via-[#0d1a30]/70 to-transparent z-10" />
      
      {/* Content skeleton */}
      <div className="absolute bottom-0 left-0 p-5 z-20 w-full space-y-2.5">
        {/* Título */}
        <div className="h-6 bg-white/10 rounded w-3/4 animate-pulse" />
        
        {/* Vagas */}
        <div className="h-8 bg-white/10 rounded w-1/3 animate-pulse" />
        
        {/* Descrição */}
        <div className="space-y-1">
          <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
        </div>
        
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 bg-white/10 rounded w-20 animate-pulse" />
          <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function TableCardComponent({ table }: { table: TableCard }) {
  // Fonte única de verdade para vagas (usado apenas para lógica de CTA)
  const { open: slotsLeft, isUrgent, isFull } = getSlotsVisualState(table);

  // Lógica de CTA baseada em estado (ISO 9241 – Controllability)
  // Estado A: pode entrar direto → CTA primário "Entrar" + secundário "Ver detalhes"
  // Estado B: precisa avaliar → CTA primário "Ver detalhes" apenas
  const canJoinDirectly = !isFull && table.status === 'active';
  const primaryCTA = canJoinDirectly
    ? { label: 'Entrar na mesa →', variant: 'primary' as const }
    : { label: 'Ver detalhes →', variant: 'secondary' as const };

  const queryClient = useQueryClient();

  // Prefetch no hover com debounce
  const handleMouseEnter = useCallback(() => {
    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['table', table.slug],
        queryFn: () =>
          fetch(`/api/v1/tables/${table.slug}`).then((res) => res.json()),
        staleTime: 5 * 60 * 1000,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [queryClient, table.slug]);

  // Click tracking
  const handleClick = useCallback(() => {
    fetch(`/api/v1/tables/${table.slug}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant: 'refactored_v4' }),
      keepalive: true,
    }).catch(() => {});
  }, [table.slug]);

  return (
    <Link
      to={`/mesas/${table.slug}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="group relative block w-full h-[420px] rounded-2xl overflow-hidden bg-[#1B2A4A] border border-white/10 hover:border-[var(--color-artificio-orange)]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(232,82,26,0.15)] hover:-translate-y-1"
      id={`table-card-${table.slug}`}
    >
      {/* BLOCO 1: HEADER (Imagem + Badges críticos) */}
      <div className="h-[168px] relative overflow-hidden">
        {table.cover_url ? (
          <img
            src={table.cover_url}
            alt={table.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2A3F6D] to-[#1B2A4A] flex items-center justify-center">
            <div className="text-5xl opacity-30">🎲</div>
          </div>
        )}

        {/* Badges críticos apenas */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {table.is_ddal && (
            <span className="px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-amber-100 bg-black/70 backdrop-blur-sm border border-amber-500/30">
              🛡️ DDAL
            </span>
          )}
          {isUrgent && (
            <span className="px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-white bg-red-500/90 backdrop-blur-sm animate-pulse">
              ⚡ {slotsLeft === 1 ? 'Última vaga' : 'Últimas vagas'}
            </span>
          )}
        </div>

        {table.featured && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-[var(--color-artificio-orange)] rounded-md text-xs font-bold text-white">
            ★ Destaque
          </span>
        )}
      </div>

      {/* BLOCO 2: CONTENT (Título + Sistema/Modalidade) */}
      <div className="h-[252px] p-4 flex flex-col">
        <div className="flex gap-2 mb-3">
          {table.system_name && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#13213f] rounded-md text-xs font-semibold text-[var(--color-artificio-orange)] border border-white/10">
              <Dice1 className="w-3 h-3" />
              {table.system_name}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-[#13213f] rounded-md text-xs font-semibold text-white/80 border border-white/10">
            {table.modality === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {modalityLabels[table.modality] ?? table.modality}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-artificio-orange)] transition-colors line-clamp-2 leading-tight mb-4">
          {table.title}
        </h3>

        {/* BLOCO 3: METADATA (Mestre + Vagas + Preço) */}
        <div className="mt-auto space-y-3">
          {table.gm_display_name && (
            <div className="flex items-center gap-2">
              {table.gm_avatar_url ? (
                <img 
                  src={table.gm_avatar_url} 
                  alt={table.gm_display_name}
                  className="w-6 h-6 rounded-full border border-white/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  👤
                </div>
              )}
              <span className="text-sm text-white/70 font-medium truncate">
                {table.gm_display_name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Vagas */}
            <SlotsIndicator table={table} />

            {/* Preço */}
            {table.price_type === 'gratuita' ? (
              <span className="text-sm font-bold text-green-400">Gratuito</span>
            ) : table.price_value ? (
              <span className="text-sm font-bold text-yellow-400">
                R$ {table.price_value}<span className="text-[10px] text-white/50 ml-1">/ sessão</span>
              </span>
            ) : null}
          </div>

          {/* BLOCO 4: ACTION (CTA primário + secundário opcional) */}
          <div className="space-y-2">
            <div className={`w-full py-2.5 rounded-lg text-sm font-bold text-center transition-all ${
              isFull
                ? 'bg-gray-600 text-white/50 cursor-not-allowed opacity-50'
                : primaryCTA.variant === 'primary'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'border-2 border-orange-600 text-orange-600 hover:bg-orange-600/10'
            }`}>
              {isFull ? 'Mesa lotada' : primaryCTA.label}
            </div>
            
            {canJoinDirectly && (
              <div className="text-center">
                <span className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer">
                  Ver detalhes
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
