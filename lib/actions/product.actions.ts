'use server';
import { Prisma, PrismaClient } from '@prisma/client';
import { prismaToJSObject } from '@/lib/utils';
// import { prisma } from "@/lib/prisma";
// import { Product } from "@/types"; // Commented out as it's not used

// Import types only when used
// import type { Product as PrismaProduct } from "@prisma/client" // Commented out as it's not used

const prismaClient = new PrismaClient();

// Add JsonValue type
type JsonValue = Prisma.JsonValue;

// Updated types
type SortOrder = 'asc' | 'desc';
type SortField = 'retailPrice' | 'createdAt' | 'name';

interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  featured?: boolean;
  attributes?: Record<string, unknown>;
}

interface ProductSorting {
  field?: SortField;
  order?: SortOrder;
}

//fet latestProducts


export async function getLatestNeProducts() {
  const data = await prismaClient.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
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
          attributes: true,
          quantity: true,
          sku: true,
        },
      },
      category: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  const transformedProducts = data.map(product => {
    const defaultInventory = product.inventories[0];
    
    // Calculate the proper discounted price if needed
    let displayPrice = defaultInventory.retailPrice;
    let originalPrice = defaultInventory.compareAtPrice || null;
    
    // When there's a discount and a compareAtPrice, recalculate the display price
    if (defaultInventory.hasDiscount && 
        defaultInventory.discountPercentage && 
        defaultInventory.compareAtPrice) {
      // Calculate the proper discounted price
      displayPrice = defaultInventory.compareAtPrice.mul(
        1 - defaultInventory.discountPercentage / 100
      );
      
      // Make sure we use compareAtPrice as the original price
      originalPrice = defaultInventory.compareAtPrice;
    }

    return {
      ...product,
      price: displayPrice,
      compareAtPrice: originalPrice,
      discountPercentage: defaultInventory.discountPercentage || null,
      hasDiscount: defaultInventory.hasDiscount || false,
      mainImage: defaultInventory.images[0] || '/placeholder.svg',
      images: defaultInventory.images || [],
    };
  });

  return prismaToJSObject(transformedProducts);
}


// Get all products with pagination, filtering, and sorting
export async function getAllProducts(
  page = 1,
  limit = 12,
  filters: ProductFilters = {},
  sorting: ProductSorting = { field: 'createdAt', order: 'desc' }
) {
  try {
    console.log('getAllProducts called with:', { page, limit, filters, sorting });

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};

    // Build filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.featured) {
      where.metadata = {
        path: ['featured'],
        equals: true
      };
    }

    // Price filtering now works with inventory
    if (filters.minPrice || filters.maxPrice) {
      where.inventories = {
        some: {
          AND: [
            filters.minPrice ? { retailPrice: { gte: filters.minPrice } } : {},
            filters.maxPrice ? { retailPrice: { lte: filters.maxPrice } } : {},
          ],
        },
      };
    }

    // For retail price sorting, we'll modify the query to include ordering
    const baseQuery = {
      skip,
      take: limit,
      where,
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
            attributes: true,
            quantity: true,
            sku: true,
          },
          ...(sorting.field === 'retailPrice' ? { orderBy: { retailPrice: sorting.order } } : {}),
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      orderBy: sorting.field === 'retailPrice'
        ? undefined
        : { [sorting.field || 'createdAt']: sorting.order || 'desc' },
    };

    const [products, total] = await Promise.all([
      prismaClient.product.findMany(baseQuery),
      prismaClient.product.count({ where }),
    ]);

    // Transform products with inventory and rating data
    const transformedProducts = products.map(product => {
      const defaultInventory = product.inventories[0];
      return {
        ...product,
        price: defaultInventory?.retailPrice || 0,
        compareAtPrice: defaultInventory?.compareAtPrice,
        discountPercentage: defaultInventory?.discountPercentage,
        hasDiscount: defaultInventory?.hasDiscount,
        inStock: (defaultInventory?.quantity || 0) > 0,
        mainImage: defaultInventory?.images[0] || '/placeholder.svg',
        averageRating: product.reviews.length > 0
          ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
          : null,
        reviewCount: product.reviews.length,
        attributes: defaultInventory?.attributes || {},
      };
    });

    return prismaToJSObject({
      products: transformedProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
    });

  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw new Error('Failed to fetch products');
  }
}

