#!/usr/bin/env node

/**
 * sync-arquitetura.js
 * Analisa o diff do último merge em dev e gera um relatório
 * das seções do ARQUITETURA_PROJETO.md que precisam de revisão.
 *
 * Não depende de API externa. Funciona em qualquer ambiente.
 *
 * Input:  /tmp/last_merge.diff  (gerado pelo workflow CI)
 * Output: /tmp/arquitetura_patch.md (relatório de seções afetadas)
 */

const fs = require('fs');
const path = require('path');

const DIFF_PATH = '/tmp/last_merge.diff';
const ARQUITETURA_PATH = path.join(process.cwd(), 'ARQUITETURA_PROJETO.md');
const OUTPUT_PATH = '/tmp/arquitetura_patch.md';

// Mapeamento de padrões no diff para seções do ARQUITETURA_PROJETO.md
const SECAO_MAP = [
  {
    pattern: /docker-compose|Dockerfile|container_name|mesas-beta-frontend|mesas-beta-api|mesas-beta-db/i,
    secao: '§3 Infraestrutura e Ambientes',
    instrucao: 'Verificar nomes de containers, portas, volumes e configurações do compose.'
  },
  {
    pattern: /migration_|CREATE TABLE|ALTER TABLE|ADD COLUMN|DROP COLUMN|database\//i,
    secao: '§4 Banco de Dados',
    instrucao: 'Atualizar lista de migrations aplicadas e estrutura de tabelas.'
  },
  {
    pattern: /routes\/auth|jwt|oauth|google|JWT_EXPIRES/i,
    secao: '§6 Autenticação',
    instrucao: 'Verificar fluxo de autenticação, expiração de tokens e callbacks.'
  },
  {
    pattern: /routes\/tables|routes\/gm|routes\/admin|routes\/profile/i,
    secao: '§12 Rotas de API',
    instrucao: 'Atualizar mapa de rotas — verificar endpoints adicionados ou removidos.'
  },
  {
    pattern: /imgur|sharp|upload|avatar_url|banner_url|cover_url|deletehash/i,
    secao: '§16 Imagens e Upload',
    instrucao: 'Verificar pipeline de upload, campos de URL e campos de deletehash.'
  },
  {
    pattern: /deploy-beta\.yml|deploy-production\.yml|ci\.yml|sync-arquitetura/i,
    secao: '§3 Infraestrutura — CI/CD',
    instrucao: 'Atualizar descrição dos workflows e triggers de deploy.'
  },
  {
    pattern: /aggregator|parser|candidat|discord_message_parser/i,
    secao: '§7 AggregatorBot',
    instrucao: 'Verificar pipeline de ingestão, parser Python e campos extraídos.'
  },
  {
    pattern: /requireRole|publisher_role|gm_profile|role.*admin|role.*player/i,
    secao: '§5 Roles e Permissões',
    instrucao: 'Verificar lógica de elevação de role e proteção de rotas.'
  },
];

function extrairArquivosAlterados(diff) {
  const arquivos = [];
  const linhas = diff.split('\n');
  for (const linha of linhas) {
    if (linha.startsWith('+++ b/') || linha.startsWith('--- a/')) {
      const arquivo = linha.replace(/^(\+\+\+ b\/|--- a\/)/, '').trim();
      if (arquivo !== '/dev/null' && !arquivos.includes(arquivo)) {
        arquivos.push(arquivo);
      }
    }
  }
  return arquivos;
}

function extrairTrechoSecao(arquitetura, secaoNum) {
  const regex = new RegExp(`(## ${secaoNum}\\..+?)(?=## \\d+\\.|$)`, 's');
  const match = arquitetura.match(regex);
  return match ? match[0].slice(0, 500) + (match[0].length > 500 ? '\n[... trecho truncado ...]' : '') : null;
}

function main() {
  if (!fs.existsSync(DIFF_PATH)) {
    console.log('Nenhum diff encontrado. Nada a fazer.');
    process.exit(0);
  }

  const diff = fs.readFileSync(DIFF_PATH, 'utf8');

  if (!diff.trim()) {
    console.log('Diff vazio. Nada a fazer.');
    fs.writeFileSync(OUTPUT_PATH, '# Nenhuma atualização necessária\n\nDiff vazio.\n');
    process.exit(0);
  }

  const arquivosAlterados = extrairArquivosAlterados(diff);
  const secoesAfetadas = SECAO_MAP.filter(({ pattern }) => pattern.test(diff));

  if (secoesAfetadas.length === 0) {
    console.log('Diff não afeta seções documentadas. Nada a atualizar.');
    fs.writeFileSync(
      OUTPUT_PATH,
      '# Nenhuma atualização necessária\n\nO diff do último merge não afeta seções documentadas no ARQUITETURA_PROJETO.md.\n'
    );
    process.exit(0);
  }

  console.log('Seções afetadas:', secoesAfetadas.map(s => s.secao).join(', '));

  const arquitetura = fs.existsSync(ARQUITETURA_PATH)
    ? fs.readFileSync(ARQUITETURA_PATH, 'utf8')
    : null;

  const linhasOutput = [
    '# Sync ARQUITETURA_PROJETO.md',
    '',
    `> Gerado automaticamente após merge em dev`,
    `> Data: ${new Date().toISOString()}`,
    `> Arquivos alterados no merge: ${arquivosAlterados.length}`,
    '',
    '---',
    '',
    '## Arquivos alterados neste merge',
    '',
    ...arquivosAlterados.map(f => `- \`${f}\``),
    '',
    '---',
    '',
    '## Seções do ARQUITETURA_PROJETO.md que precisam de revisão',
    '',
    '> **Ação necessária:** Revise cada seção abaixo e atualize',
    '> o ARQUITETURA_PROJETO.md manualmente se necessário.',
    '',
  ];

  for (const { secao, instrucao, pattern } of secoesAfetadas) {
    const secaoNum = secao.match(/§(\d+)/)?.[1];
    const trecho = arquitetura && secaoNum ? extrairTrechoSecao(arquitetura, secaoNum) : null;

    linhasOutput.push(`### ${secao}`);
    linhasOutput.push('');
    linhasOutput.push(`**O que verificar:** ${instrucao}`);
    linhasOutput.push('');

    // Listar arquivos alterados que dispararam essa seção
    const arquivosRelacionados = arquivosAlterados.filter(f => pattern.test(f));
    if (arquivosRelacionados.length > 0) {
      linhasOutput.push('**Arquivos alterados relacionados:**');
      arquivosRelacionados.forEach(f => linhasOutput.push(`- \`${f}\``));
      linhasOutput.push('');
    }

    if (trecho) {
      linhasOutput.push('**Trecho atual no ARQUITETURA_PROJETO.md:**');
      linhasOutput.push('```');
      linhasOutput.push(trecho.trim());
      linhasOutput.push('```');
      linhasOutput.push('');
    }

    linhasOutput.push('---');
    linhasOutput.push('');
  }

  linhasOutput.push('## Como aplicar');
  linhasOutput.push('');
  linhasOutput.push('1. Abra o `ARQUITETURA_PROJETO.md`');
  linhasOutput.push('2. Navegue até cada seção listada acima');
  linhasOutput.push('3. Compare com os arquivos alterados e atualize o que estiver desatualizado');
  linhasOutput.push('4. Feche este PR após aplicar as atualizações necessárias');

  const output = linhasOutput.join('\n');
  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`Relatório salvo em ${OUTPUT_PATH}`);
  console.log(`${secoesAfetadas.length} seção(ões) precisam de revisão.`);
  process.exit(0);
}

main();
