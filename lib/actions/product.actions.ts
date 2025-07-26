"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ProductFormValues, ExtendedProductFormValues, ClientProduct } from "../types/product.types";
import { db } from "@/lib/db";
import { z } from "zod";

// import { dbToJSObject } from "@/lib/utils";

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
            compareAtPrice: true,
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
        attributeValues: {
          include: {
            attribute: true
          }
        }
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Convert Decimal values to numbers and transform attribute values
    const sanitizedProduct = {
      ...product,
      inventories: product.inventories.map(inventory => ({
        ...inventory,
        costPrice: Number(inventory.costPrice),
        retailPrice: Number(inventory.retailPrice),
        compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null
      })),
      attributeValues: product.attributeValues.reduce((acc, pav) => {
        acc[pav.attributeId] = pav.value;
        return acc;
      }, {} as Record<string, string>)
    };

    return { success: true, data: sanitizedProduct };
  } catch (error) {
    console.error("Error getting product:", error);
    return { success: false, error: "Failed to get product" };
  }
}

// Get product by slug (for frontend product pages)
export async function getProductBySlug(slug: string): Promise<ClientProduct | null> {
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
        productType: {
          include: {
            attributes: {
              where: {
                isForProduct: true
              }
            }
          }
        },
        attributeValues: {
          include: {
            attribute: true
          }
        },
        inventories: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        },
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


    // Get the default inventory or first available
    const defaultInventory = productData.inventories.find(inv => inv.isDefault) || productData.inventories[0];
    
    // Transform the product data to match ClientProduct type
    const transformedProduct: ClientProduct = {
      id: productData.id,
      name: productData.name,
      description: productData.description,
      price: defaultInventory ? Number(defaultInventory.retailPrice) : 0,
      categoryId: productData.categoryId,
      inventory: defaultInventory?.quantity || 0,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt,
      compareAtPrice: defaultInventory?.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null,
      discountPercentage: defaultInventory?.discountPercentage || null,
      hasDiscount: Boolean(defaultInventory?.discountPercentage),
      isActive: productData.isActive,
      isFeatured: Boolean(productData.isFeatured),
      metadata: productData.metadata as Record<string, unknown> | null,
      sku: defaultInventory?.sku || "",
      slug: productData.slug,
      category: {
        id: productData.category.id,
        name: productData.category.name,
        slug: productData.category.slug,
        description: productData.category.description || undefined,
        imageUrl: productData.category.imageUrl || undefined,
        parentId: productData.category.parentId || undefined,
      },
      productAttributes: productData.attributeValues?.map(pv => ({
        id: pv.id,
        displayName: pv.attribute.displayName,
        value: pv.value,
        attribute: {
          id: pv.attribute.id,
          name: pv.attribute.name,
          displayName: pv.attribute.displayName,
          type: pv.attribute.type,
          options: pv.attribute.options,
        },
      })) || [],
      images: defaultInventory?.images.map((url, index) => ({
        id: `${defaultInventory.id}-image-${index}`,
        url: url.startsWith("http") ? url : `/uploads/${url}`,
        alt: `${productData.name} - Image ${index + 1}`,
        position: index,
      })) || [],
      mainImage: defaultInventory?.images[0] || undefined,
      rating: productData.rating ?? 0,
      numReviews: productData.numReviews ?? 0,
      inventories: productData.inventories.map(inv => ({
        id: inv.id,
        retailPrice: Number(inv.retailPrice),
        costPrice: Number(inv.costPrice),
        compareAtPrice: inv.compareAtPrice ? Number(inv.compareAtPrice) : null,
        discountPercentage: inv.discountPercentage,
        hasDiscount: Boolean(inv.discountPercentage),
        images: inv.images,
        quantity: inv.quantity,
        reservedStock: inv.reservedStock || 0,
        sku: inv.sku,
        attributes: inv.attributes as Record<string, string> || {},
      })),
      // reviews: productData.reviews.map(review => ({
      //   rating: review.rating,
      // })),
    };

    return transformedProduct;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Get featured products for the homepage
