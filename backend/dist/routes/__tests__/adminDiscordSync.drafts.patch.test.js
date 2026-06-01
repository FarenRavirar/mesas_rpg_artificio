"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
jest.mock('../../db', () => ({
    db: {
        updateTable: jest.fn(),
        selectFrom: jest.fn(),
    },
}));
jest.mock('../../middleware/auth', () => ({
    authMiddleware: (req, _res, next) => {
        req.user = { userId: 'admin-test', role: 'admin' };
        next();
    },
}));
const { db: mockDb } = jest.requireMock('../../db');
const adminDiscordSyncRoutes = jest.requireActual('../adminDiscordSync').default;
function makeApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/admin/discord-sync', adminDiscordSyncRoutes);
    return app;
}
function mockCurrentDraft(normalizedPayload) {
    const selectChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({
            id: 'draft-1',
            normalized_payload: normalizedPayload,
        }),
    };
    mockDb.selectFrom.mockReturnValue(selectChain);
    return selectChain;
}
function mockUpdatedDraft() {
    const updateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([{
                id: 'draft-1',
                status: 'ready',
                normalized_payload: {
                    missing_fields: ['day_of_week'],
                },
            }]),
    };
    mockDb.updateTable.mockReturnValue(updateChain);
    return updateChain;
}
describe('PATCH /admin/discord-sync/drafts/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCurrentDraft({ missing_fields: ['day_of_week'] });
        mockUpdatedDraft();
    });
    it('rejects marking a draft as ready when required fields are missing', async () => {
        const response = await (0, supertest_1.default)(makeApp())
            .patch('/admin/discord-sync/drafts/draft-1')
            .send({ status: 'ready' });
        expect(response.status).toBe(422);
        expect(response.body).toEqual({
            error: "Draft ainda tem 1 campo(s) faltando (day_of_week); não pode ser marcado como 'ready'.",
            details: { missing_fields: ['day_of_week'] },
        });
        expect(mockDb.updateTable).not.toHaveBeenCalled();
    });
});
