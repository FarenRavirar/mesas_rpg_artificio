"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableRepository = void 0;
const db_1 = require("../db");
const kysely_1 = require("kysely");
class TableRepository {
    /**
     * Busca mesa por ID e GM
     */
    static async findByIdAndGm(tableId, gmProfileId) {
        return await db_1.db
            .selectFrom('tables as t')
            .leftJoin('systems as s', 's.id', 't.system_id')
            .leftJoin('scenarios as sc', 'sc.id', 't.scenario_id')
            .leftJoin('communication_platforms as cp', 'cp.id', 't.communication_platform_id')
            .selectAll('t')
            .select([
            (0, kysely_1.sql) `s.name`.as('system_name'),
            (0, kysely_1.sql) `s.path_slug`.as('system_path'),
            (0, kysely_1.sql) `sc.name`.as('scenario_name'),
            (0, kysely_1.sql) `sc.slug`.as('scenario_path'),
            (0, kysely_1.sql) `COALESCE(cp.name, t.communication_platform)`.as('communication_platform'),
        ])
            .where('t.id', '=', tableId)
            .where('t.gm_id', '=', gmProfileId)
            .executeTakeFirst();
    }
    /**
     * Busca contatos da mesa
     */
    static async findContactsByTableId(tableId) {
        return await db_1.db
            .selectFrom('table_contacts')
            .select(['channel', 'value', 'label', 'discord_server_url', 'sort_order'])
            .where('table_id', '=', tableId)
            .orderBy('sort_order', 'asc')
            .execute();
    }
    /**
     * Busca schedules da mesa
     */
    static async findSchedulesByTableId(tableId) {
        return await db_1.db
            .selectFrom('table_schedules')
            .selectAll()
            .where('table_id', '=', tableId)
            .orderBy('sort_order', 'asc')
            .execute();
    }
    /**
     * Insere mesa com contatos e schedules em transação
     */
    static async createTableWithRelations(tableData, contacts, schedules) {
        return await db_1.db.transaction().execute(async (trx) => {
            const [insertedTable] = await trx
                .insertInto('tables')
                .values(tableData)
                .returning([
                'id',
                'slug',
                'title',
                'status',
                'publisher_role',
                'actual_gm_name',
                'is_ddal',
                'is_covil',
                'ddal_code',
                'ddal_name',
                'ddal_tier',
                'created_at',
            ])
                .execute();
            await trx
                .insertInto('table_contacts')
                .values(contacts.map((contact, index) => ({
                table_id: insertedTable.id,
                ...contact,
                sort_order: contact.sort_order ?? index,
            })))
                .execute();
            if (schedules && schedules.length > 0) {
                await trx
                    .insertInto('table_schedules')
                    .values(schedules.map((schedule, index) => ({
                    table_id: insertedTable.id,
                    ...schedule,
                    sort_order: schedule.sort_order ?? index,
                })))
                    .execute();
            }
            return insertedTable;
        });
    }
    /**
     * Atualiza mesa com contatos e schedules
     */
    static async updateTableWithRelations(tableId, gmProfileId, tableData, contacts, schedules) {
        return await db_1.db.transaction().execute(async (trx) => {
            const [updatedTable] = await trx
                .updateTable('tables')
                .set(tableData)
                .where('id', '=', tableId)
                .where('gm_id', '=', gmProfileId)
                .returning(['id', 'slug', 'title', 'status', 'updated_at'])
                .execute();
            if (!updatedTable)
                return null;
            if (contacts !== undefined) {
                await trx.deleteFrom('table_contacts').where('table_id', '=', tableId).execute();
                if (contacts.length > 0) {
                    await trx
                        .insertInto('table_contacts')
                        .values(contacts.map((contact, index) => ({
                        table_id: tableId,
                        ...contact,
                        sort_order: contact.sort_order ?? index,
                    })))
                        .execute();
                }
            }
            if (schedules !== undefined) {
                await trx.deleteFrom('table_schedules').where('table_id', '=', tableId).execute();
                if (schedules.length > 0) {
                    await trx
                        .insertInto('table_schedules')
                        .values(schedules.map((schedule, index) => ({
                        table_id: tableId,
                        ...schedule,
                        sort_order: index,
                    })))
                        .execute();
                }
            }
            return updatedTable;
        });
    }
    /**
     * Deleta mesa com relações
     */
    static async deleteTableWithRelations(tableId) {
        return await db_1.db.transaction().execute(async (trx) => {
            await trx.deleteFrom('table_schedules').where('table_id', '=', tableId).execute();
            await trx.deleteFrom('table_contacts').where('table_id', '=', tableId).execute();
            await trx.deleteFrom('tables').where('id', '=', tableId).execute();
        });
    }
}
exports.TableRepository = TableRepository;
