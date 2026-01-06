import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { db } from '../../../../../lib/db';
import { products } from '../../../../../lib/schema';
import { eq, or } from 'drizzle-orm';

interface XmlDet {
  prod?: Array<{
    cProd?: string[];
    cEAN?: string[];
    xProd?: string[];
    vUnCom?: string[];
    qCom?: string[];
    NCM?: string[];
  }>;
  infAdProd?: Array<{
    CFOP?: string[];
  }>;
  imposto?: Array<{
    ICMS?: Array<{
      ICMS00?: Array<{
        CST?: string[];
      }>;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'Arquivo XML obrigatório' }, { status: 400 });

    const xmlContent = await file.text();
    const parsed = await parseStringPromise(xmlContent);
    // Assuma estrutura XML NF-e simplificada (ajuste conforme real)
    const items = parsed.nfeProc?.NFe?.[0]?.infNFe?.[0]?.det || [];
    const previewItems = await Promise.all(
      items.map(async (det: XmlDet, index: number) => {
        const prod = det.prod?.[0];
        const internalCode = prod?.cProd?.[0] || `item-${index}`;
        const barcode = prod?.cEAN?.[0] || null;
        const name = prod?.xProd?.[0] || 'Produto sem nome';
        const salePrice = parseFloat(prod?.vUnCom?.[0] || '0');
        const quantity = parseInt(prod?.qCom?.[0] || '0');
        const ncm = prod?.NCM?.[0] || null;
        const cfop = det.infAdProd?.[0]?.CFOP?.[0] || null;
        const cst = det.imposto?.[0]?.ICMS?.[0]?.ICMS00?.[0]?.CST?.[0] || null;

        // Verifique se produto existe
        const existing = await db.select().from(products).where(
          or(eq(products.codigoInterno, internalCode), barcode ? eq(products.barcode, barcode) : undefined)
        ).limit(1);
        const action = existing.length > 0 ? 'update' : 'create';

        return {
          internalCode,
          barcode,
          name,
          ncm,
          cfop,
          cst,
          salePrice,
          quantity,
          existing: existing.length > 0 ? { id: existing[0].id, currentQuantity: existing[0].qtdAtual } : null,
          action,
        };
      })
    );

    return NextResponse.json({
      xmlType: 'NF-e',
      totalItems: previewItems.length,
      previewItems,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Erro na preview:', error);
    return NextResponse.json({ error: 'Erro ao processar XML' }, { status: 500 });
  }
}