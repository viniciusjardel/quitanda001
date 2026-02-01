// ===== INICIALIZAÇÃO DO PAINEL ADMIN =====
console.log('%c🚀 ADMIN PANEL LOADED', 'color: green; font-weight: bold; font-size: 16px;');

// URL DA API (alterar quando fazer deploy)
const API_URL = 'https://quitanda-produtos-api.onrender.com'; // Será atualizada após deploy

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let products = [];

// =======================
// FUNÇÕES DE NOTIFICAÇÃO
// =======================
function showSuccessModal(title = 'Sucesso!', message = 'Operação realizada com sucesso!') {
    const modal = document.getElementById('successModal');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
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
        console.table(products.map(p => ({ 
            id: p.id, 
            name: p.name, 
            unit: p.unit,
            units: p.units ? p.units.join(', ') : 'N/A'
        })));
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
// ATUALIZAR DISPLAY DE UNIDADES
// =======================
function updateUnitsDisplay() {
    const selectedUnits = Array.from(document.querySelectorAll('.product-unit-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    const infoElement = document.getElementById('unitsSelectedInfo');
    if (infoElement) {
        if (selectedUnits.length === 0) {
            infoElement.textContent = 'Nenhuma unidade selecionada';
            infoElement.style.color = '#999';
        } else {
            infoElement.textContent = `Unidades selecionadas: ${selectedUnits.join(', ')}`;
            infoElement.style.color = '#10b981';
            infoElement.style.fontWeight = 'bold';
        }
    }
    
    // Atualizar campos de preço para cada unidade
    updateUnitPricesFields(selectedUnits);
}

function updateUnitPricesFields(selectedUnits) {
    const container = document.getElementById('unitPricesContainer');
    const fieldsContainer = document.getElementById('unitPricesFields');
    
    if (!container || !fieldsContainer) return;
    
    if (selectedUnits.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    // Gerar campos de preço para cada unidade
    fieldsContainer.innerHTML = selectedUnits.map(unit => `
        <div class="flex items-center gap-3">
            <label class="text-sm font-semibold text-gray-700 w-20">${unit.toUpperCase()}</label>
            <div class="flex-1 flex items-center">
                <span class="text-gray-600 font-semibold mr-2">R$</span>
                <input type="number" 
                       class="unit-price-input flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none" 
                       data-unit="${unit}" 
                       step="0.01" 
                       min="0" 
                       placeholder="0.00"
                       value="">
            </div>
        </div>
    `).join('');
}

// Adicionar listeners aos checkboxes de unidades quando o modal abre
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-unit-checkbox')) {
            updateUnitsDisplay();
        }
    });
});

