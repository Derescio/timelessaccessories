'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
  checkInventorySchema
} from '@/lib/validators';
import { CartItemDetails, AddToCartInput, UpdateCartItemInput, RemoveFromCartInput } from '@/types';
import crypto from 'crypto';
// Import our new inventory management functions
import { 
  checkStockAvailability, 
  reserveStock, 
  releaseReservedStock,
  batchCheckStock 
} from './inventory.actions';

/**
 * Get the current user's cart or create a guest cart
 */
export async function getCart() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    console.log('🛒 getCart - User ID:', userId || 'Guest');

    // Find cart based on user authentication status
    let cart;
    if (userId) {
      // For authenticated users, find by userId
      cart = await prisma.cart.findFirst({
        where: { userId: userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              },
              inventory: {
                select: {
                  id: true,
                  sku: true,
                  retailPrice: true,
                  images: true,
                }
              }
            }
          },
          promotions: {
            include: {
              promotion: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  promotionType: true,
                  couponCode: true,
                }
              }
            }
          }
        }
      });
     console.log('🛒 getCart - Found user cart:', !!cart, 'Items:', cart?.items.length || 0);
    } else {
      // For guests, find by sessionId
      const cookieStore = await cookies();
      const sessionCartId = cookieStore.get('sessionCartId')?.value;
      
      //console.log('🛒 getCart - Session Cart ID:', sessionCartId);

      if (sessionCartId) {
        cart = await prisma.cart.findFirst({
          where: { sessionId: sessionCartId },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  }
                },
                inventory: {
                  select: {
                    id: true,
                    sku: true,
                    retailPrice: true,
                    images: true,
                  }
                }
              }
            },
            promotions: {
              include: {
                promotion: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    promotionType: true,
                    couponCode: true,
                  }
                }
              }
            }
          }
        });
       // console.log('🛒 getCart - Found session cart:', !!cart, 'Items:', cart?.items.length || 0);
      } else {
        //console.log('🛒 getCart - No session cart ID found');
      }
    }

    if (cart) {
      //revalidatePath('/cart');
      return formatCartResponse(cart);
    }
  } catch (error) {
    console.error('Error getting cart:', error);
    return undefined;
  }
}

/**
 * Enhanced add to cart with stock validation and reservation
 */
