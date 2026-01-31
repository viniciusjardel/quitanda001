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
let pendingWhatsAppUrl = null; // URL para enviar ao WhatsApp (opcional)

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

// =======================
// SALVAR PEDIDO NO BACKEND
// =======================
async function salvarPedidoNoBackend(pedido) {
  try {
    console.log('%c💾 Enviando pedido para backend...', 'color: blue; font-weight: bold;');
    console.log('📋 Dados do pedido:', JSON.stringify(pedido, null, 2));
    
    const response = await fetch(`${PRODUCTS_API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro ${response.status}: ${errorData.details || response.statusText}`);
    }

    const data = await response.json();
    console.log('%c✅ Pedido salvo no backend:', 'color: green; font-weight: bold;', data);
    
    // Disparar evento de sincronização
    window.dispatchEvent(new CustomEvent('pedidoAdicionado', { detail: pedido }));
    
    return data;
  } catch (error) {
    console.error('%c❌ ERRO CRÍTICO ao salvar pedido no backend:', 'color: red; font-weight: bold;', error);
    alert('❌ ERRO: Não foi possível salvar o pedido no banco de dados.\n\nDetalhes: ' + error.message);
    throw error; // Re-throw para não continuar o fluxo
  }
}

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
    let data = await response.json();
    
    // Processar units para garantir que seja sempre um array
    data = data.map(product => {
      if (product.units) {
        // Se units for string JSON, fazer parse
        if (typeof product.units === 'string') {
          try {
            product.units = JSON.parse(product.units);
          } catch (e) {
            // Se não conseguir fazer parse, deixar como array com a string
            product.units = [product.units];
          }
        }
        // Garantir que é um array
        if (!Array.isArray(product.units)) {
          product.units = [product.units];
        }
      } else {
        // Se não tiver units, usar unit como fallback
        product.units = [product.unit];
      }
      return product;
    });
    
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

    // Obter unidades (pode ser array ou string)
    const units = Array.isArray(product.units) ? product.units : [product.unit];
    const unitsHTML = units.map(u => 
      `<span style="display: inline-flex; align-items: center; background-color: #10b981; color: white; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.6px; white-space: nowrap; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);">${u.toUpperCase()}</span>`
    ).join('');

    card.innerHTML = `
      <img src="${product.image}" class="h-48 w-full object-cover rounded-lg mb-3">
      <h3 class="text-xl font-bold text-gray-800">${product.name}</h3>
      <p class="text-gray-500 text-sm mb-3">${product.description || ''}</p>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <p class="text-lg font-bold text-green-600">${formatPrice(product.price)} / ${product.unit.toUpperCase()}</p>
        <div style="display: flex; gap: 6px;">
          ${unitsHTML}
        </div>
      </div>
      <button class="mt-auto py-3 rounded-lg text-white font-bold"
        style="background:${product.color || '#7c3aed'}"
        onclick="window.openProductSelection('${product.id}')">
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
// SELEÇÃO DE PRODUTO E UNIDADE
// =======================
window.openProductSelection = id => {
  selectedProduct = products.find(p => p.id === id);
  if (!selectedProduct) return;
  
  // Determinar as unidades disponíveis
  const units = Array.isArray(selectedProduct.units) ? selectedProduct.units : [selectedProduct.unit];
  
  console.log(`📦 Produto: ${selectedProduct.name}, Unidades disponíveis:`, units);
  
  // Se apenas uma unidade, pular direto para quantidade
  if (units.length === 1) {
    selectedProduct.selectedUnit = units[0];
    window.openQuantityModal(id);
    return;
  }
  
  // Se múltiplas unidades, abrir modal de seleção
  document.getElementById('unitModalProductName').innerText = selectedProduct.name;
  document.getElementById('unitModalProductImage').src = selectedProduct.image;
  document.getElementById('unitModalProductPrice').innerText = formatPrice(selectedProduct.price);
  
  // Gerar botões para cada unidade
  const unitOptions = document.getElementById('unitOptions');
  unitOptions.innerHTML = units.map(unit => `
    <button onclick="window.selectUnit('${unit}')" class="w-full p-4 bg-gradient-to-r from-purple-500 to-green-500 text-white rounded-lg font-bold text-lg hover:opacity-90 transition shadow-md">
      ${unit.toUpperCase()}
    </button>
  `).join('');
  
  document.getElementById('unitModal').classList.remove('hidden');
};

window.selectUnit = unit => {
  selectedProduct.selectedUnit = unit;
  window.closeUnitModal();
  window.openQuantityModal(selectedProduct.id);
};

window.closeUnitModal = () => {
  const unitModal = document.getElementById('unitModal');
  const modalContent = unitModal.querySelector('.bg-white');
  
  // Adiciona animação de saída
  if (modalContent) {
    modalContent.classList.add('modal-close-down');
  }
  
  // Aguarda a animação terminar antes de realmente fechar
  setTimeout(() => {
    unitModal.classList.add('hidden');
    if (modalContent) {
      modalContent.classList.remove('modal-close-down');
    }
  }, 400); // Tempo da animação em ms
};

// =======================
// MODAL QUANTIDADE
// =======================
window.openQuantityModal = id => {
  selectedProduct = products.find(p => p.id === id);
  selectedQuantity = 0;

  document.getElementById('modalProductName').innerText = selectedProduct.name;
  document.getElementById('modalProductImage').src = selectedProduct.image;
  
  // Usar a unidade selecionada ou a padrão
  const unit = selectedProduct.selectedUnit || selectedProduct.unit;
  document.getElementById('modalProductPrice').innerText =
    `${formatPrice(selectedProduct.price)} / ${unit.toUpperCase()}`;
  document.getElementById('quantityDisplay').innerText = '0';
  document.getElementById('quantityInput').value = '';

  document.getElementById('confirmButton').style.background =
    selectedProduct.color || '#7c3aed';

  document.getElementById('quantityModal').classList.remove('hidden');
};

window.closeQuantityModal = () => {
  const quantityModal = document.getElementById('quantityModal');
  const modalContent = quantityModal.querySelector('.bg-white');
  
  // Adiciona animação de saída
  if (modalContent) {
    modalContent.classList.add('modal-close-down');
  }
  
  // Aguarda a animação terminar antes de realmente fechar
  setTimeout(() => {
    quantityModal.classList.add('hidden');
    if (modalContent) {
      modalContent.classList.remove('modal-close-down');
    }
    
    // Voltar ao modal anterior (unitModal) se houver múltiplas unidades
    if (selectedProduct && selectedProduct.units && selectedProduct.units.length > 1) {
      document.getElementById('unitModal').classList.remove('hidden');
    }
  }, 400); // Tempo da animação em ms
};

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
// 💬 MENSAGEM DE SUCESSO
// =======================
function showSuccessMessage(productName) {
  console.log('💬 Mostrando mensagem de sucesso para:', productName);
  
  // Pega as coordenadas do carrinho
  const cartButton = document.querySelector('button[onclick="window.toggleCart()"]');
  const cartRect = cartButton.getBoundingClientRect();
  
  // Cria a mensagem
  const message = document.createElement('div');
  message.id = 'success-message-' + Date.now();
  message.style.position = 'fixed';
  message.style.left = cartRect.left + 'px';
  message.style.top = cartRect.top + 'px';
  message.style.zIndex = '9998';
  message.style.pointerEvents = 'none';
  message.style.backgroundColor = '#10b981';
  message.style.color = 'white';
  message.style.padding = '16px 24px';
  message.style.borderRadius = '12px';
  message.style.fontWeight = 'bold';
  message.style.fontSize = '14px';
  message.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
  message.style.maxWidth = '300px';
  message.style.textAlign = 'center';
  message.innerHTML = `✅ ${productName}<br><span style="font-size: 12px; font-weight: 500;">adicionado ao carrinho</span>`;
  
  document.body.appendChild(message);
  
  // Força reflow
  message.offsetHeight;
  
  // Calcula posição do meio da tela
  const centerX = (window.innerWidth / 2) - 150; // 150 é aproximadamente metade da largura da mensagem
  const centerY = (window.innerHeight / 2) - 50; // 50 é aproximadamente metade da altura da mensagem
  
  // Distância a percorrer
  const distX = centerX - cartRect.left;
  const distY = centerY - cartRect.top;
  
  console.log('💫 Animando mensagem de:', { x: cartRect.left, y: cartRect.top }, 'para:', { x: centerX, y: centerY });
  
  // Anima a mensagem saindo do carrinho
  message.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  message.style.transform = `translate(${distX}px, ${distY}px) scale(1)`;
  message.style.opacity = '1';
  
  // Após 3 segundos, anima de volta (para desaparecer)
  setTimeout(() => {
    message.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    message.style.transform = `translate(${distX}px, ${distY + 20}px) scale(0.8)`;
    message.style.opacity = '0';
    
    // Remove a mensagem
    setTimeout(() => {
      message.remove();
      console.log('✅ Mensagem removida');
    }, 500);
  }, 3000);
}

// =======================
// 🎨 ANIMAÇÃO PRODUTO PARA CARRINHO
// =======================
function animateProductToCart(productImage, productName) {
  console.log('🎬 Iniciando animação do produto para carrinho...');
  
  // Pega as coordenadas da imagem do produto (onde está agora)
  const productRect = productImage.getBoundingClientRect();
  console.log('📍 Posição do produto:', { top: productRect.top, left: productRect.left, width: productRect.width, height: productRect.height });
  
  // Pega as coordenadas do botão do carrinho
  const cartButton = document.querySelector('button[onclick="window.toggleCart()"]');
  if (!cartButton) {
    console.error('❌ Botão do carrinho não encontrado');
    return;
  }
  
  const cartRect = cartButton.getBoundingClientRect();
  console.log('🛒 Posição do carrinho:', { top: cartRect.top, left: cartRect.left, width: cartRect.width, height: cartRect.height });
  
  // Cria clone da imagem
  const clone = productImage.cloneNode(true);
  clone.id = 'flying-product-' + Date.now();
  clone.style.position = 'fixed';
  clone.style.width = productRect.width + 'px';
  clone.style.height = productRect.height + 'px';
  clone.style.top = productRect.top + 'px';
  clone.style.left = productRect.left + 'px';
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  clone.style.borderRadius = '8px';
  clone.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
  clone.style.transformOrigin = 'center center';
  
  // Adiciona o clone ao documento
  document.body.appendChild(clone);
  
  // Força reflow
  clone.offsetHeight;
  
  // Calcula a distância a ser percorrida
  const startCenterX = productRect.left + productRect.width / 2;
  const startCenterY = productRect.top + productRect.height / 2;
  
  const cartCenterX = cartRect.left + cartRect.width / 2;
  const cartCenterY = cartRect.top + cartRect.height / 2;
  
  const distX = cartCenterX - startCenterX;
  const distY = cartCenterY - startCenterY;
  
  console.log('🚀 Distância a percorrer - X:', distX, 'Y:', distY);
  
  // Aplica a animação
  clone.style.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  clone.style.transform = `translate(${distX}px, ${distY}px) scale(0.1)`;
  clone.style.opacity = '0';
  
  console.log('✅ Animação iniciada');
  
  // Remove o clone após a animação e mostra mensagem de sucesso
  setTimeout(() => {
    clone.remove();
    console.log('✅ Clone removido');
    // Mostra a mensagem de sucesso
    showSuccessMessage(productName);
  }, 2000);
}

window.addToCart = () => {
  if (!selectedQuantity) return;

  // Usar a unidade selecionada ou a padrão
  const selectedUnit = selectedProduct.selectedUnit || selectedProduct.unit;
  
  // Criar ID único para cada combinação de produto + unidade
  const cartItemId = `${selectedProduct.id}_${selectedUnit}`;
  
  const existing = cart.find(i => `${i.id}_${i.selectedUnit || i.unit}` === cartItemId);

  if (existing) {
    existing.quantity += selectedQuantity;
  } else {
    const cartItem = { 
      ...selectedProduct, 
      quantity: selectedQuantity,
      selectedUnit: selectedUnit
    };
    cart.push(cartItem);
  }

  console.log('🛒 Produto adicionado ao carrinho:', selectedProduct.name);

  // 🎨 Pega a imagem ANTES de fechar o modal
  const productImg = document.getElementById('modalProductImage');
  
  // Salva a imagem em um clone antes de fechar o modal
  let imgClone = null;
  if (productImg && productImg.src) {
    // Precisamos guardar as informações da imagem
    const imgRect = productImg.getBoundingClientRect();
    imgClone = {
      src: productImg.src,
      rect: {
        top: imgRect.top,
        left: imgRect.left,
        width: imgRect.width,
        height: imgRect.height
      }
    };
  }

  // PASSO 1: Animar queda dos modais para baixo (1.5s)
  console.log('1️⃣ Modais caindo para baixo...');
  const quantityModal = document.getElementById('quantityModal');
  const unitModal = document.getElementById('unitModal');
  const quantityContent = quantityModal.querySelector('.bg-white');
  const unitContent = unitModal.querySelector('.bg-white');
  
  // Adiciona animação de queda em ambos
  if (quantityContent) quantityContent.classList.add('modal-fall-down');
  if (unitContent) unitContent.classList.add('modal-fall-down');
  
  // Aguarda a animação dos modais terminar (700ms)
  setTimeout(() => {
    // Esconde os modais
    quantityModal.classList.add('hidden');
    unitModal.classList.add('hidden');
    
    // Remove as classes de animação
    if (quantityContent) quantityContent.classList.remove('modal-fall-down');
    if (unitContent) unitContent.classList.remove('modal-fall-down');
    
    console.log('2️⃣ Modais caíram, iniciando animação do produto...');
    
    // PASSO 2: Animar a imagem voando para o carrinho
    if (imgClone) {
      const flyingImg = document.createElement('img');
      flyingImg.src = imgClone.src;
      flyingImg.style.position = 'fixed';
      flyingImg.style.width = imgClone.rect.width + 'px';
      flyingImg.style.height = imgClone.rect.height + 'px';
      flyingImg.style.top = imgClone.rect.top + 'px';
      flyingImg.style.left = imgClone.rect.left + 'px';
      flyingImg.style.zIndex = '9999';
      flyingImg.style.pointerEvents = 'none';
      flyingImg.style.borderRadius = '8px';
      flyingImg.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      flyingImg.style.transformOrigin = 'center center';
      
      document.body.appendChild(flyingImg);
      
      // Força reflow
      flyingImg.offsetHeight;
      
      // Calcula distância até o carrinho
      const cartButton = document.querySelector('button[onclick="window.toggleCart()"]');
      if (cartButton) {
        const cartRect = cartButton.getBoundingClientRect();
        const startCenterX = imgClone.rect.left + imgClone.rect.width / 2;
        const startCenterY = imgClone.rect.top + imgClone.rect.height / 2;
        const cartCenterX = cartRect.left + cartRect.width / 2;
        const cartCenterY = cartRect.top + cartRect.height / 2;
        
        const distX = cartCenterX - startCenterX;
        const distY = cartCenterY - startCenterY;
        
        // Anima a imagem voando
        flyingImg.style.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImg.style.transform = `translate(${distX}px, ${distY}px) scale(0.1)`;
        flyingImg.style.opacity = '0';
        
        console.log('🎬 Imagem voando para o carrinho...');
        
        // PASSO 3: Após a imagem chegar, mostrar mensagem de sucesso saindo do carrinho
        setTimeout(() => {
          flyingImg.remove();
          console.log('3️⃣ Imagem chegou ao carrinho, mostrando mensagem de sucesso...');
          showSuccessMessage(selectedProduct.name);
        }, 2000);
      }
    }
  }, 700); // Tempo de animação de queda dos modais

  saveCart();
  updateCartUI();
};

// Função de transição para voltar ao início com animação
window.transitionToHome = () => {
  const main = document.querySelector('main');
  if (main) {
    main.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    main.style.opacity = '0';
    main.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      // Fechar modal de quantidade
      document.getElementById('quantityModal').classList.add('hidden');
      document.getElementById('unitModal').classList.add('hidden');
      
      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset da animação
      main.style.transition = 'opacity 0.5s ease-in';
      main.style.opacity = '1';
      main.style.transform = 'scale(1)';
    }, 500);
  }
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
    
    // Usar a unidade selecionada ou a padrão
    const displayUnit = (item.selectedUnit || item.unit || 'un').toUpperCase();

    items.innerHTML += `
      <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex-1">
          <strong>${item.name}</strong><br>
          <span class="text-gray-600">${formatPrice(item.price)} / ${displayUnit}</span>
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

