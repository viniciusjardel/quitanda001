# 🔍 Descobrir Parâmetros da API /pix

## 📍 Endpoint Atualizado
```
POST https://pix-project.onrender.com/pix
```

---

## 🧪 Teste 1: Com cURL (Terminal/PowerShell)

### Windows PowerShell:
```powershell
$body = @{
    amount = 50.00
    description = "Teste Hortifruti"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://pix-project.onrender.com/pix" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Linux/Mac (Terminal):
```bash
curl -X POST https://pix-project.onrender.com/pix \
  -H "Content-Type: application/json" \
  -d '{"amount":50.00,"description":"Teste Hortifruti"}'
```

---

## 🧪 Teste 2: Com Postman

1. **Abra Postman** (ou instale em postman.com)
2. **Crie nova requisição**:
   - Método: **POST**
   - URL: `https://pix-project.onrender.com/pix`
3. **Aba Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
4. **Aba Body** → Raw → JSON:
```json
{
  "amount": 50.00,
  "description": "Teste Hortifruti"
}
```
5. **Clique Send** e observe a resposta

---

## 🧪 Teste 3: No Navegador (Console)

1. **Abra o site**: http://localhost/index.html
2. **Pressione F12** → Aba **Console**
3. **Cola este código**:

```javascript
fetch('https://pix-project.onrender.com/pix', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({amount: 50.00, description: 'Teste'})
})
.then(r => r.json())
.then(data => {
    console.log('=== RESPOSTA COMPLETA ===');
    console.log(data);
    console.log('=== FIM ===');
})
.catch(e => console.error('Erro:', e))
```

---

## 📊 O Que Procurar

### Procure pelos campos que sua API retorna:

#### Opção 1: QR Code em Base64
```json
{
  "qrCode": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...",
  "pixCode": "00020126360014br.gov.bcb.pix..."
}
```
✅ Se parecer assim → Use como está!

---

#### Opção 2: QR Code como URL
```json
{
  "qrCodeUrl": "https://api.example.com/qr/abc123.png",
  "pixCode": "00020126360014br.gov.bcb.pix..."
}
```
⚠️ Se for assim → Preciso ajustar o código

---

#### Opção 3: Nomes diferentes de campos
```json
{
  "qr_code": "iVBORw0KGgoAAAA...",
  "qr": "iVBORw0KGgoAAAA...",
  "code": "00020126360014br...",
  "pix": "00020126360014br...",
  "pixdata": {...},
  "transactionId": "abc123"
}
```
⚠️ Se tiver nomes diferentes → Vou ajustar

---

## 🔧 Depois de Descobrir

Quando souber a estrutura, me avise:

**Exemplo de resposta:**
```json
{
  "qr_code_url": "https://...",
  "pix_key": "00020126...",
  "transaction_id": "xyz789"
}
```

**Então você me fala:**
- Quais são os nomes dos campos (qr_code_url, pix_key, etc)
- Se qr_code é base64 ou URL
- Qualquer outro campo importante

**E eu ajusto o código em 2 minutos! ⚡**

---

## 📸 Esperado Quando Funcionar

Após escolher PIX, você verá:

```
┌────────────────────────┐
│  ⏳ Gerando PIX...    │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  [QR CODE]             │
│  ███████████           │
│  ███████████           │
│  ███████████           │
└────────────────────────┘
┌────────────────────────┐
│ Código PIX:            │
│ 00020126360014br...    │
│ 📋 Copiar Código PIX   │
└────────────────────────┘
```

---

## 💡 Dicas

- **Console (F12)** mostra tudo que a API retorna
- **Copie a resposta completa** e me envie para ajustar
- Se erro → Aparece mensagem em vermelho no site
- Se erro de CORS → Aparece no console do F12

**Mande a resposta quando testar! 🚀**
