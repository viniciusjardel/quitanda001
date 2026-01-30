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
// Inicializar Servidor
// =======================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📝 GET  http://localhost:${PORT}/produtos`);
  console.log(`➕ POST http://localhost:${PORT}/produtos`);
});
