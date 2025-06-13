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
}

// Validation schema for the request
const validatePromotionSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  cartItems: z.array(z.object({
    id: z.string().optional(),
    productId: z.string().optional(),
    menuItemId: z.string().optional(), // For compatibility with existing code
    quantity: z.number().min(1),
    price: z.number().min(0),
    name: z.string().optional(),
    categoryId: z.string().optional(),
    specialInstructions: z.string().optional()
  })),
  cartTotal: z.number().min(0),
  userId: z.string().optional(),
  userEmail: z.string().optional() // For guest-to-user tracking
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = validatePromotionSchema.parse(body);
    
    const { code, cartItems, cartTotal, userId, userEmail } = validatedData;

    // Find the promotion by coupon code
    const promotion = await db.promotion.findFirst({
      where: {
        couponCode: code.toUpperCase(),
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        categories: { select: { id: true } },
        products: { select: { id: true } },
        freeItem: { select: { id: true, name: true } },
        _count: { select: { usageRecords: true } }
      }
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code" },
        { status: 400 }
      );
    }

    // Check if promotion requires authentication and user is not signed in
    if (promotion.requiresAuthentication && !userId) {
      return NextResponse.json(
        { error: "This coupon code is only available for signed-in users. Please sign in to use this code." },
        { status: 401 }
      );
    }

    // Check usage limit
    if (promotion.usageLimit && promotion._count.usageRecords >= promotion.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check if user (by userId, user.email, or order.guestEmail) has used this code before
    const previousUsage = await db.promotionUsage.findFirst({
      where: {
        couponCode: code.toUpperCase(),
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(userEmail ? [
            { user: { email: userEmail } },
            { order: { guestEmail: userEmail } }
          ] : [])
        ]
      }
    });
    if (previousUsage) {
      return NextResponse.json(
        { error: "This promotion code has already been used by this user" },
        { status: 400 }
      );
    }

    // Check minimum order value
    if (promotion.minimumOrderValue && cartTotal < promotion.minimumOrderValue.toNumber()) {
      return NextResponse.json(
        { 
          error: `Minimum order value of $${promotion.minimumOrderValue.toNumber().toFixed(2)} required for this coupon` 
        },
        { status: 400 }
      );
    }

    // Count previous uses for this user/email
    const userUsageCount = await db.promotionUsage.count({
      where: {
        couponCode: code.toUpperCase(),
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(userEmail ? [
            { user: { email: userEmail } },
            { order: { guestEmail: userEmail } }
          ] : [])
        ]
      }
    });
    if (promotion.perUserLimit && userUsageCount >= promotion.perUserLimit) {
      return NextResponse.json(
        { error: `This promotion code can only be used ${promotion.perUserLimit} time(s) per user.` },
        { status: 400 }
      );
    }

    // Calculate discount based on promotion type and targeting
    const discountResult = await calculateDiscount(promotion, cartItems, cartTotal);

    if (discountResult.discount === 0) {
      return NextResponse.json(
        { error: "This coupon is not applicable to items in your cart" },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.promotionType,
        couponCode: promotion.couponCode
      },
      discount: discountResult.discount,
      discountType: promotion.promotionType,
      freeItem: discountResult.freeItem,
      message: getSuccessMessage(promotion, discountResult.discount),
      appliedTo: discountResult.appliedItems
    });

  } catch (error) {
    console.error("Error validating promotion:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to validate coupon code" },
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