// ===== INICIALIZAÇÃO DO PAINEL ADMIN =====
console.log('%c🚀 ADMIN PANEL LOADED', 'color: green; font-weight: bold; font-size: 16px;');

// URL DA API (alterar quando fazer deploy)
const API_URL = 'https://quitanda-produtos-api.onrender.com'; // Será atualizada após deploy

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let products = [];
let editingProductId = null;
let allPedidos = [];
let currentPedidoId = null;

// =======================
// DIAGNÓSTICO DE LOCALSTORAGE
// =======================
window.diagnosticarPedidos = function() {
    console.clear();
    console.log('%c📊 DIAGNÓSTICO DE PEDIDOS', 'color: purple; font-weight: bold; font-size: 16px;');
    
    const orders = localStorage.getItem('hortifruti_orders');
    console.log('%c1️⃣ localStorage.getItem("hortifruti_orders"):', 'color: blue; font-weight: bold;', orders);
    
    if (orders) {
        const parsed = JSON.parse(orders);
        console.log('%c2️⃣ Pedidos parseados:', 'color: green; font-weight: bold;', parsed.length, 'pedidos');
        console.table(parsed);
        console.log('%c3️⃣ allPedidos global:', 'color: cyan; font-weight: bold;', allPedidos.length, 'pedidos');
        console.table(allPedidos);
    } else {
        console.warn('%c⚠️ localStorage vazio! Nenhum pedido encontrado.', 'color: orange; font-weight: bold;');
    }
};

// Chamar diagnóstico na inicialização
window.diagnosticarPedidos();

// =======================
// CARREGAR PRODUTOS DA API
// =======================
async function loadData() {
    console.log('%c📂 CARREGANDO PRODUTOS DA API...', 'color: blue; font-weight: bold;');
    
    try {
        const response = await fetch(`${API_URL}/produtos`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao buscar produtos`);
        }
        
        products = await response.json();
        console.log('%c✅ Produtos carregados da API:', 'color: green;', products.length);
    } catch (error) {
        console.error('%c❌ Erro ao carregar da API:', 'color: red;', error.message);
        alert(`⚠️ Erro ao conectar com a API: ${error.message}\n\nVerifique se o backend está online.`);
        products = [];
    }
    
    renderProducts();
    setupAutoRefresh();
}

// =======================
// AUTO-REFRESH A CADA 5 SEGUNDOS
// =======================
function setupAutoRefresh() {
    console.log('%c📡 Configurando auto-refresh...', 'color: blue; font-weight: bold;');
    
    // Recarregar produtos a cada 5 segundos para sincronizar com outras abas/pessoas
    setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/produtos`);
            if (response.ok) {
                const novosProdutos = await response.json();
                
                // Verificar se há mudanças
                if (JSON.stringify(novosProdutos) !== JSON.stringify(products)) {
                    console.log('%c🔄 Produtos atualizados de outra fonte!', 'color: purple;');
                    products = novosProdutos;
                    renderProducts();
                }
            }
        } catch (error) {
            console.error('Erro no auto-refresh:', error);
        }
    }, 5000);
}

// =======================
// RENDERIZAR LISTA DE PRODUTOS
// =======================
function renderProducts() {
    const list = document.getElementById('productsList');
    const empty = document.getElementById('emptyProducts');
    
    if (products.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    list.innerHTML = products.map(p => `
        <div class="flex items-center gap-4 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
            <img src="${p.image}" alt="${p.name}" class="w-24 h-24 object-cover rounded-lg">
            <div class="flex-1">
                <h4 class="text-lg font-bold text-gray-800">${p.name}</h4>
                ${p.description ? `<p class="text-sm text-gray-500">${p.description}</p>` : ''}
                <div class="flex items-center gap-4 mt-2">
                    <span class="text-xl font-bold text-green-600">R$ ${p.price.toFixed(2)}</span>
                    <span class="text-sm text-gray-600">${p.unit}</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editProduct('${p.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                    ✏️ Editar
                </button>
                <button onclick="deleteProduct('${p.id}')" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// =======================
// ABRIR MODAL NOVO PRODUTO
// =======================
function openProductModal() {
    console.log('%c📋 Abrindo modal de novo produto', 'color: blue; font-weight: bold;');
    
    editingProductId = null;
    
    const requiredElements = [
        'modalTitle', 'productId', 'productName', 'productDescription', 
        'productPrice', 'productUnit', 'productImage', 'productImageFile',
        'productImageData', 'productColor', 'imagePreview', 'productModal'
    ];
    
    let allExist = true;
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`  ❌ Elemento não encontrado: #${id}`);
            allExist = false;
        }
    });
    
    if (!allExist) {
        alert('❌ Erro: Alguns elementos do formulário estão faltando.');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Novo Produto';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productUnit').value = 'kg';
    document.getElementById('productImage').value = '';
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImageData').value = '';
    document.getElementById('productColor').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productModal').classList.add('flex');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productModal').classList.remove('flex');
}

