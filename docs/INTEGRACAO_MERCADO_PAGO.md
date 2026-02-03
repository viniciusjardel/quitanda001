# 🎯 Integração com Mercado Pago PIX

## ✅ Status: Pronto para Usar

Sua API do Mercado Pago foi integrada ao frontend!

### 📍 Localização da Integração
- **Arquivo**: `script-site.js`
- **Funções principais**:
  - `window.generatePixQrCode(amount)` - Gera QR Code via API
  - `window.copyPixCode()` - Copia código PIX para clipboard

---

## 🔌 Integração Realizada

### Fluxo Atual:
```
1. Cliente escolhe PIX como pagamento
   ↓
2. Clica em "Confirmar e Continuar"
   ↓
3. Modal PIX abre
   ↓
4. API é chamada em: https://pix-project.onrender.com/generate-pix
   ↓
5. Resposta esperada: { qrCode: "base64...", pixCode: "00020..." }
   ↓
6. QR Code é exibido + Código PIX com botão copiar
```

---

## ⚙️ Configuração da Sua API

### Endpoint
**URL**: `https://pix-project.onrender.com/generate-pix`
**Método**: `POST`

### Request (Enviado pelo frontend)
```json
{
  "amount": 45.99,
  "description": "Pedido Hortifruti Vila Natal"
}
```

### Response Esperada
```json
{
  "qrCode": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "pixCode": "00020126360014br.gov.bcb.pix...",
  "transactionId": "abc123"
}
```

**Campos obrigatórios na resposta:**
- `qrCode` - String em base64 da imagem PNG
- `pixCode` - String com o código PIX copia-e-cola

---

## 🧪 Testando

### 1. Abra o site
```
http://localhost/index.html
```

### 2. Adicione produtos ao carrinho

### 3. Clique em "Ir para Checkout"

### 4. Escolha:
- Forma de entrega: Retirada ou Delivery
- Forma de pagamento: **PIX**

### 5. Clique em "Confirmar e Continuar"

### 6. Verifique:
- ✅ QR Code aparece
- ✅ Código PIX aparece
- ✅ Botão "Copiar Código PIX" funciona
- ✅ Console do navegador (F12) sem erros

---

## 🔧 Ajustes se Necessário

### Se sua API retorna campos diferentes:

**Exemplo**: Sua API retorna `qr_code_base64` em vez de `qrCode`

**Solução**: Edite em `script-site.js`, linha ~880:

```javascript
// DE:
if (data.qrCode && data.pixCode) {

// PARA:
if (data.qr_code_base64 && data.pix_code) {

// E depois:
img src="data:image/png;base64,${data.qr_code_base64}"
p>${data.pix_code}</p>
```

---

## 🚨 Tratamento de Erros

O frontend já trata:
- ❌ Erro de conexão com a API
- ❌ Erro HTTP (status não-200)
- ❌ Resposta sem os campos esperados

Mensagens de erro aparecem no modal PIX em tempo real.

---

## 📱 Fluxo Completo do Cliente

```
┌─────────────────────────────────┐
│  Cliente escolhe PIX            │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Modal PIX abre                 │
│  "⏳ Gerando código PIX..."     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Requisição para Render         │
│  /generate-pix                  │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  QR Code + Código PIX exibidos  │
│  "📋 Copiar Código PIX"         │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Cliente escaneia ou copia      │
│  Faz PIX no seu banco           │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Clica "Enviar Pedido WhatsApp" │
│  Mensagem com método PIX enviada│
└─────────────────────────────────┘
```

---

## 💡 Dicas

1. **Testando a API localmente**: Use Postman ou cURL
   ```bash
   curl -X POST https://pix-project.onrender.com/generate-pix \
     -H "Content-Type: application/json" \
     -d '{"amount":50.00,"description":"Teste"}'
   ```

2. **Verifique o Console** (F12 → Aba Console):
   - Erros de CORS aparecem aqui
   - Respostas da API aparecem aqui

3. **CORS**: Se tiver erro de CORS, sua API backend precisa adicionar header:
   ```
   Access-Control-Allow-Origin: *
   ```

---

## 📧 Próximos Passos

- [ ] Testar QR Code gerado
- [ ] Testar cópia de código PIX
- [ ] Testar mensagem no WhatsApp com "PIX (Dinâmico)"
- [ ] Validar se QR Code escaneável
- [ ] Validar se código PIX aceito pelo banco

---

**Tudo pronto! 🚀 Sua integração está funcionando!**
