/* =========================================================
   HORTIFRUTI VILA NATAL - SCRIPT SITE (ESTÁVEL)
   Fonte única de verdade: API SQLite (backend-produtos)
   Backend PIX: pix-project.onrender.com (já funcional)
   Backend Produtos: quitanda-produtos-api.onrender.com
========================================================= */

const BACKEND_URL = 'https://pix-project.onrender.com';
const PRODUCTS_API_URL = 'https://quitanda-produtos-api.onrender.com';

// =======================
// ESTADO GLOBAL CONTROLADO
// =======================
let products = [];
let cart = [];
let selectedProduct = null;
let selectedQuantity = 0;
let deliveryType = null;
let paymentMethod = null;
let pixInterval = null;

// =======================
// UTIL
// =======================
const formatPrice = v => `R$ ${v.toFixed(2).replace('.', ',')}`;

// Limpar localStorage agressivamente se exceder limite
const cleanLocalStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    const sizes = {};
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      sizes[key] = new TextEncoder().encode(value).length;
    });
    
    console.log('📊 Uso localStorage (KB):', Object.entries(sizes).map(([k,v]) => `${k}: ${(v/1024).toFixed(2)}`).join(' | '));
    
    // 1. Remove dados antigos/temporários
    const oldKeys = keys.filter(k => 
      k.includes('temp') || k.includes('old') || k.includes('backup')
    );
    oldKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });
    
    // 2. Se produtos estão muito grandes, remove eles
    if (sizes['hortifruti_products'] > 500000) { // > 500KB
      console.warn('⚠️ hortifruti_products muito grande, removendo...');
      localStorage.removeItem('hortifruti_products');
    }
    
    // 3. Limpar outros dados não-essenciais
    const nonEssential = keys.filter(k => 
      !['hortifruti_cart', 'hortifruti_products'].includes(k)
    );
    nonEssential.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });
    
    console.log('✅ Limpeza localStorage agressiva realizada');
  } catch (e) {
    console.warn('Erro ao limpar localStorage:', e);
  }
};

const getStoredProducts = () =>
  JSON.parse(localStorage.getItem('hortifruti_products')) || [];

const saveCart = () => {
  try {
    const cartData = JSON.stringify(cart);
    localStorage.setItem('hortifruti_cart', cartData);
    console.log('✅ Carrinho salvo com sucesso');
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('⚠️ Quota excedida! Iniciando limpeza agressiva...');
      cleanLocalStorage();
      
      // Tenta salvar novamente após limpeza
      try {
        const cartData = JSON.stringify(cart);
        localStorage.setItem('hortifruti_cart', cartData);
        console.log('✅ Carrinho salvo após limpeza');
      } catch (retryError) {
        // Se ainda falhar, tenta limpar o carrinho também
        console.error('❌ Ainda não há espaço. Tentando esvaziar carrinho...');
        localStorage.removeItem('hortifruti_cart');
        localStorage.removeItem('hortifruti_products');
        
        try {
          localStorage.setItem('hortifruti_cart', cartData);
          console.log('✅ Carrinho salvo após limpeza total');
        } catch (finalError) {
          console.error('❌ FALHA CRÍTICA ao salvar carrinho:', finalError);
          alert('❌ Erro: localStorage cheio. \n\n1. Limpe o cache/cookies do navegador\n2. Feche abas desnecessárias\n3. Ou tente em modo incógnito');
        }
      }
    } else {
      throw e;
    }
  }
};

const loadCart = () => {
  cart = JSON.parse(localStorage.getItem('hortifruti_cart')) || [];
};

// =======================
// PRODUTOS
// =======================
async function fetchProductsFromAPI() {
  try {
    const response = await fetch(`${PRODUCTS_API_URL}/produtos`);
    if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
    const data = await response.json();
    console.log('✅ Produtos carregados da API:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos da API:', error);
    console.log('📦 Usando fallback localStorage...');
    return getStoredProducts();
  }
}

async function loadProducts() {
  products = await fetchProductsFromAPI();
  renderProducts(products);
}

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  const empty = document.getElementById('emptyState');

  grid.innerHTML = '';

  if (!list.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-xl shadow-lg p-4 flex flex-col';

    card.innerHTML = `
      <img src="${product.image}" class="h-48 w-full object-cover rounded-lg mb-4">
      <h3 class="text-xl font-bold text-gray-800">${product.name}</h3>
      <p class="text-gray-500 text-sm mb-2">${product.description || ''}</p>
      <p class="text-lg font-bold text-green-600 mb-4">${formatPrice(product.price)} / ${product.unit}</p>
      <button class="mt-auto py-3 rounded-lg text-white font-bold"
        style="background:${product.color || '#7c3aed'}"
        onclick="openQuantityModal('${product.id}')">
        Adicionar
      </button>
    `;

    grid.appendChild(card);
  });
}

