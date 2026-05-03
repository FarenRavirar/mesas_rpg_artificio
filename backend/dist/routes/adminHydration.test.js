"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const adminHydration_1 = __importDefault(require("./adminHydration"));
const app = (0, express_1.default)();
app.use('/api/v1/admin', adminHydration_1.default);
describe('Admin Hydration Routes', () => {
    it('should return 403 when not authenticated', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/v1/admin/sync/hydrate');
        expect(res.status).toBe(401);
    });
});