window.closePaymentConfirmModal = () =>
  document.getElementById('paymentConfirmModal').classList.add('hidden');

window.openSuccessOrderModal = (orderId, message) => {
  document.getElementById('successOrderId').textContent = orderId;
  document.getElementById('successMessage').textContent = message;
  document.getElementById('successOrderModal').classList.remove('hidden');
};

window.closeSuccessOrderModal = () => {
  document.getElementById('successOrderModal').classList.add('hidden');
  pendingWhatsAppUrl = null;
};

window.sendOrderToWhatsApp = () => {
  if (pendingWhatsAppUrl) {
    window.open(pendingWhatsAppUrl, '_blank');
    window.closeSuccessOrderModal();
  }
};

window.selectDeliveryType = type => {
  deliveryType = type;
  
  // Remover estilos de seleção de todos os botões
  document.getElementById('localBtn').classList.remove('border-green-500', 'bg-green-100', 'border-2');
  document.getElementById('deliveryBtn').classList.remove('border-blue-500', 'bg-blue-100', 'border-2');
  
  // Adicionar estilos de seleção ao botão clicado
  if (type === 'local') {
    document.getElementById('localBtn').classList.add('border-green-500', 'bg-green-100', 'border-2');
    document.getElementById('pickupForm').classList.remove('hidden');
    document.getElementById('deliveryForm').classList.add('hidden');
  } else if (type === 'delivery') {
    document.getElementById('deliveryBtn').classList.add('border-blue-500', 'bg-blue-100', 'border-2');
    document.getElementById('pickupForm').classList.add('hidden');
    document.getElementById('deliveryForm').classList.remove('hidden');
  }
  
  // Mostrar botão de confirmar entrega
  document.getElementById('confirmDeliveryBtn').classList.remove('hidden');
};

