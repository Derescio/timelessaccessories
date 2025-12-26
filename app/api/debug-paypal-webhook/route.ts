import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth-helpers';

export async function GET() {
  try {
    // Only allow in development/staging, require admin in production
    if (process.env.NODE_ENV === 'production') {
      const authResult = await requireAdmin();
      if (authResult.error) {
        return authResult.error;
      }
    }

    // Get recent orders to see their status
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        payment: true,
        items: {
          include: {
            inventory: {
              select: {
                sku: true,
                quantity: true,
                reservedStock: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'PayPal webhook debug info',
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        payment: order.payment ? {
          status: order.payment.status,
          provider: order.payment.provider,
          paymentId: order.payment.paymentId,
          updatedAt: order.payment.updatedAt
        } : null,
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          inventory: {
            sku: item.inventory.sku,
            currentStock: item.inventory.quantity,
            reservedStock: item.inventory.reservedStock
          }
        }))
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to fetch debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 