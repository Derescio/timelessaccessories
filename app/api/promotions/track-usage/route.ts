import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const trackUsageSchema = z.object({
  promotionId: z.string(),
  orderId: z.string().optional(),
  userId: z.string(),
  discountAmount: z.number().min(0),
  originalAmount: z.number().min(0),
  finalAmount: z.number().min(0),
  couponCode: z.string().optional(),
  cartItemCount: z.number().optional(),
  customerSegment: z.string().optional(), // new, returning, vip, etc.
  deviceType: z.string().optional(), // mobile, desktop, tablet
  referralSource: z.string().optional(), // social, email, organic, etc.
  isFirstTimeUse: z.boolean().optional(),
  timeToConversion: z.number().optional(), // Minutes from promotion start to use
  userEmail: z.string().optional() // For guest-to-user tracking
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = trackUsageSchema.parse(body);
    
    const { 
      promotionId, 
      orderId, 
      userId, 
      discountAmount, 
      originalAmount, 
      finalAmount, 
      couponCode, 
      cartItemCount,
      customerSegment,
      deviceType,
      referralSource,
      isFirstTimeUse,
      timeToConversion,
      userEmail
    } = validatedData;

    // Verify the promotion exists and is still active
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
      include: { _count: { select: { usageRecords: true } } }
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    // Check if usage limit would be exceeded
    if (promotion.usageLimit && promotion._count.usageRecords >= promotion.usageLimit) {
      return NextResponse.json(
        { error: "Promotion usage limit exceeded" },
        { status: 400 }
      );
    }

    // Check if this is a first-time use for this user (for analytics)
    const existingUsage = await db.promotionUsage.findFirst({
      where: { userId }
    });
    const isActuallyFirstTime = !existingUsage;

    // For WELCOME10 and similar one-time codes, check if user has used it before
    // This includes checking by email for guest-to-user tracking
    let hasUsedBefore = false;
    if (couponCode && (couponCode.toUpperCase() === 'WELCOME10' || promotion.isOneTimeUse)) {
      const previousUsage = await db.promotionUsage.findFirst({
        where: {
          OR: [
            { userId },
            ...(userEmail ? [{ 
              AND: [
                { couponCode },
                { 
                  user: { 
                    email: userEmail 
                  } 
                }
              ]
            }] : [])
          ],
          couponCode
        }
      });
      hasUsedBefore = !!previousUsage;
    }

    if (hasUsedBefore) {
      return NextResponse.json(
        { error: "This promotion code has already been used by this user" },
        { status: 400 }
      );
    }

    // Create usage record
    const usageRecord = await db.promotionUsage.create({
      data: {
        promotionId,
        orderId,
        userId,
        discountAmount,
        originalAmount,
        finalAmount,
        couponCode,
        cartItemCount,
        customerSegment,
        deviceType,
        referralSource,
        isFirstTimeUse: isFirstTimeUse ?? isActuallyFirstTime,
        timeToConversion
      }
    });

    return NextResponse.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        promotionId: usageRecord.promotionId,
        discountAmount: usageRecord.discountAmount.toNumber(),
        createdAt: usageRecord.createdAt
      }
    });

  } catch (error) {
    console.error("Error tracking promotion usage:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to track promotion usage" },
      { status: 500 }
    );
  }
} 