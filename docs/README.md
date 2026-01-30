# 🍎 Hortifruti Villa Natal - Sistema Web

Loja online de produtos frescos com **sincronização em tempo real** entre painel administrativo e site do cliente.

## 🚀 Início Rápido

### Arquivos principais

| Arquivo | Função |
|---------|--------|
| `index.html` | Site do cliente (produtos e carrinho) |
| `admin.html` | Painel administrativo (adicionar/editar produtos) |
| `script.js` | Lógica do painel admin |
| `script-site.js` | Lógica do site do cliente |
| `styles.css` | Estilos visuais |

### Como usar

1. **Abra duas abas no navegador:**
   - Aba 1: `admin.html` (Painel Admin)
   - Aba 2: `index.html` (Site)

2. **No Admin:**
   - Clique `➕ Novo Produto`
   - Preencha nome, preço, descrição, imagem
   - Clique `💾 Salvar Produto`

3. **No Site:**
   - ✨ Produto aparece **instantaneamente** em tempo real!
   - Nenhum recarregamento necessário

## ✨ Recursos

- ✅ **Sincronização em tempo real** entre admin e site
- ✅ **Sem banco de dados** - usa apenas localStorage do navegador
- ✅ **Compatível com mobile** (iOS e Android)
- ✅ **Carrinho de compras** integrado
- ✅ **Painel de debug** para verificar status
- ✅ **Design responsivo** com Tailwind CSS
- ✅ **Múltiplas camadas de armazenamento** para máxima confiabilidade

## 🔄 Como Funciona a Sincronização

### Camadas de Armazenamento (em prioridade):

1. **localStorage** → Armazenamento permanente do navegador
2. **sessionStorage** → Fallback para iOS Safari
3. **window.name** → Compatibilidade entre abas
4. **postMessage** → Comunicação entre janelas
5. **SAMPLE_PRODUCTS** → Produtos padrão embutidos

### Quando Admin salva:
```
Admin salva → localStorage + sessionStorage + window.name
                    ↓
            Evento de sincronização disparado
                    ↓
            Site detecta mudança → Recarrega produtos
                    ↓
            Novo produto aparece em tempo real!
```

## 📱 Compatibilidade

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome | ✅ Total | ✅ Total |
| Firefox | ✅ Total | ✅ Total |
| Safari | ✅ Total | ⚠️ Parcial* |
| Edge | ✅ Total | ✅ Total |

*Safari no iOS tem limitações de localStorage, mas sincroniza via postMessage

## 🎯 Próximas Melhorias

- [ ] Integração com WhatsApp para pedidos
- [ ] Histórico de compras do cliente
- [ ] Sistema de cupons e promoções
- [ ] Controle de estoque
- [ ] Notificações push

## 📞 Contato

Hortifruti Villa Natal
📍 Av. General Manoel Rabelo, 1725 - Jabotão
📱 WhatsApp: [número]
🕐 SEG-DOM • 08h00 às 19h00

---

**Para mais detalhes sobre sincronização, veja [GUIA_SINCRONIZACAO.md](GUIA_SINCRONIZACAO.md)**
