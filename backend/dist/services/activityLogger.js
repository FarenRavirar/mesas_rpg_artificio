"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const db_1 = require("../db");
async function logActivity(input, trx) {
    try {
        const executor = trx ?? db_1.db;
        await executor
            .insertInto('activity_log')
            .values({
            actor_id: input.actorId,
            actor_role: input.actorRole ?? null,
            action: input.action,
            entity_type: input.entityType,
            entity_id: input.entityId,
            entity_label: input.entityLabel ?? null,
            target_user_id: input.targetUserId ?? null,
            summary: input.summary,
            metadata: JSON.stringify(input.metadata ?? {}),
        })
            .executeTakeFirst();
    }
    catch (err) {
        console.error('[activityLogger]', err);
    }
}