export async function addToCartWithStockValidation(data: AddToCartInput) {
  try {
    console.log('🛒 addToCartWithStockValidation called with:', data);
    
    const validatedData = addToCartSchema.parse(data);
    const { productId, inventoryId, quantity, sessionId: providedSessionId, selectedAttributes } = validatedData;

    // Get user session
    const session = await auth();
    const userId = session?.user?.id;

    // Determine session ID for guests
    let sessionId = providedSessionId;
    if (!sessionId && !userId) {
      const cookieStore = await cookies();
      sessionId = cookieStore.get('sessionCartId')?.value;

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        cookieStore.set('sessionCartId', sessionId, {
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/'
        });
      }
    }

    // Find or create cart
    let cart;
    if (userId) {
      cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
      }
    } else {
      if (!sessionId) {
        return { success: false, message: "Session ID is required for guest carts" };
      }
      cart = await prisma.cart.findUnique({ where: { sessionId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { sessionId } });
      }
    }

    // Check if this inventory item is already in the cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        inventoryId: inventoryId
      }
    });

    const currentQuantityInCart = existingCartItem?.quantity || 0;
    const totalRequestedQuantity = currentQuantityInCart + quantity;

    // Check stock availability for total quantity needed
    const stockCheck = await checkStockAvailability(inventoryId, totalRequestedQuantity);
    
    if (!stockCheck.success || !stockCheck.canFulfill) {
      return {
        success: false,
        message: stockCheck.error || `only ${stockCheck.availableStock} items available. You currently have ${currentQuantityInCart} in your cart.`,
        availableStock: stockCheck.availableStock,
        currentCartQuantity: currentQuantityInCart
      };
    }

    // Reserve the additional stock
    const reserveResult = await reserveStock(inventoryId, quantity);
    if (!reserveResult.success) {
      return {
        success: false,
        message: reserveResult.error || "Failed to reserve stock",
        availableStock: reserveResult.availableStock
      };
    }

    try {
      // Add or update cart item
      let cartItem;
      if (existingCartItem) {
        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { 
            quantity: totalRequestedQuantity,
            selectedAttributes: selectedAttributes ? selectedAttributes : undefined
          },
          include: {
            product: {
              select: {
                name: true,
                slug: true
              }
            },
            inventory: {
              select: {
                sku: true,
                retailPrice: true,
                images: true
              }
            }
          }
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            inventoryId: inventoryId,
            quantity,
            selectedAttributes: selectedAttributes ? selectedAttributes : undefined
          },
          include: {
            product: {
              select: {
                name: true,
                slug: true
              }
            },
            inventory: {
              select: {
                sku: true,
                retailPrice: true,
                images: true
              }
            }
          }
        });
      }

      console.log(`✅ Successfully added ${quantity} items to cart and reserved stock`);
      revalidatePath('/cart');
      
      return { 
        success: true, 
        message: `Added ${quantity} item(s) to cart`,
        cartId: cart.id,
        item: {
          id: cartItem.id,
          productId: cartItem.productId,
          inventoryId: cartItem.inventoryId,
          name: cartItem.product.name,
          slug: cartItem.product.slug,
          quantity: cartItem.quantity,
          price: Number(cartItem.inventory.retailPrice),
          image: cartItem.inventory.images && cartItem.inventory.images.length > 0 
            ? String(cartItem.inventory.images[0]) 
            : '',
        }
      };

    } catch (cartError) {
      // If cart operation failed, release the reserved stock
      console.error('Cart operation failed, releasing reserved stock:', cartError);
      await releaseReservedStock(inventoryId, quantity);
      
      return {
        success: false,
        message: "Failed to add item to cart",
        error: cartError instanceof Error ? cartError.message : "Unknown error"
      };
    }

  } catch (error) {
    console.error('Error in addToCartWithStockValidation:', error);
    return {
      success: false,
      message: error instanceof z.ZodError 
        ? "Invalid input data" 
        : "Failed to add item to cart"
    };
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItem(data: UpdateCartItemInput) {
  try {
    const validatedData = updateCartItemSchema.parse(data);
    const { cartItemId, quantity } = validatedData;

    //console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);
    if (quantity <= 0) {
      // If quantity is zero or less, remove the item
      return await removeFromCartWithStockRelease({ cartItemId });
    }
    
    // Find the cart item with inventory details
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        inventory: true,
        product: true
      },
    });

    if (!cartItem) {
      console.error(`Cart item ${cartItemId} not found`);
      return { success: false, message: "Cart item not found" };
    }

    const currentQuantity = cartItem.quantity;
    const quantityDifference = quantity - currentQuantity;

    console.log(`Found cart item:`, {
      id: cartItem.id,
      productId: cartItem.productId,
      inventoryId: cartItem.inventoryId,
      inventorySku: cartItem.inventory?.sku,
      currentQuantity,
      requestedQuantity: quantity,
      quantityDifference
    });

    // Handle stock reservation changes based on quantity difference
    if (quantityDifference > 0) {
      // Increasing quantity - need to reserve more stock
      console.log(`Increasing quantity by ${quantityDifference}, reserving additional stock`);
      
      // Check if we can reserve the additional stock
      const stockCheck = await checkStockAvailability(cartItem.inventoryId, quantityDifference);
      if (!stockCheck.success || !stockCheck.canFulfill) {
        return {
          success: false,
          message: stockCheck.error || `only ${stockCheck.availableStock} additional items available`
        };
      }

      // Reserve the additional stock
      const reserveResult = await reserveStock(cartItem.inventoryId, quantityDifference);
      if (!reserveResult.success) {
        return {
          success: false,
          message: reserveResult.error || "Failed to reserve additional stock"
        };
      }
    } else if (quantityDifference < 0) {
      // Decreasing quantity - need to release some stock
      const releaseAmount = Math.abs(quantityDifference);
      console.log(`Decreasing quantity by ${releaseAmount}, releasing reserved stock`);
      
      const releaseResult = await releaseReservedStock(cartItem.inventoryId, releaseAmount);
      if (!releaseResult.success) {
        console.warn(`Failed to release reserved stock:`, releaseResult.error);
        // Continue with update even if release fails
      }
    }
    // If quantityDifference === 0, no stock changes needed

    // Update the cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: true,
        inventory: true,
      },
    });

    console.log(`Cart item updated successfully`);

    // Revalidate both cart and product pages
    revalidatePath('/cart');
    revalidatePath(`/products/${cartItem.product.slug}`);

    return {
      success: true,
      message: "Cart item updated",
      item: formatCartItemResponse(updatedItem),
    };
  } catch (error) {
    console.error('Error updating cart item:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided' };
    }
    return { success: false, message: 'Failed to update cart item' };
  }
}

