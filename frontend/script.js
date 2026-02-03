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

    // Se existir o overlay dinâmico do pedido, impedir que ele capture cliques
    try{
        const overlay = document.getElementById('modal-overlay-dynamic');
        if (overlay) {
            overlay.style.pointerEvents = 'none';
        }
    }catch(e){/* ignorar */}
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // Se o modal de sucesso foi aberto a partir do fluxo de salvar anotações,
    // fechar também o modal da nota e recarregar a lista.
    try{
        if (window.__afterSuccessClosePedido) {
            window.__afterSuccessClosePedido = false;
            closePedidoModal();
            // Recarregar pedidos em background
            setTimeout(()=>{ try{ loadPedidos(); }catch(e){} }, 50);
        }
    }catch(e){console.warn('Erro em afterSuccessClosePedido', e);}    
    // Restaurar interação do overlay dinâmico, se existente
    try{
        const overlay = document.getElementById('modal-overlay-dynamic');
        if (overlay) {
            overlay.style.pointerEvents = '';
        }
    }catch(e){/* ignorar */}
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

// Desativar temporariamente qualquer limpeza/remoção automática de pontos vermelhos
// Para reativar no console: `window.__disableRedDotCleanup = false`
window.__disableRedDotCleanup = true;

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
        // Ordenar produtos alfabeticamente por nome para exibição no admin
        try{ products.sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' })); }catch(e){ console.warn('Erro ao ordenar produtos no admin', e); }
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
        'productImage',
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
    // Preencher seleção de categorias (suporta string, array ou JSON string)
    try{
        // Preencher checkboxes de categoria (novo layout)
        const container = document.getElementById('productCategory');
        if(container){
            // desmarcar todos
            Array.from(container.querySelectorAll('.product-category-checkbox')).forEach(cb => cb.checked = false);

            let cats = product.category || null;
            if(typeof cats === 'string'){
                try{ const parsed = JSON.parse(cats); if(Array.isArray(parsed)) cats = parsed; }
                catch(e){ /* manter string */ }
            }

            if(Array.isArray(cats)){
                cats.forEach(c => {
                    const cb = container.querySelector(`.product-category-checkbox[value="${c}"]`);
                    if(cb) cb.checked = true;
                });
            } else if(typeof cats === 'string' && cats){
                const cb = container.querySelector(`.product-category-checkbox[value="${cats}"]`);
                if(cb) cb.checked = true;
            }
        }
    }catch(e){ console.warn('Erro ao preencher categorias no modal', e); }
    
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
    const urlInput = document.getElementById('productImage');
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                document.getElementById('productImageData').value = '';
                document.getElementById('imagePreview').classList.remove('hidden');
                document.getElementById('previewImg').src = url;
            } else {
                document.getElementById('imagePreview').classList.add('hidden');
                document.getElementById('previewImg').src = '';
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
    
    const imageUrl = document.getElementById('productImage').value;
    const finalImage = imageUrl;
    
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
    
    // Capturar múltiplas categorias (novo formato: array) - checkboxes
    const selectedCategories = Array.from(document.querySelectorAll('.product-category-checkbox:checked') || [])
        .map(cb => cb.value).filter(v => v);

    const productData = {
        id: editingProductId || 'prod_' + Date.now(),
        name: productName,
        description: document.getElementById('productDescription').value,
        category: selectedCategories.length > 0 ? selectedCategories : null,
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
            // Tentar preservar campos de troco se o backend os enviar
            cash_received: (typeof order.cash_received !== 'undefined' && order.cash_received !== null) ? Number(order.cash_received) : null,
            cash_change: (typeof order.cash_change !== 'undefined' && order.cash_change !== null) ? Number(order.cash_change) : null,
            // Se backend não enviar, tentar extrair de notes (compatibilidade)
            __raw_notes_parse: (function(){
                try{
                    if ((typeof order.cash_received === 'undefined' || order.cash_received === null) && order.notes){
                        const m = String(order.notes).match(/Pago com\s*R?\$?\s*([0-9.,]+)/i);
                        if (m) return { parsed_received: parseFloat(m[1].replace(/\./g,'').replace(/,/g,'.')) };
                    }
                }catch(e){ }
                return null;
            })(),
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

    // statusLabels removed: status badge functionality deprecated and removed per request

    list.innerHTML = pedidos.map(p => {
        // normalizar status para evitar problemas com maiúsculas/minúsculas ou variações
        const normStatus = String(p.payment_status || '').toLowerCase().trim();
        // detectar categoria com base em substring/regex para aceitar variações
        let statusCategory = 'unknown';
        if (/pendente|pending/.test(normStatus)) statusCategory = 'pendente';
        else if (/cancel|cance|cancelled|canceled/.test(normStatus)) statusCategory = 'cancelado';
        else if (/pago|paid/.test(normStatus)) statusCategory = 'pago';

        const statusTextMap = { 'pendente': '🟡 Pagamento Pendente', 'cancelado': '❌ Pedido Cancelado', 'pago': '✅ Pago' };
        const paymentBadge = statusTextMap[statusCategory] || (p.payment_status || '');
        const paymentColor = statusCategory === 'pago' ? 'bg-green-100 text-green-800' : (statusCategory === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800');
        const statusBgClass = statusCategory === 'pago' ? 'bg-green-50' : (statusCategory === 'pendente' ? 'bg-yellow-50' : (statusCategory === 'cancelado' ? 'bg-red-50' : ''));
        
        return `
        <div class="pedido-item border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer ${statusBgClass}" data-pedido-id="${p.id}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">Nota #${p.id}
                        ${statusCategory === 'cancelado' ? '<span class="ml-2 text-sm font-bold text-red-600">❌ Pedido Cancelado</span>' : (statusCategory === 'pendente' ? '<span class="ml-2 text-sm font-bold text-yellow-600">🟡 Pagamento Pendente</span>' : (statusCategory === 'pago' ? '<span class="ml-2 text-sm font-bold text-green-600">✅ Pago</span>' : ''))}
                    </h3>
                    <p class="text-sm text-gray-700 font-semibold">${p.customer_name}</p>
                    <p class="text-sm text-gray-500">📱 ${p.customer_phone}</p>
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
    
    // Garantir badge de status correto mesmo se outro código remover/alterar o conteúdo
    try {
        const statusTextMap = { 'pendente': '🟡 Pagamento Pendente', 'cancelado': '❌ Pedido Cancelado', 'pago': '✅ Pago' };
        document.querySelectorAll('.pedido-item').forEach(item => {
            const id = item.getAttribute('data-pedido-id');
            const pedido = (pedidos || []).find(p => String(p.id) === String(id)) || {};
            const norm = String(pedido.payment_status || '').toLowerCase().trim();
            let cat = 'unknown';
            if (/pendente|pending/.test(norm)) cat = 'pendente';
            else if (/cancel|cance|cancelled|canceled/.test(norm)) cat = 'cancelado';
            else if (/pago|paid/.test(norm)) cat = 'pago';

            const labelHtml = cat === 'cancelado' ? '<span class="ml-2 text-sm font-bold text-red-600">❌ Pedido Cancelado</span>' : (cat === 'pendente' ? '<span class="ml-2 text-sm font-bold text-yellow-600">🟡 Pagamento Pendente</span>' : (cat === 'pago' ? '<span class="ml-2 text-sm font-bold text-green-600">✅ Pago</span>' : ''));
            const h3 = item.querySelector('h3');
            if (h3) {
                // Substituir apenas o título para garantir um único rótulo visível
                h3.innerHTML = `Nota #${pedido.id} ${labelHtml}`;
            }
        });
    } catch (e) { console.warn('Erro ao aplicar badge fallback', e); }
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

    // ===== Atualizar visual do modal conforme status de pagamento (pendente / cancelado / pago) =====
    (function applyStatusVisual(pedido){
        try{
            const overlay = document.getElementById('modal-overlay-dynamic') || document.getElementById('pedidoModal');
            if (!overlay) return;

            // selecione o painel principal do modal (container branco)
            const panel = overlay.querySelector('.bg-white.rounded-2xl') || overlay.querySelector('.rounded-2xl') || overlay;

            // normalizar status
            const st = (pedido.payment_status || '').toString().toLowerCase().trim();

            // limpar classes de fundo anteriores (classes utilitárias do Tailwind)
            if (panel && panel.classList) {
                panel.classList.remove('bg-green-50','bg-yellow-50','bg-red-50');
            }

            // aplicar fundo conforme status
            if (st === 'pendente') {
                panel.classList.add('bg-yellow-50');
            } else if (st === 'cancelado') {
                panel.classList.add('bg-red-50');
            } else if (st === 'pago') {
                panel.classList.add('bg-green-50');
            }

            // Nota: rótulo/badge dentro do modal foi removido intencionalmente.
            // O status será exibido no card da nota (lista de pedidos). Mantemos apenas o fundo do painel.
        }catch(e){ console.warn('Erro ao aplicar visual de status no modal', e); }
    })(pedido);
    
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
    // Mostrar informações de troco quando disponíveis (campos: cash_received, cash_change)
    try {
        const notaCashEl = document.getElementById('notaCashInfo');
        if (notaCashEl) {
            // Primeiro, tentar pelos campos explícitos
            let cr = pedido.cash_received !== undefined && pedido.cash_received !== null ? Number(pedido.cash_received) : null;
            let cc = pedido.cash_change !== undefined && pedido.cash_change !== null ? Number(pedido.cash_change) : null;

            // Se não existir, tentar extrair dos notes (formatos aceitos:
            // 1) "Pagamento em Dinheiro: Não precisará de troco"
            // 2) "Pagamento em Dinheiro: Valor do troco: R$ X,XX"
            // 3) antigo: "Pagamento em Dinheiro: Pago com R$ X • Troco: R$ Y"
            if ((cr === null || cc === null) && pedido.notes) {
                try {
                    const note = String(pedido.notes);
                    // Caso 1
                    if (/não\s+precisará\s+de\s+troco/i.test(note)) {
                        // marcar recebido igual ao total e troco zero quando possível
                        cr = cr === null ? Number(pedido.total || 0) : cr;
                        cc = 0;
                    }

                    // Caso 2: Valor do troco: R$ X
                    const mValTroco = note.match(/Valor do troco:\s*R?\$?\s*([0-9.,]+)/i);
                    if (mValTroco) {
                        cc = parseFloat(mValTroco[1].replace(/\./g,'').replace(/,/g,'.'));
                        cr = cr === null ? Number(pedido.total || 0) + cc : cr;
                    }

                    // Caso 3: formato antigo
                    const m = note.match(/Pago com\s*R?\$?\s*([0-9.,]+)/i);
                    const n = note.match(/Troco:\s*R?\$?\s*([0-9.,]+)/i);
                    if (m && cr === null) cr = parseFloat(m[1].replace(/\./g,'').replace(/,/g,'.'));
                    if (n && cc === null) cc = parseFloat(n[1].replace(/\./g,'').replace(/,/g,'.'));
                } catch(e) { /* ignorar parsing */ }
            }

            if (cr !== null) {
                const receivedStr = `R$ ${cr.toFixed(2).replace('.', ',')}`;
                const changeStr = cc !== null ? `R$ ${cc.toFixed(2).replace('.', ',')}` : '-';
                if (cc === 0) {
                    notaCashEl.innerHTML = `<div class="bg-white p-3 rounded-lg border-2 border-gray-200"><strong>Pagamento em Dinheiro:</strong> Pago com valor exato (${receivedStr})</div>`;
                } else if (cc > 0) {
                    notaCashEl.innerHTML = `<div class="bg-white p-3 rounded-lg border-2 border-gray-200"><strong>Pagamento em Dinheiro:</strong> Pago com ${receivedStr} • Troco: <span class="font-bold text-green-600">${changeStr}</span></div>`;
                } else {
                    notaCashEl.innerHTML = `<div class="bg-white p-3 rounded-lg border-2 border-gray-200"><strong>Pagamento em Dinheiro:</strong> Pago com ${receivedStr} • <span class="text-red-600">Falta: ${changeStr}</span></div>`;
                }
                notaCashEl.classList.remove('hidden');
            } else {
                notaCashEl.classList.add('hidden');
                notaCashEl.innerHTML = '';
            }
        }
    } catch (e) { console.warn('Erro ao renderizar informação de troco na nota', e); }
    
    // ===== VERIFICAR SE DEVE MOSTRAR BOTÕES DE PAGAMENTO =====
    const metodosPagamentoBotoes = ['dinheiro', 'cartão', 'cartao']; // Aceita variações
    const deveMostrarBotoes = metodosPagamentoBotoes.some(metodo => 
        pedido.payment_method.toLowerCase().includes(metodo)
    );
    
    const areaBotoes = document.getElementById('areaStatusPagamento');
    if (deveMostrarBotoes) {
        areaBotoes.classList.remove('hidden');
        
        // Determinar qual botão está ativo (normalizar valor)
        let statusAtual = (pedido.payment_status || 'pendente').toLowerCase().trim();
        console.log('%c🔍 Status Atual:', 'color: cyan;', 'Raw:', pedido.payment_status, 'Normalizado:', statusAtual);
        
        document.getElementById('botoesStatusPagamento').innerHTML = `
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'cancelado' ? 'bg-red-500 text-white border-2 border-red-700' : 'bg-red-100 text-red-800 hover:bg-red-200'}" onclick="aplicarStatusPagamentoInstantaneo('cancelado', 'Pedido Cancelado')">
                ❌ Pedido Cancelado
            </button>
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'pendente' ? 'bg-yellow-500 text-white border-2 border-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}" onclick="aplicarStatusPagamentoInstantaneo('pendente', 'Pagamento Pendente')">
                🟡 Pagamento Pendente
            </button>
            <button class="w-full p-3 rounded-lg font-bold transition ${statusAtual === 'pago' ? 'bg-green-500 text-white border-2 border-green-700' : 'bg-green-100 text-green-800 hover:bg-green-200'}" onclick="aplicarStatusPagamentoInstantaneo('pago', 'Pagamento Confirmado')">
                ✅ Pagamento Confirmado
            </button>
        `;
    } else {
        areaBotoes.classList.add('hidden');
    }

    // ===== PREENCHER BOTÕES DE STATUS DO PEDIDO (fluxo) =====
    try{
        const areaOrder = document.getElementById('areaOrderStatus');
        const containerOrder = document.getElementById('botoesOrderStatus');
        if (areaOrder && containerOrder) {
            areaOrder.classList.remove('hidden');

            // Status possíveis (texto exibido será armazenado como `status` no pedido)
            const statuses = [
                { key: 'Quitanda Está Recebendo O Seu Pedido', label: 'Quitanda Está Recebendo O Seu Pedido' },
                { key: 'Em preparação', label: 'Em preparação' },
                { key: 'pedido a caminho', label: 'Pedido a caminho' }
            ];

            const currentStatus = (pedido.status || '').toString().trim();

            containerOrder.innerHTML = statuses.map(s => {
                const active = s.key === currentStatus;
                const cls = active ? 'bg-green-600 text-white border-2 border-green-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                return `<button class="w-full p-3 rounded-lg font-bold transition ${cls}" onclick="aplicarStatusPedidoInstantaneo('${s.key.replace(/'/g, "\\'")}', '${s.label.replace(/'/g, "\\'")}')">${s.label}</button>`;
            }).join('');
        }
    }catch(e){ console.warn('Erro ao renderizar botoes de status do pedido', e); }
    
    // ===== PREENCHER OUTROS CAMPOS =====
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
        
        // Fazer varredura e remover pontos vermelhos do modal ORIGINAL antes de copiar (para cobrir casos onde scripts adicionam no modal estático)
        (function scanAndRemoveInOriginal(container){
            // pular limpeza agressiva se flag global estiver ativa
            if (window.__disableRedDotCleanup) { console.log('[redDotCleanup] scanAndRemoveInOriginal skipped'); return; }
            try{
                const smallEls = Array.from(container.querySelectorAll('*')).filter(el => {
                    try{
                        const cs = getComputedStyle(el);
                        const bg = (cs.backgroundColor||'').toLowerCase();
                        const w = parseFloat(cs.width) || el.offsetWidth || 0;
                        const h = parseFloat(cs.height) || el.offsetHeight || 0;
                        const br = cs.borderRadius || '';
                        const isSmall = (Math.max(w,h)>0) && Math.max(w,h) <= 28;
                        const isRound = br.includes('%') || (/px/.test(br) && parseFloat(br) >= Math.min(w,h)/2 - 1);
                        const isRed = bg && (bg.includes('red') || bg.includes('ef4444') || bg.includes('239, 68, 68') );
                        return isSmall && isRound && isRed;
                    }catch(e){ return false; }
                });
                if (smallEls.length){
                    console.warn('[scanAndRemoveInOriginal] Removing red candidates from original modal:', smallEls.map(e=>({path: e.tagName, id: e.id, class: e.className}))); 
                    smallEls.forEach(e => e.remove());
                }
                // também tentar remover pseudo-elements forçando um style override
                container.querySelectorAll('*').forEach(el=>{
                    try{
                        const csb = getComputedStyle(el,'::before');
                        const csa = getComputedStyle(el,'::after');
                        if (csb && csb.content && csb.content !== 'none' && (csb.backgroundColor||'').toLowerCase().includes('red')){ console.warn('Removing red pseudo ::before from', el); el.style.setProperty('--_tmp_dummy','none'); }
                        if (csa && csa.content && csa.content !== 'none' && (csa.backgroundColor||'').toLowerCase().includes('red')){ console.warn('Removing red pseudo ::after from', el); el.style.setProperty('--_tmp_dummy2','none'); }
                    }catch(e){}
                });
            }catch(e){ console.error('Error scanning original modal', e); }
        })(modal);

        // Transferir conteúdo do modal estático para o overlay dinâmico
        overlay.innerHTML = modal.innerHTML;

        // Ação imediata e agressiva: remover qualquer elemento pequeno posicionado no canto superior-direito do modal (fix visual rápido)
        try {
            const overlayRect = overlay.getBoundingClientRect();
            Array.from(overlay.querySelectorAll('*')).forEach(el => {
                try {
                    const cs = getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const maxDim = Math.max(rect.width, rect.height);
                    const nearTop = (rect.top - overlayRect.top) < 48;
                    const nearRight = (overlayRect.right - rect.right) < 48;
                    const isSmall = maxDim > 0 && maxDim <= 48;
                    const isRedish = ((cs.backgroundColor||'').toLowerCase().includes('ef4444') || (cs.backgroundColor||'').toLowerCase().includes('239, 68, 68') || (cs.backgroundColor||'').toLowerCase().includes('255, 0, 0') || (cs.backgroundImage||'').toLowerCase().includes('radial-gradient') && (cs.backgroundImage||'').toLowerCase().includes('red') || (cs.boxShadow||'').toLowerCase().match(/239|ef4444|255/));

                    if (isSmall && nearTop && nearRight && isRedish) {
                        // remover imediatamente
                        el.remove();
                        console.warn('[quickFix] Removed immediate top-right small red element', { tag: el.tagName, classes: el.className, rect });
                    }

                    // fallback: se estiver exatamente localizado no canto superior-direito e pequeno, remover independente da cor
                    if (isSmall && nearTop && nearRight) {
                        el.remove();
                        // nota: este é um fallback agressivo para garantir remoção visual imediata
                        console.warn('[quickFix] Removed top-right small element (fallback)', { tag: el.tagName, classes: el.className, rect });
                    }
                } catch (e) { }
            });
        } catch (e) { console.warn('quickFix failed', e); }

        // Varredura global: remover qualquer elemento pequeno, arredondado e vermelho em todo o documento (solução imediata)
        (function globalRemoveRedDots(){
            if (window.__disableRedDotCleanup) { console.log('[redDotCleanup] globalRemoveRedDots skipped'); return; }
            function isSmallRoundRed(el){
                try{
                    if (!el || el.nodeType !== 1) return false;
                    if (el.tagName.toLowerCase() === 'svg') return false; // aguardar remoção de circles separadamente
                    const cs = getComputedStyle(el);
                    const bg = (cs.backgroundColor||'').toLowerCase();
                    const bgImg = (cs.backgroundImage||'').toLowerCase();
                    const box = (cs.boxShadow||'').toLowerCase();
                    const br = cs.borderRadius || '';
                    const w = el.offsetWidth || parseFloat(cs.width) || 0;
                    const h = el.offsetHeight || parseFloat(cs.height) || 0;
                    const maxd = Math.max(w,h);
                    if (maxd <= 0 || maxd > 56) return false; // pequeno
                    const isRound = br.includes('%') || (/px/.test(br) && parseFloat(br) >= Math.min(w,h)/2 - 2);
                    if (!isRound) return false;
                    const redTest = s => s && (/red|ef4444|239, 68, 68|#ff0000|255, 0, 0/.test(s));
                    const isRed = redTest(bg) || redTest(bgImg) || redTest(box) || (el.getAttribute && redTest(el.getAttribute('fill')));
                    if (!isRed) return false;
                    // excluir elementos com texto legível (cuidado para não remover badges com texto)
                    if ((el.textContent || '').trim().length > 1) return false;
                    // excluir inputs/buttons maiores
                    if (el.tagName.match(/INPUT|BUTTON|A/)) return false;
                    return true;
                }catch(e){return false}
            }

            function removeMatches(root){
                try{
                    const removed = [];
                    // svg circles
                    Array.from(document.querySelectorAll('svg circle')).forEach(c => {
                        try{
                            const fill = (c.getAttribute('fill')||'').toLowerCase();
                            if (/red|ef4444|#ff0000/.test(fill)) { removed.push(c); c.remove(); }
                        }catch(e){}
                    });

                    Array.from(root.querySelectorAll('*')).forEach(el => {
                        if (isSmallRoundRed(el)) { removed.push(el); el.remove(); }
                    });

                    if (removed.length) console.warn('[globalRemoveRedDots] Removed global red dot candidates', removed.map(e=>({tag:e.tagName, id:e.id, class:e.className})));
                }catch(e){console.warn('[globalRemoveRedDots] error',e)}
            }

            // rodar imediatamente e novamente depois para capturar inserções
            removeMatches(document);
            setTimeout(()=>removeMatches(document), 100);
            setTimeout(()=>removeMatches(document), 400);

            // Observer no document.body para remoções dinâmicas
            try{
                const obs = new MutationObserver((muts)=>{
                    muts.forEach(m=>{ Array.from(m.addedNodes||[]).forEach(node=>{ if (node && node.nodeType===1){ if (isSmallRoundRed(node)) { console.warn('[globalRemoveRedDots] Removed dynamic', node); node.remove(); } Array.from(node.querySelectorAll('*')).forEach(el=>{ if (isSmallRoundRed(el)) { console.warn('[globalRemoveRedDots] Removed dynamic descendant', el); el.remove(); } }); } }); });
                });
                obs.observe(document.body, { childList: true, subtree: true });
                window.__globalRedDotsObserver = obs;
            }catch(e){console.warn('[globalRemoveRedDots] observer failed', e)}
        })();
        
        // Diagnóstico robusto: identificar e registrar no console os elementos que criam a bolinha vermelha (para depuração)
        (function diagnoseAndRemoveRedDots(container){
            if (window.__disableRedDotCleanup) { console.log('[redDotCleanup] diagnoseAndRemoveRedDots skipped'); return; }
            function getDomPath(el){
                if (!el) return '';
                const parts = [];
                while (el && el.nodeType === 1 && el.tagName.toLowerCase() !== 'html'){
                    let part = el.tagName.toLowerCase();
                    if (el.id) part += `#${el.id}`;
                    if (el.classList && el.classList.length) part += `.${Array.from(el.classList).slice(0,3).join('.')}`;
                    parts.unshift(part);
                    el = el.parentNode;
                }
                return parts.join(' > ');
            }

            function infoFor(el){
                try{
                    const cs = window.getComputedStyle(el);
                    return {
                        nodeName: el.nodeName,
                        id: el.id || null,
                        classList: el.className || null,
                        path: getDomPath(el),
                        outerHTML: (el.outerHTML||'').slice(0,240),
                        computed: {
                            backgroundColor: cs.backgroundColor,
                            backgroundImage: cs.backgroundImage,
                            boxShadow: cs.boxShadow,
                            border: cs.border,
                            width: cs.width,
                            height: cs.height,
                            borderRadius: cs.borderRadius,
                            position: cs.position
                        }
                    };
                }catch(e){ return { nodeName: el.nodeName, error: String(e) } }
            }

            function isSmallCircularRed(el){
                try{
                    const cs = getComputedStyle(el);
                    const bg = (cs.backgroundColor || '').toLowerCase();
                    const bgImg = (cs.backgroundImage || '').toLowerCase();
                    const box = (cs.boxShadow || '').toLowerCase();
                    const border = (cs.border || '').toLowerCase();
                    const w = parseFloat(cs.width) || el.offsetWidth || 0;
                    const h = parseFloat(cs.height) || el.offsetHeight || 0;
                    const br = cs.borderRadius || '';

                    const isSmall = (Math.max(w,h) > 0) && Math.max(w,h) <= 30; // pequeno
                    const isRound = br.includes('%') || (/px/.test(br) && parseFloat(br) >= Math.min(w,h)/2 - 1);
                    const redPatterns = [/ef4444/, /239, 68, 68/, /255, 0, 0/, /#ff0000/, /rgb\(239, 68, 68\)/, /\bred\b/];
                    const matchesPattern = s => redPatterns.some(rx => rx.test(s || ''));

                    const isRedBg = bg && matchesPattern(bg);
                    const isRedBgImg = bgImg && matchesPattern(bgImg) || (bgImg && bgImg.includes('radial-gradient') && bgImg.includes('red'));
                    const isRedBox = box && matchesPattern(box);
                    const isRedBorder = border && matchesPattern(border);

                    return isSmall && isRound && (isRedBg || isRedBgImg || isRedBox || isRedBorder);
                }catch(e){return false}
            }

            function checkPseudo(el, pseudo){
                try{
                    const cs = getComputedStyle(el, pseudo);
                    if (!cs) return null;
                    // Não exigir content: pseudo-elements podem usar content: '' e ainda desenhar com background/box-shadow
                    const bg = (cs.backgroundColor||'').toLowerCase();
                    const bgImg = (cs.backgroundImage||'').toLowerCase();
                    const box = (cs.boxShadow||'').toLowerCase();
                    const w = parseFloat(cs.width)||0; const h = parseFloat(cs.height)||0; const br = cs.borderRadius||'';
                    const isSmall = (Math.max(w,h)>0) && Math.max(w,h) <= 36;
                    const isRound = br.includes('%') || (/px/.test(br) && parseFloat(br) >= Math.min(w,h)/2 - 1);
                    const redTest = s => s && (/red|ef4444|239, 68, 68|#ff0000|255, 0, 0/.test(s));
                    const isRed = redTest(bg) || redTest(bgImg) || redTest(box);

                    if (isSmall && isRound && isRed) {
                        // Marcar o elemento para esconder seu pseudo-elemento via CSS (atributo único)
                        try{
                            el.setAttribute('data-hide-pseudo', '1');
                            if (!document.getElementById('hide-pseudo-styles')){
                                const s = document.createElement('style');
                                s.id = 'hide-pseudo-styles';
                                s.textContent = '[data-hide-pseudo="1"]::before, [data-hide-pseudo="1"]::after { display: none !important; content: none !important; background: transparent !important; background-image: none !important; box-shadow: none !important; }';
                                document.head.appendChild(s);
                            }
                        }catch(e){}
                        return { el, pseudo, cs: { background: bg, backgroundImage: bgImg, boxShadow: box, width: cs.width, height: cs.height, borderRadius: cs.borderRadius } };
                    }
                    return null;
                }catch(e){return null}
            }

            const found = [];

            // procurar por SVG circles com fill vermelho
            Array.from(container.querySelectorAll('svg circle')).forEach(c => {
                try{
                    const fill = c.getAttribute('fill') || getComputedStyle(c).fill || '';
                    if (fill && /red|ef4444|#ff0000/.test(fill.toLowerCase())){
                        found.push({type: 'svg-circle', info: infoFor(c), el: c});
                        c.remove();
                    }
                }catch(e){}
            });

            // procurar por elementos pequenos, arredondados e vermelhos, incluindo background-image/box-shadow/border
            Array.from(container.querySelectorAll('*')).forEach(el => {
                if (el.id === 'notaNumero' || el.id === 'notaData') return; // pular textos da nota
                // priorizar classes conhecidas
                if (el.classList && (el.classList.contains('status-dot') || el.id === 'cartBadge')){
                    found.push({type:'known', info: infoFor(el), el}); el.remove(); return;
                }

                // checar pseudo-elements
                const before = checkPseudo(el, '::before');
                const after = checkPseudo(el, '::after');
                if (before) { found.push({type:'pseudo-before', info: infoFor(el), detail: before}); }
                if (after) { found.push({type:'pseudo-after', info: infoFor(el), detail: after}); }

                if (isSmallCircularRed(el)) { found.push({type:'heuristic', info: infoFor(el), el}); el.style.display = 'none'; }

                // adicional: detectar e remover elementos com background-image radial-gradient contendo 'red'
                try{
                    const cs = getComputedStyle(el);
                    const bgImg = (cs.backgroundImage||'').toLowerCase();
                    if (bgImg && bgImg.includes('radial-gradient') && bgImg.includes('red')){ found.push({type:'bg-image', info: infoFor(el)}); el.style.display='none'; }
                    const box = (cs.boxShadow||'').toLowerCase();
                    if (box && /rgba?\([0-9,\s]+\)/.test(box) && /,\s*0\s*,\s*0/.test(box) === false && /239\s*,\s*68\s*,\s*68|255\s*,\s*0\s*,\s*0|ef4444/.test(box)){ found.push({type:'box-shadow', info: infoFor(el)}); el.style.display='none'; }
                }catch(e){}
            });

            if (found.length){
                console.warn('%c[diagnoseAndRemoveRedDots] Found and removed red dot candidates:', 'color: orange; font-weight: bold;', found.map(f=>f.info));
            } else {
                console.log('%c[diagnoseAndRemoveRedDots] No red dot candidates found on initial scan', 'color: green;');
            }

            // observer para mudanças dinâmicas, também registra matches
            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    Array.from(m.addedNodes||[]).forEach(node => {
                        if (node.nodeType !== 1) return;
                        try{
                            if (isSmallCircularRed(node)) { console.warn('[diagnose] Removed dynamic red dot', infoFor(node)); node.remove(); }
                            Array.from(node.querySelectorAll('*')).forEach(el => { if (isSmallCircularRed(el)) { console.warn('[diagnose] Removed dynamic red dot (descendant)', infoFor(el)); el.remove(); } });
                            // checar background-image e box-shadow dinâmicos
                            const cs = getComputedStyle(node);
                            if ((cs.backgroundImage||'').toLowerCase().includes('radial-gradient') && (cs.backgroundImage||'').toLowerCase().includes('red')){ console.warn('[diagnose] Removed dynamic bg-image red', infoFor(node)); node.remove(); }
                            if ((cs.boxShadow||'').toLowerCase().match(/239|ef4444|255/)){ console.warn('[diagnose] Removed dynamic box-shadow red', infoFor(node)); node.remove(); }
                        }catch(e){}
                    });
                });
            });
            observer.observe(container, { childList: true, subtree: true });
            container.__diagnoseRedDotsObserver = observer;
            window.__lastRedDotDiagnostics = found;
        })(overlay);
        
        // Aplicar estilos ao overlay
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            z-index: 9000 !important;
        `;

        // Varredura por posição: inspecionar elemento no canto superior-direito do overlay (client coordinates)
        if (window.__disableRedDotCleanup) {
            console.log('[redDotCleanup] posScan skipped');
        } else {
            try {
                const rect = overlay.getBoundingClientRect();
                // pontos de amostragem próximos ao canto superior-direito, ajustar offsets se necessário
                const samplePoints = [
                    {x: Math.round(rect.right - 12), y: Math.round(rect.top + 18)},
                    {x: Math.round(rect.right - 24), y: Math.round(rect.top + 24)},
                    {x: Math.round(rect.right - 6), y: Math.round(rect.top + 6)}
                ];

                const seen = new Set();
                for (const pt of samplePoints) {
                    const el = document.elementFromPoint(pt.x, pt.y) || document.elementFromPoint(pt.x - 1, pt.y - 1);
                    if (!el) continue;
                    const target = (el.nodeType === 3) ? el.parentElement : el;
                    if (!target || seen.has(target)) continue;
                    seen.add(target);

                    // Se elemento for o overlay em si, verificar descendente mais próximo
                    let candidate = target;
                    // Subida até um elemento visível que não seja overlay
                    while (candidate && candidate !== document.body && candidate !== overlay && candidate.parentElement && candidate.getBoundingClientRect) {
                        const cr = candidate.getBoundingClientRect();
                        if ((cr.width && cr.height) && (cr.width <= 60 && cr.height <= 60) && (cr.top >= rect.top - 4 && cr.left >= rect.left)) break;
                        if (candidate === overlay) break;
                        candidate = candidate.parentElement;
                    }

                    const info = {
                        tag: candidate.tagName,
                        id: candidate.id,
                        classes: candidate.className,
                        outerHTML: (candidate.outerHTML||'').slice(0,240),
                        rect: candidate.getBoundingClientRect().toJSON()
                    };
                    // tornar disponível para leitura programática
                    window.__lastPosScan = info;
                    console.warn('[posScan] elementFromPoint at modal corner ->', info);

                    // Ação corretiva explícita: esconder pseudo-elem e remover elemento pequeno/visível
                    try {
                        // se tiver pseudo, marcar para esconder
                        candidate.setAttribute('data-hide-pseudo', '1');
                        if (!document.getElementById('hide-pseudo-styles')){
                            const s = document.createElement('style'); s.id = 'hide-pseudo-styles';
                            s.textContent = '[data-hide-pseudo="1"]::before, [data-hide-pseudo="1"]::after { display: none !important; content: none !important; background: transparent !important; background-image: none !important; box-shadow: none !important; }';
                            document.head.appendChild(s);
                        }
                        // esconder o próprio elemento caso seja pequeno e esteja exatamente no canto
                        const cr = candidate.getBoundingClientRect();
                        if (Math.max(cr.width, cr.height) <= 64) {
                            candidate.style.display = 'none';
                            console.warn('[posScan] hid candidate directly', info);
                        }
                    } catch (e) { console.warn('posScan action failed', e); }
                }
            } catch(e){ console.warn('posScan top-right scan failed', e); }
        }
        
        
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
    if (!currentPedidoId) {
        console.error('Nenhum pedido aberto');
        return;
    }

    const notes = document.getElementById('pedidoNotes').value;

    console.log('%c💾 Salvando anotações do pedido...', 'color: blue; font-weight: bold;');

    try {
        const response = await fetch(`${API_URL}/pedidos/${currentPedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: notes })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar no servidor');
        }

        console.log('%c✅ Salvo no servidor', 'color: green; font-weight: bold;');

        // Atualizar em memória
        const pedido = allPedidos.find(p => p.id === currentPedidoId);
        if (pedido) {
            pedido.notes = notes;
        }

        // Mostrar sucesso
        showSuccessModal('✅ Salvo!', 'As anotações foram salvas com sucesso');
        // Não fechar o modal da nota automaticamente: deixar o usuário confirmar
        // Quando o usuário clicar em OK no successModal, o closeSuccessModal
        // verificará a flag e fechará o modal da nota e recarregará os pedidos.
        window.__afterSuccessClosePedido = true;

    } catch (error) {
        console.error('%c❌ Erro:', 'color: red;', error);
        showSuccessModal('❌ Erro', 'Não foi possível salvar. Tente novamente.');
    }
};

