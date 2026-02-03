# ✅ CHECKLIST DE VERIFICAÇÃO

## 🔍 Antes de Começar

### Requisitos
- [ ] Você tem acesso ao painel Render.com (backend)
- [ ] Você tem acesso ao admin panel (seu site)
- [ ] Você tem acesso ao console do navegador (F12)
- [ ] Seu backend está online (verde no Render)
- [ ] Seu banco de dados PostgreSQL está ativo

---

## 🚀 Passo 1: Preparar o Backend

### A. Fazer Redeploy no Render
- [ ] Abrir render.com
- [ ] Ir para serviço "Backend" (quitanda-produtos-api)
- [ ] Clicar "Manual Deploy" ou "Redeploy"
- [ ] Aguardar mensagem "Deploy successful" (verde ✅)
- [ ] **Tempo esperado**: 2-3 minutos

### B. Verificar Status
- [ ] Status do serviço: "Live" (verde) ✅
- [ ] Último deploy recente (há poucos minutos)
- [ ] Nenhuma mensagem de erro no histórico

### C. Verificar Conectividade
Abra no navegador:
```
https://quitanda-produtos-api.onrender.com/
```
Você deve ver:
```json
{
  "message": "API Produtos Quitanda Villa Natal",
  "status": "online",
  "timestamp": "2024-XX-XX..."
}
```
- [ ] Resposta JSON aparece
- [ ] Status = "online"

---

## 📱 Passo 2: Limpar Cache do Navegador

### Limpar Cache
1. [ ] Pressionar **Ctrl + Shift + Delete** (Windows) ou **Cmd + Shift + Delete** (Mac)
2. [ ] Ou em Firefox/Chrome: Configurações → Privacidade e Segurança → Limpar Dados
3. Selecionar:
   - [ ] Cookies
   - [ ] Cache
   - [ ] Arquivos em cache
   - [ ] Intervalo: "Todos os tempos"
4. [ ] Clicar "Limpar"

### Recarregar Site
- [ ] Ir para seu site: `https://seu-site/admin.html`
- [ ] Pressionar **Ctrl + F5** (força recarregar sem cache)
- [ ] Ou **Ctrl + Shift + R**
- [ ] Aguardar carregar completamente

---

## 🧪 Passo 3: Teste 1 - Criar Novo Produto

### Preparação
- [ ] Admin panel aberto (`/admin.html`)
- [ ] Console aberto (F12)
- [ ] Console limpo (Ctrl + L ou clique direito → Clear)

### Executar Teste
1. [ ] Clique no botão **"➕ Adicionar Produto"**
2. [ ] Preencha os campos:
   - [ ] Nome: "Banana Teste"
   - [ ] Preço: "5.50"
   - [ ] Descrição: "Banana nanica para teste"
   - [ ] Imagem: (cole uma URL válida ou selecione arquivo)
3. [ ] Selecione múltiplas unidades:
   - [ ] Marque ☑️ **kg**
   - [ ] Marque ☑️ **un**
   - [ ] Deixe dúzia, bandeja, maço, litro, palma desmarcados
4. [ ] Verificar que aparece:
   - [ ] Texto "Unidades selecionadas: kg, un" ✅

### Salvar Produto
1. [ ] Clique **"💾 Salvar Produto"**
2. [ ] Aguarde **2-3 segundos**
3. [ ] Deve aparecer caixa verde: **"✅ Produto salvo com sucesso!"** ✅
4. [ ] Modal fecha automaticamente
5. [ ] Volta para lista de produtos

### Verificar Logs (CRÍTICO)
Abra console (F12 → Console) e procure por:

#### 🟠 Log LARANJA
```
📋 Unidades selecionadas: 
(2) ['kg', 'un']
```
- [ ] Aparece ✅
- [ ] Mostra ['kg', 'un'] (2 itens) ✅

#### 🟢 Log VERDE
```
💾 Dados sendo salvos:
{
  id: "prod_...",
  name: "Banana Teste",
  units: (2) ['kg', 'un'],
  ...
}
```
- [ ] Aparece ✅
- [ ] units tem 2 itens ✅
- [ ] Contém 'kg' e 'un' ✅

#### 🔵 Log CYAN
```
✅ Produtos carregados da API: X
...
📦 Produto recarregado:
{
  units: (2) ['kg', 'un'],
  ...
}
```
- [ ] Aparece ✅
- [ ] units está presente ✅
- [ ] Tem 2 items ✅

---

## 🔄 Passo 4: Teste 2 - Editar e Verificar

### Executar Teste
1. [ ] Console ainda aberto (F12)
2. [ ] Na lista de produtos, procure "Banana Teste"
3. [ ] Clique **"✏️ Editar"**
4. [ ] Modal abre com os dados do produto

### Verificar Checkboxes
**Crítico**: Você deve ver:
- [ ] ☑️ **kg** - MARCADO
- [ ] ☑️ **un** - MARCADO
- [ ] ☐ dúzia - desmarcado
- [ ] ☐ bandeja - desmarcado
- [ ] ☐ maço - desmarcado
- [ ] ☐ litro - desmarcado
- [ ] ☐ palma - desmarcado

Se viu os 2 checkboxes marcados ✅: **TESTE PASSOU!**

### Verificar Logs ao Abrir Edição
Procure no console por logs ROXOS:

```
📦 Dados do produto:
{
  units: (2) ['kg', 'un'],
  ...
}

📋 Array de unidades: (2) ['kg', 'un']

✅ Unidades a carregar: (2) ['kg', 'un']
  ✅ Marcado: kg
  ✅ Marcado: un
```
- [ ] Todos os logs aparecem ✅
- [ ] Nenhum "❌ NÃO ENCONTRADO" aparece ✅
- [ ] Mostra "✅ Marcado: kg" ✅
- [ ] Mostra "✅ Marcado: un" ✅

