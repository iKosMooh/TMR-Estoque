import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { salesOrders, salesOrderItems, products, productBatches, posSessions, movements, customers, serviceOrders } from '@/lib/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Listar pedidos de venda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');
    
    let query = db.select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      customerId: salesOrders.customerId,
      customerName: sql<string>`COALESCE(${customers.name}, 'Cliente não definido')`,
      customerCpfCnpj: sql<string>`COALESCE(${customers.cpfCnpj}, 'N/A')`,
      subtotal: salesOrders.subtotal,
      discount: salesOrders.discount,
      total: salesOrders.total,
      paymentMethod: salesOrders.paymentMethod,
      status: salesOrders.status,
      notes: salesOrders.notes,
      createdAt: salesOrders.createdAt,
      sellerName: salesOrders.sellerName,
      sellerSignature: salesOrders.sellerSignature,
      // Campos de crediário
      isCreditSale: salesOrders.isCreditSale,
      creditDueDate: salesOrders.creditDueDate,
      creditStatus: salesOrders.creditStatus,
      // Vínculo com OS - campos individuais para depois construir o objeto
      serviceOrderId: salesOrders.serviceOrderId,
      serviceOrder_id: serviceOrders.id,
      serviceOrder_orderNumber: serviceOrders.orderNumber,
      serviceOrder_title: serviceOrders.title,
      serviceOrder_status: serviceOrders.status,
      serviceOrder_equipmentType: serviceOrders.equipmentType,
      serviceOrder_equipmentBrand: serviceOrders.equipmentBrand,
      serviceOrder_equipmentModel: serviceOrders.equipmentModel,
      serviceOrder_reportedIssue: serviceOrders.reportedIssue,
      serviceOrder_diagnosis: serviceOrders.diagnosis,
      serviceOrder_solution: serviceOrders.solution,
      serviceOrder_createdAt: serviceOrders.createdAt,
    }).from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(serviceOrders, eq(salesOrders.serviceOrderId, serviceOrders.id));
    
    if (status) {
      query = query.where(eq(salesOrders.status, status as 'pending' | 'completed' | 'cancelled')) as typeof query;
    }
    
    if (sessionId) {
      query = query.where(eq(salesOrders.posSessionId, sessionId)) as typeof query;
    }
    
    const rawOrders = await query.orderBy(desc(salesOrders.createdAt));
    
    // Transformar para incluir serviceOrder como objeto aninhado
    const orders = rawOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerCpfCnpj: order.customerCpfCnpj,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt,
      sellerName: order.sellerName,
      sellerSignature: order.sellerSignature,
      isCreditSale: order.isCreditSale,
      creditDueDate: order.creditDueDate,
      creditStatus: order.creditStatus,
      serviceOrderId: order.serviceOrderId,
      serviceOrder: order.serviceOrder_id ? {
        id: order.serviceOrder_id,
        orderNumber: order.serviceOrder_orderNumber,
        title: order.serviceOrder_title,
        status: order.serviceOrder_status,
        deviceType: order.serviceOrder_equipmentType,
        deviceBrand: order.serviceOrder_equipmentBrand,
        deviceModel: order.serviceOrder_equipmentModel,
        problemDescription: order.serviceOrder_reportedIssue,
        diagnosis: order.serviceOrder_diagnosis,
        solution: order.serviceOrder_solution,
        createdAt: order.serviceOrder_createdAt,
      } : null,
    }));
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao listar pedidos' }, { status: 500 });
  }
}