// Aplicar nota instantaneamente quando admin clicar em um status (APENAS altera/atualiza a área de notas)
window.aplicarNotaStatusInstantanea = function(novoStatus, descricao){
    try{
        if (!currentPedidoId) { console.error('Nenhum pedido aberto para aplicar nota'); return; }

        const notesEl = document.getElementById('pedidoNotes');
        if (!notesEl) { console.error('Campo de notas não encontrado'); return; }

        // Mapear textos amigáveis
        const map = { 'cancelado': 'Pedido Cancelado', 'pendente': 'Pendente', 'pago': 'Pagamento Confirmado' };
        const texto = map[novoStatus] || descricao || novoStatus;

        // Aplicar no textarea imediatamente
        notesEl.value = texto;

        // Atualizar em memória para refletir imediatamente
        const pedido = allPedidos.find(p => String(p.id) === String(currentPedidoId));
        if (pedido) pedido.notes = notesEl.value;

        // Salvar imediatamente (reaproveita função existente que persiste notes)
        // Isso não altera payment_status no servidor — apenas notes.
        salvarPedidoChanges();
    }catch(e){ console.error('Erro ao aplicar nota instantânea', e); }
};

// Aplicar alteração de payment_status instantaneamente: atualizar servidor, mostrar confirmação e fechar modal após OK
window.aplicarStatusPagamentoInstantaneo = async function(novoStatus, descricao){
    try{
        if (!currentPedidoId) { console.error('Nenhum pedido aberto para alterar status'); return; }

        const pedidoId = currentPedidoId;
        console.log('%c🔄 Aplicando status instantâneo:', 'color: blue; font-weight: bold;', novoStatus, 'ID:', pedidoId);

        // Enviar atualização ao servidor
        const res = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: novoStatus })
        });

        if (!res.ok) {
            const errText = await res.text().catch(()=>null);
            console.error('Erro ao atualizar status no servidor', res.status, errText);
            showSuccessModal('❌ Erro', 'Não foi possível alterar o status.');
            return;
        }

        // Atualizar em memória
        const pedido = allPedidos.find(p => String(p.id) === String(pedidoId));
        if (pedido) {
            pedido.payment_status = novoStatus;
        }

        // Exibir mensagem de sucesso e marcar fechamento pós-OK
        showSuccessModal('✅ Status alterado!', `Status atualizado para: ${descricao || novoStatus}`);
        window.__afterSuccessClosePedido = true;

        // Opcional: também atualizar visual do modal atual (background/label)
        try{ abrirPedidoModal(pedidoId); }catch(e){}

    }catch(e){
        console.error('Erro em aplicarStatusPagamentoInstantaneo', e);
        showSuccessModal('❌ Erro', 'Não foi possível alterar o status.');
    }
};

