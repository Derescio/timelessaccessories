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

    console.log('🎯 track-usage - Received request:', {
      promotionId,
      orderId,
      userId,
      userEmail,
      isGuestUser: userId === 'guest',
      discountAmount
    });

    // Handle guest users - create/find user record for guest email
    let actualUserId: string;
    
    if (userId === 'guest' || !userId) {
      if (!userEmail) {
        console.error('❌ track-usage - Guest user without email');
        return NextResponse.json(
          { error: "Email is required for guest users" },
          { status: 400 }
        );
      }

      console.log('🔄 track-usage - Handling guest user with email:', userEmail);
      
      // Try to find existing user with this email
      let guestUser = await db.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!guestUser) {
        // Create a guest user record
        guestUser = await db.user.create({
          data: {
            email: userEmail,
            name: `Guest User`,
            role: 'USER'
          }
        });
        console.log('✅ track-usage - Created guest user:', guestUser.id);
      } else {
        console.log('✅ track-usage - Found existing user for email:', guestUser.id);
      }
      
      actualUserId = guestUser.id;
    } else {
      // Verify that the provided userId exists
      const existingUser = await db.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        console.error('❌ track-usage - Invalid userId provided:', userId);
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }
      
      actualUserId = userId;
      console.log('✅ track-usage - Using authenticated user ID:', actualUserId);
    }

    // Verify the promotion exists and is still active
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
      include: { _count: { select: { usageRecords: true } } }
    });

    if (!promotion) {
      console.error('❌ track-usage - Promotion not found:', promotionId);
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    // Check if usage limit would be exceeded
    if (promotion.usageLimit && promotion._count.usageRecords >= promotion.usageLimit) {
      console.error('❌ track-usage - Usage limit exceeded for promotion:', promotionId);
      return NextResponse.json(
        { error: "Promotion usage limit exceeded" },
        { status: 400 }
      );
    }

    // Check if this is a first-time use for this user (for analytics)
    const existingUsage = await db.promotionUsage.findFirst({
      where: { userId: actualUserId }
    });
    const isActuallyFirstTime = !existingUsage;

    // For WELCOME10 and similar one-time codes, check if user has used it before
    // This includes checking by email for guest-to-user tracking
    let hasUsedBefore = false;
    if (couponCode && (couponCode.toUpperCase() === 'WELCOME10' || promotion.isOneTimeUse)) {
      const previousUsage = await db.promotionUsage.findFirst({
        where: {
          OR: [
            { userId: actualUserId },
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
      console.log('⚠️ track-usage - User has already used this promotion code');
      return NextResponse.json(
        { error: "This promotion code has already been used by this user" },
        { status: 400 }
      );
    }

    console.log('🔄 track-usage - Creating usage record for:', {
      promotionId,
      userId: actualUserId,
      orderId,
      discountAmount
    });

    // Create usage record
    const usageRecord = await db.promotionUsage.create({
      data: {
        promotionId,
        orderId,
        userId: actualUserId, // Use the actual user ID
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

    console.log('✅ track-usage - Successfully created usage record:', usageRecord.id);

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
    console.error("❌ track-usage - Error tracking promotion usage:", error);
    
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