# 🎯 Guia Prático: Usando Múltiplas Unidades

## Cenário 1: Cadastrando Banana com 3 Unidades

### Passo 1 - Abrir Admin
Vá para: `admin.html`

### Passo 2 - Clique em "➕ Novo Produto"

### Passo 3 - Preencha os campos

```
Nome: 🍌 Banana Prata
Descrição: Banana madura e doce
Preço: 5,99
Imagem: (sua imagem aqui)
Cor: Escolha uma cor
```

### Passo 4 - Selecione as Unidades

Na seção "Unidades Disponíveis *", clique nos checkboxes:

```
✅ palma      (padrão para bananas)
✅ kg         (peso)
✅ un         (unidade individual)
☐ dúzia
☐ bandeja
☐ maço
☐ litro
```

Você verá embaixo:
```
✨ Unidades selecionadas: palma, kg, un
```

### Passo 5 - Clique em "💾 Salvar Produto"

Pronto! A banana foi cadastrada com 3 unidades disponíveis.

---

## Cenário 2: Cliente Comprando a Banana

### Passo 1 - Cliente acessa o site

Clica em "Hortifruti Vila Natal" ou abre `index.html`

### Passo 2 - Encontra a banana

Procura ou clica em "🍌 Banana Prata"

### Passo 3 - Clica em "Adicionar"

Automaticamente, aparece um modal:

```
┌──────────────────────────┐
│   🍌 Banana Prata      X │
├──────────────────────────┤
│  [Imagem da banana]      │
│  R$ 5,99                 │
├──────────────────────────┤
│ Escolha a unidade:       │
├──────────────────────────┤
│ [PALMA] [KG] [UN]        │
├──────────────────────────┤
│ ← Voltar                 │
└──────────────────────────┘
```

### Passo 4 - Cliente escolhe a unidade

Digamos que quer comprar por **kg**.  
Clica no botão [KG]

### Passo 5 - Modal de Quantidade

Aparece o próximo modal:

```
┌──────────────────────────┐
│   🍌 Banana Prata      X │
├──────────────────────────┤
│  [Imagem da banana]      │
│  R$ 5,99 / kg           │
├──────────────────────────┤
│ Escolha a quantidade:    │
│                          │
│    [−] 0 [+]            │
│                          │
│ Ou digite: [2]          │
├──────────────────────────┤
│ ← Voltar                 │
│ [Adicionar ao Carrinho]  │
└──────────────────────────┘
```

### Passo 6 - Cliente escolhe quantidade

Digamos que quer **2 kg**.  
Digite ou use os botões [+] [−]

### Passo 7 - Clica "Adicionar ao Carrinho"

A banana é adicionada!

---

## Cenário 3: Visualizando o Carrinho

### Carrinho mostra:

```
🛒 Meu Carrinho

┌────────────────────────────────┐
│ 🍌 Banana Prata                │
│ R$ 5,99 / kg                   │ ← Unidade!
│ 2 x  [−] 2 [+]  R$ 11,98  🗑️  │
└────────────────────────────────┘

Total: R$ 11,98
```

Note que mostra `/kg` porque o cliente escolheu essa unidade.

---

## Cenário 4: Finalizando o Pedido

### Cliente clica "Finalizar Pedido"

1. Escolhe tipo de entrega (Local ou Delivery)
2. Preenche dados
3. Escolhe forma de pagamento
4. Confirma

### O que é salvo no pedido:

```javascript
{
  items: [
    {
      id: "banana_001",
      name: "🍌 Banana Prata",
      quantity: 2,
      price: 5.99,
      unit: "kg"  // ← Unidade selecionada!
    }
  ],
  total: 11.98
}
```

Quando você vê no admin, aparece:
```
🍌 Banana Prata
Qtd: 2 x kg @ R$ 5,99 = R$ 11,98
```

---

## Casos Especiais

### Se o produto tem apenas 1 unidade:

```javascript
{
  "name": "Tomate",
  "units": ["kg"]  // Só uma!
}
```

Cliente clica "Adicionar" → **Pula o modal de seleção** → Vai direto para escolher quantidade.

### Se o produto é antigo (sem array `units`):

```javascript
{
  "name": "Alface",
  "unit": "un"  // Formato antigo
}
```

Sistema automaticamente converte para:
```javascript
{
  "name": "Alface",
  "unit": "un",
  "units": ["un"]  // Criado automaticamente
}
```

Cliente vê normalmente e compra como antes. ✅ Compatível!

---

## Editar Produto Já Cadastrado

### Passo 1 - Admin clica "✏️ Editar" no produto

