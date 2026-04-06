import type { TableDetail } from '../../../types/tables';
import type { TableViewModel, TableCertifications, CTAConfig, UrgencyConfig, VisibilityConfig } from '../types/tableView.types';

/**
 * Gera configuração de CTA baseado no estado da mesa
 */
function generateCTAConfig(slotsLeft: number): CTAConfig {
  const isFull = slotsLeft <= 0;

  if (isFull) {
    return {
      label: 'Mesa lotada',
      disabled: true,
      variant: 'disabled',
      action: 'none',
    };
  }

  return {
    label: '🎲 Entrar na mesa',
    disabled: false,
    variant: 'primary',
    action: 'scroll-contact',
  };
}

/**
 * Gera configuração de urgência baseado em vagas restantes
 */
function generateUrgencyConfig(slotsLeft: number): UrgencyConfig {
  if (slotsLeft === 0) {
    return {
      label: '❌ Mesa lotada',
      tone: 'critical',
      icon: '❌',
    };
  }

  if (slotsLeft <= 2) {
    return {
      label: `🔥 Últimas ${slotsLeft} ${slotsLeft === 1 ? 'vaga' : 'vagas'}`,
      tone: 'high',
      icon: '🔥',
    };
  }

  if (slotsLeft <= 5) {
    return {
      label: `⚠️ ${slotsLeft} vagas restantes`,
      tone: 'medium',
      icon: '⚠️',
    };
  }

  return {
    label: `${slotsLeft} vagas disponíveis`,
    tone: 'low',
    icon: '✓',
  };
}

/**
 * Gera configuração de visibilidade baseado no contexto
 */
function generateVisibilityConfig(table: TableDetail): VisibilityConfig {
  return {
    showPrice: !!table.price_value,
    showSchedules: (table.schedules?.length ?? 0) > 0,
    showMaster: !!table.gm_bio || !!table.master_display_name,
    showFullDetails: true, // Pode ser controlado por variant no futuro
    compact: false, // Pode ser controlado por variant no futuro
  };
}

/**
 * Transforma TableDetail (API) em TableViewModel (UI)
 * Centraliza lógica de transformação e defaults
 */
export function mapTableToView(table: TableDetail): TableViewModel {
  const slotsLeft = (table.slots_total ?? 0) - (table.slots_filled ?? 0);

  // Estrutura de certificações
  const certifications: TableCertifications = {};

  if (table.is_ddal) {
    certifications.ddal = {
      code: table.ddal_code ?? undefined,
      name: table.ddal_name ?? undefined,
      tier: table.ddal_tier ?? undefined,
      season: table.ddal_season ?? undefined,
      duration: table.ddal_duration ?? undefined,
      format: table.ddal_format ?? undefined,
      orgCode: table.ddal_org_code ?? undefined,
      setting: table.ddal_setting ?? undefined,
      rulesNotes: table.ddal_rules_notes ?? undefined,
    };
  }

  if (table.is_covil_lich) {
    certifications.covil = {
      isMember: true,
    };
  }

  return {
    // =============================
    // DECISION ENGINE (configs)
    // =============================
    cta: generateCTAConfig(slotsLeft),
    urgency: generateUrgencyConfig(slotsLeft),
    visibility: generateVisibilityConfig(table),

    // =============================
    // DADOS
    // =============================

    // Identificação
    id: table.id,
    slug: table.slug,
    title: table.title,
    subtitle: table.listing_excerpt ?? table.description?.slice(0, 120),

    // Decisão rápida
    system: table.system_name ?? 'Sistema livre',
    experience: table.experience_level,
    modality: table.modality,

    // Vagas
    slotsLeft,
    slotsTotal: table.slots_total,
    slotsFilled: table.slots_filled,
    isFull: slotsLeft <= 0,

    // Preço
    price: table.price_value ?? undefined,
    priceFrequency: table.price_frequency ?? undefined,

    // Certificações
    certifications,
    scenario: table.scenario_name ?? undefined,

    // Mestre
    masterName: table.master_display_name ?? table.gm_display_name ?? undefined,
    masterSlug: table.gm_slug ?? undefined,
    masterAvatar: table.gm_avatar_url ?? undefined,
    masterBio: table.gm_bio ?? undefined,

    // Horários
    schedules: table.schedules ?? [],

    // Conteúdo
    description: table.description ?? undefined,
    narrative: table.synopsis_narrative ?? undefined,
    benefits: table.benefits_text ?? undefined,
    styleText: table.style_text ?? undefined,

    // Segurança
    contentWarnings: table.content_warnings ?? [],
    safetyTools: table.safety_tools ?? [],

    // Técnico
    campaignLength: table.campaign_length ?? undefined,
    levelRange: table.level_range ?? undefined,
    billingText: table.billing_text ?? undefined,
    sessionZeroFree: table.session_zero_free ?? false,
    technicalRequirements: table.technical_requirements ?? undefined,
    requiresPC: table.requires_pc ?? false,
    requiresCamera: table.requires_camera ?? false,
    requiresMicrophone: table.requires_microphone ?? false,

    // Cenário e estilos
    settingName: table.setting_name ?? undefined,
    settingStyles: table.setting_styles ?? undefined,

    // Metadados
    coverUrl: table.cover_url ?? undefined,
    status: table.status,
    origin: table.origin,
    publisherRole: table.publisher_role,
    actualGmName: table.actual_gm_name ?? undefined,

    // Contatos
    contacts: table.contacts ?? [],

    // Localização
    city: table.city ?? undefined,
    state: table.state ?? undefined,
    language: table.language,
    startsAt: table.starts_at ?? undefined,
  };
}