// Aplicar alteração de status do pedido (fluxo) instantaneamente: atualizar servidor, mostrar confirmação e fechar modal após OK
window.aplicarStatusPedidoInstantaneo = async function(novoStatus, descricao){
    try{
        if (!currentPedidoId) { console.error('Nenhum pedido aberto para alterar status do pedido'); return; }

        const pedidoId = currentPedidoId;
        console.log('%c🔄 Aplicando STATUS DO PEDIDO instantâneo:', 'color: blue; font-weight: bold;', novoStatus, 'ID:', pedidoId);

        // Enviar atualização ao servidor (campo `status`)
        const res = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });

        if (!res.ok) {
            const errText = await res.text().catch(()=>null);
            console.error('Erro ao atualizar status do pedido no servidor', res.status, errText);
            showSuccessModal('❌ Erro', 'Não foi possível alterar o status do pedido.');
            return;
        }

        // Atualizar em memória
        const pedido = allPedidos.find(p => String(p.id) === String(pedidoId));
        if (pedido) {
            pedido.status = novoStatus;
        }

        // Exibir mensagem de sucesso e marcar fechamento pós-OK
        showSuccessModal('✅ Status do Pedido alterado!', `Status atualizado para: ${descricao || novoStatus}`);
        window.__afterSuccessClosePedido = true;

        // Reabrir modal para atualizar visual
        try{ abrirPedidoModal(pedidoId); }catch(e){ console.warn(e); }
    }catch(e){ console.error('Erro ao aplicar status do pedido', e); showSuccessModal('❌ Erro', 'Falha ao aplicar status do pedido.'); }
};

