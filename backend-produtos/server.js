import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// =======================
// PostgreSQL Database
// =======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err);
});

// Criar tabelas se não existirem
async function initializeTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        prices TEXT,
        image TEXT,
        category TEXT,
        unit TEXT NOT NULL,
        units TEXT,
        color TEXT,
        description TEXT,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        bloco TEXT,
        apto TEXT,
        delivery_type TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'pendente',
        payment_id TEXT,
        items TEXT NOT NULL,
        notes TEXT,
        cash_received DECIMAL(10,2),
        cash_change DECIMAL(10,2),
        total DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelas do banco de dados inicializadas');
    
    // Migração: Adicionar coluna prices se não existir
    await addPricesColumnIfNotExists();
    // Migração: Adicionar coluna status se não existir
    await addStatusColumnIfNotExists();
    // Migração: Adicionar colunas de troco/cash se não existirem
    await addCashColumnsIfNotExists();
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Adicionar colunas cash_received e cash_change na tabela pedidos se não existirem
async function addCashColumnsIfNotExists() {
  try {
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pedidos' AND column_name IN ('cash_received', 'cash_change')
    `);

    const existing = checkColumns.rows.map(r => r.column_name);

    if (!existing.includes('cash_received')) {
      console.log('🔄 Adicionando coluna cash_received à tabela pedidos...');
      await pool.query(`ALTER TABLE pedidos ADD COLUMN cash_received DECIMAL(10,2);`);
      console.log('✅ Coluna cash_received adicionada com sucesso!');
    } else {
      console.log('✅ Coluna cash_received já existe na tabela pedidos');
    }

    if (!existing.includes('cash_change')) {
      console.log('🔄 Adicionando coluna cash_change à tabela pedidos...');
      await pool.query(`ALTER TABLE pedidos ADD COLUMN cash_change DECIMAL(10,2);`);
      console.log('✅ Coluna cash_change adicionada com sucesso!');
    } else {
      console.log('✅ Coluna cash_change já existe na tabela pedidos');
    }
  } catch (error) {
    console.error('⚠️ Erro ao verificar/adicionar colunas de troco:', error.message);
  }
}

// Adicionar coluna prices se não existir
async function addPricesColumnIfNotExists() {
  try {
    // Verificar se a coluna existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'prices'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Coluna não existe, adicionar
      console.log('🔄 Adicionando coluna prices à tabela produtos...');
      await pool.query(`
        ALTER TABLE produtos ADD COLUMN prices TEXT;
      `);
      console.log('✅ Coluna prices adicionada com sucesso!');
    } else {
      console.log('✅ Coluna prices já existe na tabela produtos');
    }
  } catch (error) {
    console.error('⚠️ Erro ao verificar/adicionar coluna prices:', error.message);
  }
}

// Adicionar coluna status se não existir
async function addStatusColumnIfNotExists() {
  try {
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'status'
    `);
    if (checkColumn.rows.length === 0) {
      console.log('🔄 Adicionando coluna status à tabela produtos...');
      await pool.query(`ALTER TABLE produtos ADD COLUMN status TEXT DEFAULT 'available';`);
      console.log('✅ Coluna status adicionada com sucesso!');
    } else {
      console.log('✅ Coluna status já existe na tabela produtos');
    }
  } catch (error) {
    console.error('⚠️ Erro ao verificar/adicionar coluna status:', error.message);
  }
}

// Inicializar tabelas
await initializeTables();

