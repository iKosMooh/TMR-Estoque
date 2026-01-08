import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { db } from '../../../../../lib/db';
import { products } from '../../../../../lib/schema';
import { eq, or, like } from 'drizzle-orm';

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

interface ExistingProduct {
  id: string;
  name: string;
  currentQuantity: number;
  internalCode: string;
  matchType: 'xmlCode' | 'barcode' | 'internalCode' | 'name';
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
    
    // Armazenar produtos já existentes para aviso de duplicatas
    const duplicateProducts: string[] = [];
    
    const previewItems = await Promise.all(
      items.map(async (det: XmlDet, index: number) => {
        const prod = det.prod?.[0];
        const xmlCode = prod?.cProd?.[0] || `item-${index}`;
        const barcode = prod?.cEAN?.[0] || null;
        const name = prod?.xProd?.[0] || 'Produto sem nome';
        const salePrice = parseFloat(prod?.vUnCom?.[0] || '0');
        const quantity = parseFloat(prod?.qCom?.[0] || '0');
        const ncm = prod?.NCM?.[0] || null;
        const cfop = det.infAdProd?.[0]?.CFOP?.[0] || null;
        const cst = det.imposto?.[0]?.ICMS?.[0]?.ICMS00?.[0]?.CST?.[0] || null;

        // Verificar se produto existe por:
        // 1. Código XML (xmlCode)
        // 2. Código de barras
        // 3. Código interno
        // 4. Nome do produto
        let existing: ExistingProduct | null = null;
        let matchType: 'xmlCode' | 'barcode' | 'internalCode' | 'name' | null = null;

        // 1. Buscar por código XML
        const byXmlCode = await db.select().from(products).where(eq(products.xmlCode, xmlCode)).limit(1);
        if (byXmlCode.length > 0) {
          existing = {
            id: byXmlCode[0].id,
            name: byXmlCode[0].name,
            currentQuantity: byXmlCode[0].qtdAtual,
            internalCode: byXmlCode[0].codigoInterno,
            matchType: 'xmlCode'
          };
          matchType = 'xmlCode';
        }

        // 2. Buscar por código de barras (se não encontrou)
        if (!existing && barcode && barcode !== 'SEM GTIN' && barcode.length > 3) {
          const byBarcode = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
          if (byBarcode.length > 0) {
            existing = {
              id: byBarcode[0].id,
              name: byBarcode[0].name,
              currentQuantity: byBarcode[0].qtdAtual,
              internalCode: byBarcode[0].codigoInterno,
              matchType: 'barcode'
            };
            matchType = 'barcode';
          }
        }

        // 3. Buscar por código interno
        if (!existing) {
          const byInternalCode = await db.select().from(products).where(eq(products.codigoInterno, xmlCode)).limit(1);
          if (byInternalCode.length > 0) {
            existing = {
              id: byInternalCode[0].id,
              name: byInternalCode[0].name,
              currentQuantity: byInternalCode[0].qtdAtual,
              internalCode: byInternalCode[0].codigoInterno,
              matchType: 'internalCode'
            };
            matchType = 'internalCode';
          }
        }

        // 4. Buscar por nome do produto (match exato ou parcial)
        if (!existing) {
          const byName = await db.select().from(products).where(eq(products.name, name)).limit(1);
          if (byName.length > 0) {
            existing = {
              id: byName[0].id,
              name: byName[0].name,
              currentQuantity: byName[0].qtdAtual,
              internalCode: byName[0].codigoInterno,
              matchType: 'name'
            };
            matchType = 'name';
          } else {
            // Busca parcial pelo nome
            const byNameLike = await db.select().from(products).where(like(products.name, `%${name}%`)).limit(1);
            if (byNameLike.length > 0) {
              existing = {
                id: byNameLike[0].id,
                name: byNameLike[0].name,
                currentQuantity: byNameLike[0].qtdAtual,
                internalCode: byNameLike[0].codigoInterno,
                matchType: 'name'
              };
              matchType = 'name';
            }
          }
        }

        // Determinar ação padrão
        const action = existing ? 'update' : 'create';
        
        // Adicionar à lista de duplicatas se encontrou
        if (existing) {
          duplicateProducts.push(name);
        }

        return {
          xmlCode,
          internalCode: xmlCode, // Usar código XML como interno por padrão
          barcode,
          name,
          ncm,
          cfop,
          cst,
          salePrice,
          costPrice: salePrice, // Preço do XML como custo
          quantity,
          existing: existing ? {
            id: existing.id,
            name: existing.name,
            currentQuantity: existing.currentQuantity,
            internalCode: existing.internalCode,
            matchType: existing.matchType
          } : null,
          action,
          isDuplicate: !!existing,
        };
      })
    );

    // Mensagem de duplicatas
    let duplicateMessage = null;
    if (duplicateProducts.length > 0) {
      duplicateMessage = `Os produtos: ${duplicateProducts.join(', ')} já existem. Deseja adicionar como novo lote ou criar um novo produto?`;
    }

    return NextResponse.json({
      xmlType: 'NF-e',
      totalItems: previewItems.length,
      previewItems,
      fileName: file.name,
      duplicateProducts,
      duplicateMessage,
      hasDuplicates: duplicateProducts.length > 0,
    });
  } catch (error) {
    console.error('Erro na preview:', error);
    return NextResponse.json({ error: 'Erro ao processar XML' }, { status: 500 });
  }
}