// Variáveis globais para confirmação
let statusPagamentoEmAlterar = null;
let currentPedidoIdEmAlteracao = null;

// Preparar confirmação para mudar status de pagamento
window.preparaConfirmacaoPagamento = function(novoStatus, descricao) {
    console.log('%c🔔 Admin clicou em:', 'color: blue; font-weight: bold;', novoStatus);
    
    // Salvar valores
    statusPagamentoEmAlterar = novoStatus;
    currentPedidoIdEmAlteracao = currentPedidoId;
    
    const statusMap = {
        'cancelado': '❌ Pedido Cancelado',
        'pendente': '🟡 Pagamento Pendente',
        'pago': '✅ Pagamento Confirmado'
    };
    
    // Criar modal de confirmação (sobreposto a tudo)
    let confirmModal = document.getElementById('confirmacaoPagamentoModalIndependente');
    if (confirmModal) confirmModal.remove();
    
    confirmModal = document.createElement('div');
    confirmModal.id = 'confirmacaoPagamentoModalIndependente';
    
    const html = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 999999; font-family: Arial, sans-serif;">
            <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); animation: slideIn 0.3s ease-out;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.3rem; font-weight: bold; color: #333;">⚠️ Confirmar?</h3>
                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.95rem;">Alterar status para:</p>
                <p style="margin: 0 0 2rem 0; font-weight: bold; color: #333; font-size: 1.1rem;">${statusMap[novoStatus] || descricao}</p>
                <div style="display: flex; gap: 1rem;">
                    <button id="btnConfirmarStatus" style="flex: 1; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.95rem;">
                        ✅ Confirmar
                    </button>
                    <button id="btnCancelarStatus" style="flex: 1; padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.95rem;">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        </style>
    `;
    
    confirmModal.innerHTML = html;
    document.body.appendChild(confirmModal);
    
    // Adicionar listeners aos botões (com timeout para garantir que estão no DOM)
    setTimeout(() => {
        const btnConfirmar = document.getElementById('btnConfirmarStatus');
        const btnCancelar = document.getElementById('btnCancelarStatus');
        
        if (btnConfirmar) {
            // Remover listeners antigos criando novo elemento (clone substitui o antigo)
            const novoConfirmar = btnConfirmar.cloneNode(true);
            btnConfirmar.parentNode.replaceChild(novoConfirmar, btnConfirmar);
            novoConfirmar.addEventListener('click', confirmarMudancaStatusPagamento);
        }
        
        if (btnCancelar) {
            const novoCancelar = btnCancelar.cloneNode(true);
            btnCancelar.parentNode.replaceChild(novoCancelar, btnCancelar);
            novoCancelar.addEventListener('click', cancelarConfirmacao);
        }
    }, 0);
    
    console.log('%c✅ Modal de confirmação exibido', 'color: green; font-weight: bold;');
};

// Confirmar e executar mudança de status
window.confirmarMudancaStatusPagamento = function() {
    if (!statusPagamentoEmAlterar || !currentPedidoIdEmAlteracao) {
        console.error('%c❌ Dados ausentes', 'color: red;');
        alert('Erro ao processar. Tente novamente.');
        return;
    }
    
    const pedidoId = currentPedidoIdEmAlteracao;
    const novoStatus = statusPagamentoEmAlterar.toLowerCase().trim();
    
    console.log('%c🔄 Enviando atualização:', 'color: blue; font-weight: bold;', novoStatus, 'ID:', pedidoId);
    
    // Fechar modal de confirmação
    cancelarConfirmacao();
    
    // Enviar para servidor
    fetch(`${API_URL}/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: novoStatus })
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao atualizar');
        console.log('%c✅ Status atualizado no servidor', 'color: green; font-weight: bold;');
        
        // Atualizar em memória (normalizado)
        const pedido = allPedidos.find(p => String(p.id) === String(pedidoId));
        if (pedido) {
            console.log('%c📝 Atualizando pedido em memória:', 'color: cyan;', 'ID:', pedido.id);
            pedido.payment_status = novoStatus;
            console.log('%c✅ Pedido atualizado em memória:', 'color: cyan;', 'Status:', pedido.payment_status);
        } else {
            console.error('%c❌ Pedido não encontrado em memória:', 'color: red;', pedidoId);
        }
        
        // Reabrir modal do pedido imediatamente com status atualizado
        console.log('%c🔄 Reabrindo modal do pedido...', 'color: magenta;');
        abrirPedidoModal(pedidoId);
    })
    .catch(err => {
        console.error('%c❌ Erro ao salvar:', 'color: red;', err);
        alert('Erro ao atualizar status. Tente novamente.');
    });
};

