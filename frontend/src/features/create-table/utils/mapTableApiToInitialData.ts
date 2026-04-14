import type { FormState } from '../types/createTable.types';

/**
 * Converte a resposta flat da API (GET /api/v1/tables/:id)
 * para a estrutura aninhada Partial<FormState> esperada pelo
 * useCreateTableForm como `initialData`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTableApiToInitialData(apiData: any): Partial<FormState> {
  if (!apiData) return {};

  return {
    form: {
      title: apiData.title ?? '',
      description: apiData.description ?? '',
      type: apiData.type ?? 'campanha',
      modality: apiData.modality ?? 'online',
      audience: apiData.audience ?? 'livre',
      age_rating: apiData.age_rating ?? 'livre',
      price_type: apiData.price_type ?? 'free',
      price_value: apiData.price_value != null ? String(apiData.price_value) : '',
      slots_total: apiData.slots_total != null ? String(apiData.slots_total) : '4',
      slots_open: apiData.slots_open != null ? String(apiData.slots_open) : '4',
      experience_level: apiData.experience_level ?? 'todos',
      table_level: apiData.table_level ?? '',
      language: apiData.language ?? 'pt-BR',
    },

    selectedSystemId: apiData.system_id ?? '',
    selectedScenarioId: apiData.scenario_id ?? null,

    sessions:
      Array.isArray(apiData.sessions) && apiData.sessions.length > 0
        ? apiData.sessions
        : [
            {
              day_of_week: 'segunda',
              start_time: '19:00',
              end_time: '22:00',
              frequency: 'semanal',
              slots_per_session: null,
              is_ongoing: false,
              notes: '',
              sort_order: 0,
            },
          ],

    frequency: apiData.frequency ?? '',
    frequencyCustom: apiData.frequency_custom ?? '',
    vttPlatformId: apiData.vtt_platform_id ?? '',
    gamePlatformCustom: apiData.game_platform_custom ?? '',
    communicationPlatform: apiData.communication_platform ?? '',

    publisherRole: apiData.publisher_role ?? 'gm',
    actualGmName: apiData.actual_gm_name ?? '',

    contacts: Array.isArray(apiData.contacts) ? apiData.contacts : [],

    rulesNotes: apiData.rules_notes ?? '',
    bannerUrl: apiData.banner_url ?? apiData.image_url ?? '',
    bannerCropData: apiData.banner_crop_data ?? null,
    isCovilMesa: apiData.is_covil_mesa ?? false,

    ddal: {
      is_ddal: apiData.is_ddal ?? false,
      ddal_code: apiData.ddal_code ?? '',
      ddal_name: apiData.ddal_name ?? '',
      ddal_tier: apiData.ddal_tier != null ? String(apiData.ddal_tier) : '',
      ddal_season: apiData.ddal_season ?? '',
      ddal_duration: apiData.ddal_duration ?? '',
      ddal_format: apiData.ddal_format ?? '',
      ddal_org_code: apiData.ddal_org_code ?? '',
      ddal_setting: apiData.ddal_setting ?? '',
      ddal_rules_notes: apiData.ddal_rules_notes ?? '',
    },

    masterDisplayName: apiData.master_display_name ?? '',
    campaignLength: apiData.campaign_length ?? '',
    levelRange: apiData.level_range ?? '',
    billingText: apiData.billing_text ?? '',
    sessionZeroFree: apiData.session_zero_free ?? false,

    synopsis: apiData.synopsis ?? '',
    styleText: apiData.style_text ?? '',
    listingExcerpt: apiData.listing_excerpt ?? '',
    technicalRequirements: apiData.technical_requirements ?? '',

    requiresPc: apiData.requires_pc ?? false,
    requiresCamera: apiData.requires_camera ?? false,
    requiresMicrophone: apiData.requires_microphone ?? false,

    settingName: apiData.setting_name ?? '',
    settingStyles: Array.isArray(apiData.setting_styles) ? apiData.setting_styles : [],

    synopsisNarrative: apiData.synopsis_narrative ?? '',
    benefitsText: apiData.benefits_text ?? '',
    tableGmBio: apiData.table_gm_bio ?? '',
  };
}