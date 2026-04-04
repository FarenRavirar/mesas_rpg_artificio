import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usar DATABASE_URL do ambiente ou padrão local
// IMPORTANTE: Ajuste a URL conforme seu ambiente local
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mesas_rpg';

console.log('🔧 Configuração:');
console.log(`   DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({
  connectionString: DATABASE_URL
});

async function applyMigrations() {
  console.log('🔄 Iniciando processo de migração...');
  console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  
  let client;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    client = await pool.connect();
    console.log('✅ Conexão estabelecida!');
    
    // Ler arquivo de migração consolidado
    const migrationPath = join(__dirname, '..', 'database', 'apply_migrations_06_07.sql');
    console.log(`📄 Lendo arquivo: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📏 Tamanho do arquivo: ${migrationSQL.length} bytes`);
    
    console.log('📄 Aplicando migrações...');
    await client.query(migrationSQL);
    
    console.log('✅ Migrações aplicadas com sucesso!');
    
    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('system_suggestions', 'notifications')
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Contar registros
    const suggestionCount = await client.query('SELECT COUNT(*) FROM system_suggestions');
    const notificationCount = await client.query('SELECT COUNT(*) FROM notifications');
    
    console.log('\n📈 Registros atuais:');
    console.log(`   - system_suggestions: ${suggestionCount.rows[0].count}`);
    console.log(`   - notifications: ${notificationCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigrations()
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha ao aplicar migrações:', error.message);
    process.exit(1);
  });