// =======================
// EDITAR PRODUTO
// =======================
function editProduct(id) {
    console.log('%c✏️ Editando produto:', 'color: blue; font-weight: bold;', id);
    
    const product = products.find(p => p.id === id);
    if (!product) {
        console.error('  ❌ Produto não encontrado');
        return;
    }
    
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Editar Produto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImageData').value = '';
    document.getElementById('productColor').value = product.color || '';
    
    document.getElementById('imagePreview').classList.remove('hidden');
    document.getElementById('previewImg').src = product.image;
    
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productModal').classList.add('flex');
}

// =======================
// SELECIONAR COR
// =======================
function selectColor(color, element) {
    console.log('%c🎨 Cor selecionada:', 'color: purple;', color);
    document.getElementById('productColor').value = color;
    
    if (element) {
        element.style.border = '3px solid #000';
        setTimeout(() => {
            element.style.border = 'none';
        }, 300);
    }
}

// =======================
// MANIPULAR IMAGEM
// =======================
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('productImageFile');
    const urlInput = document.getElementById('productImage');
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                urlInput.disabled = true;
                urlInput.value = '';
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    document.getElementById('productImageData').value = base64;
                    document.getElementById('imagePreview').classList.remove('hidden');
                    document.getElementById('previewImg').src = base64;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                fileInput.disabled = true;
                fileInput.value = '';
                document.getElementById('productImageData').value = '';
                document.getElementById('imagePreview').classList.remove('hidden');
                document.getElementById('previewImg').src = url;
            } else {
                fileInput.disabled = false;
            }
        });
    }
});

// =======================
// SALVAR PRODUTO
// =======================
async function saveProduct(e) {
    e.preventDefault();
    
    console.log('%c💾 SALVANDO PRODUTO...', 'color: blue; font-weight: bold;');
    
    const imageData = document.getElementById('productImageData').value;
    const imageUrl = document.getElementById('productImage').value;
    const finalImage = imageData || imageUrl;
    
    if (!finalImage) {
        alert('⚠️ Por favor, adicione uma imagem');
        return;
    }
    
    const productName = document.getElementById('productName').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    
    if (!productName) {
        alert('⚠️ Por favor, preencha o nome do produto');
        return;
    }
    
    if (!productPrice || productPrice <= 0) {
        alert('⚠️ Por favor, preencha um preço válido');
        return;
    }
    
    const productData = {
        id: editingProductId || 'prod_' + Date.now(),
        name: productName,
        description: document.getElementById('productDescription').value,
        price: productPrice,
        unit: document.getElementById('productUnit').value,
        image: finalImage,
        color: document.getElementById('productColor').value || null
    };
    
    try {
        let url = `${API_URL}/produtos`;
        let method = 'POST';
        
        if (editingProductId) {
            url = `${API_URL}/produtos/${editingProductId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao salvar`);
        }
        
        console.log(`✅ Produto ${editingProductId ? 'atualizado' : 'criado'} com sucesso`);
        
        // Recarregar produtos
        await loadData();
        closeProductModal();
        alert('✅ Produto salvo com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert(`❌ Erro ao salvar: ${error.message}`);
    }
}

