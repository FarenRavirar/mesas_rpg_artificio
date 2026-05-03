"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDiscordDraftToTable = syncDiscordDraftToTable;
const db_1 = require("../db");
const tableRepository_1 = require("../repositories/tableRepository");
const tableService_1 = require("../services/tableService");
const VALID_DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const VALID_FREQ = ['semanal', 'quinzenal', 'mensal', 'avulsa'];
const VALID_CHANNELS = ['whatsapp', 'discord', 'phone', 'email', 'facebook', 'instagram', 'form'];
function isDayOfWeek(v) {
    return typeof v === 'string' && VALID_DAYS.includes(v);
}
function isScheduleFrequency(v) {
    return typeof v === 'string' && VALID_FREQ.includes(v);
}
function isTableContactChannel(v) {
    return typeof v === 'string' && VALID_CHANNELS.includes(v);
}
function extractContacts(draft) {
    const contacts = [];
    if (draft.table.contact_discord) {
        contacts.push({ channel: 'discord', value: draft.table.contact_discord, label: null, discord_server_url: null });
    }
    if (draft.table.contact_url) {
        const rawUrl = draft.table.contact_url;
        let channel = 'form';
        try {
            const parsed = new URL(rawUrl);
            channel =
                parsed.hostname === 'discord.com' || parsed.hostname.endsWith('.discord.com')
                    ? 'discord'
                    : 'form';
        }
        catch {
            channel = 'form';
        }
        if (!contacts.some((c) => c.channel === channel && c.value === rawUrl)) {
            contacts.push({ channel, value: rawUrl, label: 'Ticket / Inscrição', discord_server_url: null });
        }
    }
    return contacts;
}
function extractSchedules(draft) {
    const { day_of_week, start_time, frequency } = draft.table;
    if (!isDayOfWeek(day_of_week) || !start_time)
        return [];
    return [
        {
            day_of_week,
            start_time: start_time.includes(':') ? start_time : `${start_time}:00`,
            end_time: null,
            frequency: isScheduleFrequency(frequency) ? frequency : 'semanal',
            slots_per_session: null,
            notes: null,
        },
    ];
}
function buildTableData(draft, message, slug) {
    const t = draft.table;
    return {
        slug,
        gm_id: null,
        system_id: t.system_id ?? null,
        scenario_id: null,
        title: t.title ?? 'Mesa Sem Título',
        description: t.description ?? null,
        type: t.type ?? 'campanha',
        audience: 'livre',
        modality: t.modality ?? 'online',
        price_type: t.price_type ?? 'gratuita',
        price_value: t.price_value ?? null,
        price_frequency: t.price_type === 'paga' ? 'sessao' : null,
        slots_total: t.slots_total ?? t.slots_open ?? 0,
        slots_filled: t.slots_filled ?? 0,
        slots_open: t.slots_open ?? t.slots_total ?? 0,
        language: 'pt-BR',
        experience_level: 'todos',
        publisher_role: 'announcer',
        actual_gm_name: draft.source.author_name ?? null,
        is_covil: true,
        origin: 'imported',
        source_id: message.discord_message_id,
        source_url: message.discord_message_url ?? null,
        status: 'active',
        rules_notes: null,
        banner_url: null,
        is_ddal: false,
    };
}
/**
 * Sincroniza um draft para a tabela `tables`.
 * Idempotente: se já existir mesa com source_id = discord_message_id, atualiza em vez de criar.
 */
async function syncDiscordDraftToTable(draftId) {
    const draft = await db_1.db
        .selectFrom('discord_import_table_drafts')
        .selectAll()
        .where('id', '=', draftId)
        .executeTakeFirst();
    if (!draft)
        throw new Error(`Draft ${draftId} não encontrado.`);
    if (draft.status === 'synced') {
        if (!draft.table_id)
            throw new Error(`Draft ${draftId} marcado como synced mas sem table_id.`);
        return { tableId: draft.table_id, created: false };
    }
    if (draft.status === 'rejected')
        throw new Error(`Draft ${draftId} foi rejeitado e não pode ser sincronizado.`);
    const message = await db_1.db
        .selectFrom('discord_import_messages')
        .select(['id', 'discord_message_id', 'discord_message_url'])
        .where('id', '=', draft.discord_message_id)
        .executeTakeFirst();
    if (!message)
        throw new Error(`Mensagem referenciada pelo draft ${draftId} não encontrada.`);
    const payload = (draft.normalized_payload ?? draft.parsed_payload);
    if (!payload?.table)
        throw new Error(`Draft ${draftId} sem payload válido para sincronização.`);
    const contacts = extractContacts(payload);
    const schedules = extractSchedules(payload);
    // Verifica idempotência pelo source_id
    const existingTable = await db_1.db
        .selectFrom('tables')
        .select(['id'])
        .where('source_id', '=', message.discord_message_id)
        .executeTakeFirst();
    let tableId;
    let created;
    if (existingTable) {
        // UPDATE: atualiza campos sem filtrar por gm_id (tabela importada pode ter gm_id null)
        tableId = existingTable.id;
        created = false;
        await db_1.db.transaction().execute(async (trx) => {
            const t = payload.table;
            await trx
                .updateTable('tables')
                .set({
                title: t.title ?? 'Mesa Sem Título',
                description: t.description ?? null,
                type: t.type ?? 'campanha',
                modality: t.modality ?? 'online',
                price_type: t.price_type ?? 'gratuita',
                price_value: t.price_value ?? null,
                price_frequency: t.price_type === 'paga' ? 'sessao' : null,
                slots_total: t.slots_total ?? t.slots_open ?? 0,
                slots_filled: t.slots_filled ?? 0,
                slots_open: t.slots_open ?? t.slots_total ?? 0,
                system_id: t.system_id ?? null,
                actual_gm_name: payload.source.author_name ?? null,
                is_covil: true,
                updated_at: new Date(),
            })
                .where('id', '=', tableId)
                .execute();
            await trx.deleteFrom('table_contacts').where('table_id', '=', tableId).execute();
            const uniqueContacts = contacts.filter((c, i, arr) => arr.findIndex((x) => x.channel === c.channel && x.value === c.value) === i);
            if (uniqueContacts.length > 0) {
                await trx
                    .insertInto('table_contacts')
                    .values(uniqueContacts.map((c, i) => ({ ...c, table_id: tableId, sort_order: i })))
                    .execute();
            }
            await trx.deleteFrom('table_schedules').where('table_id', '=', tableId).execute();
            if (schedules.length > 0) {
                await trx
                    .insertInto('table_schedules')
                    .values(schedules.map((s, i) => ({ ...s, table_id: tableId, sort_order: i })))
                    .execute();
            }
        });
    }
    else {
        // INSERT
        created = true;
        const slug = tableService_1.TableService.generateSlug(payload.table.title ?? 'mesa-covil');
        const tableData = buildTableData(payload, message, slug);
        const inserted = await tableRepository_1.TableRepository.createTableWithRelations(tableData, contacts, schedules);
        tableId = inserted.id;
    }
    // Marca draft e mensagem como sincronizados
    await db_1.db.transaction().execute(async (trx) => {
        await trx
            .updateTable('discord_import_table_drafts')
            .set({ status: 'synced', table_id: tableId, updated_at: new Date() })
            .where('id', '=', draftId)
            .execute();
        await trx
            .updateTable('discord_import_messages')
            .set({ status: 'synced', updated_at: new Date() })
            .where('id', '=', message.id)
            .execute();
    });
    return { tableId, created };
}