---

## ➕ Passo 5: Teste 3 - Modificar e Resalvar

### Executar Teste
1. [ ] Dentro do modal de edição
2. [ ] Desmarque **un** (deixe só kg marcado)
3. [ ] Marque **dúzia** (adicione nova unidade)
4. [ ] Deve mostrar: "Unidades selecionadas: kg, dúzia"
5. [ ] Clique **"💾 Salvar Produto"**
6. [ ] Aguarde mensagem de sucesso

### Verificar Nova Edição
1. [ ] Clique **"✏️ Editar"** novamente no mesmo produto
2. [ ] Deve mostrar:
   - [ ] ☑️ **kg** - MARCADO
   - [ ] ☐ **un** - desmarcado (removemos)
   - [ ] ☑️ **dúzia** - MARCADO (adicionamos)

**Se apareceu correto**: ✅ **TESTE PASSOU!**

---

## 🛒 Passo 6: Teste 4 - Fluxo de Compra

### Preparação
1. [ ] Abra seu site normalmente (não admin): `https://seu-site`
2. [ ] Procure pelo produto "Banana Teste" que criou

### Executar Teste
1. [ ] Clique **"Adicionar ao Carrinho"** no produto
2. [ ] Deve aparecer modal:
```
┌─────────────────────────┐
│  Selecione a unidade:   │
│  [ kg ]  [ dúzia ]      │
│  [ Cancelar ]           │
└─────────────────────────┘
```
3. [ ] Modal tem 2 botões: kg e dúzia ✅
4. [ ] Clique em **"kg"**
5. [ ] Modal de unidade fecha
6. [ ] Aparece modal de quantidade
7. [ ] Coloque quantidade: "2"
8. [ ] Clique **"Adicionar ao Carrinho"**
9. [ ] Produto entra no carrinho

### Verificar Carrinho
- [ ] Produto aparece como "Banana Teste (2 kg)"
  - [ ] Mostra quantidade ✅
  - [ ] Mostra unidade "kg" ✅
  - [ ] Mostra preço correto ✅

---

## 🔴 Se Algo Falhar

### Erro 1: "Erro ao listar produtos"
```
❌ Status: Backend offline ou erro na API
```
**Solução**:
1. [ ] Verificar status no Render (deve estar "Live")
2. [ ] Fazer redeploy novamente
3. [ ] Aguardar 3-5 minutos
4. [ ] Testar ping: curl https://quitanda-produtos-api.onrender.com

### Erro 2: "Só aparece 1 unidade"
```
❌ Status: Cache ou banco de dados desatualizado
```
**Solução**:
1. [ ] Limpar cache do navegador (Ctrl+Shift+Delete)
2. [ ] Fechar e reabrir navegador
3. [ ] Se Render: executar redeploy
4. [ ] Se local: restart do servidor Node

### Erro 3: "Logs não aparecem coloridos"
```
❌ Status: Código não foi carregado
```
**Solução**:
1. [ ] Forçar recarga: Ctrl+F5
2. [ ] Abrir Developer Tools: F12
3. [ ] Network: verificar se script.js tem status 200
4. [ ] Limpar cache do navegador

### Erro 4: "JSON.parse error no console"
```
❌ Status: Dados corrompidos ou formato inválido
```
**Solução**:
1. [ ] Recriar o produto
2. [ ] Se problema persistir: limpar tabela `produtos`
   ```sql
   DELETE FROM produtos WHERE units IS NOT NULL AND units != '';
   ```

### Erro 5: "Coluna 'units' não existe"
```
❌ Status: Banco de dados não foi atualizado
```
**Solução**:
1. [ ] Executar migration manualmente:
   ```sql
   ALTER TABLE produtos ADD COLUMN units TEXT;
   ```
2. [ ] Ou fazer redeploy que executará `initializeTables()`

---

## 📊 Resumo do Teste

| Teste | Esperado | Resultado |
|-------|----------|-----------|
| 1. Criar produto com 2 unidades | ✅ Salva com sucesso | ☐ Passou |
| 2. Logs aparecem no console | ✅ Laranja, Verde, Cyan | ☐ Passou |
| 3. Editar mostra 2 unidades | ✅ Ambas marcadas | ☐ Passou |
| 4. Modificar e resalvar | ✅ Reflete mudanças | ☐ Passou |
| 5. Fluxo de compra | ✅ Modal aparece | ☐ Passou |

---

## ✅ Conclusão

Todos os ✅ marcados?

### SIM ✅ 
```
🎉 BUG FIXADO COM SUCESSO!
Múltiplas unidades agora funcionam perfeitamente!
```

### NÃO ❌
```
⚠️ Revisar logs no console (F12)
Procure por mensagens em vermelho ou warnings em laranja
Se precisar de ajuda, compartilhe a mensagem de erro
```

---

## 📝 Logs para Copiar-Colar (se tiver problema)

Se precisar enviar logs, copie e cole:

### Teste 1: Criar Produto
```
1. Selecione 2 unidades
2. F12 → Console → Limpar (Ctrl+L)
3. Clique Salvar
4. Copie tudo que aparecer (Ctrl+A)
5. Cole em um arquivo de texto
```

### Teste 2: Editar Produto
```
1. F12 → Console → Limpar (Ctrl+L)
2. Clique Editar
3. Copie tudo que aparecer
4. Cole em um arquivo de texto
```

---

**Status**: 🚀 Pronto para teste completo!

Qualquer dúvida, os logs no console (F12) mostrarão exatamente onde está o problema! 🎯
