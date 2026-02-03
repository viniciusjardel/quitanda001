# 📋 Implementação: Múltiplas Unidades de Medida

**Data:** 30 de janeiro de 2026  
**Status:** ✅ COMPLETO

---

## 🎯 Objetivo

Permitir que um produto seja cadastrado com **múltiplas unidades de medida**. Exemplo:
- Banana vendida por **kg** E **un** (não só uma ou outra)
- Ao adicionar ao carrinho, o cliente escolhe qual unidade quer comprar

---

## 📝 Mudanças Realizadas

### 1️⃣ **admin.html** - Interface de Cadastro
**Localização:** `frontend/admin.html` - linhas 165-190

**O que mudou:**
- ❌ Removido: Select simples com uma única unidade
- ✅ Adicionado: Grade de checkboxes com múltiplas opções de unidades

**Unidades disponíveis:**
- kg
- un
- dúzia
- bandeja
- maço
- litro
- palma

**Novo elemento HTML:**
```html
<div class="grid grid-cols-2 gap-3" id="productUnitsContainer">
    <label class="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
        <input type="checkbox" class="product-unit-checkbox w-5 h-5" value="kg">
        <span class="font-semibold text-gray-700">kg</span>
    </label>
    <!-- ... mais checkboxes ... -->
</div>
<p id="unitsSelectedInfo" class="text-xs text-gray-600 mt-2">Nenhuma unidade selecionada</p>
```

---

### 2️⃣ **script.js** - Lógica do Admin (Painel Administrativo)

#### Função `updateUnitsDisplay()`
**Função nova adicionada** para mostrar em tempo real quais unidades foram selecionadas.

```javascript
function updateUnitsDisplay() {
    const selectedUnits = Array.from(document.querySelectorAll('.product-unit-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    const infoElement = document.getElementById('unitsSelectedInfo');
    if (selectedUnits.length === 0) {
        infoElement.textContent = 'Nenhuma unidade selecionada';
    } else {
        infoElement.textContent = `Unidades selecionadas: ${selectedUnits.join(', ')}`;
    }
}
```

#### Função `openProductModal()`
**Modificada** para limpar checkboxes ao abrir modal de novo produto e adicionar listeners

#### Função `editProduct(id)`
**Modificada** para carregar o array de unidades e marcar os checkboxes corretos:
```javascript
const units = Array.isArray(product.units) ? product.units : [product.unit];
units.forEach(unit => {
    const checkbox = document.querySelector(`.product-unit-checkbox[value="${unit}"]`);
    if (checkbox) {
        checkbox.checked = true;
    }
});
```

#### Função `saveProduct(e)`
**Modificada** para capturar múltiplas unidades:
```javascript
const selectedUnits = Array.from(document.querySelectorAll('.product-unit-checkbox:checked'))
    .map(checkbox => checkbox.value);

if (selectedUnits.length === 0) {
    alert('⚠️ Por favor, selecione pelo menos uma unidade de medida');
    return;
}

const productData = {
    id: editingProductId || 'prod_' + Date.now(),
    name: productName,
    description: document.getElementById('productDescription').value,
    price: productPrice,
    unit: selectedUnits[0],  // Compatibilidade com sistemas antigos
    units: selectedUnits,    // Nova estrutura
    image: finalImage,
    color: document.getElementById('productColor').value || null
};
```

**Compatibilidade:** Mantém `unit` (primeira unidade) para compatibilidade com dados antigos, mas salva array completo em `units`

---

### 3️⃣ **index.html** - Interface de Compra
**O Modal unitModal já existia**, apenas necessitava de JavaScript para funcionar.

**Elemento HTML (já existente):**
```html
<div id="unitModal" class="modal fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <!-- ... conteúdo ... -->
        <div id="unitOptions" class="space-y-3"></div>
    </div>
</div>
```

---

### 4️⃣ **script-site.js** - Lógica de Compra (Site)

#### Função `openProductSelection(id)` - **NOVA**
Substituiu a chamada direta a `openQuantityModal` com lógica inteligente:

