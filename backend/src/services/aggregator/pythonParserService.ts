/**
 * Python Parser Service
 * 
 * Serviço para invocar o parser Python de mensagens do Discord via child_process.
 * Extrai campos estruturados de anúncios de mesas de RPG.
 */

import { spawn } from 'child_process';
import path from 'path';

/**
 * Metadados da mensagem original
 */
interface ParserMetadata {
  author_username?: string;
  author_handle?: string;
  timestamp?: string;
  message_id?: string;
}

/**
 * Resultado do parsing Python
 */
interface ParsedMessageResult {
  title?: string;
  system?: string;
  type?: string;
  modality?: string;
  slots?: number;
  language?: string;
  starts_at?: string;
  schedule?: string;
  frequency?: string;
  price_type?: string;
  price_amount?: number;
  description?: string;
  rules_notes?: string;
  actual_gm_name?: string;
  contacts?: Array<{
    channel: string;
    value: string;
    extra_url?: string;
  }>;
  confidence?: number;
  validation_error?: string;
  
  // REQ-28: Cenário e estilos
  setting_name?: string;
  setting_styles?: string[];
}

/**
 * Invoca o parser Python para extrair campos estruturados de uma mensagem do Discord.
 * 
 * @param content - Conteúdo bruto da mensagem
 * @param metadata - Metadados opcionais (author, timestamp, etc.)
 * @returns Campos extraídos e validados
 */
export async function parseMessage(
  content: string,
  metadata?: ParserMetadata
): Promise<ParsedMessageResult> {
  return new Promise((resolve, reject) => {
    // Caminho correto para o script Python (relativo a este arquivo)
    const scriptPath = path.join(
      __dirname,
      'parser',
      'discord_message_parser.py'
    );

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
    const pythonProcess = spawn(pythonCmd, args, {
      cwd: path.join(__dirname, '..', '..'),
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
      } catch (error) {
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
export async function isPythonParserAvailable(): Promise<boolean> {
  try {
    const testContent = '# Teste\n▬ **Sistema:** D&D';
    const result = await parseMessage(testContent);
    return result.title === 'Teste';
  } catch (error) {
    console.warn('[Python Parser] Não disponível:', error);
    return false;
  }
}
