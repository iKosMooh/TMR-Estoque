import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Tipos para dados XML
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

interface OFXTransaction {
  TRNTYPE: string;
  DTPOSTED: string;
  TRNAMT: string;
  FITID: string;
  CHECKNUM?: string;
  REFNUM?: string;
  MEMO?: string;
}

interface ProductData {
  internalCode?: string;
  barcode?: string;
  name?: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  salePrice: number;
  quantity: number;
}

interface PreviewItem extends ProductData {
  existing: typeof products.$inferSelect | null;
  action: 'create' | 'update';
}

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
    let items: (NFeItem | PurchaseOrderItem | OFXTransaction)[] = [];
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
    } else if (parsed.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
      // Arquivo OFX (extrato bancário) - NÃO SUPORTADO para importação de produtos
      return NextResponse.json({
        error: 'Arquivo OFX detectado. Este sistema importa apenas produtos de NF-e brasileiro ou XML de Purchase Orders. Arquivos OFX (extratos bancários) não contêm dados de produtos.',
        supportedFormats: ['NF-e (brasileiro)', 'Purchase Orders (genérico)'],
        detectedType: 'OFX (extrato bancário)'
      }, { status: 400 });
    } else {
      // Tentar detectar outros formatos comuns
      const content = xmlContent.toLowerCase();
      if (content.includes('<ofx>')) {
        return NextResponse.json({
          error: 'Arquivo OFX detectado, mas formato não suportado para importação de produtos. Use apenas arquivos NF-e ou XML de produtos.',
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

    // Processar prévia dos itens
    const previewItems: PreviewItem[] = [];
    const existingProducts = new Map();

    for (const item of items) {
      let productData: Omit<PreviewItem, 'existing' | 'action'> = {
        salePrice: 0,
        quantity: 0
      };

      if (xmlType === 'NF-e') {
        // Processar NF-e brasileiro
        const nfeItem = item as NFeItem;
        const prod = nfeItem.prod;
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
        const poItem = item as PurchaseOrderItem;
        productData = {
          internalCode: poItem.PartNumber || poItem.PartNum,
          barcode: poItem.PartNumber || poItem.PartNum,
          name: poItem.ProductName || poItem.ProductID,
          salePrice: parseFloat(poItem.USPrice || poItem.Price || '0') || 0,
          quantity: parseInt(poItem.Quantity || poItem.Qty || '0') || 0
        };
      }

      // Verificar se produto já existe
      let existingProduct = null;
      if (productData.barcode && existingProducts.has(productData.barcode)) {
        existingProduct = existingProducts.get(productData.barcode);
      } else if (productData.barcode) {
        existingProduct = await db
          .select()
          .from(products)
          .where(eq(products.barcode, productData.barcode as string))
          .limit(1);
        if (existingProduct && existingProduct.length > 0) {
          existingProducts.set(productData.barcode, existingProduct[0]);
        }
      }

      if (!existingProduct || existingProduct.length === 0) {
        // Verificar por código interno
        if (productData.internalCode && existingProducts.has(productData.internalCode)) {
          existingProduct = existingProducts.get(productData.internalCode);
        } else if (productData.internalCode) {
          existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.internalCode, productData.internalCode as string))
            .limit(1);
          if (existingProduct && existingProduct.length > 0) {
            existingProducts.set(productData.internalCode, existingProduct[0]);
          }
        }
      }

      previewItems.push({
        ...productData,
        existing: existingProduct && existingProduct.length > 0 ? existingProduct[0] : null,
        action: existingProduct && existingProduct.length > 0 ? 'update' : 'create'
      });
    }

    return NextResponse.json({
      xmlType,
      totalItems: items.length,
      previewItems,
      fileName: file.name
    });

  } catch (error) {
    console.error('Erro ao processar preview do XML:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}