import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';

// Funções de validação
function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(cleaned[10]);
}

function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(cleaned[13]);
}

// GET: Listar todos os clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    
    let query = db.select().from(customers);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.cpfCnpj, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }
    
    if (type === 'pf' || type === 'pj') {
      conditions.push(eq(customers.type, type));
    }
    
    if (active === 'true') {
      conditions.push(eq(customers.isActive, 1));
    } else if (active === 'false') {
      conditions.push(eq(customers.isActive, 0));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const customerList = await query.orderBy(desc(customers.createdAt));
    
    return NextResponse.json({ customers: customerList });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
  }
}

// POST: Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type = 'pf',
      name,
      cpfCnpj,
      email,
      phone,
      mobile,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZipcode,
      notes,
      creditLimit,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Validar CPF/CNPJ se fornecido
    if (cpfCnpj) {
      const cleaned = cpfCnpj.replace(/\D/g, '');
      if (type === 'pf' && cleaned.length > 0 && !validateCPF(cleaned)) {
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
      }
      if (type === 'pj' && cleaned.length > 0 && !validateCNPJ(cleaned)) {
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();

    await db.insert(customers).values({
      id,
      type: type as 'pf' | 'pj',
      name: name.trim(),
      cpfCnpj: cpfCnpj?.replace(/\D/g, '') || null,
      email: email || null,
      phone: phone?.replace(/\D/g, '') || null,
      mobile: mobile?.replace(/\D/g, '') || null,
      addressStreet: addressStreet || null,
      addressNumber: addressNumber || null,
      addressComplement: addressComplement || null,
      addressNeighborhood: addressNeighborhood || null,
      addressCity: addressCity || null,
      addressState: addressState || null,
      addressZipcode: addressZipcode?.replace(/\D/g, '') || null,
      notes: notes || null,
      creditLimit: creditLimit ? creditLimit.toString() : null,
      isActive: 1,
    });

    return NextResponse.json({ id, message: 'Cliente criado com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
