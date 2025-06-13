"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Types
import { PromotionType } from "@prisma/client";

interface CreatePromotionData {
    name: string;
    description?: string | null;
    promotionType: PromotionType;
    value: number;
    minimumOrderValue?: number | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    couponCode?: string | null;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    freeItemId?: string | null;
    applyToAllItems: boolean;
    categoryIds?: string[];
    productIds?: string[];
    requiresAuthentication?: boolean;
}

interface UpdatePromotionData extends CreatePromotionData {
    id?: string;
}

interface ActionResult {
    success: boolean;
    error?: string;
    promotion?: any;
    promotions?: any[];
}

// Helper function to check admin access
async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId?: string }> {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return { isAdmin: false };
        }

        if (session.user.role !== "ADMIN") {
            return { isAdmin: false };
        }

        return { isAdmin: true, userId: session.user.id };
    } catch (error) {
        console.error("Error checking admin access:", error);
        return { isAdmin: false };
    }
}

// Get all promotions
export async function getPromotions(): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        const promotions = await db.promotion.findMany({
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                products: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                freeItem: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        usageRecords: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Add usage count to promotions and serialize Decimal fields
        const promotionsWithUsage = promotions.map(promo => ({
            ...promo,
            value: promo.value.toNumber(),
            minimumOrderValue: promo.minimumOrderValue?.toNumber() || null,
            usageCount: promo._count.usageRecords
        }));

        return { success: true, promotions: promotionsWithUsage };
    } catch (error) {
        console.error("Error fetching promotions:", error);
        return { success: false, error: "Failed to fetch promotions" };
    }
}

// Get single promotion
export async function getPromotion(id: string): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        const promotion = await db.promotion.findUnique({
            where: { id },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                products: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                freeItem: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        usageRecords: true
                    }
                }
            }
        });

        if (!promotion) {
            return { success: false, error: "Promotion not found" };
        }

        // Add usage count and serialize Decimal fields
        const promotionWithUsage = {
            ...promotion,
            value: promotion.value.toNumber(),
            minimumOrderValue: promotion.minimumOrderValue?.toNumber() || null,
            usageCount: promotion._count.usageRecords
        };

        return { success: true, promotion: promotionWithUsage };
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return { success: false, error: "Failed to fetch promotion" };
    }
}

// Create promotion
export async function createPromotion(data: CreatePromotionData): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        // Validate dates
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        
        if (startDate >= endDate) {
            return { success: false, error: "End date must be after start date" };
        }

        // Check for duplicate coupon codes
        if (data.couponCode) {
            const existingPromotion = await db.promotion.findFirst({
                where: {
                    couponCode: data.couponCode,
                    isActive: true
                }
            });

            if (existingPromotion) {
                return { success: false, error: "Coupon code already exists" };
            }
        }

        // Validate free item exists if FREE_ITEM type
        if (data.promotionType === "FREE_ITEM" && data.freeItemId) {
            const freeItem = await db.product.findUnique({
                where: { id: data.freeItemId }
            });

            if (!freeItem) {
                return { success: false, error: "Selected free item not found" };
            }
        }

        // Create promotion with relationships
        const promotion = await db.promotion.create({
            data: {
                name: data.name,
                description: data.description,
                promotionType: data.promotionType,
                value: data.value,
                minimumOrderValue: data.minimumOrderValue,
                startDate: startDate,
                endDate: endDate,
                isActive: data.isActive,
                couponCode: data.couponCode,
                usageLimit: data.usageLimit,
                perUserLimit: data.perUserLimit,
                freeItemId: data.freeItemId,
                applyToAllItems: data.applyToAllItems,
                requiresAuthentication: data.requiresAuthentication || false,
                categories: data.categoryIds && data.categoryIds.length > 0 ? {
                    connect: data.categoryIds.map(id => ({ id }))
                } : undefined,
                products: data.productIds && data.productIds.length > 0 ? {
                    connect: data.productIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                categories: true,
                products: true,
                freeItem: true
            }
        });

        // Serialize Decimal fields
        const serializedPromotion = {
            ...promotion,
            value: promotion.value.toNumber(),
            minimumOrderValue: promotion.minimumOrderValue?.toNumber() || null
        };

        revalidatePath("/admin/promotions");
        return { success: true, promotion: serializedPromotion };
    } catch (error) {
        console.error("Error creating promotion:", error);
        return { success: false, error: "Failed to create promotion" };
    }
}

