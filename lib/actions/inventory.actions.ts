"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ProductInventoryFormValues } from "@/lib/types/product.types";
import { prisma } from "@/lib/prisma";

// Create a new inventory item for a product
export async function addInventory(data: ProductInventoryFormValues) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Ensure productId is defined
    if (!data.productId) {
      return { success: false, error: "Product ID is required" };
    }
    
    // Debug logging for images
    //console.log("Received images for new inventory:", data.images);
    
    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: data.productId },
    });
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    
    // Check if SKU is unique
    if (data.sku) {
      const existingSku = await db.productInventory.findUnique({
        where: { sku: data.sku },
      });
      
      if (existingSku) {
        return { success: false, error: "An inventory item with this SKU already exists" };
      }
    }
    
    // If it's set as default, unset any existing default
    if (data.isDefault) {
      await db.productInventory.updateMany({
        where: { 
          productId: data.productId,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }
    
    // Convert Decimal values to numbers and ensure images array is properly included
    const inventoryData = {
      ...data,
      costPrice: Number(data.costPrice),
      retailPrice: Number(data.retailPrice),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      images: Array.isArray(data.images) ? data.images : [], // Ensure images is an array
    };
    
    //console.log("Processed inventory data before saving:", inventoryData);
    
    // Create new inventory item
    const inventory = await db.productInventory.create({
      data: inventoryData
    });
    
    //console.log("Created inventory with images:", inventory.images);
    
    revalidatePath(`/admin/products/${data.productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    
    return { success: true, data: inventory };
  } catch (error) {
    console.error("Error adding inventory:", error);
    return { success: false, error: "Failed to add inventory item" };
  }
}

// Update an existing inventory item
export async function updateInventory(data: ProductInventoryFormValues) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Debug logging for images
    //console.log("Received images for inventory update:", data.images);
    
    if (!data.id) {
      return { success: false, error: "Inventory ID is required" };
    }
    
    // Ensure productId is defined
    if (!data.productId) {
      return { success: false, error: "Product ID is required" };
    }
    
    // Check if inventory exists
    const inventory = await db.productInventory.findUnique({
      where: { id: data.id },
    });
    
    if (!inventory) {
      return { success: false, error: "Inventory item not found" };
    }
    
    // Check if SKU is unique (if changed)
    if (data.sku !== inventory.sku) {
      const existingSku = await db.productInventory.findUnique({
        where: { sku: data.sku },
      });
      
      if (existingSku) {
        return { success: false, error: "An inventory item with this SKU already exists" };
      }
    }
    
    // If it's set as default, unset any existing default
    if (data.isDefault && !inventory.isDefault) {
      await db.productInventory.updateMany({
        where: { 
          productId: data.productId,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }
    
    // Convert Decimal values to numbers and ensure images array is properly included
    const inventoryData = {
      ...data,
      costPrice: Number(data.costPrice),
      retailPrice: Number(data.retailPrice),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      images: Array.isArray(data.images) ? data.images : [], // Ensure images is an array
    };
    
    //console.log("Processed inventory data before updating:", inventoryData);
    
    // Update inventory
    const updatedInventory = await db.productInventory.update({
      where: { id: data.id },
      data: inventoryData
    });
    
   // console.log("Updated inventory with images:", updatedInventory.images);
    
    // Convert Decimal values to numbers in the response
    const transformedInventory = {
      ...updatedInventory,
      costPrice: Number(updatedInventory.costPrice),
      retailPrice: Number(updatedInventory.retailPrice),
      compareAtPrice: updatedInventory.compareAtPrice ? Number(updatedInventory.compareAtPrice) : null,
    };
    
    revalidatePath(`/admin/products/${data.productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    
    return { success: true, data: transformedInventory };
  } catch (error) {
    console.error("Error updating inventory:", error);
    return { success: false, error: "Failed to update inventory item" };
  }
}

// Delete an inventory item
export async function deleteInventory(id: string) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Check if inventory exists
    const inventory = await db.productInventory.findUnique({
      where: { id },
      include: { product: true }
    });
    
    if (!inventory) {
      return { success: false, error: "Inventory item not found" };
    }
    
    // Don't allow deletion if it's the only inventory item for the product
    const inventoryCount = await db.productInventory.count({
      where: { productId: inventory.productId }
    });
    
    if (inventoryCount <= 1) {
      return { success: false, error: "Cannot delete the only inventory item for this product" };
    }
    
    // If deleting the default inventory, set another one as default
    if (inventory.isDefault) {
      const nextInventory = await db.productInventory.findFirst({
        where: {
          productId: inventory.productId,
          id: { not: id }
        }
      });
      
      if (nextInventory) {
        await db.productInventory.update({
          where: { id: nextInventory.id },
          data: { isDefault: true }
        });
      }
    }
    
    // Delete inventory
    await db.productInventory.delete({
      where: { id }
    });
    
    revalidatePath(`/admin/products/${inventory.productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return { success: false, error: "Failed to delete inventory item" };
  }
}

// Get inventory item by ID
export async function getInventoryById(id: string) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    const inventory = await db.productInventory.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            categoryId: true,
            productTypeId: true,
            isActive: true,
            isFeatured: true,
            metadata: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    
    if (!inventory) {
      return { success: false, error: "Inventory item not found" };
    }
    
    // Transform the data to convert Decimal values to numbers and serialize all fields
    const transformedInventory = {
      ...inventory,
      retailPrice: Number(inventory.retailPrice),
      costPrice: Number(inventory.costPrice),
      compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null,
      quantity: Number(inventory.quantity),
      lowStock: Number(inventory.lowStock),
      // Ensure attributes are serialized properly
      attributes: inventory.attributes ? JSON.parse(JSON.stringify(inventory.attributes)) : {},
      // Ensure dates are serialized properly
      createdAt: inventory.createdAt.toISOString(),
      updatedAt: inventory.updatedAt.toISOString()
    };
    
    return { success: true, data: transformedInventory };
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return { success: false, error: "Failed to fetch inventory item" };
  }
}

// Types for our inventory operations
interface StockCheckResult {
  success: boolean;
  availableStock: number;
  canFulfill: boolean;
  requestedQuantity: number;
  error?: string;
}

interface StockOperationResult {
  success: boolean;
  error?: string;
  reservedQuantity?: number;
  availableStock?: number;
}

interface LowStockItem {
  id: string;
  sku: string;
  quantity: number;
  reservedStock: number;
  lowStock: number;
  availableStock: number;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Check stock availability for a given inventory item
 */
export async function checkStockAvailability(
  inventoryId: string,
  requestedQuantity: number
): Promise<StockCheckResult> {
  try {
    // Try to find by ID first, then by SKU for backward compatibility
    let inventory = await prisma.productInventory.findUnique({
      where: { id: inventoryId },
      select: { 
        id: true,
        quantity: true, 
        reservedStock: true,
        sku: true,
        product: {
          select: { name: true }
        }
      }
    });

    // If not found by ID, try by SKU (this is what the cart system uses)
    if (!inventory) {
      inventory = await prisma.productInventory.findUnique({
        where: { sku: inventoryId },
        select: { 
          id: true,
          quantity: true, 
          reservedStock: true,
          sku: true,
          product: {
            select: { name: true }
          }
        }
      });
    }

    if (!inventory) {
      return { 
        success: false, 
        error: "Product not found", 
        availableStock: 0,
        canFulfill: false,
        requestedQuantity
      };
    }

    const availableStock = inventory.quantity - (inventory.reservedStock || 0);
    const canFulfill = availableStock >= requestedQuantity;

    return {
      success: true,
      availableStock,
      canFulfill,
      requestedQuantity,
      error: canFulfill ? undefined : `Only ${availableStock} items available`
    };
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return { 
      success: false, 
      error: "Failed to check stock availability", 
      availableStock: 0,
      canFulfill: false,
      requestedQuantity
    };
  }
}

/**
 * Reserve stock for a given inventory item (used when adding to cart)
 */
export async function reserveStock(
  inventoryId: string, 
  quantity: number
): Promise<StockOperationResult> {
  try {
    // First check if we have enough stock
    const stockCheck = await checkStockAvailability(inventoryId, quantity);
    
    if (!stockCheck.success || !stockCheck.canFulfill) {
      return { 
        success: false, 
        error: stockCheck.error || `Only ${stockCheck.availableStock} items available`,
        availableStock: stockCheck.availableStock
      };
    }

    // Find the actual inventory record to get the database ID
    let inventory = await prisma.productInventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, sku: true }
    });

    // If not found by ID, try by SKU
    if (!inventory) {
      inventory = await prisma.productInventory.findUnique({
        where: { sku: inventoryId },
        select: { id: true, sku: true }
      });
    }

    if (!inventory) {
      return { success: false, error: "Inventory not found" };
    }

    // Use the actual database ID for the update operation
    const actualInventoryId = inventory.id;
    
    console.log(`Reserving ${quantity} units for inventory ${inventory.sku} (ID: ${actualInventoryId})`);

    await prisma.productInventory.update({
      where: { id: actualInventoryId },
      data: {
        reservedStock: { increment: quantity }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error reserving stock:', error);
    return { success: false, error: "Failed to reserve stock" };
  }
}

/**
 * Release reserved stock (used when removing from cart or canceling order)
 */
export async function releaseReservedStock(
  inventoryId: string, 
  quantity: number
): Promise<StockOperationResult> {
  try {
    // Find the actual inventory record to get the database ID
    let inventory = await prisma.productInventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, reservedStock: true, sku: true }
    });

    // If not found by ID, try by SKU
    if (!inventory) {
      inventory = await prisma.productInventory.findUnique({
        where: { sku: inventoryId },
        select: { id: true, reservedStock: true, sku: true }
      });
    }

    if (!inventory) {
      return { success: false, error: "Inventory not found" };
    }

    // Don't try to release more than what's reserved
    const releaseQuantity = Math.min(quantity, inventory.reservedStock);

    if (releaseQuantity > 0) {
      const updatedInventory = await prisma.productInventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { decrement: releaseQuantity } },
        select: { 
          quantity: true, 
          reservedStock: true,
          sku: true
        }
      });

      console.log(`Released ${releaseQuantity} reserved units for inventory ${updatedInventory.sku}`);

      return { 
        success: true, 
        reservedQuantity: releaseQuantity,
        availableStock: updatedInventory.quantity - updatedInventory.reservedStock
      };
    }

    return { success: true, reservedQuantity: 0 };
  } catch (error) {
    console.error("Error releasing reserved stock:", error);
    return { 
      success: false, 
      error: "Failed to release reserved stock" 
    };
  }
}

/**
 * Reduce actual stock when order is confirmed (payment successful)
 */
export async function reduceActualStock(
  inventoryId: string, 
  quantity: number
): Promise<StockOperationResult> {
  try {
    console.log(`🔄 reduceActualStock called with inventoryId: ${inventoryId}, quantity: ${quantity}`);
    
    await prisma.$transaction(async (tx) => {
      // Find the actual inventory record to get the database ID
      let inventory = await tx.productInventory.findUnique({
        where: { id: inventoryId },
        select: { 
          id: true,
          quantity: true, 
          reservedStock: true,
          sku: true
        }
      });

      // If not found by ID, try by SKU
      if (!inventory) {
        console.log(`📋 Inventory not found by ID ${inventoryId}, trying by SKU...`);
        inventory = await tx.productInventory.findUnique({
          where: { sku: inventoryId },
          select: { 
            id: true,
            quantity: true, 
            reservedStock: true,
            sku: true
          }
        });
      }

      if (!inventory) {
        console.error(`❌ Inventory not found for ${inventoryId}`);
        throw new Error("Inventory not found");
      }

      console.log(`📊 Found inventory ${inventory.sku}:`, {
        currentQuantity: inventory.quantity,
        currentReservedStock: inventory.reservedStock,
        requestedReduction: quantity
      });

      // Ensure we don't reduce more stock than available
      if (inventory.quantity < quantity) {
        const errorMsg = `Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Calculate how much reserved stock to release
      // Only release what's actually reserved, prevent negative values
      const reservedStockToRelease = Math.min(quantity, inventory.reservedStock);
      
      console.log(`🔄 Reducing stock: quantity by ${quantity}, reservedStock by ${reservedStockToRelease} (of ${inventory.reservedStock} available)`);

      // Reduce actual stock and release appropriate amount of reserved stock
      const updateResult = await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: quantity },
          reservedStock: { decrement: reservedStockToRelease }
        },
        select: {
          sku: true,
          quantity: true,
          reservedStock: true
        }
      });

      console.log(`✅ Stock updated for ${updateResult.sku}:`, {
        newQuantity: updateResult.quantity,
        newReservedStock: updateResult.reservedStock,
        releasedReservedStock: reservedStockToRelease
      });
    });

    console.log(`✅ reduceActualStock transaction completed successfully`);

    // Revalidate admin pages to show updated stock
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');

    return { success: true };
  } catch (error) {
    console.error("❌ Error reducing actual stock:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reduce stock" 
    };
  }
}

