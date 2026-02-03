# 📚 GUIA DE DEPLOY NO NETLIFY

## 🎯 Objetivo
Hospedar o frontend (HTML + CSS + JS) no Netlify

---

## 📋 PASSO-A-PASSO

### 1️⃣ **Login no Netlify**
1. Acesse: https://netlify.com
2. Clique em **"Sign up"**
3. Escolha **"Continue with GitHub"** (mais fácil!)
4. Autorize o Netlify acessar sua conta GitHub

---

### 2️⃣ **Deploy Automático (RECOMENDADO)**
1. Após login, clique em **"Add new site"** → **"Import an existing project"**
2. Selecione **GitHub** como provedor
3. Selecione o repositório: `quitanda001`
4. Configure:
   - **Base directory:** `frontend`
   - **Build command:** (deixe vazio - é estático!)
   - **Publish directory:** `frontend`
5. Clique em **"Deploy site"**

---

### 3️⃣ **Deploy Manual (ALTERNATIVA)**
Se preferir arrastar a pasta:

1. Vá para: https://app.netlify.com/drop
2. Arraste a pasta **`frontend/`** para a área de drop
3. Pronto! URL gerada automaticamente

---

### 4️⃣ **Configurar Domínio Customizado** (Opcional)
1. No Dashboard do site, clique em **"Domain settings"**
2. Clique em **"Options"** → **"Edit site name"**
3. Escolha um nome (ex: `quitanda-villa-natal`)
4. URL final: `quitanda-villa-natal.netlify.app`

---

## ✅ Checklist Final

- [ ] Deploy concluído no Netlify
- [ ] Site aberto e funcionando
- [ ] Admin panel acessível
- [ ] Loja carregando produtos da API
- [ ] PIX integration funcionando

---

## 📞 URLs Finais

Depois do deploy você terá:
- **Frontend:** `https://seu-site.netlify.app`
- **Admin:** `https://seu-site.netlify.app/admin.html`
- **API Produtos:** `https://quitanda-produtos-api.onrender.com`
- **API PIX:** `https://pix-project.onrender.com`

---

## 🎉 Pronto!
Seu site está live! 🚀

Compartilhe a URL com clientes e comece a receber pedidos!

---

## 🔄 Atualizações Futuras
Sempre que você der `git push`:
1. Netlify detecta mudanças automaticamente
2. Redeploy acontece em ~30 segundos
3. Site atualizado sem intervenção!

