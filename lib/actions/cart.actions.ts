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

/**
 * Get the current user's cart or create a guest cart
 */
export async function getCart() {
  try {
    // Check if user is logged in
    const session = await auth();
    const userId = session?.user?.id;

    // For logged-in users, get their cart
    if (userId) {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      });

      if (cart) {
        return formatCartResponse(cart);
      }
    }

    // For guests or users without a cart, check for session ID
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionCartId')?.value;
    
    if (!sessionId) {
      // If no session ID, return null - will be created on first add to cart
      return null;
    }

    // Find cart for this session
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
            inventory: true,
          },
        },
      },
    });

    if (guestCart) {
      return formatCartResponse(guestCart);
    }

    return null;
  } catch (error) {
    console.error('Error getting cart:', error);
    return null;
  }
}

/**
 * Add an item to the cart
 */
export async function addToCart(data: AddToCartInput) {
  try {
    const validatedData = addToCartSchema.parse(data);
    const { productId, inventoryId, quantity, sessionId: providedSessionId } = validatedData;

    // Check inventory availability
    const inventoryCheck = await checkInventoryAvailability({
      inventoryId,
      quantity,
    });

    if (!inventoryCheck.success) {
      return inventoryCheck;
    }

    // Use the actual inventory SKU returned by checkInventoryAvailability
    const actualInventoryId = inventoryCheck.inventorySku || inventoryId;

    // Get user session
    const session = await auth();
    const userId = session?.user?.id;

    // Determine session ID
    let sessionId = providedSessionId;
    if (!sessionId && !userId) {
      // If no session ID provided and no user ID, try to get from cookies
      const cookieStore = await cookies();
      sessionId = cookieStore.get('sessionCartId')?.value;
      
      // If still no session ID, we need to create one
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
      // For logged-in users
      cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
        });
      }
    } else if (sessionId) {
      // For guests with a session ID
      cart = await prisma.cart.findUnique({
        where: { sessionId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId },
        });
      }
    } else {
      return { 
        success: false, 
        message: "User ID or session ID is required" 
      };
    }

    // Check if this inventory item is already in the cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        inventory: {
          sku: actualInventoryId
        }
      },
    });

    if (existingCartItem) {
      // Update quantity if item exists
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { 
          quantity: existingCartItem.quantity + quantity 
        },
        include: {
          product: true,
          inventory: true,
        },
      });

      revalidatePath('/cart');
      return { 
        success: true, 
        message: "Item quantity updated in cart",
        item: formatCartItemResponse(updatedItem),
      };
    } else {
      // Find the inventory item by SKU first
      const inventoryItem = await prisma.productInventory.findUnique({
        where: { sku: actualInventoryId },
      });

      if (!inventoryItem) {
        return { 
          success: false, 
          message: "Product variant not found" 
        };
      }

      // Add new item if it doesn't exist
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          inventoryId: inventoryItem.id, // Use the actual inventory ID
          quantity,
        },
        include: {
          product: true,
          inventory: true,
        },
      });

      revalidatePath('/cart');
      return { 
        success: true, 
        message: "Item added to cart",
        item: formatCartItemResponse(newItem),
      };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided' };
    }
    return { success: false, message: 'Failed to add item to cart' };
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItem(data: UpdateCartItemInput) {
  try {
    const validatedData = updateCartItemSchema.parse(data);
    const { cartItemId, quantity } = validatedData;

    console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);

    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { inventory: true },
    });

    if (!cartItem) {
      console.error(`Cart item ${cartItemId} not found`);
      return { success: false, message: "Cart item not found" };
    }

    console.log(`Found cart item:`, {
      id: cartItem.id,
      productId: cartItem.productId,
      inventoryId: cartItem.inventoryId,
      inventorySku: cartItem.inventory?.sku
    });

    // Check inventory availability
    const inventoryCheck = await checkInventoryAvailability({
      inventoryId: cartItem.inventory.sku, // Use the SKU from the inventory relation
      quantity,
    });

    if (!inventoryCheck.success) {
      console.error(`Inventory check failed:`, inventoryCheck);
      return inventoryCheck;
    }

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
    revalidatePath('/cart');
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
 * Remove an item from the cart
 */
