# 🧪 Guia de Testes - Múltiplas Unidades

## 🎯 Objetivo
Validar que a funcionalidade de múltiplas unidades está funcionando corretamente.

---

## 📋 Testes Básicos

### ✅ Teste 1: Cadastrar Produto com 1 Unidade

**Passos:**
1. Abra `admin.html`
2. Clique em "➕ Novo Produto"
3. Preencha:
   - Nome: `Tomate Teste`
   - Preço: `4.49`
   - Selecione APENAS: ☑ kg
   - Imagem: (qualquer)
4. Clique "💾 Salvar Produto"

**Esperado:**
- ✅ Produto salvo com sucesso
- ✅ Mensagem: "✅ Produto salvo com sucesso!"
- ✅ Produto aparece na lista

**Validação:**
```javascript
// Verificar no console:
// localStorage.getItem('hortifruti_products') deve conter:
{
  "units": ["kg"],
  "unit": "kg"
}
```

---

### ✅ Teste 2: Cadastrar Produto com Múltiplas Unidades

**Passos:**
1. Clique em "➕ Novo Produto"
2. Preencha:
   - Nome: `Banana Teste`
   - Preço: `5.99`
   - Selecione: ☑ kg ☑ un ☑ palma
   - Imagem: (qualquer)
3. Clique "💾 Salvar Produto"

**Esperado:**
- ✅ Antes de salvar, vê: "✨ Unidades selecionadas: kg, un, palma"
- ✅ Produto salvo
- ✅ No console, produto tem `"units": ["kg", "un", "palma"]`

**Teste no Console:**
```javascript
// Copie e cole no console (F12):
const produtos = JSON.parse(localStorage.getItem('hortifruti_products'));
console.table(produtos.filter(p => p.name === 'Banana Teste'));

// Resultado esperado:
// {
//   name: "Banana Teste",
//   units: ["kg", "un", "palma"],
//   unit: "kg"
// }
```

---

### ✅ Teste 3: Editar Produto

**Passos:**
1. Na lista de produtos, clique "✏️ Editar" em "Banana Teste"
2. Verifique que os checkboxes já vêm marcados:
   - ☑ kg
   - ☑ un
   - ☑ palma
3. Adicione uma unidade: ☑ dúzia
4. Clique "💾 Salvar Produto"

**Esperado:**
- ✅ Modal abre com unidades marcadas corretamente
- ✅ Info mostra: "✨ Unidades selecionadas: kg, un, palma, dúzia"
- ✅ Produto atualizado com 4 unidades

---

### ✅ Teste 4: Compra - Uma Unidade

**Passos:**
1. Abra `index.html`
2. Encontre "Tomate Teste" (cadastrado no Teste 1)
3. Clique em "Adicionar"

**Esperado:**
- ✅ **Pula o modal de seleção de unidade**
- ✅ Vai direto para o modal de quantidade
- ✅ Mostra "R$ 4,49 / kg"

---

### ✅ Teste 5: Compra - Múltiplas Unidades

**Passos:**
1. Encontre "Banana Teste" (cadastrada no Teste 2)
2. Clique em "Adicionar"

**Esperado:**
- ✅ Aparece modal com 4 botões: [KG] [UN] [PALMA] [DÚZIA]
- ✅ Cada botão é clicável
- ✅ Clique em [KG]

**Próxima tela:**
- ✅ Modal de quantidade abre
- ✅ Mostra "R$ 5,99 / kg" (a unidade que escolheu)

**Continue:**
1. Digite `2` na quantidade
2. Clique "Adicionar ao Carrinho"

**Esperado:**
- ✅ Não há erros
- ✅ Menção visual de "adicionado ao carrinho"
- ✅ Modal fecha

---

### ✅ Teste 6: Carrinho Mostra Unidade Correta

**Passos:**
1. Clique no ícone do carrinho 🛒

**Esperado:**
```
┌─────────────────────────────┐
│ 🍌 Banana Teste             │
│ R$ 5,99 / kg                │ ← Unidade aparece aqui!
│ 2 x [−] [+]   R$ 11,98  🗑️ │
└─────────────────────────────┘
```

---

### ✅ Teste 7: Múltiplas Escolhas de Mesma Unidade

**Passos:**
1. Carrinho ainda aberto
2. Procure "Banana Teste" no site novamente
3. Clique "Adicionar"
4. Escolha outra unidade: [PALMA]
5. Quantidade: 1
6. Clique "Adicionar ao Carrinho"

**Esperado:**
- ✅ Novo item no carrinho:
```
┌─────────────────────────────┐
│ 🍌 Banana Teste             │
│ R$ 5,99 / kg                │
│ 2 x [−] [+]   R$ 11,98  🗑️ │
│                             │
│ 🍌 Banana Teste             │
│ R$ 5,99 / palma             │ ← Unidade diferente = novo item!
│ 1 x [−] [+]   R$ 5,99   🗑️ │
└─────────────────────────────┘
```

Total: R$ 17,97

**Nota:** Mesmo produto, mas unidades diferentes = itens separados no carrinho!

---

### ✅ Teste 8: Finalizar Pedido com Múltiplas Unidades