// Update promotion
export async function updatePromotion(id: string, data: UpdatePromotionData): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        // Check if promotion exists
        const existingPromotion = await db.promotion.findUnique({
            where: { id },
            include: {
                categories: true,
                products: true
            }
        });

        if (!existingPromotion) {
            return { success: false, error: "Promotion not found" };
        }

        // Validate dates
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        
        if (startDate >= endDate) {
            return { success: false, error: "End date must be after start date" };
        }

        // Check for duplicate coupon codes (excluding current promotion)
        if (data.couponCode) {
            const existingCoupon = await db.promotion.findFirst({
                where: {
                    couponCode: data.couponCode,
                    isActive: true,
                    id: { not: id }
                }
            });

            if (existingCoupon) {
                return { success: false, error: "Coupon code already exists" };
            }
        }

        // Update promotion with relationships
        const promotion = await db.promotion.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                promotionType: data.promotionType,
                value: data.value,
                minimumOrderValue: data.minimumOrderValue,
                startDate: startDate,
                endDate: endDate,
                isActive: data.isActive,
                couponCode: data.couponCode,
                usageLimit: data.usageLimit,
                perUserLimit: data.perUserLimit,
                freeItemId: data.freeItemId,
                applyToAllItems: data.applyToAllItems,
                requiresAuthentication: data.requiresAuthentication || false,
                categories: {
                    set: [], // Clear existing
                    connect: data.categoryIds && data.categoryIds.length > 0 ? 
                        data.categoryIds.map(id => ({ id })) : []
                },
                products: {
                    set: [], // Clear existing
                    connect: data.productIds && data.productIds.length > 0 ? 
                        data.productIds.map(id => ({ id })) : []
                }
            },
            include: {
                categories: true,
                products: true,
                freeItem: true
            }
        });

        // Serialize Decimal fields
        const serializedPromotion = {
            ...promotion,
            value: promotion.value.toNumber(),
            minimumOrderValue: promotion.minimumOrderValue?.toNumber() || null
        };

        revalidatePath("/admin/promotions");
        return { success: true, promotion: serializedPromotion };
    } catch (error) {
        console.error("Error updating promotion:", error);
        return { success: false, error: "Failed to update promotion" };
    }
}

// Delete promotion
export async function deletePromotion(id: string): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        // Check if promotion exists
        const existingPromotion = await db.promotion.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        usageRecords: true
                    }
                }
            }
        });

        if (!existingPromotion) {
            return { success: false, error: "Promotion not found" };
        }

        // Check if promotion has been used
        if (existingPromotion._count.usageRecords > 0) {
            // Instead of deleting, we could mark as inactive
            await db.promotion.update({
                where: { id },
                data: { isActive: false }
            });
            
            revalidatePath("/admin/promotions");
            return { 
                success: true, 
                error: "Promotion has been deactivated instead of deleted due to existing usage history" 
            };
        }

        // Delete promotion usage records first (if any)
        await db.promotionUsage.deleteMany({
            where: { promotionId: id }
        });

        // Delete the promotion
        await db.promotion.delete({
            where: { id }
        });

        revalidatePath("/admin/promotions");
        return { success: true };
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return { success: false, error: "Failed to delete promotion" };
    }
}