/**
 * Get inventory items that are running low on stock
 */
export async function getLowStockItems(): Promise<LowStockItem[]> {
  try {
    const lowStockItems = await prisma.productInventory.findMany({
      where: {
        OR: [
          // Items where available stock (quantity - reserved) is at or below threshold
          {
            quantity: {
              lte: prisma.productInventory.fields.lowStock
            }
          },
          // Items where available stock considering reservations is low
          {
            AND: [
              { quantity: { gt: 0 } },
              // This is a simplified check - in practice you might want to use raw SQL for more complex comparisons
            ]
          }
        ]
      },
      select: {
        id: true,
        sku: true,
        quantity: true,
        reservedStock: true,
        lowStock: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { quantity: 'asc' },
        { product: { name: 'asc' } }
      ]
    });

    // Calculate available stock and filter items that are actually low
    return lowStockItems
      .map(item => ({
        ...item,
        availableStock: item.quantity - (item.reservedStock || 0)
      }))
      .filter(item => item.availableStock <= item.lowStock);

  } catch (error) {
    console.error("Error getting low stock items:", error);
    return [];
  }
}

/**
 * Get stock levels for a specific inventory item (for real-time UI updates)
 */
export async function getInventoryStockLevels(inventoryId: string) {
  try {
    const inventory = await prisma.productInventory.findUnique({
      where: { id: inventoryId },
      select: {
        id: true,
        sku: true,
        quantity: true,
        reservedStock: true,
        lowStock: true,
        product: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!inventory) {
      return { success: false, error: "Inventory not found" };
    }

    const availableStock = inventory.quantity - (inventory.reservedStock || 0);

    return {
      success: true,
      data: {
        ...inventory,
        availableStock,
        isLowStock: availableStock <= inventory.lowStock,
        isOutOfStock: availableStock <= 0
      }
    };
  } catch (error) {
    console.error("Error getting inventory stock levels:", error);
    return { success: false, error: "Failed to get stock levels" };
  }
}

/**
 * Batch check stock for multiple inventory items (useful for cart validation)
 */
export async function batchCheckStock(
  items: Array<{ inventoryId: string; quantity: number }>
): Promise<Array<StockCheckResult & { inventoryId: string }>> {
  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const result = await checkStockAvailability(item.inventoryId, item.quantity);
        return {
          ...result,
          inventoryId: item.inventoryId
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Error in batch stock check:", error);
    return items.map(item => ({
      inventoryId: item.inventoryId,
      success: false,
      error: "Failed to check stock",
      availableStock: 0,
      canFulfill: false,
      requestedQuantity: item.quantity
    }));
  }
}

/**
 * Update low stock threshold for an inventory item
 */
export async function updateLowStockThreshold(
  inventoryId: string,
  threshold: number
): Promise<StockOperationResult> {
  try {
    if (threshold < 0) {
      return { success: false, error: "Threshold must be a positive number" };
    }

    await prisma.productInventory.update({
      where: { id: inventoryId },
      data: { lowStock: threshold }
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');

    return { success: true };
  } catch (error) {
    console.error("Error updating low stock threshold:", error);
    return { success: false, error: "Failed to update threshold" };
  }
}

/**
 * Clean up expired reserved stock (should be run periodically)
 * Releases stock from abandoned carts older than specified hours
 */
export async function cleanupExpiredReservations(hoursOld: number = 2): Promise<StockOperationResult> {
  try {
    console.log(`🧹 Starting cleanup of reservations older than ${hoursOld} hours`);
    
    // Find carts that haven't been updated in the specified time
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          lt: cutoffTime
        },
        processed: false // Only clean up unprocessed carts
      },
      include: {
        items: {
          select: {
            inventoryId: true,
            quantity: true,
            inventory: {
              select: { sku: true }
            }
          }
        }
      }
    });

    if (abandonedCarts.length === 0) {
      console.log(`✅ No abandoned carts found older than ${hoursOld} hours`);
      return { success: true };
    }

    console.log(`🔄 Found ${abandonedCarts.length} abandoned carts to clean up`);

    let totalItemsReleased = 0;
    let totalCartsProcessed = 0;

    // Process each abandoned cart
    for (const cart of abandonedCarts) {
      try {
        console.log(`🧹 Processing abandoned cart: ${cart.id} (${cart.items.length} items)`);
        
        // Release stock for each item in the cart
        for (const item of cart.items) {
          const releaseResult = await releaseReservedStock(item.inventoryId, item.quantity);
          
          if (releaseResult.success) {
            console.log(`✅ Released ${item.quantity} reserved stock for ${item.inventory.sku}`);
            totalItemsReleased += item.quantity;
          } else {
            console.warn(`⚠️ Failed to release stock for ${item.inventory.sku}:`, releaseResult.error);
          }
        }

        // Mark the cart as processed to avoid future cleanup attempts
        await prisma.cart.update({
          where: { id: cart.id },
          data: { processed: true }
        });

        totalCartsProcessed++;
        
      } catch (error) {
        console.error(`❌ Error processing abandoned cart ${cart.id}:`, error);
      }
    }

    console.log(`✅ Cleanup completed: ${totalCartsProcessed} carts processed, ${totalItemsReleased} items released`);
    
    // Revalidate admin pages to show updated stock
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');

    return { 
      success: true,
      reservedQuantity: totalItemsReleased // Using this field to return total released
    };
    
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cleanup expired reservations" 
    };
  }
} 