/**
 * Enhanced remove from cart with stock release
 */
export async function removeFromCartWithStockRelease(data: RemoveFromCartInput) {
  try {
    const validatedData = removeFromCartSchema.parse(data);
    const { cartItemId } = validatedData;

    // Find the cart item with inventory details
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: {
        id: true,
        inventoryId: true,
        quantity: true,
        inventory: {
          select: {
            sku: true
          }
        }
      }
    });

    if (!cartItem) {
      return { success: false, message: "Cart item not found" };
    }

    // Release the reserved stock before removing the item
    const releaseResult = await releaseReservedStock(cartItem.inventoryId, cartItem.quantity);
    
    if (!releaseResult.success) {
      console.warn(`Failed to release reserved stock for ${cartItem.inventory.sku}:`, releaseResult.error);
      // Continue with removal even if stock release fails
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    console.log(`✅ Removed ${cartItem.quantity} items from cart and released reserved stock for ${cartItem.inventory.sku}`);
    
    revalidatePath('/cart');
    return { 
      success: true, 
      message: "Item removed from cart",
      releasedStock: releaseResult.success
    };
  } catch (error) {
    console.error('Error removing from cart with stock release:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided' };
    }
    return { success: false, message: 'Failed to remove item from cart' };
  }
}

// Keep original function for backward compatibility (without stock release)
export async function removeFromCartLegacy(data: RemoveFromCartInput) {
  try {
    const validatedData = removeFromCartSchema.parse(data);
    const { cartItemId } = validatedData;

    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      return { success: false, message: "Cart item not found" };
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath('/cart');
    return { success: true, message: "Item removed from cart" };
  } catch (error) {
    console.error('Error removing from cart:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided' };
    }
    return { success: false, message: 'Failed to remove item from cart' };
  }
}

// Main remove function now uses stock release by default
export async function removeFromCart(data: RemoveFromCartInput) {
  return await removeFromCartWithStockRelease(data);
}

/**
 * Clear all items from the cart
 */
export async function clearCart() {
  try {
    const cart = await getCart();

    if (!cart?.id) {
      return { success: false, message: "No cart found" };
    }

    // Get all cart items with inventory details to release stock
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      select: {
        id: true,
        inventoryId: true,
        quantity: true,
        inventory: {
          select: {
            sku: true
          }
        }
      }
    });

    // Release reserved stock for all items
    for (const item of cartItems) {
      const releaseResult = await releaseReservedStock(item.inventoryId, item.quantity);
      if (!releaseResult.success) {
        console.warn(`Failed to release reserved stock for ${item.inventory.sku}:`, releaseResult.error);
      }
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    console.log(`✅ Cleared cart and released reserved stock for ${cartItems.length} items`);

    revalidatePath('/cart');
    return { success: true, message: "Cart cleared" };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, message: 'Failed to clear cart' };
  }
}

/**
 * Merge a guest cart with a user cart after login
 */
