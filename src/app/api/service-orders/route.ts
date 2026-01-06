import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceOrders, serviceOrderItems, serviceOrderHistory, customers } from '@/lib/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

// GET - Listar ordens de serviço
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar ordens com dados do cliente
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
        createdAt: serviceOrders.createdAt,
        updatedAt: serviceOrders.updatedAt,
        customerName: customers.name,
        customerCpfCnpj: customers.cpfCnpj,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(serviceOrders)
      .leftJoin(customers, eq(serviceOrders.customerId, customers.id))
      .where(
        and(
          status ? eq(serviceOrders.status, status as 'pending' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'cancelled' | 'delivered') : undefined,
          customerId ? eq(serviceOrders.customerId, customerId) : undefined,
          search ? or(
            like(serviceOrders.orderNumber, `%${search}%`),
            like(serviceOrders.title, `%${search}%`),
            like(customers.name, `%${search}%`),
            like(customers.cpfCnpj, `%${search}%`)
          ) : undefined
        )
      )
      .orderBy(desc(serviceOrders.createdAt))
      .limit(limit)
      .offset(offset);

    // Contar total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceOrders)
      .leftJoin(customers, eq(serviceOrders.customerId, customers.id))
      .where(
        and(
          status ? eq(serviceOrders.status, status as 'pending' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'cancelled' | 'delivered') : undefined,
          customerId ? eq(serviceOrders.customerId, customerId) : undefined,
          search ? or(
            like(serviceOrders.orderNumber, `%${search}%`),
            like(serviceOrders.title, `%${search}%`),
            like(customers.name, `%${search}%`),
            like(customers.cpfCnpj, `%${search}%`)
          ) : undefined
        )
      );

    return NextResponse.json({
      orders,
      total: countResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error);
    return NextResponse.json({ error: 'Erro ao listar ordens de serviço' }, { status: 500 });
  }
}

// POST - Criar nova ordem de serviço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerId,
      title,
      description,
      equipmentType,
      equipmentBrand,
      equipmentModel,
      equipmentSerial,
      reportedIssue,
      priority = 'medium',
      estimatedCost,
      estimatedCompletionDate,
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Verificar se cliente existe
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Gerar número da ordem
    const orderNumber = `OS-${Date.now().toString(36).toUpperCase()}`;
    const orderId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    // Criar ordem de serviço
    await db.insert(serviceOrders).values({
      id: orderId,
      orderNumber,
      customerId,
      title,
      description: description || null,
      equipmentType: equipmentType || null,
      equipmentBrand: equipmentBrand || null,
      equipmentModel: equipmentModel || null,
      equipmentSerial: equipmentSerial || null,
      reportedIssue: reportedIssue || null,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      status: 'pending',
      estimatedCost: estimatedCost || null,
      estimatedCompletionDate: estimatedCompletionDate || null,
      notes: notes || null,
      receivedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    // Registrar histórico
    await db.insert(serviceOrderHistory).values({
      id: crypto.randomUUID(),
      serviceOrderId: orderId,
      fromStatus: null,
      toStatus: 'pending',
      notes: 'Ordem de serviço criada',
      createdAt: nowStr,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        customerId,
        title,
        status: 'pending',
        createdAt: nowStr,
      },
    });
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de serviço' }, { status: 500 });
  }
}
