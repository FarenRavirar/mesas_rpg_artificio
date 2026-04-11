#!/usr/bin/env node

/**
 * sync-arquitetura.js
 * Lê o diff do último merge em dev e propõe atualizações
 * no ARQUITETURA_PROJETO.md via 9router.
 *
 * Uso: node scripts/sync-arquitetura.js
 *
 * Variáveis de ambiente:
 *   ROUTER_URL      URL do 9router (ex: https://router.artificiorpg.com)
 *   ROUTER_API_KEY  API key gerada no dashboard do 9router
 *   ROUTER_MODEL    Modelo a usar (padrão: if/kimi-k2-thinking)
 *
 * Input:  /tmp/last_merge.diff  (gerado pelo workflow CI)
 * Output: /tmp/arquitetura_patch.md (patches propostos por seção)
 */

const fs = require('fs');
const path = require('path');

const DIFF_PATH = '/tmp/last_merge.diff';
const ARQUITETURA_PATH = path.join(process.cwd(), 'ARQUITETURA_PROJETO.md');
const OUTPUT_PATH = '/tmp/arquitetura_patch.md';

const ROUTER_URL = process.env.ROUTER_URL || 'http://localhost:20128';
const ROUTER_API_KEY = process.env.ROUTER_API_KEY || 'dummy';
const MODEL = process.env.ROUTER_MODEL || 'if/kimi-k2-thinking';

// Mapeamento de padrões no diff para seções do ARQUITETURA_PROJETO.md
const SECAO_MAP = [
  { pattern: /docker-compose|Dockerfile|container_name|mesas-beta/i, secao: '§3 Infraestrutura e Ambientes' },
  { pattern: /migration_|CREATE TABLE|ALTER TABLE|database\//i, secao: '§4 Banco de Dados' },
  { pattern: /routes\/auth|jwt|oauth|google/i, secao: '§6 Autenticação' },
  { pattern: /routes\/tables|routes\/gm|routes\/admin/i, secao: '§12 Rotas de API' },
  { pattern: /imgur|sharp|upload|avatar|banner/i, secao: '§16 Imagens e Upload' },
  { pattern: /deploy-beta\.yml|deploy-production\.yml|ci\.yml/i, secao: '§3 Infraestrutura — CI/CD' },
  { pattern: /aggregator|parser|candidat/i, secao: '§7 AggregatorBot' },
  { pattern: /roles|requireRole|admin|player|gm/i, secao: '§5 Roles e Permissões' },
];

async function main() {
  if (!fs.existsSync(DIFF_PATH)) {
    console.log('Nenhum diff encontrado. Nada a fazer.');
    process.exit(0);
  }

  if (!fs.existsSync(ARQUITETURA_PATH)) {
    console.error('ERRO: ARQUITETURA_PROJETO.md não encontrado');
    process.exit(1);
  }

  const diff = fs.readFileSync(DIFF_PATH, 'utf8');
  const arquitetura = fs.readFileSync(ARQUITETURA_PATH, 'utf8');

  // Detectar quais seções foram afetadas pelo diff
  const secoesAfetadas = SECAO_MAP
    .filter(({ pattern }) => pattern.test(diff))
    .map(({ secao }) => secao);

  if (secoesAfetadas.length === 0) {
    console.log('Diff não afeta seções documentadas. Nada a atualizar.');
    fs.writeFileSync(
      OUTPUT_PATH,
      '# Nenhuma atualização necessária\n\nO diff do último merge não afeta seções documentadas no ARQUITETURA_PROJETO.md.\n'
    );
    process.exit(0);
  }

  console.log('Seções afetadas:', secoesAfetadas.join(', '));

  // Extrair apenas as seções afetadas — não envia o doc inteiro (1396 linhas)
  const secoesTrecho = secoesAfetadas.map(secao => {
    const secaoNum = secao.match(/§(\d+)/)?.[1];
    if (!secaoNum) return '';
    const regex = new RegExp(`## ${secaoNum}\\..*?(?=## \\d+\\.|$)`, 's');
    const match = arquitetura.match(regex);
    return match ? match[0].slice(0, 3000) : '';
  }).filter(Boolean).join('\n\n---\n\n');

  const prompt = `Você é um assistente técnico que mantém documentação de arquitetura atualizada.

## Contexto

Houve um merge aprovado (branch dev) no projeto "Anúncios de Mesas RPG".
Abaixo está o diff do merge e as seções do ARQUITETURA_PROJETO.md que podem estar desatualizadas.

## Diff do merge

\`\`\`diff
${diff.slice(0, 8000)}
\`\`\`

## Seções afetadas do ARQUITETURA_PROJETO.md

${secoesTrecho}

## Tarefa

1. Analise o diff e identifique o que mudou de fato na arquitetura
2. Para cada seção afetada, proponha APENAS o texto atualizado necessário
3. Seja cirúrgico — não reescreva o que não mudou
4. Se uma seção não precisa de mudança, diga explicitamente

## Formato de saída

Para cada seção que precisar de atualização:

### Atualização: [nome da seção]

**Motivo:** [o que mudou no diff que justifica a atualização]

**Trecho atual:**
\`\`\`
[texto atual desatualizado]
\`\`\`

**Trecho proposto:**
\`\`\`
[texto atualizado]
\`\`\`

Se nenhuma seção precisar de atualização, responda apenas:
"Nenhuma atualização necessária. O diff não altera informações documentadas."`;

  console.log(`Consultando 9router em ${ROUTER_URL}...`);
  console.log(`Modelo: ${MODEL}`);

  try {
    const response = await fetch(`${ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`9router retornou ${response.status}: ${err}`);
    }

    const data = await response.json();
    const resultado = data.choices?.[0]?.message?.content ?? '';

    if (!resultado) {
      throw new Error('9router retornou resposta vazia');
    }

    const output = `# Sync ARQUITETURA_PROJETO.md

> Gerado automaticamente após merge em dev
> Data: ${new Date().toISOString()}
> Modelo: ${MODEL}
> Seções analisadas: ${secoesAfetadas.join(', ')}

---

${resultado}
`;

    fs.writeFileSync(OUTPUT_PATH, output);
    console.log(`Resultado salvo em ${OUTPUT_PATH}`);

    if (resultado.includes('Nenhuma atualização necessária')) {
      console.log('Nenhuma atualização necessária.');
      process.exit(0);
    }

    console.log('Atualizações propostas. Workflow abrirá PR de documentação.');
    process.exit(0);

  } catch (err) {
    console.error('Erro ao consultar 9router:', err.message);
    fs.writeFileSync(OUTPUT_PATH, `# Erro no sync\n\nErro: ${err.message}\n`);
    process.exit(1);
  }
}

main();