### Passo 2 - Modal abre com os dados antigos

Os checkboxes **já vêm marcados** com as unidades previamente selecionadas:

```
✅ kg
✅ un
☐ bandeja
☐ dúzia
```

### Passo 3 - Pode adicionar ou remover unidades

Exemplo: Quer adicionar "bandeja"? Clique no checkbox.

### Passo 4 - Clique "💾 Salvar Produto"

O produto é atualizado! ✅

---

## Troubleshooting

### Problema: "Nenhuma unidade selecionada" (não consegue salvar)

**Solução:** Clique em pelo menos um checkbox na seção de unidades.

### Problema: Produto aparece sem opção de escolher unidade

**Causa:** Produto foi criado com estrutura antiga (sem array `units`)

**Solução:** 
1. Edite o produto
2. Selecione as unidades desejadas
3. Salve novamente

### Problema: Carrinho mostra "undefined" na unidade

**Causa:** Produto corrompido no localStorage

**Solução:** 
1. Limpe localStorage (F12 → Application → Clear All)
2. Recarregue a página
3. Cadastre o produto novamente

---

## ✅ Checklist de Funcionalidades

- ✅ Cadastrar produto com 1 unidade
- ✅ Cadastrar produto com 2+ unidades
- ✅ Editar produto e mudar unidades
- ✅ Cliente vê modal de seleção se houver múltiplas unidades
- ✅ Cliente pula seleção se houver apenas 1 unidade
- ✅ Carrinho mostra unidade selecionada
- ✅ Pedido salva unidade corretamente
- ✅ Compatibilidade com produtos antigos

---

## 📚 Referência de Código

Se você quer entender o código por trás:

### Seleção de unidades (Frontend)
**Arquivo:** `script-site.js`, função `openProductSelection(id)`
- Verifica quantas unidades o produto tem
- Se 1: abre quantidade direto
- Se 2+: abre seleção de unidade

### Salvamento de unidades (Backend)
**Arquivo:** `script.js`, função `saveProduct(e)`
- Coleta todos os checkboxes marcados
- Cria array `units: [...]`
- Envia para API

---

## 🎨 Exemplo Visual Completo

```
┌─────────────────────────────────────────────────────────┐
│                     ADMIN PANEL                         │
├─────────────────────────────────────────────────────────┤
│ Nome: Maçã Fuji                                         │
│ Preço: 5,99                                             │
│                                                         │
│ Unidades Disponíveis *                                  │
│ ☑ kg          ☐ un         ☐ dúzia                     │
│ ☑ bandeja     ☐ maço       ☐ litro                     │
│                                                         │
│ ✨ Unidades selecionadas: kg, bandeja                   │
│                                                         │
│ [Salvar Produto]                                        │
└─────────────────────────────────────────────────────────┘
                           ↓ SALVA NA API
┌─────────────────────────────────────────────────────────┐
│                      SITE (CLIENTE)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     [Imagem Maçã]  R$ 5,99                             │
│     🍎 Maçã Fuji                                        │
│     "Maçã fresca e crocante"                           │
│     [ADICIONAR]                                         │
│                                                         │
│              ↓ Cliente clica ADICIONAR                  │
│                                                         │
│     ┌──────────────────────────┐                       │
│     │ 🍎 Maçã Fuji          X │                       │
│     │ Escolha a unidade:       │                       │
│     │ [KG]  [BANDEJA]          │                       │
│     │ ← Voltar                 │                       │
│     └──────────────────────────┘                       │
│                                                         │
│              ↓ Cliente escolhe KG                       │
│                                                         │
│     ┌──────────────────────────┐                       │
│     │ 🍎 Maçã Fuji          X │                       │
│     │ R$ 5,99 / kg             │                       │
│     │ Escolha a quantidade:    │                       │
│     │ [−] 2 [+]               │                       │
│     │ [Adicionar ao Carrinho]  │                       │
│     └──────────────────────────┘                       │
│                                                         │
│              ↓ Cliente clica ADICIONAR                  │
│                                                         │
│     🛒 Carrinho (1 item)                               │
│     🍎 Maçã Fuji - 2 x kg - R$ 11,98                   │
│                                                         │
│     [Finalizar Pedido]                                 │
│                                                         │
│              ↓ PEDIDO CONFIRMADO                        │
│                                                         │
│     items: [                                           │
│       {                                                 │
│         name: "🍎 Maçã Fuji",                          │
│         quantity: 2,                                   │
│         unit: "kg"  ← Unidade selecionada!            │
│       }                                                 │
│     ]                                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Tudo pronto para usar! 🚀**
