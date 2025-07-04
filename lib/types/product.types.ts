import { z } from "zod";

// Base product schema
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters" }),
  categoryId: z.string({ required_error: "Please select a category" }),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export const extendedProductSchema = productSchema.extend({
  productTypeId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  attributeValues: z.record(z.string(), z.any()).optional(),
  productAttributeValues: z.record(z.string(), z.any()).optional(),
  inventoryAttributeValues: z.record(z.string(), z.any()).optional(),
  price: z.coerce.number().min(0.01),
  costPrice: z.coerce.number().min(0.01),
  compareAtPrice: z.coerce.number().optional().nullable(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  hasDiscount: z.boolean().default(false),
  sku: z.string().min(3),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  // Variant support
  useVariants: z.boolean().default(false),
  variants: z.array(z.object({
    id: z.string(),
    sku: z.string(),
    price: z.number(),
    costPrice: z.number(),
    compareAtPrice: z.number().optional(),
    stock: z.number(),
    attributeCombination: z.record(z.string()),
    extraCost: z.number().default(0),
    images: z.array(z.string()).default([]),
    isDefault: z.boolean().default(false)
  })).optional(),
  basePrice: z.coerce.number().min(0).default(0),
  baseCostPrice: z.coerce.number().min(0).default(0),
  baseStock: z.coerce.number().int().min(0).default(0),
});

//export type ProductFormValues = z.infer<typeof productSchema>;
export type ExtendedProductFormValues = z.infer<typeof extendedProductSchema>;

// Product inventory schema
export const productInventorySchema = z.object({
  id: z.string().optional(),
  productId: z.string({ required_error: "Product ID is required" }),
  sku: z.string().min(3, { message: "SKU must be at least 3 characters" }),
  costPrice: z.coerce.number().min(0, { message: "Cost price cannot be negative" }),
  retailPrice: z.coerce.number().min(0, { message: "Retail price cannot be negative" }),
  compareAtPrice: z.coerce.number().min(0, { message: "Compare at price cannot be negative" }).optional().nullable(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  hasDiscount: z.boolean().default(false),
  quantity: z.coerce.number().int().min(0, { message: "Quantity cannot be negative" }).default(0),
  lowStock: z.coerce.number().int().min(0).default(5),
  images: z.array(z.string()).default([]),
  attributes: z.record(z.any()).optional(),
  isDefault: z.boolean().default(true),
});

// Product with inventory
export const productWithInventorySchema = productSchema.extend({
  inventory: productInventorySchema,
});

// Types derived from schemas
export interface ProductFormValues {
  name: string;
  description: string;
  slug: string;
  categoryId: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  isFeatured?: boolean;
  productTypeId?: string | null;
}

export type ProductInventoryFormValues = z.infer<typeof productInventorySchema>;
export type ProductWithInventoryFormValues = z.infer<typeof productWithInventorySchema>;

// Types for the UI
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  // averageRating: number | null;
  // reviewCount: number;
  numReviews: number;
  rating: number;
  category: {
    name: string;
  } | null;
  inventories: {
    retailPrice: number;
    quantity: number;
  }[];
}

export interface ProductDetail extends ProductFormValues {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
  };
  inventories: {
    id: string;
    retailPrice: number;
    costPrice: number;
    compareAtPrice: number | null;
    quantity: number;
    sku: string;
    images: string[];
    hasDiscount: boolean;
    discountPercentage: number | null;
  }[];
  reviews: {
    rating: number;
  }[];
}

// Types for API responses
export interface ProductApiResponse {
  success: boolean;
  data?: ProductDetail | ProductListItem[];
  error?: string;
}

export interface InventoryApiResponse {
  success: boolean;
  data?: ProductInventoryFormValues;
  error?: string;
}

export interface ClientProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    inventory: number;
    createdAt: Date;
    updatedAt: Date;
    rating: number;
    compareAtPrice: number | null;
    discountPercentage: number | null;
    hasDiscount: boolean;
    isActive: boolean;
    isFeatured: boolean | null;
    metadata?: Record<string, unknown> | null;
    sku: string;
    slug: string;
    category: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        imageUrl?: string;
        parentId?: string;
    };
    productAttributes?: {
        id: string;
        displayName: string;
        value: string;
        attribute: {
            id: string;
            name: string;
            displayName: string;
            type: string;
            options?: any;
        };
    }[];
    images: {
        id: string;
        url: string;
        alt: string | null;
        position: number;
    }[];
    mainImage?: string;
    averageRating?: number | null;
    // reviewCount?: number;
    numReviews: number;
    inventories: {
        id: string;
        retailPrice: number;
        costPrice: number;
        compareAtPrice: number | null;
        discountPercentage: number | null;
        hasDiscount: boolean;
        images: string[];
        quantity: number;
        reservedStock?: number;
        sku: string;
        attributes?: Record<string, string> | null;
    }[];
    // reviews: {
    //     rating: number;
    // }[];
} 