// ===== INICIALIZAÇÃO DO PAINEL ADMIN =====
console.log('%c🚀 ADMIN PANEL LOADED', 'color: green; font-weight: bold; font-size: 16px;');

// URL DA API (alterar quando fazer deploy)
const API_URL = 'https://quitanda-produtos-api.onrender.com'; // Será atualizada após deploy
// Para testes locais: const API_URL = 'http://localhost:3001';

let products = [];
let editingProductId = null;

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
// NAVEGAÇÃO ABAS
// =======================
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-purple-600', 'text-purple-600');
        btn.classList.add('border-transparent', 'text-gray-600');
    });
    
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    const btn = document.getElementById(`tab-${tabName}`);
    btn.classList.add('border-purple-600', 'text-purple-600');
    btn.classList.remove('border-transparent', 'text-gray-600');
}

// =======================
// GERENCIAR PEDIDOS
// =======================
let allPedidos = [];
let currentPedidoId = null;

async function loadPedidos() {
    try {
        const response = await fetch(`${API_URL}/pedidos`);
        if (!response.ok) throw new Error('Erro ao buscar pedidos');
        allPedidos = await response.json();
        renderPedidos(allPedidos);
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
        document.getElementById('pedidosList').innerHTML = '<p class="text-center text-red-500">Erro ao carregar pedidos</p>';
    }
}

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

    list.innerHTML = pedidos.map(p => `
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer" onclick="abrirPedidoModal('${p.id}')">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${p.customer_name}</h3>
                    <p class="text-sm text-gray-500">📱 ${p.customer_phone}</p>
                </div>
                <span class="text-xl">${statusEmojis[p.status] || '❓'} ${p.status.toUpperCase()}</span>
            </div>
            
            <p class="text-sm text-gray-600 mb-2">📍 ${p.address}${p.bloco ? `, Bloco ${p.bloco}` : ''}${p.apto ? `, Apt ${p.apto}` : ''}</p>
            <p class="text-sm text-gray-600 mb-2">💳 ${p.payment_method} • ${p.delivery_type === 'delivery' ? '🚗 Entrega' : '🏪 Retirada'}</p>
            
            <div class="flex justify-between items-end">
                <div>
                    <span class="text-xs text-gray-500">${new Date(p.created_at).toLocaleDateString('pt-BR')} ${new Date(p.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <span class="text-xl font-bold text-green-600">R$ ${p.total.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
    `).join('');
}

function abrirPedidoModal(id) {
    currentPedidoId = id;
    const pedido = allPedidos.find(p => p.id === id);
    if (!pedido) return;

    const itens = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
    
    const content = `
        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">👤 Cliente</h4>
            <p><strong>Nome:</strong> ${pedido.customer_name}</p>
            <p><strong>Telefone:</strong> <a href="tel:${pedido.customer_phone}" class="text-blue-600">${pedido.customer_phone}</a></p>
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">📍 Endereço</h4>
            <p>${pedido.address}${pedido.bloco ? `, Bloco ${pedido.bloco}` : ''}${pedido.apto ? `, Apt ${pedido.apto}` : ''}</p>
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">🛒 Itens (${itens.length})</h4>
            ${itens.map(i => `<p>• ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}</p>`).join('')}
        </div>

        <div class="space-y-2 pb-4 border-b">
            <h4 class="font-bold text-lg">💰 Valor Total</h4>
            <p class="text-2xl font-bold text-green-600">R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
        </div>

        <div class="space-y-2 pb-4">
            <h4 class="font-bold text-lg">📅 Data</h4>
            <p>${new Date(pedido.created_at).toLocaleDateString('pt-BR')} às ${new Date(pedido.created_at).toLocaleTimeString('pt-BR')}</p>
            <p class="text-xs text-gray-500">Atualizado: ${new Date(pedido.updated_at).toLocaleDateString('pt-BR')} às ${new Date(pedido.updated_at).toLocaleTimeString('pt-BR')}</p>
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

    const status = document.getElementById('pedidoStatus').value;
    const notes = document.getElementById('pedidoNotes').value;

    try {
        const response = await fetch(`${API_URL}/pedidos/${currentPedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
        });

        if (response.ok) {
            console.log('✅ Pedido atualizado com sucesso');
            closePedidoModal();
            loadPedidos();
        }
    } catch (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        alert('Erro ao salvar alterações');
    }
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
// INICIALIZAR
// =======================
console.log('%c🔄 INICIALIZANDO PAINEL...', 'color: orange; font-weight: bold;');
loadData();
console.log('%c✨ PAINEL PRONTO!', 'color: green; font-weight: bold; font-size: 14px;');
