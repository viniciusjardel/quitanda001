import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// =======================
// SQLite Database
// =======================
const db = new Database(path.join(__dirname, 'quitanda.db'));

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    unit TEXT NOT NULL,
    color TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    total REAL NOT NULL,
    status TEXT DEFAULT 'pendente',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Banco de dados inicializado');

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
app.get('/produtos', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM produtos ORDER BY created_at DESC');
    const produtos = stmt.all();
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
app.get('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM produtos WHERE id = ?');
    const produto = stmt.get(id);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// =======================
// POST novo produto
// =======================
app.post('/produtos', (req, res) => {
  try {
    const { id, name, price, image, category, unit, color, description } = req.body;

    // Validar campos obrigatórios
    if (!id || !name || price === undefined || !unit) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: id, name, price, unit' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO produtos (id, name, price, image, category, unit, color, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name, price, image || null, category || null, unit, color || null, description || null);
    
    console.log(`✅ Produto criado: ${name} (${id})`);
    res.status(201).json({ 
      message: 'Produto criado com sucesso',
      id: id
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Produto com este ID já existe' });
    }
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// =======================
// PUT atualizar produto
// =======================
app.put('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, image, category, unit, color, description } = req.body;

    // Verificar se produto existe
    const verificar = db.prepare('SELECT id FROM produtos WHERE id = ?');
    if (!verificar.get(id)) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const stmt = db.prepare(`
      UPDATE produtos 
      SET name = ?, price = ?, image = ?, category = ?, unit = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(name || null, price || null, image || null, category || null, unit || null, color || null, description || null, id);
    
    console.log(`✅ Produto atualizado: ${id}`);
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
app.delete('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const verificar = db.prepare('SELECT id FROM produtos WHERE id = ?');
    if (!verificar.get(id)) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
    stmt.run(id);
    
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
app.delete('/produtos', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM produtos');
    stmt.run();
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
app.get('/pedidos', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM pedidos ORDER BY created_at DESC');
    const pedidos = stmt.all();
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
app.get('/pedidos/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM pedidos WHERE id = ?');
    const pedido = stmt.get(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({ ...pedido, items: JSON.parse(pedido.items) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// POST novo pedido
app.post('/pedidos', (req, res) => {
  try {
    const { customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, total } = req.body;
    
    if (!customer_name || !customer_phone || !address || !items || !total) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const id = 'ped_' + Date.now();
    const stmt = db.prepare(`
      INSERT INTO pedidos (id, customer_name, customer_phone, address, bloco, apto, delivery_type, payment_method, payment_status, payment_id, items, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, 
      customer_name, 
      customer_phone, 
      address, 
      bloco || '', 
      apto || '', 
      delivery_type, 
      payment_method, 
      payment_status || 'pendente', 
      payment_id || null,
      JSON.stringify(items), 
      total, 
      'pendente'
    );
    
    console.log('✅ Pedido criado:', id);
    res.status(201).json({ id, message: 'Pedido criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// PUT atualizar pedido (status, notas, payment_status)
app.put('/pedidos/:id', (req, res) => {
  try {
    const { status, notes, payment_status } = req.body;
    
    let query = 'UPDATE pedidos SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    
    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }
    if (notes !== undefined) {
      query += ', notes = ?';
      params.push(notes);
    }
    if (payment_status !== undefined) {
      query += ', payment_status = ?';
      params.push(payment_status);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    const stmt = db.prepare(query);
    stmt.run(...params);
    console.log('✅ Pedido atualizado:', req.params.id);
    res.json({ message: 'Pedido atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// DELETE pedido
app.delete('/pedidos/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM pedidos WHERE id = ?');
    stmt.run(req.params.id);
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
  console.log(`📝 GET  http://localhost:${PORT}/produtos`);
  console.log(`➕ POST http://localhost:${PORT}/produtos`);
});
