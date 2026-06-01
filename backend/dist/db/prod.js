"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prodDb = void 0;
const pg_1 = require("pg");
const kysely_1 = require("kysely");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Lazy-initialized singleton instance
let _prodDbInstance = null;
function getProdDb() {
    if (_prodDbInstance)
        return _prodDbInstance;
    const prodUrl = process.env.PROD_DB_URL;
    if (!prodUrl) {
        throw new Error('PROD_DB_URL environment variable is required for production database connection');
    }
    const dialect = new kysely_1.PostgresDialect({
        pool: new pg_1.Pool({
            connectionString: prodUrl,
            max: 5,
        }),
    });
    _prodDbInstance = new kysely_1.Kysely({ dialect });
    return _prodDbInstance;
}
// Proxy-based lazy loader: throws only on first actual use, not on import
exports.prodDb = new Proxy({}, {
    get(_target, prop) {
        // Special property for testing validation - returns true without initializing
        if (prop === 'isProdConnection')
            return true;
        // Lazy-initialize on first method/property access
        const instance = getProdDb();
        const value = instance[prop];
        // Bind methods to the instance to preserve 'this' context
        return typeof value === 'function' ? value.bind(instance) : value;
    },
});
