"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTableSchema = exports.createTableSchema = exports.SCHEDULE_FREQUENCIES = exports.DAYS_OF_WEEK = exports.CONTACT_CHANNELS = exports.PUBLISHER_ROLES = exports.EXPERIENCE_LEVELS = exports.PRICE_FREQUENCIES = exports.PRICE_TYPES = exports.TABLE_AUDIENCES = exports.TABLE_MODALITIES = exports.TABLE_TYPES = void 0;
const zod_1 = require("zod");
// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================
exports.TABLE_TYPES = ['campanha', 'one-shot', 'oneshot-serie', 'aberta'];
exports.TABLE_MODALITIES = ['online', 'presencial', 'hibrida'];
exports.TABLE_AUDIENCES = ['livre', 'adultos'];
exports.PRICE_TYPES = ['gratuita', 'paga'];
exports.PRICE_FREQUENCIES = ['sessao', 'mes', 'campanha'];
exports.EXPERIENCE_LEVELS = ['todos', 'iniciante', 'intermediario', 'veterano'];
exports.PUBLISHER_ROLES = ['gm', 'announcer'];
exports.CONTACT_CHANNELS = ['whatsapp', 'discord', 'phone', 'email', 'facebook', 'instagram', 'form'];
exports.DAYS_OF_WEEK = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
exports.SCHEDULE_FREQUENCIES = ['semanal', 'quinzenal', 'mensal', 'avulsa'];
// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================
const contactSchema = zod_1.z.object({
    channel: zod_1.z.enum(exports.CONTACT_CHANNELS),
    value: zod_1.z.string().min(1, 'Valor do contato é obrigatório'),
    label: zod_1.z.string().nullable().optional(),
    discord_server_url: zod_1.z.union([
        zod_1.z.string().url('URL do Discord inválida'),
        zod_1.z.literal('')
    ]).nullable().optional(),
    sort_order: zod_1.z.number().int().min(0).optional(),
});
const scheduleSchema = zod_1.z.object({
    day_of_week: zod_1.z.enum(exports.DAYS_OF_WEEK),
    start_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de horário inválido (HH:MM ou HH:MM:SS)'),
    end_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de horário inválido').nullable().optional(),
    frequency: zod_1.z.enum(exports.SCHEDULE_FREQUENCIES),
    slots_per_session: zod_1.z.number().int().min(1).max(100).nullable().optional(),
    is_ongoing: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().max(500).nullable().optional(),
    sort_order: zod_1.z.number().int().min(0).optional(),
});
const baseTableSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título muito longo'),
    description: zod_1.z.string().max(5000).nullable().optional(),
    system_id: zod_1.z.string().uuid('Sistema inválido').nullable().optional(),
    scenario_id: zod_1.z.string().uuid('Cenário inválido').nullable().optional(),
    type: zod_1.z.enum(exports.TABLE_TYPES),
    audience: zod_1.z.enum(exports.TABLE_AUDIENCES).default('livre'),
    modality: zod_1.z.enum(exports.TABLE_MODALITIES),
    price_type: zod_1.z.enum(exports.PRICE_TYPES).default('gratuita'),
    price_value: zod_1.z.number().min(0).nullable().optional(),
    price_frequency: zod_1.z.enum(exports.PRICE_FREQUENCIES).nullable().optional(),
    slots_total: zod_1.z.number().int().min(1).max(100).default(4),
    slots_filled: zod_1.z.number().int().min(0).default(0),
    slots_open: zod_1.z.number().int().min(0).optional(),
    language: zod_1.z.string().max(50).default('Português'),
    experience_level: zod_1.z.enum(exports.EXPERIENCE_LEVELS).default('todos'),
    starts_at: zod_1.z.string().datetime().nullable().optional(),
    city: zod_1.z.string().max(100).nullable().optional(),
    state: zod_1.z.string().max(2).nullable().optional(),
    content_warnings: zod_1.z.array(zod_1.z.string()).default([]),
    safety_tools: zod_1.z.array(zod_1.z.string()).default([]),
    publisher_role: zod_1.z.enum(exports.PUBLISHER_ROLES).default('gm'),
    actual_gm_name: zod_1.z.string().min(2).max(100).nullable().optional(),
    is_ddal: zod_1.z.boolean().default(false),
    ddal_code: zod_1.z.string().max(50).nullable().optional(),
    ddal_name: zod_1.z.string().max(200).nullable().optional(),
    ddal_tier: zod_1.z.number().int().min(1).max(4).nullable().optional(),
    ddal_season: zod_1.z.string().max(50).nullable().optional(),
    ddal_duration: zod_1.z.string().max(50).nullable().optional(),
    ddal_format: zod_1.z.string().max(50).nullable().optional(),
    ddal_org_code: zod_1.z.string().max(50).nullable().optional(),
    ddal_setting: zod_1.z.string().max(100).nullable().optional(),
    ddal_rules_notes: zod_1.z.string().max(1000).nullable().optional(),
    vtt_platform_id: zod_1.z.string().nullable().optional(),
    game_platform_custom: zod_1.z.string().max(100).nullable().optional(),
    communication_platform_id: zod_1.z.string().uuid('Plataforma de comunicação inválida').nullable().optional(),
    communication_platform: zod_1.z.string().max(100).nullable().optional(),
    rules_notes: zod_1.z.string().max(2000).nullable().optional(),
    banner_url: zod_1.z.string().url().nullable().optional(),
    banner_crop_data: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
        width: zod_1.z.number(),
        height: zod_1.z.number(),
    }).nullable().optional(),
    gm_avatar_url: zod_1.z.string().url().nullable().optional(),
    is_covil: zod_1.z.boolean().default(false),
    master_display_name: zod_1.z.string().max(100).nullable().optional(),
    campaign_length: zod_1.z.string().max(100).nullable().optional(),
    level_range: zod_1.z.string().max(50).nullable().optional(),
    billing_text: zod_1.z.string().max(500).nullable().optional(),
    session_zero_free: zod_1.z.boolean().default(false),
    synopsis: zod_1.z.string().max(2000).nullable().optional(),
    style_text: zod_1.z.string().max(1000).nullable().optional(),
    listing_excerpt: zod_1.z.string().max(300).nullable().optional(),
    technical_requirements: zod_1.z.string().max(1000).nullable().optional(),
    requires_pc: zod_1.z.boolean().default(false),
    requires_camera: zod_1.z.boolean().default(false),
    requires_microphone: zod_1.z.boolean().default(false),
    setting_name: zod_1.z.string().max(200).nullable().optional(),
    setting_styles: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    synopsis_narrative: zod_1.z.string().max(3000).nullable().optional(),
    benefits_text: zod_1.z.string().max(2000).nullable().optional(),
    table_gm_bio: zod_1.z.string().max(2000).nullable().optional(),
    contacts: zod_1.z.array(contactSchema).min(1, 'Informe ao menos um canal de contato'),
    schedules: zod_1.z.array(scheduleSchema).optional(),
});
exports.createTableSchema = baseTableSchema
    .strict()
    .refine((data) => !!data.system_id, {
    message: 'Sistema é obrigatório',
    path: ['system_id']
})
    .refine((data) => {
    const slotsOpen = data.slots_open ?? data.slots_total;
    return slotsOpen <= data.slots_total;
}, {
    message: 'Vagas abertas não pode ser maior que vagas totais',
    path: ['slots_open']
})
    .refine((data) => {
    if (data.price_type === 'paga' && (!data.price_value || data.price_value <= 0)) {
        return false;
    }
    return true;
}, {
    message: 'Valor obrigatório para mesas pagas',
    path: ['price_value']
})
    .refine((data) => {
    if (data.publisher_role === 'announcer' && !data.actual_gm_name)
        return false;
    return true;
}, {
    message: 'Nome do mestre real obrigatório quando for anunciante',
    path: ['actual_gm_name']
})
    .refine((data) => {
    if (data.vtt_platform_id === 'custom' && !data.game_platform_custom)
        return false;
    return true;
}, {
    message: 'Nome da plataforma obrigatório quando selecionar "Personalizado"',
    path: ['game_platform_custom']
})
    .refine((data) => {
    if ((data.vtt_platform_id || data.game_platform_custom) &&
        data.modality !== 'online' && data.modality !== 'hibrida') {
        return false;
    }
    return true;
}, {
    message: 'Plataforma VTT só para mesas online ou híbridas',
    path: ['vtt_platform_id']
})
    .refine((data) => {
    if (data.is_ddal && (!data.ddal_code || !data.ddal_name || !data.ddal_tier)) {
        return false;
    }
    return true;
}, {
    message: 'Campos DDAL incompletos (código, nome, tier)',
    path: ['is_ddal']
});
exports.updateTableSchema = baseTableSchema
    .partial()
    .strict()
    .refine((data) => {
    if (data.slots_open !== undefined && data.slots_total !== undefined) {
        return data.slots_open <= data.slots_total;
    }
    return true;
}, {
    message: 'Vagas abertas não pode ser maior que vagas totais',
    path: ['slots_open']
})
    .refine((data) => {
    if (data.publisher_role === 'announcer' && !data.actual_gm_name)
        return false;
    return true;
}, {
    message: 'Nome do mestre real obrigatório quando for anunciante',
    path: ['actual_gm_name']
})
    .refine((data) => {
    if (data.is_ddal === true && (!data.ddal_code || !data.ddal_name || !data.ddal_tier)) {
        return false;
    }
    return true;
}, {
    message: 'Campos DDAL incompletos',
    path: ['is_ddal']
});
