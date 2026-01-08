import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productBatches } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

// GET: Exportar estoque para Excel
export async function GET() {
  try {
    const productList = await db.select().from(products);
    const allBatches = await db.select().from(productBatches);

    // Preparar dados para exportação
    const exportData = productList.map(p => {
      const productBatchesList = allBatches.filter(b => b.productId === p.id);
      const totalQuantity = productBatchesList.length > 0 
        ? productBatchesList.reduce((sum, b) => sum + b.quantityRemaining, 0) 
        : p.qtdAtual;

      return {
        'ID': p.id,
        'Código Interno': p.codigoInterno,
        'Código XML': p.xmlCode || '',
        'Código de Barras': p.barcode || '',
        'Nome': p.name,
        'Descrição': p.description || '',
        'Preço de Custo': parseFloat(p.precoCusto || '0'),
        'Preço de Venda': parseFloat(p.precoVenda || '0'),
        'Quantidade Atual': totalQuantity,
        'Estoque Baixo Limite': p.estoqueBaixoLimite,
        'NCM': p.ncm || '',
        'CFOP Entrada': p.cfopEntrada || '',
        'CST': p.cst || '',
        'SKU': p.sku || '',
        'Peso (kg)': p.weight ? parseFloat(p.weight) : '',
        'Comprimento (cm)': p.length ? parseFloat(p.length) : '',
        'Largura (cm)': p.width ? parseFloat(p.width) : '',
        'Altura (cm)': p.height ? parseFloat(p.height) : '',
        'Marca': p.brandName || '',
        'Fabricante': p.manufacturer || '',
        'Tipo de Produto': p.productType || 'simple',
        'Unidades por Embalagem': p.unitsPerPackage || 1,
        'Nome da Unidade': p.unitName || 'Unidade',
        'Nome da Embalagem': p.packageName || 'Caixa',
        'Vende por Unidade': p.sellByUnit === 1 ? 'Sim' : 'Não',
        'Preço Unitário': p.unitPrice ? parseFloat(p.unitPrice) : '',
        'Data Última Compra': p.dataUltimaCompra || '',
        'Criado Em': p.createdAt,
        'Atualizado Em': p.updatedAt,
      };
    });

    // Preparar dados dos lotes
    const batchesData = allBatches.map(b => {
      const product = productList.find(p => p.id === b.productId);
      return {
        'ID Lote': b.id,
        'ID Produto': b.productId,
        'Nome Produto': product?.name || '',
        'Código Interno Produto': product?.codigoInterno || '',
        'Código XML': b.xmlCode || '',
        'Data da Compra': b.purchaseDate,
        'Preço de Custo': parseFloat(b.costPrice || '0'),
        'Preço de Venda': parseFloat(b.sellingPrice || '0'),
        'Quantidade Recebida': b.quantityReceived,
        'Quantidade Restante': b.quantityRemaining,
        'Referência XML': b.xmlReference || '',
        'Observação': b.observation || '',
        'Unidades por Embalagem': b.unitsPerPackage || 1,
      };
    });

    // Criar workbook com duas abas
    const workbook = XLSX.utils.book_new();
    
    const productsSheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');
    
    const batchesSheet = XLSX.utils.json_to_sheet(batchesData);
    XLSX.utils.book_append_sheet(workbook, batchesSheet, 'Lotes');

    // Gerar buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Retornar como arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=estoque_${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar estoque:', error);
    return NextResponse.json({ error: 'Erro ao exportar estoque' }, { status: 500 });
  }
}

// POST: Importar estoque de Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo Excel obrigatório' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Processar aba de produtos
    const productsSheetName = workbook.SheetNames.find((name: string) => 
      name.toLowerCase().includes('produto')
    ) || workbook.SheetNames[0];
    
    const productsSheet = workbook.Sheets[productsSheetName];
    const productsData = XLSX.utils.sheet_to_json(productsSheet) as Record<string, unknown>[];

    for (const row of productsData) {
      try {
        const internalCode = String(row['Código Interno'] || '').trim();
        const name = String(row['Nome'] || '').trim();
        
        if (!internalCode || !name) {
          results.errors.push(`Linha ignorada: código interno ou nome vazio`);
          continue;
        }

        // Verificar se produto existe
        const existing = await db.select().from(products).where(eq(products.codigoInterno, internalCode));

        const productData = {
          codigoInterno: internalCode,
          xmlCode: row['Código XML'] ? String(row['Código XML']) : null,
          barcode: row['Código de Barras'] ? String(row['Código de Barras']) : null,
          name: name,
          description: row['Descrição'] ? String(row['Descrição']) : null,
          precoCusto: String(row['Preço de Custo'] || '0'),
          precoVenda: String(row['Preço de Venda'] || '0'),
          qtdAtual: Number(row['Quantidade Atual']) || 0,
          estoqueBaixoLimite: Number(row['Estoque Baixo Limite']) || 5,
          ncm: row['NCM'] ? String(row['NCM']) : null,
          cfopEntrada: row['CFOP Entrada'] ? String(row['CFOP Entrada']) : null,
          cst: row['CST'] ? String(row['CST']) : null,
          sku: row['SKU'] ? String(row['SKU']) : null,
          weight: row['Peso (kg)'] ? String(row['Peso (kg)']) : null,
          length: row['Comprimento (cm)'] ? String(row['Comprimento (cm)']) : null,
          width: row['Largura (cm)'] ? String(row['Largura (cm)']) : null,
          height: row['Altura (cm)'] ? String(row['Altura (cm)']) : null,
          brandName: row['Marca'] ? String(row['Marca']) : null,
          manufacturer: row['Fabricante'] ? String(row['Fabricante']) : null,
          productType: (row['Tipo de Produto'] === 'marketplace' ? 'marketplace' : 'simple') as 'simple' | 'marketplace',
          unitsPerPackage: Number(row['Unidades por Embalagem']) || 1,
          unitName: row['Nome da Unidade'] ? String(row['Nome da Unidade']) : 'Unidade',
          packageName: row['Nome da Embalagem'] ? String(row['Nome da Embalagem']) : 'Caixa',
          sellByUnit: row['Vende por Unidade'] === 'Sim' ? 1 : 0,
          unitPrice: row['Preço Unitário'] ? String(row['Preço Unitário']) : null,
        };

        if (existing.length > 0) {
          // Atualizar produto existente
          await db.update(products).set(productData).where(eq(products.id, existing[0].id));
          results.updated++;
        } else {
          // Criar novo produto
          const productId = crypto.randomUUID();
          await db.insert(products).values({
            id: productId,
            ...productData,
            qtdEntradaTotal: productData.qtdAtual,
            qtdSaidaTotal: 0,
            dataUltimaCompra: new Date().toISOString().split('T')[0],
          });

          // Criar lote inicial
          if (productData.qtdAtual > 0) {
            await db.insert(productBatches).values({
              id: crypto.randomUUID(),
              productId,
              purchaseDate: new Date().toISOString().split('T')[0],
              costPrice: productData.precoCusto,
              sellingPrice: productData.precoVenda,
              quantityReceived: productData.qtdAtual,
              quantityRemaining: productData.qtdAtual,
              xmlReference: 'Excel Import',
            });
          }
          results.created++;
        }
      } catch (rowError) {
        results.errors.push(`Erro ao processar linha: ${rowError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída: ${results.created} criados, ${results.updated} atualizados`,
      results,
    });
  } catch (error) {
    console.error('Erro ao importar estoque:', error);
    return NextResponse.json({ error: 'Erro ao importar estoque' }, { status: 500 });
  }
}
