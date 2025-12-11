import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { db } from '@/lib/db';
import { products, movements, importLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    const xmlContent = await file.text();
    const parsed = parser.parse(xmlContent);

    // Detectar tipo de XML
    let items: any[] = [];
    let xmlType = '';

    if (parsed.NFe?.infNFe?.det) {
      // NF-e brasileiro
      xmlType = 'NF-e';
      const infNFe = parsed.NFe.infNFe;
      const det = infNFe.det;
      items = Array.isArray(det) ? det : [det];
    } else if (parsed.PurchaseOrders?.PurchaseOrder) {
      // XML de exemplo genérico
      xmlType = 'PurchaseOrders';
      const purchaseOrders = Array.isArray(parsed.PurchaseOrders.PurchaseOrder) 
        ? parsed.PurchaseOrders.PurchaseOrder 
        : [parsed.PurchaseOrders.PurchaseOrder];
      
      // Extrair itens de todas as purchase orders
      for (const po of purchaseOrders) {
        if (po.Items?.Item) {
          const poItems = Array.isArray(po.Items.Item) ? po.Items.Item : [po.Items.Item];
          items.push(...poItems.map((item: any) => ({ ...item, purchaseOrder: po })));
        }
      }
    } else {
      return NextResponse.json({ 
        error: 'Estrutura XML inválida. Esperado: NF-e brasileiro ou XML de Purchase Orders',
        supportedFormats: ['NF-e (brasileiro)', 'Purchase Orders (genérico)']
      }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item encontrado no XML' }, { status: 400 });
    }
    let processed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        let productData: any = {};

        if (xmlType === 'NF-e') {
          // Processar NF-e brasileiro
          const prod = item.prod;
          productData = {
            internalCode: prod.cProd,
            barcode: prod.cEAN || prod.cBarra,
            name: prod.xProd,
            ncm: prod.NCM,
            cfop: prod.CFOP,
            cst: prod.cst,
            salePrice: parseFloat(prod.vProd) || 0,
            quantity: parseInt(prod.qCom) || 0
          };
        } else if (xmlType === 'PurchaseOrders') {
          // Processar Purchase Orders genérico
          productData = {
            internalCode: item.PartNumber || item.PartNum,
            barcode: item.PartNumber || item.PartNum,
            name: item.ProductName || item.ProductID,
            salePrice: parseFloat(item.USPrice || item.Price) || 0,
            quantity: parseInt(item.Quantity || item.Qty) || 0
          };
        }

        // Procurar produto existente por barcode ou código interno
        let existingProduct = null;
        if (productData.barcode) {
          existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.barcode, productData.barcode))
            .limit(1);
        }
        if (!existingProduct || existingProduct.length === 0) {
          existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.internalCode, productData.internalCode))
            .limit(1);
        }

        if (existingProduct && existingProduct.length > 0) {
          // Atualizar produto existente
          const product = existingProduct[0];
          await db
            .update(products)
            .set({
              totalEntry: product.totalEntry + productData.quantity,
              currentQuantity: product.currentQuantity + productData.quantity,
              costPrice: productData.salePrice.toString(),
              lastPurchaseDate: new Date(),
              ncm: productData.ncm || product.ncm,
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id));

          // Registrar movimento de entrada
          await db.insert(movements).values({
            productId: product.id,
            type: 'entrada',
            quantity: productData.quantity,
            unitPrice: productData.salePrice,
            date: new Date(),
            reference: `Import XML - ${file.name}`,
          });
        } else {
          // Criar novo produto
          const internalCode = productData.internalCode || `SKU-${Date.now()}-${processed}`;
          const newProduct = await db.insert(products).values({
            internalCode,
            barcode: productData.barcode,
            name: productData.name,
            salePrice: (productData.salePrice * 1.2).toString(), // markup simples
            costPrice: productData.salePrice.toString(),
            totalEntry: productData.quantity,
            currentQuantity: productData.quantity,
            lastPurchaseDate: new Date(),
            ncm: productData.ncm,
            cfopEntry: productData.cfop,
            cst: productData.cst,
          });

          // Buscar o produto recém-criado
          const createdProduct = await db.select().from(products).where(eq(products.barcode, productData.barcode)).limit(1);

          // Registrar movimento
          await db.insert(movements).values({
            productId: createdProduct[0].id,
            type: 'entrada',
            quantity: productData.quantity,
            unitPrice: productData.salePrice,
            date: new Date(),
            reference: `Import XML - ${file.name}`,
          });
        }

        processed++;
      } catch (itemError) {
        errors.push(`Erro no item ${processed + 1}: ${itemError}`);
      }
    }

    // Registrar log de import
    await db.insert(importLogs).values({
      fileName: file.name,
      totalItems: processed,
      errors: errors.length > 0 ? errors.join('; ') : null,
    });

    return NextResponse.json({
      message: 'Import concluído',
      processed,
      errors,
    });
  } catch (error) {
    console.error('Erro no import:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}