// =======================
// DELETAR PRODUTO
// =======================
async function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
        const response = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao deletar`);
        }
        
        console.log(`✅ Produto ${id} deletado com sucesso`);
        
        // Recarregar produtos
        await loadData();
        alert('✅ Produto excluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        alert(`❌ Erro ao deletar: ${error.message}`);
    }
}

// =======================
// GERENCIAR PEDIDOS
// =======================// =======================
// 📋 CARREGAR PEDIDOS
// =======================
async function loadPedidos() {
    console.log('%c📋 CARREGANDO PEDIDOS DO BACKEND...', 'color: blue; font-weight: bold;');
    
    try {
        const response = await fetch(`${API_URL}/pedidos`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const backendOrders = await response.json();
        console.log('%c✅ Pedidos carregados do backend:', 'color: green;', backendOrders.length);
        
        // Transformar pedidos do backend para formato compatível
        allPedidos = backendOrders.map(order => ({
            id: order.id,
            customer_name: order.customer_name || 'N/A',
            customer_phone: order.customer_phone || 'N/A',
            address: order.address || 'Retirada no local',
            bloco: order.bloco || '',
            apto: order.apto || '',
            delivery_type: order.delivery_type || 'local',
            payment_method: order.payment_method || 'N/A',
            payment_status: order.payment_status || 'pendente',
            payment_id: order.payment_id,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [],
            total: order.total || 0,
            status: order.status || 'pendente',
            notes: order.notes || '',
            created_at: order.created_at,
            updated_at: order.updated_at
        }));
        
    } catch (error) {
        console.error('%c❌ ERRO CRÍTICO ao carregar pedidos do backend:', 'color: red; font-weight: bold;', error);
        alert('❌ ERRO: Não foi possível carregar os pedidos do banco de dados. Verifique sua conexão com a internet.');
        allPedidos = [];
    }
    
    // Ordenar por data (mais recentes primeiro)
    allPedidos.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
    });
    
    console.log('%c📊 Pedidos processados:', 'color: magenta;', allPedidos.length);
    renderPedidos(allPedidos);
}

// =======================
// AUTO-REFRESH PEDIDOS A CADA 5 SEGUNDOS
// =======================
function setupAutoRefreshPedidos() {
    console.log('%c📡 Configurando auto-refresh de pedidos...', 'color: blue; font-weight: bold;');
    
    setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/pedidos`);
            if (response.ok) {
                const novosPedidos = await response.json();
                
                // Verificar se há mudanças
                if (JSON.stringify(novosPedidos) !== JSON.stringify(allPedidos)) {
                    console.log('%c🔄 Novos pedidos detectados!', 'color: purple;');
                    await loadPedidos(); // Recarregar e renderizar
                }
            }
        } catch (error) {
            console.error('Erro no auto-refresh de pedidos:', error);
        }
    }, 5000); // A cada 5 segundos
}

// =======================
// 📊 RENDERIZAR PEDIDOS
// =======================
function renderPedidos(pedidos) {
    const list = document.getElementById('pedidosList');
    
    if (pedidos.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum pedido encontrado</p>';
        return;
    }

    const statusEmojis = {
        'pendente': '🔴',
        'confirmado': '🟡',
        'preparando': '🟠',
        'pronto': '🟢',
        'entregue': '✅',
        'cancelado': '❌'
    };

    list.innerHTML = pedidos.map(p => {
        const paymentBadge = p.payment_status === 'pago' ? '✅ Pago' : '❌ Pendente';
        const paymentColor = p.payment_status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        
        return `
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer ${p.payment_status === 'pago' ? 'bg-green-50' : 'bg-yellow-50'}" onclick="abrirPedidoModal('${p.id}')">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${p.customer_name}</h3>
                    <p class="text-sm text-gray-500">📱 ${p.customer_phone}</p>
                </div>
                <div class="flex gap-2">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${paymentColor}">${paymentBadge}</span>
                    <span class="text-xl">${statusEmojis[p.status] || '❓'}</span>
                </div>
            </div>
            
            <p class="text-sm text-gray-600 mb-2">📍 ${p.address}${p.bloco ? `, Bloco ${p.bloco}` : ''}${p.apto ? `, Apt ${p.apto}` : ''}</p>
            <p class="text-sm text-gray-600 mb-2">💳 ${p.payment_method} • ${p.delivery_type === 'delivery' ? '🚗 Entrega' : '🏪 Retirada'}</p>
            
            <div class="flex justify-between items-end">
                <div>
                    <span class="text-xs text-gray-500">${new Date(p.created_at).toLocaleDateString('pt-BR')} ${new Date(p.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <span class="text-xl font-bold text-green-600">R$ ${parseFloat(p.total).toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
    `}).join('');
}

