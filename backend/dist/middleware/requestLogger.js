"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.logDatabaseError = logDatabaseError;
exports.rotateLogs = rotateLogs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Diretório de logs dentro do /app onde o container tem permissão
const LOG_DIR = '/app/logs';
const LOG_FILE = path_1.default.join(LOG_DIR, 'routes.log');
// Criar diretório se não existir
try {
    if (!fs_1.default.existsSync(LOG_DIR)) {
        fs_1.default.mkdirSync(LOG_DIR, { recursive: true, mode: 0o755 });
    }
}
catch (error) {
    console.error('[RequestLogger] Erro ao criar diretório de logs:', error);
}
/**
 * Gera ID único para cada requisição
 */
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Formata entrada de log como linha de texto
 */
function formatLogLine(entry) {
    const base = `[${entry.timestamp}] ${entry.method} ${entry.path} | ReqID: ${entry.requestId}`;
    if ('error' in entry) {
        return `${base} | ERROR: ${entry.error.message} | Code: ${entry.error.code || 'N/A'} | Duration: ${entry.duration}ms | Params: ${JSON.stringify(entry.params)} | Query: ${JSON.stringify(entry.query)}\n`;
    }
    return `${base} | Params: ${JSON.stringify(entry.params)} | Query: ${JSON.stringify(entry.query)} | IP: ${entry.ip}\n`;
}
/**
 * Escreve log no arquivo
 */
function writeLog(line) {
    try {
        fs_1.default.appendFileSync(LOG_FILE, line, { encoding: 'utf8', mode: 0o644 });
    }
    catch (error) {
        console.error('[RequestLogger] Erro ao escrever log:', error);
    }
}
/**
 * Middleware de logging de requisições
 */
function requestLogger(req, res, next) {
    const requestId = generateRequestId();
    const startTime = Date.now();
    // Adicionar requestId ao objeto de requisição para uso posterior
    req.requestId = requestId;
    // Log de entrada
    const entry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId,
    };
    writeLog(formatLogLine(entry));
    // Interceptar resposta para log de erro
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        // Se status >= 400, logar como erro
        if (res.statusCode >= 400) {
            let errorMessage = 'Unknown error';
            let errorData = {};
            try {
                errorData = typeof data === 'string' ? JSON.parse(data) : data;
                errorMessage = errorData.error || errorData.message || errorMessage;
            }
            catch {
                errorMessage = String(data).substring(0, 200);
            }
            const errorEntry = {
                ...entry,
                timestamp: new Date().toISOString(),
                error: {
                    message: errorMessage,
                    code: res.statusCode.toString(),
                },
                duration,
            };
            writeLog(formatLogLine(errorEntry));
        }
        return originalSend.call(this, data);
    };
    next();
}
/**
 * Função auxiliar para logar erros de query do banco
 */
function logDatabaseError(req, error, context) {
    const requestId = req.requestId || 'unknown';
    const errorEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId,
        error: {
            message: error.message || 'Database error',
            code: error.code || 'DB_ERROR',
            stack: error.stack?.split('\n').slice(0, 3).join(' | '),
        },
        duration: 0,
    };
    const line = `[${errorEntry.timestamp}] DB_ERROR in ${context.route} (${context.operation}) | ReqID: ${requestId} | Error: ${errorEntry.error.message} | PG Code: ${errorEntry.error.code} | Params: ${JSON.stringify(errorEntry.params)}\n`;
    writeLog(line);
    console.error(`[DB_ERROR] ${context.route}:`, error);
}
/**
 * Rotaciona logs quando arquivo fica muito grande (> 10MB)
 */
function rotateLogs() {
    try {
        const stats = fs_1.default.statSync(LOG_FILE);
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (stats.size > maxSize) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archiveFile = path_1.default.join(LOG_DIR, `routes-${timestamp}.log`);
            fs_1.default.renameSync(LOG_FILE, archiveFile);
            console.log(`[RequestLogger] Log rotacionado: ${archiveFile}`);
            // Manter apenas últimos 5 arquivos
            const files = fs_1.default.readdirSync(LOG_DIR)
                .filter(f => f.startsWith('routes-') && f.endsWith('.log'))
                .sort()
                .reverse();
            if (files.length > 5) {
                files.slice(5).forEach(f => {
                    fs_1.default.unlinkSync(path_1.default.join(LOG_DIR, f));
                    console.log(`[RequestLogger] Log antigo removido: ${f}`);
                });
            }
        }
    }
    catch (error) {
        console.error('[RequestLogger] Erro ao rotacionar logs:', error);
    }
}
// Rotacionar logs a cada 6 horas
setInterval(rotateLogs, 6 * 60 * 60 * 1000);