// POST - Criar novo pedido de venda (PDV)
export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Tipos do next-auth conflitantes, funciona em runtime
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id as string | undefined;
    // @ts-ignore
    const userName = session?.user?.name as string | undefined;
    // @ts-ignore
    const userEmail = session?.user?.email as string | undefined;
    
    const body = await request.json();
    
    const {
      customerId,
      posSessionId,
      items,
      discount = 0,
      paymentMethod = 'cash',
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Itens do pedido são obrigatórios' }, { status: 400 });
    }

    // Gerar número do pedido
    const orderNumber = `PED-${Date.now().toString(36).toUpperCase()}`;
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Calcular subtotal
    let subtotal = 0;
    const processedItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      sellType: 'package' | 'unit';
      unitsSold: number;
    }> = [];

    for (const item of items) {
      const { productId, quantity, unitPrice, sellType = 'package', unitsSold = 0 } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        return NextResponse.json({ error: 'Dados de item inválidos' }, { status: 400 });
      }

      // Verificar se produto existe e tem estoque
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ error: `Produto não encontrado: ${productId}` }, { status: 404 });
      }

      // Buscar lotes para verificar estoque total
      const batches = await db
        .select()
        .from(productBatches)
        .where(eq(productBatches.productId, productId));

      const totalStock = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);

      // Verificar se o produto permite venda por unidade
      const productSellsByUnit = product[0].sellByUnit === 1;

      // Verificar estoque baseado no tipo de venda
      if (sellType === 'unit' && productSellsByUnit) {
        // Venda por unidade - verificar unidades disponíveis
        const unitsPerPackage = product[0].unitsPerPackage || 1;
        const totalUnitsAvailable = product[0].qtdUnitsAvailable || (totalStock * unitsPerPackage);
        if (quantity > totalUnitsAvailable) {
          return NextResponse.json({ 
            error: `Unidades insuficientes para ${product[0].name}. Disponível: ${totalUnitsAvailable} unidades` 
          }, { status: 400 });
        }
      } else {
        // Venda por embalagem - verificar embalagens disponíveis
        if (totalStock < quantity) {
          return NextResponse.json({ 
            error: `Estoque insuficiente para ${product[0].name}. Disponível: ${totalStock}` 
          }, { status: 400 });
        }
      }

      const price = unitPrice || parseFloat(product[0].precoVenda);
      const itemTotal = price * quantity;
      
      processedItems.push({
        productId,
        quantity,
        unitPrice: price,
        total: itemTotal,
        sellType: sellType as 'package' | 'unit',
        unitsSold: sellType === 'unit' ? quantity : 0,
      });

      subtotal += itemTotal;
    }

    const total = subtotal - parseFloat(discount.toString());

    // Criar o pedido
    await db.insert(salesOrders).values({
      id: orderId,
      orderNumber,
      customerId: customerId || null,
      posSessionId: posSessionId || null,
      userId: userId || null,
      sellerName: userName || null,
      sellerSignature: userName ? `${userName} (${userEmail || 'N/A'})` : null,
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      total: total.toString(),
      paymentMethod: paymentMethod as 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'other',
      status: 'completed',
      notes: notes || null,
    });

    // Criar itens do pedido e dar baixa no estoque
    for (const item of processedItems) {
      const itemId = crypto.randomUUID();
      
      await db.insert(salesOrderItems).values({
        id: itemId,
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        discount: '0',
        total: item.total.toString(),
        sellType: item.sellType,
        unitsSold: item.unitsSold,
      });

      // Buscar produto para obter unidades por embalagem
      const productData = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      
      const unitsPerPackage = productData[0]?.unitsPerPackage || 1;

      if (item.sellType === 'unit') {
        // Venda por unidade - deduzir unidades do estoque
        // Atualizar quantidade de unidades disponíveis
        const currentUnitsAvailable = productData[0]?.qtdUnitsAvailable || 0;
        const newUnitsAvailable = currentUnitsAvailable - item.quantity;
        
        // Calcular quantas embalagens completas foram usadas
        // (quando unidades restantes em uma embalagem acabam)
        const currentPackageQty = productData[0]?.qtdAtual || 0;
        const totalUnitsBeforeSale = currentPackageQty * unitsPerPackage;
        const totalUnitsAfterSale = totalUnitsBeforeSale - item.quantity;
        const newPackageQty = Math.floor(totalUnitsAfterSale / unitsPerPackage);
        const remainderUnits = totalUnitsAfterSale % unitsPerPackage;
        
        await db
          .update(products)
          .set({
            qtdUnitsAvailable: newUnitsAvailable > 0 ? newUnitsAvailable : remainderUnits,
            qtdAtual: newPackageQty,
            qtdSaidaTotal: (productData[0]?.qtdSaidaTotal || 0) + (currentPackageQty - newPackageQty),
          })
          .where(eq(products.id, item.productId));

        // Dar baixa nos lotes (proporcionalmente)
        const packagesToDeduct = currentPackageQty - newPackageQty;
        if (packagesToDeduct > 0) {
          let remainingQty = packagesToDeduct;
          const batches = await db
            .select()
            .from(productBatches)
            .where(eq(productBatches.productId, item.productId))
            .orderBy(productBatches.purchaseDate);

          for (const batch of batches) {
            if (remainingQty <= 0) break;

            const toDeduct = Math.min(remainingQty, batch.quantityRemaining);
            
            await db
              .update(productBatches)
              .set({ 
                quantityRemaining: batch.quantityRemaining - toDeduct,
                unitsRemaining: (batch.unitsRemaining || 0) - (toDeduct * unitsPerPackage),
              })
              .where(eq(productBatches.id, batch.id));

            remainingQty -= toDeduct;
          }
        }

        // Registrar movimento
        await db.insert(movements).values({
          id: crypto.randomUUID(),
          produtoId: item.productId,
          tipo: 'saida',
          quantidade: item.quantity,
          precoUnitario: item.unitPrice.toString(),
          data: now,
          referencia: `${orderNumber} (${item.quantity} unidades)`,
        });
      } else {
        // Venda por embalagem - comportamento original
        // Dar baixa no estoque usando FIFO (lotes mais antigos primeiro)
        let remainingQty = item.quantity;
        const batches = await db
          .select()
          .from(productBatches)
          .where(eq(productBatches.productId, item.productId))
          .orderBy(productBatches.purchaseDate);

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const toDeduct = Math.min(remainingQty, batch.quantityRemaining);
          
          await db
            .update(productBatches)
            .set({ 
              quantityRemaining: batch.quantityRemaining - toDeduct,
              unitsRemaining: (batch.unitsRemaining || 0) - (toDeduct * unitsPerPackage),
            })
            .where(eq(productBatches.id, batch.id));

          remainingQty -= toDeduct;
        }

        // Atualizar estoque do produto
        if (productData.length > 0) {
          const newQtdAtual = (productData[0].qtdAtual || 0) - item.quantity;
          const newUnitsAvailable = newQtdAtual * unitsPerPackage;
          
          await db
            .update(products)
            .set({
              qtdAtual: newQtdAtual,
              qtdSaidaTotal: (productData[0].qtdSaidaTotal || 0) + item.quantity,
              qtdUnitsAvailable: newUnitsAvailable,
            })
            .where(eq(products.id, item.productId));
        }

        // Registrar movimento
        await db.insert(movements).values({
          id: crypto.randomUUID(),
          produtoId: item.productId,
          tipo: 'saida',
          quantidade: item.quantity,
          precoUnitario: item.unitPrice.toString(),
          data: now,
          referencia: orderNumber,
        });
      }
    }

    // Atualizar totais da sessão de caixa se houver
    if (posSessionId) {
      const session = await db
        .select()
        .from(posSessions)
        .where(eq(posSessions.id, posSessionId))
        .limit(1);

      if (session.length > 0 && session[0].status === 'open') {
        const updateField = paymentMethod === 'cash' ? 'cashSales' :
                           paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? 'cardSales' :
                           paymentMethod === 'pix' ? 'pixSales' : 'otherSales';

        const currentValue = parseFloat(session[0][updateField] || '0');
        
        await db
          .update(posSessions)
          .set({ [updateField]: (currentValue + total).toString() })
          .where(eq(posSessions.id, posSessionId));
      }
    }

    return NextResponse.json({
      id: orderId,
      orderNumber,
      total,
      message: 'Venda realizada com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro ao processar venda' }, { status: 500 });
  }
}

