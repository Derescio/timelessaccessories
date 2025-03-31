import { z } from 'zod';

import { PAYMENT_METHODS } from '@/lib/constants'

/**
 * Validators Module
 * 
 * Known Changes:
 * 1. Schema Cleanup (2024-03-XX)
 *    - Removed unused shippingAddressSchema and paymentMethodSchema
 *    - These schemas were previously used for Zod validation in the shipping form
 *    - Removed as part of the form validation refactoring to use direct validation
 */

// Category schema for admin operations
export const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    description: z.string().optional(),
    imageUrl: z.string().optional().default('/placeholder.svg'),
    parentId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    defaultProductTypeId: z.string().optional().nullable(),
    slug: z.string().min(2, 'Slug must be at least 2 characters')
        .max(50, 'Slug must be at most 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, with hyphens for spaces')
        .transform(val => val.toLowerCase()),
});

// Category update schema
export const updateCategorySchema = categorySchema.extend({
    id: z.string().min(1, 'Category ID is required'),
});

//Schema for inserting products
//const currency = z.string().refine((value) => /^\d+(\.\d{2})?$/.test(formatNumber(Number(value))),
// 'Price must be a number and have 2 decimal places')
const currency = z.coerce.number().min(0, 'Price must be a positive number').multipleOf(0.01);


export const insertProductSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(255),
    slug: z.string().min(3, 'Slug must be at least 3 characters').max(255),
    category: z.string().min(3).max(255),
    brand: z.string().min(3).max(255),
    description: z.string().min(3).max(255),
    stock: z.coerce.number().min(0),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    isFeatured: z.boolean(),
    isDiscounted: z.boolean(),
    discountRate: z.coerce.number().min(0).max(100),
    banner: z.string().nullable(),
    price: z.coerce.number().min(0),
    sku: z.string().min(3, 'SKU must be at least 3 characters').max(255),
    costPrice: z.coerce.number().min(0),
});


//Update product schema
export const updateProductSchema = insertProductSchema.extend({
    id: z.string().min(1, 'Id is required'),
    // images: z.array(z.string()).min(1, 'At least one image is required'),
})


//Schema for signing up users
export const signInFormSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});


// SignUp/Register Schema
export const signUpFormSchema = z.object({
    name: z.string().min(6, 'Name must be at least 6 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password Error'),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match.",
        path: ['confirmPassword'],

    })

//The refine function is used to add custom validation to the schema. 
// In this case, we are checking if the password and confirmPassword fields match.
//It takes a function that returns a boolean value. 
// If the function returns false, the validation will fail.
// The path option is used to specify the field that failed the validation.
// In this case, the path is confirmPassword.
// If the validation fails, the error message will be displayed.
// The error message is displayed in the form of an object with a message property.
// If the password and confirmPassword fields match, the validation will pass and the program will continue.



//Schema for Cart
export const cartItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    qty: z.number().int().nonnegative('Quantity must be a positive number'),
    image: z.string().min(1, 'Image is required'),
    price: currency,
    isDiscounted: z.boolean(),
    discountRate: z.coerce.number().min(0).max(100),
});


export const insertCartSchema = z.object({
    items: z.array(cartItemSchema),
    itemsPrice: currency,
    totalPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    sessionCartId: z.string().min(1, 'Session cart id is required'),
    userId: z.string().optional().nullable(),
});

export const COURIERS = [
    { name: 'KGN', price: 800 },
    { name: 'KNE', price: 750 },
    { name: 'ZipM', price: 500 },
    { name: 'ZipM(Door to Door)', price: 850 },
] as const;

