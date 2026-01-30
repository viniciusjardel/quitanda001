# 🔄 Guia de Sincronização em Tempo Real

## 📋 O que foi implementado

Sua loja agora tem um **sistema completo de sincronização em tempo real**! As alterações feitas no painel admin aparecem instantaneamente no site do cliente, sem precisar de banco de dados.

### Arquitetura de Sincronização

```
CAMADAS DE ARMAZENAMENTO (em prioridade):
1. localStorage      → Armazenamento permanente (principal)
2. sessionStorage    → Armazenamento de sessão (fallback iOS)
3. window.name       → Compatibilidade entre abas (iOS Safari)
4. SAMPLE_PRODUCTS   → Padrão incorporado no código
5. postMessage       → Comunicação entre janelas/abas abertas
```

### Tipos de Sincronização

| Mecanismo | Como Funciona | Quando Usado |
|-----------|---------------|------------|
| **Storage Event** | Detecta mudanças no localStorage entre abas | Desktop/Android com múltiplas abas |
| **CustomEvent** | Evento customizado para sincronização local | Dentro da mesma janela |
| **postMessage** | Envia dados entre janelas abertas | Admin e site abertos simultaneamente |
| **sessionStorage** | Backup para iOS Safari | Quando localStorage falha |
| **window.name** | Persistência entre abas no iOS | Compatibilidade com iOS |

---

## ✅ Como Usar (Passo a Passo)

### Cenário 1: Abrir Admin e Site em Abas Diferentes (RECOMENDADO)

1. **Abra duas abas no navegador**
   - Aba 1: `admin.html` (Painel Administrativo)
   - Aba 2: `index.html` (Site do Cliente)

2. **No Admin (Aba 1):**
   - Clique em `➕ Novo Produto` ou `✏️ Editar`
   - Preencha os dados (nome, preço, descrição, imagem, etc.)
   - Clique em `💾 Salvar Produto`

3. **No Site (Aba 2):**
   - Os produtos **aparecem automaticamente em tempo real**!
   - Não é necessário recarregar a página
   - O novo produto ou edição aparece instantaneamente

### Cenário 2: Admin em Nova Janela

1. **No Site (index.html):**
   - Clique em `📋` (botão "Abrir Admin") no canto superior direito
   - Uma nova janela do admin será aberta

2. **Edite produtos e salve**
   - O site sincroniza automaticamente em tempo real

3. **Feche o admin**
   - Os dados permanecem salvos no localStorage

### Cenário 3: Apenas Site (Sem Admin Aberto)

- **Produtos carregam do localStorage** (dados anteriores)
- Se estiver vazio, **usa os SAMPLE_PRODUCTS de fallback**
- Clique em `🔄` para forçar sincronização manual

---

## 🔍 Debug Panel (🔍 botão no site)

Clique no botão **🔍** no canto superior esquerdo para abrir o painel de debug:

```
✅ X produtos carregados
📦 [FONTE DA CARGA] localStorage / sessionStorage / SAMPLE_PRODUCTS
🔔 [EVENTOS] Mostra sincronizações em tempo real
```

### O que observar:

- **✅ Verde**: Dados carregados com sucesso
- **⚠️ Amarelo**: Fallback em funcionamento
- **❌ Vermelho**: Erro encontrado
- **📨 Azul**: Sincronização recebida

---

## 🧪 Testando a Sincronização

### Teste 1: Sincronização em Tempo Real

```bash
1. Abra admin.html (Aba 1)
2. Abra index.html (Aba 2)
3. No Admin: Clique em "Novo Produto"
4. Preencha: Nome "🍇 Uva", Preço "6.99", etc.
5. Clique "Salvar Produto"
6. RESULTADO: Uva aparece instantaneamente no Site (Aba 2)
```

### Teste 2: Múltiplas Edições

```bash
1. Admin aberto (Aba 1)
2. Site aberto (Aba 2)
3. Edite 3 produtos rapidamente no admin
4. Todos aparecem instantaneamente no site
5. RESULTADO: Sem lag ou delay!
```

### Teste 3: Recarregar Página

```bash
1. Salve produtos no admin
2. Recarregue index.html (F5)
3. RESULTADO: Produtos carregam normalmente do localStorage
```

### Teste 4: Verificar Storage

```javascript
// Abra o Console (F12) no Site e execute:

// Ver todos os produtos armazenados:
console.log(window.products);

// Ver JSON no localStorage:
console.log(JSON.parse(localStorage.getItem('hortifruti_products')));

// Ver timestamp da última atualização:
console.log(localStorage.getItem('hortifruti_timestamp'));

// Ver hash para detectar mudanças:
console.log(localStorage.getItem('hortifruti_products_hash'));
```

---