// DELETE - Cancelar/excluir pedido de venda
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido obrigatório' }, { status: 400 });
    }

    // Verificar se o pedido existe e está pendente
    const order = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (order[0].status !== 'pending') {
      return NextResponse.json({ error: 'Apenas pedidos pendentes podem ser cancelados' }, { status: 400 });
    }

    // Buscar itens do pedido
    const items = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.orderId, orderId));

    // Reverter estoque para cada item
    for (const item of items) {
      // Buscar lotes ordenados por data (PEPS - mais antigo primeiro)
      const batches = await db
        .select()
        .from(productBatches)
        .where(eq(productBatches.productId, item.productId))
        .orderBy(asc(productBatches.purchaseDate));

      let remainingToReturn = item.quantity;

      // Devolver ao lote mais antigo primeiro
      for (const batch of batches) {
        if (remainingToReturn <= 0) break;
        const addBack = Math.min(remainingToReturn, batch.quantityRemaining);
        await db
          .update(productBatches)
          .set({
            quantityRemaining: batch.quantityRemaining + addBack,
          })
          .where(eq(productBatches.id, batch.id));
        remainingToReturn -= addBack;
      }

      // Atualizar qtdSaidaTotal no produto
      const product = await db.select().from(products).where(eq(products.id, item.productId));
      if (product.length > 0) {
        await db
          .update(products)
          .set({
            qtdSaidaTotal: Math.max(0, (product[0].qtdSaidaTotal || 0) - item.quantity),
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Deletar itens do pedido
    await db.delete(salesOrderItems).where(eq(salesOrderItems.orderId, orderId));

    // Deletar pedido
    await db.delete(salesOrders).where(eq(salesOrders.id, orderId));

    return NextResponse.json({ message: 'Pedido cancelado e excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json({ error: 'Erro ao cancelar pedido' }, { status: 500 });
  }
}

// PATCH - Atualizar status de pagamento (crediário)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const { creditStatus } = body;

    if (!creditStatus || !['pending', 'partial', 'paid'].includes(creditStatus)) {
      return NextResponse.json({ error: 'Status de crédito inválido' }, { status: 400 });
    }

    // Verificar se pedido existe
    const order = await db.select().from(salesOrders).where(eq(salesOrders.id, orderId));
    if (order.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Atualizar status de crédito
    await db.update(salesOrders).set({
      creditStatus: creditStatus as 'pending' | 'partial' | 'paid',
      updatedAt: new Date().toISOString(),
    }).where(eq(salesOrders.id, orderId));

    return NextResponse.json({ 
      success: true, 
      message: `Status de pagamento atualizado para: ${creditStatus === 'paid' ? 'Pago' : creditStatus === 'partial' ? 'Parcial' : 'Pendente'}` 
    });
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