function abrirPedidoModal(id) {
    console.log('%c🔍 Abrindo modal para ID:', 'color: blue;', id, 'Tipo:', typeof id);
    currentPedidoId = id;
    
    // Comparar como string e número para garantir compatibilidade
    const pedido = allPedidos.find(p => p.id == id || p.id === id || String(p.id) === String(id));
    
    if (!pedido) {
        console.error('%c❌ Pedido não encontrado!', 'color: red;', 'ID:', id);
        console.log('%c📋 Pedidos disponíveis:', 'color: cyan;', allPedidos.map(p => ({id: p.id, name: p.customer_name})));
        return;
    }

    console.log('%c✅ Pedido encontrado:', 'color: green;', pedido);
    
    const itens = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items || [];
    
    
    const paymentStatusBadge = pedido.payment_status === 'pago' 
        ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✅ PAGO</span>'
        : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">❌ PENDENTE</span>';
    
    const marcarPagoButton = pedido.payment_status !== 'pago' && pedido.payment_method !== 'PIX' 
        ? `<button onclick="marcarComoPago('${pedido.id}')" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">💰 Marcar como Pago</button>`
        : '';
    
    const content = `
        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">💳 Status de Pagamento</h4>
            <div>${paymentStatusBadge}</div>
            <p><strong>Método:</strong> ${pedido.payment_method}</p>
            ${pedido.payment_id ? `<p><strong>ID Transação:</strong> ${pedido.payment_id}</p>` : ''}
            ${marcarPagoButton}
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">👤 Cliente</h4>
            <p><strong>Nome:</strong> ${pedido.customer_name}</p>
            <p><strong>Telefone:</strong> <a href="tel:${pedido.customer_phone}" class="text-blue-600">${pedido.customer_phone}</a></p>
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">📍 Endereço</h4>
            <p>${pedido.address}${pedido.bloco ? `, Bloco ${pedido.bloco}` : ''}${pedido.apto ? `, Apt ${pedido.apto}` : ''}</p>
            <p><strong>Tipo:</strong> ${pedido.delivery_type === 'delivery' ? '🚗 Entrega' : '🏪 Retirada'}</p>
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">🛒 Itens (${itens.length})</h4>
            ${itens.map(i => `<p>• ${i.name} (${i.quantity}x ${i.unit}) - R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}</p>`).join('')}
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">💰 Valor Total</h4>
            <p class="text-2xl font-bold text-green-600">R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}</p>
        </div>

        <div class="space-y-2 pb-4">
            <h4 class="font-bold text-lg">📅 Data e Hora</h4>
            <p>${new Date(pedido.created_at).toLocaleDateString('pt-BR')} às ${new Date(pedido.created_at).toLocaleTimeString('pt-BR')}</p>
        </div>
    `;

    document.getElementById('pedidoDetailsContent').innerHTML = content;
    document.getElementById('pedidoStatus').value = pedido.status;
    document.getElementById('pedidoNotes').value = pedido.notes || '';
    document.getElementById('pedidoModal').classList.remove('hidden');
}

function closePedidoModal() {
    document.getElementById('pedidoModal').classList.add('hidden');
    currentPedidoId = null;
}