// =======================
// CONFIRMAR ENTREGA (Validar dados e mostrar pagamento)
// =======================
window.confirmDelivery = () => {
  // Pegar o form visível (pode ser pickupForm ou deliveryForm)
  const pickupForm = document.getElementById('pickupForm');
  const deliveryFormEl = document.getElementById('deliveryForm');
  const activeForm = !pickupForm.classList.contains('hidden') ? pickupForm : deliveryFormEl;
  
  // Capturar valores dos inputs do form ativo
  const nameInput = activeForm.querySelector('#deliveryName');
  const phoneInput = activeForm.querySelector('#deliveryPhone');
  const addressInput = deliveryFormEl.querySelector('#deliveryAddress');
  const blocoInput = deliveryFormEl.querySelector('#deliveryBloco');
  const aptoInput = deliveryFormEl.querySelector('#deliveryApto');
  
  const name = nameInput?.value?.trim() || '';
  const phone = phoneInput?.value?.trim() || '';
  const address = addressInput?.value?.trim() || '';
  const bloco = blocoInput?.value?.trim() || '';
  const apto = aptoInput?.value?.trim() || '';
  
  console.log('🔍 confirmDelivery - Tipo:', deliveryType, 'Valores:', { name, phone, address, bloco, apto });
  
  // Validar dados obrigatórios
  if (!name || !phone) {
    console.error('❌ Faltam dados obrigatórios:', { name, phone });
    alert('⚠️ Por favor, preencha nome e telefone');
    return;
  }
  
  // Se for entrega, validar endereço
  if (deliveryType === 'delivery' && !address) {
    console.error('❌ Faltam dados de entrega:', { address });
    alert('⚠️ Por favor, preencha o endereço de entrega');
    return;
  }
  
  console.log('✅ Entrega validada! Mostrando opções de pagamento...');
  
  // Calcular e mostrar total
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 3 : 0;
  const total = subtotal + deliveryFee;
  
  // Atualizar texto do total conforme tipo de entrega
  const totalLabel = deliveryType === 'delivery' ? 'Total com Delivery:' : 'Total:';
  
  document.getElementById('deliveryTotal').classList.remove('hidden');
  document.getElementById('deliveryTotalValue').innerText = formatPrice(total);
  document.getElementById('deliveryTotalLabel').innerText = totalLabel;
  document.getElementById('deliveryTotalBreakdown').innerText = deliveryFee > 0 
    ? `Subtotal: ${formatPrice(subtotal)} + Taxa: ${formatPrice(deliveryFee)}`
    : `Subtotal: ${formatPrice(subtotal)}`;
  
  // Mostrar seção de pagamento
  document.getElementById('paymentMethodSection').classList.remove('hidden');
  
  // Ocultar botão de confirmar entrega (já foi validado)
  document.getElementById('confirmDeliveryBtn').classList.add('hidden');
};