// Cancelar confirmação
window.cancelarConfirmacao = function() {
    console.log('%c❌ Confirmação cancelada', 'color: orange;');
    
    statusPagamentoEmAlterar = null;
    currentPedidoIdEmAlteracao = null;
    
    const modal = document.getElementById('confirmacaoPagamentoModalIndependente');
    if (modal) {
        modal.remove();
    }
};

// Limpar todos os pedidos
window.limparTodosPedidos = function() {
    const confirmacao = confirm('⚠️ ATENÇÃO!\n\nVocê tem certeza que deseja DELETAR TODOS OS PEDIDOS?\n\nEsta ação é IRREVERSÍVEL!');
    
    if (!confirmacao) {
        console.log('❌ Operação cancelada pelo usuário');
        return;
    }
    
    const confirmar2 = prompt('Digite "LIMPAR" para confirmar a limpeza de todos os pedidos:');
    
    if (confirmar2 !== 'LIMPAR') {
        console.log('❌ Confirmação incorreta, operação cancelada');
        return;
    }
    
    console.log('%c🗑️ Limpando todos os pedidos...', 'color: red; font-weight: bold;');
    
    fetch(`${API_URL}/pedidos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao deletar');
        return res.json();
    })
    .then(data => {
        console.log('%c✅ Pedidos deletados com sucesso!', 'color: green; font-weight: bold;', data);
        alert(`✅ Sucesso!\n\n${data.deleted} pedidos foram deletados.`);
        
        // Limpar lista em memória
        allPedidos = [];
        
        // Recarregar a lista vazia
        loadPedidos();
    })
    .catch(err => {
        console.error('%c❌ Erro ao deletar:', 'color: red;', err);
        alert('❌ Erro ao deletar os pedidos. Tente novamente.');
    });
};

// =======================
// BUSCAR PEDIDOS
// =======================
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
