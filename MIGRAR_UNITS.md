# 🔧 MIGRAÇÃO: Adicionar Coluna 'units'

## ⚡ Solução Rápida (2 minutos)

### Passo 1: Abra o Render Dashboard
👉 https://dashboard.render.com

### Passo 2: Clique no PostgreSQL
- Procure por: **quitanda-db** (seu banco de dados)
- Clique para abrir

### Passo 3: Execute o Comando

**Copie e cole este comando no terminal psql:**

```sql
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS units TEXT;
```

---

## 📋 Outras Opções

### Opção A: Via Query Editor (Mais Fácil)

1. No dashboard do Render, banco quitanda-db
2. Procure por **"Query Editor"** ou **"SQL Editor"**
3. Cole o comando acima
4. Clique "Run"

### Opção B: Via Linha de Comando

No seu terminal (PowerShell):

```powershell
psql "postgresql://quitanda_db_user:SENHA@dpg-d5ualie3jp1c73cp2nug-a/quitanda_db" -c "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS units TEXT;"
```

(Substituir SENHA pela senha do PostgreSQL)

### Opção C: Via DBeaver

Se tiver instalado:
1. Nova conexão com credenciais do Render
2. Execute o SQL

---

## ✅ Como Verificar que Funcionou

Após executar, rode este comando:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name='produtos' ORDER BY ordinal_position;
```

Deve aparecer a coluna `units` na lista! ✅

---

## 🎯 Depois de Executar

1. Volta para o admin panel
2. Edita um produto
3. Seleciona 2 unidades (kg + un)
4. Salva → **Deve funcionar agora!** ✅

---

**Precisa de ajuda?** Me avisa qual opção você conseguiu executar!