window.selectPaymentMethod = method => {
  paymentMethod = method;
  
  // Remover estilos de seleção de todos os botões de pagamento
  document.getElementById('pixPaymentBtn').classList.remove('border-purple-500', 'bg-purple-100', 'border-2');
  document.getElementById('cardPaymentBtn').classList.remove('border-blue-500', 'bg-blue-100', 'border-2');
  document.getElementById('moneyPaymentBtn').classList.remove('border-green-500', 'bg-green-100', 'border-2');
  
  // Adicionar estilos de seleção ao botão clicado
  if (method === 'pix') {
    document.getElementById('pixPaymentBtn').classList.add('border-purple-500', 'bg-purple-100', 'border-2');
  } else if (method === 'card') {
    document.getElementById('cardPaymentBtn').classList.add('border-blue-500', 'bg-blue-100', 'border-2');
  } else if (method === 'money') {
    document.getElementById('moneyPaymentBtn').classList.add('border-green-500', 'bg-green-100', 'border-2');
  }
  
  // Calcular total com delivery
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 3 : 0;
  const total = subtotal + deliveryFee;

  // Configurar modal de confirmação
  const confirmModal = document.getElementById('paymentConfirmModal');
  const titleEl = document.getElementById('paymentConfirmTitle');
  const messageEl = document.getElementById('paymentConfirmMessage');
  const totalEl = document.getElementById('paymentConfirmTotal');
  const confirmBtn = document.getElementById('paymentConfirmBtn');

  totalEl.innerText = formatPrice(total);

  if (method === 'pix') {
    titleEl.innerText = '💜 Confirmar Pagamento com PIX';
    messageEl.innerText = 'Você será redirecionado para gerar um código QR PIX. Após pagar, a confirmação será automática.';
    confirmBtn.innerText = '✅ Gerar Código PIX';
  } else if (method === 'card') {
    titleEl.innerText = '💳 Confirmar Pagamento com Cartão';
    messageEl.innerText = 'Você pagará com cartão de débito/crédito na entrega do seu pedido.';
    confirmBtn.innerText = '✅ Confirmar Cartão na Entrega';
  } else if (method === 'money') {
    titleEl.innerText = '💵 Confirmar Pagamento em Dinheiro';
    messageEl.innerText = 'Você pagará em dinheiro na entrega do seu pedido. Tenha a quantia exata se possível.';
    confirmBtn.innerText = '✅ Confirmar Dinheiro na Entrega';
  }

  confirmModal.classList.remove('hidden');
};

