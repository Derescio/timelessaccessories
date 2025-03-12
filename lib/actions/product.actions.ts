'use server';
import { Prisma, PrismaClient } from '@prisma/client';
import { prismaToJSObject } from '@/lib/utils';
import { prisma } from "@/lib/prisma";
import { Product } from "@/types";

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
    const discountedPrice = defaultInventory.hasDiscount && defaultInventory.discountPercentage
      ? new Prisma.Decimal(defaultInventory.retailPrice).mul(1 - defaultInventory.discountPercentage / 100)
      : defaultInventory.retailPrice;

    return {
      ...product,
      price: discountedPrice,
      compareAtPrice: defaultInventory.compareAtPrice || new Prisma.Decimal(0),
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
  }>;
  reviews: Array<{
    rating: number;
  }>;
};

function transformProducts(products: TransformableProduct[]) {
  return products.map(product => {
    const defaultInventory = product.inventories[0];
    return {
      id: product.id,
      name: product.name,
      price: Number(defaultInventory?.retailPrice) || 0,
      compareAtPrice: defaultInventory?.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null,
      discountPercentage: defaultInventory?.discountPercentage || null,
      hasDiscount: defaultInventory?.hasDiscount || false,
      slug: product.slug,
      mainImage: defaultInventory?.images[0] || '/placeholder.svg',
      images: (defaultInventory?.images || []).map((url: string) => ({ url })),
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
export async function getLatestProducts(limit = 8) {
  try {
    const products = await prismaClient.product.findMany({
      where: {
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const rawProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        inventories: true,
        reviews: true,
      },
    });

    if (!rawProduct) {
      return null;
    }

    // Calculate average rating
    const averageRating = rawProduct.reviews.length > 0
      ? rawProduct.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / rawProduct.reviews.length
      : null;

    // Transform the raw product into our Product type
    const transformedProduct: Product = {
      id: rawProduct.id,
      name: rawProduct.name,
      description: rawProduct.description,
      price: rawProduct.inventories[0]?.retailPrice || new Prisma.Decimal(0),
      categoryId: rawProduct.categoryId,
      inventory: rawProduct.inventories[0]?.quantity || 0,
      createdAt: rawProduct.createdAt,
      updatedAt: rawProduct.updatedAt,
      compareAtPrice: rawProduct.inventories[0]?.compareAtPrice || null,
      discountPercentage: rawProduct.inventories[0]?.discountPercentage || null,
      hasDiscount: rawProduct.inventories[0]?.hasDiscount || false,
      isActive: rawProduct.isActive,
      isFeatured: Boolean(rawProduct.metadata) || null,
      metadata: rawProduct.metadata as Record<string, unknown>,
      sku: rawProduct.inventories[0]?.sku || "",
      slug: rawProduct.slug,
      category: {
        ...rawProduct.category,
        description: rawProduct.category.description || undefined,
        imageUrl: rawProduct.category.imageUrl || undefined,
        parentId: rawProduct.category.parentId || undefined
      },
      images: (rawProduct.inventories[0]?.images || []).map((url: string, index: number) => ({
        id: `${rawProduct.id}-image-${index}`,
        url,
        alt: null,
        position: index
      })),
      mainImage: rawProduct.inventories[0]?.images[0] || "/images/placeholder.svg",
      averageRating,
      reviewCount: rawProduct.reviews.length,
      inventories: rawProduct.inventories.map((inv: {
        retailPrice: Prisma.Decimal;
        discountPercentage: number | null;
        hasDiscount: boolean;
        images: string[];
        sku: string;
        quantity: number;
      }) => ({
        retailPrice: inv.retailPrice,
        discountPercentage: inv.discountPercentage,
        hasDiscount: inv.hasDiscount,
        images: inv.images,
        sku: inv.sku,
        quantity: inv.quantity
      })),
      reviews: rawProduct.reviews
    };

    return prismaToJSObject(transformedProduct);
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}