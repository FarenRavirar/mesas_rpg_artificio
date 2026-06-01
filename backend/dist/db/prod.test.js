"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prod_1 = require("./prod");
describe('Prod DB Connection', () => {
    it('should export a prodDb instance', () => {
        expect(prod_1.prodDb).toBeDefined();
        expect(prod_1.prodDb.isProdConnection).toBe(true);
    });
});
