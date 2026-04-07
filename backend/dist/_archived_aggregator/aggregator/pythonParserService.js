"use strict";
/**
 * Python Parser Service
 *
 * Serviço para invocar o parser Python de mensagens do Discord via child_process.
 * Extrai campos estruturados de anúncios de mesas de RPG.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMessage = parseMessage;
exports.isPythonParserAvailable = isPythonParserAvailable;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
/**
 * Invoca o parser Python para extrair campos estruturados de uma mensagem do Discord.
 *
 * @param content - Conteúdo bruto da mensagem
 * @param metadata - Metadados opcionais (author, timestamp, etc.)
 * @returns Campos extraídos e validados
 */
async function parseMessage(content, metadata) {
    return new Promise((resolve, reject) => {
        // Caminho correto para o script Python (relativo a este arquivo)
        const scriptPath = path_1.default.join(__dirname, 'parser', 'discord_message_parser.py');
        // Preparar argumentos
        const args = [scriptPath, content];
        if (metadata) {
            args.push('--metadata', JSON.stringify(metadata));
        }
        // Usar python3 ou python conforme ambiente
        // No Linux/container: python3
        // No Windows: python
        const pythonCmd = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
        console.log(`[Python Parser] Executando: ${pythonCmd} ${scriptPath}`);
        // Spawn processo Python
        const pythonProcess = (0, child_process_1.spawn)(pythonCmd, args, {
            cwd: path_1.default.join(__dirname, '..', '..'),
            env: { ...process.env, PYTHONUNBUFFERED: '1' }, // Desabilitar buffer
        });
        let stdout = '';
        let stderr = '';
        // Capturar stdout
        pythonProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            // Log apenas primeiros 200 chars para não poluir
            if (chunk.length > 0) {
                console.log(`[Python Parser] Output chunk (${chunk.length} bytes):`, chunk.substring(0, 200));
            }
        });
        // Capturar stderr
        pythonProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            console.error(`[Python Parser] Error output:`, chunk);
        });
        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Python parser timeout (10s)'));
        }, 10000);
        // Processar resultado
        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                console.error('[Python Parser] Erro:', stderr);
                reject(new Error(`Python parser failed with code ${code}: ${stderr}`));
                return;
            }
            try {
                const result = JSON.parse(stdout);
                console.log(`[Python Parser] Sucesso - Confidence: ${result.confidence || 'N/A'}`);
                resolve(result);
            }
            catch (error) {
                console.error('[Python Parser] Erro ao parsear JSON:', stdout);
                reject(new Error(`Failed to parse Python output: ${error}`));
            }
        });
        // Erro ao spawnar processo
        pythonProcess.on('error', (error) => {
            clearTimeout(timeout);
            console.error('[Python Parser] Erro ao spawnar processo:', error);
            reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });
    });
}
/**
 * Testa se o parser Python está disponível e funcional.
 *
 * @returns true se o parser está disponível, false caso contrário
 */
async function isPythonParserAvailable() {
    try {
        const testContent = '# Teste\n▬ **Sistema:** D&D';
        const result = await parseMessage(testContent);
        return result.title === 'Teste';
    }
    catch (error) {
        console.warn('[Python Parser] Não disponível:', error);
        return false;
    }
}
