import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PromotionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const current = searchParams.get('current');
    const couponCode = searchParams.get('couponCode');

    let whereClause: any = {};

    if (active === 'true') {
      whereClause.isActive = true;
    }

    if (current === 'true') {
      const now = new Date();
      whereClause.startDate = { lte: now };
      whereClause.endDate = { gte: now };
      whereClause.isActive = true;
    }

    if (couponCode) {
      whereClause.couponCode = couponCode;
    }

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      include: {
        freeItem: {
          select: {
            id: true,
            name: true,
            inventories: {
              where: { isDefault: true },
              select: { retailPrice: true }
            }
          }
        },
        products: {
          select: { id: true, name: true }
        },
        categories: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            appliedOrders: true,
            usageRecords: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Serialize Decimal fields
    const serializedPromotions = JSON.parse(JSON.stringify(promotions, (key, value) =>
      typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
        ? value.toNumber()
        : value
    ));

    return NextResponse.json({
      success: true,
      promotions: serializedPromotions
    });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      promotionType,
      value,
      minimumOrderValue,
      startDate,
      endDate,
      isActive,
      freeItemId,
      couponCode,
      usageLimit,
      applyToAllItems,
      productIds,
      categoryIds
    } = body;

    // Validate required fields
    if (!name || !promotionType || value === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate promotion type
    if (!Object.values(PromotionType).includes(promotionType)) {
      return NextResponse.json(
        { error: 'Invalid promotion type' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        promotionType: promotionType as PromotionType,
        value: new Decimal(value),
        minimumOrderValue: minimumOrderValue ? new Decimal(minimumOrderValue) : null,
        startDate: start,
        endDate: end,
        isActive: isActive ?? true,
        freeItemId,
        couponCode,
        usageLimit,
        applyToAllItems: applyToAllItems ?? false,
        products: productIds?.length ? {
          connect: productIds.map((id: string) => ({ id }))
        } : undefined,
        categories: categoryIds?.length ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        freeItem: true,
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
      }
    });

    // Serialize response
    const serializedPromotion = JSON.parse(JSON.stringify(promotion, (key, value) =>
      typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
        ? value.toNumber()
        : value
    ));

    return NextResponse.json({
      success: true,
      promotion: serializedPromotion
    });

  } catch (error) {
    console.error('Error creating promotion:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A promotion with this coupon code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  }
} 