window.confirmPaymentMethod = async () => {
  window.closePaymentConfirmModal();
  
  if (paymentMethod === 'pix') {
    generatePix();
  } else if (paymentMethod === 'card' || paymentMethod === 'money') {
    // Processar pagamento na entrega
    await processPaymentOnDelivery();
  }
};

// =======================
// PIX - POLLING SIMPLES E PERSISTENTE (IGUAL PROJETO TESTE)
// =======================

async function generatePix() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 3 : 0;
  const total = subtotal + deliveryFee;

  console.log('💜 Gerando PIX:', { subtotal, deliveryFee, total, deliveryType, cart });

  document.getElementById('pixTotal').innerText = formatPrice(total);
  document.getElementById('pixModal').classList.remove('hidden');

  document.getElementById('pixContainer').innerHTML =
    '<p class="text-center font-semibold">🔄 Gerando código PIX...</p>';

  try {
    const payload = { 
      valor: total, 
      descricao: 'Pedido Quitanda Vila Natal'
    };
    
    console.log('📤 Enviando para PIX:', JSON.stringify(payload));

    const res = await fetch(`${BACKEND_URL}/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('📬 Resposta PIX status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Erro PIX detalhado:', errorText);
      throw new Error(`Erro ao gerar PIX: ${res.status}`);
    }

    const data = await res.json();
    console.log('✅ PIX gerado:', data);

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
  // Atualizar o input com o código PIX
  document.getElementById('pixCode').value = data.qr_code;
  
  // Mostrar a seção do código PIX
  document.getElementById('pixCodeSection').classList.remove('hidden');
  
  document.getElementById('pixContainer').innerHTML = `
    <div class="text-center">
      <img src="data:image/png;base64,${data.qr_code_base64}" class="mx-auto mb-4 border-4 border-purple-200 rounded-lg p-2 bg-white">
      <p class="text-center font-bold text-purple-600">⏳ Aguardando pagamento...</p>
      <p class="text-center text-xs text-gray-500 mt-2">Escaneie o QR Code ou use o código abaixo</p>
    </div>
  `;
};

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
      
      // 💾 Salvar pedido com status de pagamento "pago" para PIX
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) +
        (deliveryType === 'delivery' ? 3 : 0);
      
      const pedidoCompleto = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('pt-BR'),
        customer_name: document.getElementById('deliveryName').value,
        customer_phone: document.getElementById('deliveryPhone').value,
        address: document.getElementById('deliveryAddress').value,
        bloco: document.getElementById('deliveryBloco').value,
        apto: document.getElementById('deliveryApto').value,
        delivery_type: deliveryType,
        payment_method: 'PIX',
        payment_status: 'pago', // PIX já foi pago!
        payment_id: data.id, // ID do pagamento PIX para referência
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          unit: i.selectedUnit || i.unit
        })),
        total
      };
      
      // Salvar no backend (e fallback em localStorage)
      await salvarPedidoNoBackend(pedidoCompleto);
      
      localStorage.removeItem('hortifruti_cart');
      localStorage.removeItem('paymentId');
      localStorage.removeItem('pixData');
      cart = [];
      updateCartUI();
      
      // Preparar mensagem para WhatsApp (opcional)
      const customerName = document.getElementById('deliveryName').value;
      const customerPhone = document.getElementById('deliveryPhone').value;
      const customerAddress = document.getElementById('deliveryAddress').value;
      const customerBloco = document.getElementById('deliveryBloco').value;
      const customerApto = document.getElementById('deliveryApto').value;
      
      const message = `
🛍️ *NOVO PEDIDO - Quitanda Villa Natal*

*Cliente:* ${customerName}
*Telefone:* ${customerPhone}
*Endereço:* ${customerAddress}${customerBloco ? `, Bloco ${customerBloco}` : ''}${customerApto ? `, Apt ${customerApto}` : ''}

*Produtos:*
${cart.map(i => `• ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2)}`).join('\n')}

${deliveryType === 'delivery' ? '🚗 *Entrega: Sim (+R$ 3,00)*' : '🏪 *Retirada: No Local*'}

*Total: R$ ${pedidoCompleto.total.toFixed(2).replace('.', ',').replace(',', '.')}*
*Forma de Pagamento: PIX (💰 PAGO)*
      `.trim();

      const encodedMessage = encodeURIComponent(message);
      pendingWhatsAppUrl = `https://wa.me/5581971028677?text=${encodedMessage}`;
      
      setTimeout(() => {
        closePixModal();
        window.openSuccessOrderModal(pedidoCompleto.id, '✅ Seu pedido foi realizado com sucesso!\n\n💰 Pagamento confirmado via PIX!');
      }, 3000);
    }
  }, 2000);
}

