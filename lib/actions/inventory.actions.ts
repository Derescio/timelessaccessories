"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ProductInventoryFormValues } from "@/lib/types/product.types";

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