export async function mergeGuestCartWithUserCart(sessionId: string, userId: string) {
  try {
    // Find the guest cart
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart) {
      return { success: true, message: "No guest cart to merge" };
    }

    // Find the user cart
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    // If no user cart exists, assign this cart to the user
    if (!userCart) {
      await prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, sessionId: null },
      });

      revalidatePath('/cart');
      return { success: true, message: "Guest cart assigned to user" };
    }

    // Merge items from guest cart to user cart
    for (const item of guestCart.items) {
      const existingItem = userCart.items.find(i => i.inventoryId === item.inventoryId);

      if (existingItem) {
        // Update quantity if item exists in user cart
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      } else {
        // Move item to user cart
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { cartId: userCart.id },
        });
      }
    }

    // Delete the now-empty guest cart
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('sessionCartId');

    revalidatePath('/cart');
    return { success: true, message: "Carts merged successfully" };
  } catch (error) {
    console.error('Error merging carts:', error);
    return { success: false, message: 'Failed to merge carts' };
  }
}

/**
 * Check if inventory is available for the requested quantity
 */
export async function checkInventoryAvailability(data: z.infer<typeof checkInventorySchema>) {
  try {
    console.log('checkInventoryAvailability - Called with:', data);
    
    const validatedData = checkInventorySchema.parse(data);
    const { inventoryId, quantity } = validatedData;

    // Find inventory by SKU
    const inventory = await prisma.productInventory.findUnique({
      where: { sku: inventoryId },
    });

    console.log('checkInventoryAvailability - Inventory lookup result:', {
      found: !!inventory,
      id: inventory?.id,
      sku: inventory?.sku,
      quantity: inventory?.quantity
    });

    if (!inventory) {
      console.error('checkInventoryAvailability - Inventory not found with SKU:', inventoryId);
      return {
        success: false,
        message: "Product variant not found",
      };
    }

    // Check if inventory has enough stock
    if (inventory.quantity < quantity) {
      return {
        success: false,
        message: `Only ${inventory.quantity} items available`,
      };
    }

    return {
      success: true,
      message: "Inventory is available",
      inventorySku: inventory.sku, // Return the actual SKU from the database
    };
  } catch (error) {
    console.error('checkInventoryAvailability - Error:', error);
    return { success: false, message: "Failed to check inventory" };
  }
}

/**
 * Format the cart response for the client
 */
function formatCartResponse(cart: Record<string, unknown>) {
  const typedCart = cart as {
    id: string;
    userId: string | null;
    sessionId: string | null;
    items: Array<Record<string, unknown>>;
    promotions?: Array<{
      id: string;
      couponCode: string;
      discount: string | number;
      discountType: string;
      appliedItems: string[];
      freeItem?: Record<string, unknown> | null;
      promotion: {
        id: string;
        name: string;
        description?: string | null;
        promotionType: string;
        couponCode?: string | null;
      };
    }>;
  };

  const subtotal = typedCart.items.reduce((acc: number, item) => {
    const typedItem = item as {
      inventory: { retailPrice: string | number; compareAtPrice?: string | number; discountPercentage?: number; hasDiscount?: boolean };
      quantity: number;
    };

    // For items with a discount, use the compareAtPrice as the base for discount calculation
    let price = Number(typedItem.inventory.retailPrice);

    // If this item has a discount and a compareAtPrice, calculate the proper discounted price
    if (typedItem.inventory.hasDiscount &&
      typedItem.inventory.discountPercentage &&
      typedItem.inventory.compareAtPrice) {
      const compareAtPrice = Number(typedItem.inventory.compareAtPrice);
      const discountPercentage = typedItem.inventory.discountPercentage;
      price = compareAtPrice * (1 - discountPercentage / 100);
    }

    return acc + (price * typedItem.quantity);
  }, 0);

  // Calculate total discount from promotions
  const totalDiscount = (typedCart.promotions || []).reduce((acc: number, promo) => {
    return acc + Number(promo.discount);
  }, 0);

  return {
    id: typedCart.id,
    userId: typedCart.userId,
    sessionId: typedCart.sessionId,
    items: typedCart.items.map(formatCartItemResponse),
    promotions: (typedCart.promotions || []).map(promo => ({
      id: promo.promotion.id,
      name: promo.promotion.name,
      description: promo.promotion.description,
      type: promo.promotion.promotionType,
      couponCode: promo.couponCode,
      discount: Number(promo.discount),
      discountType: promo.discountType,
      appliedTo: promo.appliedItems,
      freeItem: promo.freeItem || null,
      cartId: typedCart.id
    })),
    itemCount: typedCart.items.reduce((acc: number, item) => {
      const typedItem = item as { quantity: number };
      return acc + typedItem.quantity;
    }, 0),
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
  };
}

