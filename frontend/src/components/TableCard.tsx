import { Link } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dice1, Globe, MapPin, Megaphone, Users } from 'lucide-react';
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

// Helper: Truncar texto longo
const truncateText = (text: string | null | undefined, maxLength: number = 150): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
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
  // CORREÇÃO UX-01: Lógica de vagas com fallback seguro
  // slots_open é controlado pelo mestre, mas pode ser null
  // Fallback: calcular (slots_total - slots_filled) com proteção contra null
  const slotsLeft =
    table.slots_open !== null && table.slots_open !== undefined
      ? table.slots_open
      : Math.max(0, (table.slots_total ?? 0) - (table.slots_filled ?? 0));

  const isFull = slotsLeft <= 0;

  // CORREÇÃO UX-02: Priorização de badges com limite de 2
  // Hierarquia: DDAL > Últimas vagas > Popular > Alta performance
  const visibleBadges = useMemo(() => {
    const badges = [];

    if (table.is_ddal) {
      badges.push({ label: 'DDAL', color: 'amber', icon: '🛡️' });
    }

    if (slotsLeft <= 2 && !isFull) {
      badges.push({ 
        label: slotsLeft === 1 ? 'Última vaga!' : 'Últimas vagas', 
        color: 'orange', 
        icon: '⚡' 
      });
    } else if (table.metrics && table.metrics.contacts > 5) {
      badges.push({ label: 'Popular', color: 'red', icon: '🔥' });
    } else if (table.score && table.score > 80) {
      badges.push({ label: 'Alta performance', color: 'purple', icon: '🏆' });
    }

    return badges.slice(0, 2);
  }, [table.is_ddal, table.metrics, table.score, slotsLeft, isFull]);

  // CORREÇÃO UX-SENIOR-04: A/B test - 50% com métricas, 50% sem
  const [showMetrics] = useState(() => {
    const stored = sessionStorage.getItem('ab_show_metrics');
    if (stored) return stored === 'true';
    
    const variant = Math.random() > 0.5;
    sessionStorage.setItem('ab_show_metrics', String(variant));
    return variant;
  });

  const queryClient = useQueryClient();

  // CORREÇÃO UX-SENIOR-03: Prefetch no hover com debounce
  const handleMouseEnter = useCallback(() => {
    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['table', table.slug],
        queryFn: () =>
          fetch(`/api/v1/tables/${table.slug}`).then((res) => res.json()),
        staleTime: 5 * 60 * 1000,
      });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [queryClient, table.slug]);

  // CORREÇÃO UX-SENIOR-02: Click tracking
  const handleClick = useCallback(() => {
    const variant = showMetrics ? 'with_metrics' : 'without_metrics';
    
    fetch(`/api/v1/tables/${table.slug}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant }),
      keepalive: true, // Garante envio mesmo se usuário navegar rápido
    }).catch(() => {}); // Silencioso - não bloquear navegação
  }, [table.slug, showMetrics]);

  return (
    <Link
      to={`/mesas/${table.slug}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`group relative block w-full h-[380px] rounded-2xl overflow-hidden bg-[#1B2A4A] border hover:border-[var(--color-artificio-orange)]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(232,82,26,0.15)] hover:-translate-y-1 ${
        slotsLeft <= 2 && !isFull ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-white/10'
      }`}
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

      {/* CORREÇÃO UX-02: Badges priorizados - máximo 2 */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
        {visibleBadges.map((badge, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-white ${
              badge.color === 'amber' ? 'bg-amber-500/90' :
              badge.color === 'orange' ? 'bg-orange-500/90' :
              badge.color === 'red' ? 'bg-red-500/90' :
              badge.color === 'purple' ? 'bg-purple-500/90' :
              'bg-gray-500/90'
            }`}
          >
            {badge.icon} {badge.label}
          </div>
        ))}
      </div>

      {/* Featured - topo direito */}
      {table.featured && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-[var(--color-artificio-orange)] rounded-md text-xs font-bold text-white">
          ★ Destaque
        </div>
      )}

      {/* CORREÇÃO UX-03: Overlay "Lotada" para clareza imediata */}
      {isFull && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-2xl z-30">
          Lotada
        </div>
      )}

      {/* Conteúdo principal - hierarquia de decisão */}
      <div className="absolute bottom-0 left-0 p-5 z-20 w-full space-y-2.5">
        
        {/* 1. Título + Preço (decisão crítica) */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-artificio-orange)] transition-colors line-clamp-2 leading-tight flex-1">
            {table.title}
          </h3>
          {table.price_value && (
            <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">
              R$ {table.price_value}
            </span>
          )}
        </div>

        {/* 2. VAGAS (PRIORIDADE - MOVIDO PARA CIMA) */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${isFull ? 'bg-red-900/50 text-red-300 border-red-700/50' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'}`}>
            {isFull ? 'Lotada' : `${slotsLeft} vaga${slotsLeft !== 1 ? 's' : ''}`}
          </span>
          {/* Score visual */}
          {table.metrics && table.metrics.contacts > 0 && (
            <div className="flex gap-1">
              {/* CORREÇÃO HP-05: Adicionar key única */}
              {Array.from({ length: Math.min(5, Math.floor(table.metrics.contacts / 2)) }).map((_, i) => (
                <span key={`fire-${table.id}-${i}`}>🔥</span>
              ))}
            </div>
          )}
        </div>

        {/* 3. Valor (synopsis ou descrição) - TRUNCADO */}
        {(table.synopsis_narrative || table.description) && (
          <p className="text-xs text-white/70 line-clamp-2">
            {truncateText(table.synopsis_narrative || table.description, 150)}
          </p>
        )}

        {/* 4. Métricas de engajamento (prova social) - A/B TEST */}
        {showMetrics && table.metrics && (
          <div className="flex gap-3 text-xs text-white/50">
            <span title="Visualizações">👁️ {table.metrics.views}</span>
            <span title="Contatos">💬 {table.metrics.contacts}</span>
            {table.metrics.favorites > 0 && (
              <span title="Favoritos">❤️ {table.metrics.favorites}</span>
            )}
          </div>
        )}

        {/* 5. Tags de contexto */}
        <div className="flex flex-wrap gap-2">
          {table.system_name && (
            <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-[var(--color-artificio-orange)] border border-white/10">
              <Dice1 className="w-3 h-3" />
              {table.system_name}
            </span>
          )}
          {/* CORREÇÃO REG-09: Exibir cenário */}
          {table.setting_name && (
            <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-purple-300 border border-white/10">
              🗺️ {table.setting_name}
            </span>
          )}
          {/* NOVO: Exibir estilos de jogo (máximo 2) */}
          {table.setting_styles && table.setting_styles.length > 0 && (
            <>
              {table.setting_styles.slice(0, 2).map((style) => (
                <span
                  key={style}
                  className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-orange-300 border border-white/10"
                >
                  {style}
                </span>
              ))}
            </>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-white border border-white/10">
            {table.modality === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {modalityLabels[table.modality] ?? table.modality}
          </span>
          {table.publisher_role === 'announcer' && (
            <span
              id={`table-card-announcer-${table.slug}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300/25 bg-slate-500/15 text-slate-100 text-xs font-semibold"
            >
              <Megaphone className="w-3 h-3" /> Apenas anunciante
            </span>
          )}
          {/* CORREÇÃO REG-09: Exibir estilos */}
          {table.setting_styles && table.setting_styles.length > 0 && (
            <>
              {table.setting_styles.slice(0, 2).map((style, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-indigo-500/20 backdrop-blur-sm rounded-md text-xs font-medium text-indigo-200 border border-indigo-400/20"
                >
                  {style}
                </span>
              ))}
              {table.setting_styles.length > 2 && (
                <span className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-medium text-white/50 border border-white/10">
                  +{table.setting_styles.length - 2}
                </span>
              )}
            </>
          )}
        </div>

        {/* 6. Footer com CTA AGRESSIVO */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 text-white/40">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {table.slots_filled}/{table.slots_total}
            </span>
            <span>{experienceLabels[table.experience_level] ?? table.experience_level}</span>
          </div>
          <span className="text-[var(--color-artificio-orange)] font-bold">
            Entrar na mesa →
          </span>
        </div>
      </div>
    </Link>
  );
}