// =======================
// FILTRO / BUSCA
// =======================
window.filterByCategory = cat => {
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-category="${cat}"]`)?.classList.add('active');

  if (cat === 'all') return renderProducts(products);
  renderProducts(products.filter(p => p.category === cat));
};

document.getElementById('searchInput').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  renderProducts(products.filter(p => p.name.toLowerCase().includes(term)));
});

// =======================
// MODAL QUANTIDADE
// =======================
window.openQuantityModal = id => {
  selectedProduct = products.find(p => p.id === id);
  selectedQuantity = 0;

  document.getElementById('modalProductName').innerText = selectedProduct.name;
  document.getElementById('modalProductImage').src = selectedProduct.image;
  document.getElementById('modalProductPrice').innerText =
    `${formatPrice(selectedProduct.price)} / ${selectedProduct.unit}`;
  document.getElementById('quantityDisplay').innerText = '0';
  document.getElementById('quantityInput').value = '';

  document.getElementById('confirmButton').style.background =
    selectedProduct.color || '#7c3aed';

  document.getElementById('quantityModal').classList.remove('hidden');
};

window.closeQuantityModal = () =>
  document.getElementById('quantityModal').classList.add('hidden');

window.increaseModalQuantity = () => updateQuantity(selectedQuantity + 1);
window.decreaseModalQuantity = () => updateQuantity(Math.max(0, selectedQuantity - 1));

document.getElementById('quantityInput').addEventListener('input', e =>
  updateQuantity(Number(e.target.value))
);

function updateQuantity(val) {
  selectedQuantity = val;
  document.getElementById('quantityDisplay').innerText = val;
}

// =======================
// CARRINHO
// =======================
window.addToCart = () => {
  if (!selectedQuantity) return;

  const existing = cart.find(i => i.id === selectedProduct.id);

  if (existing) {
    existing.quantity += selectedQuantity;
  } else {
    cart.push({ ...selectedProduct, quantity: selectedQuantity });
  }

  saveCart();
  updateCartUI();
  closeQuantityModal();
};

window.toggleCart = () =>
  document.getElementById('cartModal').classList.toggle('hidden');

function updateCartUI() {
  const items = document.getElementById('cartItems');
  const badge = document.getElementById('cartBadge');
  const totalEl = document.getElementById('cartTotal');

  items.innerHTML = '';

  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    count += item.quantity;

    items.innerHTML += `
      <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex-1">
          <strong>${item.name}</strong><br>
          <span class="text-gray-600">${formatPrice(item.price)} / ${item.unit || 'un'}</span>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="flex items-center border border-gray-300 rounded-lg">
            <button onclick="window.decreaseQuantity(${index})" class="px-3 py-2 text-red-600 font-bold hover:bg-red-50">−</button>
            <span class="px-4 py-2 font-bold text-center min-w-12">${item.quantity}</span>
            <button onclick="window.increaseQuantity(${index})" class="px-3 py-2 text-green-600 font-bold hover:bg-green-50">+</button>
          </div>
          
          <span class="font-bold text-green-600 min-w-24 text-right">${formatPrice(subtotal)}</span>
          
          <button onclick="window.removeFromCart(${index})" class="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition" title="Remover">
            🗑️
          </button>
        </div>
      </div>
    `;
  });

  badge.innerText = count;
  badge.classList.toggle('hidden', count === 0);
  totalEl.innerText = formatPrice(total);
}

window.increaseQuantity = (index) => {
  cart[index].quantity++;
  saveCart();
  updateCartUI();
};

window.decreaseQuantity = (index) => {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    saveCart();
    updateCartUI();
  }
};

window.removeFromCart = (index) => {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
};

// =======================
// DELIVERY + PAGAMENTO
// =======================
window.openDeliveryModal = () =>
  document.getElementById('deliveryModal').classList.remove('hidden');

window.closeDeliveryModal = () =>
  document.getElementById('deliveryModal').classList.add('hidden');

window.selectDeliveryType = type => {
  deliveryType = type;
  document.getElementById('deliveryForm').classList.toggle('hidden', type !== 'delivery');
  document.getElementById('paymentMethodSection').classList.remove('hidden');
};

window.selectPaymentMethod = method => {
  paymentMethod = method;
  if (method === 'pix') generatePix();
};

// =======================
// PIX - POLLING SIMPLES E PERSISTENTE (IGUAL PROJETO TESTE)
// =======================

async function generatePix() {
  const total =
    cart.reduce((sum, i) => sum + i.price * i.quantity, 0) +
    (deliveryType === 'delivery' ? 3 : 0);

  document.getElementById('pixTotal').innerText = formatPrice(total);
  document.getElementById('pixModal').classList.remove('hidden');

  document.getElementById('pixContainer').innerHTML =
    '<p class="text-center font-semibold">🔄 Gerando código PIX...</p>';

  try {
    const res = await fetch(`${BACKEND_URL}/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: total, descricao: 'Pedido Quitanda Vila Natal' })
    });

    if (!res.ok) throw new Error('Erro ao gerar PIX');

    const data = await res.json();

    // 💾 Salva no localStorage para rastrear (igual ao projeto teste)
    localStorage.setItem('paymentId', data.id.toString());
    localStorage.setItem('pixData', JSON.stringify(data));

    renderPixQRCode(data);
    iniciarPollingPix(data.id.toString());
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    document.getElementById('pixContainer').innerHTML =
      '<p class="text-center text-red-600 font-bold">❌ Erro ao gerar PIX. Tente novamente.</p>';
  }
}

