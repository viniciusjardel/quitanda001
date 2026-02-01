import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migratePrices() {
  try {
    console.log('🔄 Iniciando migração de preços por unidade...\n');

    // Obter todos os produtos
    const result = await pool.query('SELECT id, name, price, unit, units FROM produtos ORDER BY created_at');
    const produtos = result.rows;

    console.log(`📦 Total de produtos a atualizar: ${produtos.length}\n`);

    for (const product of produtos) {
      // Parsear units
      let units = [];
      if (product.units) {
        try {
          units = JSON.parse(product.units);
        } catch (e) {
          units = [product.unit];
        }
      } else {
        units = [product.unit];
      }

      // Criar objeto de preços
      const prices = {};
      units.forEach(unit => {
        prices[unit] = parseFloat(product.price);
      });

      // Atualizar produto com os preços por unidade
      await pool.query(
        'UPDATE produtos SET prices = $1 WHERE id = $2',
        [JSON.stringify(prices), product.id]
      );

      console.log(`✅ ${product.name}`);
      console.log(`   Preço padrão: R$ ${product.price}`);
      console.log(`   Unidades: ${units.join(', ')}`);
      console.log(`   Preços por unidade:`, prices);
      console.log('');
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log(`📊 ${produtos.length} produtos atualizados\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migratePrices();
