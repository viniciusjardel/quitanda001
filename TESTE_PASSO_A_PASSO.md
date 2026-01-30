# 🚀 INSTRUÇÕES PARA TESTAR O FIX

## ⚠️ IMPORTANTE
O backend precisa ser atualizado primeiro!

---

## PASSO 1: Redeploy do Backend no Render

### Se você usa Render.com:

1. Abra [render.com](https://render.com)
2. Clique no serviço **Backend** (quitanda-produtos-api)
3. Vá até o final da página
4. Clique no botão **"Manual Deploy"** (ou "Redeploy")
5. Aguarde aparecer ✅ "Deploy successful"

**Tempo**: ~2-3 minutos

---

## PASSO 2: Testar no Navegador

### Abra o Painel Admin

**URL**: `https://seu-site/admin.html`

---

## PASSO 3: Criar ou Editar um Produto

### Opção A: Criar novo produto
1. Clique no botão **"➕ Adicionar Produto"**
2. Preencha os campos:
   - Nome: "Banana"
   - Preço: "5.50"
   - Imagem: Cole uma URL
   - Descrição: "Banana nanica"

### Opção B: Editar um produto existente
1. Na lista de produtos, clique **"✏️ Editar"**

---

## PASSO 4: Selecionar Múltiplas Unidades

Você verá uma grade com checkboxes:

```
☐ kg      ☐ un      ☐ dúzia
☐ bandeja ☐ maço    ☐ litro
☐ palma
```

**Selecione 2 ou mais**. Exemplo:

```
☑️ kg      ☐ un      ☐ dúzia
☑️ bandeja ☐ maço    ☐ litro
☐ palma
```

Logo abaixo deve aparecer em tempo real:

```
Unidades selecionadas: kg, bandeja
```

---

## PASSO 5: Abrir o Console

Isso é importante para **verificar se funcionou**:

1. Pressione **F12** no seu teclado
2. Clique na aba **"Console"**
3. Deixe o console aberto

---

## PASSO 6: Salvar o Produto

Clique no botão **"💾 Salvar Produto"**

Você deve ver:
- Uma caixa verde dizendo **"✅ Produto salvo com sucesso!"**
- No console, vários logs coloridos aparecendo

---

## PASSO 7: Verificar os Logs no Console

### Procure por logs nesta ordem:

#### 🟠 1º Log - Laranja (O que foi selecionado)
```
📋 Unidades selecionadas: 
['kg', 'bandeja']
```

#### 🟢 2º Log - Verde (O que foi enviado)
```
💾 Dados sendo salvos:
{
  id: "prod_123456...",
  name: "Banana",
  units: ['kg', 'bandeja'],
  ...
}
```

#### 🔵 3º Log - Cyan (O que voltou do backend)
```
✅ Produtos carregados da API: 7
📦 Produto recarregado: {
  id: "prod_123456...",
  units: ['kg', 'bandeja'],
  ...
}
```

---

## PASSO 8: Editar o Produto Novamente

1. Clique em **"✏️ Editar"** no mesmo produto

### ✅ TESTE PASSOU SE:
- As **duas checkboxes estão marcadas** (kg e bandeja)
- No console, aparecem os logs roxos:
```
📦 Dados do produto: {...}
📋 Array de unidades: ['kg', 'bandeja']
✅ Unidades a carregar: ['kg', 'bandeja']
  ✅ Marcado: kg
  ✅ Marcado: bandeja
```

### ❌ TESTE FALHOU SE:
- Só aparece **1 checkbox marcado**
- Console mostra "❌ NÃO ENCONTRADO"
- Aparecem mensagens de erro

---

## PASSO 9: Testar as Mudanças

Se quiser, teste:
1. **Remover uma unidade**: Desmarque `bandeja`, deixe só `kg`
2. **Salvar**: Clique 💾
3. **Editar novamente**: Veja se só `kg` está marcado
4. **Adicionar outra**: Marque `dúzia` também
5. **Salvar**: Agora deve ter `kg` e `dúzia`
6. **Editar novamente**: Confirme que aparecem as duas marcadas ✅

---

## PASSO 10: Testar no Site (Cliente)

Se quiser testar o fluxo completo:

1. Abra seu site normalmente: `https://seu-site`
2. Vá até um produto com múltiplas unidades
3. Clique em **"Adicionar ao carrinho"**
4. Deve aparecer um modal pedindo para escolher a unidade:
```
┌─────────────────────────┐
│  Selecione a unidade    │
│  [ kg ]  [ bandeja ]    │
└─────────────────────────┘
```
5. Escolha uma (ex: `kg`)
6. Depois pedirá quantidade
7. Produto deve ir pro carrinho com a unidade selecionada

---

## 🆘 Se Não Funcionar

### ❌ "Erro 500 ao salvar"
**Solução**: O banco de dados não foi atualizado
- Aguarde mais 5 minutos após redeploy
- Ou faça redeploy novamente
- Ou execute: `ALTER TABLE produtos ADD COLUMN units TEXT;` no PostgreSQL

### ❌ "Só aparece 1 unidade"
**Solução**: Cache do navegador
1. Pressione **Ctrl + Shift + Delete**
2. Selecione "Todos os cookies e arquivos em cache"
3. Clique "Limpar agora"
4. Recarregue a página

### ❌ "Logs não aparecem coloridos"
**Solução**: Normalmente é só por causa de versão do navegador
- Tente em **Chrome** em vez de Firefox
- Ou feche e reabra o navegador

### ❌ "Mensagem de erro: 'units' is required"
**Solução**: Desmarque todas as unidades e marque novamente
- Deve aparecer a mensagem "Por favor, selecione pelo menos uma unidade"
- Marque uma unidade e tente novamente

---

## ✅ Checklist Final

- [ ] Backend redeployado no Render
- [ ] Admin panel abre normalmente
- [ ] Consegue selecionar múltiplas unidades
- [ ] Mensagem "Unidades selecionadas" aparece
- [ ] Salvar produto funciona
- [ ] Logs coloridos aparecem no console
- [ ] Editar produto mostra unidades corretas
- [ ] Site permite selecionar unidades ao adicionar carrinho

---

## 📞 Se Precisar de Ajuda

Verifique:
1. Os logs no console (F12)
2. Se o backend foi redeployado
3. Se o cache foi limpo
4. Se há alguma mensagem de erro em vermelho

Qualquer coisa, me avisa! 🚀