window.closePixModal = () => {
  if (pixInterval) clearInterval(pixInterval);
  document.getElementById('pixModal').classList.add('hidden');
  document.getElementById('pixCode').value = '';
  document.getElementById('pixCodeSection').classList.add('hidden');
  document.getElementById('pixContainer').innerHTML = '';
};

window.copiarCodigoPix = () => {
  const codigoInput = document.getElementById('pixCode');
  if (!codigoInput.value) {
    alert('❌ Nenhum código PIX disponível');
    return;
  }
  
  // Copiar para a área de transferência
  codigoInput.select();
  document.execCommand('copy');
  
  // Feedback visual
  const botao = event.target;
  const textoOriginal = botao.textContent;
  botao.textContent = '✅ Copiado!';
  botao.classList.add('bg-green-500', 'hover:bg-green-600');
  botao.classList.remove('bg-purple-500', 'hover:bg-purple-600');
  
  setTimeout(() => {
    botao.textContent = textoOriginal;
    botao.classList.remove('bg-green-500', 'hover:bg-green-600');
    botao.classList.add('bg-purple-500', 'hover:bg-purple-600');
  }, 2000);
};

window.showCancelModal = () => {
  console.log('🔴 Modal cancelarCompra aberto');
  document.getElementById('cancelConfirmModal').classList.remove('hidden');
};

