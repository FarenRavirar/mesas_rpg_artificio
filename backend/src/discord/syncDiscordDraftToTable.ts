import { db } from '../db';
import { Insertable } from 'kysely';
import { TablesTable, TableContactsTable, TableSchedulesTable, DayOfWeek, ScheduleFrequency, TableContactChannel } from '../db/types';
import { TableRepository } from '../repositories/tableRepository';
import { TableService } from '../services/tableService';
import type { DiscordTableDraft } from './types';

export interface SyncResult {
  tableId: string;
  created: boolean;
}

const VALID_DAYS: DayOfWeek[] = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const VALID_FREQ: ScheduleFrequency[] = ['semanal', 'quinzenal', 'mensal', 'avulsa'];
const VALID_CHANNELS: TableContactChannel[] = ['whatsapp', 'discord', 'phone', 'email', 'facebook', 'instagram', 'form'];

function isDayOfWeek(v: unknown): v is DayOfWeek {
  return typeof v === 'string' && (VALID_DAYS as string[]).includes(v);
}

function isScheduleFrequency(v: unknown): v is ScheduleFrequency {
  return typeof v === 'string' && (VALID_FREQ as string[]).includes(v);
}

function isTableContactChannel(v: unknown): v is TableContactChannel {
  return typeof v === 'string' && (VALID_CHANNELS as string[]).includes(v);
}

function extractContacts(
  draft: DiscordTableDraft
): Array<Omit<Insertable<TableContactsTable>, 'table_id'>> {
  const contacts: Array<Omit<Insertable<TableContactsTable>, 'table_id'>> = [];

  if (draft.table.contact_discord) {
    contacts.push({ channel: 'discord', value: draft.table.contact_discord, label: null, discord_server_url: null });
  }

  if (draft.table.contact_url) {
    const url = draft.table.contact_url;
    const channel: TableContactChannel = url.includes('discord.com') ? 'discord' : 'form';
    if (!contacts.some((c) => c.channel === channel && c.value === url)) {
      contacts.push({ channel, value: url, label: 'Ticket / Inscrição', discord_server_url: null });
    }
  }

  return contacts;
}

function extractSchedules(
  draft: DiscordTableDraft
): Array<Omit<Insertable<TableSchedulesTable>, 'table_id'>> {
  const { day_of_week, start_time, frequency } = draft.table;

  if (!isDayOfWeek(day_of_week) || !start_time) return [];

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

function buildTableData(
  draft: DiscordTableDraft,
  message: { discord_message_id: string; discord_message_url: string | null },
  slug: string
): Insertable<TablesTable> {
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
export async function syncDiscordDraftToTable(draftId: string): Promise<SyncResult> {
  const draft = await db
    .selectFrom('discord_import_table_drafts')
    .selectAll()
    .where('id', '=', draftId)
    .executeTakeFirst();

  if (!draft) throw new Error(`Draft ${draftId} não encontrado.`);
  if (draft.status === 'synced') {
    if (!draft.table_id) throw new Error(`Draft ${draftId} marcado como synced mas sem table_id.`);
    return { tableId: draft.table_id, created: false };
  }
  if (draft.status === 'rejected') throw new Error(`Draft ${draftId} foi rejeitado e não pode ser sincronizado.`);

  const message = await db
    .selectFrom('discord_import_messages')
    .select(['id', 'discord_message_id', 'discord_message_url'])
    .where('id', '=', draft.discord_message_id)
    .executeTakeFirst();

  if (!message) throw new Error(`Mensagem referenciada pelo draft ${draftId} não encontrada.`);

  const payload = (draft.normalized_payload ?? draft.parsed_payload) as DiscordTableDraft;
  if (!payload?.table) throw new Error(`Draft ${draftId} sem payload válido para sincronização.`);

  const contacts = extractContacts(payload);
  const schedules = extractSchedules(payload);

  // Verifica idempotência pelo source_id
  const existingTable = await db
    .selectFrom('tables')
    .select(['id'])
    .where('source_id', '=', message.discord_message_id)
    .executeTakeFirst();

  let tableId: string;
  let created: boolean;

  if (existingTable) {
    // UPDATE: atualiza campos sem filtrar por gm_id (tabela importada pode ter gm_id null)
    tableId = existingTable.id;
    created = false;

    await db.transaction().execute(async (trx) => {
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
      if (contacts.length > 0) {
        await trx
          .insertInto('table_contacts')
          .values(contacts.map((c, i) => ({ ...c, table_id: tableId, sort_order: i })))
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
  } else {
    // INSERT
    created = true;
    const slug = TableService.generateSlug(payload.table.title ?? 'mesa-covil');
    const tableData = buildTableData(payload, message, slug);
    const inserted = await TableRepository.createTableWithRelations(tableData, contacts, schedules);
    tableId = inserted.id;
  }

  // Marca draft e mensagem como sincronizados
  await db.transaction().execute(async (trx) => {
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
