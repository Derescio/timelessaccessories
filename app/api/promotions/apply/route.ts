import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface ApplyPromotionRequest {
  promotionId: string;
  orderId: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  couponCode?: string;
  customerSegment?: string;
  deviceType?: string;
  referralSource?: string;
  cartItemCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyPromotionRequest = await request.json();
    const {
      promotionId,
      orderId,
      discountAmount,
      originalAmount,
      finalAmount,
      couponCode,
      customerSegment,
      deviceType,
      referralSource,
      cartItemCount
    } = body;

    if (!promotionId || !orderId || discountAmount === undefined || originalAmount === undefined || finalAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user session or order details
    const session = await auth();
    
    // Get order details to find user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, guestEmail: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let userId = order.userId;
    
    // If no userId from order, try to get from session
    if (!userId && session?.user?.id) {
      userId = session.user.id;
    }

    // If still no userId, we cannot proceed (guest checkout with no session)
    if (!userId) {
      return NextResponse.json(
        { error: 'User identification required for promotion tracking' },
        { status: 400 }
      );
    }

    // Check if promotion exists and get its details
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: {
        id: true,
        usageCount: true,
        usageLimit: true,
        startDate: true,
        _count: {
          select: { usageRecords: true }
        }
      }
    });

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Check if user has used any promotion before (for first-time tracking)
    const userPromotionHistory = await prisma.promotionUsage.findFirst({
      where: { userId },
      select: { id: true }
    });

    const isFirstTimeUse = !userPromotionHistory;

    // Calculate time to conversion (if we have promotion start date)
    const timeToConversion = Math.floor(
      (new Date().getTime() - promotion.startDate.getTime()) / (1000 * 60)
    );

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create usage record
      const usageRecord = await tx.promotionUsage.create({
        data: {
          promotionId,
          userId,
          orderId,
          discountAmount: new Decimal(discountAmount),
          originalAmount: new Decimal(originalAmount),
          finalAmount: new Decimal(finalAmount),
          couponCode,
          customerSegment,
          deviceType,
          referralSource,
          isFirstTimeUse,
          timeToConversion,
          cartItemCount
        }
      });

      // Update promotion usage count
      await tx.promotion.update({
        where: { id: promotionId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      // Update order with promotion details
      await tx.order.update({
        where: { id: orderId },
        data: {
          appliedPromotionId: promotionId,
          discountAmount: new Decimal(discountAmount)
        }
      });

      return usageRecord;
    });

    console.log(`✅ Promotion ${promotionId} applied to order ${orderId} for user ${userId}`);
    console.log(`💰 Discount applied: $${discountAmount}`);

    return NextResponse.json({
      success: true,
      usageRecord: {
        id: result.id,
        promotionId: result.promotionId,
        orderId: result.orderId,
        discountAmount: result.discountAmount.toNumber(),
        originalAmount: result.originalAmount.toNumber(),
        finalAmount: result.finalAmount.toNumber(),
        isFirstTimeUse: result.isFirstTimeUse,
        createdAt: result.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error applying promotion:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid promotion or order ID' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Promotion has already been applied to this order' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to apply promotion' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve promotion usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get('promotionId');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let whereClause: any = {};

    if (promotionId) {
      whereClause.promotionId = promotionId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
    }

    const usageRecords = await prisma.promotionUsage.findMany({
      where: whereClause,
      include: {
        promotion: {
          select: { id: true, name: true, couponCode: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        },
        order: {
          select: { id: true, total: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Serialize Decimal fields
    const serializedRecords = JSON.parse(JSON.stringify(usageRecords, (key, value) =>
      typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
        ? value.toNumber()
        : value
    ));

    return NextResponse.json({
      success: true,
      usageRecords: serializedRecords
    });

  } catch (error) {
    console.error('Error fetching promotion usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion usage' },
      { status: 500 }
    );
  }
} 