// =======================
// Health Check
// =======================
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Produtos Quitanda Villa Natal',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// =======================
// GET todos os produtos
// =======================
app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY created_at DESC');
    const produtos = result.rows.map(p => {
      let units = null;
      let prices = null;
      
      // Parsear units
      if (p.units) {
        try {
          units = JSON.parse(p.units);
        } catch (e) {
          console.warn(`⚠️ Erro ao parsear units do produto ${p.id}:`, e.message);
          units = null;
        }
      }
      
      // Parsear prices
      if (p.prices) {
        try {
          prices = JSON.parse(p.prices);
        } catch (e) {
          console.warn(`⚠️ Erro ao parsear prices do produto ${p.id}:`, e.message);
          prices = null;
        }
      }
      
        return {
          ...p,
          price: parseFloat(p.price),
          units: units,
          prices: prices,
          status: p.status || 'available'
        };
    });
    console.log(`📦 GET /produtos: ${produtos.length} produtos`);
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// =======================
// GET um produto específico
// =======================
app.get('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    const produto = result.rows[0];
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    let units = null;
    let prices = null;
    
    // Parsear units
    if (produto.units) {
      try {
        units = JSON.parse(produto.units);
      } catch (e) {
        console.warn(`⚠️ Erro ao parsear units do produto ${id}:`, e.message);
        units = null;
      }
    }
    
    // Parsear prices
    if (produto.prices) {
      try {
        prices = JSON.parse(produto.prices);
      } catch (e) {
        console.warn(`⚠️ Erro ao parsear prices do produto ${id}:`, e.message);
        prices = null;
      }
    }
    
    res.json({
      ...produto,
      price: parseFloat(produto.price),
      units: units,
      prices: prices
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// =======================
// POST novo produto
// =======================
app.post('/produtos', async (req, res) => {
  try {
    const { id, name, price, prices, image, category, unit, units, color, description, status } = req.body;

    // Validar campos obrigatórios
    if (!id || !name || price === undefined || !unit) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: id, name, price, unit',
        received: { id: !!id, name: !!name, price: price !== undefined, unit: !!unit }
      });
    }

    // Validar e converter preço
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Preço inválido ou negativo' });
    }

    // Converter array units para JSON string
    let unitsJson = null;
    if (units) {
      if (Array.isArray(units)) {
        unitsJson = JSON.stringify(units);
      } else if (typeof units === 'string') {
        try {
          JSON.parse(units);
          unitsJson = units;
        } catch (e) {
          unitsJson = JSON.stringify([units]);
        }
      }
    }

    // Converter object prices para JSON string
    let pricesJson = null;
    if (prices) {
      if (typeof prices === 'object') {
        pricesJson = JSON.stringify(prices);
      } else if (typeof prices === 'string') {
        try {
          JSON.parse(prices);
          pricesJson = prices;
        } catch (e) {
          console.warn('⚠️ Prices inválido:', prices);
        }
      }
    }

    console.log('📝 Criando produto:', { id, name, price: priceNum, unit, units, prices });

    // Converter category para JSON quando for array
    let categoryToStore = null;
    if (category) {
      if (Array.isArray(category)) categoryToStore = JSON.stringify(category);
      else if (typeof category === 'string') {
        try { JSON.parse(category); categoryToStore = category; } catch(e) { categoryToStore = category; }
      }
    }

    await pool.query(
      `INSERT INTO produtos (id, name, price, prices, image, category, unit, units, color, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, name, priceNum, pricesJson, image || null, categoryToStore || null, unit, unitsJson, color || null, description || null, status || 'available']
    );
    
    console.log(`✅ Produto criado: ${name} (${id})`);
    console.log(`   Unidades: ${units ? (Array.isArray(units) ? units.join(', ') : units) : unit}`);
    console.log(`   Preços: ${pricesJson || 'não especificados'}`);
    res.status(201).json({ 
      message: 'Produto criado com sucesso',
      id: id
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Produto com este ID já existe' });
    }
    console.error('❌ Erro ao criar produto:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao criar produto', details: error.message });
  }
});

// =======================
// PUT atualizar produto
// =======================
app.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, prices, image, category, unit, units, color, description, status } = req.body;

    console.log('🔍 PUT /produtos/:id recebido:', {
      id,
      name,
      price: typeof price,
      prices: typeof prices,
      unit,
      units,
      hasImage: !!image
    });

    // Verificar se produto existe
    const verificar = await pool.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Converter array units para JSON string
    let unitsJson = null;
    if (units) {
      if (Array.isArray(units)) {
        unitsJson = JSON.stringify(units);
      } else if (typeof units === 'string') {
        // Se já é string JSON, validar
        try {
          JSON.parse(units);
          unitsJson = units;
        } catch (e) {
          unitsJson = JSON.stringify([units]);
        }
      }
    }

    // Converter object prices para JSON string
    let pricesJson = null;
    if (prices) {
      if (typeof prices === 'object') {
        pricesJson = JSON.stringify(prices);
      } else if (typeof prices === 'string') {
        try {
          JSON.parse(prices);
          pricesJson = prices;
        } catch (e) {
          console.warn('⚠️ Prices inválido:', prices);
        }
      }
    }

    // Validar preço
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    // Converter category para JSON se for array
    let categoryToStore = null;
    if (category) {
      if (Array.isArray(category)) categoryToStore = JSON.stringify(category);
      else if (typeof category === 'string') {
        try { JSON.parse(category); categoryToStore = category; } catch(e) { categoryToStore = category; }
      }
    }

    await pool.query(
      `UPDATE produtos 
       SET name = $1, price = $2, prices = $3, image = $4, category = $5, unit = $6, units = $7, color = $8, description = $9, status = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11`,
      [name || null, priceNum, pricesJson, image || null, categoryToStore || null, unit || null, unitsJson, color || null, description || null, status || 'available', id]
    );
    
    console.log(`✅ Produto atualizado: ${id}`);
    console.log(`   Unidades: ${units ? (Array.isArray(units) ? units.join(', ') : units) : 'não especificadas'}`);
    console.log(`   Preços: ${pricesJson || 'não especificados'}`);
    res.json({ 
      message: 'Produto atualizado com sucesso',
      id: id
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
  }
});

// =======================
// DELETE produto
// =======================
app.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const verificar = await pool.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    
    console.log(`✅ Produto deletado: ${id}`);
    res.json({ 
      message: 'Produto deletado com sucesso',
      id: id
    });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// =======================
// DELETE todos os produtos (apenas para teste/reset)
// =======================
app.delete('/produtos', async (req, res) => {
  try {
    await pool.query('DELETE FROM produtos');
    console.log('✅ Todos os produtos foram deletados');
    res.json({ message: 'Todos os produtos deletados com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar todos os produtos:', error);
    res.status(500).json({ error: 'Erro ao deletar produtos' });
  }
});

// =======================
// PEDIDOS
// =======================

// GET todos os pedidos
app.get('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY created_at DESC');
    const pedidos = result.rows;
    res.json(pedidos.map(p => ({
      ...p,
      items: JSON.parse(p.items)
    })));
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// GET um pedido específico
app.get('/pedidos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    const pedido = result.rows[0];
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({ ...pedido, items: JSON.parse(pedido.items) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// POST novo pedido
app.post('/pedidos', async (req, res) => {
  try {
    const { id, customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, total, notes, cash_received, cash_change } = req.body;
    
    console.log('📨 Body recebido:', { id, customer_name, customer_phone, address, delivery_type, payment_method, items: items?.length, total });
    
    if (!id || !customer_name || !customer_phone || !items || !total) {
      console.error('❌ Faltam dados obrigatórios:', { id: !!id, customer_name: !!customer_name, customer_phone: !!customer_phone, items: !!items, total: !!total });
      return res.status(400).json({ error: 'Dados obrigatórios faltando: id, customer_name, customer_phone, items, total' });
    }

    // USAR o ID fornecido pelo frontend, não gerar um novo!
    const finalAddress = address || 'Retirada no local'; // Se vazio, usa padrão
    
    console.log('📝 Recebendo pedido com ID:', id);
    
    await pool.query(
      `INSERT INTO pedidos (id, customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, notes, cash_received, cash_change, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [id, customer_name, customer_phone, finalAddress, bloco || '', apto || '', delivery_type, payment_method, payment_status || 'pendente', payment_id || null, JSON.stringify(items), notes || null, cash_received !== undefined ? cash_received : null, cash_change !== undefined ? cash_change : null, total, 'pendente']
    );
    
    console.log('✅ Pedido criado com ID:', id);
    res.status(201).json({ id, message: 'Pedido criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error.message || error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao criar pedido', details: error.message });
  }
});

