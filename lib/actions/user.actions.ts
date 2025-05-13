'use server';

import { auth, signIn } from '@/auth';
import { updateUserSchema, changePasswordSchema, signInFormSchema, signUpFormSchema } from '@/lib/validators';
// import { shippingAddressSchema , paymentMethodSchema } from '@/lib/validators';
// import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/prisma';
import { formatError } from '@/lib/utils';
import { compareSync, hashSync } from 'bcrypt-ts-edge';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
// import { getCart } from './cart.actions';
import { Role, Prisma, User } from "@prisma/client";
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { db } from "@/lib/db"
// import type { ShippingAddress } from '@/types';
// import { updateUserProfileSchema } from '@/lib/validators';

// import { z } from 'zod';
// import { PAGE_SIZE } from '@/lib/constants';
// import { revalidatePath } from 'next/cache';
// import { Prisma } from '@prisma/client';
//import { getMyCart } from './cart.actions';

// Define interface for serialized user with orders
interface SerializedUser extends Omit<User, 'orders'> {
    totalSpent: number;
    orders: Array<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        subtotal: string;
        tax: string;
        shipping: string;
        total: string;
        items: Array<{
            id: string;
            price: string;
            quantity: number;
            product: {
                id: string;
                name: string;
            };
            inventory?: {
                id: string;
                sku: string;
            };
        }>;
    }>;
    _count: {
        orders: number;
    };
}

interface InventoryWithAttributes {
    id: string;
    sku: string;
    retailPrice: number;
    compareAtPrice: number | null;
    hasDiscount: boolean;
    discountPercentage: number | null;
    images: string[];
    attributeValues: Array<{
        value: string;
        attribute: {
            id: string;
            name: string;
            displayName: string;
        };
    }>;
}

export async function signInWithCredentials(prevState: unknown, formData: FormData) {
    try {
        const user = signInFormSchema.parse({
            email: formData.get('email'),
            password: formData.get('password'),
        });

        // Get the callbackUrl from form data
        const callbackUrl = formData.get('callbackUrl')?.toString() || '/';

        // Pass the callbackUrl to signIn function
        await signIn('credentials', {
            ...user,
            redirectTo: callbackUrl
        });

        revalidatePath('/');
        return { success: true, message: 'Signed in successfully' };
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        return { success: false, message: 'Invalid email or password' };
    }
}


export async function signUp(prevState: unknown, formData: FormData) {
    try {
        const user = signUpFormSchema.parse({
            name: formData.get('name'),
            email: formData.get('email'),
            confirmPassword: formData.get('confirmPassword'),
            password: formData.get('password'),
        });

        const plainPassword = user.password;

        // user.password = hashSync(user.password, 10);
        user.password = hashSync(user.password, 10);
        await db.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
            },
        });

        await signIn('credentials', {
            email: user.email,
            password: plainPassword,
        });

        return { success: true, message: 'User created successfully' };
    } catch (error) {
        // console.log('Errors', error)
        // console.log('Error Name', error.name);
        // console.log('Error Code', error.code);
        // console.log('Error Errors', error.errors);
        // console.log('Error Meta ', error.meta?.target)
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            success: false,
            message: formatError(error),
        };
    }
}

// Get user by id
interface GetUserByIdResponse {
    success: boolean;
    data?: SerializedUser;
    error?: string;
}

export async function getUserById(id: string): Promise<GetUserByIdResponse> {
    try {
        const user = await db.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        orders: true,
                    },
                },
                orders: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                inventory: {
                                    select: {
                                        id: true,
                                        sku: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return {
                success: false,
                error: "User not found",
            };
        }

        // Convert Decimal objects to numbers and calculate total spent
        const serializedUser = {
            ...user,
            totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0),
            orders: user.orders.map(order => ({
                ...order,
                subtotal: order.subtotal.toString(),
                tax: order.tax.toString(),
                shipping: order.shipping.toString(),
                total: order.total.toString(),
                items: order.items.map(item => ({
                    ...item,
                    price: item.price.toString(),
                })),
            })),
        };

        return {
            success: true,
            data: serializedUser,
        };
    } catch (error) {
        console.error("Error fetching user:", error);
        return {
            success: false,
            error: "Failed to fetch user",
        };
    }
}

//get user address
export async function getUserAddress() {
    const session = await auth();
    const currentUser = session?.user.id;
    const address = await db.address.findFirst({
        where: {
            userId: currentUser,
            isUserManaged: true,
        },
    });
    return address;
}