/**
 * Format a cart item response for the client
 */
function formatCartItemResponse(item: Record<string, unknown>): CartItemDetails {
  // Extend the typed item to include the missing properties that are actually there
  const typedItem = item as unknown as {
    id: string;
    quantity: number;
    productId: string;
    inventoryId: string;
    selectedAttributes?: Record<string, string>;
    product: {
      name: string;
      slug: string;
      id: string;
      [key: string]: unknown;
    };
    inventory: {
      retailPrice: string | number;
      compareAtPrice?: string | number;
      discountPercentage?: number;
      quantity?: number;
      sku?: string;
      images?: unknown[];
      hasDiscount?: boolean;
      [key: string]: unknown;
    };
  };

  // Calculate the actual price considering discounts
  let price = Number(typedItem.inventory.retailPrice);

  // If this item has a discount and a compareAtPrice, calculate the proper discounted price
  if (typedItem.inventory.hasDiscount &&
    typedItem.inventory.discountPercentage &&
    typedItem.inventory.compareAtPrice) {
    const compareAtPrice = Number(typedItem.inventory.compareAtPrice);
    const discountPercentage = typedItem.inventory.discountPercentage;
    price = compareAtPrice * (1 - discountPercentage / 100);
  }

  return {
    id: typedItem.id,
    productId: typedItem.productId,
    inventoryId: typedItem.inventoryId,
    name: typedItem.product.name,
    slug: typedItem.product.slug,
    quantity: typedItem.quantity,
    price,
    // Handle possibly missing images array
    image: typedItem.inventory.images && typedItem.inventory.images.length > 0
      ? String(typedItem.inventory.images[0] || '')
      : '',
    // Ensure null instead of undefined for discountPercentage
    discountPercentage: typedItem.inventory.discountPercentage ?? null,
    // Default to false if hasDiscount is undefined
    hasDiscount: Boolean(typedItem.inventory.hasDiscount),
    // Default to 0 if quantity is undefined
    maxQuantity: typedItem.inventory.quantity ?? 0,
    // Include selected attributes from cart item
    attributes: typedItem.selectedAttributes || {},
  };
}

/**
 * Clean up cart after successful payment
 */
export const cleanupCartAfterSuccessfulPayment = async (orderId: string) => {
  try {
    // Get the order to find the cart
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { cartId: true }
    });

    if (!order || !order.cartId) {
      console.warn(`No cart found for order: ${orderId}`);
      return { success: true, message: "No cart to clean up" };
    }

    // Delete cart items first
    await prisma.cartItem.deleteMany({
      where: { cartId: order.cartId }
    });

    // Delete the cart
    await prisma.cart.delete({
      where: { id: order.cartId }
    });
    // Trigger revalidation for the cart and header
    revalidatePath('/cart'); // Revalidate the cart page
    revalidatePath('/'); // Rev
    // setTimeout(() => {
    //  alidate the header or home page if needed
    // }, 1000);

    return { success: true };
  } catch (error) {
    console.error("Error cleaning up cart:", error);
    return { success: false, error: error };
  }
};

/**
 * Validate entire cart stock before checkout
 */
/**
 * Add a promotion to a cart
 */