export async function removeFromCart(data: RemoveFromCartInput) {
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

/**
 * Clear all items from the cart
 */
export async function clearCart() {
  try {
    const cart = await getCart();
    
    if (!cart?.id) {
      return { success: false, message: "No cart found" };
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

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
 * Check if there's enough inventory for a requested quantity
 */
export async function checkInventoryAvailability(data: z.infer<typeof checkInventorySchema>) {
  try {
    const validatedData = checkInventorySchema.parse(data);
    const { inventoryId, quantity } = validatedData;
    
    if (!inventoryId) {
      console.error('No inventory ID provided');
      return { success: false, message: "Missing inventory information" };
    }
    
    // Try to find inventory by SKU
    const inventory = await prisma.productInventory.findUnique({
      where: { sku: inventoryId },
    });

    if (!inventory) {
      // If SKU not found, try to find by product ID (for backward compatibility)
      const product = await prisma.product.findUnique({
        where: { id: inventoryId },
        include: {
          inventories: {
            where: {
              quantity: { gt: 0 },
              isDefault: true,
            },
            take: 1,
          },
        },
      });
      
      if (product?.inventories && product.inventories.length > 0) {
        const defaultInventory = product.inventories[0];
        console.log(`Found product inventory for product ID ${inventoryId}, using SKU: ${defaultInventory.sku}`);
        
        if (defaultInventory.quantity < quantity) {
          return { 
            success: false, 
            message: `Only ${defaultInventory.quantity} items available`,
            availableQuantity: defaultInventory.quantity
          };
        }
        
        return { 
          success: true, 
          message: "Inventory available",
          inventorySku: defaultInventory.sku
        };
      }
      
      console.error(`No inventory found with SKU ${inventoryId}`);
      return { success: false, message: "Product variant not found" };
    }

    if (inventory.quantity < quantity) {
      return { 
        success: false, 
        message: `Only ${inventory.quantity} items available`,
        availableQuantity: inventory.quantity
      };
    }

    return { 
      success: true, 
      message: "Inventory available",
      inventorySku: inventory.sku
    };
  } catch (error) {
    console.error('Error checking inventory:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid data provided' };
    }
    return { success: false, message: 'Failed to check inventory' };
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
  };
  
  return {
    id: typedCart.id,
    userId: typedCart.userId,
    sessionId: typedCart.sessionId,
    items: typedCart.items.map(formatCartItemResponse),
    itemCount: typedCart.items.reduce((acc: number, item) => {
      const typedItem = item as { quantity: number };
      return acc + typedItem.quantity;
    }, 0),
    total: typedCart.items.reduce((acc: number, item) => {
      const typedItem = item as { 
        inventory: { retailPrice: string | number; discountPercentage?: number };
        quantity: number;
      };
      const price = Number(typedItem.inventory.retailPrice);
      const discountPercentage = typedItem.inventory.discountPercentage || 0;
      const actualPrice = price * (1 - discountPercentage / 100);
      return acc + (actualPrice * typedItem.quantity);
    }, 0),
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
    product: {
      name: string;
      slug: string;
      id: string;
      [key: string]: unknown;
    };
    inventory: {
      retailPrice: string | number;
      discountPercentage?: number;
      quantity?: number;
      sku?: string;
      images?: unknown[];
      hasDiscount?: boolean;
      [key: string]: unknown;
    };
  };
  
  // Calculate the actual price considering discounts
  const basePrice = Number(typedItem.inventory.retailPrice);
  const discountPercentage = typedItem.inventory.discountPercentage ?? null;
  const price = discountPercentage 
    ? basePrice * (1 - discountPercentage / 100) 
    : basePrice;

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
  };
}