// Update user Address  
// export async function updateUserAddress(data: ShippingAddress) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: {
//                 id: session?.user?.id,
//             },
//         });
//         if (!currentUser) throw new Error('User not found');
//         const address = shippingAddressSchema.parse(data);
//         await prisma.user.update({
//             where: {
//                 id: currentUser.id,
//             },
//             data: {
//                 address: address,
//             },
//         });
//         return {
//             success: true,
//             message: 'Address updated successfully',
//         };
//     } catch (error) {
//         return {
//             success: false,
//             message: formatError(error),
//         };
//     }
// }

// Update user's payment method
// export async function updateUserPaymentMethod(
//     data: z.infer<typeof paymentMethodSchema>
// ) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: { id: session?.user?.id },
//         });
//         if (!currentUser) throw new Error('User not found');

//         const paymentMethod = paymentMethodSchema.parse(data);

//         await prisma.user.update({
//             where: { id: currentUser.id },
//             data: { paymentMethod: paymentMethod.type },
//         });

//         return {
//             success: true,
//             message: 'User updated successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }

// Update user profile
// export async function updateUserProfile(user: {
//     name: string;
//     email: string;
// }) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: { id: session?.user?.id },
//         });
//         if (!currentUser) throw new Error('User not found');
//         //const user = updateUserSchema.parse(data)
//         await prisma.user.update({
//             where: { id: currentUser.id },
//             data: {
//                 name: user.name,
//                 // email: user.email,
//             },
//         })
//         return {
//             success: true,
//             message: 'User updated successfully',
//         }

//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }

// Get All Users

interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
}

interface GetUsersResponse {
    success: boolean;
    data?: {
        users: SerializedUser[];
        total: number;
        totalPages: number;
        currentPage: number;
    };
    error?: string;
}

