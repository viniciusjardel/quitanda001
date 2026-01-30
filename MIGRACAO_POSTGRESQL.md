# 🗄️ Guia de Migração: SQLite → PostgreSQL

## 📊 Por que PostgreSQL?

| Aspecto | SQLite | PostgreSQL |
|--------|--------|-----------|
| **Persistência** | ❌ Perdido ao reiniciar | ✅ Persiste em servidor |
| **Escalabilidade** | ❌ Limitado | ✅ Altamente escalável |
| **Render Free** | ❌ Perdido a cada 15min | ✅ Banco remoto permanente |
| **Custo Render** | Free | Free (até 256MB) |

---

## ✅ Passos para Migrar

### 1️⃣ Criar PostgreSQL Gratuito no Render

1. Acesse [Render.com](https://render.com)
2. Faça login com sua conta
3. Clique em **"+ New"** → **"PostgreSQL"**
4. Configuração:
   - **Name**: `quitanda-db`
   - **Region**: Brazil (São Paulo) / America (mais próximo)
   - **Database**: `quitanda`
   - **User**: `quitanda` (ou seu nome)
5. Clique **"Create Database"**
6. ⏳ Aguarde 2-3 minutos de provisionamento

### 2️⃣ Copiar Connection String

1. Após criar, vá em **"Connections"**
2. Copie a **External Database URL** (começa com `postgresql://`)
3. Salve em um lugar seguro

### 3️⃣ Atualizar Render Backend

1. Acesse seu serviço de backend no Render
2. Vá em **"Environment"**
3. Adicione nova variável:
   - **Key**: `DATABASE_URL`
   - **Value**: Cole a URL copiada (ex: `postgresql://quitanda:xxxxx@oregon-postgres.render.com/quitanda`)
4. Clique **"Save Changes"**

### 4️⃣ Deploy da Nova Versão

```bash
# No seu computador:
cd "Projeto Quitanda..."
git add -A
git commit -m "feat: migra para PostgreSQL com persistência"
git push origin master

# Render vai auto-deploy (2-3 min)
```

### 5️⃣ Verificar Conexão

Acesse sua API e teste:
```bash
curl https://quitanda-produtos-api.onrender.com/produtos
```

Deve retornar `[]` (array vazio)

---

## 🔄 Restaurar Dados do Backup (Opcional)

Se quiser restaurar os 38 produtos do backup:

```bash
cd "Projeto Quitanda..."
node restaurar-produtos.js
```

---

## 📋 Troubleshooting

### ❌ Erro: "Could not connect to database"
**Solução**: 
- Verifique se DATABASE_URL está correto no Render
- Aguarde 5 min após criar o banco PostgreSQL
- Tente reiniciar o serviço no Render

### ❌ Erro: "Network error"
**Solução**:
- Verifique a conexão com a internet
- PostgreSQL do Render pode estar em manutenção
- Tente em alguns minutos

### ✅ Sucesso!
- Dados agora **persistem**
- Sem mais perdas ao reiniciar
- Backend em produção está estável

---

## 📝 Próximos Passos

Seus dados agora:
- ✅ Persistem no Render PostgreSQL
- ✅ Sobrevivem a reinicializações
- ✅ Podem crescer até 256MB (gratuito)
- ✅ Estão seguros na cloud

🎉 **Parabéns! Seu sistema agora está robusto!**
