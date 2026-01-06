import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceOrders, serviceOrderItems, serviceOrderHistory, customers, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET - Buscar ordem de serviço por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar ordem com dados do cliente
    const orders = await db
      .select({
        id: serviceOrders.id,
        orderNumber: serviceOrders.orderNumber,
        customerId: serviceOrders.customerId,
        title: serviceOrders.title,
        description: serviceOrders.description,
        equipmentType: serviceOrders.equipmentType,
        equipmentBrand: serviceOrders.equipmentBrand,
        equipmentModel: serviceOrders.equipmentModel,
        equipmentSerial: serviceOrders.equipmentSerial,
        reportedIssue: serviceOrders.reportedIssue,
        diagnosis: serviceOrders.diagnosis,
        solution: serviceOrders.solution,
        priority: serviceOrders.priority,
        status: serviceOrders.status,
        estimatedCost: serviceOrders.estimatedCost,
        laborCost: serviceOrders.laborCost,
        partsCost: serviceOrders.partsCost,
        totalCost: serviceOrders.totalCost,
        warrantyMonths: serviceOrders.warrantyMonths,
        warrantyUntil: serviceOrders.warrantyUntil,
        receivedAt: serviceOrders.receivedAt,
        estimatedCompletionDate: serviceOrders.estimatedCompletionDate,
        completedAt: serviceOrders.completedAt,
        deliveredAt: serviceOrders.deliveredAt,
        notes: serviceOrders.notes,
        internalNotes: serviceOrders.internalNotes,
        createdAt: serviceOrders.createdAt,
        updatedAt: serviceOrders.updatedAt,
        customerName: customers.name,
        customerCpfCnpj: customers.cpfCnpj,
        customerPhone: customers.phone,
        customerMobile: customers.mobile,
        customerEmail: customers.email,
      })
      .from(serviceOrders)
      .leftJoin(customers, eq(serviceOrders.customerId, customers.id))
      .where(eq(serviceOrders.id, id))
      .limit(1);

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Buscar itens da ordem
    const items = await db
      .select({
        id: serviceOrderItems.id,
        productId: serviceOrderItems.productId,
        type: serviceOrderItems.type,
        description: serviceOrderItems.description,
        quantity: serviceOrderItems.quantity,
        unitPrice: serviceOrderItems.unitPrice,
        discount: serviceOrderItems.discount,
        total: serviceOrderItems.total,
        createdAt: serviceOrderItems.createdAt,
        productName: products.name,
        productCode: products.codigoInterno,
      })
      .from(serviceOrderItems)
      .leftJoin(products, eq(serviceOrderItems.productId, products.id))
      .where(eq(serviceOrderItems.serviceOrderId, id));

    // Buscar histórico
    const history = await db
      .select()
      .from(serviceOrderHistory)
      .where(eq(serviceOrderHistory.serviceOrderId, id))
      .orderBy(serviceOrderHistory.createdAt);

    return NextResponse.json({
      order: orders[0],
      items,
      history,
    });
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    return NextResponse.json({ error: 'Erro ao buscar ordem de serviço' }, { status: 500 });
  }
}

// PUT - Atualizar ordem de serviço
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se ordem existe
    const existingOrder = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    const currentOrder = existingOrder[0];
    const now = new Date();
    const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');

    const {
      title,
      description,
      equipmentType,
      equipmentBrand,
      equipmentModel,
      equipmentSerial,
      reportedIssue,
      diagnosis,
      solution,
      priority,
      status,
      estimatedCost,
      laborCost,
      partsCost,
      warrantyMonths,
      estimatedCompletionDate,
      notes,
      internalNotes,
    } = body;

    // Calcular custo total
    const totalCost = (parseFloat(laborCost) || 0) + (parseFloat(partsCost) || 0);

    // Calcular data de garantia se completado e tem garantia
    let warrantyUntil: string | null = null;
    let completedAt: string | null = currentOrder.completedAt;
    let deliveredAt: string | null = currentOrder.deliveredAt;

    if (status === 'completed' && !currentOrder.completedAt) {
      completedAt = nowFormatted;
      if (warrantyMonths && warrantyMonths > 0) {
        const warrantyDate = new Date();
        warrantyDate.setMonth(warrantyDate.getMonth() + warrantyMonths);
        warrantyUntil = warrantyDate.toISOString().split('T')[0];
      }
    }

    if (status === 'delivered' && !currentOrder.deliveredAt) {
      deliveredAt = nowFormatted;
    }

    // Atualizar ordem
    await db
      .update(serviceOrders)
      .set({
        title: title !== undefined ? title : currentOrder.title,
        description: description !== undefined ? description : currentOrder.description,
        equipmentType: equipmentType !== undefined ? equipmentType : currentOrder.equipmentType,
        equipmentBrand: equipmentBrand !== undefined ? equipmentBrand : currentOrder.equipmentBrand,
        equipmentModel: equipmentModel !== undefined ? equipmentModel : currentOrder.equipmentModel,
        equipmentSerial: equipmentSerial !== undefined ? equipmentSerial : currentOrder.equipmentSerial,
        reportedIssue: reportedIssue !== undefined ? reportedIssue : currentOrder.reportedIssue,
        diagnosis: diagnosis !== undefined ? diagnosis : currentOrder.diagnosis,
        solution: solution !== undefined ? solution : currentOrder.solution,
        priority: priority !== undefined ? priority : currentOrder.priority,
        status: status !== undefined ? status : currentOrder.status,
        estimatedCost: estimatedCost !== undefined ? estimatedCost : currentOrder.estimatedCost,
        laborCost: laborCost !== undefined ? laborCost : currentOrder.laborCost,
        partsCost: partsCost !== undefined ? partsCost : currentOrder.partsCost,
        totalCost: totalCost.toString(),
        warrantyMonths: warrantyMonths !== undefined ? warrantyMonths : currentOrder.warrantyMonths,
        warrantyUntil: warrantyUntil || currentOrder.warrantyUntil,
        estimatedCompletionDate: estimatedCompletionDate !== undefined 
          ? (estimatedCompletionDate ? estimatedCompletionDate : null) 
          : currentOrder.estimatedCompletionDate,
        completedAt,
        deliveredAt,
        notes: notes !== undefined ? notes : currentOrder.notes,
        internalNotes: internalNotes !== undefined ? internalNotes : currentOrder.internalNotes,
        updatedAt: nowFormatted,
      })
      .where(eq(serviceOrders.id, id));

    // Registrar mudança de status no histórico
    if (status && status !== currentOrder.status) {
      await db.insert(serviceOrderHistory).values({
        id: crypto.randomUUID(),
        serviceOrderId: id,
        fromStatus: currentOrder.status,
        toStatus: status,
        notes: body.statusNotes || null,
        createdAt: nowFormatted,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    return NextResponse.json({ error: 'Erro ao atualizar ordem de serviço' }, { status: 500 });
  }
}

// DELETE - Excluir ordem de serviço
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se ordem existe
    const existingOrder = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Deletar itens da ordem
    await db.delete(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id));

    // Deletar histórico
    await db.delete(serviceOrderHistory).where(eq(serviceOrderHistory.serviceOrderId, id));

    // Deletar ordem
    await db.delete(serviceOrders).where(eq(serviceOrders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir ordem de serviço:', error);
    return NextResponse.json({ error: 'Erro ao excluir ordem de serviço' }, { status: 500 });
  }
}
