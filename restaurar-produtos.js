import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'https://quitanda-produtos-api.onrender.com';

// Ler o arquivo de backup
const backupPath = path.join(__dirname, 'BACKUP_PRODUTOS.json');
const backupContent = fs.readFileSync(backupPath, 'utf-8');
const backup = JSON.parse(backupContent);
const produtos = backup.backup_data.products;

console.log(`\n🚀 RESTAURANDO ${produtos.length} PRODUTOS...\n`);

let restaurados = 0;
let erros = 0;

// Restaurar produtos sequencialmente
for (const produto of produtos) {
  try {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: produto.id,
        name: produto.name,
        price: produto.price,
        image: produto.image,
        category: produto.category || 'Sem categoria',
        unit: produto.unit,
        color: produto.color,
        description: produto.description
      })
    });

    if (response.ok) {
      console.log(`✅ ${produto.name}`);
      restaurados++;
    } else {
      const error = await response.json();
      if (error.error?.includes('UNIQUE constraint failed')) {
        console.log(`⏭️  ${produto.name} (já existe)`);
        restaurados++;
      } else {
        console.error(`❌ ${produto.name}: ${error.error}`);
        erros++;
      }
    }
  } catch (error) {
    console.error(`❌ ${produto.name}: ${error.message}`);
    erros++;
  }
}

console.log(`\n📊 RESULTADO:`);
console.log(`   ✅ Restaurados: ${restaurados}`);
console.log(`   ❌ Erros: ${erros}`);
console.log(`   📦 Total esperado: ${produtos.length}\n`);

if (restaurados === produtos.length) {
  console.log('🎉 TODOS OS PRODUTOS FORAM RESTAURADOS COM SUCESSO!');
}
