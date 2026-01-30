# 📚 GUIA DE DEPLOY NO RENDER

## 🎯 Objetivo
Deployar o `backend-produtos` (API de produtos com SQLite) no Render

---

## 📋 PASSO-A-PASSO

### 1️⃣ **Login no Render**
1. Acesse: https://render.com
2. Clique em **"Sign Up"**
3. Escolha **"Continue with Google"**
4. Use o email: `novacontadevini@gmail.com`
5. Senha: `VANEJUBR042023`

---

### 2️⃣ **Conectar GitHub ao Render**
1. Após login, vá para **Dashboard**
2. Clique em **"Connect GitHub"** ou **"Connect Git Repository"**
3. Autorize o Render a acessar sua conta GitHub (viniciusjardel)
4. Selecione o repositório: **`quitanda001`**

---

### 3️⃣ **Criar Novo Serviço (Web Service)**
1. No Dashboard, clique em **"New"** → **"Web Service"**
2. Selecione o repositório: **`quitanda001`**
3. Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `quitanda-produtos-api` |
| **Root Directory** | `backend-produtos` |
| **Runtime** | Node.js |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

4. Escolha o plano **"Free"** (opcional: você pode pagar depois)
5. Clique em **"Create Web Service"**

---

### 4️⃣ **Esperar o Deploy**
- O Render vai compilar automaticamente
- Você verá logs em tempo real
- Quando terminar, mostrará a URL gerada (algo como: `https://quitanda-produtos-api.onrender.com`)

---

### 5️⃣ **Copiar a URL da API**
Após o deploy bem-sucedido, você terá uma URL como:
```
https://quitanda-produtos-api.onrender.com
```

**IMPORTANTE:** Copie essa URL e atualize no arquivo `script-site.js`:

```javascript
const PRODUCTS_API_URL = 'https://quitanda-produtos-api.onrender.com';
```

---

### 6️⃣ **Testar a API**
Abra no navegador:
```
https://quitanda-produtos-api.onrender.com/produtos
```

Se retornar `[]` (array vazio) = ✅ **FUNCIONANDO!**

---

## ✅ Checklist Final

- [ ] Deploy concluído no Render
- [ ] URL da API copiada
- [ ] `script-site.js` atualizado com URL correta
- [ ] API retorna produtos (GET /produtos)
- [ ] Admin consegue criar produto (POST /produtos)
- [ ] Index.html carrega produtos (via API)

---

## 🚨 Possíveis Problemas

### ❌ "Build Command not found"
- Certifique-se que o `package.json` está em `backend-produtos/`
- Verifique se o "Root Directory" é `backend-produtos`

### ❌ "Cannot find module 'express'"
- Deletar arquivo `.gitignore` que bloqueia `node_modules` é **NORMAL**
- O Render vai executar `npm install` e criar novo `node_modules`

### ❌ API retorna erro 500
- Verifique os logs do Render
- Certifique-se que o `server.js` está correto

---

## 📞 URLs Importantes

- **Render Dashboard:** https://dashboard.render.com
- **GitHub Repo:** https://github.com/viniciusjardel/quitanda001
- **API Base:** `https://quitanda-produtos-api.onrender.com`
- **PIX Backend:** `https://pix-project.onrender.com` (já existente)

---

## 🎉 Pronto!
Depois que o deploy estiver live, você poderá:
1. ✅ Abrir `admin.html`
2. ✅ Criar um produto
3. ✅ Abrir `index.html`
4. ✅ Ver o produto aparecer automaticamente!

