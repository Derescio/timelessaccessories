'use server';
import { PrismaClient } from '@prisma/client';
import { prismaToJSObject } from  '@/lib/utils'

// Get the latest products
export async function getLatestProducts() {
  const prisma = new PrismaClient();

  const data = await prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  return prismaToJSObject(data);
}