// =======================
// ABRIR MODAL NOVO PRODUTO
// =======================
function openProductModal() {
    console.log('%c📋 Abrindo modal de novo produto', 'color: blue; font-weight: bold;');
    
    editingProductId = null;
    
    const requiredElements = [
        'modalTitle', 'productId', 'productName', 'productDescription', 
        'productImage', 'productImageFile',
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
    document.getElementById('productImage').value = '';
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImageData').value = '';
    document.getElementById('productColor').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    
    // Limpar seleção de unidades
    document.querySelectorAll('.product-unit-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateUnitsDisplay();
    
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
    
    console.log('%c📦 Dados do produto:', 'color: purple; font-weight: bold;', product);
    console.log('%c📋 Array de unidades:', 'color: cyan;', product.units);
    
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Editar Produto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image;
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImageData').value = '';
    document.getElementById('productColor').value = product.color || '';
    
    // Carregar unidades (verificar se é array ou string antiga)
    document.querySelectorAll('.product-unit-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    const units = Array.isArray(product.units) ? product.units : [product.unit];
    console.log('%c✅ Unidades a carregar:', 'color: orange;', units);
    
    units.forEach(unit => {
        const checkbox = document.querySelector(`.product-unit-checkbox[value="${unit}"]`);
        console.log(`  Procurando: .product-unit-checkbox[value="${unit}"]`, checkbox);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`    ✅ Marcado: ${unit}`);
        } else {
            console.log(`    ❌ NÃO ENCONTRADO: ${unit}`);
        }
    });
    
    updateUnitsDisplay();
    
    // Carregar preços por unidade
    if (product.prices && typeof product.prices === 'object') {
        console.log('%c💰 Carregando preços por unidade:', 'color: green; font-weight: bold;', product.prices);
        document.querySelectorAll('.unit-price-input').forEach(input => {
            const unit = input.getAttribute('data-unit');
            if (product.prices[unit]) {
                input.value = product.prices[unit];
                console.log(`  Preço ${unit}: ${product.prices[unit]}`);
            }
        });
    } else if (product.price) {
        // Se não houver preços por unidade, preencher com preço padrão
        console.log('%c💰 Usando preço padrão para todas unidades:', 'color: orange;', product.price);
        document.querySelectorAll('.unit-price-input').forEach(input => {
            input.value = product.price;
        });
    }
    
    // Carregar categoria
    document.getElementById('productCategory').value = product.category || '';
    
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
    
    if (!productName) {
        alert('⚠️ Por favor, preencha o nome do produto');
        return;
    }
    
    // Capturar múltiplas unidades
    const selectedUnits = Array.from(document.querySelectorAll('.product-unit-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    console.log('%c📋 Unidades selecionadas:', 'color: orange; font-weight: bold;', selectedUnits);
    
    if (selectedUnits.length === 0) {
        alert('⚠️ Por favor, selecione pelo menos uma unidade de medida');
        return;
    }

    // Capturar preços por unidade
    const unitPrices = {};
    document.querySelectorAll('.unit-price-input').forEach(input => {
        const unit = input.getAttribute('data-unit');
        const priceValue = parseFloat(input.value) || 0;
        if (unit && priceValue > 0) {
            unitPrices[unit] = parseFloat(priceValue.toFixed(2));
        }
    });
    
    console.log('%c💰 Preços por unidade:', 'color: green; font-weight: bold;', unitPrices);
    
    // Validar se todos as unidades têm preço
    const unitsWithoutPrice = selectedUnits.filter(unit => !unitPrices[unit]);
    if (unitsWithoutPrice.length > 0) {
        alert(`⚠️ Por favor, defina o preço para: ${unitsWithoutPrice.join(', ')}`);
        return;
    }
    
    const productData = {
        id: editingProductId || 'prod_' + Date.now(),
        name: productName,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value || null,
        price: Object.values(unitPrices)[0], // Usar o primeiro preço como padrão
        prices: unitPrices,              // Novos preços por unidade
        unit: selectedUnits[0], // Manter compatibilidade com sistemas antigos
        units: selectedUnits,   // Nova estrutura com múltiplas unidades
        image: finalImage,
        color: document.getElementById('productColor').value || null
    };
    
    console.log('%c💾 Dados sendo salvos:', 'color: green; font-weight: bold;', productData);
    
    // Validação adicional
    if (!productData.name || productData.name.trim() === '') {
        alert('⚠️ Por favor, preencha o nome do produto');
        return;
    }
    
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
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            const errorMsg = errorData.details || errorData.error || `Erro ${response.status}`;
            throw new Error(`Erro ${response.status}: ${errorMsg}`);
        }
        
        const responseData = await response.json();
        console.log(`✅ Produto ${editingProductId ? 'atualizado' : 'criado'} com sucesso:`, responseData);
        
        // Mostrar mensagem de sucesso IMEDIATAMENTE
        showSuccessModal('✅ Produto Salvo!', `O produto "${productName}" foi salvo com sucesso!`);
        
        // Fechar o modal de edição
        closeProductModal();
        
        // Recarregar produtos em background
        await loadData();
        
        console.log('%c🔍 VERIFICANDO DADOS APÓS RELOAD:', 'color: cyan; font-weight: bold;');
        const reloadedProduct = products.find(p => p.id === editingProductId);
        console.log('%c📦 Produto recarregado:', 'color: cyan;', reloadedProduct);
        if (reloadedProduct) {
            console.log('%c📋 Unidades no produto recarregado:', 'color: cyan;', reloadedProduct.units);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        console.error('📝 Dados que foram enviados:', productData);
        alert(`❌ Erro ao salvar:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
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
        showSuccessModal('🗑️ Produto Excluído!', 'O produto foi removido com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        showSuccessModal('⚠️ Erro', `Não foi possível excluir o produto: ${error.message}`);
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
    console.log('%c🎨 RENDERIZANDO PEDIDOS...', 'color: green; font-weight: bold;', pedidos.length);
    
    const list = document.getElementById('pedidosList');
    
    if (!list) {
        console.error('%c❌ ERRO: Elemento #pedidosList não encontrado!', 'color: red; font-weight: bold;');
        return;
    }
    
    if (pedidos.length === 0) {
        console.log('%c📭 Nenhum pedido encontrado', 'color: orange;');
        list.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum pedido encontrado</p>';
        console.log('%c✅ HTML dos pedidos vazios renderizado na tela!', 'color: green; font-weight: bold;');
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
        <div class="pedido-item border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer ${p.payment_status === 'pago' ? 'bg-green-50' : 'bg-yellow-50'}" data-pedido-id="${p.id}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">Nota #${p.id}</h3>
                    <p class="text-sm text-gray-700 font-semibold">${p.customer_name}</p>
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
    
    // Adicionar event listeners aos pedidos
    document.querySelectorAll('.pedido-item').forEach(item => {
        item.addEventListener('click', function() {
            const pedidoId = this.getAttribute('data-pedido-id');
            console.log('%c🖱️ CLIQUE DETECTADO NO PEDIDO:', 'color: orange; font-weight: bold;', pedidoId);
            window.abrirPedidoModal(pedidoId);
        });
    });
    
    console.log('%c✅ HTML gerado:', 'color: green; font-weight: bold;', `${list.innerHTML.length} caracteres`);
    console.log('%c✅ HTML dos pedidos renderizado na tela!', 'color: green; font-weight: bold;');
}

window.abrirPedidoModal = function(id) {
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
    
    // ===== PREENCHER CABEÇALHO DA NOTA =====
    document.getElementById('notaNumero').textContent = `Nota #${pedido.id}`;
    const dataFormatada = new Date(pedido.created_at).toLocaleDateString('pt-BR');
    const horaFormatada = new Date(pedido.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    document.getElementById('notaData').textContent = `${dataFormatada} às ${horaFormatada}`;
    
    // ===== PREENCHER INFORMAÇÕES DO CLIENTE =====
    document.getElementById('notaCliente').innerHTML = `
        <p><strong>Nome:</strong> ${pedido.customer_name}</p>
        <p><strong>Telefone:</strong> <a href="tel:${pedido.customer_phone}" class="text-blue-600">${pedido.customer_phone}</a></p>
    `;
    
    // ===== PREENCHER INFORMAÇÕES DE ENTREGA =====
    const tipoEntrega = pedido.delivery_type === 'delivery' ? '🚗 Entrega' : '🏪 Retirada';
    document.getElementById('notaEntrega').innerHTML = `
        <p><strong>Endereço:</strong> ${pedido.address}${pedido.bloco ? `, Bloco ${pedido.bloco}` : ''}${pedido.apto ? `, Apt ${pedido.apto}` : ''}</p>
        <p><strong>Tipo:</strong> ${tipoEntrega}</p>
    `;
    
    // ===== PREENCHER PRODUTOS =====
    document.getElementById('notaProdutos').innerHTML = itens.map((i, index) => {
        const subtotal = (i.price * i.quantity).toFixed(2).replace('.', ',');
        return `
            <div class="flex justify-between items-center py-2 border-b">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">${index + 1}. ${i.name}</p>
                    <p class="text-sm text-gray-600">${i.quantity}x ${i.unit} @ R$ ${parseFloat(i.price).toFixed(2).replace('.', ',')}</p>
                </div>
                <p class="font-bold text-gray-800">R$ ${subtotal}</p>
            </div>
        `;
    }).join('');
    
    // ===== PREENCHER TOTAL =====
    document.getElementById('notaTotal').textContent = `R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}`;
    
    // ===== VERIFICAR SE DEVE MOSTRAR BOTÕES DE PAGAMENTO =====
    const metodosPagamentoBotoes = ['dinheiro', 'cartão', 'cartao']; // Aceita variações
    const deveMostrarBotoes = metodosPagamentoBotoes.some(metodo => 
        pedido.payment_method.toLowerCase().includes(metodo)
    );
    
    const areaBotoes = document.getElementById('areaStatusPagamento');
    if (deveMostrarBotoes) {
        areaBotoes.classList.remove('hidden');
        
        // Determinar qual botão está ativo
        const statusAtual = pedido.payment_status || 'pendente';
        
        document.getElementById('botoesStatusPagamento').innerHTML = `
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'cancelado' ? 'bg-red-500 text-white border-2 border-red-700' : 'bg-red-100 text-red-800 hover:bg-red-200'}" onclick="preparaConfirmacaoPagamento('cancelado', 'Pedido Cancelado')">
                ❌ Pedido Cancelado
            </button>
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'pendente' ? 'bg-yellow-500 text-white border-2 border-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}" onclick="preparaConfirmacaoPagamento('pendente', 'Pagamento Pendente')">
                🟡 Pagamento Pendente
            </button>
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'pago' ? 'bg-green-500 text-white border-2 border-green-700' : 'bg-green-100 text-green-800 hover:bg-green-200'}" onclick="preparaConfirmacaoPagamento('pago', 'Pagamento Confirmado')">
                ✅ Pagamento Confirmado
            </button>
        `;
    } else {
        areaBotoes.classList.add('hidden');
    }
    
    // ===== PREENCHER OUTROS CAMPOS =====
    document.getElementById('pedidoStatus').value = pedido.status;
    document.getElementById('pedidoNotes').value = pedido.notes || '';
    
    // ===== EXIBIR MODAL =====
    const modal = document.getElementById('pedidoModal');
    console.log('%c📍 Buscando modal:', 'color: purple;', modal ? '✅ Encontrado' : '❌ NÃO ENCONTRADO');
    
    if (modal) {
        // ESTRATÉGIA NUCLEAR: Criar overlay dinâmico via JavaScript
        console.log('%c💣 Usando estratégia de overlay dinâmico!', 'color: red; font-weight: bold;');
        
        // Criar overlay
        let overlay = document.getElementById('modal-overlay-dynamic');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modal-overlay-dynamic';
            document.body.appendChild(overlay);
        }
        
        // Transferir conteúdo do modal estático para o overlay dinâmico
        overlay.innerHTML = modal.innerHTML;
        
        // Aplicar estilos ao overlay
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            padding: 1rem !important;
            overflow: auto !important;
        `;
        
        console.log('%c✅ OVERLAY DINÂMICO CRIADO!', 'color: green; font-weight: bold;');
        console.log('%c📊 getBoundingClientRect:', 'color: purple;', overlay.getBoundingClientRect());
    } else {
        console.error('%c❌ ERRO CRÍTICO: Modal não encontrado no DOM!', 'color: red; font-weight: bold;');
    }
};

function closePedidoModal() {
    const overlay = document.getElementById('modal-overlay-dynamic');
    if (overlay) {
        overlay.remove();
    }
    currentPedidoId = null;
}

window.closePedidoModal = closePedidoModal;

window.salvarPedidoChanges = async function() {
    if (!currentPedidoId) return;

    const pedido = allPedidos.find(p => p.id === currentPedidoId);
    if (!pedido) return;

    const status = document.getElementById('pedidoStatus').value;
    const notes = document.getElementById('pedidoNotes').value;

    // Atualizar no backend
    try {
        const response = await fetch(`${API_URL}/pedidos/${currentPedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status, notes: notes })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar no backend');
        }

        console.log('✅ Pedido atualizado no backend');

        // Atualizar em localStorage
        let orders = JSON.parse(localStorage.getItem('hortifruti_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === currentPedidoId);
        if (orderIndex >= 0) {
            orders[orderIndex].status = status;
            orders[orderIndex].notes = notes;
            localStorage.setItem('hortifruti_orders', JSON.stringify(orders));
            console.log('✅ Pedido atualizado no localStorage');
        }

        // Mostrar sucesso IMEDIATAMENTE
        showSuccessModal('✅ Alterações Salvas!', 'As mudanças do pedido foram salvas com sucesso!');
        
        // Recarregar em background e manter modal aberto para o admin confirmar
        await loadPedidos();
        
        // Fechar apenas após confirmação visual do sucesso
        // O admin fechará manualmente se desejar
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        showSuccessModal('⚠️ Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    }
};

// Variáveis globais para confirmação
let statusPagamentoEmAlterar = null;
let textoStatusPagamento = '';

// Preparar confirmação para mudar status de pagamento
window.preparaConfirmacaoPagamento = function(novoStatus, descricao) {
    console.log('%c🔔 Preparando confirmação para status:', 'color: blue; font-weight: bold;', novoStatus);
    
    statusPagamentoEmAlterar = novoStatus;
    textoStatusPagamento = descricao;
    
    const statusMap = {
        'cancelado': '❌ Pedido Cancelado',
        'pendente': '🟡 Pagamento Pendente',
        'pago': '✅ Pagamento Confirmado'
    };
    
    // Criar ou atualizar modal de confirmação
    let confirmModal = document.getElementById('confirmacaoPagamentoModalIndependente');
    
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmacaoPagamentoModalIndependente';
        document.body.appendChild(confirmModal);
    }
    
    confirmModal.innerHTML = `
        <div style="
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            padding: 1rem !important;
        ">
            <div style="
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3) !important;
                max-width: 400px !important;
                width: 100% !important;
                padding: 2rem !important;
                text-align: center !important;
            ">
                <h3 style="font-size: 1.25rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">⚠️ Confirmar Mudança</h3>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Tem certeza que deseja alterar o status para:</p>
                <p style="font-weight: bold; font-size: 1.125rem; color: #374151; margin-bottom: 2rem;">${statusMap[novoStatus] || descricao}</p>
                <div style="display: flex; gap: 1rem; flex-direction: column;">
                    <button onclick="confirmarMudancaStatusPagamento()" style="
                        background: #10b981 !important;
                        color: white !important;
                        padding: 0.75rem 1.5rem !important;
                        border: none !important;
                        border-radius: 8px !important;
                        font-weight: bold !important;
                        font-size: 1rem !important;
                        cursor: pointer !important;
                        transition: background 0.2s !important;
                    " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                        ✅ Confirmar
                    </button>
                    <button onclick="cancelarConfirmacao()" style="
                        background: #ef4444 !important;
                        color: white !important;
                        padding: 0.75rem 1.5rem !important;
                        border: none !important;
                        border-radius: 8px !important;
                        font-weight: bold !important;
                        font-size: 1rem !important;
                        cursor: pointer !important;
                        transition: background 0.2s !important;
                    " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    console.log('%c✅ Modal de confirmação criado:', 'color: green; font-weight: bold;');
};

// Confirmar e executar mudança de status
window.confirmarMudancaStatusPagamento = function() {
    if (!statusPagamentoEmAlterar || !currentPedidoId) {
        console.error('%c❌ Erro: Status ou ID do pedido ausente', 'color: red;');
        alert('❌ Erro ao processar a confirmação');
        return;
    }
    
    console.log('%c💰 Confirmando mudança de status:', 'color: blue; font-weight: bold;', statusPagamentoEmAlterar);
    
    // Fechar modal de confirmação imediatamente
    cancelarConfirmacao();
    
    // Atualizar no backend
    fetch(`${API_URL}/pedidos/${currentPedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: statusPagamentoEmAlterar })
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro ao atualizar no backend');
        console.log('%c✅ Status atualizado no backend', 'color: green; font-weight: bold;');
        
        // Atualizar em localStorage também
        let orders = JSON.parse(localStorage.getItem('hortifruti_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == currentPedidoId || o.id === currentPedidoId || String(o.id) === String(currentPedidoId));
        if (orderIndex >= 0) {
            orders[orderIndex].payment_status = statusPagamentoEmAlterar;
            localStorage.setItem('hortifruti_orders', JSON.stringify(orders));
            console.log('%c✅ LocalStorage atualizado', 'color: green;');
        }
        
        const statusMap = {
            'cancelado': 'Pedido Cancelado',
            'pendente': 'Pagamento Pendente',
            'pago': 'Pagamento Confirmado'
        };
        
        // Mostrar sucesso
        showSuccessModal('✅ Status Atualizado!', `${statusMap[statusPagamentoEmAlterar] || 'Status'} registrado com sucesso!`);
        
        // Recarregar dados
        loadPedidos();
    })
    .catch(error => {
        console.error('%c❌ Erro ao alterar status:', 'color: red; font-weight: bold;', error);
        showSuccessModal('⚠️ Erro', 'Não foi possível salvar no banco de dados. Tente novamente.');
    });
};

// Cancelar confirmação
window.cancelarConfirmacao = function() {
    console.log('%c❌ Cancelando confirmação', 'color: orange;');
    statusPagamentoEmAlterar = null;
    textoStatusPagamento = '';
    
    const confirmModal = document.getElementById('confirmacaoPagamentoModalIndependente');
    if (confirmModal) {
        confirmModal.remove();
    }
};

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
    console.log('%c📑 CLICOU NA ABA:', 'color: blue; font-weight: bold;', tab);
    
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-purple-600', 'text-purple-600');
        btn.classList.add('border-gray-200', 'text-gray-600');
    });

    // Mostrar aba selecionada
    const contentEl = document.getElementById(`content-${tab}`);
    const btnEl = document.getElementById(`tab-${tab}`);
    
    if (!contentEl) {
        console.error(`%c❌ Elemento content-${tab} não encontrado!`, 'color: red; font-weight: bold;');
        return;
    }
    
    contentEl.classList.remove('hidden');
    console.log(`%c✅ Aba content-${tab} ficou visível`, 'color: green; font-weight: bold;');
    
    if (btnEl) {
        btnEl.classList.remove('border-gray-200', 'text-gray-600');
        btnEl.classList.add('border-purple-600', 'text-purple-600');
    }

    // Carregar pedidos se necessário
    if (tab === 'pedidos') {
        console.log('%c📋 Carregando pedidos...', 'color: purple; font-weight: bold;');
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

// Verificar se o modal existe
const modalTest = document.getElementById('pedidoModal');
console.log('%c📍 Verificando elementos do DOM:', 'color: purple;');
console.log('   - #pedidoModal:', modalTest ? '✅ Encontrado' : '❌ NÃO ENCONTRADO');
console.log('   - #notaNumero:', document.getElementById('notaNumero') ? '✅' : '❌');
console.log('   - #notaData:', document.getElementById('notaData') ? '✅' : '❌');
console.log('   - #notaCliente:', document.getElementById('notaCliente') ? '✅' : '❌');
console.log('   - #areaStatusPagamento:', document.getElementById('areaStatusPagamento') ? '✅' : '❌');

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