**Passos:**
1. Clique "Finalizar Pedido"
2. Escolha "Retirar no Local" ou "Entrega"
3. Preencha dados (nome, telefone, endereço se entrega)
4. Escolha método de pagamento
5. Clique "Confirmar e Continuar"

**Esperado:**
- ✅ Pedido salvo sem erros
- ✅ Modal de sucesso aparece
- ✅ Mensagem: "✅ Pedido Confirmado!"

---

### ✅ Teste 9: Verificar Pedido no Admin

**Passos:**
1. Abra `admin.html`
2. Clique na aba "📋 Pedidos"
3. Procure pelo pedido que acabou de fazer (deve aparecer como "pendente")
4. Clique no pedido

**Esperado:**
```
Produtos:
✅ 🍌 Banana Teste - 2 x kg @ R$ 5,99 = R$ 11,98
✅ 🍌 Banana Teste - 1 x palma @ R$ 5,99 = R$ 5,99

Total: R$ 17,97
```

**Nota:** A unidade selecionada está corretamente salva! ✅

---

### ✅ Teste 10: Compatibilidade com Produtos Antigos

**Preparação:**
Se você tiver um produto antigo no localStorage (com apenas `unit`, sem `units`):

```javascript
// Adicione ao console:
const oldProduct = {
  id: "old_test",
  name: "Alface Antiga",
  unit: "un",
  price: 2.49,
  image: "..."
};
```

**Teste:**
1. Abra `index.html`
2. Procure "Alface Antiga"
3. Clique "Adicionar"

**Esperado:**
- ✅ Não há erro no console
- ✅ Modal de quantidade abre direto (sem seleção de unidade)
- ✅ Mostra "R$ 2,49 / un"
- ✅ Pode adicionar ao carrinho normalmente

---

## 🔴 Testes de Erro

### ❌ Teste 11: Tentar Salvar Sem Unidades

**Passos:**
1. Clique "➕ Novo Produto"
2. Preencha nome, preço, imagem
3. **NÃO selecione nenhuma unidade**
4. Clique "💾 Salvar Produto"

**Esperado:**
- ⚠️ Alerta aparece: "⚠️ Por favor, selecione pelo menos uma unidade de medida"
- ✅ Produto NÃO é salvo

---

### ❌ Teste 12: Limpar e Recarregar Cache

**Passos:**
1. Abra `admin.html`
2. Abra console (F12)
3. Cole:
```javascript
localStorage.clear();
location.reload();
```

**Esperado:**
- ✅ Todos os produtos removidos
- ✅ Página recarrega vazia
- ✅ Sem erro no console

---

## 📊 Testes de Performance

### ⚡ Teste 13: Múltiplos Produtos

**Passos:**
1. Cadastre 10+ produtos, cada um com 3+ unidades
2. Abra `index.html`
3. Navegue pelos produtos
4. Adicione vários ao carrinho

**Esperado:**
- ✅ Sem lag/atraso
- ✅ Modal de seleção abre rapidamente
- ✅ Carrinho atualiza sem delay

---

### 💾 Teste 14: localStorage Limit

**Cenário:** Se localStorage ficar cheio (>5-10MB)

**Esperado:**
- ✅ Sistema tenta limpar automaticamente
- ✅ Exibe mensagem de aviso se necessário
- ✅ Continua funcionando

---

## ✅ Checklist Final

Marque cada teste conforme completa:

- [ ] Teste 1: Cadastro 1 unidade
- [ ] Teste 2: Cadastro múltiplas unidades
- [ ] Teste 3: Editar produto
- [ ] Teste 4: Compra com 1 unidade
- [ ] Teste 5: Compra com múltiplas unidades
- [ ] Teste 6: Carrinho mostra unidade
- [ ] Teste 7: Mesma unidade aparece múltiplas vezes
- [ ] Teste 8: Finalizar pedido
- [ ] Teste 9: Verificar no admin
- [ ] Teste 10: Compatibilidade com produtos antigos
- [ ] Teste 11: Erro sem unidades
- [ ] Teste 12: Limpar cache
- [ ] Teste 13: Performance
- [ ] Teste 14: localStorage limit

---

## 🐛 Se Encontrar Bugs

Abra o console (F12) e reporte:

1. **Erro específico** (copie da aba Console)
2. **Passos para reproduzir**
3. **Comportamento esperado vs. atual**
4. **Navegador e versão**

Exemplo:
```
Bug: Modal de unidades não abre
Passos: Adicionar produto X
Esperado: Modal com 3 botões aparece
Atual: Vai direto para quantidade
Navegador: Chrome 120.0.6099.129
```

---

## 📱 Testes em Mobile

### Teste 15: Responsividade

**Passos:**
1. Abra DevTools (F12)
2. Clique em "Toggle device toolbar" (Ctrl+Shift+M)
3. Teste em iPhone 12, iPad, etc.

**Esperado:**
- ✅ Modal de seleção aparece corretamente
- ✅ Botões são clicáveis (não muito pequenos)
- ✅ Carrinho mostra unidade em mobile
- ✅ Sem overflow ou quebra de layout

---

**Obrigado por testar! 🙏**
