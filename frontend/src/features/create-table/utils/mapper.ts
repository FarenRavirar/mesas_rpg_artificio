import type { FormState, CreateTablePayload } from '../types/createTable.types';

/**
 * Transforma o estado do formulário em payload para a API
 */
export function formStateToPayload(state: FormState): CreateTablePayload {
  // Filtrar contatos válidos
  const validContacts = state.contacts
    .filter((c) => c.value.trim().length > 0)
    .map((c) => ({
      channel: c.channel,
      value: c.value,
      label: c.label || '',
      discord_server_url: c.discord_server_url || '',
    }));

  // CORREÇÃO REG-01: Renomear sessions para schedules e mapear estrutura correta
  const schedules = state.sessions.map((s, index) => ({
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time || undefined,
    frequency: s.frequency,
    slots_per_session: s.slots_per_session || null,
    is_ongoing: s.is_ongoing ?? false,
    notes: s.notes || undefined,
    sort_order: index,
  }));

  // Construir payload base
  const payload: CreateTablePayload = {
    title: state.form.title,
    description: state.form.description,
    type: state.form.type,
    modality: state.form.modality,
    price_type: state.form.price_type,
    slots_total: parseInt(state.form.slots_total) || 0,
    language: state.form.language,
    system_id: state.selectedSystemId,
    scenario_id: state.selectedScenarioId,
    schedules: schedules, // CORREÇÃO REG-01: Renomeado de sessions para schedules
    contacts: validContacts,
    publisher_role: state.publisherRole,
    actual_gm_name: state.publisherRole === 'announcer' ? state.actualGmName : null,
    rules_notes: state.rulesNotes,
    banner_url: state.bannerUrl,
    is_covil: state.isCovilMesa,
    is_ddal: state.ddal.is_ddal,
    // CORREÇÃO REG-04, REG-05, REG-06: Adicionar campos ausentes
    audience: state.form.audience,
    experience_level: state.form.experience_level,
    starts_at: state.form.starts_at || undefined,
    city: state.form.city || undefined,
    state: state.form.state || undefined,
    content_warnings: state.form.content_warnings || undefined,
    safety_tools: state.form.safety_tools || undefined,
    frequency: state.frequency || undefined,
    frequency_custom: state.form.frequency_custom || undefined,
    price_value: state.form.price_value ? parseFloat(state.form.price_value) : undefined,
    price_frequency: state.form.price_frequency || undefined,
  };

  // Adicionar campos DDAL se aplicável
  if (state.ddal.is_ddal) {
    payload.ddal_code = state.ddal.ddal_code || undefined;
    payload.ddal_name = state.ddal.ddal_name || undefined;
    payload.ddal_tier = state.ddal.ddal_tier ? parseInt(state.ddal.ddal_tier) : undefined;
    payload.ddal_season = state.ddal.ddal_season || undefined;
    payload.ddal_duration = state.ddal.ddal_duration || undefined;
    payload.ddal_format = state.ddal.ddal_format || undefined;
    payload.ddal_org_code = state.ddal.ddal_org_code || undefined;
    payload.ddal_setting = state.ddal.ddal_setting || undefined;
    payload.ddal_rules_notes = state.ddal.ddal_rules_notes || undefined;
  }

  // Adicionar campos avançados opcionais
  if (state.masterDisplayName) payload.master_display_name = state.masterDisplayName;
  if (state.campaignLength) payload.campaign_length = state.campaignLength;
  if (state.levelRange) payload.level_range = state.levelRange;
  if (state.billingText) payload.billing_text = state.billingText;
  if (state.sessionZeroFree) payload.session_zero_free = state.sessionZeroFree;
  if (state.synopsis) payload.synopsis = state.synopsis;
  if (state.styleText) payload.style_text = state.styleText;
  if (state.listingExcerpt) payload.listing_excerpt = state.listingExcerpt;
  if (state.technicalRequirements) payload.technical_requirements = state.technicalRequirements;
  if (state.requiresPc) payload.requires_pc = state.requiresPc;
  if (state.requiresCamera) payload.requires_camera = state.requiresCamera;
  if (state.requiresMicrophone) payload.requires_microphone = state.requiresMicrophone;
  if (state.settingName) payload.setting_name = state.settingName;
  if (state.settingStyles && state.settingStyles.length > 0) {
    payload.setting_styles = state.settingStyles;
  }

  return payload;
}