export async function addPromotionToCart(cartId: string, promotionData: {
  promotionId: string;
  couponCode: string;
  discount: number;
  discountType: string;
  appliedItems: string[];
  freeItem?: { id: string; name: string } | null;
}) {
  try {
    console.log('🎯 [addPromotionToCart] Adding promotion to cart:', {
      cartId,
      promotionId: promotionData.promotionId,
      couponCode: promotionData.couponCode,
      discount: promotionData.discount
    });

    // Check if promotion already exists for this cart
    const existingPromotion = await prisma.cartPromotion.findUnique({
      where: {
        cartId_promotionId: {
          cartId,
          promotionId: promotionData.promotionId
        }
      }
    });

    if (existingPromotion) {
      return { success: false, error: 'Promotion already applied to this cart' };
    }

    // Add the promotion to the cart
    await prisma.cartPromotion.create({
      data: {
        cartId,
        promotionId: promotionData.promotionId,
        couponCode: promotionData.couponCode,
        discount: promotionData.discount,
        discountType: promotionData.discountType,
        appliedItems: promotionData.appliedItems,
        freeItem: promotionData.freeItem || undefined,
      }
    });

    // Revalidate cart-related pages
    revalidatePath('/cart');
    revalidatePath('/shipping');

    console.log('✅ [addPromotionToCart] Promotion added successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ [addPromotionToCart] Error:', error);
    return { success: false, error: 'Failed to add promotion to cart' };
  }
}

/**
 * Remove a promotion from a cart
 */
export async function removePromotionFromCart(cartId: string, promotionId: string) {
  try {
    console.log('🎯 [removePromotionFromCart] Removing promotion:', {
      cartId,
      promotionId
    });

    await prisma.cartPromotion.delete({
      where: {
        cartId_promotionId: {
          cartId,
          promotionId
        }
      }
    });

    // Revalidate cart-related pages
    revalidatePath('/cart');
    revalidatePath('/shipping');

    console.log('✅ [removePromotionFromCart] Promotion removed successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ [removePromotionFromCart] Error:', error);
    return { success: false, error: 'Failed to remove promotion from cart' };
  }
}

/**
 * Get promotions for a specific cart
 */
export async function getCartPromotions(cartId: string) {
  try {
    const promotions = await prisma.cartPromotion.findMany({
      where: { cartId },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            description: true,
            promotionType: true,
            couponCode: true,
          }
        }
      }
    });

    return promotions.map(promo => ({
      id: promo.promotion.id,
      name: promo.promotion.name,
      description: promo.promotion.description,
      type: promo.promotion.promotionType,
      couponCode: promo.couponCode,
      discount: Number(promo.discount),
      discountType: promo.discountType,
      appliedTo: promo.appliedItems,
      freeItem: promo.freeItem || null,
      cartId: cartId
    }));

  } catch (error) {
    console.error('❌ [getCartPromotions] Error:', error);
    return [];
  }
}

export async function validateCartStock(cartId?: string) {
  try {
    // Get the cart with full data
    let cart;
    if (cartId) {
      cart = await prisma.cart.findUnique({
        where: { id: cartId },
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
              },
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    } else {
      // For the current user cart, we need to get it differently
      const userCart = await getCart();
      if (!userCart) {
        return { success: false, error: "Cart not found" };
      }
      
      // Get full cart data from database
      cart = await prisma.cart.findUnique({
        where: { id: userCart.id },
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
              },
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    }

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    // Prepare items for batch stock check
    const itemsToCheck = cart.items.map(item => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity
    }));

    // Batch check stock availability
    const stockResults = await batchCheckStock(itemsToCheck);

    // Find any items that failed stock validation
    const failedItems = stockResults
      .filter(result => !result.success || !result.canFulfill)
      .map(result => {
        const cartItem = cart!.items.find(item => item.inventoryId === result.inventoryId);
        return {
          inventoryId: result.inventoryId,
          productName: cartItem?.product.name || "Unknown Product",
          sku: cartItem?.inventory.sku || "",
          requestedQuantity: result.requestedQuantity,
          availableStock: result.availableStock,
          error: result.error
        };
      });

    return {
      success: failedItems.length === 0,
      isValid: failedItems.length === 0,
      failedItems,
      totalItems: cart.items.length,
      validItems: cart.items.length - failedItems.length
    };

  } catch (error) {
    console.error('Error validating cart stock:', error);
    return { 
      success: false, 
      error: "Failed to validate cart stock",
      isValid: false,
      failedItems: [],
      totalItems: 0,
      validItems: 0
    };
  }
}

// Legacy alias for backward compatibility
export const addToCart = addToCartWithStockValidation;
