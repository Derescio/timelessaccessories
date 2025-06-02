import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, orderId } = await req.json();

    if (action === 'check_order_stock') {
      // Get the order and its items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              inventory: {
                select: {
                  id: true,
                  sku: true,
                  quantity: true,
                  reservedStock: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const stockInfo = order.items.map(item => ({
        orderItemId: item.id,
        inventoryId: item.inventoryId,
        sku: item.inventory.sku,
        orderQuantity: item.quantity,
        currentStock: item.inventory.quantity,
        reservedStock: item.inventory.reservedStock,
        availableStock: item.inventory.quantity - item.inventory.reservedStock
      }));

      return NextResponse.json({
        orderId: order.id,
        orderStatus: order.status,
        items: stockInfo,
        totalReservedStock: stockInfo.reduce((sum, item) => sum + item.reservedStock, 0)
      });
    }

    if (action === 'fix_reserved_stock') {
      // Get the order and manually release reserved stock
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              inventory: {
                select: {
                  id: true,
                  sku: true,
                  quantity: true,
                  reservedStock: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Only fix if order is paid/completed
      if (order.status !== 'PROCESSING' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
        return NextResponse.json({ 
          error: `Cannot fix reserved stock for order with status: ${order.status}. Only for paid orders.` 
        }, { status: 400 });
      }

      const results = [];
      for (const item of order.items) {
        if (item.inventory.reservedStock > 0) {
          // Release the reserved stock for this item
          const releaseAmount = Math.min(item.quantity, item.inventory.reservedStock);
          
          await prisma.productInventory.update({
            where: { id: item.inventoryId },
            data: {
              reservedStock: { decrement: releaseAmount }
            }
          });

          results.push({
            sku: item.inventory.sku,
            releasedAmount: releaseAmount,
            previousReserved: item.inventory.reservedStock,
            newReserved: item.inventory.reservedStock - releaseAmount
          });
        }
      }

      return NextResponse.json({
        message: 'Reserved stock released',
        orderId: order.id,
        results
      });
    }

    if (action === 'check_all_reserved') {
      // Check all inventory items with reserved stock
      const inventoryWithReserved = await prisma.productInventory.findMany({
        where: {
          reservedStock: { gt: 0 }
        },
        select: {
          id: true,
          sku: true,
          quantity: true,
          reservedStock: true,
          product: {
            select: {
              name: true
            }
          }
        }
      });

      return NextResponse.json({
        totalItemsWithReservedStock: inventoryWithReserved.length,
        items: inventoryWithReserved.map(item => ({
          id: item.id,
          sku: item.sku,
          productName: item.product.name,
          totalStock: item.quantity,
          reservedStock: item.reservedStock,
          availableStock: item.quantity - item.reservedStock
        }))
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Debug stock error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get all inventory with reserved stock > 0
    const inventoryWithReservedStock = await prisma.productInventory.findMany({
      where: {
        reservedStock: { gt: 0 }
      },
      select: {
        id: true,
        sku: true,
        quantity: true,
        reservedStock: true,
        product: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        reservedStock: 'desc'
      }
    });

    return NextResponse.json({
      message: 'Current inventory with reserved stock',
      count: inventoryWithReservedStock.length,
      items: inventoryWithReservedStock.map(item => ({
        sku: item.sku,
        productName: item.product.name,
        totalStock: item.quantity,
        reservedStock: item.reservedStock,
        availableStock: item.quantity - item.reservedStock
      }))
    });

  } catch (error) {
    console.error('Error checking inventory:', error);
    return NextResponse.json({ error: 'Failed to check inventory' }, { status: 500 });
  }
} 