// Get featured products
export async function getFeaturedProducts(limit = 6) {
  try {
    const products = await prismaClient.product.findMany({
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
            attributes: true,
            quantity: true,
            sku: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prismaToJSObject(transformProducts(products));
  } finally {
    await prismaClient.$disconnect();
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string, page = 1, limit = 12) {
  try {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prismaClient.product.findMany({
        where: {
          categoryId,
          isActive: true,
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
              attributes: true,
              quantity: true,
              sku: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prismaClient.product.count({
        where: {
          categoryId,
          isActive: true,
        },
      }),
    ]);

    return prismaToJSObject({
      products: transformProducts(products),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } finally {
    await prismaClient.$disconnect();
  }
}

// Helper function to transform products
type TransformableProduct = {
  id: string;
  name: string;
  slug: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  inventories: Array<{
    retailPrice: Prisma.Decimal;
    compareAtPrice: Prisma.Decimal | null;
    discountPercentage: number | null;
    hasDiscount: boolean;
    images: string[];
    attributes: JsonValue;
    quantity: number;
    sku: string;
  }>;
  reviews: Array<{
    rating: number;
  }>;
};

function transformProducts(products: TransformableProduct[]) {
  return products.map(product => {
    const defaultInventory = product.inventories[0];
    
    // Calculate the proper discounted price if needed
    let displayPrice = defaultInventory?.retailPrice || 0;
    let originalPrice = defaultInventory?.compareAtPrice || null;
    
    // When there's a discount and a compareAtPrice, recalculate the display price
    if (defaultInventory?.hasDiscount && 
        defaultInventory?.discountPercentage && 
        defaultInventory?.compareAtPrice) {
      // Calculate the proper discounted price
      displayPrice = defaultInventory.compareAtPrice.mul(
        1 - defaultInventory.discountPercentage / 100
      );
      
      // Make sure we use compareAtPrice as the original price
      originalPrice = defaultInventory.compareAtPrice;
    }
    
    return {
      id: product.id,
      name: product.name,
      price: Number(displayPrice) || 0,
      compareAtPrice: originalPrice ? Number(originalPrice) : null,
      discountPercentage: defaultInventory?.discountPercentage || null,
      hasDiscount: defaultInventory?.hasDiscount || false,
      slug: product.slug,
      mainImage: defaultInventory?.images[0] || '/placeholder.svg',
      images: (defaultInventory?.images || []).map((url: string) => ({ url })),
      inventorySku: defaultInventory?.sku || null,
      sku: defaultInventory?.sku || null,
      category: product.category ? {
        name: product.category.name,
        slug: product.category.slug,
      } : {
        name: 'Uncategorized',
        slug: 'uncategorized'
      },
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / product.reviews.length
        : null,
      reviewCount: product.reviews.length,
      quantity: defaultInventory?.quantity || 0,
      inventories: product.inventories || []
    };
  });
}

// Get all categories (unchanged)
export async function getAllCategories() {
  try {
    const categories = await prismaClient.category.findMany({
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
        name: 'asc',
      },
    });

    return prismaToJSObject(categories.map(category => ({
      ...category,
      productCount: category.products.length,
    })));
  } finally {
    await prismaClient.$disconnect();
  }
}

// Get latest products
// export async function getLatestProducts(limit = 8) {
//   try {
//     const products = await prismaClient.product.findMany({
//       where: {
//         isActive: true,
//       },
//       include: {
//         category: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//         inventories: {
//           where: {
//             isDefault: true,
//           },
//           select: {
//             retailPrice: true,
//             compareAtPrice: true,
//             discountPercentage: true,
//             hasDiscount: true,
//             images: true,
//             attributes: true,
//             quantity: true,
//           },
//         },
//         reviews: {
//           select: {
//             id: true,
//             rating: true,
//           },
//         },
//       },
//       take: limit,
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     return prismaToJSObject(transformProducts(products));
//   } finally {
//     await prismaClient.$disconnect();
//   }
// }

export async function getProductBySlug(slug: string) {
  try {
    if (!slug) throw new Error('Slug is required');

    const rawProduct = await prismaClient.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: true,
        inventories: true, // Don't try to include images as a relation
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!rawProduct) return null;

    // Transform the raw product into a structured Product type
    const product = transformProduct(rawProduct);

    // Log price calculations for debugging
    const inventory = rawProduct.inventories?.[0];
    if (inventory) {
      console.log(`getProductBySlug price calculation for ${rawProduct.name}:`, {
        hasDiscount: inventory.hasDiscount,
        discountPercentage: inventory.discountPercentage,
        originalCompareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null,
        originalRetailPrice: inventory.retailPrice ? Number(inventory.retailPrice) : null,
        calculatedPrice: Number(product.price),
        displayedOriginalPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null
      });
    }

    return product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw error;
  } finally {
    await prismaClient.$disconnect();
  }
}

// Transform a single product
function transformProduct(rawProduct: Record<string, unknown>) {
  // Safely access inventories as an array
  const inventories = (rawProduct.inventories || []) as Array<Record<string, unknown>>;
  
  // Get the default inventory (first one if available)
  const defaultInventory = inventories.length > 0 ? inventories[0] : {} as Record<string, unknown>;
  
  // Calculate the proper discounted price if needed
  let displayPrice = defaultInventory?.retailPrice || 0;
  let originalPrice = defaultInventory?.compareAtPrice || null;
  
  // When there's a discount and a compareAtPrice, recalculate the display price
  if (defaultInventory?.hasDiscount && 
      defaultInventory?.discountPercentage && 
      defaultInventory?.compareAtPrice) {
    // Calculate the proper discounted price
    displayPrice = (defaultInventory.compareAtPrice as Prisma.Decimal).mul(
      1 - (defaultInventory.discountPercentage as number) / 100
    );
    
    // Make sure we use compareAtPrice as the original price
    originalPrice = defaultInventory.compareAtPrice;
  }

  // Calculate average rating
  const reviews = rawProduct.reviews as Array<Record<string, unknown>> || [];
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc: number, review) => acc + (review.rating as number), 0) / reviews.length
    : null;

  // Get image URLs from the inventory - in different environments, the images field structure might vary
  const imageUrls = defaultInventory?.images as Array<string | Record<string, unknown>> || [];
  
  // Get the first image or use placeholder
  const firstImage = imageUrls.length > 0 ? imageUrls[0] : null;
  const mainImage = typeof firstImage === 'string' ? firstImage : 
                   (firstImage as Record<string, unknown>)?.url as string || 
                   "/images/placeholder.svg";
  
  // Transform the raw product into our Product type (converting Decimal to number to avoid serialization issues)
  return {
    id: rawProduct.id,
    name: rawProduct.name,
    description: rawProduct.description,
    price: Number(displayPrice),
    categoryId: rawProduct.categoryId,
    inventory: defaultInventory?.quantity || 0,
    createdAt: rawProduct.createdAt,
    updatedAt: rawProduct.updatedAt,
    compareAtPrice: originalPrice ? Number(originalPrice) : null,
    discountPercentage: defaultInventory?.discountPercentage || null,
    hasDiscount: defaultInventory?.hasDiscount || false,
    isActive: rawProduct.isActive,
    isFeatured: Boolean(rawProduct.metadata) || null,
    metadata: rawProduct.metadata as Record<string, unknown>,
    sku: defaultInventory?.sku || "",
    slug: rawProduct.slug,
    category: {
      ...(rawProduct.category as Record<string, unknown>),
      description: (rawProduct.category as Record<string, unknown>)?.description || undefined,
      imageUrl: (rawProduct.category as Record<string, unknown>)?.imageUrl || undefined,
      parentId: (rawProduct.category as Record<string, unknown>)?.parentId || undefined
    },
    images: (imageUrls).map((image, index: number) => {
      // Handle both string URLs and object structures
      const imageUrl = typeof image === 'string' ? image : ((image as Record<string, unknown>)?.url as string || '');
      return {
        id: `${rawProduct.id}-image-${index}`,
        url: imageUrl,
        alt: null,
        position: index
      };
    }),
    mainImage,
    averageRating,
    reviewCount: reviews.length || 0,
    inventories: inventories.map((inv) => ({
      retailPrice: Number(inv.retailPrice),
      discountPercentage: inv.discountPercentage,
      hasDiscount: inv.hasDiscount,
      images: (inv.images as Array<string | Record<string, unknown>> || []),
      sku: inv.sku,
      quantity: inv.quantity
    })),
    reviews
  };
}