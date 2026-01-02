import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { salesOrders, salesOrderItems, products, productBatches, posSessions, movements } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Listar pedidos de venda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');
    
    let query = db.select().from(salesOrders);
    
    if (status) {
      query = query.where(eq(salesOrders.status, status as 'pending' | 'completed' | 'cancelled')) as typeof query;
    }
    
    if (sessionId) {
      query = query.where(eq(salesOrders.posSessionId, sessionId)) as typeof query;
    }
    
    const orders = await query.orderBy(desc(salesOrders.createdAt));
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao listar pedidos' }, { status: 500 });
  }
}

// POST - Criar novo pedido de venda (PDV)
export async function POST(request: NextRequest) {
  try {
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
    const now = new Date();

    // Calcular subtotal
    let subtotal = 0;
    const processedItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    for (const item of items) {
      const { productId, quantity, unitPrice } = item;
      
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

      if (totalStock < quantity) {
        return NextResponse.json({ 
          error: `Estoque insuficiente para ${product[0].name}. Disponível: ${totalStock}` 
        }, { status: 400 });
      }

      const price = unitPrice || parseFloat(product[0].salePrice);
      const itemTotal = price * quantity;
      
      processedItems.push({
        productId,
        quantity,
        unitPrice: price,
        total: itemTotal,
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
      });

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
          .set({ quantityRemaining: batch.quantityRemaining - toDeduct })
          .where(eq(productBatches.id, batch.id));

        remainingQty -= toDeduct;
      }

      // Atualizar estoque do produto
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length > 0) {
        await db
          .update(products)
          .set({
            currentQuantity: product[0].currentQuantity - item.quantity,
            totalExit: product[0].totalExit + item.quantity,
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