export async function getFeaturedProducts(limit = 8) {
  try {
    const productsData = await db.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
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
        mainImage: defaultInventory.images?.[0] || "/images/placeholder.svg",
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
      where: {
        isActive: true,
      },
      include: {
        products: {
          where: {
            isActive: true,
            inventories: {
              some: {
                quantity: {
                  gt: 0
                }
              }
            }
          },
          include: {
            inventories: {
              select: {
                images: true
              }
            }
          }
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const processedCategories = categories.map(category => {
      const firstInventoryImage = category.products.find(p => 
        p.inventories.some(i => i.images.length > 0)
      )?.inventories.find(i => i.images.length > 0)?.images[0] || null;

      // console.log(`Category: ${category.name}`, {
      //   productCount: category.products.length,
      //   firstInventoryImage,
      //   categoryImageUrl: category.imageUrl,
      //   productsWithImages: category.products.map(p => ({
      //     name: p.name,
      //     inventoryImages: p.inventories.map(i => i.images)
      //   }))
      // });

      return {
        ...category,
        productCount: category.products.length,
        firstInventoryImage
      };
    });

    return processedCategories;
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
        metadata: data.metadata || {},
        isFeatured: data.isFeatured || false,
        productTypeId: data.productTypeId || null
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

// Separate product and inventory attributes
interface AttributeValue {
    value: string | number | boolean;
    attributeId: string;
}

// Add this to your createProduct function
export async function createProductWithAttributes(data: ExtendedProductFormValues) {
    try {
        const {
            name,
            description,
            slug,
            categoryId,
            productTypeId,
            price,
            costPrice,
            compareAtPrice,
            hasDiscount,
            discountPercentage,
            sku,
            stock,
            imageUrl,
            images,
            isFeatured,
            attributeValues,
            productAttributeValues,
            inventoryAttributeValues,
            useVariants,
            variants,
        } = data;

        // Prepare product data
        const productData = {
            name,
            description,
            slug,
            categoryId,
            isActive: true,
            isFeatured: isFeatured || false, // Set isFeatured flag
            metadata: {
                ...data.metadata,
                featured: isFeatured || false // Keep metadata.featured in sync
            },
        };

        // Prepare inventory data
        let inventoryData;
        
        if (useVariants && variants && variants.length > 0) {
            // Create multiple inventory items from variants
            inventoryData = variants.map((variant, index) => ({
                sku: variant.sku || generateSku(),
                retailPrice: variant.price || 0,
                costPrice: variant.costPrice || 0,
                compareAtPrice: variant.compareAtPrice || null,
                hasDiscount: hasDiscount || false,
                discountPercentage: discountPercentage || null,
                quantity: variant.stock || 0,
                images: variant.images && variant.images.length > 0 
                        ? variant.images 
                        : (Array.isArray(images) && images.length > 0 
                           ? images 
                           : (imageUrl ? [imageUrl] : [])),
                attributes: variant.attributeCombination || {},
                isDefault: variant.isDefault || index === 0
            }));
        } else {
            // Create single inventory item (legacy mode)
            inventoryData = [{
                sku: sku || generateSku(),
                retailPrice: price || 0,
                costPrice: costPrice || 0,
                compareAtPrice: compareAtPrice || null,
                hasDiscount: hasDiscount || false,
                discountPercentage: discountPercentage || null,
                quantity: stock || 0,
                images: Array.isArray(images) && images.length > 0 
                       ? images 
                       : (imageUrl ? [imageUrl] : []),
                attributes: Object.keys(inventoryAttributeValues || {}).length > 0 ? inventoryAttributeValues : undefined,
                isDefault: true
            }];
        }

        // Create product with inventory
        const product = await db.product.create({
            data: {
                ...productData,
                productTypeId: productTypeId || null,
                inventories: {
                    create: inventoryData
                }
            }
        });

        // Create product-level attribute values if provided
        if (productAttributeValues && Object.keys(productAttributeValues).length > 0) {
            const attributeEntries = Object.entries(productAttributeValues).map(([attributeId, value]) => ({
                productId: product.id,
                attributeId,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
            }));

            if (attributeEntries.length > 0) {
                await db.productAttributeValue.createMany({
                    data: attributeEntries
                });
            }
        }

        console.log(`Product created with ${inventoryData.length} inventory items`);
        return { success: true, data: product };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Failed to create product" };
    }
}

// Helper function to generate a unique SKU
function generateSku() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `P${timestamp}${random}`;
}

// Add this function alongside your existing updateProduct function
export async function updateProductWithAttributes(data: ExtendedProductFormValues & { id: string }) {
    try {
        const session = await auth();
        
        if (!session || session.user?.role !== "ADMIN") {
            return { success: false, error: "Not authorized" };
        }
        
        // Extract the legacy product data
        const { productTypeId, isFeatured, attributeValues, ...legacyData } = data;
        
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
        
        // Get existing metadata
        const existingMetadata = existingProduct.metadata || {};
        
        // Update product with new fields
        const updatedProduct = await db.product.update({
            where: { id: data.id },
            data: {
                ...legacyData,
                productTypeId: productTypeId || null,
                isFeatured: isFeatured || false,
                // Update metadata to include featured for backward compatibility
                metadata: {
                    ...(typeof existingMetadata === 'object' ? existingMetadata : {}),
                    ...(legacyData.metadata || {}),
                    featured: isFeatured || false
                }
            }
        });
        
        // Update attribute values if provided
        if (attributeValues && Object.keys(attributeValues).length > 0) {
            // Delete existing attribute values
            await db.productAttributeValue.deleteMany({
                where: { productId: data.id }
            });
            
            // Create new attribute values
            const attributeEntries = Object.entries(attributeValues).map(([attributeId, value]) => ({
                productId: data.id,
                attributeId,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
            }));
            
            if (attributeEntries.length > 0) {
                await db.productAttributeValue.createMany({
                    data: attributeEntries
                });
            }
        }
        
        revalidatePath(`/admin/products`);
        revalidatePath(`/admin/products/${data.id}`);
        return { success: true, data: updatedProduct };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function getAttributeNamesByIds(attributeIds: string[]) {
  try {
    const attributes = await db.productTypeAttribute.findMany({
      where: {
        id: {
          in: attributeIds
        }
      },
      select: {
        id: true,
        displayName: true
      }
    });

    return attributes.reduce((acc, attr) => {
      acc[attr.id] = attr.displayName;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error fetching attribute names:", error);
    return {};
  }
}

// Get random products for recommendations (excluding current product)
export async function getRandomProducts(excludeProductId?: string, limit: number = 4) {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        ...(excludeProductId && { id: { not: excludeProductId } })
      },
      include: {
        category: {
          select: { 
            id: true,
            name: true,
            slug: true
          }
        },
        inventories: {
          where: { isDefault: true },
          select: {
            id: true,
            retailPrice: true,
            quantity: true,
            sku: true,
            images: true,
            hasDiscount: true,
            discountPercentage: true,
            compareAtPrice: true,
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Shuffle array and take the requested number
    const shuffled = products.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    // Transform the data to match ProductCardProduct interface
    return selected.map(product => {
      const defaultInventory = product.inventories[0]; // Get the default inventory
      const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        mainImage: defaultInventory?.images?.[0] || "/images/placeholder.svg",
        images: defaultInventory?.images?.map(url => ({ url })) || [],
        price: defaultInventory ? Number(defaultInventory.retailPrice) : 0,
        compareAtPrice: defaultInventory?.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null,
        hasDiscount: defaultInventory?.hasDiscount || false,
        discountPercentage: defaultInventory?.discountPercentage || null,
        category: {
          name: product.category.name,
          slug: product.category.slug
        },
        rating: averageRating,
        numReviews: product.reviews.length,
        quantity: defaultInventory?.quantity || 0,
        sku: defaultInventory?.sku || null
      };
    });
  } catch (error) {
    console.error("Error fetching random products:", error);
    return [];
  }
}