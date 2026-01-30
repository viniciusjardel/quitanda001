# Backend Quitanda Villa Natal - Produtos

API de produtos com SQLite para gerenciar produtos da Quitanda Villa Natal.

## Setup

```bash
npm install
npm start
```

## Endpoints

### GET /produtos
Lista todos os produtos

### POST /produtos
Cria novo produto

```json
{
  "id": "tomate-001",
  "name": "Tomate",
  "price": 5.50,
  "image": "base64 ou URL",
  "category": "hortaliças",
  "unit": "kg",
  "color": "#ef4444",
  "description": "Tomate fresco"
}
```

### PUT /produtos/:id
Atualiza produto existente

### DELETE /produtos/:id
Deleta um produto

## Variáveis de Ambiente

```
PORT=3001
```

## Deploy no Render

1. Conectar repositório
2. Build command: `npm install`
3. Start command: `npm start`
4. Variáveis: `PORT`
