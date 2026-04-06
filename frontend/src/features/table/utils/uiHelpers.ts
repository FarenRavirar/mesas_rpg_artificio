import type { CTAConfig, UrgencyConfig } from '../types/tableView.types';

/**
 * Retorna classes CSS para botões baseado no variant do CTA
 */
export function getButtonStyle(variant: CTAConfig['variant']): string {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white transition transform hover:scale-[1.02] active:scale-[0.98]';
    case 'secondary':
      return 'bg-white/10 hover:bg-white/20 text-white transition transform hover:scale-[1.02] active:scale-[0.98]';
    case 'disabled':
      return 'bg-white/5 text-white/50 cursor-not-allowed';
  }
}

/**
 * Retorna classes CSS para urgência baseado no tom
 */
export function getUrgencyColor(tone: UrgencyConfig['tone']): string {
  switch (tone) {
    case 'critical':
      return 'text-red-400';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-white/70';
    case 'none':
      return 'text-white/50';
  }
}

/**
 * Handler para ações de CTA
 */
export function handleCTA(cta: CTAConfig): void {
  if (cta.action === 'scroll-contact') {
    const el = document.getElementById('mesa-contato');
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2', 'ring-offset-[#091427]');
    
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2', 'ring-offset-[#091427]');
    }, 1500);
  }
}
