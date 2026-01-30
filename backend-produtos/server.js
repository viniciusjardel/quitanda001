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
        image TEXT,
        category TEXT,
        unit TEXT NOT NULL,
        units TEXT,
        color TEXT,
        description TEXT,
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
        total DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pendente',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelas do banco de dados inicializadas');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
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
      if (p.units) {
        try {
          units = JSON.parse(p.units);
        } catch (e) {
          console.warn(`⚠️ Erro ao parsear units do produto ${p.id}:`, e.message);
          units = null;
        }
      }
      return {
        ...p,
        price: parseFloat(p.price),
        units: units
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
    if (produto.units) {
      try {
        units = JSON.parse(produto.units);
      } catch (e) {
        console.warn(`⚠️ Erro ao parsear units do produto ${id}:`, e.message);
        units = null;
      }
    }
    
    res.json({
      ...produto,
      price: parseFloat(produto.price),
      units: units
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
    const { id, name, price, image, category, unit, units, color, description } = req.body;

    // Validar campos obrigatórios
    if (!id || !name || price === undefined || !unit) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: id, name, price, unit' 
      });
    }

    // Converter array units para JSON string
    const unitsJson = units ? JSON.stringify(units) : null;

    await pool.query(
      `INSERT INTO produtos (id, name, price, image, category, unit, units, color, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, name, price, image || null, category || null, unit, unitsJson, color || null, description || null]
    );
    
    console.log(`✅ Produto criado: ${name} (${id})`);
    console.log(`   Unidades: ${units ? units.join(', ') : unit}`);
    res.status(201).json({ 
      message: 'Produto criado com sucesso',
      id: id
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Produto com este ID já existe' });
    }
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// =======================
// PUT atualizar produto
// =======================
app.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, image, category, unit, units, color, description } = req.body;

    // Verificar se produto existe
    const verificar = await pool.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Converter array units para JSON string
    const unitsJson = units ? JSON.stringify(units) : null;

    await pool.query(
      `UPDATE produtos 
       SET name = $1, price = $2, image = $3, category = $4, unit = $5, units = $6, color = $7, description = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [name || null, price || null, image || null, category || null, unit || null, unitsJson, color || null, description || null, id]
    );
    
    console.log(`✅ Produto atualizado: ${id}`);
    console.log(`   Unidades: ${units ? units.join(', ') : 'não especificadas'}`);
    res.json({ 
      message: 'Produto atualizado com sucesso',
      id: id
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
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
    const { customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, total } = req.body;
    
    if (!customer_name || !customer_phone || !items || !total) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando: customer_name, customer_phone, items, total' });
    }

    const id = 'ped_' + Date.now();
    const finalAddress = address || 'Retirada no local'; // Se vazio, usa padrão
    
    await pool.query(
      `INSERT INTO pedidos (id, customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, customer_name, customer_phone, finalAddress, bloco || '', apto || '', delivery_type, payment_method, payment_status || 'pendente', payment_id || null, JSON.stringify(items), total, 'pendente']
    );
    
    console.log('✅ Pedido criado:', id);
    res.status(201).json({ id, message: 'Pedido criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
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

// DELETE pedido
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