window.closeCancelModal = (confirmed) => {
  document.getElementById('cancelConfirmModal').classList.add('hidden');
  
  if (confirmed) {
    console.log('✅ Usuário confirmou cancelamento');
    // Fechar modal PIX
    const pixModal = document.getElementById('pixModal');
    if (pixModal) {
      pixModal.classList.add('hidden');
      console.log('✅ Modal PIX fechado');
    }
    // Fechar modal de delivery
    const deliveryModal = document.getElementById('deliveryModal');
    if (deliveryModal) {
      deliveryModal.classList.add('hidden');
      console.log('✅ Modal Delivery fechado');
    }
    // Parar polling do PIX
    if (pixInterval) clearInterval(pixInterval);
    console.log('❌ Compra cancelada pelo cliente');
  } else {
    console.log('❌ Usuário cancelou a ação');
  }
};

window.cancelarCompra = () => {
  window.showCancelModal();
};

// =======================
// ⏰ STATUS DO ESTABELECIMENTO
// =======================
function atualizarStatusLoja() {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const horaAtual = hora + minuto / 60;
  
  const statusElement = document.getElementById('storeStatus');
  const horaAbertura = 8; // 08:00
  const horaFechamento = 19; // 19:00
  
  const estaAberto = horaAtual >= horaAbertura && horaAtual < horaFechamento;
  
  if (estaAberto) {
    statusElement.classList.remove('status-closed');
    statusElement.classList.add('status-open');
    statusElement.innerHTML = '<span class="status-dot"></span><span>Aberto agora</span>';
    console.log(`✅ Loja aberta (${hora}:${String(minuto).padStart(2, '0')})`);
  } else {
    statusElement.classList.remove('status-open');
    statusElement.classList.add('status-closed');
    statusElement.innerHTML = '<span class="status-dot"></span><span>Fechado agora</span>';
    console.log(`🔴 Loja fechada (${hora}:${String(minuto).padStart(2, '0')})`);
  }
}

