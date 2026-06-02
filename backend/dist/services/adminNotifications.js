"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAdmins = notifyAdmins;
const db_1 = require("../db");
/**
 * Cria uma notificacao para cada admin, exceto `excludeUserId`.
 * Nao-fatal: erros sao logados e engolidos para nao quebrar a acao principal.
 * Nao use dentro de transacao: erro SQL em transacao aborta o contexto do chamador.
 */
async function notifyAdmins(input) {
    try {
        let query = db_1.db.selectFrom('users').select('id').where('role', '=', 'admin');
        if (input.excludeUserId) {
            query = query.where('id', '!=', input.excludeUserId);
        }
        const admins = await query.execute();
        if (admins.length === 0)
            return;
        await db_1.db
            .insertInto('notifications')
            .values(admins.map((admin) => ({
            user_id: admin.id,
            type: input.type,
            title: input.title,
            message: input.message,
            action_url: input.action_url ?? null,
            metadata: JSON.stringify(input.metadata ?? {}),
        })))
            .execute();
    }
    catch (error) {
        console.error('[notifyAdmins]', input.type, error);
    }
}