export const shippingAddressSchema = z.object({
    fullName: z.string().min(3, 'Name must be at least 3 characters'),
    streetAddress: z.string().min(3, 'Address must be at least 3 characters'),
    city: z.string().min(3, 'City must be at least 3 characters'),
    state: z.string().optional(),
    parish: z.string().min(3, 'Parish must be at least 3 characters').optional(),
    country: z.string().min(3, 'Country must be at least 3 characters').optional(),
    zipCode: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    courier: z.string().optional().default(""),
    shippingPrice: z.number().optional().default(0),
}).refine((data) => {
    // For LASCO market, require parish
    if (process.env.NEXT_PUBLIC_MARKET === 'LASCO') {
        return !!data.parish;
    }
    // For GLOBAL market, require country
    return !!data.country;
}, {
    message: "Please provide your parish (LASCO) or country (GLOBAL)",
    path: ["parish", "country"]
});



export const insertOrderSchema = z.object({
    userId: z.string().min(1, 'User is required'),
    itemsPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    totalPrice: currency,
    paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
        message: 'Invalid payment method',
    }),
    shippingAddress: shippingAddressSchema.refine(data => {
        // For LASCO market, require courier and shipping price
        if (process.env.NEXT_PUBLIC_MARKET === 'LASCO') {
            return data.courier && data.shippingPrice > 0;
        }
        // For GLOBAL market, shipping price is calculated automatically
        return true;
    }, {
        message: "Shipping method must be selected for LASCO market",
        path: ["courier"]
    }),
});


//Schema for payment methods
//Payment Schema
export const paymentMethodSchema = z
    .object({
        type: z.string().min(1, 'Payment method is required'),
    })
    .refine((data) => PAYMENT_METHODS.includes(data.type), {
        path: ['type'],
        message: 'Select payment method',
    });



export const insertOrderItemSchema = z.object({
    productId: z.string(),
    slug: z.string(),
    image: z.string(),
    name: z.string(),
    unitPrice: currency,
    qty: z.number(),
    totalPrice: currency,
});

//Schema for payment result
// export const paymentResultSchema = z.object({
//     id: z.string(),
//     status: z.string(),
//     intent: z.string().optional(),
//     create_time: z.string().optional(),
//     update_time: z.string().optional(),
//     payer: z.object({
//         email_address: z.string().optional(),
//         payer_id: z.string().optional(),
//         name: z.object({
//             given_name: z.string().optional(),
//             surname: z.string().optional()
//         }).optional()
//     }).optional(),
//     links: z.array(z.object({
//         href: z.string(),
//         rel: z.string(),
//         method: z.string()
//     })).optional(),
//     payment_source: z.object({}).passthrough().optional(),
//     purchase_units: z.array(z.object({}).passthrough()).optional()
// }).passthrough(); // Use passthrough to allow additional fields from PayPal

//Schema for payment result
export const paymentResultSchema = z.object({
    id: z.string(),
    status: z.string(),
    email_address: z.string(),
    pricePaid: z.string(),
});

//Schema for updating user profile
export const updateUserSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    // password: z.string().min(6, 'Password must be at least 6 characters'),
    // confirmPassword: z.string().min(6, 'Confirm password Error'),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional() ,
});

//Schema to update users
export const updateUserProfileSchema = updateUserSchema.extend({
    id: z.string().min(1, 'Id is required'),
    role: z.string().min(1, 'Role is required'),
})

// Review Schema
export const insertReviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    productId: z.string().min(1, 'Product is required'),
    userId: z.string().min(1, 'User is required'),
    rating: z.coerce
        .number()
        .int()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
});

// New schemas for Add to Cart functionality

// Schema for adding items to cart
export const addToCartSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    inventoryId: z.string().min(1, 'Inventory ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive number'),
    sessionId: z.string().optional(),
});

// Schema for updating cart item quantity
export const updateCartItemSchema = z.object({
    cartItemId: z.string().min(1, 'Cart item ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive number'),
});

// Schema for removing items from cart
export const removeFromCartSchema = z.object({
    cartItemId: z.string().min(1, 'Cart item ID is required'),
});

// Schema for checking inventory availability
export const checkInventorySchema = z.object({
    inventoryId: z.string().min(1, 'Inventory ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive number'),
});