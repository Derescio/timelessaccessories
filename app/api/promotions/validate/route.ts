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
  promotionId: z.string(),
  cartItems: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
    categoryId: z.string().optional()
  })),
  cartTotal: z.number(),
  userEmail: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = validatePromotionSchema.parse(body);
    
    const { promotionId, cartItems, cartTotal, userEmail } = validatedData;
    
    console.log('🔍 Validating promotion:', promotionId, 'for cart total:', cartTotal);
    
    // Get the promotion details
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
      include: {
        categories: true,
        products: true,
        usageRecords: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!promotion) {
      return NextResponse.json({
        valid: false,
        reason: "Promotion not found"
      });
    }
    
    // Check if promotion is active
    if (!promotion.isActive) {
      return NextResponse.json({
        valid: false,
        reason: "Promotion is no longer active"
      });
    }
    
    // Check if promotion has expired
    const now = new Date();
    if (promotion.endDate && new Date(promotion.endDate) < now) {
      return NextResponse.json({
        valid: false,
        reason: "Promotion has expired"
      });
    }
    
    // Check if promotion hasn't started yet
    if (promotion.startDate && new Date(promotion.startDate) > now) {
      return NextResponse.json({
        valid: false,
        reason: "Promotion hasn't started yet"
      });
    }
    
    // Check usage limits
    if (promotion.usageLimit && promotion.usageRecords.length >= promotion.usageLimit) {
      return NextResponse.json({
        valid: false,
        reason: "Promotion usage limit exceeded"
      });
    }
    
    // Check minimum order value
    if (promotion.minimumOrderValue && cartTotal < promotion.minimumOrderValue.toNumber()) {
      return NextResponse.json({
        valid: false,
        reason: `Minimum order value of $${promotion.minimumOrderValue} not met`
      });
    }
    
    // Check per-user limit if user email is provided
    if (promotion.perUserLimit && userEmail) {
      const userUsageCount = promotion.usageRecords.filter(record => 
        record.user?.email === userEmail
      ).length;
      
      if (userUsageCount >= promotion.perUserLimit) {
        return NextResponse.json({
          valid: false,
          reason: "Per-user usage limit exceeded"
        });
      }
    }
    
    // Check product/category restrictions
    if (!promotion.applyToAllItems) {
      const promotionProductIds = promotion.products.map(p => p.id);
      const promotionCategoryIds = promotion.categories.map(c => c.id);
      
      const hasEligibleItems = cartItems.some(item => 
        promotionProductIds.includes(item.productId) ||
        (item.categoryId && promotionCategoryIds.includes(item.categoryId))
      );
      
      if (!hasEligibleItems) {
        return NextResponse.json({
          valid: false,
          reason: "No eligible items in cart for this promotion"
        });
      }
    }
    
    console.log('✅ Promotion validation passed for:', promotionId);
    
    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        couponCode: promotion.couponCode,
        promotionType: promotion.promotionType,
        value: promotion.value.toNumber()
      }
    });
    
  } catch (error) {
    console.error("❌ Error validating promotion:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, reason: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { valid: false, reason: "Failed to validate promotion" },
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