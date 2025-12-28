import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { db } from '@/lib/db';
import { products, movements, importLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface NFeItem {
  prod: {
    cProd: string;
    cEAN?: string;
    cBarra?: string;
    xProd: string;
    NCM?: string;
    CFOP?: string;
    cst?: string;
    vProd: string;
    qCom: string;
  };
}

interface PurchaseOrderItem {
  PartNumber?: string;
  PartNum?: string;
  ProductName?: string;
  ProductID?: string;
  USPrice?: string;
  Price?: string;
  Quantity?: string;
  Qty?: string;
}

interface ProductData {
  internalCode: string;
  barcode: string | null;
  name: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  salePrice: number;
  quantity: number;
}

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

    // Detectar tipo de XML automaticamente
    let items: (NFeItem | PurchaseOrderItem)[] = [];
    let xmlType = '';

    if (parsed.nfeProc?.NFe?.infNFe?.det || parsed.NFe?.infNFe?.det) {
      // NF-e brasileiro (pode estar dentro de nfeProc ou diretamente NFe)
      xmlType = 'NF-e';
      const infNFe = parsed.nfeProc?.NFe?.infNFe || parsed.NFe?.infNFe;
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
          items.push(...poItems.map((item: PurchaseOrderItem) => ({ ...item, purchaseOrder: po })));
        }
      }
    } else {
      // Tentar detectar outros formatos comuns
      const content = xmlContent.toLowerCase();
      if (content.includes('<ofx>') || content.includes('ofxheader')) {
        return NextResponse.json({ 
          error: 'Arquivo OFX detectado. Este sistema importa apenas produtos de NF-e brasileiro ou XML de Purchase Orders. Arquivos OFX são extratos bancários e não contêm dados de produtos.',
          supportedFormats: ['NF-e (brasileiro)', 'Purchase Orders (genérico)']
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: 'Formato de arquivo não suportado. São aceitos apenas arquivos XML de NF-e brasileiro ou Purchase Orders.',
        supportedFormats: ['NF-e (brasileiro)', 'Purchase Orders (genérico)'],
        detectedContent: content.substring(0, 200) + '...'
      }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item encontrado no XML' }, { status: 400 });
    }
    let processed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        let productData: ProductData;

        if (xmlType === 'NF-e') {
          // Processar NF-e brasileiro
          const prod = (item as NFeItem).prod;
          productData = {
            internalCode: prod.cProd,
            barcode: prod.cEAN || prod.cBarra || null,
            name: prod.xProd,
            ncm: prod.NCM,
            cfop: prod.CFOP,
            cst: prod.cst,
            salePrice: parseFloat(prod.vProd) || 0,
            quantity: parseInt(prod.qCom) || 0
          };
        } else if (xmlType === 'PurchaseOrders') {
          // Processar Purchase Orders genérico
          const poItem = item as PurchaseOrderItem;
          productData = {
            internalCode: poItem.PartNumber || poItem.PartNum || '',
            barcode: poItem.PartNumber || poItem.PartNum || null,
            name: poItem.ProductName || poItem.ProductID || '',
            salePrice: parseFloat(poItem.USPrice || poItem.Price || '0') || 0,
            quantity: parseInt(poItem.Quantity || poItem.Qty || '0') || 0
          };
        } else {
          continue; // Tipo não reconhecido, pular
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
          }).returning({ id: products.id });

          // Registrar movimento
          await db.insert(movements).values({
            productId: newProduct[0].id,
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