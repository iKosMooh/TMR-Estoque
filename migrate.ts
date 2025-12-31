import 'dotenv/config';
import { db } from './src/lib/db';
import { products, productBatches, movements } from './src/lib/schema';
import { eq } from 'drizzle-orm';

async function migrate() {
  console.log('Iniciando migração...');
  const allProducts = await db.select().from(products);
  let migrated = 0;

  for (const p of allProducts) {
    const existingBatches = await db.select().from(productBatches).where(eq(productBatches.productId, p.id));
    if (existingBatches.length === 0 && p.currentQuantity > 0) {
      // Criar lote para quantidade antiga
      const batchId = crypto.randomUUID();
      await db.insert(productBatches).values({
        id: batchId,
        productId: p.id,
        purchaseDate: p.lastPurchaseDate || new Date(),
        costPrice: p.costPrice,
        sellingPrice: p.salePrice,
        quantityReceived: p.currentQuantity,
        quantityRemaining: p.currentQuantity,
        xmlReference: 'Migracao Antiga',
      });
      // Criar movimento de entrada
      await db.insert(movements).values({
        id: crypto.randomUUID(),
        produtoId: p.id,
        tipo: 'entrada',
        quantidade: p.currentQuantity,
        precoUnitario: p.costPrice,
        data: new Date(),
        referencia: 'Migracao Antiga',
      });
      migrated++;
      console.log(`Migrado produto ${p.name} com ${p.currentQuantity} unidades.`);
    }
  }

  console.log(`Migração concluída. ${migrated} produtos migrados com movimentos.`);
}

migrate().catch(console.error);
