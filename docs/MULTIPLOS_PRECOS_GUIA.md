# 💰 Preços por Unidade de Medida - Guia de Implementação

## 🎯 Visão Geral

Implementação de sistema de preços específicos para cada unidade de medida de um produto. Agora você pode ter o mesmo produto com múltiplas unidades e cada uma tem um preço diferente.

### Exemplo:
- **Tomate**
  - UN (unidade) = R$ 0,80
  - KG (quilograma) = R$ 3,99

## 📝 Como Usar

### 1️⃣ Adicionando um Novo Produto com Múltiplos Preços

1. No **Painel Admin** → Clique em "➕ Novo Produto"
2. Preencha os dados básicos (Nome, Descrição, Categoria)
3. **Selecione as unidades de medida** que o produto pode ter (kg, un, dúzia, etc)
4. **Automaticamente aparecerá** uma seção "💰 Preço para cada Unidade"
5. Defina o preço específico para cada unidade selecionada
6. Adicione a imagem e salve

### 2️⃣ Editando um Produto Existente

1. No **Painel Admin** → Clique em ✏️ para editar um produto
2. Os preços já carregados serão exibidos em seus campos
3. Modifique os preços conforme necessário
4. Se adicionar uma nova unidade, defina o preço para ela
5. Salve as alterações

### 3️⃣ Experiência do Cliente

Quando o cliente clica em "Adicionar Produto":

1. **Se o produto tem 1 unidade:** Vai direto para a modal de quantidade
2. **Se o produto tem múltiplas unidades:** 
   - Abre uma modal para escolher a unidade
   - O preço muda automaticamente conforme a unidade escolhida
   - Vai para a modal de quantidade com o preço correto
3. **No carrinho:**
   - Mostra: `[Nome do Produto] - R$ [Preço] / [UNIDADE]`
   - Exemplo: `Tomate - R$ 3,99 / KG`
4. **No pedido:**
   - Registra qual unidade foi escolhida
   - Registra o preço específico daquela unidade

## 🗄️ Estrutura de Dados

### Banco de Dados
```
Coluna nova adicionada: `prices` (JSON)
Exemplo: {"un": 0.80, "kg": 3.99}
```

### Objeto de Produto (Frontend)
```javascript
{
  id: "prod_123456",
  name: "Tomate",
  price: 0.80,              // Preço padrão (compatibilidade)
  prices: {                 // NOVO: Preços por unidade
    "un": 0.80,
    "kg": 3.99
  },
  unit: "un",              // Unidade padrão
  units: ["un", "kg"],     // Array de unidades disponíveis
  ...
}
```

### Item no Carrinho
```javascript
{
  id: "prod_123456",
  name: "Tomate",
  price: 3.99,              // Preço da unidade selecionada
  quantity: 2,
  selectedUnit: "kg",       // Unidade selecionada
  ...
}
```

## 🔄 Migração de Dados Existentes

Para atualizar produtos antigos (com apenas 1 preço) para o novo formato:

```bash
cd backend-produtos
node migrate-prices.js
```

Isso vai:
1. Ler todos os produtos do banco de dados
2. Criar um objeto de preços com todas as unidades usando o preço padrão
3. Salvar no formato novo

**Exemplo:** Produto antigo com `price: 2.50` e `units: ["kg", "un"]`
```javascript
// Resultado após migração:
prices: {
  "kg": 2.50,
  "un": 2.50
}
```

## 🔧 APIs Backend

### POST/PUT /produtos
Agora aceita campo `prices`:

```javascript
{
  "id": "prod_123",
  "name": "Tomate",
  "price": 0.80,           // Mantém compatibilidade
  "prices": {              // NOVO
    "un": 0.80,
    "kg": 3.99
  },
  "units": ["un", "kg"]
}
```

### GET /produtos
Retorna com o novo campo:

```javascript
{
  "id": "prod_123",
  "name": "Tomate",
  "prices": {
    "un": 0.80,
    "kg": 3.99
  },
  ...
}
```

## 📊 Pedidos

Os pedidos agora registram:

```javascript
items: [
  {
    id: "prod_123",
    name: "Tomate",
    quantity: 2,
    price: 3.99,          // Preço da unidade escolhida
    unit: "kg"            // Unidade escolhida
  }
]
```

## ✅ Validações no Admin

- ✔️ Se selecionar múltiplas unidades, TODAS precisam ter preço
- ✔️ Preços devem ser maiores que 0
- ✔️ Os campos de preço aparecem automaticamente ao marcar unidades

## 🎨 Mudanças Visuais

### Admin
- Novas caixas de cor (roxo+verde) com campos de preço por unidade
- Campos aparecem dinamicamente quando unidades são selecionadas

### Cliente
- Modal de seleção de unidade mostra as opções
- Preço atualiza quando muda de unidade
- Carrinho mostra unidade e preço específico

## 🐛 Troubleshooting

### Problema: Preços não aparecem no carrinho
**Solução:** Execute a migração com `node migrate-prices.js`

### Problema: Erro ao salvar produto com múltiplas unidades
**Solução:** Verifique se TODAS as unidades têm preço definido

### Problema: Preço errado no carrinho
**Solução:** Verifique se o produto tem `prices` no banco de dados (rode migrate-prices.js)

## 📞 Suporte

Qualquer dúvida ou problema, verifique:
1. Console do navegador (F12) para erros
2. Logs do backend para erros de API
3. Banco de dados para verificar estrutura dos dados

---

**Status:** ✅ Implementado e testado
**Última atualização:** 1º de fevereiro de 2026
