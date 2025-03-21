import { z } from 'zod';
import {
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema,
    checkInventorySchema,
    cartItemSchema,
    insertCartSchema,
    insertProductSchema,
    shippingAddressSchema,
    insertOrderItemSchema,
    insertOrderSchema,
    paymentResultSchema,
    insertReviewSchema
} from '@/lib/validators';
import { Decimal } from "@prisma/client/runtime/library";

// export interface Product {
//     id: string;
//     name: string;
//     description: string;
//     price: Decimal;
//     categoryId: string;
//     inventory: number;
//     createdAt: Date;
//     updatedAt: Date;
//     compareAtPrice: Decimal | null;
//     discountPercentage: number | null;
//     hasDiscount: boolean;
//     isActive: boolean;
//     isFeatured: boolean;
//     metadata: any | null;
//     sku: string;
//     slug: string;
//     category: {
//         id: string;
//         name: string;
//         slug: string;
//     };
//     images: {
//         id: string;
//         url: string;
//         alt: string | null;
//         position: number;
//     }[];
//     mainImage?: string;
//     averageRating?: number | null;
//     reviewCount?: number;
// }



export interface Product {
    id: string;
    name: string;
    description: string;
    price: Decimal;
    categoryId: string;
    inventory: number;
    createdAt: Date;
    updatedAt: Date;
    compareAtPrice: Decimal | null;
    discountPercentage: number | null;
    hasDiscount: boolean;
    isActive: boolean;
    isFeatured: boolean | null;
    metadata?: any | null;
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
    images: {
        id: string;
        url: string;
        alt: string | null;
        position: number;
    }[];
    mainImage?: string;
    averageRating?: number | null;
    reviewCount?: number;
    inventories: {
        retailPrice: Decimal;
        // compareAtPrice: Decimal | null;
        discountPercentage: number | null;
        hasDiscount: boolean;
        images: string[];
        quantity: number;
        sku: string;
    }[];
    reviews: {
        rating: number;
    }[];
}

export interface ProductCardProduct {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    discountPercentage: number | null;
    hasDiscount: boolean;
    slug: string;
    mainImage: string;
    images: { url: string }[];
    category: {
        name: string;
        slug: string;
    };
    averageRating: number | null;
    reviewCount: number;
    inventorySku?: string | null;
    sku?: string | null;
    quantity?: number;
}

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type OrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = z.infer<typeof insertOrderSchema> & {
    id: string;
    createdAt: Date;
    isPaid: Boolean;
    paidAt: Date | null;
    isDelivered: Boolean;
    deliveredAt: Date | null;
    orderItems: OrderItem[];
    user: { name: string; email: string };
    paymentResult: PaymentResult;
};
export type PaymentResult = z.infer<typeof paymentResultSchema>;

export type Review = z.infer<typeof insertReviewSchema> & {
    id: string;
    createdAt: Date;
    user?: { name: string };
};

// New cart action types
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;
export type CheckInventoryInput = z.infer<typeof checkInventorySchema>;

// CartItemDetails interface for the internal representation in the app
export interface CartItemDetails {
    id: string;
    productId: string;
    inventoryId: string;
    name: string;
    slug: string;
    quantity: number;
    price: number;
    image: string;
    discountPercentage: number | null;
    hasDiscount: boolean;
    maxQuantity: number; // Available inventory
}