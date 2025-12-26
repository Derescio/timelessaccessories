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

        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 