```javascript
window.openProductSelection = id => {
  selectedProduct = products.find(p => p.id === id);
  
  // Determinar as unidades disponíveis
  const units = Array.isArray(selectedProduct.units) ? selectedProduct.units : [selectedProduct.unit];
  
  // Se apenas uma unidade, pular direto para quantidade
  if (units.length === 1) {
    selectedProduct.selectedUnit = units[0];
    window.openQuantityModal(id);
    return;
  }
  
  // Se múltiplas unidades, abrir modal de seleção
  const unitOptions = document.getElementById('unitOptions');
  unitOptions.innerHTML = units.map(unit => `
    <button onclick="window.selectUnit('${unit}')" class="w-full p-4 bg-gradient-to-r from-purple-500 to-green-500 text-white rounded-lg font-bold text-lg hover:opacity-90 transition shadow-md">
      ${unit}
    </button>
  `).join('');
  
  document.getElementById('unitModal').classList.remove('hidden');
};
```

#### Função `selectUnit(unit)` - **NOVA**
Guarda a unidade selecionada e abre o modal de quantidade:

```javascript
window.selectUnit = unit => {
  selectedProduct.selectedUnit = unit;
  window.closeUnitModal();
  window.openQuantityModal(selectedProduct.id);
};
```

#### Função `closeUnitModal()` - **NOVA**
Fecha o modal de seleção de unidades:

```javascript
window.closeUnitModal = () =>
  document.getElementById('unitModal').classList.add('hidden');
```

#### Função `openQuantityModal(id)` - **MODIFICADA**
Agora usa a unidade selecionada para exibição:

```javascript
const unit = selectedProduct.selectedUnit || selectedProduct.unit;
document.getElementById('modalProductPrice').innerText =
  `${formatPrice(selectedProduct.price)} / ${unit}`;
```

#### Função `addToCart()` - **MODIFICADA**
Agora armazena a unidade selecionada no carrinho:

```javascript
const selectedUnit = selectedProduct.selectedUnit || selectedProduct.unit;
const cartItemId = `${selectedProduct.id}_${selectedUnit}`;
const existing = cart.find(i => `${i.id}_${i.selectedUnit || i.unit}` === cartItemId);

const cartItem = { 
  ...selectedProduct, 
  quantity: selectedQuantity,
  selectedUnit: selectedUnit
};
```

#### Função `updateCartUI()` - **MODIFICADA**
Exibe a unidade selecionada no carrinho:

```javascript
const displayUnit = item.selectedUnit || item.unit || 'un';
// Uso: ${displayUnit}
```

#### Funções de Pedidos - **MODIFICADAS** (3 locais)
Todas as funções que criam pedidos foram modificadas para usar a unidade selecionada:

```javascript
items: cart.map(i => ({
  id: i.id,
  name: i.name,
  quantity: i.quantity,
  price: i.price,
  unit: i.selectedUnit || i.unit  // ✨ Agora com unidade selecionada
}))
```

Locais modificados:
1. Pagamento via PIX
2. Pedidos normais
3. Envio via WhatsApp

#### Card de Produtos - **MODIFICADO**
Mudou de `openQuantityModal` para `openProductSelection`:

```javascript
onclick="window.openProductSelection('${product.id}')"
```

---

## 🔄 Fluxo de Funcionamento

### Cadastro de Produto (Admin)
```
1. Clica "Novo Produto"
2. Preenche nome, preço, descrição, imagem
3. Seleciona UMA OU MAIS unidades (checkboxes)
4. Vê em tempo real: "Unidades selecionadas: kg, un"
5. Salva → API recebe { units: ['kg', 'un'], unit: 'kg' }
```

### Compra de Produto (Cliente)
```
1. Cliente clica "Adicionar" em um produto
2. Sistema verifica:
   ✓ Se 1 unidade disponível → abre logo o modal de quantidade
   ✓ Se múltiplas unidades → abre primeiro o modal de seleção
3. Cliente escolhe a unidade desejada (ex: 'kg')
4. Modal de quantidade aparece (agora com a unidade selecionada)
5. Cliente escolhe quantidade (ex: 2)
6. Adiciona ao carrinho com unit='kg' armazenada
7. No pedido, fica registrado: "2 x Banana / kg"
```

---

## 📊 Estrutura de Dados

### Antigo (Compatível)
```json
{
  "id": "prod_123",
  "name": "Banana",
  "unit": "kg",
  "price": 5.99
}
```

### Novo (Com Múltiplas Unidades)
```json
{
  "id": "prod_123",
  "name": "Banana",
  "unit": "kg",
  "units": ["kg", "un", "palma"],
  "price": 5.99
}
```