export async function getUsers({
    page = 1,
    limit = 10,
    role,
    search,
}: GetUsersParams): Promise<GetUsersResponse> {
    try {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.UserWhereInput = {
            ...(role && { role }),
            ...(search && {
                OR: [
                    { id: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ],
            }),
        };

        // Get total count
        const total = await db.user.count({ where });

        // Get users with related data
        const users = await db.user.findMany({
            where,
            include: {
                _count: {
                    select: {
                        orders: true,
                    },
                },
                orders: {
                    take: 5,
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        items: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        });

        // Transform decimal values and serialize orders
        const serializedUsers = users.map(user => ({
            ...user,
            totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0),
            orders: user.orders.map(order => ({
                ...order,
                subtotal: order.subtotal.toString(),
                tax: order.tax.toString(),
                shipping: order.shipping.toString(),
                total: order.total.toString(),
                items: order.items.map(item => ({
                    ...item,
                    price: item.price.toString(),
                })),
            })),
        })) as unknown as SerializedUser[];

        return {
            success: true,
            data: {
                users: serializedUsers,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        return {
            success: false,
            error: "Failed to fetch users",
        };
    }
}

interface UpdateUserRoleParams {
    id: string;
    role: Role;
}

interface UpdateUserRoleResponse {
    success: boolean;
    data?: User;
    error?: string;
}

export async function updateUserRole({
    id,
    role,
}: UpdateUserRoleParams): Promise<UpdateUserRoleResponse> {
    try {
        const user = await db.user.update({
            where: { id },
            data: { role },
            include: {
                _count: {
                    select: {
                        orders: true,
                    },
                },
                orders: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                inventory: {
                                    select: {
                                        id: true,
                                        sku: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Convert Decimal objects to numbers and calculate total spent
        const serializedUser = {
            ...user,
            totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0),
            orders: user.orders.map(order => ({
                ...order,
                total: Number(order.total),
                items: order.items.map(item => ({
                    ...item,
                    price: Number(item.price),
                })),
            })),
        };

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${id}`);

        return {
            success: true,
            data: serializedUser,
        };
    } catch (error) {
        console.error("Error updating user role:", error);
        return {
            success: false,
            error: "Failed to update user role",
        };
    }
}

interface DeleteUserResponse {
    success: boolean;
    error?: string;
}

export async function deleteUser(id: string): Promise<DeleteUserResponse> {
    try {
        await db.user.delete({
            where: { id },
        });

        revalidatePath("/admin/users");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting user:", error);
        return {
            success: false,
            error: "Failed to delete user",
        };
    }
}

// export async function updateUser(user: z.infer<typeof updateUserProfileSchema>) {
//     try {
//         await prisma.user.update({
//             where: { id: user.id },
//             data: {
//                 name: user.name,
//                 role: user.role,
//             },
//         });

//         revalidatePath('/admin/users');

//         return {
//             success: true,
//             message: 'User updated successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }




// export async function revalidatePlaceOrder() {
//     revalidatePath("/place-order");
// }


export async function getUserProfile() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
            },
        });

        return user;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// export async function updateProfile(data: z.infer<typeof updateUserSchema>) {
//     try {
//         const session = await auth();
//         if (!session?.user?.id) {
//             return { success: false, message: 'Not authenticated' };
//         }

//         const validatedData = updateUserSchema.parse(data);

//         await prisma.user.update({
//             where: { id: session.user.id },
//             data: {
//                 name: validatedData.name,
//                 // Only update email if it's different and implement email verification
//                 // email: validatedData.email, 
//             },
//         });

//         revalidatePath('/user/account');
//         revalidatePath('/user/account/acct-details');

//         return { success: true, message: 'Profile updated successfully' };
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return { success: false, message: 'Invalid data provided' };
//         }
//         console.error('Error updating profile:', error);
//         return { success: false, message: 'Failed to update profile' };
//     }
// }



export async function updateProfile(data: z.infer<typeof updateUserSchema>) {
    // console.log(data)
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }
        const currentUser = await db.user.findUnique({
            where: { id: session?.user?.id },
            // select: {
            //     name: true,
            //     email: true,
            // },
        });
        if (!currentUser) {
            return { success: false, message: 'User not found' };
        }

        //console.log('data', data)
        const validatedData = updateUserSchema.parse(data);
        // console.log('validatedData', validatedData)

        await db.user.update({
            where: { id: currentUser.id },
            data: {
                name: validatedData.name,
                // Only update email if it's different and implement email verification
                // email: validatedData.email, 
            },
        });

        revalidatePath('/user/account');
        revalidatePath('/user/account/acct-details');

        return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided' };
        }
        console.error('Error updating profile:', error);
        return { success: false, message: 'Failed to update profile' };
    }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }

        const validatedData = changePasswordSchema.parse(data);

        // Get current user with password
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        });

        if (!user?.password) {
            return { success: false, message: 'Cannot change password for OAuth accounts' };
        }

        // Verify current password
        const isPasswordValid = compareSync(validatedData.currentPassword, user.password);
        if (!isPasswordValid) {
            return { success: false, message: 'Current password is incorrect' };
        }

        // Hash new password and update
        const hashedPassword = hashSync(validatedData?.newPassword || '', 10);
        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        // Sign out all sessions for security
        //await signOut({ redirect: false });
        revalidatePath('/user/account');
        revalidatePath('/user/account/acct-details');

        return { success: true, message: 'Password changed successfully. Please sign in again.' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided' };
        }
        console.error('Error changing password:', error);
        return { success: false, message: 'Failed to change password' };
    }
}

// Get all user addresses (only user-managed ones)
export async function getUserAddresses() {
    try {
        const session = await auth();

        if (!session?.user) {
            console.log("No user session found");
            return [];
        }

        const userId = session.user.id;

        // Only get addresses that were explicitly created in the address management UI
        // or have been specifically marked as user-managed
        const addresses = await db.address.findMany({
            where: {
                userId,
                isUserManaged: true // Only get addresses explicitly managed by the user
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log("Retrieved user-managed addresses:", addresses.length);

        return addresses;
    } catch (error) {
        console.error("Error fetching user addresses:", error);
        return [];
    }
}


export async function getUserOrders() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const orders = await db.order.findMany({
            where: {
                userId: session.user.id,
                payment: {
                    status: 'COMPLETED'
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Serialize each order individually with deep property conversion
        return orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => {
                // Format attributes from inventory attributeValues
                const attributes: Record<string, string> = {};

                // Get inventory reference first so we can use it throughout
                const inventory = item.inventory as unknown as InventoryWithAttributes;

                // First check if the order item has attributes directly
                if (item.attributes) {
                    console.log(`Item ${item.id} has direct attributes:`, item.attributes);

                    // If attributes is a string (JSON), parse it
                    if (typeof item.attributes === 'string') {
                        try {
                            const parsedAttributes = JSON.parse(item.attributes);
                            console.log(`Parsed attributes for item ${item.id}:`, parsedAttributes);

                            // For each attribute in parsedAttributes, check if it's using internal names
                            // and attempt to convert to display names
                            Object.assign(attributes, parsedAttributes);
                        } catch (e) {
                            console.error(`Error parsing attributes for item ${item.id}:`, e);
                        }
                    } else {
                        // If it's already an object, use it directly
                        console.log(`Using direct attributes object for item ${item.id}:`, item.attributes);

                        // Convert internal attribute names to friendly names
                        // This is likely where our issue is - we need to rename keys to be display names
                        const attributesObject = item.attributes as Record<string, string>;

                        // IMPORTANT: Here we convert existing attributes to use pretty names
                        // Get attribute display names from inventory if available
                        if (inventory?.attributeValues) {
                            console.log(`Checking for better attribute names from inventory values`);

                            // Create a map of internal name -> display name
                            const attributeNameMap: Record<string, string> = {};
                            inventory.attributeValues.forEach(av => {
                                if (av.attribute) {
                                    attributeNameMap[av.attribute.name] = av.attribute.displayName || av.attribute.name;
                                    console.log(`Mapped attribute ${av.attribute.name} to ${av.attribute.displayName || av.attribute.name}`);
                                }
                            });

                            // Apply the map to transform attribute keys
                            Object.entries(attributesObject).forEach(([key, value]) => {
                                const displayKey = attributeNameMap[key] || key; // Use display name if available, otherwise keep original
                                attributes[displayKey] = value;
                                console.log(`Setting attribute [${displayKey}] = ${value}`);
                            });
                        } else {
                            // No inventory values to get display names from, just use as-is
                            Object.assign(attributes, attributesObject);
                        }
                    }
                }

                // If no direct attributes, try to get them from inventory
                if (Object.keys(attributes).length === 0 && inventory?.attributeValues) {
                    console.log(`Item ${item.id} has ${inventory.attributeValues.length} attribute values`);

                    // Log all attribute values for debugging
                    console.log('Full attribute values for debugging:');
                    inventory.attributeValues.forEach((av, index) => {
                        console.log(`Attribute ${index + 1}:`, {
                            attributeId: av.attribute?.id,
                            attributeName: av.attribute?.name,
                            attributeDisplayName: av.attribute?.displayName,
                            value: av.value,
                            rawAttribute: av.attribute
                        });
                    });

                    inventory.attributeValues.forEach(av => {
                        console.log(`Processing attribute value for item ${item.id}: ${JSON.stringify(av.attribute)} = ${av.value}`);
                        if (av.attribute && av.value) {
                            // Use displayName instead of name for more user-friendly attribute keys
                            const keyToUse = av.attribute.displayName || av.attribute.name;
                            console.log(`Setting attribute [${keyToUse}] = ${av.value}`);
                            attributes[keyToUse] = av.value;
                        }
                    });
                }

                // Debug: Log final attributes for each item
                console.log(`Item ${item.id} final attributes:`, attributes);

                return {
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price.toString(),
                    name: item.name,
                    image: item.image,
                    attributes,
                    product: item.product,
                    inventory: {
                        id: inventory.id,
                        sku: inventory.sku,
                        retailPrice: inventory.retailPrice.toString(),
                        compareAtPrice: inventory.compareAtPrice?.toString() || null,
                        hasDiscount: inventory.hasDiscount,
                        discountPercentage: inventory.discountPercentage,
                        images: inventory.images,
                    },
                };
            }),
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}
export async function getLascoUserOrders() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const orders = await db.order.findMany({
            where: {
                userId: session.user.id,
                payment: {
                    provider: 'LascoPay'
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Serialize each order individually with deep property conversion
        return orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => {
                // Format attributes from inventory attributeValues
                const attributes: Record<string, string> = {};

                // Get inventory reference first so we can use it throughout
                const inventory = item.inventory as unknown as InventoryWithAttributes;

                // First check if the order item has attributes directly
                if (item.attributes) {
                    console.log(`Item ${item.id} has direct attributes:`, item.attributes);

                    // If attributes is a string (JSON), parse it
                    if (typeof item.attributes === 'string') {
                        try {
                            const parsedAttributes = JSON.parse(item.attributes);
                            console.log(`Parsed attributes for item ${item.id}:`, parsedAttributes);

                            // For each attribute in parsedAttributes, check if it's using internal names
                            // and attempt to convert to display names
                            Object.assign(attributes, parsedAttributes);
                        } catch (e) {
                            console.error(`Error parsing attributes for item ${item.id}:`, e);
                        }
                    } else {
                        // If it's already an object, use it directly
                        console.log(`Using direct attributes object for item ${item.id}:`, item.attributes);

                        // Convert internal attribute names to friendly names
                        // This is likely where our issue is - we need to rename keys to be display names
                        const attributesObject = item.attributes as Record<string, string>;

                        // IMPORTANT: Here we convert existing attributes to use pretty names
                        // Get attribute display names from inventory if available
                        if (inventory?.attributeValues) {
                            console.log(`Checking for better attribute names from inventory values`);

                            // Create a map of internal name -> display name
                            const attributeNameMap: Record<string, string> = {};
                            inventory.attributeValues.forEach(av => {
                                if (av.attribute) {
                                    attributeNameMap[av.attribute.name] = av.attribute.displayName || av.attribute.name;
                                    console.log(`Mapped attribute ${av.attribute.name} to ${av.attribute.displayName || av.attribute.name}`);
                                }
                            });

                            // Apply the map to transform attribute keys
                            Object.entries(attributesObject).forEach(([key, value]) => {
                                const displayKey = attributeNameMap[key] || key; // Use display name if available, otherwise keep original
                                attributes[displayKey] = value;
                                console.log(`Setting attribute [${displayKey}] = ${value}`);
                            });
                        } else {
                            // No inventory values to get display names from, just use as-is
                            Object.assign(attributes, attributesObject);
                        }
                    }
                }

                // If no direct attributes, try to get them from inventory
                if (Object.keys(attributes).length === 0 && inventory?.attributeValues) {
                    console.log(`Item ${item.id} has ${inventory.attributeValues.length} attribute values`);

                    // Log all attribute values for debugging
                    console.log('Full attribute values for debugging:');
                    inventory.attributeValues.forEach((av, index) => {
                        console.log(`Attribute ${index + 1}:`, {
                            attributeId: av.attribute?.id,
                            attributeName: av.attribute?.name,
                            attributeDisplayName: av.attribute?.displayName,
                            value: av.value,
                            rawAttribute: av.attribute
                        });
                    });

                    inventory.attributeValues.forEach(av => {
                        console.log(`Processing attribute value for item ${item.id}: ${JSON.stringify(av.attribute)} = ${av.value}`);
                        if (av.attribute && av.value) {
                            // Use displayName instead of name for more user-friendly attribute keys
                            const keyToUse = av.attribute.displayName || av.attribute.name;
                            console.log(`Setting attribute [${keyToUse}] = ${av.value}`);
                            attributes[keyToUse] = av.value;
                        }
                    });
                }

                // Debug: Log final attributes for each item
                console.log(`Item ${item.id} final attributes:`, attributes);

                return {
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price.toString(),
                    name: item.name,
                    image: item.image,
                    attributes,
                    product: item.product,
                    inventory: {
                        id: inventory.id,
                        sku: inventory.sku,
                        retailPrice: inventory.retailPrice.toString(),
                        compareAtPrice: inventory.compareAtPrice?.toString() || null,
                        hasDiscount: inventory.hasDiscount,
                        discountPercentage: inventory.discountPercentage,
                        images: inventory.images,
                    },
                };
            }),
            // Handle payment serialization
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

export async function getOrderById(orderId: string) {
    try {
        console.log('===== GET ORDER BY ID CALLED =====');
        console.log('Order ID:', orderId);
        const session = await auth();
        if (!session?.user?.id) {
            console.log('User not authenticated');
            return { success: false, message: 'Not authenticated', data: null };
        }

        console.log('Authenticated user:', session.user.id);

        // First get the order with all required data
        const order = await db.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id // Ensure order belongs to current user
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                                productTypeId: true, // Include product type ID to fetch attributes
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                                attributeValues: {
                                    include: {
                                        attribute: true
                                    }
                                }
                            }
                        }
                    }
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
                address: {
                    select: {
                        id: true,
                        street: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        country: true,
                    }
                },
            },
        });

        if (!order) {
            return { success: false, message: 'Order not found', data: null };
        }

        // Get all unique product type IDs from items
        const productTypeIds = [...new Set(
            order.items
                .map(item => item.product.productTypeId)
                .filter(Boolean)
        )] as string[];

        console.log('Found product type IDs:', productTypeIds);

        // Fetch all attribute display names for these product types to create a mapping
        let attributeDisplayNames: Record<string, string> = {};

        if (productTypeIds.length > 0) {
            const productTypeAttributes = await db.productTypeAttribute.findMany({
                where: {
                    productTypeId: {
                        in: productTypeIds
                    }
                },
                select: {
                    id: true,
                    name: true,
                    displayName: true
                }
            });

            console.log('Found product type attributes:', productTypeAttributes.length);

            // Create ID -> displayName mapping
            attributeDisplayNames = productTypeAttributes.reduce((acc, attr) => {
                acc[attr.id] = attr.displayName;
                return acc;
            }, {} as Record<string, string>);

            console.log('Attribute display name mapping:', attributeDisplayNames);
        }

        // Make the response serializable with carefully controlled properties
        const serializedOrder = {
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => {
                // Format attributes from inventory attributeValues
                const attributes: Record<string, string> = {};

                // Get inventory reference first so we can use it throughout
                const inventory = item.inventory as unknown as InventoryWithAttributes;

                // First check if the order item has attributes directly
                if (item.attributes) {
                    console.log(`Item ${item.id} has direct attributes:`, item.attributes);

                    // If attributes is a string (JSON), parse it
                    if (typeof item.attributes === 'string') {
                        try {
                            const parsedAttributes = JSON.parse(item.attributes);
                            console.log(`Parsed attributes for item ${item.id}:`, parsedAttributes);

                            // Convert ID keys to display names
                            Object.entries(parsedAttributes).forEach(([key, value]) => {
                                const displayName = attributeDisplayNames[key] || key;
                                attributes[displayName] = value as string;
                                console.log(`Mapped attribute ID ${key} to ${displayName} = ${value}`);
                            });
                        } catch (e) {
                            console.error(`Error parsing attributes for item ${item.id}:`, e);
                        }
                    } else {
                        // If it's already an object, use it directly
                        console.log(`Using direct attributes object for item ${item.id}:`, item.attributes);

                        // Convert internal attribute names to friendly names
                        const attributesObject = item.attributes as Record<string, string>;

                        // Map attribute IDs to display names
                        Object.entries(attributesObject).forEach(([key, value]) => {
                            const displayName = attributeDisplayNames[key] || key;
                            attributes[displayName] = value;
                            console.log(`Mapped attribute ID ${key} to ${displayName} = ${value}`);
                        });
                    }
                }

                // If no direct attributes, try to get them from inventory
                if (Object.keys(attributes).length === 0 && inventory?.attributeValues) {
                    console.log(`Item ${item.id} has ${inventory.attributeValues.length} attribute values`);

                    // Log all attribute values for debugging
                    console.log('Full attribute values for debugging:');
                    inventory.attributeValues.forEach((av, index) => {
                        console.log(`Attribute ${index + 1}:`, {
                            attributeId: av.attribute?.id,
                            attributeName: av.attribute?.name,
                            attributeDisplayName: av.attribute?.displayName,
                            value: av.value,
                            rawAttribute: av.attribute
                        });
                    });

                    inventory.attributeValues.forEach(av => {
                        console.log(`Processing attribute value for item ${item.id}: ${JSON.stringify(av.attribute)} = ${av.value}`);
                        if (av.attribute && av.value) {
                            // Use displayName instead of name for more user-friendly attribute keys
                            const keyToUse = av.attribute.displayName || av.attribute.name;
                            console.log(`Setting attribute [${keyToUse}] = ${av.value}`);
                            attributes[keyToUse] = av.value;
                        }
                    });
                }

                // Debug: Log final attributes for each item
                console.log(`Item ${item.id} final attributes:`, attributes);

                return {
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price.toString(),
                    name: item.name,
                    image: item.image,
                    attributes,
                    product: item.product,
                    inventory: {
                        id: inventory.id,
                        sku: inventory.sku,
                        retailPrice: inventory.retailPrice.toString(),
                        compareAtPrice: inventory.compareAtPrice?.toString() || null,
                        hasDiscount: inventory.hasDiscount,
                        discountPercentage: inventory.discountPercentage,
                        images: inventory.images,
                    },
                };
            }),
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null,
            address: order.address ? {
                id: order.address.id,
                street: order.address.street,
                city: order.address.city,
                state: order.address.state,
                postalCode: order.address.postalCode,
                country: order.address.country,
            } : null,
        };

        // At the very end, before the return statement
        console.log('===== FINAL ORDER DATA =====');
        console.log('Order items:', serializedOrder.items.map(item => ({
            id: item.id,
            name: item.name,
            attributes: item.attributes
        })));

        return { success: true, message: 'Order retrieved successfully', data: serializedOrder };
    } catch (error) {
        console.error('Error fetching order details:', error);
        return { success: false, message: 'Failed to retrieve order', data: null };
    }
}

export async function getOrderStatusActions(status: string, paymentStatus: string | null) {
    switch (status) {
        case 'PENDING':
            return {
                message: 'Your order has been received and is being processed.',
                action: 'Check back later for updates on your order.',
                cta: paymentStatus === 'PENDING' ? 'Complete Payment' : null,
                ctaLink: paymentStatus === 'PENDING' ? '/checkout/payment' : null,
            };
        case 'PROCESSING':
            return {
                message: 'Your order is being processed and prepared for shipment.',
                action: 'We\'ll notify you once your order ships.',
                cta: null,
                ctaLink: null,
            };
        case 'SHIPPED':
            return {
                message: 'Your order has been shipped!',
                action: 'Track your package to see when it will arrive.',
                cta: 'Track Order',
                ctaLink: '/tracking',
            };
        case 'DELIVERED':
            return {
                message: 'Your order has been delivered.',
                action: 'If you\'re satisfied with your purchase, please consider leaving a review.',
                cta: 'Leave a Review',
                ctaLink: '/reviews/new',
            };
        case 'CANCELLED':
            return {
                message: 'Your order has been cancelled.',
                action: 'If you have any questions, please contact customer support.',
                cta: 'Contact Support',
                ctaLink: '/support',
            };
        default:
            return {
                message: 'Order status updated.',
                action: 'Check back for more updates.',
                cta: null,
                ctaLink: null,
            };
    }
}

export async function createOrUpdateUserAddress(addressData: {
    fullName?: string;
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
    isUserManaged?: boolean; // Add optional parameter to control if address is user-managed
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            console.error("User not authenticated");
            return { success: false, message: "You must be logged in to save an address" };
        }

        const userId = session.user.id;

        console.log("Creating/updating address for user:", userId, "with data:", addressData);

        // Check if user already has an address with same data to avoid duplicates
        const existingAddresses = await db.address.findMany({
            where: {
                userId,
                street: addressData.street,
                city: addressData.city,
                country: addressData.country
            },
        });

        let address;

        // Default to false for checkout-created addresses
        const isUserManaged = addressData.isUserManaged ?? false;

        if (existingAddresses.length > 0) {
            // Update the first matching address
            address = await db.address.update({
                where: { id: existingAddresses[0].id },
                data: {
                    street: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    postalCode: addressData.postalCode || "",
                    country: addressData.country,
                    // Only update isUserManaged to true if explicitly requested,
                    // don't override existing user-managed addresses
                    ...(isUserManaged ? { isUserManaged: true } : {}),
                    updatedAt: new Date()
                }
            });
            console.log("Updated existing address:", address.id);
        } else {
            // Create a new address
            address = await db.address.create({
                data: {
                    userId,
                    street: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    postalCode: addressData.postalCode || "",
                    country: addressData.country,
                    isUserManaged// Set explicitly for new addresses
                }
            });
            console.log("Created new address:", address.id);
        }

        return {
            success: true,
            message: "Address saved successfully",
            data: address
        };
    } catch (error) {
        console.error("Error saving address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Function to get the first address for a user (or null if none exists)
export async function getUserPrimaryAddress() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            console.log("No user session found");
            return null;
        }

        const userId = session.user.id;

        const address = await db.address.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return address;
    } catch (error) {
        console.error("Error fetching user's primary address:", error);
        return null;
    }
}

// Add this new function to create a new address
export async function addUserAddress(addressData: {
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to add an address" };
        }

        const userId = session.user.id;

        const address = await db.address.create({
            data: {
                userId,
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode || "",
                country: addressData.country,
                isUserManaged: true // Mark as explicitly managed by the user
            }
        });

        return {
            success: true,
            message: "Address added successfully",
            data: address
        };
    } catch (error) {
        console.error("Error adding address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Update existing address
export async function updateUserAddress(addressId: string, addressData: {
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to update an address" };
        }

        // Check if address belongs to user
        const existingAddress = await db.address.findFirst({
            where: {
                id: addressId,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found or does not belong to you" };
        }

        const address = await db.address.update({
            where: { id: addressId },
            data: {
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode || "",
                country: addressData.country,
                isUserManaged: true, // Ensure it's marked as user-managed
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: "Address updated successfully",
            data: address
        };
    } catch (error) {
        console.error("Error updating address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Delete an address
export async function deleteUserAddress(addressId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to delete an address" };
        }

        const userId = session.user.id;

        // Verify the address belongs to the user
        const existingAddress = await db.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found" };
        }

        await db.address.delete({
            where: { id: addressId }
        });

        return {
            success: true,
            message: "Address deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Get user's wishlist items
export async function getUserWishlist() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return [];
        }

        const wishlistItems = await db.productWishlist.findMany({
            where: { userId: session.user.id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        inventories: {
                            where: { isDefault: true },
                            select: {
                                retailPrice: true,
                                compareAtPrice: true,
                                discountPercentage: true,
                                hasDiscount: true,
                                images: true,
                            },
                            take: 1,
                        },
                        category: {
                            select: {
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        return wishlistItems.map(item => ({
            id: item.id,
            productId: item.product.id,
            userId: item.userId,
            mainImage: item.product.inventories[0]?.images[0] || "/placeholder.svg",
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.inventories[0]?.retailPrice?.toString() || "0",
            compareAtPrice: item.product.inventories[0]?.compareAtPrice?.toString() || null,
            discountPercentage: item.product.inventories[0]?.discountPercentage || 0,
            hasDiscount: item.product.inventories[0]?.hasDiscount || false,
            category: item.product.category.name,
            originalPrice: item.product.inventories[0]?.compareAtPrice?.toString() || null,
            image: item.product.inventories[0]?.images[0] || "/placeholder.svg"
        }));
    } catch (error) {
        console.error("Error fetching user wishlist:", error);
        return [];
    }
}

// Add an item to the wishlist
export async function addToWishlist(productId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'You must be logged in to add items to your wishlist.' };
        }

        // Check if product exists
        const product = await db.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return { success: false, message: 'Product not found.' };
        }

        // Get or create wishlist
        let wishlist = await db.wishlist.findUnique({
            where: { userId: session.user.id }
        });

        if (!wishlist) {
            wishlist = await db.wishlist.create({
                data: {
                    userId: session.user.id
                }
            });
        }

        // Check if item is already in wishlist
        const existingItem = await db.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });

        if (existingItem) {
            return { success: true, message: 'Item is already in your wishlist.' };
        }

        // Add item to wishlist
        await db.wishlistItem.create({
            data: {
                id: crypto.randomUUID(),
                wishlistId: wishlist.id,
                productId: productId
            }
        });

        return { success: true, message: 'Item added to wishlist successfully.' };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return { success: false, message: formatError(error) };
    }
}

// Remove an item from the wishlist
export async function removeFromWishlist(wishlistItemId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'You must be logged in to remove items from your wishlist.' };
        }

        // Verify the item belongs to the user's wishlist
        const item = await db.wishlistItem.findUnique({
            where: { id: wishlistItemId },
            include: {
                Wishlist: true
            }
        });

        if (!item) {
            return { success: false, message: 'Wishlist item not found.' };
        }

        if (item.Wishlist.userId !== session.user.id) {
            return { success: false, message: 'You do not have permission to remove this item.' };
        }

        // Remove the item
        await db.wishlistItem.delete({
            where: { id: wishlistItemId }
        });

        return { success: true, message: 'Item removed from wishlist successfully.' };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return { success: false, message: formatError(error) };
    }
}

// Check if a product is in the user's wishlist
export async function isInWishlist(productId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return false;

        const wishlist = await db.wishlist.findUnique({
            where: { userId: session.user.id }
        });

        if (!wishlist) return false;

        const item = await db.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });

        return !!item;
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return false;
    }
}

// Add this new function to mark an address as user-managed
export async function markAddressAsUserManaged(addressId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to manage addresses" };
        }

        // Check if address belongs to user
        const existingAddress = await db.address.findFirst({
            where: {
                id: addressId,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found or does not belong to you" };
        }

        // Update address to mark as user-managed
        const address = await db.address.update({
            where: { id: addressId },
            data: {
                isUserManaged: true,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: "Address marked as user-managed successfully",
            data: address
        };
    } catch (error) {
        console.error("Error marking address as user-managed:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

