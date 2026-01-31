import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function migrateDatabase() {
  console.log('🔧 INICIANDO MIGRAÇÃO: Adicionando coluna "units"...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 1. Verificar se coluna já existe
    console.log('1️⃣ Verificando se coluna "units" já existe...');
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='produtos' AND column_name='units'
    `);

    if (checkResult.rows.length > 0) {
      console.log('   ✅ Coluna "units" já existe!\n');
      console.log('✨ MIGRAÇÃO JÁ CONCLUÍDA - Nada para fazer!');
      return;
    }

    console.log('   ⚠️ Coluna não encontrada. Adicionando...\n');

    // 2. Adicionar coluna
    console.log('2️⃣ Adicionando coluna "units" TEXT na tabela produtos...');
    await pool.query(`ALTER TABLE produtos ADD COLUMN units TEXT`);
    console.log('   ✅ Coluna adicionada com sucesso!\n');

    // 3. Verificar dados
    console.log('3️⃣ Verificando estrutura da tabela...');
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='produtos'
      ORDER BY ordinal_position
    `);

    console.log('   📊 Colunas da tabela:');
    tableCheck.rows.forEach(row => {
      const icon = row.column_name === 'units' ? '✅ NEW' : '  ';
      console.log(`     ${icon} ${row.column_name}: ${row.data_type}`);
    });

    // 4. Contar produtos
    console.log('\n4️⃣ Produtos no banco:');
    const countResult = await pool.query('SELECT COUNT(*) as total FROM produtos');
    console.log(`   📦 Total: ${countResult.rows[0].total} produtos\n`);

    console.log('✨✨✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✨✨✨\n');
    console.log('🎉 Agora você pode:');
    console.log('   1. Editar produtos no admin panel');
    console.log('   2. Selecionar múltiplas unidades');
    console.log('   3. Salvar sem erros 500!\n');

  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error('\n📋 Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
migrateDatabase();