### Item no Carrinho
```json
{
  "id": "prod_123",
  "name": "Banana",
  "unit": "kg",
  "units": ["kg", "un", "palma"],
  "price": 5.99,
  "quantity": 2,
  "selectedUnit": "kg"
}
```

### Pedido (Item)
```json
{
  "id": "prod_123",
  "name": "Banana",
  "quantity": 2,
  "price": 5.99,
  "unit": "kg"
}
```

---

## ✅ Checklist de Testes

Após implementação, teste os seguintes cenários:

- [ ] **Cadastro Simples** - Cadastre um produto com 1 unidade
- [ ] **Cadastro Múltiplo** - Cadastre um produto com 3+ unidades
- [ ] **Edição** - Edite um produto e verifique se as unidades aparecem corretamente
- [ ] **Compra - Uma Unidade** - Compre um produto com apenas 1 unidade (deve pular o modal de seleção)
- [ ] **Compra - Múltiplas Unidades** - Compre um produto com múltiplas unidades (deve pedir para escolher)
- [ ] **Carrinho** - Verifique se a unidade selecionada aparece no carrinho
- [ ] **Pedido** - Finalize um pedido e verifique se a unidade está corretamente salva
- [ ] **Compatibilidade** - Produtos antigos (com apenas `unit`) ainda devem funcionar

---

## 🎨 Estrutura Visual

### Admin - Seleção de Unidades
```
┌─────────────────────────────────────┐
│ Unidades Disponíveis *              │
│ Selecione uma ou mais unidades:     │
├─────────────────────────────────────┤
│ ☑ kg          ☐ un                 │
│ ☐ dúzia       ☐ bandeja            │
│ ☐ maço        ☐ litro              │
│ ☐ palma                            │
├─────────────────────────────────────┤
│ Unidades selecionadas: kg, un       │
└─────────────────────────────────────┘
```

### Site - Modal de Seleção de Unidade
```
┌─────────────────────────────┐
│      Banana               X │
├─────────────────────────────┤
│   [Imagem do produto]       │
│   R$ 5,99                   │
├─────────────────────────────┤
│ Escolha a unidade:          │
├─────────────────────────────┤
│    [  kg  ] [  un  ]        │
│    [ palma ]                │
├─────────────────────────────┤
│ ← Voltar                    │
└─────────────────────────────┘
```

---

## 🚀 Deploy

Não há necessidade de deploy no backend para esta feature funcionar. A lógica é completamente frontend.

**Compatibilidade:**
- ✅ Produtos antigos (com `unit` simples) funcionam normalmente
- ✅ Novos produtos com `units` array funcionam automaticamente
- ✅ API backend não precisa ser modificada (já aceita `units`)

---

## 💡 Exemplos de Uso

### Exemplo 1: Banana com 3 Unidades
```javascript
{
  "id": "banana_001",
  "name": "🍌 Banana Prata",
  "price": 5.99,
  "unit": "palma",  // Compatibilidade
  "units": ["palma", "kg", "un"],  // Múltiplas opções
  "image": "...",
  "color": "#f59e0b"
}
```

Cliente quer comprar:
1. Clica "Adicionar"
2. Vê modal com opções: [palma] [kg] [un]
3. Escolhe "kg"
4. Escolhe quantidade: 2
5. Carrinho mostra: "2 x Banana / kg @ R$ 5,99"

### Exemplo 2: Tomate com 1 Unidade
```javascript
{
  "id": "tomate_001",
  "name": "🍅 Tomate",
  "price": 4.49,
  "unit": "kg",
  "units": ["kg"],  // Apenas uma
  "image": "...",
  "color": "#dc2626"
}
```

Cliente quer comprar:
1. Clica "Adicionar"
2. **Pula o modal de seleção** (já que há apenas 1 opção)
3. Vai direto para modal de quantidade
4. Escolhe quantidade: 3
5. Carrinho mostra: "3 x Tomate / kg @ R$ 4,49"

---

## 📞 Suporte

Caso encontre problemas:
1. Limpe o cache/localStorage do navegador
2. Verifique o console (F12 → Console) para erros
3. Verifique se os produtos têm a propriedade `units` corretamente salva

---

**Implementado com sucesso! 🎉**
