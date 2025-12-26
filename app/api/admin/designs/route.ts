import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    const designs = await prisma.design.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ designs });
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 