## 📱 Funcionamento em Mobile

### iOS (Safari)

```
iOS Safari desabilita localStorage frequentemente.
A sincronização funciona por:
1. sessionStorage (prioridade em iOS)
2. window.name (compatibilidade entre abas)
3. postMessage (entre janelas abertas)
```

**Para testar no iOS:**
- Abra `admin.html` em Safari (iPhone)
- Edite/salve produtos
- Abra `index.html` em outra aba
- Produtos sincronizam via postMessage

### Android (Chrome)

```
Android Chrome tem localStorage confiável.
Funciona igual ao desktop.
```

---

## ⚙️ Detalhes Técnicos

### O que é salvo

Cada produto é um objeto JSON com:

```javascript
{
    id: 'unique_id',              // ID único
    name: '🍎 Maçã Fuji',         // Nome com emoji
    description: 'Maçã fresca',   // Descrição
    price: 5.99,                  // Preço em R$
    unit: 'kg',                   // Unidade (kg, un, etc)
    image: 'https://...',         // URL da imagem
    color: '#ef4444'              // Cor tema do botão
}
```

### Chave de Armazenamento

**Todos os mecanismos usam a mesma chave:**
```
hortifruti_products        → Dados dos produtos (JSON array)
hortifruti_products_hash   → Hash para detectar mudanças
hortifruti_timestamp       → Data/hora da última atualização
```

### Eventos Disparados

**CustomEvent:**
```javascript
// Disparado quando produtos mudam
window.addEventListener('hortifruti_products_updated', (e) => {
    console.log(e.detail.products);  // Array de produtos
    console.log(e.detail.timestamp); // Data da mudança
});
```

**Storage Event (entre abas):**
```javascript
// Automático - ocorre quando localStorage muda em outra aba
window.addEventListener('storage', (e) => {
    if (e.key === 'hortifruti_products') {
        // Sincronização automática
    }
});
```

**PostMessage:**
```javascript
// Enviado pelo admin quando salva
{
    type: 'hortifruti_products_updated',
    products: [...],
    timestamp: '2024-01-19T...',
    source: 'admin'
}
```

---

## 🐛 Troubleshooting

### Produtos não aparecem no site

**Solução 1:** Abra o Console (F12) e execute:
```javascript
window.syncProductsNow()  // Force refresh
```

**Solução 2:** Verifique o Debug Panel (🔍):
- Clique no botão 🔍 no site
- Veja se mostra "✅ X produtos carregados"
- Se vazio, use o Admin para adicionar produtos

**Solução 3:** Limpe e recarregue
```javascript
// No Console do site:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### localStorage undefined

**Se localStorage retorna "undefined":**
1. Verifique se está em modo privado (algumas browsers bloqueiam)
2. Verifique espaço em disco disponível
3. Tente em outro navegador

### Produtos desaparecem após recarregar

**Causa:** localStorage pode estar desabilitado

**Solução:**
1. Verifique permissões do navegador
2. Verifique espaço em disco
3. Tente em navegador diferente

### Site não sincroniza com Admin

**Certifique-se de:**
1. ✅ Admin salva com botão "Salvar Produto"
2. ✅ Site é recarregado APÓS salvar no admin
3. ✅ Usando o mesmo navegador
4. ✅ localStorage não está vazio

---

## 🎯 Próximas Melhorias (Opcional)

Você pode adicionar:

```javascript
// 1. Notificação visual quando sincroniza:
function showSyncNotification() {
    alert('✅ Produtos sincronizados!');
}

// 2. Auto-save no admin (a cada X segundos)
setInterval(saveProducts, 5000);

// 3. Verificar se há alterações não salvas
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        return e.returnValue = 'Há alterações não salvas!';
    }
});

// 4. Exportar/Importar produtos como JSON
function exportProducts() {
    const json = JSON.stringify(window.products, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.json';
    a.click();
}
```

---

## 📞 Suporte

Se tiver dúvidas sobre sincronização:

1. Abra o Console (F12)
2. Veja as mensagens de log em cores:
   - 🟢 Verde: Sucesso
   - 🟡 Amarelo: Aviso
   - 🔴 Vermelho: Erro

3. Os logs mostram exatamente o que está acontecendo!

---

## ✨ Resumo

Você agora tem:

✅ **Sincronização em tempo real** entre admin e site
✅ **Múltiplas camadas de armazenamento** para compatibilidade
✅ **Sem banco de dados** - tudo no navegador!
✅ **Funciona no mobile** (iOS e Android)
✅ **Debug panel** para verificar status
✅ **Salvamento automático** entre abas

**Basta editar no Admin e os produtos aparecem instantaneamente no Site! 🚀**

---

*Última atualização: 19 de janeiro de 2026*
