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
    sessions: state.sessions,
    contacts: validContacts,
    publisher_role: state.publisherRole,
    actual_gm_name: state.publisherRole === 'announcer' ? state.actualGmName : null,
    rules_notes: state.rulesNotes,
    banner_url: state.bannerUrl,
    is_covil: state.isCovilMesa,
    is_ddal: state.ddal.is_ddal,
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