// PUT atualizar pedido (status, notas, payment_status)
app.put('/pedidos/:id', async (req, res) => {
  try {
    const { status, notes, payment_status } = req.body;
    
    let query = 'UPDATE pedidos SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;
    
    if (status !== undefined) {
      query += `, status = $${paramIndex++}`;
      params.push(status);
    }
    if (notes !== undefined) {
      query += `, notes = $${paramIndex++}`;
      params.push(notes);
    }
    if (payment_status !== undefined) {
      query += `, payment_status = $${paramIndex++}`;
      params.push(payment_status);
    }
    
    query += ` WHERE id = $${paramIndex}`;
    params.push(req.params.id);
    
    await pool.query(query, params);
    console.log('✅ Pedido atualizado:', req.params.id);
    res.json({ message: 'Pedido atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// DELETE pedido específico
app.delete('/pedidos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pedidos WHERE id = $1', [req.params.id]);
    console.log('✅ Pedido deletado:', req.params.id);
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro ao deletar pedido' });
  }
});

// DELETE todos os pedidos (LIMPAR BANCO DE DADOS)
app.delete('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pedidos');
    console.log('%c🗑️ TODOS OS PEDIDOS DELETADOS!', 'color: red; font-weight: bold;', `Linhas afetadas: ${result.rowCount}`);
    res.json({ message: `${result.rowCount} pedidos deletados com sucesso`, deleted: result.rowCount });
  } catch (error) {
    console.error('❌ Erro ao deletar todos os pedidos:', error);
    res.status(500).json({ error: 'Erro ao deletar pedidos' });
  }
});

// =======================
// Inicializar Servidor
// =======================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`�️  Usando PostgreSQL (${process.env.DATABASE_URL ? 'Render' : 'Local'})`);
  console.log(`�📝 GET  http://localhost:${PORT}/produtos`);
  console.log(`➕ POST http://localhost:${PORT}/produtos`);
});