async function salvarPedidoChanges() {
    if (!currentPedidoId) return;

    const pedido = allPedidos.find(p => p.id === currentPedidoId);
    if (!pedido) return;

    const status = document.getElementById('pedidoStatus').value;
    const notes = document.getElementById('pedidoNotes').value;

    // Atualizar no localStorage
    let orders = JSON.parse(localStorage.getItem('hortifruti_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === currentPedidoId);
    if (orderIndex >= 0) {
        orders[orderIndex].status = status;
        orders[orderIndex].notes = notes;
        localStorage.setItem('hortifruti_orders', JSON.stringify(orders));
        console.log('✅ Pedido atualizado no localStorage');
    }

    closePedidoModal();
    loadPedidos();
}

// Marcar pedido como pago (para Cartão/Dinheiro)
function marcarComoPago(pedidoId) {
    console.log('%c💰 Marcando como pago:', 'color: blue;', pedidoId);
    
    // Comparar como string e número
    const pedido = allPedidos.find(p => p.id == pedidoId || p.id === pedidoId || String(p.id) === String(pedidoId));
    
    if (!pedido) {
        console.error('%c❌ Pedido não encontrado', 'color: red;', 'ID:', pedidoId);
        return;
    }
    
    // Atualizar no backend
    fetch(`${API_URL}/pedidos/${pedido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'pago' })
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro ao atualizar no backend');
        console.log('%c✅ Pedido marcado como pago no backend', 'color: green;');
        
        // Atualizar em localStorage também
        let orders = JSON.parse(localStorage.getItem('hortifruti_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == pedidoId || o.id === pedidoId || String(o.id) === String(pedidoId));
        if (orderIndex >= 0) {
            orders[orderIndex].payment_status = 'pago';
            localStorage.setItem('hortifruti_orders', JSON.stringify(orders));
        }
        
        alert('✅ Pagamento marcado como confirmado!');
        loadPedidos();
        closePedidoModal();
    })
    .catch(error => {
        console.error('%c❌ Erro ao marcar como pago:', 'color: red;', error);
        alert('❌ Erro ao salvar no banco de dados. Tente novamente.');
    });
}

// Buscar pedidos
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('pedidosSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const filtered = allPedidos.filter(p => 
                p.customer_name.toLowerCase().includes(termo) || 
                p.customer_phone.includes(termo)
            );
            renderPedidos(filtered);
        });
    }
});

// =======================
// TROCAR ABAS
// =======================
window.showTab = function(tab) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-purple-600', 'text-purple-600');
        btn.classList.add('border-gray-200', 'text-gray-600');
    });

    // Mostrar aba selecionada
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('border-gray-200', 'text-gray-600');
    document.getElementById(`tab-${tab}`).classList.add('border-purple-600', 'text-purple-600');

    // Carregar pedidos se necessário
    if (tab === 'pedidos') {
        loadPedidos();
    }
};

// =======================
// 🔄 SINCRONIZAÇÃO DE ABAS
// =======================
// Escutar mudanças no localStorage (outros pedidos)
window.addEventListener('storage', (event) => {
    if (event.key === 'hortifruti_orders') {
        console.log('%c🔄 PEDIDOS ATUALIZADOS DE OUTRA ABA!', 'color: blue; font-weight: bold;');
        loadPedidos();
    }
});

// Escutar novos pedidos adicionados via CustomEvent (mesma aba)
window.addEventListener('pedidoAdicionado', (event) => {
    console.log('%c📦 NOVO PEDIDO ADICIONADO!', 'color: green; font-weight: bold;');
    loadPedidos();
});

// =======================
// INICIALIZAR
// =======================
console.log('%c🔄 INICIALIZANDO PAINEL...', 'color: orange; font-weight: bold;');
loadData();
loadPedidos();

// ✨ Verificar se deve abrir aba de pedidos automaticamente
const params = new URLSearchParams(window.location.search);
const tabFromUrl = params.get('tab');
if (tabFromUrl === 'pedidos') {
    console.log('%c📋 Abrindo aba de pedidos automaticamente...', 'color: green; font-weight: bold;');
    setTimeout(() => {
        window.showTab('pedidos');
    }, 500);
}

// ✨ Iniciar auto-refresh de pedidos
setupAutoRefreshPedidos();

console.log('%c✨ PAINEL PRONTO!', 'color: green; font-weight: bold; font-size: 14px;');