// 🔁 Persistência ao carregar página (IGUAL PROJETO TESTE)
window.addEventListener('DOMContentLoaded', async () => {
  // ⏰ Atualizar status da loja ao carregar
  atualizarStatusLoja();
  
  // 🔄 Atualizar status a cada minuto
  setInterval(atualizarStatusLoja, 60000);
  
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
// PAGAMENTO NA ENTREGA (CARTÃO / DINHEIRO)
// =======================
async function processPaymentOnDelivery() {
  // Pegar o form visível
  const pickupForm = document.getElementById('pickupForm');
  const deliveryFormEl = document.getElementById('deliveryForm');
  const activeForm = !pickupForm.classList.contains('hidden') ? pickupForm : deliveryFormEl;
  
  // Capturar valores dos inputs do form ativo
  const nameInput = activeForm.querySelector('#deliveryName');
  const phoneInput = activeForm.querySelector('#deliveryPhone');
  const addressInput = deliveryFormEl.querySelector('#deliveryAddress');
  const blocoInput = deliveryFormEl.querySelector('#deliveryBloco');
  const aptoInput = deliveryFormEl.querySelector('#deliveryApto');
  
  const deliveryInfo = {
    name: nameInput?.value?.trim() || '',
    phone: phoneInput?.value?.trim() || '',
    address: addressInput?.value?.trim() || '',
    bloco: blocoInput?.value?.trim() || '',
    apto: aptoInput?.value?.trim() || '',
    type: deliveryType,
    paymentMethod: paymentMethod === 'card' ? 'Cartão' : 'Dinheiro'
  };

  // Validar dados - para retirada local, endereço não é obrigatório
  if (!deliveryInfo.name || !deliveryInfo.phone) {
    alert('⚠️ Por favor, preencha nome e telefone');
    return;
  }

  // Se for entrega, validar endereço
  if (deliveryType === 'delivery' && !deliveryInfo.address) {
    alert('⚠️ Por favor, preencha o endereço de entrega');
    return;
  }

  // Gerar ID único do pedido UMA ÚNICA VEZ
  const pedidoId = 'ped_' + Date.now();

  // Preparar dados do pedido
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) +
    (deliveryType === 'delivery' ? 3 : 0);

  const orderData = {
    id: pedidoId,
    customer_name: deliveryInfo.name,
    customer_phone: deliveryInfo.phone,
    address: deliveryInfo.address || 'Retirada no local',
    bloco: deliveryInfo.bloco,
    apto: deliveryInfo.apto,
    delivery_type: deliveryType,
    payment_method: deliveryInfo.paymentMethod,
    payment_status: 'pendente',
    payment_id: null,
    items: cart.map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      unit: i.selectedUnit || i.unit
    })),
    total
  };

  // Enviar para API (backend)
  try {
    const response = await fetch(`${PRODUCTS_API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status} ao enviar pedido para banco`);
    }
    
    console.log('✅ Pedido enviado para o banco de dados (primeira tentativa)');
  } catch (error) {
    console.error('❌ Erro ao enviar pedido (primeira tentativa):', error);
    // Continua mesmo com erro, será retentado no salvarPedidoNoBackend
  }

  // Salvar pedido no localStorage com status de pagamento
  const pedidoCompleto = {
    id: pedidoId, // Usar o mesmo ID gerado acima
    timestamp: new Date().toLocaleString('pt-BR'),
    customer_name: deliveryInfo.name,
    customer_phone: deliveryInfo.phone,
    address: deliveryInfo.address || 'Retirada no local',
    bloco: deliveryInfo.bloco,
    apto: deliveryInfo.apto,
    delivery_type: deliveryType,
    payment_method: deliveryInfo.paymentMethod,
    payment_status: 'pendente',
    payment_id: null,
    items: cart.map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      unit: i.selectedUnit || i.unit
    })),
    total
  };
  
  // Salvar no backend (e fallback em localStorage)
  await salvarPedidoNoBackend(pedidoCompleto);

  // Enviar para WhatsApp
  const message = `
🛍️ *NOVO PEDIDO - Quitanda Villa Natal*

*Cliente:* ${deliveryInfo.name}
*Telefone:* ${deliveryInfo.phone}
*Endereço:* ${deliveryInfo.address}${deliveryInfo.bloco ? `, Bloco ${deliveryInfo.bloco}` : ''}${deliveryInfo.apto ? `, Apt ${deliveryInfo.apto}` : ''}

*Produtos:*
${cart.map(i => `• ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2)}`).join('\n')}

${deliveryType === 'delivery' ? '🚗 *Entrega: Sim (+R$ 3,00)*' : '🏪 *Retirada: No Local*'}

*Total: R$ ${total.toFixed(2).replace('.', ',').replace(',', '.')}*
*Forma de Pagamento: ${deliveryInfo.paymentMethod}*
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/5581971028677?text=${encodedMessage}`;

  // Armazenar URL do WhatsApp para opcional
  pendingWhatsAppUrl = whatsappUrl;

  // Limpar carrinho
  cart = [];
  localStorage.removeItem('hortifruti_cart');
  updateCartUI();

  // Fechar modals e mostrar sucesso
  closeDeliveryModal();
  
  // Mostrar modal de sucesso com opção de WhatsApp
  setTimeout(() => {
    const successMsg = `✅ Seu pedido foi confirmado!\n\n💳 Forma de Pagamento: ${deliveryInfo.paymentMethod}\n\nDeseja enviar para o WhatsApp da loja?`;
    window.openSuccessOrderModal(pedidoCompleto.id, successMsg);
  }, 500);
}

// =======================
// INIT
// =======================
loadCart();

// Carregar produtos de forma assíncrona
(async () => {
  await loadProducts();
  updateCartUI();
})();

// sincronização simples entre abas
window.addEventListener('storage', async e => {
  if (e.key === 'hortifruti_products') await loadProducts();
});