// Toggle promotion status
export async function togglePromotionStatus(id: string): Promise<ActionResult> {
    try {
        const { isAdmin } = await checkAdminAccess();
        
        if (!isAdmin) {
            return { success: false, error: "Unauthorized access" };
        }

        const existingPromotion = await db.promotion.findUnique({
            where: { id }
        });

        if (!existingPromotion) {
            return { success: false, error: "Promotion not found" };
        }

        const promotion = await db.promotion.update({
            where: { id },
            data: {
                isActive: !existingPromotion.isActive
            }
        });

        revalidatePath("/admin/promotions");
        return { success: true, promotion };
    } catch (error) {
        console.error("Error toggling promotion status:", error);
        return { success: false, error: "Failed to update promotion status" };
    }
}

/**
 * Records a PromotionUsage entry for a completed order with an applied promotion.
 * Also increments the usageCount on the Promotion.
 *
 * @param orderId The ID of the order that used a promotion
 */
export async function recordPromotionUsage(orderId: string) {
  console.log('🎯 recordPromotionUsage - Starting for order:', orderId);
  
  // Fetch the order with its applied promotion and user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      appliedPromotion: true,
      user: true,
    },
  });

  console.log('🔍 recordPromotionUsage - Order found:', {
    orderId: order?.id,
    hasAppliedPromotion: !!order?.appliedPromotionId,
    appliedPromotionId: order?.appliedPromotionId,
    isGuestOrder: !order?.userId,
    guestEmail: order?.guestEmail,
    userId: order?.userId,
    discountAmount: order?.discountAmount?.toString()
  });

  if (!order || !order.appliedPromotionId || !order.appliedPromotion) {
    console.log('⚠️ recordPromotionUsage - Early exit: missing order, appliedPromotionId, or appliedPromotion');
    return;
  }

  // Check if usage already exists for this order and promotion (idempotency)
  const existing = await prisma.promotionUsage.findFirst({
    where: {
      orderId: order.id,
      promotionId: order.appliedPromotionId,
    },
  });
  
  if (existing) {
    console.log('⚠️ recordPromotionUsage - Usage record already exists:', existing.id);
    return;
  }

  console.log('🔄 recordPromotionUsage - Handling user creation/lookup for promotion usage');
  
  // Handle user lookup/creation for guest orders
  let targetUserId: string;
  
  if (order.userId) {
    // Authenticated user order
    targetUserId = order.userId;
    console.log('✅ recordPromotionUsage - Using authenticated user:', targetUserId);
  } else if (order.guestEmail) {
    // Guest order - find or create user for this email
    let guestUser = await prisma.user.findUnique({
      where: { email: order.guestEmail }
    });
    
    if (!guestUser) {
      // Create a user record for the guest
      guestUser = await prisma.user.create({
        data: {
          email: order.guestEmail,
          name: `Guest User`,
          role: 'USER'
        }
      });
      console.log('✅ recordPromotionUsage - Created guest user:', guestUser.id);
    } else {
      console.log('✅ recordPromotionUsage - Found existing user for guest email:', guestUser.id);
    }
    
    targetUserId = guestUser.id;
  } else {
    console.error('❌ recordPromotionUsage - No userId or guestEmail found in order');
    return;
  }

  console.log('🔄 recordPromotionUsage - Creating usage record with:', {
    promotionId: order.appliedPromotionId,
    orderId: order.id,
    userId: targetUserId,
    discountAmount: order.discountAmount?.toString()
  });

  await prisma.promotionUsage.create({
    data: {
      promotionId: order.appliedPromotionId,
      orderId: order.id,
      userId: targetUserId,
      discountAmount: order.discountAmount || 0,
      originalAmount: order.subtotal,
      finalAmount: order.total,
      couponCode: order.appliedPromotion.couponCode,
    },
  });

  console.log('✅ recordPromotionUsage - Successfully created usage record');
  console.log('🔄 recordPromotionUsage - Incrementing promotion usage count');

  // Increment the promotion's usage count
  await prisma.promotion.update({
    where: { id: order.appliedPromotionId },
    data: {
      usageCount: {
        increment: 1
      }
    }
  });

  console.log('✅ recordPromotionUsage - Successfully incremented promotion usage count');
} 