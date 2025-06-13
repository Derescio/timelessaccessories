import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from "zod";

interface CartItem {
  id?: string;
  productId?: string;
  menuItemId?: string;
  quantity: number;
  price: number;
  name?: string;
  categoryId?: string;
  specialInstructions?: string;
}

interface ValidationRequest {
  code: string;
  cartItems: CartItem[];
  cartTotal: number;
  userId?: string;
  userEmail?: string;
}

// Validation schema for the request
const validatePromotionSchema = z.object({
  code: z.string(),
  cartItems: z.array(z.object({
    id: z.string().optional(),
    productId: z.string().optional(),
    quantity: z.number(),
    price: z.number(),
    name: z.string().optional(),
    categoryId: z.string().optional()
  })),
  cartTotal: z.number(),
  userId: z.string().optional(),
  userEmail: z.string().optional()
});

export async function POST(req: NextRequest) {
  console.log('🎯 [PROMO-VALIDATE] Starting promotion validation request');
  
  try {
    const body = await req.json();
    console.log('🎯 [PROMO-VALIDATE] Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = validatePromotionSchema.parse(body);
    const { code, cartItems, cartTotal, userId, userEmail } = validatedData;
    
    console.log('🎯 [PROMO-VALIDATE] Validating promotion code:', {
      code: code.toUpperCase(),
      cartTotal,
      cartItemsCount: cartItems.length,
      userId: userId || 'guest',
      userEmail: userEmail || 'none'
    });
    
    // Find the promotion by coupon code
    const promotion = await db.promotion.findFirst({
      where: { 
        couponCode: {
          equals: code.toUpperCase(),
          mode: 'insensitive'
        }
      },
      include: {
        categories: true,
        products: true,
        freeItem: true,
        usageRecords: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!promotion) {
      console.log('❌ [PROMO-VALIDATE] Promotion not found for code:', code);
      return NextResponse.json({
        error: "Invalid coupon code"
      }, { status: 400 });
    }
    
    console.log('🎯 [PROMO-VALIDATE] Found promotion:', {
      id: promotion.id,
      name: promotion.name,
      type: promotion.promotionType,
      value: promotion.value.toNumber(),
      isActive: promotion.isActive,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      usageLimit: promotion.usageLimit,
      perUserLimit: promotion.perUserLimit,
      minimumOrderValue: promotion.minimumOrderValue?.toNumber(),
      currentUsageCount: promotion.usageRecords.length
    });
    
    // Check if promotion is active
    if (!promotion.isActive) {
      console.log('❌ [PROMO-VALIDATE] Promotion is not active:', promotion.id);
      return NextResponse.json({
        error: "This coupon is no longer active"
      }, { status: 400 });
    }
    
    // Check if promotion has expired
    const now = new Date();
    if (promotion.endDate && new Date(promotion.endDate) < now) {
      console.log('❌ [PROMO-VALIDATE] Promotion has expired:', {
        promotionId: promotion.id,
        endDate: promotion.endDate,
        currentDate: now
      });
      return NextResponse.json({
        error: "This coupon has expired"
      }, { status: 400 });
    }
    
    // Check if promotion hasn't started yet
    if (promotion.startDate && new Date(promotion.startDate) > now) {
      console.log('❌ [PROMO-VALIDATE] Promotion hasn\'t started yet:', {
        promotionId: promotion.id,
        startDate: promotion.startDate,
        currentDate: now
      });
      return NextResponse.json({
        error: "This coupon is not yet active"
      }, { status: 400 });
    }
    
    // Check usage limits
    if (promotion.usageLimit && promotion.usageRecords.length >= promotion.usageLimit) {
      console.log('❌ [PROMO-VALIDATE] Promotion usage limit exceeded:', {
        promotionId: promotion.id,
        usageLimit: promotion.usageLimit,
        currentUsage: promotion.usageRecords.length
      });
      return NextResponse.json({
        error: "This coupon has reached its usage limit"
      }, { status: 400 });
    }
    
    // Check minimum order value
    if (promotion.minimumOrderValue && cartTotal < promotion.minimumOrderValue.toNumber()) {
      console.log('❌ [PROMO-VALIDATE] Minimum order value not met:', {
        promotionId: promotion.id,
        minimumOrderValue: promotion.minimumOrderValue.toNumber(),
        cartTotal
      });
      return NextResponse.json({
        error: `Minimum order value of $${promotion.minimumOrderValue} not met`
      }, { status: 400 });
    }
    
    // Check per-user limit if user email is provided
    if (promotion.perUserLimit && userEmail) {
      const userUsageCount = promotion.usageRecords.filter(record => 
        record.user?.email === userEmail
      ).length;
      
      console.log('🎯 [PROMO-VALIDATE] Checking per-user limit:', {
        promotionId: promotion.id,
        perUserLimit: promotion.perUserLimit,
        userEmail,
        userUsageCount
      });
      
      if (userUsageCount >= promotion.perUserLimit) {
        console.log('❌ [PROMO-VALIDATE] Per-user usage limit exceeded:', {
          promotionId: promotion.id,
          perUserLimit: promotion.perUserLimit,
          userUsageCount
        });
        return NextResponse.json({
          error: "You have already used this coupon the maximum number of times"
        }, { status: 400 });
      }
    }
    
    // Check authentication requirement
    if (promotion.requiresAuthentication && !userId) {
      console.log('❌ [PROMO-VALIDATE] Authentication required but user not logged in:', promotion.id);
      return NextResponse.json({
        error: "This coupon requires you to be signed in"
      }, { status: 401 });
    }
    
    // Calculate discount and get eligible items
    const discountResult = await calculateDiscount(promotion, cartItems, cartTotal);
    
    console.log('🎯 [PROMO-VALIDATE] Discount calculation result:', {
      promotionId: promotion.id,
      discount: discountResult.discount,
      appliedItems: discountResult.appliedItems,
      freeItem: discountResult.freeItem
    });
    
    if (discountResult.discount === 0 && !discountResult.freeItem) {
      console.log('❌ [PROMO-VALIDATE] No eligible items for promotion:', promotion.id);
      return NextResponse.json({
        error: "No eligible items in cart for this coupon"
      }, { status: 400 });
    }
    
    console.log('✅ [PROMO-VALIDATE] Promotion validation successful:', {
      promotionId: promotion.id,
      code: promotion.couponCode,
      discount: discountResult.discount,
      discountType: promotion.promotionType
    });
    
    return NextResponse.json({
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.promotionType,
        couponCode: promotion.couponCode,
        value: promotion.value.toNumber()
      },
      discount: discountResult.discount,
      discountType: promotion.promotionType,
      appliedTo: discountResult.appliedItems,
      freeItem: discountResult.freeItem,
      message: getSuccessMessage(promotion, discountResult.discount)
    });
    
  } catch (error) {
    console.error("💥 [PROMO-VALIDATE] Unexpected error:", error);
    
    if (error instanceof z.ZodError) {
      console.log('❌ [PROMO-VALIDATE] Validation error:', error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to validate coupon", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function calculateDiscount(promotion: any, cartItems: CartItem[], cartTotal: number) {
  const promotionValue = promotion.value.toNumber();
  let discount = 0;
  let appliedItems: string[] = [];
  let freeItem = null;

  // Get eligible items based on targeting
  const eligibleItems = getEligibleItems(promotion, cartItems);

  if (eligibleItems.length === 0 && !promotion.applyToAllItems) {
    return { discount: 0, appliedItems: [], freeItem: null };
  }

  // Calculate discount based on promotion type
  switch (promotion.promotionType) {
    case "PERCENTAGE_DISCOUNT":
      if (promotion.applyToAllItems) {
        discount = cartTotal * (promotionValue / 100);
        appliedItems = cartItems.map(item => item.name || item.productId || item.id || "Unknown item");
      } else {
        const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        discount = eligibleTotal * (promotionValue / 100);
        appliedItems = eligibleItems.map(item => item.name || item.productId || item.id || "Unknown item");
      }
      break;

    case "FIXED_AMOUNT_DISCOUNT":
      if (promotion.applyToAllItems) {
        discount = Math.min(promotionValue, cartTotal);
        appliedItems = cartItems.map(item => item.name || item.productId || item.id || "Unknown item");
      } else {
        const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        discount = Math.min(promotionValue, eligibleTotal);
        appliedItems = eligibleItems.map(item => item.name || item.productId || item.id || "Unknown item");
      }
      break;

    case "FREE_ITEM":
      if (promotion.freeItem) {
        freeItem = promotion.freeItem;
        discount = 0; // Free item is handled separately
        appliedItems = ["Free " + promotion.freeItem.name];
      }
      break;

    case "BUY_ONE_GET_ONE":
      if (promotion.applyToAllItems || eligibleItems.length > 0) {
        const itemsToProcess = promotion.applyToAllItems ? cartItems : eligibleItems;
        // Find the cheapest item to make free
        const cheapestItem = itemsToProcess.reduce((cheapest, current) => 
          current.price < cheapest.price ? current : cheapest
        );
        discount = cheapestItem.price;
        appliedItems = [cheapestItem.name || cheapestItem.productId || cheapestItem.id || "Unknown item"];
      }
      break;

    default:
      discount = 0;
  }

  return { 
    discount: Math.max(0, discount), 
    appliedItems, 
    freeItem 
  };
}

function getEligibleItems(promotion: any, cartItems: CartItem[]): CartItem[] {
  if (promotion.applyToAllItems) {
    return cartItems;
  }

  const targetCategoryIds = promotion.categories.map((cat: any) => cat.id);
  const targetProductIds = promotion.products.map((prod: any) => prod.id);

  return cartItems.filter(item => {
    // Check if item matches target categories
    if (targetCategoryIds.length > 0 && item.categoryId && targetCategoryIds.includes(item.categoryId)) {
      return true;
    }
    
    // Check if item matches target products
    if (targetProductIds.length > 0) {
      const itemProductId = item.productId || item.id;
      if (itemProductId && targetProductIds.includes(itemProductId)) {
        return true;
      }
    }

    return false;
  });
}

function getSuccessMessage(promotion: any, discount: number): string {
  const promotionName = promotion.name;
  
  switch (promotion.promotionType) {
    case "PERCENTAGE_DISCOUNT":
      return `${promotionName} applied! You saved $${discount.toFixed(2)}`;
    case "FIXED_AMOUNT_DISCOUNT":
      return `${promotionName} applied! You saved $${discount.toFixed(2)}`;
    case "FREE_ITEM":
      return `${promotionName} applied! Free item added to your cart`;
    case "BUY_ONE_GET_ONE":
      return `${promotionName} applied! You saved $${discount.toFixed(2)} on the cheapest item`;
    default:
      return `${promotionName} applied successfully!`;
  }
} 