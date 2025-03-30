"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "../types/product.types";

// import { prismaToJSObject } from "@/lib/utils";

// Get all products with basic info
export async function getProducts() {
  try {
    const productsData = await db.product.findMany({
      include: {
        category: {
          select: { 
            id: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true,
            parentId: true
          }
        },
        inventories: {
          where: { isDefault: true },
          select: {
            id: true,
            retailPrice: true,
            costPrice: true,
            quantity: true,
            sku: true,
            images: true,
            hasDiscount: true,
            discountPercentage: true,
            compareAtPrice: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Transform the data to convert Decimal to number
    const products = productsData.map(product => ({
      ...product,
      inventories: product.inventories.map(inventory => ({
        id: inventory.id,
        retailPrice: Number(inventory.retailPrice),
        costPrice: Number(inventory.costPrice),
        compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null,
        quantity: inventory.quantity,
        sku: inventory.sku,
        images: inventory.images,
        hasDiscount: inventory.hasDiscount,
        discountPercentage: inventory.discountPercentage
      }))
    }));
    
    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

// Get product by ID with full details
export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Convert Decimal values to numbers
    const sanitizedProduct = {
      ...product,
      inventories: product.inventories.map(inventory => ({
        ...inventory,
        costPrice: Number(inventory.costPrice),
        retailPrice: Number(inventory.retailPrice),
        compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null
      }))
    };

    return { success: true, data: sanitizedProduct };
  } catch (error) {
    console.error("Error getting product:", error);
    return { success: false, error: "Failed to get product" };
  }
}

// Get product by slug (for frontend product pages)
export async function getProductBySlug(slug: string) {
  try {
    if (!slug) {
      return null;
    }

    const productData = await db.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: true,
        inventories: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    
    if (!productData) {
      return null;
    }
    
    // Transform decimal values to numbers
    const product = {
      ...productData,
      inventories: productData.inventories.map(inventory => ({
        ...inventory,
        retailPrice: Number(inventory.retailPrice),
        costPrice: Number(inventory.costPrice),
        compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null
      }))
    };
    
    // Calculate derived values for the frontend
    const defaultInventory = product.inventories[0] || {};
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : null;
    
    // Add computed properties
    const enhancedProduct = {
      ...product,
      price: Number(defaultInventory.retailPrice) || 0,
      compareAtPrice: defaultInventory.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null,
      hasDiscount: defaultInventory.hasDiscount || false,
      discountPercentage: defaultInventory.discountPercentage || null,
      inventory: defaultInventory.quantity || 0,
      mainImage: defaultInventory.images?.[0] || "/placeholder.svg",
      images: defaultInventory.images || [],
      averageRating,
      reviewCount: product.reviews.length,
    };
    
    return enhancedProduct;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

// Get featured products for the homepage
export async function getFeaturedProducts(limit = 8) {
  try {
    const productsData = await db.product.findMany({
      where: {
        isActive: true,
        metadata: {
          path: ['featured'],
          equals: true
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inventories: {
          where: {
            isDefault: true,
          },
          select: {
            retailPrice: true,
            compareAtPrice: true,
            discountPercentage: true,
            hasDiscount: true,
            images: true,
            quantity: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Transform for frontend
    const products = productsData.map(product => {
      const defaultInventory = product.inventories[0] || {};
      
      // Calculate discount price if needed
      const displayPrice = Number(defaultInventory.retailPrice) || 0;
      const originalPrice = defaultInventory.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null;
      
      const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
        : null;
        
      return {
        id: product.id,
        name: product.name,
        price: displayPrice,
        compareAtPrice: originalPrice,
        discountPercentage: defaultInventory.discountPercentage || null,
        hasDiscount: defaultInventory.hasDiscount || false,
        slug: product.slug,
        mainImage: defaultInventory.images?.[0] || "/placeholder.svg",
        images: defaultInventory.images || [],
        category: product.category ? {
          name: product.category.name,
          slug: product.category.slug,
        } : {
          name: 'Uncategorized',
          slug: 'uncategorized'
        },
        averageRating,
        reviewCount: product.reviews.length,
        quantity: defaultInventory.quantity || 0,
      };
    });
    
    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Get all categories with product counts
export async function getAllCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories.map(category => ({
      ...category,
      productCount: category.products.length,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Create new product
export async function createProduct(data: ProductFormValues) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Check if slug is unique
    const existingSlug = await db.product.findFirst({
      where: { slug: data.slug }
    });
    
    if (existingSlug) {
      return { success: false, error: "A product with this slug already exists" };
    }
    
    // Create product
    const product = await db.product.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        categoryId: data.categoryId,
        isActive: data.isActive,
        metadata: data.metadata || {}
      }
    });
    
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

// Update product
export async function updateProduct(data: ProductFormValues & { id: string }) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: data.id }
    });
    
    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }
    
    // Check if new slug is already in use by another product
    if (data.slug !== existingProduct.slug) {
      const slugExists = await db.product.findFirst({
        where: {
          slug: data.slug,
          id: { not: data.id }
        }
      });
      
      if (slugExists) {
        return { success: false, error: "Another product is already using this slug" };
      }
    }
    
    // Update product
    const updatedProduct = await db.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        categoryId: data.categoryId,
        isActive: data.isActive,
        metadata: data.metadata || {}
      }
    });
    
    revalidatePath("/admin/products");
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

// Delete product
export async function deleteProduct(id: string) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }
    
    // Check if product exists
    const product = await db.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    
    // Delete product (will cascade delete inventories)
    await db.product.delete({
      where: { id }
    });
    
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}