function renderPixQRCode(data) {
  document.getElementById('pixContainer').innerHTML = `
    <img src="data:image/png;base64,${data.qr_code_base64}" class="mx-auto">
    <p class="text-center text-sm break-all mt-2">${data.qr_code}</p>
    <p class="text-center font-bold mt-2">⏳ Aguardando pagamento...</p>
  `;
}

async function consultarStatusPix(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/status/${id}`);
    
    if (!res.ok) {
      console.error(`❌ Erro ${res.status} ao consultar PIX ${id}`);
      return { status: 'pending' };
    }
    
    const data = await res.json();
    console.log(`✅ Status do PIX ${id}:`, data);
    return data;
  } catch (err) {
    console.error('❌ Erro ao consultar status:', err);
    return { status: 'pending' };
  }
}

function iniciarPollingPix(id) {
  if (pixInterval) clearInterval(pixInterval);

  pixInterval = setInterval(async () => {
    const data = await consultarStatusPix(id);
    const statusEl = document.getElementById('pixContainer');

    if (!statusEl) {
      console.warn('⚠️ pixContainer não existe, parando polling');
      clearInterval(pixInterval);
      return;
    }

    const status = data?.status;
    console.log(`💳 Status PIX recebido: "${status}" (tipo: ${typeof status})`);
    console.log('📦 Dados completos:', data);

    if (status === 'approved') {
      console.log('✅✅✅ PAGAMENTO CONFIRMADO! Atualizando tela...');
      statusEl.innerHTML =
        '<p class="text-center text-green-600 font-bold text-xl">✅ Pagamento aprovado!</p>';
      clearInterval(pixInterval);
      
      localStorage.removeItem('hortifruti_cart');
      localStorage.removeItem('paymentId');
      localStorage.removeItem('pixData');
      
      setTimeout(() => {
        closePixModal();
        alert('✅ Seu pedido foi realizado com sucesso!');
      }, 3000);
    }
  }, 2000);
}

window.closePixModal = () => {
  if (pixInterval) clearInterval(pixInterval);
  document.getElementById('pixModal').classList.add('hidden');
};

// 🔁 Persistência ao carregar página (IGUAL PROJETO TESTE)
window.addEventListener('DOMContentLoaded', async () => {
  const paymentId = localStorage.getItem('paymentId');
  const pixData = localStorage.getItem('pixData');
  
  if (paymentId && pixData) {
    // Se houver pagamento pendente, recupera a tela
    const data = JSON.parse(pixData);
    const statusData = await consultarStatusPix(paymentId);

    if (statusData.status === 'approved') {
      // Já foi pago, mostra confirmação
      document.getElementById('pixContainer').innerHTML =
        '<p class="text-center text-green-600 font-bold text-xl">✅ Pagamento confirmado!</p>';
    } else {
      // Ainda não foi pago, continua mostrando QR Code
      renderPixQRCode(data);
      iniciarPollingPix(paymentId);
    }
  }
});

// =======================
// INIT
// =======================
loadCart();
await loadProducts();
updateCartUI();

// sincronização simples entre abas
window.addEventListener('storage', async e => {
  if (e.key === 'hortifruti_products') await loadProducts();
});
