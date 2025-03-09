import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/config';

export async function getProducts(req: any, res: any) {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function createProduct(req: NextRequest, res: any) {
  try {
    const data = await req.json();
    const product = await prisma.product.create({ data });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 });
  }
} 